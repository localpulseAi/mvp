"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { BusinessCard, Core, Insights, SourceChip, analystOffset } from "./Nodes";
import { MoveCard } from "./MoveCard";
import { Spark } from "../Spark";
import { ANALYSTS, BUSINESS_ICON, SOURCES, SPEAK, type StepIndex } from "./steps";

type Pt = { x: number; y: number };

/**
 * A connection belongs to exactly one phase and is only drawn while that
 * phase plays, so each step shows its own flow:
 *   1 Gather   sources + your context → core
 *   2 Analyse  core ⇄ each specialist
 *   3 Insight  specialists → insight cards
 *   4 Act      insight → your next move
 */
type Link = {
  id: string;
  d: string;
  phase: 1 | 2 | 3 | 4;
  order: number;
  /** Also send packets back along the path (core ⇄ analyst). */
  twoWay?: boolean;
  /** Icon "envelope" carried along the path instead of a plain dot. */
  icon?: LucideIcon | "spark";
};

const PHASE_STYLE: Record<Link["phase"], { stroke: string; width: number; dash: string; packet: string }> = {
  1: { stroke: "#C3AEF5", width: 1.5, dash: "4 5", packet: "bg-brand-600 shadow-[0_0_0_4px_rgba(104,64,222,0.18)]" },
  2: { stroke: "#9F82EC", width: 2, dash: "0", packet: "bg-brand-600 shadow-[0_0_0_4px_rgba(104,64,222,0.18)]" },
  3: { stroke: "#C5E25E", width: 2, dash: "0", packet: "bg-lime-300 ring-2 ring-ink" },
  4: { stroke: "#A9C83F", width: 2.5, dash: "0", packet: "bg-lime-300 ring-2 ring-ink" },
};

/** How long each phase spends on one packet trip (s) and the gap between sources. */
const PHASE_TIMING: Record<Link["phase"], { trip: number; stagger: number; start: number }> = {
  1: { trip: 1.3, stagger: 0.55, start: 0.5 },
  2: { trip: 0.8, stagger: 0.12, start: 0.9 },
  3: { trip: 0.9, stagger: 0.1, start: 0.4 },
  4: { trip: 1.0, stagger: 0, start: 0.2 },
};

function rectIn(el: Element, stage: DOMRect) {
  const r = el.getBoundingClientRect();
  return { x: r.left - stage.left, y: r.top - stage.top, w: r.width, h: r.height };
}
function center(el: Element, stage: DOMRect): Pt {
  const r = rectIn(el, stage);
  return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
}

/** Smooth curve; bends horizontally on wide layouts, vertically when stacked. */
function curve(a: Pt, b: Pt): string {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  if (Math.abs(dx) >= Math.abs(dy)) {
    const m = dx / 2;
    return `M ${a.x} ${a.y} C ${a.x + m} ${a.y}, ${b.x - m} ${b.y}, ${b.x} ${b.y}`;
  }
  const m = dy / 2;
  return `M ${a.x} ${a.y} C ${a.x} ${a.y + m}, ${b.x} ${b.y - m}, ${b.x} ${b.y}`;
}
const straight = (a: Pt, b: Pt) => `M ${a.x} ${a.y} L ${b.x} ${b.y}`;

/** A dot — or a little icon envelope — that rides along a path via CSS offset-path. */
function Packet({
  d, delay, trip, className, reverse, icon: Icon,
}: { d: string; delay: number; trip: number; className: string; reverse?: boolean; icon?: LucideIcon | "spark" }) {
  const envelope = Icon && Icon !== "spark";
  return (
    <motion.span
      className={`pointer-events-none absolute left-0 top-0 z-[5] flex items-center justify-center rounded-full ${
        envelope ? "h-6 w-6 border border-brand-200 bg-white shadow-md" : Icon === "spark" ? "h-4 w-4" : `h-2.5 w-2.5 ${className}`
      }`}
      style={{ offsetPath: `path("${d}")`, offsetRotate: "0deg" }}
      initial={{ offsetDistance: reverse ? "100%" : "0%", opacity: 0 }}
      animate={{
        offsetDistance: reverse ? ["100%", "0%"] : ["0%", "100%"],
        opacity: [0, 1, 1, 0],
        scale: envelope ? [0.6, 1, 1, 0.5] : 1,
        rotate: Icon === "spark" ? [0, 180] : 0,
      }}
      transition={{ duration: trip, delay, repeat: Infinity, repeatDelay: trip * 0.6, ease: "easeInOut" as const }}
    >
      {envelope && <Icon className="h-3 w-3 text-brand-600" />}
      {Icon === "spark" && <Spark className="h-4 w-4 text-lime-500" />}
    </motion.span>
  );
}

/** Counts how many specialists have "reported in" during the Analyse step. */
function useSpoken(active: boolean, reduced: boolean) {
  const [spoken, setSpoken] = useState(0);
  useEffect(() => {
    if (!active) return setSpoken(0);
    if (reduced) return setSpoken(ANALYSTS.length);
    const timers = ANALYSTS.map((_, i) => setTimeout(() => setSpoken(i + 1), (SPEAK.first + i * SPEAK.gap) * 1000));
    return () => timers.forEach(clearTimeout);
  }, [active, reduced]);
  return spoken;
}

export function Stage({ step }: { step: StepIndex }) {
  const reduced = useReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const bizRef = useRef<HTMLDivElement>(null);
  const coreRef = useRef<HTMLDivElement>(null);
  const insightRef = useRef<HTMLDivElement>(null);
  const moveRef = useRef<HTMLDivElement>(null);
  const srcRefs = useRef<(HTMLDivElement | null)[]>([]);
  const colRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [compact, setCompact] = useState(false);
  const [cameraY, setCameraY] = useState(0);
  const spoken = useSpoken(step === 2, !!reduced);

  const measure = useCallback(() => {
    const stage = stageRef.current;
    if (!stage || !coreRef.current || !bizRef.current || !moveRef.current || !insightRef.current) return;
    const s = stage.getBoundingClientRect();
    const core = center(coreRef.current, s);
    const ins = rectIn(insightRef.current, s);
    const insTop = { x: ins.x + ins.w / 2, y: ins.y + 6 };
    const insCenter = { x: ins.x + ins.w / 2, y: ins.y + ins.h / 2 };
    const analysts = ANALYSTS.map((_, i) => {
      const o = analystOffset(i);
      return { x: core.x + o.x, y: core.y + o.y };
    });

    const next: Link[] = [{ id: "biz", d: curve(center(bizRef.current, s), core), phase: 1, order: 0, icon: BUSINESS_ICON }];
    srcRefs.current.forEach((el, i) => {
      if (el) next.push({ id: `src-${i}`, d: curve(center(el, s), core), phase: 1, order: i + 1, icon: SOURCES[i].icon });
    });
    analysts.forEach((p, i) => next.push({ id: `an-${i}`, d: straight(core, p), phase: 2, order: i, twoWay: true }));
    analysts.forEach((p, i) => next.push({ id: `ins-${i}`, d: curve(p, insTop), phase: 3, order: i, icon: "spark" }));
    next.push({ id: "out", d: curve(insCenter, center(moveRef.current, s)), phase: 4, order: 0, icon: "spark" });

    setLinks(next);
    setSize({ w: s.width, h: s.height });
    setCompact(window.matchMedia("(max-width: 1023px)").matches);
  }, []);

  useLayoutEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (stageRef.current) ro.observe(stageRef.current);
    return () => ro.disconnect();
  }, [measure]);

  // Mobile "camera": a fixed window that pans to the part of the story in focus.
  useLayoutEffect(() => {
    const vp = viewportRef.current;
    const content = stageRef.current;
    if (!compact || !vp || !content) return setCameraY(0);
    const focus = colRefs.current[step === 0 ? 0 : step <= 3 ? 1 : 2];
    if (!focus) return;
    // Gather: frame the sources above with Pip low in the window, so both are visible.
    const target =
      step === 1
        ? focus.offsetTop + 160 - vp.clientHeight * 0.74
        : focus.offsetTop + focus.offsetHeight / 2 - vp.clientHeight / 2;
    setCameraY(Math.max(0, Math.min(target, content.offsetHeight - vp.clientHeight)));
  }, [step, compact, size]);

  const live = links.filter((l) => l.phase === step);

  return (
    <div
      ref={viewportRef}
      className="relative h-[540px] overflow-hidden rounded-[24px] border border-gray-200 bg-white lg:h-auto"
      style={{ backgroundImage: "radial-gradient(#E6E1F0 1px, transparent 1px)", backgroundSize: "18px 18px" }}
    >
      <motion.div
        ref={stageRef}
        animate={{ y: -cameraY }}
        transition={{ type: "spring", stiffness: 120, damping: 24 }}
        className="relative grid grid-cols-1 gap-8 p-5 sm:p-8 lg:grid-cols-[0.95fr_1.25fr_1fr] lg:items-center lg:gap-10 lg:p-10"
      >
        {/* Connections — only the current phase is drawn */}
        <svg className="pointer-events-none absolute inset-0 z-0" width={size.w} height={size.h} aria-hidden="true">
          {links.map((l) => {
            const on = l.phase === step;
            const st = PHASE_STYLE[l.phase];
            const t = PHASE_TIMING[l.phase];
            return (
              <motion.path
                key={l.id}
                d={l.d}
                fill="none"
                stroke={st.stroke}
                strokeWidth={st.width}
                strokeDasharray={st.dash}
                strokeLinecap="round"
                initial={false}
                animate={{ pathLength: on ? 1 : 0, opacity: on ? 1 : 0 }}
                transition={{
                  pathLength: { duration: reduced ? 0 : on ? 0.6 : 0.3, delay: on && !reduced ? t.start - 0.3 + l.order * t.stagger : 0 },
                  opacity: { duration: 0.3 },
                }}
              />
            );
          })}
        </svg>
        {!reduced &&
          live.flatMap((l) => {
            const st = PHASE_STYLE[l.phase];
            const t = PHASE_TIMING[l.phase];
            const delay = t.start + l.order * t.stagger;
            const out = [<Packet key={`${l.id}-${step}`} d={l.d} delay={delay} trip={t.trip} className={st.packet} icon={l.icon} />];
            if (l.twoWay)
              out.push(
                <Packet key={`${l.id}-${step}-back`} d={l.d} delay={delay + t.trip * 0.8} trip={t.trip} reverse className="bg-lime-300 ring-2 ring-ink" />
              );
            return out;
          })}

        {/* Column 1 — you + sources */}
        <div ref={(el) => { colRefs.current[0] = el; }} className="relative z-10 space-y-4">
          <BusinessCard ref={bizRef} step={step} />
          <div className="grid grid-cols-2 gap-2">
            {SOURCES.map((s, i) => (
              <SourceChip
                key={s.id}
                index={i}
                step={step}
                ref={(el) => {
                  srcRefs.current[i] = el;
                }}
              />
            ))}
          </div>
        </div>

        {/* Column 2 — Agenzy thinking */}
        <div ref={(el) => { colRefs.current[1] = el; }} className="relative z-10 space-y-2">
          <Core ref={coreRef} step={step} spoken={spoken} />
          <Insights ref={insightRef} step={step} spoken={spoken} />
        </div>

        {/* Column 3 — the answer */}
        <div ref={(el) => { colRefs.current[2] = el; }} className="relative z-10">
          <MoveCard ref={moveRef} step={step} />
        </div>
      </motion.div>

      {/* Soft edges hint there is more above/below on small screens */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-white to-transparent lg:hidden" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent lg:hidden" />
    </div>
  );
}
