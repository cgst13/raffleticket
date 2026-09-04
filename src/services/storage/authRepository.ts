import { IAuthRepository } from './interfaces';
import { User, AuthSession } from '../../types/auth';
import { STORAGE_KEYS } from './storageKeys';
import { storageAdapter } from './storageAdapter';

interface StoredUser extends User {
  passwordHash: string;
}

export class LocalStorageAuthRepository implements IAuthRepository {
  getCurrentSession(): AuthSession | null {
    const session = storageAdapter.get<AuthSession | null>(STORAGE_KEYS.SESSION, null);
    if (!session) return null;

    // Check expiry
    if (new Date(session.expiresAt) < new Date()) {
      this.clearSession();
      return null;
    }
    return session;
  }

  saveSession(session: AuthSession): void {
    storageAdapter.set(STORAGE_KEYS.SESSION, session);
  }

  clearSession(): void {
    storageAdapter.remove(STORAGE_KEYS.SESSION);
  }

  getUserByEmail(email: string): StoredUser | null {
    const users = storageAdapter.get<StoredUser[]>(STORAGE_KEYS.USERS, []);
    const normalized = email.trim().toLowerCase();
    return users.find((u) => (u.email || u.username || '').toLowerCase() === normalized) || null;
  }

  getUserByUsername(username: string): StoredUser | null {
    return this.getUserByEmail(username);
  }

  createUser(user: User, passwordHash: string): User {
    const users = storageAdapter.get<StoredUser[]>(STORAGE_KEYS.USERS, []);
    const normalizedEmail = (user.email || user.username || '').trim().toLowerCase();
    const newUser: StoredUser = {
      ...user,
      email: normalizedEmail,
      username: normalizedEmail,
      passwordHash,
    };
    users.push(newUser);
    storageAdapter.set(STORAGE_KEYS.USERS, users);
    return {
      id: user.id,
      fullName: user.fullName,
      email: normalizedEmail,
      username: normalizedEmail,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  getAllUsers(): User[] {
    const users = storageAdapter.get<StoredUser[]>(STORAGE_KEYS.USERS, []);
    return users.map(({ id, fullName, email, username, role, createdAt }) => ({
      id,
      fullName,
      email: email || username || '',
      username: username || email || '',
      role,
      createdAt,
    }));
  }
}

export const authRepository = new LocalStorageAuthRepository();
