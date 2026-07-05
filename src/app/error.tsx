"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { QuadLogo } from "@/components/quad-logo";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="grid min-h-dvh place-items-center px-6 text-center">
      <div className="flex flex-col items-center">
        <QuadLogo size={34} />
        <span className="bg-danger-tint text-danger mt-6 grid size-16 place-items-center rounded-[20px]">
          <AlertTriangle className="size-7" strokeWidth={1.8} />
        </span>
        <h1 className="font-heading mt-4 text-2xl font-extrabold tracking-[-0.01em]">
          Something went wrong
        </h1>
        <p className="text-muted-foreground mt-2 max-w-xs text-sm">
          We hit a snag loading this page. This is often a brief connection
          hiccup — try again.
        </p>
        <div className="mt-6 flex gap-3">
          <button
            onClick={reset}
            className="bg-primary text-primary-foreground rounded-[13px] px-5 py-2.5 text-sm font-bold"
          >
            Try again
          </button>
          <Link
            href="/feed"
            className="bg-secondary text-secondary-foreground rounded-[13px] px-5 py-2.5 text-sm font-bold"
          >
            Back to feed
          </Link>
        </div>
      </div>
    </main>
  );
}
