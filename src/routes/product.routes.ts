import { Router } from "express";
import {
  searchProducts,
  getProduct,
  listMyProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  adminListProducts,
} from "../controllers/product.controller";
import { requireAuth, optionalAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";

const router = Router();

router.get("/", optionalAuth, searchProducts);
router.get("/mine", requireAuth, requireRole("MANUFACTURER"), listMyProducts);
router.get("/admin/all", requireAuth, requireRole("ADMIN"), adminListProducts);
router.get("/:id", getProduct);
router.post("/", requireAuth, requireRole("MANUFACTURER"), createProduct);
router.patch("/:id", requireAuth, requireRole("MANUFACTURER"), updateProduct);
router.delete("/:id", requireAuth, requireRole("MANUFACTURER"), deleteProduct);

export default router;
