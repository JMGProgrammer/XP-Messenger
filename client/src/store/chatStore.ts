import { create } from "zustand";
import type { Contact } from "@/types";
import { api } from "@/lib/api";

interface ChatWindow {
  contact: Contact;
  initialX: number;
  initialY: number;
}

interface ChatState {
  openWindows: ChatWindow[];
  unreadByContact: Record<string, number>;

  /** Carga los unread counts desde el backend (al loguear / hidratar) */
  loadUnreadCounts: () => Promise<void>;
  openChat: (contact: Contact) => void;
  closeChat: (contactId: string) => void;
  /** Marca como leído tanto local como en backend */
  markAsRead: (contactId: string) => void;
  /** Marca solo local (sin pegar al backend) - útil al recibir mensaje propio */
  markAsReadLocal: (contactId: string) => void;
  incrementUnread: (contactId: string) => void;
  isChatOpen: (contactId: string) => boolean;
  /** Resetea todo (útil al hacer logout) */
  reset: () => void;
}

let windowCounter = 0;

export const useChatStore = create<ChatState>()((set, get) => ({
  openWindows: [],
  unreadByContact: {},

  async loadUnreadCounts() {
    try {
      const counts = await api.getUnreadCounts();
      set({ unreadByContact: counts });
    } catch (e) {
      console.warn("Failed to load unread counts:", e);
    }
  },

  openChat(contact) {
    if (get().openWindows.some((w) => w.contact.id === contact.id)) {
      get().markAsRead(contact.id);
      return;
    }

    const offset = windowCounter * 30;
    windowCounter = (windowCounter + 1) % 8;

    set({
      openWindows: [
        ...get().openWindows,
        {
          contact,
          initialX: 350 + offset,
          initialY: 80 + offset,
        },
      ],
    });

    get().markAsRead(contact.id);
  },

  closeChat(contactId) {
    set({
      openWindows: get().openWindows.filter((w) => w.contact.id !== contactId),
    });
  },

  markAsRead(contactId) {
    const current = get().unreadByContact[contactId] ?? 0;
    if (current === 0) return;

    // Optimistic local
    get().markAsReadLocal(contactId);

    // Persistir en backend (fire and forget)
    api.markAsRead(contactId).catch((e) => {
      console.warn("markAsRead backend failed:", e);
    });
  },

  markAsReadLocal(contactId) {
    const next = { ...get().unreadByContact };
    delete next[contactId];
    set({ unreadByContact: next });
  },

  incrementUnread(contactId) {
    const current = get().unreadByContact[contactId] ?? 0;
    set({
      unreadByContact: { ...get().unreadByContact, [contactId]: current + 1 },
    });
  },

  isChatOpen(contactId) {
    return get().openWindows.some((w) => w.contact.id === contactId);
  },

  reset() {
    set({ openWindows: [], unreadByContact: {} });
    windowCounter = 0;
  },
}));

export function getTotalUnread(unreadMap: Record<string, number>): number {
  return Object.values(unreadMap).reduce((sum, n) => sum + n, 0);
}
