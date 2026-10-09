"use client";

import { Component, useEffect, useState } from "react";
import dynamic from "next/dynamic";

const PipStage = dynamic(() => import("./PipStage"), { ssr: false });

function webglAvailable() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/** If the model fails to load, quietly fall back to the 2D mascots. */
class Quiet extends Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/**
 * Mounts the 3D Pip guide on wide screens with WebGL. The three.js bundle is
 * only downloaded when it's actually going to be shown; small screens keep the
 * lighter 2D Pip images instead.
 */
export function PipGuide() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setOn(mq.matches && webglAvailable());
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  if (!on) return null;
  return (
    <Quiet>
      <PipStage />
    </Quiet>
  );
}
