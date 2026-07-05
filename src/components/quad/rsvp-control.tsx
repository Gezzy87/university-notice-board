"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Check, LogIn } from "lucide-react";
import { toast } from "sonner";
import { setRsvp } from "@/app/actions/engagement";
import { useIsAuthenticated } from "./auth-context";
import { cn } from "@/lib/utils";

type Status = "going" | "interested" | null;

export function RsvpControl({
  eventId,
  initial = null,
  capacity,
  spotsTaken,
}: {
  eventId: string;
  initial?: Status;
  capacity: number | null;
  spotsTaken: number;
}) {
  const authed = useIsAuthenticated();
  const [status, setStatus] = useState<Status>(initial);
  const [, startTransition] = useTransition();

  // spotsTaken from the server already includes this user's GOING rsvp (if any).
  const baseTaken = spotsTaken - (initial === "going" ? 1 : 0);
  const taken = baseTaken + (status === "going" ? 1 : 0);
  const isFull = capacity != null && taken >= capacity && status !== "going";
  const left = capacity != null ? Math.max(0, capacity - taken) : null;

  // Guests can see availability but must log in to RSVP.
  if (!authed) {
    return (
      <div>
        <Link
          href="/login"
          className="bg-primary text-primary-foreground hover:bg-[var(--primary-600)] flex w-full items-center justify-center gap-2 rounded-[11px] py-2.5 text-sm font-bold transition-colors"
        >
          <LogIn className="size-[18px]" strokeWidth={2} />
          Log in to RSVP
        </Link>
        {capacity != null && (
          <p
            className={cn(
              "mt-2.5 text-xs font-bold",
              isFull ? "text-danger" : "text-success",
            )}
          >
            {isFull ? "● Event full" : `● ${left} of ${capacity} spots left`}
          </p>
        )}
      </div>
    );
  }

  function choose(next: Exclude<Status, null>) {
    if (next === "going" && isFull) {
      toast.error("This event is full", {
        description: "Check back later — spots open up when people cancel.",
      });
      return;
    }
    const value: Status = status === next ? null : next;
    const prev = status;
    setStatus(value); // optimistic

    startTransition(async () => {
      const result = await setRsvp(
        eventId,
        value === null ? null : value === "going" ? "GOING" : "INTERESTED",
      );
      if (!result.ok) {
        setStatus(prev);
        toast.error(result.error);
        return;
      }
      if (value === "going") {
        toast.success("You're going!", {
          action: { label: "Undo", onClick: () => choose("going") },
        });
      } else if (value === "interested") {
        toast.success("Marked as interested");
      }
    });
  }

  return (
    <div>
      <div className="bg-surface-2 border-border flex gap-1 rounded-[13px] border p-1">
        <button
          onClick={() => choose("going")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-[9px] py-2.5 text-sm font-bold transition-colors",
            status === "going"
              ? "bg-success text-white"
              : "text-muted-foreground hover:bg-surface",
          )}
        >
          {status === "going" && <Check className="size-4" strokeWidth={2.6} />}
          Going
        </button>
        <button
          onClick={() => choose("interested")}
          className={cn(
            "flex flex-1 items-center justify-center rounded-[9px] py-2.5 text-sm font-semibold transition-colors",
            status === "interested"
              ? "bg-warning text-white"
              : "text-muted-foreground hover:bg-surface",
          )}
        >
          Interested
        </button>
      </div>

      {capacity != null && (
        <p
          className={cn(
            "mt-2.5 text-xs font-bold",
            isFull ? "text-danger" : "text-success",
          )}
        >
          {isFull ? "● Event full" : `● ${left} of ${capacity} spots left`}
        </p>
      )}
    </div>
  );
}
