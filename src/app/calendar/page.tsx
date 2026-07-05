import { Suspense } from "react";
import { AppShell } from "@/components/quad/app-shell";
import { CalendarView } from "@/components/quad/calendar-view";
import { CalendarSkeleton } from "@/components/quad/skeletons";
import { getCalendarItems } from "@/lib/queries";

async function CalendarContent() {
  const items = await getCalendarItems();
  return <CalendarView items={items} />;
}

export default function CalendarPage() {
  return (
    <AppShell>
      <Suspense fallback={<CalendarSkeleton />}>
        <CalendarContent />
      </Suspense>
    </AppShell>
  );
}
