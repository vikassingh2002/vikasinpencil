/* Edit this file to update the notebook. No build step needed. */
window.NB = window.NB || {};
NB.experiments = [
  {
    "id": "E-04",
    "featured": true,
    "status": "planned",
    "title": "A first responder for satellite anomalies",
    "page": "20",
    "question": "Can an agent notice unusual satellite telemetry early, work out the likely cause and draft a response that an operator only has to approve?",
    "hypothesis": "Fixed alarm limits fire late and explain nothing. A detector that learns what normal looks like, paired with an agent that investigates the way an operator would, should give earlier warnings and clearer explanations, while a person keeps every decision.",
    "method": "Two parts. A detector, scored on the European Space Agency's public anomaly benchmark of real, anonymised mission telemetry. And an investigator agent, tested on a small simulated satellite I will build in Python: a battery, a heater, a solar panel and an orbit, with faults I inject on purpose. The agent can look up readings, check whether the satellite is in sunlight, search past incidents and procedures, and write a report. It never sends a command.",
    "steps": [
      {
        "when": "First",
        "name": "Simulated satellite",
        "state": "next"
      },
      {
        "when": "Then",
        "name": "Detector on ESA data",
        "state": "next"
      },
      {
        "when": "Build",
        "name": "Investigator agent",
        "state": "next"
      },
      {
        "when": "Check",
        "name": "Diagnosis + false alarms",
        "state": "next"
      },
      {
        "when": "Later",
        "name": "Operator demo",
        "state": "goal"
      }
    ],
    "result": "A demo an operator could follow: an early warning, the evidence behind it, ranked likely causes and a proposed action from a written procedure, waiting for approval. With scores: anomalies caught, how early, false alarms per day and how often the right cause comes first.",
    "next": "Build the simulated satellite: a battery that charges in sunlight and drains in shadow, and a heater that keeps it warm. Then break the heater and see what the readings look like.",
    "summary": "On the drawing board. My first agent project, chosen because it joins physics, real engineering data and agents. Public and simulated data only; no results are claimed yet.",
    "tools": "Proposed: Python, the ESA anomaly benchmark, a small physics simulation and an LLM API for the investigator. Statistics and machine learning for detection; the language model only for investigating and explaining.",
    "lessons": "Questions to test: does it raise alarms earlier than a fixed limit without crying wolf? Does it rank the real cause first? Does every claim in its report point to a reading or a document? Does it stop and ask when the evidence is thin?"
  },
  {
    "id": "E-01",
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
    "lessons": "Questions to test: does it omit important numbers, invent support, confuse reporting periods or use tools unnecessarily? What should happen when the source does not contain an answer?",
    "marginNote": "On hold since 21 Oct. E-04 comes first; this one stays on the list."
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
