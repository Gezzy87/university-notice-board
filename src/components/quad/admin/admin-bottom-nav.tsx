"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Home, LayoutDashboard, MessageSquare } from "lucide-react";
import { CreateMenu } from "./create-menu";
import { cn } from "@/lib/utils";

const LEFT = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Feed", href: "/feed", icon: Home },
];
const RIGHT = [
  { label: "Events", href: "/calendar", icon: Calendar },
  { label: "Comments", href: "/admin/moderation", icon: MessageSquare },
];

function Item({
  item,
  active,
}: {
  item: { label: string; href: string; icon: typeof Home };
  active: boolean;
}) {
  return (
    <Link
      href={item.href}
      className={cn(
        "flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-semibold",
        active ? "text-primary" : "text-faint",
      )}
    >
      <item.icon className="size-[22px]" strokeWidth={active ? 2.1 : 1.8} />
      {item.label}
    </Link>
  );
}

export function AdminBottomNav() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <nav className="border-border bg-surface fixed inset-x-0 bottom-0 z-40 flex items-center border-t pb-[env(safe-area-inset-bottom)] lg:hidden">
      {LEFT.map((item) => (
        <Item key={item.href} item={item} active={isActive(item.href)} />
      ))}
      <div className="flex flex-1 justify-center">
        <CreateMenu variant="fab" />
      </div>
      {RIGHT.map((item) => (
        <Item key={item.href} item={item} active={isActive(item.href)} />
      ))}
    </nav>
  );
}
