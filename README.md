# Quad — University Notice Board & Events

A mobile-first web app where students browse university notices and
discover/RSVP to campus events, and admins post and manage everything through
a dedicated admin area.

📚 **Full documentation lives in [`docs/`](./docs/README.md)** — architecture,
data model, auth, every feature, server actions, the design system, security,
scripts, deployment, and troubleshooting. This README is the fast start; the
docs are the deep reference.

## Tech stack

| Concern | Choice |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 + TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Database | PostgreSQL (Supabase) |
| ORM | Prisma 6 |
| Auth | Better Auth (email + password, roles, rate limiting) |
| File storage | Supabase Storage (cover images) |
| Rich text | Tiptap |
| Email | Gmail SMTP via Nodemailer (optional) |
| Deploy target | Vercel |

Full rationale for each choice: [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md).

## Roles

- **Student** — browse, search, RSVP, bookmark, comment, manage profile/notifications.
- **Admin** — everything a student can do, plus create/delete notices & events,
  manage categories, moderate comments, view the dashboard.

Everyone registers as a Student; admins are promoted out-of-band (see
[`docs/AUTHENTICATION.md`](./docs/AUTHENTICATION.md#roles)) — there is no way
to register as an admin through the UI.

## Quick start

```bash
npm install
cp .env.example .env        # fill in the values — see docs/SETUP.md
npm run db:push
npm run db:seed
npm run storage:setup
npm run admin:create
npm run dev
```

Open <http://localhost:3000>. For the full walkthrough (creating a Supabase
project, every env var explained, optional demo data), see
[`docs/SETUP.md`](./docs/SETUP.md).

## Useful scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run db:push` | Push schema to the database |
| `npm run db:seed` | Seed categories + sample notices/events |
| `npm run db:studio` | Open Prisma Studio (DB GUI) |
| `npm run admin:create` | Create/reset a login-able admin account |
| `npm run storage:setup` | Create the Supabase Storage bucket for image uploads |
| `npm run seed:students` | Seed 6 demo students + comments on every post |
| `npm run seed:rsvps` | Seed demo RSVPs on every event |
| `npm run lint` | Lint |

Full description of each script: [`docs/SCRIPTS.md`](./docs/SCRIPTS.md).

## Project structure

```
prisma/schema.prisma      Data model (users, notices, events, RSVPs, ...)
scripts/                  Admin bootstrap & demo-data seed scripts
src/
  app/                    Next.js App Router — one folder per route
    actions/              Server Actions (all mutations)
    api/auth/[...all]/    Better Auth's route handler
  components/
    ui/                   shadcn/ui primitives
    quad/                 App-specific components (cards, nav, forms, admin/)
  lib/                    Data queries, auth config, session helpers, storage,
                           rate limiting, and other framework-agnostic logic
docs/                     Full documentation (see docs/README.md)
```

Full breakdown with rationale: [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md#directory-map).

## Documentation index

| Doc | Covers |
|---|---|
| [Architecture](./docs/ARCHITECTURE.md) | Stack, request flow, directory map, key decisions |
| [Data Model](./docs/DATA-MODEL.md) | Every table, relationship, and constraint, with the *why* |
| [Setup](./docs/SETUP.md) | Full local setup walkthrough from a clean clone |
| [Authentication](./docs/AUTHENTICATION.md) | Login/register, sessions, roles, route protection |
| [Features](./docs/FEATURES.md) | Every screen, what it does, and what's not built yet |
| [Server Actions & API](./docs/SERVER-ACTIONS.md) | Every mutation's signature, validation, and side effects |
| [Design System](./docs/DESIGN-SYSTEM.md) | Colors, type, components, layout conventions |
| [Security](./docs/SECURITY.md) | What's protected, how, and known gaps |
| [Scripts & Seeding](./docs/SCRIPTS.md) | What every `npm run` script does |
| [Deployment](./docs/DEPLOYMENT.md) | Shipping to Vercel, production hardening checklist |
| [Troubleshooting](./docs/TROUBLESHOOTING.md) | Fixes for real issues hit during development |
