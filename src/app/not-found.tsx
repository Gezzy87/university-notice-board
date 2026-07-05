import Link from "next/link";
import { QuadLogo } from "@/components/quad-logo";

const WASH =
  "radial-gradient(120% 70% at 80% 0%, #E7E8FE 0%, rgba(246,247,252,0) 46%), radial-gradient(100% 60% at 0% 100%, #DCF1EE 0%, rgba(246,247,252,0) 50%)";

export default function NotFound() {
  return (
    <main
      className="grid min-h-dvh place-items-center px-6 text-center"
      style={{ backgroundImage: WASH }}
    >
      <div className="flex flex-col items-center">
        <QuadLogo size={34} />
        <div
          className="font-heading mt-6 text-[80px] font-extrabold leading-none tracking-[-0.04em]"
          style={{
            background: "linear-gradient(135deg, #4F46E5, #0E9488)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          404
        </div>
        <h1 className="font-heading mt-4 text-2xl font-extrabold tracking-[-0.01em]">
          This page took a gap year
        </h1>
        <p className="text-muted-foreground mt-2 max-w-xs text-sm">
          The page you&apos;re looking for doesn&apos;t exist or may have been
          moved.
        </p>
        <div className="mt-6 flex gap-3">
          <Link
            href="/feed"
            className="bg-primary text-primary-foreground rounded-[13px] px-5 py-2.5 text-sm font-bold"
          >
            Back to feed
          </Link>
          <Link
            href="/search"
            className="bg-secondary text-secondary-foreground rounded-[13px] px-5 py-2.5 text-sm font-bold"
          >
            Search
          </Link>
        </div>
      </div>
    </main>
  );
}
