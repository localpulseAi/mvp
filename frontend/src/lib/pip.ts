"use client";

import { useEffect, useState } from "react";

/**
 * Talk to the 3D Pip guide from anywhere on the page.
 *   pipSay("Nice!")   speech bubble (null clears it); cleared when Pip moves to a new spot
 *   pipJump()         a happy hop
 * Both are no-ops when the 3D guide isn't mounted (small screens, no WebGL).
 */
export function pipSay(text: string | null) {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("pip:say", { detail: text }));
}

export function pipJump() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event("pip:jump"));
}

/** True once the 3D guide has loaded, so 2D stand-ins can step aside. */
export function usePip3D() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const check = () => setReady(document.documentElement.classList.contains("pip-3d"));
    check();
    window.addEventListener("pip:ready", check);
    window.addEventListener("pip:gone", check);
    return () => {
      window.removeEventListener("pip:ready", check);
      window.removeEventListener("pip:gone", check);
    };
  }, []);
  return ready;
}
