import DOMPurify from "isomorphic-dompurify";
import { cn } from "@/lib/utils";

// Whitelist limited to what the Tiptap editor can produce. DOMPurify also
// strips dangerous URI schemes (e.g. javascript:) from href by default.
const SANITIZE_CONFIG = {
  ALLOWED_TAGS: [
    "p", "br", "strong", "b", "em", "i", "u", "s",
    "ul", "ol", "li", "a", "h1", "h2", "h3", "blockquote", "code", "pre",
  ],
  ALLOWED_ATTR: ["href", "target", "rel"],
  ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|\/|#)/i,
};

/**
 * Renders admin-authored HTML (from the Tiptap editor) after sanitizing it.
 * Even though only admins author this content, we sanitize as defense in depth.
 */
export function RichText({
  html,
  className,
}: {
  html: string;
  className?: string;
}) {
  const clean = DOMPurify.sanitize(html, SANITIZE_CONFIG);
  return (
    <div
      className={cn(
        "text-[15px] leading-7",
        "[&_p]:my-3 [&_p:first-child]:mt-0",
        "[&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5",
        "[&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-5",
        "[&_strong]:font-semibold [&_a]:text-primary [&_a]:underline",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
