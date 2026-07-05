# Architecture

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16 (App Router, React 19, Turbopack) | Server Components for data-heavy pages, Server Actions for mutations, one deployable unit (no separate API server) |
| Language | TypeScript | End-to-end type safety, including generated Prisma types |
| Database | PostgreSQL (Supabase) | Relational data with real relationships (users, notices, events, RSVPs) benefits from a real schema and joins |
| ORM | Prisma 6 | Typed queries, migrations, a single schema file as source of truth |
| Auth | Better Auth | Email/password auth with session cookies, extensible hooks, framework-native Next.js integration |
| File storage | Supabase Storage | Same project as the database; simple public-bucket model for cover images |
| Styling | Tailwind CSS v4 + shadcn/ui | Utility-first CSS with a token system (see [Design System](./DESIGN-SYSTEM.md)) mapped onto shadcn primitives |
| Rich text | Tiptap | Notice/event bodies are authored as HTML via a WYSIWYG editor |
| Email | Nodemailer + Gmail SMTP | Password reset / verification emails (optional; app runs without it configured) |

## Why Server Components + Server Actions (not a separate API)

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
hand, no separate REST/GraphQL layer. See [Server Actions & API](./SERVER-ACTIONS.md)
for the full list.

The one real "API" in this app is Better Auth's route handler at
[`src/app/api/auth/[...all]/route.ts`](../src/app/api/auth/%5B...all%5D/route.ts),
which Better Auth needs to mount its own endpoints (`/api/auth/sign-in/email`,
`/api/auth/sign-up/email`, etc.). Everything else is Server Components and
Server Actions.

## Request flow examples

**Viewing the feed (`GET /feed`):**
1. `src/app/feed/page.tsx` (Server Component) runs on the server.
2. It calls `getCurrentUser()` (reads the session cookie, cache-first — see
   [Authentication](./AUTHENTICATION.md)) and `getFeedItems()` /
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

## Directory map

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

## Key architectural decisions (and why)

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
  request), the check still runs on the server. See [Security](./SECURITY.md).
