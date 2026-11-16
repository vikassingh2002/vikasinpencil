/* vikasinpencil.com: five sheets (Home, Now, Work, Thinking, Reading) drawn from content/*.js.
   Each page's drawing is sketched the first time a visitor opens it, then shown finished. */
(function () {
  'use strict';
  var NB = window.NB || {}, S = NB.site || {}, T = NB.today || {}, W = NB.work || { projects: [], journey: [], next: [] };
  var X = NB.experiments || [], N = NB.notes || [], H = NB.hypotheses || [], E = NB.errata || [];
  var G = (NB.goodreads || {}).books || [], SH = NB.shelves || {}, R = NB.references || {}, L = NB.letters || [];
  var page = document.body.getAttribute('data-page') || 'home';
  var SHEETS = [['home', 'Home', '/'], ['now', 'Now', '/now.html'], ['work', 'Work', '/work.html'], ['thinking', 'Thinking', '/thinking.html'], ['reading', 'Reading', '/reading.html']];
  var idx = SHEETS.map(function (s) { return s[0]; }).indexOf(page);

  var ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ESC[c]; }); }
  function md(s) { return esc(s).replace(/\*([^*]+)\*/g, '<em>$1</em>').replace(/~~([^~]+)~~/g, '<s>$1</s>'); }
  var MON = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ');
  function fmt(d) { if (!d) return ''; var p = String(d).split('-'); return p.length < 3 ? d : MON[+p[1] - 1] + ' ' + (+p[2]) + ', ' + p[0]; }
  function short(d) { var p = String(d).split('-'); return p.length < 3 ? d : MON[+p[1] - 1] + ' ' + (+p[2]); }

  // Freshness: the newest dated entry anywhere, and how many dated entries there are (the revision number).
  var dates = [T.date].concat((T.log || []).map(function (l) { return l.date; }), N.map(function (n) { return n.date; }), E.map(function (e) { return e.date; }));
  H.forEach(function (h) { (h.history || []).forEach(function (x) { dates.push(x.date); }); });
  dates = dates.filter(Boolean).sort();
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
    thinking: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.4c.7.7 1 1.6 1 2.6h6c0-1 .3-1.9 1-2.6A6 6 0 0 0 12 3z"/>',
    reading: '<path d="M4 5.5h6a2 2 0 0 1 2 2V20a2 2 0 0 0-2-2H4zM20 5.5h-6a2 2 0 0 0-2 2V20a2 2 0 0 1 2-2h6z"/>'
  };
  function squiggle() { return '<svg class="squiggle" viewBox="0 0 100 8" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M2 5 C 22 2, 48 7, 70 4 S 92 3, 98 4"/></svg>'; }
  var header = '<header class="top"><div class="wrap"><a class="brand" href="/" data-sheet>Vikas <i>in</i> Pencil</a><nav class="main" aria-label="Main">' +
    SHEETS.slice(1).map(function (s) { return '<a href="' + s[2] + '" data-sheet' + (s[0] === page ? ' aria-current="page"' : '') + '>' + s[1] + (s[0] === page ? squiggle() : '') + '</a>'; }).join('') + '</nav></div></header>';
  var tabbar = '<nav class="tabbar" aria-label="Sections">' + SHEETS.map(function (s) {
    return '<a href="' + s[2] + '" data-sheet' + (s[0] === page ? ' aria-current="page"' : '') + '><svg viewBox="0 0 24 24" aria-hidden="true">' + ICON[s[0]] + '</svg><span>' + s[1] + '</span></a>';
  }).join('') + '</nav>';
  var footer = '<footer class="titleblock"><div class="wrap">' +
    '<div class="tb-row"><div><span class="tb-k">Drawn by</span>' + esc(S.name || 'Vikas Singh') + '</div>' +
    '<div><span class="tb-k">Sheet</span>' + String(idx + 1).padStart(2, '0') + ' of 05 · ' + SHEETS[idx][1] + '</div>' +
    '<div><span class="tb-k">Revision</span>Rev ' + rev + ' · ' + fmt(updated) + '</div>' +
    '<div><span class="tb-k">Contact</span><a href="mailto:' + esc(S.email) + '">' + esc(S.email) + '</a> · <a href="' + esc(S.linkedin) + '" rel="noopener">LinkedIn</a></div></div>' +
    '<p class="tb-note">' + esc(S.publicWorkNote || '') + '</p></div></footer>';

  /* ---------- pieces ---------- */
  function sheetHead(no, title, lede, drawing) {
    return '<section class="sheet-head"><div class="sh-text"><div class="eyebrow">Sheet ' + no + '</div><h1>' + title + '</h1>' + (lede ? '<p class="lede">' + lede + '</p>' : '') + '</div>' +
      '<div class="sh-art">' + Sketch.svg(drawing, '0 0 360 280', 'hero', '') + '</div></section>';
  }
  function block(title, more, body, id) {
    return '<section class="block"' + (id ? ' id="' + id + '"' : '') + '><div class="block-head"><h2>' + title + '</h2>' + (more ? '<a href="' + more[0] + '" data-sheet>' + more[1] + ' →</a>' : '') + '</div>' + body + '</section>';
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
    var pr = progressOf(p), pct = Math.round(pr * 100);
    var stepTxt = p.st ? p.st.done + ' of ' + p.st.total + ' steps done' : p.kind;
    var h = '<article class="card proj is-' + p.status + '" id="' + esc(p.id) + '" data-status="' + p.status + '">' +
      '<div class="proj-art">' + Sketch.svg(p.drawing, '0 0 160 110', 'mini', '') + '</div>' +
      '<div class="proj-body"><span class="status s-' + p.status + '">' + LABEL[p.status] + '</span><h3>' + (p.link ? '<a href="' + esc(p.link) + '">' + esc(p.title) + '</a>' : esc(p.title)) + '</h3>' +
      '<p>' + md(p.text) + '</p>' +
      '<div class="hatch" role="img" aria-label="' + pct + '% done"><span style="width:' + pct + '%"></span></div><div class="meta"><span>' + esc(stepTxt) + '</span><span>' + (p.status === 'live' ? 'Inked' : pct + '%') + '</span></div>';
    if (full && p.steps && p.steps.length) h += '<ol class="steps">' + p.steps.map(function (s) { return '<li class="st-' + esc(s.state) + '"><span>' + esc(s.when) + '</span>' + esc(s.name) + '</li>'; }).join('') + '</ol>';
    if (full && p.exp) {
      var x = p.exp;
      h += '<details><summary>The plan in detail</summary>' + [['Question', x.question], ['Hypothesis', x.hypothesis], ['Method', x.method], ['What a result looks like', x.result], ['Next step', x.next], ['Tools', x.tools]]
        .filter(function (r) { return r[1]; }).map(function (r) { return '<h4>' + r[0] + '</h4><p>' + md(r[1]) + '</p>'; }).join('') + '</details>';
    }
    if (p.link) h += '<a class="go" href="' + esc(p.link) + '">Open ' + esc(p.title) + ' →</a>';
    return h + '</div></article>';
  }
  function dial(h, size) {
    var c = h.status === 'retired' ? h.retired.to : h.confidence, hist = h.history || [], was = h.status === 'retired' ? h.retired.from : hist.length ? hist[0].confidence : c;
    function pt(v, r) { var a = Math.PI * (1 - v / 100); return [60 + r * Math.cos(a), 62 - r * Math.sin(a)]; }
    var n = pt(c, 46), w = pt(was, 46);
    return '<svg class="sk dial" viewBox="0 0 120 72" role="img" aria-label="' + c + '% sure' + (was !== c ? ', was ' + was + '%' : '') + '">' +
      '<path class="thin" d="M8 62 A 52 52 0 0 1 112 62"/>' + [0, 25, 50, 75, 100].map(function (v) { var a = pt(v, 52), b = pt(v, 46); return '<path class="thin" d="M' + a[0].toFixed(1) + ' ' + a[1].toFixed(1) + ' L' + b[0].toFixed(1) + ' ' + b[1].toFixed(1) + '"/>'; }).join('') +
      (was !== c ? '<path class="thin dash" d="M60 62 L' + w[0].toFixed(1) + ' ' + w[1].toFixed(1) + '"/>' : '') +
      '<path class="acc" d="M60 62 L' + n[0].toFixed(1) + ' ' + n[1].toFixed(1) + '"/><circle cx="60" cy="62" r="3"/></svg>';
  }
  function belief(h) {
    var ret = h.status === 'retired', c = ret ? h.retired.to : h.confidence, hist = h.history || [], was = ret ? h.retired.from : hist.length ? hist[0].confidence : c;
    return '<article class="belief' + (ret ? ' retired' : '') + '" id="' + esc(h.id) + '"><div class="b-text"><div class="eyebrow">' + esc(h.id) + ' · ' + (ret ? 'retired ' + fmt(h.retired.date) : 'since ' + fmt(h.opened)) + '</div>' +
      '<h3>' + esc(h.statement) + '</h3>' + (ret ? '<p>' + md(h.retired.what) + '</p>' : '<p>' + md(h.why) + '</p>' + (h.changeMind ? '<p class="cm"><b>What would change my mind:</b> ' + md(h.changeMind) + '</p>' : '')) +
      ((h.revisions || []).length ? '<p class="cm"><b>Reworded:</b> <s>' + esc(h.revisions[0].before) + '</s></p>' : '') + '</div>' +
      '<div class="b-dial">' + dial(h) + '<div class="b-num"><b>' + c + '%</b> sure' + (was !== c ? '<span>was ' + was + '%</span>' : '') + '</div></div></article>';
  }
  function cover(b, lazy) {
    return '<a class="book" href="https://www.goodreads.com/book/show/' + esc(b.id) + '" rel="noopener" data-genres="' + esc(((SH.books || {})[b.id] || []).join(' ')) + '"><img src="/' + esc(b.cover) + '" alt="" ' + (lazy ? 'loading="lazy" ' : '') + 'width="120" height="180"><span class="bt">' + esc(b.title) + '</span><span class="ba">' + esc(b.author) + '</span>' + (b.rating ? '<span class="stars" aria-label="' + b.rating + ' stars">' + '★'.repeat(b.rating) + '</span>' : '') + '</a>';
  }
  var hidden = {}; Object.keys(R.notes || {}).forEach(function (k) { if (R.notes[k].hide) hidden[k] = 1; });
  G = G.filter(function (b) { return !hidden[b.id]; }).map(function (b) { var n = (R.notes || {})[b.id] || {}; return Object.assign({}, b, n.title ? { title: n.title } : {}, n.author ? { author: n.author } : {}); });
  var reading = G.filter(function (b) { return b.shelf === 'currently-reading'; });
  var read = G.filter(function (b) { return b.shelf === 'read'; }).sort(function (a, b) { return (b.read || b.added || '').localeCompare(a.read || a.added || ''); });
  var featured = X.filter(function (x) { return x.featured; })[0] || X[0];
  var featBelief = H.filter(function (h) { return h.featured; })[0] || H[0];

  /* ---------- pages ---------- */
  var main = '';
  if (page === 'home') {
    var cur = reading[0], fst = featured ? steps(featured) : null;
    main = '<section class="hero"><div class="hero-text"><span class="pill"><b></b>Day ' + day + ' of a year of building · updated ' + short(updated) + '</span>' +
      '<h1>I sketch ideas, then <em>build them</em>.</h1><p class="lede">' + esc((S.coverLines || []).join(' ')) + ' This site is the drawing board: what I am learning, making and thinking, and where I am heading.</p>' +
      '<div class="cta"><a class="btn dark" href="/work.html" data-sheet>See the work</a><a class="btn" href="/now.html" data-sheet>What I am learning</a></div></div>' +
      '<div class="hero-art">' + Sketch.svg('home', '0 0 360 280', 'hero', 'A line drawing of a workbench with a lamp and a half-drawn part') + '</div></section>' +
      block('Right now', ['/now.html', 'All of Now'], '<div class="grid3">' +
        '<a class="card" href="/now.html" data-sheet><div class="label">Learning</div><h3>' + esc(((T.currently || [])[0] || {}).text) + '</h3></a>' +
        (featured ? '<a class="card" href="/work.html#' + esc(featured.id) + '" data-sheet><div class="label">Building</div><h3>' + esc(featured.title) + '</h3><div class="hatch"><span style="width:' + (fst.total ? Math.round(fst.done / fst.total * 100) : 0) + '%"></span></div><div class="meta"><span>' + (expStatus(featured) === 'idea' ? 'On the drawing board' : 'Building') + '</span><span>' + fst.done + ' of ' + fst.total + ' steps</span></div></a>' : '') +
        (cur ? '<a class="card book-card" href="/reading.html" data-sheet><img src="/' + esc(cur.cover) + '" alt="" width="58" height="87"><div><div class="label">Reading</div><h3>' + esc(cur.title) + '</h3><p>' + esc(cur.author) + '</p></div></a>' : '') + '</div>') +
      block('The journey so far', null, '<ol class="journey">' + W.journey.map(function (j) { return '<li class="stop st-' + j.state + '"><span class="when">' + esc(j.when) + '</span><h3>' + esc(j.title) + '</h3><p>' + esc(j.text) + '</p></li>'; }).join('') + '</ol>') +
      block('What I have made', ['/work.html', 'All work'], '<div class="grid3">' + allProjects.filter(function (p) { return p.status === 'live'; }).slice(0, 3).map(function (p) { return projCard(p, false); }).join('') + '</div>') +
      block('What I think', ['/thinking.html', 'All thinking'], '<div class="grid2">' +
        (N[0] ? '<a class="card" href="/thinking.html#' + esc(N[0].id) + '" data-sheet><div class="label">Latest note · ' + fmt(N[0].date) + '</div><h3 class="serif">' + esc(N[0].title) + '</h3><p>' + md((N[0].paragraphs || [''])[0].slice(0, 170)) + '…</p></a>' : '') +
        (featBelief ? '<a class="card belief-card" href="/thinking.html#' + esc(featBelief.id) + '" data-sheet><div class="label">A belief I am testing</div><h3 class="serif">' + esc(featBelief.statement) + '</h3><div class="bc-dial">' + dial(featBelief) + '<span><b>' + featBelief.confidence + '%</b> sure</span></div></a>' : '') + '</div>') +
      block('What is next', null, '<div class="grid3">' + W.next.map(function (n) { return '<div class="card plan"><div class="label">' + esc(n.when) + '</div><h3>' + esc(n.text) + '</h3></div>'; }).join('') + '</div>' +
        (L.length ? '<p class="aside">' + L.length + ' sealed letters to my future self open between ' + L.map(function (l) { return l.opens.slice(0, 4); }).sort()[0] + ' and ' + L.map(function (l) { return l.opens.slice(0, 4); }).sort().pop() + '.</p>' : ''), 'next') +
      block('About', null, '<div class="about"><div><p class="big">' + esc(S.briefLine) + '</p>' + (S.thirtySeconds || []).map(function (p) { return '<p>' + md(p) + '</p>'; }).join('') + '</div>' +
        '<div class="card contact"><div class="label">Get in touch</div><a href="mailto:' + esc(S.email) + '">' + esc(S.email) + '</a><a href="' + esc(S.linkedin) + '" rel="noopener">LinkedIn</a>' + (S.cvFile ? '<a href="' + esc(S.cvFile) + '">CV</a>' : '') + '</div></div>', 'about');
  } else if (page === 'now') {
    var around = ((T.sketch || {}).around || []), n = around.length || 1;
    var route = '<svg class="sk route" viewBox="0 0 640 150" role="img" aria-label="Learning route: ' + esc(around.map(function (a) { return a.label + (a.state === 'now' ? ' (now)' : ''); }).join(', ')) + '">' +
      '<path class="thin" d="M30 90 C 120 30, 200 140, 320 80 S 520 40, 610 90"/>' +
      around.map(function (a, i) { var x = 30 + i * (580 / Math.max(1, n - 1)), y = 90 - Math.sin(i / Math.max(1, n - 1) * Math.PI * 2) * 22;
        return '<circle class="' + (a.state === 'now' ? 'soft-acc' : a.state === 'done' ? '' : 'dash') + '" cx="' + x.toFixed(0) + '" cy="' + y.toFixed(0) + '" r="' + (a.state === 'now' ? 9 : 6) + '"/><text class="note' + (a.state === 'now' ? ' strong' : '') + '" x="' + x.toFixed(0) + '" y="' + (y + 30).toFixed(0) + '" text-anchor="middle">' + esc(a.label) + '</text>'; }).join('') + '</svg>';
    main = sheetHead('02', 'Now', esc(T.intro) + ' <span class="muted">Updated ' + fmt(T.date) + '.</span>', 'now') +
      '<div class="grid2">' + (T.currently || []).map(function (c) { return '<div class="card"><div class="label">' + esc(c.label) + '</div><h3>' + esc(c.text) + '</h3></div>'; }).join('') +
      (T.question ? '<div class="card q"><div class="label">The question on my desk</div><h3 class="serif">' + esc(T.question) + '</h3></div>' : '') + '</div>' +
      block('The learning route', null, route + '<p class="aside">' + esc((T.sketch || {}).caption) + '</p>') +
      ((T.sinceLastMonth || []).length ? block('What changed', null, '<ul class="changes">' + T.sinceLastMonth.map(function (c) { return '<li>' + (c.struck ? '<s>' + esc(c.struck) + '</s>' : '') + '<span>' + esc(c.note) + '</span></li>'; }).join('') + '</ul>') : '') +
      block('Log', null, '<ul class="log">' + (T.log || []).map(function (l) { return '<li><span class="d">' + fmt(l.date) + '</span><span>' + md(l.text) + '</span></li>'; }).join('') + '</ul>');
  } else if (page === 'work') {
    var cnt = function (s) { return allProjects.filter(function (p) { return p.status === s; }).length; };
    main = sheetHead('03', 'Work', esc(W.intro), 'work') +
      '<div class="stats"><div><b>' + cnt('live') + '</b><span>live</span></div><div><b>' + cnt('building') + '</b><span>building</span></div><div><b>' + cnt('idea') + '</b><span>on the drawing board</span></div><div><b>' + day + '</b><span>days into the build year</span></div></div>' +
      '<div class="legend"><span><i class="lg-idea"></i>Dashed: an idea</span><span><i class="lg-build"></i>Shaded: being built</span><span><i class="lg-live"></i>Inked green: live</span></div>' +
      '<div class="chips" role="group" aria-label="Filter"><button aria-pressed="true" data-f="all">All</button><button aria-pressed="false" data-f="live">Live</button><button aria-pressed="false" data-f="building">Building</button><button aria-pressed="false" data-f="idea">On the drawing board</button></div>' +
      '<div class="projects">' + allProjects.map(function (p) { return projCard(p, true); }).join('') + '</div>';
  } else if (page === 'thinking') {
    main = sheetHead('04', 'Thinking', 'Short notes, and beliefs I am testing out loud. When I change my mind, the old view stays visible, struck through rather than erased.', 'thinking') +
      '<div class="chips jump"><a href="#notes">Notes</a><a href="#beliefs">Beliefs</a>' + (E.length ? '<a href="#corrections">Corrections</a>' : '') + '</div>' +
      block('Notes', null, N.map(function (n) { return '<article class="note" id="' + esc(n.id) + '"><div class="n-meta">' + fmt(n.date) + '<br>' + esc(n.topic) + '</div><div class="n-body"><h3>' + esc(n.title) + '</h3>' +
        (n.paragraphs || []).map(function (p, i) { return i === 0 ? '<p>' + md(p) + '</p>' : ''; }).join('') +
        ((n.paragraphs || []).length > 1 ? '<details><summary>Read the rest</summary>' + n.paragraphs.slice(1).map(function (p) { return '<p>' + md(p) + '</p>'; }).join('') + '</details>' : '') + '</div></article>'; }).join(''), 'notes') +
      block('Beliefs I am testing', null, H.filter(function (h) { return h.status !== 'retired'; }).concat(H.filter(function (h) { return h.status === 'retired'; })).map(belief).join(''), 'beliefs') +
      (E.length ? block('Corrections', null, '<ul class="log">' + E.map(function (e) { return '<li><span class="d">' + fmt(e.date) + '<br>' + esc(e.where) + '</span><span>' + md(e.text) + '</span></li>'; }).join('') + '</ul>', 'corrections') : '');
  } else if (page === 'reading') {
    var yr = String(new Date().getFullYear()), thisYear = read.filter(function (b) { return (b.read || '').slice(0, 4) === yr; }).length;
    var used = {}; read.forEach(function (b) { ((SH.books || {})[b.id] || []).forEach(function (g) { used[g] = (used[g] || 0) + 1; }); });
    var genres = (SH.genres || []).filter(function (g) { return used[g.key] >= 3; });
    main = sheetHead('05', 'Reading', esc(R.intro || 'Books that shaped how I think, synced from Goodreads.'), 'reading') +
      '<div class="stats"><div><b>' + read.length + '</b><span>books read</span></div><div><b>' + thisYear + '</b><span>this year</span></div><div><b>' + G.filter(function (b) { return b.shelf === 'to-read'; }).length + '</b><span>on the list</span></div><div><b>' + reading.length + '</b><span>reading now</span></div></div>' +
      (reading.length ? block('Reading now', null, '<div class="covers now">' + reading.map(function (b) { return cover(b, false); }).join('') + '</div>') : '') +
      block('The shelf', null, '<div class="chips" role="group" aria-label="Filter by shelf"><button aria-pressed="true" data-g="all">All</button>' + genres.map(function (g) { return '<button aria-pressed="false" data-g="' + esc(g.key) + '">' + esc(g.short || g.label) + '</button>'; }).join('') + '</div>' +
        '<div class="covers shelf">' + read.map(function (b, i) { return cover(b, i > 11); }).join('') + '</div><button class="btn more" type="button">Show all ' + read.length + ' books</button>') +
      ((R.log || []).length ? block('Courses and other things', null, '<ul class="log">' + R.log.map(function (r) { return '<li><span class="d">' + esc(r.date || '') + '<br>' + esc(r.type) + '</span><span>' + esc(r.title || r.link) + (r.by ? ' <span class="muted">· ' + esc(r.by) + '</span>' : '') + '</span></li>'; }).join('') + '</ul>') : '');
  }

  document.getElementById('app').innerHTML = header + '<main id="main" class="wrap">' + main + '</main>' + footer + tabbar;
  if (NB.errors && NB.errors.length) console.warn('Content files with errors:', NB.errors);

  /* ---------- behaviour ---------- */
  var root = document.documentElement;
  // Draw the sheet's main picture the first time; otherwise show it finished.
  var hero = document.querySelector('svg.hero');
  var minis = [].slice.call(document.querySelectorAll('svg.mini, svg.dial, svg.route'));
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
  document.addEventListener('touchstart', function (e) { if (e.target.closest('.chips,details,.covers')) { sx = null; return; } sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  document.addEventListener('touchend', function (e) {
    if (sx === null) return; var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy; sx = null;
    if (Math.abs(dx) > 90 && Math.abs(dy) < 40) { var j = idx + (dx < 0 ? 1 : -1); if (j >= 0 && j < SHEETS.length) leave(SHEETS[j][2]); }
  }, { passive: true });

  // Filters.
  [].forEach.call(document.querySelectorAll('.chips button'), function (b) {
    b.addEventListener('click', function () {
      var grp = b.parentNode; [].forEach.call(grp.querySelectorAll('button'), function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      if (b.dataset.f) [].forEach.call(document.querySelectorAll('.proj'), function (p) { p.hidden = b.dataset.f !== 'all' && p.dataset.status !== b.dataset.f; });
      if (b.dataset.g) {
        var shelf = document.querySelector('.covers.shelf'); shelf.classList.add('open');
        [].forEach.call(shelf.querySelectorAll('.book'), function (k) { k.hidden = b.dataset.g !== 'all' && (' ' + k.dataset.genres + ' ').indexOf(' ' + b.dataset.g + ' ') < 0; });
        var m = document.querySelector('.btn.more'); if (m) m.hidden = true;
      }
    });
  });
  var more = document.querySelector('.btn.more');
  if (more) more.addEventListener('click', function () { document.querySelector('.covers.shelf').classList.add('open'); more.hidden = true; });

  // Pencil ring around cards on hover.
  [].forEach.call(document.querySelectorAll('a.card, .proj'), function (c) {
    c.insertAdjacentHTML('beforeend', '<svg class="ring" aria-hidden="true"><rect pathLength="1" x="1" y="1" rx="14"/></svg>');
  });
  // Open a deep link (old addresses forward with their #id).
  if (location.hash) { var t = document.getElementById(location.hash.slice(1)); if (t) { var d = t.querySelector('details'); if (d) d.open = true; setTimeout(function () { t.scrollIntoView(); }, 0); } }
})();
