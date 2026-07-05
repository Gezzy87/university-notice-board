"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BackBar } from "@/components/quad/back-bar";
import { Toggle } from "@/components/quad/toggle";
import { RichTextEditor } from "./rich-text-editor";
import {
  CategorySelect,
  Dropzone,
  FormField,
  Segmented,
  inputClass,
} from "./form-ui";
import { ImageUpload } from "./image-upload";
import { createNotice } from "@/app/actions/admin";

export function NoticeForm({ categories }: { categories: string[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [body, setBody] = useState("");
  const [pinned, setPinned] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [publishMode, setPublishMode] = useState<"now" | "schedule">("now");
  const [scheduledAt, setScheduledAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [pending, startTransition] = useTransition();

  function publish() {
    if (!title.trim()) return toast.error("Add a title");
    if (!category) return toast.error("Pick a category");
    if (publishMode === "schedule" && !scheduledAt)
      return toast.error("Pick a publish date");

    startTransition(async () => {
      const result = await createNotice({
        title,
        body,
        category,
        pinned,
        imageUrl,
        publishedAt:
          publishMode === "schedule" && scheduledAt
            ? new Date(scheduledAt).toISOString()
            : null,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(publishMode === "now" ? "Notice published" : "Notice scheduled");
      router.push(`/notices/${result.id}`);
      router.refresh();
    });
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-4 lg:px-8 lg:py-7">
      <BackBar backHref="/admin" />

      <div className="mt-4 flex items-center justify-between gap-3">
        <h1 className="font-heading text-[24px] font-bold tracking-[-0.01em]">
          New notice
        </h1>
        <button
          onClick={publish}
          disabled={pending}
          className="bg-primary text-primary-foreground rounded-[11px] px-4 py-2 text-sm font-bold disabled:opacity-60"
        >
          {pending ? "Publishing…" : "Publish"}
        </button>
      </div>

      <div className="mt-6 space-y-5">
        <FormField label="Title">
          <input
            className={inputClass}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Mid-semester exam timetable released"
          />
        </FormField>

        <FormField label="Cover image" optional>
          <ImageUpload value={imageUrl} onChange={setImageUrl} />
        </FormField>

        <FormField label="Body">
          <RichTextEditor placeholder="Write the notice…" onChange={setBody} />
        </FormField>

        <FormField label="Category">
          <CategorySelect
            value={category}
            onChange={setCategory}
            categories={categories}
          />
        </FormField>

        <div className="border-border bg-card flex items-center justify-between rounded-xl border px-4 py-3">
          <div>
            <div className="text-sm font-semibold">Pin to top</div>
            <div className="text-faint text-xs">
              Keep this notice above the feed
            </div>
          </div>
          <Toggle onChange={setPinned} />
        </div>

        <FormField label="Publish">
          <div className="flex flex-wrap items-center gap-3">
            <Segmented
              value={publishMode}
              onChange={setPublishMode}
              options={[
                { value: "now", label: "Now" },
                { value: "schedule", label: "Schedule" },
              ]}
            />
            {publishMode === "schedule" && (
              <input
                type="datetime-local"
                className={inputClass + " max-w-[240px]"}
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
              />
            )}
          </div>
        </FormField>

        <FormField label="Expiry" optional>
          <input
            type="date"
            className={inputClass + " max-w-[240px]"}
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
          />
        </FormField>

        <FormField label="Attachments" optional>
          <Dropzone />
        </FormField>
      </div>
    </div>
  );
}
