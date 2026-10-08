"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CalendarDays, Eye, Lightbulb, Target } from "lucide-react";
import { Spark } from "./Spark";
import { fadeUp, stagger } from "./motion";

function BriefPreview() {
  return (
    <div className="relative mx-auto w-full max-w-md lg:max-w-none">
      {/* Main brief card */}
      <motion.div
        initial={{ opacity: 0, y: 32, rotate: -1 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
        transition={{ delay: 0.35, duration: 0.8, ease: "easeOut" as const }}
        className="card relative z-10 p-5 shadow-lift sm:p-6"
      >
        <div className="flex items-center justify-between">
          <p className="eyebrow">Sample · Monday brief</p>
        </div>
        <h3 className="mt-3 text-xl font-semibold text-ink sm:text-2xl">Your weekly brief</h3>
        <span className="chip-lime mt-3">
          <Spark className="h-3 w-3 text-ink" />3 opportunities
        </span>
        <p className="mt-4 text-sm leading-6 text-gray-600">
          Review this week&apos;s priorities and choose the next action that fits your capacity.
        </p>

        <div className="mt-5 space-y-3">
          {[
            { icon: Lightbulb, label: "Next move", text: "Try a weekday bundle to fill quieter hours." },
            { icon: Target,    label: "Why it matters", text: "Midweek covers trail the weekend; a bundle tests demand without a blanket discount." },
            { icon: Eye,       label: "Watch for", text: "Redemptions and average order value. Check the margin first." },
          ].map((row) => (
            <div key={row.label} className="flex gap-3 rounded-xl bg-canvas p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-lilac">
                <row.icon className="h-4 w-4 text-brand-600" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{row.label}</p>
                <p className="text-sm font-medium text-ink">{row.text}</p>
              </div>
            </div>
          ))}
        </div>

        <button className="btn-primary mt-5 w-full" tabIndex={-1} aria-hidden="true">
          View your plan
        </button>
      </motion.div>

      {/* Floating: occasion */}
      <motion.div
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        className="absolute -right-3 -top-12 z-20 hidden rounded-2xl bg-ink px-4 py-3 text-white shadow-lift sm:block lg:-right-8"
      >
        <div className="flex items-center gap-2.5">
          <CalendarDays className="h-4 w-4 text-lime-300" />
          <div>
            <p className="text-xs font-semibold">Local occasion in 18 days</p>
            <p className="text-[11px] text-white/60">Plan the offer early</p>
          </div>
        </div>
      </motion.div>

      {/* Floating: competitor signal */}
      <motion.div
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1, duration: 0.6 }}
        className="absolute -bottom-6 -left-3 z-20 hidden rounded-2xl border border-gray-200/70 bg-white px-4 py-3 shadow-lift sm:block lg:-left-10"
      >
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-lilac text-[10px] font-bold text-brand-700">
            NB
          </span>
          <div>
            <p className="text-xs font-semibold text-ink">Nearby café started a promo</p>
            <p className="text-[11px] text-gray-500">Public signal · review before reacting</p>
          </div>
        </div>
      </motion.div>

      {/* Decorative backdrop */}
      <div className="absolute -inset-6 -z-0 rounded-[28px] bg-gradient-to-br from-brand-200/50 via-lilac to-lime-200/50 blur-2xl" aria-hidden="true" />
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden pb-20 pt-28 sm:pb-28 sm:pt-36">
      {/* Soft background shapes */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 right-[-10%] h-[520px] w-[520px] rounded-full bg-lilac blur-3xl" />
        <div className="absolute bottom-0 left-[-10%] h-[360px] w-[360px] rounded-full bg-lime-100 blur-3xl" />
      </div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-4 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-12 lg:px-8">
        <motion.div variants={stagger} initial="hidden" animate="show">
          <motion.div
            variants={fadeUp}
            className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-brand-700 shadow-sm"
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-600" />
            Product prototype · Pilot preparation
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="mt-6 text-[40px] font-semibold leading-[48px] text-ink sm:text-[56px] sm:leading-[64px]"
          >
            Small business.
            <br />
            <span className="relative inline-flex items-center gap-3 font-fun text-brand-600">
              Big possibilities.
              <Spark className="h-8 w-8 animate-twinkle sm:h-10 sm:w-10" />
            </span>
          </motion.h1>

          <motion.p variants={fadeUp} className="mt-6 max-w-xl text-lg leading-8 text-gray-600">
            Agenzy is an AI marketing strategist for independent local businesses. It turns your
            business context and local market signals into a clear next move: what to do, why it
            matters, and what result to watch.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/dashboard" className="btn-primary px-6 py-3 text-base">
              Explore the prototype
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#how-it-works" className="btn-secondary px-6 py-3 text-base">
              See how it works
            </a>
          </motion.div>

          <motion.p variants={fadeUp} className="mt-5 text-sm text-gray-500">
            Demo uses illustrative data. Pilot scope, pricing, and launch timing are still being validated.
          </motion.p>
        </motion.div>

        <BriefPreview />
      </div>
    </section>
  );
}
