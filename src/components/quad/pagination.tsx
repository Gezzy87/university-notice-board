"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

function pageList(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "ellipsis")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) pages.push("ellipsis");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push("ellipsis");
  pages.push(total);
  return pages;
}

export function Pagination({
  page,
  totalPages,
  onChange,
  className,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  className?: string;
}) {
  if (totalPages <= 1) return null;
  const pages = pageList(page, totalPages);

  const arrow =
    "border-border text-muted-foreground hover:bg-surface-2 grid size-8 place-items-center rounded-full border transition-colors disabled:pointer-events-none disabled:opacity-40";

  return (
    <div className={cn("flex items-center justify-center gap-1.5", className)}>
      <button
        aria-label="Previous page"
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
        className={arrow}
      >
        <ChevronLeft className="size-4" strokeWidth={2} />
      </button>

      {pages.map((p, i) =>
        p === "ellipsis" ? (
          <span key={`e${i}`} className="text-faint px-1 text-sm">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            aria-current={p === page ? "page" : undefined}
            className={cn(
              "grid size-8 place-items-center rounded-full text-sm font-semibold transition-colors",
              p === page
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-surface-2",
            )}
          >
            {p}
          </button>
        ),
      )}

      <button
        aria-label="Next page"
        disabled={page === totalPages}
        onClick={() => onChange(page + 1)}
        className={arrow}
      >
        <ChevronRight className="size-4" strokeWidth={2} />
      </button>
    </div>
  );
}
