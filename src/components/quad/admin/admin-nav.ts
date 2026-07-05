import {
  Home,
  LayoutDashboard,
  MessageSquare,
  Tags,
  type LucideIcon,
} from "lucide-react";

export type AdminNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
};

export const ADMIN_NAV: AdminNavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Feed", href: "/feed", icon: Home },
  { label: "Categories", href: "/admin/categories", icon: Tags },
  { label: "Moderation", href: "/admin/moderation", icon: MessageSquare, badge: 3 },
];
