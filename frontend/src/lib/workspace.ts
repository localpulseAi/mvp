"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, getMe } from "@/lib/api";

/**
 * Workspace mode
 *
 * "live" — the workspace API answered; pages show real data and real
 *          loading / empty / error states.
 * "demo" — no reachable or signed-in workspace (e.g. the public prototype on
 *          agenzy.online). Pages render the coherent, clearly labelled
 *          fictional workspace from `demo-workspace.ts` instead of fake zeros.
 */
export type WorkspaceMode = "live" | "demo";

/** True when an API failure means "no workspace to talk to", not "request broke". */
export function isNoWorkspace(err: unknown): boolean {
  return err instanceof ApiError && (err.kind === "unavailable" || err.kind === "unauthorized");
}

export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.kind === "server") return "Something went wrong on our side. Your data is safe; try again in a moment.";
    return err.message;
  }
  return "Something unexpected happened. Try again.";
}

let modeProbe: Promise<WorkspaceMode> | null = null;

/** Probes the workspace once per page load and caches the answer. */
export function detectWorkspaceMode(force = false): Promise<WorkspaceMode> {
  if (!modeProbe || force) {
    modeProbe = getMe()
      .then(() => "live" as const)
      .catch((err) => (isNoWorkspace(err) ? ("demo" as const) : ("live" as const)));
  }
  return modeProbe;
}

export function useWorkspaceMode(): WorkspaceMode | null {
  const [mode, setMode] = useState<WorkspaceMode | null>(null);
  useEffect(() => {
    let alive = true;
    detectWorkspaceMode().then((m) => alive && setMode(m));
    return () => {
      alive = false;
    };
  }, []);
  return mode;
}

export type WorkspaceData<T> =
  | { status: "loading"; mode: WorkspaceMode | null; data: null; error: null }
  | { status: "ready"; mode: WorkspaceMode; data: T; error: null }
  | { status: "error"; mode: "live"; data: null; error: string };

/**
 * Loads live data, or returns the demo dataset when there is no workspace.
 * A failed live request becomes an explicit error — never an empty value.
 *
 *   const { state, reload } = useWorkspaceData(() => getCompetitors(), demoCompetitors);
 */
export function useWorkspaceData<T>(fetchLive: () => Promise<T>, demo: T) {
  const [state, setState] = useState<WorkspaceData<T>>({ status: "loading", mode: null, data: null, error: null });
  const fetchRef = useRef(fetchLive);
  fetchRef.current = fetchLive;
  const demoRef = useRef(demo);
  demoRef.current = demo;

  const load = useCallback(async (force = false) => {
    setState((prev) => (prev.status === "ready" ? prev : { status: "loading", mode: null, data: null, error: null }));
    const mode = await detectWorkspaceMode(force);
    if (mode === "demo") {
      setState({ status: "ready", mode: "demo", data: demoRef.current, error: null });
      return;
    }
    try {
      const data = await fetchRef.current();
      setState({ status: "ready", mode: "live", data, error: null });
    } catch (err) {
      if (isNoWorkspace(err)) {
        setState({ status: "ready", mode: "demo", data: demoRef.current, error: null });
      } else {
        setState({ status: "error", mode: "live", data: null, error: errorMessage(err) });
      }
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { state, reload: () => load(true) };
}
