# Closed-Loop Referrals — Frontend

A demo-ready web app for tracking rural clinic referrals so they never fall through the cracks. Built for a 7-minute hackathon demo.

## Tech Stack

- **Next.js** (App Router) + **JavaScript** + **TailwindCSS** + **shadcn/ui**
- **Supabase Auth** (frontend integration)
- **FastAPI** backend (API client wired; use mock mode when backend not ready)

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Mock Mode (Default)

The app runs in **mock mode** by default — no backend or Supabase required. You can:

1. Log in as **Nurse**, **Patient**, or **Specialist** (role switcher in mock banner)
2. Use all features with seeded demo data
3. Toggle mock mode off in the banner when your backend is ready

### Environment (Optional)

Create `.env.local` for real Supabase + API:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Project Structure

```
src/
├── app/
│   ├── login/           # Login + mock role selection
│   ├── nurse/           # Nurse portal (dashboard, create referral, detail)
│   ├── specialist/      # Specialist portal
│   └── patient/         # Patient portal (mobile-first)
├── components/
│   ├── shared/          # StatusBadge, PriorityBadge, OfflineBanner, etc.
│   ├── nurse/           # AddAppointmentSheet
│   ├── specialist/      # SpecialistAppointmentSheet
│   └── ui/              # shadcn components
├── contexts/            # AuthProvider
├── lib/
│   ├── api.js           # API client (mock fallback)
│   ├── mockData.js      # Demo seed data
│   ├── offline-queue.js # Offline action queue
│   └── supabase.js      # Supabase client
└── hooks/               # useOfflineSync
```

## Demo Flow

1. **Login** → Choose role (Nurse / Patient / Specialist)
2. **Nurse** → Dashboard with KPIs, filters, referral table; create referral; open detail; add appointment; mark tasks done
3. **Specialist** → List assigned referrals; set/update appointment; mark ATTENDED or NO_SHOW (triggers reschedule task)
4. **Patient** → View referrals; "I can't make it / Request reschedule"; notifications; settings (email/SMS toggles)

## Demo Seed Data

- 6 referrals (booked+upcoming, no-show→needs reschedule+task, high-priority overdue)
- Open tasks for reschedule
- Sample notifications

## API Contract

All requests use `Authorization: Bearer <token>`. Implemented endpoints:

- `GET /me` — user profile + role
- `GET /patients` — patient list
- `GET /referrals?scope=mine|all`
- `POST /referrals`
- `GET /referrals/:id`
- `PATCH /referrals/:id/status`
- `POST /referrals/:id/appointments`
- `PATCH /appointments/:id`
- `POST /referrals/:id/reschedule-request`
- `GET /tasks?status=open`
- `PATCH /tasks/:id`
- `GET /notifications?scope=mine`

## Offline Mode

When offline, a banner appears. Mutations can be queued (localStorage) and synced when back online.

## License

MIT
