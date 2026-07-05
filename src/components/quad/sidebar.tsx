"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, LogIn } from "lucide-react";
import { STUDENT_NAV } from "./nav-items";
import { BookmarkFlag } from "./bookmark-flag";
import { QuadLogo } from "@/components/quad-logo";
import { InitialAvatar } from "./initial-avatar";
import { cn } from "@/lib/utils";

export function Sidebar({
  user,
  isAdmin = false,
}: {
  user: { name: string; role: string } | null;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();

  return (
    <aside className="border-border bg-sidebar sticky top-0 hidden h-dvh w-[218px] shrink-0 flex-col border-r px-3 py-5 lg:flex">
      <Link href="/feed" className="flex items-center gap-2.5 px-2">
        <QuadLogo size={28} />
        <span className="font-heading text-xl font-extrabold tracking-[-0.02em]">
          Quad
        </span>
      </Link>

      <nav className="mt-6 flex flex-col gap-1">
        {STUDENT_NAV.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-[11px] px-3 py-2.5 text-sm font-semibold transition-colors",
                active
                  ? "bg-primary-50 text-primary"
                  : "text-muted-foreground hover:bg-surface-2",
              )}
            >
              {item.flag ? (
                <BookmarkFlag filled={active} size={19} />
              ) : (
                item.icon && <item.icon className="size-[19px]" strokeWidth={1.8} />
              )}
              {item.label}
            </Link>
          );
        })}

        {isAdmin && (
          <Link
            href="/admin"
            className="text-teal hover:bg-teal-50 mt-1 flex items-center gap-3 rounded-[11px] px-3 py-2.5 text-sm font-semibold transition-colors"
          >
            <LayoutDashboard className="size-[19px]" strokeWidth={1.8} />
            Admin
          </Link>
        )}
      </nav>

      <div className="border-hair mt-auto border-t px-2 pt-4">
        {user ? (
          <div className="flex items-center gap-2.5">
            <InitialAvatar name={user.name} size={34} />
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">{user.name}</div>
              <div className="text-faint text-xs font-medium">{user.role}</div>
            </div>
          </div>
        ) : (
          <Link
            href="/login"
            className="bg-primary text-primary-foreground flex items-center justify-center gap-2 rounded-[12px] py-2.5 text-sm font-bold"
          >
            <LogIn className="size-[18px]" strokeWidth={2} />
            Log in
          </Link>
        )}
      </div>
    </aside>
  );
}
