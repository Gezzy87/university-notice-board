# Design System — "Quad"

The visual language for this app, defined in
[`src/app/globals.css`](../src/app/globals.css) and originally specified in
[`DESIGN_BRIEF.md`](../DESIGN_BRIEF.md) / [`designer/`](../designer/) (the
handoff docs used to design the screens before implementation).

## Tokens

All colors are CSS custom properties on `:root` (light) and `.dark`, mapped
into Tailwind's theme via `@theme inline` so they're usable as ordinary
Tailwind classes (`bg-primary`, `text-muted-foreground`, `bg-surface-2`, etc.)
— never hardcode a hex value in a component; use the token.

### Brand

| Token | Light | Use |
|---|---|---|
| `primary` | `#4F46E5` (indigo) | Primary actions, links, active nav state |
| `primary-600` | `#4338CA` | Hover/pressed state for primary |
| `primary-50` | `#EEEEFE` | Tint backgrounds (active nav bg, secondary buttons) |
| `teal` | `#0E9488` | Secondary accent — used specifically for **admin/create** affordances, distinguishing "add something" from ordinary primary actions |
| `teal-50` | `#DCF1EE` | Teal tint |

### Surfaces & neutrals

| Token | Light | Use |
|---|---|---|
| `app-bg` | `#F6F7FC` | Page background |
| `surface` | `#FFFFFF` | Cards |
| `surface-2` | `#F1F3FA` | Inputs, chips, subtle fills |
| `border` | `#E7E9F3` | Card/control borders |
| `hair` | `#EFF1F8` | Hairline dividers (lighter than `border`) |
| `faint` | `#9197AE` | Tertiary text, placeholders |

### Semantic

| Token | Color pair | Use |
|---|---|---|
| `success` / `success-tint` | `#16A34A` / `#E4F4EA` | "Going" RSVP, available spots |
| `warning` / `warning-tint` | `#C2740B` / `#F7ECDB` | "Interested" RSVP, pinned badge |
| `danger` / `danger-tint` | `#DC2626` / `#FBE7E7` | Delete actions, "Full" event badge |

### Dark mode

Every token above has a `.dark` override in `globals.css` (e.g. `primary`
becomes a lighter `#8B86F0` for contrast against a dark background,
`app-bg`/`surface` invert to near-black). Components should never assume
light mode — always reach for the token, not a literal color, and dark mode
is handled automatically.

### Typography

Two font families, loaded via `next/font` in
[`src/app/layout.tsx`](../src/app/layout.tsx):

- **Sora** (`--font-heading`) — all headings, card titles, numerals. Bold,
  slightly condensed, gives the brand its distinct feel.
- **Plus Jakarta Sans** (`--font-body`) — everything else (body text, labels,
  buttons).

Use the `font-heading` Tailwind class for anything that should read as a
heading; the base `font-sans` (mapped to the body font) is the default.

### Category colors

Categories don't get arbitrary admin-chosen colors rendered as full
backgrounds — instead, each category has a **dot color** used consistently
as a small indicator next to the category name (in chips, calendar pills,
etc.), defined in [`src/lib/categories.ts`](../src/lib/categories.ts):

```ts
export const CATEGORY_DOT: Record<string, string> = {
  Academic: "#6573A8", Exams: "#B26079", Placements: "#4E9387",
  Sports: "#74935E", Clubs: "#8772B5", Workshops: "#B59440", General: "#646A82",
};
```

`categoryGradient(name)` derives a diagonal gradient from the dot color,
used as the fallback "cover image" on feed cards when a notice/event has no
uploaded `imageUrl` — so every card looks intentional even without a photo.

## Reusable components

Located in `src/components/quad/` (app-specific) vs. `src/components/ui/`
(generic shadcn/ui primitives — button, dialog, dropdown, etc., installed via
`npx shadcn add <component>` and then customized to pull from the tokens
above).

| Component | Purpose |
|---|---|
| `<CategoryChip>` | Category name + dot, used everywhere a post shows its category |
| `<NoticeCard>` / `<EventCard>` | The feed's two card types — event cards additionally show a date block, location, and RSVP status pill |
| `<BookmarkButton>` / `<BookmarkFlag>` | The save toggle; `Flag` is the icon graphic, `Button` wraps it with the click handler and login gate |
| `<RsvpControl>` | Going/Interested segmented control on event detail, with live capacity math |
| `<CommentSection>` | Comment list + composer + `<Pagination>`, shared by both notice and event detail |
| `<Pagination>` | Generic numbered pager (prev/next chevrons + page numbers with ellipsis for long ranges) — currently used by comments, reusable anywhere a list needs paging |
| `<EmptyState>` | Icon + message + CTA, for any "nothing here" state |
| `<Skeleton>` variants (`skeletons.tsx`) | Shimmer placeholders shown via `<Suspense>` while a page's data loads |
| `<AppShell>` | The student-facing layout shell — sidebar + top bar + `<AuthProvider>`, wraps every student page |
| `<AdminShell>` (`admin/`) | The equivalent shell for `/admin/*` pages, with the admin nav and "+ Create" menu |
| `<RichTextEditor>` (`admin/`) | Tiptap-based WYSIWYG editor used in the notice/event create forms |
| `<RichText>` | Renders stored HTML (from the editor) safely — see [Security](./SECURITY.md#rich-text-sanitization) |

## Layout conventions

- **Sidebar navigation** on desktop (`≥lg`), **bottom nav** on mobile —
  `<Sidebar>`/`<BottomNav>` for students, `<AdminSidebar>`/`<AdminBottomNav>`
  for admins. Both read active state from the current pathname.
- **Feed layout** is a "magazine" composition: one large featured
  card, a "Latest" compact list, and a horizontally-scrollable "Upcoming
  events" row — not a uniform grid of identical cards. See `<FeedView>`.
- **Cards use `rounded-[18px]`** consistently (not Tailwind's default radius
  scale) — this specific radius is part of the brand look established in the
  original design brief; match it for new card-like surfaces.

## Where the design originated

[`DESIGN_BRIEF.md`](../DESIGN_BRIEF.md) is the original prompt used with an
AI design tool to generate the visual direction; `designer/` contains the
resulting reference screens and design tokens as delivered. `globals.css` is
the implemented, canonical version — if the two ever disagree, `globals.css`
(what's actually running) wins.
