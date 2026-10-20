# Vikas in Pencil

Your lab-notebook website for **vikasinpencil.com**. Plain HTML, CSS and JavaScript: no build step, no framework, nothing to pay for. Every file in this folder is yours, and the whole site moves to any host by copying the folder.

## What's where

| Path | What it is | Do you edit it? |
|---|---|---|
| `content/` | Everything the site says | **Yes. This is the only folder you normally touch.** |
| `assets/img/` | Favicon and the link-preview image | Add your CV here as `cv.pdf` |
| `index.html` and the other `.html` files | Page shells | Rarely |
| `assets/css/notebook.css` | The look | Only for design changes |
| `assets/js/notebook.js` | How the notebook behaves | Only for new features |
| `robots.txt` | Tells search engines to stay out while it's a draft | Once, at launch |
| `CNAME` and `.nojekyll` | Tell GitHub Pages your domain, and to publish the files exactly as they are | Never. Don't delete them |
| `tools/goodreads_sync.py` | Copies your Goodreads shelves into `content/books.js` | Never. It runs itself every morning |
| `.github/workflows/goodreads-sync.yml` | The daily job that runs that copy on GitHub | Never |

## Editing what the site says

Each notebook section has one file in `content/`:

| File | Section |
|---|---|
| `site.js` | Your name, email, the cover, the 30-second version, house rules, hidden notes |
| `today.js` | The Today page (rewrite it on the 20th of each month) |
| `hypotheses.js` | Hypotheses |
| `experiments.js` | Experiments |
| `references.js` | Your notes on books: proofread reviews, hidden books, why a book is on your list |
| `books.js` | Your Goodreads shelves, copied every morning. **Don't edit it**: each sync overwrites it |
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

The three fingerprints there now are placeholders: they're the fingerprint of an empty letter.

The repository is public and keeps every past version of every file, so a letter's text must never be committed before its opening day, not even for a minute. The same goes for anything else you wouldn't put on the site itself.

### Your reading comes from Goodreads

The References page is your Goodreads library: every book you've read with your stars and review, what you're reading now, what you didn't finish, and your want-to-read shelf as the antilibrary. Nothing to edit here. Read, rate and review on Goodreads as usual, and the site catches up by the next morning.

- **How it works:** every day at 06:00 India time, GitHub runs `tools/goodreads_sync.py`. It reads your public Goodreads shelves and rewrites `content/books.js`. If nothing changed, nothing happens. If Goodreads is down or sends back a suspiciously short list, the site keeps what it already has.
- **To sync right now:** on GitHub, open **Actions → Sync Goodreads → Run workflow**.
- **Keep your Goodreads profile public**, or the sync can't see your shelves.
- **Spine colours** follow your Goodreads shelves (fantasy, paranormal, indian and so on). Books you haven't shelved there show as pale "Unshelved" spines; shelve them on Goodreads and they take their colour the next morning.
- **To change how a book shows here** without touching Goodreads, add a note to `content/references.js`: `hide`, `why`, `line`, or a tidier `title`. The top of that file explains each one.
- **Proofread reviews:** 36 reviews have a lightly proofread copy in `content/references.js` (spelling, capitals and grammar; your words). Each copy is used only while your review on Goodreads still matches its `was` text exactly, so if you edit a review on Goodreads, your new version shows instead.
- **Link to a single book:** `vikasinpencil.com/references.html#book-21` opens that book's card (the number is its Goodreads id).
- GitHub pauses scheduled jobs in a repository after 60 days with no commits. If the shelves stop updating, open the **Actions** tab and re-enable "Sync Goodreads".

## What visitors can do, and where it's saved

| Interaction | Where it goes |
|---|---|
| Bets on hypotheses, witness signatures, hidden notes found, sections visited | Saved only in that visitor's own browser |
| Margin notes, "Lend me a book", "Tell me when it opens" | Prepared as an email from the visitor's own email app, to your address |

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
- Books need nothing: Goodreads syncs itself every morning.
- Move any confidence that changed (add a `history` line).
- Resolve any bets that are due (`outcome: true` or `false`).
- Anything you got wrong goes in `errata.js`.
- Commit the changes (see "Publishing a change") and check the site.
