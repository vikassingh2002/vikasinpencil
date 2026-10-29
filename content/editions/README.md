# Publishing the Monday edition

The current issue is dated **26 October 2026**, with a news window of **19–26 October** and a knowledge cutoff of **26 October**. It is a retrospective issue assembled on 29 October; that distinction is recorded in its colophon. The next issue date is 2 November. Publication is manual: dates do not automatically create or publish content.

`content/ai-articles.js` contains the edition catalogue, articles and separate news briefs. `assets/js/agentic-art.js` maps each article to one distinct local source image. Each article uses its own image consistently on cards and in the reader. A cover has its own asset and is not borrowed from an article.

## Add an issue

1. Add the new sourced articles, each with a new ID, `editionId`, date, event date, body, and source URLs with publication dates. Use a deliberate mix of current news and substantial conceptual explainers. Older source material is welcome when available by the issue cutoff; an article does not need a new event in the news week. Verify developments and claims against material available by the issue cutoff. Attribute company claims and research findings. Do not silently backdate later information.
2. Add a different image for each new article under `assets/img/editorial/` and a mapping in `agentic-art.js`. Renaming or cropping an existing source image does not satisfy the one-image-per-article rule. Record credits and illustrative context in `credits.md`.
3. Add a separate cover asset. Add an entry to `editions` with a Monday `date`, a coverage window, `articleIds`, `leadId`, cover path, title, subtitle, actual `assembledAt` date and colophon note. Retain every previously published entry and article.
4. Choose six or seven separate short `briefs` for the issue. These are factual news paragraphs, not article standfirsts. Each points to its analysis and a dated source in the news window. Put their IDs in `briefIds`, and select six `chunkIds` for the separate short-read panels. The digest is one vertical page; seven working navigation dots link it and its six short reads.
5. Change `currentEdition` to the new issue ID and `reviewed` to its cutoff date. Run `node tools/validate-editions.cjs`.
6. Review home, the article reader, AI in Brief, Weekly and Browse editions at phone and laptop widths before committing and pushing to GitHub Pages.

Stable routes:

- `curiosity.html#weekly/2026-10-26` — fixed issue
- `curiosity.html#weekly/2026-10-26/science` — issue section
- `curiosity.html#brief/2026-10-26` — issue news digest
- `curiosity.html#editions` — published edition archive
- `curiosity.html#a/ipo-20261026` — individual article

The earlier undated/evergreen draft collection is preserved in `content/archive/ai-background-2026-10-29.js`. It is not loaded as the October 26 issue. Browser and cloud reading data are retained.

Editorial mix: the current edition contains eight 5–6 minute briefings/explainers and four shorter news analyses. Reading time is calculated from the actual body at 200 words per minute. Do not lengthen read-time labels without adding substantive content.

Back issues dated 28 September, 5 October, 12 October and 19 October 2026 were assembled retrospectively on 29 October, each with its own news window, digest, short reads and public-domain cover painting. Their article photographs come from Wikimedia Commons; credits are in `assets/img/editorial/credits.md`. There is no Node on the author's laptop, so the same checks as `tools/validate-editions.cjs` were run with a Python port before publishing.

## Charts, maps and calculators

An article body can include `{"chart": "id"}` between paragraphs. Each id is defined in `assets/js/agentic-charts.js` (`D['id'] = {...}`) with a title, subtitle, source line and either HTML (bars, dumbbells, timelines, tables, tile maps, numbers), an SVG drawing (columns, lines, slopes, maps, diagrams; redrawn at the width shown) or a calculator. Every figure must come from the article's sources; illustrative arithmetic is labelled. Readers can tap or hover any mark for its value. `tools/validate-editions.cjs` rejects unknown chart ids.
