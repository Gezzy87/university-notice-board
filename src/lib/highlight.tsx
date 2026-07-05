import { Fragment, type ReactNode } from "react";

/** Wrap occurrences of `q` in `text` with a <mark> highlight. */
export function highlight(text: string, q?: string): ReactNode {
  const query = q?.trim();
  if (!query) return text;
  const lower = text.toLowerCase();
  const needle = query.toLowerCase();
  const out: ReactNode[] = [];
  let i = 0;
  let key = 0;
  while (i < text.length) {
    const idx = lower.indexOf(needle, i);
    if (idx === -1) {
      out.push(<Fragment key={key++}>{text.slice(i)}</Fragment>);
      break;
    }
    if (idx > i) out.push(<Fragment key={key++}>{text.slice(i, idx)}</Fragment>);
    out.push(
      <mark key={key++} className="rounded bg-[#FFF1B8] text-inherit dark:bg-[#5a4a12] dark:text-inherit">
        {text.slice(idx, idx + needle.length)}
      </mark>,
    );
    i = idx + needle.length;
  }
  return <>{out}</>;
}
