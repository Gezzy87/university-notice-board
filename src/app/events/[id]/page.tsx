import { Suspense } from "react";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { CalendarDays, MapPin } from "lucide-react";
import { AppShell } from "@/components/quad/app-shell";
import { BackBar } from "@/components/quad/back-bar";
import { BookmarkButton } from "@/components/quad/bookmark-button";
import { CategoryChip } from "@/components/quad/category-chip";
import { InitialAvatar } from "@/components/quad/initial-avatar";
import { AttachmentRow, SectionEyebrow } from "@/components/quad/attachment-row";
import { CommentSection } from "@/components/quad/comment-section";
import { RsvpControl } from "@/components/quad/rsvp-control";
import { RichText } from "@/components/quad/rich-text";
import { DetailSkeleton } from "@/components/quad/skeletons";
import { getEventById } from "@/lib/queries";
import { getCurrentUser } from "@/lib/session";

async function EventDetailContent({ id }: { id: string }) {
  const user = await getCurrentUser();
  const event = await getEventById(id, user?.id);
  if (!event) notFound();

  const start = new Date(event.startsAt);
  const end = new Date(event.endsAt);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-4 lg:py-7">
        <BackBar
          right={
            <BookmarkButton
              size={20}
              eventId={event.id}
              initialSaved={event.bookmarked}
            />
          }
        />

        <div className="mt-5">
          <CategoryChip category={event.category} />
          <h1 className="font-heading mt-4 text-[30px] font-extrabold leading-[1.15] tracking-[-0.02em]">
            {event.title}
          </h1>
        </div>

        <div className="mt-6 lg:grid lg:grid-cols-[1fr_340px] lg:gap-8">
          {/* details + RSVP (right on desktop, first on mobile) */}
          <aside className="lg:order-2 lg:sticky lg:top-6 lg:self-start">
            <div className="border-border bg-card space-y-3.5 rounded-[18px] border p-4 shadow-[var(--shadow-card)]">
              <div className="flex items-center gap-2.5 text-sm">
                <span className="bg-surface-2 text-muted-foreground grid size-9 place-items-center rounded-[10px]">
                  <CalendarDays className="size-[18px]" strokeWidth={1.8} />
                </span>
                <span>
                  {format(start, "EEE, MMM d")} · {format(start, "h:mm a")} –{" "}
                  {format(end, "h:mm a")}
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-sm">
                <span className="bg-surface-2 text-muted-foreground grid size-9 place-items-center rounded-[10px]">
                  <MapPin className="size-[18px]" strokeWidth={1.8} />
                </span>
                <span>{event.location}</span>
              </div>

              <div className="border-hair border-t pt-3.5">
                <RsvpControl
                  eventId={event.id}
                  initial={event.rsvp ?? null}
                  capacity={event.capacity}
                  spotsTaken={event.spotsTaken}
                />
              </div>
            </div>
          </aside>

          {/* main content */}
          <div className="lg:order-1 mt-6 lg:mt-0">
            <div className="flex items-center gap-3">
              <InitialAvatar name={event.organizer} size={40} />
              <div>
                <div className="text-sm font-bold">{event.organizer}</div>
                <div className="text-faint text-xs">Organizer</div>
              </div>
            </div>

            <RichText html={event.description} className="text-muted-foreground mt-5" />

            {event.attachments.length > 0 && (
              <div className="mt-7">
                <SectionEyebrow>ATTACHMENTS</SectionEyebrow>
                <div className="space-y-2.5">
                  {event.attachments.map((a) => (
                    <AttachmentRow key={a.id} attachment={a} />
                  ))}
                </div>
              </div>
            )}

            <div className="border-hair mt-8 border-t pt-6">
              <CommentSection initial={event.comments} eventId={event.id} />
            </div>
          </div>
        </div>
    </div>
  );
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <AppShell>
      <Suspense fallback={<DetailSkeleton />}>
        <EventDetailContent id={id} />
      </Suspense>
    </AppShell>
  );
}
