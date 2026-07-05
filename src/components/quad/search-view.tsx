"use client";

import { useMemo, useState } from "react";
import { Search, SearchX, X } from "lucide-react";
import type { FeedItem } from "@/lib/mock";
import { categoryDot } from "@/lib/categories";
import { NoticeCard } from "./notice-card";
import { EventCard } from "./event-card";
import { EmptyState } from "./empty-state";
import { cn } from "@/lib/utils";

export function SearchView({
  items,
  categories,
}: {
  items: FeedItem[];
  categories: string[];
}) {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<string[]>([]);

  const toggle = (c: string) =>
    setFilters((f) => (f.includes(c) ? f.filter((x) => x !== c) : [...f, c]));

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter((it) => filters.length === 0 || filters.includes(it.category))
      .filter(
        (it) =>
          !q ||
          it.title.toLowerCase().includes(q) ||
          (it.kind === "notice" && it.body.toLowerCase().includes(q)),
      );
  }, [items, query, filters]);

  const searching = query.trim() !== "" || filters.length > 0;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-4 lg:max-w-4xl lg:px-8 lg:py-7">
      <h1 className="font-heading text-[26px] font-bold tracking-[-0.01em]">
        Search
      </h1>

      {/* search field with clear */}
      <div className="focus-within:border-primary bg-surface border-border mt-4 flex items-center gap-2.5 rounded-xl border px-3.5 py-3 focus-within:shadow-[0_0_0_3px_var(--primary-50)]">
        <Search className="text-faint size-[18px] shrink-0" strokeWidth={1.8} />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search notices and events"
          className="placeholder:text-faint w-full bg-transparent text-sm outline-none"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="text-faint hover:text-muted-foreground"
          >
            <X className="size-[18px]" strokeWidth={2} />
          </button>
        )}
      </div>

      {/* category filters */}
      <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:px-0 [&::-webkit-scrollbar]:hidden">
        {categories.map((c) => {
          const active = filters.includes(c);
          return (
            <button
              key={c}
              onClick={() => toggle(c)}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-colors",
                active
                  ? "bg-primary text-primary-foreground border-transparent"
                  : "bg-surface-2 text-muted-foreground border-border hover:bg-surface",
              )}
            >
              <span
                className="size-2 rounded-full"
                style={{ background: active ? "#fff" : categoryDot(c) }}
              />
              {c}
            </button>
          );
        })}
      </div>

      {/* active filter chips (removable) + count */}
      {searching && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground text-sm font-semibold">
            {results.length} result{results.length === 1 ? "" : "s"}
          </span>
          {filters.map((c) => (
            <button
              key={c}
              onClick={() => toggle(c)}
              className="bg-primary-50 text-primary inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
            >
              {c}
              <X className="size-3.5" strokeWidth={2.4} />
            </button>
          ))}
        </div>
      )}

      {/* results */}
      {searching && results.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No results found"
          description="Try a different keyword or remove some filters."
        />
      ) : (
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {results.map((item) =>
            item.kind === "notice" ? (
              <NoticeCard key={item.id} notice={item} query={query} />
            ) : (
              <EventCard key={item.id} event={item} query={query} />
            ),
          )}
        </div>
      )}
    </div>
  );
}
