"use client";

import {
  mockReferrals,
  mockPatients,
  mockTasks,
  mockNotifications,
  mockTimelineEvents,
  mockClinics,
} from "./mockData";

import { supabase } from "./supabase";
import {
  getCurrentUserId,
  getPatientsSupabase,
  createPatientSupabase,
  getReferralsSupabase,
  createReferralSupabase,
  getTasksSupabase,
  updateTaskSupabase,
  setAppointmentSupabase,
  updateAppointmentStatusSupabase,
  rescheduleAppointmentSupabase,
  confirmAppointmentSupabase,
  requestRescheduleSupabase,
  requestTransportSupabase,
  loadDemoDataSupabase,
} from "./supabaseQueries";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

async function fetchWithAuth(path, options = {}) {
  // 1. Get the current active session from Supabase
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  // 2. Attach the token to the header
  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    
    // 3. Handle Errors
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || `API error: ${res.status}`);
    }
    return res.json();
  } catch (error) {
    // Optional: Log error or re-throw
    throw error;
  }
}

// --- MOCK IMPLEMENTATIONS ---
function getMockMe(role = "nurse") {
  const users = {
    nurse: { id: "nurse1", role: "nurse", full_name: "Nurse Smith" },
    patient: { id: "p1", role: "patient", full_name: "Maria Garcia" },
    specialist: { id: "spec1", role: "specialist", full_name: "Dr. Johnson" },
  };
  return users[role] || users.nurse;
}

// --- API CLIENT ---
export async function getMe(useMock) {
  if (useMock) {
    const stored = typeof window !== "undefined" && localStorage.getItem("mock_user_role");
    return Promise.resolve(getMockMe(stored || "nurse"));
  }
  return fetchWithAuth("/me");
}

export async function getPatients(useMock) {
  if (useMock) {
    const { mockPatients } = await import("./mockData");
    return Promise.resolve(mockPatients.map((p) => ({ id: p.id, full_name: p.full_name, email: p.email ?? null })));
  }
  const list = await getPatientsSupabase();
  return list.map((p) => ({ id: p.id, full_name: p.full_name, email: p.email ?? null }));
}

/** context = { role, userId } for scope 'mine' (e.g. from useAuth().user) */
export async function getReferrals(scope = "all", useMock, context = {}) {
  if (useMock) {
    const role = typeof window !== "undefined" && localStorage.getItem("mock_user_role");
    let refs = [...mockReferrals];
    if (scope === "mine" && role === "patient") {
      const me = getMockMe("patient");
      refs = refs.filter((r) => r.patient_id === me.id);
    }
    if (scope === "mine" && role === "specialist") {
      refs = refs.filter((r) => ["SENT", "BOOKED", "CONFIRMED"].includes(r.status));
    }
    return Promise.resolve(refs);
  }
  // Real mode + patient + no selected patient → show nothing until they select
  if (scope === "mine" && context.role === "patient" && !context.userId) {
    return Promise.resolve([]);
  }
  const specialistKey = context.role === "specialist" ? (context.specialistKey ?? context.userId) : null;
  return getReferralsSupabase(scope, context.role, context.userId, specialistKey);
}

export async function getReferral(id, useMock) {
  if (useMock) {
    const ref = mockReferrals.find((r) => r.id === id);
    if (!ref) return Promise.reject(new Error("Not found"));
    const timeline = mockTimelineEvents[id] || [];
    return Promise.resolve({ ...ref, timeline });
  }
  const refs = await getReferralsSupabase("all", null, null, null);
  const ref = refs.find((r) => r.id === id);
  if (!ref) throw new Error("Not found");
  const { data: events } = await supabase
    .from("timeline_events")
    .select("id, type, description, timestamp")
    .eq("referral_id", id)
    .order("timestamp", { ascending: true });
  return { ...ref, timeline: events || [] };
}

/** options: { createdByUserId, createdByUserName } for real mode (nurse acting-as) */
export async function createReferral(data, useMock, options = {}) {
  if (useMock) {
    const patient = mockPatients.find((p) => p.id === data.patient_id);
    const newRef = {
      id: `ref-${Date.now()}`,
      patient_id: data.patient_id,
      patient_name: patient?.full_name || "Unknown",
      created_by: "nurse1",
      specialty: data.specialty,
      priority: data.priority,
      status: "CREATED",
      notes: data.notes,
      due_date: data.due_date,
      transportation_needed: data.transportation_needed ?? false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      appointments: [],
    };
    mockReferrals.push(newRef);
    return Promise.resolve(newRef);
  }
  const createdByUserId = options.createdByUserId ?? (await getCurrentUserId());
  const createdByUserName = options.createdByUserName ?? null;
  const patientName =
    data.patient_name ??
    (await getPatientsSupabase()).find((p) => p.id === data.patient_id)?.full_name ??
    "Unknown";
  return createReferralSupabase(
    { ...data, patient_name: patientName },
    createdByUserId,
    createdByUserName
  );
}

export async function updateReferralStatus(id, status, useMock) {
  if (useMock) {
    const ref = mockReferrals.find((r) => r.id === id);
    if (!ref) return Promise.reject(new Error("Not found"));
    ref.status = status;
    ref.updated_at = new Date().toISOString();
    return Promise.resolve(ref);
  }
  return fetchWithAuth(`/referrals/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

/** options: { specialistName } for timeline description */
export async function createAppointment(referralId, data, useMock, options = {}) {
  if (useMock) {
    const ref = mockReferrals.find((r) => r.id === referralId);
    if (!ref) return Promise.reject(new Error("Not found"));
    const apt = {
      id: `apt-${Date.now()}`,
      referral_id: referralId,
      scheduled_for: data.scheduled_for,
      location: data.location,
      status: "SCHEDULED",
    };
    ref.appointments = ref.appointments || [];
    ref.appointments.push(apt);
    ref.status = "BOOKED";
    ref.updated_at = new Date().toISOString();
    return Promise.resolve(apt);
  }
  const refs = await getReferralsSupabase("all", null, null, null);
  const ref = refs.find((r) => r.id === referralId);
  if (!ref) throw new Error("Referral not found");
  return setAppointmentSupabase(
    referralId,
    ref.patient_id,
    data.scheduled_for,
    data.location,
    options.specialistName
  );
}

export async function updateAppointment(appointmentId, data, useMock) {
  if (useMock) {
    for (const ref of mockReferrals) {
      const apt = (ref.appointments || []).find((a) => a.id === appointmentId);
      if (apt) {
        apt.status = data.status;
        if (data.status === "NO_SHOW") {
          ref.status = "NEEDS_RESCHEDULE";
          const { mockTasks } = await import("./mockData");
          mockTasks.push({
            id: `task-${Date.now()}`,
            referral_id: ref.id,
            type: "RESCHEDULE",
            status: "OPEN",
            due_at: new Date(Date.now() + 86400000 * 2).toISOString(),
            assigned_to_name: "Nurse Smith",
            patient_name: ref.patient_name,
            specialty: ref.specialty,
          });
        }
        ref.updated_at = new Date().toISOString();
        return Promise.resolve(apt);
      }
    }
    return Promise.reject(new Error("Appointment not found"));
  }
  const { data: apt } = await supabase
    .from("appointments")
    .select("referral_id")
    .eq("id", appointmentId)
    .single();
  if (!apt?.referral_id) throw new Error("Appointment not found");
  await updateAppointmentStatusSupabase(
    appointmentId,
    apt.referral_id,
    data.status
  );
  return { id: appointmentId, ...data };
}

/** options: { specialistName } for timeline description */
export async function rescheduleAppointment(referralId, appointmentId, data, useMock, options = {}) {
  if (useMock) {
    const ref = mockReferrals.find((r) => r.id === referralId);
    if (!ref) return Promise.reject(new Error("Referral not found"));
    const apt = (ref.appointments || []).find((a) => a.id === appointmentId);
    if (!apt) return Promise.reject(new Error("Appointment not found"));
    apt.scheduled_for = data.scheduled_for;
    apt.location = data.location;
    ref.status = "BOOKED";
    ref.updated_at = new Date().toISOString();
    const { mockTasks } = await import("./mockData");
    mockTasks.forEach((t) => {
      if (t.referral_id === referralId && t.type === "RESCHEDULE" && t.status === "OPEN") t.status = "DONE";
    });
    return Promise.resolve({ ok: true });
  }
  await rescheduleAppointmentSupabase({
    referralId,
    appointmentId,
    scheduled_for: data.scheduled_for,
    location: data.location,
    specialistName: options.specialistName,
  });
  return { ok: true };
}

export async function requestReschedule(referralId, useMock) {
  if (useMock) {
    const ref = mockReferrals.find((r) => r.id === referralId);
    if (!ref) return Promise.reject(new Error("Not found"));
    ref.status = "NEEDS_RESCHEDULE";
    ref.updated_at = new Date().toISOString();
    const { mockTasks } = await import("./mockData");
    mockTasks.push({
      id: `task-${Date.now()}`,
      referral_id: ref.id,
      type: "RESCHEDULE",
      status: "OPEN",
      due_at: new Date(Date.now() + 86400000 * 2).toISOString(),
      assigned_to_name: "Nurse Smith",
      patient_name: ref.patient_name,
      specialty: ref.specialty,
    });
    return Promise.resolve({ success: true });
  }
  return requestRescheduleSupabase(referralId);
}

export async function getTasks(status = "open", useMock) {
  if (useMock) {
    return Promise.resolve(mockTasks.filter((t) => t.status.toUpperCase() === status.toUpperCase()));
  }
  return getTasksSupabase(status);
}

export async function updateTask(taskId, data, useMock) {
  if (useMock) {
    const task = mockTasks.find((t) => t.id === taskId);
    if (!task) return Promise.reject(new Error("Not found"));
    task.status = data.status || "DONE";
    return Promise.resolve(task);
  }
  return updateTaskSupabase(taskId, { status: data.status ?? "DONE" });
}

/** userId optional: for demo mode pass selectedPatientId / demo user id when no session */
export async function getNotifications(scope = "mine", useMock, userId) {
  if (useMock) {
    const role = typeof window !== "undefined" && localStorage.getItem("mock_user_role");
    const me = getMockMe(role || "nurse");
    const filtered = mockNotifications.filter((n) => n.user_id === me.id);
    return Promise.resolve(filtered);
  }
  let uid = userId;
  if (uid == null) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    uid = session?.user?.id;
  }
  if (!uid) return [];
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", uid)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

export function getClinics(useMock) {
  if (useMock) return Promise.resolve(mockClinics);
  return fetchWithAuth("/clinics");
}

export async function createPatient(data, useMock) {
  if (useMock) {
    return Promise.resolve({ id: `p-${Date.now()}`, full_name: data.full_name });
  }
  return createPatientSupabase(data);
}

/** Patient: confirm appointment (Supabase only when !useMock) */
export async function confirmAppointment(referralId, appointmentId, patientId, useMock) {
  if (useMock) {
    return Promise.resolve({ ok: true });
  }
  return confirmAppointmentSupabase(referralId, appointmentId, patientId);
}

/** Patient: request transportation (Supabase only when !useMock) */
export async function requestTransport(referralId, useMock) {
  if (useMock) {
    return Promise.resolve({ ok: true });
  }
  return requestTransportSupabase(referralId);
}

/** Dev-only: load 2 patients + 2 referrals if tables empty (Supabase only) */
export async function loadDemoData(useMock) {
  if (useMock) return Promise.resolve({ ok: true });
  return loadDemoDataSupabase();
}
