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
    else if (p[0] === 'brief') route = { name: 'brief', id: '' };
    else route = { name: 'front', id: '' }; // older links (#d/…, #curiosity/…) land on the front page
  }

  /* ---------- pieces ---------- */
  // Header: the name on the left; Saved, Desk and Menu on the right. Then a full-width bar of sections.
  function masthead() {
    var here = route.name === 'section' ? route.id : route.name === 'article' ? (byId(route.id) || {}).section : route.name;
    return '<header class="hdr"><div class="hdr__top">' +
      '<a class="hdr__logo" href="#/" aria-label="Agentic AI, front page"><span>Agentic</span><span>AI</span></a>' +
      '<div class="hdr__right"><a class="pill" href="#saved">Saved</a><a class="hdr__link" href="desk.html">Desk</a>' +
      '<button type="button" class="menu-btn" data-act="menu" aria-expanded="' + menuOpen + '" aria-controls="menu"><span class="menu-btn__icon" aria-hidden="true"></span>Menu</button></div></div>' +
      '<nav class="secbar" aria-label="Sections">' +
        '<a href="#/"' + (route.name === 'front' ? ' aria-current="page"' : '') + '>Latest</a>' +
        '<a href="#brief"' + (route.name === 'brief' ? ' aria-current="page"' : '') + '>In brief</a>' +
        sections().map(function (s) { return '<a href="#s/' + esc(s.id) + '"' + (here === s.id ? ' aria-current="page"' : '') + '>' + esc(s.name) + '</a>'; }).join('') +
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

  function pic(a, cls) {
    var x = Art.get(a.id);
    return x ? '<span class="' + cls + '" aria-hidden="true">' + x.svg + '</span>' : '';
  }
  function meta(a) { return '<span class="meta">' + (a.minutes || 3) + ' min read' + (isRead(a) ? ' · Read' : '') + '</span>'; }
  function head(a, cls) {
    return '<span class="fly">' + esc(sectionName(a.section)) + '</span><span class="' + cls + '">' + esc(a.title) + '</span>';
  }

  // Three columns: the lead; two stories with pictures on the right; In brief and two columns. Then a row of four.
  function front() {
    var unread = articles.filter(function (a) { return !isRead(a); });
    var order = unread.concat(articles.filter(function (a) { return isRead(a); }));
    if (!order.length) return masthead() + '<p class="empty">No articles yet.</p>';
    var lead = order[0];
    var mid = order.slice(1, 3);
    var cols = order.slice(3, 5);
    var row = order.slice(5, 9);
    var briefPic = Art.get('brief');
    var html = masthead() + '<div class="fp">' +
      '<article class="fp__lead"><a class="card" href="#a/' + esc(lead.id) + '">' + pic(lead, 'card__img card__img--lead') +
        head(lead, 'card__title card__title--lead') + '<span class="card__rubric card__rubric--lead">' + esc(lead.rubric) + '</span>' + meta(lead) + '</a></article>' +
      '<div class="fp__mid">' + mid.map(function (a) {
        return '<article class="side"><a class="card card--side" href="#a/' + esc(a.id) + '"><span class="card__text">' + head(a, 'card__title card__title--mid') +
          '<span class="card__rubric">' + esc(a.rubric) + '</span>' + meta(a) + '</span>' + pic(a, 'card__img card__img--side') + '</a></article>';
      }).join('') + '</div>' +
      '<aside class="fp__right">' +
        '<a class="brief-card" href="#brief">' + (briefPic ? '<span class="card__img" aria-hidden="true">' + briefPic.svg + '</span>' : '') +
          '<span class="brief-card__title">In brief: ' + esc(articles.slice(0, 2).map(function (a) { return a.title; }).join('; ')) + '</span></a>' +
        '<a class="arrow-link" href="#brief"><span aria-hidden="true">→</span> Read every article in one line each</a>' +
        '<h2 class="cols__title"><a href="#s/' + esc((cols[0] || lead).section) + '">More analysis <span aria-hidden="true">→</span></a></h2>' +
        cols.map(function (a) {
          return '<a class="card card--col" href="#a/' + esc(a.id) + '"><span class="card__text">' + head(a, 'card__title card__title--col') + meta(a) + '</span>' + pic(a, 'card__img card__img--thumb') + '</a>';
        }).join('') +
      '</aside></div>';
    if (row.length) {
      html += '<ul class="fp__row">' + row.map(function (a) {
        return '<li><a class="card" href="#a/' + esc(a.id) + '">' + pic(a, 'card__img') + head(a, 'card__title card__title--row') + meta(a) + '</a></li>';
      }).join('') + '</ul>';
    }
    return html;
  }

  // Every article in a line: the headline in bold, then its rubric.
  function brief() {
    return masthead() + '<section class="page"><h1 class="page__title">In brief</h1><p class="page__lede">Every article, one line each.</p><ul class="brief__list brief__list--page">' +
      articles.map(function (a) { return '<li><a href="#a/' + esc(a.id) + '"><b>' + esc(a.title) + '.</b> ' + esc(a.rubric) + '. <span class="meta">' + esc(sectionName(a.section)) + '</span></a></li>'; }).join('') + '</ul></section>';
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
    var html = route.name === 'article' ? article() : route.name === 'section' ? section() : route.name === 'saved' ? saved() : route.name === 'brief' ? brief() : front();
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
