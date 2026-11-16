/* =============================================================
   WORK, JOURNEY AND PLANS: edit this file to update the site.
   No build step needed.

   projects  things you have made or are making. Experiments from
             content/experiments.js are added on the Work page
             automatically, after these.
     status    "live", "building" or "idea"
     drawing   which line drawing to use: magazine, screen, club,
               satellite, report, house, flow
     link      where it lives (optional)

   journey   the line on the home page, oldest first. state is
             "done", "now" or "next".

   summary   one sentence for an experiment from content/experiments.js
             that is shown on Work (by its id, e.g. "E-04").
   ============================================================= */
window.NB = window.NB || {};
NB.work = {
  intro: "Things I have built, and what I am building next. All made with public or personal material.",
  projects: [
    {
      id: "agentic",
      status: "live",
      title: "Agentic AI",
      kind: "Weekly magazine",
      text: "A weekly magazine on the business, science and politics of AI agents, with charts and a reader that learns what you already know.",
      drawing: "magazine",
      link: "/agentic/"
    },
    {
      id: "watch",
      status: "live",
      title: "Watch in Pencil",
      kind: "Learning app",
      text: "A personal video-learning space: what I watch to learn, organised by topic.",
      drawing: "screen",
      link: "/watch/"
    },
    {
      id: "bookclub",
      status: "live",
      title: "Ambernath Book Club",
      kind: "Community app",
      text: "A small app for a local book club: what members are reading, ratings and meet-ups.",
      drawing: "club",
      link: "/bookclub/"
    }
  ],
  journey: [
    { when: "Degree", title: "Physics", text: "B.Sc. from Mumbai University. Learned to ask how things work.", state: "done" },
    { when: "Business school", title: "MBA", text: "International Business at IIFT Kolkata.", state: "done" },
    { when: "Work", title: "Consulting", text: "Digital Engineering and R&D at Capgemini.", state: "done" },
    { when: "Since Oct 2026", title: "Building with AI", text: "Agents, experiments and a weekly magazine.", state: "now" },
    { when: "Next", title: "Something of my own", text: "Find out whether something I build can stand on its own.", state: "next" }
  ],
  summary: {
    "E-04": "An agent that spots unusual satellite readings, works out the likely cause and drafts a response for a person to approve."
  }
};
