import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../config/db";
import { hashPassword, comparePassword } from "../utils/password";
import { signToken } from "../utils/jwt";
import { ApiError, asyncHandler } from "../middleware/errorHandler";

const registerBuyerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
  companyName: z.string().min(2),
  country: z.string().min(2),
  city: z.string().optional(),
  industry: z.string().optional(),
});

export const registerBuyer = asyncHandler(async (req: Request, res: Response) => {
  const data = registerBuyerSchema.parse(req.body);

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new ApiError(409, "An account with this email already exists");

  const passwordHash = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      phone: data.phone,
      country: data.country,
      role: "BUYER",
      buyerProfile: {
        create: {
          companyName: data.companyName,
          country: data.country,
          city: data.city,
          industry: data.industry,
        },
      },
    },
    include: { buyerProfile: true },
  });

  const token = signToken({ userId: user.id, role: user.role, email: user.email });
  res.status(201).json({ token, user: sanitizeUser(user) });
});

const registerManufacturerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
  companyName: z.string().min(2),
  state: z.string().optional(),
  city: z.string().optional(),
  gstNumber: z.string().optional(),
  description: z.string().optional(),
});

export const registerManufacturer = asyncHandler(async (req: Request, res: Response) => {
  const data = registerManufacturerSchema.parse(req.body);

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new ApiError(409, "An account with this email already exists");

  const passwordHash = await hashPassword(data.password);

  // Default every new manufacturer onto the free "starter" plan if it exists.
  const starterPlan = await prisma.subscriptionPlan.findUnique({ where: { code: "starter" } });

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      phone: data.phone,
      country: "India",
      role: "MANUFACTURER",
      manufacturerProfile: {
        create: {
          companyName: data.companyName,
          state: data.state,
          city: data.city,
          gstNumber: data.gstNumber,
          description: data.description,
          subscriptionPlanId: starterPlan?.id,
          listingLimit: starterPlan?.listingLimit ?? 5,
        },
      },
    },
    include: { manufacturerProfile: true },
  });

  const token = signToken({ userId: user.id, role: user.role, email: user.email });
  res.status(201).json({ token, user: sanitizeUser(user) });
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({
    where: { email },
    include: { buyerProfile: true, manufacturerProfile: true },
  });
  if (!user || !user.isActive) throw new ApiError(401, "Invalid email or password");

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) throw new ApiError(401, "Invalid email or password");

  const token = signToken({ userId: user.id, role: user.role, email: user.email });
  res.json({ token, user: sanitizeUser(user) });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    include: { buyerProfile: true, manufacturerProfile: { include: { subscriptionPlan: true } } },
  });
  if (!user) throw new ApiError(404, "User not found");
  res.json({ user: sanitizeUser(user) });
});

function sanitizeUser(user: any) {
  const { passwordHash, ...rest } = user;
  return rest;
}
