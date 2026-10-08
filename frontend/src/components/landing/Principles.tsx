"use client";

import { motion } from "framer-motion";
import { Lock, Scale, ShieldCheck, UserCheck } from "lucide-react";
import { Spark } from "./Spark";
import { fadeUp, reveal, stagger } from "./motion";

const principles = [
  {
    icon: Lock,
    title: "No POS or banking access",
    desc: "Agenzy works from cost ranges you choose to share, never your accounts or transactions.",
  },
  {
    icon: ShieldCheck,
    title: "Read-only connections",
    desc: "Integrations never post or write to your accounts, and you can disconnect them at any time.",
  },
  {
    icon: Scale,
    title: "Facts kept apart from suggestions",
    desc: "Public competitor signals are prompts to investigate, not claims about how another business is doing.",
  },
  {
    icon: UserCheck,
    title: "You make the call",
    desc: "Options come with trade-offs and reasoning you can argue with. No verdicts, no predicted outcomes.",
  },
];

export function Principles() {
  return (
    <section id="principles" className="scroll-mt-20 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="card-ink relative overflow-hidden px-6 py-12 sm:px-10 sm:py-16 lg:px-14">
          <Spark className="absolute right-10 top-10 h-10 w-10 animate-twinkle opacity-90" />
          <Spark className="absolute right-24 top-24 h-4 w-4 opacity-50" />
          <div aria-hidden="true" className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-brand-600/30 blur-3xl" />

          <motion.div {...reveal} variants={stagger} className="relative max-w-2xl">
            <motion.p variants={fadeUp} className="text-xs font-semibold uppercase tracking-[0.12em] text-lime-300">
              Principles
            </motion.p>
            <motion.h2 variants={fadeUp} className="mt-3 text-3xl font-semibold leading-tight text-white sm:text-4xl sm:leading-[44px]">
              Advice you can trust starts with clear limits.
            </motion.h2>
          </motion.div>

          <motion.div {...reveal} variants={stagger} className="relative mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {principles.map((p) => (
              <motion.div key={p.title} variants={fadeUp} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-300">
                  <p.icon className="h-5 w-5 text-ink" />
                </div>
                <h3 className="mt-5 text-base font-semibold text-white">{p.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/65">{p.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
