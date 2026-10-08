/**
 * Landing-page decision explorer content. Illustrative examples only —
 * not live market alerts, customer results, or generated Claude output.
 * Ported from design/Agenzy-Website-Code/src/scenarios.js.
 */
export type ScenarioId = "quiet" | "discount" | "competitor" | "occasion" | "social";

export interface Scenario {
  id: ScenarioId;
  number: string;
  label: string;
  question: string;
  feature: string;
  context: string[];
  title: string;
  answer: string;
  reason: string;
  signal: string;
  metrics: string[];
  plan: [string, string, string];
}

export const scenarios: Scenario[] = [
  {
    id: "quiet", number: "01", label: "Fill the quiet hours",
    question: "“How do I get more people in on a slow Tuesday?”",
    feature: "Weekly Strategic Brief",
    context: ["Goal: midweek visits", "Capacity: room to grow", "Priority: protect margin"],
    title: "Give Tuesday its own reason to visit.",
    answer: "Start with one focused offer during your quietest hours. A small bundle can make the visit feel worthwhile without discounting everything.",
    reason: "A broad discount also reaches people who would have paid full price. A time-limited offer concentrates the incentive where you actually have spare capacity.",
    signal: "Example context: a café with spare midweek capacity.",
    metrics: ["Tuesday transactions", "Gross profit per order"],
    plan: ["Choose one bundle with a healthy margin.", "Promote the quieter time slot to existing customers.", "Compare Tuesday orders and gross profit with your baseline."],
  },
  {
    id: "discount", number: "02", label: "Rethink that discount",
    question: "“Would 20% off actually be good for business?”",
    feature: "Strategy Sessions",
    context: ["Price: $20", "Variable cost: $12", "Baseline: 100 orders"],
    title: "Check the margin before the markdown.",
    answer: "A discount can bring in orders and still leave you with less gross profit. Move the slider to see how much extra volume this example would need.",
    reason: "Compare gross profit, not just sales. This calculation holds unit cost constant and assumes every order receives the discount. It excludes fixed costs and any extra staffing or marketing spend.",
    signal: "Illustrative numbers. Adjust the discount to explore the trade-off.",
    metrics: ["Gross profit per order", "Additional orders needed"],
    plan: ["Calculate the margin on the items in your offer.", "Check whether you can fulfil the extra orders.", "Compare a focused bundle with a store-wide discount."],
  },
  {
    id: "competitor", number: "03", label: "Respond to a rival",
    question: "“The café next door just cut its prices. Should I?”",
    feature: "Competitor Intelligence",
    context: ["Signal: nearby offer", "Question: match or differentiate?", "Priority: sustainable margin"],
    title: "Give people a reason beyond price.",
    answer: "Before matching the offer, look at the audience and timing. Test a clear point of difference, such as a convenient morning bundle or a product people come to you for.",
    reason: "A competitor’s discount does not tell you whether it is profitable or even aimed at your customers. Public activity is a useful signal, but it is not the whole picture.",
    signal: "Hypothetical competitor offer, not a live market alert.",
    metrics: ["Offer redemptions", "Gross profit per sale"],
    plan: ["Check the competitor offer’s dates, terms, and audience.", "Choose a benefit you can deliver consistently.", "Track response before changing your core prices."],
  },
  {
    id: "occasion", number: "04", label: "Make a local moment count",
    question: "“There’s a neighbourhood festival. What should I do?”",
    feature: "Weekly Strategic Brief",
    context: ["Occasion: local festival", "Opportunity: passing visitors", "Constraint: service capacity"],
    title: "Be ready before the foot traffic arrives.",
    answer: "Pick one easy-to-understand offer. Make it visible in your window and social posts, then match staffing and stock to the capacity you can actually handle.",
    reason: "An event creates potential attention, not guaranteed sales. A clear offer and a manageable service plan give you something concrete to test.",
    signal: "Example event scenario. Dates and local relevance need checking.",
    metrics: ["Featured product sales", "Stock availability"],
    plan: ["Confirm the event date, route, and expected trading hours.", "Choose one relevant product or service to feature.", "Prepare stock, staffing, and a simple way to track the response."],
  },
  {
    id: "social", number: "05", label: "Turn attention into action",
    question: "“I’m posting, but people still don’t know how to book.”",
    feature: "Social Presence Audit",
    context: ["Goal: more enquiries", "Friction: unclear next step", "Priority: quick practical fixes"],
    title: "Make the next step impossible to miss.",
    answer: "Start with the basics people need to act: what you offer, where you are, and how to book or buy. Make those details easy to find before adding more posts.",
    reason: "More reach cannot fix a confusing booking path. Removing that friction gives existing visitors a clearer next step and creates a useful baseline for future content.",
    signal: "Example audit scenario, not an analysis of your actual profile.",
    metrics: ["Booking link visits", "Completed enquiries"],
    plan: ["Put your location and core offer in your profile.", "Check the booking link on a phone.", "Pin one useful post with a clear call to action."],
  },
];

/** $20 price, $12 variable cost, 100 baseline orders. Fixed costs excluded. */
export function discountImpact(discount: number) {
  const price = 20, cost = 12, baselineOrders = 100;
  const discountedPrice = price * (1 - discount / 100);
  const contribution = discountedPrice - cost;
  const originalContribution = price - cost;
  const orders = contribution > 0 ? Math.ceil((originalContribution * baselineOrders - 1e-9) / contribution) : null;
  return {
    price: discountedPrice,
    contribution,
    orders,
    extra: orders === null ? null : Math.max(0, orders - baselineOrders),
  };
}

/** Lets feature cards elsewhere on the page open a scenario. */
export const SCENARIO_EVENT = "agenzy:scenario";
export function openScenario(id: ScenarioId) {
  window.dispatchEvent(new CustomEvent<ScenarioId>(SCENARIO_EVENT, { detail: id }));
}
