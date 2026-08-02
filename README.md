# Evolve

Evolve is an energetic weekly goal tracker for balancing the areas that matter to each user. It includes a polished device-only preview and production-ready private accounts with Supabase.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Without Supabase variables, the app clearly runs as a device-only preview and stores each preview workspace in the browser.

## Enable real accounts

1. Create a Supabase project.
2. Run `supabase/migrations/0001_initial_schema.sql`, then `0002_accounts_and_custom_categories.sql`, in order.
3. Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Add the same two variables in Vercel and redeploy.
5. In Supabase Auth URL configuration, set the production site URL to the Vercel domain and add the local URL as a redirect URL.

The app automatically switches from preview entry to email/password sign-up and sign-in when both public variables exist. The anonymous key is designed for browser use; privacy is enforced by the committed Row-Level Security policies. Never expose the service-role key.

## Deploy on Vercel

The project is ready for Vercel's zero-configuration Next.js deployment. Import this repository, leave the framework preset as **Next.js**, and deploy. No environment variables are required for the demo.

Configure hosted environment values in Vercel rather than committing them. The deployment remains reviewable in device-preview mode when the variables are absent.

## Documentation

- [Architecture decisions](docs/architecture-decisions.md) — every major choice, why it exists, alternatives, limitations, and future impact
- [Product specification](docs/product-spec.md) — audience, user journeys, features, success criteria, and phased scope
- [Data model](docs/data-model.md) — the production entities and privacy model
- [Roadmap](docs/roadmap.md) — build order from the demo through social features and reminders

## Current MVP

- Responsive weekly dashboard
- Empty per-user workspace with Work, Sport, Reading, and Study starter areas
- Unlimited custom categories with a colour and selectable icon
- First-login walkthrough that can be replayed from the profile menu
- Supabase email/password authentication with a device-only fallback preview
- Goal creation, deletion, completion, and user-selected progress increments
- Optional scheduled goal events in a weekly calendar
- Browser persistence for instant demonstration
- Week navigation
- Printable A4 layout / Save as PDF
- `.ics` calendar export compatible with Google Calendar
- Production-ready Supabase schema and Row-Level Security policies

DOCX export, direct Google Calendar sync, friend sharing, and reminders remain staged after the private tracker foundation.
