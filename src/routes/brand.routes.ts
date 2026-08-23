import { Router } from "express";
import { listBrands, getBrand, listMyBrands, createBrand, updateBrand } from "../controllers/brand.controller";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";

const router = Router();

router.get("/", listBrands);
router.get("/mine", requireAuth, requireRole("MANUFACTURER"), listMyBrands);
router.get("/:id", getBrand);
router.post("/", requireAuth, requireRole("MANUFACTURER"), createBrand);
router.patch("/:id", requireAuth, requireRole("MANUFACTURER"), updateBrand);

export default router;
