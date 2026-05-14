import { create } from "zustand";
import type { Contact, UserStatus } from "@/types";
import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";

interface ContactsState {
  contacts: Contact[];
  loading: boolean;
  error: string | null;
  socketReady: boolean;

  fetchContacts: () => Promise<void>;
  addContact: (email: string) => Promise<Contact>;
  attachSocketListeners: () => void;
  detachSocketListeners: () => void;
  // Internos
  _setStatus: (userId: string, status: UserStatus) => void;
}

export const useContactsStore = create<ContactsState>()((set, get) => ({
  contacts: [],
  loading: false,
  error: null,
  socketReady: false,

  async fetchContacts() {
    set({ loading: true, error: null });
    try {
      const contacts = await api.getContacts();
      set({ contacts, loading: false });
    } catch (e) {
      set({ loading: false, error: (e as Error).message });
    }
  },

  async addContact(email) {
    const contact = await api.addContact(email);
    set({ contacts: [...get().contacts, contact] });
    return contact;
  },

  _setStatus(userId, status) {
    set({
      contacts: get().contacts.map((c) =>
        c.id === userId ? { ...c, status } : c,
      ),
    });
  },

  attachSocketListeners() {
    const socket = getSocket();
    if (!socket) {
      console.warn("attachSocketListeners: socket no disponible");
      return;
    }

    // Estados iniciales que envía el server cuando me conecto
    socket.on(
      "contacts:initialStatuses",
      (payload: Array<{ userId: string; status: UserStatus }>) => {
        const map = new Map(payload.map((p) => [p.userId, p.status]));
        set({
          contacts: get().contacts.map((c) =>
            map.has(c.id) ? { ...c, status: map.get(c.id)! } : c,
          ),
        });
      },
    );

    // Cambios de estado de contactos en vivo
    socket.on(
      "contact:status",
      (payload: { userId: string; status: UserStatus }) => {
        get()._setStatus(payload.userId, payload.status);
      },
    );

    set({ socketReady: true });
  },

  detachSocketListeners() {
    const socket = getSocket();
    if (!socket) return;
    socket.off("contacts:initialStatuses");
    socket.off("contact:status");
    set({ socketReady: false });
  },
}));
