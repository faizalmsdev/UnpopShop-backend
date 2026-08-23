import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../config/db";
import { asyncHandler, ApiError } from "../middleware/errorHandler";

// ---------------------------------------------------------------------------
// Buyer: submit a Bulk Quote / RFQ
// ---------------------------------------------------------------------------

const rfqSchema = z.object({
  productName: z.string().min(2),
  categoryId: z.string().optional(),
  quantity: z.coerce.number().positive(),
  unit: z.string().default("ton"),
  destinationCountry: z.string().min(2),
  specifications: z.string().optional(),
  certificationsRequired: z.string().optional(),
  deliveryTimeline: z.string().optional(),
  additionalRequirements: z.string().optional(),
});

export const createRFQ = asyncHandler(async (req: Request, res: Response) => {
  const data = rfqSchema.parse(req.body);

  const rfq = await prisma.rFQ.create({
    data: { ...data, buyerId: req.user!.userId },
  });

  // --- Distribution logic -----------------------------------------------
  // Match against verified manufacturers who sell in the same category
  // (falls back to a fuzzy name match against product name/description
  // when no category is given), so the RFQ reaches relevant suppliers
  // automatically without buyer or manufacturer having to do anything.
  const matchWhere: any = { status: "ACTIVE", manufacturer: { verificationStatus: "VERIFIED" } };
  if (data.categoryId) {
    matchWhere.categoryId = data.categoryId;
  } else {
    matchWhere.name = { contains: data.productName };
  }

  const matchingProducts = await prisma.product.findMany({
    where: matchWhere,
    select: { manufacturerId: true },
    distinct: ["manufacturerId"],
  });

  if (matchingProducts.length > 0) {
    await prisma.rFQManufacturerMatch.createMany({
      data: matchingProducts.map((p) => ({ rfqId: rfq.id, manufacturerId: p.manufacturerId })),
      skipDuplicates: true,
    });
  }

  // --- Demand intelligence -------------------------------------------------
  await prisma.demandRecord.create({
    data: {
      rfqId: rfq.id,
      categoryId: data.categoryId,
      productName: data.productName,
      country: data.destinationCountry,
      quantity: data.quantity,
      unit: data.unit,
      source: "rfq",
    },
  });

  res.status(201).json({ rfq, manufacturersNotified: matchingProducts.length });
});

// ---------------------------------------------------------------------------
// Buyer: view own RFQs. Only the admin-curated FinalQuotation is ever
// returned -- raw ManufacturerQuotation records are deliberately excluded
// from every buyer-facing query in this file.
// ---------------------------------------------------------------------------

export const listMyRFQs = asyncHandler(async (req: Request, res: Response) => {
  const rfqs = await prisma.rFQ.findMany({
    where: { buyerId: req.user!.userId },
    include: {
      category: true,
      finalQuotation: true,
      _count: { select: { quotations: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Reshape so the raw quotation count doesn't leak anything beyond "N suppliers responded".
  const shaped = rfqs.map((r) => ({
    ...r,
    quotationsReceived: r._count.quotations,
    _count: undefined,
  }));

  res.json({ rfqs: shaped });
});

export const getMyRFQ = asyncHandler(async (req: Request, res: Response) => {
  const rfq = await prisma.rFQ.findUnique({
    where: { id: req.params.id },
    include: { category: true, finalQuotation: true, _count: { select: { quotations: true } } },
  });
  if (!rfq || rfq.buyerId !== req.user!.userId) throw new ApiError(404, "RFQ not found");

  res.json({
    rfq: { ...rfq, quotationsReceived: rfq._count.quotations, _count: undefined },
  });
});

const acceptSchema = z.object({ accept: z.boolean() });

export const respondToFinalQuotation = asyncHandler(async (req: Request, res: Response) => {
  const { accept } = acceptSchema.parse(req.body);
  const rfq = await prisma.rFQ.findUnique({ where: { id: req.params.id }, include: { finalQuotation: true } });
  if (!rfq || rfq.buyerId !== req.user!.userId) throw new ApiError(404, "RFQ not found");
  if (!rfq.finalQuotation) throw new ApiError(400, "No final quotation has been sent for this RFQ yet");

  await prisma.finalQuotation.update({
    where: { rfqId: rfq.id },
    data: { status: accept ? "ACCEPTED" : "REJECTED" },
  });
  await prisma.rFQ.update({ where: { id: rfq.id }, data: { status: accept ? "ACCEPTED" : "CLOSED" } });

  res.json({ success: true });
});

// ---------------------------------------------------------------------------
// Admin: full oversight, including raw manufacturer quotations
// ---------------------------------------------------------------------------

export const adminListRFQs = asyncHandler(async (_req: Request, res: Response) => {
  const rfqs = await prisma.rFQ.findMany({
    include: {
      buyer: { select: { name: true, email: true, country: true } },
      category: true,
      finalQuotation: true,
      _count: { select: { quotations: true, matches: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  res.json({ rfqs });
});

export const adminGetRFQ = asyncHandler(async (req: Request, res: Response) => {
  const rfq = await prisma.rFQ.findUnique({
    where: { id: req.params.id },
    include: {
      buyer: { select: { name: true, email: true, country: true, phone: true } },
      category: true,
      finalQuotation: true,
      matches: { include: { manufacturer: { select: { id: true, companyName: true, state: true } } } },
      quotations: {
        include: { manufacturer: { select: { id: true, companyName: true, state: true, verificationStatus: true } } },
        orderBy: { pricePerUnit: "asc" },
      },
    },
  });
  if (!rfq) throw new ApiError(404, "RFQ not found");
  res.json({ rfq });
});
