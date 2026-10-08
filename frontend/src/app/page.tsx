import type { Metadata } from "next";
import { Navbar } from "@/components/landing/Navbar";
import { ContextStrip, Hero } from "@/components/landing/Hero";
import { ProcessShowcase } from "@/components/landing/process/ProcessShowcase";
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
        <ProcessShowcase />
        <ContextStrip />
        <TryIt />
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
