# Spark — Closed-Loop Referrals

A **closed-loop referrals** MVP for rural and community clinics. The goal: referrals from nurse → specialist → patient never fall through the cracks. Every referral has a clear status, timeline, and next action so no one is left waiting without a path forward.

Built for a hackathon-style demo: it runs with **mock data** out of the box and can switch to **real data** (Supabase) without code changes.

Try it out [HERE](https://closed-loop-referrals.vercel.app/login)!

---

## Product

**Closed-loop referrals** means:

1. **Nurse** creates a patient and referral (status **SENT**), optionally assigns a specialist by specialty.
2. **Specialist** sees referrals assigned to them, books an appointment → referral becomes **BOOKED**.
3. **Patient** sees their referral and appointment; can **confirm**, **request reschedule**, or **request transportation**.
4. If the patient doesn’t show, the **specialist** marks **NO_SHOW** → referral becomes **NEEDS_RESCHEDULE**, a reschedule task is created for the nurse, and a notification is queued (e.g. email).
5. **Specialist** can **reschedule** (new date/time + location) when the patient requested it → referral stays **BOOKED**, timeline and notification are updated, open reschedule tasks are closed.
6. **Nurse** sees **Recent Referrals Created** (filtered by acting-as nurse) and **Open Tasks** (e.g. reschedule, transport); can mark tasks done and open referral details.

No real login in the MVP: **demo identities** (acting-as nurse, acting-as specialist, patient selector) drive the flow so you can demo end-to-end without Supabase Auth.

---

## Tech Stack

| Layer        | Technology        | Role |
|-------------|-------------------|------|
| **Frontend** | Next.js 16 (App Router), React 19, JavaScript | SPA, role-based routes (nurse / specialist / patient) |
| **UI**       | Tailwind CSS, shadcn/ui (Radix), Lucide icons, Sonner toasts | Accessible components, fast styling |
| **Data (MVP)** | Supabase (Postgres + JS client) | Tables: `patients`, `referrals`, `appointments`, `tasks`, `notifications`, `timeline_events`. Frontend talks to Supabase **directly** with the anon key in real mode. |
| **Backend**  | FastAPI, SQLModel, Uvicorn, Resend | Email notification system (sends from notification rows); optional for core referral loop. |
| **Auth (MVP)** | None | Demo mode uses localStorage (acting-as nurse/specialist, selected patient). |

---

## Architecture & Reasoning

### Frontend → Supabase (real mode)

- **Why:** Fast iteration for the hackathon; one less hop (no backend) for create/read/update of referrals, appointments, tasks, notifications, and timeline.
- **How:** `frontend/src/lib/supabaseQueries.js` holds all Supabase calls. `api.js` switches between mock and Supabase based on **mock mode**.
- **Identity:** No Supabase Auth. “Acting as” nurse/specialist and “selected patient” are stored in `localStorage` and read by `auth-context.js`. Referrals use `created_by` (nurse id) and `specialist_specialty` for assignment.

### Mock mode

- **Why:** Demo and development without Supabase or backend. Toggle off when you have a project and env vars.
- **How:** `mockData.js` seeds patients, referrals, tasks, notifications, timeline. `api.js` uses these when mock mode is on and never calls Supabase.

### Backend & email notifications

- **Why:** Centralize secrets and send real email (e.g. Resend) when notification rows are created (NO_SHOW, APPOINTMENT_RESCHEDULED, etc.).
- **How:** FastAPI with Supabase server-side (e.g. service role) and Resend. The **email notification system is implemented and working** (teammate-built): when the app creates notification rows (e.g. channel `email`, type `NO_SHOW`), the backend sends the corresponding emails. The core referral flow (create, book, reschedule, tasks) still works without the backend; email sending is the main backend feature in use.

### No auth in the MVP

- **Why:** Simplify the demo and avoid Supabase Auth setup during the hackathon.
- **Trade-off:** Not production-safe; next step is to add Supabase Auth (or another provider) and map users to roles and `created_by` / specialist assignment.

---

## Project Structure

```
Spark/
├── frontend/                 # Next.js app
│   ├── src/
│   │   ├── app/
│   │   │   ├── login/        # Role selection (no credentials)
│   │   │   ├── nurse/       # Dashboard, create referral, referral detail
│   │   │   ├── specialist/  # List + detail, book/reschedule, ATTENDED/NO_SHOW
│   │   │   └── patient/     # Referrals, confirm, reschedule, transport
│   │   ├── components/     # Nurse/specialist sheets, shared badges, UI
│   │   ├── contexts/        # Auth (demo identity + mock mode)
│   │   └── lib/
│   │       ├── api.js       # Public API (mock vs Supabase)
│   │       ├── supabaseQueries.js  # All Supabase calls
│   │       ├── supabase.js  # Supabase client
│   │       └── mockData.js  # Demo data + DEMO_NURSES, SPECIALIST_BY_SPECIALTY
│   └── .env.local           # NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
├── backend/                  # FastAPI (optional)
│   ├── main.py
│   ├── database.py
│   └── requirements.txt
└── docker-compose.yml
```

---

## Next Steps & Future Work

- **Supabase Auth:** Replace demo identities with real login; map users to roles and to `created_by` / specialist assignment.
- **Backend integration:** Move more sensitive or heavy operations (risk scoring, scheduling logic) behind FastAPI; keep frontend → Supabase for simple CRUD or migrate more into the backend.
- **Referrals table:** Add or confirm columns `specialist_key`, `specialist_name`, `specialist_specialty` if you use specialist assignment and filtering.
- **Appointments table:** Optional `updated_at` for reschedule tracking.
- **Offline:** The codebase has an offline queue/banner; wiring it to Supabase sync and conflict handling is a natural next step.
- **Tests:** Add E2E (e.g. Playwright) for the main flows (create referral → book → reschedule → no-show → task done).

---

## License

MIT
