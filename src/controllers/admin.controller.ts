import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../config/db";
import { asyncHandler, ApiError } from "../middleware/errorHandler";

export const getOverview = asyncHandler(async (_req: Request, res: Response) => {
  const [
    buyerCount,
    manufacturerCount,
    verifiedManufacturers,
    productCount,
    brandCount,
    openRfqs,
    quotedRfqs,
    finalizedRfqs,
    pendingQuotations,
    activeSubscriptions,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "BUYER" } }),
    prisma.user.count({ where: { role: "MANUFACTURER" } }),
    prisma.manufacturerProfile.count({ where: { verificationStatus: "VERIFIED" } }),
    prisma.product.count(),
    prisma.brand.count(),
    prisma.rFQ.count({ where: { status: "OPEN" } }),
    prisma.rFQ.count({ where: { status: "QUOTED" } }),
    prisma.rFQ.count({ where: { status: { in: ["FINALIZED", "ACCEPTED"] } } }),
    prisma.manufacturerQuotation.count({ where: { status: "SUBMITTED" } }),
    prisma.manufacturerProfile.count({ where: { subscriptionStatus: "active" } }),
  ]);

  res.json({
    stats: {
      buyerCount,
      manufacturerCount,
      verifiedManufacturers,
      pendingVerification: manufacturerCount - verifiedManufacturers,
      productCount,
      brandCount,
      openRfqs,
      quotedRfqs,
      finalizedRfqs,
      pendingQuotations,
      activeSubscriptions,
    },
  });
});

export const listBuyers = asyncHandler(async (_req: Request, res: Response) => {
  const buyers = await prisma.user.findMany({
    where: { role: "BUYER" },
    include: { buyerProfile: true, _count: { select: { rfqs: true, enquiries: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json({ buyers });
});

export const listManufacturers = asyncHandler(async (_req: Request, res: Response) => {
  const manufacturers = await prisma.manufacturerProfile.findMany({
    include: {
      user: { select: { name: true, email: true, phone: true, createdAt: true } },
      subscriptionPlan: true,
      _count: { select: { products: true, brands: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  res.json({ manufacturers });
});

const verifySchema = z.object({ status: z.enum(["PENDING", "VERIFIED", "REJECTED"]) });

export const setManufacturerVerification = asyncHandler(async (req: Request, res: Response) => {
  const { status } = verifySchema.parse(req.body);
  const manufacturer = await prisma.manufacturerProfile.update({
    where: { id: req.params.id },
    data: { verificationStatus: status },
  });

  await prisma.notification.create({
    data: {
      userId: manufacturer.userId,
      title: status === "VERIFIED" ? "Your company has been verified" : `Verification status: ${status}`,
      body:
        status === "VERIFIED"
          ? "Buyers can now see your verified badge, and you'll be matched against relevant bulk quote requests."
          : undefined,
    },
  });

  res.json({ manufacturer });
});

export const setUserActive = asyncHandler(async (req: Request, res: Response) => {
  const { isActive } = z.object({ isActive: z.boolean() }).parse(req.body);
  const user = await prisma.user.update({ where: { id: req.params.id }, data: { isActive } });
  res.json({ user: { id: user.id, isActive: user.isActive } });
});
