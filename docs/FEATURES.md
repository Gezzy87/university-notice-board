# Features

Every screen, what it does, and the files behind it. Grouped by audience.

## Public (no login required)

| Screen | Route | Behind it |
|---|---|---|
| Landing | `/` | `src/app/page.tsx` — hero, tagline, "Browse notices" / "Log in" CTAs |
| Feed | `/feed` | `src/app/feed/page.tsx` + `<FeedView>` — combined notices/events, magazine-style layout (featured hero, "Latest" list, "Upcoming events" row), category filter, live search, all client-side over server-fetched data |
| Calendar | `/calendar` | `src/app/calendar/page.tsx` + `<CalendarView>` — month grid of events, click a day to see its events |
| Search | `/search` | `src/app/search/page.tsx` + `<SearchView>` — full-text-ish search (title/body substring match) with matched-term `<mark>` highlighting (`src/lib/highlight.tsx`) |
| Notice detail | `/notices/[id]` | `src/app/notices/[id]/page.tsx` — full rich-text body, attachments, comments |
| Event detail | `/events/[id]` | `src/app/events/[id]/page.tsx` — date/time/location, RSVP control, description, attachments, comments |
| 404 | any unmatched route | `src/app/not-found.tsx` — branded, not the framework default |
| Error boundary | any render error | `src/app/error.tsx` — branded "something went wrong" with a retry button |

Notices and events are **readable by anyone**, logged in or not — this is a
deliberate product decision (a notice board is meant to be public). What's
gated behind login is *acting* on them.

## Requires login (any role)

| Feature | Where | Behind it |
|---|---|---|
| RSVP | Event detail | `<RsvpControl>` → `setRsvp()` server action. Guests see a "Log in to RSVP" prompt instead of the control |
| Bookmark | Any notice/event card or detail page | `<BookmarkButton>` → `toggleBookmark()`. Guests see a toast prompting login |
| Comment | Any notice/event detail | `<CommentSection>` → `addComment()` / `deleteComment()`. Guests see a "Log in to comment" prompt; comment authors (and admins) can delete their own comments. Paginated 5 per page via `<Pagination>` |
| Saved items | `/saved` | `src/app/saved/page.tsx` — everything the current user has bookmarked |
| My Events | `/my-events` | `src/app/my-events/page.tsx` — events the user has RSVP'd to, grouped into upcoming/past |
| Profile | `/profile` | View/edit name & department, logout |
| Notifications | `/notifications` | Notification preferences UI |

## Admin only (`role === "ADMIN"`, enforced by `src/app/admin/layout.tsx`)

Admin nav (`src/components/quad/admin/admin-nav.ts`): **Dashboard → Feed →
Categories → Moderation**, plus a persistent "+ Create" menu.

| Screen | Route | Behind it |
|---|---|---|
| Dashboard | `/admin` | `src/app/admin/page.tsx` — summary cards (notice/event/RSVP counts) from `getDashboardData()` in `queries.ts` |
| Create notice | `/admin/notices/new` | `<NoticeForm>` — title, rich-text body (Tiptap), category, cover image, pin toggle, publish now/schedule, expiry date |
| Create event | `/admin/events/new` | `<EventForm>` — title, rich-text description, category, cover image, location, start/end, capacity |
| Categories | `/admin/categories` | `<CategoriesManager>` — create/rename/recolor/delete categories, with post counts per category (`getCategoriesWithCounts()`) |
| Moderation | `/admin/moderation` | `<ModerationView>` — every comment across the app (`getModerationComments()`), with delete |

Admin create forms share `src/components/quad/admin/form-ui.tsx` (labeled
field wrapper, category select, dropzone shell) and
`src/components/quad/admin/rich-text-editor.tsx` (Tiptap wrapper — bold,
italic, underline, lists, links; sanitized on render, see
[Security](./SECURITY.md#rich-text-sanitization)).

There is currently **no edit UI** for existing notices/events — only create
and delete. Editing would follow the same `<NoticeForm>`/`<EventForm>`
pattern, pre-filled with the existing record and calling a new
`updateNotice()`/`updateEvent()` action (not yet implemented).

## Image uploads (cover photos)

Admins can attach a cover image to a notice or event via
`<ImageUpload>` (`src/components/quad/admin/image-upload.tsx`), which calls
the `uploadImage()` Server Action. Files go to Supabase Storage (a public
bucket); the resulting public URL is stored on `Notice.imageUrl` /
`Event.imageUrl`. Feed cards, the featured hero, and the calendar all render
the real image when present and fall back to a category-colored gradient
otherwise — see `categoryGradient()` in `src/lib/categories.ts`. Full
constraints (file size, type, rate limit) are in
[Server Actions](./SERVER-ACTIONS.md#uploadimage) and
[Security](./SECURITY.md).

## Loading, empty, and error states

- **Loading**: list/detail pages wrap their data-fetching Server Component in
  `<Suspense>` with a shimmer skeleton fallback
  (`src/components/quad/skeletons.tsx`) so slow database round-trips show a
  placeholder instead of a blank screen or a full-page spinner.
- **Empty states**: `<EmptyState>` (`src/components/quad/empty-state.tsx`) is
  used on Saved (nothing bookmarked yet), My Events (no RSVPs yet), and search
  with no results — each with an icon, a short message, and a relevant call
  to action (e.g. "Browse events").
- **404 / error**: see the table above. Both are intentionally branded rather
  than left as framework defaults.

## What's explicitly *not* built yet

Documented here so it's discoverable rather than a silent gap:

- **Editing** existing notices/events (create + delete only).
- **File attachments** on notices/events beyond the cover image — the
  `Attachment` model and a `<Dropzone>` UI shell exist, but no upload action
  writes to that table yet (see [Data Model](./DATA-MODEL.md#attachment)).
- **Real-time updates** — no websockets/polling; pages reflect new data on
  next navigation (via `revalidatePath()`), not live-pushed to open tabs.
- **Notification delivery** — the notification *settings* UI exists at
  `/notifications`, but nothing currently sends a notification based on those
  preferences (no email digest, no push).
- **Notice expiry enforcement** — `Notice.expiresAt` is stored and shown, but
  `getFeedItems()` does not filter out expired notices automatically.
