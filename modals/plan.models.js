import mongoose from 'mongoose';

export const PlanSchema = new mongoose.Schema({
    name: {type: String, required: true,},
    features: [{type: String,}],
    price: {type: Number, required: true,},
    currency: {type: String, default: 'USD',},
    description: {type: String,},
    interval: {
        type: String,
        enum: ['week', 'month', 'year'],
        default: 'month',
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    stripePriceId: { type: String, required: true },
    stripeProductId: { type: String, required: true },
}, {timestamps: true});

const Plan = mongoose.model('Plan', PlanSchema);
export default Plan;
