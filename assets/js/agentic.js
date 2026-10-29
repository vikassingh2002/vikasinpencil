/* Agentic AI: a private reading app about AI, set like a weekly news magazine (curiosity.html).
   Articles: content/ai-articles.js · Saving reads and saved articles: cat-store.js
   Routes: #/ front page · #s/<section> · #a/<article> · #saved
   Only the desk's owner can read it; everyone else sees a short private notice.
   The page's code and articles are still public in the site's repository. */
(function () {
  'use strict';

  var NB = window.NB || {};
  var A = NB.aiArticles || { sections: [], articles: [] };
  var Store = window.CatStore;
  var Art = window.AgenticArt || { get: function () { return null; } };
  var menuOpen = false;
  var app = document.getElementById('cat');
  if (!app || !Store) return;

  var ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ESC[c]; }); }
  function list(x) { return Array.isArray(x) ? x : []; }
  function S() { return Store.get(); }
  function safeUrl(u) { u = String(u || ''); return /^https?:\/\/[^\s"'<>]+$/i.test(u) ? u : ''; }
  var M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  // Oct 29th 2026, as weeklies print it
  function econDate(iso) {
    var m = /^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?/.exec(String(iso || ''));
    if (!m) return '';
    if (!m[2]) return m[1];
    if (!m[3]) return M[Number(m[2]) - 1] + ' ' + m[1];
    var n = Number(m[3]);
    var th = n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th';
    return M[Number(m[2]) - 1] + ' ' + n + th + ' ' + m[1];
  }

  var articles = list(A.articles).filter(function (a) { return a && a.id && a.title; });
  function byId(id) { for (var i = 0; i < articles.length; i++) if (articles[i].id === id) return articles[i]; return null; }
  function sections() {
    var out = list(A.sections).slice();
    articles.forEach(function (a) { if (!out.some(function (s) { return s.id === a.section; })) out.push({ id: a.section, name: a.section }); });
    return out.filter(function (s) { return articles.some(function (a) { return a.section === s.id; }); });
  }
  function sectionName(id) { var s = sections().filter(function (x) { return x.id === id; })[0]; return s ? s.name : id; }
  function isRead(a) { var s = S().seen[a.id]; return !!(s && s.stage === 'done'); }

  var route = { name: 'front', id: '' };
  function parseRoute() {
    var h = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
    var p = h.split('/');
    if (p[0] === 'a' && byId(p[1])) route = { name: 'article', id: p[1] };
    else if (p[0] === 's' && sections().some(function (s) { return s.id === p[1]; })) route = { name: 'section', id: p[1] };
    else if (p[0] === 'saved') route = { name: 'saved', id: '' };
    else route = { name: 'front', id: '' }; // older links (#d/…, #curiosity/…) land on the front page
  }

  /* ---------- pieces ---------- */
  function masthead() {
    var here = route.name === 'section' ? route.id : route.name === 'article' ? (byId(route.id) || {}).section : route.name;
    return '<header class="mast"><div class="mast__top">' +
      '<button type="button" class="menu-btn" data-act="menu" aria-expanded="' + menuOpen + '" aria-controls="menu"><span class="menu-btn__icon" aria-hidden="true"></span>Menu</button>' +
      '<a class="mast__name" href="#/">Agentic AI</a>' +
      '<a class="mast__saved" href="#saved">Saved</a></div>' +
      '<nav class="tabs" aria-label="Sections">' +
        '<a href="#/"' + (route.name === 'front' ? ' aria-current="page"' : '') + '>Latest</a>' +
        sections().map(function (s) { return '<a href="#s/' + esc(s.id) + '"' + (here === s.id ? ' aria-current="page"' : '') + '>' + esc(s.name) + '</a>'; }).join('') +
        '<a href="#saved"' + (route.name === 'saved' ? ' aria-current="page"' : '') + '>Saved</a>' +
        '<a class="tabs__out" href="desk.html">Desk</a>' +
      '</nav></header>';
  }
  function menu() {
    if (!menuOpen) return '';
    return '<div class="menu" id="menu" role="dialog" aria-modal="true" aria-label="Menu"><div class="menu__panel">' +
      '<div class="menu__head"><span class="mast__name">Agentic AI</span><button type="button" class="menu__close" data-act="menu" aria-label="Close menu">×</button></div>' +
      '<a class="menu__home" href="#/">Latest</a>' +
      '<h2 class="menu__title">Sections</h2><ul class="menu__list">' + sections().map(function (s) {
        return '<li><a href="#s/' + esc(s.id) + '">' + esc(s.name) + '</a></li>';
      }).join('') + '</ul>' +
      '<h2 class="menu__title">Topics</h2><ul class="menu__list menu__list--topics">' + articles.map(function (x) {
        return '<li><a href="#a/' + esc(x.id) + '">' + esc(x.fly || x.title) + '</a></li>';
      }).join('') + '</ul>' +
      '<h2 class="menu__title">Your reading</h2><ul class="menu__list"><li><a href="#saved">Saved articles</a></li><li><a href="desk.html">Back to the desk</a></li></ul>' +
    '</div><button type="button" class="menu__shade" data-act="menu" aria-label="Close menu" tabindex="-1"></button></div>';
  }
  function footer() { return '<footer class="foot">Agentic AI · written for ' + esc(String((NB.site || {}).name || 'you').split(' ')[0]) + ' · reviewed ' + esc(econDate(A.reviewed)) + '</footer>'; }

  function teaser(a, big) {
    var pic = Art.get(a.id);
    return '<li class="story' + (big ? ' story--big' : '') + (isRead(a) ? ' is-read' : '') + '"><a href="#a/' + esc(a.id) + '">' +
      (pic ? '<span class="story__img" aria-hidden="true">' + pic.svg + '</span>' : '') +
      '<span class="fly">' + esc(a.fly || sectionName(a.section)) + '</span>' +
      '<span class="story__title">' + esc(a.title) + '</span>' +
      '<span class="story__rubric">' + esc(a.rubric) + '</span>' +
      (big ? '<span class="story__open">' + esc(list(a.body).filter(function (b) { return typeof b === 'string'; })[0] || '') + '</span>' : '') +
      '<span class="story__meta">' + esc(sectionName(a.section)) + ' · ' + (a.minutes || 3) + ' min read' + (isRead(a) ? ' · Read' : '') + '</span></a></li>';
  }

  function front() {
    var unread = articles.filter(function (a) { return !isRead(a); });
    var lead = unread[0] || articles[0];
    var rest = articles.filter(function (a) { return a !== lead; });
    var html = masthead();
    if (!lead) return html + '<p class="empty">No articles yet.</p>';
    html += '<div class="front">' +
      '<ul class="lead">' + teaser(lead, true) + '</ul>' +
      '<aside class="brief" aria-labelledby="brief-title"><h2 class="brief__title" id="brief-title">In brief</h2><ul class="brief__list">' +
        rest.slice(0, 5).map(function (a) { return '<li><a href="#a/' + esc(a.id) + '"><b>' + esc(a.title) + '.</b> ' + esc(a.rubric) + '</a></li>'; }).join('') +
      '</ul></aside></div>';
    sections().forEach(function (s) {
      var inS = rest.filter(function (a) { return a.section === s.id; });
      if (!inS.length) return;
      html += '<section aria-labelledby="sec-' + esc(s.id) + '"><h2 class="sec" id="sec-' + esc(s.id) + '"><a href="#s/' + esc(s.id) + '">' + esc(s.name) + '</a></h2><ul class="stories">' + inS.map(function (a) { return teaser(a); }).join('') + '</ul></section>';
    });
    return html;
  }

  function section() {
    var inS = articles.filter(function (a) { return a.section === route.id; });
    return masthead() + '<section class="page"><h1 class="page__title">' + esc(sectionName(route.id)) + '</h1><ul class="stories stories--one">' + inS.map(function (a) { return teaser(a); }).join('') + '</ul></section>';
  }

  function saved() {
    var ss = articles.filter(function (a) { return S().saved[a.id]; });
    return masthead() + '<section class="page"><h1 class="page__title">Saved</h1>' +
      (ss.length ? '<ul class="stories stories--one">' + ss.map(function (a) { return teaser(a); }).join('') + '</ul>' : '<p class="empty">Nothing saved yet. Use Save on any article to keep it here.</p>') + '</section>';
  }

  function article() {
    var a = byId(route.id);
    var on = !!S().saved[a.id];
    var paras = 0;
    var body = list(a.body).map(function (b) {
      if (b && typeof b === 'object') return '<h2 class="art__cross">' + esc(b.h) + '</h2>';
      var text = esc(b).replace(/ ■$/, ' <span class="fin" aria-hidden="true">■</span>');
      paras++;
      return '<p' + (paras === 1 ? ' class="art__first"' : '') + '>' + text + '</p>';
    }).join('');
    var more = articles.filter(function (x) { return x.section === a.section && x !== a; }).concat(articles.filter(function (x) { return x.section !== a.section && !isRead(x); })).slice(0, 3);
    return masthead() + '<article class="art" aria-labelledby="art-title">' +
      '<p class="art__section"><a href="#s/' + esc(a.section) + '">' + esc(sectionName(a.section)) + '</a></p>' +
      '<p class="fly">' + esc(a.fly || '') + '</p>' +
      '<h1 class="art__title" id="art-title">' + esc(a.title) + '</h1>' +
      '<p class="art__rubric">' + esc(a.rubric) + '</p>' +
      '<div class="art__bar"><p class="dateline">' + esc(econDate(a.date || A.reviewed)) + ' <span>|</span> ' + (a.minutes || 3) + ' min read</p>' +
        '<button type="button" class="save' + (on ? ' is-on' : '') + '" data-act="save" aria-pressed="' + on + '"><span aria-hidden="true">' + (on ? '★' : '☆') + '</span> ' + (on ? 'Saved' : 'Save') + '</button></div>' +
      (Art.get(a.id) ? '<figure class="art__fig">' + Art.get(a.id).svg + '<figcaption>' + esc(Art.get(a.id).caption) + '</figcaption></figure>' : '') +
      '<div class="art__body">' + body + '</div>' +
      (list(a.sources).length ? '<aside class="art__sources" aria-label="Sources"><h2>Sources</h2><ul>' + a.sources.map(function (x) {
        var u = safeUrl(x.url);
        return '<li>' + (u ? '<a href="' + esc(u) + '" target="_blank" rel="noopener">' + esc(x.title) + '</a>' : esc(x.title)) + (x.date ? ' <span>' + esc(econDate(x.date)) + '</span>' : '') + '</li>';
      }).join('') + '</ul></aside>' : '') +
      '</article>' +
      (more.length ? '<section aria-labelledby="more-title"><h2 class="sec" id="more-title">More from Agentic AI</h2><ul class="stories">' + more.map(function (x) { return teaser(x); }).join('') + '</ul></section>' : '');
  }

  function privateNotice() {
    return '<header class="mast"><span class="mast__name">Agentic AI</span></header>' +
      '<section class="page"><h1 class="page__title">This publication is private</h1>' +
      '<p class="page__lede">Agentic AI is a personal reading room. Sign in on the desk to read it.</p>' +
      '<p class="gap"><a class="btn" href="desk.html#signin">Sign in on the desk</a></p></section>';
  }

  /* ---------- drawing ---------- */
  var owner = false;
  function render() {
    if (!owner) { app.innerHTML = privateNotice(); return; }
    parseRoute();
    if (route.name === 'article') {
      Store.update(function (s) { var x = s.seen[route.id] || {}; x.stage = 'done'; x.at = Date.now(); s.seen[route.id] = x; });
    }
    var html = route.name === 'article' ? article() : route.name === 'section' ? section() : route.name === 'saved' ? saved() : front();
    app.innerHTML = html + footer() + menu();
    document.title = (route.name === 'article' ? byId(route.id).title + ' | ' : '') + 'Agentic AI';
  }
  function go() {
    render();
    window.scrollTo(0, 0);
    var h = app.querySelector('h1');
    if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
  }

  app.addEventListener('click', function (e) {
    var m = e.target.closest && e.target.closest('[data-act="menu"]');
    if (m) {
      menuOpen = !menuOpen;
      render();
      var f = app.querySelector(menuOpen ? '.menu__close' : '.menu-btn');
      if (f) f.focus();
      return;
    }
    var t = e.target.closest && e.target.closest('[data-act="save"]');
    if (!t) return;
    var id = route.id;
    var on = !S().saved[id];
    Store.update(function (s) { if (on) s.saved[id] = Date.now(); else delete s.saved[id]; });
    render();
    var b = app.querySelector('[data-act="save"]');
    if (b) b.focus();
  });
  window.addEventListener('hashchange', function () { menuOpen = false; go(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menuOpen) { menuOpen = false; render(); var b = app.querySelector('.menu-btn'); if (b) b.focus(); }
  });

  app.innerHTML = '<p class="loading">Loading…</p>';
  Store.init().then(function (mode) {
    owner = mode === 'cloud';
    go();
  });
})();
