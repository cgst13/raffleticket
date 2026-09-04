export type UserRole = 'admin' | 'manager';

export interface User {
  id: string;
  fullName: string;
  email: string;
  username?: string;
  role?: UserRole;
  raffleId?: string; // If role === 'manager', indicates active assigned event
  createdAt: string;
}

export interface AuthSession {
  user: User;
  token: string;
  expiresAt: string;
}
