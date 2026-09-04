import { IAuthRepository } from './interfaces';
import { User, AuthSession } from '../../types/auth';
import { STORAGE_KEYS } from './storageKeys';
import { storageAdapter } from './storageAdapter';
import { supabase, isSupabaseConfigured } from '../supabase/supabaseClient';

export interface StoredUser extends User {
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

  async fetchUserByEmailFromSupabase(email: string): Promise<StoredUser | null> {
    const normalized = email.trim().toLowerCase();
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', normalized)
          .maybeSingle();

        if (data && !error) {
          const user: StoredUser = {
            id: data.id,
            fullName: data.full_name,
            email: data.email,
            username: data.username || data.email,
            passwordHash: data.password_hash,
            role: data.role,
            raffleId: data.raffle_id || undefined,
            createdAt: data.created_at,
          };
          // Cache in memory store
          const users = storageAdapter.get<StoredUser[]>(STORAGE_KEYS.USERS, []);
          const existingIdx = users.findIndex((u) => u.id === user.id);
          if (existingIdx >= 0) {
            users[existingIdx] = user;
          } else {
            users.push(user);
          }
          storageAdapter.set(STORAGE_KEYS.USERS, users);
          return user;
        }
      } catch (err) {
        console.warn('Supabase auth query fallback:', err);
      }
    }
    return this.getUserByEmail(email);
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

    const existingIdx = users.findIndex((u) => u.id === user.id || u.email === normalizedEmail);
    if (existingIdx >= 0) {
      users[existingIdx] = newUser;
    } else {
      users.push(newUser);
    }
    storageAdapter.set(STORAGE_KEYS.USERS, users);

    // Sync directly to Supabase cloud table
    if (isSupabaseConfigured()) {
      Promise.resolve(
        supabase
          .from('users')
          .upsert(
            {
              id: newUser.id,
              full_name: newUser.fullName,
              email: normalizedEmail,
              username: normalizedEmail,
              password_hash: passwordHash,
              role: newUser.role || 'admin',
              raffle_id: newUser.raffleId || null,
              created_at: newUser.createdAt || new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'id' }
          )
      )
        .then((res: any) => {
          if (res?.error) {
            console.error('Supabase user sync error:', res.error.message, res.error.details);
          }
        })
        .catch((err: any) => console.error('Supabase user sync error:', err));
    }

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
