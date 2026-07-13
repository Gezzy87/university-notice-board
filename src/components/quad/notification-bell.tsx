"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, CalendarPlus, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ActivityItem } from "@/lib/queries";
import { cn } from "@/lib/utils";

const LS_KEY = "quad:notif-last-seen";

export function NotificationBell({ items }: { items: ActivityItem[] }) {
  // Track the timestamp the admin last opened the bell (persisted locally), so
  // the bell pulses only for notices/events created since then. Read after
  // mount to avoid a hydration mismatch.
  const [lastSeen, setLastSeen] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLastSeen(localStorage.getItem(LS_KEY));
    setReady(true);
  }, []);

  const isNew = (createdAt: string) => !lastSeen || createdAt > lastSeen;
  const newCount = ready ? items.filter((i) => isNew(i.createdAt)).length : 0;
  const hasNew = newCount > 0;

  function markSeen() {
    const latest = items[0]?.createdAt ?? new Date().toISOString();
    localStorage.setItem(LS_KEY, latest);
    setLastSeen(latest);
  }

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open && hasNew) markSeen();
      }}
    >
      <DropdownMenuTrigger
        aria-label={hasNew ? `${newCount} new notifications` : "Notifications"}
        className="border-border bg-card text-muted-foreground hover:text-foreground relative grid size-10 place-items-center rounded-full border transition-colors"
      >
        <Bell
          className={cn("size-[20px]", hasNew && "text-primary animate-bell")}
          strokeWidth={1.8}
        />
        {hasNew && (
          <span className="absolute -right-0.5 -top-0.5 flex size-[18px] items-center justify-center">
            <span className="bg-danger absolute inline-flex size-full animate-ping rounded-full opacity-60" />
            <span className="bg-danger relative grid size-[18px] place-items-center rounded-full text-[10px] font-bold text-white ring-2 ring-[var(--card)]">
              {newCount > 9 ? "9+" : newCount}
            </span>
          </span>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-72">
        <div className="text-faint px-2 py-1.5 text-[11px] font-bold tracking-[0.06em]">
          RECENT ACTIVITY
        </div>
        {items.length === 0 ? (
          <div className="text-muted-foreground px-2 py-3 text-sm">
            Nothing yet.
          </div>
        ) : (
          items.map((i) => (
            <DropdownMenuItem
              key={`${i.type}-${i.id}`}
              render={<Link href={i.href} />}
              className="gap-2.5"
            >
              <span className="bg-surface-2 text-muted-foreground grid size-7 shrink-0 place-items-center rounded-lg">
                {i.type === "notice" ? (
                  <FileText className="size-3.5" />
                ) : (
                  <CalendarPlus className="size-3.5" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  {i.title}
                </span>
                <span className="text-faint block text-xs">
                  {i.type === "notice" ? "Notice" : "Event"} ·{" "}
                  {formatDistanceToNow(new Date(i.createdAt), { addSuffix: true })}
                </span>
              </span>
              {ready && isNew(i.createdAt) && (
                <span className="bg-primary size-1.5 shrink-0 rounded-full" />
              )}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
