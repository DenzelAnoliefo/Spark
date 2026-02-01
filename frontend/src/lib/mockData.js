// Demo seed data for Closed-Loop Referrals
// Shapes match API contract

export const REFERRAL_STATUSES = [
  "CREATED", "SENT", "BOOKED", "CONFIRMED", "ATTENDED", "NO_SHOW", "NEEDS_RESCHEDULE", "CLOSED"
];

export const SPECIALTIES = [
  "Cardiology",
  "Dermatology",
  "Orthopedics",
  "Mental Health",
  "Ophthalmology",
  "Pulmonology",
  "Gastroenterology",
  "Neurology",
];

/** Demo nurses for "acting as" (real mode, no auth) */
export const DEMO_NURSES = [
  { id: "00000000-0000-0000-0000-000000000001", name: "Nurse Avery Chen" },
  { id: "00000000-0000-0000-0000-000000000002", name: "Nurse Jordan Patel" },
];

/** One specialist per specialty for assignment + acting-as */
export const SPECIALIST_BY_SPECIALTY = {
  Cardiology: "Dr. Omar Haddad",
  Dermatology: "Dr. Maya Singh",
  Orthopedics: "Dr. Lily Nguyen",
  "Mental Health": "Dr. Priya Shah",
  Ophthalmology: "Dr. James Wu",
  Pulmonology: "Dr. Sofia Reyes",
  Gastroenterology: "Dr. David Kim",
  Neurology: "Dr. Rachel Green",
};

export const PRIORITIES = ["High", "Medium", "Low"];

export const mockPatients = [
  { id: "p1", full_name: "Maria Garcia", dob: "1975-03-15", phone: "555-0101" },
  { id: "p2", full_name: "James Wilson", dob: "1982-07-22", phone: "555-0102" },
  { id: "p3", full_name: "Sarah Chen", dob: "1990-11-08", phone: "555-0103" },
  { id: "p4", full_name: "Robert Johnson", dob: "1968-01-30", phone: "555-0104" },
  { id: "p5", full_name: "Emily Davis", dob: "2001-05-12", phone: "555-0105" },
  { id: "p6", full_name: "Michael Brown", dob: "1955-09-20", phone: "555-0106" },
];

export const mockClinics = [
  { id: "c1", name: "Rural Health Clinic - Main" },
  { id: "c2", name: "Valley Medical Center" },
  { id: "c3", name: "Sunrise Community Health" },
];

// 6+ referrals including: booked+upcoming, no-show->needs reschedule+task, high priority overdue
export const mockReferrals = [
  {
    id: "ref1",
    patient_id: "p1",
    patient_name: "Maria Garcia",
    created_by: "nurse1",
    specialty: "Cardiology",
    priority: "High",
    status: "BOOKED",
    notes: "Chest pain evaluation. ECG abnormal at last visit.",
    due_date: "2025-02-15",
    transportation_needed: true,
    created_at: "2025-01-20T10:00:00Z",
    updated_at: "2025-01-25T14:30:00Z",
    appointments: [
      {
        id: "apt1",
        referral_id: "ref1",
        scheduled_for: "2025-02-05T09:00:00Z",
        location: "County Cardiology - Room 3",
        status: "SCHEDULED",
      },
    ],
  },
  {
    id: "ref2",
    patient_id: "p2",
    patient_name: "James Wilson",
    created_by: "nurse1",
    specialty: "Orthopedics",
    priority: "Medium",
    status: "NO_SHOW",
    notes: "Knee pain, possible ACL tear. MRI ordered.",
    due_date: "2025-02-01",
    transportation_needed: false,
    created_at: "2025-01-15T09:00:00Z",
    updated_at: "2025-01-28T11:00:00Z",
    appointments: [
      {
        id: "apt2",
        referral_id: "ref2",
        scheduled_for: "2025-01-28T10:00:00Z",
        location: "Valley Ortho - Bldg A",
        status: "NO_SHOW",
      },
    ],
  },
  {
    id: "ref3",
    patient_id: "p3",
    patient_name: "Sarah Chen",
    created_by: "nurse1",
    specialty: "Mental Health",
    priority: "High",
    status: "NEEDS_RESCHEDULE",
    notes: "Anxiety/depression. Patient no-showed 1/28.",
    due_date: "2025-01-30",
    transportation_needed: true,
    created_at: "2025-01-10T08:00:00Z",
    updated_at: "2025-01-29T09:00:00Z",
    appointments: [
      {
        id: "apt3",
        referral_id: "ref3",
        scheduled_for: "2025-01-28T14:00:00Z",
        location: "Behavioral Health - Suite 200",
        status: "NO_SHOW",
      },
    ],
  },
  {
    id: "ref4",
    patient_id: "p4",
    patient_name: "Robert Johnson",
    created_by: "nurse1",
    specialty: "Dermatology",
    priority: "Low",
    status: "SENT",
    notes: "Suspicious mole on back.",
    due_date: "2025-02-20",
    transportation_needed: false,
    created_at: "2025-01-22T11:00:00Z",
    updated_at: "2025-01-22T11:00:00Z",
    appointments: [],
  },
  {
    id: "ref5",
    patient_id: "p5",
    patient_name: "Emily Davis",
    created_by: "nurse1",
    specialty: "Ophthalmology",
    priority: "High",
    status: "CREATED",
    notes: "Vision changes, possible diabetic retinopathy. OVERDUE.",
    due_date: "2025-01-25",
    transportation_needed: true,
    created_at: "2025-01-18T13:00:00Z",
    updated_at: "2025-01-18T13:00:00Z",
    appointments: [],
  },
  {
    id: "ref6",
    patient_id: "p6",
    patient_name: "Michael Brown",
    created_by: "nurse1",
    specialty: "Cardiology",
    priority: "Medium",
    status: "CONFIRMED",
    notes: "Follow-up post stent placement.",
    due_date: "2025-02-10",
    transportation_needed: false,
    created_at: "2025-01-20T09:00:00Z",
    updated_at: "2025-01-27T16:00:00Z",
    appointments: [
      {
        id: "apt6",
        referral_id: "ref6",
        scheduled_for: "2025-02-08T10:30:00Z",
        location: "County Cardiology - Room 1",
        status: "CONFIRMED",
      },
    ],
  },
];

export const mockTasks = [
  {
    id: "task1",
    referral_id: "ref2",
    type: "RESCHEDULE",
    status: "OPEN",
    due_at: "2025-01-31T17:00:00Z",
    assigned_to_name: "Nurse Smith",
    patient_name: "James Wilson",
    specialty: "Orthopedics",
  },
  {
    id: "task2",
    referral_id: "ref3",
    type: "RESCHEDULE",
    status: "OPEN",
    due_at: "2025-01-31T17:00:00Z",
    assigned_to_name: "Nurse Smith",
    patient_name: "Sarah Chen",
    specialty: "Mental Health",
  },
];

export const mockNotifications = [
  {
    id: "n1",
    user_id: "p1",
    type: "REMINDER",
    channel: "SMS",
    message: "Reminder: Cardiology appointment tomorrow at 9:00 AM",
    created_at: "2025-01-29T08:00:00Z",
  },
  {
    id: "n2",
    user_id: "p3",
    type: "NO_SHOW",
    channel: "IN_APP",
    message: "Your Mental Health appointment was missed. Please request a reschedule.",
    created_at: "2025-01-28T15:00:00Z",
  },
  {
    id: "n3",
    user_id: "p2",
    type: "RESCHEDULE",
    channel: "EMAIL",
    message: "Your Orthopedics reschedule request is being processed.",
    created_at: "2025-01-29T10:00:00Z",
  },
];

// Timeline events for referral detail
export const mockTimelineEvents = {
  ref1: [
    { id: "e1", type: "CREATED", timestamp: "2025-01-20T10:00:00Z", description: "Referral created" },
    { id: "e2", type: "SENT", timestamp: "2025-01-21T09:00:00Z", description: "Sent to specialist" },
    { id: "e3", type: "BOOKED", timestamp: "2025-01-25T14:30:00Z", description: "Appointment scheduled for Feb 5" },
    { id: "e4", type: "CONFIRMED", timestamp: "2025-01-26T11:00:00Z", description: "Patient confirmed" },
  ],
  ref2: [
    { id: "e5", type: "CREATED", timestamp: "2025-01-15T09:00:00Z", description: "Referral created" },
    { id: "e6", type: "SENT", timestamp: "2025-01-16T08:00:00Z", description: "Sent to specialist" },
    { id: "e7", type: "BOOKED", timestamp: "2025-01-20T10:00:00Z", description: "Appointment scheduled for Jan 28" },
    { id: "e8", type: "NO_SHOW", timestamp: "2025-01-28T11:00:00Z", description: "Patient did not attend" },
    { id: "e9", type: "NEEDS_RESCHEDULE", timestamp: "2025-01-28T11:05:00Z", description: "Reschedule task created" },
  ],
  ref3: [
    { id: "e10", type: "CREATED", timestamp: "2025-01-10T08:00:00Z", description: "Referral created" },
    { id: "e11", type: "SENT", timestamp: "2025-01-11T09:00:00Z", description: "Sent to specialist" },
    { id: "e12", type: "BOOKED", timestamp: "2025-01-15T14:00:00Z", description: "Appointment scheduled" },
    { id: "e13", type: "NO_SHOW", timestamp: "2025-01-28T15:00:00Z", description: "Patient did not attend" },
    { id: "e14", type: "NEEDS_RESCHEDULE", timestamp: "2025-01-28T15:05:00Z", description: "Reschedule task created" },
  ],
  ref4: [
    { id: "e15", type: "CREATED", timestamp: "2025-01-22T11:00:00Z", description: "Referral created" },
    { id: "e16", type: "SENT", timestamp: "2025-01-22T12:00:00Z", description: "Sent to specialist" },
  ],
  ref5: [
    { id: "e17", type: "CREATED", timestamp: "2025-01-18T13:00:00Z", description: "Referral created" },
  ],
  ref6: [
    { id: "e18", type: "CREATED", timestamp: "2025-01-20T09:00:00Z", description: "Referral created" },
    { id: "e19", type: "SENT", timestamp: "2025-01-21T10:00:00Z", description: "Sent to specialist" },
    { id: "e20", type: "BOOKED", timestamp: "2025-01-25T16:00:00Z", description: "Appointment scheduled" },
    { id: "e21", type: "CONFIRMED", timestamp: "2025-01-27T16:00:00Z", description: "Patient confirmed" },
  ],
};
