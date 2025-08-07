

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { HrPermissions, CompanyAssignment, ProfileData } from './use-user-data';
import { supabase } from '@/lib/supabase-client';

export type UserRole = 'end-user' | 'hr' | 'consultant' | 'admin' | null;

const AUTH_KEY = 'exitbetter-auth-state';
const ORIGINAL_AUTH_KEY = 'exitbetter-original-auth';

export interface AuthState {
  role: UserRole;
  email?: string;
  userId?: string; // This will now be the UUID from the database
  companyId?: string; // This is the company's UUID
  companyUserId?: string; // The ID of the user within the company_users table
  companyName?: string;
  isPreview?: boolean;
  assignedCompanyNames?: string[];
  permissions?: HrPermissions;
}

interface AuthContextType {
  auth: AuthState | null;
  loading: boolean;
  login: (authData: Pick<AuthState, 'role' | 'email'>, companyIdentifier?: string) => Promise<boolean>;
  logout: () => void;
  startUserView: (user: any) => void;
  stopUserView: () => void;
  switchCompany: (newCompanyName: string) => void;
  updateEmail: (newEmail: string) => void;
  setPermissions: (permissions: HrPermissions) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

  const setPermissions = useCallback((permissions: HrPermissions) => {
    setAuthState(prev => {
        if (!prev) return null;
        if (JSON.stringify(prev.permissions) === JSON.stringify(permissions)) {
            return prev;
        }
        const newAuth = { ...prev, permissions };
        localStorage.setItem(AUTH_KEY, JSON.stringify(newAuth));
        return newAuth;
    });
  }, []);

  const login = useCallback(async (authData: Pick<AuthState, 'role' | 'email'>, companyIdentifier?: string): Promise<boolean> => {
    let finalAuthData: AuthState | null = null;

    if (authData.role === 'end-user' && authData.email && companyIdentifier) {
        const { data: userData, error } = await supabase
            .from('company_users')
            .select(`
                id,
                email,
                company_user_id,
                is_invited,
                companies (id, name)
            `)
            .eq('email', authData.email)
            .eq('company_user_id', companyIdentifier)
            .single();

        if (error || !userData) {
            console.error('End-user login error:', error);
            return false;
        }

        if (!userData.is_invited) {
            console.warn('User not invited yet:', userData.email);
            return false;
        }

        finalAuthData = {
            role: 'end-user',
            email: userData.email,
            userId: userData.id,
            companyUserId: userData.company_user_id,
            companyId: userData.companies?.id,
            companyName: userData.companies?.name
        };

    } else if (authData.role === 'hr' && authData.email) {
        const { data: hrAssignments, error } = await supabase
            .from('company_hr_assignments')
            .select(`
                is_primary,
                permissions,
                companies:companies(id, name)
            `)
            .eq('hr_email', authData.email);

        if (error || !hrAssignments || hrAssignments.length === 0) {
            console.error('HR login error:', error);
            return false;
        }

        const primaryAssignment = hrAssignments.find(a => a.is_primary);
        const defaultAssignment = primaryAssignment || hrAssignments[0];

        finalAuthData = {
            role: 'hr',
            email: authData.email,
            companyId: defaultAssignment.companies?.id,
            companyName: defaultAssignment.companies?.name,
            assignedCompanyNames: hrAssignments.map(a => a.companies?.name || '').filter(Boolean),
            permissions: defaultAssignment.is_primary 
                ? { userManagement: 'write-upload', formEditor: 'write', resources: 'write', companySettings: 'write' }
                : defaultAssignment.permissions as HrPermissions
        };

    } else if ((authData.role === 'admin' || authData.role === 'consultant') && authData.email) {
        const { data: platformUser, error } = await supabase
            .from('platform_users')
            .select('id, email, role')
            .eq('email', authData.email)
            .eq('role', authData.role)
            .single();
        
        if(error || !platformUser) {
            console.error('Platform user login error:', error);
            return false;
        }

        finalAuthData = {
            role: platformUser.role as UserRole,
            email: platformUser.email,
            userId: platformUser.id,
        }
    }

    if (finalAuthData) {
        localStorage.setItem(AUTH_KEY, JSON.stringify(finalAuthData));
        setAuthState(finalAuthData);
        localStorage.removeItem(ORIGINAL_AUTH_KEY);
        return true;
    }
    
    return false;
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(AUTH_KEY);
      localStorage.removeItem(ORIGINAL_AUTH_KEY);
      localStorage.clear(); // Clear all localStorage for the site
      setAuthState(null);
    } catch (error) {
      console.error('Failed to clear auth state from local storage', error);
    }
  }, []);

  const startUserView = useCallback((user: any) => {
    if (!auth || auth.role !== 'hr') return;

    const originalAuth = { ...auth, isPreview: undefined };
    const previewAuth: AuthState = {
        role: 'end-user',
        email: user.email,
        userId: user.id,
        companyUserId: user.company_user_id,
        companyId: user.company_id,
        companyName: auth.companyName,
        isPreview: true,
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
        logout();
      }
    } catch(e) {
      console.error("Failed to stop user view", e);
      logout();
    }
  }, [logout]);
  
  const switchCompany = useCallback(async (companyName: string) => {
    if (!auth || auth.role !== 'hr' || !auth.email) return;

    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .select('id')
      .eq('name', companyName)
      .single();

    if (companyError || !companyData) {
      console.error("Error finding company:", companyError?.message || 'Company not found.');
      return;
    }

    const { data: hrAssignment, error } = await supabase
      .from('company_hr_assignments')
      .select('is_primary, permissions, company_id')
      .eq('hr_email', auth.email)
      .eq('company_id', companyData.id)
      .single();

    if (error || !hrAssignment) {
        console.error("Error switching company:", error?.message || 'Assignment not found.');
        return;
    }
    
    const newPermissions = hrAssignment.is_primary 
        ? { userManagement: 'write-upload' as const, formEditor: 'write' as const, resources: 'write' as const, companySettings: 'write' as const } 
        : hrAssignment.permissions as HrPermissions;

    const newAuth = { ...auth, companyName, companyId: hrAssignment.company_id, permissions: newPermissions };
    localStorage.setItem(AUTH_KEY, JSON.stringify(newAuth));
    setAuthState(newAuth);
  }, [auth]);

  const updateEmail = useCallback(async (newEmail: string) => {
    if (!auth || !auth.userId) return;

    const { error } = await supabase
        .from('user_profiles')
        .update({ 'data.personalEmail': newEmail })
        .eq('user_id', auth.userId);

    if (error) {
        console.error("Error updating email in DB:", error);
    } else {
         const newAuth = { ...auth, email: newEmail }; // Assuming personalEmail is what's displayed
         localStorage.setItem(AUTH_KEY, JSON.stringify(newAuth));
         setAuthState(newAuth);
    }
  }, [auth]);
  
  return (
    <AuthContext.Provider value={{ auth, loading, login, logout, startUserView, stopUserView, switchCompany, updateEmail, setPermissions }}>
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
