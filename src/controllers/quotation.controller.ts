import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../config/db";
import { asyncHandler, ApiError } from "../middleware/errorHandler";

// ---------------------------------------------------------------------------
// Manufacturer side
// ---------------------------------------------------------------------------

async function getOwnManufacturerProfile(userId: string) {
  const profile = await prisma.manufacturerProfile.findUnique({ where: { userId } });
  if (!profile) throw new ApiError(404, "Manufacturer profile not found");
  return profile;
}

// RFQs that were matched/distributed to the logged-in manufacturer, i.e.
// their "Orders & Leads" inbox.
export const listMatchedRFQs = asyncHandler(async (req: Request, res: Response) => {
  const profile = await getOwnManufacturerProfile(req.user!.userId);

  const matches = await prisma.rFQManufacturerMatch.findMany({
    where: { manufacturerId: profile.id },
    include: {
      rfq: {
        include: {
          category: true,
          quotations: { where: { manufacturerId: profile.id } },
        },
      },
    },
    orderBy: { notifiedAt: "desc" },
  });

  const shaped = matches.map((m) => ({
    ...m.rfq,
    myQuotation: m.rfq.quotations[0] ?? null,
    quotations: undefined,
  }));

  res.json({ rfqs: shaped });
});

const quotationSchema = z.object({
  pricePerUnit: z.coerce.number().positive(),
  currency: z.string().default("USD"),
  leadTimeDays: z.coerce.number().int().positive(),
  termsNotes: z.string().optional(),
  certifications: z.string().optional(),
});

export const submitQuotation = asyncHandler(async (req: Request, res: Response) => {
  const profile = await getOwnManufacturerProfile(req.user!.userId);
  const rfqId = req.params.rfqId;

  const rfq = await prisma.rFQ.findUnique({ where: { id: rfqId } });
  if (!rfq) throw new ApiError(404, "RFQ not found");

  const isMatched = await prisma.rFQManufacturerMatch.findUnique({
    where: { rfqId_manufacturerId: { rfqId, manufacturerId: profile.id } },
  });
  if (!isMatched) throw new ApiError(403, "This RFQ was not distributed to your organization");

  const data = quotationSchema.parse(req.body);
  const totalPrice = data.pricePerUnit * rfq.quantity;

  const quotation = await prisma.manufacturerQuotation.upsert({
    where: { rfqId_manufacturerId: { rfqId, manufacturerId: profile.id } },
    update: { ...data, totalPrice },
    create: { ...data, totalPrice, rfqId, manufacturerId: profile.id },
  });

  if (rfq.status === "OPEN") {
    await prisma.rFQ.update({ where: { id: rfqId }, data: { status: "QUOTED" } });
  }

  res.status(201).json({ quotation });
});

export const listMyQuotations = asyncHandler(async (req: Request, res: Response) => {
  const profile = await getOwnManufacturerProfile(req.user!.userId);
  const quotations = await prisma.manufacturerQuotation.findMany({
    where: { manufacturerId: profile.id },
    include: { rfq: { include: { category: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json({ quotations });
});

// ---------------------------------------------------------------------------
// Admin side: filter/select/negotiate manufacturer quotes, then publish a
// single final quotation to the buyer.
// ---------------------------------------------------------------------------

const decisionSchema = z.object({ status: z.enum(["SHORTLISTED", "REJECTED", "SUBMITTED"]) });

export const adminUpdateQuotationStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status } = decisionSchema.parse(req.body);
  const quotation = await prisma.manufacturerQuotation.update({
    where: { id: req.params.quotationId },
    data: { status },
  });
  res.json({ quotation });
});

const finalQuotationSchema = z.object({
  finalPricePerUnit: z.coerce.number().positive(),
  currency: z.string().default("USD"),
  deliveryTimeline: z.string().optional(),
  terms: z.string().optional(),
  supplierSummary: z.string().optional(),
});

export const adminSendFinalQuotation = asyncHandler(async (req: Request, res: Response) => {
  const rfqId = req.params.rfqId;
  const rfq = await prisma.rFQ.findUnique({ where: { id: rfqId } });
  if (!rfq) throw new ApiError(404, "RFQ not found");

  const data = finalQuotationSchema.parse(req.body);
  const finalTotalPrice = data.finalPricePerUnit * rfq.quantity;

  const finalQuotation = await prisma.finalQuotation.upsert({
    where: { rfqId },
    update: { ...data, finalTotalPrice, status: "SENT", preparedByAdminId: req.user!.userId },
    create: { ...data, finalTotalPrice, rfqId, preparedByAdminId: req.user!.userId },
  });

  await prisma.rFQ.update({ where: { id: rfqId }, data: { status: "FINALIZED" } });

  res.status(201).json({ finalQuotation });
});
