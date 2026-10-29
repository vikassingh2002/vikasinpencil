# Agentic AI app

Install entry: https://vikasinpencil.com/agentic/
Manifest identity, scope and start URL are /agentic/. Keep Desk's manifest unchanged.
The legacy /curiosity.html page shares this renderer and provides an Install app link.
Keep curiosity.html and agentic/index.html in sync when changing scripts or metadata.
The service worker only controls /agentic/ and only caches public static files, never
Supabase authentication or API responses. Offline launch still requires reconnecting
to verify owner access. Article availability offline is not promised.
For future releases bump script/style query tokens and the worker cache version together.

## Typography

The reference PDF embeds subsetted Economist Serif and Economist Sans. These are bespoke
publisher fonts; no font software was extracted or republished from the reference PDFs.
Current substitutes are self-hosted Newsreader (normal/italic variable) and Roboto Condensed
(variable), distributed under the SIL Open Font License. Licence texts are alongside fonts
in assets/fonts. Download sources:
https://github.com/google/fonts/tree/main/ofl/newsreader
https://github.com/google/fonts/tree/main/ofl/robotocondensed
Typography reference: https://marber.economist.com/8e1dcf0b8/p/96e5d5
An exact match requires appropriate licensed webfont files and @font-face configuration.
