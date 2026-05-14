import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

export const contactsRouter = Router();
contactsRouter.use(authMiddleware);

contactsRouter.get("/", async (req, res) => {
  const contacts = await prisma.contact.findMany({
    where: { ownerId: req.userId! },
    include: { target: true },
  });
  res.json(
    contacts.map((c) => ({
      id: c.target.id,
      email: c.target.email,
      displayName: c.target.displayName,
      personalMessage: c.target.personalMessage,
      status: c.target.status,
    })),
  );
});

const addSchema = z.object({ email: z.string().email() });

contactsRouter.post("/", async (req, res) => {
  const parsed = addSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid email" });

  const target = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (!target) return res.status(404).json({ error: "User not found" });
  if (target.id === req.userId) {
    return res.status(400).json({ error: "Cannot add yourself" });
  }

  try {
    await prisma.contact.create({
      data: { ownerId: req.userId!, targetId: target.id },
    });
  } catch {
    return res.status(409).json({ error: "Already a contact" });
  }

  res.json({
    id: target.id,
    email: target.email,
    displayName: target.displayName,
    personalMessage: target.personalMessage,
    status: target.status,
  });
});
