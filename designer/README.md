# Handoff: Quad — University Notice Board & Events

## Overview
**Quad** is a mobile-first, installable (PWA) web app where a university publishes official
notices and where students discover, RSVP to, save, and comment on campus events. There are
two roles: **Student** (read, RSVP, bookmark, comment, manage profile/notifications) and
**Admin** (create/edit notices & events, manage categories, moderate comments, view a
dashboard). This package contains the complete high-fidelity design system plus mockups for
every screen in the product's inventory, in light and dark, mobile and desktop.

---

## About the Design Files
The `.dc.html` files in this bundle are **design references created in HTML** — prototypes
that show the intended look, layout, and behavior. **They are not production code to copy
directly.** Each file is a "Design Component" that renders through the included `support.js`
runtime; that runtime is a prototyping tool and is **not** part of your target stack.

Your task is to **recreate these designs in the project's real codebase** using its
established patterns. The brief specifies the intended stack (see `DESIGN_BRIEF.md`):
**Next.js + Tailwind CSS + shadcn/ui**. Rebuild each screen as React components with Tailwind
classes and shadcn primitives — do not embed the HTML or the `support.js` runtime. If any part
of the target environment doesn't exist yet, scaffold it with those technologies.

Ignore, when porting: the outer proposal chrome in each file (the page header, the "01/02…"
section badges, the phone/browser bezels, and the "MOBILE/DESKTOP" captions). Those exist only
to present the mockups side by side. Port the **content inside each device frame**.

## Fidelity
**High-fidelity (hifi).** Colors, typography, spacing, radii, and shadows are final and exact
— reproduce them precisely using the design tokens below. Interactions are described but were
not fully wired in the prototype; implement them per the Interactions section.

---

## Design Tokens

### Color — brand
| Token | Hex | Use |
|---|---|---|
| primary (indigo) | `#4F46E5` | primary actions, active nav, links, focus ring |
| primary-600 | `#4338CA` | primary hover/pressed |
| primary-50 | `#EEEEFE` | secondary-button bg, active nav bg, tints |
| teal | `#0E9488` | "Create"/admin accent, secondary brand |
| teal-50 | `#DCF1EE` | teal tint |

### Color — semantic
| Token | Hex | Tint (bg) |
|---|---|---|
| success | `#16A34A` | `#E4F4EA` |
| warning | `#C2740B` | `#F7ECDB` |
| danger  | `#DC2626` | `#FBE7E7` |

### Color — neutrals (light)
| Token | Hex | Use |
|---|---|---|
| app-bg | `#F6F7FC` | app background behind cards |
| bg | `#EEF1F7` | proposal canvas (ignore when porting) |
| surface | `#FFFFFF` | cards, sheets, nav |
| surface-2 | `#F1F3FA` | inputs, chips, inset wells |
| border | `#E7E9F3` | card & control borders |
| hair | `#EFF1F8` | inner hairline dividers |
| text | `#191B2A` | primary text |
| muted | `#646A82` | secondary text |
| faint | `#9197AE` | tertiary text, meta, placeholder |

### Color — neutrals (dark)
| Token | Hex | Use |
|---|---|---|
| d-bg | `#0E1018` | app background |
| d-surface | `#161926` | cards, nav |
| d-surface-2 | `#1E2231` | inputs, chips |
| d-border | `#2A2F42` | borders/dividers |
| d-text | `#ECEEF6` | primary text |
| d-muted | `#9AA1BC` | secondary text |
| primary (dark) | `#8B86F0` | indigo lifted for dark contrast (active nav, bookmark-filled) |

### Category dot colors (chips are monotone; the DOT carries the category)
Academic `#6573A8` · Exams `#B26079` · Placements `#4E9387` · Sports `#74935E` ·
Clubs `#8772B5` · Workshops `#B59440`.
Chips themselves: bg `surface-2`, 1px `border`, text `muted`, `border-radius: 999px`, with a
7–8px round dot in the category color. (This monotone treatment was a deliberate revision away
from fully-colored chips — keep chips neutral.)

### Typography
- **Headings/display:** `Sora`, weights 600/700/800. Used for logo, screen titles, card
  titles, numbers/counts.
- **Body/UI:** `Plus Jakarta Sans`, weights 400/500/600/700.
- Scale (px / line-height): Display 38/44 800 · H1 30 800 · Heading 26/32 700 · card title
  15–16 700 · Subhead 18/24 600 · Body 15/22 400 · UI label 13–14 600/700 · Caption/meta
  12 600 · micro 10–11 700 (letterspaced `.06em–.1em` for section eyebrows).
- Headings use negative tracking: `letter-spacing: -.01em` to `-.02em` (up to `-.04em` on the
  big 404 numeral).

### Spacing
4 · 8 · 12 · 16 · 24 · 32 (px). Cards use 16–19px internal padding on mobile, 17–19px on
desktop. Feed gaps 12–16px.

### Radius
sm 8 · md 12 · lg 16 · **card 18** · xl 22 · pill 999. Inputs/buttons 11–13. Icon tiles
10–12. Phone screen inner radius 36; device bezel 46.

### Shadows
- **card (light):** `0 1px 2px rgba(22,24,40,.04), 0 10px 24px -14px rgba(22,24,40,.16)`
- **card (dark):** `0 1px 2px rgba(0,0,0,.3), 0 12px 26px -14px rgba(0,0,0,.55)`
- **toast:** `0 14px 32px -12px rgba(20,22,40,.5)`
- **focus ring:** `0 0 0 3px #EEEEFE` (primary-50) with a 1.5px `primary` border.
- **FAB (teal):** `0 8px 18px -6px rgba(14,148,136,.6)`

### Iconography
All icons are inline **stroke SVGs**, `stroke-width` 1.7–2, `stroke-linecap/linejoin round`,
~18–22px in nav/controls. In production use **lucide-react** (matches this style): home, search,
calendar, bookmark, bell, map-pin, clock, mail, lock, eye, upload, trash-2, pencil, plus,
chevron-left/right/down, check, x, alert-triangle, log-out, layout-dashboard, message-square.
The bookmark uses a pennant/flag shape (`M6 4h12v16l-6-4-6 4z`) — filled = saved, stroked = not.

### Logo
2×2 rounded square grid: cells indigo/teal/teal/indigo, 3–5px gaps, outer corners of each cell
slightly larger radius. Reproduce as a small component; no external asset.

---

## Global Elements

### Navigation (role-aware)
- **Mobile — student bottom nav:** Home · Calendar · Saved · My Events · Profile. 5 items,
  icon + 10px label, active item in `primary` (or dark-primary `#8B86F0`), inactive in `faint`.
  Tap target ≥44px. Bottom padding accounts for the home indicator (~24px).
- **Mobile — admin bottom nav:** Dashboard · Feed · **center + Create FAB** · Events ·
  Comments. The FAB is a 48px teal rounded-square, raised `-14px` above the bar, with the FAB
  shadow.
- **Desktop — sidebar (218px):** logo, then nav list; admin sidebar leads with a full-width
  teal **+ Create** button and shows a red count badge on Moderation. Active row: `primary-50`
  bg + `primary` text, 11px radius. Footer: avatar + name + role.
- **Top bars:** student feed has logo + bell + avatar, then search, then a horizontal
  scrollable chip row. Detail screens have a back chevron in a 34–36px `surface-2` tile.

### Empty states (one pattern, reused)
Centered: 76px rounded-square icon tile (tinted bg + brand-color icon) → 18px 800 headline →
one line of `muted` guidance → single action button. Variants shown: feed/category empty,
notifications "all caught up", saved empty, no search results, no RSVPs yet.

### Loading skeleton
Card-shaped shimmer: pill + two text bars, animated via a moving linear-gradient
(`background-size: 760px 100%`, keyframe translating background-position, 1.4s linear infinite).
Colors `#EEF0F7`→`#E2E5F0`. Match feed-card dimensions.

### Cards (core pattern)
White `surface`, 1px `border`, **18px radius**, card shadow, 16–17px padding. Two kinds:
- **Notice card:** category chip (+ 📌 Pinned pill when pinned) and a stroked bookmark on the
  top row; Sora title; optional one-line body in `muted`; footer above a `hair` divider with a
  tiny author-initial avatar + "Author · time".
- **Event card:** left **date block** (56px, gradient `#EEEEFE→#DCF1EE`, 1px border, 12px
  radius; "JUL" 10px 700 primary over day 20–22px 800 text) + body: category chip, Sora title,
  map-pin location · time, then a status pill (green `32 of 120 spots left`, or primary
  `You're going`).
Pinned items float to the top of the feed. Earlier drafts used a colored left border stripe —
that was **removed**; do not reintroduce it.

---

## Screens / Views

> File → screen map. Port the content inside each device/browser frame.

### `Quad - Design System & Screens.dc.html`
- **Design system page** — living reference: color swatches (brand, semantic, light & dark
  neutrals), monotone category chips, type ramp, radius & spacing scales, and a **components**
  gallery (buttons: primary/secondary/outline/ghost/danger/teal-create/disabled; search &
  focused input; RSVP segmented control; bookmark states; badges; comment row; attachment row;
  toast; skeleton; notice card; event card). Use this as the source of truth for tokens.
- **Landing (0)** — one viewport, no long scroll. Logo, tagline "Your whole campus, in one
  feed.", one-sentence description, two actions: **Browse notices** (primary → public feed) and
  **Log in / Register** (secondary). Mobile: centered stack over a soft indigo/teal radial wash;
  footer "University of Northbridge". Desktop: left copy column + right brand panel (indigo→teal
  radial with a diagonal hairline pattern and a frosted preview card).
- **Home / Feed (1)** — mobile light, desktop, mobile dark. Top: logo + bell + avatar → search
  → scrollable category chips ("All" active in primary). Feed = mixed notice/event cards, 📌
  pinned first. Desktop is a sidebar + a pinned full-width card + a 2-col card grid, with a
  Feed/Calendar segmented toggle. Dark variant demonstrates the dark tokens.

### `Quad - Key Screens.dc.html`
- **Event detail (3)** — back bar + bookmark. Category chip, Sora title, a date/time + location
  block (icon tiles), **RSVP segmented control** (Going/Interested) with a live
  `X of Y spots left`, organizer row (avatar + name + "Organizer"), description, attachments,
  Save. Desktop places RSVP/date/location in a sticky right-hand card beside the description.
- **Notice detail (2)** — 📌 Pinned + category chips, bookmark (filled=saved), Sora title,
  author block (avatar + "posted … · expires …"), rich body with bolded emphasis, attachment
  rows (PDF icon tile + name + size + Download). Desktop centers a ~680px reading column.
- **Calendar (4)** — month grid with event pills on their dates (pill tinted by category dot
  color); Feed/Calendar toggle; prev/next month. Selected day = `primary-50` cell with
  `primary` 1.5px border. Mobile: compact month with under-date dots + an **agenda list** for
  the selected day.
- **Create / edit event — admin (5)** — mobile + desktop. Fields: Title, rich-text Description
  (B/I/U/list/link toolbar), Starts/Ends datetime, Location, Category (dot + name select),
  Capacity (optional), drag-&-drop Attachments. Header actions: Save draft / Publish. Desktop
  = admin sidebar + 2-col form; mobile = full-screen form with admin bottom nav + FAB.
- **Admin dashboard (13)** — mobile + desktop. Four summary cards (Total notices, Upcoming
  events, Total students, RSVPs this week) with delta text; "Events & RSVP counts" list (date
  block + title + count/of-capacity); "Recent activity" timeline (colored status dots). Mobile
  = 2×2 stat grid + stacked lists + admin bottom nav.

### `Quad - Remaining Screens.dc.html`
- **Auth (6/7/8)** — **Login** (university email + password with show/hide, forgot link),
  **Register** with **inline university-email validation** (shows a red error + hint
  "Must be a @northbridge.edu address" for non-university addresses; password-strength meter of
  4 segments), and **Check your inbox** (mail icon tile, target email, Open email app, Resend).
- **Search & filter results (5)** — search field with clear (×); active filters as **removable
  chips** (primary-50, each with an × ); result count; result cards with `<mark>` highlight
  (`#FFF1B8`) on the matched term. Plus the **empty / no-results** state.
- **Saved (9)** — All/Notices/Events tabs (underline active); saved notice & event cards, each
  with a filled bookmark.
- **My Events (10)** — grouped **Upcoming** then **Past**; each row: date block, title,
  location · time, a status pill (Going green / Interested warning) + a "Change" affordance;
  past rows are dimmed ("Attended"). Includes the **empty "No events yet"** state.
- **Profile (11)** — gradient header (indigo→teal) with avatar, name, "Dept · Year", edit
  pencil; grouped list rows (Email, Department, Notification settings →, Saved items →);
  destructive **Log out** row in `danger`.
- **Notification settings (12)** — grouped **Email** and **In-app** toggle lists (toggle ON =
  `primary` track with knob right; OFF = `surface-2` track + border, knob left). Rows include
  sub-labels (e.g. "1 hour before").
- **Create / edit notice — admin (15)** — Title, rich-text Body, Category, **Pin to top** toggle,
  **Publish Now / Schedule** segmented, optional **Expiry** date, drag-&-drop attachments.
- **Manage categories (16)** — list rows: color swatch + name + post count + edit/delete icons;
  **Add category** (teal). One row shown in edit state with an open **color picker** (swatch
  palette; selected swatch ringed).
- **Comment moderation (17)** — recent comments (avatar + name + "on <post> · time" + comment)
  each with a **Delete**; a flagged/spam comment is emphasized with a `danger` border/tint and
  "Reported by N · reason".
- **404 (21)** — brand logo, big gradient "404" (indigo→teal text clip), headline "This page
  took a gap year", guidance line, **Back to feed** + **Search** actions, over a soft radial
  wash. Browser URL bar truncates with ellipsis (`white-space:nowrap; overflow:hidden;
  text-overflow:ellipsis`).

### `Quad - Extra States.dc.html`
- **Reported comment queue — admin (fuller moderation)** — sidebar Moderation row shows a red
  count badge; filter tabs (Reported · N / All comments / Removed); each report card shows the
  comment, a reason pill (danger for spam, warning for offensive/off-topic), reporter count,
  source post, and **Delete / Keep** actions; spam body is tinted `danger-50`.
- **Logged-out public feed** — guest can read; RSVP/Save/comment are replaced by a
  "**Log in to RSVP**" lock chip. Mobile: slim "Log in" button in header + a sticky bottom CTA
  banner (indigo→teal) with Create account / Log in. Desktop: a full-width gradient sign-in
  banner above the feed.
- **Empty-states gallery** — feed/category empty, notifications "all caught up", saved empty
  (the reusable pattern above), presented together for reference.
- **Toasts & in-app notifications** — toast variants (success + Undo, saved + View, error/full →
  waitlist, admin "published"); dark `text`-colored pill, colored status icon, optional action
  in `#9DA5C9`; auto-dismiss 4s / swipe to dismiss. Plus the **notification panel** (New /
  Earlier groups; unread dot; reminder, pinned-notice, reply, RSVP-confirmed rows).

---

## Interactions & Behavior
- **RSVP:** segmented Going/Interested; toggling updates the live "X of Y spots left". If full,
  RSVP is disabled and the user is offered a **waitlist** (see error toast). Confirm with a
  success toast (with **Undo**).
- **Bookmark:** toggles filled/stroked instantly; success toast "Saved to your bookmarks" with
  **View**. Persists to the user's Saved list.
- **Pinned:** admin "Pin to top" floats a notice above the feed and shows the 📌 Pinned pill.
- **Category chips:** single-select filter on feed; "All" default. Horizontal scroll on mobile.
- **Search:** live filter; active filters render as removable chips; matched terms highlighted;
  clear (×) resets; show empty state when zero matches.
- **Publish (admin):** Now vs Schedule (date/time); Save draft keeps it unpublished; optional
  expiry auto-removes from feed after the date. Publishing shows a confirmation toast.
- **Moderation:** Delete removes the comment; Keep dismisses the report and clears the flag;
  update the sidebar count badge.
- **Auth validation:** email must match the university domain (`@northbridge.edu` in the mock) —
  inline error + hint; password-strength meter (4 segments). Register → "Check your inbox".
- **Toasts:** bottom (mobile) / bottom-right (desktop), auto-dismiss ~4s, swipe/tap to dismiss;
  optional single action.
- **Transitions:** keep subtle (~150–200ms ease) for toggles, toasts (slide+fade), and nav.
  Skeletons shimmer at 1.4s linear infinite.
- **Responsive:** mobile-first; ≥ desktop breakpoint switches bottom nav → left sidebar and
  single-column feed → sidebar + multi-column grid.

## State Management
- **Auth/session:** current user, role (student/admin), guest mode (logged-out feed).
- **Feed:** items (notice|event), pinned flag, active category filter, search query + active
  filter chips, pagination/scroll, loading (skeleton) & empty states.
- **Event:** rsvpStatus (none|going|interested), spotsTaken/capacity, isFull, waitlisted.
- **Bookmarks:** saved set (notices + events); Saved tab filter.
- **My Events:** derived from RSVPs, grouped upcoming/past.
- **Notifications:** list + unread count (drives the bell dot and sidebar badges); mark-all-read.
- **Admin:** notice/event draft form state (+ validation), categories CRUD, moderation queue +
  report counts, dashboard metrics.
- **Prefs:** notification toggles (email + in-app), theme (light/dark).
- **Data fetching:** feed (with filters/search), item detail (+ comments + attachments),
  calendar month, admin dashboard metrics, moderation queue. Optimistic updates for RSVP,
  bookmark, and toggles with toast confirmation.

## Assets
No external image assets — the logo is a small CSS/SVG grid component, avatars are initials on
a gradient, icons are inline SVGs (use **lucide-react**). Fonts: **Sora** and
**Plus Jakarta Sans** from Google Fonts. Date blocks, brand washes, and the 404 numeral are all
CSS gradients. Provide real user avatars/attachment thumbnails from your backend where available.

## Files
- `Quad - Design System & Screens.dc.html` — design system + Landing + Home/Feed (light & dark)
- `Quad - Key Screens.dc.html` — Event detail, Notice detail, Calendar, Create event, Admin dashboard
- `Quad - Remaining Screens.dc.html` — Auth, Search, Saved, My Events, Profile, Notification
  settings, Create notice, Categories, Moderation, 404
- `Quad - Extra States.dc.html` — Reported-comment queue, logged-out feed, empty-states gallery,
  toasts & notification panel
- `DESIGN_BRIEF.md` — the original product brief (roles, content types, full screen inventory,
  constraints)
- `support.js` — prototype runtime **only** so the HTML opens in a browser; **do not port it**.

Open any `.dc.html` in a browser to view the mockups. Reproduce the UI inside the device/browser
frames using Next.js + Tailwind + shadcn/ui and the tokens above.
