
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type UserRole = 'end-user' | 'hr' | 'consultant' | 'admin' | null;

const AUTH_KEY = 'exitbetter-auth-state';
const ORIGINAL_AUTH_KEY = 'exitbetter-original-auth';

export interface AuthState {
  role: UserRole;
  email?: string;
  companyId?: string;
  companyName?: string;
  isPreview?: boolean;
}

interface AuthContextType {
  auth: AuthState | null;
  loading: boolean;
  login: (authData: AuthState) => void;
  logout: () => void;
  startUserView: () => void;
  stopUserView: () => void;
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
      // If parsing fails, clear the broken key
      localStorage.removeItem(AUTH_KEY);
    } finally {
      setLoading(false);
    }
  }, []);
  
  const login = useCallback((authData: AuthState) => {
    try {
      localStorage.setItem(AUTH_KEY, JSON.stringify(authData));
      setAuthState(authData);
      localStorage.removeItem(ORIGINAL_AUTH_KEY);
    } catch (error) {
      console.error('Failed to save auth state to local storage', error);
    }
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(AUTH_KEY);
      localStorage.removeItem(ORIGINAL_AUTH_KEY);
      // also clear user data on logout
      localStorage.removeItem('exitbetter-profile');
      localStorage.removeItem('exitbetter-assessment');
      localStorage.removeItem('exitbetter-completed-tasks');
      localStorage.removeItem('exitbetter-task-date-overrides');
      // and preview data
      localStorage.removeItem('exitbetter-profile-hr-preview');
      localStorage.removeItem('exitbetter-assessment-hr-preview');
      localStorage.removeItem('exitbetter-completed-tasks-hr-preview');
      localStorage.removeItem('exitbetter-task-date-overrides-hr-preview');

      setAuthState(null);
    } catch (error) {
      console.error('Failed to clear auth state from local storage', error);
    }
  }, []);

  const startUserView = useCallback(() => {
    if (!auth || auth.role !== 'hr') return;

    const originalAuth = { ...auth, isPreview: undefined };
    const previewAuth: AuthState = {
        ...auth,
        role: 'end-user',
        isPreview: true,
        companyId: `PREVIEW-${auth.email}` 
    };
    
    try {
      localStorage.setItem(ORIGINAL_AUTH_KEY, JSON.stringify(originalAuth));
      localStorage.setItem(AUTH_KEY, JSON.stringify(previewAuth));
      setAuthState(previewAuth);
    } catch (e) {
      console.error("Failed to start user view", e);
    }
  }, [auth]);

  const stopUserView = useCallback(() => {
    try {
      const originalAuthJson = localStorage.getItem(ORIGINAL_AUTH_KEY);
      if (originalAuthJson) {
        const originalAuth = JSON.parse(originalAuthJson);
        localStorage.setItem(AUTH_KEY, JSON.stringify(originalAuth));
        localStorage.removeItem(ORIGINAL_AUTH_KEY);
        setAuthState(originalAuth);
      } else {
        // Failsafe in case original auth is lost, just log out.
        logout();
      }
    } catch(e) {
      console.error("Failed to stop user view", e);
      logout();
    }
  }, [logout]);


  return (
    <AuthContext.Provider value={{ auth, loading, login, logout, startUserView, stopUserView }}>
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
