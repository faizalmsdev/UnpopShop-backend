import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../config/db";
import { asyncHandler, ApiError } from "../middleware/errorHandler";

export const listBrands = asyncHandler(async (req: Request, res: Response) => {
  const { q } = req.query as { q?: string };
  const brands = await prisma.brand.findMany({
    where: q ? { name: { contains: q } } : undefined,
    include: {
      manufacturer: { select: { companyName: true, state: true, country: true, verificationStatus: true } },
      _count: { select: { products: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  res.json({ brands });
});

export const getBrand = asyncHandler(async (req: Request, res: Response) => {
  const brand = await prisma.brand.findUnique({
    where: { id: req.params.id },
    include: {
      manufacturer: true,
      products: { where: { status: "ACTIVE" }, include: { category: true } },
    },
  });
  if (!brand) throw new ApiError(404, "Brand not found");
  res.json({ brand });
});

const brandSchema = z.object({
  name: z.string().min(2),
  logoUrl: z.string().optional(),
  description: z.string().optional(),
  state: z.string().optional(),
});

export const listMyBrands = asyncHandler(async (req: Request, res: Response) => {
  const profile = await prisma.manufacturerProfile.findUnique({ where: { userId: req.user!.userId } });
  if (!profile) throw new ApiError(404, "Manufacturer profile not found");
  const brands = await prisma.brand.findMany({ where: { manufacturerId: profile.id } });
  res.json({ brands });
});

export const createBrand = asyncHandler(async (req: Request, res: Response) => {
  const profile = await prisma.manufacturerProfile.findUnique({ where: { userId: req.user!.userId } });
  if (!profile) throw new ApiError(404, "Manufacturer profile not found");
  const data = brandSchema.parse(req.body);
  const brand = await prisma.brand.create({ data: { ...data, manufacturerId: profile.id } });
  res.status(201).json({ brand });
});

export const updateBrand = asyncHandler(async (req: Request, res: Response) => {
  const profile = await prisma.manufacturerProfile.findUnique({ where: { userId: req.user!.userId } });
  const existing = await prisma.brand.findUnique({ where: { id: req.params.id } });
  if (!existing || existing.manufacturerId !== profile?.id) throw new ApiError(404, "Brand not found");

  const data = brandSchema.partial().parse(req.body);
  const brand = await prisma.brand.update({ where: { id: req.params.id }, data });
  res.json({ brand });
});
