import { Search, Loader2, Plus, MapPin } from "lucide-react";
import type { DiscoveryCandidate } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { OptionCard } from "./OptionCard";

const MAX_SELECTED = 5;

interface CompetitorStepProps {
  discovered: boolean;
  loading: boolean;
  error: string;
  candidates: DiscoveryCandidate[];
  selected: string[];
  onDiscover: () => void;
  onToggle: (placeId: string) => void;
}

export function CompetitorStep({
  discovered,
  loading,
  error,
  candidates,
  selected,
  onDiscover,
  onToggle,
}: CompetitorStepProps) {
  if (!discovered) {
    return (
      <div className="card px-6 py-10 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-lilac">
          <Search className="h-7 w-7 text-brand-600" />
        </div>
        <h3 className="font-display text-lg font-semibold text-ink">Find your competitors</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-500">
          We&apos;ll look for businesses near your location and rank candidates across 5
          dimensions: proximity, scale, geography, product type, and positioning.
        </p>
        {error && (
          <p role="alert" className="mt-4 text-xs text-red-600">
            {error}
          </p>
        )}
        <button onClick={onDiscover} disabled={loading} className="btn-primary mt-6">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Scanning nearby…
            </>
          ) : (
            <>
              <Search className="h-4 w-4" />
              Run competitor discovery
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-display text-base font-semibold text-ink">
            {candidates.length} candidates found
          </p>
          <p className="text-xs text-gray-500">Select up to {MAX_SELECTED} businesses to track</p>
        </div>
        <Badge variant={selected.length ? "lime" : "brand"} dot>
          {selected.length}/{MAX_SELECTED} selected
        </Badge>
      </div>

      <div className="space-y-2" role="group" aria-label="Competitor candidates">
        {candidates.map((c) => {
          const isSelected = selected.includes(c.place_id);
          const disabled = !isSelected && selected.length >= MAX_SELECTED;
          return (
            <OptionCard
              key={c.place_id}
              role="checkbox"
              indicator="left"
              selected={isSelected}
              disabled={disabled}
              onClick={() => !disabled && onToggle(c.place_id)}
              className="items-start py-3.5"
            >
              <span className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-ink">{c.name}</span>
                <span className="tabular rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
                  {Math.round(c.composite_score * 10)}% match
                </span>
              </span>
              <span className="mt-0.5 flex items-center gap-1 truncate text-xs font-normal text-gray-500">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{c.address}</span>
              </span>
              {c.reasoning && (
                <span className="mt-1 block text-xs font-normal leading-5 text-gray-600">
                  {c.reasoning}
                </span>
              )}
            </OptionCard>
          );
        })}
      </div>

      <button type="button" className="btn-ghost -ml-3">
        <Plus className="h-4 w-4" />
        Add a competitor not in this list
      </button>
    </div>
  );
}
