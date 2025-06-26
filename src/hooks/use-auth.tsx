'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type UserRole = 'end-user' | 'hr' | 'consultant' | null;

const AUTH_KEY = 'exitous-auth-state';

interface AuthState {
  role: UserRole;
  email?: string;
  companyId?: string;
  companyName?: string;
}

interface AuthContextType {
  auth: AuthState | null;
  loading: boolean;
  setRole: (role: UserRole) => void; // For simple roles like HR/Consultant
  login: (email: string, companyId: string, companyName: string) => void; // For end-user
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

  const setRole = useCallback((role: UserRole) => {
    try {
      const newAuthState: AuthState = { role };
      localStorage.setItem(AUTH_KEY, JSON.stringify(newAuthState));
      setAuthState(newAuthState);
    } catch (error) {
      console.error('Failed to save auth role to local storage', error);
    }
  }, []);
  
  const login = useCallback((email: string, companyId: string, companyName: string) => {
    try {
      const newAuthState: AuthState = { role: 'end-user', email, companyId, companyName };
      localStorage.setItem(AUTH_KEY, JSON.stringify(newAuthState));
      setAuthState(newAuthState);
    } catch (error) {
      console.error('Failed to save auth state to local storage', error);
    }
  }, []);
  
  const logout = useCallback(() => {
    try {
      localStorage.removeItem(AUTH_KEY);
      // also clear user data on logout
      localStorage.removeItem('exitous-profile');
      localStorage.removeItem('exitous-assessment');
      localStorage.removeItem('exitous-completed-tasks');
      localStorage.removeItem('exitous-task-date-overrides');
      setAuthState(null);
    } catch (error) {
      console.error('Failed to clear auth state from local storage', error);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ auth, loading, setRole, login, logout }}>
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
