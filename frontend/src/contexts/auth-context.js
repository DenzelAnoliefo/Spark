"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { getMe } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { DEMO_NURSES, SPECIALIST_BY_SPECIALTY, SPECIALTIES } from "@/lib/mockData";

const AuthContext = createContext(null);

// Demo identities when mock mode is OFF (no Supabase Auth required)
export const DEMO_NURSE_ID = "00000000-0000-0000-0000-000000000001";
export const DEMO_SPECIALIST_ID = "00000000-0000-0000-0000-000000000002";

const STORAGE_SELECTED_PATIENT_ID = "selectedPatientId";
const STORAGE_SELECTED_PATIENT_NAME = "selectedPatientName";
const STORAGE_SELECTED_NURSE_ID = "selectedNurseId";
const STORAGE_SELECTED_NURSE_NAME = "selectedNurseName";
const STORAGE_SELECTED_SPECIALIST_KEY = "selectedSpecialistKey";
const STORAGE_SELECTED_SPECIALIST_NAME = "selectedSpecialistName";
const STORAGE_SELECTED_SPECIALIST_SPECIALTY = "selectedSpecialistSpecialty";

function getDemoUser(role) {
  if (typeof window === "undefined") {
    return { id: DEMO_NURSE_ID, role: "nurse", full_name: "Demo Nurse" };
  }
  if (role === "nurse") {
    const id = localStorage.getItem(STORAGE_SELECTED_NURSE_ID);
    const full_name = localStorage.getItem(STORAGE_SELECTED_NURSE_NAME);
    return {
      id: id || DEMO_NURSES[0]?.id || DEMO_NURSE_ID,
      role: "nurse",
      full_name: full_name || DEMO_NURSES[0]?.name || "Demo Nurse",
    };
  }
  if (role === "specialist") {
    const key = localStorage.getItem(STORAGE_SELECTED_SPECIALIST_KEY);
    const name = localStorage.getItem(STORAGE_SELECTED_SPECIALIST_NAME);
    const specialty = localStorage.getItem(STORAGE_SELECTED_SPECIALIST_SPECIALTY);
    const firstSpecialty = SPECIALTIES[0];
    return {
      id: key || firstSpecialty,
      role: "specialist",
      full_name: name || (firstSpecialty && SPECIALIST_BY_SPECIALTY[firstSpecialty]) || "Demo Specialist",
      specialty: specialty || firstSpecialty,
    };
  }
  if (role === "patient") {
    const id = localStorage.getItem(STORAGE_SELECTED_PATIENT_ID);
    const full_name = localStorage.getItem(STORAGE_SELECTED_PATIENT_NAME) || "Select patient";
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
        if (role === "nurse" && !localStorage.getItem(STORAGE_SELECTED_NURSE_ID) && DEMO_NURSES[0]) {
          localStorage.setItem(STORAGE_SELECTED_NURSE_ID, DEMO_NURSES[0].id);
          localStorage.setItem(STORAGE_SELECTED_NURSE_NAME, DEMO_NURSES[0].name);
        }
        if (role === "specialist" && !localStorage.getItem(STORAGE_SELECTED_SPECIALIST_KEY) && SPECIALTIES[0]) {
          const spec = SPECIALTIES[0];
          localStorage.setItem(STORAGE_SELECTED_SPECIALIST_KEY, spec);
          localStorage.setItem(STORAGE_SELECTED_SPECIALIST_NAME, SPECIALIST_BY_SPECIALTY[spec] || "");
          localStorage.setItem(STORAGE_SELECTED_SPECIALIST_SPECIALTY, spec);
        }
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

  const setSelectedNurseId = (nurseId, nurseName) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_SELECTED_NURSE_ID, nurseId);
      localStorage.setItem(STORAGE_SELECTED_NURSE_NAME, nurseName || "");
      const role = localStorage.getItem("mock_user_role");
      if (role === "nurse") {
        setUser(getDemoUser("nurse"));
      }
    }
  };

  const setSelectedSpecialist = (specialtyKey, specialistName, specialty) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_SELECTED_SPECIALIST_KEY, specialtyKey || "");
      localStorage.setItem(STORAGE_SELECTED_SPECIALIST_NAME, specialistName || "");
      localStorage.setItem(STORAGE_SELECTED_SPECIALIST_SPECIALTY, specialty || "");
      const role = localStorage.getItem("mock_user_role");
      if (role === "specialist") {
        setUser(getDemoUser("specialist"));
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
        setSelectedNurseId,
        setSelectedSpecialist,
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
