import mongoose from "mongoose";
import "./plan.models.js";

const subscriptionSchema = new mongoose.Schema({
    plan: {type: mongoose.Schema.Types.ObjectId, ref: "Plan", required: true,},
    user: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true,},
    stripeSubscriptionId: { type: String, required: true, unique: true },
    stripeCustomerId: { type: String, required: true },

    status: {
        type: String,
        enum: [
            'trialing',
            'active',
            'past_due',
            'canceled',
            'unpaid',
            'incomplete',
            'incomplete_expired',
            'paused',
        ],
        default: 'incomplete',
    },
    startDate: {
        type: Date,
        required: true,
        default: Date.now,
    },
    currentPeriodStart: {
        type: Date,
        required: true,
        default: Date.now,
    },
    currentPeriodEnd: {type: Date, required: true,},
    cancelAtPeriodEnd: {type: Boolean, default: false,},
    canceledAt: {type: Date, default: null,},
    defaultPaymentMethod: { type: String, default: null },  // pm_xxx

}, { timestamps: true });

subscriptionSchema.index({ user: 1, plan: 1 });
subscriptionSchema.index({ status: 1, currentPeriodEnd: 1 });

const Subscription = mongoose.model("Subscription", subscriptionSchema);
export default Subscription;
