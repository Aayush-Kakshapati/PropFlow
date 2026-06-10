import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import authService from '../api/authService';

const AuthContext = createContext(null);

const PUBLIC_PATHS = ['/login', '/change-password'];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // ── Apply user safely ─────────────────────────────────────────────
  const applyUser = useCallback((userData, redirect = true) => {
    setUser(userData);
    setIsAuthenticated(true);

    if (
      redirect &&
      userData?.force_password_change &&
      !PUBLIC_PATHS.includes(router.pathname)
    ) {
      router.replace('/change-password');
    }
  }, [router]);

  // ── Hydrate session on refresh ────────────────────────────────────
  useEffect(() => {
    const hydrate = async () => {
      const token = localStorage.getItem('access_token');
      const storedUser = localStorage.getItem('user');

      if (!token) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      setIsAuthenticated(true);

      try {
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }

        const { data } = await authService.getMe();
        localStorage.setItem('user', JSON.stringify(data));
        setUser(data);
      } catch (err) {
        logout();
      } finally {
        setLoading(false);
      }
    };

    hydrate();
  }, []);

  // ── LOGIN ─────────────────────────────────────────────────────────
  const login = useCallback(async (credentials) => {
    const { data } = await authService.login(credentials);

    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);

    const userData = data.user || {};
    localStorage.setItem('user', JSON.stringify(userData));

    setUser(userData);
    setIsAuthenticated(true);

    applyUser(userData);

    return userData;
  }, [applyUser]);

  // ── LOGOUT ────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');

    setUser(null);
    setIsAuthenticated(false);

    router.push('/login');
  }, [router]);

  // ── REFRESH USER ──────────────────────────────────────────────────
  const refreshUser = useCallback(async () => {
    try {
      const { data } = await authService.getMe();
      localStorage.setItem('user', JSON.stringify(data));
      setUser(data);
      return data;
    } catch {
      logout();
    }
  }, [logout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        refreshUser,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ─────────────────────────────────────────────────────────────
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};