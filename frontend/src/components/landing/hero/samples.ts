/** Hero sample briefs — illustrative only, not customer results. */
export const samples = {
  cafe: {
    tab: "Café",
    business: "Neighbourhood café",
    signal: "A weekend market could bring more people past your door.",
    title: ["Make the morning stop", "an easy yes."],
    move: "Try a coffee + pastry bundle before 11am. Keep the offer focused on your quieter hours.",
    why: "Fill spare capacity without discounting your whole menu.",
    watch: ["Bundle orders", "Margin per sale"],
    chips: ["Weekend market · Sat", "Quiet hours · Tue–Thu"],
  },
  salon: {
    tab: "Salon",
    business: "Independent salon",
    signal: "Your midweek appointment book has room for a few more regulars.",
    title: ["Give quiet hours", "a little attention."],
    move: "Promote a midweek appointment reminder to existing clients. Lead with convenient times, not a blanket discount.",
    why: "Use open appointments while protecting your service margins.",
    watch: ["Midweek bookings", "Repeat appointments"],
    chips: ["Open slots · Wed", "Regulars due back"],
  },
  shop: {
    tab: "Local shop",
    business: "Neighbourhood shop",
    signal: "A local event could introduce new shoppers to your street.",
    title: ["Turn passing interest", "into a reason to stop."],
    move: "Feature a small, event-ready selection in your window and social posts. Keep the message specific and easy to spot.",
    why: "Help new visitors understand what makes your shop worth a visit.",
    watch: ["Featured item sales", "New customer visits"],
    chips: ["Street event · Sun", "New faces nearby"],
  },
} as const;

export type SampleKey = keyof typeof samples;
export const sampleKeys = Object.keys(samples) as SampleKey[];

/** How long each sample shows before the card moves on (ms). */
export const CYCLE_MS = 6000;
