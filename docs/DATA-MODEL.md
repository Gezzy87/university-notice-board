# Data Model

Full schema: [`prisma/schema.prisma`](../prisma/schema.prisma). This doc
explains *why* it's shaped this way, not just what the fields are.

## Entity relationship overview

```
User ──authors──> Notice ──belongs to──> Category
User ──organizes─> Event  ──belongs to──> Category
User ──has many──> Rsvp ──belongs to──> Event          (unique per user+event)
User ──has many──> Bookmark ──belongs to──> Notice OR Event  (exactly one)
User ──has many──> Comment ──belongs to──> Notice OR Event   (exactly one)
Notice / Event ──has many──> Attachment
User ──has many──> Session, Account   (Better Auth internals)
```

## Models

### `User`
The single user table for both students and admins — there is no separate
`Admin` table. Role is a column, not a schema split.

| Field | Type | Notes |
|---|---|---|
| `role` | `Role` enum (`ADMIN` \| `STUDENT`) | Defaults to `STUDENT`. Set to `ADMIN` out-of-band (see [Authentication](./AUTHENTICATION.md)) |
| `department` | `String?` | Optional, shown on profile |
| `emailVerified` | `Boolean` | Currently defaulted `true` on seed/script-created users; real registrations go through Better Auth's verification flow if enabled |

**Why one table, not `Student`/`Admin` subtypes:** the two roles differ only in
*permissions*, not in data shape — an admin has the exact same profile fields
as a student. A role column plus a server-side check (`requireAdmin()`) is
simpler than table inheritance and is the pattern Better Auth's adapter
expects anyway.

### `Session` / `Account` / `Verification`
Better Auth's own tables, mapped via Prisma (`prismaAdapter`). Don't hand-edit
these — Better Auth owns their shape and writes to them itself.
- `Session`: one row per active login (token, expiry, IP/user-agent).
- `Account`: one row per auth method per user. For email/password, this is
  where the hashed password lives (`providerId: "credential"`).
- `Verification`: short-lived tokens for email verification / password reset.

### `Category`
A flat lookup table: `name` (unique) + `color` (hex, used for the category dot
in chips — see [Design System](./DESIGN-SYSTEM.md)). Both `Notice` and `Event`
have a required `categoryId` — every post must have exactly one category.

**Why not a hardcoded enum:** admins manage categories through
`/admin/categories` (create/rename/recolor/delete). An enum would require a
code change + migration for every new category; a table lets admins do it
from the UI.

### `Notice`
An announcement. Key fields beyond the obvious:

| Field | Notes |
|---|---|
| `body` | HTML string produced by the Tiptap rich-text editor, not Markdown or plain text. Rendered via `dangerouslySetInnerHTML` in `<RichText>` — see [Security](./SECURITY.md) for why this is safe here |
| `imageUrl` | Optional cover image URL (Supabase Storage public URL), nullable — cards fall back to a category-colored gradient when absent |
| `pinned` | Pinned notices sort first in the feed regardless of date |
| `publishedAt` | Defaults to "now" but can be set in the future for scheduled publishing (the create form supports "Publish now" vs "Schedule") |
| `expiresAt` | Nullable; not currently auto-enforced at the query level (a notice past its expiry still shows) — see [Features](./FEATURES.md) for exact admin-form behavior |

### `Event`
Same shape as `Notice` conceptually, plus event-specific fields:

| Field | Notes |
|---|---|
| `startsAt` / `endsAt` | Required; the event detail page and calendar both key off `startsAt` |
| `location` | Free text, not a structured venue table |
| `capacity` | Nullable = unlimited. Enforced server-side in `setRsvp()` (see [Server Actions](./SERVER-ACTIONS.md)) — the client's "spots left" count is a display convenience, not the source of truth |

### `Rsvp`
Join table between `User` and `Event`, with a `status` (`GOING` |
`INTERESTED`) rather than a boolean, because the UI distinguishes "committed"
from "maybe". `@@unique([userId, eventId])` guarantees one RSVP row per
user per event — RSVPing again updates the existing row (upsert), it never
creates a second one.

### `Bookmark`
A polymorphic-ish join: `noticeId` and `eventId` are both nullable, and
exactly one is set per row (enforced by application logic in
`toggleBookmark()`, not a database constraint — Postgres/Prisma don't have a
clean way to express "exactly one of these two columns is non-null" as a
schema-level check without a raw SQL `CHECK` constraint, which felt like
overkill here). Two separate unique constraints —
`@@unique([userId, noticeId])` and `@@unique([userId, eventId])` — prevent
double-bookmarking the same item, and both tolerate the "other" column being
null in Postgres (NULLs are not considered equal for uniqueness purposes).

### `Comment`
Same polymorphic pattern as `Bookmark` (`noticeId` XOR `eventId`). Deleting a
comment is allowed for its author or any admin (see
`deleteComment()` in [Server Actions](./SERVER-ACTIONS.md)) — this backs the
admin moderation queue.

### `Attachment`
File metadata (`url`, `filename`, `mimeType`, `size`) attached to a notice or
event. **Not currently wired to a real upload flow** — the admin forms have a
`Dropzone` UI placeholder (`src/components/quad/admin/form-ui.tsx`) but no
Server Action uploads to this table yet. The image-upload feature (cover
photos) is a separate, fully-wired path — see the `imageUrl` field on
`Notice`/`Event` and [Server Actions](./SERVER-ACTIONS.md) `uploadImage()`.
If you want file *attachments* (PDFs, etc.) working end-to-end, that's the
next piece to build, following the same pattern as `uploadImage()`.

## Cascade behavior

Every foreign key from a child table back to `User`, `Notice`, or `Event` is
`onDelete: Cascade` (`Session`, `Account`, `Rsvp`, `Bookmark`, `Comment`,
`Attachment`). Deleting a user deletes their sessions, RSVPs, bookmarks, and
comments; deleting a notice/event deletes its bookmarks, comments, and
attachments. There is currently no "soft delete" — `deleteNotice()` /
`deleteEvent()` are hard deletes. If you need an audit trail or an "archived"
state instead of permanent deletion, that's a schema change (an
`archivedAt DateTime?` column plus filtering it out of `queries.ts`), not
something currently implemented.

## Indexes

- `Notice`: `[pinned, publishedAt]` (feed sort order), `[categoryId]` (filter)
- `Event`: `[startsAt]` (calendar/upcoming sort), `[categoryId]` (filter)
- `Rsvp`: `[eventId]` (counting attendees per event)
- `Comment`: `[noticeId]`, `[eventId]` (loading a post's comment thread)

These match the actual query patterns in `queries.ts` — if you add a new
frequently-filtered/sorted field, add a matching index.

## Making a schema change

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
