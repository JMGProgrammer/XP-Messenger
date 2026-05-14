import type { AuthResponse, Contact, Message, User } from "@/types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

function getToken(): string | null {
  return localStorage.getItem("token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) ?? {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(res.status, data?.error ?? `HTTP ${res.status}`);
  }
  return data as T;
}

export const api = {
  // ----- Auth -----
  login(email: string, password: string) {
    return request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  register(email: string, password: string, displayName: string) {
    return request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, displayName }),
    });
  },

  me() {
    return request<User>("/auth/me");
  },

  // ----- Contacts -----
  getContacts() {
    return request<Contact[]>("/contacts");
  },

  addContact(email: string) {
    return request<Contact>("/contacts", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  // ----- Messages -----
  getMessages(otherUserId: string) {
    return request<Message[]>(`/messages/${otherUserId}`);
  },
};

export { ApiError };
