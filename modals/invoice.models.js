import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        subscription: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription' },

        // Stripe IDs
        stripeInvoiceId: { type: String, required: true, unique: true }, // in_xxx
        stripePaymentIntentId: { type: String },                          // pi_xxx

        amountPaid: { type: Number },       // in cents
        amountDue: { type: Number },
        currency: { type: String, default: 'usd' },

        status: {
            type: String,
            enum: ['draft', 'open', 'paid', 'uncollectible', 'void'],
        },

        invoiceUrl: { type: String },       // hosted Stripe invoice link
        invoicePdf: { type: String },       // PDF download link

        billingReason: {
            type: String,
            enum: [
                'subscription_create',
                'subscription_cycle',
                'subscription_update',
                'manual',
                'upcoming',
            ],
        },

        periodStart: { type: Date },
        periodEnd: { type: Date },
        paidAt: { type: Date },
    },
    { timestamps: true }
);

const Invoice = mongoose.model('Invoice', invoiceSchema);
export default Invoice
