import { Router } from "express";
import {
  listFavorites,
  addFavorite,
  removeFavorite,
  createEnquiry,
  listMyEnquiries,
  listMyOrders,
  getDashboardOverview,
  getSupplyMap,
} from "../controllers/buyer.controller";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";

const router = Router();
router.use(requireAuth, requireRole("BUYER"));

router.get("/overview", getDashboardOverview);
router.get("/favorites", listFavorites);
router.post("/favorites", addFavorite);
router.delete("/favorites/:productId", removeFavorite);
router.post("/enquiries", createEnquiry);
router.get("/enquiries", listMyEnquiries);
router.get("/orders", listMyOrders);
router.get("/supply-map", getSupplyMap);

export default router;
