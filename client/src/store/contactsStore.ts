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
  removeContact: (contactId: string) => Promise<void>;
  attachSocketListeners: () => boolean;
  detachSocketListeners: () => void;
  _setStatus: (userId: string, status: UserStatus) => void;
  _removeLocal: (userId: string) => void;
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

  async removeContact(contactId) {
    await api.removeContact(contactId);
    get()._removeLocal(contactId);
    // Notificar al otro user (si está online) que lo quitamos como contacto
    const socket = getSocket();
    socket?.emit("contact:removed", { removedUserId: contactId });
  },

  _setStatus(userId, status) {
    set({
      contacts: get().contacts.map((c) =>
        c.id === userId ? { ...c, status } : c,
      ),
    });
  },

  _removeLocal(userId) {
    set({ contacts: get().contacts.filter((c) => c.id !== userId) });
  },

  attachSocketListeners() {
    if (get().socketReady) return true;
    const socket = getSocket();
    if (!socket) return false;

    socket.off("contacts:initialStatuses");
    socket.off("contact:status");
    socket.off("contact:removedByOther");

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

    socket.on(
      "contact:status",
      (payload: { userId: string; status: UserStatus }) => {
        get()._setStatus(payload.userId, payload.status);
      },
    );

    // Si otro user me elimina, simplemente refrescamos para mantener
    // consistencia (puede que ya no sea contacto mutuo).
    // No quitamos automáticamente al otro de nuestra lista — la decisión
    // de mantenerlo es del usuario.
    socket.on("contact:removedByOther", () => {
      // Silencioso por ahora; podríamos emitir una notificación si quisiéramos
    });

    set({ socketReady: true });
    return true;
  },

  detachSocketListeners() {
    const socket = getSocket();
    if (socket) {
      socket.off("contacts:initialStatuses");
      socket.off("contact:status");
      socket.off("contact:removedByOther");
    }
    set({ socketReady: false });
  },
}));
