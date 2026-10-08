"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Check, Info } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Spark } from "./Spark";
import { fadeUp, reveal, stagger } from "./motion";

const testing = [
  "Whether the evidence is easy to understand",
  "Whether recommendations are specific enough to act on",
  "Which sources are useful and appropriate to connect",
  "Where human review needs to be stronger",
];

const scope = [
  "Weekly brief workflow",
  "Strategy sessions",
  "Selected public competitor signals",
  "Social presence audit",
];

export function Pilot() {
  return (
    <section id="pilot" className="scroll-mt-20 bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div {...reveal} variants={stagger} className="max-w-2xl">
          <motion.p variants={fadeUp} className="eyebrow">Pilot preparation</motion.p>
          <motion.h2 variants={fadeUp} className="mt-3 text-3xl font-semibold leading-tight text-ink sm:text-4xl sm:leading-[44px]">
            Built with owners, not just for them.
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-4 text-lg leading-8 text-gray-600">
            Agenzy is shaped by recurring problems seen through Shadzil&apos;s agency work with local
            businesses. Before launch, it needs honest feedback on whether the advice is genuinely useful.
          </motion.p>
        </motion.div>

        <div className="mt-12 grid gap-4 lg:grid-cols-5">
          <motion.div {...reveal} variants={fadeUp} className="card p-6 sm:p-8 lg:col-span-3">
            <h3 className="text-lg font-semibold text-ink">What the pilot will test</h3>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {testing.map((t) => (
                <li key={t} className="flex gap-3 rounded-xl bg-canvas p-4 text-sm leading-6 text-gray-700">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-lilac">
                    <Check className="h-3 w-3 text-brand-600" strokeWidth={3} />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
            <div className="mt-6 flex gap-3 rounded-xl border border-gray-200 p-4 text-sm leading-6 text-gray-600">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
              This public prototype communicates product direction. It does not represent paid
              memberships, customer outcomes, or a launched service.
            </div>
            <p className="mt-6 text-sm text-gray-600">
              Own a local business and want to help shape the pilot?{" "}
              <a href="mailto:hello@agenzy.online" className="font-semibold text-brand-600 underline-offset-2 hover:underline">
                hello@agenzy.online
              </a>
            </p>
          </motion.div>

          <motion.div
            {...reveal}
            variants={fadeUp}
            className="relative flex flex-col overflow-hidden rounded-2xl bg-brand-600 p-6 text-white sm:p-8 lg:col-span-2"
          >
            <Spark className="absolute -right-4 -top-4 h-24 w-24 opacity-20" />
            <Logo variant="symbol-reversed" height={40} />
            <h3 className="mt-6 text-2xl font-semibold">Proposed pilot scope</h3>
            <p className="mt-2 text-sm leading-6 text-white/75">
              Pricing, availability, and participant terms haven&apos;t been finalised. This is not an offer for sale.
            </p>
            <ul className="mt-6 space-y-2.5">
              {scope.map((s) => (
                <li key={s} className="flex items-center gap-2.5 text-sm font-medium">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-lime-300">
                    <Check className="h-3 w-3 text-ink" strokeWidth={3} />
                  </span>
                  {s}
                </li>
              ))}
            </ul>
            <Link href="/dashboard" className="btn-lime mt-8 w-full py-3 sm:mt-auto">
              Explore the prototype
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
