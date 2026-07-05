"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import type { EventItem, FeedItem } from "@/lib/mock";
import { categoryDot } from "@/lib/categories";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function FeedCalendarToggle() {
  return (
    <div className="bg-surface-2 border-border inline-flex rounded-full border p-1 text-sm font-semibold">
      <Link href="/feed" className="text-muted-foreground rounded-full px-4 py-1.5">
        Feed
      </Link>
      <span className="bg-surface text-foreground rounded-full px-4 py-1.5 shadow-sm">
        Calendar
      </span>
    </div>
  );
}

export function CalendarView({ items }: { items: FeedItem[] }) {
  const events = useMemo(
    () => items.filter((i): i is EventItem => i.kind === "event"),
    [items],
  );
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState(() => new Date());

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month));
    const end = endOfWeek(endOfMonth(month));
    return eachDayOfInterval({ start, end });
  }, [month]);

  const eventsOn = (day: Date) =>
    events.filter((e) => isSameDay(new Date(e.startsAt), day));

  const selectedEvents = eventsOn(selected);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-4 lg:px-8 lg:py-7">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-[26px] font-bold tracking-[-0.01em]">
          Calendar
        </h1>
        <FeedCalendarToggle />
      </div>

      {/* month nav */}
      <div className="mt-5 flex items-center justify-between">
        <div className="font-heading text-lg font-bold">
          {format(month, "MMMM yyyy")}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMonth((m) => addMonths(m, -1))}
            aria-label="Previous month"
            className="bg-surface-2 border-border text-muted-foreground hover:text-foreground grid size-9 place-items-center rounded-[11px] border"
          >
            <ChevronLeft className="size-5" strokeWidth={2} />
          </button>
          <button
            onClick={() => setMonth((m) => addMonths(m, 1))}
            aria-label="Next month"
            className="bg-surface-2 border-border text-muted-foreground hover:text-foreground grid size-9 place-items-center rounded-[11px] border"
          >
            <ChevronRight className="size-5" strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* grid */}
      <div className="border-border bg-card mt-4 overflow-hidden rounded-[18px] border shadow-[var(--shadow-card)]">
        <div className="grid grid-cols-7">
          {WEEKDAYS.map((w) => (
            <div
              key={w}
              className="text-faint border-hair border-b py-2.5 text-center text-[11px] font-bold tracking-[0.06em]"
            >
              {w.slice(0, 3).toUpperCase()}
            </div>
          ))}
          {days.map((day) => {
            const dayEvents = eventsOn(day);
            const inMonth = isSameMonth(day, month);
            const isSelected = isSameDay(day, selected);
            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelected(day)}
                className={cn(
                  "border-hair min-h-[52px] border-b border-r p-1.5 text-left align-top lg:min-h-[104px]",
                  !inMonth && "opacity-40",
                  isSelected && "bg-primary-50 ring-primary ring-1 ring-inset",
                )}
              >
                <div
                  className={cn(
                    "grid size-6 place-items-center rounded-full text-xs font-semibold",
                    isToday(day) && "bg-primary text-primary-foreground",
                    isSelected && !isToday(day) && "text-primary",
                  )}
                >
                  {format(day, "d")}
                </div>

                {/* desktop pills */}
                <div className="mt-1 hidden space-y-1 lg:block">
                  {dayEvents.slice(0, 2).map((e) => (
                    <div
                      key={e.id}
                      className="truncate rounded px-1.5 py-0.5 text-[11px] font-semibold"
                      style={{
                        background: `${categoryDot(e.category)}22`,
                        color: categoryDot(e.category),
                      }}
                    >
                      {e.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-faint px-1.5 text-[10px] font-semibold">
                      +{dayEvents.length - 2} more
                    </div>
                  )}
                </div>

                {/* mobile dots */}
                <div className="mt-1 flex gap-1 lg:hidden">
                  {dayEvents.slice(0, 3).map((e) => (
                    <span
                      key={e.id}
                      className="size-1.5 rounded-full"
                      style={{ background: categoryDot(e.category) }}
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* agenda for selected day (mobile-focused, shown on all sizes) */}
      <div className="mt-6">
        <div className="text-faint mb-3 text-[13px] font-bold tracking-[0.06em]">
          {format(selected, "EEEE, MMMM d").toUpperCase()}
        </div>
        {selectedEvents.length === 0 ? (
          <p className="text-muted-foreground text-sm">No events on this day.</p>
        ) : (
          <div className="space-y-2.5">
            {selectedEvents.map((e) => (
              <Link
                key={e.id}
                href={`/events/${e.id}`}
                className="border-border bg-card flex items-center gap-3 rounded-[14px] border p-3 shadow-[var(--shadow-card)]"
              >
                <span
                  className="h-10 w-1 shrink-0 rounded-full"
                  style={{ background: categoryDot(e.category) }}
                />
                <div className="min-w-0 flex-1">
                  <div className="font-heading truncate text-sm font-bold">
                    {e.title}
                  </div>
                  <div className="text-muted-foreground mt-0.5 flex items-center gap-1.5 text-xs">
                    <MapPin className="size-3.5 shrink-0" strokeWidth={1.8} />
                    <span className="truncate">
                      {e.location} · {format(new Date(e.startsAt), "h:mm a")}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
