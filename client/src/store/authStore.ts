import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types";
import { api } from "@/lib/api";
import { connectSocket, disconnectSocket } from "@/lib/socket";

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
          // Asumir online optimistamente (el server lo marca online al conectar el socket)
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
          set({ user: res.user, token: res.token, loading: false });
          connectSocket(res.token);
        } catch (e) {
          set({ loading: false, error: (e as Error).message });
          throw e;
        }
      },

      logout() {
        disconnectSocket();
        localStorage.removeItem("token");
        set({ user: null, token: null, error: null });
      },

      async hydrate() {
        // Al refrescar la página, si hay token, revalido y reconecto socket
        const token = localStorage.getItem("token");
        if (!token) {
          set({ user: null, token: null });
          return;
        }
        try {
          const user = await api.me();
          set({ user, token });
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
    }),
    {
      name: "xp-messenger-auth",
      partialize: (s) => ({ token: s.token, user: s.user }),
    },
  ),
);
