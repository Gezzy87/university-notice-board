import { cn } from "@/lib/utils";

/**
 * Quad logo — a 2×2 rounded-square grid (indigo / teal / teal / indigo),
 * rendered purely in CSS. `size` is the outer square in px.
 */
export function QuadLogo({
  size = 32,
  className,
}: {
  size?: number;
  className?: string;
}) {
  const gap = Math.max(2, Math.round(size * 0.12));
  const cell = (size - gap) / 2;
  const radius = Math.round(cell * 0.34);
  const colors = ["#4F46E5", "#0E9488", "#0E9488", "#4F46E5"];

  return (
    <div
      className={cn("grid shrink-0", className)}
      style={{
        width: size,
        height: size,
        gridTemplateColumns: `repeat(2, ${cell}px)`,
        gap,
      }}
      aria-hidden
    >
      {colors.map((c, i) => (
        <span
          key={i}
          style={{ background: c, borderRadius: radius, width: cell, height: cell }}
        />
      ))}
    </div>
  );
}
