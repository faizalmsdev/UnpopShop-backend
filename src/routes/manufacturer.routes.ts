import { Router } from "express";
import { getMyProfile, updateMyProfile, getDashboardOverview, getDemandMap } from "../controllers/manufacturer.controller";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";

const router = Router();
router.use(requireAuth, requireRole("MANUFACTURER"));

router.get("/profile", getMyProfile);
router.patch("/profile", updateMyProfile);
router.get("/overview", getDashboardOverview);
router.get("/demand-map", getDemandMap);

export default router;
