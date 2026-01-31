"use client";

import {
  mockReferrals,
  mockPatients,
  mockTasks,
  mockNotifications,
  mockTimelineEvents,
  mockClinics,
} from "./mockData";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchWithAuth(path, options = {}) {
  const token = typeof window !== "undefined" && localStorage.getItem("supabase_access_token");
  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
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
    return Promise.resolve(mockPatients.map((p) => ({ id: p.id, full_name: p.full_name })));
  }
  return fetchWithAuth("/patients");
}

export async function getReferrals(scope = "all", useMock) {
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
  return fetchWithAuth(`/referrals?scope=${scope}`);
}

export async function getReferral(id, useMock) {
  if (useMock) {
    const ref = mockReferrals.find((r) => r.id === id);
    if (!ref) return Promise.reject(new Error("Not found"));
    const timeline = mockTimelineEvents[id] || [];
    return Promise.resolve({ ...ref, timeline });
  }
  return fetchWithAuth(`/referrals/${id}`);
}

export async function createReferral(data, useMock) {
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
  return fetchWithAuth("/referrals", { method: "POST", body: JSON.stringify(data) });
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

export async function createAppointment(referralId, data, useMock) {
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
  return fetchWithAuth(`/referrals/${referralId}/appointments`, {
    method: "POST",
    body: JSON.stringify(data),
  });
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
  return fetchWithAuth(`/appointments/${appointmentId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
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
  return fetchWithAuth(`/referrals/${referralId}/reschedule-request`, {
    method: "POST",
  });
}

export async function getTasks(status = "open", useMock) {
  if (useMock) {
    return Promise.resolve(mockTasks.filter((t) => t.status.toUpperCase() === status.toUpperCase()));
  }
  return fetchWithAuth(`/tasks?status=${status}`);
}

export async function updateTask(taskId, data, useMock) {
  if (useMock) {
    const task = mockTasks.find((t) => t.id === taskId);
    if (!task) return Promise.reject(new Error("Not found"));
    task.status = data.status || "DONE";
    return Promise.resolve(task);
  }
  return fetchWithAuth(`/tasks/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function getNotifications(scope = "mine", useMock) {
  if (useMock) {
    const role = typeof window !== "undefined" && localStorage.getItem("mock_user_role");
    const me = getMockMe(role || "nurse");
    const filtered = mockNotifications.filter((n) => n.user_id === me.id);
    return Promise.resolve(filtered);
  }
  return fetchWithAuth(`/notifications?scope=${scope}`);
}

export function getClinics(useMock) {
  if (useMock) return Promise.resolve(mockClinics);
  return fetchWithAuth("/clinics");
}
