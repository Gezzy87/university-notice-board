"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { addComment } from "@/app/actions/engagement";
import type { Comment } from "@/lib/mock-detail";
import { InitialAvatar } from "./initial-avatar";
import { SectionEyebrow } from "./attachment-row";
import { useIsAuthenticated } from "./auth-context";
import { Pagination } from "./pagination";

const PAGE_SIZE = 5;

export function CommentSection({
  initial,
  noticeId,
  eventId,
}: {
  initial: Comment[];
  noticeId?: string;
  eventId?: string;
}) {
  const authed = useIsAuthenticated();
  const [comments, setComments] = useState(initial);
  const [text, setText] = useState("");
  const [page, setPage] = useState(1);
  const [pending, startTransition] = useTransition();

  const totalPages = Math.max(1, Math.ceil(comments.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visible = comments.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  function submit() {
    const body = text.trim();
    if (!body) return;

    startTransition(async () => {
      const result = await addComment({ noticeId, eventId, body });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setComments((prev) => [
        {
          id: result.id ?? `local-${Date.now()}`,
          author: result.author ?? "You",
          body,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      setText("");
      setPage(1); // newest comment is on the first page
      toast.success("Comment posted");
    });
  }

  return (
    <section className="mt-2">
      <SectionEyebrow>COMMENTS · {comments.length}</SectionEyebrow>

      {authed ? (
        <div className="border-border bg-surface focus-within:border-primary flex flex-col gap-2 rounded-xl border p-3 focus-within:shadow-[0_0_0_3px_var(--primary-50)]">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a comment…"
            rows={2}
            className="placeholder:text-faint w-full resize-none bg-transparent text-sm outline-none"
          />
          <div className="flex justify-end">
            <button
              onClick={submit}
              disabled={!text.trim() || pending}
              className="bg-primary text-primary-foreground rounded-[11px] px-4 py-2 text-sm font-semibold disabled:opacity-50"
            >
              {pending ? "Posting…" : "Post"}
            </button>
          </div>
        </div>
      ) : (
        <div className="border-border bg-surface-2 flex items-center justify-between gap-3 rounded-xl border p-3.5">
          <span className="text-muted-foreground text-sm">
            Log in to join the conversation.
          </span>
          <Link
            href="/login"
            className="bg-primary text-primary-foreground shrink-0 rounded-[11px] px-4 py-2 text-sm font-semibold"
          >
            Log in
          </Link>
        </div>
      )}

      <ul className="mt-4 space-y-4">
        {visible.map((c) => (
          <li key={c.id} className="flex gap-3">
            <InitialAvatar name={c.author} size={34} />
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold">{c.author}</span>
                <span className="text-faint text-xs">
                  {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                </span>
              </div>
              <p className="text-muted-foreground mt-0.5 text-sm">{c.body}</p>
            </div>
          </li>
        ))}
      </ul>

      <Pagination
        page={currentPage}
        totalPages={totalPages}
        onChange={setPage}
        className="mt-6"
      />
    </section>
  );
}
