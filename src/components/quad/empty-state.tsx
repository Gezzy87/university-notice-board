import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  tint = "var(--primary-50)",
  color = "var(--primary)",
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  tint?: string;
  color?: string;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <span
        className="grid size-[76px] place-items-center rounded-[20px]"
        style={{ background: tint, color }}
      >
        <Icon className="size-8" strokeWidth={1.8} />
      </span>
      <h2 className="font-heading mt-4 text-lg font-extrabold">{title}</h2>
      <p className="text-muted-foreground mt-1 max-w-xs text-sm">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
