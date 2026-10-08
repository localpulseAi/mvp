/**
 * Clearly labelled, illustrative content used when the prototype has no
 * connected workspace data. It is intentionally generic: it is not a
 * customer result, a live market observation, or a generated Claude output.
 */
export const sampleBrief = {
  marketRead:
    "Illustrative only: a local business could compare its upcoming calendar, recent offers, and public competitor activity before choosing one focused campaign for the week.",
  recommendations: [
    {
      title: "Choose one timely offer to test",
      body: "Create one simple offer tied to a relevant local occasion, then define the audience, channel, and success measure before publishing.",
      reasoning:
        "This demonstrates the kind of decision framework Agenzy is being designed to assemble from connected evidence.",
    },
    {
      title: "Check nearby messaging before discounting",
      body: "Review the public offers and positioning of the businesses you choose to track. If several are discounting, test a value-led alternative instead of matching the price cut.",
      reasoning:
        "This is a sample recommendation, not a finding about a real competitor or market.",
    },
  ],
  competitorInsights: [
    {
      title: "Example public-signal comparison",
      observation:
        "A tracked business may increase posting around an event or launch a new promotion.",
      implication:
        "Use the signal as a prompt to review your own timing and positioning; it is not proof of that business's performance.",
    },
  ],
};

export const sampleCompetitorInsight = {
  title: "Illustrative competitor insight",
  positioning: "Sample nearby business — public-facing messages only",
  strengths: ["Communicates a clear seasonal offer", "Uses a consistent call to action"],
  vulnerabilities: ["The offer may be easy for others to copy", "The message does not show a clear differentiator"],
  implication:
    "Compare the sample signal with your own evidence before making a decision. Agenzy is being built to make this comparison easier, not to replace validation.",
};
