import Link from "next/link";
import { QuadLogo } from "@/components/quad-logo";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main className="flex min-h-dvh">
      {/* ---------------------------------------------------------------- */}
      {/* Brand panel — left, desktop only                                  */}
      {/* ---------------------------------------------------------------- */}
      <aside className="relative hidden w-1/2 overflow-hidden lg:block">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(145deg, #4F46E5 0%, #4338CA 46%, #0E9488 100%)",
          }}
        />
        {/* soft glow orbs for depth */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(55% 45% at 18% 18%, rgba(255,255,255,0.28), transparent 60%), radial-gradient(50% 50% at 92% 82%, rgba(14,148,136,0.55), transparent 60%)",
          }}
        />
        {/* diagonal hairline texture */}
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(135deg, #fff 0 1px, transparent 1px 22px)",
          }}
        />

        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <Link href="/" className="flex items-center gap-2.5">
            <QuadLogo size={30} />
            <span className="font-heading text-2xl font-extrabold tracking-[-0.02em]">
              Quad
            </span>
          </Link>

          <div>
            <h2 className="font-heading text-[34px] font-extrabold leading-[1.12] tracking-[-0.02em]">
              Your whole campus,
              <br />
              in one feed.
            </h2>
            <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-white/75">
              Official notices and every campus event, together in one place —
              so you never miss what matters.
            </p>
          </div>

          <figure className="max-w-md rounded-[18px] border border-white/20 bg-white/10 p-5 backdrop-blur-md">
            <blockquote className="text-[15px] leading-relaxed text-white/90">
              &ldquo;I haven&apos;t missed a single event since I started using
              Quad. It&apos;s the first thing I check every morning.&rdquo;
            </blockquote>
            <figcaption className="mt-3.5 flex items-center gap-2.5">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white/20 text-xs font-bold">
                MK
              </span>
              <div className="text-sm leading-tight">
                <div className="font-semibold">Maya Kapoor</div>
                <div className="text-xs text-white/60">
                  Third-year, Computer Science
                </div>
              </div>
            </figcaption>
          </figure>
        </div>
      </aside>

      {/* ---------------------------------------------------------------- */}
      {/* Form panel — right (full width on mobile)                         */}
      {/* ---------------------------------------------------------------- */}
      <section className="flex flex-1 flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm">
          {/* mobile-only logo */}
          <Link
            href="/"
            className="flex items-center justify-center gap-2.5 lg:hidden"
          >
            <QuadLogo size={28} />
            <span className="font-heading text-2xl font-extrabold tracking-[-0.02em]">
              Quad
            </span>
          </Link>

          <div className="mt-8 text-center lg:mt-0 lg:text-left">
            <h1 className="font-heading text-[28px] font-extrabold tracking-[-0.01em]">
              {title}
            </h1>
            {subtitle && (
              <p className="text-muted-foreground mt-1.5 text-sm">{subtitle}</p>
            )}
          </div>

          <div className="mt-7">{children}</div>

          {footer && (
            <p className="text-muted-foreground mt-6 text-center text-sm">
              {footer}
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
