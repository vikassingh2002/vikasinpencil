# Public Agentic AI

Canonical app: https://vikasinpencil.com/agentic/
Legacy curiosity.html redirects while preserving query and hash article links.
Agentic AI is public: no Desk sign-in, Supabase scripts, cloud credentials or owner check.
Bookmarks, follows and reading history use agentic.reader.v1 in each browser, separately
from Desk. No cross-device bookmark sync is offered. Desk authentication is unchanged.

Agentic manifest identity/start/scope: /agentic/.
Desk explicit identity and scope: /desk.html (same identity as its original inferred ID).
Desk's old root scope overlapped Agentic and suppressed its installation prompt.
Existing installed Desk metadata updates on the browser's own schedule. Readers with
stale metadata may need to reopen Desk online and allow an update, or reinstall its
shortcut without clearing website data. Never clear Desk storage as an install fix.

Worker controls /agentic/ only; caches the public reader shell, content and fonts, plus
images as visited. Offline article text works after the shell download. Unvisited images
need a connection. Bump worker cache and script query versions together on future releases.

Fonts: self-hosted Newsreader and Roboto Condensed, under the adjacent SIL OFL licences.
No fonts were extracted from the reference PDFs. Exact Economist typefaces need licensed
webfont files. Sources: https://github.com/google/fonts/tree/main/ofl/newsreader and
https://github.com/google/fonts/tree/main/ofl/robotocondensed
