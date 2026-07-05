"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BackBar } from "@/components/quad/back-bar";
import { RichTextEditor } from "./rich-text-editor";
import { CategorySelect, Dropzone, FormField, inputClass } from "./form-ui";
import { ImageUpload } from "./image-upload";
import { createEvent } from "@/app/actions/admin";

export function EventForm({ categories }: { categories: string[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [capacity, setCapacity] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function publish() {
    if (!title.trim()) return toast.error("Add a title");
    if (!category) return toast.error("Pick a category");
    if (!location.trim()) return toast.error("Add a location");
    if (!startsAt || !endsAt) return toast.error("Set start and end times");

    startTransition(async () => {
      const result = await createEvent({
        title,
        description,
        category,
        location,
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
        capacity: capacity ? Number(capacity) : null,
        imageUrl,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Event published");
      router.push(`/events/${result.id}`);
      router.refresh();
    });
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-4 lg:px-8 lg:py-7">
      <BackBar backHref="/admin" />

      <div className="mt-4 flex items-center justify-between gap-3">
        <h1 className="font-heading text-[24px] font-bold tracking-[-0.01em]">
          New event
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
            placeholder="e.g. Guest Lecture: AI & the Future of Work"
          />
        </FormField>

        <FormField label="Cover image" optional>
          <ImageUpload value={imageUrl} onChange={setImageUrl} />
        </FormField>

        <FormField label="Description">
          <RichTextEditor
            placeholder="Describe the event…"
            onChange={setDescription}
          />
        </FormField>

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Starts">
            <input
              type="datetime-local"
              className={inputClass}
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
            />
          </FormField>
          <FormField label="Ends">
            <input
              type="datetime-local"
              className={inputClass}
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
            />
          </FormField>
        </div>

        <FormField label="Location">
          <input
            className={inputClass}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Auditorium B, Science Block"
          />
        </FormField>

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Category">
            <CategorySelect
              value={category}
              onChange={setCategory}
              categories={categories}
            />
          </FormField>
          <FormField label="Capacity" optional>
            <input
              type="number"
              min={1}
              className={inputClass}
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder="e.g. 120"
            />
          </FormField>
        </div>

        <FormField label="Attachments" optional>
          <Dropzone />
        </FormField>
      </div>
    </div>
  );
}
