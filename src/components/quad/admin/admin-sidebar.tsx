"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_NAV } from "./admin-nav";
import { CreateMenu } from "./create-menu";
import { QuadLogo } from "@/components/quad-logo";
import { InitialAvatar } from "@/components/quad/initial-avatar";
import { cn } from "@/lib/utils";

export function AdminSidebar({
  user = { name: "Admin", role: "Admin" },
}: {
  user?: { name: string; role: string };
}) {
  const pathname = usePathname();

  return (
    <aside className="border-border bg-sidebar sticky top-0 hidden h-dvh w-[218px] shrink-0 flex-col border-r px-3 py-5 lg:flex">
      <Link href="/admin" className="flex items-center gap-2.5 px-2">
        <QuadLogo size={28} />
        <span className="font-heading text-xl font-extrabold tracking-[-0.02em]">
          Quad
        </span>
      </Link>

      <div className="mt-5">
        <CreateMenu variant="sidebar" />
      </div>

      <nav className="mt-4 flex flex-col gap-1">
        {ADMIN_NAV.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
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
              <item.icon className="size-[19px]" strokeWidth={1.8} />
              <span className="flex-1">{item.label}</span>
              {item.badge ? (
                <span className="bg-danger grid min-w-5 place-items-center rounded-full px-1.5 text-[11px] font-bold text-white">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="border-hair mt-auto flex items-center gap-2.5 border-t px-2 pt-4">
        <InitialAvatar name={user.name} size={34} />
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{user.name}</div>
          <div className="text-faint text-xs font-medium">{user.role}</div>
        </div>
      </div>
    </aside>
  );
}
