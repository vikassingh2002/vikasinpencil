/* =============================================================
   BACK POCKET: sealed letters to your future self, and open bets.

   Sealing a letter:
     1. Write the letter somewhere private. It never goes on the site
        until its opening day.
     2. Open the Back pocket page, paste the letter into "Check a letter",
        and copy the fingerprint it shows.
     3. Paste that fingerprint below, with the sealed and opens dates.
   On the opening day, paste the letter's text into  text: "..."
   and it appears on the site. Anyone can check it against the fingerprint.

   The fingerprints below are placeholders: they're the fingerprint
   of an empty letter, because these letters aren't written yet.
   ============================================================= */
window.NB = window.NB || {};

NB.letters = [
  {
    id: "01",
    sealed: "2026-10-20",
    opens: "2027-10-20",
    teaser: "Where I think I'll be working, the one thing I'll have built, and one thing I'm afraid I'll have given up.",
    fingerprint: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    text: ""
  },
  {
    id: "02",
    sealed: "2026-10-20",
    opens: "2030-01-01",
    teaser: "A prediction about how AI will have changed my job, and a bet against myself.",
    fingerprint: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    text: ""
  },
  {
    id: "03",
    sealed: "2026-10-20",
    opens: "2036-10-20",
    teaser: "A letter to whoever I am ten years from now. Mostly questions.",
    fingerprint: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    text: ""
  }
];

/* Open bets. odds = how likely you think it is, 0 to 100.
   When a bet resolves, set outcome to true (it happened) or false.
   The page then works out your accuracy (a Brier score). */
NB.bets = [
  { bet: "I'll have shipped an AI tool that people I've never met use every week.", odds: 60, resolves: "2028-12-31", outcome: null },
  { bet: "AI agents will do most of my first-draft analysis at work.", odds: 70, resolves: "2030-12-31", outcome: null },
  { bet: "I'll have changed my mind about H-04.", odds: 35, resolves: "2027-10-20", outcome: null }
];
