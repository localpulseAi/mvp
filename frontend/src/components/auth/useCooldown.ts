"use client";

import { useEffect, useState } from "react";

/** Countdown in whole seconds. `start()` restarts it; `remaining` hits 0 when ready. */
export function useCooldown(seconds: number) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (remaining <= 0) return;
    const id = window.setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => window.clearTimeout(id);
  }, [remaining]);

  return { remaining, start: () => setRemaining(seconds) };
}
