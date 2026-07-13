import Link from "next/link";
import { format } from "date-fns";
import { AdminShell } from "@/components/quad/admin/admin-shell";
import { NotificationBell } from "@/components/quad/notification-bell";
import { getDashboardData, getRecentActivity } from "@/lib/queries";

export default async function AdminDashboardPage() {
  const [{ stats, events }, recentActivity] = await Promise.all([
    getDashboardData(),
    getRecentActivity(),
  ]);

  const cards = [
    { label: "Total notices", value: stats.totalNotices.toString() },
    { label: "Upcoming events", value: stats.upcomingEvents.toString() },
    { label: "Total students", value: stats.totalStudents.toLocaleString() },
    { label: "RSVPs this week", value: stats.rsvpsThisWeek.toString() },
  ];

  return (
    <AdminShell>
      <div className="mx-auto w-full max-w-5xl px-4 py-4 lg:px-8 lg:py-7">
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-heading text-[26px] font-bold tracking-[-0.01em]">
            Dashboard
          </h1>
          <NotificationBell items={recentActivity} />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {cards.map((s) => (
            <div
              key={s.label}
              className="border-border bg-card rounded-[18px] border p-4 shadow-[var(--shadow-card)]"
            >
              <div className="text-muted-foreground text-xs font-semibold">
                {s.label}
              </div>
              <div className="font-heading mt-1.5 text-[28px] font-extrabold">
                {s.value}
              </div>
            </div>
          ))}
        </div>

        <section className="mt-6">
          <div className="text-faint mb-3 text-[13px] font-bold tracking-[0.06em]">
            EVENTS &amp; RSVP COUNTS
          </div>
          {events.length === 0 ? (
            <p className="text-muted-foreground text-sm">No events yet.</p>
          ) : (
            <div className="grid gap-2.5 lg:grid-cols-2">
              {events.map((e) => {
                const date = new Date(e.startsAt);
                return (
                  <Link
                    key={e.id}
                    href={`/events/${e.id}`}
                    className="border-border bg-card flex items-center gap-3.5 rounded-[16px] border p-3 shadow-[var(--shadow-card)]"
                  >
                    <div
                      className="border-border h-fit w-12 shrink-0 rounded-[11px] border py-1.5 text-center"
                      style={{ background: "linear-gradient(160deg, #EEEEFE, #DCF1EE)" }}
                    >
                      <div className="text-primary text-[10px] font-bold tracking-[0.06em]">
                        {format(date, "MMM").toUpperCase()}
                      </div>
                      <div
                        className="font-heading text-lg font-extrabold leading-none"
                        style={{ color: "#191B2A" }}
                      >
                        {format(date, "d")}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-heading truncate text-sm font-bold">
                        {e.title}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {e.going}
                        {e.capacity != null && ` / ${e.capacity}`} RSVPs
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </AdminShell>
  );
}
