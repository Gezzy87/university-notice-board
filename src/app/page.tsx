import Link from "next/link";
import { QuadLogo } from "@/components/quad-logo";

const MOBILE_WASH =
  "radial-gradient(120% 80% at 80% 0%, #E7E8FE 0%, rgba(246,247,252,0) 46%), radial-gradient(100% 70% at 0% 100%, #DCF1EE 0%, rgba(246,247,252,0) 50%)";

export default function LandingPage() {
  return (
    <main className="relative flex min-h-dvh flex-col lg:flex-row">
      {/* ------------------------------------------------------------------ */}
      {/* Copy column (mobile: full; desktop: left half)                      */}
      {/* ------------------------------------------------------------------ */}
      <div
        className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center lg:items-start lg:px-16 lg:text-left"
        style={{ backgroundImage: MOBILE_WASH }}
      >
        <div className="flex w-full max-w-md flex-col items-center lg:items-start">
          <div className="flex items-center gap-3">
            <QuadLogo size={40} />
            <span className="font-heading text-3xl font-extrabold tracking-[-0.02em]">
              Quad
            </span>
          </div>

          <h1 className="font-heading mt-8 text-[34px] font-extrabold leading-[1.1] tracking-[-0.02em] lg:text-[44px]">
            Your whole campus,
            <br />
            in one feed.
          </h1>

          <p className="text-muted-foreground mt-4 max-w-sm text-[15px] leading-relaxed">
            Official notices and campus events in a single place. Browse
            announcements, discover events, and RSVP — all from your phone.
          </p>

          <div className="mt-9 flex w-full max-w-xs flex-col gap-3 lg:max-w-sm">
            <Link
              href="/feed"
              className="bg-primary text-primary-foreground flex items-center justify-center rounded-[14px] px-6 py-[15px] text-[15px] font-bold shadow-sm transition-colors hover:bg-[var(--primary-600)]"
            >
              Browse notices
            </Link>
            <Link
              href="/login"
              className="bg-secondary text-secondary-foreground flex items-center justify-center rounded-[14px] px-6 py-[15px] text-[15px] font-bold transition-colors hover:brightness-95"
            >
              Log in / Register
            </Link>
          </div>

          <p className="text-faint mt-10 text-xs font-semibold">
            Campus Notice Board
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Brand panel (desktop only)                                          */}
      {/* ------------------------------------------------------------------ */}
      <div className="relative hidden flex-1 overflow-hidden lg:block">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 120% at 20% 0%, #4F46E5 0%, #4338CA 40%, #0E9488 100%)",
          }}
        />
        {/* diagonal hairline pattern */}
        <div
          className="absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(135deg, #fff 0 1px, transparent 1px 22px)",
          }}
        />
        {/* frosted preview card */}
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="w-full max-w-sm rounded-[22px] border border-white/25 bg-white/12 p-6 shadow-2xl backdrop-blur-md">
            <div className="flex items-center gap-2">
              <QuadLogo size={26} />
              <span className="font-heading text-lg font-bold text-white">
                Today at Quad
              </span>
            </div>
            <div className="mt-5 space-y-3">
              {[
                { t: "Mid-semester exam timetable released", meta: "Exams · Pinned" },
                { t: "Guest Lecture: AI & the Future of Work", meta: "Jul 14 · Auditorium A" },
                { t: "Photography Club Meetup", meta: "Jul 10 · Student Center" },
              ].map((item) => (
                <div
                  key={item.t}
                  className="rounded-[14px] border border-white/20 bg-white/10 p-3.5"
                >
                  <p className="font-heading text-sm font-bold leading-snug text-white">
                    {item.t}
                  </p>
                  <p className="mt-1 text-xs font-medium text-white/70">
                    {item.meta}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
