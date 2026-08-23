import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../config/db";
import { asyncHandler } from "../middleware/errorHandler";

// Lists distinct conversation "threads" for the logged-in user, grouped by
// counterpart + optional RFQ, most recent message first.
export const listThreads = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const messages = await prisma.message.findMany({
    where: { OR: [{ senderId: userId }, { receiverId: userId }] },
    include: {
      sender: { select: { id: true, name: true, role: true } },
      receiver: { select: { id: true, name: true, role: true } },
      rfq: { select: { id: true, productName: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const threadMap = new Map<string, any>();
  for (const m of messages) {
    const counterpart = m.senderId === userId ? m.receiver : m.sender;
    const key = `${counterpart.id}:${m.rfqId || "direct"}`;
    if (!threadMap.has(key)) {
      threadMap.set(key, {
        counterpart,
        rfq: m.rfq,
        lastMessage: m.body,
        lastMessageAt: m.createdAt,
        unread: messages.filter((x) => x.receiverId === userId && !x.readAt && x.senderId === counterpart.id).length,
      });
    }
  }

  res.json({ threads: Array.from(threadMap.values()) });
});

export const getThread = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { counterpartId, rfqId } = req.query as { counterpartId: string; rfqId?: string };

  const messages = await prisma.message.findMany({
    where: {
      rfqId: rfqId || undefined,
      OR: [
        { senderId: userId, receiverId: counterpartId },
        { senderId: counterpartId, receiverId: userId },
      ],
    },
    orderBy: { createdAt: "asc" },
  });

  await prisma.message.updateMany({
    where: { senderId: counterpartId, receiverId: userId, readAt: null },
    data: { readAt: new Date() },
  });

  res.json({ messages });
});

const sendSchema = z.object({ receiverId: z.string(), body: z.string().min(1), rfqId: z.string().optional() });

export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  const data = sendSchema.parse(req.body);
  const message = await prisma.message.create({ data: { ...data, senderId: req.user!.userId } });
  res.status(201).json({ message });
});
