"use client";

import { motion } from "framer-motion";
import { ClipboardList, Layers, CheckCircle2, Lightbulb, HelpCircle, Eye } from "lucide-react";
import { fadeUp, reveal, stagger } from "./motion";

const steps = [
  {
    icon: ClipboardList,
    title: "Tell it about your business",
    desc: "Your niche, goals, capacity, and rough cost ranges. No exact financials, no POS or banking access. Then pick the nearby businesses you want to follow.",
  },
  {
    icon: Layers,
    title: "It gathers the evidence",
    desc: "Local occasions, permitted public signals, and your own social presence are organised into an evidence set you can inspect.",
  },
  {
    icon: CheckCircle2,
    title: "You review the recommendation",
    desc: "Claude-powered analysts draft a recommendation with alternatives and risks. You challenge it, adjust it, and decide.",
  },
];

const anatomy = [
  { icon: Lightbulb,  tag: "Lead with the action", text: "Try a weekday bundle to fill quieter hours." },
  { icon: HelpCircle, tag: "Explain the reason",   text: "Weekends are already full. A bundle tests midweek demand without discounting your best sellers." },
  { icon: Eye,        tag: "Name the result to watch", text: "Track redemptions and average order value for two weeks. Check the margin before publishing." },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20 bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div {...reveal} variants={stagger} className="mx-auto max-w-2xl text-center">
          <motion.p variants={fadeUp} className="eyebrow">How it works</motion.p>
          <motion.h2 variants={fadeUp} className="mt-3 text-3xl font-semibold leading-tight text-ink sm:text-4xl sm:leading-[44px]">
            From business context to a clear next move.
          </motion.h2>
        </motion.div>

        <motion.ol {...reveal} variants={stagger} className="relative mt-14 grid gap-6 md:grid-cols-3">
          <div aria-hidden="true" className="absolute left-0 right-0 top-6 hidden h-px bg-gradient-to-r from-transparent via-brand-200 to-transparent md:block" />
          {steps.map((s, i) => (
            <motion.li key={s.title} variants={fadeUp} className="relative">
              <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 shadow-violet">
                <s.icon className="h-5 w-5 text-white" />
              </div>
              <p className="mt-5 text-xs font-semibold text-gray-400 tabular">Step {String(i + 1).padStart(2, "0")}</p>
              <h3 className="mt-1 text-lg font-semibold text-ink">{s.title}</h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">{s.desc}</p>
            </motion.li>
          ))}
        </motion.ol>

        {/* Anatomy of a recommendation */}
        <motion.div {...reveal} variants={fadeUp} className="mt-20 grid items-center gap-10 rounded-[24px] bg-canvas p-6 sm:p-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="eyebrow">Anatomy of a recommendation</p>
            <h3 className="mt-3 text-2xl font-semibold leading-tight text-ink sm:text-[28px] sm:leading-9">
              Sounds like a helpful strategist. Not a hype machine.
            </h3>
            <p className="mt-4 text-sm leading-6 text-gray-600">
              Observed facts are kept separate from suggestions, uncertainty is stated plainly, and
              there are no guaranteed-revenue promises. Every recommendation follows the same three-part shape.
            </p>
          </div>
          <div className="space-y-3">
            {anatomy.map((a, i) => (
              <motion.div
                key={a.tag}
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.5, ease: "easeOut" as const }}
                className="card flex gap-4 p-4 sm:p-5"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-lilac">
                  <a.icon className="h-4 w-4 text-brand-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-brand-600">{a.tag}</p>
                  <p className="mt-1 text-sm font-medium leading-6 text-ink">{a.text}</p>
                </div>
              </motion.div>
            ))}
            <p className="pl-1 text-xs text-gray-400">Sample recommendation for illustration.</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
