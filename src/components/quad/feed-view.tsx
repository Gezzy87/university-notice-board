"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  LogIn,
  MapPin,
  Search,
} from "lucide-react";
import type { EventItem, FeedItem } from "@/lib/mock";
import type { ActivityItem } from "@/lib/queries";
import { categoryDot, categoryGradient } from "@/lib/categories";
import { CategoryChip } from "./category-chip";
import { BookmarkButton } from "./bookmark-button";
import { NotificationBell } from "./notification-bell";
import { QuadLogo } from "@/components/quad-logo";
import { InitialAvatar } from "./initial-avatar";
import { useIsAuthenticated } from "./auth-context";
import { cn } from "@/lib/utils";

const HAIRLINE =
  "repeating-linear-gradient(135deg, #fff 0 1px, transparent 1px 20px)";

function detailHref(item: FeedItem) {
  return item.kind === "notice" ? `/notices/${item.id}` : `/events/${item.id}`;
}

function metaText(item: FeedItem) {
  if (item.kind === "notice") {
    return `${item.author} · ${formatDistanceToNow(new Date(item.publishedAt), {
      addSuffix: true,
    })}`;
  }
  return `${item.location} · ${format(new Date(item.startsAt), "MMM d")}`;
}

function FeedCalendarToggle() {
  return (
    <div className="bg-surface-2 border-border inline-flex rounded-full border p-1 text-sm font-semibold">
      <span className="bg-surface text-foreground rounded-full px-4 py-1.5 shadow-sm">
        Feed
      </span>
      <Link
        href="/calendar"
        className="text-muted-foreground rounded-full px-4 py-1.5"
      >
        Calendar
      </Link>
    </div>
  );
}

/** Large hero card — the pinned / top item, with content overlaid on a
 *  category-colored gradient panel (standing in for a cover image). */
function FeaturedCard({ item }: { item: FeedItem }) {
  return (
    <div className="relative">
      <Link
        href={detailHref(item)}
        className="group relative block h-[300px] overflow-hidden rounded-[22px] lg:h-[400px]"
      >
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <>
            <div
              className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.03]"
              style={{ background: categoryGradient(item.category) }}
            />
            <div className="absolute inset-0 opacity-[0.1]" style={{ backgroundImage: HAIRLINE }} />
          </>
        )}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(12,13,25,0.72) 0%, rgba(12,13,25,0.12) 55%, transparent 80%)",
          }}
        />
        <div className="absolute inset-x-0 bottom-0 p-6 text-white">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
            <span className="size-1.5 rounded-full bg-white" />
            {item.category}
          </span>
          <h2 className="font-heading mt-3 text-2xl font-extrabold leading-tight tracking-[-0.01em] lg:text-[30px]">
            {item.title}
          </h2>
          <div className="mt-2 text-sm text-white/75">{metaText(item)}</div>
        </div>
      </Link>
      <div className="absolute right-4 top-4">
        <BookmarkButton
          noticeId={item.kind === "notice" ? item.id : undefined}
          eventId={item.kind === "event" ? item.id : undefined}
          initialSaved={item.bookmarked}
          size={19}
          className="bg-black/25 !text-white backdrop-blur-sm hover:bg-black/40"
        />
      </div>
    </div>
  );
}

/** Compact row for the "Latest" list — colored thumbnail + title + meta. */
function LatestRow({ item }: { item: FeedItem }) {
  return (
    <Link href={detailHref(item)} className="group flex items-start gap-3.5 py-3">
      {item.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.imageUrl}
          alt=""
          className="size-14 shrink-0 rounded-[12px] object-cover"
        />
      ) : (
        <div
          className="size-14 shrink-0 rounded-[12px]"
          style={{ background: categoryGradient(item.category) }}
        />
      )}
      <div className="min-w-0 flex-1">
        <div className="font-heading line-clamp-2 text-[15px] font-bold leading-snug group-hover:underline">
          {item.title}
        </div>
        <div className="text-faint mt-1 text-xs">{metaText(item)}</div>
      </div>
    </Link>
  );
}

/** Card for the horizontal "Upcoming events" carousel. */
function EventFeatureCard({ event }: { event: EventItem }) {
  const date = new Date(event.startsAt);
  return (
    <div className="relative w-[280px] shrink-0">
      <Link
        href={`/events/${event.id}`}
        className="group border-border bg-card block overflow-hidden rounded-[18px] border shadow-[var(--shadow-card)]"
      >
        <div
          className="relative h-28"
          style={event.imageUrl ? undefined : { background: categoryGradient(event.category) }}
        >
          {event.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={event.imageUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 opacity-[0.1]" style={{ backgroundImage: HAIRLINE }} />
          )}
          <div className="absolute left-3 top-3 rounded-[10px] bg-white/90 px-2.5 py-1 text-center backdrop-blur-sm">
            <div
              className="text-[10px] font-bold tracking-[0.06em]"
              style={{ color: categoryDot(event.category) }}
            >
              {format(date, "MMM").toUpperCase()}
            </div>
            <div className="font-heading text-lg font-extrabold leading-none text-[#191B2A]">
              {format(date, "d")}
            </div>
          </div>
        </div>
        <div className="p-4">
          <CategoryChip category={event.category} size="sm" />
          <h3 className="font-heading mt-2 line-clamp-1 text-base font-bold group-hover:underline">
            {event.title}
          </h3>
          <div className="text-muted-foreground mt-1 flex items-center gap-1.5 text-xs">
            <MapPin className="size-3.5 shrink-0" strokeWidth={1.8} />
            <span className="truncate">
              {event.location} · {format(date, "h:mm a")}
            </span>
          </div>
        </div>
      </Link>
      <div className="absolute right-3 top-3">
        <BookmarkButton
          eventId={event.id}
          initialSaved={event.bookmarked}
          size={17}
          className="bg-white/85 backdrop-blur-sm hover:bg-white"
        />
      </div>
    </div>
  );
}

function EventsRow({ events }: { events: EventItem[] }) {
  const scroller = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) =>
    scroller.current?.scrollBy({ left: dir * 300, behavior: "smooth" });

  return (
    <section className="mt-9">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-bold">Upcoming events</h2>
        <div className="flex gap-1.5">
          <button
            onClick={() => scroll(-1)}
            aria-label="Previous events"
            className="border-border text-muted-foreground hover:bg-surface-2 grid size-9 place-items-center rounded-full border"
          >
            <ChevronLeft className="size-4" strokeWidth={2} />
          </button>
          <button
            onClick={() => scroll(1)}
            aria-label="More events"
            className="border-border text-muted-foreground hover:bg-surface-2 grid size-9 place-items-center rounded-full border"
          >
            <ChevronRight className="size-4" strokeWidth={2} />
          </button>
        </div>
      </div>
      <div
        ref={scroller}
        className="-mx-4 mt-4 flex gap-4 overflow-x-auto px-4 pb-2 lg:mx-0 lg:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {events.map((e) => (
          <EventFeatureCard key={e.id} event={e} />
        ))}
      </div>
    </section>
  );
}

const PAGE_SIZE = 5;

export function FeedView({
  items,
  categories,
  userName,
  recentActivity,
}: {
  items: FeedItem[];
  categories: string[];
  userName?: string;
  recentActivity: ActivityItem[];
}) {
  const authed = useIsAuthenticated();
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const FILTERS = ["All", ...categories];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter((it) => category === "All" || it.category === category)
      .filter(
        (it) =>
          !q ||
          it.title.toLowerCase().includes(q) ||
          (it.kind === "notice" && it.body.toLowerCase().includes(q)),
      )
      .sort((a, b) => {
        const ap = a.kind === "notice" && a.pinned ? 1 : 0;
        const bp = b.kind === "notice" && b.pinned ? 1 : 0;
        return bp - ap;
      });
  }, [items, category, query]);

  // Magazine arrangement.
  const featured = filtered[0];
  const rest = filtered.slice(1);
  const events = rest.filter((i): i is EventItem => i.kind === "event");
  const notices = rest.filter((i) => i.kind === "notice");

  const totalPages = Math.max(1, Math.ceil(notices.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const latest = notices.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-4 lg:max-w-6xl lg:px-8 lg:py-7">
      {/* mobile top bar */}
      <div className="flex items-center justify-between lg:hidden">
        <div className="flex items-center gap-2">
          <QuadLogo size={28} />
          <span className="font-heading text-xl font-extrabold tracking-[-0.02em]">
            Quad
          </span>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell items={recentActivity} />
          {authed ? (
            <Link href="/profile" aria-label="Profile">
              <InitialAvatar name={userName ?? "You"} size={34} />
            </Link>
          ) : (
            <Link
              href="/login"
              className="bg-primary text-primary-foreground flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold"
            >
              <LogIn className="size-4" strokeWidth={2} />
              Log in
            </Link>
          )}
        </div>
      </div>

      {/* desktop header */}
      <div className="hidden items-center justify-between lg:flex">
        <h1 className="font-heading text-[26px] font-bold tracking-[-0.01em]">Feed</h1>
        <div className="flex items-center gap-2.5">
          <NotificationBell items={recentActivity} />
          <FeedCalendarToggle />
        </div>
      </div>

      {/* search */}
      <div className="focus-within:border-primary bg-surface border-border mt-4 flex items-center gap-2.5 rounded-xl border px-3.5 py-3 focus-within:shadow-[0_0_0_3px_var(--primary-50)]">
        <Search className="text-faint size-[18px] shrink-0" strokeWidth={1.8} />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          placeholder="Search notices and events"
          className="placeholder:text-faint w-full bg-transparent text-sm outline-none"
        />
      </div>

      {/* category chips */}
      <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:px-0 [&::-webkit-scrollbar]:hidden">
        {FILTERS.map((c) => {
          const active = category === c;
          return (
            <button
              key={c}
              onClick={() => {
                setCategory(c);
                setPage(1);
              }}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-colors",
                active
                  ? "bg-primary text-primary-foreground border-transparent"
                  : "bg-surface-2 text-muted-foreground border-border hover:bg-surface",
              )}
            >
              {c !== "All" && (
                <span
                  className="size-2 rounded-full"
                  style={{ background: active ? "#fff" : categoryDot(c) }}
                />
              )}
              {c}
            </button>
          );
        })}
      </div>

      {!featured ? (
        <div className="mt-16 text-center">
          <p className="font-heading text-lg font-extrabold">Nothing here yet</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Try a different category or clear your search.
          </p>
        </div>
      ) : (
        <>
          {/* featured + latest */}
          <div
            className={cn(
              "mt-6 grid gap-6",
              latest.length > 0 && "lg:grid-cols-[1.55fr_1fr]",
            )}
          >
            <FeaturedCard item={featured} />
            {latest.length > 0 && (
              <div>
                <h2 className="font-heading text-lg font-bold">Latest</h2>
                <div className="divide-hair mt-2 divide-y">
                  {latest.map((n) => (
                    <LatestRow key={n.id} item={n} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* upcoming events carousel */}
          {events.length > 0 && <EventsRow events={events} />}

          {/* pagination (only when the Latest list spans multiple pages) */}
          {totalPages > 1 && (
            <div className="mt-9 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={current === 1}
                aria-label="Previous page"
                className="border-border text-muted-foreground hover:bg-surface-2 grid size-9 place-items-center rounded-full border disabled:opacity-40"
              >
                <ChevronLeft className="size-4" strokeWidth={2} />
              </button>
              {Array.from({ length: totalPages }).map((_, i) => {
                const p = i + 1;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={cn(
                      "grid size-9 place-items-center rounded-full text-sm font-semibold",
                      p === current
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:bg-surface-2",
                    )}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={current === totalPages}
                aria-label="Next page"
                className="border-border text-muted-foreground hover:bg-surface-2 grid size-9 place-items-center rounded-full border disabled:opacity-40"
              >
                <ChevronRight className="size-4" strokeWidth={2} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
