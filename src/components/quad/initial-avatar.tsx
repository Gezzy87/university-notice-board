import { cn } from "@/lib/utils";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Initials on the Quad indigo→teal gradient. */
export function InitialAvatar({
  name,
  size = 36,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center font-bold text-white",
        className,
      )}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        fontSize: Math.round(size * 0.36),
        background: "linear-gradient(135deg, #4F46E5, #0E9488)",
      }}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}
