/**
 * AuthContext — real authentication + role-switching for CityPulse.
 *
 * Preserves the existing role/setRole/userName/userInitials/departmentName
 * interface so all existing components keep working. Adds real login,
 * signup, logout, continueAsGuest, and session persistence.
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { UserRole } from '../types/civic';
import {
  register as apiRegister,
  login as apiLogin,
  logout as apiLogout,
  getCurrentUser,
  getStoredToken,
  clearStoredToken,
  type AuthUser,
  type RegisterPayload,
  type LoginPayload,
} from '../services/authApi';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface AuthContextType {
  // Existing interface (preserved for backward compatibility)
  role: UserRole;
  setRole: (role: UserRole) => void;
  userName: string;
  userInitials: string;
  departmentName?: string;

  // New auth interface
  user: AuthUser | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  isLoading: boolean;
  authError: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, confirmPassword: string) => Promise<void>;
  logout: () => void;
  continueAsGuest: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/* ------------------------------------------------------------------ */
/* Role configs (preserved from existing code)                         */
/* ------------------------------------------------------------------ */

const roleConfigs: Record<UserRole, { name: string; initials: string; dept?: string }> = {
  resident: {
    name: 'Resident',
    initials: 'RE',
    dept: 'Civic Community Member',
  },
  staff: {
    name: 'Inspector M. Kulkarni',
    initials: 'MK',
    dept: 'Municipal Control Room & Ward Ops',
  },
  responder: {
    name: 'Captain S. Deshmukh',
    initials: 'SD',
    dept: 'Fire & Emergency Disaster Response',
  },
  admin: {
    name: 'Civic Admin Console',
    initials: 'CA',
    dept: 'Smart City Data Mission',
  },
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

/* ------------------------------------------------------------------ */
/* Provider                                                            */
/* ------------------------------------------------------------------ */

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole>('resident');

  // On mount, check for existing session
  useEffect(() => {
    const token = getStoredToken();
    if (token) {
      getCurrentUser()
        .then((u) => {
          setUser(u);
          setIsGuest(false);
        })
        .catch(() => {
          // Token expired or invalid — clear it
          clearStoredToken();
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const payload: LoginPayload = { email, password };
      const res = await apiLogin(payload);
      setUser(res.user);
      setIsGuest(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed. Please try again.';
      setAuthError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string, confirmPassword: string) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const payload: RegisterPayload = {
        name,
        email,
        password,
        confirm_password: confirmPassword,
      };
      const res = await apiRegister(payload);
      setUser(res.user);
      setIsGuest(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setAuthError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    void apiLogout();
    setUser(null);
    setIsGuest(false);
    setAuthError(null);
  }, []);

  const continueAsGuest = useCallback(() => {
    setUser(null);
    setIsGuest(true);
    setAuthError(null);
  }, []);

  const clearError = useCallback(() => setAuthError(null), []);

  // Compute display values
  const isAuthenticated = !!user;
  // User display: use real name for authenticated users, role config for guests
  const currentRoleConfig = roleConfigs[role];
  const userName = user ? user.name : (isGuest ? 'Guest Explorer' : currentRoleConfig.name);
  const userInitials = user ? getInitials(user.name) : (isGuest ? 'GE' : currentRoleConfig.initials);
  const departmentName = user
    ? 'CityPulse Citizen'
    : (isGuest ? 'Guest · Demo Mode' : currentRoleConfig.dept);

  return (
    <AuthContext.Provider
      value={{
        // Existing interface
        role,
        setRole,
        userName,
        userInitials,
        departmentName,

        // New auth interface
        user,
        isAuthenticated,
        isGuest,
        isLoading,
        authError,
        login,
        signup,
        logout,
        continueAsGuest,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Helper to check if the user has dashboard access (authenticated OR guest).
 */
export function useHasAccess(): boolean {
  const { isAuthenticated, isGuest } = useAuth();
  return isAuthenticated || isGuest;
}
