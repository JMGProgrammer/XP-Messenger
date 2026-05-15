import type { Server, Socket } from "socket.io";
import { prisma } from "../prisma.js";
import { verifyToken } from "../auth/jwt.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyEventsMap = Record<string, (...args: any[]) => void>;

interface SocketData {
  userId: string;
}

type AuthedSocket = Socket<
  AnyEventsMap,
  AnyEventsMap,
  AnyEventsMap,
  SocketData
>;

const onlineUsers = new Map<string, Set<string>>();

// Cooldown del nudge: userId -> timestamp del último nudge enviado
const lastNudgeAt = new Map<string, number>();
const NUDGE_COOLDOWN_MS = 5000;

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

async function areMutualContacts(
  userA: string,
  userB: string,
): Promise<boolean> {
  const [aHasB, bHasA] = await Promise.all([
    prisma.contact.findUnique({
      where: { ownerId_targetId: { ownerId: userA, targetId: userB } },
    }),
    prisma.contact.findUnique({
      where: { ownerId_targetId: { ownerId: userB, targetId: userA } },
    }),
  ]);
  return !!aHasB && !!bHasA;
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

    const me = await prisma.user.findUnique({ where: { id: userId } });
    const restoredStatus =
      me?.status && me.status !== "offline" ? me.status : "online";
    await prisma.user.update({
      where: { id: userId },
      data: { status: restoredStatus },
    });

    socket.emit("me:status", { status: restoredStatus });

    const watchers = await prisma.contact.findMany({
      where: { targetId: userId },
    });
    for (const w of watchers) {
      emitToUser(io, w.ownerId, "contact:status", {
        userId,
        status: restoredStatus,
      });
    }

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
        const mutual = await areMutualContacts(userId, data.toUserId);
        if (!mutual) {
          socket.emit("message:error", {
            toUserId: data.toUserId,
            error:
              "No podés enviar mensajes a usuarios que no están en tus contactos.",
          });
          return;
        }
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

    // ---- Typing ----
    socket.on(
      "typing",
      async (data: { toUserId: string; isTyping: boolean }) => {
        if (!data?.toUserId) return;
        const mutual = await areMutualContacts(userId, data.toUserId);
        if (!mutual) return;
        emitToUser(io, data.toUserId, "typing", {
          fromUserId: userId,
          isTyping: !!data.isTyping,
        });
      },
    );

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

    // ---- NUDGE (zumbido) ----
    socket.on("nudge:send", async (data: { toUserId: string }) => {
      if (!data?.toUserId) return;

      // Cooldown anti-spam (clave: emisor+receptor)
      const cooldownKey = `${userId}->${data.toUserId}`;
      const now = Date.now();
      const last = lastNudgeAt.get(cooldownKey) ?? 0;
      if (now - last < NUDGE_COOLDOWN_MS) {
        socket.emit("nudge:error", {
          toUserId: data.toUserId,
          error: `Esperá ${Math.ceil((NUDGE_COOLDOWN_MS - (now - last)) / 1000)}s antes de mandar otro zumbido.`,
        });
        return;
      }

      const mutual = await areMutualContacts(userId, data.toUserId);
      if (!mutual) {
        socket.emit("nudge:error", {
          toUserId: data.toUserId,
          error:
            "No podés mandar zumbidos a usuarios que no están en tus contactos.",
        });
        return;
      }

      lastNudgeAt.set(cooldownKey, now);

      // Avisar al receptor
      emitToUser(io, data.toUserId, "nudge:receive", { fromUserId: userId });
      // Confirmar al emisor para que muestre "Enviaste un zumbido"
      socket.emit("nudge:sent", { toUserId: data.toUserId });
    });

    // ---- Eliminar contacto: notificación en vivo ----
    socket.on("contact:removed", (data: { removedUserId: string }) => {
      if (!data?.removedUserId) return;
      // Avisar al otro usuario (si está conectado) que lo quitamos
      emitToUser(io, data.removedUserId, "contact:removedByOther", {
        byUserId: userId,
      });
    });

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
