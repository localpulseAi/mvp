"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Play } from "lucide-react";
import { Spark } from "./Spark";
import { HeroBrief } from "./hero/HeroBrief";

const ease = [0.22, 1, 0.36, 1] as const;

/** Drifting colour blobs and twinkling sparks behind the hero. */
function HeroBackdrop({ reduced }: { reduced: boolean }) {
  const blobs = [
    { className: "-top-32 right-[-8%] h-[460px] w-[460px] bg-lilac", x: [0, -40, 0], y: [0, 30, 0], d: 16 },
    { className: "bottom-[-10%] left-[-12%] h-[380px] w-[380px] bg-lime-100", x: [0, 50, 0], y: [0, -30, 0], d: 18 },
    { className: "left-[38%] top-[20%] h-[260px] w-[260px] bg-brand-200/40", x: [0, 30, -20, 0], y: [0, -40, 20, 0], d: 22 },
  ];
  const sparks = [
    { className: "left-[6%] top-[18%] h-3 w-3 text-brand-300", delay: 0.4 },
    { className: "left-[44%] top-[10%] h-4 w-4 text-lime-400", delay: 1.6 },
    { className: "left-[30%] bottom-[14%] h-2.5 w-2.5 text-brand-400", delay: 2.4 },
    { className: "right-[4%] top-[8%] h-3.5 w-3.5 text-lime-400", delay: 0.9 },
    { className: "right-[46%] bottom-[6%] h-3 w-3 text-brand-300", delay: 3.1 },
    { className: "left-[50%] top-[46%] h-2 w-2 text-brand-300", delay: 2 },
  ];
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {blobs.map((b, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full blur-3xl ${b.className}`}
          animate={reduced ? {} : { x: b.x, y: b.y }}
          transition={{ duration: b.d, repeat: Infinity, ease: "easeInOut" as const }}
        />
      ))}
      {!reduced &&
        sparks.map((s, i) => (
          <motion.span
            key={i}
            className={`absolute ${s.className}`}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1, 0], opacity: [0, 1, 0], rotate: [0, 90] }}
            transition={{ duration: 2.6, delay: s.delay, repeat: Infinity, repeatDelay: 1.8 + i * 0.4 }}
          >
            <Spark className="h-full w-full text-current" />
          </motion.span>
        ))}
    </div>
  );
}

/** "A little smarter." — shimmering gradient text with a hand-drawn lime underline. */
function SmarterLine({ reduced }: { reduced: boolean }) {
  return (
    <span className="relative inline-block font-fun font-medium tracking-[-0.035em]">
      <motion.span
        className="bg-clip-text text-transparent"
        style={{
          backgroundImage: "linear-gradient(100deg, #6840DE 0%, #6840DE 40%, #B9A3F5 50%, #6840DE 60%, #6840DE 100%)",
          backgroundSize: "250% 100%",
        }}
        initial={{ backgroundPosition: "100% 0" }}
        animate={reduced ? {} : { backgroundPosition: ["100% 0", "-50% 0"] }}
        transition={{ delay: 1.4, duration: 1.8, ease: "easeInOut" as const, repeat: Infinity, repeatDelay: 3 }}
      >
        A little smarter.
      </motion.span>
      <svg aria-hidden="true" viewBox="0 0 220 18" preserveAspectRatio="none" className="absolute -bottom-2 right-[4%] h-3 w-[58%] sm:-bottom-3 sm:h-4">
        <motion.path
          d="M3 12 C 50 3, 110 3, 150 9 S 200 15, 217 6"
          fill="none"
          stroke="#C5E25E"
          strokeWidth={6}
          strokeLinecap="round"
          initial={{ pathLength: reduced ? 1 : 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 1, duration: 0.8, ease: "easeInOut" as const }}
        />
      </svg>
      <motion.span
        aria-hidden="true"
        className="absolute -right-9 -top-2 inline-flex h-7 w-7 sm:-right-11 sm:h-9 sm:w-9"
        initial={{ scale: 0, rotate: -90 }}
        animate={reduced ? { scale: 1, rotate: 0 } : { scale: [0, 1.4, 1], rotate: [-90, 20, 0] }}
        transition={{ delay: 1.7, duration: 0.7 }}
      >
        <motion.span
          className="inline-flex h-full w-full"
          animate={reduced ? {} : { scale: [1, 0.8, 1], rotate: [0, 15, 0] }}
          transition={{ delay: 2.5, duration: 2.4, repeat: Infinity }}
        >
          <Spark className="h-full w-full text-lime-400" />
        </motion.span>
      </motion.span>
    </span>
  );
}

export function Hero() {
  const reduced = !!useReducedMotion();
  const item = (i: number) => ({
    initial: reduced ? false : { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay: 0.08 * i, ease },
  });
  const words = ["Your", "next", "move."];

  return (
    <section className="relative">
      <HeroBackdrop reduced={reduced} />
      <div className="site-container relative grid items-center gap-9 pb-10 pt-11 md:pb-16 md:pt-14 lg:grid-cols-[1.04fr_1fr] lg:gap-[52px] lg:pb-[66px] lg:pt-[76px]">
        <div className="max-w-[590px]">
          <motion.a
            {...item(0)}
            href="#pilot"
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-[#F3EEFB] py-1.5 pl-2 pr-3.5 text-[13px] font-semibold text-ink lg:mb-7"
          >
            <motion.span
              className="flex h-5 w-5 items-center justify-center rounded-full bg-lime-300"
              animate={reduced ? {} : { rotate: [0, 180, 360] }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear" as const }}
            >
              <Spark className="h-3 w-3 text-ink" />
            </motion.span>
            Big ideas. Small business energy.
          </motion.a>

          <h1 className="mb-6 text-[clamp(41px,7.9vw,59px)] font-semibold leading-[1.16] tracking-[-0.055em] text-ink lg:text-[clamp(45px,4.5vw,64px)]">
            <span className="block">
              {words.map((w, i) => (
                <motion.span
                  key={w}
                  className="inline-block"
                  initial={reduced ? false : { opacity: 0, y: 28, rotateX: -60, filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0, rotateX: 0, filter: "blur(0px)" }}
                  transition={{ delay: 0.15 + i * 0.12, duration: 0.7, ease }}
                >
                  {w}
                  {i < words.length - 1 && "\u00a0"}
                </motion.span>
              ))}
            </span>
            <motion.span
              className="block"
              initial={reduced ? false : { opacity: 0, y: 24, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.6, duration: 0.7, ease }}
            >
              <SmarterLine reduced={reduced} />
            </motion.span>
          </h1>

          <motion.p {...item(4)} className="mb-7 max-w-[500px] text-base leading-[1.8] text-gray-500 sm:text-[17px] xl:text-lg">
            You know your business. Agenzy helps you see what&apos;s next, turning your goals and local market signals
            into a marketing plan you can actually use.
          </motion.p>

          <motion.div {...item(5)} className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <Link href="/dashboard" className="btn-primary relative min-h-[54px] overflow-hidden rounded-lg px-6 text-sm">
              <motion.span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/35 to-transparent"
                initial={{ left: "-50%" }}
                animate={reduced ? {} : { left: "150%" }}
                transition={{ delay: 2.2, duration: 0.9, repeat: Infinity, repeatDelay: 3.5, ease: "easeInOut" as const }}
              />
              <span className="relative">Explore the demo</span>
            </Link>
            <a href="#what-you-get" className="group inline-flex items-center gap-2.5 text-sm font-semibold text-ink">
              Watch how it works
              <span className="relative flex h-7 w-7 items-center justify-center rounded-full border border-ink/80 transition-colors group-hover:bg-ink group-hover:text-white">
                {!reduced && (
                  <motion.span
                    aria-hidden="true"
                    className="absolute inset-0 rounded-full border border-brand-500"
                    animate={{ scale: [1, 1.7], opacity: [0.7, 0] }}
                    transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 0.6 }}
                  />
                )}
                <Play className="h-3 w-3 fill-current" aria-hidden="true" />
              </span>
            </a>
          </motion.div>

          <motion.p {...item(6)} className="mb-0 mt-4 text-xs text-gray-500 lg:mb-9">
            Prototype preview. Examples use illustrative data.
          </motion.p>

          <motion.div {...item(7)} className="hidden items-center gap-4 text-[13px] text-gray-600 lg:flex">
            <motion.span
              className="h-px bg-ink/60"
              aria-hidden="true"
              initial={{ width: 0 }}
              animate={{ width: 40 }}
              transition={{ delay: 1.2, duration: 0.6 }}
            />
            <span>
              Your neighbourhood.
              <br />
              <strong className="font-semibold text-ink">Your unfair advantage.</strong>
            </span>
          </motion.div>
        </div>

        <HeroBrief />
      </div>
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
