# Security

What's protected, how, and — just as important — what isn't, so nothing here
is taken on faith.

## Authentication

- Passwords hashed by Better Auth (not custom crypto).
- Sessions are signed, HTTP-only cookies with a 5-minute server-side cache
  (see [Authentication](./AUTHENTICATION.md)).
- Auth endpoints rate-limited (below).
- University-email restriction is enforced **server-side** in a Better Auth
  hook, not just the register form's client-side check — see
  [Authentication](./AUTHENTICATION.md#server-side-email-domain-enforcement).
  This closes the obvious bypass (calling `/api/auth/sign-up/email` directly).

## Authorization

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

## Rich text sanitization

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

## Rate limiting

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

## Secrets

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

## Input validation

Every Server Action validates its own inputs server-side, independent of
whatever the calling form already checked — e.g. `createEvent` re-verifies
`endsAt > startsAt` and that the category name resolves to a real row, `
addComment` re-checks length, `uploadImage` re-checks file type/size. Client-side
validation exists purely for immediate UX feedback; treat it as decoration,
never as the enforcement. See [Server Actions](./SERVER-ACTIONS.md) for the
exact checks per action.

## What's explicitly out of scope / not hardened

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
  [Authentication](./AUTHENTICATION.md#password-reset--email-verification))
  — anyone can register with any address on an allowed domain without
  proving they own it, until you turn verification back on.
