/* vikasinpencil.com: four sheets (Home, Now, Work, Library) drawn from content/*.js.
   Each page's drawing is sketched the first time a visitor opens it, then shown finished. */
(function () {
  'use strict';
  var NB = window.NB || {}, S = NB.site || {}, T = NB.today || {}, W = NB.work || { projects: [], journey: [], next: [], notes: {} };
  var X = NB.experiments || [], N = NB.notes || [];
  var G = (NB.goodreads || {}).books || [], SH = NB.shelves || {}, R = NB.references || {}, M = NB.media || {};
  var page = document.body.getAttribute('data-page') || 'home';
  var SHEETS = [['home', 'Home', '/'], ['now', 'Now', '/now.html'], ['work', 'Work', '/work.html'], ['library', 'Library', '/library.html']];
  var idx = Math.max(0, SHEETS.map(function (s) { return s[0]; }).indexOf(page));

  var ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ESC[c]; }); }
  function md(s) { return esc(s).replace(/\*([^*]+)\*/g, '<em>$1</em>').replace(/~~([^~]+)~~/g, '<s>$1</s>'); }
  function paras(s) { return String(s || '').split(/\n\s*\n|\n/).filter(function (p) { return p.trim(); }).map(function (p) { return '<p>' + md(p.trim()) + '</p>'; }).join(''); }
  var MON = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ');
  function fmt(d) { if (!d) return ''; var p = String(d).split('-'); return p.length < 3 ? d : MON[+p[1] - 1] + ' ' + (+p[2]) + ', ' + p[0]; }
  function month(d) { var p = String(d || '').split('-'); return p.length < 2 ? (d || '') : MON[+p[1] - 1] + ' ' + p[0]; }
  function short(d) { var p = String(d).split('-'); return p.length < 3 ? d : MON[+p[1] - 1] + ' ' + (+p[2]); }
  function stars(n) { return n ? '<span class="stars" aria-label="' + n + ' out of 5 stars">' + '★'.repeat(n) + '<i>' + '★'.repeat(5 - n) + '</i></span>' : ''; }

  // Freshness: the newest dated entry, and how many dated entries there are (the revision number).
  var dates = [T.date].concat((T.log || []).map(function (l) { return l.date; }), N.map(function (n) { return n.date; })).filter(Boolean).sort();
  var updated = dates[dates.length - 1], rev = dates.length;
  var started = (T.log || []).map(function (l) { return l.date; }).sort()[0] || '2026-10-21';
  var day = Math.max(1, Math.floor((Date.now() - new Date(started + 'T00:00:00').getTime()) / 864e5) + 1);

  var drawn = {};
  try { drawn = JSON.parse(localStorage.getItem('vip-drawn') || '{}') || {}; } catch (e) {}
  function markDrawn(k) { drawn[k] = 1; try { localStorage.setItem('vip-drawn', JSON.stringify(drawn)); } catch (e) {} }

  /* ---------- shared chrome ---------- */
  var ICON = {
    home: '<path d="M4 11.5 12 5l8 6.5V20h-5v-5.5H9V20H4z"/>',
    now: '<circle cx="12" cy="12" r="8"/><path d="M12 7.5V12l3 2"/>',
    work: '<path d="M4 20h16M6 20l2-12h8l2 12"/><path d="M15 3l-5 13"/>',
    library: '<path d="M4 5.5h6a2 2 0 0 1 2 2V20a2 2 0 0 0-2-2H4zM20 5.5h-6a2 2 0 0 0-2 2V20a2 2 0 0 1 2-2h6z"/>'
  };
  function squiggle() { return '<svg class="squiggle" viewBox="0 0 100 8" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M2 5 C 22 2, 48 7, 70 4 S 92 3, 98 4"/></svg>'; }
  var header = '<header class="top"><div class="wrap"><a class="brand" href="/" data-sheet>Vikas <i>in</i> Pencil</a><nav class="main" aria-label="Main">' +
    SHEETS.slice(1).map(function (s) { return '<a href="' + s[2] + '" data-sheet' + (s[0] === page ? ' aria-current="page"' : '') + '>' + s[1] + (s[0] === page ? squiggle() : '') + '</a>'; }).join('') + '</nav></div></header>';
  var tabbar = '<nav class="tabbar" aria-label="Sections">' + SHEETS.map(function (s) {
    return '<a href="' + s[2] + '" data-sheet' + (s[0] === page ? ' aria-current="page"' : '') + '><svg viewBox="0 0 24 24" aria-hidden="true">' + ICON[s[0]] + '</svg><span>' + s[1] + '</span></a>';
  }).join('') + '</nav>';
  // One quiet line: who drew it, the revision, and how to get in touch. #about is where brief.html forwards.
  var footer = '<footer class="titleblock" id="about"><div class="wrap">' +
    (page === 'home' ? '<p class="tb-brief">' + esc(S.briefLine) + '</p>' : '') +
    '<p class="tb-line"><span>Drawn by ' + esc(S.name || 'Vikas Singh') + '</span><span>Sheet ' + String(idx + 1).padStart(2, '0') + ' of ' + String(SHEETS.length).padStart(2, '0') + ' · Rev ' + rev + ' · ' + fmt(updated) + '</span>' +
    '<span><a href="mailto:' + esc(S.email) + '">' + esc(S.email) + '</a> · <a href="' + esc(S.linkedin) + '" rel="noopener">LinkedIn</a></span></p></div></footer>';

  /* ---------- pieces ---------- */
  function sheetHead(no, title, lede, drawing) {
    return '<section class="sheet-head"><div class="sh-text"><div class="eyebrow">Sheet ' + no + '</div><h1>' + title + '</h1>' + (lede ? '<p class="lede">' + lede + '</p>' : '') + '</div>' +
      '<div class="sh-art">' + Sketch.svg(drawing, '0 0 360 280', 'hero', '') + '</div></section>';
  }
  function block(title, more, body, id) {
    return '<section class="block"' + (id ? ' id="' + id + '"' : '') + '><div class="block-head"><h2>' + title + '</h2>' + (more ? '<a href="' + more[0] + '" data-sheet>' + more[1] + ' →</a>' : '') + '</div>' + body + '</section>';
  }
  // A note as a fold-out: its title, then the full text.
  function noteFold(id) {
    var n = N.filter(function (x) { return x.id === id; })[0];
    if (!n) return '';
    return '<details class="note-fold" id="' + esc(n.id) + '"><summary><span class="nf-title">' + esc(n.title) + '</span><span class="nf-date">' + fmt(n.date) + '</span></summary>' +
      (n.paragraphs || []).map(function (p) { return '<p>' + md(p) + '</p>'; }).join('') + '</details>';
  }
  function steps(x) { var s = x.steps || [], d = s.filter(function (y) { return y.state === 'done'; }).length; return { done: d, total: s.length }; }
  function expStatus(x) { var st = steps(x); return x.status === 'done' ? 'live' : x.status === 'active' || st.done ? 'building' : 'idea'; }
  var LABEL = { live: 'Live', building: 'Building', idea: 'On the drawing board' };
  var allProjects = W.projects.concat(X.map(function (x) {
    var st = steps(x), drawing = /satellite/i.test(x.title) ? 'satellite' : /sustainab|report/i.test(x.title) ? 'report' : /propert|price/i.test(x.title) ? 'house' : 'flow';
    return { id: x.id, status: expStatus(x), title: x.title, kind: 'Experiment ' + x.id, text: x.summary || x.question, drawing: drawing, steps: x.steps || [], st: st, exp: x };
  }));
  function progressOf(p) { return p.status === 'live' ? 1 : p.st && p.st.total ? p.st.done / p.st.total : 0; }
  function projCard(p, full) {
    var pct = Math.round(progressOf(p) * 100);
    var stepTxt = p.st ? p.st.done + ' of ' + p.st.total + ' steps done' : p.kind;
    var h = '<article class="card proj is-' + p.status + (full ? '' : ' compact') + '" id="' + esc(p.id) + '" data-status="' + p.status + '">' +
      '<div class="proj-art">' + Sketch.svg(p.drawing, '0 0 160 110', 'mini', '') + '</div>' +
      '<div class="proj-body"><span class="status s-' + p.status + '">' + LABEL[p.status] + '</span><h3>' + (p.link ? '<a href="' + esc(p.link) + '">' + esc(p.title) + '</a>' : esc(p.title)) + '</h3>' +
      '<p>' + md(p.text) + '</p>';
    if (!full) return h + '</div></article>';
    if (p.status !== 'live') h += '<div class="hatch" role="img" aria-label="' + pct + '% done"><span style="width:' + pct + '%"></span></div><div class="meta"><span>' + esc(stepTxt) + '</span><span>' + pct + '%</span></div>';
    if (p.steps && p.steps.length) h += '<ol class="steps">' + p.steps.map(function (s) { return '<li class="st-' + esc(s.state) + '"><span>' + esc(s.when) + '</span>' + esc(s.name) + '</li>'; }).join('') + '</ol>';
    if (p.exp) {
      var x = p.exp;
      h += '<details><summary>The plan in detail</summary>' + [['Question', x.question], ['Hypothesis', x.hypothesis], ['Method', x.method], ['What a result looks like', x.result], ['Next step', x.next], ['Tools', x.tools]]
        .filter(function (r) { return r[1]; }).map(function (r) { return '<h4>' + r[0] + '</h4><p>' + md(r[1]) + '</p>'; }).join('') + '</details>';
      var why = ((W.notes || {})[p.id] || []);
      if (why.length) h += '<div class="why"><div class="label">Why I am building this</div>' + why.map(noteFold).join('') + '</div>';
    }
    if (p.link) h += '<a class="go" href="' + esc(p.link) + '">Open ' + esc(p.title) + ' →</a>';
    return h + '</div></article>';
  }

  /* ---------- library items ---------- */
  var RN = R.notes || {};
  var hidden = {}; Object.keys(RN).forEach(function (k) { if (RN[k].hide) hidden[k] = 1; });
  G = G.filter(function (b) { return !hidden[b.id]; }).map(function (b) {
    var n = RN[b.id] || {};
    return Object.assign({}, b, n.title ? { title: n.title } : {}, n.subtitle != null ? { subtitle: n.subtitle } : {}, n.author ? { author: n.author } : {},
      { review: n.review && n.was === b.review ? n.review : b.review, line: n.line || '', why: n.why || '' });
  });
  var reading = G.filter(function (b) { return b.shelf === 'currently-reading'; });
  var read = G.filter(function (b) { return b.shelf === 'read'; }).sort(function (a, b) { return (b.read || b.added || '').localeCompare(a.read || a.added || ''); });
  var toRead = G.filter(function (b) { return b.shelf === 'to-read'; }).sort(function (a, b) { return (b.added || '').localeCompare(a.added || ''); });
  var featured = X.filter(function (x) { return x.featured; })[0] || X[0];

  var TYPES = [['article', 'Articles', 'Article'], ['video', 'Videos', 'Video'], ['film', 'Films', 'Film'], ['podcast', 'Podcasts', 'Podcast'], ['picture', 'Pictures', 'Picture']];
  var typeName = {}; TYPES.forEach(function (t) { typeName[t[0]] = t[2]; });
  function hashLink(s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }
  var things = (R.log || []).filter(function (r) { return typeName[r.type]; }).map(function (r) {
    var m = (r.link && M[r.link]) || {}, isImg = r.link && /\.(jpe?g|png|webp|gif)(\?|$)/i.test(r.link);
    var host = ''; try { host = r.link ? new URL(r.link).hostname.replace(/^www\./, '') : ''; } catch (e) {}
    return { key: 'm-' + hashLink(r.link || r.title || ''), type: r.type, title: r.title || m.title || host || 'Untitled', by: r.by || m.by || (r.type === 'article' || r.type === 'picture' ? m.source || host : ''),
      image: r.image || (m.image ? '/' + m.image : '') || (isImg ? r.link : ''), date: r.date || m.date || m.year || '', rating: r.rating || 0,
      note: r.note || '', line: r.line || '', why: r.why || '', status: r.status || 'done', link: r.link || '' };
  });
  var GROUPS = [['fantasy', 'Fantasy', ['fantasy', 'paranormal', 'myth']], ['fiction', 'Fiction', ['scifi', 'horror', 'thriller', 'literary', 'classics', 'comingofage', 'romance']],
    ['science', 'Science & tech', ['science', 'tech']], ['money', 'Business & money', ['money']], ['history', 'History', ['history', 'war', 'lives']], ['ideas', 'Ideas', ['mind', 'philosophy', 'craft']]];
  function groupOf(b) { var g = (SH.books || {})[b.id] || []; return GROUPS.filter(function (x) { return g.some(function (k) { return x[2].indexOf(k) >= 0; }); }).map(function (x) { return x[0]; }).join(' '); }
  function bookTile(b, lazy) {
    return '<a class="book" href="#b-' + esc(b.id) + '" data-item="b-' + esc(b.id) + '" data-group="' + groupOf(b) + '" data-q="' + esc((b.title + ' ' + b.author + ' ' + (b.series || '')).toLowerCase()) + '">' +
      '<img src="/' + esc(b.cover) + '" alt="" ' + (lazy ? 'loading="lazy" ' : '') + 'width="120" height="180">' +
      '<span class="bt">' + esc(b.title) + '</span><span class="ba">' + esc(b.author) + '</span>' + (b.rating ? stars(b.rating) : '') + (b.review ? '<span class="has-review">Review</span>' : '') + '</a>';
  }
  function thingTile(t) {
    return '<a class="thing t-' + t.type + '" href="#' + t.key + '" data-item="' + t.key + '" data-type="' + t.type + '" data-q="' + esc((t.title + ' ' + t.by).toLowerCase()) + '">' +
      '<span class="th-img">' + (t.image ? '<img src="' + esc(t.image) + '" alt="" loading="lazy">' : '<span class="th-ph">' + esc(typeName[t.type]) + '</span>') + '</span>' +
      '<span class="th-type">' + esc(typeName[t.type]) + '</span><span class="bt">' + esc(t.title) + '</span><span class="ba">' + esc([t.by, String(t.date || '').slice(0, 4)].filter(Boolean).join(' · ')) + '</span>' + stars(t.rating) + '</a>';
  }

  /* ---------- pages ---------- */
  var main = '';
  if (page === 'home') {
    var cur = reading[0], fst = featured ? steps(featured) : null;
    main = '<section class="hero"><div class="hero-text"><span class="pill"><b></b>Day ' + day + ' of a year of building · updated ' + short(updated) + '</span>' +
      '<h1>I sketch ideas, then <em>build them</em>.</h1><p class="lede">' + esc((S.coverLines || []).join(' ')) + '</p>' +
      '<div class="cta"><a class="btn dark" href="/work.html" data-sheet>See the work</a><a class="btn" href="/library.html" data-sheet>The library</a></div></div>' +
      '<div class="hero-art">' + Sketch.svg('home', '0 0 360 280', 'hero', 'A line drawing of a workbench with a lamp and a half-drawn part') + '</div></section>' +
      block('Right now', ['/now.html', 'Now'], '<div class="grid3">' +
        '<a class="card" href="/now.html" data-sheet><div class="label">Learning</div><h3>' + esc(((T.currently || [])[0] || {}).text) + '</h3></a>' +
        (featured ? '<a class="card" href="/work.html#' + esc(featured.id) + '" data-sheet><div class="label">Building</div><h3>' + esc(featured.title) + '</h3><div class="hatch"><span style="width:' + (fst.total ? Math.round(fst.done / fst.total * 100) : 0) + '%"></span></div><div class="meta"><span>' + (expStatus(featured) === 'idea' ? 'On the drawing board' : 'Building') + '</span><span>' + fst.done + ' of ' + fst.total + ' steps</span></div></a>' : '') +
        (cur ? '<a class="card book-card" href="/library.html#b-' + esc(cur.id) + '" data-sheet><img src="/' + esc(cur.cover) + '" alt="" width="58" height="87"><div><div class="label">Reading</div><h3>' + esc(cur.title) + '</h3><p>' + esc(cur.author) + '</p></div></a>' : '') + '</div>') +
      block('The journey so far', null, '<ol class="journey">' + W.journey.map(function (j) { return '<li class="stop st-' + j.state + '"><span class="when">' + esc(j.when) + '</span><h3>' + esc(j.title) + '</h3><p>' + esc(j.text) + '</p></li>'; }).join('') + '</ol>') +
      block('What I have made', ['/work.html', 'Work'], '<div class="grid3">' + allProjects.filter(function (p) { return p.status === 'live'; }).slice(0, 3).map(function (p) { return projCard(p, false); }).join('') + '</div>') +
      block('What is next', null, '<div class="grid3">' + W.next.map(function (n) { return '<div class="card plan"><div class="label">' + esc(n.when) + '</div><h3>' + esc(n.text) + '</h3></div>'; }).join('') + '</div>', 'next');
  } else if (page === 'now') {
    var around = ((T.sketch || {}).around || []), n = around.length || 1;
    var route = '<svg class="sk route" viewBox="0 0 640 150" role="img" aria-label="Learning route: ' + esc(around.map(function (a) { return a.label + (a.state === 'now' ? ' (now)' : ''); }).join(', ')) + '">' +
      '<path class="thin" d="M30 90 C 120 30, 200 140, 320 80 S 520 40, 610 90"/>' +
      around.map(function (a, i) { var x = 30 + i * (580 / Math.max(1, n - 1)), y = 90 - Math.sin(i / Math.max(1, n - 1) * Math.PI * 2) * 22;
        return '<circle class="' + (a.state === 'now' ? 'soft-acc' : a.state === 'done' ? '' : 'dash') + '" cx="' + x.toFixed(0) + '" cy="' + y.toFixed(0) + '" r="' + (a.state === 'now' ? 9 : 6) + '"/><text class="note' + (a.state === 'now' ? ' strong' : '') + '" x="' + x.toFixed(0) + '" y="' + (y + 30).toFixed(0) + '" text-anchor="middle">' + esc(a.label) + '</text>'; }).join('') + '</svg>';
    var keep = (T.currently || []).filter(function (c) { return /learn|build/i.test(c.label); });
    var dir = (W.notes || {}).now || [];
    main = sheetHead('02', 'Now', 'What has my attention this month. <span class="muted">Updated ' + fmt(T.date) + '.</span>', 'now') +
      '<div class="grid3">' + keep.map(function (c) { return '<div class="card"><div class="label">' + esc(c.label) + '</div><h3>' + esc(c.text) + '</h3></div>'; }).join('') +
      (T.question ? '<div class="card q"><div class="label">The question on my desk</div><h3 class="serif">' + esc(T.question) + '</h3></div>' : '') + '</div>' +
      block('The learning route', null, route + '<p class="aside">' + esc((T.sketch || {}).caption) + '</p>') +
      (dir.length ? block('How I chose this direction', null, dir.map(noteFold).join(''), 'direction') : '');
  } else if (page === 'work') {
    var big = allProjects.filter(function (p) { return p.status !== 'idea' || (p.exp && p.exp.featured); });
    var ideas = allProjects.filter(function (p) { return big.indexOf(p) < 0; });
    main = sheetHead('03', 'Work', esc(W.intro), 'work') +
      '<div class="projects">' + big.map(function (p) { return projCard(p, true); }).join('') + '</div>' +
      (ideas.length ? block('Also on the drawing board', null, '<ul class="ideas">' + ideas.map(function (p) {
        var x = p.exp || {};
        return '<li id="' + esc(p.id) + '"><span class="idea-art">' + Sketch.svg(p.drawing, '0 0 160 110', 'mini idea', '') + '</span><div><h3>' + esc(p.title) + '</h3><p>' + md(x.question || p.text) + '</p>' +
          '<details><summary>The plan</summary>' + [['Hypothesis', x.hypothesis], ['Method', x.method], ['Next step', x.next]].filter(function (r) { return r[1]; }).map(function (r) { return '<h4>' + r[0] + '</h4><p>' + md(r[1]) + '</p>'; }).join('') + '</details></div></li>';
      }).join('') + '</ul>') : '');
  } else if (page === 'library') {
    var present = TYPES.filter(function (t) { return things.some(function (x) { return x.type === t[0]; }); });
    var counts = [read.length + ' books read'].concat(present.map(function (t) { var c = things.filter(function (x) { return x.type === t[0]; }).length; return c + ' ' + (c === 1 ? t[2] : t[1]).toLowerCase(); }));
    main = sheetHead('04', 'Library', 'Everything that has shaped how I think: books, and the articles, videos, films and pictures worth keeping, with what I made of each.', 'reading') +
      '<p class="counts">' + counts.join(' · ') + '</p>' +
      '<div class="lib-tools">' +
      (present.length ? '<div class="chips types" role="group" aria-label="Show"><button aria-pressed="true" data-t="all">Everything</button><button aria-pressed="false" data-t="book">Books</button>' + present.map(function (t) { return '<button aria-pressed="false" data-t="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div>' : '') +
      '<label class="search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg><input type="search" placeholder="Search by title or author" aria-label="Search the library"></label>' +
      '<div class="chips shelves" role="group" aria-label="Book shelves"><button aria-pressed="true" data-g="all">All shelves</button>' + GROUPS.map(function (g) { return '<button aria-pressed="false" data-g="' + g[0] + '">' + esc(g[1]) + '</button>'; }).join('') + '</div></div>' +
      '<div class="lib">' +
      (reading.length ? '<section class="lib-sec" data-type="book"><h2>Reading now</h2><div class="covers now">' + reading.map(function (b) { return bookTile(b, false); }).join('') + '</div></section>' : '') +
      (things.length ? '<section class="lib-sec" data-type="things"><h2>Beyond books <span class="n">' + things.length + '</span></h2><div class="things">' + things.map(thingTile).join('') + '</div></section>' : '') +
      '<section class="lib-sec" data-type="book"><h2>Books I have read <span class="n">' + read.length + '</span></h2><div class="covers">' + read.map(function (b, i) { return bookTile(b, i > 11); }).join('') + '</div></section>' +
      (toRead.length ? '<section class="lib-sec" data-type="book" id="list"><h2>On my list <span class="n">' + toRead.length + '</span></h2><div class="covers list collapsed">' + toRead.map(function (b) { return bookTile(b, true); }).join('') + '</div><button class="btn more" type="button" data-expand>Show all ' + toRead.length + '</button></section>' : '') +
      '<p class="empty" hidden>Nothing here matches. Try another word or shelf.</p></div>' +
      '<dialog class="item" aria-label="Details"><button class="x" type="button" aria-label="Close">×</button><div class="item-body"></div></dialog>';
  }

  document.getElementById('app').innerHTML = header + '<main id="main" class="wrap">' + main + '</main>' + footer + tabbar;
  if (NB.errors && NB.errors.length) console.warn('Content files with errors:', NB.errors);

  /* ---------- behaviour ---------- */
  var root = document.documentElement;
  // Draw the sheet's main picture the first time; otherwise show it finished.
  var hero = document.querySelector('svg.hero');
  var minis = [].slice.call(document.querySelectorAll('svg.mini, svg.route'));
  if (hero) {
    if (!drawn[page]) { Sketch.draw(hero, function () { markDrawn(page); }); root.classList.add('first-visit'); }
    else Sketch.show(hero);
  }
  // Small drawings sketch themselves as they scroll into view, also only the first time.
  if (!drawn[page + '-minis'] && 'IntersectionObserver' in window && !Sketch.reduce) {
    minis.forEach(function (m) { m.style.visibility = 'hidden'; });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); e.target.style.visibility = ''; Sketch.draw(e.target, null, 1.8); } });
    }, { rootMargin: '0px 0px -10% 0px' });
    minis.forEach(function (m) { io.observe(m); });
    markDrawn(page + '-minis');
  } else minis.forEach(Sketch.show);

  // Leaving a sheet: rub out the picture, then go.
  var leaving = false;
  function leave(href) {
    if (leaving) return; leaving = true;
    if (Sketch.reduce) { location.href = href; return; }
    Sketch.erase(hero, 260); root.classList.add('leaving');
    setTimeout(function () { location.href = href; }, 270);
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[data-sheet]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var url = new URL(a.href, location.href);
    if (url.pathname === location.pathname || (url.pathname === '/index.html' && location.pathname === '/')) return;
    e.preventDefault(); leave(a.href);
  });
  window.addEventListener('pageshow', function (e) { if (e.persisted) { leaving = false; root.classList.remove('leaving'); if (hero) Sketch.show(hero); } });

  // Swipe between sheets on a phone.
  var sx = null, sy = 0;
  document.addEventListener('touchstart', function (e) { if (e.target.closest('.chips,details,.covers,.things,dialog,input')) { sx = null; return; } sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  document.addEventListener('touchend', function (e) {
    if (sx === null) return; var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy; sx = null;
    if (Math.abs(dx) > 90 && Math.abs(dy) < 40) { var j = idx + (dx < 0 ? 1 : -1); if (j >= 0 && j < SHEETS.length) leave(SHEETS[j][2]); }
  }, { passive: true });

  // Pencil ring around cards on hover.
  [].forEach.call(document.querySelectorAll('a.card, .proj'), function (c) {
    c.insertAdjacentHTML('beforeend', '<svg class="ring" aria-hidden="true"><rect pathLength="1" x="1" y="1" rx="14"/></svg>');
  });

  /* ---------- library behaviour ---------- */
  if (page === 'library') {
    var state = { t: 'all', g: 'all', q: '' };
    var secs = [].slice.call(document.querySelectorAll('.lib-sec')), empty = document.querySelector('.empty'), shelfChips = document.querySelector('.chips.shelves');
    function apply() {
      var any = false, searching = !!state.q || state.g !== 'all';
      secs.forEach(function (sec) {
        var isBook = sec.dataset.type === 'book', shown = 0;
        [].forEach.call(sec.querySelectorAll('[data-item]'), function (el) {
          var typeOk = state.t === 'all' || state.t === (isBook ? 'book' : el.dataset.type);
          var ok = typeOk && (!state.q || el.dataset.q.indexOf(state.q) >= 0) && (state.g === 'all' || !isBook || (' ' + el.dataset.group + ' ').indexOf(' ' + state.g + ' ') >= 0);
          if (state.g !== 'all' && !isBook) ok = false;
          el.hidden = !ok; if (ok) shown++;
        });
        sec.hidden = !shown; if (shown) any = true;
        var list = sec.querySelector('.covers.list'), btn = sec.querySelector('[data-expand]');
        if (list && searching) { list.classList.remove('collapsed'); if (btn) btn.hidden = true; }
      });
      empty.hidden = any;
      if (shelfChips) shelfChips.hidden = !(state.t === 'all' || state.t === 'book');
    }
    function chipGroup(sel, key) {
      [].forEach.call(document.querySelectorAll(sel + ' button'), function (b) {
        b.addEventListener('click', function () {
          [].forEach.call(b.parentNode.querySelectorAll('button'), function (x) { x.setAttribute('aria-pressed', String(x === b)); });
          state[key] = b.dataset[key]; apply();
        });
      });
    }
    chipGroup('.chips.types', 't'); chipGroup('.chips.shelves', 'g');
    var input = document.querySelector('.search input'), timer;
    input.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(function () { state.q = input.value.trim().toLowerCase(); apply(); }, 120); });
    [].forEach.call(document.querySelectorAll('[data-expand]'), function (b) { b.addEventListener('click', function () { b.previousElementSibling.classList.remove('collapsed'); b.hidden = true; }); });

    // The detail card: what I wrote about a book, article, video, film or picture.
    var dlg = document.querySelector('dialog.item'), body = dlg.querySelector('.item-body');
    var byKey = {}; G.forEach(function (b) { byKey['b-' + b.id] = { book: b }; }); things.forEach(function (t) { byKey[t.key] = { thing: t }; });
    var shelfLabel = {}; (SH.genres || []).forEach(function (g) { shelfLabel[g.key] = g.label; });
    function bookCard(b) {
      var status = b.shelf === 'currently-reading' ? 'Reading now' : b.shelf === 'to-read' ? 'On my list' : b.shelf === 'did-not-finish' ? 'Did not finish' : b.read ? 'Read ' + month(b.read) : 'Read';
      var meta = [b.published ? 'Published ' + b.published : '', b.pages ? b.pages + ' pages' : ''].filter(Boolean).join(' · ');
      var shelves = ((SH.books || {})[b.id] || []).map(function (k) { return shelfLabel[k]; }).filter(Boolean);
      var words = b.review ? paras(b.review) : b.why ? '<p class="why-on-list">' + md(b.why) + '</p>' : '<p class="no-review">' + (b.shelf === 'to-read' ? 'Not read yet.' : b.rating ? 'No review written, just the stars.' : 'No review written.') + '</p>';
      return '<div class="ib-head"><img src="/' + esc(b.cover) + '" alt="" width="120" height="180"><div><div class="label">' + esc(status) + '</div><h2>' + esc(b.title) + '</h2>' +
        (b.subtitle ? '<p class="ib-sub">' + esc(b.subtitle) + '</p>' : '') + '<p class="ib-by">' + esc(b.author) + (b.series ? ' · ' + esc(b.series) : '') + '</p>' + stars(b.rating) + '</div></div>' +
        (b.line ? '<blockquote>' + md(b.line) + '</blockquote>' : '') +
        '<div class="ib-words"><div class="label">' + (b.review ? 'What I wrote' : b.why ? 'Why it is on my list' : 'My notes') + '</div>' + words + '</div>' +
        '<p class="ib-meta">' + esc(meta) + (shelves.length ? (meta ? ' · ' : '') + esc(shelves.join(', ')) : '') + ' · <a href="https://www.goodreads.com/book/show/' + esc(b.id) + '" rel="noopener">On Goodreads ↗</a></p>';
    }
    function thingCard(t) {
      return (t.image ? '<img class="ib-wide" src="' + esc(t.image) + '" alt="">' : '') + '<div class="label">' + esc(typeName[t.type]) + (t.date ? ' · ' + esc(month(t.date) || t.date) : '') + '</div><h2>' + esc(t.title) + '</h2><p class="ib-by">' + esc(t.by) + '</p>' + stars(t.rating) +
        (t.line ? '<blockquote>' + md(t.line) + '</blockquote>' : '') +
        '<div class="ib-words"><div class="label">What I made of it</div>' + (t.note ? paras(t.note) : t.why ? paras(t.why) : '<p class="no-review">No note written.</p>') + '</div>' +
        (t.link ? '<p class="ib-meta"><a href="' + esc(t.link) + '" rel="noopener">Open the ' + esc(typeName[t.type].toLowerCase()) + ' ↗</a></p>' : '');
    }
    function openItem(key, push) {
      var it = byKey[key]; if (!it) return;
      body.innerHTML = it.book ? bookCard(it.book) : thingCard(it.thing);
      if (!dlg.open) { if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', ''); }
      dlg.scrollTop = 0;
      if (push) try { history.replaceState(null, '', '#' + key); } catch (e) {}
    }
    function closeItem() { if (dlg.open) { if (dlg.close) dlg.close(); else dlg.removeAttribute('open'); } }
    dlg.addEventListener('close', function () { if (/^#(b|m)-/.test(location.hash)) try { history.replaceState(null, '', location.pathname); } catch (e) {} });
    dlg.querySelector('.x').addEventListener('click', closeItem);
    dlg.addEventListener('click', function (e) { if (e.target === dlg) closeItem(); });
    document.querySelector('.lib').addEventListener('click', function (e) {
      var a = e.target.closest('[data-item]'); if (!a || e.metaKey || e.ctrlKey) return;
      e.preventDefault(); openItem(a.dataset.item, true);
    });
    if (/^#(b|m)-/.test(location.hash)) openItem(location.hash.slice(1), false);
  }

  // Open a deep link (old addresses forward with their #id).
  if (location.hash && !/^#(b|m)-/.test(location.hash)) {
    var t = document.getElementById(location.hash.slice(1));
    if (t) { if (t.tagName === 'DETAILS') t.open = true; else { var d = t.querySelector('details'); if (d) d.open = true; } setTimeout(function () { t.scrollIntoView(); }, 0); }
  }
})();
