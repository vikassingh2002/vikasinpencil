/* =============================================================
   TODAY: what you're working on this month.
   Rewrite this page on the 20th of every month.

   "see" links an item to another entry: "H-03", "E-01",
   "references", "pocket", "errata" or "contents".
   Dates are written YYYY-MM-DD, for example "2026-10-20".
   ============================================================= */
window.NB = window.NB || {};

NB.today = {
  date: "2026-10-20",
  nextUpdate: "2026-11-20",
  intro: "What I'm working on this month. Rewritten on the 20th of every month.",

  currently: [
    { label: "Learning", text: "How AI agents plan, use tools and fail.", see: "E-01" },
    { label: "Building", text: "A small research assistant, starting from zero.", see: "E-01" },
    { label: "Reading", text: "*The Count of Monte Cristo*, by Alexandre Dumas.", see: "references" },
    { label: "Thinking about", text: "Whether the energy transition is a storage problem before it's a generation problem.", see: "H-04" },
    { label: "Done", text: "Write the first page of this notebook.", done: true }
  ],

  question: "What does a consultant do that an AI agent can't do yet?",
  questionSee: "H-03",

  sticky: {
    text: "Ask me why big numbers are the most underrated idea in business.",
    see: "H-01"
  },

  // The pencil sketch on the right-hand page. Up to five things around the middle.
  // state: "done", "now", "next" or "unknown" (drawn in red)
  sketch: {
    centre: "AI agents",
    caption: "What I'm learning, and what comes after. Solid: done or under way. Dashed: next.",
    around: [
      { label: "LLMs", state: "done" },
      { label: "Tool use", state: "now" },
      { label: "Memory", state: "next" },
      { label: "Evals", state: "next" },
      { label: "next?", state: "unknown" }
    ]
  },

  sinceLastMonth: [
    { struck: "Pick one big question for October.", note: "Done. It's on the left." },
    { struck: "Read a book a week.", note: "Now one every two weeks. Revised, not abandoned." }
  ]
};
