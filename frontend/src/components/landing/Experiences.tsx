"use client";

import { motion } from "framer-motion";
import { Newspaper, MessageSquare, Users, Activity, ArrowUpRight } from "lucide-react";
import { Spark } from "./Spark";
import { fadeUp, reveal, stagger } from "./motion";

/* ── Mini visuals (illustrative only) ─────────────────────────────── */

function BriefVisual() {
  return (
    <div className="space-y-2">
      {["Test one timely offer", "Check nearby messaging first"].map((t, i) => (
        <div key={t} className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-600 text-[11px] font-semibold text-white">
            {i + 1}
          </span>
          <span className="text-sm font-medium text-ink">{t}</span>
        </div>
      ))}
    </div>
  );
}

function SessionVisual() {
  return (
    <div className="space-y-2.5">
      <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-brand-600 px-3.5 py-2.5 text-sm text-white">
        Should I run a discount for the long weekend?
      </div>
      <div className="max-w-[90%] rounded-2xl rounded-bl-md bg-white px-3.5 py-2.5 text-sm text-ink shadow-sm">
        Consider a bundle instead. Here&apos;s why, two alternatives, and what to watch.
      </div>
    </div>
  );
}

function CompetitorVisual() {
  const rows = [
    { i: "HB", n: "Harbour Bakery", s: "New seasonal menu", c: "bg-lilac text-brand-700" },
    { i: "MC", n: "Main St Coffee", s: "Started paid ads", c: "bg-lime-200 text-ink" },
  ];
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.n} className="flex items-center gap-3 rounded-xl bg-white/10 p-2.5">
          <span className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold ${r.c}`}>{r.i}</span>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-white">{r.n}</p>
            <p className="truncate text-[11px] text-white/60">{r.s}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function AuditVisual() {
  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="rounded-xl bg-white p-3 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">Working</p>
        <p className="mt-1 text-xs text-ink">Behind-the-scenes posts</p>
      </div>
      <div className="rounded-xl bg-white p-3 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Try next</p>
        <p className="mt-1 text-xs text-ink">Post before the lunch rush</p>
      </div>
    </div>
  );
}

const items = [
  {
    icon: Newspaper,
    title: "Weekly Strategic Brief",
    desc: "A Monday read on your market, the moves worth making, and the reasoning behind each one.",
    visual: <BriefVisual />,
    className: "lg:col-span-3 card-lilac",
    dark: false,
  },
  {
    icon: MessageSquare,
    title: "Strategy Sessions",
    desc: "Ask a real question. Specialist analysts weigh timing, budget, brand, and risk before a strategist answers.",
    visual: <SessionVisual />,
    className: "lg:col-span-3 card bg-canvas",
    dark: false,
  },
  {
    icon: Users,
    title: "Competitor Intelligence",
    desc: "Follow the nearby businesses you choose. See public changes and patterns, framed as prompts to investigate.",
    visual: <CompetitorVisual />,
    className: "lg:col-span-2 card-ink",
    dark: true,
  },
  {
    icon: Activity,
    title: "Social Presence Audit",
    desc: "An honest look at your own social channels: what's working, what isn't, and a short action plan you can track.",
    visual: <AuditVisual />,
    className: "lg:col-span-4 card bg-canvas",
    dark: false,
  },
];

export function Experiences() {
  return (
    <section id="experiences" className="scroll-mt-20 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div {...reveal} variants={stagger} className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <motion.p variants={fadeUp} className="eyebrow">Core experiences</motion.p>
            <motion.h2 variants={fadeUp} className="mt-3 text-3xl font-semibold leading-tight text-ink sm:text-4xl sm:leading-[44px]">
              Four ways to find your{" "}
              <span className="font-fun text-brand-600">next move.</span>
            </motion.h2>
          </div>
          <motion.p variants={fadeUp} className="max-w-sm text-sm leading-6 text-gray-600">
            Each one leads with the action, explains the reason, and names the result worth watching.
          </motion.p>
        </motion.div>

        <motion.div {...reveal} variants={stagger} className="mt-12 grid gap-4 lg:grid-cols-6">
          {items.map((it) => (
            <motion.article
              key={it.title}
              variants={fadeUp}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              className={`group relative flex flex-col justify-between gap-8 overflow-hidden p-6 sm:p-8 ${it.className}`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${it.dark ? "bg-lime-300" : "bg-brand-600"}`}>
                    <it.icon className={`h-5 w-5 ${it.dark ? "text-ink" : "text-white"}`} />
                  </div>
                  <ArrowUpRight className={`h-5 w-5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 ${it.dark ? "text-white/40" : "text-gray-300"}`} />
                </div>
                <h3 className={`mt-5 text-xl font-semibold ${it.dark ? "text-white" : "text-ink"}`}>{it.title}</h3>
                <p className={`mt-2 max-w-md text-sm leading-6 ${it.dark ? "text-white/70" : "text-gray-600"}`}>{it.desc}</p>
              </div>
              <div className="relative">{it.visual}</div>
              {it.dark && <Spark className="absolute right-6 top-20 h-5 w-5 opacity-70" />}
            </motion.article>
          ))}
        </motion.div>
        <p className="mt-4 text-xs text-gray-400">Previews use fictional businesses and sample content.</p>
      </div>
    </section>
  );
}
