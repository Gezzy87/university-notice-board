# Quad — Full Documentation

University Notice Board & Events — the complete project documentation, combined into a single file. Each section below was originally a separate file under `docs/`; links between sections are in-page anchors, and links to source files are relative to the repo root.

## Contents

- [Architecture](#architecture)
- [Setup](#setup)
- [Data Model](#data-model)
- [Authentication](#authentication)
- [Features](#features)
- [Server Actions & API](#server-actions--api)
- [Design System](#design-system)
- [Security](#security)
- [Scripts & Seeding](#scripts--seeding)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)


---

## Architecture

### Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16 (App Router, React 19, Turbopack) | Server Components for data-heavy pages, Server Actions for mutations, one deployable unit (no separate API server) |
| Language | TypeScript | End-to-end type safety, including generated Prisma types |
| Database | PostgreSQL (Supabase) | Relational data with real relationships (users, notices, events, RSVPs) benefits from a real schema and joins |
| ORM | Prisma 6 | Typed queries, migrations, a single schema file as source of truth |
| Auth | Better Auth | Email/password auth with session cookies, extensible hooks, framework-native Next.js integration |
| File storage | Supabase Storage | Same project as the database; simple public-bucket model for cover images |
| Styling | Tailwind CSS v4 + shadcn/ui | Utility-first CSS with a token system (see [Design System](#design-system)) mapped onto shadcn primitives |
| Rich text | Tiptap | Notice/event bodies are authored as HTML via a WYSIWYG editor |
| Email | Nodemailer + Gmail SMTP | Password reset / verification emails (optional; app runs without it configured) |

### Why Server Components + Server Actions (not a separate API)

Every list/detail page (`/feed`, `/calendar`, `/notices/[id]`, `/events/[id]`,
`/saved`, `/my-events`, `/admin`) is an **async Server Component** that calls a
function in [`src/lib/queries.ts`](../src/lib/queries.ts) directly — no fetch,
no API route, no client-side loading state for the initial render. The data
layer and the UI layer live in the same process and the same TypeScript
project, so a schema change is a compile error at the call site, not a runtime
surprise.

Mutations (RSVP, bookmark, comment, admin create/edit/delete, image upload)
are **Server Actions** — async functions marked `"use server"` in
[`src/app/actions/`](../src/app/actions/) that client components call directly
like a normal async function, no `fetch()`, no JSON serialization to write by
hand, no separate REST/GraphQL layer. See [Server Actions & API](#server-actions--api)
for the full list.

The one real "API" in this app is Better Auth's route handler at
[`src/app/api/auth/[...all]/route.ts`](../src/app/api/auth/%5B...all%5D/route.ts),
which Better Auth needs to mount its own endpoints (`/api/auth/sign-in/email`,
`/api/auth/sign-up/email`, etc.). Everything else is Server Components and
Server Actions.

### Request flow examples

**Viewing the feed (`GET /feed`):**
1. `src/app/feed/page.tsx` (Server Component) runs on the server.
2. It calls `getCurrentUser()` (reads the session cookie, cache-first — see
   [Authentication](#authentication)) and `getFeedItems()` /
   `getCategories()` from `queries.ts` in parallel.
3. Prisma queries run directly against Postgres (through the Supabase pooler).
4. The Server Component renders `<FeedView>` with the resolved data as props.
5. `<FeedView>` is a Client Component (`"use client"`) that owns *only*
   interactive state — the search box and category filter — filtering the
   already-fetched list client-side. No refetch on typing.
6. The whole tree streams to the browser inside a `<Suspense>` boundary with a
   skeleton fallback (see `src/components/quad/skeletons.tsx`), so slow
   database round-trips show a shimmer instead of a blank screen.

**RSVPing to an event (a mutation):**
1. The user clicks "Going" in `<RsvpControl>` (Client Component).
2. It calls `setRsvp(eventId, "GOING")` — a Server Action imported directly,
   compiled by Next.js into a POST to a hidden action endpoint.
3. The action re-checks auth (`getCurrentUser()`), re-checks event capacity
   server-side (never trust the client's optimistic count), then upserts the
   `Rsvp` row.
4. `revalidatePath()` invalidates the cached render of the event detail page,
   the feed, and `/my-events` so they reflect the new RSVP on next visit.
5. The client shows an optimistic UI update immediately and reconciles with
   the server's actual response (rolling back on error, e.g. "event is full").

### Directory map

```
prisma/
  schema.prisma          Single source of truth for the database shape
  seed.ts                Base seed: categories + sample notices/events

scripts/                  One-off / re-runnable admin scripts (see SCRIPTS.md)
  create-admin.ts
  setup-storage.ts
  seed-students.ts
  seed-rsvps.ts

src/
  app/                    Next.js App Router — one folder per route
    actions/              Server Actions (mutations), grouped by domain
      admin.ts            Admin-only: create/delete notice/event/category, image upload
      engagement.ts       Any logged-in user: RSVP, bookmark, comment
    api/auth/[...all]/    Better Auth's route handler (the one real API route)
    admin/                Admin area (dashboard, create forms, categories, moderation)
    feed/ calendar/ search/ saved/ my-events/  Student-facing list pages
    notices/[id]/ events/[id]/                 Detail pages
    login/ register/ verify/                   Auth pages
    profile/ notifications/                    Account pages
    not-found.tsx error.tsx                    Global 404 / error boundary

  components/
    ui/                   shadcn/ui primitives (button, card, dialog, ...)
    quad/                 App-specific components (cards, nav, forms, ...)
      admin/               Admin-only components (forms, editors, admin nav)

  lib/                    Framework-agnostic logic — the "backend" of the app
    prisma.ts             Prisma client singleton (see gotcha below)
    auth.ts               Better Auth server config (roles, hooks, rate limits)
    auth-client.ts         Better Auth React client (signIn/signUp/signOut/useSession)
    session.ts             getCurrentUser() / getSession() helpers, fault-tolerant
    queries.ts             All read queries for pages (feed, detail, dashboard, ...)
    storage.ts              Supabase Storage admin client (server-only)
    rate-limit.ts           In-memory rate limiter for Server Actions
    email-domain.ts          Server-side university-email allowlist check
    mail.ts                  Gmail SMTP transport
    categories.ts            Category → color/gradient mapping
    html.ts highlight.tsx    HTML stripping / search-term highlighting helpers
    mock.ts mock-detail.ts   TypeScript types shared between mock and real data
```

### Key architectural decisions (and why)

- **One Prisma client singleton** ([`src/lib/prisma.ts`](../src/lib/prisma.ts))
  cached on `globalThis` in development. Next.js hot-reloads server modules on
  every save; without the cache, each reload would create a new
  `PrismaClient` and eventually exhaust the database's connection limit. This
  is the single most common Prisma+Next.js footgun and it's handled up front.
- **Two database URLs** (`DATABASE_URL` pooled on port 6543,
  `DIRECT_URL` unpooled on port 5432). Prisma's query engine talks to the
  pooled connection at runtime (many short-lived serverless-style
  connections); `prisma migrate`/`db push` need a direct, non-pooled
  connection because pgbouncer's transaction mode doesn't support some
  session-level operations migrations use.
- **Fault-tolerant session reads** ([`src/lib/session.ts`](../src/lib/session.ts)):
  `getSession()` catches errors instead of throwing, so a transient database
  hiccup degrades to "treat the user as logged out for this render" instead
  of a 500 page. Combined with Better Auth's cookie cache (5 minute TTL),
  most page loads never touch the database for the session at all.
- **Admin-only mutations re-check the role server-side** on every single
  action, not just in the UI/route guard. `requireAdmin()` in
  `src/app/actions/admin.ts` is called at the top of every admin action, so
  even if someone bypasses the client (calls the action directly, forges a
  request), the check still runs on the server. See [Security](#security).


---

## Setup

Getting the project running from a clean clone.

### Prerequisites

- Node.js 20+ and npm
- A [Supabase](https://supabase.com) account (free tier is enough) — used for
  both the Postgres database and file storage
- Git

### 1. Install dependencies

```bash
git clone https://github.com/Gezzy87/university-notice-board.git
cd university-notice-board
npm install
```

`postinstall` runs `prisma generate` automatically, so the Prisma client is
ready right after install.

### 2. Create a Supabase project

1. [supabase.com](https://supabase.com) → **New project**.
2. Pick a region close to you or your users — this matters more than it
   sounds like it should. See [Troubleshooting](#slow-page-loads)
   for why.
3. Save the database password you're given (or generate one) — you'll need it
   for the connection strings below.

### 3. Configure environment variables

```bash
cp .env.example .env
```

Then fill in each section of `.env`. Every variable is documented inline in
`.env.example`; the summary:

| Variable | Where to get it |
|---|---|
| `DATABASE_URL` | Supabase → **Connect** → ORM/Prisma tab → the **Transaction pooler** string (port `6543`). Append `&connection_limit=5&pool_timeout=20` after `?pgbouncer=true` — see [Troubleshooting](#database-connection-errors) |
| `DIRECT_URL` | Same screen, the **Session/Direct** string (port `5432`) |
| `BETTER_AUTH_SECRET` | Generate: `openssl rand -base64 32` (or any long random string) |
| `BETTER_AUTH_URL` / `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` for local dev |
| `ALLOWED_EMAIL_DOMAINS` | Comma-separated domains allowed to register, e.g. `university.edu`. Leave empty to allow any domain |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Supabase → **Project Settings → API**. The service role key is secret — never expose it client-side |
| `SUPABASE_STORAGE_BUCKET` | Any name; `images` is the default and what `storage:setup` creates |
| `GMAIL_USER` / `GMAIL_APP_PASSWORD` | Optional — only needed if you want real password-reset/verification emails to send. See [Authentication](#email) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` | Used by `npm run admin:create` (step 6) |

⚠️ `.env` is gitignored — never commit it. If you ever paste real secrets into
a chat, ticket, or screenshot, rotate them afterward (Supabase → reset the
service role key and/or database password).

### 4. Push the schema and seed base data

```bash
npm run db:push    # creates all tables from prisma/schema.prisma
npm run db:seed    # seeds ~7 categories + a few sample notices/events
```

### 5. Set up file storage (for image uploads)

```bash
npm run storage:setup
```

Creates a public Supabase Storage bucket (named per `SUPABASE_STORAGE_BUCKET`)
with a 5 MB file-size limit and image-only MIME types. Safe to re-run — it
skips creation if the bucket already exists.

### 6. Create your admin account

```bash
npm run admin:create
```

Creates (or promotes) a login-able admin using `ADMIN_EMAIL` / `ADMIN_PASSWORD`
/ `ADMIN_NAME` from `.env` (falls back to `admin@university.edu` /
`Admin123!` / `Admin User` if unset — **only acceptable for local dev**; the
script refuses to run with the default password when `NODE_ENV=production`).

### 7. (Optional) Seed realistic demo data

```bash
npm run seed:students   # 6 login-able demo students (password: Student123!)
npm run seed:rsvps      # has those students RSVP to every event
```

The seed scripts also make every demo student comment on every notice and
event, so a freshly-seeded app has full comment threads instead of an empty
feed. See [Scripts & Seeding](#scripts--seeding) for exactly what each one does.

### 8. Run it

```bash
npm run dev
```

Open <http://localhost:3000>. Log in at `/login` with the admin credentials
from step 6, or register a new student account at `/register` (must match an
`ALLOWED_EMAIL_DOMAINS` domain if you set one).

### Verifying the setup worked

```bash
npm run db:studio
```

Opens Prisma Studio — a GUI to browse the actual database tables. If you see
your seeded categories, notices, events, and the admin user, everything's
wired correctly.

If something's not working, check [Troubleshooting](#troubleshooting)
before re-running steps — most first-time issues are a malformed connection
string (unencoded special characters in the database password) or a stale
dev server after an env/schema change.


---

## Data Model

Full schema: [`prisma/schema.prisma`](../prisma/schema.prisma). This doc
explains *why* it's shaped this way, not just what the fields are.

### Entity relationship overview

```
User ──authors──> Notice ──belongs to──> Category
User ──organizes─> Event  ──belongs to──> Category
User ──has many──> Rsvp ──belongs to──> Event          (unique per user+event)
User ──has many──> Bookmark ──belongs to──> Notice OR Event  (exactly one)
User ──has many──> Comment ──belongs to──> Notice OR Event   (exactly one)
Notice / Event ──has many──> Attachment
User ──has many──> Session, Account   (Better Auth internals)
```

### Models

#### `User`
The single user table for both students and admins — there is no separate
`Admin` table. Role is a column, not a schema split.

| Field | Type | Notes |
|---|---|---|
| `role` | `Role` enum (`ADMIN` \| `STUDENT`) | Defaults to `STUDENT`. Set to `ADMIN` out-of-band (see [Authentication](#authentication)) |
| `department` | `String?` | Optional, shown on profile |
| `emailVerified` | `Boolean` | Currently defaulted `true` on seed/script-created users; real registrations go through Better Auth's verification flow if enabled |

**Why one table, not `Student`/`Admin` subtypes:** the two roles differ only in
*permissions*, not in data shape — an admin has the exact same profile fields
as a student. A role column plus a server-side check (`requireAdmin()`) is
simpler than table inheritance and is the pattern Better Auth's adapter
expects anyway.

#### `Session` / `Account` / `Verification`
Better Auth's own tables, mapped via Prisma (`prismaAdapter`). Don't hand-edit
these — Better Auth owns their shape and writes to them itself.
- `Session`: one row per active login (token, expiry, IP/user-agent).
- `Account`: one row per auth method per user. For email/password, this is
  where the hashed password lives (`providerId: "credential"`).
- `Verification`: short-lived tokens for email verification / password reset.

#### `Category`
A flat lookup table: `name` (unique) + `color` (hex, used for the category dot
in chips — see [Design System](#design-system)). Both `Notice` and `Event`
have a required `categoryId` — every post must have exactly one category.

**Why not a hardcoded enum:** admins manage categories through
`/admin/categories` (create/rename/recolor/delete). An enum would require a
code change + migration for every new category; a table lets admins do it
from the UI.

#### `Notice`
An announcement. Key fields beyond the obvious:

| Field | Notes |
|---|---|
| `body` | HTML string produced by the Tiptap rich-text editor, not Markdown or plain text. Rendered via `dangerouslySetInnerHTML` in `<RichText>` — see [Security](#security) for why this is safe here |
| `imageUrl` | Optional cover image URL (Supabase Storage public URL), nullable — cards fall back to a category-colored gradient when absent |
| `pinned` | Pinned notices sort first in the feed regardless of date |
| `publishedAt` | Defaults to "now" but can be set in the future for scheduled publishing (the create form supports "Publish now" vs "Schedule") |
| `expiresAt` | Nullable; not currently auto-enforced at the query level (a notice past its expiry still shows) — see [Features](#features) for exact admin-form behavior |

#### `Event`
Same shape as `Notice` conceptually, plus event-specific fields:

| Field | Notes |
|---|---|
| `startsAt` / `endsAt` | Required; the event detail page and calendar both key off `startsAt` |
| `location` | Free text, not a structured venue table |
| `capacity` | Nullable = unlimited. Enforced server-side in `setRsvp()` (see [Server Actions](#server-actions--api)) — the client's "spots left" count is a display convenience, not the source of truth |

#### `Rsvp`
Join table between `User` and `Event`, with a `status` (`GOING` |
`INTERESTED`) rather than a boolean, because the UI distinguishes "committed"
from "maybe". `@@unique([userId, eventId])` guarantees one RSVP row per
user per event — RSVPing again updates the existing row (upsert), it never
creates a second one.

#### `Bookmark`
A polymorphic-ish join: `noticeId` and `eventId` are both nullable, and
exactly one is set per row (enforced by application logic in
`toggleBookmark()`, not a database constraint — Postgres/Prisma don't have a
clean way to express "exactly one of these two columns is non-null" as a
schema-level check without a raw SQL `CHECK` constraint, which felt like
overkill here). Two separate unique constraints —
`@@unique([userId, noticeId])` and `@@unique([userId, eventId])` — prevent
double-bookmarking the same item, and both tolerate the "other" column being
null in Postgres (NULLs are not considered equal for uniqueness purposes).

#### `Comment`
Same polymorphic pattern as `Bookmark` (`noticeId` XOR `eventId`). Deleting a
comment is allowed for its author or any admin (see
`deleteComment()` in [Server Actions](#server-actions--api)) — this backs the
admin moderation queue.

#### `Attachment`
File metadata (`url`, `filename`, `mimeType`, `size`) attached to a notice or
event. **Not currently wired to a real upload flow** — the admin forms have a
`Dropzone` UI placeholder (`src/components/quad/admin/form-ui.tsx`) but no
Server Action uploads to this table yet. The image-upload feature (cover
photos) is a separate, fully-wired path — see the `imageUrl` field on
`Notice`/`Event` and [Server Actions](#server-actions--api) `uploadImage()`.
If you want file *attachments* (PDFs, etc.) working end-to-end, that's the
next piece to build, following the same pattern as `uploadImage()`.

### Cascade behavior

Every foreign key from a child table back to `User`, `Notice`, or `Event` is
`onDelete: Cascade` (`Session`, `Account`, `Rsvp`, `Bookmark`, `Comment`,
`Attachment`). Deleting a user deletes their sessions, RSVPs, bookmarks, and
comments; deleting a notice/event deletes its bookmarks, comments, and
attachments. There is currently no "soft delete" — `deleteNotice()` /
`deleteEvent()` are hard deletes. If you need an audit trail or an "archived"
state instead of permanent deletion, that's a schema change (an
`archivedAt DateTime?` column plus filtering it out of `queries.ts`), not
something currently implemented.

### Indexes

- `Notice`: `[pinned, publishedAt]` (feed sort order), `[categoryId]` (filter)
- `Event`: `[startsAt]` (calendar/upcoming sort), `[categoryId]` (filter)
- `Rsvp`: `[eventId]` (counting attendees per event)
- `Comment`: `[noticeId]`, `[eventId]` (loading a post's comment thread)

These match the actual query patterns in `queries.ts` — if you add a new
frequently-filtered/sorted field, add a matching index.

### Making a schema change

1. Edit `prisma/schema.prisma`.
2. `npm run db:push` for a quick, unversioned sync during development (this is
   what the project has used so far — see git history for `imageUrl` being
   added this way).
3. For a production-bound change with a real migration history, use
   `npm run db:migrate` instead (`prisma migrate dev`) going forward — it
   generates a SQL file under `prisma/migrations/` that can be reviewed and
   replayed with `prisma migrate deploy` in production.
4. Update the relevant shape in `queries.ts` (the `select`/`include` and the
   mapped return type) and the TypeScript types in `src/lib/mock.ts` /
   `mock-detail.ts` if the field needs to reach a page component.


---

## Authentication

Auth runs on [Better Auth](https://www.better-auth.com/), configured in
[`src/lib/auth.ts`](../src/lib/auth.ts) (server) and
[`src/lib/auth-client.ts`](../src/lib/auth-client.ts) (browser).

### How sign-up/sign-in actually happens

Better Auth mounts its own endpoints under `/api/auth/*` via the catch-all
route handler at
[`src/app/api/auth/[...all]/route.ts`](../src/app/api/auth/%5B...all%5D/route.ts).
The login/register pages (`src/app/login/page.tsx`, `src/app/register/page.tsx`)
are ordinary Client Components that call `authClient.signIn.email(...)` /
`authClient.signUp.email(...)` from `auth-client.ts` — these are thin wrappers
that POST to those endpoints and handle the session cookie for you. There's no
custom auth API to maintain.

### Roles

There are exactly two roles, stored as a `role` column on `User`
(`ADMIN` | `STUDENT`, default `STUDENT`) — see [Data Model](#data-model).

**Nobody can register as an admin.** In the Better Auth config:

```ts
user: {
  additionalFields: {
    role: { type: "string", required: false, defaultValue: "STUDENT", input: false },
    ...
  },
},
```

`input: false` means Better Auth silently drops `role` if it's present in a
sign-up request body — a client can't set it, full stop. Every registration
becomes a `STUDENT`. Promotion to `ADMIN` happens only out-of-band:

- **`npm run admin:create`** ([`scripts/create-admin.ts`](../scripts/create-admin.ts)) —
  upserts a user by email, sets `role: "ADMIN"`, and writes a `credential`
  account with a hashed password using Better Auth's own hasher
  (`auth.$context.password.hash`), so the account behaves identically to one
  created through the normal sign-up flow.
- Manually via `npm run db:studio`, editing the `role` column on an existing
  user.

### Server-side email-domain enforcement

The register form has a client-side check (`isUniversityEmail()` in
[`src/lib/password.ts`](../src/lib/password.ts)) that gives instant feedback,
but **client checks are a UX courtesy, not a security boundary** — anyone can
call the sign-up endpoint directly. The real enforcement is a Better Auth
`before` hook in `auth.ts`:

```ts
hooks: {
  before: createAuthMiddleware(async (ctx) => {
    if (ctx.path === "/sign-up/email") {
      const email = ctx.body?.email as string | undefined;
      if (!email || !isAllowedEmail(email)) {
        throw new APIError("BAD_REQUEST", { message: "..." });
      }
    }
  }),
},
```

`isAllowedEmail()` ([`src/lib/email-domain.ts`](../src/lib/email-domain.ts))
checks the email's domain against `ALLOWED_EMAIL_DOMAINS` (comma-separated
env var). If that variable is unset or empty, **no restriction is applied** —
any domain can register. This is intentional for local dev/demo flexibility;
set it in production if you want the university-only restriction enforced.

### Sessions

- Better Auth issues a signed session cookie on login/register.
- **Cookie cache** (`session.cookieCache`, 5 minute `maxAge`): most page loads
  read the session straight out of the signed cookie and never touch the
  database. This is why `getCurrentUser()` on a simple page like `/profile` is
  fast even under database latency — see
  [Troubleshooting](#slow-page-loads).
- **Rate limiting** on the auth endpoints themselves — 5 sign-in attempts and
  5 sign-up attempts per 60 seconds, 3 password-reset requests per 5 minutes,
  100/minute on everything else. See [Security](#rate-limiting).

### Reading the session in your own code

**In a Server Component or Server Action:**

```ts
import { getCurrentUser } from "@/lib/session";

const user = await getCurrentUser(); // { id, name, email, role, department, ... } | null
```

`getCurrentUser()` is fault-tolerant — if the session lookup throws (a
database blip, for example), it logs the error and returns `null` rather than
crashing the render. Treat `null` as "render as a logged-out guest", not as an
error state to surface to the user.

**In a Client Component**, don't call `getCurrentUser()` — it's server-only
(it uses `next/headers`). Instead:

- For "is anyone logged in" (used to gate RSVP/bookmark/comment buttons for
  guests), read `useIsAuthenticated()` from
  [`src/components/quad/auth-context.tsx`](../src/components/quad/auth-context.tsx).
  `<AppShell>` (a Server Component) resolves the session once per page load
  and provides it down via `<AuthProvider value={!!user}>`, so nested client
  components never need their own session fetch.
- For the actual user object (name, avatar) in a client component, pass it
  down as a prop from the Server Component parent — see how `<FeedView>`
  receives `userName` from `src/app/feed/page.tsx`.
- If you need live reactivity to auth state changing *within* a client
  component (e.g. a nav that updates immediately after logout without a full
  navigation), use Better Auth's `useSession()` hook from `auth-client.ts`
  instead.

### Route protection

**Admin area:** [`src/app/admin/layout.tsx`](../src/app/admin/layout.tsx)
wraps every route under `/admin/*` and redirects non-admins:

```ts
const user = await getCurrentUser();
if (!user) redirect("/login");
if (user.role !== "ADMIN") redirect("/feed");
```

This is a **layout-level** guard, so it applies to every current and future
page nested under `/admin` automatically — you don't need to remember to add
a check to each new admin page.

**Defense in depth:** the layout guard is a UX/routing convenience, not the
only line of defense. Every admin Server Action
([`src/app/actions/admin.ts`](../src/app/actions/admin.ts)) independently
calls its own `requireAdmin()` check at the top, because Server Actions can be
invoked directly (a malicious client could construct the POST body without
ever rendering the admin page). Never rely on the layout guard alone to
protect a mutation — see [Security](#authorization).

**Student-only pages** (`/saved`, `/my-events`) check auth at the page level
instead of a shared layout, since they don't share a route prefix with each
other the way admin pages do:

```ts
const user = await getCurrentUser();
if (!user) redirect("/login");
```

**Public pages** (`/feed`, `/calendar`, `/search`, notice/event detail) have
no auth check at all — they're intentionally readable by guests. What's
gated is the *actions* on those pages (RSVP, bookmark, comment), not the page
itself. See `useIsAuthenticated()` usage in `<RsvpControl>`,
`<BookmarkButton>`, and `<CommentSection>`.

### Password reset / email verification

Both are wired to send real emails via Gmail SMTP
([`src/lib/mail.ts`](../src/lib/mail.ts)) if `GMAIL_USER` /
`GMAIL_APP_PASSWORD` are set. **Email verification is currently disabled**
(`requireEmailVerification: false` in `auth.ts`) so new accounts can log in
immediately without clicking a link — this was a deliberate choice for
easier demoing. To turn it on for a real deployment:

```ts
emailAndPassword: {
  requireEmailVerification: true,   // was false
  ...
},
emailVerification: {
  sendOnSignUp: true,               // was false
  ...
},
```

Gmail requires an **App Password**, not your normal account password — enable
2-Step Verification on the Google account, then generate one at
<https://myaccount.google.com/apppasswords>. See `.env.example` for the exact
variables.


---

## Features

Every screen, what it does, and the files behind it. Grouped by audience.

### Public (no login required)

| Screen | Route | Behind it |
|---|---|---|
| Landing | `/` | `src/app/page.tsx` — hero, tagline, "Browse notices" / "Log in" CTAs |
| Feed | `/feed` | `src/app/feed/page.tsx` + `<FeedView>` — combined notices/events, magazine-style layout (featured hero, "Latest" list, "Upcoming events" row), category filter, live search, all client-side over server-fetched data |
| Calendar | `/calendar` | `src/app/calendar/page.tsx` + `<CalendarView>` — month grid of events, click a day to see its events |
| Search | `/search` | `src/app/search/page.tsx` + `<SearchView>` — full-text-ish search (title/body substring match) with matched-term `<mark>` highlighting (`src/lib/highlight.tsx`) |
| Notice detail | `/notices/[id]` | `src/app/notices/[id]/page.tsx` — full rich-text body, attachments, comments |
| Event detail | `/events/[id]` | `src/app/events/[id]/page.tsx` — date/time/location, RSVP control, description, attachments, comments |
| 404 | any unmatched route | `src/app/not-found.tsx` — branded, not the framework default |
| Error boundary | any render error | `src/app/error.tsx` — branded "something went wrong" with a retry button |

Notices and events are **readable by anyone**, logged in or not — this is a
deliberate product decision (a notice board is meant to be public). What's
gated behind login is *acting* on them.

### Requires login (any role)

| Feature | Where | Behind it |
|---|---|---|
| RSVP | Event detail | `<RsvpControl>` → `setRsvp()` server action. Guests see a "Log in to RSVP" prompt instead of the control |
| Bookmark | Any notice/event card or detail page | `<BookmarkButton>` → `toggleBookmark()`. Guests see a toast prompting login |
| Comment | Any notice/event detail | `<CommentSection>` → `addComment()` / `deleteComment()`. Guests see a "Log in to comment" prompt; comment authors (and admins) can delete their own comments. Paginated 5 per page via `<Pagination>` |
| Saved items | `/saved` | `src/app/saved/page.tsx` — everything the current user has bookmarked |
| My Events | `/my-events` | `src/app/my-events/page.tsx` — events the user has RSVP'd to, grouped into upcoming/past |
| Profile | `/profile` | View/edit name & department, logout |
| Notifications | `/notifications` | Notification preferences UI |

### Admin only (`role === "ADMIN"`, enforced by `src/app/admin/layout.tsx`)

Admin nav (`src/components/quad/admin/admin-nav.ts`): **Dashboard → Feed →
Categories → Moderation**, plus a persistent "+ Create" menu.

| Screen | Route | Behind it |
|---|---|---|
| Dashboard | `/admin` | `src/app/admin/page.tsx` — summary cards (notice/event/RSVP counts) from `getDashboardData()` in `queries.ts` |
| Create notice | `/admin/notices/new` | `<NoticeForm>` — title, rich-text body (Tiptap), category, cover image, pin toggle, publish now/schedule, expiry date |
| Create event | `/admin/events/new` | `<EventForm>` — title, rich-text description, category, cover image, location, start/end, capacity |
| Categories | `/admin/categories` | `<CategoriesManager>` — create/rename/recolor/delete categories, with post counts per category (`getCategoriesWithCounts()`) |
| Moderation | `/admin/moderation` | `<ModerationView>` — every comment across the app (`getModerationComments()`), with delete |

Admin create forms share `src/components/quad/admin/form-ui.tsx` (labeled
field wrapper, category select, dropzone shell) and
`src/components/quad/admin/rich-text-editor.tsx` (Tiptap wrapper — bold,
italic, underline, lists, links; sanitized on render, see
[Security](#rich-text-sanitization)).

There is currently **no edit UI** for existing notices/events — only create
and delete. Editing would follow the same `<NoticeForm>`/`<EventForm>`
pattern, pre-filled with the existing record and calling a new
`updateNotice()`/`updateEvent()` action (not yet implemented).

### Image uploads (cover photos)

Admins can attach a cover image to a notice or event via
`<ImageUpload>` (`src/components/quad/admin/image-upload.tsx`), which calls
the `uploadImage()` Server Action. Files go to Supabase Storage (a public
bucket); the resulting public URL is stored on `Notice.imageUrl` /
`Event.imageUrl`. Feed cards, the featured hero, and the calendar all render
the real image when present and fall back to a category-colored gradient
otherwise — see `categoryGradient()` in `src/lib/categories.ts`. Full
constraints (file size, type, rate limit) are in
[Server Actions](#uploadimage) and
[Security](#security).

### Loading, empty, and error states

- **Loading**: list/detail pages wrap their data-fetching Server Component in
  `<Suspense>` with a shimmer skeleton fallback
  (`src/components/quad/skeletons.tsx`) so slow database round-trips show a
  placeholder instead of a blank screen or a full-page spinner.
- **Empty states**: `<EmptyState>` (`src/components/quad/empty-state.tsx`) is
  used on Saved (nothing bookmarked yet), My Events (no RSVPs yet), and search
  with no results — each with an icon, a short message, and a relevant call
  to action (e.g. "Browse events").
- **404 / error**: see the table above. Both are intentionally branded rather
  than left as framework defaults.

### What's explicitly *not* built yet

Documented here so it's discoverable rather than a silent gap:

- **Editing** existing notices/events (create + delete only).
- **File attachments** on notices/events beyond the cover image — the
  `Attachment` model and a `<Dropzone>` UI shell exist, but no upload action
  writes to that table yet (see [Data Model](#attachment)).
- **Real-time updates** — no websockets/polling; pages reflect new data on
  next navigation (via `revalidatePath()`), not live-pushed to open tabs.
- **Notification delivery** — the notification *settings* UI exists at
  `/notifications`, but nothing currently sends a notification based on those
  preferences (no email digest, no push).
- **Notice expiry enforcement** — `Notice.expiresAt` is stored and shown, but
  `getFeedItems()` does not filter out expired notices automatically.


---

## Server Actions & API

This app has almost no traditional REST API. Mutations are **Server
Actions** — `"use server"` functions that client components import and call
directly. This doc is the lookup table: signature, who can call it, what it
validates, and what it invalidates.

Every action returns a discriminated union so callers can branch without
throwing:

```ts
type ActionResult = { ok: true; id?: string } | { ok: false; error: string };
```

`error` is always a user-facing message (shown directly in a toast) — never a
raw exception message.

---

### `src/app/actions/engagement.ts`
Anything a **logged-in user** (any role) can do to a notice/event.

#### `setRsvp(eventId: string, status: "GOING" | "INTERESTED" | null): Promise<ActionResult>`
- Requires login (`"Log in to RSVP"` otherwise).
- Rate-limited: 30 calls/minute per user.
- `status: null` removes the RSVP entirely.
- **Capacity is enforced here, server-side** — before setting `GOING`, it
  counts existing `GOING` RSVPs (excluding the current user's own, so
  re-confirming an existing RSVP doesn't self-block) and rejects with
  `"This event is full"` if at capacity. The client's "spots left" display is
  informational; this check is the actual source of truth.
- Upserts on `[userId, eventId]` — safe to call repeatedly.
- Revalidates: the event's detail page, `/feed`, `/my-events`.

#### `toggleBookmark(target: { noticeId?: string; eventId?: string }): Promise<ActionResult & { saved?: boolean }>`
- Requires login. Rate-limited: 60/minute.
- Exactly one of `noticeId`/`eventId` must be provided.
- Looks up an existing bookmark; deletes it if found, creates it if not
  (this is the toggle — there's no separate "add"/"remove" call).
- Revalidates: `/saved`.

#### `addComment(target: { noticeId?: string; eventId?: string; body: string }): Promise<ActionResult & { id?: string; author?: string }>`
- Requires login. Rate-limited: **5/minute** (the strictest of the engagement
  limits — comments are free-text and the main spam vector).
- Validates: body is non-empty after trim, and ≤2000 characters.
- Body is stored and rendered as **plain text** (React auto-escapes it — no
  `dangerouslySetInnerHTML` for comments, unlike notice/event bodies). See
  [Security](#rich-text-sanitization).
- Revalidates: the parent notice/event's detail page.

#### `deleteComment(commentId: string): Promise<ActionResult>`
- Requires login. **Authorization**: the comment's author, or any admin —
  checked explicitly (`comment.userId !== user.id && user.role !== "ADMIN"` →
  `"Not allowed"`). This is what backs the admin moderation queue.
- Revalidates: the parent notice/event's detail page, `/admin/moderation`.

---

### `src/app/actions/admin.ts`
Everything here starts with `const admin = await requireAdmin(); if (!admin) return { ok: false, error: "Admins only" };`
— every single action independently re-checks the role server-side, not just
relying on the `/admin` layout guard. See
[Security](#authorization) for why this matters.

#### `uploadImage(formData: FormData): Promise<{ ok: true; url: string } | { ok: false; error: string }>`
- Admin only. Rate-limited: 20 uploads / 5 minutes.
- Expects a `file` field on the `FormData`.
- Validates: file present, ≤5 MB, MIME type is one of
  `image/png`, `image/jpeg`, `image/webp`, `image/gif`.
- Returns early with a friendly error if Supabase Storage isn't configured
  (`SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` unset) rather than throwing.
- Uploads to the configured bucket under a random UUID filename (collision-proof,
  and doesn't leak the original filename), then returns the bucket's public URL.
- **Note:** Server Actions have a default 1 MB request body limit in Next.js.
  This project raises it to 6 MB via `experimental.serverActions.bodySizeLimit`
  in `next.config.ts` specifically so this action can receive images up to the
  5 MB validated limit plus multipart overhead. If you lower the image size
  limit here, you can lower that config value too, but don't remove it.

#### `createNotice(input: NoticeInput): Promise<ActionResult>`
```ts
type NoticeInput = {
  title: string; body: string; category: string; pinned: boolean;
  imageUrl?: string | null;
  publishedAt?: string | null; // ISO; null/undefined = now
  expiresAt?: string | null;
};
```
- Admin only. Validates: title non-empty, category resolves to a real
  `Category` row (by name).
- `author` is always the calling admin (`authorId: admin.id`) — not a field
  the client can set.
- Revalidates: `/feed`, `/admin`.

#### `createEvent(input: EventInput): Promise<ActionResult>`
```ts
type EventInput = {
  title: string; description: string; category: string; location: string;
  startsAt: string; endsAt: string; // ISO
  capacity?: number | null; imageUrl?: string | null;
};
```
- Admin only. Validates: title, location non-empty; both times present;
  **`endsAt` must be after `startsAt`**; category resolves.
- `organizer` is always the calling admin.
- Revalidates: `/feed`, `/calendar`, `/admin`.

#### `deleteNotice(id: string)` / `deleteEvent(id: string): Promise<ActionResult>`
- Admin only. Hard delete (cascades to attachments/bookmarks/comments —
  see [Data Model](#cascade-behavior)). No confirmation logic
  lives in the action itself — that's a UI-layer responsibility.
- Revalidates the relevant public pages + `/admin`.

#### `createCategory(name: string, color: string)` / `updateCategory(id: string, color: string)` / `deleteCategory(id: string): Promise<ActionResult>`
- Admin only.
- `createCategory` rejects duplicate names (`"That category already exists"`).
- `updateCategory` only changes `color` — renaming an existing category isn't
  currently supported (would need a new action or extending this one).
- `deleteCategory` refuses if any notice or event still references it
  (`"This category is in use and can't be deleted"`) — you must reassign or
  delete the dependent posts first. There's no cascade/reassignment UI for
  this yet.

---

### The one real API route

[`src/app/api/auth/[...all]/route.ts`](../src/app/api/auth/%5B...all%5D/route.ts)
mounts Better Auth's handler for both `GET` and `POST`. This single file
serves every `/api/auth/*` endpoint (`sign-in/email`, `sign-up/email`,
`sign-out`, `request-password-reset`, `get-session`, etc.) — you don't add
routes here yourself; Better Auth owns this surface. See
[Authentication](#authentication) for how the client calls it.

### Adding a new Server Action

Follow the existing pattern:
1. Add the function to the appropriate file in `src/app/actions/` (or a new
   file if it's a new domain), marked `"use server"` at the top of the file.
2. Auth check first: `getCurrentUser()` for any logged-in user, or
   `requireAdmin()` for admin-only.
3. Rate-limit it if it's user-repeatable — `rateLimited(key, max, windowMs)`
   from `src/lib/rate-limit.ts` (see [Security](#rate-limiting)
   for guidance on picking limits).
4. Validate input server-side even if the form already validates client-side.
5. Return `{ ok: true, ... }` or `{ ok: false, error: "..." }` — never throw
   for expected failure cases (throw only for truly unexpected errors, which
   Next.js will route to `error.tsx`).
6. Call `revalidatePath()` for every page whose cached render the mutation
   could affect.


---

## Design System

The visual language for this app, defined in
[`src/app/globals.css`](../src/app/globals.css) and originally specified in
[`DESIGN_BRIEF.md`](../DESIGN_BRIEF.md) / [`designer/`](../designer/) (the
handoff docs used to design the screens before implementation).

### Tokens

All colors are CSS custom properties on `:root` (light) and `.dark`, mapped
into Tailwind's theme via `@theme inline` so they're usable as ordinary
Tailwind classes (`bg-primary`, `text-muted-foreground`, `bg-surface-2`, etc.)
— never hardcode a hex value in a component; use the token.

#### Brand

| Token | Light | Use |
|---|---|---|
| `primary` | `#4F46E5` (indigo) | Primary actions, links, active nav state |
| `primary-600` | `#4338CA` | Hover/pressed state for primary |
| `primary-50` | `#EEEEFE` | Tint backgrounds (active nav bg, secondary buttons) |
| `teal` | `#0E9488` | Secondary accent — used specifically for **admin/create** affordances, distinguishing "add something" from ordinary primary actions |
| `teal-50` | `#DCF1EE` | Teal tint |

#### Surfaces & neutrals

| Token | Light | Use |
|---|---|---|
| `app-bg` | `#F6F7FC` | Page background |
| `surface` | `#FFFFFF` | Cards |
| `surface-2` | `#F1F3FA` | Inputs, chips, subtle fills |
| `border` | `#E7E9F3` | Card/control borders |
| `hair` | `#EFF1F8` | Hairline dividers (lighter than `border`) |
| `faint` | `#9197AE` | Tertiary text, placeholders |

#### Semantic

| Token | Color pair | Use |
|---|---|---|
| `success` / `success-tint` | `#16A34A` / `#E4F4EA` | "Going" RSVP, available spots |
| `warning` / `warning-tint` | `#C2740B` / `#F7ECDB` | "Interested" RSVP, pinned badge |
| `danger` / `danger-tint` | `#DC2626` / `#FBE7E7` | Delete actions, "Full" event badge |

#### Dark mode

Every token above has a `.dark` override in `globals.css` (e.g. `primary`
becomes a lighter `#8B86F0` for contrast against a dark background,
`app-bg`/`surface` invert to near-black). Components should never assume
light mode — always reach for the token, not a literal color, and dark mode
is handled automatically.

#### Typography

Two font families, loaded via `next/font` in
[`src/app/layout.tsx`](../src/app/layout.tsx):

- **Sora** (`--font-heading`) — all headings, card titles, numerals. Bold,
  slightly condensed, gives the brand its distinct feel.
- **Plus Jakarta Sans** (`--font-body`) — everything else (body text, labels,
  buttons).

Use the `font-heading` Tailwind class for anything that should read as a
heading; the base `font-sans` (mapped to the body font) is the default.

#### Category colors

Categories don't get arbitrary admin-chosen colors rendered as full
backgrounds — instead, each category has a **dot color** used consistently
as a small indicator next to the category name (in chips, calendar pills,
etc.), defined in [`src/lib/categories.ts`](../src/lib/categories.ts):

```ts
export const CATEGORY_DOT: Record<string, string> = {
  Academic: "#6573A8", Exams: "#B26079", Placements: "#4E9387",
  Sports: "#74935E", Clubs: "#8772B5", Workshops: "#B59440", General: "#646A82",
};
```

`categoryGradient(name)` derives a diagonal gradient from the dot color,
used as the fallback "cover image" on feed cards when a notice/event has no
uploaded `imageUrl` — so every card looks intentional even without a photo.

### Reusable components

Located in `src/components/quad/` (app-specific) vs. `src/components/ui/`
(generic shadcn/ui primitives — button, dialog, dropdown, etc., installed via
`npx shadcn add <component>` and then customized to pull from the tokens
above).

| Component | Purpose |
|---|---|
| `<CategoryChip>` | Category name + dot, used everywhere a post shows its category |
| `<NoticeCard>` / `<EventCard>` | The feed's two card types — event cards additionally show a date block, location, and RSVP status pill |
| `<BookmarkButton>` / `<BookmarkFlag>` | The save toggle; `Flag` is the icon graphic, `Button` wraps it with the click handler and login gate |
| `<RsvpControl>` | Going/Interested segmented control on event detail, with live capacity math |
| `<CommentSection>` | Comment list + composer + `<Pagination>`, shared by both notice and event detail |
| `<Pagination>` | Generic numbered pager (prev/next chevrons + page numbers with ellipsis for long ranges) — currently used by comments, reusable anywhere a list needs paging |
| `<EmptyState>` | Icon + message + CTA, for any "nothing here" state |
| `<Skeleton>` variants (`skeletons.tsx`) | Shimmer placeholders shown via `<Suspense>` while a page's data loads |
| `<AppShell>` | The student-facing layout shell — sidebar + top bar + `<AuthProvider>`, wraps every student page |
| `<AdminShell>` (`admin/`) | The equivalent shell for `/admin/*` pages, with the admin nav and "+ Create" menu |
| `<RichTextEditor>` (`admin/`) | Tiptap-based WYSIWYG editor used in the notice/event create forms |
| `<RichText>` | Renders stored HTML (from the editor) safely — see [Security](#rich-text-sanitization) |

### Layout conventions

- **Sidebar navigation** on desktop (`≥lg`), **bottom nav** on mobile —
  `<Sidebar>`/`<BottomNav>` for students, `<AdminSidebar>`/`<AdminBottomNav>`
  for admins. Both read active state from the current pathname.
- **Feed layout** is a "magazine" composition: one large featured
  card, a "Latest" compact list, and a horizontally-scrollable "Upcoming
  events" row — not a uniform grid of identical cards. See `<FeedView>`.
- **Cards use `rounded-[18px]`** consistently (not Tailwind's default radius
  scale) — this specific radius is part of the brand look established in the
  original design brief; match it for new card-like surfaces.

### Where the design originated

[`DESIGN_BRIEF.md`](../DESIGN_BRIEF.md) is the original prompt used with an
AI design tool to generate the visual direction; `designer/` contains the
resulting reference screens and design tokens as delivered. `globals.css` is
the implemented, canonical version — if the two ever disagree, `globals.css`
(what's actually running) wins.


---

## Security

What's protected, how, and — just as important — what isn't, so nothing here
is taken on faith.

### Authentication

- Passwords hashed by Better Auth (not custom crypto).
- Sessions are signed, HTTP-only cookies with a 5-minute server-side cache
  (see [Authentication](#authentication)).
- Auth endpoints rate-limited (below).
- University-email restriction is enforced **server-side** in a Better Auth
  hook, not just the register form's client-side check — see
  [Authentication](#server-side-email-domain-enforcement).
  This closes the obvious bypass (calling `/api/auth/sign-up/email` directly).

### Authorization

**Every privileged Server Action re-checks the role itself.** The `/admin`
layout guard (`src/app/admin/layout.tsx`) stops a non-admin from *seeing* the
admin pages, but it does not protect the underlying Server Actions — those
are independently callable. That's why every function in
`src/app/actions/admin.ts` opens with:

```ts
const admin = await requireAdmin();
if (!admin) return { ok: false, error: "Admins only" };
```

`requireAdmin()` re-fetches the current session and checks
`user.role === "ADMIN"` fresh, every call — it does not trust a role claim
passed in from the client, and it does not trust that the request came from
the admin UI. This is the correct model: **the UI is a convenience, the
Server Action is the actual boundary.**

`deleteComment()` has a narrower rule worth calling out specifically: a
comment's author OR an admin can delete it — checked explicitly, not
role-gated wholesale (`comment.userId !== user.id && user.role !== "ADMIN"`).

### Rich text sanitization

Notice and event bodies are authored as HTML via the Tiptap editor and stored
as-is in the database. Rendering that HTML is a stored-XSS risk in general —
even though only admins currently author it, "only admins" is one compromised
admin account away from being "anyone," so this is treated as a real
boundary, not skipped as unnecessary:

- **`<RichText>`** (`src/components/quad/rich-text.tsx`) runs all admin
  content through **DOMPurify** before rendering, with an explicit allowlist
  matching exactly what the editor can produce (`p`, `strong`, `em`, lists,
  links, headings — no `script`, `iframe`, event handler attributes, etc.)
  and a URI scheme allowlist (`https?:`, `mailto:`, relative/hash links —
  blocks `javascript:` and other dangerous schemes).
- **Comments are not rich text at all** — they're rendered as plain
  interpolated JSX (`{comment.body}`), which React escapes automatically.
  There is no `dangerouslySetInnerHTML` anywhere in the comment path. This is
  intentional: comments come from *any* logged-in student, so they get zero
  HTML trust, not a sanitized subset.
- **Never render `Notice.body` / `Event.description` outside `<RichText>`.**
  If you add a new place that displays a post's body (an email digest, an
  export, a different card), route it through `<RichText>` (for HTML
  contexts) or `stripHtml()` (`src/lib/html.ts`, for plain-text contexts like
  card snippets and `<meta>` descriptions) — never interpolate the raw field.

### Rate limiting

Two independent layers — see [`src/lib/rate-limit.ts`](../src/lib/rate-limit.ts).

**Auth endpoints** (Better Auth's built-in limiter, configured in `auth.ts`):

| Endpoint | Limit |
|---|---|
| Sign in | 5 / 60s |
| Sign up | 5 / 60s |
| Password reset request | 3 / 5min |
| Everything else under `/api/auth/*` | 100 / 60s |

**Server Actions** (custom in-memory limiter, keyed per user ID):

| Action | Limit |
|---|---|
| `addComment` | 5 / minute |
| `setRsvp` | 30 / minute |
| `toggleBookmark` | 60 / minute |
| `uploadImage` | 20 / 5 minutes |

Limits are chosen by how abusable and how "normal-usage-bursty" each action
is — comments are the tightest because they're free text and the main spam
vector; bookmarking is the loosest because rapid toggling during normal
browsing is legitimate.

**Known limitation, stated plainly:** the Server Action limiter is
**in-memory and per-process**. It works correctly on a single Node server
(local dev, one traditional host). On multi-instance serverless (e.g. Vercel,
where each invocation can hit a different lambda instance), each instance has
its own counter, so the *effective* limit is roughly `limit × instance count`
— not a hard global cap. For a production deployment on serverless
infrastructure where this matters, replace the in-memory `Map` in
`rate-limit.ts` with a shared store (Upstash Redis is the standard pairing
with Vercel) behind the same `rateLimit()`/`rateLimited()` function
signatures, so no call site needs to change.

### Secrets

- `.env` is gitignored; `.env.example` documents every variable without real
  values.
- `SUPABASE_SERVICE_ROLE_KEY` is used **only** in server-only modules
  (`src/lib/storage.ts`, imported only by Server Actions) — it is never
  imported into a Client Component and never exposed via `NEXT_PUBLIC_*`.
- `BETTER_AUTH_SECRET` signs session cookies — treat it like any other
  credential; rotating it invalidates all existing sessions.
- If a secret is ever pasted into a chat log, ticket, or screenshot, **treat
  it as compromised and rotate it** (Supabase → reset the service role key
  and/or database password; generate a new `BETTER_AUTH_SECRET`) even though
  it never reached the git history.

### Input validation

Every Server Action validates its own inputs server-side, independent of
whatever the calling form already checked — e.g. `createEvent` re-verifies
`endsAt > startsAt` and that the category name resolves to a real row, `
addComment` re-checks length, `uploadImage` re-checks file type/size. Client-side
validation exists purely for immediate UX feedback; treat it as decoration,
never as the enforcement. See [Server Actions](#server-actions--api) for the
exact checks per action.

### What's explicitly out of scope / not hardened

Stated here so it's a known gap, not a silent one:

- **No CSRF token machinery** — Server Actions have built-in CSRF protection
  from Next.js (they check the `Origin` header against the deployment's
  allowed origins), so this is handled by the framework, not something this
  app added itself. If you add a traditional API route that accepts
  state-changing requests, it would need its own protection.
- **No audit log** — admin deletes (notice/event/category/comment) are
  permanent with no record of who deleted what or when, beyond whatever your
  hosting platform's logs capture.
- **No content moderation automation** — the moderation queue
  (`/admin/moderation`) surfaces all comments for manual review; there's no
  profanity filter, spam classifier, or reporting flow from students.
- **Email verification is currently disabled** by default (see
  [Authentication](#password-reset--email-verification))
  — anyone can register with any address on an allowed domain without
  proving they own it, until you turn verification back on.


---

## Scripts & Seeding

Every `npm run` script, what it does, and whether it's safe to re-run.

### Database

| Script | Does |
|---|---|
| `npm run db:generate` | Regenerates the Prisma client from `schema.prisma` (runs automatically on `npm install` via `postinstall`) |
| `npm run db:push` | Pushes the current `schema.prisma` straight to the database — fast, no migration file, used throughout this project's development. Non-destructive for additive changes (new nullable columns); can prompt/warn for destructive ones |
| `npm run db:migrate` | `prisma migrate dev` — generates a versioned SQL migration file. Use this instead of `db:push` once you want a real migration history (e.g. before a team collaborates, or before production deploys) |
| `npm run db:seed` | Runs [`prisma/seed.ts`](../prisma/seed.ts) — idempotent (uses `upsert`), safe to re-run |
| `npm run db:studio` | Opens Prisma Studio, a local GUI for browsing/editing every table directly |

#### What `db:seed` creates

- **7 categories** (Academic, Exams, Placements, Clubs, Workshops, Sports,
  General) with fixed colors.
- **A content-authorship admin**: `seed-admin@university.edu` /
  "Notice Board Admin". **This account has no password and cannot log in** —
  it exists purely so seeded notices/events have a realistic author name
  instead of a null. To get a real, login-able admin, use
  `npm run admin:create` (below).
- A handful of sample notices and events.

### Admin & storage bootstrap

| Script | Does |
|---|---|
| `npm run admin:create` | Creates or promotes a **login-able** admin account. Reads `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` from `.env` (defaults: `admin@university.edu` / `Admin123!` / `Admin User` — **refuses to run with the default password when `NODE_ENV=production`**, forcing you to set a real one). Safe to re-run — upserts by email and resets the password each time, so it also doubles as a "reset the admin password" tool |
| `npm run storage:setup` | Creates the Supabase Storage bucket (named per `SUPABASE_STORAGE_BUCKET`, default `images`) as **public**, 5 MB file limit, image MIME types only. Checks for an existing bucket first — safe to re-run, no-ops if already created |

### Demo data

| Script | Does |
|---|---|
| `npm run seed:students` | Creates **6 login-able demo students** (real names, `@university.edu` emails, assigned departments), all sharing the password in `DEMO_STUDENT_PASSWORD` (default `Student123!`). Then has **every student comment on every existing notice and event** with varied, context-appropriate text (different wording for notices vs. events), with comment timestamps randomly spread between the post's date and now so threads look organic rather than batch-created |
| `npm run seed:rsvps` | Has the same demo students RSVP to every event — mostly `GOING`, roughly 1-in-4 `INTERESTED`, **respecting each event's capacity** (won't push a `GOING` count past `capacity`; falls back to `INTERESTED` once full) |

Both are **idempotent**: re-running `seed:students` won't create duplicate
students or duplicate comments (it checks for an existing comment per
student-per-post before creating one); re-running `seed:rsvps` won't create
duplicate RSVPs (checked via the `[userId, eventId]` unique constraint).

#### Demo student accounts

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

### Recommended order for a fresh database

```bash
npm run db:push
npm run db:seed
npm run storage:setup
npm run admin:create
npm run seed:students   # optional, for a fuller demo
npm run seed:rsvps      # optional, run after seed:students
```

### Writing a new script

Follow the pattern in `scripts/*.ts`:
1. `import "dotenv/config";` first, so `.env` loads outside of Next.js's own
   env handling (these scripts run via `tsx`, not `next dev`).
2. Import `prisma` from `../src/lib/prisma` (reuse the singleton) and `auth`
   from `../src/lib/auth` if you need Better Auth's password hasher.
3. Wrap logic in `main()`, called with `.catch(...).finally(() => prisma.$disconnect())` —
   scripts must disconnect Prisma explicitly or the process hangs.
4. Prefer `upsert` over `create` so the script is safe to re-run.
5. Add the script to `package.json`'s `"scripts"` block and to this doc.


---

## Deployment

This app is a standard Next.js app with no custom server, so it deploys
cleanly to any Next.js-compatible host. **Vercel** is the path of least
resistance (same company as Next.js, zero-config for this project shape) and
is what these instructions assume; the general steps transfer to any other
Node host.

### Before you deploy

1. **Move your Supabase project to a region near your users**, if you haven't
   already — cross-region database latency is the single biggest performance
   lever for this app (every page does at least one query). See
   [Troubleshooting](#slow-page-loads).
2. **Rotate any secret that was ever pasted somewhere insecure** (a chat log,
   a screenshot, a ticket) — the Supabase service role key and database
   password especially.
3. Run `npm run build` locally first to catch build-time errors before
   pushing to a host that charges you for failed builds.

### Deploying to Vercel

1. Push the repo to GitHub (already done if you're reading this from the
   deployed repo).
2. [vercel.com](https://vercel.com) → **Add New → Project** → import the repo.
   Vercel auto-detects Next.js; no build command changes needed.
3. **Environment variables** — copy every variable from your local `.env`
   into Vercel's project settings (**Settings → Environment Variables**).
   Set them for Production (and Preview, if you want preview deployments to
   also hit the database — consider a separate Supabase project for previews
   if you don't want preview traffic touching production data).

   Update these two for the production domain once you know it:
   - `BETTER_AUTH_URL` → `https://your-domain.vercel.app` (or your custom domain)
   - `NEXT_PUBLIC_APP_URL` → same value

4. Deploy. Vercel runs `npm install` (which triggers `postinstall` →
   `prisma generate`) then `npm run build`.
5. **After the first deploy**, run the one-time setup scripts against the
   production database from your local machine (point your local `.env` at
   the production `DATABASE_URL`/`DIRECT_URL` temporarily, or run them from a
   Vercel CLI shell):
   ```bash
   npm run db:push        # or db:migrate deploy if you've adopted migrations
   npm run db:seed
   npm run storage:setup
   npm run admin:create   # with a real ADMIN_PASSWORD set
   ```

### Production-specific hardening to revisit

These were deliberately left in a "demo-friendly" state during development —
flip them before treating this as a real production deployment:

| Setting | Current (dev) | Production |
|---|---|---|
| `requireEmailVerification` (`src/lib/auth.ts`) | `false` | `true` — requires `emailVerification.sendOnSignUp: true` too, and a working Gmail SMTP config |
| `ADMIN_PASSWORD` | Falls back to `Admin123!` if unset | **Must** be set to a strong value — `create-admin.ts` already refuses the default when `NODE_ENV=production`, so this is partially enforced for you |
| Rate limiter (`src/lib/rate-limit.ts`) | In-memory, per-process | Fine for a single-instance deploy; if you scale to multiple serverless instances, swap in a shared store (Upstash Redis) — see [Security](#rate-limiting) |
| `ALLOWED_EMAIL_DOMAINS` | Often left unset for local testing | Set to your real university domain(s) if you want registration actually restricted |

### Database connection notes for serverless

`DATABASE_URL` (the pooled connection, port 6543) is what the deployed app
uses at runtime — Vercel's serverless functions open many short-lived
connections, which is exactly what Supabase's transaction pooler (pgbouncer)
is designed for. Never point production traffic at the direct connection
(port 5432, `DIRECT_URL`) — that's for migrations only and will exhaust
Postgres's connection limit under real load.

If you see `PrismaClientInitializationError` in production logs, see
[Troubleshooting](#database-connection-errors) — the same
pooler flakiness seen in local dev can happen in production, and the fix
(connection string parameters, not code) is the same.

### next.config.ts settings that matter for deployment

```ts
experimental: {
  serverActions: { bodySizeLimit: "6mb" },
}
```

This raises the Server Action request-body limit above Next's 1 MB default so
the image-upload action can receive files up to its own 5 MB validated limit.
If you change the upload size limit in `uploadImage()`
(`src/app/actions/admin.ts`), keep this value comfortably above it.

### Monitoring after deploy

There's no built-in error tracking or analytics in this project. At minimum,
check Vercel's function logs after deploying for:
- Repeated `[session] getSession failed` lines (database connectivity issues
  — see Troubleshooting)
- Any `PrismaClientInitializationError` (same)
- 429s on `/api/auth/*` if real users are hitting the auth rate limits
  (would indicate the limits are too tight for real usage, or an actual
  attack)


---

## Troubleshooting

Real issues encountered while building this project, and their actual fixes
— not generic advice.

### Database connection errors

**Symptom:** `PrismaClientInitializationError: Can't reach database server at
aws-0-<region>.pooler.supabase.com:6543` (or `:5432`), sometimes appearing as
`[session] getSession failed` in server logs, sometimes as a 500 on a page
that queries the database.

**Cause:** Supabase's connection pooler occasionally drops idle connections.
This is usually **transient** — a retry a few seconds later succeeds. It got
worse in this project specifically when the pooled connection string didn't
have pgbouncer-friendly parameters.

**Fix, in order of what actually helped:**
1. Make sure `DATABASE_URL` (the port-6543 pooled URL) has
   `?pgbouncer=true&connection_limit=5&pool_timeout=20` appended — the
   `connection_limit` matters most; too high and you get more of these
   drops, too low (e.g. `1`) and unrelated queries serialize behind each
   other unnecessarily, making every page slower than it needs to be. `5`
   was the balance that worked for this project's traffic.
2. If it's still happening under real load, it's worth checking whether your
   Supabase project's region is far from where your app server runs (see
   [Slow page loads](#slow-page-loads) below) — cross-region round-trips
   both cause more blips and make each blip's retry cost more.
3. `getCurrentUser()`/`getSession()` in `src/lib/session.ts` are already
   fault-tolerant (they catch and return `null` instead of throwing), so a
   blip during a session check degrades to "treat as logged out" rather than
   crashing the page. If you add new code that queries the database directly
   for something session-adjacent, consider the same pattern.

### Body exceeded 1 MB limit (image upload)

**Symptom:** `Error: Body exceeded 1 MB limit. To configure the body size
limit for Server Actions, see: https://nextjs.org/...` when uploading a cover
image larger than ~1 MB.

**Cause:** Next.js caps Server Action request bodies at 1 MB by default
(a DDoS/resource-exhaustion mitigation). The image upload feature validates
files up to 5 MB, which will always exceed the framework default.

**Fix:** Already applied in `next.config.ts`:
```ts
experimental: { serverActions: { bodySizeLimit: "6mb" } },
```
**This requires a dev server restart to take effect** — Next.js reads
`next.config.ts` once at startup, not on every request. If you change this
value, kill and restart `npm run dev`.

### Changes to `prisma/schema.prisma` don't show up at runtime

**Symptom:** You add a field (e.g. `imageUrl`), run `npm run db:push`
successfully, but the app still behaves as if the field doesn't exist —
reads come back `undefined`, or TypeScript complains the field doesn't exist
on the Prisma type even after `prisma generate` ran.

**Cause:** `npm run db:push` updates the *database* and regenerates the
Prisma client *on disk*, but a `next dev` process that's already running has
the **old** Prisma client loaded in memory (Node doesn't hot-reload
`node_modules`). The dev server needs to restart to pick up the regenerated
client.

**Fix:** Stop the dev server (`Ctrl+C`, or on Windows,
`Stop-Process -Id (Get-NetTCPConnection -LocalPort 3000 -State Listen).OwningProcess -Force`)
and run `npm run dev` again after any schema push.

### Slow page loads

**Symptom:** Every navigation takes 1.5–3+ seconds, even for simple pages,
even after the connection-pooler fixes above.

**Causes, roughly in order of impact:**

1. **Database region distance.** If your Supabase project is in a different
   region/continent than wherever you're testing from (or wherever your app
   is deployed), every single query pays that round-trip cost, and most
   pages make 3-5 queries. This is usually the dominant factor. Fix: create
   the Supabase project in a region close to your users (there's no "move"
   button — you'd create a new project in the right region and re-run
   `db:push` + reseed).
2. **`next dev` compiles routes on first visit.** The very first request to
   any route after starting the dev server (or after editing a file in that
   route's chain) pays a Turbopack compile cost on top of the actual page
   logic. This disappears entirely in a production build (`next build` +
   `next start`, or a Vercel deploy) — don't judge production performance
   from `npm run dev` timings.
3. **Session cookie cache reduces but doesn't eliminate database hits.**
   `getCurrentUser()` is cheap (reads from the signed cookie) for most
   requests within the 5-minute cache window, but the actual page *content*
   queries (the feed's notices/events/RSVPs/bookmarks, run in parallel via
   `Promise.all`) still hit the database every time — there's no page-level
   data cache beyond Next's `revalidatePath()` invalidation model.

**What's already been done to help:** `<Suspense>` boundaries with skeleton
fallbacks around the slow data-fetching parts of each page, so users see a
shimmer instead of a frozen screen during the wait (see
[Features](#loading-empty-and-error-states)). This doesn't make
queries faster, but it makes the wait feel intentional rather than broken.

### Stale dev server on port 3000

**Symptom:** `npm run dev` fails with "Port 3000 is in use by process
<PID>... Another next dev server is already running" — or worse, it silently
starts on 3001 and your browser (pointed at 3000) shows old/broken behavior
that doesn't match your latest code changes.

**Cause:** A previous `npm run dev` process didn't get cleanly killed (common
after a crashed terminal session or an IDE restart).

**Fix (Windows PowerShell):**
```powershell
$p = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
if ($p) { Stop-Process -Id $p.OwningProcess -Force }
npm run dev
```
On macOS/Linux: `lsof -ti:3000 | xargs kill -9`, then `npm run dev`.

### File picker doesn't trigger in automated/headless testing

**Symptom:** Automating the `<ImageUpload>` component (or any hidden
`<input type="file">` behind a styled button) via a headless browser tool
fails to open a file chooser or doesn't fire the `change` event even after
programmatically setting `.files`.

**Cause:** This is a known limitation of headless browser automation with
React-controlled file inputs, not a bug in the component. Real browsers with
real user interaction work fine.

**Workaround for verifying upload logic without a real browser:** exercise
the underlying Supabase Storage client directly (the same client
`uploadImage()` uses, from `src/lib/storage.ts`) in a standalone script —
upload a test file, confirm the returned public URL responds `200`, and
optionally set it directly on a database row to confirm the display path
renders it. This validates every part of the pipeline except the literal
click-to-open-file-dialog step, which only a real browser can exercise.

### "Admins only" errors when you're sure you're an admin

**Symptom:** An admin Server Action returns `{ ok: false, error: "Admins
only" }` even though you're logged in as an admin account in the browser.

**Checklist:**
1. Confirm the account's `role` column is actually `"ADMIN"` in the database
   (`npm run db:studio` → `user` table) — registering never sets this (see
   [Authentication](#roles)); it must be set via
   `npm run admin:create` or manually.
2. If you just ran `admin:create` or changed the role manually, **the
   existing session cookie may be cached** (Better Auth's 5-minute session
   cookie cache) with the old role baked in. Log out and back in, or wait
   for the cache to expire, so the session reflects the updated role.

