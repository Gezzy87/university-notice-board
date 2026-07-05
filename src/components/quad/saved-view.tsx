"use client";

import { useState } from "react";
import { BookmarkX } from "lucide-react";
import type { FeedItem } from "@/lib/mock";
import { NoticeCard } from "./notice-card";
import { EventCard } from "./event-card";
import { EmptyState } from "./empty-state";
import { cn } from "@/lib/utils";

const TABS = ["All", "Notices", "Events"] as const;
type Tab = (typeof TABS)[number];

export function SavedView({ items }: { items: FeedItem[] }) {
  const [tab, setTab] = useState<Tab>("All");

  const filtered = items.filter((it) =>
    tab === "All"
      ? true
      : tab === "Notices"
        ? it.kind === "notice"
        : it.kind === "event",
  );

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-4 lg:max-w-4xl lg:px-8 lg:py-7">
      <h1 className="font-heading text-[26px] font-bold tracking-[-0.01em]">
        Saved
      </h1>

      <div className="border-hair mt-4 flex gap-6 border-b">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "-mb-px border-b-2 pb-3 text-sm font-semibold transition-colors",
              tab === t
                ? "border-primary text-foreground"
                : "text-muted-foreground border-transparent",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={BookmarkX}
          title="Nothing saved yet"
          description="Bookmark notices and events to find them here later."
        />
      ) : (
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {filtered.map((item) =>
            item.kind === "notice" ? (
              <NoticeCard key={item.id} notice={item} />
            ) : (
              <EventCard key={item.id} event={item} />
            ),
          )}
        </div>
      )}
    </div>
  );
}
