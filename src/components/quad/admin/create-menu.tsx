"use client";

import Link from "next/link";
import { CalendarPlus, FileText, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function CreateMenu({ variant }: { variant: "sidebar" | "fab" }) {
  const isSidebar = variant === "sidebar";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Create"
        className={
          isSidebar
            ? "bg-teal flex w-full items-center justify-center gap-2 rounded-[11px] py-2.5 text-sm font-bold text-white shadow-[var(--shadow-fab)]"
            : "bg-teal grid size-12 -translate-y-3.5 place-items-center rounded-[15px] text-white shadow-[var(--shadow-fab)]"
        }
      >
        {isSidebar ? (
          <>
            <Plus className="size-[18px]" strokeWidth={2.2} />
            Create
          </>
        ) : (
          <Plus className="size-6" strokeWidth={2.4} />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={isSidebar ? "start" : "center"}>
        <DropdownMenuItem render={<Link href="/admin/notices/new" />}>
          <FileText className="size-4" /> New notice
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/admin/events/new" />}>
          <CalendarPlus className="size-4" /> New event
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
