"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { toggleBookmark } from "@/app/actions/engagement";
import { BookmarkFlag } from "./bookmark-flag";
import { useIsAuthenticated } from "./auth-context";
import { cn } from "@/lib/utils";

export function BookmarkButton({
  noticeId,
  eventId,
  initialSaved = false,
  size = 18,
  className,
}: {
  noticeId?: string;
  eventId?: string;
  initialSaved?: boolean;
  size?: number;
  className?: string;
}) {
  const router = useRouter();
  const authed = useIsAuthenticated();
  const [saved, setSaved] = useState(initialSaved);
  const [, startTransition] = useTransition();

  return (
    <button
      type="button"
      aria-label={saved ? "Remove bookmark" : "Save"}
      aria-pressed={saved}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!authed) {
          toast("Log in to save", {
            action: { label: "Log in", onClick: () => router.push("/login") },
          });
          return;
        }
        const next = !saved;
        setSaved(next); // optimistic

        startTransition(async () => {
          const result = await toggleBookmark({ noticeId, eventId });
          if (!result.ok) {
            setSaved(!next);
            toast.error(result.error);
            return;
          }
          if (result.saved) {
            toast.success("Saved to your bookmarks", {
              action: { label: "View", onClick: () => router.push("/saved") },
            });
          }
        });
      }}
      className={cn(
        "grid size-8 place-items-center rounded-lg transition-colors",
        saved
          ? "text-primary"
          : "text-faint hover:text-muted-foreground hover:bg-surface-2",
        className,
      )}
    >
      <BookmarkFlag filled={saved} size={size} />
    </button>
  );
}
