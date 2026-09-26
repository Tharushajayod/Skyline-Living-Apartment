import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, UserRole } from '@/shared/types';
import { apiClient } from '@/shared/services/api';

interface AuthResponse {
  token: string;
  user: User;
}

interface AuthContextValue {
  user: User | null;
  login: (email: string, password: string) => Promise<User | null>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<boolean>;
  logout: () => void;
  loginAs: (role: UserRole) => Promise<User | null>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // Restore session from JWT on mount
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      apiClient.get<User>('/auth/me')
        .then((userData) => {
          setUser(userData);
        })
        .catch(() => {
          localStorage.removeItem('auth_token');
          setUser(null);
        });
    }
  }, []);

  const login = async (email: string, password: string): Promise<User | null> => {
    try {
      const data = await apiClient.post<AuthResponse>('/auth/login', {
        email: email.trim(),
        password,
      });
      if (data && data.token) {
        localStorage.setItem('auth_token', data.token);
        setUser(data.user);
        return data.user;
      }
      return null;
    } catch (err) {
      console.error('Login error:', err);
      return null;
    }
  };

  const register = async (name: string, email: string, password: string, phone?: string): Promise<boolean> => {
    try {
      const data = await apiClient.post<AuthResponse>('/auth/register', {
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone || '',
      });
      if (data && data.token) {
        localStorage.setItem('auth_token', data.token);
        setUser(data.user);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Register error:', err);
      return false;
    }
  };

  const loginAs = async (role: UserRole): Promise<User | null> => {
    if (role === 'admin') {
      return login('admin@skylineliving.com', 'admin123');
    } else if (role === 'staff') {
      return login('staff@skylineliving.com', 'staff123');
    } else {
      return login('sarah.chen@email.com', 'customer123');
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loginAs, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}
