import { getCheckoutUrl, cancelSubscription as cancelSub } from "../service/stripe.service.js";
import Subscription from "../modals/subscription.models.js";
import Invoice from "../modals/invoice.models.js";

// GET /api/v1/subscription/checkout/:planId
export const subscriptionCheckout = async (req, res) => {
    try {
        const url = await getCheckoutUrl(req.user._id, req.params.planId);
        res.json({ url });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// POST /api/v1/subscription/cancel
export const cancelSubscription = async (req, res) => {
    try {
        const cancelImmediately = req.body?.immediately === true;

        const sub = await cancelSub(
            req.user._id,
            cancelImmediately
        );
        return res.status(201).json({
            success: true,
            message: "subscription successfully cancelled",
            data: sub,
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// GET /api/v1/subscription/current-subscription
export const getUserCurrentSubscription = async (req, res) => {
    try {
        const sub = await Subscription.findOne({ user: req.user._id })
            .sort({ createdAt: -1 })
            .populate('plan');

        return res.status(201).json({
            success: true,
            message: "subscription successfully retrieved",
            data: sub,
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// GET /api/v1/subscription/billingHistory
export const billingHistory = async (req, res) => {
    try {
        const invoices = await Invoice.find({ user: req.user._id })
            .sort({ createdAt: -1 });

        // Format amounts for the response
        const formatted = invoices.map(inv => ({
            ...inv.toObject(),
            amountPaid: (inv.amountPaid / 100).toFixed(2),   // 2999 → "29.99"
            amountDue:  (inv.amountDue  / 100).toFixed(2),   // 2999 → "29.99"
        }));

        return res.status(201).json({
            success: true,
            message: "invoice successfully retrieved",
            data: formatted,
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
