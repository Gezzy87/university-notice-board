# Deployment

This app is a standard Next.js app with no custom server, so it deploys
cleanly to any Next.js-compatible host. **Vercel** is the path of least
resistance (same company as Next.js, zero-config for this project shape) and
is what these instructions assume; the general steps transfer to any other
Node host.

## Before you deploy

1. **Move your Supabase project to a region near your users**, if you haven't
   already — cross-region database latency is the single biggest performance
   lever for this app (every page does at least one query). See
   [Troubleshooting](./TROUBLESHOOTING.md#slow-page-loads).
2. **Rotate any secret that was ever pasted somewhere insecure** (a chat log,
   a screenshot, a ticket) — the Supabase service role key and database
   password especially.
3. Run `npm run build` locally first to catch build-time errors before
   pushing to a host that charges you for failed builds.

## Deploying to Vercel

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

## Production-specific hardening to revisit

These were deliberately left in a "demo-friendly" state during development —
flip them before treating this as a real production deployment:

| Setting | Current (dev) | Production |
|---|---|---|
| `requireEmailVerification` (`src/lib/auth.ts`) | `false` | `true` — requires `emailVerification.sendOnSignUp: true` too, and a working Gmail SMTP config |
| `ADMIN_PASSWORD` | Falls back to `Admin123!` if unset | **Must** be set to a strong value — `create-admin.ts` already refuses the default when `NODE_ENV=production`, so this is partially enforced for you |
| Rate limiter (`src/lib/rate-limit.ts`) | In-memory, per-process | Fine for a single-instance deploy; if you scale to multiple serverless instances, swap in a shared store (Upstash Redis) — see [Security](./SECURITY.md#rate-limiting) |
| `ALLOWED_EMAIL_DOMAINS` | Often left unset for local testing | Set to your real university domain(s) if you want registration actually restricted |

## Database connection notes for serverless

`DATABASE_URL` (the pooled connection, port 6543) is what the deployed app
uses at runtime — Vercel's serverless functions open many short-lived
connections, which is exactly what Supabase's transaction pooler (pgbouncer)
is designed for. Never point production traffic at the direct connection
(port 5432, `DIRECT_URL`) — that's for migrations only and will exhaust
Postgres's connection limit under real load.

If you see `PrismaClientInitializationError` in production logs, see
[Troubleshooting](./TROUBLESHOOTING.md#database-connection-errors) — the same
pooler flakiness seen in local dev can happen in production, and the fix
(connection string parameters, not code) is the same.

## next.config.ts settings that matter for deployment

```ts
experimental: {
  serverActions: { bodySizeLimit: "6mb" },
}
```

This raises the Server Action request-body limit above Next's 1 MB default so
the image-upload action can receive files up to its own 5 MB validated limit.
If you change the upload size limit in `uploadImage()`
(`src/app/actions/admin.ts`), keep this value comfortably above it.

## Monitoring after deploy

There's no built-in error tracking or analytics in this project. At minimum,
check Vercel's function logs after deploying for:
- Repeated `[session] getSession failed` lines (database connectivity issues
  — see Troubleshooting)
- Any `PrismaClientInitializationError` (same)
- 429s on `/api/auth/*` if real users are hitting the auth rate limits
  (would indicate the limits are too tight for real usage, or an actual
  attack)
