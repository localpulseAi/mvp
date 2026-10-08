"use client";

import Link from "next/link";
import { AlertCircle, Loader2, RotateCcw, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { DEMO_LABEL } from "@/lib/demo-workspace";

/**
 * Shared page states. Communicate ONE state at a time, by text as well as
 * colour: demo · loading · empty · error. A failed request is never shown as 0.
 */

interface DemoBannerProps {
  /** What the demo is standing in for on this page, e.g. "this week's brief". */
  what?: string;
  className?: string;
}

export function DemoBanner({ what, className }: DemoBannerProps) {
  return (
    <div
      role="note"
      className={cn(
        "flex flex-col gap-2 rounded-2xl border border-brand-200/70 bg-lilac px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <p className="flex items-start gap-2.5 text-gray-700">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
        <span>
          <strong className="font-semibold text-ink">{DEMO_LABEL}.</strong>{" "}
          {what ? `You're viewing ${what} for a fictional café. ` : ""}Nothing here is a real result.
        </span>
      </p>
      <Link href="/login" className="shrink-0 pl-6 text-sm font-semibold text-brand-700 hover:underline sm:pl-0">
        Sign in to your workspace
      </Link>
    </div>
  );
}

interface LoadingStateProps {
  label?: string;
  className?: string;
}

export function LoadingState({ label = "Loading", className }: LoadingStateProps) {
  return (
    <div role="status" aria-live="polite" className={cn("flex items-center justify-center gap-2 py-16 text-sm text-gray-500", className)}>
      <Loader2 className="h-4 w-4 animate-spin text-brand-600" aria-hidden="true" />
      {label}…
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ title = "We couldn't load this", message, onRetry, className }: ErrorStateProps) {
  return (
    <div role="alert" className={cn("card flex flex-col items-start gap-3 p-6 sm:flex-row sm:items-center", className)}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50">
        <AlertCircle className="h-5 w-5 text-red-600" aria-hidden="true" />
      </div>
      <div className="flex-1">
        <p className="font-display text-base font-semibold text-ink">{title}</p>
        <p className="mt-0.5 text-sm text-gray-600">{message}</p>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary">
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Try again
        </button>
      )}
    </div>
  );
}

interface EmptyStateProps {
  icon?: React.ElementType;
  title: string;
  body: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, body, action, className }: EmptyStateProps) {
  return (
    <div className={cn("card flex flex-col items-center px-6 py-12 text-center", className)}>
      {Icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-lilac">
          <Icon className="h-5 w-5 text-brand-600" aria-hidden="true" />
        </div>
      )}
      <p className="mt-4 font-display text-lg font-semibold text-ink">{title}</p>
      <p className="mt-1 max-w-md text-sm leading-6 text-gray-600">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

/** Consistent page header: title, one-line context, one primary action. */
export function PageHeader({ eyebrow, title, description, action }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="page-title mt-1">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-gray-600">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}
