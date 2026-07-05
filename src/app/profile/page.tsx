import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell, Bookmark, Building2, ChevronRight, Mail, Pencil } from "lucide-react";
import { AppShell } from "@/components/quad/app-shell";
import { InitialAvatar } from "@/components/quad/initial-avatar";
import { LogoutRow } from "@/components/quad/logout-row";
import { getCurrentUser } from "@/lib/session";

function Row({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof Mail;
  label: string;
  value?: string;
  href?: string;
}) {
  const inner = (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <span className="bg-surface-2 text-muted-foreground grid size-9 shrink-0 place-items-center rounded-[10px]">
        <Icon className="size-[18px]" strokeWidth={1.8} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold">{label}</div>
        {value && (
          <div className="text-muted-foreground truncate text-xs">{value}</div>
        )}
      </div>
      {href && <ChevronRight className="text-faint size-4 shrink-0" strokeWidth={2} />}
    </div>
  );
  return href ? (
    <Link href={href} className="hover:bg-surface-2 block transition-colors">
      {inner}
    </Link>
  ) : (
    inner
  );
}

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-2xl px-4 py-4 lg:max-w-2xl lg:px-8 lg:py-7">
        {/* gradient header */}
        <div
          className="relative overflow-hidden rounded-[22px] p-6 text-white"
          style={{
            background:
              "radial-gradient(120% 120% at 20% 0%, #4F46E5 0%, #4338CA 45%, #0E9488 100%)",
          }}
        >
          <button
            className="absolute right-4 top-4 grid size-9 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25"
            aria-label="Edit profile"
          >
            <Pencil className="size-4" strokeWidth={1.9} />
          </button>
          <div className="flex items-center gap-4">
            <InitialAvatar name={user.name} size={64} className="ring-4 ring-white/25" />
            <div>
              <div className="font-heading text-xl font-extrabold">{user.name}</div>
              <div className="text-sm text-white/80">
                {user.department ?? "Student"}
                {user.role === "ADMIN" ? " · Admin" : ""}
              </div>
            </div>
          </div>
        </div>

        {/* grouped rows */}
        <div className="border-border bg-card divide-hair mt-5 divide-y overflow-hidden rounded-[18px] border shadow-[var(--shadow-card)]">
          <Row icon={Mail} label="Email" value={user.email} />
          <Row
            icon={Building2}
            label="Department"
            value={user.department ?? "Not set"}
          />
          <Row
            icon={Bell}
            label="Notification settings"
            href="/notifications"
          />
          <Row icon={Bookmark} label="Saved items" href="/saved" />
        </div>

        <LogoutRow />
      </div>
    </AppShell>
  );
}
