"use client";

import { motion } from "framer-motion";
import { usePip3D } from "@/lib/pip";
import { PipImg, type PipPose } from "@/components/dashboard/viz";
import type { PipPose3D } from "./PipSpot";
import { cn } from "@/lib/utils";

interface MascotSlotProps {
  /** 2D pose shown when the 3D guide isn't running (small screens, no WebGL). */
  pose2d: PipPose;
  /** What the 3D Pip does when it stands here. */
  pose3d: PipPose3D;
  /** Square size in px — the 2D image size, and the height the 3D Pip stands at. */
  size: number;
  say?: string;
  tone?: "light";
  side?: "left" | "right";
  className?: string;
}

/**
 * A place for Pip in the app. Renders the 2D illustration normally; when the 3D
 * guide is active it becomes an empty spot of the same size and the 3D Pip walks
 * over and stands in it, playing the matching animation.
 */
export function MascotSlot({ pose2d, pose3d, size, say, tone, side, className }: MascotSlotProps) {
  const pip3d = usePip3D();
  if (!pip3d)
    return (
      <motion.div
        className={cn("shrink-0", className)}
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" as const }}
      >
        <PipImg pose={pose2d} size={size} />
      </motion.div>
    );
  return (
    <div
      aria-hidden="true"
      data-pip={pose3d}
      data-pip-say={say}
      data-pip-tone={tone}
      data-pip-side={side}
      style={{ width: size, height: size * 1.12 }}
      className={cn("pointer-events-none shrink-0", className)}
    />
  );
}
