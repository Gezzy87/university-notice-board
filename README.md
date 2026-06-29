# University Notice Board & Events

A mobile-first web app where students browse university notices and discover/RSVP to
campus events, and admins post and manage them. Installable as a PWA.

## Tech stack

| Concern        | Choice                                            |
| -------------- | ------------------------------------------------- |
| Framework      | Next.js 16 (App Router) + React 19 + TypeScript   |
| Styling        | Tailwind CSS v4 + shadcn/ui                        |
| Database       | PostgreSQL (Supabase or Neon)                      |
| ORM            | Prisma 6                                           |
| Auth           | Better Auth (email + password, email verification)|
| Email          | Gmail SMTP via Nodemailer                          |
| Rich text      | Tiptap                                             |
| Deploy target  | Vercel                                             |

## Roles

- **Student** — browse, search, RSVP, bookmark, comment, manage profile/notifications.
- **Admin** — everything a student can do, plus create/edit/delete notices & events,
  manage categories, moderate comments, view the dashboard.

Everyone registers as a STUDENT. Admins are promoted out-of-band (see below).

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy the example file and fill in the values:

```bash
cp .env.example .env
```

- **DATABASE_URL** — a PostgreSQL connection string. Easiest free option is
  [Supabase](https://supabase.com) or [Neon](https://neon.tech). Create a project and
  copy the connection string.
- **BETTER_AUTH_SECRET** — generate one: `openssl rand -base64 32`
- **GMAIL_USER / GMAIL_APP_PASSWORD** — see "Email setup" below.
- **ALLOWED_EMAIL_DOMAINS** — comma-separated domains permitted to register
  (e.g. `university.edu`).

### 3. Set up the database

```bash
npm run db:push     # create tables from the Prisma schema
npm run db:seed     # seed categories + a few sample notices/events
```

(Use `npm run db:migrate` instead of `db:push` once you want versioned migrations.)

### 4. Run the app

```bash
npm run dev
```

Open http://localhost:3000.

## Email setup (Gmail SMTP)

Gmail requires an **App Password**, not your normal password:

1. Enable 2-Step Verification on the Google account.
2. Go to https://myaccount.google.com/apppasswords and create an app password.
3. Put the 16-character password in `GMAIL_APP_PASSWORD` and the address in `GMAIL_USER`.

Note: Gmail SMTP allows ~500 emails/day, which is plenty for this app. The email layer
lives in [`src/lib/mail.ts`](src/lib/mail.ts) and can be swapped for a provider later
without touching the rest of the code.

## Make yourself an admin

Register normally through the app, then promote your account. With Prisma Studio:

```bash
npm run db:studio
```

Open the `user` table, find your row, and set `role` to `ADMIN`. (A small CLI script
can be added later to do this from the terminal.)

## Useful scripts

| Command              | Description                              |
| -------------------- | ---------------------------------------- |
| `npm run dev`        | Start the dev server                     |
| `npm run build`      | Production build                         |
| `npm run db:push`    | Push schema to the database              |
| `npm run db:migrate` | Create & apply a migration               |
| `npm run db:seed`    | Seed sample data                         |
| `npm run db:studio`  | Open Prisma Studio (DB GUI)              |
| `npm run lint`       | Lint                                     |

## Project structure

```
prisma/
  schema.prisma     # data model (users, notices, events, rsvps, …)
  seed.ts           # sample data
src/
  app/              # Next.js App Router pages & API routes
    api/auth/[...all]/route.ts   # Better Auth handler
  components/ui/    # shadcn/ui components
  lib/
    prisma.ts       # Prisma client singleton
    auth.ts         # Better Auth server config
    auth-client.ts  # Better Auth React client
    mail.ts         # Gmail SMTP transport
DESIGN_BRIEF.md     # design brief to paste into claude.ai for the UI design
```

## Design

The visual design is being produced separately (see `DESIGN_BRIEF.md`). Generated
screens get translated into shadcn/ui components wired to real data.
