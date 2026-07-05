# Server Actions & API Reference

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

## `src/app/actions/engagement.ts`
Anything a **logged-in user** (any role) can do to a notice/event.

### `setRsvp(eventId: string, status: "GOING" | "INTERESTED" | null): Promise<ActionResult>`
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

### `toggleBookmark(target: { noticeId?: string; eventId?: string }): Promise<ActionResult & { saved?: boolean }>`
- Requires login. Rate-limited: 60/minute.
- Exactly one of `noticeId`/`eventId` must be provided.
- Looks up an existing bookmark; deletes it if found, creates it if not
  (this is the toggle — there's no separate "add"/"remove" call).
- Revalidates: `/saved`.

### `addComment(target: { noticeId?: string; eventId?: string; body: string }): Promise<ActionResult & { id?: string; author?: string }>`
- Requires login. Rate-limited: **5/minute** (the strictest of the engagement
  limits — comments are free-text and the main spam vector).
- Validates: body is non-empty after trim, and ≤2000 characters.
- Body is stored and rendered as **plain text** (React auto-escapes it — no
  `dangerouslySetInnerHTML` for comments, unlike notice/event bodies). See
  [Security](./SECURITY.md#rich-text-sanitization).
- Revalidates: the parent notice/event's detail page.

### `deleteComment(commentId: string): Promise<ActionResult>`
- Requires login. **Authorization**: the comment's author, or any admin —
  checked explicitly (`comment.userId !== user.id && user.role !== "ADMIN"` →
  `"Not allowed"`). This is what backs the admin moderation queue.
- Revalidates: the parent notice/event's detail page, `/admin/moderation`.

---

## `src/app/actions/admin.ts`
Everything here starts with `const admin = await requireAdmin(); if (!admin) return { ok: false, error: "Admins only" };`
— every single action independently re-checks the role server-side, not just
relying on the `/admin` layout guard. See
[Security](./SECURITY.md#authorization) for why this matters.

### `uploadImage(formData: FormData): Promise<{ ok: true; url: string } | { ok: false; error: string }>`
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

### `createNotice(input: NoticeInput): Promise<ActionResult>`
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

### `createEvent(input: EventInput): Promise<ActionResult>`
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

### `deleteNotice(id: string)` / `deleteEvent(id: string): Promise<ActionResult>`
- Admin only. Hard delete (cascades to attachments/bookmarks/comments —
  see [Data Model](./DATA-MODEL.md#cascade-behavior)). No confirmation logic
  lives in the action itself — that's a UI-layer responsibility.
- Revalidates the relevant public pages + `/admin`.

### `createCategory(name: string, color: string)` / `updateCategory(id: string, color: string)` / `deleteCategory(id: string): Promise<ActionResult>`
- Admin only.
- `createCategory` rejects duplicate names (`"That category already exists"`).
- `updateCategory` only changes `color` — renaming an existing category isn't
  currently supported (would need a new action or extending this one).
- `deleteCategory` refuses if any notice or event still references it
  (`"This category is in use and can't be deleted"`) — you must reassign or
  delete the dependent posts first. There's no cascade/reassignment UI for
  this yet.

---

## The one real API route

[`src/app/api/auth/[...all]/route.ts`](../src/app/api/auth/%5B...all%5D/route.ts)
mounts Better Auth's handler for both `GET` and `POST`. This single file
serves every `/api/auth/*` endpoint (`sign-in/email`, `sign-up/email`,
`sign-out`, `request-password-reset`, `get-session`, etc.) — you don't add
routes here yourself; Better Auth owns this surface. See
[Authentication](./AUTHENTICATION.md) for how the client calls it.

## Adding a new Server Action

Follow the existing pattern:
1. Add the function to the appropriate file in `src/app/actions/` (or a new
   file if it's a new domain), marked `"use server"` at the top of the file.
2. Auth check first: `getCurrentUser()` for any logged-in user, or
   `requireAdmin()` for admin-only.
3. Rate-limit it if it's user-repeatable — `rateLimited(key, max, windowMs)`
   from `src/lib/rate-limit.ts` (see [Security](./SECURITY.md#rate-limiting)
   for guidance on picking limits).
4. Validate input server-side even if the form already validates client-side.
5. Return `{ ok: true, ... }` or `{ ok: false, error: "..." }` — never throw
   for expected failure cases (throw only for truly unexpected errors, which
   Next.js will route to `error.tsx`).
6. Call `revalidatePath()` for every page whose cached render the mutation
   could affect.
