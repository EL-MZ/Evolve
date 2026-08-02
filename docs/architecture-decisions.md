# Architecture decisions

This is a living record of the technical and product choices behind Evolve. It explains what each choice does, why it fits this small demonstration, its limitations, and the conditions under which we should reconsider it.

## Decision summary

| Area | Choice | What it does | Why it fits Evolve |
|---|---|---|---|
| Source control | GitHub | Stores code, history, issues, and database migrations | Gives Codex a reviewable source of truth and connects directly to Vercel |
| Web framework | Next.js with TypeScript | Builds the interface and server capabilities in one project | Excellent Vercel support, structured routing, and an easy path from demo to authenticated app |
| Hosting | Vercel Hobby | Builds and serves every push from GitHub | Free for this personal, non-commercial demonstration and requires almost no server administration |
| UI | React with custom CSS | Creates the interactive dashboard and responsive visual system | Keeps the first version distinctive without committing to a large component framework |
| Icons | Lucide | Supplies consistent interface icons | Lightweight, accessible, and visually neutral |
| Preview persistence | Namespaced `localStorage` | Keeps each device-preview workspace separate in one browser | Makes every deployment reviewable without pretending that preview entry is a secure account |
| Production data | Supabase Postgres | Stores accounts, goals, progress, schedules, friendships, and feed events | Relational data and Row-Level Security fit ownership and sharing better than document storage |
| Authentication | Supabase Auth | Provides user accounts and sessions | Avoids implementing password storage, reset flows, and session security ourselves |
| Authorization | PostgreSQL Row-Level Security | Filters each database query according to the signed-in user | Privacy remains enforced even if a future screen contains a programming mistake |
| Calendar v1 | `.ics` download | Exports selected goals as a standard calendar file | Works with Google, Apple, and Outlook without OAuth or secret management |
| Planning calendar | FullCalendar Standard | Provides hourly week/day views, external goal dragging, selection, moving, and resizing | The required TimeGrid and interaction features are MIT-licensed and work without Premium Scheduler |
| Calendar v2 | Google Calendar API | Creates and updates calendar events directly | Useful later, but OAuth consent and token lifecycle are unnecessary for the first demo |
| PDF v1 | Browser print CSS | Produces a clean printout or Save-as-PDF result | No server or PDF dependency; works immediately |
| DOCX/PDF v2 | Shared export view-model with `docx` and React PDF | Generates consistent downloadable documents | Staged until the weekly plan content and layout are stable |
| Validation | Strict TypeScript now; Zod with server forms later | Prevents invalid shapes in code and at trust boundaries | Avoids premature dependencies while leaving a clear production path |
| Testing | Typecheck, lint, production build; Vitest and Playwright next | Catches regressions at increasing levels | The current gates are suitable for a UI-first seed; automated interaction tests arrive with auth |

## 1. GitHub is the source of truth

GitHub stores application code, documentation, SQL migrations, and future automated tests. Vercel reads from the repository and creates a deployment after each push.

Why this is better here:

- Changes are reviewable and reversible.
- A database can be reconstructed from committed migrations instead of relying on undocumented dashboard clicks.
- Codex can make small, auditable changes and keep explanations beside the implementation.
- The app is not locked inside a no-code platform.

Trade-off: Git introduces branches and merge decisions. For a small personal project, keeping `main` deployable and using short feature branches is enough.

Rejected alternative: GitHub Pages. It is excellent static hosting, but authentication callbacks, secure server actions, reminder jobs, and secret-backed integrations would require separate infrastructure. It is not a better primary host once those features arrive.

## 2. Next.js and TypeScript

Next.js provides React pages, server routes, server-side rendering, and deployment conventions. TypeScript checks data structures before runtime.

Why this is better than a static Vite-only app now that Vercel is selected:

- Vercel supports Next.js directly with minimal configuration.
- Future Google OAuth callbacks, email endpoints, secure exports, and account actions can live in the same repository.
- Server-only code can hold secrets that must never reach the browser.
- Route-level loading and error states scale well when the app gains authentication.

Why we are not using every Next.js feature yet: the clickable MVP can be client-side and credential-free. Introducing server state before accounts exist would make previewing slower without improving the demonstration.

Trade-offs:

- Next.js is a larger runtime than a plain Vite single-page app.
- Framework upgrades need occasional attention.
- Vercel-specific conveniences can create lock-in if used indiscriminately.

Mitigation: keep domain logic framework-neutral, use standard Postgres and web APIs, and avoid Vercel-only databases. A normal Node-compatible Next.js deployment remains possible elsewhere.

## 3. Vercel Hobby hosting

Vercel builds the GitHub repository and serves it over HTTPS. The Hobby tier is appropriate only while Evolve remains a personal, non-commercial demonstration within its usage policy.

Why we chose it:

- The user already created an account and imported the repository.
- It produces a usable URL with automatic deployments.
- It has first-class Next.js support.
- A few users generate negligible traffic relative to the free allowance.

Limitations and exit conditions:

- If the app becomes commercial, exceeds free-tier limits, or needs infrastructure not offered economically by Vercel, reassess hosting.
- The database is separate, so Vercel alone does not preserve user goals.
- Scheduled reminders may later need Vercel Cron, Supabase Cron, or an external scheduler.

Alternatives considered:

- Cloudflare Pages/Workers: strong free limits and a good future option, but less direct for a conventional Next.js project.
- GitHub Pages: cheapest static option but poor fit for secure server functions.
- Self-hosting: maximum control, but backups, patching, TLS, monitoring, and uptime are unnecessary burdens for this demonstration.

## 4. Supabase for production accounts and data

Supabase combines managed PostgreSQL, Auth, storage, realtime subscriptions, and server functions. Evolve's SQL schema remains committed in `supabase/migrations`.

Why relational Postgres is a good fit:

- A user owns many goals, progress entries, and scheduled sessions.
- Friendships link two users and have a state.
- Feed visibility depends on ownership, friendship, and per-goal visibility.
- SQL constraints can prevent impossible values such as negative targets.

Why Supabase rather than Firebase:

- Relationships and reporting are natural in SQL.
- Row-Level Security is evaluated inside the database.
- Migrations are portable to another PostgreSQL host.
- Weekly summaries and category statistics are straightforward queries.

Important limitation: free projects can have quotas and inactivity policies. These must be checked before a public launch. For a few demonstration users, they are acceptable. The app will show a helpful unavailable state rather than silently discarding data if the service is paused.

## 5. Private by default through Row-Level Security

Authentication proves who the user is. Authorization decides which records that user may read or change. Evolve uses both.

Every user-owned production table enables Row-Level Security. The initial migration permits owners to manage their own data. Social reads are intentionally withheld until friendship and visibility behavior has dedicated tests.

Why this matters: hiding a private goal in React is not security. A user can call the data API directly. Database policies must reject unauthorized rows regardless of the interface.

Rules for future social work:

- New goals default to `private`.
- A friend account is distinct; passwords are never shared.
- `friends` visibility requires an accepted friendship.
- `selected` visibility requires an explicit share record.
- A progress entry can be more private than its parent goal.
- Blocking overrides friendship and previous shares.

## 6. Separate goals, scheduled sessions, and progress

These are deliberately different records:

- A **goal** says what outcome is wanted and how it is measured.
- A **scheduled session** reserves time. It can link to a goal or stand alone as a detailed event.
- A **progress entry** records what actually happened.

This separation supports goals such as “read 120 pages” or “run 20 km” without pretending each goal is one event. The same goal can be dragged into the schedule repeatedly, producing independent sessions. It also makes calendar rescheduling independent from evidence of progress.

Goals use a period contract rather than being copied into weeks:

- weekly goals cover Monday through Sunday;
- monthly goals cover a calendar month;
- custom goals cover an inclusive user-selected date range.

Each weekly dashboard selects overlapping goals, so progress remains shared across every week in a longer period.

Rejected model: one universal `tasks` table containing goal, schedule, and completion fields. It looks simpler initially but becomes ambiguous for multi-session goals and makes history difficult to preserve.

## 7. Device-preview mode uses browser storage

When the two public Supabase variables are absent, the entry screen is explicitly labelled as a device-only preview. It creates a namespaced browser workspace with no sample goals. When Supabase is configured, email/password sessions and user-owned rows replace this preview path automatically.

Benefits:

- The Vercel deployment works before Supabase is configured.
- Reviewers can enter a fresh workspace, create categories, and complete goals immediately.
- No demo account or shared password is required.
- UI iteration stays fast while the data contract is being validated.

Limitations:

- Data exists only on the current device and browser.
- Clearing site data removes it.
- It is not appropriate for private or important information.
- It cannot support friends or shared feeds.

Preview mode remains an explicit fallback, while signed-in users use PostgreSQL. New profiles receive four starter categories through the database trigger, but no goals. Custom category names, colours, and icon keys are user-owned rows protected by Row-Level Security.

## 8. Export decisions

### Print and PDF

The first version uses print-specific CSS. Browser “Save as PDF” gives a reliable A4-friendly result without sending data to a server.

Later, a server or browser PDF renderer can provide identical typography across devices. That change should happen only after the weekly plan format is accepted.

### Calendar

The planning interface uses FullCalendar Standard's TimeGrid and interaction modules for hourly week/day views, repeated external dragging, selection, moving, and resizing. Calendar records remain in Evolve and the export path downloads RFC-style `.ics` events. This requires no Google consent screen and works across calendar vendors.

Direct Google Calendar synchronization is deliberately later because it introduces:

- OAuth consent and narrowly scoped permissions;
- refresh-token storage and revocation;
- event identity mapping for updates and deletion;
- error recovery when a user edits an event in Google.

### DOCX

DOCX generation will use the TypeScript `docx` package and the same normalized `WeeklyPlanExport` model as PDF. It is staged because adding a dependency before the weekly document layout is stable creates rework without improving the core tracking demonstration.

## 9. Visual system

The design uses a warm off-white canvas with four user-selectable sidebar/accent themes: Evolve Lime, Ocean Blue, Sunset Coral, and Violet Focus. Category colours and content surfaces remain stable so a theme change does not alter goal meaning.

Why this direction:

- It is more energetic and motivating than a conventional blue productivity dashboard.
- Each category has a memorable color without relying on color alone for meaning.
- The quiet background and dark text preserve readability.
- Custom CSS keeps the visual identity distinct from a default component-library template.

Accessibility requirements:

- All actions require visible text or accessible labels.
- Keyboard focus must remain visible.
- Completion is conveyed by icons and text decoration, not only color.
- Charts include text summaries.
- Motion stays subtle and respects reduced-motion preferences when more animation is added.

## 10. Deliberately deferred choices

These are not forgotten; they are postponed until their prerequisites exist:

| Choice | Trigger for deciding |
|---|---|
| Resend versus another email provider | Reminder templates and verified sending domain are ready |
| Supabase Cron versus Vercel Cron | Reminder frequency, timezone behavior, and free-tier limits are confirmed |
| Recharts versus CSS-only charts | Historical analytics require axes, tooltips, or multiple series |
| React PDF layout | The printable weekly plan has passed user review |
| PWA/offline synchronization | Multi-device conflict behavior is designed |
| Reactions and social ranking | Friend feed is safe, useful, and non-competitive in testing |

## How to update this record

When a major technology, provider, data boundary, or privacy behavior changes, add a dated decision or revise the relevant section in the same pull request. Documentation is part of the feature, not a cleanup task.
