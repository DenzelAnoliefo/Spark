"use client";

import { supabase } from "./supabase";

/** Get current user id for created_by (or fallback for demo). */
export async function getCurrentUserId() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user?.id || "00000000-0000-0000-0000-000000000001";
}

/** Patients: list */
export async function getPatientsSupabase() {
  const { data, error } = await supabase
    .from("patients")
    .select("id, full_name, phone, email, dob, risk_score, medical_history, created_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map((p) => ({
    ...p,
    full_name: p.full_name ?? "",
  }));
}

/** Patients: insert */
export async function createPatientSupabase(row) {
  const insert = {
    full_name: row.full_name ?? "",
    phone: row.phone ?? null,
    email: row.email ?? null,
    dob: row.dob ?? null,
    address: row.address ?? null,
    city: row.city ?? null,
    province: row.province ?? null,
    postal_code: row.postal_code ?? null,
    risk_score: row.risk_score ?? 0,
    medical_history: row.medical_history ?? row.history ?? [],
  };
  const { data, error } = await supabase.from("patients").insert(insert).select("id, full_name").single();
  if (error) throw new Error(error.message);
  return data;
}

/** Referrals: list with patient name and appointments. scope = 'all' | 'mine'. For mine, pass role + currentUserId; for specialist pass specialistKey to filter by assignment. */
export async function getReferralsSupabase(scope, role, currentUserId, specialistKey) {
  let q = supabase
    .from("referrals")
    .select("*, patients(full_name), appointments(*), timeline_events(*))")
    .order("created_at", { ascending: false });

  if (scope === "mine" && role === "patient" && currentUserId) {
    q = q.eq("patient_id", currentUserId);
  }
  if (scope === "mine" && role === "specialist") {
    q = q.in("status", ["SENT", "NEEDS_RESCHEDULE", "BOOKED", "CONFIRMED"]);
    if (specialistKey) q = q.eq("specialist_specialty", specialistKey);
  }

  let { data, error } = await q;
  if (error && /column .* does not exist/i.test(error.message)) {
    // specialist_specialty (or related) column missing — retry without assignment filter
    let fallback = supabase
      .from("referrals")
      .select("*, patients(full_name), appointments(*), timeline_events(*))")
      .order("created_at", { ascending: false })
      .in("status", ["SENT", "NEEDS_RESCHEDULE", "BOOKED", "CONFIRMED"]);
    const res = await fallback;
    data = res.data;
    error = res.error;
  }
  if (error) throw new Error(error.message);

  return (data || []).map((r) => {
    const patientName = Array.isArray(r.patients) ? r.patients[0]?.full_name : r.patients?.full_name;
    const events = (r.timeline_events || []).sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );
    return {
      ...r,
      patient_name: patientName ?? "Unknown",
      appointments: (r.appointments || []).sort(
        (a, b) => new Date(a.scheduled_for) - new Date(b.scheduled_for)
      ),
      timelinePreview: events.slice(0, 3),
    };
  });
}

/** Referrals: create with status SENT + specialist assignment + timeline event */
export async function createReferralSupabase(row, createdByUserId, createdByUserName) {
  const refInsert = {
    patient_id: row.patient_id,
    created_by: createdByUserId,
    specialty: row.specialty,
    priority: row.priority,
    status: "SENT",
    notes: row.notes ?? null,
    due_date: row.due_date || null,
    transportation_needed: row.transportation_needed ?? false,
    is_urgent: row.is_urgent ?? false,
    specialist_key: row.specialist_key ?? null,
    specialist_name: row.specialist_name ?? null,
    specialist_specialty: row.specialist_specialty ?? null,
  };
  const { data: ref, error: refErr } = await supabase
    .from("referrals")
    .insert(refInsert)
    .select()
    .single();
  if (refErr) throw new Error(refErr.message);

  const description = createdByUserName
    ? `${createdByUserName} created referral`
    : "Referral sent to specialist";
  await supabase.from("timeline_events").insert({
    referral_id: ref.id,
    type: "REFERRAL_SENT",
    description,
    timestamp: new Date().toISOString(),
  });

  return {
    ...ref,
    patient_name: row.patient_name ?? "Unknown",
    appointments: [],
  };
}

/** Tasks: list with status OPEN or DONE, with patient_name and specialty from referral -> patients */
export async function getTasksSupabase(status) {
  const statusVal = (status || "open").toUpperCase() === "DONE" ? "DONE" : "OPEN";
  const { data: tasks, error: tasksErr } = await supabase
    .from("tasks")
    .select("*, referrals(specialty, patients(full_name))")
    .eq("status", statusVal)
    .order("due_at", { ascending: true });
  if (tasksErr) throw new Error(tasksErr.message);

  return (tasks || []).map((t) => {
    const ref = Array.isArray(t.referrals) ? t.referrals[0] : t.referrals;
    const patientName = Array.isArray(ref?.patients) ? ref?.patients[0]?.full_name : ref?.patients?.full_name;
    return {
      ...t,
      patient_name: patientName ?? "Unknown",
      specialty: ref?.specialty ?? "",
    };
  });
}

/** Tasks: mark done */
export async function updateTaskSupabase(taskId, update) {
  const { data, error } = await supabase
    .from("tasks")
    .update({ status: update.status ?? "DONE" })
    .eq("id", taskId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

/** Specialist: set appointment — insert appointment, update referral BOOKED, timeline, notification. specialistName optional for timeline description. */
export async function setAppointmentSupabase(referralId, referralPatientId, scheduled_for, location, specialistName) {
  const { data: apt, error: aptErr } = await supabase
    .from("appointments")
    .insert({
      referral_id: referralId,
      scheduled_for,
      location: location ?? "",
      status: "BOOKED",
    })
    .select()
    .single();
  if (aptErr) throw new Error(aptErr.message);

  const { error: refErr } = await supabase
    .from("referrals")
    .update({ status: "BOOKED", updated_at: new Date().toISOString() })
    .eq("id", referralId);
  if (refErr) throw new Error(refErr.message);

  const aptDescription = specialistName
    ? `${specialistName} booked appointment`
    : "Appointment scheduled by specialist";
  await supabase.from("timeline_events").insert({
    referral_id: referralId,
    type: "APPOINTMENT_BOOKED",
    description: aptDescription,
    timestamp: new Date().toISOString(),
  });

  await supabase.from("notifications").insert({
    user_id: referralPatientId,
    type: "APPOINTMENT_BOOKED",
    channel: "sms",
    message: "Your appointment has been scheduled.",
    is_read: false,
  });

  return apt;
}

/** Specialist: mark appointment ATTENDED or NO_SHOW. On NO_SHOW: task + timeline + notification (channel=email). */
export async function updateAppointmentStatusSupabase(appointmentId, referralId, status) {
  const { error: aptErr } = await supabase
    .from("appointments")
    .update({ status })
    .eq("id", appointmentId);
  if (aptErr) throw new Error(aptErr.message);

  if (status === "NO_SHOW") {
    const { data: ref } = await supabase.from("referrals").select("patient_id").eq("id", referralId).single();
    await supabase
      .from("referrals")
      .update({ status: "NEEDS_RESCHEDULE", updated_at: new Date().toISOString() })
      .eq("id", referralId);
    await supabase.from("tasks").insert({
      referral_id: referralId,
      type: "RESCHEDULE",
      status: "OPEN",
      due_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      assigned_to_name: "Nursing Station",
    });
    await supabase.from("timeline_events").insert({
      referral_id: referralId,
      type: "NO_SHOW",
      description: "Patient did not attend",
      timestamp: new Date().toISOString(),
    });
    if (ref?.patient_id) {
      const { data: patient } = await supabase
        .from("patients")
        .select("full_name, email")
        .eq("id", ref.patient_id)
        .single();
      const patientName = patient?.full_name || "Patient";
      const message = `${patientName} — Please request a reschedule.`;
      await supabase.from("notifications").insert({
        user_id: ref.patient_id,
        type: "NO_SHOW",
        channel: "email",
        message,
        is_read: false,
      });
    }
  } else if (status === "ATTENDED") {
    await supabase
      .from("referrals")
      .update({ status: "ATTENDED", updated_at: new Date().toISOString() })
      .eq("id", referralId);
    await supabase.from("timeline_events").insert({
      referral_id: referralId,
      type: "ATTENDED",
      description: "Patient attended appointment",
      timestamp: new Date().toISOString(),
    });
  }

  return { ok: true };
}

/** Specialist: reschedule appointment — update existing appointment, referral BOOKED, timeline, notification, close RESCHEDULE tasks */
export async function rescheduleAppointmentSupabase({
  referralId,
  appointmentId,
  scheduled_for,
  location,
  specialistName,
}) {
  const { error: aptErr } = await supabase
    .from("appointments")
    .update({
      scheduled_for,
      location: location ?? "",
    })
    .eq("id", appointmentId);
  if (aptErr) throw new Error(aptErr.message);

  const { error: refErr } = await supabase
    .from("referrals")
    .update({ status: "BOOKED", updated_at: new Date().toISOString() })
    .eq("id", referralId);
  if (refErr) throw new Error(refErr.message);

  const description = specialistName
    ? `${specialistName} rescheduled appointment`
    : "Appointment rescheduled";
  await supabase.from("timeline_events").insert({
    referral_id: referralId,
    type: "APPOINTMENT_RESCHEDULED",
    description,
    timestamp: new Date().toISOString(),
  });

  const { data: refRow } = await supabase
    .from("referrals")
    .select("patient_id")
    .eq("id", referralId)
    .single();
  if (refRow?.patient_id) {
    const when = new Date(scheduled_for).toLocaleString();
    await supabase.from("notifications").insert({
      user_id: refRow.patient_id,
      type: "APPOINTMENT_RESCHEDULED",
      channel: "email",
      message: `Your appointment was rescheduled to ${when}.`,
      is_read: false,
    });
  }

  const { data: openTasks } = await supabase
    .from("tasks")
    .select("id")
    .eq("referral_id", referralId)
    .eq("type", "RESCHEDULE")
    .eq("status", "OPEN");
  if (openTasks?.length) {
    for (const t of openTasks) {
      await supabase.from("tasks").update({ status: "DONE" }).eq("id", t.id);
    }
  }

  return { ok: true };
}

/** Patient: confirm appointment */
export async function confirmAppointmentSupabase(referralId, appointmentId, patientId) {
  await supabase.from("appointments").update({ status: "CONFIRMED" }).eq("id", appointmentId);
  await supabase
    .from("referrals")
    .update({ status: "CONFIRMED", updated_at: new Date().toISOString() })
    .eq("id", referralId);
  await supabase.from("timeline_events").insert({
    referral_id: referralId,
    type: "PATIENT_CONFIRMED",
    description: "Patient confirmed appointment",
    timestamp: new Date().toISOString(),
  });
  await supabase.from("notifications").insert({
    user_id: patientId,
    type: "APPOINTMENT_CONFIRMED",
    channel: "email",
    message: "Appointment confirmed.",
    is_read: false,
  });
  return { ok: true };
}

/** Patient: request reschedule */
export async function requestRescheduleSupabase(referralId) {
  await supabase
    .from("referrals")
    .update({ status: "NEEDS_RESCHEDULE", updated_at: new Date().toISOString() })
    .eq("id", referralId);
  await supabase.from("tasks").insert({
    referral_id: referralId,
    type: "RESCHEDULE",
    status: "OPEN",
    due_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    assigned_to_name: "Nursing Station",
  });
  await supabase.from("timeline_events").insert({
    referral_id: referralId,
    type: "RESCHEDULE_REQUESTED",
    description: "Patient requested reschedule",
    timestamp: new Date().toISOString(),
  });
  return { ok: true };
}

/** Patient: request transportation */
export async function requestTransportSupabase(referralId) {
  await supabase
    .from("referrals")
    .update({ transportation_needed: true, updated_at: new Date().toISOString() })
    .eq("id", referralId);
  await supabase.from("tasks").insert({
    referral_id: referralId,
    type: "TRANSPORT",
    status: "OPEN",
    assigned_to_name: "Volunteer Drivers",
  });
  await supabase.from("timeline_events").insert({
    referral_id: referralId,
    type: "TRANSPORT_REQUESTED",
    description: "Patient requested transportation",
    timestamp: new Date().toISOString(),
  });
  return { ok: true };
}

/** Dev-only: insert 2 patients + 2 referrals if tables are empty */
export async function loadDemoDataSupabase() {
  const { data: patients } = await supabase.from("patients").select("id").limit(1);
  if (patients?.length > 0) return { ok: true, message: "Data already exists" };

  const createdBy = await getCurrentUserId();
  const { data: p1, error: e1 } = await supabase
    .from("patients")
    .insert({
      full_name: "Maria Garcia",
      phone: "555-0101",
      email: "maria@example.com",
      risk_score: 1,
      medical_history: [],
    })
    .select("id")
    .single();
  if (e1) throw new Error(e1.message);

  const { data: p2, error: e2 } = await supabase
    .from("patients")
    .insert({
      full_name: "James Wilson",
      phone: "555-0102",
      email: "james@example.com",
      risk_score: 2,
      medical_history: [],
    })
    .select("id")
    .single();
  if (e2) throw new Error(e2.message);

  const { data: r1, error: er1 } = await supabase
    .from("referrals")
    .insert({
      patient_id: p1.id,
      created_by: createdBy,
      specialty: "Cardiology",
      priority: "High",
      status: "SENT",
      notes: "Chest pain evaluation",
      transportation_needed: true,
      is_urgent: false,
    })
    .select("id")
    .single();
  if (er1) throw new Error(er1.message);

  await supabase.from("timeline_events").insert({
    referral_id: r1.id,
    type: "REFERRAL_SENT",
    description: "Referral sent to specialist",
    timestamp: new Date().toISOString(),
  });

  const { data: r2, error: er2 } = await supabase
    .from("referrals")
    .insert({
      patient_id: p2.id,
      created_by: createdBy,
      specialty: "Orthopedics",
      priority: "Medium",
      status: "SENT",
      notes: "Knee pain",
      transportation_needed: false,
      is_urgent: false,
    })
    .select("id")
    .single();
  if (er2) throw new Error(er2.message);

  await supabase.from("timeline_events").insert({
    referral_id: r2.id,
    type: "REFERRAL_SENT",
    description: "Referral sent to specialist",
    timestamp: new Date().toISOString(),
  });

  return { ok: true, message: "Demo data loaded (2 patients, 2 referrals)" };
}
