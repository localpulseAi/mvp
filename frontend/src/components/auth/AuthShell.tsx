import Link from "next/link";
import { CalendarDays, Eye, MessageSquareText } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

interface AuthShellProps {
  children: React.ReactNode;
}

const valuePoints = [
  {
    icon: CalendarDays,
    title: "A weekly plan you can manage",
    body: "One brief each week with a small set of priorities sized to your time and budget.",
  },
  {
    icon: MessageSquareText,
    title: "Reasoning you can argue with",
    body: "Every suggestion explains why it matters, so you can weigh it against what you know.",
  },
  {
    icon: Eye,
    title: "Results worth watching",
    body: "Each move names the signal to track, from redemptions to repeat visits.",
  },
];

function Spark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        fill="currentColor"
        d="M12 0c.5 6.2 5.8 11.5 12 12-6.2.5-11.5 5.8-12 12-.5-6.2-5.8-11.5-12-12C6.2 11.5 11.5 6.2 12 0Z"
      />
    </svg>
  );
}

function BrandPanel() {
  return (
    <aside className="relative hidden overflow-hidden bg-ink lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-brand-600/45 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-brand-800/50 blur-3xl"
      />

      <Link href="/" aria-label="Agenzy home" className="relative w-fit">
        <Logo variant="reversed" height={40} />
      </Link>

      <div className="relative max-w-md">
        <Spark className="mb-6 h-8 w-8 animate-twinkle text-lime-300 motion-reduce:animate-none" />
        <h2 className="font-display text-4xl font-semibold leading-[44px] text-white">
          Clear thinking.
          <br />
          <span className="font-fun text-lime-300">Bright possibilities.</span>
        </h2>
        <p className="mt-4 text-base leading-6 text-white/70">
          An AI marketing strategist for independent local businesses. Know what to do
          next, why it matters, and what to watch.
        </p>

        <ul className="mt-10 space-y-6">
          {valuePoints.map((p) => (
            <li key={p.title} className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-white/10 ring-1 ring-white/15">
                <p.icon className="h-5 w-5 text-lime-300" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{p.title}</p>
                <p className="mt-1 text-sm leading-5 text-white/60">{p.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <p className="relative text-xs text-white/40">
        Prototype preview. Pilot scope and launch timing are still being validated.
      </p>
    </aside>
  );
}

export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="grid min-h-screen bg-canvas lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="flex min-h-screen flex-col">
        <header className="flex h-16 items-center px-6 lg:hidden">
          <Link href="/" aria-label="Agenzy home">
            <Logo height={32} priority />
          </Link>
        </header>
        <main className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6 lg:py-12">
          <div className="w-full max-w-[530px]">{children}</div>
        </main>
      </div>
      <BrandPanel />
    </div>
  );
}
