import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '../types';
import * as authService from '../services/authService';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // On load, if a token is already stored, confirm it's still valid against the real backend
    // (rather than trusting stale localStorage blindly) before treating the user as signed in.
    const token = localStorage.getItem('wf_token');
    if (!token) { setLoading(false); return; }
    authService.fetchMe()
      .then(setUser)
      .catch(() => authService.logout())
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const expired = () => setUser(null);
    window.addEventListener('wf:auth-expired', expired);
    return () => window.removeEventListener('wf:auth-expired', expired);
  }, []);

  async function login(email: string, password: string) {
    setError(null);
    try {
      const res = await authService.login(email, password);
      setUser(res.user);
    } catch (e: any) {
      setError(e.message || 'Login failed.');
      throw e;
    }
  }

  async function register(name: string, email: string, password: string) {
    setError(null);
    try {
      const res = await authService.register(name, email, password);
      setUser(res.user);
    } catch (e: any) {
      setError(e.message || 'Registration failed.');
      throw e;
    }
  }

  function logout() {
    authService.logout();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
