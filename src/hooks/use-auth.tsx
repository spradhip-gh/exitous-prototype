'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type UserRole = 'end-user' | 'hr' | 'consultant' | null;

const AUTH_KEY = 'exitous-auth-role';

interface AuthContextType {
  role: UserRole;
  loading: boolean;
  setRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedRole = localStorage.getItem(AUTH_KEY) as UserRole;
      if (storedRole) {
        setRoleState(storedRole);
      }
    } catch (error) {
      console.error('Failed to load auth role from local storage', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const setRole = useCallback((newRole: UserRole) => {
    try {
      if (newRole) {
        localStorage.setItem(AUTH_KEY, newRole);
      } else {
        localStorage.removeItem(AUTH_KEY);
      }
      setRoleState(newRole);
    } catch (error) {
      console.error('Failed to save auth role to local storage', error);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ role, loading, setRole }}>
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
