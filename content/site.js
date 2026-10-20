/* =============================================================
   SITE: your name, contact details and the words on the cover.

   How to edit: change only the text between the quotes "like this".
   Keep the quotes, the commas at the ends of lines, and the brackets.
   You can use this formatting inside any text:
     *italic*      ~~struck through~~      [[hidden]]  (a black redaction bar)
   ============================================================= */
window.NB = window.NB || {};

NB.site = {
  // While this is true, a pencil "Draft" stamp shows on every page.
  // Set it to false once the [placeholders] are gone and you are ready to share.
  draft: true,

  name: "Vikas Singh",
  email: "hello@vikasinpencil.com",   // shown on the inside cover (see README: email forwarding)
  linkedin: "https://www.linkedin.com/in/vikas-singh-profile/",
  cvFile: "",                          // e.g. "assets/cv.pdf" once you add the PDF; empty hides the button

  begun: "Oct 2026",
  coverSubject: "things I haven't figured out yet",
  coverPagesLeft: "most of them",
  tagline: "Written in pencil. Nothing here is final.",
  coverLines: [
    "Trained in physics. Working in strategy.",
    "Taking notes on what comes next."
  ],

  rewardLine: "Reward: a good conversation.",

  // The inside cover. Four short lines a busy person can read in 30 seconds.
  thirtySeconds: [
    "Trained in physics, now a consultant at Capgemini.",
    "Drawn to problems where energy, technology and strategy meet.",
    "Learning how AI systems are built, not just how they are used.",
    "This notebook is where I think in public: hypotheses first, results later."
  ],

  houseRules: [
    "Write the hypothesis before the result.",
    "Never erase. Strike it through, date it, explain.",
    "Leave room for what comes next."
  ],

  // Seven hidden notes, one on every page. Rewrite them in your own words.
  secrets: {
    band: "You snapped the band. Most people just press the button. There are six more of these.",
    rule: "Rule 4: look in the margins. There's a hidden note on every page.",
    sticky: "Under the sticky note: [something true about you that doesn't fit on a CV].",
    cat: "Observed. Until you looked, it was both here and not here.",
    coffee: "Fig. 0: the fuel for this notebook.",
    spine: "[The first book that changed how you think, and why.]",
    pocket: "A fourth envelope, unsealed: if you found this, write to me. I answer every letter."
  },
  secretsDone: "That's all seven. Email me and say so. I'd like to know who you are."
};
