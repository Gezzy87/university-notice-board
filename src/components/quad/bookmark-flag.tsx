import { cn } from "@/lib/utils";

/** The Quad pennant/flag bookmark. filled = saved, stroked = not. */
export function BookmarkFlag({
  filled = false,
  size = 18,
  className,
}: {
  filled?: boolean;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinejoin="round"
      className={cn(className)}
      aria-hidden
    >
      <path d="M6 4h12v16l-6-4-6 4z" />
    </svg>
  );
}
