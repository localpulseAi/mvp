"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Play, Target } from "lucide-react";
import { Spark } from "./Spark";
import { cn } from "@/lib/utils";

const samples = {
  cafe: {
    tab: "Café",
    business: "Neighbourhood café",
    signal: "A weekend market could bring more people past your door.",
    title: ["Make the morning stop", "an easy yes."],
    move: "Try a coffee + pastry bundle before 11am. Keep the offer focused on your quieter hours.",
    why: "Fill spare capacity without discounting your whole menu.",
    watch: ["Bundle orders", "Margin per sale"],
  },
  salon: {
    tab: "Salon",
    business: "Independent salon",
    signal: "Your midweek appointment book has room for a few more regulars.",
    title: ["Give quiet hours", "a little attention."],
    move: "Promote a midweek appointment reminder to existing clients. Lead with convenient times, not a blanket discount.",
    why: "Use open appointments while protecting your service margins.",
    watch: ["Midweek bookings", "Repeat appointments"],
  },
  shop: {
    tab: "Local shop",
    business: "Neighbourhood shop",
    signal: "A local event could introduce new shoppers to your street.",
    title: ["Turn passing interest", "into a reason to stop."],
    move: "Feature a small, event-ready selection in your window and social posts. Keep the message specific and easy to spot.",
    why: "Help new visitors understand what makes your shop worth a visit.",
    watch: ["Featured item sales", "New customer visits"],
  },
} as const;
type SampleKey = keyof typeof samples;
const keys = Object.keys(samples) as SampleKey[];

const ease = [0.22, 1, 0.36, 1] as const;

function SampleBrief() {
  const [active, setActive] = useState<SampleKey>("cafe");
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const reduced = useReducedMotion();
  const s = samples[active];

  function onKey(e: React.KeyboardEvent, i: number) {
    let n: number | undefined;
    if (e.key === "ArrowRight") n = (i + 1) % keys.length;
    if (e.key === "ArrowLeft") n = (i + keys.length - 1) % keys.length;
    if (e.key === "Home") n = 0;
    if (e.key === "End") n = keys.length - 1;
    if (n !== undefined) {
      e.preventDefault();
      setActive(keys[n]);
      tabRefs.current[n]?.focus();
    }
  }

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.14, ease }}
      className="w-full max-w-[590px] justify-self-center rounded-[20px] bg-lilac p-5 sm:p-7 lg:max-w-none"
      id="sample"
    >
      <div className="mb-4 flex items-center justify-between gap-3 text-[11px] font-semibold tracking-[0.08em] text-ink sm:text-xs">
        <span>A CLEARER WEEK STARTS HERE</span>
        <span className="font-normal tracking-normal text-gray-500">Illustrative example</span>
      </div>

      <div role="tablist" aria-label="Choose a sample business" className="mb-4 flex gap-1.5">
        {keys.map((k, i) => (
          <button
            key={k}
            ref={(el) => {
              tabRefs.current[i] = el;
            }}
            id={`tab-${k}`}
            role="tab"
            aria-selected={active === k}
            aria-controls="brief-panel"
            tabIndex={active === k ? 0 : -1}
            onClick={() => setActive(k)}
            onKeyDown={(e) => onKey(e, i)}
            className={cn(
              "rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors sm:text-sm",
              active === k ? "bg-ink text-white" : "text-gray-500 hover:bg-brand-200/60"
            )}
          >
            {samples[k].tab}
          </button>
        ))}
      </div>

      <div
        id="brief-panel"
        role="tabpanel"
        aria-labelledby={`tab-${active}`}
        tabIndex={0}
        className="rounded-xl border border-brand-200/70 bg-white p-5 shadow-[0_12px_32px_rgba(55,33,100,0.05)] sm:p-7"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="mb-2.5 text-xs font-semibold tracking-[0.08em] text-brand-600">YOUR WEEKLY STRATEGIC BRIEF</p>
            <h2 className="mb-4 text-[22px] font-semibold leading-[1.3] tracking-[-0.04em] text-ink sm:text-[25px]">
              A good week starts
              <br />
              with a smart move.
            </h2>
          </div>
          <Image src="/brand/symbol.png" alt="" width={48} height={43} className="h-auto w-12 shrink-0" />
        </div>

        <div className="mb-5 flex justify-between border-t border-gray-100 pt-3 text-xs text-gray-500">
          <span>{s.business}</span>
          <span>This week</span>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={active}
            initial={reduced ? false : { opacity: 0.55, y: 7 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="mb-5 flex gap-3">
              <Target className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
              <div>
                <p className="text-xs font-semibold tracking-[0.06em] text-ink">THE LOCAL SIGNAL</p>
                <p className="mt-1 text-[13px] leading-relaxed text-gray-600">{s.signal}</p>
              </div>
            </div>

            <div className="rounded-lg bg-[#E3F2B7] px-5 py-5">
              <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.06em] text-ink">
                <Spark className="h-3.5 w-3.5 text-ink" /> YOUR NEXT MOVE
              </p>
              <h3 className="mb-2.5 mt-2.5 text-[22px] font-semibold leading-[1.25] tracking-[-0.035em] text-ink sm:text-[25px]">
                {s.title[0]}
                <br />
                {s.title[1]}
              </h3>
              <p className="text-[13px] leading-relaxed text-ink/80 sm:text-sm">{s.move}</p>
            </div>

            <div className="mt-5 grid grid-cols-[1.4fr_1fr] gap-5">
              <div>
                <p className="text-xs font-semibold tracking-[0.06em] text-ink">WHY IT MATTERS</p>
                <p className="mt-1 text-xs leading-relaxed text-gray-500">{s.why}</p>
              </div>
              <div className="border-l border-gray-100 pl-5">
                <p className="text-xs font-semibold tracking-[0.06em] text-ink">WHAT TO WATCH</p>
                <p className="mt-1 text-xs leading-relaxed text-gray-500">
                  {s.watch[0]}
                  <br />
                  {s.watch[1]}
                </p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <p className="mt-4 flex items-center justify-center gap-2 font-fun text-[19px] font-medium text-brand-600 sm:text-[21px]">
        <Spark className="h-5 w-5 text-brand-600" /> Less guessing. More going.
      </p>
    </motion.div>
  );
}

export function Hero() {
  const reduced = useReducedMotion();
  const item = (i: number) => ({
    initial: reduced ? false : { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay: 0.08 * i, ease },
  });

  return (
    <section className="site-container grid items-center gap-9 pb-10 pt-11 md:pb-16 md:pt-14 lg:grid-cols-[1.04fr_1fr] lg:gap-[52px] lg:pb-[66px] lg:pt-[76px]">
      <div className="max-w-[590px]">
        <motion.a
          {...item(0)}
          href="#pilot"
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-[#F3EEFB] py-1.5 pl-2 pr-3.5 text-[13px] font-semibold text-ink lg:mb-7"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-lime-300">
            <Spark className="h-3 w-3 text-ink" />
          </span>
          Big ideas. Small business energy.
        </motion.a>

        <motion.h1
          {...item(1)}
          className="mb-6 text-[clamp(41px,7.9vw,59px)] font-semibold leading-[1.16] tracking-[-0.055em] text-ink lg:text-[clamp(45px,4.5vw,64px)]"
        >
          Your next move.
          <br />
          <span className="font-fun font-medium tracking-[-0.035em] text-brand-600">A little smarter.</span>
        </motion.h1>

        <motion.p {...item(2)} className="mb-7 max-w-[500px] text-base leading-[1.8] text-gray-500 sm:text-[17px] xl:text-lg">
          You know your business. Agenzy helps you see what&apos;s next, turning your goals and local market signals
          into a marketing plan you can actually use.
        </motion.p>

        <motion.div {...item(3)} className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <Link href="/dashboard" className="btn-primary min-h-[54px] rounded-lg px-6 text-sm">
            Explore the demo
          </Link>
          <a href="#try-it" className="group inline-flex items-center gap-2.5 text-sm font-semibold text-ink">
            Try a real-world decision
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-ink/80 transition-colors group-hover:bg-ink group-hover:text-white">
              <Play className="h-3 w-3 fill-current" aria-hidden="true" />
            </span>
          </a>
        </motion.div>

        <motion.p {...item(4)} className="mb-0 mt-4 text-xs text-gray-500 lg:mb-9">
          Prototype preview. Examples use illustrative data.
        </motion.p>

        <motion.div {...item(5)} className="hidden items-center gap-4 text-[13px] text-gray-600 lg:flex">
          <span className="h-px w-10 bg-ink/60" aria-hidden="true" />
          <span>
            Your neighbourhood.
            <br />
            <strong className="font-semibold text-ink">Your unfair advantage.</strong>
          </span>
        </motion.div>
      </div>

      <SampleBrief />
    </section>
  );
}

export function ContextStrip() {
  const items = ["Your goals", "Your margins", "Your capacity", "Your local market"];
  return (
    <section className="border-y border-gray-200">
      <div className="site-container grid grid-cols-2 gap-x-4 gap-y-4 py-6 text-center sm:grid-cols-4 lg:flex lg:items-center lg:justify-between lg:py-7 lg:text-left">
        <p className="col-span-full text-sm leading-normal text-gray-500 lg:text-[13px]">
          Strategy that sees <br className="hidden lg:block" />
          <strong className="font-semibold text-ink">the whole picture.</strong>
        </p>
        {items.map((it, i) => (
          <div key={it} className="contents">
            <span className="text-[13px] font-medium text-ink sm:text-[15px]">{it}</span>
            {i < items.length - 1 && (
              <span aria-hidden="true" className="hidden text-lg text-brand-300 lg:inline">
                +
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
