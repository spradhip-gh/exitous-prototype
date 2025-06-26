'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type UserRole = 'end-user' | 'hr' | 'consultant' | 'admin' | null;

const AUTH_KEY = 'exitbetter-auth-state';

export interface AuthState {
  role: UserRole;
  email?: string;
  companyId?: string;
  companyName?: string;
}

interface AuthContextType {
  auth: AuthState | null;
  loading: boolean;
  login: (authData: AuthState) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuthState] = useState<AuthState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedAuth = localStorage.getItem(AUTH_KEY);
      if (storedAuth) {
        setAuthState(JSON.parse(storedAuth));
      }
    } catch (error) {
      console.error('Failed to load auth state from local storage', error);
    } finally {
      setLoading(false);
    }
  }, []);
  
  const login = useCallback((authData: AuthState) => {
    try {
      localStorage.setItem(AUTH_KEY, JSON.stringify(authData));
      setAuthState(authData);
    } catch (error) {
      console.error('Failed to save auth state to local storage', error);
    }
  }, []);
  
  const logout = useCallback(() => {
    try {
      localStorage.removeItem(AUTH_KEY);
      // also clear user data on logout
      localStorage.removeItem('exitbetter-profile');
      localStorage.removeItem('exitbetter-assessment');
      localStorage.removeItem('exitbetter-completed-tasks');
      localStorage.removeItem('exitbetter-task-date-overrides');
      setAuthState(null);
    } catch (error) {
      console.error('Failed to clear auth state from local storage', error);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ auth, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
