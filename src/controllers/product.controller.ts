import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../config/db";
import { asyncHandler, ApiError } from "../middleware/errorHandler";

// ---------------------------------------------------------------------------
// Buyer-facing / public browsing
// ---------------------------------------------------------------------------

const searchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(), // slug
  country: z.string().optional(), // origin state/country filter
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(50).default(12),
});

export const searchProducts = asyncHandler(async (req: Request, res: Response) => {
  const { q, category, country, page, pageSize } = searchSchema.parse(req.query);

  const where: any = { status: "ACTIVE" };
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { description: { contains: q } },
      { manufacturer: { companyName: { contains: q } } },
      { brand: { name: { contains: q } } },
    ];
  }
  if (category) where.category = { slug: category };
  if (country) where.originState = { contains: country };

  // Log a demand signal for aggregate search-driven demand data (non-RFQ source).
  if (q) {
    const cat = category ? await prisma.category.findUnique({ where: { slug: category } }) : null;
    await prisma.demandRecord.create({
      data: {
        productName: q,
        categoryId: cat?.id,
        country: "Unknown", // buyer's country isn't in the JWT; real demand signal comes from RFQ submissions
        source: "search",
      },
    }).catch(() => undefined); // best-effort, never block the search response
  }

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        brand: true,
        category: true,
        manufacturer: { select: { id: true, companyName: true, state: true, country: true, verificationStatus: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  res.json({ items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
});

export const getProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: {
      brand: true,
      category: true,
      manufacturer: {
        select: {
          id: true,
          companyName: true,
          description: true,
          state: true,
          country: true,
          verificationStatus: true,
          certifications: true,
          exportMarkets: true,
        },
      },
    },
  });
  if (!product) throw new ApiError(404, "Product not found");
  res.json({ product });
});

// ---------------------------------------------------------------------------
// Manufacturer-facing CRUD (subscription-gated)
// ---------------------------------------------------------------------------

async function getOwnManufacturerProfile(userId: string) {
  const profile = await prisma.manufacturerProfile.findUnique({ where: { userId } });
  if (!profile) throw new ApiError(404, "Manufacturer profile not found");
  return profile;
}

export const listMyProducts = asyncHandler(async (req: Request, res: Response) => {
  const profile = await getOwnManufacturerProfile(req.user!.userId);
  const products = await prisma.product.findMany({
    where: { manufacturerId: profile.id },
    include: { brand: true, category: true },
    orderBy: { createdAt: "desc" },
  });
  res.json({ products, listingLimit: profile.listingLimit, listingsUsed: products.length });
});

const productSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  categoryId: z.string(),
  brandId: z.string().optional(),
  images: z.string().optional(), // comma-separated URLs
  moq: z.coerce.number().optional(),
  moqUnit: z.string().optional(),
  pricePerUnit: z.coerce.number().optional(),
  currency: z.string().optional(),
  packagingOptions: z.string().optional(),
  originState: z.string().optional(),
  certifications: z.string().optional(),
  productionCapacity: z.string().optional(),
  exportMarkets: z.string().optional(),
  availability: z.coerce.boolean().optional(),
  status: z.enum(["DRAFT", "ACTIVE", "PAUSED"]).optional(),
});

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const profile = await getOwnManufacturerProfile(req.user!.userId);
  const data = productSchema.parse(req.body);

  // Enforce subscription listing limit -- the core "₹5,000 -> 5 listings" rule.
  const currentCount = await prisma.product.count({
    where: { manufacturerId: profile.id, status: { not: "DRAFT" } },
  });
  const wantsActive = (data.status ?? "ACTIVE") !== "DRAFT";
  if (wantsActive && currentCount >= profile.listingLimit) {
    throw new ApiError(
      403,
      `Your current plan allows up to ${profile.listingLimit} active listings. Upgrade your subscription or pause an existing product to add more.`
    );
  }

  const product = await prisma.product.create({
    data: { ...data, manufacturerId: profile.id },
    include: { brand: true, category: true },
  });
  res.status(201).json({ product });
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const profile = await getOwnManufacturerProfile(req.user!.userId);
  const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!existing || existing.manufacturerId !== profile.id) throw new ApiError(404, "Product not found");

  const data = productSchema.partial().parse(req.body);

  // If moving from a non-active status into ACTIVE, re-check the limit.
  if (data.status === "ACTIVE" && existing.status !== "ACTIVE") {
    const currentCount = await prisma.product.count({
      where: { manufacturerId: profile.id, status: "ACTIVE" },
    });
    if (currentCount >= profile.listingLimit) {
      throw new ApiError(403, `Your current plan allows up to ${profile.listingLimit} active listings.`);
    }
  }

  const product = await prisma.product.update({
    where: { id: req.params.id },
    data,
    include: { brand: true, category: true },
  });
  res.json({ product });
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  const profile = await getOwnManufacturerProfile(req.user!.userId);
  const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!existing || existing.manufacturerId !== profile.id) throw new ApiError(404, "Product not found");

  await prisma.product.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export const adminListProducts = asyncHandler(async (_req: Request, res: Response) => {
  const products = await prisma.product.findMany({
    include: { brand: true, category: true, manufacturer: { select: { companyName: true, verificationStatus: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json({ products });
});
