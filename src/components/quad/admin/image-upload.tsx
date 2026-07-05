"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { uploadImage } from "@/app/actions/admin";

export function ImageUpload({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB");
      return;
    }
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await uploadImage(fd);
    setUploading(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    onChange(res.url);
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
      {value ? (
        <div className="border-border relative overflow-hidden rounded-xl border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Cover" className="h-40 w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label="Remove image"
            className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-black/50 text-white hover:bg-black/70"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="border-border text-muted-foreground hover:bg-surface-2 flex h-40 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed transition-colors disabled:opacity-60"
        >
          {uploading ? (
            <>
              <Loader2 className="size-6 animate-spin" />
              <span className="text-sm">Uploading…</span>
            </>
          ) : (
            <>
              <ImagePlus className="size-6" strokeWidth={1.8} />
              <span className="text-sm font-medium">Add a cover image</span>
              <span className="text-faint text-xs">
                PNG, JPG, WEBP · up to 5 MB
              </span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
