"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard } from "lucide-react";
import { STUDENT_NAV } from "./nav-items";
import { BookmarkFlag } from "./bookmark-flag";
import { cn } from "@/lib/utils";

export function BottomNav({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();

  return (
    <nav className="border-border bg-surface fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t pb-[env(safe-area-inset-bottom)] lg:hidden">
      {STUDENT_NAV.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-semibold",
              active ? "text-primary" : "text-faint",
            )}
          >
            {item.flag ? (
              <BookmarkFlag filled={active} size={22} />
            ) : (
              item.icon && <item.icon className="size-[22px]" strokeWidth={active ? 2.1 : 1.8} />
            )}
            {item.label}
          </Link>
        );
      })}

      {isAdmin && (
        <Link
          href="/admin"
          className="text-teal flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-semibold"
        >
          <LayoutDashboard className="size-[22px]" strokeWidth={1.8} />
          Admin
        </Link>
      )}
    </nav>
  );
}
