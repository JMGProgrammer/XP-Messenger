import { create } from "zustand";
import type { Message } from "@/types";
import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { playSound } from "@/lib/sounds";
import { showNotification } from "@/lib/notifications";
import { useChatStore } from "./chatStore";
import { useContactsStore } from "./contactsStore";

interface MessagesState {
  messagesByContact: Record<string, Message[]>;
  typingByContact: Record<string, boolean>;
  loadingByContact: Record<string, boolean>;
  listenersReady: boolean;
  lastError: string | null;

  loadHistory: (otherUserId: string, currentUserId: string) => Promise<void>;
  sendMessage: (toUserId: string, content: string) => void;
  sendTyping: (toUserId: string, isTyping: boolean) => void;
  clearError: () => void;
  attachSocketListeners: (currentUserId: string) => boolean;
  detachSocketListeners: () => void;

  _appendMessage: (msg: Message, currentUserId: string) => void;
  _setTyping: (otherUserId: string, isTyping: boolean) => void;
}

const typingClearTimers = new Map<string, ReturnType<typeof setTimeout>>();

export const useMessagesStore = create<MessagesState>()((set, get) => ({
  messagesByContact: {},
  typingByContact: {},
  loadingByContact: {},
  listenersReady: false,
  lastError: null,

  async loadHistory(otherUserId, _currentUserId) {
    if (get().messagesByContact[otherUserId]) return;

    set({
      loadingByContact: { ...get().loadingByContact, [otherUserId]: true },
    });

    try {
      const messages = await api.getMessages(otherUserId);
      set({
        messagesByContact: {
          ...get().messagesByContact,
          [otherUserId]: messages,
        },
        loadingByContact: { ...get().loadingByContact, [otherUserId]: false },
      });
    } catch {
      set({
        messagesByContact: {
          ...get().messagesByContact,
          [otherUserId]: [],
        },
        loadingByContact: { ...get().loadingByContact, [otherUserId]: false },
      });
    }
  },

  sendMessage(toUserId, content) {
    const trimmed = content.trim();
    if (!trimmed) return;
    const socket = getSocket();
    if (!socket) return;
    socket.emit("message:send", { toUserId, content: trimmed });
    playSound("message-out");
  },

  sendTyping(toUserId, isTyping) {
    const socket = getSocket();
    if (!socket) return;
    socket.emit("typing", { toUserId, isTyping });
  },

  clearError() {
    set({ lastError: null });
  },

  _appendMessage(msg, currentUserId) {
    const otherId =
      msg.senderId === currentUserId ? msg.receiverId : msg.senderId;
    const existing = get().messagesByContact[otherId] ?? [];
    if (existing.some((m) => m.id === msg.id)) return;
    set({
      messagesByContact: {
        ...get().messagesByContact,
        [otherId]: [...existing, msg],
      },
    });
  },

  _setTyping(otherUserId, isTyping) {
    const prev = typingClearTimers.get(otherUserId);
    if (prev) {
      clearTimeout(prev);
      typingClearTimers.delete(otherUserId);
    }
    set({
      typingByContact: { ...get().typingByContact, [otherUserId]: isTyping },
    });
    if (isTyping) {
      const t = setTimeout(() => {
        set({
          typingByContact: { ...get().typingByContact, [otherUserId]: false },
        });
        typingClearTimers.delete(otherUserId);
      }, 4000);
      typingClearTimers.set(otherUserId, t);
    }
  },

  attachSocketListeners(currentUserId) {
    if (get().listenersReady) return true;
    const socket = getSocket();
    if (!socket) return false;

    socket.off("message:receive");
    socket.off("message:sent");
    socket.off("typing");
    socket.off("message:error");

    socket.on("message:receive", (msg: Message) => {
      get()._appendMessage(msg, currentUserId);

      // Notificaciones: sonido siempre, badge + browser notification si el
      // chat con ese contacto no está abierto
      const senderId = msg.senderId;
      const chatStore = useChatStore.getState();

      playSound("message-in");

      if (!chatStore.isChatOpen(senderId)) {
        chatStore.incrementUnread(senderId);

        // Buscar el contacto en el contactsStore para mostrar su nombre
        const sender = useContactsStore
          .getState()
          .contacts.find((c) => c.id === senderId);

        if (sender) {
          showNotification({
            title: `Mensaje de ${sender.displayName}`,
            body:
              msg.content.length > 80
                ? msg.content.slice(0, 80) + "..."
                : msg.content,
            onClick: () => chatStore.openChat(sender),
          });
        }
      }
    });

    socket.on("message:sent", (msg: Message) => {
      get()._appendMessage(msg, currentUserId);
    });

    socket.on("typing", (data: { fromUserId: string; isTyping: boolean }) => {
      get()._setTyping(data.fromUserId, data.isTyping);
    });

    // Error del backend: típicamente "no son contactos mutuos"
    socket.on("message:error", (data: { error: string }) => {
      set({ lastError: data.error });
      // Auto-limpiar después de 5 seg
      setTimeout(() => {
        if (get().lastError === data.error) set({ lastError: null });
      }, 5000);
    });

    set({ listenersReady: true });
    return true;
  },

  detachSocketListeners() {
    const socket = getSocket();
    if (socket) {
      socket.off("message:receive");
      socket.off("message:sent");
      socket.off("typing");
      socket.off("message:error");
    }
    for (const t of typingClearTimers.values()) clearTimeout(t);
    typingClearTimers.clear();
    set({ listenersReady: false });
  },
}));
