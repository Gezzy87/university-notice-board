import { Suspense } from "react";
import { notFound } from "next/navigation";
import { format, formatDistanceToNow } from "date-fns";
import { AppShell } from "@/components/quad/app-shell";
import { BackBar } from "@/components/quad/back-bar";
import { BookmarkButton } from "@/components/quad/bookmark-button";
import { CategoryChip } from "@/components/quad/category-chip";
import { InitialAvatar } from "@/components/quad/initial-avatar";
import { AttachmentRow, SectionEyebrow } from "@/components/quad/attachment-row";
import { CommentSection } from "@/components/quad/comment-section";
import { RichText } from "@/components/quad/rich-text";
import { DetailSkeleton } from "@/components/quad/skeletons";
import { getNoticeById } from "@/lib/queries";
import { getCurrentUser } from "@/lib/session";

async function NoticeDetailContent({ id }: { id: string }) {
  const user = await getCurrentUser();
  const notice = await getNoticeById(id, user?.id);
  if (!notice) notFound();

  return (
    <div className="mx-auto w-full max-w-[680px] px-4 py-4 lg:py-7">
      <BackBar
        right={
          <BookmarkButton
            size={20}
            noticeId={notice.id}
            initialSaved={notice.bookmarked}
          />
        }
      />

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {notice.pinned && (
          <span className="text-warning bg-warning-tint inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold">
            📌 Pinned
          </span>
        )}
        <CategoryChip category={notice.category} />
      </div>

      <h1 className="font-heading mt-4 text-[30px] font-extrabold leading-[1.15] tracking-[-0.02em]">
        {notice.title}
      </h1>

      <div className="mt-5 flex items-center gap-3">
        <InitialAvatar name={notice.author} size={40} />
        <div>
          <div className="text-sm font-bold">{notice.author}</div>
          <div className="text-faint text-xs">
            posted{" "}
            {formatDistanceToNow(new Date(notice.publishedAt), {
              addSuffix: true,
            })}
            {notice.expiresAt &&
              ` · expires ${format(new Date(notice.expiresAt), "MMM d")}`}
          </div>
        </div>
      </div>

      <RichText html={notice.body} className="text-foreground/90 mt-6" />

      {notice.attachments.length > 0 && (
        <div className="mt-8">
          <SectionEyebrow>ATTACHMENTS</SectionEyebrow>
          <div className="space-y-2.5">
            {notice.attachments.map((a) => (
              <AttachmentRow key={a.id} attachment={a} />
            ))}
          </div>
        </div>
      )}

      <div className="border-hair mt-8 border-t pt-6">
        <CommentSection initial={notice.comments} noticeId={notice.id} />
      </div>
    </div>
  );
}

export default async function NoticeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <AppShell>
      <Suspense fallback={<DetailSkeleton />}>
        <NoticeDetailContent id={id} />
      </Suspense>
    </AppShell>
  );
}
