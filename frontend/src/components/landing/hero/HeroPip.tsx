"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Spark } from "../Spark";
import { usePip3D } from "@/lib/pip";

/**
 * Pip perched on the top edge of the hero sample brief, giving a thumbs-up.
 * Drops in after the card, bobs, and cheers each time the sample changes.
 */
export function HeroPip({ sample, cheer }: { sample: string; cheer: string }) {
  const reduced = !!useReducedMotion();
  const pip3d = usePip3D();
  const [showCheer, setShowCheer] = useState(false);
  const first = useRef(true);

  useEffect(() => {
    // First cheer after the drop-in, then on every sample change.
    const delay = first.current ? 1900 : 250;
    first.current = false;
    const on = setTimeout(() => setShowCheer(true), delay);
    const off = setTimeout(() => setShowCheer(false), delay + 2400);
    return () => {
      clearTimeout(on);
      clearTimeout(off);
      setShowCheer(false);
    };
  }, [sample]);

  // The 3D guide stands here instead on wide screens.
  if (pip3d) return null;

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none absolute bottom-[calc(100%-14px)] right-5 z-30 w-[78px] sm:right-8 sm:w-[96px] lg:w-[112px]"
      initial={reduced ? false : { y: -140, opacity: 0, rotate: -12 }}
      animate={{ y: 0, opacity: 1, rotate: 0 }}
      transition={{ delay: 1.1, type: "spring", stiffness: 260, damping: 14 }}
    >
      {/* Speech bubble */}
      <AnimatePresence>
        {showCheer && (
          <motion.span
            key={cheer}
            className="absolute right-[86%] top-1 whitespace-nowrap rounded-2xl rounded-br-sm bg-ink px-3 py-1.5 font-fun text-sm font-medium text-white shadow-lift"
            initial={{ opacity: 0, scale: 0.4, x: 12, y: 8 }}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, scale: 0.6, y: -6 }}
            transition={{ type: "spring", stiffness: 420, damping: 20 }}
            style={{ originX: 1, originY: 1 }}
          >
            {cheer}
          </motion.span>
        )}
      </AnimatePresence>

      {/* Sparkles by the thumb on each cheer */}
      <AnimatePresence>
        {showCheer && !reduced &&
          [
            { x: -14, y: -6, s: "h-3.5 w-3.5 text-lime-400", d: 0 },
            { x: 4, y: -18, s: "h-2.5 w-2.5 text-brand-400", d: 0.08 },
            { x: -24, y: 14, s: "h-2 w-2 text-lime-400", d: 0.16 },
          ].map((p, i) => (
            <motion.span
              key={`${cheer}-${i}`}
              className={`absolute left-[12%] top-[38%] ${p.s}`}
              initial={{ scale: 0, opacity: 0, x: 0, y: 0 }}
              animate={{ scale: [0, 1.3, 0], opacity: [0, 1, 0], x: p.x, y: p.y, rotate: 90 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9, delay: p.d }}
            >
              <Spark className="h-full w-full text-current" />
            </motion.span>
          ))}
      </AnimatePresence>

      {/* Hop on cheer, gentle bob otherwise */}
      <motion.div
        key={sample}
        style={{ originY: 1 }}
        initial={reduced ? false : { y: 0, scaleY: 1 }}
        animate={reduced ? {} : { y: [0, -14, 0, -5, 0], scaleY: [1, 1.04, 0.94, 1.02, 1] }}
        transition={{ duration: 0.8, delay: 0.15 }}
      >
        <motion.div
          animate={reduced ? {} : { y: [0, -3, 0], rotate: [0, -2, 2, 0] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" as const, delay: 2 }}
        >
          <Image
            src="/mascots/pip-thumbs-up.png"
            alt=""
            width={184}
            height={184}
            className="h-auto w-full drop-shadow-[0_10px_14px_rgba(55,33,100,0.25)]"
          />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
