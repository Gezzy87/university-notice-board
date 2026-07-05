# Troubleshooting

Real issues encountered while building this project, and their actual fixes
— not generic advice.

## Database connection errors

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

## Body exceeded 1 MB limit (image upload)

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

## Changes to `prisma/schema.prisma` don't show up at runtime

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

## Slow page loads

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
[Features](./FEATURES.md#loading-empty-and-error-states)). This doesn't make
queries faster, but it makes the wait feel intentional rather than broken.

## Stale dev server on port 3000

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

## File picker doesn't trigger in automated/headless testing

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

## "Admins only" errors when you're sure you're an admin

**Symptom:** An admin Server Action returns `{ ok: false, error: "Admins
only" }` even though you're logged in as an admin account in the browser.

**Checklist:**
1. Confirm the account's `role` column is actually `"ADMIN"` in the database
   (`npm run db:studio` → `user` table) — registering never sets this (see
   [Authentication](./AUTHENTICATION.md#roles)); it must be set via
   `npm run admin:create` or manually.
2. If you just ran `admin:create` or changed the role manually, **the
   existing session cookie may be cached** (Better Auth's 5-minute session
   cookie cache) with the old role baked in. Log out and back in, or wait
   for the cache to expire, so the session reflects the updated role.
