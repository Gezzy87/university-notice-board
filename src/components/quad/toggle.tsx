"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function Toggle({
  defaultOn = false,
  onChange,
}: {
  defaultOn?: boolean;
  onChange?: (on: boolean) => void;
}) {
  const [on, setOn] = useState(defaultOn);
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() =>
        setOn((v) => {
          onChange?.(!v);
          return !v;
        })
      }
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors",
        on ? "bg-primary border-transparent" : "bg-surface-2 border-border",
      )}
    >
      <span
        className={cn(
          "inline-block size-[18px] rounded-full bg-white shadow-sm transition-transform",
          on ? "translate-x-[22px]" : "translate-x-[3px]",
        )}
      />
    </button>
  );
}
