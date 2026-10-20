/* =============================================================
   EXPERIMENTS: projects, written like lab entries.

   Each one can have (leave out anything you don't need):
     id, status ("running" or "concluded"), title, started,
     concluded, page, progress, question, hypothesis, method,
     observations (a dated log), marginNote, steps (Figure 1),
     result, next, summary.

   Client work: write [[hidden]] where a name should be blacked
   out, and add a redactedNote saying why. Never put a client's
   name, figures or documents here. Check your firm's policy first.

   Add  featured: true  to the one that should open first.
   ============================================================= */
window.NB = window.NB || {};

NB.experiments = [
  {
    id: "E-01",
    featured: true,
    status: "running",
    title: "Build an AI research assistant from zero",
    started: "2026-10-06",
    page: "12",
    progress: "week 2 of 4",
    question: "Can I go from “uses ChatGPT” to “built a working research assistant” in 30 days?",
    hypothesis: "Yes, if I build something small every week instead of finishing courses first. Confidence: 60%.",
    method: "Four weekly builds, each adding one ability: a prompt that summarises a report; tools, so it can search; memory, so it remembers a project; evals, so I can measure where it's wrong. Everything goes on this page, including the failures.",
    observations: [
      { date: "2026-10-13", label: "Week 1", text: "The summary sounded right and skipped the one number that mattered. Fluent isn't the same as correct." },
      { date: "2026-10-20", label: "Week 2", text: "Tool use works, but it searches too eagerly. Adding a “stop and plan” step before it reaches for a tool." },
      { date: "2026-10-27", label: "Week 3", text: "Memory. Not written yet.", pending: true },
      { date: "2026-11-03", label: "Week 4", text: "Evals. Not written yet.", pending: true }
    ],
    marginNote: "Surprise: it's best at the boring parts.",
    // Figure 1. state: "done", "now", "next" or "goal"
    steps: [
      { when: "Week 1", name: "Prompt", state: "done" },
      { when: "Week 2", name: "Tools", state: "now" },
      { when: "Week 3", name: "Memory", state: "next" },
      { when: "Week 4", name: "Evals", state: "next" },
      { when: "November", name: "Ship it?", state: "goal" }
    ],
    result: "Pending. My prediction for how this ends is sealed in the back pocket.",
    next: "If it works: three real users by December. If it doesn't: a full write-up in Errata, and a smaller second attempt."
  },
  {
    id: "E-02",
    status: "concluded",
    title: "What actually drives property prices in Indian cities?",
    page: "16",
    summary: "[Two lines on what you tested, how, and what you found.]"
  },
  {
    id: "E-03",
    status: "concluded",
    title: "Mapping a [[hidden]] value chain for a [[hidden]] client",
    page: "18",
    redactedNote: "Client work. The method is mine to show; the names aren't.",
    summary: "[The method in two lines, with no client details.]"
  }
];
