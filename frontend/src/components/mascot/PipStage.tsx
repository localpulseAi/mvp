"use client";

/**
 * PipStage — one fixed, click-through canvas holding the 3D Pip guide
 * (design/agenzy-bundle 2, Pip.glb with clips authored in Blender).
 *
 * Any element with `data-pip` is a spot Pip can stand on (see PipSpot / MascotSlot).
 * Pip runs to the spot nearest the middle of the viewport as the page scrolls,
 * sized to that element's height, and plays the clip for its pose:
 *   wave       idles and waves now and then
 *   present    holds up the checklist
 *   search     peers through the magnifier
 *   think      hand on chin
 *   celebrate  idles and hops now and then
 *
 * Elsewhere: pipSay(text) / pipJump() from "@/lib/pip".
 * Pip turns toward the pointer, waves when hovered and hops when clicked.
 * This file only chooses which clip plays and cross-fades between them.
 */
import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useAnimations, useGLTF } from "@react-three/drei";
import * as THREE from "three";

const { damp, clamp } = THREE.MathUtils;
const MODEL_HEIGHT = 1.45;
const JUMP_HEIGHT = 0.42;
const FADE = 0.28;
export const PIP_URL = "/mascots/Pip.glb";
const CLIP_FOR: Record<string, string> = { wave: "Idle", present: "Present", search: "Search", think: "Think", celebrate: "Idle" };
const ONE_SHOTS = ["Wave", "Celebrate"];

function makeShadowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(64, 64, 4, 64, 64, 64);
  grad.addColorStop(0, "rgba(54, 30, 130, 0.34)");
  grad.addColorStop(1, "rgba(54, 30, 130, 0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

function PipActor({ bubbleRef }: { bubbleRef: React.RefObject<HTMLDivElement> }) {
  const { scene, animations } = useGLTF(PIP_URL);
  const group = useRef<THREE.Group>(null);
  const turn = useRef<THREE.Group>(null);
  const shadow = useRef<THREE.Mesh>(null);
  const shadowTexture = useMemo(makeShadowTexture, []);
  const { actions, mixer } = useAnimations(animations, turn);
  const rootNode = useMemo(() => scene.getObjectByName("Pip_Root"), [scene]);

  const st = useRef({
    ready: false,
    spot: null as HTMLElement | null,
    travelling: false,
    x: 0,
    y: 0,
    h: 300,
    vx: 0,
    yaw: 0,
    px: 0,
    py: 0,
    hovered: false,
    clip: null as string | null,
    oneShot: null as string | null,
    wantJump: false,
    nextGreeting: 2.5,
    nextHop: 1.5,
    waveCooldown: 0,
    say: null as string | null,
    shown: "",
    reduced: false,
  });

  // Announce the 3D guide so 2D stand-ins can step aside.
  useEffect(() => {
    document.documentElement.classList.add("pip-3d");
    window.dispatchEvent(new Event("pip:ready"));
    return () => {
      document.documentElement.classList.remove("pip-3d", "pip-hover");
      window.dispatchEvent(new Event("pip:gone"));
    };
  }, []);

  useEffect(() => {
    ONE_SHOTS.forEach((name) => {
      const a = actions[name];
      if (!a) return;
      a.setLoop(THREE.LoopOnce, 1);
      a.clampWhenFinished = true;
    });
    const onFinished = (e: { action: THREE.AnimationAction }) => {
      const s = st.current;
      if (s.oneShot && e.action === actions[s.oneShot]) s.oneShot = null;
    };
    mixer.addEventListener("finished", onFinished);
    return () => mixer.removeEventListener("finished", onFinished);
  }, [actions, mixer]);

  useEffect(() => {
    const s = st.current;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMq = () => (s.reduced = mq.matches);
    onMq();
    const inside = (e: PointerEvent | MouseEvent) =>
      Math.abs(e.clientX - s.x) < s.h * 0.42 && e.clientY < s.y && e.clientY > s.y - s.h;
    const onMove = (e: PointerEvent) => {
      s.px = e.clientX;
      s.py = e.clientY;
      const hit = inside(e);
      if (hit !== s.hovered) {
        s.hovered = hit;
        document.documentElement.classList.toggle("pip-hover", hit);
      }
    };
    const startJump = () => (s.wantJump = true);
    const onClick = (e: MouseEvent) => inside(e) && startJump();
    const onSay = (e: Event) => (s.say = (e as CustomEvent<string | null>).detail || null);
    mq.addEventListener("change", onMq);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("click", onClick);
    window.addEventListener("pip:jump", startJump);
    window.addEventListener("pip:say", onSay);
    return () => {
      mq.removeEventListener("change", onMq);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("click", onClick);
      window.removeEventListener("pip:jump", startJump);
      window.removeEventListener("pip:say", onSay);
    };
  }, []);

  useFrame(({ clock, size }, delta) => {
    const s = st.current;
    const g = group.current;
    const tn = turn.current;
    if (!g || !tn || !shadow.current) return;
    const dt = Math.min(delta, 0.05);
    const t = clock.elapsedTime;

    // ---- which spot is Pip heading for?
    let best: HTMLElement | null = null;
    let bestDist = Infinity;
    let rect: DOMRect | null = null;
    document.querySelectorAll<HTMLElement>("[data-pip]").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.height < 8) return;
      const d = Math.abs(r.top + r.height / 2 - size.height / 2);
      if (d < bestDist) {
        bestDist = d;
        best = el;
        rect = r;
      }
    });
    const bubble = bubbleRef.current;
    if (!best || !rect) {
      g.visible = false;
      if (bubble) bubble.style.opacity = "0";
      return;
    }
    g.visible = true;
    const spotEl = best as HTMLElement;
    const r = rect as DOMRect;
    const tx = r.left + r.width / 2;
    const ty = r.bottom;
    const th = r.height;
    if (!s.ready) {
      Object.assign(s, { ready: true, spot: spotEl, x: tx, y: ty, h: th });
    } else if (spotEl !== s.spot) {
      s.spot = spotEl;
      s.travelling = !s.reduced;
      s.say = null;
    }
    const mode = spotEl.dataset.pip ?? "wave";
    const side = spotEl.dataset.pipSide === "left" ? -1 : spotEl.dataset.pipSide === "right" ? 1 : 0;

    // ---- glide across the screen while travelling, stick to the spot once there
    const follow = s.travelling ? 4.2 : 24;
    const prevX = s.x;
    s.x = s.reduced ? tx : damp(s.x, tx, follow, dt);
    s.y = s.reduced ? ty : damp(s.y, ty, follow, dt);
    s.h = s.reduced ? th : damp(s.h, th, 5, dt);
    s.vx = damp(s.vx, (s.x - prevX) / dt, 10, dt);
    if (s.travelling && Math.hypot(tx - s.x, ty - s.y) < 10) s.travelling = false;

    g.position.set(s.x - size.width / 2, size.height / 2 - s.y, 0);
    g.scale.setScalar(s.h / MODEL_HEIGHT);

    // ---- facing: direction of travel, else the pointer, nudged toward the section's content
    const lookX = clamp((s.px - s.x) / (size.width * 0.5), -1, 1);
    const travelYaw = Math.abs(s.vx) > 30 ? Math.sign(s.vx) * 1.05 : 0;
    // with a prop in hand Pip stays nearly square to the viewer so the prop reads clearly
    const holding = mode === "present" || mode === "search";
    const restYaw = holding ? lookX * 0.18 + side * 0.12 : lookX * 0.5 + side * 0.3;
    s.yaw = damp(s.yaw, s.reduced ? 0 : s.travelling ? travelYaw : restYaw, 6, dt);
    tn.rotation.y = s.yaw;

    // ---- choose the clip
    const settled = !s.travelling && !s.oneShot && !s.reduced;
    if (s.wantJump) {
      s.wantJump = false;
      if (!s.reduced && s.oneShot !== "Celebrate") s.oneShot = "Celebrate";
    } else if (settled && mode === "celebrate" && t > s.nextHop) {
      s.oneShot = "Celebrate";
      s.nextHop = t + 3.4 + Math.random() * 1.5;
    } else if (
      settled &&
      CLIP_FOR[mode] === "Idle" &&
      t > s.waveCooldown &&
      (s.hovered || (mode === "wave" && t > s.nextGreeting))
    ) {
      s.oneShot = "Wave";
      s.waveCooldown = t + 2.6;
      s.nextGreeting = t + 6 + Math.random() * 3;
    }
    if (s.travelling && s.oneShot === "Wave") s.oneShot = null;
    const want = s.oneShot || (s.travelling ? "Run" : CLIP_FOR[mode] || "Idle");
    if (want !== s.clip && actions[want]) {
      const prev = s.clip ? actions[s.clip] : null;
      const next = actions[want]!;
      if (s.reduced) {
        prev?.stop();
        next.reset().play();
      } else {
        prev?.fadeOut(FADE);
        next.reset().setEffectiveWeight(1).fadeIn(FADE).play();
      }
      s.clip = want;
    }
    mixer.timeScale = s.reduced ? 0 : 1;

    // ---- soft contact shadow shrinks as Pip leaves the ground
    const lift = 1 - clamp((rootNode?.position.y ?? 0) / JUMP_HEIGHT, 0, 1) * 0.45;
    shadow.current.scale.set(1.25 * lift, 0.2 * lift, 1);
    (shadow.current.material as THREE.MeshBasicMaterial).opacity = lift;

    // ---- speech bubble
    if (bubble) {
      const text = s.say || spotEl.dataset.pipSay || "";
      if (text && text !== s.shown) {
        s.shown = text;
        bubble.textContent = text;
      }
      const onScreen = s.y > 0 && s.y - s.h < size.height;
      const show = !!text && !s.travelling && s.oneShot !== "Celebrate" && onScreen;
      // No room above (sticky nav / top of screen)? Put the bubble beside Pip's head instead.
      const above = s.y - s.h * 1.04 - bubble.offsetHeight > 96;
      const leftSide = s.x > size.width * 0.5;
      bubble.classList.toggle("pip-bubble--side", !above);
      bubble.classList.toggle("pip-bubble--left", !above && leftSide);
      bubble.classList.toggle("pip-bubble--light", spotEl.dataset.pipTone === "light");
      bubble.style.opacity = show ? "1" : "0";
      const half = bubble.offsetWidth / 2;
      const bx = clamp(s.x, half + 12, size.width - half - 12);
      bubble.style.transform = above
        ? `translate(${Math.round(bx)}px, ${Math.round(s.y - s.h * 1.04)}px) translate(-50%, -100%) scale(${show ? 1 : 0.9})`
        : `translate(${Math.round(s.x + (leftSide ? -1 : 1) * s.h * 0.42)}px, ${Math.round(s.y - s.h * 0.72)}px) translate(${leftSide ? "-100%" : "0"}, -50%) scale(${show ? 1 : 0.9})`;
    }
  });

  return (
    <group ref={group}>
      <group ref={turn}>
        <primitive object={scene} />
      </group>
      <mesh ref={shadow} position={[0, 0.01, -0.8]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={shadowTexture} transparent depthWrite={false} />
      </mesh>
    </group>
  );
}

export default function PipStage() {
  const bubbleRef = useRef<HTMLDivElement>(null);
  return (
    <div className="pointer-events-none fixed inset-0 z-40" aria-hidden="true">
      <Canvas
        flat
        orthographic
        dpr={[1, 2]}
        style={{ pointerEvents: "none" }}
        gl={{ alpha: true, antialias: true }}
        camera={{ position: [0, 0, 2000], near: 1, far: 5000, zoom: 1 }}
      >
        <hemisphereLight args={["#ffffff", "#cfc3f2", 1.5]} />
        <directionalLight position={[2.5, 4, 4]} intensity={2.2} />
        <directionalLight position={[-3, 1.5, 2.5]} intensity={0.8} />
        <directionalLight position={[1, 3, -4]} intensity={0.9} />
        <Suspense fallback={null}>
          <PipActor bubbleRef={bubbleRef} />
        </Suspense>
      </Canvas>
      <div ref={bubbleRef} className="pip-bubble" />
    </div>
  );
}

useGLTF.preload(PIP_URL);
