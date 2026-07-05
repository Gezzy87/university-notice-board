import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export function BackBar({
  backHref = "/feed",
  right,
}: {
  backHref?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <Link
        href={backHref}
        aria-label="Back"
        className="bg-surface-2 border-border text-muted-foreground hover:text-foreground grid size-9 place-items-center rounded-[11px] border"
      >
        <ChevronLeft className="size-5" strokeWidth={2} />
      </Link>
      {right}
    </div>
  );
}
