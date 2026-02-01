"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { getMe } from "@/lib/api";
import { supabase } from "@/lib/supabase";

const AuthContext = createContext(null);

// Demo identities when mock mode is OFF (no Supabase Auth required)
export const DEMO_NURSE_ID = "00000000-0000-0000-0000-000000000001";
export const DEMO_SPECIALIST_ID = "00000000-0000-0000-0000-000000000002";

const STORAGE_SELECTED_PATIENT_ID = "selectedPatientId";
const STORAGE_SELECTED_PATIENT_NAME = "selectedPatientName";

function getDemoUser(role) {
  if (role === "nurse") {
    return { id: DEMO_NURSE_ID, role: "nurse", full_name: "Demo Nurse" };
  }
  if (role === "specialist") {
    return { id: DEMO_SPECIALIST_ID, role: "specialist", full_name: "Demo Specialist" };
  }
  if (role === "patient") {
    const id =
      typeof window !== "undefined" ? localStorage.getItem(STORAGE_SELECTED_PATIENT_ID) : null;
    const full_name =
      typeof window !== "undefined"
        ? localStorage.getItem(STORAGE_SELECTED_PATIENT_NAME) || "Select patient"
        : "Select patient";
    return { id: id || null, role: "patient", full_name };
  }
  return { id: DEMO_NURSE_ID, role: "nurse", full_name: "Demo Nurse" };
}

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
          // MVP: no login required — use demo identities from stored role
          const role =
            (typeof window !== "undefined" && localStorage.getItem("mock_user_role")) || "nurse";
          setUser(getDemoUser(role));
        }
      } catch {
        if (mockMode) {
          const role =
            (typeof window !== "undefined" && localStorage.getItem("mock_user_role")) || "nurse";
          setUser({
            id: "mock",
            role,
            full_name:
              role === "nurse" ? "Nurse Smith" : role === "patient" ? "Maria Garcia" : "Dr. Johnson",
          });
        } else {
          const role =
            (typeof window !== "undefined" && localStorage.getItem("mock_user_role")) || "nurse";
          setUser(getDemoUser(role));
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
      if (mockMode) {
        const names = { nurse: "Nurse Smith", patient: "Maria Garcia", specialist: "Dr. Johnson" };
        setUser({ id: role, role, full_name: names[role] });
      } else {
        setUser(getDemoUser(role));
      }
    }
  };

  const setSelectedPatientId = (patientId, fullName) => {
    if (typeof window !== "undefined") {
      if (patientId != null) {
        localStorage.setItem(STORAGE_SELECTED_PATIENT_ID, patientId);
        localStorage.setItem(STORAGE_SELECTED_PATIENT_NAME, fullName || "Patient");
      } else {
        localStorage.removeItem(STORAGE_SELECTED_PATIENT_ID);
        localStorage.removeItem(STORAGE_SELECTED_PATIENT_NAME);
      }
      const role = localStorage.getItem("mock_user_role");
      if (role === "patient") {
        setUser({
          id: patientId || null,
          role: "patient",
          full_name: fullName || (patientId ? "Patient" : "Select patient"),
        });
      }
    }
  };

  const toggleMockMode = () => {
    const next = !mockMode;
    setMockMode(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("mock_mode", String(next));
      const role = localStorage.getItem("mock_user_role") || "nurse";
      if (next) {
        const names = { nurse: "Nurse Smith", patient: "Maria Garcia", specialist: "Dr. Johnson" };
        setUser({ id: role, role, full_name: names[role] });
      } else {
        setUser(getDemoUser(role));
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
        setSelectedPatientId,
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
