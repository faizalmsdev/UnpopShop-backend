import { Router } from "express";
import {
  createRFQ,
  listMyRFQs,
  getMyRFQ,
  respondToFinalQuotation,
  adminListRFQs,
  adminGetRFQ,
} from "../controllers/rfq.controller";
import {
  listMatchedRFQs,
  submitQuotation,
  listMyQuotations,
  adminUpdateQuotationStatus,
  adminSendFinalQuotation,
} from "../controllers/quotation.controller";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";

const router = Router();

// Buyer
router.post("/", requireAuth, requireRole("BUYER"), createRFQ);
router.get("/mine", requireAuth, requireRole("BUYER"), listMyRFQs);
router.get("/mine/:id", requireAuth, requireRole("BUYER"), getMyRFQ);
router.post("/mine/:id/respond", requireAuth, requireRole("BUYER"), respondToFinalQuotation);

// Manufacturer
router.get("/matched", requireAuth, requireRole("MANUFACTURER"), listMatchedRFQs);
router.get("/matched/quotations", requireAuth, requireRole("MANUFACTURER"), listMyQuotations);
router.post("/:rfqId/quotations", requireAuth, requireRole("MANUFACTURER"), submitQuotation);

// Admin
router.get("/admin", requireAuth, requireRole("ADMIN"), adminListRFQs);
router.get("/admin/:id", requireAuth, requireRole("ADMIN"), adminGetRFQ);
router.patch("/admin/quotations/:quotationId", requireAuth, requireRole("ADMIN"), adminUpdateQuotationStatus);
router.post("/admin/:rfqId/final-quotation", requireAuth, requireRole("ADMIN"), adminSendFinalQuotation);

export default router;
