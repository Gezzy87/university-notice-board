import { FileText } from "lucide-react";
import type { Attachment } from "@/lib/mock-detail";

export function AttachmentRow({ attachment }: { attachment: Attachment }) {
  return (
    <div className="border-border bg-surface flex items-center gap-3 rounded-[13px] border p-3">
      <span className="bg-surface-2 text-muted-foreground grid size-10 shrink-0 place-items-center rounded-[10px]">
        <FileText className="size-5" strokeWidth={1.7} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold">{attachment.filename}</div>
        <div className="text-faint text-xs font-medium">{attachment.size}</div>
      </div>
      <a
        href={attachment.url}
        className="bg-primary-50 text-primary rounded-[9px] px-3.5 py-2 text-[13px] font-semibold"
      >
        Download
      </a>
    </div>
  );
}

export function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-faint mb-2.5 text-[13px] font-bold tracking-[0.06em]">
      {children}
    </div>
  );
}
