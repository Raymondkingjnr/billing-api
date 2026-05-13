import Stripe from "stripe";
import User from "../modals/users.models.js";
import Plan from '../modals/plan.models.js';
import Subscription from "../modals/subscription.models.js";
import Invoice from "../modals/invoice.models.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const toDate = (ts) => (ts && !isNaN(ts)) ? new Date(ts * 1000) : null;

// ✅ Resolves current_period dates from wherever Stripe puts them.
// Older API versions: top-level on the subscription object.
// Newer API versions: inside items.data[0] on the subscription object.
function resolvePeriod(stripeSub) {
    const item = stripeSub.items?.data?.[0];

    const start = stripeSub.current_period_start ?? item?.current_period_start;
    const end   = stripeSub.current_period_end   ?? item?.current_period_end;

    return {
        currentPeriodStart: toDate(start),
        currentPeriodEnd:   toDate(end),
    };
}

async function saveInvoice(inv, subDoc) {
    try {
        await Invoice.create({
            user: subDoc.user,
            subscription: subDoc._id,
            stripeInvoiceId: inv.id,
            stripePaymentIntentId: inv.payment_intent,
            amountPaid: inv.amount_paid,
            amountDue: inv.amount_due,
            currency: inv.currency,
            status: inv.status,
            invoiceUrl: inv.hosted_invoice_url,
            invoicePdf: inv.invoice_pdf,
            billingReason: inv.billing_reason,
            periodStart: toDate(inv.period_start),
            periodEnd: toDate(inv.period_end),
            paidAt: toDate(inv.status_transitions?.paid_at),
        });
        console.log('[Webhook] ✅ Invoice saved:', inv.id);
    } catch (err) {
        if (err.code === 11000) {
            console.warn('[Webhook] Duplicate invoice, skipping:', inv.id);
        } else {
            console.error('[Webhook] Invoice save error:', err.message);
        }
    }
}

export async function getCheckoutUrl(userId, planId) {
    const [user, plan] = await Promise.all([
        User.findById(userId),
        Plan.findById(planId),
    ]);

    if (!user) throw new Error('User not found');
    if (!plan || !plan.isActive) throw new Error('Plan not found or inactive');

    const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer_email: user.email,
        line_items: [{ price: plan.stripePriceId, quantity: 1 }],
        client_reference_id: `${userId}-${planId}`,
        success_url: `${process.env.CLIENT_URL}/dashboard?subscribed=true`,
        cancel_url: `${process.env.CLIENT_URL}/pricing?canceled=true`,
        subscription_data: {
            trial_period_days: plan.trialDays || undefined,
            metadata: { userId: userId.toString(), planId: planId.toString() },
        },
    });

    return session.url;
}

export async function cancelSubscription(userId, cancelImmediately = false) {
    const subscription = await Subscription.findOne({
        user: userId,
        status: { $in: ['active', 'trialing'] },
    });
    if (!subscription) throw new Error('No active subscription found');

    if (cancelImmediately) {
        await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
        subscription.status = 'canceled';
        subscription.canceledAt = new Date();
    } else {
        await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
            cancel_at_period_end: true,
        });
        subscription.cancelAtPeriodEnd = true;
    }

    await subscription.save();
    return subscription;
}

export async function handleWebhook(rawBody, signature) {
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            rawBody,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        throw new Error(`Webhook signature verification failed: ${err.message}`);
    }

    switch (event.type) {

        case 'checkout.session.completed': {
            const session = event.data.object;

            if (session.mode !== 'subscription') break;

            const ref = session.client_reference_id;
            if (!ref) { console.warn('[Webhook] Missing client_reference_id'); break; }

            const [userId, planId] = ref.split('-');
            if (!userId || !planId) {
                console.error('[Webhook] Could not parse userId/planId from ref:', ref);
                break;
            }

            try {
                const stripeSub = await stripe.subscriptions.retrieve(session.subscription);

                // ✅ Use resolvePeriod() — checks both top-level and items.data[0]
                const { currentPeriodStart, currentPeriodEnd } = resolvePeriod(stripeSub);
                const item = stripeSub.items?.data?.[0];

                console.log('[Webhook] Resolved dates:', {
                    currentPeriodStart,
                    currentPeriodEnd,
                    interval: item?.plan?.interval,
                    interval_count: item?.plan?.interval_count,
                });

                const existing = await Subscription.findOne({
                    stripeSubscriptionId: stripeSub.id,
                });
                if (existing) {
                    console.warn('[Webhook] Already exists, skipping:', stripeSub.id);
                    break;
                }

                await User.findByIdAndUpdate(userId, {
                    stripeCustomerId: stripeSub.customer,
                });

                const subDoc = await Subscription.create({
                    user: userId,
                    plan: planId,
                    stripeSubscriptionId: stripeSub.id,
                    stripeCustomerId: stripeSub.customer,
                    status: stripeSub.status,
                    currentPeriodStart,
                    currentPeriodEnd,
                    trialStart: toDate(stripeSub.trial_start),
                    trialEnd: toDate(stripeSub.trial_end),
                });

                console.log('[Webhook] ✅ Subscription created:', {
                    currentPeriodStart: subDoc.currentPeriodStart,
                    currentPeriodEnd: subDoc.currentPeriodEnd,
                });

                // Retrieve and save the invoice separately
                const invoiceId = typeof stripeSub.latest_invoice === 'string'
                    ? stripeSub.latest_invoice
                    : stripeSub.latest_invoice?.id;

                if (invoiceId) {
                    const inv = await stripe.invoices.retrieve(invoiceId);
                    if (inv.status === 'paid') await saveInvoice(inv, subDoc);
                }

            } catch (err) {
                console.error('[Webhook] checkout.session.completed error:', err.message);
                throw err;
            }

            break;
        }

        case 'customer.subscription.updated': {
            const s = event.data.object;
            const { currentPeriodStart, currentPeriodEnd } = resolvePeriod(s);

            await Subscription.findOneAndUpdate(
                { stripeSubscriptionId: s.id },
                {
                    status: s.status,
                    currentPeriodStart,
                    currentPeriodEnd,
                    cancelAtPeriodEnd: s.cancel_at_period_end,
                    trialStart: toDate(s.trial_start),
                    trialEnd: toDate(s.trial_end),
                }
            );
            break;
        }

        case 'customer.subscription.deleted': {
            const s = event.data.object;
            await Subscription.findOneAndUpdate(
                { stripeSubscriptionId: s.id },
                { status: 'canceled', canceledAt: new Date() }
            );
            break;
        }

        case 'invoice.paid': {
            const inv = event.data.object;
            const sub = await Subscription.findOne({
                stripeSubscriptionId: inv.subscription,
            });

            if (!sub) {
                console.warn('[Webhook] invoice.paid: subscription not in DB yet, checkout.session.completed will handle it');
                break;
            }

            await saveInvoice(inv, sub);
            break;
        }

        case 'invoice.payment_failed': {
            const inv = event.data.object;
            await Subscription.findOneAndUpdate(
                { stripeSubscriptionId: inv.subscription },
                { status: 'past_due' }
            );
            console.warn('[Webhook] Payment failed for subscription:', inv.subscription);
            break;
        }

        default:
            console.log(`[Stripe] Unhandled event: ${event.type}`);
    }

    return { received: true };
}