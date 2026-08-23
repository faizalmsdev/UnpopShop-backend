import { Router } from "express";
import {
  getOverview,
  listBuyers,
  listManufacturers,
  setManufacturerVerification,
  setUserActive,
} from "../controllers/admin.controller";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";

const router = Router();
router.use(requireAuth, requireRole("ADMIN"));

router.get("/overview", getOverview);
router.get("/buyers", listBuyers);
router.get("/manufacturers", listManufacturers);
router.patch("/manufacturers/:id/verification", setManufacturerVerification);
router.patch("/users/:id/active", setUserActive);

export default router;
