import { categoryDot } from "@/lib/categories";
import { cn } from "@/lib/utils";

/** Monotone pill with a colored category dot. */
export function CategoryChip({
  category,
  size = "md",
  className,
}: {
  category: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const sm = size === "sm";
  return (
    <span
      className={cn(
        "border-border bg-surface-2 text-muted-foreground inline-flex items-center rounded-full border font-semibold",
        sm ? "gap-1.5 px-2.5 py-1 text-xs" : "gap-[7px] px-[13px] py-1.5 text-[13px]",
        className,
      )}
    >
      <span
        className="rounded-full"
        style={{
          width: sm ? 7 : 8,
          height: sm ? 7 : 8,
          background: categoryDot(category),
        }}
      />
      {category}
    </span>
  );
}
