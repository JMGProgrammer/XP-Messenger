import { create } from "zustand";
import type { Contact } from "@/types";

interface ChatWindow {
  contact: Contact;
  // Posición inicial (cada nueva ventana aparece desplazada)
  initialX: number;
  initialY: number;
}

interface ChatState {
  openWindows: ChatWindow[];
  openChat: (contact: Contact) => void;
  closeChat: (contactId: string) => void;
}

let windowCounter = 0;

export const useChatStore = create<ChatState>()((set, get) => ({
  openWindows: [],

  openChat(contact) {
    // Si ya está abierta, no abrir de nuevo (la traemos al frente en Fase C)
    if (get().openWindows.some((w) => w.contact.id === contact.id)) return;

    // Cada ventana nueva aparece un poco desplazada (cascada)
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
  },

  closeChat(contactId) {
    set({
      openWindows: get().openWindows.filter((w) => w.contact.id !== contactId),
    });
  },
}));
