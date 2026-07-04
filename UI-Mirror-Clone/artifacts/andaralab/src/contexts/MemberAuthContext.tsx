// Member Auth Context
// State management untuk member authentication

import React, { createContext, useContext, useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/config";
import { DEV_MODE } from "@/lib/dev-auth";

interface MemberUser {
  id: number;
  email: string;
  name: string;
  mobilePhone: string;
  hasRDN: boolean;
  emailVerified?: boolean;
}

interface MemberAuthContextType {
  user: MemberUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, user: MemberUser) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const MemberAuthContext = createContext<MemberAuthContextType | undefined>(undefined);

export function MemberAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MemberUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem("andaralab_member_token");
    const storedUser = localStorage.getItem("andaralab_member_user");

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
        // Verify token with backend
        verifyToken(storedToken);
      } catch (err) {
        console.error("Failed to parse stored user:", err);
        logout();
      }
    }
    setIsLoading(false);
  }, []);

  const verifyToken = async (tkn: string) => {
    try {
      // Skip verification in dev mode for dev tokens
      if (DEV_MODE && tkn.startsWith("dev-token-")) {
        return;
      }

      const response = await fetch(`${API_BASE_URL}/member-auth/me`, {
        headers: {
          Authorization: `Bearer ${tkn}`,
        },
      });

      if (!response.ok) {
        throw new Error("Token verification failed");
      }

      const data = await response.json();
      setUser(data.data);
      localStorage.setItem("andaralab_member_user", JSON.stringify(data.data));
    } catch (err) {
      console.error("Token verification error:", err);
      logout();
    }
  };

  const login = (tkn: string, usr: MemberUser) => {
    setToken(tkn);
    setUser(usr);
    localStorage.setItem("andaralab_member_token", tkn);
    localStorage.setItem("andaralab_member_user", JSON.stringify(usr));
  };

  const logout = async () => {
    // Call logout endpoint
    if (token) {
      try {
        await fetch(`${API_BASE_URL}/member-auth/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (err) {
        console.error("Logout error:", err);
      }
    }

    // Clear state
    setToken(null);
    setUser(null);
    localStorage.removeItem("andaralab_member_token");
    localStorage.removeItem("andaralab_member_user");
  };

  const refreshUser = async () => {
    if (!token) return;
    await verifyToken(token);
  };

  const value: MemberAuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    login,
    logout,
    refreshUser,
  };

  return (
    <MemberAuthContext.Provider value={value}>
      {children}
    </MemberAuthContext.Provider>
  );
}

export function useMemberAuth() {
  const context = useContext(MemberAuthContext);
  if (context === undefined) {
    throw new Error("useMemberAuth must be used within MemberAuthProvider");
  }
  return context;
}
