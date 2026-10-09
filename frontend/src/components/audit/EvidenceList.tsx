"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Film, GalleryHorizontal, Heart, Image as ImageIcon, MessageCircle, Star } from "lucide-react";
import type { AuditEvidence } from "@/lib/api";
import { PipImg } from "@/components/dashboard/viz";
import { sourceLabel, typeLabel } from "./evidenceStats";
import { cn } from "@/lib/utils";

function day(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" }) : "Undated";
}

/** Everything the analyst read, item by item — the receipts behind the audit. */
export function EvidenceList({ evidence }: { evidence: AuditEvidence }) {
  const [view, setView] = useState<"posts" | "reviews">(evidence.posts.length ? "posts" : "reviews");
  const shownPosts = evidence.posts.length;
  const shownReviews = evidence.reviews.length;

  return (
    <section className="space-y-4" aria-labelledby="evidence-title">
      <div className="card flex items-center gap-4 p-4 sm:p-5">
        <PipImg pose="search" size={64} />
        <div className="min-w-0 flex-1">
          <h2 id="evidence-title" className="font-display text-lg font-semibold text-ink">
            Everything the analyst read
          </h2>
          <p className="mt-0.5 text-sm text-gray-600">
            These are the actual posts and reviews collected for this audit. Findings and charts are built only from these.
          </p>
          <p className="mt-2 flex flex-wrap gap-2 text-[11px]">
            {evidence.sources.map((s) => (
              <span key={s.source} className="rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-800 ring-1 ring-emerald-200">
                {sourceLabel(s.source)} · {s.item_count}
              </span>
            ))}
          </p>
        </div>
      </div>

      <div role="tablist" aria-label="Evidence type" className="inline-flex gap-1 rounded-control border border-gray-200/70 bg-white p-1 shadow-soft">
        {(
          [
            ["posts", `Posts (${evidence.totals.posts})`],
            ["reviews", `Reviews (${evidence.totals.reviews})`],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={view === id}
            onClick={() => setView(id)}
            className={cn("rounded-lg px-4 py-2 text-sm font-semibold transition-colors", view === id ? "bg-lilac text-brand-700" : "text-gray-500 hover:text-ink")}
          >
            {label}
          </button>
        ))}
      </div>

      {view === "posts" ? (
        shownPosts ? (
          <ul className="grid gap-2 md:grid-cols-2">
            {evidence.posts.map((p, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.4) }}
                className="card flex gap-3 p-3.5"
              >
                <span className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl bg-lilac text-brand-700" title={typeLabel(p.media_type)}>
                  {p.media_type === "reel" || p.media_type === "video" ? (
                    <Film className="h-4 w-4" aria-hidden="true" />
                  ) : p.media_type === "carousel" ? (
                    <GalleryHorizontal className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <ImageIcon className="h-4 w-4" aria-hidden="true" />
                  )}
                  <span className="mt-0.5 text-[8px] font-bold uppercase">{typeLabel(p.media_type)}</span>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] text-gray-500">
                    {sourceLabel(p.source)} · {day(p.posted_at)}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-sm text-ink">{p.caption || <span className="italic text-gray-400">No caption</span>}</p>
                  <p className="mt-1.5 flex gap-3 text-[11px] text-gray-600">
                    <span className="inline-flex items-center gap-1">
                      <Heart className="h-3 w-3" aria-hidden="true" /> <span className="tabular">{p.likes}</span>
                      <span className="sr-only">likes</span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" aria-hidden="true" /> <span className="tabular">{p.comments}</span>
                      <span className="sr-only">comments</span>
                    </span>
                  </p>
                </div>
              </motion.li>
            ))}
          </ul>
        ) : (
          <p className="py-6 text-center text-sm text-gray-500">No posts were collected for this audit.</p>
        )
      ) : shownReviews ? (
        <ul className="grid gap-2 md:grid-cols-2">
          {evidence.reviews.map((r, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.4) }}
              className="card p-3.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex text-amber-500" aria-label={`${r.rating} out of 5 stars`}>
                  {[0, 1, 2, 3, 4].map((s) => (
                    <Star key={s} className="h-3.5 w-3.5" fill={s < r.rating ? "currentColor" : "none"} aria-hidden="true" />
                  ))}
                </span>
                <span className="text-[11px] text-gray-500">{day(r.posted_at)}</span>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-gray-700">“{r.text}”</p>
              {r.owner_replied && (
                <p className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                  <CheckCircle2 className="h-3 w-3" aria-hidden="true" /> You replied
                </p>
              )}
            </motion.li>
          ))}
        </ul>
      ) : (
        <p className="py-6 text-center text-sm text-gray-500">No reviews were collected for this audit.</p>
      )}
      {(evidence.totals.posts > shownPosts || evidence.totals.reviews > shownReviews) && (
        <p className="text-xs text-gray-500">
          Showing the most recent {shownPosts + shownReviews} of {evidence.totals.posts + evidence.totals.reviews} collected items.
        </p>
      )}
    </section>
  );
}
