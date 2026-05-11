import Subscription from "../modals/subscription.models.js";

export const requireRole = (...allowedRoles) => (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({success: false, message: "Unauthorized"});
    }

    if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({success: false, message: "Forbidden"});
    }

    next();
};

export const requirePlan = (...allowedPlans) => async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({success: false, message: "Unauthorized"});
        }

        const subscription = await Subscription.findOne({
            user: req.user._id,
            status: "active",
            currentPeriodEnd: {$gt: new Date()},
        }).populate("plan");

        if (!subscription || !subscription.plan) {
            return res.status(403).json({success: false, message: "Active subscription required"});
        }

        const planName = subscription.plan.name.toLowerCase();
        const normalizedAllowedPlans = allowedPlans.map((plan) => plan.toLowerCase());

        if (!normalizedAllowedPlans.includes(planName)) {
            return res.status(403).json({success: false, message: "Plan upgrade required"});
        }

        req.subscription = subscription;
        req.plan = subscription.plan;
        next();
    } catch (error) {
        next(error);
    }
};
