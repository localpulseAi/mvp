"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion, useScroll, useSpring } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";

const links = [
  { label: "See it in action", href: "#try-it" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Pilot", href: "#pilot" },
];

function ReadingProgress() {
  const { scrollYProgress } = useScroll();
  const reduced = useReducedMotion();
  const smooth = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  return (
    <motion.div
      aria-hidden="true"
      className="fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-brand-600"
      style={{ scaleX: reduced ? scrollYProgress : smooth }}
    />
  );
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggle.current?.focus();
      }
    };
    const mq = window.matchMedia("(min-width: 768px)");
    const onMq = () => mq.matches && setOpen(false);
    window.addEventListener("keydown", onKey);
    mq.addEventListener("change", onMq);
    return () => {
      window.removeEventListener("keydown", onKey);
      mq.removeEventListener("change", onMq);
    };
  }, [open]);

  return (
    <>
      <ReadingProgress />
      <a
        href="#main"
        className="sr-only z-[70] rounded-control bg-ink px-4 py-2 text-sm font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <header
        className={cn(
          "sticky top-0 z-50 border-b transition-colors duration-300",
          scrolled || open ? "border-gray-200/70 bg-canvas/90 backdrop-blur-lg" : "border-gray-200/50 bg-canvas"
        )}
      >
        <div className="site-container flex h-[72px] items-center justify-between lg:h-[88px]">
          <Link href="/" aria-label="Agenzy home">
            <Logo height={40} priority />
          </Link>

          <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation">
            {links.map((l) => (
              <a key={l.href} href={l.href} className="text-sm font-medium text-ink transition-colors hover:text-brand-600">
                {l.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3 sm:gap-5">
            <Link href="/login" className="hidden text-sm font-medium text-ink hover:text-brand-600 sm:inline">
              Sign in
            </Link>
            <Link href="/dashboard" className="btn-primary min-h-[44px] rounded-lg px-5 text-sm">
              Explore the demo
            </Link>
            <button
              ref={toggle}
              className="btn-ghost -mr-2 md:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Close navigation" : "Open navigation"}
              aria-expanded={open}
              aria-controls="mobile-nav"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {open && (
            <motion.nav
              id="mobile-nav"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden border-t border-gray-200/70 md:hidden"
              aria-label="Mobile navigation"
            >
              <div className="space-y-1 px-4 py-4">
                {[...links, { label: "Sign in", href: "/login" }].map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-control px-3 py-3 text-base font-medium text-ink hover:bg-lilac"
                  >
                    {l.label}
                  </a>
                ))}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
