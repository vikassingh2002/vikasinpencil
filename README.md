# Vikas in Pencil

Your lab-notebook website for **vikasinpencil.com**. Plain HTML, CSS and JavaScript: no build step, no framework, nothing to pay for. Every file in this folder is yours, and the whole site moves to any host by copying the folder.

## What's where

| Path | What it is | Do you edit it? |
|---|---|---|
| `content/` | Everything the site says | **Yes. This is the only folder you normally touch.** |
| `assets/img/` | Favicon and the link-preview image | Add your CV here as `cv.pdf` |
| `index.html` and the other `.html` files | Page shells | Rarely |
| `desk.html`, `assets/js/desk.js`, `assets/css/desk.css` | Your desk (see "Your desk" below) | Only for new desk features |
| `assets/js/desk-config.js` | Which Supabase project the desk uses | Once, when connecting Supabase |
| `curiosity.html`, `content/curiosity.js`, `assets/js/cat*.js`, `assets/css/cat.css` | Agentic AI, the learning app (see below) | Add discoveries in `content/curiosity.js` |
| `supabase/schema.sql` | The desk's database and who may do what | Run once in Supabase; rarely edited |
| `assets/css/notebook.css` | The look | Only for design changes |
| `assets/js/notebook.js` | How the notebook behaves | Only for new features |
| `robots.txt` | Tells search engines to stay out while it's a draft | Once, at launch |
| `CNAME` and `.nojekyll` | Tell GitHub Pages your domain, and to publish the files exactly as they are | Never. Don't delete them |
| `tools/goodreads_sync.py` | Copies your Goodreads shelves into `content/books.js` | Never. It runs itself every morning |
| `tools/links_sync.py` | Looks up the links in your References log (films, videos, articles, podcasts) | Never. It runs straight after |
| `.github/workflows/goodreads-sync.yml` | The daily job that runs that copy on GitHub | Never |

## Editing what the site says

Each notebook section has one file in `content/`:

| File | Section |
|---|---|
| `site.js` | Your name, email, the cover, the lines the cover pencil writes (`pencilLines`), the one-line intro and the "if you read one thing" link on the 30-second page (`briefLine`, `readFirst`), the 30-second version, house rules, hidden notes |
| `today.js` | The Today page (rewrite it on the 20th of each month) |
| `hypotheses.js` | Hypotheses |
| `experiments.js` | Experiments |
| `references.js` | The References page: your notes on books, "Start here", and the log of courses, films, articles, videos and podcasts |
| `shelves.js` | Which genre shelf each book sits on |
| `books.js` | Your Goodreads shelves, copied every morning. **Don't edit it**: each sync overwrites it |
| `media.js` | Titles and pictures the sync found for the links in your log. **Don't edit it** either |
| `errata.js` | Corrections |
| `pocket.js` | Sealed letters and open bets |

Rules that keep the files working:

- Change only the text between the quotes. Keep the quotes, commas and brackets.
- Dates are written `YYYY-MM-DD`, like `"2026-10-20"`.
- If you need a double quote inside text, use the curly ones “like this”.
- Formatting you can use in any text: `*italic*`, `~~struck through~~`, and `[[hidden]]` for a black redaction bar.

If you break a file (a missing comma is the usual cause), the page shows a red "Content typo" box naming the file and the line. Fix that line and reload.

### Adding a hypothesis

Copy an existing entry in `content/hypotheses.js`, paste it at the end of the list, and change it. Give it the next number (`H-07`). When your confidence changes later, don't overwrite it: add a line to its `history` and the chart draws itself. When you change your wording, add a `revisions` entry. The house rule is never erase.

### Sealing a letter

1. Write the letter somewhere private.
2. On the Back pocket page, open **Check a letter against its fingerprint**, paste the letter, and press **Check it**.
3. Copy the fingerprint it shows into that letter's `fingerprint` in `content/pocket.js`.
4. On the opening day, paste the letter's text into `text: "..."` and publish. Visitors can paste it into the same box and see it match.

The three letters were sealed on 21 October 2026. Keep the separately supplied private text files safe; their bodies are deliberately absent from this public repository. To replace a letter, generate a new fingerprint and update its sealing date.

The repository is public and keeps every past version of every file, so a letter's text must never be committed before its opening day, not even for a minute. The same goes for anything else you wouldn't put on the site itself.

### References: books, courses, films, articles, videos and podcasts

The References page is everything that's shaped how you think. The two pages hold "Start here", what's on the desk now, the numbers and the antilibrary; the whole collection sits on a fold-out sheet underneath, with the books on a bookcase and everything else as cards or a list.

**Books come from Goodreads.** Read, rate and review there as usual, and the site catches up by the next morning.

- **How it works:** every day at 06:00 India time, GitHub runs `tools/goodreads_sync.py`. It reads your public Goodreads shelves and rewrites `content/books.js`. If nothing changed, nothing happens. If Goodreads is down or sends back a suspiciously short list, the site keeps what it already has.
- **To sync right now:** on GitHub, open **Actions → Sync Goodreads → Run workflow**.
- **Keep your Goodreads profile public**, or the sync can't see your shelves.
- **Genres are decided here, not on Goodreads.** `content/shelves.js` puts every book on one shelf by what it's actually about (fantasy, horror, history, money and so on) and can file it under a few more genres for the filters. A book you add on Goodreads waits in a pale "To shelve" section until its Goodreads id is added to `shelves.js`. The morning job lists any such books in its summary (Actions → the latest run).
- **Spine colours** come from each book's cover, worked out once when the cover is first saved. A spine's height follows the page count; a gold star means five stars, and a red ribbon means you wrote a review.
- **To change how a book shows here** without touching Goodreads, add a note to `content/references.js`: `hide`, `why`, `line`, or a tidier `title`. The top of that file explains each one.
- **Proofread reviews:** 36 reviews have a lightly proofread copy in `content/references.js` (spelling, capitals and grammar; your words). Each copy is used only while your review on Goodreads still matches its `was` text exactly, so if you edit a review on Goodreads, your new version shows instead.
- **Covers** are saved in `assets/covers/` (one per book, named by its Goodreads id) the first time the sync sees a book, from Goodreads or else Open Library. To replace a cover, put your own image there with the same name. Books with no cover anywhere get a drawn one.
- **"Start here"** (the five at the top of References) is the `startHere` list in `content/references.js`. Change the ids to change them.

**Everything else goes in the log** at the bottom of `content/references.js`, one line each. Paste the link, and the next morning `tools/links_sync.py` fills in the title, who made it, the year and a picture (saved in `content/media.js` and `assets/refs/`):

```js
{ type: "film", link: "https://www.imdb.com/title/tt0816692/", date: "2024-11", rating: 5, note: "What I thought of it." },
{ type: "video", link: "https://www.youtube.com/watch?v=aircAruvnKk", topics: ["tech"] },
{ type: "podcast", link: "https://open.spotify.com/episode/...", status: "doing" },
{ type: "course", title: "Bloomberg Market Concepts", by: "Bloomberg", date: "2025" },
```

- **Films** work best as an IMDb or Wikipedia link: the poster, director, year and running time come from Wikidata and Wikipedia.
- **YouTube and Spotify** links fill themselves in. For any other page (an article, a course), the sync reads the page's own title and preview picture. If it guesses wrong, write `title` and `by` yourself: what you write always wins.
- **`status`** is `done` (the default), `doing` (it shows on the desk), `queued` (it goes to the antilibrary) or `dropped`. **`date`** can be a year, a month or a day. **`topics`** are genre keys from `shelves.js`.
- **No link?** Write `title` and `by`, and it gets a drawn cover: a certificate for a course, a poster for a film, a clipping for an article.
- **To sync a new link right now,** run the same workflow: **Actions → Sync Goodreads → Run workflow**.

- **Link previews:** `assets/img/share-library.png` is the image WhatsApp and LinkedIn show for the References link. WhatsApp keeps old previews for a while, so a changed image can take a day or so to appear in chats.
- **Link to a single thing:** `vikasinpencil.com/references.html#book-21` opens that book's card (the number is its Goodreads id). Anything in the log has a link too: open its card and copy the address.
- GitHub pauses scheduled jobs in a repository after 60 days with no commits. If the shelves stop updating, open the **Actions** tab and re-enable "Sync Goodreads".

## Your desk

`desk.html` is your own home page, beside the public notebook: **vikasinpencil.com/desk.html**. A small door icon leads there from the landing page and from the top bar of every page. Search engines are asked not to list it. It's built around three questions: what do I want to do, what's the easiest way to begin, and where did I leave off?

- **Continue:** your projects, each with one clear next step, its milestones and the notes you leave for next time. Rename, share, put away, bring back or delete any of them.
- **Choose:** say how much energy and time you have, and it suggests a few things: the next step on your project, something from your Library, a question worth thinking through, and always one thing away from the screen.
- **Capture:** thoughts, ideas and questions, out of your head. Edit them, sort them, or turn one into a project or the next step. "To read or watch" goes to the Library.
- **Unwind:** films, albums and talks you saved on purpose, two minutes of breathing, and your list of things to do away from screens.
- **Library:** books, articles, essays, videos and anything else, with a link and a note. Mark them started or finished.
- **Doors:** your usual websites and tools, in groups you name, in the order you choose.
- **Focus sessions:** "Pick it up" and "Just 5 minutes" start a quiet timer. When it ends, it asks where you stopped, and that note greets you next time.
- **"I'm stuck":** helps you shrink the next step, or swap it for something lighter.

Nothing is filled in for you. A new desk offers a few starting points (your notebook's experiments, some doors, some off-screen ideas), and you choose whether to use them.

### Agentic AI (once Curiosity Cat)

`curiosity.html` (the Agentic AI link on the desk) is a small learning app about AI agents, set like a weekly news magazine. Each discovery runs: a hook, your prediction (in one of several formats) and how sure you are, the reveal with optional depth, a simulation for some, a real experiment to try with a chatbot, and a next discovery with a reason.

- **What comes next** is chosen in this order: ideas due back (as a new scenario, sooner if you were unsure or surprised), then more of what you asked for, then something related to what you just did, then the next step on the path. Tune explains this and lets you change it per topic.
- **Progress** (answers, saved discoveries, notes, experiments) is kept with your desk in the cloud, in its own private settings row, so it syncs between devices. Visitors' progress stays in their own browser.
- **Adding a discovery:** copy one in `content/curiosity.js` and change it. The comment at the top lists every field. New topics need no code changes.

### Who can see it, and who can change it

- **You** sign in (the "Owner sign in" link at the foot of the desk) and can change everything.
- **Everyone else** sees only what you mark **Show this to visitors**: projects, Library items and doors. Notes, captured ideas and everything else are never shown, and the database refuses to share them even by mistake. Settings → "See what visitors see" shows you exactly what they get.
- The rules live in the database itself (`supabase/schema.sql`), not in the page, so knowing the address or reading the code doesn't let anyone in. Only the account listed as the owner can change anything.

### Where it's kept

In your Supabase project: a free database that the desk signs in to. Open the desk on your laptop or your phone, sign in, and it's the same desk. Every change is saved on the device first and reaches the cloud a moment later, so the desk keeps working offline and catches up when you're back online. The line at the top right says **Saved**, **Saving…** or **Offline · will sync**.

Signing out removes your private things from that device. They stay in the cloud.

Until Supabase is connected, the desk keeps everything in the browser instead, and says so at the top.

**Backups:** Settings → **Download a backup** saves everything as one file. **Restore a backup** adds a backup's items back and never deletes anything. It also reads backups from the first, browser-only desk.

**The first desk:** if a browser still has the earlier, browser-only desk, the desk offers to **Bring it in** once you've signed in.

**On your phone:** open the desk and choose "Add to Home Screen" (Safari) or "Install app" (Chrome). It opens like an app, with its own icon.

### Connecting Supabase (once)

1. Make a free account at [supabase.com](https://supabase.com) and create a project. Pick the region nearest you (Mumbai). Supabase asks for a database password: let it generate one and keep it in your password manager. The desk never needs it.
2. In the project, open **SQL Editor**, paste all of `supabase/schema.sql`, and press **Run**.
3. **Authentication → Users → Add user → Create new user:** your email and a strong password, with "Auto Confirm User" ticked.
4. Back in the SQL Editor, run the last line of `schema.sql` with your email in it. That makes you the owner.
5. In **Authentication**, turn off **Allow new users to sign up**. (Even if someone did sign up, they couldn't change anything.)
6. Copy the **Project URL** and the **publishable key** (it starts with `sb_publishable_`; older projects call it the "anon public" key) into `assets/js/desk-config.js`.

Both of those are meant to be public, so they're safe in this repository. **Never** put the secret key (`sb_secret_…` or `service_role`) or the database password in any file here: anyone can read this repository. The desk refuses to run with a secret key in its config.

**The free plan pauses** a project after about a week with no activity (using the desk counts). A paused project keeps your things: open the Supabase dashboard, restore it, and the desk works again. Restoring isn't possible forever, though, so download a backup now and then.

## What visitors can do, and where it's saved

| Interaction | Where it goes |
|---|---|
| Bets on hypotheses, witness signatures, hidden notes found, sections visited | Saved only in that visitor's own browser |
| Margin notes, "Recommend me something", "Tell me when it opens" | Prepared as an email from the visitor's own email app, to your address |

Version 2 can add a small free database so you see bets and signatures from everyone.

## Before you share the link (launch checklist)

1. Replace every `[bracket]` in the `content/` files.
2. Put your CV in `assets/` as `cv.pdf` and set `cvFile: "assets/cv.pdf"` in `content/site.js`. Check its footer first: everything in it becomes public, including any phone number, date of birth or personal email.
3. Check that email to `hello@vikasinpencil.com` reaches your inbox (forwarding is set up in ImprovMX; see "Where it lives" below).
4. Check your employer's policy before describing any client work, even redacted.
5. Write and seal at least one real letter.
6. In `content/site.js`, set `draft: false`.
7. In `robots.txt`, replace `Disallow: /` with `Allow: /`.

## Where it lives

| What | Where |
|---|---|
| The code | [github.com/vikassingh2002/vikasinpencil](https://github.com/vikassingh2002/vikasinpencil). Public, because GitHub Pages is free for public repositories |
| Hosting | GitHub Pages, publishing the `main` branch. Free, with HTTPS |
| Domain | `vikasinpencil.com`, registered at Hostinger. Its DNS records (below) point it at GitHub |
| Email | `hello@vikasinpencil.com`, forwarded to your own inbox by ImprovMX (free plan) |

### Publishing a change

Every change that lands on the `main` branch is live about a minute later.

- **In the browser (easiest):** open the file on GitHub (for example `content/today.js`), click the pencil icon, make your change, and press **Commit changes**.
- **From this folder:** edit the file, then run `git add -A`, `git commit -m "Update today"` and `git push`.

To see whether it worked, open the repository's **Actions** tab. A green tick next to "pages build and deployment" means it's live. A red cross means it didn't publish, and the old version stays up.

### DNS records at Hostinger

In hPanel: **Domains → vikasinpencil.com → DNS / Nameservers**. The domain needs exactly these, and no other A, AAAA or `www` records:

| Type | Name | Points to | Why |
|---|---|---|---|
| A | `@` | `185.199.108.153` | The site |
| A | `@` | `185.199.109.153` | The site |
| A | `@` | `185.199.110.153` | The site |
| A | `@` | `185.199.111.153` | The site |
| AAAA | `@` | `2606:50c0:8000::153` | The site, over IPv6 |
| AAAA | `@` | `2606:50c0:8001::153` | The site, over IPv6 |
| AAAA | `@` | `2606:50c0:8002::153` | The site, over IPv6 |
| AAAA | `@` | `2606:50c0:8003::153` | The site, over IPv6 |
| CNAME | `www` | `vikassingh2002.github.io` | `www.vikasinpencil.com` |
| MX | `@` | `mx1.improvmx.com`, priority 10 | Email forwarding |
| MX | `@` | `mx2.improvmx.com`, priority 20 | Email forwarding |
| TXT | `@` | `v=spf1 include:spf.improvmx.com ~all` | Email forwarding |

Never add a wildcard (`*`) record. If you ever switch GitHub Pages off for this repository, delete the A, AAAA and `www` records too, or someone else could claim your domain on GitHub.

### Moving to another host later

The site is plain files, so moving means uploading this folder to the new host and changing the DNS records above. Nothing is locked in.

## The monthly routine (about 15 minutes)

- On the 20th: rewrite `today.js`, and set `date` and `nextUpdate` (including the "Reading" line).
- Books need nothing: Goodreads syncs itself every morning. Add any course, film, article, video or podcast worth keeping to the log in `references.js`.
- Move any confidence that changed (add a `history` line).
- Resolve any bets that are due (`outcome: true` or `false`).
- Anything you got wrong goes in `errata.js`.
- Commit the changes (see "Publishing a change") and check the site.

## Field notes and building updates

- Edit content/notes.js to add a note: a unique id (N-04), date, title, topic, paragraphs, and optional see link (E-01 or references). No schedule required.
- content/today.js holds the current snapshot and a dated log. Add milestones only when they happen.
- Experiments support planned, running and concluded. Optional tools, lessons, demo and source fields add context; demo/source must be full HTTPS links. Never mark a proposed tool as something already used.
- The earlier E-01 progress was starter copy. Its correction is visible in Errata and on the entry; add actual observations only after doing the work.
- Field notes are intentionally broad: books, history, science and personal writing belong alongside AI.
- Update content when there is something to record. The original monthly routine above is optional, not a public promise.
