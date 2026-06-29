# Design Brief — University Notice Board & Events

> Paste this whole document into Claude on claude.ai to generate the design system and
> screen mockups. It is self-contained: it describes everything you need to design the
> product without seeing any code.

---

## 1. What we're building

A **University Notice Board & Events** web app. It's the single place students go to see
official announcements (exam schedules, deadlines, closures, placements) and to discover
and sign up for campus events (guest lectures, club meetings, workshops, fests).

- **Platform:** Responsive **web app, mobile-first** — most students open it on a phone,
  but it must also look great on desktop. It will be installable as a PWA ("Add to Home
  Screen"), so design it to feel app-like on mobile (bottom navigation, large tap targets).
- **Tone:** Modern, clean, trustworthy, lightly energetic. It's official university
  communication, so it should feel credible — but not boring or bureaucratic. Think
  "well-designed campus app," not "government portal."
- **Audience:** University students (primary) and admin/faculty staff (secondary).

---

## 2. Users & roles

There are exactly two roles:

**Student** — the main user.
- Browses notices and events, searches and filters.
- RSVPs to events (Going / Interested), sees how many spots are left.
- Bookmarks notices and events to a personal "Saved" list.
- Has a "My Events" page for things they've RSVP'd to.
- Comments on notices and events.
- Manages a profile and notification preferences.

**Admin** (faculty/staff) — can do everything a student can, plus:
- Create, edit, delete notices (rich text, pin to top, schedule publish, set expiry).
- Create, edit, delete events (date/time, location, capacity).
- Upload attachments (PDFs, posters).
- Manage categories.
- See a dashboard with counts and RSVP lists.
- Moderate/delete comments.

---

## 3. Core content types

**Notice** — an announcement. Has: title, rich-text body, category, author, optional
attachments, can be *pinned*, has a publish date and optional expiry. No event-style
date/location.

**Event** — has: title, rich-text description, category, organizer, **location**,
**start & end date/time**, optional **capacity** (drives "X spots left"), optional
attachments. Students RSVP to events.

**Category** — shared label with a color (e.g. Academic, Exams, Placements, Sports,
Clubs, Workshops). Shown as colored chips/badges throughout.

---

## 4. Screen inventory

Design these screens. Grouped by area.

### Public / shared
0. **Landing** — a light, single-screen entry point (NOT a long marketing page). Shows the
   app name/logo, a one-line tagline, a short sentence on what it is, and two clear actions:
   **"Browse notices"** (continues to the public Feed) and **"Log in / Register"**. Keep it
   compact, branded, and fast — one viewport, no scrolling marathon. This is the first thing
   a logged-out visitor sees; it should set the tone and then get out of the way.
1. **Home / Feed** — the main screen. A combined, scrollable feed of notices and
   events. **Pinned notices float to the top.** Top has a search bar and horizontal
   scrollable category filter chips. Each item is a card (see components). Make the
   distinction between a *notice card* and an *event card* visually clear.
2. **Notice detail** — title, category chip, author + date, rich body, attachment list
   (download buttons), bookmark button, comments section at the bottom.
3. **Event detail** — title, category chip, big date/time + location block, RSVP buttons
   (Going / Interested) with a live "X of Y spots left" indicator, organizer, rich
   description, attachments, bookmark button, comments.
4. **Calendar view** — a month grid showing events on their dates; tapping a day or an
   event opens the event. Include a way to switch between Feed and Calendar.
5. **Search / filter results** — results list with active filters shown as removable chips,
   plus an empty-state when nothing matches.

### Auth
6. **Register** — university email, name, password. Note that email must be a university
   address; show a clear inline hint/validation.
7. **Login** — email + password, link to register, link to reset.
8. **Check your inbox** — post-registration state telling the user to verify their email.

### Student
9. **Saved** — bookmarked notices and events, in one list with a toggle/tab to filter
   notices vs events.
10. **My Events** — events the student RSVP'd to, **upcoming first**, with their RSVP
    status shown, and a way to change/cancel.
11. **Profile** — avatar, name, department, email; edit button.
12. **Notification settings** — toggles for email + in-app notifications (e.g. "new notice
    in a category I follow", "reminder before an event I'm going to").

### Admin
13. **Admin dashboard** — summary cards (total notices, upcoming events, total students,
    RSVPs this week), recent activity, and a list of events with their RSVP counts.
14. **Create / edit notice** — form with a **rich text editor** for the body, category
    select, pin toggle, publish-now-vs-schedule control, optional expiry date, attachment
    upload (drag & drop).
15. **Create / edit event** — title, rich text description, category, location, start/end
    date-time pickers, capacity (optional), attachment upload.
16. **Manage categories** — list of categories with their colors; add/edit/delete; color
    picker.
17. **Comment moderation** — list of recent comments with the ability to delete.

### Global elements (design these as a system, used across all screens)
18. **Navigation** — role-aware.
    - **Mobile:** a bottom nav bar (e.g. Home, Calendar, Saved, My Events / Admin, Profile).
    - **Desktop:** a top bar or left sidebar.
    - Admin sees extra entries (Dashboard, Create) that students don't.
    - Include a "+ Create" affordance for admins.
19. **Empty states** — friendly illustrations/text for: empty feed, no saved items, no
    RSVPs yet, no search results.
20. **Loading skeletons** — card-shaped shimmer placeholders for the feed.
21. **404 / error page.**

---

## 5. Key reusable components

Design these once; they appear everywhere:

- **Notice card** — category chip, title, snippet of body, author, time-ago, bookmark
  icon, pinned indicator when pinned.
- **Event card** — category chip, title, date/time, location, a "spots left" or
  "Going" badge, bookmark icon. Visually distinct from a notice card (e.g. a date block).
- **Category chip** — small colored pill with the category name.
- **RSVP control** — Going / Interested segmented buttons with state.
- **Bookmark toggle** — outline → filled.
- **Comment** — avatar, name, time, text, (admin) delete affordance.
- **Attachment row** — file icon, name, size, download button.
- **Search bar + filter chips** — used on Home and Search.
- **Buttons, inputs, selects, date pickers, modals, toasts** — a consistent set.

---

## 6. Design system to produce

Please propose a complete, coherent design system:

- **Color palette** — primary, secondary, neutrals, plus semantic colors (success for
  "Going"/available, warning, danger for "delete"/full). A set of distinct category chip
  colors. Provide light mode at minimum; dark mode is a bonus.
- **Typography** — heading and body type scale, suitable web fonts.
- **Spacing & radius** — consistent scale; modern, slightly rounded cards.
- **Components** — show the reusable components above in their various states.
- **Two or three aesthetic directions to choose from**, e.g.:
  - *Academic & calm* — navy/slate + a single warm accent, serif headings, very clean.
  - *Vibrant campus* — bright accent (indigo/teal), rounded, friendly, energetic.
  - *Minimal modern* — near-monochrome with one accent, lots of whitespace, crisp.

---

## 7. Constraints & implementation notes (so designs translate cleanly to code)

- It will be built in **Next.js + Tailwind CSS + shadcn/ui** components. Designing in a way
  that maps to those primitives (cards, badges, buttons, dialogs, tabs) will translate best.
- **Mobile-first**: design the mobile layout first, then the desktop adaptation.
- Keep it **accessible**: sufficient contrast, clear focus states, readable type sizes,
  large tap targets on mobile.
- Deliverables that help most: a **design system page** (colors, type, components) plus
  **high-fidelity mockups of the key screens** (Home/Feed, Event detail, Notice detail,
  Calendar, Create event/notice, Admin dashboard, Saved/My Events). HTML/CSS or React
  mockups are ideal since the real app is React.

---

## 8. Priority screens (if time is limited)

Design these first — they carry the product:
1. Home / Feed
2. Event detail
3. Notice detail
4. Create / edit event (admin)
5. Admin dashboard
6. Calendar view

The rest can reuse the system established by these.
