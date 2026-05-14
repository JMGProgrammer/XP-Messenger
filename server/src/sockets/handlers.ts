import type { Server, Socket } from "socket.io";
import { prisma } from "../prisma.js";
import { verifyToken } from "../auth/jwt.js";

interface SocketData {
  userId: string;
}

type AuthedSocket = Socket<
  Record<string, unknown>,
  Record<string, unknown>,
  Record<string, unknown>,
  SocketData
>;

// userId -> Set<socketId> (un mismo usuario puede tener múltiples pestañas/dispositivos)
const onlineUsers = new Map<string, Set<string>>();

function addOnline(userId: string, socketId: string) {
  if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
  onlineUsers.get(userId)!.add(socketId);
}

function removeOnline(userId: string, socketId: string) {
  const set = onlineUsers.get(userId);
  if (!set) return;
  set.delete(socketId);
  if (set.size === 0) onlineUsers.delete(userId);
}

function isUserOnline(userId: string) {
  return onlineUsers.has(userId);
}

function emitToUser(
  io: Server,
  userId: string,
  event: string,
  payload: unknown,
) {
  const set = onlineUsers.get(userId);
  if (!set) return;
  for (const sid of set) io.to(sid).emit(event, payload);
}

export function registerSocketHandlers(io: Server) {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error("No token"));
    try {
      const { userId } = verifyToken(token);
      (socket as AuthedSocket).data.userId = userId;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", async (socket: AuthedSocket) => {
    const userId = socket.data.userId;
    addOnline(userId, socket.id);

    // Marcar online en DB
    await prisma.user.update({
      where: { id: userId },
      data: { status: "online" },
    });

    // Avisar a los contactos que me tienen agregado que estoy online
    const watchers = await prisma.contact.findMany({
      where: { targetId: userId },
    });
    for (const w of watchers) {
      emitToUser(io, w.ownerId, "contact:status", { userId, status: "online" });
    }

    // Devolver al usuario los estados actuales de SUS contactos
    const myContacts = await prisma.contact.findMany({
      where: { ownerId: userId },
      include: { target: true },
    });
    socket.emit(
      "contacts:initialStatuses",
      myContacts.map((c) => ({
        userId: c.target.id,
        status: isUserOnline(c.target.id) ? c.target.status : "offline",
      })),
    );

    // ---- Mensajes ----
    socket.on(
      "message:send",
      async (data: { toUserId: string; content: string }) => {
        if (!data?.toUserId || !data?.content?.trim()) return;
        const msg = await prisma.message.create({
          data: {
            senderId: userId,
            receiverId: data.toUserId,
            content: data.content.slice(0, 2000),
          },
        });
        emitToUser(io, data.toUserId, "message:receive", msg);
        socket.emit("message:sent", msg);
      },
    );

    // ---- Typing indicator ----
    socket.on("typing", (data: { toUserId: string; isTyping: boolean }) => {
      if (!data?.toUserId) return;
      emitToUser(io, data.toUserId, "typing", {
        fromUserId: userId,
        isTyping: !!data.isTyping,
      });
    });

    // ---- Cambio de estado ----
    socket.on(
      "status:change",
      async (data: { status: "online" | "away" | "busy" }) => {
        if (!["online", "away", "busy"].includes(data?.status)) return;
        await prisma.user.update({
          where: { id: userId },
          data: { status: data.status },
        });
        const watchers2 = await prisma.contact.findMany({
          where: { targetId: userId },
        });
        for (const w of watchers2) {
          emitToUser(io, w.ownerId, "contact:status", {
            userId,
            status: data.status,
          });
        }
      },
    );

    // ---- Desconexión ----
    socket.on("disconnect", async () => {
      removeOnline(userId, socket.id);
      if (!isUserOnline(userId)) {
        await prisma.user.update({
          where: { id: userId },
          data: { status: "offline" },
        });
        const watchers3 = await prisma.contact.findMany({
          where: { targetId: userId },
        });
        for (const w of watchers3) {
          emitToUser(io, w.ownerId, "contact:status", {
            userId,
            status: "offline",
          });
        }
      }
    });
  });
}
