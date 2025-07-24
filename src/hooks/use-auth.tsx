

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { HrPermissions, CompanyAssignment } from './use-user-data';
import { getCompanyAssignments as getCompanyAssignmentsFromDb } from '@/lib/demo-data';


export type UserRole = 'end-user' | 'hr' | 'consultant' | 'admin' | null;

const AUTH_KEY = 'exitbetter-auth-state';
const ORIGINAL_AUTH_KEY = 'exitbetter-original-auth';

export interface AuthState {
  role: UserRole;
  email?: string;
  companyId?: string;
  companyName?: string;
  isPreview?: boolean;
  assignedCompanyNames?: string[];
  permissions?: HrPermissions;
}

interface AuthContextType {
  auth: AuthState | null;
  loading: boolean;
  login: (authData: AuthState) => void;
  logout: () => void;
  startUserView: () => void;
  stopUserView: () => void;
  switchCompany: (newCompanyName: string) => void;
  updateEmail: (newEmail: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getPermissionsForHr = (email: string, companyName: string, assignments: CompanyAssignment[]): HrPermissions | undefined => {
    const assignment = assignments.find(a => a.companyName === companyName);
    if (!assignment || !assignment.hrManagers) return undefined;
    const manager = assignment.hrManagers.find(hr => hr.email.toLowerCase() === email.toLowerCase());
    
    if (manager?.isPrimary) {
        return {
            userManagement: 'write-upload',
            formEditor: 'write',
            resources: 'write',
            companySettings: 'write'
        };
    }
    return manager?.permissions;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuthState] = useState<AuthState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedAuth = localStorage.getItem(AUTH_KEY);
      if (storedAuth) {
        let authData = JSON.parse(storedAuth);
        setAuthState(authData);
      }
    } catch (error) {
      console.error('Failed to load auth state from local storage', error);
      localStorage.removeItem(AUTH_KEY);
    } finally {
      setLoading(false);
    }
  }, []);
  
  const login = useCallback((authData: AuthState) => {
    try {
      let finalAuthData = { ...authData };
      if (authData.role === 'hr' && authData.email && authData.companyName) {
        const assignments = getCompanyAssignmentsFromDb();
        finalAuthData.permissions = getPermissionsForHr(authData.email, authData.companyName, assignments);
      }
      localStorage.setItem(AUTH_KEY, JSON.stringify(finalAuthData));
      setAuthState(finalAuthData);
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
      localStorage.removeItem('exitbetter-custom-deadlines');
      localStorage.removeItem('exitbetter-recommendations');
      // and preview data
      localStorage.removeItem('exitbetter-profile-hr-preview');
      localStorage.removeItem('exitbetter-assessment-hr-preview');
      localStorage.removeItem('exitbetter-completed-tasks-hr-preview');
      localStorage.removeItem('exitbetter-task-date-overrides-hr-preview');
      localStorage.removeItem('exitbetter-custom-deadlines-hr-preview');
      localStorage.removeItem('exitbetter-recommendations-hr-preview');


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
  
  const switchCompany = useCallback((newCompanyName: string) => {
    if (auth?.role === 'hr' && auth.email && auth.assignedCompanyNames?.includes(newCompanyName)) {
        const assignments = getCompanyAssignmentsFromDb();
        const newPermissions = getPermissionsForHr(auth.email, newCompanyName, assignments);
        const newAuth = { ...auth, companyName: newCompanyName, permissions: newPermissions };
        localStorage.setItem(AUTH_KEY, JSON.stringify(newAuth));
        setAuthState(newAuth);
    }
  }, [auth]);

  const updateEmail = useCallback((newEmail: string) => {
    if (auth) {
        const newAuth = { ...auth, email: newEmail };
        localStorage.setItem(AUTH_KEY, JSON.stringify(newAuth));
        setAuthState(newAuth);
    }
  }, [auth]);

  return (
    <AuthContext.Provider value={{ auth, loading, login, logout, startUserView, stopUserView, switchCompany, updateEmail }}>
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
