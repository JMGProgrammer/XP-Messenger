import { create } from "zustand";
import { getSocket } from "@/lib/socket";
import { playSound } from "@/lib/sounds";
import { useChatStore } from "./chatStore";
import { useContactsStore } from "./contactsStore";
import { useMessagesStore } from "./messagesStore";

interface NudgeState {
  // Mapa: contactId -> timestamp de cuando dispara el shake (ID único para forzar re-trigger)
  shakingByContact: Record<string, number>;
  listenersReady: boolean;
  cooldownsByContact: Record<string, number>; // contactId -> timestamp último envío

  sendNudge: (toUserId: string) => void;
  attachSocketListeners: () => boolean;
  detachSocketListeners: () => void;
  _triggerShake: (contactId: string) => void;
  canSendNudge: (contactId: string) => boolean;
}

const COOLDOWN_MS = 5000;

export const useNudgeStore = create<NudgeState>()((set, get) => ({
  shakingByContact: {},
  listenersReady: false,
  cooldownsByContact: {},

  canSendNudge(contactId) {
    const last = get().cooldownsByContact[contactId] ?? 0;
    return Date.now() - last >= COOLDOWN_MS;
  },

  sendNudge(toUserId) {
    if (!get().canSendNudge(toUserId)) return;
    const socket = getSocket();
    if (!socket) return;
    socket.emit("nudge:send", { toUserId });
    set({
      cooldownsByContact: {
        ...get().cooldownsByContact,
        [toUserId]: Date.now(),
      },
    });
  },

  _triggerShake(contactId) {
    // Usar Date.now() como "ID único" obliga al efecto de animación a re-disparar
    // aún si el nudge llega cuando ya estaba temblando
    set({
      shakingByContact: {
        ...get().shakingByContact,
        [contactId]: Date.now(),
      },
    });
  },

  attachSocketListeners() {
    if (get().listenersReady) return true;
    const socket = getSocket();
    if (!socket) return false;

    socket.off("nudge:receive");
    socket.off("nudge:sent");
    socket.off("nudge:error");

    // Recibí un nudge de alguien
    socket.on("nudge:receive", (data: { fromUserId: string }) => {
      playSound("nudge");
      get()._triggerShake(data.fromUserId);

      // Si la ventana no está abierta, auto-abrirla para que se vea sacudirse
      const chatStore = useChatStore.getState();
      if (!chatStore.isChatOpen(data.fromUserId)) {
        const sender = useContactsStore
          .getState()
          .contacts.find((c) => c.id === data.fromUserId);
        if (sender) chatStore.openChat(sender);
      }
    });

    // Confirmación de que MI nudge llegó (sacudo mi propia ventana también)
    socket.on("nudge:sent", (data: { toUserId: string }) => {
      get()._triggerShake(data.toUserId);
      playSound("nudge");
    });

    // Error de nudge (cooldown server-side, no son contactos, etc.)
    socket.on("nudge:error", (data: { error: string }) => {
      useMessagesStore.setState({ lastError: data.error });
      setTimeout(() => {
        const cur = useMessagesStore.getState().lastError;
        if (cur === data.error) useMessagesStore.setState({ lastError: null });
      }, 4000);
    });

    set({ listenersReady: true });
    return true;
  },

  detachSocketListeners() {
    const socket = getSocket();
    if (socket) {
      socket.off("nudge:receive");
      socket.off("nudge:sent");
      socket.off("nudge:error");
    }
    set({ listenersReady: false });
  },
}));
