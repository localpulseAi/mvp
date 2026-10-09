import { cn } from "@/lib/utils";

export type PipPose3D = "wave" | "present" | "search" | "think" | "celebrate";

interface PipSpotProps {
  pose: PipPose3D;
  /** Line Pip says once it arrives. */
  say?: string;
  /** For "present": which side of Pip the content it's showing sits on. */
  side?: "left" | "right";
  /** Use "light" on dark sections so the speech bubble stays readable. */
  tone?: "light";
  /** Size and position the spot. Pip stands on its bottom edge, scaled to its height. */
  className?: string;
}

/**
 * A place the 3D Pip guide can walk to. Pip heads for the spot nearest the
 * middle of the viewport as the page scrolls. Hidden below lg, where the 3D
 * guide isn't shown (hidden spots have no height, so Pip ignores them).
 */
export function PipSpot({ pose, say, side, tone, className }: PipSpotProps) {
  return (
    <div
      aria-hidden="true"
      data-pip={pose}
      data-pip-say={say}
      data-pip-side={side}
      data-pip-tone={tone}
      className={cn("pointer-events-none hidden lg:block", className)}
    />
  );
}
