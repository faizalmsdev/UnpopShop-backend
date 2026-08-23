import { Router } from "express";
import { listPlans, createPlan, updatePlan, subscribeToPlan } from "../controllers/subscription.controller";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";

const router = Router();

router.get("/", listPlans);
router.post("/", requireAuth, requireRole("ADMIN"), createPlan);
router.patch("/:id", requireAuth, requireRole("ADMIN"), updatePlan);
router.post("/subscribe", requireAuth, requireRole("MANUFACTURER"), subscribeToPlan);

export default router;
