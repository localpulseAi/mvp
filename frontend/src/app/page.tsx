"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  AnimatePresence,
  useMotionValue,
  useSpring,
} from "framer-motion";
import {
  Zap,
  Newspaper,
  MessageSquare,
  Users,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  Calendar,
  Clock,
  Star,
  AlertCircle,
  ChevronRight,
  Eye,
  BarChart2,
  Sparkles,
  Target,
  DollarSign,
  Brain,
  Lock,
} from "lucide-react";

// ─── Shared animation variants ───────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 50 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" as const } },
};

const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.6 } },
};

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const staggerFast = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.85 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" as const } },
};

const slideLeft = {
  hidden: { opacity: 0, x: 60 },
  show: { opacity: 1, x: 0, transition: { duration: 0.7, ease: "easeOut" as const } },
};

const slideRight = {
  hidden: { opacity: 0, x: -60 },
  show: { opacity: 1, x: 0, transition: { duration: 0.7, ease: "easeOut" as const } },
};

function useScrollReveal() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  return { ref, isInView };
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" as const }}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-white/10 bg-[#0a0a14]/90 backdrop-blur-lg"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
            <Zap className="h-4 w-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-bold text-white tracking-tight">LocalPulse</span>
          <span className="rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400">
            AI
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-medium text-white/60 hover:text-white transition-colors"
          >
            Sign in
          </Link>
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 hover:bg-amber-400 transition-colors"
            >
              Apply now
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </motion.div>
        </div>
      </div>
    </motion.header>
  );
}

// ─── Section 1: Hero ──────────────────────────────────────────────────────────

const heroWords = ["smarter.", "faster.", "yours."];

function HeroSection() {
  const [wordIndex, setWordIndex] = useState(0);
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 180]);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  useEffect(() => {
    const t = setInterval(() => setWordIndex((i) => (i + 1) % heroWords.length), 2600);
    return () => clearInterval(t);
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#080812] px-6 pt-20"
    >
      {/* Animated background orbs */}
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-40 left-1/2 h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-brand-600 blur-[120px]"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.08, 0.15, 0.08] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full bg-amber-500 blur-[120px]"
        />
        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <motion.div style={{ y, opacity }} className="relative z-10 text-center max-w-4xl mx-auto">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-sm font-medium text-brand-300"
        >
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-400" />
          Now accepting founding members · Pilot phase
        </motion.div>

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.8, ease: "easeOut" as const }}
        >
          <h1 className="text-5xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-7xl">
            Marketing strategy,
            <br />
            <span className="relative">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-violet-300">
                finally{" "}
              </span>
              <AnimatePresence mode="wait">
                <motion.span
                  key={wordIndex}
                  initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -20, filter: "blur(8px)" }}
                  transition={{ duration: 0.45 }}
                  className="inline-block text-amber-400"
                >
                  {heroWords[wordIndex]}
                </motion.span>
              </AnimatePresence>
            </span>
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.7 }}
          className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/60"
        >
          LocalPulse is an AI strategist built for independent local business owners.
          It watches your competitors, reads your local market, and delivers evidence-backed
          recommendations every Monday morning and on demand.
        </motion.p>

        {/* CTA row */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
        >
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-8 py-4 text-base font-bold text-white shadow-2xl shadow-amber-500/30 hover:bg-amber-400 transition-colors"
            >
              Apply as Founding Member
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-8 py-4 text-base font-semibold text-white/80 backdrop-blur-sm hover:bg-white/10 transition-colors"
            >
              View live demo
            </Link>
          </motion.div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mt-4 text-sm text-white/30"
        >
          $149/month · Locked for 12 months · Limited to 12 founding members
        </motion.p>
      </motion.div>

      {/* Floating UI cards */}
      <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
        {/* Brief card - left */}
        <motion.div
          initial={{ opacity: 0, x: -80, rotate: -6 }}
          animate={{ opacity: 1, x: 0, rotate: -6 }}
          transition={{ delay: 1, duration: 0.9, ease: "easeOut" as const }}
          className="absolute left-[3%] top-[22%] hidden xl:block"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="w-60 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md"
          >
            <div className="mb-2 flex items-center gap-2">
              <Newspaper className="h-3.5 w-3.5 text-brand-400" />
              <span className="text-[11px] font-semibold text-white/70">Weekly Brief · Mon 7am</span>
            </div>
            <p className="text-xs font-semibold text-white leading-snug">
              Mother's Day is 7 days out. Only one competitor has activated —
            </p>
            <p className="mt-1 text-[11px] text-white/50">You have a first-mover window.</p>
            <div className="mt-2.5 rounded-lg bg-brand-600/30 px-2.5 py-1.5">
              <p className="text-[10px] font-semibold text-brand-300">RECOMMENDATION #1</p>
              <p className="text-[11px] text-white/80 mt-0.5">Push reservations before Thursday.</p>
            </div>
          </motion.div>
        </motion.div>

        {/* Session card - right */}
        <motion.div
          initial={{ opacity: 0, x: 80, rotate: 5 }}
          animate={{ opacity: 1, x: 0, rotate: 5 }}
          transition={{ delay: 1.15, duration: 0.9, ease: "easeOut" as const }}
          className="absolute right-[3%] top-[26%] hidden xl:block"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="w-64 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md"
          >
            <div className="mb-2 flex items-center gap-2">
              <MessageSquare className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-[11px] font-semibold text-white/70">Strategy Session</span>
            </div>
            <div className="rounded-lg bg-white/10 px-3 py-2 text-[11px] text-white/80 mb-2">
              "Should I run a 30% lunch promo this week?"
            </div>
            <p className="text-[10px] font-semibold text-amber-400 mb-1">RECOMMENDATION</p>
            <p className="text-[11px] text-white/70 leading-relaxed">
              Hold on the discount. Three competitors already running promos. A fourth erodes the signal...
            </p>
          </motion.div>
        </motion.div>

        {/* Competitor pill - bottom left */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3, duration: 0.8 }}
          className="absolute bottom-[18%] left-[8%] hidden lg:block"
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="flex items-center gap-2.5 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 backdrop-blur-md"
          >
            <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs font-semibold text-white/70">Competitor launched Meta Ads</span>
            <span className="text-[10px] text-white/40">2d ago</span>
          </motion.div>
        </motion.div>

        {/* Stat pill - bottom right */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.45, duration: 0.8 }}
          className="absolute bottom-[20%] right-[8%] hidden lg:block"
        >
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 3 }}
            className="flex items-center gap-2.5 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 backdrop-blur-md"
          >
            <Calendar className="h-3.5 w-3.5 text-brand-400" />
            <span className="text-xs font-semibold text-white/70">Summer festival in 18 days</span>
            <span className="text-[10px] font-bold text-amber-400">Plan now</span>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="flex h-10 w-6 items-start justify-center rounded-full border border-white/20 p-1.5"
        >
          <div className="h-2 w-1 rounded-full bg-white/50" />
        </motion.div>
      </motion.div>
    </section>
  );
}

// ─── Section 2: The Problem ───────────────────────────────────────────────────

function ProblemSection() {
  const { ref, isInView } = useScrollReveal();

  const problems = [
    {
      icon: DollarSign,
      label: "Marketing agency",
      cost: "$1,500–$4,000/mo",
      desc: "Retainer pricing built for enterprise. Not for an independent business with a small team.",
      color: "text-red-400",
      bg: "bg-red-500/10",
    },
    {
      icon: Clock,
      label: "Human consultant",
      cost: "$150–$400/hr",
      desc: "Sporadic at best. No market context. Gone after the invoice.",
      color: "text-orange-400",
      bg: "bg-orange-500/10",
    },
    {
      icon: Brain,
      label: "Generic AI tools",
      cost: "No local context",
      desc: "ChatGPT doesn't know Calgary, your competitors, or your margins.",
      color: "text-yellow-400",
      bg: "bg-yellow-500/10",
    },
  ];

  return (
    <section className="relative bg-[#0a0a14] py-32 px-6">
      <div className="mx-auto max-w-5xl">
        <motion.div
          ref={ref}
          variants={staggerContainer}
          initial="hidden"
          animate={isInView ? "show" : "hidden"}
          className="text-center mb-20"
        >
          <motion.div variants={fadeIn} className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-1.5 text-sm font-medium text-white/40">
            The problem
          </motion.div>
          <motion.h2 variants={fadeUp} className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            You make marketing decisions
            <br />
            <span className="text-white/40">without the information to make them well.</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="mx-auto mt-6 max-w-2xl text-lg text-white/50 leading-relaxed">
            Every week: promotions, timing, competitor moves, pricing decisions. You're
            making them from instinct because the tools that actually help are out of reach.
          </motion.p>
        </motion.div>

        {/* Problems grid */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={isInView ? "show" : "hidden"}
          className="grid gap-4 md:grid-cols-3 mb-16"
        >
          {problems.map((p) => (
            <motion.div
              key={p.label}
              variants={scaleIn}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="rounded-2xl border border-white/8 bg-white/[0.03] p-6"
            >
              <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl ${p.bg}`}>
                <p.icon className={`h-5 w-5 ${p.color}`} />
              </div>
              <p className="text-sm font-semibold text-white/50 mb-1">{p.label}</p>
              <p className={`text-xl font-bold mb-3 ${p.color}`}>{p.cost}</p>
              <p className="text-sm text-white/40 leading-relaxed">{p.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* The gap */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate={isInView ? "show" : "hidden"}
          className="rounded-2xl border border-white/10 bg-gradient-to-r from-brand-900/50 to-violet-900/30 p-8 text-center"
        >
          <p className="text-base font-semibold text-white/60 mb-2">The real problem</p>
          <p className="text-2xl font-bold text-white leading-relaxed">
            Owners want strategic guidance. They can't afford a retainer.
            <br />
            <span className="text-brand-400">The tools that exist don't fill the gap.</span>
          </p>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Section 3: Solution reveal ───────────────────────────────────────────────

function SolutionReveal() {
  const { ref, isInView } = useScrollReveal();
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [-40, 40]);

  return (
    <section
      ref={containerRef}
      className="relative overflow-hidden bg-gradient-to-b from-[#0a0a14] via-brand-950 to-[#0f0a1e] py-40 px-6"
    >
      {/* Background glow */}
      <motion.div
        style={{ y }}
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <div className="h-[600px] w-[600px] rounded-full bg-brand-600/20 blur-[100px]" />
      </motion.div>

      <div className="relative mx-auto max-w-4xl text-center" ref={ref}>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={isInView ? "show" : "hidden"}
        >
          <motion.div variants={fadeIn} className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-sm font-medium text-brand-300">
            <Sparkles className="h-3.5 w-3.5" />
            Introducing LocalPulse AI
          </motion.div>

          <motion.h2 variants={fadeUp} className="text-5xl font-extrabold tracking-tight text-white sm:text-6xl leading-[1.06]">
            What if you had a strategist
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-violet-300 to-brand-300">
              watching everything for you?
            </span>
          </motion.h2>

          <motion.p variants={fadeUp} className="mx-auto mt-8 max-w-2xl text-lg text-white/60 leading-relaxed">
            Not a content generator. Not a dashboard. A marketing strategist
            powered by AI that analyses your local market, watches your
            competitors, and gives you reasoning you can argue with.
          </motion.p>

          <motion.div
            variants={staggerFast}
            className="mx-auto mt-12 grid max-w-2xl grid-cols-3 gap-6"
          >
            {[
              { icon: Newspaper, label: "Weekly Brief", sub: "Every Monday morning" },
              { icon: MessageSquare, label: "Strategy Sessions", sub: "On demand, fast" },
              { icon: Users, label: "Competitor Watch", sub: "Your key competitors tracked" },
            ].map((item) => (
              <motion.div
                key={item.label}
                variants={scaleIn}
                className="flex flex-col items-center gap-2"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600/20 border border-brand-500/20">
                  <item.icon className="h-5 w-5 text-brand-400" />
                </div>
                <p className="text-sm font-semibold text-white">{item.label}</p>
                <p className="text-xs text-white/40">{item.sub}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Section 4: Feature — Weekly Brief ───────────────────────────────────────

const briefLines = [
  { type: "label", text: "MARKET READ · WEEK OF MAY 5, 2026" },
  { type: "body", text: "Local foot traffic is 8–12% below seasonal norms this week, consistent with post-long-weekend recovery patterns. Demand picks up by Wednesday across most business types." },
  { type: "spacer" },
  { type: "rec-label", text: "RECOMMENDATION #1" },
  { type: "rec", text: "Push Mother's Day promotions before Friday. Only one of your tracked competitors has activated. You have a first-mover window that closes Thursday." },
  { type: "spacer" },
  { type: "rec-label", text: "RECOMMENDATION #2" },
  { type: "rec", text: "Hold on promotional pricing this week. Several of your tracked competitors launched promos recently. Another offer erodes the signal and trains price sensitivity." },
  { type: "spacer" },
  { type: "label", text: "FROM YOUR COMPETITOR WATCH" },
  { type: "body", text: "Competitor A is running targeted Meta Ads, new behaviour for them. Competitor B is seeing their highest post engagement in months." },
];

function BriefFeature() {
  const { ref, isInView } = useScrollReveal();
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let i = 0;
    const t = setInterval(() => {
      i++;
      setVisibleLines(i);
      if (i >= briefLines.length) clearInterval(t);
    }, 180);
    return () => clearInterval(t);
  }, [isInView]);

  return (
    <section className="bg-white py-32 px-6">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-20 lg:grid-cols-2 lg:items-center">
          {/* Left: copy */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
          >
            <motion.div variants={fadeIn} className="mb-4 inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-1.5 text-sm font-semibold text-brand-700">
              <Newspaper className="h-3.5 w-3.5" />
              Feature 01: Weekly Brief
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl leading-[1.08]">
              Monday morning.
              <br />
              <span className="text-brand-600">Your market, read for you.</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-5 text-lg text-gray-600 leading-relaxed">
              Every Monday at 7am, a brief lands in your dashboard and inbox.
              Not a generic industry roundup. An analysis of your specific market,
              your specific competitors, and what it means for the week ahead.
            </motion.p>
            <motion.ul variants={staggerContainer} className="mt-8 space-y-3">
              {[
                "Calgary occasion & event context relevant to your business type",
                "Weather and demand signal analysis",
                "Named competitor activity with strategic implications",
                "One or two specific, evidence-backed recommendations",
                "What signals to watch as the week unfolds",
              ].map((item) => (
                <motion.li key={item} variants={fadeUp} className="flex items-start gap-3 text-sm text-gray-700">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  {item}
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>

          {/* Right: animated brief preview */}
          <motion.div
            variants={slideLeft}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
          >
            <div
              ref={ref}
              className="rounded-2xl border border-gray-200 bg-gray-50 p-2 shadow-xl"
            >
              {/* Browser chrome */}
              <div className="flex h-8 items-center gap-1.5 rounded-xl bg-white px-3 mb-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                <span className="ml-2 text-[10px] text-gray-400">app.localpulse.ai/brief</span>
              </div>
              <div className="rounded-xl bg-white p-5 min-h-[320px]">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-7 w-7 rounded-lg bg-brand-600 flex items-center justify-center">
                    <Zap className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">Weekly Strategic Brief</p>
                    <p className="text-[10px] text-gray-400">Week of May 5, 2026</p>
                  </div>
                  <div className="ml-auto flex h-5 items-center rounded-full bg-emerald-100 px-2 text-[10px] font-semibold text-emerald-700">
                    ● Live
                  </div>
                </div>
                <div className="space-y-1.5">
                  {briefLines.slice(0, visibleLines).map((line, i) => {
                    if (line.type === "spacer") return <div key={i} className="h-2" />;
                    if (line.type === "label") return (
                      <motion.p key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[9px] font-bold uppercase tracking-widest text-brand-500 mt-2">
                        {line.text}
                      </motion.p>
                    );
                    if (line.type === "rec-label") return (
                      <motion.p key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[9px] font-bold uppercase tracking-widest text-amber-600">
                        {line.text}
                      </motion.p>
                    );
                    if (line.type === "rec") return (
                      <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="rounded-lg bg-amber-50 px-3 py-2">
                        <p className="text-[11px] text-gray-700 leading-relaxed">{line.text}</p>
                      </motion.div>
                    );
                    return (
                      <motion.p key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[11px] text-gray-600 leading-relaxed">
                        {line.text}
                      </motion.p>
                    );
                  })}
                  {visibleLines < briefLines.length && isInView && (
                    <motion.span
                      animate={{ opacity: [1, 0, 1] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                      className="inline-block h-3 w-0.5 bg-brand-500 ml-0.5"
                    />
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─── Section 5: Feature — Strategy Session ────────────────────────────────────

const chatMessages = [
  { role: "user", text: "Should I run a 30% off lunch promo for two weeks?" },
  { role: "ai", text: "You're asking whether a temporary deep discount on lunch makes sense right now." },
  { role: "ai-context", text: "Multiple tracked competitors already running lunch promos · Mother's Day approaching · Lunch demand below seasonal norm" },
  { role: "ai-rec", text: "Hold on the 30% discount. The volume lift required to hold net revenue flat is unlikely against current demand. More importantly, several competitors already own this space. A further offer trains price sensitivity without any differentiation." },
  { role: "ai-alt", title: "Better alternative", text: "A value-add offer (free dessert, complimentary coffee) protects margin and creates a differentiator without signalling discounting." },
];

function SessionFeature() {
  const { ref, isInView } = useScrollReveal();
  const [visibleMessages, setVisibleMessages] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let i = 0;
    const t = setInterval(() => {
      i++;
      setVisibleMessages(i);
      if (i >= chatMessages.length) clearInterval(t);
    }, 700);
    return () => clearInterval(t);
  }, [isInView]);

  return (
    <section className="bg-gray-950 py-32 px-6">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-20 lg:grid-cols-2 lg:items-center">
          {/* Left: animated chat */}
          <motion.div
            variants={slideRight}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
          >
            <div ref={ref} className="rounded-2xl bg-[#0f0f1a] border border-white/8 overflow-hidden">
              {/* Header */}
              <div className="flex items-center gap-2.5 border-b border-white/8 px-5 py-3.5">
                <div className="h-7 w-7 rounded-full bg-brand-600 flex items-center justify-center">
                  <Zap className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">Strategy Session</p>
                  <p className="text-[10px] text-white/40">Specialist AI agents, each built for a different marketing lens</p>
                </div>
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>

              {/* Messages */}
              <div className="space-y-3 p-5 min-h-[340px]">
                {chatMessages.slice(0, visibleMessages).map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    {msg.role === "user" && (
                      <div className="flex justify-end">
                        <div className="max-w-[78%] rounded-2xl rounded-tr-sm bg-brand-600 px-4 py-2.5 text-xs text-white">
                          {msg.text}
                        </div>
                      </div>
                    )}
                    {msg.role === "ai" && (
                      <div className="max-w-[78%] rounded-2xl rounded-tl-sm bg-white/5 px-4 py-2.5 text-xs text-white/70">
                        {msg.text}
                      </div>
                    )}
                    {msg.role === "ai-context" && (
                      <div className="flex flex-wrap gap-1.5">
                        {msg.text.split(" · ").map((tag) => (
                          <span key={tag} className="rounded-full bg-brand-900/50 border border-brand-700/30 px-2.5 py-1 text-[10px] font-medium text-brand-300">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    {msg.role === "ai-rec" && (
                      <div className="rounded-xl border border-white/10 bg-white/5 p-3.5">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-amber-400 mb-1.5">Recommendation</p>
                        <p className="text-xs text-white/75 leading-relaxed">{msg.text}</p>
                      </div>
                    )}
                    {msg.role === "ai-alt" && (
                      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-400 mb-1.5">{msg.title}</p>
                        <p className="text-xs text-white/65 leading-relaxed">{msg.text}</p>
                      </div>
                    )}
                  </motion.div>
                ))}
                {visibleMessages < chatMessages.length && isInView && (
                  <div className="flex gap-1.5 px-1">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                        className="h-1.5 w-1.5 rounded-full bg-white/40"
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Right: copy */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
          >
            <motion.div variants={fadeIn} className="mb-4 inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-4 py-1.5 text-sm font-semibold text-amber-400">
              <MessageSquare className="h-3.5 w-3.5" />
              Feature 02: Strategy Session
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl leading-[1.08]">
              Ask the question
              <br />
              <span className="text-amber-400">you've been sitting on.</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-5 text-lg text-white/55 leading-relaxed">
              Every strategic question a business owner faces: should I run this promo,
              is this the right time, how do I respond to that competitor. Each one gets a real
              analysis that cuts straight to what matters.
            </motion.p>
            <motion.ul variants={staggerContainer} className="mt-8 space-y-3">
              {[
                "Full market context pulled in automatically",
                "All your tracked competitors checked before every response",
                "Recommendation with the reasoning shown, not a verdict",
                "Ranked alternatives when your original idea has issues",
                "Follow-up questions preserve full session context",
              ].map((item) => (
                <motion.li key={item} variants={fadeUp} className="flex items-start gap-3 text-sm text-white/65">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                  {item}
                </motion.li>
              ))}
            </motion.ul>
            <motion.p variants={fadeUp} className="mt-6 rounded-xl border border-white/8 bg-white/5 px-4 py-3 text-sm font-semibold text-white/60 italic">
              "This is the feature that carries the USP. If this is excellent,
              the rest of the product can be modest and the business works."
              <span className="not-italic font-normal text-white/30 block mt-1">Product brief, April 2026</span>
            </motion.p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─── Section 6: Feature — Competitor Analyzer ────────────────────────────────

function CompetitorFeature() {
  const competitors = [
    { name: "Wurst", dist: "0.3 km", trend: "up", signal: "New lunch special, high engagement", severity: "warn" },
    { name: "Vin Room", dist: "0.4 km", trend: "up", signal: "Running Meta Ads for dinner-for-two", severity: "alert" },
    { name: "OEB", dist: "0.8 km", trend: "up", signal: "Review velocity spike this week", severity: "info" },
    { name: "The Main Dish", dist: "0.2 km", trend: "stable", signal: "No meaningful activity this cycle", severity: "ok" },
    { name: "Hankki", dist: "0.5 km", trend: "down", signal: "Service complaints rising in reviews", severity: "ok" },
  ];

  return (
    <section className="bg-white py-32 px-6">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-20 lg:grid-cols-2 lg:items-center">
          {/* Left: copy */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
          >
            <motion.div variants={fadeIn} className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-sm font-semibold text-emerald-700">
              <Users className="h-3.5 w-3.5" />
              Feature 03: Competitor Analyzer
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl leading-[1.08]">
              You focus on running
              <br />
              <span className="text-emerald-600">your business.</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-5 text-lg text-gray-600 leading-relaxed">
              We watch your key competitors across Instagram, Google Reviews,
              Facebook, and Meta Ads on a continuous cadence. You get strategic
              reads on what they're doing and what it means for you.
            </motion.p>
            <motion.div variants={staggerContainer} className="mt-8 grid grid-cols-2 gap-4">
              {[
                { label: "Instagram", cadence: "Weekly" },
                { label: "Google Reviews", cadence: "Bi-weekly" },
                { label: "Meta Ads Library", cadence: "Weekly" },
                { label: "Google Business", cadence: "Monthly" },
              ].map((src) => (
                <motion.div
                  key={src.label}
                  variants={scaleIn}
                  className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"
                >
                  <p className="text-xs font-semibold text-gray-900">{src.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Scraped {src.cadence}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right: competitor cards */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            className="space-y-2.5"
          >
            {competitors.map((c, i) => (
              <motion.div
                key={c.name}
                variants={slideLeft}
                transition={{ delay: i * 0.08 }}
                whileHover={{ x: 4, transition: { duration: 0.2 } }}
                className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-700">
                  {c.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-gray-900">{c.name}</span>
                    <span className="text-xs text-gray-400">{c.dist}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{c.signal}</p>
                </div>
                <div className={`h-2 w-2 shrink-0 rounded-full ${
                  c.severity === "alert" ? "bg-amber-500" :
                  c.severity === "warn" ? "bg-yellow-400" :
                  c.severity === "info" ? "bg-blue-400" :
                  "bg-gray-200"
                }`} />
              </motion.div>
            ))}
            {/* Cross-pattern pill */}
            <motion.div
              variants={scaleIn}
              className="rounded-xl bg-brand-50 border border-brand-100 p-4"
            >
              <p className="text-xs font-bold text-brand-700 mb-1">Cross-competitor pattern</p>
              <p className="text-xs text-gray-700 leading-relaxed">
                Most tracked competitors running lunch promos simultaneously. The space is saturated and any additional offer would dilute.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─── Section 7: How it works ──────────────────────────────────────────────────

function HowItWorks() {
  const steps = [
    {
      num: "01",
      title: "Quick onboarding",
      desc: "Tell us about your business, your cost structure, and your goals. Competitor Discovery finds and ranks your most relevant local competitors automatically.",
      icon: Target,
      color: "brand",
    },
    {
      num: "02",
      title: "We start watching",
      desc: "LocalPulse begins scraping your competitors, tracking Calgary's occasion calendar, and building your local market baseline. Your first brief arrives Monday.",
      icon: Eye,
      color: "amber",
    },
    {
      num: "03",
      title: "Strategy, on demand",
      desc: "Every Monday you get a brief. Anytime you face a decision, you get a session. Friday check-ins feed into the next Monday's analysis.",
      icon: Zap,
      color: "emerald",
    },
  ];

  return (
    <section className="bg-gray-50 py-32 px-6">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerContainer}
          className="text-center mb-20"
        >
          <motion.div variants={fadeIn} className="mb-4 inline-flex items-center gap-2 rounded-full bg-gray-200 px-4 py-1.5 text-sm font-medium text-gray-600">
            How it works
          </motion.div>
          <motion.h2 variants={fadeUp} className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
            Up and running in minutes.
            <br />
            <span className="text-brand-600">Value from the first Monday.</span>
          </motion.h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerContainer}
          className="grid gap-6 md:grid-cols-3"
        >
          {steps.map((step) => (
            <motion.div
              key={step.num}
              variants={scaleIn}
              whileHover={{ y: -6, transition: { duration: 0.25 } }}
              className="relative rounded-2xl bg-white p-7 shadow-sm border border-gray-100"
            >
              <div className="mb-5 flex items-center gap-3">
                <span className="text-5xl font-black text-gray-100">{step.num}</span>
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                  step.color === "brand" ? "bg-brand-100" :
                  step.color === "amber" ? "bg-amber-100" : "bg-emerald-100"
                }`}>
                  <step.icon className={`h-4 w-4 ${
                    step.color === "brand" ? "text-brand-600" :
                    step.color === "amber" ? "text-amber-600" : "text-emerald-600"
                  }`} />
                </div>
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">{step.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ─── Section 8: Calgary-specific ─────────────────────────────────────────────

function LocalMarketSection() {
  const occasions = [
    { label: "Mother's Day", date: "2nd Sun in May", signal: "critical", desc: "Largest reservation-driven occasion of the year. Businesses who activate early capture demand before competitors lock in." },
    { label: "Back to School", date: "Late Aug – Sep", signal: "high", desc: "Strong demand surge for retail, services, and food operators near family neighbourhoods. Timing the offer matters." },
    { label: "Black Friday", date: "Late November", signal: "critical", desc: "Highest-traffic retail period of the year. Promo saturation is the real risk. Differentiation beats discounting." },
    { label: "Valentine's Day", date: "Feb 14", signal: "high", desc: "Second-largest occasion for hospitality and gifting verticals. First-mover advantage closes 2 weeks out." },
  ];

  return (
    <section className="bg-[#0a0a14] py-32 px-6 overflow-hidden">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeIn} className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-1.5 text-sm font-medium text-white/50">
              <Calendar className="h-3.5 w-3.5" />
              Hyper-local market intelligence
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl leading-[1.08]">
              Built for your market.
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-300">
                Not built for "everywhere."
              </span>
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-5 text-lg text-white/55 leading-relaxed">
              Generic insights are commodity. LocalPulse knows the occasions that
              move demand in your area, your competitors' patterns, and what it all
              means for your specific business. Over 200 occasions tagged with
              niche relevance, lead times, and historical demand signals.
            </motion.p>
            <motion.div variants={staggerContainer} className="mt-8 flex flex-wrap gap-2">
              {["Mother's Day", "Black Friday", "Valentine's Day", "Back to School", "Summer peak", "Holiday season", "New Year rush", "Long weekends", "Local festivals"].map((tag) => (
                <motion.span
                  key={tag}
                  variants={scaleIn}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/60"
                >
                  {tag}
                </motion.span>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={staggerContainer}
            className="space-y-3"
          >
            {occasions.map((occ, i) => (
              <motion.div
                key={occ.label}
                variants={slideLeft}
                transition={{ delay: i * 0.1 }}
                className="rounded-xl border border-white/8 bg-white/[0.03] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-white">{occ.label}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        occ.signal === "critical" ? "bg-amber-500/20 text-amber-400" : "bg-brand-500/20 text-brand-400"
                      }`}>
                        {occ.signal}
                      </span>
                    </div>
                    <p className="text-xs text-white/40 mb-1.5">{occ.date}</p>
                    <p className="text-xs text-white/55 leading-relaxed">{occ.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─── Section 9: Pricing ───────────────────────────────────────────────────────

function Pricing() {
  const { ref, isInView } = useScrollReveal();

  const includes = [
    "Weekly Strategic Brief, every Monday at 7am",
    "Unlimited Strategy Sessions",
    "Competitor tracking across platforms",
    "Competitor Discovery during onboarding",
    "Local occasion calendar",
    "Friday check-in during pilot",
    "Full session and brief history",
    "Data export anytime",
  ];

  return (
    <section className="bg-white py-32 px-6">
      <div className="mx-auto max-w-5xl" ref={ref}>
        <motion.div
          initial="hidden"
          animate={isInView ? "show" : "hidden"}
          variants={staggerContainer}
          className="text-center mb-16"
        >
          <motion.div variants={fadeIn} className="mb-4 inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-1.5 text-sm font-semibold text-amber-700">
            <Lock className="h-3.5 w-3.5" />
            Founding member pricing
          </motion.div>
          <motion.h2 variants={fadeUp} className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
            Simple pricing.
            <br />
            <span className="text-brand-600">Locked for 12 months.</span>
          </motion.h2>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-2 items-start">
          {/* Card */}
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
            transition={{ duration: 0.8, ease: "easeOut" as const }}
            className="rounded-3xl bg-gradient-to-b from-brand-600 to-brand-800 p-8 text-white shadow-2xl shadow-brand-600/30"
          >
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
              Founding Member Rate
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-6xl font-black">$149</span>
              <div>
                <span className="text-lg text-brand-200">/month</span>
                <p className="text-sm text-brand-300 line-through">$299</p>
              </div>
            </div>
            <p className="mt-2 text-sm text-brand-200">
              Rate locked for 12 months. Standard rate $299/month after pilot.
            </p>

            <ul className="mt-8 space-y-3">
              {includes.map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-brand-100">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-300" />
                  {item}
                </li>
              ))}
            </ul>

            <motion.div className="mt-8" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 rounded-2xl bg-amber-500 py-4 text-base font-bold text-white shadow-lg shadow-amber-500/30 hover:bg-amber-400 transition-colors"
              >
                Apply as Founding Member
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
            <p className="mt-3 text-center text-xs text-brand-300">
              Credit card on file at signup · Cancel anytime
            </p>
          </motion.div>

          {/* Right column */}
          <motion.div
            initial="hidden"
            animate={isInView ? "show" : "hidden"}
            variants={staggerContainer}
            className="space-y-5"
          >
            <motion.div variants={fadeUp} className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
              <p className="text-sm font-bold text-gray-900 mb-2">Why founding member pricing?</p>
              <p className="text-sm text-gray-600 leading-relaxed">
                The first 12 owners aren't just customers. They're shaping the product.
                Their feedback, their sessions, and their outcomes directly improve LocalPulse
                for everyone who comes after. The lower rate is recognition of that.
              </p>
            </motion.div>

            <motion.div variants={fadeUp} className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
              <p className="text-sm font-bold text-gray-900 mb-3">What founding members commit to</p>
              <ul className="space-y-2">
                {[
                  "Weekly engagement, logging in unprompted",
                  "Acting on at least one recommendation",
                  "Friday check-in replies during pilot",
                  "Honest feedback on what's working and what isn't",
                ].map((c) => (
                  <li key={c} className="flex gap-2 text-sm text-gray-600">
                    <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                    {c}
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div variants={fadeUp} className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
              <div className="flex items-start gap-3">
                <Star className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <div>
                  <p className="text-sm font-bold text-amber-900 mb-1">Limited to 12 founding members per market</p>
                  <p className="text-sm text-amber-800 leading-relaxed">
                    Founding members only. The concentrated pilot is deliberate —
                    dense data per market is the product's early moat.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─── Section 10: Final CTA ────────────────────────────────────────────────────

function FinalCTA() {
  const { ref, isInView } = useScrollReveal();

  return (
    <section className="relative overflow-hidden bg-[#080812] py-40 px-6">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.35, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-700 blur-[100px]"
        />
      </div>

      <div className="relative mx-auto max-w-3xl text-center" ref={ref}>
        <motion.div
          initial="hidden"
          animate={isInView ? "show" : "hidden"}
          variants={staggerContainer}
        >
          <motion.p variants={fadeIn} className="mb-6 text-sm font-semibold uppercase tracking-widest text-brand-400">
            The offer
          </motion.p>
          <motion.h2 variants={fadeUp} className="text-5xl font-extrabold tracking-tight text-white sm:text-6xl leading-[1.06]">
            Stop making marketing
            decisions alone.
          </motion.h2>
          <motion.p variants={fadeUp} className="mx-auto mt-6 max-w-xl text-lg text-white/50 leading-relaxed">
            LocalPulse is built for one thing: giving independent local business owners
            the strategic guidance they've never had access to.
            At a price that makes sense.
          </motion.p>

          <motion.div variants={scaleIn} className="mt-12">
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Link
                href="/login"
                className="inline-flex items-center gap-3 rounded-2xl bg-amber-500 px-10 py-5 text-lg font-bold text-white shadow-2xl shadow-amber-500/30 hover:bg-amber-400 transition-colors"
              >
                Apply as a Founding Member
                <ArrowRight className="h-5 w-5" />
              </Link>
            </motion.div>
            <p className="mt-4 text-sm text-white/30">
              $149/month · Founding members only · 12 spots per market
            </p>
          </motion.div>

          {/* Trust row */}
          <motion.div
            variants={staggerFast}
            className="mx-auto mt-16 flex flex-wrap justify-center gap-6"
          >
            {[
              { icon: Lock, text: "No POS or banking access. Ever." },
              { icon: CheckCircle2, text: "Cancel anytime." },
              { icon: Star, text: "Price locked 12 months." },
            ].map((item) => (
              <motion.div
                key={item.text}
                variants={fadeIn}
                className="flex items-center gap-2 text-sm text-white/40"
              >
                <item.icon className="h-4 w-4 text-white/20" />
                {item.text}
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t border-white/5 bg-[#080812] py-8 px-6">
      <div className="mx-auto max-w-6xl flex items-center justify-between text-sm text-white/25">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-600">
            <Zap className="h-3 w-3 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-semibold text-white/50">LocalPulse AI</span>
        </div>
        <p>© 2026 LocalPulse AI · Privacy Policy</p>
      </div>
    </footer>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <main className="overflow-x-hidden">
      <Navbar />
      <HeroSection />
      <ProblemSection />
      <SolutionReveal />
      <BriefFeature />
      <SessionFeature />
      <CompetitorFeature />
      <HowItWorks />
      <LocalMarketSection />
      <Pricing />
      <FinalCTA />
      <Footer />
    </main>
  );
}
