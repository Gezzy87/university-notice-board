import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import type { NoticeItem } from "@/lib/mock";
import { CategoryChip } from "./category-chip";
import { BookmarkButton } from "./bookmark-button";
import { InitialAvatar } from "./initial-avatar";
import { highlight } from "@/lib/highlight";
import { stripHtml } from "@/lib/html";

export function NoticeCard({
  notice,
  query,
}: {
  notice: NoticeItem;
  query?: string;
}) {
  return (
    <article className="border-border bg-card flex h-full flex-col rounded-[18px] border p-[17px] shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <CategoryChip category={notice.category} size="sm" />
          {notice.pinned && (
            <span className="text-warning bg-warning-tint inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold">
              📌 Pinned
            </span>
          )}
        </div>
        <BookmarkButton noticeId={notice.id} initialSaved={notice.bookmarked} />
      </div>

      <Link href={`/notices/${notice.id}`} className="group block">
        <h3 className="font-heading mt-[11px] text-base font-bold leading-snug group-hover:underline">
          {highlight(notice.title, query)}
        </h3>
      </Link>
      {notice.body && (
        <p className="text-muted-foreground mt-1 line-clamp-1 text-sm">
          {stripHtml(notice.body)}
        </p>
      )}

      <div className="border-hair mt-auto flex items-center gap-2 border-t pt-3">
        <InitialAvatar name={notice.author} size={22} />
        <span className="text-muted-foreground text-xs font-medium">
          {notice.author} ·{" "}
          {formatDistanceToNow(new Date(notice.publishedAt), { addSuffix: true })}
        </span>
      </div>
    </article>
  );
}
