/* Agentic AI: public magazine. Reading preferences stay in this browser, independently of Desk. */
(function () {
  'use strict';

  var NB = window.NB || {};
  var A = NB.aiArticles || { sections: [], articles: [] };
  var Store = window.AgenticStore;
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

  var allArticles = list(A.articles).filter(function (a) { return a && a.id && a.title; });
  var editions = list(A.editions).slice().sort(function(a,b){ return b.date.localeCompare(a.date); });
  var selectedEdition = A.currentEdition;
  function edition(id) { return editions.filter(function(e){ return e.id === (id || selectedEdition); })[0] || editions[0]; }
  function issueArticles(e) { return list(e && e.articleIds).map(function(id){return allArticles.filter(function(a){return a.id===id;})[0];}).filter(Boolean); }
  var articles = issueArticles(edition());
  // Every article from every edition, newest edition first, each edition in its own running order.
  var library = [];
  editions.forEach(function (e) { issueArticles(e).forEach(function (a) { if (library.indexOf(a) < 0) library.push(a); }); });
  allArticles.forEach(function (a) { if (library.indexOf(a) < 0) library.push(a); });
  library.forEach(function (a) { a.minutes = Math.max(2, Math.ceil(words(a) / 200)); });
  function inSection(id) { return library.filter(function (a) { return a.section === id; }); }
  var BLURB = {
    leaders: 'Our view on the week in artificial intelligence',
    business: 'How companies are spending on, using and making money from AI',
    markets: 'The money behind the boom: investors, valuations and bubbles',
    technology: 'How the models, chips and agents actually work',
    work: 'What AI does to jobs, skills and pay',
    science: 'AI as a tool for discovery',
    policy: 'Rules, regulators and the politics of AI'
  };
  // A week's digest is titled by its first stories, the way a daily news brief is.
  function digestTitle(e) {
    var d = list(A.briefs).filter(function (b) { return list(e.briefIds).indexOf(b.id) >= 0; });
    return 'AI in Brief: ' + d.slice(0, 2).map(function (b) { return b.headline; }).join('; ');
  }
  function byId(id) { for (var i = 0; i < allArticles.length; i++) if (allArticles[i].id === id) return allArticles[i]; return null; }
  function sections() {
    var out = list(A.sections).slice();
    library.forEach(function (a) { if (!out.some(function (s) { return s.id === a.section; })) out.push({ id: a.section, name: a.section }); });
    return out.filter(function (s) { return library.some(function (a) { return a.section === s.id; }); });
  }
  function sectionName(id) { var s = sections().filter(function (x) { return x.id === id; })[0]; return s ? s.name : id; }
  function isRead(a) { var s = S().seen[a.id]; return !!(s && s.stage === 'done'); }
  function isSaved(a) { return !!S().saved[a.id]; }
  function follows(id) { return S().prefs['follow:' + id] === 'more'; }
  function words(a) { return list(a.body).filter(function (b) { return typeof b === 'string'; }).join(' ').split(/\s+/).length; }
  function listenTime(a) { var sec = Math.round(words(a) / 2.6); return Math.floor(sec / 60) + ':' + (sec % 60 < 10 ? '0' : '') + (sec % 60); }

  var route = { name: 'today', id: '' };
  function parseRoute() {
    var h; try { h = decodeURIComponent(location.hash.replace(/^#\/?/, '')); } catch(e) { h = ''; }
    var p = h.split('/');
    if (p[0] === 'a' && byId(p[1])) { selectedEdition = byId(p[1]).editionId; articles = issueArticles(edition()); route = { name: 'article', id: p[1] }; }
    else if (p[0] === 's' && sections().some(function (s) { return s.id === p[1]; })) route = { name: 'section', id: p[1] };
    else if (['weekly','brief'].indexOf(p[0]) !== -1) { var e = edition(p[1]); selectedEdition = e.id; articles = issueArticles(e); route = {name:p[0],id:e.id}; }
    else if (p[0] === 'editions') route = {name:'editions',id:''};
    else if (['foryou','saved'].indexOf(p[0]) !== -1) route = {name:p[0],id:''};
    else { selectedEdition = A.currentEdition; articles = issueArticles(edition()); route = { name: 'today', id: '' }; } // older links (#d/…, #curiosity/…) land here
  }

  /* ---------- shared pieces ---------- */
  var menuOpen = false;
  function topbar() {
    var here = route.name === 'section' ? route.id : '';
    return '<header class="app-top"><div class="app-top__row">' +
      '<button type="button" class="icon-btn" data-act="menu" aria-label="Menu" aria-expanded="' + menuOpen + '">' + icon('menu') + '</button>' +
      '<a class="wordmark" href="#/" aria-label="Agentic AI home"><span>Agentic</span> <span>AI</span></a><nav class="desktop-links" aria-label="Your reading"><a href="#weekly">Weekly edition</a><a href="#brief">In brief</a><a href="#foryou">For you</a><a href="#saved">Saved</a></nav><span class="icon-btn icon-btn--ghost" aria-hidden="true"></span></div>' +
      '<nav class="app-tabs" aria-label="Sections"><a href="#weekly">Weekly edition</a><a href="#brief">AI in brief</a><a href="#/"' + (route.name === 'today' ? ' aria-current="page"' : '') + '>Home</a>' +
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
    return '<div class="acts"><span class="acts__left">' + (isRead(a) ? '<span class="acts__read" title="Read">' + icon('check') + '<span class="visually-hidden">Read</span></span>' : '') + '<span class="acts__meta">' + esc(econDate(a.date)) + ' · ' + (isRead(a) ? 'Read' : (a.minutes || 3) + ' min read') + '</span></span>' +
      '<span class="acts__right"><button type="button" class="icon-btn" data-act="listen-card" data-id="' + esc(a.id) + '" aria-label="Listen to ' + esc(a.title) + '">' + icon('play') + '</button>' +
      '<button type="button" class="icon-btn' + (on ? ' is-on' : '') + '" data-act="save" data-id="' + esc(a.id) + '" aria-pressed="' + on + '" aria-label="' + (on ? 'Saved' : 'Save') + '">' + icon('mark') + '</button></span></div>';
  }
  function picture(a, cls, lead) { var x = Art.get(a.id, lead ? 'lead' : 'thumbnail'); return x ? '<span class="' + cls + '" aria-hidden="true">' + x.svg + '</span>' : ''; }
  function label(a) { return '<span class="lbl">' + esc(a.fly || sectionName(a.section)) + '</span>'; }
  function block(title) { return '<h2 class="block"><span>' + esc(title) + '</span></h2>'; }

  /* a big card, a carousel card, and a list row */
  function bigCard(a, lead) {
    return '<article class="big"><a class="big__link" href="#a/' + esc(a.id) + '">' + picture(a, 'big__img', lead) + label(a) +
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
    var frontOrder = list(edition().articleIds);
    var order = frontOrder.map(byId).filter(Boolean).concat(articles.filter(function (a) { return frontOrder.indexOf(a.id) < 0; }));
    if (!order.length) return topbar() + '<p class="empty">No articles yet.</p>';
    var lead = order[0];
    var rest = order.slice(1);
    var top3 = order.slice(0, 3).map(function (x) { return x.id; }); // the digest card shows a picture not already at the top of the page
    var briefArt = byId(list(edition().chunkIds).filter(function (id) { return top3.indexOf(id) < 0; })[0]) || lead;
    var html = topbar() + '<main class="app-main"><div class="edition-line"><span>Ideas, evidence and the business of intelligence</span><span>' + esc(econDate(A.reviewed)) + '</span></div>' +
      '<div class="news-front"><div class="news-front__lead">' + bigCard(lead, true) + '</div>' +
      '<div class="news-front__middle"><ul class="rows">' + rest.slice(0, 2).map(function (a) { return '<li class="news-secondary">' + bigCard(a) + '</li>'; }).join('') + '</ul></div>' +
      '<aside class="news-front__aside news-rail"><a class="brief-card" href="#brief/' + esc(edition().id) + '">' + picture(briefArt, 'brief-card__img') + '<strong>' + esc(digestTitle(edition())) + '</strong></a>' +
        '<a class="brief-more" href="#brief/' + esc(edition().id) + '"><span aria-hidden="true">→</span> Read the rest of this week’s news analysis</a>' +
        '<h2 class="rail-title"><a href="#weekly/' + esc(edition().id) + '">Analysis <span aria-hidden="true">→</span></a></h2><ul class="rows">' + rest.slice(2, 5).map(row).join('') + '</ul></aside></div>' +
      block('AI in brief') + '<ul class="carousel brief-carousel">' + [edition().leadId].concat(list(edition().chunkIds)).map(function(id,i){var a=byId(id);return '<li class="slide"><a href="#brief/' + esc(edition().id) + '/' + i + '">' + picture(a,'slide__img') + '<span class="slide__title">' + esc(i?a.title:digestTitle(edition())) + '</span><span class="brief-card-date">' + esc(econDate(edition().date)) + '</span></a></li>';}).join('') + '</ul>' +
      block('Recent highlights') + '<ul class="carousel highlights">' + rest.slice(5, 9).map(function (a) { return slide(a); }).join('') + '</ul>';

    html += '<a class="edition-feature" href="#weekly/' + esc(edition().id) + '"><span class="edition-feature__image"><img src="' + esc('/' + edition().cover.replace(/^\/+/, '')) + '" alt="" loading="lazy"></span><span class="edition-feature__text"><span class="fly">The weekly edition · ' + esc(econDate(edition().date)) + '</span><strong>' + esc(edition().title) + '</strong><span>' + esc(edition().subtitle) + '</span><b>Read the edition →</b></span></a>';
    var earlier = editions.filter(function (e) { return e.id !== edition().id; });
    if (earlier.length) html += block('Earlier editions') + '<ul class="carousel edition-carousel">' + earlier.map(function (e) {
      return '<li class="slide slide--small"><a href="#weekly/' + esc(e.id) + '"><span class="slide__img slide__img--cover"><img src="' + esc('/' + e.cover.replace(/^\/+/, '')) + '" alt="" loading="lazy"></span><span class="lbl">' + esc(econDate(e.date)) + '</span><span class="slide__title">' + esc(e.title) + '</span></a></li>';
    }).join('') + '</ul>';
    sections().forEach(function (s) { // every article from every edition, by section, newest first
      var inS = inSection(s.id);
      html += '<section class="newspaper-section" id="home-' + esc(s.id) + '">' + block(s.name) + '<div class="section-stories">' + inS.slice(0, 3).map(function (a) { return bigCard(a); }).join('') + '</div>' + (inS.length > 3 ? '<ul class="rows section-rest">' + inS.slice(3).map(row).join('') + '</ul>' : '') +
        '<a class="section-all" href="#s/' + esc(s.id) + '">All ' + inS.length + ' articles in ' + esc(s.name) + ' →</a></section>';
    });
    return html + '<footer class="publication-foot"><a href="#/">Agentic AI</a><p>Independent analysis of artificial intelligence, business and the world it is changing.</p><nav><a href="#weekly">The edition</a><a href="#brief">AI in brief</a><a href="/assets/img/editorial/credits.md">Image credits</a><button type="button" class="install-link" data-install-agentic>Install app</button><a href="/">Vikas in Pencil</a></nav></footer></main>';
  }

  // One list per section, every edition together, newest first: label, headline, standfirst and reading time beside a picture.
  function sectionPage() {
    var s = route.id;
    var f = follows(s);
    return topbar() + '<main class="app-main sec-page"><header class="sec-page__head"><h1>' + esc(sectionName(s)) + '</h1><p class="sec-page__blurb">' + esc(BLURB[s] || '') + '</p>' +
      '<button type="button" class="follow' + (f ? ' is-on' : '') + '" data-act="follow" data-id="' + esc(s) + '" aria-pressed="' + f + '">' + icon(f ? 'check' : 'plus') + (f ? 'Following' : 'Follow') + '</button></header>' +
      '<ul class="sec-list">' + inSection(s).map(function (a) {
        return '<li class="sec-item"><a href="#a/' + esc(a.id) + '"><span class="sec-item__text"><span class="lbl">' + esc(sectionName(a.section)) + '</span>' +
          '<span class="sec-item__title">' + esc(a.title) + '</span><span class="sec-item__rubric">' + esc(a.rubric) + '</span>' +
          '<span class="sec-item__meta">' + (isRead(a) ? 'Read · ' : '') + (a.minutes || 3) + ' min read</span></span>' + picture(a, 'sec-item__img') + '</a>' + actions(a) + '</li>';
      }).join('') + '</ul></main>';
  }

  function forYou() {
    var followed = sections().filter(function (s) { return follows(s.id); });
    var picks = library.filter(function (a) { return follows(a.section); });
    return topbar() + '<main class="app-main"><header class="sec-head"><h1>For you</h1><p>' +
      (followed.length ? 'From the sections you follow: ' + esc(followed.map(function (s) { return s.name; }).join(', ')) : 'Follow a section and its articles gather here.') + '</p></header>' +
      (picks.length ? '<ul class="rows">' + picks.map(row).join('') + '</ul>' : '<ul class="follow-list">' + sections().map(function (s) {
        return '<li><a href="#s/' + esc(s.id) + '">' + esc(s.name) + '</a><button type="button" class="follow" data-act="follow" data-id="' + esc(s.id) + '" aria-pressed="false">' + icon('plus') + 'Follow</button></li>';
      }).join('') + '</ul>') + '</main>';
  }

  function savedPage() {
    var ss=allArticles.filter(isSaved), bs=Object.keys(S().saved).filter(function(id){return id.indexOf('brief:')===0;});
    return topbar() + '<main class="app-main"><header class="sec-head"><h1>Saved</h1><p>Articles and briefings you bookmarked</p></header>' +
      (ss.length?'<ul class="rows">'+ss.map(row).join('')+'</ul>':'') +
      (bs.length?'<ul class="saved-briefs">'+bs.map(function(id){var p=id.split(':'),e=edition(p[1]),i=Number(p[2]),a=i?byId(list(e.chunkIds)[i-1]):null;return '<li><a href="#brief/'+esc(e.id)+'/'+i+'"><span class="fly">AI in brief · '+esc(econDate(e.date))+'</span><strong>'+esc(a?a.title:digestTitle(e))+'</strong></a></li>';}).join('')+'</ul>':'') +
      (!ss.length&&!bs.length?'<p class="empty">Nothing saved yet. Tap the bookmark on an article or brief.</p>':'')+'</main>';
  }

  function briefContext() {
    var e = edition(route.id), raw = location.hash.split('/')[2] || '0';
    var index = /^\d+$/.test(raw) ? Number(raw) : 0;
    var ids = list(e.chunkIds), count = 1 + ids.length;
    if (index >= count) index = 0;
    var a = index ? byId(ids[index-1]) : byId(e.leadId);
    var digest = list(A.briefs).filter(function(b){return list(e.briefIds).indexOf(b.id)>=0;});
    var paras = index ? list(a.body).filter(function(b){return typeof b === 'string';}).slice(0,4) : digest.map(function(b){return b.text;});
    return {edition:e,index:index,count:count,article:a,digest:digest,paras:paras,id:'brief:' + e.id + ':' + index,title:index ? a.title : digestTitle(e)};
  }
  function briefPage() {
    var b=briefContext(), e=b.edition, a=b.article, pic=Art.get(a.id,'lead'), saved=!!S().saved[b.id];
    var body=b.index ? b.paras.map(function(p){return '<p>' + esc(p) + '</p>';}).join('') + '<p class="brief-full-link"><a href="#a/' + esc(a.id) + '">Read the full ' + esc(a.kind.toLowerCase()) + ' →</a></p>'
      : b.digest.map(function(x){var t=esc(x.text), lead=esc(x.lead || '');if(lead && t.indexOf(lead)>=0)t=t.replace(lead,'<a href="#a/' + esc(x.articleId) + '"><strong>' + lead + '</strong></a>');else t='<strong>' + esc(x.lead) + '.</strong> ' + t;return '<section class="news-brief" id="' + esc(x.id) + '"><p>' + t + ' <a class="brief-source" href="' + esc(safeUrl(x.source.url)) + '" target="_blank" rel="noopener" aria-label="Source for ' + esc(x.headline) + '">Source ↗</a></p></section>';}).join('') +
        (e.figure ? '<section class="news-brief news-figure"><p><strong>Figure of the week:</strong> ' + esc(e.figure.value) + ', ' + esc(e.figure.text) + ' <a href="#a/' + esc(e.figure.articleId) + '">' + esc(e.figure.link) + '</a></p></section>' : '');
    var speech={title:b.title,rubric:'',body:b.paras};
    return '<div class="desktop-article-header">' + topbar() + '</div><header class="art-top"><a class="icon-btn" href="#/" aria-label="Back to home">' + icon('back') + '</a><span class="art-top__right"><button type="button" class="icon-btn" data-act="size" aria-label="Text size">' + tt() + '</button><button type="button" class="icon-btn' + (saved?' is-on':'') + '" data-act="save" data-id="' + esc(b.id) + '" aria-pressed="' + saved + '" aria-label="Save this brief">' + icon('mark') + '</button><button type="button" class="icon-btn" data-act="share" aria-label="Share">' + icon('share') + '</button></span></header>' +
      '<main class="brief-reader brief-package art--size' + readSize() + '"><header><p class="fly">AI in brief</p><h1>' + esc(b.title) + '</h1></header>' +
      '<figure class="brief-figure">' + pic.svg + '<figcaption>' + esc(pic.caption) + ' <a href="' + esc(pic.creditUrl) + '" target="_blank" rel="noopener">Source ↗</a>' + (pic.licenseUrl?' <a href="'+esc(pic.licenseUrl)+'" target="_blank" rel="noopener">Licence</a>':'') + '</figcaption></figure>' +
      '<p class="brief-reader__date">' + esc(econDate(e.date)) + ' · ' + Math.max(1,Math.ceil(words(speech)/200)) + ' min read</p>' +
      '<div class="listen"><button type="button" class="listen__btn" data-act="listen" aria-pressed="'+speaking+'">' + icon(speaking?'stop':'play') + '<b>' + (speaking?'Stop':'Listen') + '</b> <span>' + listenTime(speech) + '</span></button><span class="listen__tag">DEVICE VOICE</span></div>' +
      '<div class="brief-copy">' + body + '</div><div class="brief-end"><a href="#weekly/' + esc(e.id) + '">Read the complete weekly edition →</a><span>' + (b.index+1) + ' of ' + b.count + '</span></div></main>' +
      '<nav class="brief-dots" aria-label="AI in Brief stories">' + Array.from({length:b.count},function(_,i){return '<a href="#brief/' + esc(e.id) + '/' + i + '"' + (i===b.index?' aria-current="page"':'') + ' aria-label="' + (i===0?'News digest':'Short read '+i) + '"><span></span></a>';}).join('') + '</nav>';
  }
  function editionCard(e) {
    return '<a class="edition-card" href="#weekly/' + esc(e.id) + '"><img src="' + esc('/' + e.cover.replace(/^\/+/, '')) + '" alt="Cover artwork for ' + esc(e.title) + '"><time>' + esc(econDate(e.date,true)) + '</time><h2>' + esc(e.title) + '</h2><p>' + e.articleIds.length + ' articles · ' + esc(e.coverageStart) + '–' + esc(e.coverageEnd) + '</p></a>';
  }
  function editionArchive() {
    return topbar() + '<main class="app-main"><header class="sec-head"><h1>Browse editions</h1><p>A new issue every Monday. Each edition keeps its own cover, contents and links.</p></header><div class="edition-archive">' + editions.map(editionCard).join('') + '</div><p class="edition-colophon">New editions appear here after publication. Future dates are not published issues.</p></main>';
  }
  function weekly() {
    var e = edition(route.id);
    var issue = issueArticles(e);
    return '<div class="weekly-desktop-mast">' + topbar() + '</div><header class="weekly-top"><h1>Weekly</h1><a href="#editions">Browse editions</a></header>' +
      '<nav class="weekly-tabs" aria-label="In this edition"><a href="#brief/' + esc(e.id) + '">AI this week</a>' + sections().map(function(s){return '<a href="#weekly/' + esc(e.id) + '/' + esc(s.id) + '">' + esc(s.name) + '</a>';}).join('') + '</nav>' +
      '<main class="weekly"><div class="weekly-cover-block"><a class="issue-cover" href="#a/' + esc(e.leadId) + '"><img src="' + esc('/' + e.cover.replace(/^\/+/, '')) + '" alt="Original illustration for ' + esc(e.title) + '"><span class="issue-cover__mast">Agentic<br>AI</span><span class="issue-cover__lines">' + issue.slice(1,4).map(function(a){return '<span>' + esc(a.title) + '</span>';}).join('') + '<span>' + esc(econDate(e.coverageStart,true)) + '–' + esc(econDate(e.coverageEnd,true)) + '</span></span><strong>' + esc(e.title) + '</strong></a><p class="weekly__date">' + esc(econDate(e.date,true)) + '</p><h2 class="weekly__title">' + esc(e.title) + '</h2></div>' +
      '<div class="weekly-contents"><p class="issue-intro">' + esc(e.subtitle) + '</p><p class="issue-count">' + issue.length + ' articles · A Monday publication</p>' + sections().map(function(s){return '<section id="issue-' + esc(s.id) + '">' + block(s.name) + '<ul class="rows">' + issue.filter(function(a){return a.section===s.id;}).map(row).join('') + '</ul></section>';}).join('') + '<p class="edition-colophon">' + esc(e.notes) + '</p></div></main>';
  }

  function article() {
    var a = byId(route.id);
    var on = isSaved(a);
    var pic = Art.get(a.id, 'lead');
    var chart = Art.chart ? Art.chart(a.id) : null;
    var paras = 0, charts = 0;
    var body = list(a.body).map(function (b) {
      if (b && typeof b === 'object') {
        if (b.chart) return window.AgenticCharts ? AgenticCharts.render(b.chart, null, ++charts) : ''; // charts, maps and calculators sit between paragraphs, numbered
        return '<h2 class="art__cross">' + esc(b.h) + '</h2>';
      }
      var text = esc(b).replace(/ ■$/, ' <span class="fin" aria-hidden="true">■</span>');
      paras++;
      if (paras === 1) { // the opening words in small capitals
        var m = /^(\S+(?:\s+\S+)?)(\s[\s\S]*)$/.exec(text);
        if (m) text = '<span class="smallcaps">' + m[1] + '</span>' + m[2];
      }
      return '<p>' + text + '</p>' + (paras === 2 && chart ? '<figure class="evidence-chart">' + chart.svg + '<figcaption>' + esc(chart.caption) + '</figcaption></figure>' : '');
    }).join('');
    var size = readSize();
    return '<div class="desktop-article-header">' + topbar() + '</div><header class="art-top"><a class="icon-btn" href="#/" data-act="back" aria-label="Back">' + icon('back') + '</a>' +
      '<span class="art-top__right"><button type="button" class="icon-btn" data-act="size" aria-label="Text size">' + tt() + '</button>' +
      '<button type="button" class="icon-btn' + (on ? ' is-on' : '') + '" data-act="save" data-id="' + esc(a.id) + '" aria-pressed="' + on + '" aria-label="' + (on ? 'Saved' : 'Save') + '">' + icon('mark') + '</button>' +
      '<button type="button" class="icon-btn" data-act="share" aria-label="Share">' + icon('share') + '</button></span></header>' +
      '<main class="app-main reader-layout"><article class="art art--size' + size + '" aria-labelledby="art-title">' +
        '<p class="art__kicker"><a href="#s/' + esc(a.section) + '">' + esc(sectionName(a.section)) + '</a><span>|</span>' + esc(a.fly || '') + '</p>' +
        '<h1 class="art__title" id="art-title">' + esc(a.title) + '</h1>' +
        '<p class="art__rubric">' + esc(a.rubric) + '</p>' + tools(a, on) +
        (pic ? '<figure class="art__fig">' + pic.svg + '<figcaption>' + esc(pic.caption) + '<span class="caption-description">' + esc(pic.description || '') + '</span>' + (pic.creditUrl ? ' <a href="' + esc(pic.creditUrl) + '" target="_blank" rel="noopener">Source ↗</a>' : '') + (pic.licenseUrl ? ' <a href="' + esc(pic.licenseUrl) + '" target="_blank" rel="noopener">Licence</a>' : '') + '</figcaption></figure>' : '') +
        '<p class="art__date"><time>' + esc(econDate(a.date || A.reviewed)) + '</time><span class="art__sep" aria-hidden="true">|</span>' + (a.minutes || 3) + ' min read</p>' +
        '<div class="listen"><button type="button" class="listen__btn" data-act="listen" aria-pressed="' + speaking + '">' + icon(speaking ? 'stop' : 'play') + '<b>' + (speaking ? 'Stop' : 'Listen') + '</b> <span>' + listenTime(a) + '</span></button>' +
          '<span class="listen__tag">DEVICE VOICE</span></div>' +
        '<div class="listen2"><div class="listen2__head"><b>Listen to this story</b><span class="listen__tag" title="Read aloud by your device’s own voice">DEVICE VOICE <span class="listen__i" aria-hidden="true">i</span></span></div>' +
          '<div class="player"><button type="button" class="player__btn" data-act="listen" aria-pressed="' + speaking + '" aria-label="' + (speaking ? 'Stop listening' : 'Listen to this story') + '">' + icon(speaking ? 'stop' : 'play') + '</button>' +
          '<span class="player__time"><span data-elapsed>0:00</span> / ' + listenTime(a) + '</span><span class="player__bar" aria-hidden="true"><i></i></span></div></div>' +
        '<div class="art__body">' + body + '</div>' +
        '<p class="art__note">This article appeared in the ' + esc(sectionName(a.section)) + ' section of the <a href="#weekly/' + esc(a.editionId) + '">' + esc(econDate(edition(a.editionId).date)) + ' edition</a> under the headline “' + esc(a.printHeadline || a.title) + '”</p>' +
        (list(a.sources).length ? '<details class="art__sources"><summary>Sources and reporting dates</summary><ul>' + a.sources.map(function (x) {
          var u = safeUrl(x.url);
          return '<li>' + (u ? '<a href="' + esc(u) + '" target="_blank" rel="noopener">' + esc(x.title) + '</a>' : esc(x.title)) + (x.date ? ' <span>' + esc(econDate(x.date)) + '</span>' : '') + '</li>';
        }).join('') + '</ul></details>' : '') +
        '<section class="explore"><h2>Explore more</h2><ul>' + [a.section, 'all-ai'].map(function (s) {
          var f = follows(s);
          return '<li><a href="' + (s === 'all-ai' ? '#/' : '#s/' + esc(s)) + '">' + esc(s === 'all-ai' ? 'Artificial intelligence' : sectionName(s)) + '</a><button type="button" class="follow' + (f ? ' is-on' : '') + '" data-act="follow" data-id="' + esc(s) + '" aria-pressed="' + f + '">' + icon(f ? 'check' : 'plus') + (f ? 'Following' : 'Follow') + '</button></li>';
        }).join('') + '</ul><a class="explore__latest" href="#foryou"><span aria-hidden="true">→</span> See the latest from topics you follow</a></section>' + tools(a, on, true) +
      '</article><aside class="reader-rail"><h2>More on artificial intelligence →</h2><ul class="rows">' + library.filter(function (x) { return x.id !== a.id && x.section !== a.section; }).slice(0, 4).map(row).join('') + '</ul><a class="rail-link" href="#weekly/' + esc(a.editionId) + '">Explore the complete edition →</a></aside>' + moreFrom(a) + '</main>';
  }
  function tools(a, on, end) {
    return '<div class="art-tools' + (end ? ' art-tools--end' : '') + '"><button type="button" class="tool-btn' + (on ? ' is-on' : '') + '" data-act="save" data-id="' + esc(a.id) + '" aria-pressed="' + on + '">' + icon('mark') + (on ? 'Saved' : 'Save') + '</button>' +
      '<button type="button" class="tool-btn" data-act="share">' + icon('share') + 'Share</button></div>';
  }
  // "More from" a section: a lead with a picture, two with standfirsts, three short ones; a plain list on phones.
  function moreFrom(a) {
    var pool = inSection(a.section).filter(function (x) { return x !== a; });
    if (pool.length < 3) pool = pool.concat(library.filter(function (x) { return x !== a && pool.indexOf(x) < 0; }).slice(0, 3 - pool.length));
    function item(x, kind) {
      return '<article class="mf-item mf-item--' + kind + '"><a href="#a/' + esc(x.id) + '"><span class="mf-text"><span class="lbl">' + esc(x.fly || sectionName(x.section)) + '</span><span class="mf-title">' + esc(x.title) + '</span>' +
        '<span class="mf-rubric">' + esc(x.rubric) + '</span><span class="mf-meta">' + (x.minutes || 3) + ' min read</span></span>' + picture(x, 'mf-img') + '</a>' + actions(x) + '</article>';
    }
    function col(cls, xs, kind) { return xs.length ? '<div class="mf-col mf-col--' + cls + '">' + xs.map(function (x) { return item(x, kind); }).join('') + '</div>' : ''; }
    return '<section class="more-from"><h2><a href="#s/' + esc(a.section) + '">More from ' + esc(sectionName(a.section)) + ' <span aria-hidden="true">→</span></a></h2><div class="mf-grid">' +
      col('lead', pool.slice(0, 1), 'lead') + col('mid', pool.slice(1, 3), 'mid') + col('side', pool.slice(3, 6), 'side') + '</div></section>';
  }

  function menu() {
    if (!menuOpen) return '';
    return '<div class="menu" id="menu" role="dialog" aria-modal="true" aria-label="Menu"><div class="menu__panel">' +
      '<div class="menu__head"><span class="wordmark"><span>Agentic</span> <span>AI</span></span><button type="button" class="menu__close" data-act="menu" aria-label="Close menu">×</button></div>' +
      '<h2 class="menu__title">Sections</h2><ul class="menu__list">' + sections().map(function (s) {
        return '<li><a href="#s/' + esc(s.id) + '">' + esc(s.name) + ' <span class="menu__count">' + inSection(s.id).length + '</span></a></li>';
      }).join('') + '</ul>' +
      '<h2 class="menu__title">This week’s topics</h2><ul class="menu__list menu__list--topics">' + issueArticles(edition(A.currentEdition)).map(function (x) {
        return '<li><a href="#a/' + esc(x.id) + '">' + esc(x.fly || x.title) + '</a></li>';
      }).join('') + '</ul>' +
      '<h2 class="menu__title">Editions</h2><ul class="menu__list">' + editions.map(function (e) {
        return '<li><a href="#weekly/' + esc(e.id) + '">' + esc(econDate(e.date)) + ' · ' + esc(e.title) + '</a></li>';
      }).join('') + '<li><a href="#editions">Browse all editions</a></li></ul>' +
      '<h2 class="menu__title">Your reading</h2><ul class="menu__list"><li><a href="#weekly">Weekly issue</a></li><li><a href="#foryou">For you</a></li><li><a href="#saved">Saved articles</a></li><li><a href="#brief">In brief</a></li><li><button type="button" class="install-link" data-install-agentic>Install Agentic AI</button></li></ul>' +
    '</div><button type="button" class="menu__shade" data-act="menu" aria-label="Close menu" tabindex="-1"></button></div>';
  }

  /* ---------- reading aloud, with the device's own voice ---------- */
  var speaking = false;
  function stopSpeaking() { if (window.speechSynthesis) window.speechSynthesis.cancel(); speaking = false; }
  function speak(a) {
    var synth = window.speechSynthesis;
    if (!synth || !window.SpeechSynthesisUtterance) { toast('This device can’t read aloud.'); return; }
    stopSpeaking();
    var text = [a.title + '.', a.rubric + '.'].concat(list(a.body).filter(function (b) { return typeof b === 'string' || (b && b.h); }).map(function (b) { return typeof b === 'string' ? b.replace(/ ■$/, '') : b.h + '.'; })).join('\n');
    var u = new SpeechSynthesisUtterance(text);
    var voices = synth.getVoices();
    var gb = voices.filter(function (v) { return /en-GB/i.test(v.lang); })[0] || voices.filter(function (v) { return /^en/i.test(v.lang); })[0];
    if (gb) u.voice = gb;
    u.lang = gb ? gb.lang : 'en-GB';
    u.rate = 1;
    var total = Math.round(words(a) / 2.6);
    u.onboundary = function (ev) {
      var f = Math.min(1, (ev.charIndex || 0) / text.length), s = Math.round(total * f);
      [].forEach.call(document.querySelectorAll('.player__bar i'), function (i) { i.style.width = (f * 100).toFixed(1) + '%'; });
      [].forEach.call(document.querySelectorAll('[data-elapsed]'), function (el) { el.textContent = Math.floor(s / 60) + ':' + (s % 60 < 10 ? '0' : '') + (s % 60); });
    };
    u.onend = u.onerror = function () { speaking = false; if (route.name === 'article' || route.name === 'brief') render(); };
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

  var listenNext = '';
  function render() {

    parseRoute();
    if (route.name === 'article') {
      Store.update(function (s) { var x = s.seen[route.id] || {}; x.stage = 'done'; x.at = Date.now(); s.seen[route.id] = x; });
    }
    var html = route.name === 'article' ? article() : route.name === 'section' ? sectionPage() : route.name === 'saved' ? savedPage()
      : route.name === 'weekly' ? weekly() : route.name === 'editions' ? editionArchive() : route.name === 'foryou' ? forYou() : route.name === 'brief' ? briefPage() : today();
    app.innerHTML = html + bottombar() + menu();
    document.body.classList.toggle('is-article', route.name === 'article' || route.name === 'brief');
    document.body.classList.toggle('is-brief',route.name === 'brief');
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
    var anchor = location.hash.split('/')[2];
    if (anchor && route.name === 'weekly') { var target = document.getElementById('issue-' + anchor); if(target) target.scrollIntoView({block:'start'}); }
    if (anchor && route.name === 'brief') { var target = document.getElementById(anchor); if(target) target.scrollIntoView({block:'start'}); }
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
    listen: function () { var b = route.name === 'brief' ? briefContext() : null; var a = b ? {title:b.title,rubric:'',body:b.paras} : byId(route.id); if (speaking) stopSpeaking(); else speak(a); render(); },
    'listen-card': function (t) { listenNext = t.getAttribute('data-id'); location.hash = 'a/' + listenNext; },
    size: function () { var n = readSize() % 3 + 1; setSize(n); render(); toast(['', 'Text: standard', 'Text: larger', 'Text: largest'][n]); },
    share: function () {
      var a = byId(route.id) || {title:briefContext().title,rubric:edition().title};
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
  var briefTouch=null;
  app.addEventListener('touchstart',function(e){if(route.name==='brief' && e.touches.length===1)briefTouch={x:e.touches[0].clientX,y:e.touches[0].clientY};},{passive:true});
  app.addEventListener('touchend',function(e){if(!briefTouch||route.name!=='brief')return;var dx=e.changedTouches[0].clientX-briefTouch.x,dy=e.changedTouches[0].clientY-briefTouch.y;briefTouch=null;if(Math.abs(dx)>70&&Math.abs(dx)>Math.abs(dy)*1.8){var b=briefContext(),n=b.index+(dx<0?1:-1);if(n>=0&&n<b.count)location.hash='brief/'+b.edition.id+'/'+n;}},{passive:true});
  window.addEventListener('hashchange', go);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menuOpen) { menuOpen = false; render(); var b = app.querySelector('[data-act="menu"]'); if (b) b.focus(); }
  });

  app.innerHTML = '<p class="loading">Loading…</p>';
  Store.init().then(function (mode) {
    go();
  });
})();
