"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import {
  Bold,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Underline as UnderlineIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

function ToolbarButton({
  onClick,
  active,
  children,
  label,
}: {
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "grid size-8 place-items-center rounded-lg transition-colors",
        active
          ? "bg-primary-50 text-primary"
          : "text-muted-foreground hover:bg-surface-2",
      )}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const setLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", prev ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div className="border-hair flex items-center gap-0.5 border-b p-1.5">
      <ToolbarButton
        label="Bold"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="size-4" strokeWidth={2.2} />
      </ToolbarButton>
      <ToolbarButton
        label="Italic"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="size-4" strokeWidth={2.2} />
      </ToolbarButton>
      <ToolbarButton
        label="Underline"
        active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <UnderlineIcon className="size-4" strokeWidth={2.2} />
      </ToolbarButton>
      <div className="bg-hair mx-1 h-5 w-px" />
      <ToolbarButton
        label="Bullet list"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="size-4" strokeWidth={2} />
      </ToolbarButton>
      <ToolbarButton
        label="Numbered list"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="size-4" strokeWidth={2} />
      </ToolbarButton>
      <ToolbarButton label="Link" active={editor.isActive("link")} onClick={setLink}>
        <LinkIcon className="size-4" strokeWidth={2} />
      </ToolbarButton>
    </div>
  );
}

export function RichTextEditor({
  value = "",
  placeholder = "Write here…",
  onChange,
}: {
  value?: string;
  placeholder?: string;
  onChange?: (html: string) => void;
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
        protocols: ["http", "https", "mailto"],
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: cn(
          "min-h-[160px] px-3.5 py-3 text-sm leading-7 outline-none",
          "[&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5",
          "[&_a]:text-primary [&_a]:underline",
        ),
        "data-placeholder": placeholder,
      },
    },
    onUpdate: ({ editor }) => onChange?.(editor.getHTML()),
  });

  return (
    <div className="border-border bg-surface focus-within:border-primary rounded-xl border focus-within:shadow-[0_0_0_3px_var(--primary-50)]">
      {editor && <Toolbar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
}
