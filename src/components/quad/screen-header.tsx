import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export function ScreenHeader({
  title,
  right,
  backHref,
}: {
  title: string;
  right?: React.ReactNode;
  backHref?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        {backHref && (
          <Link
            href={backHref}
            aria-label="Back"
            className="bg-surface-2 border-border text-muted-foreground hover:text-foreground grid size-9 place-items-center rounded-[11px] border"
          >
            <ChevronLeft className="size-5" strokeWidth={2} />
          </Link>
        )}
        <h1 className="font-heading text-[26px] font-bold tracking-[-0.01em]">
          {title}
        </h1>
      </div>
      {right}
    </div>
  );
}
