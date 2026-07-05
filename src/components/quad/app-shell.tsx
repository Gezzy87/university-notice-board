import { Sidebar } from "./sidebar";
import { BottomNav } from "./bottom-nav";
import { AuthProvider } from "./auth-context";
import { getCurrentUser } from "@/lib/session";

/** Student app chrome: desktop sidebar + mobile bottom nav around a main slot. */
export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const isAdmin = user?.role === "ADMIN";
  const navUser = user
    ? { name: user.name, role: isAdmin ? "Admin" : "Student" }
    : null;

  return (
    <AuthProvider value={!!user}>
      <div className="lg:flex">
        <Sidebar user={navUser} isAdmin={isAdmin} />
        <div className="min-h-dvh flex-1 pb-20 lg:pb-0">{children}</div>
        <BottomNav isAdmin={isAdmin} />
      </div>
    </AuthProvider>
  );
}
