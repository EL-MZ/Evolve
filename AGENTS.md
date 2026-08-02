# Agent guide for Evolve

## Product principles

- Preserve the energetic, encouraging tone. Evolve should motivate without shame, streak anxiety, or competitive ranking.
- Keep goals, scheduled sessions, and progress entries as separate concepts.
- New data is private by default. Social visibility must always be explicit.
- The four default pillars are Work, Sport, Reading, and Study, but the database must allow custom categories later.
- Every major feature must work on a narrow mobile screen and with a keyboard.

## Engineering rules

- Use strict TypeScript and keep domain types in `src/lib` or a feature module.
- Keep browser-safe values separate from server-only secrets. Never expose a Supabase service-role key to client code.
- Record database changes as ordered SQL migrations under `supabase/migrations`.
- Enforce user privacy through PostgreSQL Row-Level Security, not only through interface checks.
- Reuse one normalized export view-model for PDF, DOCX, print, and calendar exports when those exporters are expanded.
- Run `npm run typecheck`, `npm run lint`, and `npm run build` before publishing changes.
- Update the relevant document under `docs/` when an architectural choice or product scope changes.

## Demo mode

Until Supabase authentication is connected, the dashboard uses local browser storage. Keep demo mode usable without environment variables so every Vercel deployment remains reviewable.

