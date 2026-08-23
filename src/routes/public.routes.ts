import { Router } from "express";
import { getHomepageContent, submitProductLead, adminListLeads } from "../controllers/public.controller";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";

const router = Router();

router.get("/homepage", getHomepageContent);
router.post("/leads", submitProductLead);
router.get("/leads", requireAuth, requireRole("ADMIN"), adminListLeads);

export default router;
