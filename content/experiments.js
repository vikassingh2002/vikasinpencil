/* Edit the text here to keep the notebook yours. */
window.NB = window.NB || {};
NB.experiments = [
  {
    "id": "E-01",
    "featured": true,
    "status": "running",
    "title": "Build an AI research assistant from zero",
    "started": "2026-10-06",
    "page": "12",
    "progress": "week 2 of 4",
    "question": "Can I go from “uses ChatGPT” to “built a working research assistant” in 30 days?",
    "hypothesis": "Yes, if I build something small every week instead of finishing courses first. Confidence: 60%.",
    "method": "Four weekly builds, each adding one ability: a prompt that summarises a report; tools, so it can search; memory, so it remembers a project; evals, so I can measure where it's wrong. Everything goes on this page, including the failures.",
    "observations": [
      {
        "date": "2026-10-13",
        "label": "Week 1",
        "text": "The summary sounded right and skipped the one number that mattered. Fluent isn't the same as correct."
      },
      {
        "date": "2026-10-20",
        "label": "Week 2",
        "text": "Tool use works, but it searches too eagerly. Adding a “stop and plan” step before it reaches for a tool."
      }
    ],
    "marginNote": "Surprise: it's best at the boring parts.",
    "steps": [
      {
        "when": "Week 1",
        "name": "Prompt",
        "state": "done"
      },
      {
        "when": "Week 2",
        "name": "Tools",
        "state": "now"
      },
      {
        "when": "Week 3",
        "name": "Memory",
        "state": "next"
      },
      {
        "when": "Week 4",
        "name": "Evals",
        "state": "next"
      },
      {
        "when": "November",
        "name": "Ship it?",
        "state": "goal"
      }
    ],
    "result": "Still running. The question is not whether it can produce a convincing answer, but whether I can tell when that answer deserves to be trusted. I will call this useful when I can check its sources and recognise its limits.",
    "next": "Test it on a small set of reports with answers I can check by hand. Keep a record of missing numbers, unsupported claims and unnecessary searches. Then decide what is worth building next."
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
