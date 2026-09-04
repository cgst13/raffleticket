import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthSession } from '../types/auth';
import { authRepository } from '../services/storage/authRepository';
import { rafflesRepository } from '../services/storage/rafflesRepository';
import { v4 as uuidv4 } from 'uuid';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginAsManager: (raffleId: string, email: string) => Promise<{ success: boolean; error?: string }>;
  register: (fullName: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check existing session
    const session = authRepository.getCurrentSession();
    if (session) {
      setUser(session.user);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      return { success: false, error: 'Please enter both your email address and password.' };
    }

    if (!trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    // Check Supabase first, fallback to memory
    const stored = await authRepository.fetchUserByEmailFromSupabase(trimmedEmail);
    if (!stored) {
      return { success: false, error: 'Invalid email address or password.' };
    }

    if (stored.passwordHash !== password) {
      return { success: false, error: 'Invalid email address or password.' };
    }

    const sessionUser: User = {
      id: stored.id,
      fullName: stored.fullName,
      email: stored.email,
      username: stored.username || stored.email,
      role: stored.role || 'admin',
      raffleId: stored.raffleId,
      createdAt: stored.createdAt,
    };

    const session: AuthSession = {
      user: sessionUser,
      token: uuidv4(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
    authRepository.saveSession(session);
    setUser(session.user);
    return { success: true };
  };

  const loginAsManager = async (raffleId: string, email: string): Promise<{ success: boolean; error?: string }> => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      return { success: false, error: 'Please enter your email address.' };
    }

    const raffle = rafflesRepository.getById(raffleId);
    if (!raffle) {
      return { success: false, error: 'Raffle event not found.' };
    }

    const authorizedManagers = (raffle.managers || []).map((m) => m.trim().toLowerCase());
    if (!authorizedManagers.includes(trimmedEmail)) {
      return {
        success: false,
        error: 'This email address is not registered as a manager for this event. Please ask the organizer to add your email.',
      };
    }

    const managerName = trimmedEmail.split('@')[0];
    const formattedName = managerName.charAt(0).toUpperCase() + managerName.slice(1);

    const managerUser: User = {
      id: `mgr_${trimmedEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
      fullName: `${formattedName} (Manager)`,
      email: trimmedEmail,
      username: trimmedEmail,
      role: 'manager',
      raffleId: raffle.id,
      createdAt: new Date().toISOString(),
    };

    const session: AuthSession = {
      user: managerUser,
      token: uuidv4(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };

    authRepository.saveSession(session);
    setUser(managerUser);
    return { success: true };
  };

  const register = async (fullName: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const trimmedFull = fullName.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedFull || !trimmedEmail || !password) {
      return { success: false, error: 'All fields are required.' };
    }

    if (!trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
      return { success: false, error: 'Please provide a valid email address.' };
    }

    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    const existing = await authRepository.fetchUserByEmailFromSupabase(trimmedEmail);
    if (existing) {
      return { success: false, error: 'An account with this email address already exists. Please sign in.' };
    }

    const newUser: User = {
      id: uuidv4(),
      fullName: trimmedFull,
      email: trimmedEmail,
      username: trimmedEmail,
      role: 'admin',
      createdAt: new Date().toISOString(),
    };

    authRepository.createUser(newUser, password);
    const session: AuthSession = {
      user: newUser,
      token: uuidv4(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
    authRepository.saveSession(session);
    setUser(newUser);
    return { success: true };
  };

  const logout = () => {
    authRepository.clearSession();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, loginAsManager, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
