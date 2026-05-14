export type UserStatus = "online" | "away" | "busy" | "offline";

export interface User {
  id: string;
  email: string;
  displayName: string;
  personalMessage: string;
  status: UserStatus;
}

export interface Contact {
  id: string;
  email: string;
  displayName: string;
  personalMessage: string;
  status: UserStatus;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
