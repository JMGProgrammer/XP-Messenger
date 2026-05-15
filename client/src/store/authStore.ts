import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, UserStatus } from "@/types";
import { api } from "@/lib/api";
import { connectSocket, disconnectSocket, getSocket } from "@/lib/socket";
import { useChatStore } from "./chatStore";

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<void>;
  logout: () => void;
  hydrate: () => Promise<void>;
  updateUser: (patch: Partial<User>) => void;
  saveProfile: (
    patch: Partial<Pick<User, "personalMessage" | "displayName">>,
  ) => Promise<void>;
  attachStatusListener: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      loading: false,
      error: null,

      async login(email, password) {
        set({ loading: true, error: null });
        try {
          const res = await api.login(email, password);
          localStorage.setItem("token", res.token);
          set({
            user: { ...res.user, status: "online" },
            token: res.token,
            loading: false,
          });
          connectSocket(res.token);
        } catch (e) {
          set({ loading: false, error: (e as Error).message });
          throw e;
        }
      },

      async register(email, password, displayName) {
        set({ loading: true, error: null });
        try {
          const res = await api.register(email, password, displayName);
          localStorage.setItem("token", res.token);
          set({
            user: { ...res.user, status: "online" },
            token: res.token,
            loading: false,
          });
          connectSocket(res.token);
        } catch (e) {
          set({ loading: false, error: (e as Error).message });
          throw e;
        }
      },

      logout() {
        disconnectSocket();
        localStorage.removeItem("token");
        // Limpiar también el estado de chats al cerrar sesión
        useChatStore.getState().reset();
        set({ user: null, token: null, error: null });
      },

      async hydrate() {
        const token = localStorage.getItem("token");
        if (!token) {
          set({ user: null, token: null });
          return;
        }
        try {
          const user = await api.me();
          set({ user: { ...user, status: "online" }, token });
          connectSocket(token);
        } catch {
          localStorage.removeItem("token");
          set({ user: null, token: null });
        }
      },

      updateUser(patch) {
        const cur = get().user;
        if (!cur) return;
        set({ user: { ...cur, ...patch } });
      },

      async saveProfile(patch) {
        try {
          const updated = await api.updateMe(patch);
          const cur = get().user;
          if (!cur) return;
          set({ user: { ...updated, status: cur.status } });
        } catch (e) {
          console.error("saveProfile failed:", e);
          throw e;
        }
      },

      attachStatusListener() {
        const socket = getSocket();
        if (!socket) return;
        socket.off("me:status");
        socket.on("me:status", (data: { status: UserStatus }) => {
          const cur = get().user;
          if (!cur) return;
          set({ user: { ...cur, status: data.status } });
        });
      },
    }),
    {
      name: "xp-messenger-auth",
      partialize: (s) => ({ token: s.token, user: s.user }),
    },
  ),
);
