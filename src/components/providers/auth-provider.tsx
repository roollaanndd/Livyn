"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl: string | null;
  themePreference: string;
  fontSize: string;
  emailVerified: boolean;
};

type AuthContextValue = {
  user: CurrentUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  setUser: (u: CurrentUser | null) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store", signal: controller.signal });
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
      } else {
        const refreshRes = await fetch("/api/auth/refresh", { method: "POST", signal: controller.signal });
        if (refreshRes.ok) {
          const retryRes = await fetch("/api/auth/me", { cache: "no-store", signal: controller.signal });
          const retryData = await retryRes.json();
          setUser(retryData.user ?? null);
        } else {
          setUser(null);
        }
      }
    } catch {
      setUser(null);
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount session check, not derivable from props/state
    refresh();
  }, [refresh]);

  return (
    <AuthContext.Provider value={{ user, loading, refresh, setUser }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
