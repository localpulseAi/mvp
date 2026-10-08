"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Plus } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { DecisionExplorer } from "./DecisionExplorer";
import { Spark } from "./Spark";
import { fadeUp, reveal } from "./motion";

const CONTACT = "hello@agenzy.online";

function Eyebrow({ children, light }: { children: React.ReactNode; light?: boolean }) {
  return (
    <span className={`mb-4 block text-xs font-semibold tracking-[0.11em] ${light ? "text-white/80" : "text-ink"}`}>{children}</span>
  );
}

const h2 = "text-[clamp(30px,3vw,44px)] font-semibold leading-[1.2] tracking-[-0.045em]";

export function TryIt() {
  return (
    <section id="try-it" className="site-container scroll-mt-24 py-[70px] lg:py-[110px]">
      <motion.div {...reveal} variants={fadeUp} className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between md:gap-16">
        <div>
          <Eyebrow>LESS “WHAT IF?” MORE “LET’S TRY.”</Eyebrow>
          <h2 className={`${h2} text-ink`}>
            Your real questions.
            <br />
            <span className="peppy">Meet your next move.</span>
          </h2>
        </div>
        <p className="max-w-[325px] text-base leading-[1.75] text-gray-500">
          Pick a decision you&apos;re facing. Explore an example recommendation, see the reasoning, and turn it into a few
          practical steps.
        </p>
      </motion.div>
      <DecisionExplorer />
    </section>
  );
}

export function HowItWorks() {
  const steps = [
    ["Tell us what matters.", "Share your goals, margins, capacity, and the business you want to build."],
    ["Get a local perspective.", "Agenzy connects your business context with competitors and relevant local occasions."],
    ["Make your next move.", "Choose an action, understand the reasoning, and watch the results that matter."],
  ];
  return (
    <section id="how-it-works" className="scroll-mt-20 bg-ink py-[70px] text-white lg:py-[82px]">
      <div className="site-container">
        <motion.div {...reveal} variants={fadeUp} className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <Eyebrow light>LESS OVERWHELM. MORE MOMENTUM.</Eyebrow>
            <h2 className={h2}>
              From “where do I start?”
              <br />
              to <span className="font-fun font-medium tracking-[-0.02em] text-lime-300">“I&apos;ve got this.”</span>
            </h2>
          </div>
          <p className="max-w-[300px] text-[15px] leading-[1.75] text-white/75">
            No marketing degree required.
            <br />
            Just your business, a goal, and a place to start.
          </p>
        </motion.div>
        <div className="mt-12 grid gap-8 md:grid-cols-3 md:gap-6 lg:mt-14 lg:gap-8">
          {steps.map(([title, body], i) => (
            <motion.article key={title} {...reveal} variants={fadeUp} className="border-t border-white/15 pt-6">
              <span className="font-fun text-2xl font-medium text-lime-300">0{i + 1}</span>
              <h3 className="mt-3 text-lg font-semibold tracking-[-0.03em]">{title}</h3>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-white/70">{body}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Pilot() {
  return (
    <section id="pilot" className="site-container grid scroll-mt-24 items-center gap-10 py-[70px] lg:grid-cols-2 lg:gap-16 lg:py-[110px]">
      <motion.div {...reveal} variants={fadeUp}>
        <Eyebrow>PILOT PREPARATION</Eyebrow>
        <h2 className={`${h2} text-ink`}>
          Small business.
          <br />
          <span className="peppy">Big possibilities.</span>
        </h2>
        <p className="mt-6 max-w-[470px] text-base leading-[1.8] text-gray-500">
          Agenzy is a working prototype, shaped around the real decisions local business owners face. We&apos;re
          validating whether the evidence is clear and the recommendations are useful enough to act on.
        </p>
        <div className="mt-8 space-y-5 border-t border-gray-200 pt-6">
          <div>
            <strong className="text-sm font-semibold text-ink">Help shape a more useful strategist</strong>
            <p className="mt-1 text-sm text-gray-500">
              Share the questions you face and the context the advice needs to get right:{" "}
              <a href={`mailto:${CONTACT}`} className="font-semibold text-brand-600 hover:underline">
                {CONTACT}
              </a>
            </p>
          </div>
          <div>
            <strong className="text-sm font-semibold text-ink">Try the prototype at your own pace</strong>
            <p className="mt-1 text-sm text-gray-500">
              The demo uses illustrative data. Pricing, pilot availability, and participant terms are still being validated.
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div {...reveal} variants={fadeUp} className="relative rounded-2xl bg-brand-600 px-7 py-8 text-white sm:px-9">
        <div className="flex items-center justify-between gap-3 text-xs font-semibold tracking-[0.05em]">
          <span>EXPLORE WHAT&apos;S TAKING SHAPE</span>
          <span className="rounded-full bg-white/15 px-3 py-1 tracking-normal">Prototype</span>
        </div>
        <h3 className="mt-8 text-[28px] font-semibold leading-[1.2] tracking-[-0.04em]">
          Clear thinking.
          <br />
          Practical next steps.
        </h3>
        <p className="mt-4 text-[15px] leading-relaxed text-white/80">
          Explore four connected experiences built around what to do, why it matters, and what to watch.
        </p>
        <div className="my-6 h-px bg-white/20" />
        <ul className="mb-8 space-y-3 text-sm font-medium">
          {["Weekly Strategic Brief", "Strategy Sessions", "Competitor Intelligence", "Social Presence Audit"].map((t) => (
            <li key={t} className="flex items-center gap-3">
              <Check className="h-3.5 w-3.5 text-lime-300" strokeWidth={3} aria-hidden="true" />
              {t}
            </li>
          ))}
        </ul>
        <Link href="/dashboard" className="btn-lime min-h-[54px] w-full rounded-lg text-sm">
          Explore the demo
        </Link>
        <p className="mt-4 text-center text-sm text-white/80">Illustrative data · No paid membership offer</p>
      </motion.div>
    </section>
  );
}

export function Principles() {
  const items = [
    ["Your context, on your terms.", "Share useful cost ranges and business goals. Agenzy does not need access to your banking or POS."],
    ["Evidence before certainty.", "Public signals are prompts to investigate. Facts, assumptions, and recommendations should stay clearly separated."],
    ["The final call is yours.", "Consider the trade-offs, challenge the reasoning, and choose the action that fits your business."],
  ];
  return (
    <section id="principles" className="site-container border-b border-gray-200 pb-[70px] lg:pb-[110px]">
      <motion.div {...reveal} variants={fadeUp}>
        <Eyebrow>CLEAR LIMITS. BETTER DECISIONS.</Eyebrow>
        <h2 className={`${h2} text-ink`}>
          Advice you can question.
          <br />
          <span className="peppy">Decisions you own.</span>
        </h2>
      </motion.div>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {items.map(([title, body]) => (
          <motion.article key={title} {...reveal} variants={fadeUp} className="rounded-[14px] border border-gray-200 bg-white p-6">
            <h3 className="text-lg font-semibold tracking-[-0.03em] text-ink">{title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">{body}</p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}

const faqs = [
  ["Who is Agenzy for?", "Independent local business owners who make their own marketing decisions. If you’re balancing promotions, pricing, quiet periods, and nearby competition, Agenzy is being built with you in mind."],
  ["How is this different from asking a generic AI?", "Agenzy brings your business goals, margins, capacity, and local market context into the same conversation. The aim is practical advice with a reason behind it and a clear result to watch."],
  ["Does Agenzy do my marketing for me?", "Agenzy helps you decide what to do and why. You stay in control of your pricing, promotions, content, and decisions. It does not replace the judgment you’ve built running your business."],
  ["Can I join the pilot?", `Pilot participation hasn’t opened yet. When it does, participants will use Agenzy each week, try at least one recommendation, and share honest feedback in Friday check-ins. To register interest, email ${CONTACT}.`],
  ["Do I need to connect my banking or POS?", "No. Agenzy does not require access to your banking or point-of-sale system. You provide the business context that helps it make recommendations more relevant."],
];

export function Faq() {
  return (
    <section className="site-container grid gap-10 py-[70px] lg:grid-cols-[1fr_1.15fr] lg:gap-16 lg:py-[110px]">
      <motion.div {...reveal} variants={fadeUp}>
        <Eyebrow>A FEW GOOD QUESTIONS</Eyebrow>
        <h2 className={`${h2} text-ink`}>
          Curious?
          <br />
          <span className="peppy">Good instinct.</span>
        </h2>
      </motion.div>
      <div>
        {faqs.map(([q, a], i) => (
          <details key={q} open={i === 0} className="group border-b border-gray-200 first:border-t">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-8 py-5 text-[15px] font-medium text-ink [&::-webkit-details-marker]:hidden">
              {q}
              <Plus className="h-5 w-5 shrink-0 text-brand-600 transition-transform duration-200 group-open:rotate-45" aria-hidden="true" />
            </summary>
            <p className="mb-6 pr-8 text-sm leading-[1.85] text-gray-500">{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <section className="site-container pb-16">
      <motion.div {...reveal} variants={fadeUp} className="relative overflow-hidden rounded-2xl bg-lilac px-6 py-14 text-center sm:px-12">
        <Spark className="absolute left-[6%] top-6 hidden h-48 w-48 rotate-12 text-lime-300 opacity-90 md:block lg:h-52 lg:w-52" />
        <div className="relative">
          <Eyebrow>YOU DON&apos;T HAVE TO FIGURE IT ALL OUT ALONE.</Eyebrow>
          <h2 className="text-[34px] font-semibold leading-[1.2] tracking-[-0.045em] text-ink sm:text-[43px]">
            Your next smart move
            <br />
            <span className="peppy">starts here.</span>
          </h2>
          <Link href="/dashboard" className="btn-primary mt-7 min-h-[54px] rounded-lg px-6 text-sm">
            Explore the demo
          </Link>
          <p className="mt-4 text-xs text-gray-500">Local insight. Clear direction. A little more confidence.</p>
          <a href="#try-it" className="mt-3 inline-block text-sm text-brand-600 underline underline-offset-4 hover:text-brand-700">
            Try a sample decision first
          </a>
        </div>
      </motion.div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="site-container flex flex-col gap-4 py-8 text-sm text-gray-500 md:flex-row md:items-center md:justify-between">
      <Link href="/" aria-label="Agenzy home">
        <Logo height={36} />
      </Link>
      <p>Built for the businesses that make a neighbourhood.</p>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
        <a href={`mailto:${CONTACT}`} className="font-medium text-brand-600 hover:text-brand-700">
          {CONTACT}
        </a>
        <span>© 2026 Agenzy</span>
      </div>
    </footer>
  );
}
