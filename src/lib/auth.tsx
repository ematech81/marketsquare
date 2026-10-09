"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "./api";

export type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "customer" | "vendor" | "admin";
};

export type VendorSummary = {
  businessName: string;
  status: "pending" | "approved" | "rejected" | "suspended";
  rejectionReason?: string;
} | null;

type AuthState = {
  user: User | null;
  vendor: VendorSummary;
  token: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: { name: string; email: string; phone: string; password: string }) => Promise<void>;
  signOut: () => void;
  refresh: () => Promise<void>;
};

const TOKEN_KEY = "sm_token";
const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [vendor, setVendor] = useState<VendorSummary>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (t: string | null) => {
    setToken(t);
    if (!t) {
      setUser(null);
      setVendor(null);
      return;
    }
    try {
      const me = await api<{ user: User; vendor: VendorSummary }>("/auth/me", { token: t });
      setUser(me.user);
      setVendor(me.vendor);
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setUser(null);
      setVendor(null);
    }
  }, []);

  useEffect(() => {
    // Read the saved token after the first render so server and client markup match.
    (async () => {
      const saved = await Promise.resolve(localStorage.getItem(TOKEN_KEY));
      await load(saved);
      setLoading(false);
    })();
  }, [load]);

  const start = async (path: string, body: object) => {
    const res = await api<{ token: string }>(path, { method: "POST", body });
    localStorage.setItem(TOKEN_KEY, res.token);
    await load(res.token);
  };

  const value: AuthState = {
    user,
    vendor,
    token,
    loading,
    signIn: (email, password) => start("/auth/login", { email, password }),
    signUp: (input) => start("/auth/register", input),
    signOut: () => {
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setUser(null);
      setVendor(null);
    },
    refresh: () => load(token),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
