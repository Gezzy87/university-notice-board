import Link from "next/link";
import { MailCheck } from "lucide-react";
import { AuthShell } from "@/components/quad/auth-shell";
import { ResendButton } from "@/components/quad/resend-button";

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <AuthShell title="Check your inbox">
      <div className="flex flex-col items-center text-center">
        <span className="bg-primary-50 text-primary grid size-[76px] place-items-center rounded-[20px]">
          <MailCheck className="size-8" strokeWidth={1.8} />
        </span>
        <p className="text-muted-foreground mt-4 text-sm">
          We sent a verification link to
          <br />
          <span className="text-foreground font-semibold">
            {email ?? "your email"}
          </span>
          . Click it to activate your account.
        </p>

        <a
          href="mailto:"
          className="bg-primary text-primary-foreground hover:bg-[var(--primary-600)] mt-6 w-full rounded-[13px] py-3 text-center text-sm font-bold transition-colors"
        >
          Open email app
        </a>

        <div className="text-muted-foreground mt-4 text-sm">
          Didn&apos;t get it? <ResendButton />
        </div>
      </div>
    </AuthShell>
  );
}
