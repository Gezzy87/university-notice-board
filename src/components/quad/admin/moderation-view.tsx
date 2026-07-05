"use client";

import { useState, useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteComment } from "@/app/actions/engagement";
import { InitialAvatar } from "@/components/quad/initial-avatar";

export type ModComment = {
  id: string;
  author: string;
  body: string;
  createdAt: string;
  on: string;
};

export function ModerationView({ comments }: { comments: ModComment[] }) {
  const [list, setList] = useState(comments);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function remove(id: string) {
    setPendingId(id);
    startTransition(async () => {
      const result = await deleteComment(id);
      setPendingId(null);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setList((l) => l.filter((c) => c.id !== id));
      toast.success("Comment removed");
    });
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-4 lg:px-8 lg:py-7">
      <h1 className="font-heading text-[26px] font-bold tracking-[-0.01em]">
        Moderation
      </h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Recent comments across all notices and events.
      </p>

      {list.length === 0 ? (
        <p className="text-muted-foreground mt-10 text-center text-sm">
          No comments to review — all clear.
        </p>
      ) : (
        <div className="mt-5 space-y-3">
          {list.map((c) => (
            <div
              key={c.id}
              className="border-border bg-card rounded-[18px] border p-4 shadow-[var(--shadow-card)]"
            >
              <div className="flex items-center gap-2.5">
                <InitialAvatar name={c.author} size={32} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">{c.author}</div>
                  <div className="text-faint truncate text-xs">
                    on “{c.on}” ·{" "}
                    {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                  </div>
                </div>
                <button
                  onClick={() => remove(c.id)}
                  disabled={pendingId === c.id}
                  aria-label="Delete comment"
                  className="text-danger hover:bg-danger-tint grid size-9 place-items-center rounded-lg transition-colors disabled:opacity-50"
                >
                  <Trash2 className="size-[18px]" strokeWidth={1.8} />
                </button>
              </div>
              <p className="bg-surface-2 text-muted-foreground mt-3 rounded-[12px] px-3 py-2.5 text-sm">
                {c.body}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
