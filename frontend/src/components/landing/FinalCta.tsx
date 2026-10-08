"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Spark } from "./Spark";
import { fadeUp, reveal, stagger } from "./motion";

export function FinalCta() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          {...reveal}
          variants={stagger}
          className="card-lilac relative overflow-hidden px-6 py-14 text-center sm:px-12 sm:py-20"
        >
          <Spark className="absolute left-[12%] top-10 h-8 w-8 animate-twinkle text-lime-400" />
          <Spark className="absolute bottom-12 right-[14%] h-5 w-5 text-brand-300" />
          <motion.p variants={fadeUp} className="eyebrow">Clear thinking</motion.p>
          <motion.h2 variants={fadeUp} className="mx-auto mt-3 max-w-3xl text-3xl font-semibold leading-tight text-ink sm:text-5xl sm:leading-[56px]">
            Stop making marketing decisions{" "}
            <span className="font-fun text-brand-600">alone.</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="mx-auto mt-5 max-w-xl text-lg leading-8 text-gray-600">
            See how Agenzy turns business context and local signals into a plan you can actually run.
          </motion.p>
          <motion.div variants={fadeUp} className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/dashboard" className="btn-primary px-6 py-3 text-base">
              Explore the prototype
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/login" className="btn-secondary px-6 py-3 text-base">
              Sign in with email
            </Link>
          </motion.div>
          <motion.p variants={fadeUp} className="mt-5 text-xs text-gray-500">
            Prototype demo · illustrative data · no customer claims
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-gray-200/70 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
          <Logo height={30} />
          <p className="text-sm text-gray-500">Clear thinking. Bright possibilities.</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500">
          <a href="#experiences" className="hover:text-brand-700">What it does</a>
          <a href="#principles" className="hover:text-brand-700">Principles</a>
          <a href="#pilot" className="hover:text-brand-700">Pilot</a>
          <a href="mailto:hello@agenzy.online" className="font-medium text-brand-600 hover:text-brand-700">
            hello@agenzy.online
          </a>
          <span>© 2026 Agenzy</span>
        </div>
      </div>
    </footer>
  );
}
