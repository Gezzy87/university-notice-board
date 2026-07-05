"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { AuthShell } from "@/components/quad/auth-shell";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Enter your email and password");
      return;
    }
    setLoading(true);
    const { error } = await authClient.signIn.email({ email, password });
    if (error) {
      setLoading(false);
      toast.error(error.message ?? "Couldn't log in");
      return;
    }
    router.push("/feed");
    router.refresh();
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to RSVP, save, and comment."
      footer={
        <>
          New to Quad?{" "}
          <Link href="/register" className="text-primary font-semibold">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-semibold">University email</label>
          <div className="focus-within:border-primary border-border bg-surface mt-1.5 rounded-xl border px-3.5 py-3 focus-within:shadow-[0_0_0_3px_var(--primary-50)]">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@university.edu"
              className="placeholder:text-faint w-full bg-transparent text-sm outline-none"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold">Password</label>
            <Link href="/login" className="text-primary text-xs font-semibold">
              Forgot?
            </Link>
          </div>
          <div className="focus-within:border-primary border-border bg-surface mt-1.5 flex items-center gap-2 rounded-xl border px-3.5 py-3 focus-within:shadow-[0_0_0_3px_var(--primary-50)]">
            <input
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="placeholder:text-faint w-full bg-transparent text-sm outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="text-faint hover:text-muted-foreground"
              aria-label={showPw ? "Hide password" : "Show password"}
            >
              {showPw ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-primary text-primary-foreground hover:bg-[var(--primary-600)] mt-2 w-full rounded-[13px] py-3 text-sm font-bold transition-colors disabled:opacity-60"
        >
          {loading ? "Logging in…" : "Log in"}
        </button>
      </form>
    </AuthShell>
  );
}
