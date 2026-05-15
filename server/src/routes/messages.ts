import { Router } from "express";
import { prisma } from "../prisma.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

export const messagesRouter = Router();
messagesRouter.use(authMiddleware);

/**
 * GET /messages/unread-counts
 * Devuelve { [senderId]: count } de mensajes no leídos enviados a este usuario.
 */
messagesRouter.get("/unread-counts", async (req, res) => {
  const me = req.userId!;
  const rows = await prisma.message.groupBy({
    by: ["senderId"],
    where: {
      receiverId: me,
      readAt: null,
    },
    _count: { _all: true },
  });

  const counts: Record<string, number> = {};
  for (const r of rows) {
    counts[r.senderId] = r._count._all;
  }
  res.json(counts);
});

/**
 * POST /messages/:otherUserId/read
 * Marca como leídos todos los mensajes que ese contacto me envió.
 */
messagesRouter.post("/:otherUserId/read", async (req, res) => {
  const me = req.userId!;
  const other = req.params.otherUserId;

  const result = await prisma.message.updateMany({
    where: {
      receiverId: me,
      senderId: other,
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  res.json({ marked: result.count });
});

/**
 * GET /messages/:otherUserId
 * Devuelve el historial completo de la conversación.
 */
messagesRouter.get("/:otherUserId", async (req, res) => {
  const me = req.userId!;
  const other = req.params.otherUserId;

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: me, receiverId: other },
        { senderId: other, receiverId: me },
      ],
    },
    orderBy: { createdAt: "asc" },
    take: 100,
  });
  res.json(messages);
});
