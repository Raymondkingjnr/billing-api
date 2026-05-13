import Plan from "../modals/plan.models.js";

const pickPlanFields = (body) => {
    const allowedFields = [
        "name",
        "features",
        "price",
        "currency",
        "description",
        "interval",
        "isActive",
         "stripePriceId",
    ];

    return allowedFields.reduce((fields, field) => {
        if (body[field] !== undefined) {
            fields[field] = body[field];
        }
        return fields;
    }, {});
};

export const createPlan = async (req, res, next) => {
    try {
        const planData = pickPlanFields(req.body);
        const plan = await Plan.create(planData);

        return res.status(201).json({
            success: true,
            message: "Plan created successfully",
            data: {plan},
        });
    } catch (error) {
        next(error);
    }
};

export const getPlans = async (req, res, next) => {
    try {
        const filter = req.query.includeInactive === "true" ? {} : {isActive: true};
        const plans = await Plan.find(filter).sort({createdAt: -1});

        return res.status(200).json({
            success: true,
            count: plans.length,
            data: {plans},
        });
    } catch (error) {
        next(error);
    }
};

export const getPlan = async (req, res, next) => {
    try {
        const plan = await Plan.findById(req.params.id);

        if (!plan) {
            return res.status(404).json({success: false, message: "Plan not found"});
        }

        return res.status(200).json({
            success: true,
            data: {plan},
        });
    } catch (error) {
        next(error);
    }
};

export const updatePlan = async (req, res, next) => {
    try {
        const planData = pickPlanFields(req.body);
        const plan = await Plan.findByIdAndUpdate(req.params.id, planData, {
            new: true,
            runValidators: true,
        });

        if (!plan) {
            return res.status(404).json({success: false, message: "Plan not found"});
        }

        return res.status(200).json({
            success: true,
            message: "Plan updated successfully",
            data: {plan},
        });
    } catch (error) {
        next(error);
    }
};

export const deletePlan = async (req, res, next) => {
    try {
        const plan = await Plan.findByIdAndUpdate(
            req.params.id,
            {isActive: false},
            {new: true, runValidators: true},
        );

        if (!plan) {
            return res.status(404).json({success: false, message: "Plan not found"});
        }

        return res.status(200).json({
            success: true,
            message: "Plan deleted successfully",
            data: {plan},
        });
    } catch (error) {
        next(error);
    }
};
