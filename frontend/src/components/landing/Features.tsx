"use client";

import { motion } from "framer-motion";
import { Check, FileText, MessageCircle, Plus, SearchCheck, SquareCheckBig } from "lucide-react";
import { openScenario, type ScenarioId } from "./scenarios";
import { fadeUp, reveal } from "./motion";
import { cn } from "@/lib/utils";

interface FeatureCardProps {
  number: string;
  icon: React.ElementType;
  title: [string, string?];
  body: string;
  link: string;
  scenario: ScenarioId;
  className?: string;
  children: React.ReactNode;
}

function FeatureCard({ number, icon: Icon, title, body, link, scenario, className, children }: FeatureCardProps) {
  return (
    <motion.article
      {...reveal}
      variants={fadeUp}
      className={cn("flex min-w-0 flex-col rounded-[14px] border border-gray-200 bg-white px-6 pb-6 pt-7 sm:px-8 sm:pt-8", className)}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold tracking-[0.08em] text-gray-600">{number}</span>
        <Icon className="h-5 w-5 text-brand-600" strokeWidth={1.6} aria-hidden="true" />
      </div>
      <h3 className="mt-6 text-[25px] font-semibold leading-[1.2] tracking-[-0.035em] text-ink lg:text-[27px]">
        {title[0]}
        {title[1] && (
          <>
            <br />
            {title[1]}
          </>
        )}
      </h3>
      <p className="mt-3 max-w-md text-[15px] leading-relaxed text-gray-600">{body}</p>
      <div className="mt-5 flex-1">{children}</div>
      <a
        href="#try-it"
        onClick={() => openScenario(scenario)}
        className="mt-8 flex items-center justify-between text-sm font-semibold text-brand-600 hover:text-brand-700"
      >
        {link}
        <Plus className="h-4 w-4" aria-hidden="true" />
      </a>
    </motion.article>
  );
}

export function Features() {
  return (
    <section id="what-you-get" className="site-container scroll-mt-24 py-[70px] lg:py-[110px]">
      <motion.div {...reveal} variants={fadeUp} className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between md:gap-16">
        <div>
          <span className="mb-4 block text-xs font-semibold tracking-[0.11em] text-ink">A LITTLE CLARITY GOES A LONG WAY</span>
          <h2 className="text-[clamp(30px,3vw,44px)] font-semibold leading-[1.2] tracking-[-0.045em] text-ink">
            You run the business.
            <br />
            We help with the <span className="peppy">what&apos;s next.</span>
          </h2>
        </div>
        <p className="max-w-[325px] text-base leading-[1.75] text-gray-500">
          One place to understand your market, work through a decision, and turn your next good idea into action.
        </p>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2">
        <FeatureCard
          number="01 / GET YOUR BEARINGS"
          icon={FileText}
          title={["Your week, with a plan."]}
          body="A weekly strategic brief brings the market into focus, with a short list of actions and the signals worth watching."
          link="Explore a quiet-hours plan"
          scenario="quiet"
          className="bg-[#F0EAFA]"
        >
          <ul className="space-y-1.5 text-sm text-ink">
            {["What’s happening locally", "What to do about it", "How to see if it’s working"].map((t) => (
              <li key={t} className="flex items-center gap-2.5">
                <span className="flex h-4 w-4 items-center justify-center rounded border border-gray-300 bg-white">
                  <Check className="h-3 w-3 text-brand-600" strokeWidth={3} aria-hidden="true" />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </FeatureCard>

        <FeatureCard
          number="02 / TALK IT THROUGH"
          icon={MessageCircle}
          title={["A sounding board.", "With business sense."]}
          body="Promotions, prices, timing. Work through the trade-offs with advice shaped by your goals, margins, and capacity."
          link="Test a discount decision"
          scenario="discount"
          className="bg-[#F4F7E9]"
        >
          <div className="inline-block rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-ink shadow-sm">
            “Should I run a 20% discount this week?”
          </div>
        </FeatureCard>

        <FeatureCard
          number="03 / KNOW YOUR NEIGHBOURHOOD"
          icon={SearchCheck}
          title={["Keep an eye out.", "Without losing your day."]}
          body="Discover nearby competitors and make sense of their public offers, reviews, and activity. See what deserves a response."
          link="Explore a competitor response"
          scenario="competitor"
        >
          <div className="flex flex-wrap gap-2">
            {["Public offers", "Reviews", "Local activity"].map((t) => (
              <span key={t} className="rounded-md border border-gray-200 px-2.5 py-1 text-xs text-ink">
                {t}
              </span>
            ))}
          </div>
        </FeatureCard>

        <FeatureCard
          number="04 / MAKE YOUR PRESENCE COUNT"
          icon={SquareCheckBig}
          title={["A clearer path", "to showing up."]}
          body="Understand what your social presence needs, then work through a prioritized action plan you can track."
          link="Try a social presence fix"
          scenario="social"
        >
          <div className="flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2.5 text-xs text-ink">
            <span className="rounded bg-lilac px-2 py-0.5 font-medium text-brand-700">Start here</span>
            <span className="flex-1">Make your next step obvious</span>
            <Check className="h-3.5 w-3.5 text-brand-600" aria-hidden="true" />
          </div>
        </FeatureCard>
      </div>
    </section>
  );
}
