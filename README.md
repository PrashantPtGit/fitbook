# FitBook — Indian Multi-Gym Management Dashboard

Owner: Ramesh Kumar | Locations: MLC Mall · New Shimla · Location 3

## Stack

| Layer | Tech |
|---|---|
| UI | React 18 + Vite |
| Styling | Tailwind CSS v3 |
| Routing | React Router v6 |
| State | Zustand |
| Backend | Supabase (Auth + Postgres) |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| PDF | @react-pdf/renderer |
| Notifications | react-hot-toast |
| Date utils | date-fns |

## 9-Part Build Plan

1. **Foundation** — Scaffold, Tailwind, Zustand store, Supabase client, layout shell *(this part)*
2. **Supabase Schema** — Tables: gyms, members, payments, attendance, messages, health, diet
3. **Auth + Data Layer** — Login, protected routes, real-time subscriptions
4. **Home Dashboard** — KPI cards, revenue chart, expiry alerts, recent activity
5. **Members** — List, add, edit, profile page, bulk import
6. **Fees** — Collect fees, payment history, overdue alerts, PDF receipts
7. **Attendance** — Daily check-in, monthly heatmap, absentee detection
8. **Messages** — Bulk WhatsApp/SMS templates, fee reminders, birthday wishes
9. **Health · Diet · Reports** — Body metrics, meal plans, analytics exports

## Getting Started

```bash
cp .env.example .env
# Fill in your Supabase URL and anon key in .env
npm run dev
```
