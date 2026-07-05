import { AdminSidebar } from "./admin-sidebar";
import { AdminBottomNav } from "./admin-bottom-nav";
import { getCurrentUser } from "@/lib/session";

/** Admin chrome: desktop sidebar (with Create + moderation badge) + mobile bottom nav w/ FAB. */
export async function AdminShell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const navUser = { name: user?.name ?? "Admin", role: "Admin" };

  return (
    <div className="lg:flex">
      <AdminSidebar user={navUser} />
      <div className="min-h-dvh flex-1 pb-20 lg:pb-0">{children}</div>
      <AdminBottomNav />
    </div>
  );
}
