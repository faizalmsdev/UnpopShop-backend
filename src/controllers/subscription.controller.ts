import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../config/db";
import { asyncHandler, ApiError } from "../middleware/errorHandler";

export const listPlans = asyncHandler(async (_req: Request, res: Response) => {
  const plans = await prisma.subscriptionPlan.findMany({ orderBy: { priceInr: "asc" } });
  res.json({ plans });
});

const planSchema = z.object({
  code: z.string().min(2),
  name: z.string().min(2),
  priceInr: z.coerce.number().min(0),
  listingLimit: z.coerce.number().min(1),
  description: z.string().optional(),
});

export const createPlan = asyncHandler(async (req: Request, res: Response) => {
  const data = planSchema.parse(req.body);
  const plan = await prisma.subscriptionPlan.create({ data });
  res.status(201).json({ plan });
});

export const updatePlan = asyncHandler(async (req: Request, res: Response) => {
  const data = planSchema.partial().parse(req.body);
  const plan = await prisma.subscriptionPlan.update({ where: { id: req.params.id }, data });
  res.json({ plan });
});

// Manufacturer self-service upgrade/downgrade. In production this would be
// gated behind a real payment confirmation webhook; here the subscription
// takes effect immediately for demo purposes and is logged as a Notification.
const subscribeSchema = z.object({ planId: z.string() });

export const subscribeToPlan = asyncHandler(async (req: Request, res: Response) => {
  const { planId } = subscribeSchema.parse(req.body);
  const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
  if (!plan) throw new ApiError(404, "Plan not found");

  const profile = await prisma.manufacturerProfile.findUnique({ where: { userId: req.user!.userId } });
  if (!profile) throw new ApiError(404, "Manufacturer profile not found");

  const endsAt = new Date();
  endsAt.setMonth(endsAt.getMonth() + 1);

  const updated = await prisma.manufacturerProfile.update({
    where: { id: profile.id },
    data: {
      subscriptionPlanId: plan.id,
      listingLimit: plan.listingLimit,
      subscriptionStatus: "active",
      subscriptionEndsAt: endsAt,
    },
  });

  await prisma.notification.create({
    data: {
      userId: req.user!.userId,
      title: `Subscribed to ${plan.name}`,
      body: `Your listing limit is now ${plan.listingLimit} active products.`,
    },
  });

  res.json({ profile: updated });
});
