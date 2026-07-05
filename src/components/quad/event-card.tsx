import Link from "next/link";
import { format } from "date-fns";
import { MapPin } from "lucide-react";
import type { EventItem } from "@/lib/mock";
import { CategoryChip } from "./category-chip";
import { BookmarkButton } from "./bookmark-button";
import { highlight } from "@/lib/highlight";

function statusPill(event: EventItem) {
  if (event.rsvp === "going") {
    return { text: "You're going", cls: "text-primary bg-primary-50" };
  }
  if (event.rsvp === "interested") {
    return { text: "Interested", cls: "text-warning bg-warning-tint" };
  }
  if (event.capacity != null && event.spotsTaken >= event.capacity) {
    return { text: "Full", cls: "text-danger bg-danger-tint" };
  }
  if (event.capacity != null) {
    return {
      text: `${event.capacity - event.spotsTaken} of ${event.capacity} spots left`,
      cls: "text-success bg-success-tint",
    };
  }
  return null;
}

export function EventCard({
  event,
  query,
}: {
  event: EventItem;
  query?: string;
}) {
  const date = new Date(event.startsAt);
  const pill = statusPill(event);

  return (
    <article className="border-border bg-card relative flex h-full gap-[14px] rounded-[18px] border p-[17px] shadow-[var(--shadow-card)]">
      {/* date block */}
      <div
        className="border-border h-fit w-14 shrink-0 rounded-[13px] border py-[9px] text-center"
        style={{ background: "linear-gradient(160deg, #EEEEFE, #DCF1EE)" }}
      >
        <div className="text-primary text-[11px] font-bold tracking-[0.06em]">
          {format(date, "MMM").toUpperCase()}
        </div>
        <div
          className="font-heading text-[22px] font-extrabold leading-none"
          style={{ color: "#191B2A" }}
        >
          {format(date, "d")}
        </div>
      </div>

      {/* body */}
      <div className="min-w-0 flex-1 pr-7">
        <CategoryChip category={event.category} size="sm" />
        <Link href={`/events/${event.id}`} className="group block">
          <h3 className="font-heading mt-[9px] text-base font-bold leading-snug group-hover:underline">
            {highlight(event.title, query)}
          </h3>
        </Link>
        <div className="text-muted-foreground mt-1 flex items-center gap-1.5 text-xs">
          <MapPin className="size-3.5 shrink-0" strokeWidth={1.8} />
          <span className="truncate">
            {event.location} · {format(date, "h:mm a")}
          </span>
        </div>
        {pill && (
          <div
            className={`mt-[10px] inline-block rounded-full px-2.5 py-1 text-xs font-bold ${pill.cls}`}
          >
            {pill.text}
          </div>
        )}
      </div>

      <div className="absolute top-[13px] right-[13px]">
        <BookmarkButton eventId={event.id} initialSaved={event.bookmarked} />
      </div>
    </article>
  );
}
