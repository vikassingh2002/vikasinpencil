#!/usr/bin/env python3
"""Refresh content/books.js from your Goodreads shelves.

Reads the public RSS feed of each Goodreads shelf and writes every book, with
your rating and review, to content/books.js. Run it from anywhere:

    python tools/goodreads_sync.py

A GitHub Action runs it every morning (.github/workflows/goodreads-sync.yml).
It uses only Python's standard library, and it never overwrites the library
with a suspiciously small one (if Goodreads is down, nothing changes).
"""
import html
import json
import re
import sys
import time
import urllib.request
import xml.etree.ElementTree as ET
from datetime import date
from email.utils import parsedate_to_datetime
from pathlib import Path

GOODREADS_USER = "115146123"
SHELVES = ["currently-reading", "read", "did-not-finish", "to-read"]
FEED = "https://www.goodreads.com/review/list_rss/{user}?shelf={shelf}&page={page}"
PROFILE = f"https://www.goodreads.com/user/show/{GOODREADS_USER}"
PAGE_SIZE = 100
USER_AGENT = "Mozilla/5.0 (compatible; vikasinpencil-sync; +https://vikasinpencil.com)"
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "content" / "books.js"
COVERS = ROOT / "assets" / "covers"
OPEN_LIBRARY = "https://covers.openlibrary.org/b/isbn/{isbn}-L.jpg?default=false"

HEADER = """/* =============================================================
   BOOKS: generated from Goodreads. Don't edit this file by hand.

   tools/goodreads_sync.py rewrites it every morning from your
   Goodreads shelves, so anything changed here gets overwritten.
   To change how a book appears on the site (proofread a review,
   hide a book, say why it's on your list), use content/references.js.
   ============================================================= */
window.NB = window.NB || {};

"""


def fetch(url, tries=4):
    for attempt in range(1, tries + 1):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(req, timeout=40) as resp:
                return resp.read()
        except Exception as err:  # network hiccups, 5xx, throttling
            if attempt == tries:
                raise RuntimeError(f"Couldn't fetch {url}: {err}") from err
            time.sleep(5 * attempt)


def text(el, tag):
    if el is None:
        return ""
    found = el.find(tag)
    return (found.text or "").strip() if found is not None else ""


def squash(s):
    return re.sub(r"\s+", " ", html.unescape(s or "")).strip()


def iso_day(rfc822):
    if not rfc822:
        return ""
    try:
        return parsedate_to_datetime(rfc822).date().isoformat()
    except (TypeError, ValueError):
        return ""


def clean_review(raw):
    if not raw:
        return ""
    s = re.sub(r"<br\s*/?>", "\n", raw, flags=re.I)
    s = re.sub(r"</p>\s*<p[^>]*>", "\n\n", s, flags=re.I)
    s = re.sub(r"<[^>]+>", "", s)
    s = html.unescape(s).replace("\r\n", "\n").replace(" ", " ")
    s = re.sub(r"[ \t]+\n", "\n", s)
    s = re.sub(r"\n{3,}", "\n\n", s)
    return s.strip()


def split_title(full):
    """'Name: Subtitle (Series, #2)' -> ('Name', 'Subtitle', 'Series #2')."""
    series = ""
    m = re.match(r"^(.*?)\s*\(([^()]*?),?\s*#\s*([\d.]+(?:\s*-\s*[\d.]+)?)\)\s*$", full)
    if m:
        full, series = m.group(1).strip(), f"{m.group(2).strip()} #{m.group(3).replace(' ', '')}"
    name, _, subtitle = full.partition(": ")
    return name.strip(), subtitle.strip(), series


def parse_item(item, shelf):
    title, subtitle, series = split_title(squash(text(item, "title")))
    pages = text(item.find("book"), "num_pages")
    tags = [t.strip() for t in squash(text(item, "user_shelves")).split(",")]
    try:
        avg = round(float(text(item, "average_rating") or 0), 2)
    except ValueError:
        avg = 0
    return {
        "id": text(item, "book_id"),
        "shelf": shelf,
        "title": title,
        "subtitle": subtitle,
        "series": series,
        "author": squash(text(item, "author_name")),
        "rating": int(text(item, "user_rating") or 0),
        "read": iso_day(text(item, "user_read_at")),
        "added": iso_day(text(item, "user_date_added")),
        "published": text(item, "book_published"),
        "pages": int(pages) if pages.isdigit() and int(pages) > 0 else None,
        "avg": avg,
        "tags": [t for t in tags if t and t not in SHELVES],
        "review": clean_review(text(item, "user_review")),
        "_image": text(item, "book_large_image_url") or text(item, "book_image_url"),
        "_isbn": re.sub(r"[^0-9Xx]", "", text(item, "isbn")),
    }


def fetch_shelf(shelf):
    books = []
    for page in range(1, 51):
        root = ET.fromstring(fetch(FEED.format(user=GOODREADS_USER, shelf=shelf, page=page)))
        if root.find("channel") is None:
            raise RuntimeError(f"Goodreads sent something that isn't a shelf feed for '{shelf}'.")
        items = root.findall("./channel/item")
        books.extend(parse_item(item, shelf) for item in items)
        if len(items) < PAGE_SIZE:
            return books
        time.sleep(1)
    return books


def is_image(data):
    return len(data) > 2000 and (data[:3] == b"\xff\xd8\xff" or data[:8] == b"\x89PNG\r\n\x1a\n")


def cover_urls(book):
    """Goodreads first (asking for a 400px-tall copy), then Open Library by ISBN."""
    urls = []
    image = book["_image"]
    if image and "nophoto" not in image:
        sized = re.sub(r"\._S[XY]\d+_(?=\.\w+$)", "", image)
        urls.append(re.sub(r"(\.\w+)$", r"._SY400_\1", sized))
        urls.append(image)
    if book["_isbn"]:
        urls.append(OPEN_LIBRARY.format(isbn=book["_isbn"]))
    return urls


def save_cover(book):
    """Keeps a copy of each cover in assets/covers/ so the site never depends on Goodreads' image links.
    A cover is downloaded once; delete the file to fetch it again."""
    path = COVERS / f"{book['id']}.jpg"
    if path.exists():
        return path
    for url in cover_urls(book):
        try:
            data = fetch(url, tries=2)
        except RuntimeError:
            continue
        if is_image(data):
            COVERS.mkdir(parents=True, exist_ok=True)
            path.write_bytes(data)
            time.sleep(0.3)
            return path
    return None


def sort_key(book):
    # Newest first: read date for finished books, date added for the rest.
    when = book["read"] if book["shelf"] == "read" else book["added"]
    return (SHELVES.index(book["shelf"]), -(int(when.replace("-", "")) if when else 0), book["title"].lower())


def load_previous():
    if not OUT.exists():
        return None
    m = re.search(r"NB\.goodreads = (\{.*\});", OUT.read_text(encoding="utf-8"), re.S)
    return json.loads(m.group(1)) if m else None


def render(data):
    lines = ",\n".join(json.dumps(b, ensure_ascii=False, separators=(",", ":")) for b in data["books"])
    return (
        HEADER
        + "NB.goodreads = {\n"
        + f'"profile":{json.dumps(data["profile"])},\n'
        + f'"synced":{json.dumps(data["synced"])},\n'
        + '"books":[\n' + lines + "\n]\n};\n"
    )


def main():
    seen, books = set(), []
    for shelf in SHELVES:
        for book in fetch_shelf(shelf):
            if book["id"] and book["id"] not in seen:
                seen.add(book["id"])
                books.append(book)
    books.sort(key=sort_key)
    for book in books:
        path = save_cover(book)
        book["cover"] = f"assets/covers/{path.name}" if path else ""
        del book["_image"], book["_isbn"]

    previous = load_previous()
    old_read = sum(1 for b in (previous or {}).get("books", []) if b.get("shelf") == "read")
    new_read = sum(1 for b in books if b["shelf"] == "read")
    if not books or new_read < old_read * 0.5:
        sys.exit(f"Stopping: Goodreads returned {new_read} read books (the site has {old_read}). Nothing was changed.")

    counts = {s: sum(1 for b in books if b["shelf"] == s) for s in SHELVES}
    summary = ", ".join(f"{s} {n}" for s, n in counts.items())
    if previous and previous.get("books") == books:
        print(f"No changes on Goodreads ({summary}).")
        return
    OUT.write_text(render({"profile": PROFILE, "synced": date.today().isoformat(), "books": books}), encoding="utf-8", newline="\n")
    print(f"Updated {OUT.name} ({summary}).")


if __name__ == "__main__":
    main()
