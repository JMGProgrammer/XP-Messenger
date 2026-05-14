import { Router } from "express";
import { prisma } from "../prisma.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

export const messagesRouter = Router();
messagesRouter.use(authMiddleware);

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
