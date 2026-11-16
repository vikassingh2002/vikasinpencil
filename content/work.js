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

   earlier   internships and college projects shown under "Earlier work"
             on Work. drawing: org, portfolio (or any drawing above).

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
  // Earlier projects: internships and college projects, newest first.
  earlier: [
    {
      id: "bajaj",
      title: "Portfolio optimisation with Monte Carlo simulation",
      org: "Bajaj Capital · Global Private Wealth intern",
      year: "2025",
      text: "Simulated a million ways of weighting 20 NIFTY 500 stocks on three years of Bloomberg prices to find the lowest-risk portfolio and the best risk-adjusted one (Sharpe ratio 1.66), then drew the efficient frontier. Also drafted investment proposals for high-net-worth clients.",
      drawing: "portfolio"
    },
    {
      id: "dvc",
      title: "Redesigning performance management",
      org: "Damodar Valley Corporation · MBA project",
      year: "2025",
      text: "Led a five-person team redesigning the performance management system for 5,243 employees across 34 departments, built on 136 key performance areas mapped from 200+ employee conversations at four plants and offices.",
      drawing: "org"
    },
    {
      id: "informs",
      title: "Buyer personas to help disrupt human trafficking",
      org: "INFORMS · Georgia task force project",
      year: "2025",
      text: "Built data-driven buyer personas for a Georgia task force project aimed at disrupting human trafficking.",
      drawing: "flow"
    }
  ],
  journey: [
    { when: "2023", title: "Physics", text: "B.Sc. from Mumbai University. Learned to ask how things work.", state: "done" },
    { when: "2026", title: "MBA, IIFT", text: "International Business, Indian Institute of Foreign Trade.", state: "done" },
    { when: "Now", title: "Consulting", text: "Digital Engineering and R&D at Capgemini.", state: "done" },
    { when: "Since Oct 2026", title: "Building with AI", text: "Agents, experiments and a weekly magazine.", state: "now" },
    { when: "Next", title: "Something of my own", text: "Find out whether something I build can stand on its own.", state: "next" }
  ],
  summary: {
    "E-04": "An agent that spots unusual satellite readings, works out the likely cause and drafts a response for a person to approve."
  }
};
