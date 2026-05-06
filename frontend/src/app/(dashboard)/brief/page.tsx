import Link from "next/link";
import {
  Newspaper,
  Clock,
  ChevronLeft,
  RefreshCw,
  Users,
  TrendingUp,
  Eye,
  Calendar,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";

const pastBriefs = [
  { id: "2", date: "Apr 28, 2026", title: "Week of Apr 28" },
  { id: "3", date: "Apr 21, 2026", title: "Week of Apr 21" },
  { id: "4", date: "Apr 14, 2026", title: "Week of Apr 14" },
  { id: "5", date: "Apr 7, 2026", title: "Week of Apr 7" },
];

export default function BriefPage() {
  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Newspaper className="h-4 w-4 text-brand-600" />
            <span className="text-sm font-semibold text-gray-500">Weekly Strategic Brief</span>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">
            Week of May 5, 2026
          </h1>
          <div className="mt-1 flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Clock className="h-3.5 w-3.5" />
              Delivered Monday, May 5 at 7:00am
            </div>
            <Badge variant="green" dot>Live</Badge>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-secondary gap-2 text-sm py-2">
            <RefreshCw className="h-3.5 w-3.5" />
            Re-generate
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Brief history sidebar */}
        <aside className="w-48 shrink-0">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Past Briefs
          </p>
          <div className="space-y-1">
            <div className="rounded-xl bg-brand-50 px-3 py-2.5 border border-brand-200">
              <p className="text-xs font-semibold text-brand-700">This week</p>
              <p className="text-[11px] text-brand-600">May 5, 2026</p>
            </div>
            {pastBriefs.map((b) => (
              <button
                key={b.id}
                className="w-full rounded-xl px-3 py-2.5 text-left hover:bg-gray-50 transition-colors"
              >
                <p className="text-xs font-medium text-gray-700">{b.title}</p>
                <p className="text-[11px] text-gray-400">{b.date}</p>
              </button>
            ))}
          </div>
        </aside>

        {/* Brief content */}
        <div className="flex-1 max-w-2xl">
          {/* Data freshness */}
          <div className="mb-5 flex items-center gap-2 rounded-xl bg-gray-50 px-4 py-2.5">
            <Clock className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-xs text-gray-500">
              Based on data through Sunday, May 4, 2026 · Competitor data scraped May 3
            </span>
          </div>

          {/* Market Read */}
          <div className="card mb-5 p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-4 w-4 text-brand-600" />
              <h2 className="text-base font-bold text-gray-900">Market Read</h2>
            </div>
            <div className="brief-content">
              <p>
                Calgary restaurant lunch traffic is running 8–12% below seasonal norms this week,
                consistent with post-long-weekend recovery patterns. The demand dip typically
                recovers by Wednesday. Use Monday–Tuesday as a quieter operational window rather
                than trying to force volume against a weak demand signal.
              </p>
              <p>
                Mother's Day is 7 days out. Search intent for reservation-based dining — specifically
                brunch and dinner — is running 34% above this-time-last-year baseline. This is
                the highest Mother's Day intent signal in the last 3 years for Calgary. The
                opportunity window for capturing reservation interest is narrow: owners who
                activate messaging before Friday capture a disproportionate share.
              </p>
              <p>
                Weather forecast for the coming week: overcast Monday and Tuesday (16°C), clearing
                Wednesday through Sunday with highs reaching 22°C. Patio traffic typically tracks
                weather with a 1-day lag — expect Thursday–Saturday to be your strongest outdoor
                covers of the month so far.
              </p>
            </div>
          </div>

          {/* Recommendations */}
          <div className="card mb-5 overflow-hidden">
            <div className="bg-brand-600 px-6 py-4">
              <h2 className="text-base font-bold text-white">This Week's Recommendations</h2>
              <p className="text-xs text-brand-200 mt-0.5">Two moves for the week ahead</p>
            </div>
            <div className="divide-y divide-gray-100">
              {/* Rec 1 */}
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">1</span>
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      Activate Mother's Day reservation push before Friday
                    </p>
                    <p className="mt-2 text-sm text-gray-700 leading-relaxed">
                      Of your 5 tracked competitors, only Vin Room has put out any Mother's Day
                      messaging so far — and it's been minimal. You have a 4–5 day window to
                      position your offering before the category gets noisy. A simple Instagram
                      post + Google Business update with your Mother's Day menu or reservation
                      details is enough to capture intent that's already in market.
                    </p>
                    <div className="mt-3 rounded-lg bg-gray-50 p-3">
                      <p className="text-xs font-semibold text-gray-600">What to watch for</p>
                      <p className="text-xs text-gray-600 mt-1">
                        If reservations are filling by Wednesday, that's confirmation the signal
                        was real. If you hit the weekend without meaningful uptick, consider a
                        last-minute walk-in offer for Sunday.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              {/* Rec 2 */}
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">2</span>
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      Hold on new promotional pricing this week
                    </p>
                    <p className="mt-2 text-sm text-gray-700 leading-relaxed">
                      Three of your five tracked competitors — Wurst, The Main Dish, and OEB
                      Breakfast Co. — launched lunch promotions in the last 10 days. Adding a
                      fourth promotion to the same audience in the same window dilutes the signal
                      value, risks anchoring your customer base to expect discounts, and compresses
                      margin during a week where you're already working against soft volume.
                    </p>
                    <div className="mt-3 rounded-lg bg-amber-50 border border-amber-100 p-3">
                      <p className="text-xs font-semibold text-amber-700">Reasoning shown</p>
                      <p className="text-xs text-amber-700 mt-1">
                        The math on a 20–30% lunch discount with your gross margin band and current
                        covers-per-service baseline suggests you'd need a 35–40% volume lift to
                        hold net revenue flat. That's a strong requirement given current demand
                        levels.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* What to watch */}
          <div className="card mb-5 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="h-4 w-4 text-gray-600" />
              <h2 className="text-base font-bold text-gray-900">What to Watch This Week</h2>
            </div>
            <ul className="space-y-2">
              {[
                "Whether Vin Room's Mother's Day messaging gets louder mid-week — that's the trigger for you to move faster.",
                "Tuesday patio covers vs. the previous two weeks — the weather clears mid-week and Thursday should be your read of the season's strength.",
                "OEB review velocity — they've had an unusual spike. If it continues, something structural changed in their operation worth understanding.",
              ].map((item, i) => (
                <li key={i} className="flex gap-2.5 text-sm text-gray-700">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-brand-500 shrink-0" />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Competitor watch */}
          <div className="card p-6 border-brand-100 bg-brand-50/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-brand-600" />
                <h2 className="text-base font-bold text-gray-900">From Your Competitor Watch</h2>
              </div>
              <Link href="/competitors" className="text-xs font-medium text-brand-600 hover:text-brand-700">
                Full analysis →
              </Link>
            </div>
            <div className="space-y-3">
              {[
                {
                  name: "Vin Room",
                  obs: "Running targeted Meta Ads for dinner-for-two, 28–45 demographic. Budget appears meaningful — daily spend estimated in the $40–80 range. This is new behaviour for them.",
                  implication: "They're going up-market in acquisition. If their dinner covers improve over the next 3 weeks, expect them to stay in that channel.",
                },
                {
                  name: "Wurst",
                  obs: "New weekday lunch special ($18 burger + beer) promoted heavily on Instagram. 340 likes in 48 hours — their highest lunch post engagement in 3 months.",
                  implication: "The engagement suggests real customer interest, not just algorithmic reach. Their lunch play is worth watching.",
                },
              ].map((item) => (
                <div key={item.name} className="rounded-xl bg-white border border-brand-100 p-4">
                  <p className="text-sm font-bold text-gray-900">{item.name}</p>
                  <p className="mt-1 text-xs text-gray-700 leading-relaxed">{item.obs}</p>
                  <div className="mt-2 rounded-lg bg-brand-50 px-3 py-2">
                    <p className="text-xs font-semibold text-brand-700">Strategic implication</p>
                    <p className="text-xs text-brand-700 mt-0.5 leading-relaxed">
                      {item.implication}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: occasions this week */}
        <aside className="hidden xl:block w-56 shrink-0">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Upcoming Occasions
          </p>
          <div className="space-y-2">
            {[
              { label: "Mother's Day", date: "May 11", badge: "7 days", color: "brand" },
              { label: "Victoria Day", date: "May 19", badge: "15 days", color: "amber" },
              { label: "Lilac Festival", date: "May 24-25", badge: "20 days", color: "gray" },
              { label: "Stampede", date: "Jul 4", badge: "61 days", color: "amber" },
            ].map((o) => (
              <div key={o.label} className="card p-3.5">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold text-gray-900">{o.label}</p>
                  <Badge variant={o.color as "brand" | "amber" | "gray"} className="text-[10px]">
                    {o.badge}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {o.date}
                </p>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
