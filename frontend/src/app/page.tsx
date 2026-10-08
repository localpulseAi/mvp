import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Problem } from "@/components/landing/Problem";
import { Experiences } from "@/components/landing/Experiences";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Principles } from "@/components/landing/Principles";
import { Pilot } from "@/components/landing/Pilot";
import { FinalCta, Footer } from "@/components/landing/FinalCta";

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-canvas">
      <Navbar />
      <main>
        <Hero />
        <Problem />
        <Experiences />
        <HowItWorks />
        <Principles />
        <Pilot />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
