/* Edit this file to update the notebook. No build step needed. */
window.NB = window.NB || {};
NB.experiments = [
  {
    "id": "E-01",
    "featured": true,
    "status": "planned",
    "title": "A research assistant for public sustainability reports",
    "page": "12",
    "question": "Can a small assistant extract a few useful facts from a public sustainability report, with page references I can check?",
    "hypothesis": "A narrow task with explicit sources and human review should be more useful than a broad instruction to summarise everything. That is what I want to test.",
    "method": "Begin with one public report and a handful of questions with manually checked answers. Use Python and an LLM API to produce structured findings with page references. Add retrieval, tools or memory only when a specific limitation makes them necessary. Keep a person in charge of interpreting the output.",
    "steps": [
      {
        "when": "First",
        "name": "One public report",
        "state": "next"
      },
      {
        "when": "Then",
        "name": "Reference answers",
        "state": "next"
      },
      {
        "when": "Build",
        "name": "Extract + cite",
        "state": "next"
      },
      {
        "when": "Check",
        "name": "Errors + cost",
        "state": "next"
      },
      {
        "when": "Later",
        "name": "Useful prototype",
        "state": "goal"
      }
    ],
    "result": "A small, inspectable prototype: a source report, structured answers, supporting passages and a record of mistakes and cost.",
    "next": "Choose one public report and five questions. Write the reference answers before trying to automate them.",
    "editorialHistory": "An earlier version described a four-week build, dated 6–20 October 2026, with prompt and tool-use observations and a “week 2 of 4” label. Those were starter copy, not a verified project log. This entry now records a proposed build. Lessons about missing numbers and unnecessary searches are checks to perform, not reported results.",
    "summary": "On the drawing board. A first project for learning how AI can support research work; no working agent or measured result is claimed yet.",
    "tools": "Proposed: Python and an LLM API. Retrieval and external tools can follow if needed. Prefer a small budget and simple components.",
    "lessons": "Questions to test: does it omit important numbers, invent support, confuse reporting periods or use tools unnecessarily? What should happen when the source does not contain an answer?"
  },
  {
    "id": "E-02",
    "status": "planned",
    "title": "What actually drives property prices in Indian cities?",
    "page": "16",
    "summary": "An investigation on the drawing board. The first task is finding a dataset whose gaps I can describe honestly.",
    "question": "When two homes look similar on paper, what explains the difference in their asking prices?",
    "hypothesis": "Location and access may explain more than the features that are easiest to count. I want to separate that intuition from what the data can actually support.",
    "method": "Start with one city and a small, documented sample of public listings. Compare prices per unit of area, check for duplicate listings, and distinguish asking prices from completed transactions. Add complexity only after a simple comparison is useful.",
    "result": "No findings yet. An asking-price model would describe listings, not establish what a home is worth.",
    "next": "Choose a city, record the source and collection date, and write down the sampling limits before making the first chart."
  },
  {
    "id": "E-03",
    "status": "planned",
    "title": "Follow the value, not just the arrows",
    "page": "18",
    "summary": "A planned public-data exercise in explaining a system. No client material, disguised client figures or claims about a completed engagement.",
    "question": "What makes a value-chain map useful for a decision, rather than just a good-looking slide?",
    "hypothesis": "The useful map is the one that shows where an assumption, a bottleneck or a dependency could change the decision.",
    "method": "Use a public example: follow a rooftop solar installation from equipment to installation, financing and maintenance. Separate physical flows, money flows and responsibilities. Mark what is known, what is estimated and what needs checking.",
    "result": "The output will be a map with a short note on which decisions it can support and which it cannot.",
    "next": "Choose a clearly bounded example and document each important link before drawing the finished map."
  }
];
