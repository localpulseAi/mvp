"use client";

import { motion } from "framer-motion";
import { Briefcase, Clock, MessageCircleQuestion, Check } from "lucide-react";
import { fadeUp, reveal, stagger } from "./motion";

const options = [
  {
    icon: Briefcase,
    label: "Marketing agency",
    cost: "Often $1,500+ a month",
    desc: "Retainer pricing that rarely fits a business with one location and a small team.",
  },
  {
    icon: Clock,
    label: "Consultant",
    cost: "Often $150–$400 an hour",
    desc: "Useful in bursts, but the advice stops when the hours run out.",
  },
  {
    icon: MessageCircleQuestion,
    label: "Generic AI chat",
    cost: "No business context",
    desc: "Doesn't know your street, your competitors, your margins, or your capacity.",
  },
];

export function Problem() {
  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div {...reveal} variants={stagger} className="max-w-3xl">
          <motion.p variants={fadeUp} className="eyebrow">The problem</motion.p>
          <motion.h2 variants={fadeUp} className="mt-3 text-3xl font-semibold leading-tight text-ink sm:text-4xl sm:leading-[44px]">
            Marketing decisions every week. No strategist in the room.
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-4 text-lg leading-8 text-gray-600">
            Promotions, timing, a competitor&apos;s new offer, where to spend a limited budget.
            Owners make these calls on instinct because the help that exists is priced for bigger teams.
          </motion.p>
        </motion.div>

        <motion.div {...reveal} variants={stagger} className="mt-12 grid gap-4 md:grid-cols-3">
          {options.map((o) => (
            <motion.div key={o.label} variants={fadeUp} className="card p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
                <o.icon className="h-5 w-5 text-gray-500" />
              </div>
              <p className="mt-5 font-display text-lg font-semibold text-ink">{o.label}</p>
              <p className="mt-1 text-sm font-semibold text-brand-600">{o.cost}</p>
              <p className="mt-3 text-sm leading-6 text-gray-600">{o.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          {...reveal}
          variants={fadeUp}
          className="card-lilac mt-6 flex flex-col gap-6 p-6 sm:p-8 md:flex-row md:items-center md:justify-between"
        >
          <div className="max-w-2xl">
            <p className="font-display text-xl font-semibold text-ink sm:text-2xl">
              Agenzy is being built for the gap in between.
            </p>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Strategic guidance that starts with your business reality, explains its reasoning,
              and leaves the final call with you.
            </p>
          </div>
          <ul className="grid shrink-0 gap-2 text-sm font-medium text-ink">
            {["Knows your context", "Shows its reasoning", "You decide"].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-lime-300">
                  <Check className="h-3 w-3 text-ink" strokeWidth={3} />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  );
}
