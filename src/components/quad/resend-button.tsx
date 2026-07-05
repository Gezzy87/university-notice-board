"use client";

import { toast } from "sonner";

export function ResendButton() {
  return (
    <button
      onClick={() => toast.success("Verification email resent")}
      className="text-primary text-sm font-semibold"
    >
      Resend email
    </button>
  );
}
