import { Router } from "express";
import { listCategories, createCategory, deleteCategory } from "../controllers/category.controller";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";

const router = Router();

router.get("/", listCategories);
router.post("/", requireAuth, requireRole("ADMIN"), createCategory);
router.delete("/:id", requireAuth, requireRole("ADMIN"), deleteCategory);

export default router;
