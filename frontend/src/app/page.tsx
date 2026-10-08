import type { Metadata } from "next";
import { Navbar } from "@/components/landing/Navbar";
import { ContextStrip, Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { Faq, FinalCta, Footer, HowItWorks, Pilot, Principles, TryIt } from "@/components/landing/Sections";

export const metadata: Metadata = {
  title: "Agenzy | Your next smart move",
  description:
    "Your business. Your neighbourhood. Your next smart move. Agenzy turns local market signals into practical marketing decisions for independent business owners.",
};

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-clip bg-canvas">
      <Navbar />
      <main id="main">
        <Hero />
        <ContextStrip />
        <TryIt />
        <Features />
        <HowItWorks />
        <Pilot />
        <Principles />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
