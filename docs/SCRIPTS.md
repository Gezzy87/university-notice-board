# Scripts & Seeding

Every `npm run` script, what it does, and whether it's safe to re-run.

## Database

| Script | Does |
|---|---|
| `npm run db:generate` | Regenerates the Prisma client from `schema.prisma` (runs automatically on `npm install` via `postinstall`) |
| `npm run db:push` | Pushes the current `schema.prisma` straight to the database — fast, no migration file, used throughout this project's development. Non-destructive for additive changes (new nullable columns); can prompt/warn for destructive ones |
| `npm run db:migrate` | `prisma migrate dev` — generates a versioned SQL migration file. Use this instead of `db:push` once you want a real migration history (e.g. before a team collaborates, or before production deploys) |
| `npm run db:seed` | Runs [`prisma/seed.ts`](../prisma/seed.ts) — idempotent (uses `upsert`), safe to re-run |
| `npm run db:studio` | Opens Prisma Studio, a local GUI for browsing/editing every table directly |

### What `db:seed` creates

- **7 categories** (Academic, Exams, Placements, Clubs, Workshops, Sports,
  General) with fixed colors.
- **A content-authorship admin**: `seed-admin@university.edu` /
  "Notice Board Admin". **This account has no password and cannot log in** —
  it exists purely so seeded notices/events have a realistic author name
  instead of a null. To get a real, login-able admin, use
  `npm run admin:create` (below).
- A handful of sample notices and events.

## Admin & storage bootstrap

| Script | Does |
|---|---|
| `npm run admin:create` | Creates or promotes a **login-able** admin account. Reads `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` from `.env` (defaults: `admin@university.edu` / `Admin123!` / `Admin User` — **refuses to run with the default password when `NODE_ENV=production`**, forcing you to set a real one). Safe to re-run — upserts by email and resets the password each time, so it also doubles as a "reset the admin password" tool |
| `npm run storage:setup` | Creates the Supabase Storage bucket (named per `SUPABASE_STORAGE_BUCKET`, default `images`) as **public**, 5 MB file limit, image MIME types only. Checks for an existing bucket first — safe to re-run, no-ops if already created |

## Demo data

| Script | Does |
|---|---|
| `npm run seed:students` | Creates **6 login-able demo students** (real names, `@university.edu` emails, assigned departments), all sharing the password in `DEMO_STUDENT_PASSWORD` (default `Student123!`). Then has **every student comment on every existing notice and event** with varied, context-appropriate text (different wording for notices vs. events), with comment timestamps randomly spread between the post's date and now so threads look organic rather than batch-created |
| `npm run seed:rsvps` | Has the same demo students RSVP to every event — mostly `GOING`, roughly 1-in-4 `INTERESTED`, **respecting each event's capacity** (won't push a `GOING` count past `capacity`; falls back to `INTERESTED` once full) |

Both are **idempotent**: re-running `seed:students` won't create duplicate
students or duplicate comments (it checks for an existing comment per
student-per-post before creating one); re-running `seed:rsvps` won't create
duplicate RSVPs (checked via the `[userId, eventId]` unique constraint).

### Demo student accounts

| Name | Email | Department |
|---|---|---|
| Maya Kapoor | maya.kapoor@university.edu | Computer Science |
| Liam O'Connor | liam.oconnor@university.edu | Mechanical Engineering |
| Priya Nair | priya.nair@university.edu | Biology |
| Daniel Okafor | daniel.okafor@university.edu | Economics |
| Sofia Almeida | sofia.almeida@university.edu | Design |
| Kenji Tanaka | kenji.tanaka@university.edu | Physics |

All share the password `Student123!` (or your `DEMO_STUDENT_PASSWORD`
override) — useful for demoing the student experience without registering a
throwaway account.

## Recommended order for a fresh database

```bash
npm run db:push
npm run db:seed
npm run storage:setup
npm run admin:create
npm run seed:students   # optional, for a fuller demo
npm run seed:rsvps      # optional, run after seed:students
```

## Writing a new script

Follow the pattern in `scripts/*.ts`:
1. `import "dotenv/config";` first, so `.env` loads outside of Next.js's own
   env handling (these scripts run via `tsx`, not `next dev`).
2. Import `prisma` from `../src/lib/prisma` (reuse the singleton) and `auth`
   from `../src/lib/auth` if you need Better Auth's password hasher.
3. Wrap logic in `main()`, called with `.catch(...).finally(() => prisma.$disconnect())` —
   scripts must disconnect Prisma explicitly or the process hangs.
4. Prefer `upsert` over `create` so the script is safe to re-run.
5. Add the script to `package.json`'s `"scripts"` block and to this doc.
