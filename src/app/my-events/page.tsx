import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { CalendarX2, MapPin } from "lucide-react";
import { AppShell } from "@/components/quad/app-shell";
import { EmptyState } from "@/components/quad/empty-state";
import { ListSkeleton } from "@/components/quad/skeletons";
import { getMyEvents, type MyEventRow } from "@/lib/queries";
import { getCurrentUser } from "@/lib/session";
import { cn } from "@/lib/utils";

function StatusPill({ status }: { status: MyEventRow["status"] }) {
  const map = {
    going: "text-success bg-success-tint",
    interested: "text-warning bg-warning-tint",
    attended: "text-muted-foreground bg-surface-2",
  } as const;
  const label = { going: "Going", interested: "Interested", attended: "Attended" };
  return (
    <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold", map[status])}>
      {label[status]}
    </span>
  );
}

function EventRow({ ev, past }: { ev: MyEventRow; past?: boolean }) {
  const date = new Date(ev.when);
  return (
    <Link
      href={`/events/${ev.id}`}
      className={cn(
        "border-border bg-card flex items-center gap-3.5 rounded-[18px] border p-[15px] shadow-[var(--shadow-card)]",
        past && "opacity-60",
      )}
    >
      <div
        className="border-border h-fit w-14 shrink-0 rounded-[13px] border py-[9px] text-center"
        style={{ background: "linear-gradient(160deg, #EEEEFE, #DCF1EE)" }}
      >
        <div className="text-primary text-[11px] font-bold tracking-[0.06em]">
          {format(date, "MMM").toUpperCase()}
        </div>
        <div
          className="font-heading text-[22px] font-extrabold leading-none"
          style={{ color: "#191B2A" }}
        >
          {format(date, "d")}
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-heading truncate text-[15px] font-bold">{ev.title}</div>
        <div className="text-muted-foreground mt-1 flex items-center gap-1.5 text-xs">
          <MapPin className="size-3.5 shrink-0" strokeWidth={1.8} />
          <span className="truncate">
            {ev.location} · {format(date, "h:mm a")}
          </span>
        </div>
        <div className="mt-2 flex items-center gap-3">
          <StatusPill status={ev.status} />
          {!past && (
            <span className="text-primary text-xs font-semibold">Change</span>
          )}
        </div>
      </div>
    </Link>
  );
}

async function MyEventsContent({ userId }: { userId: string }) {
  const { upcoming, past } = await getMyEvents(userId);
  const empty = upcoming.length === 0 && past.length === 0;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-4 lg:max-w-3xl lg:px-8 lg:py-7">
        <h1 className="font-heading text-[26px] font-bold tracking-[-0.01em]">
          My Events
        </h1>

        {empty ? (
          <EmptyState
            icon={CalendarX2}
            title="No events yet"
            description="RSVP to events you want to attend and they'll show up here."
            action={
              <Link
                href="/feed"
                className="bg-primary text-primary-foreground rounded-[13px] px-5 py-2.5 text-sm font-bold"
              >
                Browse events
              </Link>
            }
          />
        ) : (
          <>
            {upcoming.length > 0 && (
              <>
                <div className="text-faint mt-5 mb-3 text-[13px] font-bold tracking-[0.06em]">
                  UPCOMING
                </div>
                <div className="space-y-3">
                  {upcoming.map((ev) => (
                    <EventRow key={ev.id} ev={ev} />
                  ))}
                </div>
              </>
            )}

            {past.length > 0 && (
              <>
                <div className="text-faint mt-7 mb-3 text-[13px] font-bold tracking-[0.06em]">
                  PAST
                </div>
                <div className="space-y-3">
                  {past.map((ev) => (
                    <EventRow key={ev.id} ev={ev} past />
                  ))}
                </div>
              </>
            )}
          </>
        )}
    </div>
  );
}

export default async function MyEventsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return (
    <AppShell>
      <Suspense fallback={<ListSkeleton />}>
        <MyEventsContent userId={user.id} />
      </Suspense>
    </AppShell>
  );
}
