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
    var map = { today: 'today.html', hypotheses: 'hypotheses.html', experiments: 'experiments.html', references: 'references.html', pocket: 'pocket.html', errata: 'contents.html#errata', contents: 'contents.html' };
    return map[r.toLowerCase()] || null;
  }
  function refLabel(ref) {
    var r = String(ref);
    if (/^[HE]-\d+$/i.test(r)) return r.toUpperCase();
    var names = { today: 'p. 01', hypotheses: 'p. 04', experiments: 'p. 12', references: 'p. 30', pocket: 'back pocket', errata: 'errata', contents: 'contents' };
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
    { key: 'pocket', href: 'pocket.html', label: 'Back pocket' }
  ];
  var TABS = [PAGES[1], PAGES[2], PAGES[3], PAGES[4], PAGES[5], { key: 'errata', href: 'contents.html#errata', label: 'Errata' }, PAGES[6]];
  var SECTIONS = ['contents', 'today', 'hypotheses', 'experiments', 'references', 'pocket'];

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
      if (t.closest && t.closest('input, textarea, select, button, summary, .tabs, .table-wrap, .shelf, .pocket-stage')) { tracking = false; return; }
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
      (site.linkedin ? '<a class="ink-link" href="' + esc(site.linkedin) + '" target="_blank" rel="noopener">LinkedIn</a>' : '<span>[LinkedIn link]</span>');

    var cv = site.cvFile
      ? '<a class="btn" href="' + esc(site.cvFile) + '" target="_blank" rel="noopener">Read my CV (PDF)</a>'
      : '<span class="placeholder-chip">[CV goes here]</span>';
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
      '<div class="rules"><p class="label">House rules</p><ol class="rules__list">' + rules +
        '<li class="rules__secret"><button type="button" class="rule-secret" id="secret-rule" aria-label="Rule four, not written yet">?</button></li>' +
      '</ol></div>';

    var openH = hyps.filter(isOpenH).length;
    var retired = hyps.length - openH;
    var running = exps.filter(function (x) { return x.status === 'running'; }).length;
    var concluded = exps.length - running;
    var sealed = letters.filter(function (l) { return !letterIsOpen(l); }).length;
    var rows = [
      { href: 'today.html', title: 'Today', desc: 'What I\'m working on this month' + (today.date ? ', updated ' + fmt(today.date, 'short') : ''), pn: 'p. 01' },
      { href: 'hypotheses.html', title: 'Hypotheses', desc: plural(openH, 'open', 'open') + ', ' + plural(retired, 'retired', 'retired'), pn: 'p. 04' },
      { href: 'experiments.html', title: 'Experiments', desc: plural(running, 'running', 'running') + ', ' + plural(concluded, 'concluded', 'concluded'), pn: 'p. 12' },
      { href: 'references.html', title: 'References', desc: 'Reading now, finished, and the antilibrary', pn: 'p. 30' },
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
        ? '<div class="question-box"><p class="label">This month\'s question</p><p class="question">' + rich(today.question) + '</p>' +
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
      (since ? '<p class="label gap-l">Since last month</p><ul class="since">' + since + '</ul>' : '') +
      foot([['Signed', 'V.S.'], ['Next update', fmt(today.nextUpdate)]]);

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

  function renderExperiments() {
    var left = $('#exp-left');
    var right = $('#exp-right');
    if (!left || !right) return;
    var selId = firstSelection(exps, function (x) { return x.status === 'running'; });

    function writeup(x) {
      var running = x.status === 'running';
      var obs = list(x.observations).map(function (o) {
        var when = (o.label ? esc(o.label) : '') + (o.date ? (o.label ? ' · ' : '') + esc(fmt(o.date, 'short')) : '');
        return '<li><span class="obs__when">' + when + '</span><span class="obs__text' + (o.pending ? ' obs__text--pending' : '') + '">' + rich(o.text) + '</span></li>';
      }).join('');
      return strip([['Experiment', x.id], [running ? 'Started' : 'Concluded', fmt(running ? x.started : (x.concluded || ''))], ['Page', x.page || '']]) +
        '<h1 class="hand-xl">' + rich(x.title) + '</h1>' +
        '<p class="chip' + (running ? ' chip--live' : '') + '">' + (running ? '<span class="chip__dot" aria-hidden="true"></span>Running' + (x.progress ? ' · ' + esc(x.progress) : '') : 'Concluded') + '</p>' +
        (x.redactedNote ? '<p class="redacted-note">' + rich(x.redactedNote) + '</p>' : '') +
        section('Question', x.question) +
        section('Hypothesis', x.hypothesis) +
        section('Method', x.method) +
        (obs ? '<p class="label gap-m">Observations</p><ol class="obs">' + obs + '</ol>' : '') +
        section(running ? 'So far' : 'What I found', x.summary) +
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
        section('Result', x.result) +
        section('Next', x.next) +
        (running || x.method ? witnessHtml(x) : '') +
        '<p class="label gap-l">All experiments</p><ul class="exp-list">' + exps.map(function (e) {
          var plainTitle = String(e.title || '').replace(/\[\[hidden\]\]/g, 'redacted');
          return '<li><button type="button" class="exp-row" data-id="' + esc(e.id) + '" aria-pressed="' + (e.id === x.id ? 'true' : 'false') + '" aria-label="' + esc(e.id + ': ' + plainTitle + '. ' + (e.status === 'running' ? 'Running' : 'Concluded')) + '">' +
            '<span class="exp-row__id">' + esc(e.id) + '</span><span class="exp-row__title">' + rich(e.title) + '</span><span class="exp-row__status">' + (e.status === 'running' ? 'Running' : 'Concluded') + '</span></button></li>';
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
     PAGE: References
     ============================================================ */

  function renderReferences() {
    var left = $('#ref-left');
    var right = $('#ref-right');
    if (!left || !right) return;
    var finished = list(refs.finished);
    var count = typeof refs.finishedCount === 'number' ? refs.finishedCount : finished.length;
    var spineCount = finished.length ? Math.min(finished.length, 40) : 22;
    var spines = '';
    for (var i = 0; i < spineCount; i++) {
      if (i === 5) spines += '<button type="button" class="spine spine--secret" id="secret-spine" style="height:146px;width:22px" aria-label="A book sticking out of the shelf"></button>';
      var h = 96 + ((i * 37) % 40);
      var w = 16 + ((i * 7) % 10);
      var b = finished[i];
      spines += '<span class="spine" data-i="' + i + '" style="height:' + h + 'px;width:' + (b ? Math.max(w, 20) : w) + 'px;background:var(--book-' + ((i * 5) % 8 + 1) + ')"' + (b ? ' title="' + esc(b.title) + '"' : '') + '></span>';
    }

    var reading = list(refs.readingNow).map(function (r) {
      var pct = Math.max(0, Math.min(100, Number(r.progress) || 0));
      return '<div class="reading-card"><div class="reading-card__book" aria-hidden="true"></div><div class="reading-card__body">' +
        '<p class="reading-card__title">' + rich(r.title) + '</p>' +
        (r.author ? '<p class="reading-card__author">' + rich(r.author) + '</p>' : '') +
        (r.why ? '<p class="reading-card__why">' + rich(r.why) + '</p>' : '') +
        '<div class="reading-card__progress" role="img" aria-label="' + pct + '% read"><span style="width:' + pct + '%"></span></div>' +
        '</div></div>';
    }).join('');

    left.innerHTML =
      strip([['Title', 'References'], ['Page', '30']]) +
      '<h1 class="hand-xl">References</h1>' +
      (reading ? '<p class="label gap-l">Reading now</p><div class="reading">' + reading + '</div>' : '') +
      '<p class="label gap-l">Finished</p>' +
      '<div class="shelf" id="shelf">' + spines + '</div>' +
      '<div class="actions"><button type="button" class="btn btn--line" id="pull">Pull one off the shelf</button>' +
        '<span class="progress__text">' + (count ? plural(count, 'book', 'books') + ' so far' : '[N] books so far') + '</span></div>' +
      '<p class="shelf-note" id="shelf-note" aria-live="polite" hidden></p>' +
      '<p class="lede gap-m">Every finished book gets one line: what it changed in how I think, or why it didn\'t.</p>';

    var anti = list(refs.antilibrary).map(function (a, i) {
      return '<li><span class="anti__box" style="--r:' + [-3, 2, -1, 3][i % 4] + 'deg" aria-hidden="true"></span><div>' +
        '<p class="anti__title">' + rich(a.title) + '</p>' +
        (a.author ? '<p class="anti__author">' + rich(a.author) + '</p>' : '') +
        (a.why ? '<p class="anti__why">' + rich(a.why) + '</p>' : '') +
        '</div></li>';
    }).join('');

    right.innerHTML =
      strip([['Title', 'Antilibrary'], ['Page', '31']]) +
      '<h2 class="hand-xl">The antilibrary</h2>' +
      '<p class="lede">Books I haven\'t read yet, and why each one is here. They say more about where I\'m going than the ones I\'ve finished.</p>' +
      '<ul class="anti">' + anti + '</ul>' +
      '<div class="box box--dashed gap-l"><p class="label">Lend me a book</p>' +
        composerHtml({
          id: 'lend',
          prepareLabel: 'Add it to the queue',
          againLabel: 'Suggest another',
          fields: [
            { name: 'title', type: 'text', label: 'Title' },
            { name: 'why', type: 'textarea', hand: true, rows: 2, label: 'Why should I read it?' }
          ]
        }) +
      '</div>' +
      '<p class="footnote">“Antilibrary”: Nassim Taleb\'s word for a library of unread books, after Umberto Eco\'s.</p>' +
      foot([['Signed', 'V.S.'], ['Queue', 'open to suggestions']]);

    bindComposer({
      id: 'lend',
      subject: function (v) { return 'A book for your antilibrary' + (v.title ? ': ' + v.title : ''); },
      body: function (v) { return 'Title: ' + (v.title || '') + '\n\nWhy: ' + (v.why || ''); }
    });

    var pulled = -1;
    $('#pull').addEventListener('click', function () {
      var spinesEls = $$('.spine[data-i]', left);
      if (!spinesEls.length) return;
      var n = Math.floor(Math.random() * spinesEls.length);
      if (n === pulled && spinesEls.length > 1) n = (n + 3) % spinesEls.length;
      pulled = n;
      spinesEls.forEach(function (el) { el.classList.remove('is-pulled'); });
      spinesEls[n].classList.add('is-pulled');
      var b = finished[n];
      var note = $('#shelf-note');
      note.hidden = false;
      note.innerHTML = b
        ? rich(b.title) + (b.author ? ', ' + rich(b.author) : '') + (b.line ? ': “' + rich(b.line) + '”' : '')
        : 'Book ' + (n + 1) + ': [title], “[your one-line review]”';
    });
    var secret = $('#secret-spine');
    if (secret) secret.addEventListener('click', function () { findSecret('spine'); });
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

  var RENDER = {
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
