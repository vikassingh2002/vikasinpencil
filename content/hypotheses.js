/* =============================================================
   HYPOTHESES: things you believe and could be wrong about.

   Each one needs:
     id          "H-07"  (keep counting up; never reuse a number)
     status      "open" or "retired"
     statement   the belief, in one sentence
     confidence  how sure you are today, 0 to 100
     opened      the date you first wrote it, "YYYY-MM-DD"
     page        the page number to show, e.g. "12"
     why         why you think so
     changeMind  what would change your mind
     history     every time your confidence moves, add a line
                 (the chart draws itself from these)

   Retiring one: set status to "retired" and fill in "retired".
   Changing your wording: add a "revisions" entry instead of
   overwriting it. The house rule is never erase.

   Add  featured: true  to the one that should open first.
   ============================================================= */
window.NB = window.NB || {};

NB.hypotheses = [
  {
    id: "H-01",
    status: "open",
    statement: "Big numbers are the most underrated idea in business.",
    confidence: 55,
    opened: "2026-10-02",
    page: "04",
    why: "Most strategy arguments are really disagreements about orders of magnitude that nobody has written down.",
    changeMind: "Three good decisions that got worse once somebody did the maths.",
    history: [
      { date: "2026-10-02", confidence: 55 }
    ]
  },
  {
    id: "H-02",
    status: "retired",
    statement: "A good deck can carry a weak idea.",
    opened: "2026-10-01",
    page: "06",
    retired: {
      date: "2026-10-18",
      from: 50,
      to: 5,
      what: "It carried the idea into the room. It didn't carry it out."
    }
  },
  {
    id: "H-03",
    featured: true,
    status: "open",
    statement: "AI agents will reshape the first two years of a consulting career by 2030.",
    confidence: 70,
    opened: "2026-10-01",
    page: "08",
    why: "Most first-year work is finding, structuring and summarising: exactly the jobs agents are getting good at. Judgement is not on that list yet.",
    changeMind: "Firms hiring more first-year analysts in 2028 than in 2025, to do the same work.",
    history: [
      { date: "2026-10-01", confidence: 80 },
      { date: "2026-10-10", confidence: 75 },
      { date: "2026-10-19", confidence: 70 }
    ],
    revisions: [
      {
        from: "2026-10-01",
        date: "2026-10-19",
        before: "AI agents will replace junior analysts by 2030.",
        struck: "replace junior analysts",
        note: "“Replace” was too strong. They'll change what the job is."
      }
    ]
  },
  {
    id: "H-04",
    status: "open",
    statement: "The energy transition is a storage problem before it's a generation problem.",
    confidence: 60,
    opened: "2026-10-09",
    page: "09",
    why: "Cheap solar and wind are already here. Keeping the lights on after sunset is the hard part.",
    changeMind: "Grids running out of transmission capacity long before they run short of storage.",
    history: [
      { date: "2026-10-09", confidence: 60 }
    ]
  },
  {
    id: "H-05",
    status: "open",
    statement: "Most organisations don't have a data problem. They have a decision problem.",
    confidence: 65,
    opened: "2026-10-12",
    page: "10",
    why: "A dashboard isn't an outcome until someone decides something differently because of it.",
    changeMind: "A team that clearly made better calls the month its dashboard went live, and could show why.",
    history: [
      { date: "2026-10-12", confidence: 65 }
    ]
  },
  {
    id: "H-06",
    status: "open",
    statement: "Empires and companies fail for the same few reasons.",
    confidence: 40,
    opened: "2026-10-15",
    page: "11",
    why: "Overreach, messy succession and losing touch with the edges show up in both histories.",
    changeMind: "Ten well-documented collapses where the reasons barely overlap.",
    history: [
      { date: "2026-10-15", confidence: 40 }
    ]
  }
];
