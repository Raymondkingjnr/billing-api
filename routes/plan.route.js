import {Router} from "express";
import {
    createPlan,
    deletePlan,
    getPlan,
    getPlans,
    updatePlan,
} from "../controllers/plan.contollers.js";
import authorise from "../middleware/auth.middleware.js";
import {requireRole} from "../middleware/rbac.middleware.js";

const planRouter = Router();

planRouter.get("/", getPlans);
planRouter.get("/:id", getPlan);
planRouter.post("/", authorise, requireRole("admin"), createPlan);
planRouter.patch("/:id", authorise, requireRole("admin"), updatePlan);
planRouter.delete("/:id", authorise, requireRole("admin"), deletePlan);

export default planRouter;
