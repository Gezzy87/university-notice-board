"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { AuthShell } from "@/components/quad/auth-shell";
import { authClient } from "@/lib/auth-client";
import { isUniversityEmail, passwordStrength } from "@/lib/password";
import { cn } from "@/lib/utils";

const STRENGTH_COLORS = ["", "#DC2626", "#C2740B", "#16A34A", "#16A34A"];

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const emailInvalid = emailTouched && email !== "" && !isUniversityEmail(email);
  const strength = passwordStrength(password);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return toast.error("Enter your name");
    if (!isUniversityEmail(email)) {
      setEmailTouched(true);
      return toast.error("Use your university email address");
    }
    if (strength.score < 2) return toast.error("Choose a stronger password");
    setLoading(true);
    const { error } = await authClient.signUp.email({ email, password, name });
    if (error) {
      setLoading(false);
      toast.error(error.message ?? "Couldn't create account");
      return;
    }
    // Verification is off during development, so the user is signed in already.
    toast.success("Welcome to Quad!");
    router.push("/feed");
    router.refresh();
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Sign up with your university email."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-semibold">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-semibold">Full name</label>
          <div className="focus-within:border-primary border-border bg-surface mt-1.5 rounded-xl border px-3.5 py-3 focus-within:shadow-[0_0_0_3px_var(--primary-50)]">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alex Rivera"
              className="placeholder:text-faint w-full bg-transparent text-sm outline-none"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold">University email</label>
          <div
            className={cn(
              "mt-1.5 rounded-xl border bg-surface px-3.5 py-3 focus-within:shadow-[0_0_0_3px_var(--primary-50)]",
              emailInvalid
                ? "border-danger focus-within:border-danger"
                : "border-border focus-within:border-primary",
            )}
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setEmailTouched(true)}
              placeholder="you@university.edu"
              className="placeholder:text-faint w-full bg-transparent text-sm outline-none"
            />
          </div>
          <p
            className={cn(
              "mt-1.5 text-xs",
              emailInvalid ? "text-danger font-medium" : "text-faint",
            )}
          >
            Must be a @university.edu address
          </p>
        </div>

        <div>
          <label className="text-sm font-semibold">Password</label>
          <div className="focus-within:border-primary border-border bg-surface mt-1.5 flex items-center gap-2 rounded-xl border px-3.5 py-3 focus-within:shadow-[0_0_0_3px_var(--primary-50)]">
            <input
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
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
          {password && (
            <div className="mt-2">
              <div className="flex gap-1.5">
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className="h-1.5 flex-1 rounded-full"
                    style={{
                      background:
                        i < strength.score
                          ? STRENGTH_COLORS[strength.score]
                          : "var(--surface-2)",
                    }}
                  />
                ))}
              </div>
              <p
                className="mt-1 text-xs font-medium"
                style={{ color: STRENGTH_COLORS[strength.score] || "var(--faint)" }}
              >
                {strength.label}
              </p>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-primary text-primary-foreground hover:bg-[var(--primary-600)] mt-2 w-full rounded-[13px] py-3 text-sm font-bold transition-colors disabled:opacity-60"
        >
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>
    </AuthShell>
  );
}
