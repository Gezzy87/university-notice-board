import { Calendar, CalendarCheck, Home, User, type LucideIcon } from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon?: LucideIcon;
  flag?: boolean; // render the pennant bookmark instead of a lucide icon
};

// Student navigation.
export const STUDENT_NAV: NavItem[] = [
  { label: "Home", href: "/feed", icon: Home },
  { label: "Calendar", href: "/calendar", icon: Calendar },
  { label: "Saved", href: "/saved", flag: true },
  { label: "My Events", href: "/my-events", icon: CalendarCheck },
  { label: "Profile", href: "/profile", icon: User },
];
