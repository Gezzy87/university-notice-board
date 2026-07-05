"use client";

import { Upload } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { categoryDot } from "@/lib/categories";
import { cn } from "@/lib/utils";

export const inputClass =
  "w-full rounded-xl border border-border bg-surface px-3.5 py-3 text-sm outline-none placeholder:text-faint focus:border-primary focus:shadow-[0_0_0_3px_var(--primary-50)]";

export function FormField({
  label,
  optional,
  children,
}: {
  label: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-sm font-semibold">
        {label}
        {optional && <span className="text-faint font-medium"> (optional)</span>}
      </label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

export function CategorySelect({
  value,
  onChange,
  categories,
}: {
  value: string;
  onChange: (v: string) => void;
  categories: string[];
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v ?? "")}>
      <SelectTrigger className={cn(inputClass, "h-auto py-3")}>
        <SelectValue placeholder="Select a category" />
      </SelectTrigger>
      <SelectContent>
        {categories.map((c) => (
          <SelectItem key={c} value={c}>
            <span className="flex items-center gap-2">
              <span
                className="size-2 rounded-full"
                style={{ background: categoryDot(c) }}
              />
              {c}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function Dropzone() {
  return (
    <div className="border-border text-muted-foreground flex flex-col items-center rounded-xl border border-dashed p-6 text-center">
      <span className="bg-surface-2 text-muted-foreground mb-2 grid size-10 place-items-center rounded-[10px]">
        <Upload className="size-5" strokeWidth={1.8} />
      </span>
      <p className="text-sm">
        Drag &amp; drop files, or{" "}
        <span className="text-primary font-semibold">browse</span>
      </p>
      <p className="text-faint mt-0.5 text-xs">PDF, PNG or JPG · up to 10 MB</p>
    </div>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="bg-surface-2 border-border inline-flex rounded-[13px] border p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-[9px] px-4 py-2 text-sm font-semibold transition-colors",
            value === o.value
              ? "bg-surface text-foreground shadow-sm"
              : "text-muted-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
