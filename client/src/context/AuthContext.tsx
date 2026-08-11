import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { authApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  hasRole: (roles: (UserRole | string)[]) => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('cbcc_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const data = await authApi.getMe();
      setUser(data.user);
      localStorage.setItem('cbcc_user', JSON.stringify(data.user));
    } catch {
      setUser(null);
      localStorage.removeItem('cbcc_token');
      localStorage.removeItem('cbcc_user');
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('cbcc_token');
    if (token) {
      refreshUser().finally(() => setLoading(false));
    } else {
      setUser(null);
      setLoading(false);
    }
  }, []);

  const login = async (username: string, password: string): Promise<User> => {
    const res = await authApi.login(username, password);
    localStorage.setItem('cbcc_token', res.token);
    localStorage.setItem('cbcc_user', JSON.stringify(res.user));
    setUser(res.user);
    return res.user;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      localStorage.removeItem('cbcc_token');
      localStorage.removeItem('cbcc_user');
      setUser(null);
      window.location.href = '/login';
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    await authApi.changePassword(currentPassword, newPassword);
  };

  const hasRole = (roles: (UserRole | string)[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        logout,
        changePassword,
        hasRole,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
