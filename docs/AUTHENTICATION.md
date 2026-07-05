# Authentication

Auth runs on [Better Auth](https://www.better-auth.com/), configured in
[`src/lib/auth.ts`](../src/lib/auth.ts) (server) and
[`src/lib/auth-client.ts`](../src/lib/auth-client.ts) (browser).

## How sign-up/sign-in actually happens

Better Auth mounts its own endpoints under `/api/auth/*` via the catch-all
route handler at
[`src/app/api/auth/[...all]/route.ts`](../src/app/api/auth/%5B...all%5D/route.ts).
The login/register pages (`src/app/login/page.tsx`, `src/app/register/page.tsx`)
are ordinary Client Components that call `authClient.signIn.email(...)` /
`authClient.signUp.email(...)` from `auth-client.ts` — these are thin wrappers
that POST to those endpoints and handle the session cookie for you. There's no
custom auth API to maintain.

## Roles

There are exactly two roles, stored as a `role` column on `User`
(`ADMIN` | `STUDENT`, default `STUDENT`) — see [Data Model](./DATA-MODEL.md).

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

## Server-side email-domain enforcement

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

## Sessions

- Better Auth issues a signed session cookie on login/register.
- **Cookie cache** (`session.cookieCache`, 5 minute `maxAge`): most page loads
  read the session straight out of the signed cookie and never touch the
  database. This is why `getCurrentUser()` on a simple page like `/profile` is
  fast even under database latency — see
  [Troubleshooting](./TROUBLESHOOTING.md#slow-page-loads).
- **Rate limiting** on the auth endpoints themselves — 5 sign-in attempts and
  5 sign-up attempts per 60 seconds, 3 password-reset requests per 5 minutes,
  100/minute on everything else. See [Security](./SECURITY.md#rate-limiting).

## Reading the session in your own code

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

## Route protection

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
protect a mutation — see [Security](./SECURITY.md#authorization).

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

## Password reset / email verification

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
