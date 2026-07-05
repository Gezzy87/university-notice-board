"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from "@/app/actions/admin";
import { inputClass } from "./form-ui";
import { cn } from "@/lib/utils";

const PALETTE = [
  "#6573A8", "#B26079", "#4E9387", "#74935E", "#8772B5", "#B59440",
  "#2563EB", "#DC2626", "#16A34A", "#0E9488", "#9333EA", "#EA580C",
];

export type Category = { id: string; name: string; color: string; count: number };

function ColorPalette({
  value,
  onChange,
}: {
  value: string;
  onChange: (c: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {PALETTE.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          aria-label={`Color ${color}`}
          className={cn(
            "size-7 rounded-full",
            value === color && "ring-2 ring-offset-2 ring-offset-[var(--card)]",
          )}
          style={{ background: color, ["--tw-ring-color" as string]: color }}
        />
      ))}
    </div>
  );
}

export function CategoriesManager({ initial }: { initial: Category[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftColor, setDraftColor] = useState(PALETTE[0]);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(PALETTE[6]);
  const [, startTransition] = useTransition();

  function saveColor(id: string) {
    startTransition(async () => {
      const result = await updateCategory(id, draftColor);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setEditingId(null);
      toast.success("Category updated");
      router.refresh();
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const result = await deleteCategory(id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Category deleted");
      router.refresh();
    });
  }

  function add() {
    if (!newName.trim()) return toast.error("Enter a name");
    startTransition(async () => {
      const result = await createCategory(newName, newColor);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setAdding(false);
      setNewName("");
      setNewColor(PALETTE[6]);
      toast.success("Category added");
      router.refresh();
    });
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-4 lg:px-8 lg:py-7">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-[26px] font-bold tracking-[-0.01em]">
          Categories
        </h1>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="bg-teal flex items-center gap-1.5 rounded-[11px] px-3.5 py-2 text-sm font-bold text-white"
          >
            <Plus className="size-4" strokeWidth={2.4} />
            Add category
          </button>
        )}
      </div>

      {adding && (
        <div className="border-border bg-card mt-5 rounded-[18px] border p-4 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-3">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className={inputClass}
              placeholder="Category name"
              autoFocus
            />
            <button
              onClick={add}
              className="bg-primary text-primary-foreground grid size-9 shrink-0 place-items-center rounded-[11px]"
              aria-label="Save"
            >
              <Check className="size-4" strokeWidth={2.4} />
            </button>
            <button
              onClick={() => setAdding(false)}
              className="border-border text-muted-foreground grid size-9 shrink-0 place-items-center rounded-[11px] border"
              aria-label="Cancel"
            >
              <X className="size-4" strokeWidth={2.2} />
            </button>
          </div>
          <div className="mt-3">
            <ColorPalette value={newColor} onChange={setNewColor} />
          </div>
        </div>
      )}

      <div className="border-border bg-card divide-hair mt-5 divide-y overflow-hidden rounded-[18px] border shadow-[var(--shadow-card)]">
        {initial.map((c) =>
          editingId === c.id ? (
            <div key={c.id} className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2.5">
                  <span
                    className="size-5 rounded-full"
                    style={{ background: draftColor }}
                  />
                  <span className="text-sm font-semibold">{c.name}</span>
                </div>
                <div className="flex-1" />
                <button
                  onClick={() => saveColor(c.id)}
                  className="bg-primary text-primary-foreground grid size-9 shrink-0 place-items-center rounded-[11px]"
                  aria-label="Save"
                >
                  <Check className="size-4" strokeWidth={2.4} />
                </button>
              </div>
              <div className="mt-3">
                <ColorPalette value={draftColor} onChange={setDraftColor} />
              </div>
            </div>
          ) : (
            <div key={c.id} className="flex items-center gap-3 px-4 py-3.5">
              <span
                className="size-5 shrink-0 rounded-full"
                style={{ background: c.color }}
              />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold">{c.name}</div>
                <div className="text-faint text-xs">{c.count} posts</div>
              </div>
              <button
                onClick={() => {
                  setEditingId(c.id);
                  setDraftColor(c.color);
                }}
                className="text-muted-foreground hover:bg-surface-2 grid size-8 place-items-center rounded-lg"
                aria-label="Edit color"
              >
                <Pencil className="size-4" strokeWidth={1.9} />
              </button>
              <button
                onClick={() => remove(c.id)}
                className="text-danger hover:bg-danger-tint grid size-8 place-items-center rounded-lg"
                aria-label="Delete"
              >
                <Trash2 className="size-4" strokeWidth={1.9} />
              </button>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
