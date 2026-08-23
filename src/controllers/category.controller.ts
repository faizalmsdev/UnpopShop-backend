import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../config/db";
import { asyncHandler, ApiError } from "../middleware/errorHandler";

export const listCategories = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });
  res.json({ categories });
});

const upsertSchema = z.object({
  name: z.string().min(2),
});

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const { name } = upsertSchema.parse(req.body);
  const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const existing = await prisma.category.findUnique({ where: { slug } });
  if (existing) throw new ApiError(409, "A category with this name already exists");

  const category = await prisma.category.create({ data: { name, slug } });
  res.status(201).json({ category });
});

export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  await prisma.category.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});
