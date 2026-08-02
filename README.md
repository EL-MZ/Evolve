# Evolve

Evolve is an energetic weekly goal tracker for balancing work, sport, reading, and study. The current repository contains a polished interactive MVP that runs without credentials, plus the production database design for adding private accounts with Supabase.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Progress is stored in the browser for the demo.

## Deploy on Vercel

The project is ready for Vercel's zero-configuration Next.js deployment. Import this repository, leave the framework preset as **Next.js**, and deploy. No environment variables are required for the demo.

When authentication is implemented, copy `.env.example` to `.env.local` and add the public Supabase project URL and anonymous key. Keep the service-role key server-only and configure all hosted values in Vercel rather than committing them.

## Documentation

- [Architecture decisions](docs/architecture-decisions.md) — every major choice, why it exists, alternatives, limitations, and future impact
- [Product specification](docs/product-spec.md) — audience, user journeys, features, success criteria, and phased scope
- [Data model](docs/data-model.md) — the production entities and privacy model
- [Roadmap](docs/roadmap.md) — build order from the demo through social features and reminders

## Current MVP

- Responsive weekly dashboard
- Work, sport, reading, and study pillars
- Goal creation, completion, and incremental progress logging
- Browser persistence for instant demonstration
- Week navigation
- Printable A4 layout / Save as PDF
- `.ics` calendar export compatible with Google Calendar
- Production-ready Supabase schema and Row-Level Security policies

Authentication, multi-device persistence, DOCX export, direct Google Calendar sync, friend sharing, and reminders are intentionally staged after the clickable demo.
