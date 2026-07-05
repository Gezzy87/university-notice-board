"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

export function LogoutRow() {
  const router = useRouter();

  async function logout() {
    await authClient.signOut();
    toast.success("Logged out");
    router.push("/");
    router.refresh();
  }

  return (
    <button
      onClick={logout}
      className="border-border bg-card text-danger mt-4 flex w-full items-center gap-3 rounded-[18px] border px-4 py-3.5 text-left shadow-[var(--shadow-card)]"
    >
      <span className="bg-danger-tint text-danger grid size-9 shrink-0 place-items-center rounded-[10px]">
        <LogOut className="size-[18px]" strokeWidth={1.8} />
      </span>
      <span className="text-sm font-semibold">Log out</span>
    </button>
  );
}
