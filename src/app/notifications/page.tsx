import { AppShell } from "@/components/quad/app-shell";
import { ScreenHeader } from "@/components/quad/screen-header";
import { Toggle } from "@/components/quad/toggle";

type Setting = { label: string; sub?: string; on: boolean };

const EMAIL: Setting[] = [
  { label: "New notice in a followed category", on: true },
  { label: "Event reminders", sub: "1 hour before", on: true },
  { label: "Replies to my comments", on: false },
  { label: "Weekly digest", on: false },
];

const IN_APP: Setting[] = [
  { label: "New notices", on: true },
  { label: "RSVP confirmations", on: true },
  { label: "Event reminders", sub: "1 hour before", on: true },
  { label: "Comment replies", on: true },
];

function Group({ title, settings }: { title: string; settings: Setting[] }) {
  return (
    <div className="mt-6">
      <div className="text-faint mb-3 text-[13px] font-bold tracking-[0.06em]">
        {title}
      </div>
      <div className="border-border bg-card divide-hair divide-y overflow-hidden rounded-[18px] border shadow-[var(--shadow-card)]">
        {settings.map((s) => (
          <div key={s.label} className="flex items-center gap-3 px-4 py-3.5">
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold">{s.label}</div>
              {s.sub && <div className="text-faint text-xs">{s.sub}</div>}
            </div>
            <Toggle defaultOn={s.on} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <AppShell>
      <div className="mx-auto w-full max-w-2xl px-4 py-4 lg:max-w-2xl lg:px-8 lg:py-7">
        <ScreenHeader title="Notifications" backHref="/profile" />
        <Group title="EMAIL" settings={EMAIL} />
        <Group title="IN-APP" settings={IN_APP} />
      </div>
    </AppShell>
  );
}
