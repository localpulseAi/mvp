"use client";

import { useState } from "react";
import {
  Users,
  Plus,
  RefreshCw,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  Instagram,
  Star,
  Eye,
  BarChart2,
  Settings,
  ChevronRight,
  Search,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

type Competitor = {
  id: string;
  name: string;
  address: string;
  category: string;
  sources: string[];
  lastUpdated: string;
  trend: "up" | "down" | "stable";
  positioning: string;
  strengths: string[];
  vulnerabilities: string[];
  recentShifts: string;
  strategicImplication: string;
  googleRating: number;
  reviewCount: number;
};

const competitors: Competitor[] = [
  {
    id: "1",
    name: "Wurst",
    address: "2437 4 St SW",
    category: "Casual dining",
    sources: ["Instagram", "Google Reviews", "Meta Ads"],
    lastUpdated: "2 days ago",
    trend: "up",
    positioning: "Neighbourhood comfort food. Accessible price point, strong regulars, community-first identity.",
    strengths: ["Extremely loyal repeat customer base", "Consistent positive review sentiment", "High engagement on Instagram"],
    vulnerabilities: ["Menu innovation is slow — no major changes in 6 months", "Limited dinner positioning"],
    recentShifts: "Launched a weekday lunch special ($18 burger + beer) with unusually strong Instagram engagement — 340 likes in 48h, their highest lunch post in 3 months.",
    strategicImplication: "Wurst is actively competing in your lunch window for the first time meaningfully. Their engagement suggests real demand, not just algorithmic reach. Watch their table turn data signals over the next 3 weeks.",
    googleRating: 4.6,
    reviewCount: 892,
  },
  {
    id: "2",
    name: "OEB Breakfast Co.",
    address: "1015 17 Ave SW",
    category: "Brunch / breakfast",
    sources: ["Instagram", "Google Reviews"],
    lastUpdated: "5 days ago",
    trend: "up",
    positioning: "Elevated brunch. Premium ingredients, strong brand, upmarket positioning in the casual space.",
    strengths: ["Brand premium well-established", "Breakfast/brunch traffic doesn't overlap your dinner"],
    vulnerabilities: ["High price sensitivity — customer feedback flags value perception"],
    recentShifts: "14 Google reviews in the last 7 days vs. 3-review weekly average. Something changed — either a new staff hire, a viral moment, or a promo. Not yet clear which.",
    strategicImplication: "The review velocity spike is structural, not seasonal. If their service improved, they become harder to position against on quality. Monitor for another 2 weeks before drawing conclusions.",
    googleRating: 4.4,
    reviewCount: 1203,
  },
  {
    id: "3",
    name: "Vin Room",
    address: "2310 4 St SW",
    category: "Wine bar / dinner",
    sources: ["Instagram", "Google Reviews", "Meta Ads", "Facebook"],
    lastUpdated: "2 days ago",
    trend: "up",
    positioning: "Elevated neighbourhood dining. Wine-centric, date-night positioning, loyal local customer base.",
    strengths: ["Strong evening positioning", "Wine expertise as clear differentiator", "High average check"],
    vulnerabilities: ["Limited lunch/daytime presence", "Meta Ads suggest paid acquisition effort — organic may be plateauing"],
    recentShifts: "Running Meta Ads for a dinner-for-two promo targeting 28–45 demographic in the 4 St SW area. Daily spend estimated $40–80 — new behaviour. No Meta activity in the prior 6 months.",
    strategicImplication: "Vin Room moving into paid acquisition signals their organic reach is plateauing or they're going through a growth push. If their dinner covers improve over the next 3 weeks, expect them to stay in that channel, which increases your competition for the same evening audience.",
    googleRating: 4.7,
    reviewCount: 654,
  },
  {
    id: "4",
    name: "The Main Dish",
    address: "1804 4 St SW",
    category: "Casual dining",
    sources: ["Instagram", "Google Reviews"],
    lastUpdated: "4 days ago",
    trend: "stable",
    positioning: "Lunch staple, quick-service feel with sit-down quality. Value positioning, office crowd focus.",
    strengths: ["Efficient service — high turn rate", "Strong lunch location advantage on 4 St"],
    vulnerabilities: ["No evening presence — single day-part dependence", "Low brand differentiation from generic casual"],
    recentShifts: "No significant changes in the last 30 days. Social activity is consistent but low-engagement.",
    strategicImplication: "The Main Dish is a stable but not growing competitor. They compete directly in your lunch window on price. No near-term concern unless they change format.",
    googleRating: 4.2,
    reviewCount: 478,
  },
  {
    id: "5",
    name: "Hankki",
    address: "2208 4 St SW",
    category: "Korean-fusion",
    sources: ["Instagram", "Google Reviews"],
    lastUpdated: "3 days ago",
    trend: "down",
    positioning: "Trendy Korean-fusion. Instagram-native brand, strong visual identity, skews younger audience.",
    strengths: ["Distinctive visual brand — very Instagrammable", "Young demographic loyalty"],
    vulnerabilities: ["Service inconsistency flagged in recent reviews", "Menu fatigue signals — repeat customers declining"],
    recentShifts: "Review sentiment shifted slightly negative in the last 30 days — service speed complaints up from ~5% to ~18% of reviews. Instagram engagement dropping compared to 60-day baseline.",
    strategicImplication: "Hankki may be losing the 'trendy' edge that was their competitive advantage. This creates an opportunity to capture their drifting younger audience if you have a comparable visual/social presence.",
    googleRating: 4.1,
    reviewCount: 341,
  },
];

const crossPatterns = [
  {
    pattern: "3 of 5 running lunch promotions simultaneously",
    severity: "high",
    desc: "Wurst, The Main Dish, and OEB all have active lunch offers. The lunch promo space is saturated in your immediate competitive set.",
    implication: "Any additional lunch promo from you would compete against 3 established offers and be unlikely to differentiate. Timing is wrong.",
  },
  {
    pattern: "Review sentiment improving across most competitors",
    severity: "medium",
    desc: "4 of 5 competitors have stable or improving review sentiment. The neighbourhood is raising its service bar.",
    implication: "Your own Google rating (4.1) is below all 5 tracked competitors. Service quality is an area of competitive vulnerability worth addressing.",
  },
  {
    pattern: "Weak Mother's Day activation across the set",
    severity: "low",
    desc: "Only Vin Room has any Mother's Day messaging. 4 of 5 tracked competitors haven't activated yet.",
    implication: "First-mover opportunity on Mother's Day this week. Act before Thursday.",
  },
];

export default function CompetitorsPage() {
  const [selectedCompetitor, setSelectedCompetitor] = useState<string>("1");
  const [tab, setTab] = useState<"overview" | "patterns">("overview");

  const selected = competitors.find((c) => c.id === selectedCompetitor);

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-4 w-4 text-emerald-600" />
            <span className="text-sm font-semibold text-gray-500">Competitor Analyzer</span>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">Your competitive set</h1>
          <p className="mt-1 text-sm text-gray-500">
            5 competitors tracked · Last scraped May 3, 2026 · Next update May 10
          </p>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary gap-2 text-sm py-2">
            <Settings className="h-4 w-4" />
            Edit set
          </button>
          <button className="btn-primary gap-2 text-sm py-2">
            <RefreshCw className="h-4 w-4" />
            Request refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-xl bg-gray-100 p-1 w-fit">
        {(["overview", "patterns"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-semibold capitalize transition-all",
              tab === t
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            {t === "overview" ? "Per-competitor" : "Cross-competitor patterns"}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="flex gap-6">
          {/* Competitor list */}
          <div className="w-56 shrink-0 space-y-1.5">
            {competitors.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCompetitor(c.id)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-xl p-3.5 text-left transition-all",
                  selectedCompetitor === c.id
                    ? "bg-emerald-50 border border-emerald-200"
                    : "card-hover"
                )}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">
                  {c.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{c.name}</p>
                  <p className="text-xs text-gray-500 truncate">{c.category}</p>
                  <div className="mt-1 flex items-center gap-1">
                    {c.trend === "up" && <TrendingUp className="h-3 w-3 text-emerald-500" />}
                    {c.trend === "down" && <TrendingDown className="h-3 w-3 text-red-400" />}
                    {c.trend === "stable" && <Minus className="h-3 w-3 text-gray-400" />}
                    <span className="text-[10px] text-gray-400">{c.lastUpdated}</span>
                  </div>
                </div>
              </button>
            ))}
            <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 p-3 text-xs font-medium text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors">
              <Search className="h-3.5 w-3.5" />
              Re-run discovery
            </button>
          </div>

          {/* Competitor detail */}
          {selected && (
            <div className="flex-1 space-y-5 animate-fade-in">
              {/* Header */}
              <div className="card p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2.5 mb-1">
                      <h2 className="text-xl font-extrabold text-gray-900">{selected.name}</h2>
                      {selected.trend === "up" && (
                        <Badge variant="green" dot>Trending up</Badge>
                      )}
                      {selected.trend === "down" && (
                        <Badge variant="red" dot>Activity down</Badge>
                      )}
                      {selected.trend === "stable" && (
                        <Badge variant="gray" dot>Stable</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {selected.address} · {selected.category}
                    </p>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-sm font-semibold text-gray-900">{selected.googleRating}</span>
                        <span className="text-xs text-gray-400">({selected.reviewCount} reviews)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-xs text-gray-400">Last updated {selected.lastUpdated}</span>
                      </div>
                    </div>
                    <div className="mt-2 flex gap-1.5">
                      {selected.sources.map((s) => (
                        <Badge key={s} variant="gray" className="text-[10px]">{s}</Badge>
                      ))}
                    </div>
                  </div>
                  <button className="btn-secondary text-sm py-2 gap-1.5">
                    <RefreshCw className="h-3.5 w-3.5" />
                    Refresh
                  </button>
                </div>
              </div>

              {/* Positioning */}
              <div className="card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart2 className="h-4 w-4 text-brand-600" />
                  <p className="text-sm font-bold text-gray-900">Positioning</p>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{selected.positioning}</p>
              </div>

              {/* Strengths + Vulnerabilities */}
              <div className="grid grid-cols-2 gap-4">
                <div className="card p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 mb-3">
                    Strengths
                  </p>
                  <ul className="space-y-2">
                    {selected.strengths.map((s) => (
                      <li key={s} className="flex gap-2 text-sm text-gray-700">
                        <TrendingUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                        <span className="leading-relaxed">{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="card p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 mb-3">
                    Vulnerabilities
                  </p>
                  <ul className="space-y-2">
                    {selected.vulnerabilities.map((v) => (
                      <li key={v} className="flex gap-2 text-sm text-gray-700">
                        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                        <span className="leading-relaxed">{v}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Recent shifts */}
              <div className="card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Instagram className="h-4 w-4 text-pink-500" />
                  <p className="text-sm font-bold text-gray-900">Recent Activity</p>
                  <span className="text-xs text-gray-400">Last 30 days</span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{selected.recentShifts}</p>
              </div>

              {/* Strategic implication */}
              <div className="rounded-xl bg-brand-50 border border-brand-100 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="h-4 w-4 text-brand-600" />
                  <p className="text-sm font-bold text-brand-800">Strategic Implication for You</p>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{selected.strategicImplication}</p>
                <button className="mt-3 flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700">
                  Discuss in a Strategy Session
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "patterns" && (
        <div className="max-w-2xl space-y-4">
          <div className="card p-5 border-amber-200 bg-amber-50/50">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 mb-1">
              What this analysis shows
            </p>
            <p className="text-sm text-amber-800 leading-relaxed">
              Cross-competitor patterns identify what 3 or more of your tracked
              competitors are doing in common. These are the market-level signals
              most relevant to your positioning decisions.
            </p>
          </div>

          {crossPatterns.map((pattern, i) => (
            <div key={i} className="card p-5">
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                    pattern.severity === "high"
                      ? "bg-amber-100"
                      : pattern.severity === "medium"
                      ? "bg-brand-100"
                      : "bg-gray-100"
                  )}
                >
                  {pattern.severity === "high" && (
                    <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                  )}
                  {pattern.severity === "medium" && (
                    <TrendingUp className="h-3.5 w-3.5 text-brand-600" />
                  )}
                  {pattern.severity === "low" && (
                    <Eye className="h-3.5 w-3.5 text-gray-500" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-bold text-gray-900">{pattern.pattern}</p>
                    <Badge
                      variant={
                        pattern.severity === "high"
                          ? "amber"
                          : pattern.severity === "medium"
                          ? "brand"
                          : "gray"
                      }
                    >
                      {pattern.severity}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{pattern.desc}</p>
                  <div className="mt-3 rounded-lg bg-brand-50 px-3 py-2.5">
                    <p className="text-xs font-semibold text-brand-700">Implication for you</p>
                    <p className="text-xs text-gray-700 mt-1 leading-relaxed">
                      {pattern.implication}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <p className="text-xs text-gray-400 text-center">
            Cross-competitor pattern analysis becomes stronger from week 4+ as baseline data builds.
            Based on data through May 3, 2026.
          </p>
        </div>
      )}
    </div>
  );
}
