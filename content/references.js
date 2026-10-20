/* =============================================================
   REFERENCES: what you're reading, what you've read, and the
   antilibrary (books you haven't read yet, and why).
   ============================================================= */
window.NB = window.NB || {};

NB.references = {
  readingNow: [
    {
      title: "[The book you're reading]",
      author: "[Author]",
      why: "[One line on why you picked it up]",
      progress: 40   // percent read, 0 to 100
    }
  ],

  // How many books you've finished in total. Leave as null to count the list below.
  finishedCount: null,

  // Newest first. Every book gets one line: what it changed in how you think.
  // Each one becomes a spine on the shelf.
  finished: [
    // { title: "A book title", author: "Author name", line: "What it changed." },
  ],

  antilibrary: [
    { title: "Thinking in Systems", author: "Donella Meadows", why: "Because almost everything I work on is a system." },
    { title: "Superforecasting", author: "Philip Tetlock & Dan Gardner", why: "Because the back pocket needs better bets." },
    { title: "The Idea Factory", author: "Jon Gertner", why: "To see how Bell Labs turned physics into products." },
    { title: "The Beginning of Infinity", author: "David Deutsch", why: "It argues every problem is soluble. I want to test that." }
  ]
};
