/* Agentic AI: a private reading app about AI, built like a news magazine's phone app (curiosity.html).
   Articles: content/ai-articles.js · Pictures: agentic-art.js · Saving reads, saved and followed: cat-store.js
   Routes: #/ Today · #s/<section> · #a/<article> · #weekly · #foryou · #saved · #brief
   Only the desk's owner can read it; everyone else sees a short private notice.
   The page's code and articles are still public in the site's repository. */
(function () {
  'use strict';

  var NB = window.NB || {};
  var A = NB.aiArticles || { sections: [], articles: [] };
  var Store = window.CatStore;
  var Art = window.AgenticArt || { get: function () { return null; } };
  var app = document.getElementById('cat');
  if (!app || !Store) return;

  var ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ESC[c]; }); }
  function list(x) { return Array.isArray(x) ? x : []; }
  function S() { return Store.get(); }
  function safeUrl(u) { u = String(u || ''); return /^https?:\/\/[^\s"'<>]+$/i.test(u) ? u : ''; }
  var M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function econDate(iso, upper) {
    var m = /^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?/.exec(String(iso || ''));
    if (!m) return '';
    var out;
    if (!m[2]) out = m[1];
    else if (!m[3]) out = M[Number(m[2]) - 1] + ' ' + m[1];
    else {
      var n = Number(m[3]);
      var th = n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th';
      out = M[Number(m[2]) - 1] + ' ' + n + th + ' ' + m[1];
    }
    return upper ? out.toUpperCase() : out;
  }

  /* icons, drawn as simple outlines */
  function icon(name) {
    var P = {
      menu: '<path d="M3 7h18M3 12h18M3 17h18"/>',
      back: '<path d="M20 12H5M11 5l-7 7 7 7"/>',
      mark: '<path d="M6 3h12v18l-6-5-6 5z"/>',
      play: '<circle cx="12" cy="12" r="9.5"/><path d="M10 8.5v7l6-3.5z" fill="currentColor"/>',
      stop: '<circle cx="12" cy="12" r="9.5"/><rect x="9" y="9" width="6" height="6" fill="currentColor"/>',
      check: '<path d="M4 12.5l5 5L20 6.5"/>',
      share: '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4"/>',
      today: '<rect x="3" y="3" width="8" height="10"/><rect x="13" y="3" width="8" height="5"/><rect x="13" y="10" width="8" height="11"/><rect x="3" y="15" width="8" height="6"/>',
      weekly: '<rect x="5" y="2.5" width="14" height="19" rx="1.5"/><path d="M9 8h6M9 12h6M9 16h6"/>',
      foryou: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 12.5l9 5 9-5M3 16.5l9 5 9-5"/>',
      plus: '<circle cx="12" cy="12" r="9.5"/><path d="M12 7.5v9M7.5 12h9"/>'
    };
    return '<svg class="ico ico--' + name + '" viewBox="0 0 24 24" aria-hidden="true">' + (P[name] || '') + '</svg>';
  }
  function tt() { return '<span class="tt" aria-hidden="true">T<small>T</small></span>'; }

  var articles = list(A.articles).filter(function (a) { return a && a.id && a.title; });
  function byId(id) { for (var i = 0; i < articles.length; i++) if (articles[i].id === id) return articles[i]; return null; }
  var BLURB = {
    business: 'How companies are spending on, using and making money from AI',
    markets: 'The money behind the boom: investors, valuations and bubbles',
    technology: 'How the models, chips and agents actually work',
    work: 'What AI does to jobs, skills and pay',
    science: 'AI as a tool for discovery',
    policy: 'Rules, regulators and the politics of AI'
  };
  function sections() {
    var out = list(A.sections).slice();
    articles.forEach(function (a) { if (!out.some(function (s) { return s.id === a.section; })) out.push({ id: a.section, name: a.section }); });
    return out.filter(function (s) { return articles.some(function (a) { return a.section === s.id; }); });
  }
  function sectionName(id) { var s = sections().filter(function (x) { return x.id === id; })[0]; return s ? s.name : id; }
  function isRead(a) { var s = S().seen[a.id]; return !!(s && s.stage === 'done'); }
  function isSaved(a) { return !!S().saved[a.id]; }
  function follows(id) { return S().prefs['follow:' + id] === 'more'; }
  function words(a) { return list(a.body).filter(function (b) { return typeof b === 'string'; }).join(' ').split(/\s+/).length; }
  function listenTime(a) { var sec = Math.round(words(a) / 2.6); return Math.floor(sec / 60) + ':' + (sec % 60 < 10 ? '0' : '') + (sec % 60); }

  var route = { name: 'today', id: '' };
  function parseRoute() {
    var h = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
    var p = h.split('/');
    if (p[0] === 'a' && byId(p[1])) route = { name: 'article', id: p[1] };
    else if (p[0] === 's' && sections().some(function (s) { return s.id === p[1]; })) route = { name: 'section', id: p[1] };
    else if (['weekly', 'foryou', 'saved', 'brief'].indexOf(p[0]) !== -1) route = { name: p[0], id: '' };
    else route = { name: 'today', id: '' }; // older links (#d/…, #curiosity/…) land here
  }

  /* ---------- shared pieces ---------- */
  var menuOpen = false;
  function topbar() {
    var here = route.name === 'section' ? route.id : '';
    return '<header class="app-top"><div class="app-top__row">' +
      '<button type="button" class="icon-btn" data-act="menu" aria-label="Menu" aria-expanded="' + menuOpen + '">' + icon('menu') + '</button>' +
      '<a class="wordmark" href="#/">Agentic AI</a><nav class="desktop-links" aria-label="Your reading"><a href="#weekly">Weekly edition</a><a href="#brief">In brief</a><a href="#foryou">For you</a><a href="#saved">Saved</a><a href="desk.html">The desk ↗</a></nav><span class="icon-btn icon-btn--ghost" aria-hidden="true"></span></div>' +
      '<nav class="app-tabs" aria-label="Sections"><a href="#/"' + (route.name === 'today' ? ' aria-current="page"' : '') + '>Home</a>' +
        sections().map(function (s) { return '<a href="#s/' + esc(s.id) + '"' + (here === s.id ? ' aria-current="page"' : '') + '>' + esc(s.name) + '</a>'; }).join('') +
      '</nav></header>';
  }
  function bottombar() {
    var items = [['today', '#/', 'Today'], ['weekly', '#weekly', 'Weekly'], ['foryou', '#foryou', 'For you'], ['mark', '#saved', 'Saved']];
    var here = route.name === 'saved' ? 'mark' : route.name === 'weekly' ? 'weekly' : route.name === 'foryou' ? 'foryou' : route.name === 'article' ? '' : 'today';
    return '<nav class="app-bottom" aria-label="Agentic AI">' + items.map(function (it) {
      return '<a href="' + it[1] + '"' + (here === it[0] ? ' aria-current="page"' : '') + '><span class="app-bottom__ico">' + icon(it[0]) + '</span>' + it[2] + '</a>';
    }).join('') + '</nav>';
  }
  function actions(a) {
    var on = isSaved(a);
    return '<div class="acts">' + (isRead(a) ? '<span class="acts__read" title="Read">' + icon('check') + '<span class="visually-hidden">Read</span></span>' : '<span class="acts__meta">' + (a.minutes || 3) + ' min read</span>') +
      '<span class="acts__right"><button type="button" class="icon-btn" data-act="listen-card" data-id="' + esc(a.id) + '" aria-label="Listen to ' + esc(a.title) + '">' + icon('play') + '</button>' +
      '<button type="button" class="icon-btn' + (on ? ' is-on' : '') + '" data-act="save" data-id="' + esc(a.id) + '" aria-pressed="' + on + '" aria-label="' + (on ? 'Saved' : 'Save') + '">' + icon('mark') + '</button></span></div>';
  }
  function picture(a, cls) { var x = Art.get(a.id, 'thumbnail'); return x ? '<span class="' + cls + '" aria-hidden="true">' + x.svg + '</span>' : ''; }
  function label(a) { return '<span class="lbl">' + esc(a.fly || sectionName(a.section)) + '</span>'; }
  function block(title) { return '<h2 class="block"><span>' + esc(title) + '</span></h2>'; }

  /* a big card, a carousel card, and a list row */
  function bigCard(a) {
    return '<article class="big"><a class="big__link" href="#a/' + esc(a.id) + '">' + picture(a, 'big__img') + label(a) +
      '<span class="big__title">' + esc(a.title) + '</span><span class="big__rubric">' + esc(a.rubric) + '</span></a>' + actions(a) + '</article>';
  }
  function slide(a, small) {
    return '<li class="slide' + (small ? ' slide--small' : '') + '"><a href="#a/' + esc(a.id) + '">' + picture(a, 'slide__img') + (small ? '' : '<span class="lbl">' + esc(sectionName(a.section)) + '</span>') +
      '<span class="slide__title">' + esc(a.title) + '</span></a>' + actions(a) + '</li>';
  }
  function row(a) {
    return '<li class="row"><a href="#a/' + esc(a.id) + '"><span class="row__text">' + label(a) + '<span class="row__title">' + esc(a.title) + '</span></span>' + picture(a, 'row__img') + '</a>' + actions(a) + '</li>';
  }

  /* ---------- pages ---------- */
  function today() {
    var order = articles.filter(function (a) { return !isRead(a); }).concat(articles.filter(isRead));
    if (!order.length) return topbar() + '<p class="empty">No articles yet.</p>';
    var lead = order[0];
    var rest = order.slice(1);
    var html = topbar() + '<main class="app-main"><div class="edition-line"><span>Ideas, evidence and the business of intelligence</span><span>' + esc(econDate(A.reviewed)) + '</span></div>' +
      '<div class="news-front"><div class="news-front__lead">' + bigCard(lead) + '</div>' +
      '<div class="news-front__middle"><ul class="rows">' + rest.slice(0, 2).map(function (a) { return '<li class="news-secondary">' + bigCard(a) + '</li>'; }).join('') + '</ul></div>' +
      '<aside class="news-front__aside"><h2 class="rail-heading">The intelligence brief</h2><p class="rail-intro">The ideas behind the headlines. Each explained in a few minutes.</p><ul class="rows">' + rest.slice(2, 5).map(row).join('') + '</ul><a class="rail-link" href="#brief">Every article in a sentence →</a></aside></div>' +
      block('Recent highlights') + '<ul class="carousel highlights">' + rest.slice(5, 9).map(function (a) { return slide(a); }).join('') + '</ul>';

    sections().forEach(function (s) {
      var inS = articles.filter(function (a) { return a.section === s.id && a !== lead; });
      if (inS.length) html += block(s.name) + '<ul class="rows">' + inS.map(row).join('') + '</ul>';
    });
    return html + '</main>';
  }

  function sectionPage() {
    var s = route.id;
    var f = follows(s);
    return topbar() + '<main class="app-main"><header class="sec-head"><h1>' + esc(sectionName(s)) + '</h1><p>' + esc(BLURB[s] || '') + '</p>' +
      '<button type="button" class="follow' + (f ? ' is-on' : '') + '" data-act="follow" data-id="' + esc(s) + '" aria-pressed="' + f + '">' + icon(f ? 'check' : 'plus') + (f ? 'Following' : 'Follow') + '</button></header>' +
      '<ul class="rows">' + articles.filter(function (a) { return a.section === s; }).map(row).join('') + '</ul></main>';
  }

  function forYou() {
    var followed = sections().filter(function (s) { return follows(s.id); });
    var picks = articles.filter(function (a) { return follows(a.section); });
    return topbar() + '<main class="app-main"><header class="sec-head"><h1>For you</h1><p>' +
      (followed.length ? 'From the sections you follow: ' + esc(followed.map(function (s) { return s.name; }).join(', ')) : 'Follow a section and its articles gather here.') + '</p></header>' +
      (picks.length ? '<ul class="rows">' + picks.map(row).join('') + '</ul>' : '<ul class="follow-list">' + sections().map(function (s) {
        return '<li><a href="#s/' + esc(s.id) + '">' + esc(s.name) + '</a><button type="button" class="follow" data-act="follow" data-id="' + esc(s.id) + '" aria-pressed="false">' + icon('plus') + 'Follow</button></li>';
      }).join('') + '</ul>') + '</main>';
  }

  function savedPage() {
    var ss = articles.filter(isSaved);
    return topbar() + '<main class="app-main"><header class="sec-head"><h1>Saved</h1><p>Articles you bookmarked</p></header>' +
      (ss.length ? '<ul class="rows">' + ss.map(row).join('') + '</ul>' : '<p class="empty">Nothing saved yet. Tap the bookmark on any article.</p>') + '</main>';
  }

  function briefPage() {
    return topbar() + '<main class="app-main"><header class="sec-head"><h1>In brief</h1><p>Every article, one line each</p></header><ul class="brief-lines">' +
      articles.map(function (a) { return '<li><a href="#a/' + esc(a.id) + '"><b>' + esc(a.title) + '.</b> ' + esc(a.rubric) + '.</a></li>'; }).join('') + '</ul></main>';
  }

  // The weekly issue: a cover made from the lead article, then its contents by section.
  function weekly() {
    var lead = articles[0];
    var pic = lead ? Art.get(lead.id) : null;
    return '<header class="weekly-top"><h1>Weekly</h1><a href="#brief">Browse articles</a></header>' +
      '<nav class="weekly-tabs" aria-label="Sections">' + sections().map(function (s) { return '<a href="#s/' + esc(s.id) + '">' + esc(s.name) + '</a>'; }).join('') + '</nav>' +
      '<main class="app-main weekly">' +
        (lead ? '<a class="cover" href="#a/' + esc(lead.id) + '"><span class="cover__mast">Agentic AI</span>' +
          '<span class="cover__lines">' + articles.slice(1, 5).map(function (a) { return '<span>' + esc(a.title) + '</span>'; }).join('') + '</span>' +
          (pic ? '<span class="cover__art" aria-hidden="true">' + pic.svg + '</span>' : '') +
          '<span class="cover__head">' + esc(lead.title) + '</span></a>' +
          '<p class="weekly__date">' + esc(econDate(A.reviewed, true)) + '</p><p class="weekly__title">' + esc(lead.title) + '</p>' : '') +
        sections().map(function (s) {
          return block(s.name) + '<ul class="rows">' + articles.filter(function (a) { return a.section === s.id; }).map(row).join('') + '</ul>';
        }).join('') +
      '</main>';
  }

  function article() {
    var a = byId(route.id);
    var on = isSaved(a);
    var pic = Art.get(a.id);
    var paras = 0;
    var body = list(a.body).map(function (b) {
      if (b && typeof b === 'object') return '<h2 class="art__cross">' + esc(b.h) + '</h2>';
      var text = esc(b).replace(/ ■$/, ' <span class="fin" aria-hidden="true">■</span>');
      paras++;
      if (paras === 1) { // the opening words in small capitals
        var m = /^(\S+(?:\s+\S+)?)(\s[\s\S]*)$/.exec(text);
        if (m) text = '<span class="smallcaps">' + m[1] + '</span>' + m[2];
      }
      return '<p>' + text + '</p>';
    }).join('');
    var more = articles.filter(function (x) { return x.section === a.section && x !== a; });
    if (more.length < 2) more = more.concat(articles.filter(function (x) { return x.section !== a.section && !isRead(x); }).slice(0, 2 - more.length));
    var size = readSize();
    return '<div class="desktop-article-header">' + topbar() + '</div><header class="art-top"><a class="icon-btn" href="#/" data-act="back" aria-label="Back">' + icon('back') + '</a>' +
      '<span class="art-top__right"><button type="button" class="icon-btn" data-act="size" aria-label="Text size">' + tt() + '</button>' +
      '<button type="button" class="icon-btn' + (on ? ' is-on' : '') + '" data-act="save" data-id="' + esc(a.id) + '" aria-pressed="' + on + '" aria-label="' + (on ? 'Saved' : 'Save') + '">' + icon('mark') + '</button>' +
      '<button type="button" class="icon-btn" data-act="share" aria-label="Share">' + icon('share') + '</button></span></header>' +
      '<main class="app-main"><article class="art art--size' + size + '" aria-labelledby="art-title">' +
        '<p class="art__kicker"><a href="#s/' + esc(a.section) + '">' + esc(sectionName(a.section)) + '</a><span>|</span>' + esc(a.fly || '') + '</p>' +
        '<h1 class="art__title" id="art-title">' + esc(a.title) + '</h1>' +
        '<p class="art__rubric">' + esc(a.rubric) + '</p>' +
        (pic ? '<figure class="art__fig">' + pic.svg + '<figcaption>' + esc(pic.caption.toUpperCase()) + '</figcaption></figure>' : '') +
        '<p class="art__date">' + esc(econDate(a.date || A.reviewed)) + ' · ' + (a.minutes || 3) + ' min read</p>' +
        '<div class="listen"><button type="button" class="listen__btn" data-act="listen" aria-pressed="' + speaking + '">' + icon(speaking ? 'stop' : 'play') + '<b>' + (speaking ? 'Stop' : 'Listen') + '</b> <span>' + listenTime(a) + '</span></button>' +
          '<span class="listen__tag">DEVICE VOICE</span></div>' +
        '<div class="art__body">' + body + '</div>' +
        '<p class="art__note">This article appears in the ' + esc(sectionName(a.section)) + ' section of Agentic AI under the headline “' + esc(a.title) + '”</p>' +
        (list(a.sources).length ? '<aside class="art__sources"><h2>Sources</h2><ul>' + a.sources.map(function (x) {
          var u = safeUrl(x.url);
          return '<li>' + (u ? '<a href="' + esc(u) + '" target="_blank" rel="noopener">' + esc(x.title) + '</a>' : esc(x.title)) + (x.date ? ' <span>' + esc(econDate(x.date)) + '</span>' : '') + '</li>';
        }).join('') + '</ul></aside>' : '') +
        '<section class="explore"><h2>Explore more</h2><ul>' + [a.section].map(function (s) {
          var f = follows(s);
          return '<li><a href="#s/' + esc(s) + '">' + esc(sectionName(s)) + '</a><button type="button" class="follow' + (f ? ' is-on' : '') + '" data-act="follow" data-id="' + esc(s) + '" aria-pressed="' + f + '">' + icon(f ? 'check' : 'plus') + (f ? 'Following' : 'Follow') + '</button></li>';
        }).join('') + '</ul></section>' +
        (more.length ? '<section class="more"><h2>More from ' + esc(sectionName(a.section)) + '</h2><ul class="rows">' + more.map(row).join('') + '</ul></section>' : '') +
      '</article></main>';
  }

  function menu() {
    if (!menuOpen) return '';
    return '<div class="menu" id="menu" role="dialog" aria-modal="true" aria-label="Menu"><div class="menu__panel">' +
      '<div class="menu__head"><span class="wordmark">Agentic AI</span><button type="button" class="menu__close" data-act="menu" aria-label="Close menu">×</button></div>' +
      '<h2 class="menu__title">Sections</h2><ul class="menu__list">' + sections().map(function (s) {
        return '<li><a href="#s/' + esc(s.id) + '">' + esc(s.name) + '</a></li>';
      }).join('') + '</ul>' +
      '<h2 class="menu__title">Topics</h2><ul class="menu__list menu__list--topics">' + articles.map(function (x) {
        return '<li><a href="#a/' + esc(x.id) + '">' + esc(x.fly || x.title) + '</a></li>';
      }).join('') + '</ul>' +
      '<h2 class="menu__title">Your reading</h2><ul class="menu__list"><li><a href="#weekly">Weekly issue</a></li><li><a href="#foryou">For you</a></li><li><a href="#saved">Saved articles</a></li><li><a href="#brief">In brief</a></li><li><a href="desk.html">Back to the desk</a></li></ul>' +
    '</div><button type="button" class="menu__shade" data-act="menu" aria-label="Close menu" tabindex="-1"></button></div>';
  }

  function privateNotice() {
    return '<header class="app-top"><div class="app-top__row"><span class="icon-btn icon-btn--ghost"></span><span class="wordmark">Agentic AI</span><span class="icon-btn icon-btn--ghost"></span></div></header>' +
      '<main class="app-main"><header class="sec-head"><h1>This publication is private</h1><p>Agentic AI is a personal reading room. Sign in on the desk to read it.</p>' +
      '<a class="follow" href="desk.html#signin">Sign in on the desk</a></header></main>';
  }

  /* ---------- reading aloud, with the device's own voice ---------- */
  var speaking = false;
  function stopSpeaking() { if (window.speechSynthesis) window.speechSynthesis.cancel(); speaking = false; }
  function speak(a) {
    var synth = window.speechSynthesis;
    if (!synth || !window.SpeechSynthesisUtterance) { toast('This device can’t read aloud.'); return; }
    stopSpeaking();
    var text = [a.title + '.', a.rubric + '.'].concat(list(a.body).map(function (b) { return typeof b === 'string' ? b.replace(/ ■$/, '') : b.h + '.'; })).join('\n');
    var u = new SpeechSynthesisUtterance(text);
    var voices = synth.getVoices();
    var gb = voices.filter(function (v) { return /en-GB/i.test(v.lang); })[0] || voices.filter(function (v) { return /^en/i.test(v.lang); })[0];
    if (gb) u.voice = gb;
    u.lang = gb ? gb.lang : 'en-GB';
    u.rate = 1;
    u.onend = u.onerror = function () { speaking = false; if (route.name === 'article') render(); };
    speaking = true;
    synth.speak(u);
  }

  /* ---------- text size, kept on this device ---------- */
  function readSize() { try { return Number(localStorage.getItem('nb.agentic.size')) || 1; } catch (e) { return 1; } }
  function setSize(n) { try { localStorage.setItem('nb.agentic.size', String(n)); } catch (e) { /* fine */ } }

  var toastTimer = null;
  function toast(text) {
    var t = document.querySelector('.toast') || document.body.appendChild(Object.assign(document.createElement('div'), { className: 'toast' }));
    t.setAttribute('role', 'status');
    t.textContent = text;
    t.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('is-on'); }, 2600);
  }

  /* ---------- drawing ---------- */
  var owner = false;
  var listenNext = '';
  function render() {
    if (!owner) { app.innerHTML = privateNotice(); return; }
    parseRoute();
    if (route.name === 'article') {
      Store.update(function (s) { var x = s.seen[route.id] || {}; x.stage = 'done'; x.at = Date.now(); s.seen[route.id] = x; });
    }
    var html = route.name === 'article' ? article() : route.name === 'section' ? sectionPage() : route.name === 'saved' ? savedPage()
      : route.name === 'weekly' ? weekly() : route.name === 'foryou' ? forYou() : route.name === 'brief' ? briefPage() : today();
    app.innerHTML = html + bottombar() + menu();
    document.body.classList.toggle('is-article', route.name === 'article');
    document.title = (route.name === 'article' ? byId(route.id).title + ' | ' : '') + 'Agentic AI';
  }
  function go() {
    if (speaking) stopSpeaking();
    menuOpen = false;
    render();
    window.scrollTo(0, 0);
    var h = app.querySelector('h1');
    if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
    if (listenNext && route.name === 'article' && route.id === listenNext) { speak(byId(listenNext)); render(); }
    listenNext = '';
  }

  var ACT = {
    menu: function () { menuOpen = !menuOpen; render(); var f = app.querySelector(menuOpen ? '.menu__close' : '[data-act="menu"]'); if (f) f.focus(); },
    save: function (t) {
      var id = t.getAttribute('data-id');
      var on = !S().saved[id];
      Store.update(function (s) { if (on) s.saved[id] = Date.now(); else delete s.saved[id]; });
      render();
      toast(on ? 'Saved' : 'Removed from saved');
    },
    follow: function (t) {
      var id = t.getAttribute('data-id');
      var on = !follows(id);
      Store.update(function (s) { if (on) s.prefs['follow:' + id] = 'more'; else delete s.prefs['follow:' + id]; });
      render();
      toast(on ? 'Following ' + sectionName(id) : 'Unfollowed');
    },
    listen: function () { var a = byId(route.id); if (speaking) stopSpeaking(); else speak(a); render(); },
    'listen-card': function (t) { listenNext = t.getAttribute('data-id'); location.hash = 'a/' + listenNext; },
    size: function () { var n = readSize() % 3 + 1; setSize(n); render(); toast(['', 'Text: standard', 'Text: larger', 'Text: largest'][n]); },
    share: function () {
      var a = byId(route.id);
      if (navigator.share) navigator.share({ title: a.title, text: a.rubric, url: location.href }).catch(function () { /* cancelled */ });
      else if (navigator.clipboard) navigator.clipboard.writeText(location.href).then(function () { toast('Link copied'); });
    },
    back: function () { if (history.length > 1) history.back(); else location.hash = '/'; }
  };
  app.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-act]');
    if (!t || !ACT[t.getAttribute('data-act')]) return;
    e.preventDefault();
    ACT[t.getAttribute('data-act')](t);
  });
  window.addEventListener('hashchange', go);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menuOpen) { menuOpen = false; render(); var b = app.querySelector('[data-act="menu"]'); if (b) b.focus(); }
  });

  app.innerHTML = '<p class="loading">Loading…</p>';
  Store.init().then(function (mode) {
    owner = mode === 'cloud';
    go();
  });
})();
