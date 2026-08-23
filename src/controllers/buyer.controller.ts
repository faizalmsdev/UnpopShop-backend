import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../config/db";
import { asyncHandler, ApiError } from "../middleware/errorHandler";

// ---------------------------------------------------------------------------
// Favorites
// ---------------------------------------------------------------------------

export const listFavorites = asyncHandler(async (req: Request, res: Response) => {
  const favorites = await prisma.favorite.findMany({
    where: { buyerId: req.user!.userId },
    include: { product: { include: { brand: true, category: true, manufacturer: { select: { companyName: true, state: true } } } } },
    orderBy: { createdAt: "desc" },
  });
  res.json({ favorites });
});

export const addFavorite = asyncHandler(async (req: Request, res: Response) => {
  const { productId } = z.object({ productId: z.string() }).parse(req.body);
  const favorite = await prisma.favorite.upsert({
    where: { buyerId_productId: { buyerId: req.user!.userId, productId } },
    update: {},
    create: { buyerId: req.user!.userId, productId },
  });
  res.status(201).json({ favorite });
});

export const removeFavorite = asyncHandler(async (req: Request, res: Response) => {
  await prisma.favorite
    .delete({ where: { buyerId_productId: { buyerId: req.user!.userId, productId: req.params.productId } } })
    .catch(() => undefined);
  res.json({ success: true });
});

// ---------------------------------------------------------------------------
// Individual product enquiries (separate from the Bulk Quote / RFQ flow)
// ---------------------------------------------------------------------------

const enquirySchema = z.object({ productId: z.string(), message: z.string().min(5) });

export const createEnquiry = asyncHandler(async (req: Request, res: Response) => {
  const data = enquirySchema.parse(req.body);
  const enquiry = await prisma.enquiry.create({ data: { ...data, buyerId: req.user!.userId } });
  res.status(201).json({ enquiry });
});

export const listMyEnquiries = asyncHandler(async (req: Request, res: Response) => {
  const enquiries = await prisma.enquiry.findMany({
    where: { buyerId: req.user!.userId },
    include: { product: { include: { manufacturer: { select: { companyName: true } } } } },
    orderBy: { createdAt: "desc" },
  });
  res.json({ enquiries });
});

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export const listMyOrders = asyncHandler(async (req: Request, res: Response) => {
  const orders = await prisma.order.findMany({
    where: { buyerId: req.user!.userId },
    include: { manufacturer: { select: { companyName: true } }, product: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json({ orders });
});

// ---------------------------------------------------------------------------
// Dashboard overview -- mirrors the buyer stat cards in the reference UI
// ---------------------------------------------------------------------------

export const getDashboardOverview = asyncHandler(async (req: Request, res: Response) => {
  const buyerId = req.user!.userId;

  const [inquiriesSent, ordersPlaced, favoriteCount, rfqs, recentEnquiries] = await Promise.all([
    prisma.enquiry.count({ where: { buyerId } }),
    prisma.order.count({ where: { buyerId } }),
    prisma.favorite.count({ where: { buyerId } }),
    prisma.rFQ.findMany({ where: { buyerId }, include: { finalQuotation: true } }),
    prisma.enquiry.findMany({
      where: { buyerId },
      include: { product: { include: { manufacturer: { select: { companyName: true } } } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const quotesReceived = rfqs.filter((r) => r.finalQuotation).length;

  const recommended = await prisma.brand.findMany({
    include: { manufacturer: { select: { companyName: true, state: true, country: true } } },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
    take: 4,
  });

  res.json({
    stats: {
      inquiriesSent,
      quotesReceived,
      ordersPlaced,
      favoriteBrands: favoriteCount,
    },
    recentInquiries: recentEnquiries,
    recommendedBrands: recommended,
    popularCategories: categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug, productCount: c._count.products })),
  });
});

// ---------------------------------------------------------------------------
// Supply Map -- aggregated manufacturing capacity by state/country for a
// given product/category, so buyers can see where supply is concentrated.
// ---------------------------------------------------------------------------

const supplyQuerySchema = z.object({
  product: z.string().optional(),
  category: z.string().optional(), // slug
});

export const getSupplyMap = asyncHandler(async (req: Request, res: Response) => {
  const { product, category } = supplyQuerySchema.parse(req.query);

  const where: any = { status: "ACTIVE" };
  if (product) where.name = { contains: product };
  if (category) where.category = { slug: category };

  const products = await prisma.product.findMany({
    where,
    select: { manufacturerId: true, manufacturer: { select: { state: true, country: true } } },
  });

  const tally: Record<string, number> = {};
  for (const p of products) {
    const key = p.manufacturer.state || p.manufacturer.country;
    tally[key] = (tally[key] || 0) + 1;
  }

  const max = Math.max(1, ...Object.values(tally));
  const supply = Object.entries(tally)
    .map(([region, count]) => ({
      region,
      manufacturerCount: count,
      level: count / max > 0.66 ? "High" : count / max > 0.33 ? "Medium" : "Low",
    }))
    .sort((a, b) => b.manufacturerCount - a.manufacturerCount);

  res.json({ supply });
});
