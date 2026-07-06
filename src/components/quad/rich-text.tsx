import sanitizeHtml from "sanitize-html";
import { cn } from "@/lib/utils";

// Whitelist limited to what the Tiptap editor can produce. sanitize-html is a
// pure-Node sanitizer (no jsdom / browser DOM), so it works cleanly in
// serverless environments where isomorphic-dompurify's jsdom dependency fails
// to bundle. Only these tags/attrs/schemes survive; everything else is dropped.
const SANITIZE_CONFIG: sanitizeHtml.IOptions = {
  allowedTags: [
    "p", "br", "strong", "b", "em", "i", "u", "s",
    "ul", "ol", "li", "a", "h1", "h2", "h3", "blockquote", "code", "pre",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
  },
  allowedSchemes: ["http", "https", "mailto"],
  // Drop the contents of any disallowed tag (e.g. <script>...</script>) rather
  // than leaving the inner text behind.
  disallowedTagsMode: "discard",
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
  const clean = sanitizeHtml(html, SANITIZE_CONFIG);
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
