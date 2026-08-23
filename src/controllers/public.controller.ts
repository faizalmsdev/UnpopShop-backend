import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../config/db";
import { asyncHandler } from "../middleware/errorHandler";

export const getHomepageContent = asyncHandler(async (_req: Request, res: Response) => {
  const [featuredProducts, featuredBrands, categories, stats] = await Promise.all([
    prisma.product.findMany({
      where: { status: "ACTIVE" },
      include: { brand: true, category: true, manufacturer: { select: { companyName: true, state: true } } },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.brand.findMany({
      include: { manufacturer: { select: { companyName: true, verificationStatus: true } } },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.category.findMany({ include: { _count: { select: { products: true } } } }),
    Promise.all([
      prisma.manufacturerProfile.count({ where: { verificationStatus: "VERIFIED" } }),
      prisma.product.count({ where: { status: "ACTIVE" } }),
      prisma.rFQ.count(),
    ]),
  ]);

  res.json({
    featuredProducts,
    featuredBrands,
    categories,
    stats: {
      verifiedManufacturers: stats[0],
      activeProducts: stats[1],
      rfqsFulfilled: stats[2],
    },
  });
});

const leadSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(6),
  location: z.string().min(2),
  business: z.string().min(2),
  description: z.string().min(5),
});

export const submitProductLead = asyncHandler(async (req: Request, res: Response) => {
  const data = leadSchema.parse(req.body);
  const lead = await prisma.productLead.create({ data });
  res.status(201).json({ lead });
});

export const adminListLeads = asyncHandler(async (_req: Request, res: Response) => {
  const leads = await prisma.productLead.findMany({ orderBy: { createdAt: "desc" } });
  res.json({ leads });
});
