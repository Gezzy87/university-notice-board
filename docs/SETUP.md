# Setup

Getting the project running from a clean clone.

## Prerequisites

- Node.js 20+ and npm
- A [Supabase](https://supabase.com) account (free tier is enough) — used for
  both the Postgres database and file storage
- Git

## 1. Install dependencies

```bash
git clone https://github.com/Gezzy87/university-notice-board.git
cd university-notice-board
npm install
```

`postinstall` runs `prisma generate` automatically, so the Prisma client is
ready right after install.

## 2. Create a Supabase project

1. [supabase.com](https://supabase.com) → **New project**.
2. Pick a region close to you or your users — this matters more than it
   sounds like it should. See [Troubleshooting](./TROUBLESHOOTING.md#slow-page-loads)
   for why.
3. Save the database password you're given (or generate one) — you'll need it
   for the connection strings below.

## 3. Configure environment variables

```bash
cp .env.example .env
```

Then fill in each section of `.env`. Every variable is documented inline in
`.env.example`; the summary:

| Variable | Where to get it |
|---|---|
| `DATABASE_URL` | Supabase → **Connect** → ORM/Prisma tab → the **Transaction pooler** string (port `6543`). Append `&connection_limit=5&pool_timeout=20` after `?pgbouncer=true` — see [Troubleshooting](./TROUBLESHOOTING.md#database-connection-errors) |
| `DIRECT_URL` | Same screen, the **Session/Direct** string (port `5432`) |
| `BETTER_AUTH_SECRET` | Generate: `openssl rand -base64 32` (or any long random string) |
| `BETTER_AUTH_URL` / `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` for local dev |
| `ALLOWED_EMAIL_DOMAINS` | Comma-separated domains allowed to register, e.g. `university.edu`. Leave empty to allow any domain |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Supabase → **Project Settings → API**. The service role key is secret — never expose it client-side |
| `SUPABASE_STORAGE_BUCKET` | Any name; `images` is the default and what `storage:setup` creates |
| `GMAIL_USER` / `GMAIL_APP_PASSWORD` | Optional — only needed if you want real password-reset/verification emails to send. See [Authentication](./AUTHENTICATION.md#email) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` | Used by `npm run admin:create` (step 6) |

⚠️ `.env` is gitignored — never commit it. If you ever paste real secrets into
a chat, ticket, or screenshot, rotate them afterward (Supabase → reset the
service role key and/or database password).

## 4. Push the schema and seed base data

```bash
npm run db:push    # creates all tables from prisma/schema.prisma
npm run db:seed    # seeds ~7 categories + a few sample notices/events
```

## 5. Set up file storage (for image uploads)

```bash
npm run storage:setup
```

Creates a public Supabase Storage bucket (named per `SUPABASE_STORAGE_BUCKET`)
with a 5 MB file-size limit and image-only MIME types. Safe to re-run — it
skips creation if the bucket already exists.

## 6. Create your admin account

```bash
npm run admin:create
```

Creates (or promotes) a login-able admin using `ADMIN_EMAIL` / `ADMIN_PASSWORD`
/ `ADMIN_NAME` from `.env` (falls back to `admin@university.edu` /
`Admin123!` / `Admin User` if unset — **only acceptable for local dev**; the
script refuses to run with the default password when `NODE_ENV=production`).

## 7. (Optional) Seed realistic demo data

```bash
npm run seed:students   # 6 login-able demo students (password: Student123!)
npm run seed:rsvps      # has those students RSVP to every event
```

The seed scripts also make every demo student comment on every notice and
event, so a freshly-seeded app has full comment threads instead of an empty
feed. See [Scripts & Seeding](./SCRIPTS.md) for exactly what each one does.

## 8. Run it

```bash
npm run dev
```

Open <http://localhost:3000>. Log in at `/login` with the admin credentials
from step 6, or register a new student account at `/register` (must match an
`ALLOWED_EMAIL_DOMAINS` domain if you set one).

## Verifying the setup worked

```bash
npm run db:studio
```

Opens Prisma Studio — a GUI to browse the actual database tables. If you see
your seeded categories, notices, events, and the admin user, everything's
wired correctly.

If something's not working, check [Troubleshooting](./TROUBLESHOOTING.md)
before re-running steps — most first-time issues are a malformed connection
string (unencoded special characters in the database password) or a stale
dev server after an env/schema change.
