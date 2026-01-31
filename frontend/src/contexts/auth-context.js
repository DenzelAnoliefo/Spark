"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { getMe } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { isOnline } from "@/lib/offline-queue";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mockMode, setMockMode] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("mock_mode") !== "false";
  });
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("mock_mode");
      setMockMode(stored !== "false");
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);
    setOffline(!navigator.onLine);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    async function loadUser() {
      try {
        if (mockMode) {
          const role = typeof window !== "undefined" && localStorage.getItem("mock_user_role");
          if (!role) {
            setUser(null);
            return;
          }
          const me = await getMe(true);
          setUser({ ...me, role });
        } else {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const me = await getMe(false);
            setUser(me);
          } else {
            setUser(null);
          }
        }
      } catch {
        if (mockMode) {
          const role = typeof window !== "undefined" && localStorage.getItem("mock_user_role") || "nurse";
          setUser({ id: "mock", role, full_name: role === "nurse" ? "Nurse Smith" : role === "patient" ? "Maria Garcia" : "Dr. Johnson" });
        } else {
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, [mockMode]);

  const signIn = async (email, password) => {
    if (mockMode) {
      setUser({ id: "mock", role: "nurse", full_name: "Nurse Smith" });
      return;
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const me = await getMe(false);
    setUser(me);
  };

  const signOut = async () => {
    if (mockMode) {
      setUser(null);
      return;
    }
    await supabase.auth.signOut();
    setUser(null);
  };

  const setMockRole = (role) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("mock_user_role", role);
      const names = { nurse: "Nurse Smith", patient: "Maria Garcia", specialist: "Dr. Johnson" };
      setUser({ id: role, role, full_name: names[role] });
    }
  };

  const toggleMockMode = () => {
    const next = !mockMode;
    setMockMode(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("mock_mode", String(next));
      if (next) {
        const role = localStorage.getItem("mock_user_role") || "nurse";
        setMockRole(role);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        mockMode,
        offline,
        signIn,
        signOut,
        setMockRole,
        toggleMockMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
