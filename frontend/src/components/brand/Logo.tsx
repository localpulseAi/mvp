import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Agenzy logo — uses the approved raster artwork from design/Agenzy-Logo-Pack.
 * Never retype the wordmark or recolour the mark in CSS (brand guidelines §02).
 *
 * variant:
 *   "full"     — violet A + lime spark + ink wordmark (light surfaces)
 *   "reversed" — white A + lime spark + white wordmark (ink / violet surfaces)
 *   "symbol" / "symbol-reversed" — mark only, for compact placements (min 32px)
 */
type LogoVariant = "full" | "reversed" | "symbol" | "symbol-reversed";

interface LogoProps {
  variant?: LogoVariant;
  /** Rendered height in px. Horizontal lockup should stay ≥ 140px wide (~43px tall). */
  height?: number;
  className?: string;
  priority?: boolean;
}

const assets: Record<LogoVariant, { src: string; w: number; h: number }> = {
  full:              { src: "/brand/logo-horizontal.png",          w: 720, h: 219 },
  reversed:          { src: "/brand/logo-horizontal-reversed.png", w: 720, h: 219 },
  symbol:            { src: "/brand/symbol.png",                   w: 256, h: 229 },
  "symbol-reversed": { src: "/brand/symbol-reversed.png",          w: 256, h: 229 },
};

export function Logo({ variant = "full", height = 32, className, priority }: LogoProps) {
  const a = assets[variant];
  const width = Math.round((a.w / a.h) * height);
  return (
    <Image
      src={a.src}
      alt="Agenzy"
      width={width}
      height={height}
      priority={priority}
      className={cn("select-none", className)}
      style={{ height, width }}
    />
  );
}
