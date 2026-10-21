/* =============================================================
   Vikas in Pencil: how the notebook behaves.

   You don't need to edit this file to change what the site says.
   Everything you write lives in the content/ folder.
   ============================================================= */
(function () {
  'use strict';

  var NB = window.NB = window.NB || {};
  var root = document.querySelector('[data-page]');
  if (!root) return;
  var current = root.getAttribute('data-page');
  var reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  document.documentElement.classList.add('js');

  /* ------------------------------------------------------------
     Helpers
     ------------------------------------------------------------ */

  var ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ESC[c]; }); }

  // Light formatting for anything written in content/: ~~struck~~, *italic*, [[hidden]]
  function rich(s) {
    return esc(s)
      .replace(/~~(.+?)~~/g, '<s>$1</s>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\[\[hidden\]\]/g, '<span class="redacted" aria-hidden="true"></span><span class="visually-hidden">redacted</span>');
  }

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var MONTH = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var DAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  function toDate(iso) {
    if (!iso || !/^\d{4}-\d{1,2}-\d{1,2}$/.test(String(iso))) return null;
    var p = String(iso).split('-');
    var d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
    return isNaN(d.getTime()) ? null : d;
  }
  function fmt(iso, style) {
    var d = toDate(iso);
    if (!d) return iso ? String(iso) : '';
    if (style === 'long') return d.getDate() + ' ' + MONTH[d.getMonth()] + ' ' + d.getFullYear();
    if (style === 'day') return DAY[d.getDay()] + ', ' + d.getDate() + ' ' + MONTH[d.getMonth()];
    if (style === 'short') return d.getDate() + ' ' + MON[d.getMonth()];
    if (style === 'month') return MON[d.getMonth()] + ' ' + d.getFullYear();
    return d.getDate() + ' ' + MON[d.getMonth()] + ' ' + d.getFullYear();
  }
  function todayIso() {
    var d = new Date();
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }
  function daysUntil(iso) {
    var d = toDate(iso);
    if (!d) return null;
    return Math.ceil((d.getTime() - Date.now()) / 86400000);
  }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }
  function pad2(n) { var s = String(n); return s.length < 2 ? '0' + s : s; }

  function makeStore(kind) {
    return {
      get: function (k, fallback) {
        try { var v = window[kind].getItem('nb.' + k); return v === null ? fallback : JSON.parse(v); }
        catch (e) { return fallback; }
      },
      set: function (k, v) { try { window[kind].setItem('nb.' + k, JSON.stringify(v)); } catch (e) { /* storage blocked */ } },
      del: function (k) { try { window[kind].removeItem('nb.' + k); } catch (e) { /* storage blocked */ } }
    };
  }
  var store = makeStore('localStorage');
  var session = makeStore('sessionStorage');

  function list(x) { return Array.isArray(x) ? x : []; }
  var site = NB.site || {};
  var today = NB.today || {};
  var hyps = list(NB.hypotheses);
  var exps = list(NB.experiments);
  var refs = NB.references || {};
  var errata = list(NB.errata);
  var letters = list(NB.letters);
  var bets = list(NB.bets);

  /* References: books from Goodreads (content/books.js), shelved by
     content/shelves.js, plus films, articles, courses, videos and podcasts
     from the log in content/references.js, filled in by the morning sync
     (content/media.js). All of them become one kind of item. */
  var gr = NB.goodreads || {};
  var shelving = NB.shelves || {};
  var media = NB.media || {};
  var notes = refs.notes || {};

  var GENRES = list(shelving.genres).map(function (g) {
    var label = g.label || String(g.key);
    return { key: String(g.key), label: label, short: g.short || label, family: g.family || 'ideas', color: g.color || '#8A8577', thread: !!g.thread };
  });
  var UNSHELVED = { key: 'unshelved', label: 'Still to be shelved', short: 'To shelve', family: 'stories', color: '#C9C1AE', thread: false };
  var FAMILIES = list(shelving.families).length ? list(shelving.families) : [{ key: 'stories', label: 'Stories' }, { key: 'ideas', label: 'Ideas' }];
  function genreByKey(key) {
    for (var i = 0; i < GENRES.length; i++) if (GENRES[i].key === key) return GENRES[i];
    return key === UNSHELVED.key ? UNSHELVED : null;
  }
  function genresFor(keys) {
    var out = [];
    list(keys).forEach(function (k) { var g = genreByKey(String(k)); if (g && out.indexOf(g) === -1) out.push(g); });
    return out;
  }
  function shelfOf(genres) {
    for (var i = 0; i < genres.length; i++) if (!genres[i].thread) return genres[i];
    return UNSHELVED;
  }

  var KINDS = [
    { key: 'book', label: 'Books', one: 'book', many: 'books', link: 'On Goodreads',
      words: { done: 'Read', doing: 'Reading now', queued: 'Want to read', dropped: 'Didn\'t finish' } },
    { key: 'course', label: 'Courses', one: 'course', many: 'courses', link: 'The course',
      words: { done: 'Completed', doing: 'Taking now', queued: 'Want to take', dropped: 'Dropped' } },
    { key: 'film', label: 'Films', one: 'film', many: 'films', link: 'More about it',
      words: { done: 'Watched', doing: 'Watching', queued: 'Want to watch', dropped: 'Gave up on' } },
    { key: 'article', label: 'Articles', one: 'article', many: 'articles', link: 'Read it',
      words: { done: 'Read', doing: 'Reading', queued: 'To read', dropped: 'Gave up on' } },
    { key: 'video', label: 'Videos', one: 'video', many: 'videos', link: 'Watch it',
      words: { done: 'Watched', doing: 'Watching', queued: 'To watch', dropped: 'Gave up on' } },
    { key: 'podcast', label: 'Podcasts', one: 'podcast', many: 'podcasts', link: 'Listen',
      words: { done: 'Listened', doing: 'Listening', queued: 'To listen', dropped: 'Gave up on' } }
  ];
  function kindOf(key) {
    for (var i = 0; i < KINDS.length; i++) if (KINDS[i].key === key) return KINDS[i];
    return KINDS[3];
  }
  var STATUSES = ['done', 'doing', 'queued', 'dropped'];
  var BOOK_STATUS = { read: 'done', 'currently-reading': 'doing', 'to-read': 'queued', 'did-not-finish': 'dropped' };

  var MARKS = new RegExp('[' + String.fromCharCode(0x300) + '-' + String.fromCharCode(0x36f) + ']', 'g');
  function fold(s) {
    s = String(s == null ? '' : s).toLowerCase();
    try { s = s.normalize('NFD').replace(MARKS, ''); } catch (e) { /* older browser: fine without */ }
    return s;
  }
  function squashWs(s) { return String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); }
  function hostOf(link) {
    try { return new URL(link).hostname.replace(/^www\./, ''); } catch (e) { return ''; }
  }
  function slug(s) { return fold(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'item'; }
  function surname(name) {
    var first = String(name || '').split(/,| and | & /)[0].trim().split(/\s+/);
    return fold(first[first.length - 1] || '');
  }
  function finishItem(o) {
    o.genre = shelfOf(o.genres);
    o.find = fold([o.title, o.subtitle, o.series, o.by, o.source, o.genres.map(function (g) { return g.label; }).join(' ')].join(' '));
    o.sortTitle = fold(o.title).replace(/^(the|a|an)\s+/, '');
    o.sortBy = surname(o.by);
    var sn = /#\s*([\d.]+)/.exec(o.series || '');
    o.seriesName = fold(String(o.series || '').replace(/#.*$/, ''));
    o.seriesNo = sn ? Number(sn[1]) : 0;
    o.hash = (o.kind === 'book' ? 'book-' : 'ref-') + o.id;
    return o;
  }

  var library = list(gr.books).map(function (b) {
    var n = notes[b.id] || {};
    if (n.hide) return null;
    var review = b.review || '';
    // A proofread copy only stands in while Goodreads still has the words it was made from.
    if (n.review && (!n.was || squashWs(n.was) === squashWs(review))) review = n.review;
    return finishItem({
      id: String(b.id),
      kind: 'book',
      shelf: b.shelf,
      status: BOOK_STATUS[b.shelf] || 'done',
      title: n.title || b.title || '',
      subtitle: n.subtitle != null ? n.subtitle : (b.subtitle || ''),
      series: b.series || '',
      by: n.author || b.author || '',
      rating: Number(b.rating) || 0,
      date: b.read || '',
      added: b.added || '',
      year: b.published || '',
      pages: Number(b.pages) || 0,
      avg: Number(b.avg) || 0,
      note: review,
      why: n.why || '',
      line: n.line || '',
      link: 'https://www.goodreads.com/book/show/' + encodeURIComponent(b.id),
      image: b.cover || '',
      spine: b.spine || '',
      accent: b.accent || '',
      genres: genresFor((shelving.books || {})[String(b.id)])
    });
  }).filter(Boolean);

  var usedIds = {};
  var logged = list(refs.log).map(function (e) {
    if (!e || e.hide) return null;
    var kind = kindOf(e.type).key;
    var m = (e.link && media[e.link]) || {};
    var title = e.title || m.title || hostOf(e.link) || 'Untitled';
    var id = slug(kind + ' ' + title);
    while (usedIds[id]) id += '-2';
    usedIds[id] = true;
    return finishItem({
      id: id,
      kind: kind,
      status: STATUSES.indexOf(e.status) !== -1 ? e.status : 'done',
      title: title,
      subtitle: e.subtitle || '',
      series: '',
      by: e.by || m.by || '',
      source: e.source || m.source || hostOf(e.link),
      rating: Number(e.rating) || 0,
      date: String(e.date || m.date || ''),
      added: String(e.date || ''),
      year: String(e.year || m.year || ''),
      minutes: Number(e.minutes || m.minutes) || 0,
      pages: 0,
      note: e.note || '',
      why: e.why || '',
      line: e.line || '',
      link: e.link || '',
      image: e.image || m.image || '',
      genres: genresFor(e.topics)
    });
  }).filter(Boolean);

  var everything = library.concat(logged);
  function ofKind(kind) { return everything.filter(function (x) { return x.kind === kind; }); }
  function itemById(id) {
    for (var i = 0; i < everything.length; i++) if (everything[i].id === String(id)) return everything[i];
    return null;
  }
  function num(n) { return Number(n).toLocaleString('en-GB'); }
  // Log dates can be a year, a month or a day.
  function when(d, style) {
    d = String(d || '');
    if (/^\d{4}$/.test(d)) return d;
    if (/^\d{4}-\d{1,2}$/.test(d)) return MON[Number(d.split('-')[1]) - 1] + ' ' + d.slice(0, 4);
    return fmt(d, style);
  }
  function minutesText(m) {
    if (!m) return '';
    return m >= 60 ? Math.floor(m / 60) + ' h' + (m % 60 ? ' ' + (m % 60) + ' min' : '') : m + ' min';
  }

  /* Spines in their covers' colours, nudged so very dark or very pale ones still read. */
  function rgbOf(hex) {
    var m = /^#?([0-9a-f]{6})$/i.exec(String(hex || ''));
    if (!m) return null;
    var n = parseInt(m[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function hexOf(rgb) { return '#' + rgb.map(function (c) { return ('0' + Math.round(c).toString(16)).slice(-2); }).join(''); }
  function lumOf(rgb) {
    var c = rgb.map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  function contrastOf(a, b) { var x = lumOf(a), y = lumOf(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  function mixOf(a, b, t) { return a.map(function (v, i) { return v + (b[i] - v) * t; }); }
  var PAPER_RGB = [250, 247, 238], INK_RGB = [31, 42, 68];
  function spineLook(b) {
    var base = rgbOf(b.spine) || rgbOf(b.genre.color) || [120, 110, 95];
    var l = lumOf(base);
    if (l < 0.03) base = mixOf(base, PAPER_RGB, 0.14);
    else if (l > 0.8) base = mixOf(base, INK_RGB, 0.07);
    var light = contrastOf(base, PAPER_RGB) < contrastOf(base, INK_RGB);
    var ink = light ? INK_RGB : PAPER_RGB;
    var accent = rgbOf(b.accent);
    if (!accent || contrastOf(accent, base) < 2.4) accent = ink;
    return { css: '--sp:' + hexOf(base) + ';--sp-ink:' + hexOf(ink) + ';--sp-acc:' + hexOf(accent), light: light };
  }

  var STAR = 'M12 2.8l2.75 5.9 6.45.8-4.75 4.45 1.2 6.4L12 17.2l-5.65 3.15 1.2-6.4L2.8 9.5l6.45-.8z';
  var RATING_WORDS = ['', 'did not like it', 'it was ok', 'liked it', 'really liked it', 'it was amazing'];
  function starsHtml(n, extraClass) {
    var html = '';
    for (var i = 1; i <= 5; i++) html += '<svg viewBox="0 0 24 24" aria-hidden="true"' + (i <= n ? ' class="on"' : '') + '><path d="' + STAR + '"/></svg>';
    return '<span class="stars' + (extraClass ? ' ' + extraClass : '') + '" role="img" aria-label="' + (n ? n + ' of 5 stars' : 'not rated') + '">' + html + '</span>';
  }
  // The picture of a thing: its cover, poster, thumbnail or artwork when the sync found one,
  // otherwise a drawn one in the notebook's style (a cover, a certificate, a poster, a clipping...).
  var DRAWN_KICKER = { book: '', course: 'Certificate', film: 'Now showing', article: 'Clipping', video: 'Video', podcast: 'Episode' };
  function jacketHtml(x, extraClass, alt) {
    var cls = 'jacket jacket--' + x.kind + (extraClass ? ' ' + extraClass : '');
    if (x.image) {
      return '<img class="' + cls + '" src="' + esc(x.image) + '" alt="' + esc(alt || '') + '" loading="lazy" decoding="async">';
    }
    var label = alt ? ' role="img" aria-label="' + esc(alt) + '"' : ' aria-hidden="true"';
    return '<span class="' + cls + ' jacket--drawn" style="--c:' + esc(x.genre.color) + '"' + label + '>' +
      (DRAWN_KICKER[x.kind] ? '<span class="jacket__kicker">' + esc(DRAWN_KICKER[x.kind]) + '</span>' : '') +
      '<span class="jacket__title">' + esc(x.title) + '</span>' +
      (x.by ? '<span class="jacket__by">' + esc(x.by) + '</span>' : '') +
      '</span>';
  }
  function reviewHtml(text) {
    return String(text).split(/\n{2,}/).map(function (para) {
      return '<p>' + rich(para).replace(/\n/g, '<br>') + '</p>';
    }).join('');
  }

  var ICON = {
    back: '<svg class="icon" aria-hidden="true" width="16" height="16" viewBox="0 0 16 16"><path d="M13 8H3M7 4L3 8l4 4"/></svg>',
    next: '<svg class="icon" aria-hidden="true" width="16" height="16" viewBox="0 0 16 16"><path d="M3 8h10M9 4l4 4-4 4"/></svg>',
    pencil: '<svg class="icon" aria-hidden="true" width="14" height="14" viewBox="0 0 16 16"><path d="M2 14l1-3.6 8.6-8.6a1.4 1.4 0 0 1 2 0l.6.6a1.4 1.4 0 0 1 0 2L5.6 13zM9.8 3.6l2.6 2.6"/></svg>',
    arrow: '<svg class="step-arrow" aria-hidden="true" viewBox="0 0 22 14"><path d="M1 7h18M14 2l5 5-5 5"/></svg>',
    arrowLater: '<svg class="step-arrow step-arrow--later" aria-hidden="true" viewBox="0 0 22 14"><path d="M1 7h18M14 2l5 5-5 5"/></svg>',
    cat: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M14 40c-3-4-4-10-2-16l-2-12 8 6c4-1 8-1 12 0l8-6-2 12c2 6 1 12-2 16"/><path d="M14 40h20"/><path d="M19 26h.01M29 26h.01"/><path d="M22 31l2 1.5 2-1.5"/><path d="M34 40c4 0 8-2 8-7"/></svg>'
  };

  /* small HTML builders */
  function fieldHtml(key, val) {
    if (val === '' || val == null) return '';
    return '<span class="field"><span class="field__key">' + esc(key) + '</span><span class="field__val">' + esc(val) + '</span></span>';
  }
  function strip(pairs) { return '<div class="strip">' + pairs.map(function (p) { return fieldHtml(p[0], p[1]); }).join('') + '</div>'; }
  function foot(pairs) { return '<div class="foot">' + pairs.map(function (p) { return fieldHtml(p[0], p[1]); }).join('') + '</div>'; }
  function section(label, text, extraClass) {
    if (!text) return '';
    return '<p class="label gap-m">' + esc(label) + '</p><p class="prose' + (extraClass ? ' ' + extraClass : '') + '">' + rich(text) + '</p>';
  }

  /* references between entries: "H-03", "E-01", "references", ... */
  function refHref(ref) {
    if (!ref) return null;
    var r = String(ref);
    if (/^H-\d+$/i.test(r)) return 'hypotheses.html#' + r.toUpperCase();
    if (/^E-\d+$/i.test(r)) return 'experiments.html#' + r.toUpperCase();
    var map = { notes: 'notes.html', today: 'today.html', hypotheses: 'hypotheses.html', experiments: 'experiments.html', references: 'references.html', pocket: 'pocket.html', errata: 'contents.html#errata', contents: 'contents.html' };
    return map[r.toLowerCase()] || null;
  }
  function refLabel(ref) {
    var r = String(ref);
    if (/^[HE]-\d+$/i.test(r)) return r.toUpperCase();
    var names = { notes: 'Field notes', today: 'p. 01', hypotheses: 'p. 04', experiments: 'p. 12', references: 'p. 30', pocket: 'back pocket', errata: 'errata', contents: 'contents' };
    return names[r.toLowerCase()] || r;
  }
  function xref(ref, prefix) {
    var href = refHref(ref);
    if (!href) return '';
    return '<a class="xref ink-link" href="' + href + '">' + esc((prefix || '') + refLabel(ref)) + '</a>';
  }

  function mailto(subject, body) {
    return 'mailto:' + (site.email || '') + '?subject=' + encodeURIComponent(subject || '') + (body ? '&body=' + encodeURIComponent(body) : '');
  }

  function selectNode(node) {
    try {
      if (node.select) { node.focus(); node.select(); return; }
      var r = document.createRange();
      r.selectNodeContents(node);
      var s = window.getSelection();
      s.removeAllRanges();
      s.addRange(r);
    } catch (e) { /* nothing more to do */ }
  }
  function copyText(text, btn, fallback) {
    var label = btn.getAttribute('data-label') || btn.textContent;
    btn.setAttribute('data-label', label);
    function say(msg) {
      btn.textContent = msg;
      clearTimeout(btn._nbTimer);
      btn._nbTimer = setTimeout(function () { btn.textContent = label; }, 1800);
    }
    function fail() { if (fallback) fallback(); say('Select and copy'); }
    try {
      navigator.clipboard.writeText(text).then(function () { say('Copied'); }, fail);
    } catch (e) { fail(); }
  }

  function isOpenH(h) { return h && h.status !== 'retired'; }
  function letterIsOpen(l) { var d = daysUntil(l.opens); return !!(l.text && d !== null && d <= 0); }

  function lastEntryDate() {
    var dates = [today.date];
    list(NB.notes).forEach(function (n) { dates.push(n.date); });
    hyps.forEach(function (h) {
      dates.push(h.opened);
      list(h.history).forEach(function (p) { dates.push(p && p.date); });
      list(h.revisions).forEach(function (r) { dates.push(r && r.date); });
      if (h.retired) dates.push(h.retired.date);
    });
    exps.forEach(function (x) {
      dates.push(x.started, x.concluded);
      list(x.observations).forEach(function (o) { if (o && !o.pending) dates.push(o.date); });
    });
    errata.forEach(function (e) { dates.push(e.date); });
    letters.forEach(function (l) { dates.push(l.sealed); });
    everything.forEach(function (x) { if (x.status === 'done') dates.push(x.date); });
    var now = Date.now();
    var best = null;
    dates.forEach(function (iso) {
      var d = toDate(iso);
      if (d && d.getTime() <= now && (!best || d > best.d)) best = { d: d, iso: iso };
    });
    return best ? best.iso : '';
  }

  /* ------------------------------------------------------------
     The pages and the order you turn them in
     ------------------------------------------------------------ */

  var PAGES = [
    { key: 'cover', href: './', label: 'Cover' },
    { key: 'contents', href: 'contents.html', label: 'Inside cover' },
    { key: 'today', href: 'today.html', label: 'Today' },
    { key: 'hypotheses', href: 'hypotheses.html', label: 'Hypotheses' },
    { key: 'experiments', href: 'experiments.html', label: 'Experiments' },
    { key: 'references', href: 'references.html', label: 'References' },
    { key: 'pocket', href: 'pocket.html', label: 'Back pocket' },
    { key: 'notes', href: 'notes.html', label: 'Field notes' }
  ];
  var TABS = PAGES.filter(function (p) { return p.key !== 'cover'; });
  TABS.splice(TABS.length - 1, 0, { key: 'errata', href: 'contents.html#errata', label: 'Errata' });
  var SECTIONS = ['contents', 'today', 'hypotheses', 'experiments', 'references', 'pocket', 'notes'];

  function pageIndex(key) {
    for (var i = 0; i < PAGES.length; i++) if (PAGES[i].key === key) return i;
    return -1;
  }
  function pageKeyFromUrl(url) {
    if (url.origin !== location.origin) return null;
    var base = location.pathname.replace(/[^\/]*$/, '');
    if (url.pathname.indexOf(base) !== 0) return null;
    var file = url.pathname.slice(base.length);
    if (file === '' || file === 'index.html' || file === 'index') return 'cover';
    for (var i = 1; i < PAGES.length; i++) {
      if (PAGES[i].href === file || PAGES[i].href.replace(/\.html$/, '') === file) return PAGES[i].key;
    }
    return null;
  }

  /* ------------------------------------------------------------
     Turning pages: links, corners, swipes and arrow keys
     ------------------------------------------------------------ */

  var turning = false;
  function turnTo(href, dir) {
    if (turning) return;
    turning = true;
    session.set('turn', dir);
    function go() { window.location.href = href; }
    if (reduceMotion) { go(); return; }
    if (current === 'cover') {
      var book = $('#book');
      if (book && dir === 'next') {
        snapBand(true);
        book.classList.add('is-opening');
        setTimeout(go, 620);
        return;
      }
      go();
      return;
    }
    var el = $('.js-turn');
    if (!el) { go(); return; }
    el.classList.remove('turn-in-next', 'turn-in-prev');
    el.classList.add(dir === 'next' ? 'turn-out-next' : 'turn-out-prev');
    setTimeout(go, 230);
  }
  function step(dir) {
    var i = pageIndex(current) + (dir === 'next' ? 1 : -1);
    if (i < 0 || i >= PAGES.length) return;
    turnTo(new URL(PAGES[i].href, location.href).href, dir);
  }

  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest ? e.target.closest('a[href]') : null;
    if (!a || a.target || a.hasAttribute('download')) return;
    var href = a.getAttribute('href');
    if (!href || href.charAt(0) === '#' || /^(mailto|tel):/i.test(href)) return;
    var url;
    try { url = new URL(href, location.href); } catch (err) { return; }
    var key = pageKeyFromUrl(url);
    if (!key || key === current) return;
    e.preventDefault();
    turnTo(url.href, pageIndex(key) > pageIndex(current) ? 'next' : 'prev');
  });

  // Coming back with the browser's Back button: put the page straight again.
  window.addEventListener('pageshow', function (e) {
    if (!e.persisted) return;
    turning = false;
    $$('.js-turn').forEach(function (el) {
      el.classList.remove('turn-out-next', 'turn-out-prev', 'turn-in-next', 'turn-in-prev', 'is-opening', 'is-closing');
    });
  });

  function turnIn() {
    var dir = session.get('turn', null);
    session.del('turn');
    if (!dir || reduceMotion) return;
    var el = $('.js-turn');
    if (!el) return;
    if (current === 'cover') {
      if (dir === 'prev') {
        el.classList.add('is-closing');
        setTimeout(function () { el.classList.remove('is-closing'); }, 800);
      }
      return;
    }
    var cls = dir === 'next' ? 'turn-in-next' : 'turn-in-prev';
    el.classList.add(cls);
    el.addEventListener('animationend', function done(ev) {
      if (ev.target !== el) return;
      el.classList.remove(cls);
      el.removeEventListener('animationend', done);
    });
  }

  function initSwipe() {
    var sx = 0, sy = 0, st = 0, tracking = false;
    document.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1) { tracking = false; return; }
      var t = e.target;
      if (t.closest && t.closest('input, textarea, select, button, summary, .tabs, .table-wrap, .lib-chips, .lib-kinds, .jacket-row, .pocket-stage, .book-card')) { tracking = false; return; }
      tracking = true;
      sx = e.touches[0].clientX;
      sy = e.touches[0].clientY;
      st = Date.now();
    }, { passive: true });
    document.addEventListener('touchend', function (e) {
      if (!tracking) return;
      tracking = false;
      var t = e.changedTouches[0];
      var dx = t.clientX - sx;
      var dy = t.clientY - sy;
      if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.8 && Date.now() - st < 700) {
        step(dx < 0 ? 'next' : 'prev');
      }
    }, { passive: true });
  }

  function initKeys() {
    document.addEventListener('keydown', function (e) {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      // With a book card open, the arrows flip cards instead of pages.
      if (document.documentElement.classList.contains('has-card')) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault();
          stepCard(e.key === 'ArrowRight' ? 1 : -1, false);
        }
        return;
      }
      var t = e.target;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      if (e.key === 'ArrowRight') step('next');
      else if (e.key === 'ArrowLeft') step('prev');
    });
  }

  /* ------------------------------------------------------------
     Shared furniture: top bar, tabs, page corners
     ------------------------------------------------------------ */

  function renderChrome() {
    var top = $('#nb-top');
    if (top) {
      top.innerHTML =
        '<a class="topbar__home" href="./">' + ICON.back + '<span>Lab notebook No. 1 · ' + esc(site.name || '') + '</span></a>' +
        '<div class="topbar__right">' +
          (site.draft ? '<span class="stamp-draft" title="Placeholder content. Set draft to false in content/site.js when it is real.">Draft</span>' : '') +
          '<span class="notes-badge" id="nb-badge" hidden></span>' +
          '<a class="topbar__quiet" href="contents.html">The 30-second version</a>' +
        '</div>';
    }
    var tabs = $('#nb-tabs');
    if (tabs) {
      tabs.innerHTML = TABS.map(function (t) {
        var here = t.key === current;
        return '<a class="tab" href="' + (here && t.key === 'errata' ? '#errata' : t.href) + '"' + (here ? ' aria-current="page"' : '') + '>' + esc(t.label) + '</a>';
      }).join('');
      var cur = $('.tab[aria-current]', tabs);
      if (cur && tabs.scrollWidth > tabs.clientWidth) tabs.scrollLeft = Math.max(0, cur.offsetLeft - 24);
    }
  }

  function renderCorners() {
    var spread = $('.spread');
    if (!spread) return;
    var i = pageIndex(current);
    var prev = PAGES[i - 1];
    var next = PAGES[i + 1];
    var html = '';
    if (prev) html += '<a class="corner corner--prev" href="' + prev.href + '" aria-label="Previous page: ' + esc(prev.label) + '"><span class="corner__label">← ' + esc(prev.label) + '</span></a>';
    if (next) html += '<a class="corner corner--next" href="' + next.href + '" aria-label="Next page: ' + esc(next.label) + '"><span class="corner__label">' + esc(next.label) + ' →</span></a>';
    spread.insertAdjacentHTML('beforeend', html);
  }

  function markVisited() {
    if (SECTIONS.indexOf(current) === -1) return;
    var v = list(store.get('visited', []));
    if (v.indexOf(current) === -1) { v.push(current); store.set('visited', v); }
  }

  /* ------------------------------------------------------------
     Hidden notes
     ------------------------------------------------------------ */

  function secretKeys() {
    var keys = Object.keys(site.secrets || {});
    return keys.length ? keys : ['band', 'rule', 'sticky', 'cat', 'coffee', 'spine', 'pocket'];
  }
  function foundSecrets() { return list(store.get('secrets', [])); }

  var slipTimer = null;
  function hideSlip() {
    var s = $('#nb-slip');
    if (s) s.hidden = true;
    clearTimeout(slipTimer);
  }
  function showSlip(kicker, text, done) {
    var slip = $('#nb-slip');
    if (!slip) {
      slip = document.createElement('div');
      slip.id = 'nb-slip';
      slip.className = 'slip';
      slip.setAttribute('role', 'status');
      slip.setAttribute('aria-live', 'polite');
      document.body.appendChild(slip);
    }
    slip.innerHTML =
      '<p class="slip__kicker">' + esc(kicker) + '</p>' +
      (text ? '<p class="slip__text">' + rich(text) + '</p>' : '') +
      (done ? '<p class="slip__done">' + rich(done) + '</p>' : '') +
      '<button type="button" class="btn btn--text" id="nb-slip-close">Fold it away</button>';
    slip.hidden = false;
    slip.classList.remove('is-in');
    void slip.offsetWidth;
    slip.classList.add('is-in');
    $('#nb-slip-close').addEventListener('click', hideSlip);
    clearTimeout(slipTimer);
    slipTimer = setTimeout(hideSlip, 11000);
  }

  function findSecret(key) {
    var found = foundSecrets();
    var isNew = found.indexOf(key) === -1;
    if (isNew) { found.push(key); store.set('secrets', found); }
    var total = secretKeys().length;
    var text = (site.secrets && site.secrets[key]) || '';
    var kicker = (isNew ? 'Hidden note found · ' : 'Found this one already · ') + found.length + ' of ' + total;
    showSlip(kicker, text, isNew && found.length >= total ? site.secretsDone : '');
    updateBadge();
  }

  function updateBadge() {
    var b = $('#nb-badge');
    if (!b) return;
    var n = foundSecrets().length;
    var total = secretKeys().length;
    if (!n) { b.hidden = true; return; }
    b.hidden = false;
    b.innerHTML = ICON.pencil + '<span>Hidden notes ' + Math.min(n, total) + '/' + total + '</span>';
    b.title = 'Hidden notes found: ' + Math.min(n, total) + ' of ' + total;
  }

  /* ------------------------------------------------------------
     Sketches that draw themselves when they come into view
     ------------------------------------------------------------ */

  var drawObserver = null;
  function drawIn(ctx) {
    if (reduceMotion || !('IntersectionObserver' in window)) return;
    var items = $$('[data-draw]', ctx || document).filter(function (el) { return !el.classList.contains('is-drawn'); });
    if (!items.length) return;
    document.documentElement.classList.add('can-draw');
    if (!drawObserver) {
      drawObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('is-drawn'); drawObserver.unobserve(en.target); }
        });
      }, { threshold: 0.3 });
    }
    items.forEach(function (el) { drawObserver.observe(el); });
  }

  function pathEllipse(cx, cy, rx, ry) {
    return 'M' + (cx - rx) + ' ' + cy + 'a' + rx + ' ' + ry + ' 0 1 0 ' + (2 * rx) + ' 0a' + rx + ' ' + ry + ' 0 1 0 ' + (-2 * rx) + ' 0';
  }

  /* ------------------------------------------------------------
     Notes that go out by email (margin notes, book loans, alerts)
     ------------------------------------------------------------ */

  var composerFields = {};
  function composerHtml(c) {
    composerFields[c.id] = list(c.fields);
    var fields = list(c.fields).map(function (f) {
      var id = c.id + '-' + f.name;
      var control = f.type === 'textarea'
        ? '<textarea class="textarea' + (f.hand ? ' textarea--hand' : '') + '" id="' + id + '" rows="' + (f.rows || 3) + '" placeholder="' + esc(f.placeholder || '') + '"></textarea>'
        : '<input class="input" id="' + id + '" type="text" autocomplete="off" placeholder="' + esc(f.placeholder || '') + '">';
      return '<label class="field-label" for="' + id + '">' + esc(f.label) + '</label>' + control;
    }).join('');
    return '<div class="composer" id="' + c.id + '">' +
      (c.openLabel ? '<button type="button" class="btn btn--line composer__open">' + esc(c.openLabel) + '</button>' : '') +
      '<div class="composer__body"' + (c.openLabel ? ' hidden' : '') + '>' + fields +
        '<p class="composer__warn" hidden>Write something first.</p>' +
        '<button type="button" class="btn composer__prepare">' + esc(c.prepareLabel || 'Prepare the email') + '</button>' +
      '</div>' +
      '<div class="composer__ready" hidden>' +
        '<p class="composer__ok">Ready to send from your own email.</p>' +
        '<div class="actions"><a class="btn composer__mail" href="#">Open email</a><button type="button" class="btn btn--line composer__copy">Copy the text</button></div>' +
        '<textarea class="textarea composer__plain" rows="4" readonly hidden aria-label="The text to send"></textarea>' +
        '<p class="composer__to">Or send it to <span class="selectable">' + esc(site.email || '') + '</span>.</p>' +
        '<button type="button" class="btn btn--text composer__again">' + esc(c.againLabel || 'Write another') + '</button>' +
      '</div>' +
    '</div>';
  }

  function bindComposer(c) {
    var box = document.getElementById(c.id);
    if (!box) return;
    if (!c.fields) c.fields = composerFields[c.id] || [];
    var openBtn = $('.composer__open', box);
    var body = $('.composer__body', box);
    var ready = $('.composer__ready', box);
    var warn = $('.composer__warn', box);
    var plain = $('.composer__plain', box);
    var text = '';
    function values() {
      var vals = {};
      list(c.fields).forEach(function (f) {
        var el = document.getElementById(c.id + '-' + f.name);
        vals[f.name] = el ? el.value.trim() : '';
      });
      return vals;
    }
    if (openBtn) {
      openBtn.addEventListener('click', function () {
        openBtn.hidden = true;
        body.hidden = false;
        var first = $('textarea, input', body);
        if (first) first.focus();
      });
    }
    $('.composer__prepare', box).addEventListener('click', function () {
      var vals = values();
      var needs = list(c.fields).length > 0;
      var any = !needs || Object.keys(vals).some(function (k) { return vals[k]; });
      if (!any) {
        warn.hidden = false;
        var first = $('textarea, input', body);
        if (first) first.focus();
        return;
      }
      warn.hidden = true;
      text = c.body(vals);
      var subject = typeof c.subject === 'function' ? c.subject(vals) : c.subject;
      var mail = $('.composer__mail', box);
      mail.setAttribute('href', mailto(subject, text));
      plain.value = text;
      plain.hidden = true;
      body.hidden = true;
      ready.hidden = false;
      mail.focus();
    });
    $('.composer__copy', box).addEventListener('click', function (e) {
      copyText(text, e.currentTarget, function () { plain.hidden = false; selectNode(plain); });
    });
    $('.composer__again', box).addEventListener('click', function () {
      list(c.fields).forEach(function (f) {
        var el = document.getElementById(c.id + '-' + f.name);
        if (el) el.value = '';
      });
      ready.hidden = true;
      body.hidden = false;
    });
  }

  /* ------------------------------------------------------------
     Choosing which entry a page opens on (#H-03, #E-01, ...)
     ------------------------------------------------------------ */

  function hashId() {
    try { return decodeURIComponent(location.hash.slice(1)).toUpperCase(); } catch (e) { return ''; }
  }
  function byId(arr, id) {
    for (var i = 0; i < arr.length; i++) if (String(arr[i].id).toUpperCase() === id) return arr[i];
    return null;
  }
  function firstSelection(arr, fallbackTest) {
    var h = byId(arr, hashId());
    if (h) return h.id;
    var f = arr.filter(function (x) { return x.featured; })[0] || arr.filter(fallbackTest)[0] || arr[0];
    return f ? f.id : null;
  }
  function setHash(id) {
    try { history.replaceState(null, '', '#' + id); } catch (e) { /* not allowed here */ }
  }
  function isStacked() { return window.innerWidth < 1072; }
  function scrollToEl(el) {
    if (!el) return;
    try { el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' }); }
    catch (e) { el.scrollIntoView(); }
  }

  /* ============================================================
     PAGE: Cover
     ============================================================ */

  function snapBand(silent) {
    var book = $('#book');
    if (!book || book.classList.contains('band-off')) return;
    book.classList.add('band-off');
    var band = $('#band');
    if (band) {
      band.setAttribute('aria-hidden', 'true');
      band.tabIndex = -1;
    }
    if (!silent) {
      var note = $('#cover-snap');
      if (note) note.hidden = false;
      var open = $('#cover-open');
      if (open && document.activeElement === band) open.focus();
      findSecret('band');
    }
  }

  function renderCover() {
    $$('[data-bind]').forEach(function (el) {
      var map = { name: site.name, subject: site.coverSubject, pagesLeft: site.coverPagesLeft, tagline: site.tagline };
      var val = map[el.getAttribute('data-bind')];
      if (val) el.textContent = val;
    });
    var intro = $('#cover-intro');
    if (intro && list(site.coverLines).length) intro.innerHTML = site.coverLines.map(rich).join('<br>');

    var meta = $('#cover-meta');
    if (meta) {
      var openH = hyps.filter(isOpenH).length;
      var running = exps.filter(function (x) { return x.status === 'running'; }).length;
      var sealed = letters.filter(function (l) { return !letterIsOpen(l); }).length;
      var last = lastEntryDate();
      var line1 = [];
      if (site.begun) line1.push('Begun ' + esc(site.begun));
      if (last) line1.push('Last entry ' + esc(fmt(last)));
      var line2 = [
        plural(openH, 'open hypothesis', 'open hypotheses'),
        plural(running, 'experiment running', 'experiments running'),
        plural(sealed, 'sealed letter', 'sealed letters')
      ];
      function nowrap(s) { return '<span class="nowrap">' + s + '</span>'; }
      meta.innerHTML = line1.map(nowrap).join(' · ') + '<br>' + line2.map(nowrap).join(' · ');
    }
    var band = $('#band');
    if (band) band.addEventListener('click', function () { snapBand(false); });
    var draft = $('#cover-draft');
    if (draft) draft.hidden = !site.draft;
  }

  /* ============================================================
     PAGE: Inside cover and contents
     ============================================================ */

  function renderContents() {
    var left = $('#inside');
    var right = $('#toc');
    if (!left || !right) return;

    var email = site.email || '';
    var contact =
      (email ? '<span class="contact__email selectable" id="email-text">' + esc(email) + '</span><button type="button" class="btn btn--text" id="copy-email">Copy email</button>' : '') +
      (site.linkedin ? '<a class="ink-link" href="' + esc(site.linkedin) + '" target="_blank" rel="noopener">LinkedIn</a>' : '');

    var cv = site.cvFile
      ? '<a class="btn" href="' + esc(site.cvFile) + '" target="_blank" rel="noopener">Read my CV (PDF)</a>'
      : '';
    var mail = email ? '<a class="btn btn--line" href="' + esc(mailto('Hello from your notebook', '')) + '">Email me</a>' : '';

    var rules = list(site.houseRules).map(function (r) { return '<li>' + rich(r) + '</li>'; }).join('');

    left.innerHTML =
      strip([['Book', 'No. 1'], ['Page', 'inside cover']]) +
      '<p class="kicker">If found, please return to</p>' +
      '<h1 class="hand-xl gap-s">' + esc(site.name || '') + '</h1>' +
      '<div class="contact">' + contact + '</div>' +
      (site.rewardLine ? '<p class="reward">' + rich(site.rewardLine) + '</p>' : '') +
      '<div class="box thirty"><p class="label">The 30-second version</p>' +
        '<ul class="thirty__list">' + list(site.thirtySeconds).map(function (l) { return '<li>' + rich(l) + '</li>'; }).join('') + '</ul>' +
        '<div class="actions">' + cv + mail + '</div>' +
      '</div>' +
      section('A little more about me', site.about) + section('About the work here', site.publicWorkNote) +
      '<div class="rules"><p class="label">House rules</p><ol class="rules__list">' + rules +
        '<li class="rules__secret"><button type="button" class="rule-secret" id="secret-rule" aria-label="Rule four, not written yet">?</button></li>' +
      '</ol></div>';

    var openH = hyps.filter(isOpenH).length;
    var retired = hyps.length - openH;
    var running = exps.filter(function (x) { return x.status === 'running'; }).length;
    var concluded = exps.filter(function (x) { return x.status === 'concluded'; }).length;
    var planned = exps.filter(function (x) { return x.status === 'planned'; }).length;
    var sealed = letters.filter(function (l) { return !letterIsOpen(l); }).length;
    var rows = [
      { href: 'today.html', title: 'Today', desc: 'What has my attention' + (today.date ? ', updated ' + fmt(today.date, 'short') : ''), pn: 'p. 01' },
      { href: 'hypotheses.html', title: 'Hypotheses', desc: plural(openH, 'open', 'open') + ', ' + plural(retired, 'retired', 'retired'), pn: 'p. 04' },
      { href: 'experiments.html', title: 'Experiments', desc: plural(running, 'running', 'running') + ', ' + plural(concluded, 'concluded', 'concluded') + (planned ? ', ' + planned + ' planned' : ''), pn: 'p. 12' },
      { href: 'notes.html', title: 'Field notes', desc: 'Learning, writing and questions along the way', pn: 'p. 24' },
      { href: 'references.html', title: 'References', desc: referencesSummary(), pn: 'p. 30' },
      { href: '#errata', title: 'Errata', desc: 'Where I was wrong: ' + plural(errata.length, 'correction', 'corrections'), pn: 'p. 41' },
      { href: 'pocket.html', title: 'Back pocket', desc: plural(sealed, 'sealed letter', 'sealed letters') + ' and ' + plural(bets.length, 'open bet', 'open bets'), pn: 'back cover' }
    ];
    var visited = list(store.get('visited', []));
    var seen = SECTIONS.filter(function (s) { return visited.indexOf(s) !== -1; }).length;
    var boxes = SECTIONS.map(function (s) { return '<span' + (visited.indexOf(s) !== -1 ? ' class="on"' : '') + '></span>'; }).join('');

    right.innerHTML =
      strip([['Title', 'Contents'], ['Page', 'ii']]) +
      '<h2 class="hand-xl">Contents</h2>' +
      '<ol class="toc">' + rows.map(function (r) {
        return '<li><a href="' + r.href + '"><span class="toc__text"><span class="toc__title">' + esc(r.title) + '</span><span class="toc__desc">' + esc(r.desc) + '</span></span><span class="toc__lead" aria-hidden="true"></span><span class="toc__pn">' + esc(r.pn) + '</span></a></li>';
      }).join('') + '</ol>' +
      '<div class="progress"><span class="field__key">Your progress</span><span class="progress__boxes" aria-hidden="true">' + boxes + '</span><span class="progress__text">' + seen + ' of ' + SECTIONS.length + ' sections opened</span></div>' +
      '<div class="errata" id="errata"><p class="label">Errata</p>' +
        (errata.length
          ? '<ul class="errata__list">' + errata.map(function (e) {
              return '<li><span class="errata__where">' + esc(e.where || '') + (e.date ? ' · ' + esc(fmt(e.date)) : '') + '</span>' + rich(e.text) + '</li>';
            }).join('') + '</ul>'
          : '<p class="prose muted">Nothing yet. Give it time.</p>') +
      '</div>' +
      foot([['Signed', 'V.S.'], ['Date', fmt(lastEntryDate())]]);

    var copy = $('#copy-email');
    if (copy) copy.addEventListener('click', function (e) { copyText(email, e.currentTarget, function () { selectNode($('#email-text')); }); });
    var rule = $('#secret-rule');
    if (rule) rule.addEventListener('click', function () { findSecret('rule'); });

    if (location.hash === '#errata') setTimeout(function () { scrollToEl($('#errata')); }, 60);
  }

  /* ============================================================
     PAGE: Today
     ============================================================ */

  function sketchSvg(sk) {
    var C = { x: 280, y: 172 };
    var SLOTS = [{ x: 108, y: 78 }, { x: 108, y: 262 }, { x: 452, y: 78 }, { x: 452, y: 262 }, { x: 280, y: 40 }];
    var nodes = list(sk.around).slice(0, 5);
    var lineDash = '', lineUnder = '', lineInk = '', fills = '', nodeDash = '', nodeUnder = '', nodeInk = '', texts = '';
    var aria = [];
    nodes.forEach(function (n, i) {
      var p = SLOTS[i];
      var label = String(n.label || '');
      var rx = Math.max(44, Math.round(label.length * 6.8 + 22));
      var ry = i === 4 ? 24 : 30;
      var solid = n.state === 'done' || n.state === 'now';
      var red = n.state === 'unknown';
      var line = 'M' + C.x + ' ' + C.y + 'L' + p.x + ' ' + p.y;
      var shape = pathEllipse(p.x, p.y, rx, ry);
      if (solid) {
        lineUnder += '<path class="under" d="' + line + '"/>';
        lineInk += '<path class="ink" pathLength="1" style="--d:' + (i * 0.12).toFixed(2) + 's" d="' + line + '"/>';
        nodeUnder += '<path class="under" d="' + shape + '"/>';
        nodeInk += '<path class="ink" pathLength="1" style="--d:' + (0.45 + i * 0.12).toFixed(2) + 's" d="' + shape + '"/>';
      } else {
        lineDash += '<path class="dash' + (red ? ' dash--red' : '') + '" d="' + line + '"/>';
        nodeDash += '<path class="dash' + (red ? ' dash--red' : '') + '" d="' + shape + '"/>';
      }
      fills += '<path class="node-fill" d="' + shape + '"/>';
      texts += '<text' + (red ? ' class="red"' : '') + ' x="' + p.x + '" y="' + (p.y + 2) + '">' + esc(label) + (n.state === 'done' ? ' ✓' : '') + '</text>';
      if (n.state === 'now') texts += '<text class="tag" x="' + p.x + '" y="' + (p.y + ry + 18) + '">UNDER WAY</text>';
      aria.push(label + ' (' + ({ done: 'done', now: 'under way', next: 'next', unknown: 'unknown' }[n.state] || 'next') + ')');
    });
    var centre = String(sk.centre || '');
    var crx = Math.max(70, Math.round(centre.length * 8.8 + 26));
    var cshape = pathEllipse(C.x, C.y, crx, 38);
    var label = 'Sketch of what I am learning around ' + centre + ': ' + aria.join(', ') + '.';
    return '<svg class="sketch" data-draw viewBox="0 0 560 330" role="img" aria-label="' + esc(label) + '">' +
      lineDash + lineUnder + lineInk + fills + nodeDash + nodeUnder + nodeInk +
      '<path class="node-fill node-fill--focus" d="' + cshape + '"/>' +
      '<path class="under" d="' + cshape + '"/>' +
      '<path class="ink" pathLength="1" style="--d:0.2s" d="' + cshape + '"/>' +
      texts + '<text class="centre" x="' + C.x + '" y="' + (C.y + 2) + '">' + esc(centre) + '</text>' +
      '</svg>';
  }

  function renderToday() {
    var left = $('#today-left');
    var right = $('#today-right');
    if (!left || !right) return;
    var rot = [-3, 2, -1, 3, -2];

    var items = list(today.currently).map(function (it, i) {
      return '<li>' +
        '<span class="check" style="--r:' + rot[i % rot.length] + 'deg" aria-hidden="true">' + (it.done ? '✓' : '') + '</span>' +
        '<span class="checklist__body">' +
          '<span class="field__key checklist__label">' + esc(it.label || '') + (it.done ? '<span class="visually-hidden"> (done)</span>' : '') + '</span>' +
          '<span class="checklist__text">' + (it.done ? '<s>' + rich(it.text) + '</s>' : rich(it.text)) + '</span>' +
          (it.see ? ' ' + xref(it.see) : '') +
        '</span></li>';
    }).join('');

    left.innerHTML =
      strip([['Title', 'Today'], ['Date', fmt(today.date)], ['Page', '01']]) +
      '<h1 class="hand-xl">' + esc(fmt(today.date, 'day')) + '</h1>' +
      (today.intro ? '<p class="lede">' + rich(today.intro) + '</p>' : '') +
      '<p class="label gap-l">Currently</p>' +
      '<ul class="checklist">' + items + '</ul>' +
      (today.question
        ? '<div class="question-box"><p class="label">The question on my desk</p><p class="question">' + rich(today.question) + '</p>' +
          (refHref(today.questionSee) ? '<a class="ink-link" href="' + refHref(today.questionSee) + '">My current answer: ' + esc(refLabel(today.questionSee)) + '</a>' : '') +
          '</div>'
        : '');

    var sk = today.sketch || {};
    var sticky = today.sticky || {};
    var since = list(today.sinceLastMonth).map(function (s) {
      return '<li>' + (s.struck ? '<s>' + rich(s.struck) + '</s> ' : '') + rich(s.note || '') + '</li>';
    }).join('');

    right.innerHTML =
      '<div class="ribbon" aria-hidden="true"></div>' +
      strip([['Title', 'Sketch'], ['Page', '02']]) +
      (list(sk.around).length
        ? '<figure>' + sketchSvg(sk) + (sk.caption ? '<figcaption>Fig. 2: ' + rich(sk.caption) + '</figcaption>' : '') + '</figure>'
        : '') +
      (sticky.text
        ? '<div class="sticky-spot">' +
            '<div class="sticky" id="sticky"><p class="sticky__text">' + rich(sticky.text) + '</p>' +
              '<div class="sticky__row">' +
                (refHref(sticky.see) ? '<a class="ink-link" href="' + refHref(sticky.see) + '">See ' + esc(refLabel(sticky.see)) + '</a>' : '<span></span>') +
                '<button type="button" class="btn btn--text" id="peel">Peel the note</button>' +
              '</div>' +
            '</div>' +
            '<div class="sticky-under" id="sticky-under" hidden><p class="margin-note">Nothing stuck here but pencil.</p><button type="button" class="btn btn--text" id="unpeel">Stick it back</button></div>' +
          '</div>'
        : '') +
      (since ? '<p class="label gap-l">A change of direction</p><ul class="since">' + since + '</ul>' : '') +
      (list(today.log).length ? '<p class="label gap-l">Notebook log</p><ul class="since">' + today.log.map(function (entry) { return '<li><span class="field__key">' + esc(fmt(entry.date)) + '</span><p class="prose">' + rich(entry.text) + (entry.see ? ' ' + xref(entry.see) : '') + '</p></li>'; }).join('') + '</ul>' : '') + foot([['Signed', 'V.S.'], ['Updates', 'When there is something to add']]);

    var peel = $('#peel');
    var stickyEl = $('#sticky');
    var under = $('#sticky-under');
    if (peel && stickyEl && under) {
      peel.addEventListener('click', function () {
        function done() {
          stickyEl.hidden = true;
          stickyEl.classList.remove('is-peeling');
          under.hidden = false;
          $('#unpeel').focus();
          findSecret('sticky');
        }
        if (reduceMotion) { done(); return; }
        stickyEl.classList.add('is-peeling');
        setTimeout(done, 440);
      });
      $('#unpeel').addEventListener('click', function () {
        under.hidden = true;
        stickyEl.hidden = false;
        peel.focus();
      });
    }
  }

  /* ============================================================
     PAGE: Hypotheses
     ============================================================ */

  function betMessage(mine, theirs) {
    var gap = Math.abs(mine - theirs);
    if (gap === 0) return 'We agree exactly. Suspicious.';
    if (gap <= 10) return 'Close. Tell me what you\'d add.';
    return 'We\'re ' + gap + ' points apart. Tell me why.';
  }

  function sparkline(h) {
    var pts = list(h.history).filter(function (p) { return p && typeof p.confidence === 'number'; });
    if (pts.length < 2) return '';
    var L = 30, R = 230, TOP = 30, BOTTOM = 70;
    var vals = pts.map(function (p) { return p.confidence; });
    var lo = Math.min.apply(null, vals);
    var hi = Math.max.apply(null, vals);
    if (hi === lo) { hi += 5; lo -= 5; }
    var xy = pts.map(function (p, i) {
      return [Math.round(L + (R - L) * i / (pts.length - 1)), Math.round(TOP + (hi - p.confidence) / (hi - lo) * (BOTTOM - TOP))];
    });
    var d = xy.map(function (c, i) { return (i ? 'L' : 'M') + c[0] + ' ' + c[1]; }).join('');
    var showAll = pts.length <= 4;
    var marks = xy.map(function (c, i) {
      var last = i === xy.length - 1;
      var labelled = showAll || i === 0 || last;
      return '<circle class="dot' + (last ? ' dot--last' : '') + '" cx="' + c[0] + '" cy="' + c[1] + '" r="' + (last ? 6 : 5) + '"/>' +
        (labelled ? '<text class="val' + (last ? ' val--last' : '') + '" x="' + c[0] + '" y="' + (c[1] - 12) + '">' + vals[i] + '%</text>' +
          '<text class="date" x="' + c[0] + '" y="106">' + esc(fmt(pts[i].date, 'short')) + '</text>' : '');
    }).join('');
    var aria = 'Confidence history: ' + pts.map(function (p) { return p.confidence + '% on ' + fmt(p.date, 'long'); }).join(', ') + '.';
    return '<figure class="spark"><svg viewBox="0 0 260 112" role="img" aria-label="' + esc(aria) + '" data-draw>' +
      '<line class="axis" x1="14" y1="88" x2="246" y2="88"/>' +
      '<path class="under" d="' + d + '"/><path class="ink" pathLength="1" d="' + d + '"/>' + marks +
      '</svg><figcaption>How my confidence has moved</figcaption></figure>';
  }

  function strikeWithin(before, struck) {
    var b = String(before || '');
    var s = String(struck || '');
    var i = s ? b.indexOf(s) : -1;
    if (i === -1) return '<s>' + esc(b) + '</s>';
    return esc(b.slice(0, i)) + '<s>' + esc(s) + '</s>' + esc(b.slice(i + s.length));
  }

  function renderHypotheses() {
    var left = $('#hyp-left');
    var right = $('#hyp-right');
    if (!left || !right) return;
    var selId = firstSelection(hyps, isOpenH);
    var openN = hyps.filter(isOpenH).length;

    left.innerHTML =
      strip([['Title', 'Hypotheses'], ['Open', String(openN)], ['Retired', String(hyps.length - openN)], ['Page', '04']]) +
      '<h1 class="hand-xl">Hypotheses</h1>' +
      '<p class="lede">Things I currently believe and could be wrong about. Each one says what would change my mind. Pick one to open it.</p>' +
      '<ul class="hyp-list" id="hyp-list"></ul>' +
      '<p class="legend">Filled boxes show my confidence, in tenths. Struck-through lines are retired, never erased.</p>' +
      '<div class="doodle-row"><span class="cat__said" id="cat-said" hidden>observed</span>' +
        '<button type="button" class="cat" id="cat" aria-label="A cat doodle in the margin" hidden>' + ICON.cat + '</button></div>';

    var listEl = $('#hyp-list');

    function rowHtml(h) {
      var retired = !isOpenH(h);
      var filled = retired ? 0 : Math.round((h.confidence || 0) / 10);
      var boxes = '';
      for (var i = 0; i < 10; i++) boxes += '<span' + (i < filled ? ' class="on"' : '') + '></span>';
      return '<li><button type="button" class="hyp-row' + (retired ? ' is-retired' : '') + '" data-id="' + esc(h.id) + '" aria-pressed="' + (h.id === selId ? 'true' : 'false') + '">' +
        '<span class="hyp-row__top"><span class="hyp-row__id">' + esc(h.id) + '</span><span class="hyp-row__text">' + rich(h.statement) + '</span></span>' +
        '<span class="hyp-row__meta"><span class="meter" aria-hidden="true">' + boxes + '</span><span>' +
          (retired ? 'Retired' + (h.retired && h.retired.date ? ' ' + esc(fmt(h.retired.date, 'short')) : '') : esc(h.confidence) + '% confident') +
        '</span></span></button></li>';
    }

    function detailHtml(h) {
      var retired = !isOpenH(h);
      var html = strip([['Entry', h.id], ['Opened', fmt(h.opened)], ['Page', h.page || '']]) +
        '<p class="label">Hypothesis ' + esc(h.id) + '</p>' +
        '<h2 class="hand-l statement gap-s' + (retired ? ' is-struck' : '') + '">' + rich(h.statement) + '</h2>';
      list(h.revisions).forEach(function (r) {
        html += '<div class="revision"><p class="revision__was">First written' + (r.from ? ' on ' + esc(fmt(r.from, 'short')) : '') + ': ' + strikeWithin(r.before, r.struck) + '</p>' +
          '<p class="revision__note">' + (r.date ? esc(fmt(r.date, 'short')) + ': ' : '') + rich(r.note || '') + '</p></div>';
      });
      if (retired) {
        var rt = h.retired || {};
        html += '<p class="stamp is-new">Retired' + (rt.date ? ' · ' + esc(fmt(rt.date)) : '') + '</p>' +
          (rt.what ? '<p class="label gap-l">What happened</p><p class="hand-m gap-s">' + rich(rt.what) + '</p>' : '') +
          (typeof rt.from === 'number' && typeof rt.to === 'number'
            ? '<p class="prose muted gap-s">My confidence went from ' + rt.from + '% to ' + rt.to + '%. It stays on the page, struck through, because the house rules say so.</p>'
            : '');
      } else {
        var mine = store.get('bets', {});
        var bet = mine && typeof mine[h.id] === 'number' ? mine[h.id] : 50;
        html +=
          '<div class="conf-row"><div><p class="label">My confidence</p><p class="conf-big">' + esc(h.confidence) + '%</p></div>' + sparkline(h) + '</div>' +
          section('Why I think so', h.why) +
          (h.changeMind ? '<p class="label gap-m">What would change my mind</p><p class="prose"><span class="hl">' + rich(h.changeMind) + '</span></p>' : '') +
          '<div class="box bet">' +
            '<label class="label" for="bet-range">Place your bet</label>' +
            '<p class="bet__help">How likely do you think this is? Slide to your number.</p>' +
            '<input class="range" id="bet-range" type="range" min="0" max="100" step="5" value="' + bet + '" aria-valuetext="' + bet + ' percent">' +
            '<div class="bet__row"><span>Me: ' + esc(h.confidence) + '%</span><span id="bet-you">You: ' + bet + '%</span></div>' +
            '<p class="bet__msg" id="bet-msg" aria-live="polite">' + esc(betMessage(bet, h.confidence)) + '</p>' +
            composerHtml({
              id: 'note',
              openLabel: 'Write a margin note',
              fields: [{ name: 'text', type: 'textarea', hand: true, label: 'Your margin note', placeholder: 'Tell me what I\'m missing' }]
            }) +
          '</div>';
      }
      html += foot([['Signed', 'V.S.'], ['Rule', 'never erase']]);
      return html;
    }

    function paint(fromUser) {
      var h = byId(hyps, String(selId).toUpperCase());
      listEl.innerHTML = hyps.map(rowHtml).join('');
      if (!h) {
        right.innerHTML = '<p class="hand-m">No hypotheses yet. Add one in content/hypotheses.js.</p>';
        return;
      }
      right.innerHTML = detailHtml(h);
      var range = $('#bet-range');
      if (range) {
        range.addEventListener('input', function () {
          var v = Number(range.value);
          $('#bet-you').textContent = 'You: ' + v + '%';
          $('#bet-msg').textContent = betMessage(v, h.confidence);
          range.setAttribute('aria-valuetext', v + ' percent');
          var all = store.get('bets', {}) || {};
          all[h.id] = v;
          store.set('bets', all);
        });
        bindComposer({
          id: 'note',
          subject: 'Margin note on ' + h.id,
          body: function (vals) {
            return 'On ' + h.id + ': "' + h.statement + '"\nMy bet: ' + range.value + '% (yours is ' + h.confidence + '%)\n\n' + vals.text;
          }
        });
      }
      drawIn(right);
      if (fromUser && isStacked()) scrollToEl(right);
    }

    listEl.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('.hyp-row') : null;
      if (!b) return;
      selId = b.getAttribute('data-id');
      setHash(selId);
      paint(true);
      var again = $('.hyp-row[data-id="' + selId + '"]', listEl);
      if (again && !isStacked()) again.focus();
    });
    window.addEventListener('hashchange', function () {
      var h = byId(hyps, hashId());
      if (h && h.id !== selId) { selId = h.id; paint(false); }
    });
    paint(false);

    // Schrödinger's cat: on some visits it's in the margin, on others it isn't.
    var cat = $('#cat');
    if (cat && Math.random() < 0.5) {
      cat.hidden = false;
      cat.addEventListener('click', function () {
        $('#cat-said').hidden = false;
        findSecret('cat');
      });
    }
  }

  /* ============================================================
     PAGE: Experiments
     ============================================================ */

  function stepsHtml(steps) {
    var later = false;
    return '<div class="steps">' + list(steps).map(function (s, i) {
      var state = ['done', 'now', 'next', 'goal'].indexOf(s.state) === -1 ? 'next' : s.state;
      var arrow = '';
      if (i > 0) arrow = later ? ICON.arrowLater : ICON.arrow;
      if (state === 'next' || state === 'goal') later = true;
      var when = esc(s.when || '') + (state === 'done' ? ' · done' : state === 'now' ? ' · now' : '');
      return arrow + '<div class="step step--' + state + '"><span class="step__when">' + when + '</span><span class="step__name">' + esc(s.name || '') + '</span></div>';
    }).join('') + '</div>';
  }

  function projectLinks(x) {
    return [['Try it', x.demo], ['Source', x.source]].filter(function (link) { return /^https?:\/\//i.test(link[1] || ''); }).map(function (link) { return '<a class="btn btn--line" href="' + esc(link[1]) + '" target="_blank" rel="noopener">' + esc(link[0]) + '</a>'; }).join(' ');
  }
  function renderExperiments() {
    var left = $('#exp-left');
    var right = $('#exp-right');
    if (!left || !right) return;
    var selId = firstSelection(exps, function (x) { return x.status === 'running'; });

    function projectIndex() {
      return '<details class="project-index" open><summary class="label">Choose an experiment</summary><ul class="exp-list">' + exps.map(function (p) { return '<li><a class="ink-link" href="#' + esc(p.id) + '">' + esc(p.id + ' · ' + p.title) + '</a></li>'; }).join('') + '</ul></details>';
    }
    function writeup(x) {
      var running = x.status === 'running';
      var obs = list(x.observations).map(function (o) {
        var when = (o.label ? esc(o.label) : '') + (o.date ? (o.label ? ' · ' : '') + esc(fmt(o.date, 'short')) : '');
        return '<li><span class="obs__when">' + when + '</span><span class="obs__text' + (o.pending ? ' obs__text--pending' : '') + '">' + rich(o.text) + '</span></li>';
      }).join('');
      return projectIndex() + strip([['Experiment', x.id], [x.status === 'planned' ? 'Status' : (running ? 'Started' : 'Concluded'), x.status === 'planned' ? 'On the drawing board' : fmt(running ? x.started : (x.concluded || ''))], ['Page', x.page || '']]) +
        '<h1 class="hand-xl">' + rich(x.title) + '</h1>' +
        '<p class="chip' + (running ? ' chip--live' : '') + '">' + (running ? '<span class="chip__dot" aria-hidden="true"></span>Running' + (x.progress ? ' · ' + esc(x.progress) : '') : (x.status === 'planned' ? 'Planned' : 'Concluded')) + '</p>' +
        (x.redactedNote ? '<p class="redacted-note">' + rich(x.redactedNote) + '</p>' : '') +
        section('Question', x.question) +
        section('Hypothesis', x.hypothesis) +
        section('Method', x.method) + section('Tools & materials', x.tools) + section(x.status === 'planned' ? 'Questions to test' : 'Lessons', x.lessons) + projectLinks(x) + (x.editorialHistory ? '<details class="gap-m"><summary class="ink-link">Earlier wording, corrected</summary><p class="prose">' + rich(x.editorialHistory) + '</p></details>' : '') +
        (obs ? '<p class="label gap-m">Observations</p><ol class="obs">' + obs + '</ol>' : '') +
        section(x.status === 'planned' ? 'On the drawing board' : (running ? 'So far' : 'What I found'), x.summary) +
        (x.marginNote ? '<p class="margin-note note-right">' + rich(x.marginNote) + '</p>' : '') +
        '<div class="doodle-row"><button type="button" class="coffee" id="coffee" aria-label="A coffee ring on the page"></button></div>';
    }

    function witnessHtml(x) {
      var all = store.get('witness', {}) || {};
      var w = all[x.id];
      if (w && w.name) {
        return '<div class="box witness"><p class="label">Witnessed and understood by</p>' +
          '<p class="witness__name">' + esc(w.name) + '</p>' +
          '<p class="witness__date">Witnessed ' + esc(fmt(w.date)) + '. Saved in this browser.</p>' +
          '<div class="actions"><a class="btn btn--line" href="' + esc(mailto('I witnessed ' + x.id, 'I read ' + x.id + ' (' + String(x.title).replace(/\[\[hidden\]\]/g, '…') + ') and signed as a witness.\n\n' + w.name)) + '">Tell Vikas</a>' +
          '<button type="button" class="btn btn--text" id="unsign">Remove my signature</button></div></div>';
      }
      return '<div class="box witness"><p class="label">Witnessed and understood by</p>' +
        '<p class="bet__help">Read the method? Sign as a witness and your name goes on this page.</p>' +
        '<div class="witness__row"><div class="stack"><label class="field-label" for="witness-name">Your name</label>' +
        '<input class="input input--hand" id="witness-name" type="text" autocomplete="name"></div>' +
        '<button type="button" class="btn" id="sign">Sign</button></div></div>';
    }

    function side(x) {
      var running = x.status === 'running';
      var nextPage = x.page && /^\d+$/.test(x.page) ? pad2(Number(x.page) + 1) : '';
      return strip([[x.steps ? 'Figure' : 'Entry', x.steps ? '1' : x.id], ['Page', nextPage]]) +
        (list(x.steps).length ? '<figure>' + stepsHtml(x.steps) + '<figcaption>Fig. 1: Experiment design. Solid: done. Highlighted: this week. Dashed: still ahead.</figcaption></figure>' : '') +
        section(x.status === 'planned' ? 'What this should produce' : 'Result', x.result) +
        section('Next', x.next) +
        (x.status !== 'planned' && (running || x.method) ? witnessHtml(x) : '') +
        '<p class="label gap-l">All experiments</p><ul class="exp-list">' + exps.map(function (e) {
          var plainTitle = String(e.title || '').replace(/\[\[hidden\]\]/g, 'redacted');
          return '<li><button type="button" class="exp-row" data-id="' + esc(e.id) + '" aria-pressed="' + (e.id === x.id ? 'true' : 'false') + '" aria-label="' + esc(e.id + ': ' + plainTitle + '. ' + (e.status === 'running' ? 'Running' : (e.status === 'planned' ? 'Planned' : 'Concluded'))) + '">' +
            '<span class="exp-row__id">' + esc(e.id) + '</span><span class="exp-row__title">' + rich(e.title) + '</span><span class="exp-row__status">' + (e.status === 'running' ? 'Running' : (e.status === 'planned' ? 'Planned' : 'Concluded')) + '</span></button></li>';
        }).join('') + '</ul>' +
        foot([['Signed', 'V.S.'], ['Last entry', fmt(lastEntryDate())]]);
    }

    function paint(fromUser) {
      var x = byId(exps, String(selId).toUpperCase());
      if (!x) {
        left.innerHTML = '<p class="hand-m">No experiments yet. Add one in content/experiments.js.</p>';
        right.innerHTML = '';
        return;
      }
      left.innerHTML = writeup(x);
      right.innerHTML = side(x);
      var coffee = $('#coffee');
      if (coffee) coffee.addEventListener('click', function () { findSecret('coffee'); });
      var sign = $('#sign');
      if (sign) {
        var nameEl = $('#witness-name');
        var doSign = function () {
          var name = nameEl.value.trim();
          if (!name) { nameEl.focus(); return; }
          var all = store.get('witness', {}) || {};
          all[x.id] = { name: name.slice(0, 60), date: todayIso() };
          store.set('witness', all);
          paint(false);
        };
        sign.addEventListener('click', doSign);
        nameEl.addEventListener('keydown', function (e) { if (e.key === 'Enter') doSign(); });
      }
      var unsign = $('#unsign');
      if (unsign) unsign.addEventListener('click', function () {
        var all = store.get('witness', {}) || {};
        delete all[x.id];
        store.set('witness', all);
        paint(false);
      });
      if (fromUser) scrollToEl(left);
    }

    right.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('.exp-row') : null;
      if (!b) return;
      selId = b.getAttribute('data-id');
      setHash(selId);
      paint(true);
    });
    window.addEventListener('hashchange', function () {
      var x = byId(exps, hashId());
      if (x && x.id !== selId) { selId = x.id; paint(false); }
    });
    paint(false);
  }

  /* ============================================================
     PAGE: References (books, courses, films, articles, videos, podcasts)
     ============================================================ */

  function referencesSummary() {
    var parts = [];
    KINDS.forEach(function (k) {
      var n = everything.filter(function (x) { return x.kind === k.key && x.status === 'done'; }).length;
      if (n) parts.push(plural(n, k.one, k.many));
    });
    var waiting = everything.filter(function (x) { return x.status === 'queued'; }).length;
    if (!parts.length) return 'Books, courses, films and more';
    return parts.slice(0, 3).join(', ') + (waiting ? ', ' + waiting + ' still waiting' : '');
  }

  function kindWord(x) {
    var k = kindOf(x.kind);
    return k.one.charAt(0).toUpperCase() + k.one.slice(1) + ' · ' + k.words[x.status];
  }
  function linkWord(x) {
    var host = hostOf(x.link);
    if (x.kind === 'book') return 'On Goodreads';
    if (/imdb\.com$/.test(host)) return 'On IMDb';
    if (/wikipedia\.org$/.test(host)) return 'On Wikipedia';
    if (/youtube\.com$|youtu\.be$/.test(host)) return 'Watch on YouTube';
    if (/spotify\.com$/.test(host)) return 'Listen on Spotify';
    return kindOf(x.kind).link;
  }
  // Who made it: "Author · Series #2", "Christopher Nolan · 2014", "3Blue1Brown · YouTube"
  function byLine(x, long) {
    if (x.kind === 'book') return [x.by, x.series].filter(Boolean).join(' · ');
    if (x.kind === 'film') return [x.by ? (long ? 'Directed by ' : '') + x.by : '', x.year].filter(Boolean).join(' · ');
    return [x.by, x.kind !== 'course' && x.source !== x.by ? x.source : ''].filter(Boolean).join(' · ');
  }
  function factsOf(x) {
    var k = kindOf(x.kind), f = [];
    if (x.kind === 'book') {
      if (x.date) f.push([k.words.done, fmt(x.date)]);
      if (x.pages) f.push(['Pages', num(x.pages)]);
      if (x.year) f.push(['First published', x.year]);
      if (x.avg) f.push(['Goodreads average', x.avg.toFixed(2)]);
      return f;
    }
    if (x.date && x.status === 'done') f.push([k.words.done, when(x.date)]);
    if (x.minutes) f.push(['Length', minutesText(x.minutes)]);
    if (x.year && x.kind !== 'film' && x.date.slice(0, 4) !== x.year) f.push(['Published', x.year]);
    return f;
  }

  /* The index card a thing is written up on. One <dialog>, reused. */
  var card = null;
  function cardEl() {
    if (card) return card;
    var el = document.createElement('dialog');
    el.className = 'book-card';
    el.setAttribute('aria-labelledby', 'book-card-title');
    el.innerHTML = '<div class="book-card__paper"></div>';
    document.body.appendChild(el);
    card = { el: el, paper: el.firstChild, list: [], index: 0 };
    el.addEventListener('click', function (e) {
      if (e.target === el) { closeCard(); return; } // the desk around the card
      var t = e.target.closest ? e.target : null;
      if (!t) return;
      if (t.closest('.book-card__close')) { closeCard(); return; }
      var turn = t.closest('[data-step]');
      if (turn) stepCard(Number(turn.getAttribute('data-step')), true);
    });
    el.addEventListener('close', cardClosed);
    return card;
  }
  function markItem(id) {
    $$('[data-ref][aria-current]').forEach(function (el) { el.removeAttribute('aria-current'); });
    if (id) $$('[data-ref="' + id + '"]').forEach(function (el) { el.setAttribute('aria-current', 'true'); });
  }
  function paintCard() {
    var c = card;
    var x = c.list[c.index];
    if (!x) return;
    var finishedBook = x.kind === 'book' && x.status === 'done';
    var facts = factsOf(x);
    var by = byLine(x, true);
    c.paper.innerHTML =
      '<button type="button" class="book-card__close" aria-label="Put the card back"><span aria-hidden="true">×</span></button>' +
      '<div class="book-card__head book-card__head--' + x.kind + '">' +
        '<div class="book-card__cover">' + jacketHtml(x, 'jacket--card', (x.kind === 'video' ? 'Still from ' : x.kind === 'film' ? 'Poster for ' : 'Cover of ') + x.title) + '</div>' +
        '<div class="book-card__headtext">' +
          '<p class="label">' + esc(kindWord(x)) + (c.list.length > 1 ? '<span class="book-card__count"> · ' + (c.index + 1) + ' of ' + c.list.length + '</span>' : '') + '</p>' +
          '<h2 class="hand-l book-card__title" id="book-card-title">' + esc(x.title) + '</h2>' +
          (x.subtitle ? '<p class="book-card__sub">' + esc(x.subtitle) + '</p>' : '') +
          (by ? '<p class="book-card__by">' + esc(by) + '</p>' : '') +
          (finishedBook || x.rating
            ? '<div class="book-card__rating">' + starsHtml(x.rating, 'stars--big') + '<span class="book-card__words">' + esc(x.rating ? RATING_WORDS[x.rating] : 'no stars given') + '</span></div>'
            : '') +
        '</div>' +
      '</div>' +
      (facts.length ? '<div class="book-card__facts">' + facts.map(function (f) { return fieldHtml(f[0], f[1]); }).join('') + '</div>' : '') +
      (x.line ? '<p class="margin-note gap-m">' + rich(x.line) + '</p>' : '') +
      (x.why ? '<p class="label gap-m">Why it\'s on the list</p><p class="hand-s gap-s">' + rich(x.why) + '</p>' : '') +
      (x.note
        ? '<p class="label gap-m">What I wrote</p><div class="prose book-card__review">' + reviewHtml(x.note) + '</div>'
        : finishedBook ? '<p class="hand-s muted gap-m">No review written. The stars will have to do.</p>' : '') +
      (x.genres.length
        ? '<p class="book-card__tags" aria-label="Shelved under">' + x.genres.map(function (g) { return '<span style="--c:' + esc(g.color) + '">' + esc(g.label) + '</span>'; }).join('') + '</p>'
        : '') +
      '<div class="actions book-card__nav">' +
        (c.list.length > 1
          ? '<button type="button" class="btn btn--line" data-step="-1">' + ICON.back + '<span>Previous</span></button>' +
            '<button type="button" class="btn btn--line" data-step="1"><span>Next</span>' + ICON.next + '</button>'
          : '') +
        (x.link ? '<a class="btn btn--text" href="' + esc(x.link) + '" target="_blank" rel="noopener">' + esc(linkWord(x)) + '</a>' : '') +
      '</div>';
    c.paper.scrollTop = 0;
    setHash(x.hash);
    markItem(x.id);
  }
  function openCard(id, items) {
    id = String(id);
    var pool = list(items);
    var at = -1;
    for (var i = 0; i < pool.length; i++) if (pool[i].id === id) { at = i; break; }
    if (at === -1) {
      var one = itemById(id);
      if (!one) return;
      pool = [one];
      at = 0;
    }
    var c = cardEl();
    c.list = pool;
    c.index = at;
    paintCard();
    if (!c.el.open) {
      if (typeof c.el.showModal === 'function') c.el.showModal();
      else c.el.setAttribute('open', '');
      document.documentElement.classList.add('has-card');
      var shut = $('.book-card__close', c.el);
      if (shut) shut.focus();
    }
  }
  function stepCard(delta, fromButton) {
    var c = card;
    if (!c || c.list.length < 2) return;
    c.index = (c.index + delta + c.list.length) % c.list.length;
    paintCard();
    var again = fromButton ? $('[data-step="' + delta + '"]', c.el) : $('.book-card__close', c.el);
    if (again) again.focus();
  }
  function closeCard() {
    if (!card) return;
    if (card.el.open && typeof card.el.close === 'function') card.el.close();
    else { card.el.removeAttribute('open'); cardClosed(); }
  }
  function cardClosed() {
    if (card && card.el.open) return; // reopened before the close event arrived
    document.documentElement.classList.remove('has-card');
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* not allowed here */ }
    var x = card && card.list[card.index];
    markItem('');
    var back = x && $('[data-ref="' + x.id + '"]');
    if (back) back.focus();
  }

  /* Fig. 3: books finished per year, inked in like the other sketches */
  function yearChart(books) {
    var counts = {};
    books.forEach(function (b) { var y = Number(String(b.date).slice(0, 4)); if (y) counts[y] = (counts[y] || 0) + 1; });
    var ys = Object.keys(counts).map(Number);
    if (!ys.length) return '';
    var first = Math.min.apply(null, ys);
    var last = Math.max(Math.max.apply(null, ys), new Date().getFullYear());
    var all = [];
    for (var y = first; y <= last; y++) all.push({ y: y, n: counts[y] || 0 });
    var max = Math.max.apply(null, all.map(function (a) { return a.n; }));
    var best = all.filter(function (a) { return a.n === max; })[0];
    var W = 360, TOP = 30, BASE = 120;
    var slot = W / all.length, bw = Math.min(28, slot * 0.58), short = slot < 44;
    var shapes = '', words = '';
    all.forEach(function (a, i) {
      var x = slot * i + (slot - bw) / 2;
      var cx = (x + bw / 2).toFixed(1);
      var top = BASE - Math.round((BASE - TOP) * a.n / (max || 1));
      var d = 'M' + x.toFixed(1) + ' ' + BASE + 'V' + top + 'H' + (x + bw).toFixed(1) + 'V' + BASE;
      var isBest = a === best;
      if (a.n) {
        shapes += '<path class="bar-fill' + (isBest ? ' bar-fill--best' : '') + '" d="' + d + 'Z"/>' +
          '<path class="ink' + (isBest ? ' ink--red' : '') + '" pathLength="1" style="--d:' + (i * 0.07).toFixed(2) + 's" d="' + d + '"/>';
      }
      words += '<text class="val' + (isBest ? ' red' : a.n ? '' : ' none') + '" x="' + cx + '" y="' + (top - 10) + '">' + a.n + '</text>' +
        '<text class="axis" x="' + cx + '" y="' + (BASE + 20) + '">' + (short ? '’' + String(a.y).slice(2) : a.y) + '</text>';
    });
    var aria = 'Books finished per year: ' + all.map(function (a) { return a.y + ', ' + a.n; }).join('; ') + '.';
    return '<figure class="lib-fig"><svg class="sketch lib-chart" data-draw viewBox="0 0 ' + W + ' 150" role="img" aria-label="' + esc(aria) + '">' +
      '<path class="under" d="M2 ' + BASE + 'H' + (W - 2) + '"/>' + shapes + words + '</svg>' +
      '<figcaption>Fig. 3: Books finished each year. The busiest was ' + best.y + ', with ' + best.n + '.</figcaption></figure>';
  }

  /* Fig. 4: how the stars fall */
  function ratingFigure(books) {
    var rated = books.filter(function (b) { return b.rating; });
    if (!rated.length) return '';
    var avg = rated.reduce(function (s, b) { return s + b.rating; }, 0) / rated.length;
    var rows = [5, 4, 3, 2, 1].map(function (r) { return { r: r, n: rated.filter(function (b) { return b.rating === r; }).length }; });
    var max = Math.max.apply(null, rows.map(function (x) { return x.n; })) || 1;
    return '<figure class="lib-fig"><ul class="lib-rates" data-draw>' + rows.map(function (x, i) {
      return '<li>' + starsHtml(x.r) +
        '<span class="lib-rates__bar" aria-hidden="true" style="--v:' + (x.n / max).toFixed(3) + ';--d:' + (0.15 + i * 0.1).toFixed(2) + 's"></span>' +
        '<b>' + x.n + '<span class="visually-hidden"> ' + (x.n === 1 ? 'book' : 'books') + '</span></b></li>';
    }).join('') + '</ul>' +
      '<figcaption>Fig. 4: The stars I gave. Average ' + avg.toFixed(1) + ' from ' + rated.length + ' rated books.</figcaption></figure>';
  }

  /* The little drawn icons on the drawer tabs */
  var KIND_ICON = {
    everything: '<path d="M3 5h10M3 8h10M3 11h6"/>',
    book: '<path d="M3 3.5h4a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 0 7 11.5H3zM13 3.5H9.5A1.5 1.5 0 0 0 8 5"/><path d="M8.5 13a1.5 1.5 0 0 1 1.5-1.5h3v-8"/>',
    course: '<path d="M1.5 6L8 3l6.5 3L8 9z"/><path d="M4 7.3v3.2c1.2 1 2.6 1.5 4 1.5s2.8-.5 4-1.5V7.3M14.5 6v4"/>',
    film: '<rect x="2" y="3.5" width="12" height="9" rx="1"/><path d="M5 3.5v9M11 3.5v9M2 6.5h3M2 9.5h3M11 6.5h3M11 9.5h3"/>',
    article: '<path d="M3 2.5h7.5L13 5v8.5H3z"/><path d="M5.5 6.5h5M5.5 9h5M5.5 11.5h3"/>',
    video: '<rect x="1.5" y="3.5" width="13" height="9" rx="2"/><path d="M6.5 6v4l3.5-2z"/>',
    podcast: '<rect x="6" y="2" width="4" height="7.5" rx="2"/><path d="M3.5 8a4.5 4.5 0 0 0 9 0M8 12.5V14.5M5.5 14.5h5"/>'
  };
  function kindIcon(key) {
    return '<svg class="icon" aria-hidden="true" width="16" height="16" viewBox="0 0 16 16">' + (KIND_ICON[key] || KIND_ICON.article) + '</svg>';
  }

  function renderReferences() {
    var left = $('#ref-left');
    var right = $('#ref-right');
    if (!left || !right) return;

    var kinds = KINDS.filter(function (k) { return ofKind(k.key).length; });
    var tabs = kinds.length > 1 ? kinds.concat([{ key: 'everything', label: 'Everything' }]) : kinds;
    var savedKind = store.get('refKind', '');
    var state = { kind: tabs.some(function (t) { return t.key === savedKind; }) ? savedKind : (kinds[0] ? kinds[0].key : 'book') };
    var shown = [];
    var SHOW = 12;

    var doneBooks = library.filter(function (b) { return b.status === 'done'; });
    var since = doneBooks.map(function (b) { return b.date.slice(0, 4); }).filter(Boolean).sort()[0] || '';
    var doneCount = everything.filter(function (x) { return x.status === 'done'; }).length;
    var picks = list(refs.startHere).map(itemById).filter(Boolean);
    var desk = everything.filter(function (x) { return x.status === 'doing'; });
    // Newest first. Things written into the log without a date go on top, in the order they were written.
    var waiting = everything.filter(function (x) { return x.status === 'queued'; })
      .sort(function (a, b) { return (a.added ? 1 : 0) - (b.added ? 1 : 0) || String(b.added).localeCompare(String(a.added)); });
    var dropped = everything.filter(function (x) { return x.status === 'dropped'; });
    var recent = everything.filter(function (x) { return x.status === 'done' && x.date; })
      .sort(function (a, b) { return b.date.localeCompare(a.date); }).slice(0, 4);

    function jacketRow(items, cls) {
      return '<ul class="jacket-row ' + cls + '">' + items.map(function (x, i) {
        return '<li style="--r:' + [-2, 1.5, -1, 2, -1.5][i % 5] + 'deg"><button type="button" class="jacket-row__item jacket-row__item--' + x.kind + '" data-ref="' + esc(x.id) + '">' +
          '<span class="jacket-row__frame">' + jacketHtml(x, 'jacket--row') + '</span>' +
          '<span class="jacket-row__title">' + esc(x.title) + '</span>' +
          '<span class="jacket-row__by">' + esc(x.kind === 'book' ? x.by : kindOf(x.kind).one + (x.by ? ' · ' + x.by : '')) + '</span></button></li>';
      }).join('') + '</ul>';
    }
    function deskCard(x) {
      return '<button type="button" class="reading-card" data-ref="' + esc(x.id) + '">' +
        jacketHtml(x, 'jacket--reading') +
        '<span class="reading-card__body">' +
          '<span class="reading-card__kicker">' + esc(kindWord(x)) + '</span>' +
          '<span class="reading-card__title">' + esc(x.title) + '</span>' +
          '<span class="reading-card__author">' + esc(x.by) + (x.pages ? ' · ' + num(x.pages) + ' pages' : '') + '</span>' +
          (x.line || x.why ? '<span class="reading-card__why">' + rich(x.line || x.why) + '</span>' : '') +
        '</span></button>';
    }

    left.innerHTML =
      strip([['Title', 'References'], ['Logged', num(doneCount)], ['Since', since], ['Page', '30']]) +
      '<h1 class="hand-xl">References</h1>' +
      (refs.intro ? '<p class="lede">' + rich(refs.intro) + '</p>' : '') +
      (picks.length
        ? '<p class="label gap-l">Start here</p><h2 class="hand-m lib-start__title">' + esc(refs.startHereTitle || 'What shaped me') + '</h2>' + jacketRow(picks, 'lib-start')
        : '') +
      (desk.length ? '<p class="label gap-l">On the desk now</p><div class="reading">' + desk.map(deskCard).join('') + '</div>' : '') +
      (doneBooks.length
        ? '<p class="label gap-l">The numbers</p>' +
          '<div class="box lib-stats">' +
            '<div class="lib-totals">' +
              '<span class="lib-total"><b>' + num(doneBooks.length) + '</b><span>books read</span></span>' +
              '<span class="lib-total"><b>' + num(doneBooks.reduce(function (s, b) { return s + b.pages; }, 0)) + '</b><span>pages</span></span>' +
              '<span class="lib-total"><b>' + doneBooks.filter(function (b) { return b.note; }).length + '</b><span>reviews</span></span>' +
            '</div>' +
            '<div class="lib-figs">' + yearChart(doneBooks) + ratingFigure(doneBooks) + '</div>' +
          '</div>'
        : '') +
      (tabs.length ? '<p class="note-mono gap-m">The whole collection is on the <a class="ink-link" href="#collection">fold-out below</a>.</p>' : '');

    // The collection gets a fold-out sheet under both pages: room for a proper bookcase.
    var plate = $('#ref-plate');
    if (!plate) {
      plate = document.createElement('section');
      plate.className = 'page page--plate';
      plate.id = 'ref-plate';
      plate.setAttribute('aria-label', 'The collection');
      right.parentNode.appendChild(plate);
    }
    plate.innerHTML =
      strip([['Plate', 'I'], ['Title', 'The collection'], ['Shelved', 'by hand']]) +
      '<h2 class="hand-xl" id="collection">The collection</h2>' +
      (tabs.length
        ? '<div class="lib-drawers">' +
            '<div class="lib-kinds" role="tablist" aria-label="What to show">' + tabs.map(function (t) {
              var n = t.key === 'everything' ? everything.length : ofKind(t.key).length;
              return '<button type="button" class="lib-kind" role="tab" id="kind-' + t.key + '" aria-controls="lib-panel" data-kind="' + t.key + '" aria-selected="' + (t.key === state.kind) + '"' + (t.key === state.kind ? '' : ' tabindex="-1"') + '>' +
                kindIcon(t.key) + '<span>' + esc(t.label) + '</span><small>' + n + '</small></button>';
            }).join('') + '</div>' +
            '<div class="lib-panel" id="lib-panel" role="tabpanel"></div>' +
          '</div>'
        : '<p class="hand-m gap-l">Nothing logged yet. The shelves fill up from Goodreads on the next sync.</p>') +
      (gr.profile
        ? '<p class="note-mono gap-m">Books, stars and reviews come from <a class="ink-link" href="' + esc(gr.profile) + '" target="_blank" rel="noopener">Goodreads</a>, copied here every morning' + (gr.synced ? ' (last change ' + esc(fmt(gr.synced)) + ')' : '') + '. The shelves are sorted by hand.</p>'
        : '');

    right.innerHTML =
      strip([['Title', 'Antilibrary'], ['Waiting', String(waiting.length)], ['Page', '31']]) +
      '<h2 class="hand-xl" id="antilibrary">The antilibrary</h2>' +
      '<p class="lede">' + (waiting.length ? plural(waiting.length, 'thing', 'things') + ' I haven\'t got to yet, newest first. ' : '') + 'They say more about where I\'m going than the ones I\'ve finished.</p>' +
      (waiting.length
        ? '<ul class="anti anti--compact" id="anti">' + waiting.map(function (x, i) {
            return '<li' + (i >= SHOW ? ' hidden data-extra' : '') + '><span class="anti__box" style="--r:' + [-3, 2, -1, 3][i % 4] + 'deg" aria-hidden="true"></span>' +
              '<button type="button" class="anti__open" data-ref="' + esc(x.id) + '">' +
                jacketHtml(x, 'jacket--thumb') +
                '<span class="anti__text">' +
                  '<span class="anti__title">' + esc(x.title) + '</span>' +
                  '<span class="anti__author">' + (x.kind === 'book' ? '' : esc(kindOf(x.kind).one) + (x.by ? ' · ' : '')) + esc(x.by) + (x.pages ? ' · ' + num(x.pages) + ' pages' : '') + '</span>' +
                  (x.why ? '<span class="anti__why">' + rich(x.why) + '</span>' : '') +
                '</span>' +
              '</button></li>';
          }).join('') + '</ul>'
        : '') +
      (waiting.length > SHOW ? '<button type="button" class="btn btn--line gap-s" id="anti-more" aria-expanded="false" aria-controls="anti">Show all ' + waiting.length + '</button>' : '') +
      (recent.length ? '<p class="label gap-l">Recently finished</p>' + jacketRow(recent, 'lib-recent') : '') +
      '<div class="box box--dashed gap-l"><p class="label">Recommend me something</p>' +
        composerHtml({
          id: 'lend',
          prepareLabel: 'Add it to the queue',
          againLabel: 'Suggest another',
          fields: [
            { name: 'title', type: 'text', label: 'A book, film, article, course, video or podcast' },
            { name: 'why', type: 'textarea', hand: true, rows: 2, label: 'Why should I get to it?' }
          ]
        }) +
      '</div>' +
      '<p class="footnote">“Antilibrary”: Nassim Taleb\'s word for a library of unread books, after Umberto Eco\'s.</p>' +
      foot([['Signed', 'V.S.'], ['Queue', 'open to suggestions']]);

    bindComposer({
      id: 'lend',
      subject: function (v) { return 'A recommendation for your notebook' + (v.title ? ': ' + v.title : ''); },
      body: function (v) { return 'What: ' + (v.title || '') + '\n\nWhy: ' + (v.why || ''); }
    });

    /* ---------- one drawer at a time ---------- */
    var panel = $('#lib-panel');
    var view = {};       // the visitor's view per kind: shelf/list or cards/list
    var filter = null;   // filters for the open drawer
    function shelfRank(g) { var i = GENRES.indexOf(g); return i === -1 ? GENRES.length : i; }
    var ORDERS = {
      shelf: { label: 'By genre', word: 'shelved by genre', fn: function (a, b) {
        return shelfRank(a.genre) - shelfRank(b.genre) || a.sortBy.localeCompare(b.sortBy) ||
          a.seriesName.localeCompare(b.seriesName) || a.seriesNo - b.seriesNo || a.sortTitle.localeCompare(b.sortTitle);
      } },
      date: { label: 'Newest first', word: 'newest first', fn: function (a, b) { return String(b.date || b.added).localeCompare(String(a.date || a.added)) || a.sortTitle.localeCompare(b.sortTitle); } },
      rating: { label: 'Most stars', word: 'most stars first', fn: function (a, b) { return b.rating - a.rating || String(b.date).localeCompare(String(a.date)); } },
      title: { label: 'A to Z', word: 'A to Z', fn: function (a, b) { return a.sortTitle.localeCompare(b.sortTitle); } },
      length: { label: 'Longest first', word: 'longest first', fn: function (a, b) { return (b.pages || b.minutes) - (a.pages || a.minutes) || a.sortTitle.localeCompare(b.sortTitle); } }
    };
    function ordersFor(kind) {
      if (kind === 'book') return ['shelf', 'date', 'rating', 'title', 'length'];
      if (kind === 'film' || kind === 'video' || kind === 'podcast') return ['date', 'rating', 'title', 'length'];
      return ['date', 'rating', 'title'];
    }
    function poolFor(kind) { return kind === 'everything' ? everything : ofKind(kind); }
    function viewFor(kind) {
      if (kind === 'everything') return 'list';
      if (view[kind]) return view[kind];
      var saved = store.get('refView-' + kind, '');
      var options = kind === 'book' ? ['shelf', 'list'] : ['cards', 'list'];
      if (options.indexOf(saved) !== -1) return saved;
      return kind === 'book' ? 'shelf' : 'cards';
    }
    // Each drawer opens on what's been finished; the antilibrary has the rest.
    function freshFilter(kind) {
      var hasDone = poolFor(kind).some(function (x) { return x.status === 'done'; });
      return { status: hasDone ? 'done' : '', genre: '', five: false, noted: false, q: '', sort: ordersFor(kind)[0] };
    }
    var EVERY_WORDS = { done: 'Finished', doing: 'In progress', queued: 'Waiting', dropped: 'Gave up' };
    function statusWord(kind, s) { return kind === 'everything' ? EVERY_WORDS[s] : kindOf(kind).words[s]; }

    function matches(x) {
      if (filter.status && x.status !== filter.status) return false;
      if (filter.genre && !x.genres.some(function (g) { return g.key === filter.genre; }) && !(filter.genre === UNSHELVED.key && x.genre === UNSHELVED)) return false;
      if (filter.five && x.rating !== 5) return false;
      if (filter.noted && !x.note) return false;
      return !filter.q || x.find.indexOf(filter.q) !== -1;
    }
    function groupKey(x) {
      var s = filter.sort;
      if (s === 'shelf') return x.genre.key;
      if (s === 'date') return String(x.date || x.added || '').slice(0, 4) || 'Undated';
      if (s === 'rating') return String(x.rating);
      if (s === 'title') { var ch = x.sortTitle.charAt(0).toUpperCase(); return /[A-Z]/.test(ch) ? ch : '#'; }
      var n = x.pages || x.minutes;
      if (!n) return '?';
      if (x.kind !== 'book') return n >= 120 ? '2h+' : n >= 60 ? '1-2h' : '<1h';
      return n >= 600 ? '600+' : n >= 400 ? '400-599' : n >= 200 ? '200-399' : '<200';
    }
    function groupName(key) {
      var s = filter.sort;
      if (s === 'shelf') { var g = genreByKey(key); return g ? g.label : key; }
      if (s === 'rating') return key === '0' ? 'Not rated' : plural(Number(key), 'star', 'stars');
      if (s === 'length') return { '?': 'Length unknown', '600+': '600 pages and up', '<200': 'Under 200 pages', '2h+': 'Two hours and up', '1-2h': 'One to two hours', '<1h': 'Under an hour' }[key] || key.replace('-', '–') + ' pages';
      return key;
    }
    function grouped(items) {
      var out = [];
      items.forEach(function (x) {
        var k = groupKey(x);
        var last = out[out.length - 1];
        if (!last || last.key !== k) out.push(last = { key: k, items: [] });
        last.items.push(x);
      });
      return out;
    }

    /* the bookcase */
    // Taller and thicker with more pages, coloured like the cover.
    function spineHtml(b) {
      var p = b.pages || 320;
      var h = Math.round(Math.max(96, Math.min(142, 84 + p * 0.07)));
      var w = Math.round(Math.max(19, Math.min(36, 15 + p / 38)));
      var look = spineLook(b);
      var label = b.title + ', ' + b.by + '. ' + (b.rating ? b.rating + ' of 5 stars' : 'Not rated') +
        (b.date ? '. Read ' + fmt(b.date, 'month') : '') + (b.note ? '. Reviewed' : '');
      return '<li class="bookcase__slot"><button type="button" class="spine' + (b.note ? ' spine--noted' : '') + (w < 23 ? ' spine--thin' : '') + (look.light ? ' spine--light' : '') + '" data-ref="' + esc(b.id) + '"' +
        ' style="--h:' + h + 'px;--w:' + w + 'px;' + look.css + '" aria-label="' + esc(label) + '" title="' + esc(b.title + ' · ' + b.by) + '">' +
        (b.rating === 5 ? '<span class="spine__star" aria-hidden="true">★</span>' : '') +
        '<span class="spine__title" aria-hidden="true">' + esc(b.title) + '</span>' +
        '</button></li>';
    }
    function guideHtml(g) {
      var genre = filter.sort === 'shelf' ? genreByKey(g.key) : null;
      return '<li class="bookcase__slot bookcase__slot--guide" aria-hidden="true"><span class="shelf-guide"' + (genre ? ' style="--c:' + esc(genre.color) + '"' : '') + '>' +
        '<b>' + esc(genre ? genre.short : filter.sort === 'rating' ? (g.key === '0' ? 'Unrated' : g.key + '★') : g.key) + '</b>' +
        '<small>' + g.items.length + '</small></span></li>';
    }
    function bookcaseHtml(groups) {
      var html = '', count = 0;
      var plain = !filter.genre && !filter.q && !filter.five && !filter.noted && filter.status === 'done';
      groups.forEach(function (g) {
        if (filter.sort !== 'title') html += guideHtml(g);
        g.items.forEach(function (b) {
          html += spineHtml(b);
          if (++count === 7 && plain) {
            html += '<li class="bookcase__slot"><button type="button" class="spine spine--secret" id="secret-spine" style="--h:146px;--w:24px" aria-label="A book sticking out of the shelf"></button></li>';
          }
        });
      });
      return '<div class="bookcase"><ul class="bookcase__shelves" aria-label="Books on the shelf">' + html + '</ul></div>';
    }

    /* cards and lists, for everything */
    function listHtml(groups, mixed) {
      return groups.map(function (g) {
        return '<h3 class="lib-group">' + esc(groupName(g.key)) + ' <small>' + g.items.length + '</small></h3>' +
          '<ul class="lib-list">' + g.items.map(function (x) {
            return '<li><button type="button" class="lib-item" data-ref="' + esc(x.id) + '">' +
              '<span class="lib-item__thumb lib-item__thumb--' + x.kind + '" style="--c:' + esc(x.genre.color) + '">' + jacketHtml(x, 'jacket--thumb') + '</span>' +
              '<span class="lib-item__main"><span class="lib-item__title">' + esc(x.title) + '</span>' +
                '<span class="lib-item__by">' + (mixed ? '<b>' + esc(kindOf(x.kind).one) + '</b> · ' : '') + esc(x.by || x.source) +
                  (!filter.status ? ' · ' + esc(kindOf(x.kind).words[x.status].toLowerCase()) : '') + (x.note ? ' · reviewed' : '') + '</span></span>' +
              '<span class="lib-item__meta">' + (x.rating || (x.kind === 'book' && x.status === 'done') ? starsHtml(x.rating) : '') +
                (x.date ? '<span class="lib-item__when">' + esc(x.kind === 'book' ? fmt(x.date, 'month') : when(x.date)) + '</span>' : '') + '</span>' +
              '</button></li>';
          }).join('') + '</ul>';
      }).join('');
    }
    function cardsHtml(groups, kind) {
      return groups.map(function (g) {
        return '<h3 class="lib-group">' + esc(groupName(g.key)) + ' <small>' + g.items.length + '</small></h3>' +
          '<ul class="lib-cards lib-cards--' + kind + '">' + g.items.map(function (x) {
            return '<li><button type="button" class="lib-card" data-ref="' + esc(x.id) + '">' +
              jacketHtml(x, 'jacket--grid') +
              '<span class="lib-card__title">' + esc(x.title) + '</span>' +
              '<span class="lib-card__by">' + esc(byLine(x, false)) + '</span>' +
              '<span class="lib-card__meta">' + (x.rating ? starsHtml(x.rating) : '') + (x.date ? '<span>' + esc(when(x.date)) + '</span>' : '') + '</span>' +
              '</button></li>';
          }).join('') + '</ul>';
      }).join('');
    }

    function chipsHtml(kind) {
      var pool = poolFor(kind);
      var statuses = STATUSES.filter(function (s) { return pool.some(function (x) { return x.status === s; }); });
      var statusChips = (statuses.length > 1 || !filter.status
        ? '<div class="lib-chips lib-status" role="group" aria-label="Status">' +
            statuses.map(function (s) {
              return '<button type="button" class="lib-chip" data-status="' + s + '" aria-pressed="' + (filter.status === s) + '">' + esc(statusWord(kind, s)) + ' <span data-count></span></button>';
            }).join('') +
            '<button type="button" class="lib-chip" data-status="" aria-pressed="' + !filter.status + '">All <span data-count></span></button>' +
          '</div>'
        : '');
      var present = GENRES.filter(function (g) { return pool.some(function (x) { return x.genres.indexOf(g) !== -1; }); });
      if (pool.some(function (x) { return x.genre === UNSHELVED; })) present.push(UNSHELVED);
      var families = FAMILIES.map(function (f) {
        var gs = present.filter(function (g) { return g.family === f.key; });
        if (!gs.length) return '';
        return '<div class="lib-family"><span class="lib-family__label">' + esc(f.label) + '</span>' + gs.map(function (g) {
          return '<button type="button" class="lib-chip" data-genre="' + g.key + '" aria-pressed="' + (filter.genre === g.key) + '"><i style="--c:' + esc(g.color) + '" aria-hidden="true"></i>' + esc(g.label) + ' <span data-count></span></button>';
        }).join('') + '</div>';
      }).join('');
      return statusChips +
        (present.length ? '<div class="lib-chips lib-genres" role="group" aria-label="Genre">' +
          '<div class="lib-family"><button type="button" class="lib-chip" data-genre="" aria-pressed="' + !filter.genre + '">All genres <span data-count></span></button></div>' + families + '</div>' : '') +
        '<div class="lib-bar">' +
          (pool.some(function (x) { return x.rating; }) ? '<button type="button" class="lib-chip" id="lib-five" aria-pressed="' + filter.five + '">' + starsHtml(5) + '<span class="visually-hidden"> only</span></button>' : '') +
          (pool.some(function (x) { return x.note; }) ? '<button type="button" class="lib-chip" id="lib-noted" aria-pressed="' + filter.noted + '">With a review</button>' : '') +
          '<label class="lib-sort"><span class="field-label">Order</span><select id="lib-sort" class="lib-select">' +
            ordersFor(kind).map(function (o) { return '<option value="' + o + '"' + (filter.sort === o ? ' selected' : '') + '>' + esc(ORDERS[o].label) + '</option>'; }).join('') +
          '</select></label>' +
        '</div>';
    }

    function openDrawer(kind, focusTab) {
      state.kind = kind;
      store.set('refKind', kind);
      filter = freshFilter(kind);
      $$('.lib-kind', plate).forEach(function (t) {
        var on = t.getAttribute('data-kind') === kind;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        if (on && focusTab) t.focus();
      });
      panel.setAttribute('aria-labelledby', 'kind-' + kind);
      var v = viewFor(kind);
      var views = kind === 'everything' ? [] : kind === 'book' ? [['shelf', 'Shelves'], ['list', 'List']] : [['cards', 'Cards'], ['list', 'List']];
      var books = kind === 'book';
      // The filters stay folded away until asked for: the shelves come first.
      panel.innerHTML =
        '<div class="lib-tools">' +
          '<div class="lib-searchrow">' +
            '<label class="visually-hidden" for="lib-search">Search</label>' +
            '<input class="input lib-search" id="lib-search" type="search" placeholder="' + esc(books ? 'Title, author, series or genre' : 'Title, maker or topic') + '" autocomplete="off" spellcheck="false">' +
            '<button type="button" class="lib-chip lib-filter-toggle" id="lib-filter-toggle" aria-controls="lib-filters" aria-expanded="false">Filters<b id="lib-active" hidden></b></button>' +
            (views.length ? '<span class="lib-view" role="group" aria-label="Show as">' + views.map(function (o) {
              return '<button type="button" class="lib-chip" data-view="' + o[0] + '" aria-pressed="' + (v === o[0]) + '">' + o[1] + '</button>';
            }).join('') + '</span>' : '') +
          '</div>' +
          '<div class="lib-filters" id="lib-filters" hidden>' + chipsHtml(kind) + '</div>' +
        '</div>' +
        '<p class="lib-count" id="lib-count" aria-live="polite"></p>' +
        '<div id="lib-items"></div>' +
        (books ? '<p class="legend" id="lib-legend"' + (v === 'shelf' ? '' : ' hidden') + '>Each spine takes its colours from the cover, and its height from the page count. <span class="legend__star">★</span> five stars. A red ribbon means I wrote a review.</p>' : '') +
        (books ? '<div class="actions"><button type="button" class="btn btn--line" id="pull">Pull one off the shelf</button></div>' : '') +
        (dropped.some(function (x) { return x.kind === kind; })
          ? '<p class="lib-dnf gap-l"><span class="label">' + esc(kindOf(kind).words.dropped) + '</span>' + dropped.filter(function (x) { return x.kind === kind; }).map(function (x) {
              return '<button type="button" class="lib-dnf__book" data-ref="' + esc(x.id) + '"><s>' + esc(x.title) + '</s></button><span class="lib-dnf__by">' + esc(x.by) + '</span>';
            }).join('') + '</p>'
          : '');
      paint();
      drawIn(panel);
    }

    function paint() {
      var kind = state.kind;
      var pool = poolFor(kind);
      var v = viewFor(kind);
      var base = pool.filter(function (x) { return !filter.status || x.status === filter.status; });
      shown = pool.filter(matches).sort(ORDERS[filter.sort].fn);
      var unit = kind === 'everything' ? ['thing', 'things'] : [kindOf(kind).one, kindOf(kind).many];
      // "Read: all 120 books, shelved by genre." / "Want to read: showing 9 of 76 books, newest first."
      var count = (shown.length === base.length ? (base.length > 2 ? 'all ' : '') : 'showing ' + shown.length + ' of ') +
        plural(base.length, unit[0], unit[1]) + ', ' + ORDERS[filter.sort].word + '.';
      $('#lib-count', panel).textContent = filter.status ? statusWord(kind, filter.status) + ': ' + count : count.charAt(0).toUpperCase() + count.slice(1);
      $$('[data-status]', panel).forEach(function (el) {
        var s = el.getAttribute('data-status');
        $('[data-count]', el).textContent = String(pool.filter(function (x) { return !s || x.status === s; }).length);
      });
      $$('[data-genre]', panel).forEach(function (el) {
        var key = el.getAttribute('data-genre');
        var n = key ? base.filter(function (x) { return x.genres.some(function (g) { return g.key === key; }) || (key === UNSHELVED.key && x.genre === UNSHELVED); }).length : base.length;
        $('[data-count]', el).textContent = String(n);
        el.hidden = !!key && !n && key !== filter.genre;
      });
      var items = $('#lib-items', panel);
      if (!shown.length) {
        items.innerHTML = '<p class="hand-m gap-s">Nothing here matches that.</p><button type="button" class="btn btn--text" id="lib-clear">Clear the filters</button>';
      } else if (kind === 'book' && v === 'shelf') {
        items.innerHTML = bookcaseHtml(grouped(shown));
      } else if (v === 'cards') {
        items.innerHTML = cardsHtml(grouped(shown), kind);
      } else {
        items.innerHTML = listHtml(grouped(shown), kind === 'everything');
      }
      if (card && card.el.open) markItem(card.list[card.index].id);
      var active = (filter.genre ? 1 : 0) + (filter.five ? 1 : 0) + (filter.noted ? 1 : 0) + (filter.sort !== ordersFor(kind)[0] ? 1 : 0) +
        (filter.status !== freshFilter(kind).status ? 1 : 0);
      var badge = $('#lib-active', panel);
      badge.hidden = !active;
      badge.textContent = active ? String(active) : '';
      var pull = $('#pull', panel);
      if (pull) pull.disabled = !shown.length;
    }

    function pressOnly(selector, on) {
      $$(selector, panel).forEach(function (el) { el.setAttribute('aria-pressed', String(el === on)); });
    }

    if (panel) {
      openDrawer(state.kind, false);

      plate.addEventListener('keydown', function (e) {
        var tab = e.target.closest ? e.target.closest('.lib-kind') : null;
        if (!tab || (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft')) return;
        e.preventDefault(); // move between drawers, not pages
        var all = $$('.lib-kind', plate);
        var next = all[(all.indexOf(tab) + (e.key === 'ArrowRight' ? 1 : all.length - 1)) % all.length];
        openDrawer(next.getAttribute('data-kind'), true);
      });

      panel.addEventListener('input', function (e) {
        if (e.target.id !== 'lib-search') return;
        filter.q = fold(e.target.value.trim());
        paint();
      });
      panel.addEventListener('change', function (e) {
        if (e.target.id !== 'lib-sort') return;
        filter.sort = ORDERS[e.target.value] ? e.target.value : ordersFor(state.kind)[0];
        paint();
      });
    }

    function onClick(e) {
      var t = e.target.closest ? e.target : null;
      if (!t) return;
      var tab = t.closest('.lib-kind');
      if (tab) { if (tab.getAttribute('data-kind') !== state.kind) openDrawer(tab.getAttribute('data-kind'), false); return; }
      if (t.closest('#secret-spine')) { findSecret('spine'); return; }
      var chip;
      if ((chip = t.closest('[data-status]'))) { filter.status = chip.getAttribute('data-status'); pressOnly('[data-status]', chip); paint(); return; }
      if ((chip = t.closest('[data-genre]'))) { filter.genre = chip.getAttribute('data-genre'); pressOnly('[data-genre]', chip); paint(); return; }
      if ((chip = t.closest('#lib-five'))) { filter.five = !filter.five; chip.setAttribute('aria-pressed', String(filter.five)); paint(); return; }
      if ((chip = t.closest('#lib-noted'))) { filter.noted = !filter.noted; chip.setAttribute('aria-pressed', String(filter.noted)); paint(); return; }
      if ((chip = t.closest('[data-view]'))) {
        view[state.kind] = chip.getAttribute('data-view');
        store.set('refView-' + state.kind, view[state.kind]);
        pressOnly('[data-view]', chip);
        var legend = $('#lib-legend', panel);
        if (legend) legend.hidden = view[state.kind] !== 'shelf';
        paint();
        return;
      }
      if (t.closest('#lib-filter-toggle')) {
        var btn = $('#lib-filter-toggle', panel);
        var open = btn.getAttribute('aria-expanded') !== 'true';
        btn.setAttribute('aria-expanded', String(open));
        $('#lib-filters', panel).hidden = !open;
        return;
      }
      if (t.closest('#lib-clear')) {
        var keepSort = filter.sort;
        filter = freshFilter(state.kind);
        filter.sort = keepSort;
        var q = $('#lib-search', panel);
        if (q) q.value = '';
        $('#lib-filters', panel).innerHTML = chipsHtml(state.kind);
        paint();
        return;
      }
      if (t.closest('#pull')) {
        var pick = shown[Math.floor(Math.random() * shown.length)];
        if (pick) openCard(pick.id, shown);
        return;
      }
      var more = t.closest('#anti-more');
      if (more) {
        var opened = more.getAttribute('aria-expanded') !== 'true';
        $$('[data-extra]', right).forEach(function (li) { li.hidden = !opened; });
        more.setAttribute('aria-expanded', String(opened));
        more.textContent = opened ? 'Show fewer' : 'Show all ' + waiting.length;
        return;
      }
      var hit = t.closest('[data-ref]');
      if (!hit) return;
      // Previous and Next on the card walk through the group the thing was picked from.
      var from = hit.closest('#lib-items') ? shown : hit.closest('.lib-start') ? picks : hit.closest('.reading') ? desk :
        hit.closest('.lib-recent') ? recent : hit.closest('.anti') ? waiting : dropped;
      openCard(hit.getAttribute('data-ref'), from);
    }
    [left, right, plate].forEach(function (el) { el.addEventListener('click', onClick); });

    // A link straight to one thing: references.html#book-21 or #ref-film-interstellar
    function openFromHash() {
      var m = /^#(book|ref)-([\w-]+)$/.exec(location.hash);
      if (!m) return;
      var x = itemById(m[2]);
      if (!x) return;
      openCard(x.id, x.kind === state.kind && shown.indexOf(x) !== -1 ? shown : everything.filter(function (y) { return y.kind === x.kind && y.status === x.status; }));
    }
    window.addEventListener('hashchange', openFromHash);
    openFromHash();
    if (location.hash === '#antilibrary') setTimeout(function () { scrollToEl($('#antilibrary')); }, 60);
  }

  /* ============================================================
     PAGE: Back pocket
     ============================================================ */

  function sha256Hex(text) {
    if (!(window.crypto && window.crypto.subtle && window.TextEncoder)) return Promise.reject(new Error('unavailable'));
    return window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)).then(function (buf) {
      return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
    });
  }
  function groupHex(hex) { return String(hex || '').replace(/(.{8})/g, '$1 ').trim(); }
  // Line breaks and outer spaces are tidied so the same letter always gives the same fingerprint.
  function normaliseLetter(t) { return String(t || '').replace(/\r\n?/g, '\n').trim(); }

  function renderPocket() {
    var left = $('#pocket-left');
    var right = $('#pocket-right');
    if (!left || !right) return;
    var hashL = hashId().replace(/^L-?/, '');
    var selId = (letters.filter(function (l) { return String(l.id) === hashL; })[0] || letters[0] || {}).id;
    var opened = letters.filter(letterIsOpen).length;

    left.innerHTML =
      strip([['Title', 'Back pocket'], ['Sealed', String(letters.length - opened)], ['Opened', String(opened)]]) +
      '<h1 class="hand-xl">Letters to future me</h1>' +
      '<p class="lede">Each letter is sealed the day I write it, and its fingerprint goes public the same day. When it opens, you can check I didn\'t edit it.</p>' +
      '<div class="pocket-stage" id="pocket-stage"></div>' +
      '<p class="note-mono">Tap an envelope. Each one stays sealed until its date.</p>';

    var stage = $('#pocket-stage');
    var n = Math.max(1, Math.min(letters.length, 4));
    var width = n <= 3 ? 46 : 40;
    var stepX = n > 1 ? (100 - width - 4) / (n - 1) : 0;
    var tops = [26, 6, 24, 12];
    var rots = [-7, 2, 8, -3];
    var layers = [3, 1, 2, 2];

    function paintEnvelopes() {
      stage.innerHTML = letters.slice(0, 4).map(function (l, i) {
        var sel = l.id === selId;
        return '<button type="button" class="envelope" data-id="' + esc(l.id) + '" aria-pressed="' + (sel ? 'true' : 'false') + '" aria-label="' + esc('Letter ' + l.id + ', opens ' + fmt(l.opens, 'long')) + '" ' +
          'style="left:' + (2 + i * stepX).toFixed(1) + '%;top:' + tops[i] + '%;width:' + width + '%;z-index:' + (sel ? 4 : layers[i]) + ';--rot:' + rots[i] + 'deg">' +
          '<span class="envelope__flap" aria-hidden="true"></span>' +
          '<span class="envelope__date" aria-hidden="true">' + esc(fmt(l.opens)) + '</span>' +
          '<span class="envelope__seal" aria-hidden="true">V</span></button>';
      }).join('') +
      '<div class="pocket"><div class="pocket__stitch" aria-hidden="true"></div>' +
        '<button type="button" class="pocket__label" id="secret-pocket">Do not open early</button></div>';
      $('#secret-pocket').addEventListener('click', function () { findSecret('pocket'); });
    }

    function betsHtml() {
      var resolved = bets.filter(function (b) { return b.outcome === true || b.outcome === false; });
      var rows = bets.map(function (b) {
        var out = b.outcome === true ? 'Happened' : b.outcome === false ? 'Didn\'t happen' : '';
        return '<tr><td>' + rich(b.bet) + (out ? '<span class="outcome">' + out + '</span>' : '') + '</td>' +
          '<td class="num odds">' + esc(b.odds) + '%</td><td class="num when">' + esc(fmt(b.resolves, 'month')) + '</td></tr>';
      }).join('');
      var score = '';
      if (resolved.length) {
        var brier = resolved.reduce(function (s, b) { var p = (Number(b.odds) || 0) / 100; var o = b.outcome ? 1 : 0; return s + (p - o) * (p - o); }, 0) / resolved.length;
        score = 'Resolved so far: ' + resolved.length + '. My Brier score: ' + brier.toFixed(2) + ' (0 is perfect; always saying 50% scores 0.25).';
      } else {
        score = 'Resolved so far: 0. My accuracy score (a Brier score) appears here once the first bet resolves.';
      }
      return '<p class="label gap-l">Open bets</p>' +
        '<div class="table-wrap"><table class="bets"><thead><tr><th scope="col">Bet</th><th scope="col" class="num">Odds</th><th scope="col" class="num">Resolves</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
        '<p class="note-mono">' + esc(score) + '</p>';
    }

    function paintLetter() {
      var l = letters.filter(function (x) { return x.id === selId; })[0];
      if (!l) {
        right.innerHTML = '<p class="hand-m">No letters yet. Seal one in content/pocket.js.</p>' + betsHtml();
        return;
      }
      var isOpen = letterIsOpen(l);
      var days = daysUntil(l.opens);
      var due = days !== null && days <= 0 && !l.text;
      var html =
        strip([['Letter', l.id], ['Sealed', fmt(l.sealed)]]) +
        '<p class="label">' + (isOpen ? 'Opened' : 'Opens') + '</p>' +
        '<h2 class="hand-xl gap-s">' + esc(fmt(l.opens, 'long')) + '</h2>';
      if (isOpen) {
        html += '<p class="label gap-m">The letter</p><div class="letter-text">' + esc(l.text) + '</div>';
      } else if (due) {
        html += '<p class="hand-m gap-s">Due to open. Check back in a few days.</p>';
      } else if (days !== null) {
        html += '<p class="countdown"><span class="countdown__n">' + days.toLocaleString('en-GB') + '</span><span class="countdown__unit">' + (days === 1 ? 'day to go' : 'days to go') + '</span></p>';
      }
      html +=
        section('What\'s inside', l.teaser) +
        '<p class="label gap-m">Fingerprint (SHA-256)</p>' +
        '<p class="fingerprint">' + esc(groupHex(l.fingerprint)) + '</p>' +
        '<p class="bet__help">Published the day it was sealed. When the letter opens, anyone can run its text through SHA-256 and check that it matches.</p>' +
        '<details class="check-tool"><summary>Check a letter against its fingerprint</summary>' +
          '<div class="stack"><label class="field-label" for="check-text">Paste the letter\'s full text</label>' +
          '<textarea class="textarea" id="check-text" rows="4"></textarea>' +
          '<button type="button" class="btn" id="check-run">Check it</button>' +
          '<p class="check-result" id="check-result" aria-live="polite"></p></div>' +
        '</details>' +
        (!isOpen
          ? '<div class="box gap-l"><p class="label">Tell me when it opens</p>' +
            composerHtml({ id: 'notify', prepareLabel: 'Ask to be told' }) + '</div>'
          : '') +
        betsHtml() +
        foot([['Signed', 'V.S.'], ['Page', 'inside back cover']]);
      right.innerHTML = html;

      $('#check-run').addEventListener('click', function () {
        var out = $('#check-result');
        var text = normaliseLetter($('#check-text').value);
        if (!text) { out.textContent = 'Paste the letter\'s text first.'; return; }
        sha256Hex(text).then(function (hex) {
          var match = hex === String(l.fingerprint || '').toLowerCase().replace(/\s+/g, '');
          out.innerHTML = 'Fingerprint of what you pasted: <code>' + esc(groupHex(hex)) + '</code><br>' +
            (match
              ? '<strong>It matches letter ' + esc(l.id) + '.</strong> This is the text that was sealed on ' + esc(fmt(l.sealed)) + '.'
              : 'It doesn\'t match letter ' + esc(l.id) + '. Change a single character and the fingerprint changes completely.');
        }, function () {
          out.textContent = 'This browser can\'t work out fingerprints here. Try another browser.';
        });
      });
      if (!isOpen) {
        bindComposer({
          id: 'notify',
          subject: 'Tell me when letter ' + l.id + ' opens',
          body: function () { return 'Please email me when letter ' + l.id + ' opens on ' + fmt(l.opens, 'long') + '.'; }
        });
      }
    }

    stage.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('.envelope') : null;
      if (!b) return;
      selId = b.getAttribute('data-id');
      setHash('L-' + selId);
      paintEnvelopes();
      paintLetter();
      var again = $('.envelope[data-id="' + selId + '"]', stage);
      if (again) again.focus();
      if (isStacked()) scrollToEl(right);
    });
    paintEnvelopes();
    paintLetter();
  }

  /* ------------------------------------------------------------
     If a content file has a typo, say where instead of failing quietly
     ------------------------------------------------------------ */

  function showContentErrors() {
    var errs = list(NB.errors);
    if (!errs.length) return;
    var box = document.createElement('div');
    box.className = 'content-error';
    box.setAttribute('role', 'alert');
    box.innerHTML = '<strong>Content typo</strong><br>Something in ' + errs.map(esc).join(' and ') + ' couldn\'t be read. It\'s usually a missing comma, quote or bracket on or just before that line.';
    root.insertBefore(box, root.firstChild);
  }
  function showFatal(err) {
    var box = document.createElement('div');
    box.className = 'content-error';
    box.setAttribute('role', 'alert');
    box.innerHTML = '<strong>This page couldn\'t finish loading</strong><br>' + esc(err && err.message ? err.message : String(err)) + '. Check the content files for a missing comma, quote or bracket.';
    root.insertBefore(box, root.firstChild);
  }

  /* ------------------------------------------------------------
     Start
     ------------------------------------------------------------ */


  function renderNotes() {
    var left = $('#notes-left'), right = $('#notes-right');
    if (!left || !right) return;
    var entries = list(NB.notes);
    left.innerHTML = strip([['Title', 'Field notes'], ['Page', '24']]) +
      '<h1 class="hand-xl">Field notes</h1><p class="lede">Things I am learning, questions I am carrying, and thoughts that need more than a margin.</p><p class="prose gap-m">AI and building have my attention. Books, business, science, history and the rest are welcome here too. No posting schedule.</p>' +
      '<p class="label gap-l">On these pages</p><ul class="exp-list">' + entries.map(function (n) { return '<li><a class="ink-link" href="#' + esc(n.id) + '">' + esc(n.title) + '</a><p class="field__key">' + esc(n.topic + ' · ' + fmt(n.date)) + '</p></li>'; }).join('') + '</ul>' + foot([['Signed','V.S.']]);
    right.innerHTML = strip([['Title', 'Notes'], ['Page', '25']]) + entries.map(function (n) {
      return '<article class="field-entry" id="' + esc(n.id) + '"><p class="label">' + esc(n.topic + ' · ' + fmt(n.date)) + '</p><h2 class="hand-l">' + esc(n.title) + '</h2>' + list(n.paragraphs).map(function (p) { return '<p class="prose gap-m">' + rich(p) + '</p>'; }).join('') + (n.see ? '<p class="gap-m">' + xref(n.see, 'Alongside: ') + '</p>' : '') + '</article>';
    }).join('');
  }

  var RENDER = {
    notes: renderNotes,
    cover: renderCover,
    contents: renderContents,
    today: renderToday,
    hypotheses: renderHypotheses,
    experiments: renderExperiments,
    references: renderReferences,
    pocket: renderPocket
  };

  try {
    showContentErrors();
    markVisited();
    if (current !== 'cover') { renderChrome(); renderCorners(); }
    if (RENDER[current]) RENDER[current]();
    updateBadge();
    drawIn(document);
    initSwipe();
    initKeys();
    turnIn();
  } catch (err) {
    showFatal(err);
    if (window.console && console.error) console.error(err);
  }
})();
