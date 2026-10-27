/* =============================================================
   Vikas in Pencil: the desk.

   A private home page for choosing how to spend the time, built
   around three questions: what do I want to do, what is the easiest
   way to begin, and where did I leave off?

   It reads the public notebook (projects from the experiments, books
   from the shelves, questions from Today and the hypotheses), but
   everything written here stays in this browser, on this device.
   Nothing is sent anywhere. Back it up from the foot of the page.
   ============================================================= */
(function () {
  'use strict';

  var NB = window.NB || {};
  var root = document.getElementById('desk');
  if (!root) return;
  var reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* ------------------------------------------------------------
     Helpers
     ------------------------------------------------------------ */

  var ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ESC[c]; }); }
  function lines(s) { return esc(s).replace(/\n/g, '<br>'); }
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function list(x) { return Array.isArray(x) ? x : []; }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function now() { return Date.now(); }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  var DAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var MONTH = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  function longDay(d) { return DAY[d.getDay()] + ', ' + d.getDate() + ' ' + MONTH[d.getMonth()]; }
  function ago(ts) {
    if (!ts) return '';
    var mins = Math.round((now() - ts) / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return plural(mins, 'minute', 'minutes') + ' ago';
    var hours = Math.round(mins / 60);
    if (hours < 24) return plural(hours, 'hour', 'hours') + ' ago';
    var days = Math.round(hours / 24);
    if (days === 1) return 'yesterday';
    if (days < 7) return days + ' days ago';
    var d = new Date(ts);
    return d.getDate() + ' ' + MONTH[d.getMonth()].slice(0, 3);
  }
  // "Build the simulated satellite: a battery that…" -> head and the rest
  function split(text) {
    var t = String(text || '').trim();
    var m = /^(.{6,80}?)(?::\s+|\.\s+)([\s\S]+)$/.exec(t);
    return m ? [m[1], m[2].charAt(0).toUpperCase() + m[2].slice(1)] : [t, ''];
  }
  function safeUrl(u) {
    u = String(u || '').trim();
    if (/^https?:\/\/[^\s]+$/i.test(u)) return u;
    if (/^[\w\-./]+(#[\w\-]*)?$/.test(u) && !/^javascript/i.test(u)) return u;
    return '';
  }
  // A small seeded random, so suggestions hold still until you ask for others.
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ------------------------------------------------------------
     What the desk keeps (in this browser only)
     ------------------------------------------------------------ */

  var KEY = 'nb.desk';
  var memoryOnly = false;
  function read() {
    try { var raw = window.localStorage.getItem(KEY); return raw ? JSON.parse(raw) : null; }
    catch (e) { memoryOnly = true; return null; }
  }
  function save() {
    try { window.localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (e) { memoryOnly = true; }
  }
  function blank() {
    return { version: 1, projects: [], current: '', inbox: [], chosen: [], offline: [], doors: [], done: [], seen: [], seeded: false };
  }
  function tidy(s) {
    var b = blank();
    if (!s || typeof s !== 'object') return b;
    Object.keys(b).forEach(function (k) { if (s[k] === undefined || (Array.isArray(b[k]) && !Array.isArray(s[k]))) s[k] = b[k]; });
    s.projects.forEach(function (p) { p.milestones = list(p.milestones); p.notes = list(p.notes); });
    return s;
  }

  var site = NB.site || {};
  var state = tidy(read());

  // Projects arrive from the notebook's experiments; anything you've put away stays away.
  function seedProjects() {
    list(NB.experiments).forEach(function (e) {
      if (!e || !e.id || state.seen.indexOf(e.id) !== -1) return;
      state.seen.push(e.id);
      if (e.status !== 'running' && e.status !== 'planned') return;
      var p = {
        id: 'p-' + e.id,
        seed: e.id,
        title: e.title || e.id,
        link: 'experiments.html#' + e.id,
        next: e.next || '',
        milestones: list(e.steps).map(function (s) { return { name: s.name, done: s.state === 'done' }; }),
        notes: [],
        created: now(),
        touched: 0
      };
      if (e.featured) state.projects.unshift(p); else state.projects.push(p);
      if (e.featured) state.current = p.id;
    });
    if (!project(state.current)) {
      var first = active()[0];
      state.current = first ? first.id : '';
    }
  }
  function seedRest() {
    if (state.seeded) return;
    state.seeded = true;
    state.offline = [
      'A twenty-minute walk, without the phone',
      'A game of badminton',
      'Call a friend you haven\'t spoken to in a while',
      'Make tea and look out of the window',
      'Ten minutes of stretching',
      'A paper book, somewhere comfortable'
    ];
    var gr = NB.goodreads || {};
    state.doors = [
      { title: 'My notebook', url: 'index.html' },
      { title: 'The 30-second brief', url: 'brief.html' },
      gr.profile ? { title: 'Goodreads', url: gr.profile } : null,
      site.linkedin ? { title: 'LinkedIn', url: site.linkedin } : null,
      { title: 'ESA anomaly dataset', url: 'https://zenodo.org/records/12588359' },
      { title: 'Site code on GitHub', url: 'https://github.com/vikassingh2002/vikasinpencil' }
    ].filter(Boolean);
  }
  seedProjects();
  seedRest();
  save();

  function project(id) { for (var i = 0; i < state.projects.length; i++) if (state.projects[i].id === id) return state.projects[i]; return null; }
  function active() { return state.projects.filter(function (p) { return !p.archived; }); }
  function current() { var p = project(state.current); return p && !p.archived ? p : null; }
  function milestoneNow(p) {
    for (var i = 0; i < p.milestones.length; i++) if (!p.milestones[i].done) return { i: i, m: p.milestones[i] };
    return null;
  }

  /* From the public notebook: books on the go and waiting, and questions worth sitting with. */
  var refNotes = (NB.references || {}).notes || {};
  var books = list((NB.goodreads || {}).books).filter(function (b) { return !(refNotes[b.id] || {}).hide; }).map(function (b) {
    var n = refNotes[b.id] || {};
    return { id: String(b.id), shelf: b.shelf, title: n.title || b.title, by: n.author || b.author, pages: b.pages, link: 'https://www.goodreads.com/book/show/' + encodeURIComponent(b.id) };
  });
  var reading = books.filter(function (b) { return b.shelf === 'currently-reading'; });
  var waiting = books.filter(function (b) { return b.shelf === 'to-read'; });
  function questions() {
    var qs = [];
    var today = NB.today || {};
    if (today.question) qs.push(today.question);
    list(NB.hypotheses).forEach(function (h) {
      if (!h || h.status === 'retired' || !h.statement) return;
      var s = String(h.statement).replace(/\.$/, '');
      if (/^[A-Z][a-z]/.test(s)) s = s.charAt(0).toLowerCase() + s.slice(1); // "Big numbers" -> "big numbers", but "AI" stays
      s = s.replace(/\.\s+([A-Z])([a-z])/g, function (_, a, b) { return '; ' + a.toLowerCase() + b; }); // two sentences, one question
      qs.push('Am I still ' + h.confidence + '% sure that ' + s + '?');
    });
    state.inbox.forEach(function (i) { if (i.kind === 'question') qs.push(i.text); });
    return qs;
  }

  /* ------------------------------------------------------------
     What's on screen right now (not kept)
     ------------------------------------------------------------ */

  var VIEWS = ['continue', 'choose', 'capture', 'unwind'];
  var ui = {
    view: 'home',
    energy: 'some',
    time: 30,
    shuffle: 0,
    picks: [],
    stuck: false,
    why: '',
    editingNext: false,
    doneFlow: false,
    editDoors: false,
    kind: 'thought',
    prefill: ''
  };
  function viewFromHash() {
    var h = location.hash.replace('#', '');
    return VIEWS.indexOf(h) !== -1 ? h : 'home';
  }

  /* ------------------------------------------------------------
     Drawing the desk
     ------------------------------------------------------------ */

  var WAYS = [
    { key: 'continue', name: 'Continue', sub: 'Pick up where I stopped' },
    { key: 'choose', name: 'Choose', sub: 'Find something meaningful' },
    { key: 'capture', name: 'Capture', sub: 'Save thoughts and ideas' },
    { key: 'unwind', name: 'Unwind', sub: 'Rest with intention' }
  ];

  function topHtml() {
    var d = new Date();
    var h = d.getHours();
    var hello = h < 5 ? 'Still up' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
    var name = String(site.name || '').split(' ')[0];
    return '<header class="desk__top">' +
        '<p class="desk__kicker">Desk · ' + esc(longDay(d)) + '</p>' +
        '<a class="desk__out ink-link" href="index.html">The notebook →</a>' +
      '</header>' +
      '<p class="desk__hello">' + esc(hello + (name ? ', ' + name : '')) + '.</p>' +
      '<h1 class="desk__ask">What would you like to do?</h1>' +
      '<nav class="desk__ways" aria-label="What to do">' + WAYS.map(function (w) {
        var on = ui.view === w.key;
        return '<a class="way' + (on ? ' is-on' : '') + '" href="#' + w.key + '"' + (on ? ' aria-current="page"' : '') + '>' +
          '<span class="way__name">' + esc(w.name) + '</span><span class="way__sub">' + esc(w.sub) + '</span></a>';
      }).join('') + '</nav>' +
      '<p class="desk__leave"><button type="button" class="btn btn--text" data-act="leave">Or leave the screen for a while →</button></p>';
  }

  function leftOffHtml() {
    var p = current();
    if (!p) {
      return '<section class="leftoff box"><p class="label">Right where you left off</p>' +
        '<p class="hand-m">Nothing on the bench yet.</p>' +
        '<p class="prose">Start a project in <a href="#continue">Continue</a>, and this is where it will wait for you.</p></section>';
    }
    var parts = split(p.next);
    var mn = milestoneNow(p);
    var note = p.notes[p.notes.length - 1];
    return '<section class="leftoff box" aria-labelledby="leftoff-title">' +
      '<p class="label">Right where you left off</p>' +
      '<h2 class="hand-l leftoff__title" id="leftoff-title">' + esc(p.title) + '</h2>' +
      (mn ? '<p class="leftoff__step">Step ' + (mn.i + 1) + ' of ' + p.milestones.length + ' · ' + esc(mn.m.name) + '</p>' : '') +
      (p.next
        ? '<p class="leftoff__next"><span class="leftoff__tag">Next</span>' + esc(parts[0]) + '</p>' + (parts[1] ? '<p class="leftoff__detail">' + esc(parts[1]) + '</p>' : '')
        : '<p class="leftoff__next"><span class="leftoff__tag">Next</span>Decide the next small step.</p>') +
      (note ? '<p class="leftoff__note">Last time you wrote: “' + esc(note.text) + '” <span>· ' + esc(ago(note.when)) + '</span></p>' : '') +
      '<div class="actions">' +
        '<button type="button" class="btn" data-act="session" data-min="25">Pick it up · 25 min</button>' +
        '<button type="button" class="btn btn--line" data-act="session" data-min="5">Just 5 minutes</button>' +
        '<button type="button" class="btn btn--text" data-act="stuck">I\'m stuck</button>' +
      '</div>' +
    '</section>';
  }

  function stuckHtml() {
    var WHY = [['start', 'Don\'t know where to start'], ['big', 'It feels too big'], ['mood', 'Not in the mood'], ['missing', 'Missing something']];
    var help = '';
    if (ui.why === 'start' || ui.why === 'big') {
      help = '<p class="prose">' + (ui.why === 'start'
        ? 'Write down the very first physical action. Open a file, find one link, write one sentence.'
        : 'Cut it in half, then in half again. What is the first quarter?') + '</p>' +
        '<form class="stuck__form" data-form="stuck-next"><label class="visually-hidden" for="stuck-next">The smaller next step</label>' +
        '<input class="input input--hand" id="stuck-next" name="text" autocomplete="off" placeholder="The smaller next step" required>' +
        '<button class="btn" type="submit">Make this the next step</button></form>';
    } else if (ui.why === 'mood') {
      help = '<p class="prose">Give it five minutes, then decide. Or choose something lighter for now; that counts too.</p>' +
        '<div class="actions"><button type="button" class="btn" data-act="session" data-min="5">Five minutes, then decide</button>' +
        '<button type="button" class="btn btn--line" data-act="lighter">Choose something lighter</button></div>';
    } else if (ui.why === 'missing') {
      help = '<p class="prose">Write down what you need and who might have it. It goes to your inbox as a question, so you can work on another part meanwhile.</p>' +
        '<form class="stuck__form" data-form="stuck-missing"><label class="visually-hidden" for="stuck-missing">What you need</label>' +
        '<input class="input" id="stuck-missing" name="text" autocomplete="off" placeholder="I need… from…" required>' +
        '<button class="btn" type="submit">Note it down</button></form>';
    }
    return '<div class="stuck" role="group" aria-labelledby="stuck-title">' +
      '<p class="hand-m" id="stuck-title">Make it smaller.</p>' +
      '<p class="stuck__ask">What\'s in the way?</p>' +
      '<div class="lib-chips">' + WHY.map(function (w) {
        return '<button type="button" class="lib-chip" data-act="why" data-why="' + w[0] + '" aria-pressed="' + (ui.why === w[0]) + '">' + esc(w[1]) + '</button>';
      }).join('') + '</div>' + help +
    '</div>';
  }

  function continueHtml() {
    var p = current();
    var others = active().filter(function (o) { return o !== p; });
    var away = state.projects.filter(function (o) { return o.archived; });
    var newProject =
      '<details class="gap-m"' + (p ? '' : ' open') + '><summary class="desk__summary">Start a new project</summary>' +
      '<form class="desk__form" data-form="project">' +
        '<label class="field-label" for="np-title">What is it?</label><input class="input" id="np-title" name="title" autocomplete="off" required>' +
        '<label class="field-label" for="np-next">The first small step</label><input class="input" id="np-next" name="next" autocomplete="off">' +
        '<button class="btn" type="submit">Put it on the bench</button>' +
      '</form></details>';
    if (!p) {
      return '<section class="panel"><p class="label">Continue</p><h2 class="hand-l">Nothing on the bench</h2>' +
        '<p class="lede">Start something small. The desk will remember where you stop.</p>' + newProject + benchAway(away) + '</section>';
    }
    var mn = milestoneNow(p);
    var mine = state.done.filter(function (d) { return d.project === p.id; }).slice(-4).reverse();
    return '<section class="panel" aria-labelledby="panel-title">' +
      '<p class="label">Continue</p>' +
      '<h2 class="hand-l" id="panel-title">' + esc(p.title) + '</h2>' +
      (p.seed ? '<p class="panel__meta">' + esc(p.seed) + ' · <a class="ink-link" href="' + esc(p.link) + '">in the notebook</a></p>' : '') +
      (p.milestones.length
        ? '<ol class="milestones">' + p.milestones.map(function (m, i) {
            return '<li class="' + (m.done ? 'is-done' : mn && mn.i === i ? 'is-now' : '') + '"><label>' +
              '<input type="checkbox" data-act="milestone" data-i="' + i + '"' + (m.done ? ' checked' : '') + '>' +
              '<span>' + esc(m.name) + '</span></label></li>';
          }).join('') + '</ol>'
        : '') +
      '<div class="box nextbox">' +
        '<p class="label">The next step</p>' +
        (ui.editingNext
          ? '<form class="desk__form" data-form="next"><label class="visually-hidden" for="next-text">The next step</label>' +
            '<textarea class="textarea textarea--hand" id="next-text" name="text" rows="2">' + esc(p.next) + '</textarea>' +
            '<div class="actions"><button class="btn" type="submit">Save</button><button type="button" class="btn btn--text" data-act="cancel-next">Cancel</button></div></form>'
          : '<p class="nextbox__text">' + (p.next ? lines(p.next) : 'No next step yet. Write one down, however small.') + '</p>') +
        (ui.doneFlow
          ? '<form class="desk__form" data-form="done"><p class="hand-s">Done. What\'s the next small step?</p>' +
            '<label class="visually-hidden" for="done-next">The next small step</label>' +
            '<input class="input input--hand" id="done-next" name="text" autocomplete="off" placeholder="The next small step">' +
            '<div class="actions"><button class="btn" type="submit">Save it</button><button type="button" class="btn btn--text" data-act="cancel-done">Not now</button></div></form>'
          : '') +
        (!ui.editingNext && !ui.doneFlow
          ? '<div class="actions">' +
              '<button type="button" class="btn" data-act="session" data-min="25">Start · 25 min</button>' +
              '<button type="button" class="btn btn--line" data-act="session" data-min="5">Just 5 minutes</button>' +
              (p.next ? '<button type="button" class="btn btn--line" data-act="done">Done, what\'s next?</button>' : '') +
              '<button type="button" class="btn btn--text" data-act="edit-next">' + (p.next ? 'Change it' : 'Write it') + '</button>' +
              '<button type="button" class="btn btn--text" data-act="stuck">I\'m stuck</button>' +
            '</div>'
          : '') +
        (ui.stuck ? stuckHtml() : '') +
      '</div>' +
      '<p class="label gap-l">Where you stopped</p>' +
      (p.notes.length
        ? '<ul class="stops">' + p.notes.slice(-3).reverse().map(function (n) {
            return '<li><p class="stops__text">' + lines(n.text) + '</p><p class="stops__when">' + esc(ago(n.when)) + '</p></li>';
          }).join('') + '</ul>'
        : '<p class="muted">No notes yet. A line for next time makes starting again much easier.</p>') +
      '<form class="desk__form" data-form="note"><label class="visually-hidden" for="stop-note">A note for next time</label>' +
        '<textarea class="textarea textarea--hand" id="stop-note" name="text" rows="2" placeholder="I stopped at… Next time, start with…" required></textarea>' +
        '<button class="btn btn--line" type="submit">Leave a note for next time</button></form>' +
      (mine.length
        ? '<p class="label gap-l">Recently done</p><ul class="donelist">' + mine.map(function (d) {
            return '<li><s>' + esc(d.text) + '</s> <span>' + esc(ago(d.when)) + '</span></li>';
          }).join('') + '</ul>'
        : '') +
      (others.length
        ? '<p class="label gap-l">Also on the bench</p><ul class="bench">' + others.map(function (o) {
            return '<li><div><p class="bench__title">' + esc(o.title) + '</p>' + (o.next ? '<p class="bench__next">Next: ' + esc(split(o.next)[0]) + '</p>' : '') + '</div>' +
              '<div class="bench__acts"><button type="button" class="btn btn--line" data-act="switch" data-id="' + esc(o.id) + '">Work on this</button>' +
              '<button type="button" class="btn btn--text" data-act="put-away" data-id="' + esc(o.id) + '">Put away</button></div></li>';
          }).join('') + '</ul>'
        : '') +
      '<p class="gap-s"><button type="button" class="btn btn--text" data-act="put-away" data-id="' + esc(p.id) + '">Put this project away</button></p>' +
      newProject + benchAway(away) +
    '</section>';
  }
  function benchAway(away) {
    if (!away.length) return '';
    return '<details class="gap-s"><summary class="desk__summary">Put away (' + away.length + ')</summary><ul class="bench">' + away.map(function (o) {
      return '<li><div><p class="bench__title">' + esc(o.title) + '</p></div><div class="bench__acts"><button type="button" class="btn btn--line" data-act="bring-back" data-id="' + esc(o.id) + '">Bring it back</button></div></li>';
    }).join('') + '</ul></details>';
  }

  /* Choose: a few honest suggestions for the energy and time you have. */
  function picksFor(energy, time) {
    var all = [];
    function add(c) { if (c.e.indexOf(energy) !== -1 && c.t.indexOf(time) !== -1) all.push(c); }
    var LOW = ['low'], SOME = ['some'], MOST = ['some', 'plenty'], ANY = ['low', 'some', 'plenty'];
    var p = current();
    if (p) {
      var head = split(p.next)[0];
      var mins = time === 60 ? 50 : 25;
      if (p.next) add({ key: 'p-now', kind: 'Project', title: head, sub: p.title, e: MOST, t: [30, 60], w: 6, begin: { type: 'session', minutes: mins, project: p.id }, label: 'Start ' + mins + ' minutes' });
      add({ key: 'p-five', kind: 'Project', title: 'Five minutes on ' + p.title, sub: 'Open it and read where you stopped. Starting is most of it.', e: ANY, t: [5], w: 6, begin: { type: 'session', minutes: 5, project: p.id }, label: 'Start 5 minutes' });
      add({ key: 'p-tidy', kind: 'Project', title: 'Small jobs on ' + p.title, sub: 'Rename files, sort notes, or write tomorrow\'s first step.', e: LOW, t: [30, 60], w: 3, begin: { type: 'session', minutes: 15, project: p.id }, label: 'Start 15 minutes' });
    }
    active().forEach(function (o) {
      if (o === p) return;
      add({ key: 'p-' + o.id, kind: 'Project', title: 'An hour on ' + o.title, sub: o.next ? 'Next: ' + split(o.next)[0] : 'Start by writing its next step.', e: ['plenty'], t: [60], w: 2, begin: { type: 'session', minutes: 50, project: o.id }, label: 'Start 50 minutes' });
    });
    reading.forEach(function (b) {
      add({ key: 'r-' + b.id, kind: 'Reading', title: 'Read: ' + b.title, sub: b.by + ' · pick up where the bookmark is', e: ['low', 'some'], t: [30, 60], w: 4, begin: { type: 'session', minutes: time, label: 'Reading ' + b.title }, label: 'Read for ' + (time === 60 ? 'an hour' : 'half an hour') });
    });
    var r = rng(dayNumber() * 31 + 7);
    var a = waiting.slice().sort(function () { return r() - 0.5; }).slice(0, 2);
    a.forEach(function (b) {
      add({ key: 'a-' + b.id, kind: 'Reading', title: 'Start a book you chose: ' + b.title, sub: b.by + ' · from your antilibrary', e: SOME, t: [30, 60], w: 1, begin: { type: 'link', url: b.link }, label: 'Look it up' });
    });
    questions().forEach(function (q, i) {
      add({ key: 'q-' + i, kind: 'Curiosity', title: q, sub: 'Think it through, then write a few lines.', e: MOST, t: [5, 30], w: 2, begin: { type: 'capture', kind: 'thought', prefill: q + '\n\n' }, label: 'Write about it' });
    });
    add({ key: 'w-note', kind: 'Writing', title: 'Write a field note', sub: 'What did you learn this week, and what surprised you?', e: MOST, t: [30, 60], w: 2, begin: { type: 'capture', kind: 'thought', prefill: 'Field note: ' }, label: 'Start writing' });
    if (state.inbox.length) {
      add({ key: 'i-sort', kind: 'Inbox', title: 'Sort what you captured', sub: plural(state.inbox.length, 'thing is', 'things are') + ' waiting. Turn one into a next step.', e: ['low', 'some'], t: [5, 30], w: 3, begin: { type: 'view', view: 'capture' }, label: 'Open the inbox' });
    }
    state.chosen.forEach(function (c) {
      add({ key: 'c-' + c.id, kind: 'Rest', title: 'Enjoy something you chose: ' + c.title, sub: (c.kind || 'Saved') + ' · you picked it, so no guilt.', e: LOW, t: [30, 60], w: 3, begin: c.link ? { type: 'link', url: c.link } : { type: 'view', view: 'unwind' }, label: c.link ? 'Open it' : 'Go to Unwind' });
    });
    add({ key: 'b', kind: 'Rest', title: 'Breathe for two minutes', sub: 'Slowly in, more slowly out.', e: ['low', 'some'], t: [5], w: 3, begin: { type: 'breathe' }, label: 'Begin' });
    add({ key: 'dump', kind: 'Capture', title: 'Empty your head', sub: 'Write down whatever is nagging at you, then let it go.', e: ['low', 'some'], t: [5], w: 2, begin: { type: 'capture', kind: 'thought', prefill: '' }, label: 'Start writing' });

    // Continuing comes first when there's the energy for it; then one weighted pick; then always a way off the screen.
    var pick = rng(dayNumber() * 1000 + ui.shuffle * 97 + (energy.length * 13) + time);
    var chosen = [];
    var pool = all.slice();
    var lead = pool.filter(function (c) { return c.key === 'p-now' || c.key === 'p-five'; })[0];
    if (lead && ui.shuffle === 0) { chosen.push(lead); pool.splice(pool.indexOf(lead), 1); }
    while (chosen.length < 2 && pool.length) {
      var total = pool.reduce(function (s, c) { return s + c.w; }, 0);
      var x = pick() * total;
      for (var i = 0; i < pool.length; i++) {
        x -= pool[i].w;
        if (x <= 0) { chosen.push(pool.splice(i, 1)[0]); break; }
      }
    }
    var off = state.offline.length ? state.offline[Math.floor(pick() * state.offline.length)] : '';
    if (time === 5) off = 'Stand up, stretch and look out of a window';
    if (off) chosen.push({ key: 'o', kind: 'Off the screen', title: off, sub: 'The desk will keep your place.', begin: { type: 'leave', item: off }, label: 'Go' });
    return chosen;
  }
  function dayNumber() { return Math.floor((now() - new Date().getTimezoneOffset() * 60000) / 86400000); }

  function chooseHtml() {
    var E = [['low', 'Low'], ['some', 'Some'], ['plenty', 'Plenty']];
    var T = [[5, '5 minutes'], [30, 'Half an hour'], [60, 'An hour or more']];
    ui.picks = picksFor(ui.energy, ui.time);
    return '<section class="panel" aria-labelledby="panel-title">' +
      '<p class="label">Choose</p>' +
      '<h2 class="hand-l" id="panel-title">Find something meaningful</h2>' +
      '<p class="lede">Say how you are, and the desk will suggest a few ways to spend the time.</p>' +
      '<div class="choose__ask">' +
        '<div><p class="field-label">Energy</p><div class="lib-chips" role="group" aria-label="Energy">' + E.map(function (e) {
          return '<button type="button" class="lib-chip" data-act="energy" data-v="' + e[0] + '" aria-pressed="' + (ui.energy === e[0]) + '">' + e[1] + '</button>';
        }).join('') + '</div></div>' +
        '<div><p class="field-label">Time</p><div class="lib-chips" role="group" aria-label="Time">' + T.map(function (t) {
          return '<button type="button" class="lib-chip" data-act="time" data-v="' + t[0] + '" aria-pressed="' + (ui.time === t[0]) + '">' + t[1] + '</button>';
        }).join('') + '</div></div>' +
      '</div>' +
      '<ul class="picks" aria-live="polite">' + ui.picks.map(function (c, i) {
        return '<li class="pick' + (c.key === 'o' ? ' pick--off' : '') + '"><p class="pick__kind">' + esc(c.kind) + '</p>' +
          '<p class="pick__title">' + esc(c.title) + '</p><p class="pick__sub">' + esc(c.sub) + '</p>' +
          '<button type="button" class="btn ' + (i === 0 ? '' : 'btn--line') + '" data-act="begin" data-i="' + i + '">' + esc(c.label) + '</button></li>';
      }).join('') + '</ul>' +
      '<p class="gap-s"><button type="button" class="btn btn--text" data-act="reshuffle">Show me others</button></p>' +
    '</section>';
  }

  var KINDS = [['thought', 'Thought'], ['idea', 'Idea'], ['question', 'Question'], ['later', 'To read or watch']];
  function kindName(k) { for (var i = 0; i < KINDS.length; i++) if (KINDS[i][0] === k) return KINDS[i][1]; return 'Note'; }
  function captureHtml() {
    var p = current();
    var items = state.inbox.slice().reverse();
    var pre = ui.prefill;
    ui.prefill = '';
    return '<section class="panel" aria-labelledby="panel-title">' +
      '<p class="label">Capture</p>' +
      '<h2 class="hand-l" id="panel-title">Get it out of your head</h2>' +
      '<form class="capture" data-form="capture">' +
        '<label class="visually-hidden" for="capture-text">What\'s on your mind?</label>' +
        '<textarea class="textarea textarea--hand" id="capture-text" name="text" rows="3" placeholder="What\'s on your mind?" required>' + esc(pre) + '</textarea>' +
        '<div class="capture__bar"><div class="lib-chips" role="group" aria-label="What is it?">' + KINDS.map(function (k) {
          return '<button type="button" class="lib-chip" data-act="kind" data-v="' + k[0] + '" aria-pressed="' + (ui.kind === k[0]) + '">' + esc(k[1]) + '</button>';
        }).join('') + '</div><button class="btn" type="submit">Keep it</button></div>' +
        '<p class="note-mono">' + (ui.kind === 'later' ? 'Goes to Unwind, with the things you chose on purpose.' : 'Ctrl + Enter keeps it too.') + '</p>' +
      '</form>' +
      (items.length
        ? '<ul class="inbox">' + items.map(function (it) {
            return '<li class="inbox__item"><p class="inbox__kind">' + esc(kindName(it.kind)) + ' · ' + esc(ago(it.when)) + '</p>' +
              '<p class="inbox__text">' + lines(it.text) + '</p>' +
              '<div class="inbox__acts">' +
                (p ? '<button type="button" class="btn btn--text" data-act="to-next" data-id="' + esc(it.id) + '">Make it the next step</button>' : '') +
                '<button type="button" class="btn btn--text" data-act="copy" data-id="' + esc(it.id) + '">Copy</button>' +
                '<button type="button" class="btn btn--text" data-act="let-go" data-id="' + esc(it.id) + '">Let it go</button>' +
              '</div></li>';
          }).join('') + '</ul>'
        : '<p class="muted gap-m">Whatever is on your mind can wait here, out of your head.</p>') +
    '</section>';
  }

  function unwindHtml() {
    var r = rng(dayNumber() * 17 + 3);
    var book = waiting.length ? waiting[Math.floor(r() * waiting.length)] : null;
    var KIND = ['Film', 'Show', 'Music', 'Video', 'Book', 'Podcast', 'Other'];
    return '<section class="panel" aria-labelledby="panel-title">' +
      '<p class="label">Unwind</p>' +
      '<h2 class="hand-l" id="panel-title">Rest with intention</h2>' +
      '<p class="lede">Things you chose on purpose, instead of a feed. And sometimes, nothing on a screen at all.</p>' +
      '<div class="unwind">' +
        '<div class="unwind__col">' +
          '<p class="label">Something you chose</p>' +
          (state.chosen.length
            ? '<ul class="chosen">' + state.chosen.map(function (c) {
                var url = safeUrl(c.link);
                return '<li><p class="chosen__kind">' + esc(c.kind || 'Saved') + '</p><p class="chosen__title">' + esc(c.title) + '</p>' +
                  '<p class="chosen__acts">' + (url ? '<a class="btn btn--line" href="' + esc(url) + '" target="_blank" rel="noopener">Open it</a>' : '') +
                  '<button type="button" class="btn btn--text" data-act="chosen-done" data-id="' + esc(c.id) + '">Enjoyed it</button></p></li>';
              }).join('') + '</ul>'
            : '<p class="muted">Nothing saved yet. When a film, a talk or an album is worth your evening, keep it here.</p>') +
          '<form class="desk__form" data-form="chosen">' +
            '<label class="field-label" for="ch-title">Save something for later</label>' +
            '<input class="input" id="ch-title" name="title" autocomplete="off" placeholder="Title" required>' +
            '<div class="desk__row"><label class="visually-hidden" for="ch-kind">Kind</label><select class="lib-select" id="ch-kind" name="kind">' + KIND.map(function (k) { return '<option>' + k + '</option>'; }).join('') + '</select>' +
            '<label class="visually-hidden" for="ch-link">Link (optional)</label><input class="input" id="ch-link" name="link" autocomplete="off" inputmode="url" placeholder="Link (optional)"></div>' +
            '<button class="btn btn--line" type="submit">Save it</button>' +
          '</form>' +
          (book ? '<p class="unwind__book">Or a book from your antilibrary: <a class="ink-link" href="' + esc(book.link) + '" target="_blank" rel="noopener">' + esc(book.title) + '</a>, ' + esc(book.by) + '.</p>' : '') +
        '</div>' +
        '<div class="unwind__col">' +
          '<p class="label">A pause</p>' +
          '<p class="prose">Two minutes of slow breathing, before the next thing.</p>' +
          '<div class="actions"><button type="button" class="btn btn--line" data-act="breathe">Breathe for two minutes</button></div>' +
          '<p class="label gap-l">Leave the screen</p>' +
          '<ul class="offline">' + state.offline.map(function (o, i) {
            return '<li><span>' + esc(o) + '</span><button type="button" class="offline__x" data-act="offline-x" data-i="' + i + '" aria-label="Remove ' + esc(o) + '">×</button></li>';
          }).join('') + '</ul>' +
          '<form class="desk__row desk__form--inline" data-form="offline"><label class="visually-hidden" for="off-new">Another thing to do away from screens</label>' +
            '<input class="input" id="off-new" name="text" autocomplete="off" placeholder="Something else away from screens" required><button class="btn btn--line" type="submit">Add</button></form>' +
          '<div class="actions"><button type="button" class="btn" data-act="leave">Leave the screen</button></div>' +
        '</div>' +
      '</div>' +
    '</section>';
  }

  function doorsHtml() {
    return '<nav class="doors" aria-labelledby="doors-title">' +
      '<p class="label" id="doors-title">Doors</p>' +
      '<ul class="doors__list">' + state.doors.map(function (d, i) {
        var url = safeUrl(d.url);
        if (!url) return '';
        var outside = /^https?:/i.test(url);
        return '<li><a class="door" href="' + esc(url) + '"' + (outside ? ' target="_blank" rel="noopener"' : '') + '>' + esc(d.title) + '</a>' +
          (ui.editDoors ? '<button type="button" class="offline__x" data-act="door-x" data-i="' + i + '" aria-label="Remove ' + esc(d.title) + '">×</button>' : '') + '</li>';
      }).join('') + '</ul>' +
      (ui.editDoors
        ? '<form class="desk__row desk__form--inline" data-form="door"><label class="visually-hidden" for="door-title">Name</label><input class="input" id="door-title" name="title" autocomplete="off" placeholder="Name" required>' +
          '<label class="visually-hidden" for="door-url">Address</label><input class="input" id="door-url" name="url" autocomplete="off" inputmode="url" placeholder="https://…" required><button class="btn btn--line" type="submit">Add</button></form>'
        : '') +
      '<p><button type="button" class="btn btn--text" data-act="edit-doors">' + (ui.editDoors ? 'Done' : 'Change the doors') + '</button></p>' +
    '</nav>';
  }

  function footHtml() {
    return '<footer class="desk__foot">' +
      (memoryOnly ? '<p class="desk__warn">This browser isn\'t keeping anything right now (a private window, perhaps). Download a backup before you close it.</p>' : '') +
      '<p>Everything you write here stays in this browser, on this device. Nothing is sent anywhere.</p>' +
      '<p class="desk__keep"><button type="button" class="btn btn--text" data-act="backup">Download a backup</button>' +
      '<label class="btn btn--text desk__restore">Restore a backup<input type="file" accept="application/json,.json" data-act="restore"></label></p>' +
    '</footer>';
  }

  function slotHtml() {
    if (ui.view === 'continue') return continueHtml();
    if (ui.view === 'choose') return chooseHtml();
    if (ui.view === 'capture') return captureHtml();
    if (ui.view === 'unwind') return unwindHtml();
    return leftOffHtml();
  }

  function render(focusSel) {
    root.innerHTML = topHtml() + '<div class="desk__slot" id="slot">' + slotHtml() + '</div>' + doorsHtml() + footHtml();
    if (focusSel) {
      var el = $(focusSel, root);
      if (el) { el.focus(); if (el.setSelectionRange && el.value) el.setSelectionRange(el.value.length, el.value.length); }
    }
  }

  /* ------------------------------------------------------------
     A word at the bottom of the screen, with a way back
     ------------------------------------------------------------ */

  var toast = document.createElement('div');
  toast.className = 'desk-toast';
  toast.setAttribute('role', 'status');
  toast.hidden = true;
  document.body.appendChild(toast);
  var toastTimer = null;
  var undo = null;
  function say(text, undoFn) {
    undo = undoFn || null;
    toast.innerHTML = '<span>' + esc(text) + '</span>' + (undo ? '<button type="button" class="btn btn--text" data-toast="undo">Undo</button>' : '');
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.hidden = true; undo = null; }, 6000);
  }
  toast.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('[data-toast="undo"]') && undo) {
      var fn = undo;
      undo = null;
      toast.hidden = true;
      fn();
      save();
      render();
    }
  });

  /* ------------------------------------------------------------
     Focus sessions: a quiet timer, then a note for next time
     ------------------------------------------------------------ */

  function dialog(cls) {
    var d = document.createElement('dialog');
    d.className = 'desk-dialog ' + cls;
    document.body.appendChild(d);
    return d;
  }
  var sessionBox = dialog('desk-dialog--session');
  var breatheBox = dialog('desk-dialog--breathe');
  var leaveBox = dialog('desk-dialog--leave');
  function open(d) { if (typeof d.showModal === 'function') { if (!d.open) d.showModal(); } else d.setAttribute('open', ''); }
  function shut(d) { if (d.open && typeof d.close === 'function') d.close(); else d.removeAttribute('open'); }

  var run = null;
  var baseTitle = document.title;
  function clock(sec) { return Math.floor(sec / 60) + ':' + pad2(sec % 60); }
  function startSession(minutes, label, projectId) {
    var p = projectId ? project(projectId) : null;
    if (p) {
      state.current = p.id;
      p.touched = now();
      save();
    }
    if (run && run.timer) clearInterval(run.timer);
    run = { label: label || (p ? split(p.next)[0] || p.title : 'Focus'), project: p ? p.id : '', ends: now() + minutes * 60000, timer: null };
    paintSession();
    open(sessionBox);
    run.timer = setInterval(tick, 1000);
    tick();
  }
  function paintSession() {
    var p = run.project ? project(run.project) : null;
    sessionBox.innerHTML =
      '<div class="desk-dialog__paper">' +
        '<p class="label">' + (p ? esc(p.title) : 'Now') + '</p>' +
        '<p class="session__task">' + esc(run.label) + '</p>' +
        '<p class="session__clock" id="session-clock" aria-hidden="true"></p>' +
        '<p class="visually-hidden" id="session-status" aria-live="polite"></p>' +
        '<div class="actions"><button type="button" class="btn btn--line" data-s="more">Five more minutes</button><button type="button" class="btn btn--text" data-s="stop">Stop here</button></div>' +
      '</div>';
  }
  function tick() {
    if (!run) return;
    var left = Math.max(0, Math.round((run.ends - now()) / 1000));
    var el = $('#session-clock', sessionBox);
    if (el) el.textContent = clock(left);
    document.title = clock(left) + ' · ' + baseTitle;
    if (left % 60 === 0) {
      var st = $('#session-status', sessionBox);
      if (st) st.textContent = left ? plural(left / 60, 'minute', 'minutes') + ' left' : '';
    }
    if (left === 0) endSession(true);
  }
  function chime() {
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      var ac = new AC();
      var o = ac.createOscillator();
      var g = ac.createGain();
      o.type = 'sine';
      o.frequency.value = 660;
      g.gain.setValueAtTime(0.0001, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.08, ac.currentTime + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 1.6);
      o.connect(g);
      g.connect(ac.destination);
      o.start();
      o.stop(ac.currentTime + 1.7);
    } catch (e) { /* no sound, no matter */ }
  }
  function endSession(timeUp) {
    if (!run) return;
    clearInterval(run.timer);
    run.timer = null;
    document.title = baseTitle;
    if (timeUp) chime();
    var p = run.project ? project(run.project) : null;
    sessionBox.innerHTML =
      '<div class="desk-dialog__paper">' +
        '<p class="label">' + (timeUp ? 'Time' : 'Stopped') + '</p>' +
        '<p class="session__task">' + (timeUp ? 'That\'s the time you set.' : 'A good place to stop.') + '</p>' +
        (p
          ? '<form class="desk__form" data-s-form="note"><label class="field-label" for="session-note">Where did you stop? Future you will thank you.</label>' +
            '<textarea class="textarea textarea--hand" id="session-note" name="text" rows="2" placeholder="I stopped at… Next time, start with…"></textarea>' +
            '<div class="actions"><button class="btn" type="submit">Save and close</button><button type="button" class="btn btn--line" data-s="more">Five more minutes</button><button type="button" class="btn btn--text" data-s="close">Close</button></div></form>'
          : '<div class="actions"><button type="button" class="btn" data-s="close">Close</button><button type="button" class="btn btn--line" data-s="more">Five more minutes</button></div>') +
      '</div>';
    var ta = $('#session-note', sessionBox);
    if (ta) ta.focus();
  }
  sessionBox.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('[data-s]') : null;
    if (!b || !run) return;
    var what = b.getAttribute('data-s');
    if (what === 'more') {
      run.ends = Math.max(run.ends, now()) + 5 * 60000;
      if (!run.timer) { paintSession(); run.timer = setInterval(tick, 1000); }
      tick();
    } else if (what === 'stop') {
      endSession(false);
    } else if (what === 'close') {
      closeSession();
    }
  });
  sessionBox.addEventListener('submit', function (e) {
    e.preventDefault();
    var text = String(new FormData(e.target).get('text') || '').trim();
    var p = run && run.project ? project(run.project) : null;
    if (p && text) { p.notes.push({ when: now(), text: text }); save(); }
    closeSession();
    if (p && text) say('Saved for next time.');
  });
  // Esc stops the clock first (so there's a chance to leave a note); a second Esc closes.
  sessionBox.addEventListener('cancel', function (e) { if (run && run.timer) { e.preventDefault(); endSession(false); } });
  sessionBox.addEventListener('close', function () {
    if (!run) return;
    if (run.timer) clearInterval(run.timer);
    run = null;
    document.title = baseTitle;
    render();
  });
  function closeSession() {
    if (run && run.timer) clearInterval(run.timer);
    run = null;
    document.title = baseTitle;
    shut(sessionBox);
    render();
  }

  /* Two minutes of breathing: in for four, out for six. */
  var breath = null;
  function breathe() {
    breatheBox.innerHTML =
      '<div class="desk-dialog__paper breathe">' +
        '<div class="breathe__circle" aria-hidden="true"></div>' +
        '<p class="breathe__word" id="breathe-word" aria-live="polite">Breathe in</p>' +
        '<p class="breathe__left" id="breathe-left"></p>' +
        '<div class="actions"><button type="button" class="btn btn--text" data-b="stop">Stop</button></div>' +
      '</div>';
    open(breatheBox);
    var start = now();
    var LEN = 120000;
    function step() {
      var t = now() - start;
      if (t >= LEN) {
        $('#breathe-word', breatheBox).textContent = 'That\'s two minutes.';
        $('#breathe-left', breatheBox).textContent = '';
        breatheBox.querySelector('.breathe__circle').classList.remove('is-on');
        clearInterval(breath);
        breath = null;
        return;
      }
      var phase = (t % 10000) < 4000 ? 'Breathe in' : 'Breathe out';
      var w = $('#breathe-word', breatheBox);
      if (w && w.textContent !== phase) w.textContent = phase;
      var left = Math.ceil((LEN - t) / 1000);
      $('#breathe-left', breatheBox).textContent = clock(left);
    }
    breatheBox.querySelector('.breathe__circle').classList.add('is-on');
    if (breath) clearInterval(breath);
    breath = setInterval(step, 250);
    step();
  }
  function stopBreathing() { if (breath) clearInterval(breath); breath = null; shut(breatheBox); }
  breatheBox.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('[data-b="stop"]')) stopBreathing(); });
  breatheBox.addEventListener('close', function () { if (breath) clearInterval(breath); breath = null; });

  /* Leave the screen: one suggestion, and a place kept for you. */
  function leave(item) {
    var ideas = state.offline.length ? state.offline : ['A walk outside'];
    var pickOne = item || ideas[Math.floor(Math.random() * ideas.length)];
    leaveBox.innerHTML =
      '<div class="desk-dialog__paper leave">' +
        '<p class="label">Leave the screen</p>' +
        '<p class="leave__what">' + esc(pickOne) + '</p>' +
        '<p class="prose">The desk will keep your place. Nothing here needs you for a while.</p>' +
        '<div class="actions"><button type="button" class="btn" data-l="back">I\'m back</button><button type="button" class="btn btn--text" data-l="other">Something else</button></div>' +
      '</div>';
    open(leaveBox);
  }
  leaveBox.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('[data-l]') : null;
    if (!b) return;
    if (b.getAttribute('data-l') === 'back') shut(leaveBox);
    else leave();
  });

  /* ------------------------------------------------------------
     Doing things
     ------------------------------------------------------------ */

  function go(view, after) {
    ui.stuck = false;
    ui.why = '';
    ui.editingNext = false;
    ui.doneFlow = false;
    if (location.hash.replace('#', '') === view) { ui.view = view; render(after); slotIntoView(); return; }
    pendingFocus = after || '';
    location.hash = view;
  }
  var pendingFocus = '';
  function slotIntoView() {
    var slot = $('#slot', root);
    if (!slot || ui.view === 'home') return;
    var r = slot.getBoundingClientRect();
    if (r.top > window.innerHeight * 0.6 || r.top < 0) {
      try { slot.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' }); } catch (e) { slot.scrollIntoView(); }
    }
  }
  window.addEventListener('hashchange', function () {
    ui.view = viewFromHash();
    if (ui.view !== 'continue') { ui.stuck = false; ui.why = ''; }
    render(pendingFocus);
    pendingFocus = '';
    slotIntoView();
  });

  function begin(c) {
    var b = c.begin || {};
    if (b.type === 'session') startSession(b.minutes, b.label, b.project);
    else if (b.type === 'capture') { ui.kind = b.kind || 'thought'; ui.prefill = b.prefill || ''; go('capture', '#capture-text'); }
    else if (b.type === 'view') go(b.view);
    else if (b.type === 'breathe') breathe();
    else if (b.type === 'leave') leave(b.item);
    else if (b.type === 'link' && safeUrl(b.url)) window.open(safeUrl(b.url), '_blank', 'noopener');
  }

  function finishNext(p, newNext) {
    if (p.next) state.done.push({ when: now(), project: p.id, text: split(p.next)[0] });
    state.done = state.done.slice(-60);
    p.next = newNext;
    p.touched = now();
  }

  root.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-act]') : null;
    if (!t || t.tagName === 'INPUT') return;
    var act = t.getAttribute('data-act');
    var p = current();
    var id = t.getAttribute('data-id');
    switch (act) {
      case 'session':
        if (p) startSession(Number(t.getAttribute('data-min')) || 25, '', p.id);
        else startSession(Number(t.getAttribute('data-min')) || 25, 'Focus', '');
        break;
      case 'stuck':
        ui.stuck = true;
        ui.why = '';
        ui.editingNext = false;
        ui.doneFlow = false;
        if (location.hash !== '#continue') location.hash = 'continue';
        else { render(); slotIntoView(); }
        break;
      case 'why': ui.why = t.getAttribute('data-why'); render('#stuck-next, #stuck-missing'); break;
      case 'lighter': ui.energy = 'low'; go('choose'); break;
      case 'edit-next': ui.editingNext = true; ui.doneFlow = false; render('#next-text'); break;
      case 'cancel-next': ui.editingNext = false; render(); break;
      case 'done': ui.doneFlow = true; ui.editingNext = false; render('#done-next'); break;
      case 'cancel-done': ui.doneFlow = false; render(); break;
      case 'switch':
        var o = project(id);
        if (o) { state.current = o.id; o.touched = now(); save(); ui.stuck = false; render(); window.scrollTo(0, $('#slot', root).offsetTop - 16); }
        break;
      case 'put-away':
        var away = project(id);
        if (!away) break;
        away.archived = true;
        if (state.current === away.id) { var next = active()[0]; state.current = next ? next.id : ''; }
        save();
        render();
        say('Put away: ' + away.title + '.', function () { away.archived = false; state.current = away.id; });
        break;
      case 'bring-back':
        var back = project(id);
        if (back) { back.archived = false; state.current = back.id; save(); render(); }
        break;
      case 'energy': ui.energy = t.getAttribute('data-v'); ui.shuffle = 0; render(); break;
      case 'time': ui.time = Number(t.getAttribute('data-v')); ui.shuffle = 0; render(); break;
      case 'reshuffle': ui.shuffle++; render(); break;
      case 'begin': var c = ui.picks[Number(t.getAttribute('data-i'))]; if (c) begin(c); break;
      case 'kind': ui.kind = t.getAttribute('data-v'); var ta = $('#capture-text', root); ui.prefill = ta ? ta.value : ''; render('#capture-text'); break;
      case 'to-next':
        var it = state.inbox.filter(function (x) { return x.id === id; })[0];
        if (it && p) {
          var old = p.next;
          p.next = it.text; // replacing a step isn't the same as finishing it
          p.touched = now();
          state.inbox = state.inbox.filter(function (x) { return x !== it; });
          save();
          render();
          say('That\'s the next step on ' + p.title + ' now.', function () { p.next = old; state.inbox.push(it); });
        }
        break;
      case 'copy':
        var cp = state.inbox.filter(function (x) { return x.id === id; })[0];
        if (cp) copyText(cp.text);
        break;
      case 'let-go':
        var gone = state.inbox.filter(function (x) { return x.id === id; })[0];
        if (gone) {
          state.inbox = state.inbox.filter(function (x) { return x !== gone; });
          save();
          render();
          say('Let it go.', function () { state.inbox.push(gone); state.inbox.sort(function (a, b) { return a.when - b.when; }); });
        }
        break;
      case 'chosen-done':
        var ch = state.chosen.filter(function (x) { return x.id === id; })[0];
        if (ch) {
          var at = state.chosen.indexOf(ch);
          state.chosen.splice(at, 1);
          save();
          render();
          say('Hope it was good.', function () { state.chosen.splice(at, 0, ch); });
        }
        break;
      case 'offline-x':
        var oi = Number(t.getAttribute('data-i'));
        var ox = state.offline[oi];
        state.offline.splice(oi, 1);
        save();
        render();
        say('Removed.', function () { state.offline.splice(oi, 0, ox); });
        break;
      case 'breathe': breathe(); break;
      case 'leave': leave(); break;
      case 'edit-doors': ui.editDoors = !ui.editDoors; render(ui.editDoors ? '#door-title' : ''); break;
      case 'door-x':
        var di = Number(t.getAttribute('data-i'));
        var dx = state.doors[di];
        state.doors.splice(di, 1);
        save();
        render();
        say('Removed ' + dx.title + '.', function () { state.doors.splice(di, 0, dx); });
        break;
      case 'backup': backup(); break;
    }
  });

  root.addEventListener('change', function (e) {
    var t = e.target;
    var act = t.getAttribute && t.getAttribute('data-act');
    if (act === 'milestone') {
      var p = current();
      var m = p && p.milestones[Number(t.getAttribute('data-i'))];
      if (m) { m.done = t.checked; p.touched = now(); save(); render(); }
    } else if (act === 'restore' && t.files && t.files[0]) {
      restore(t.files[0]);
    }
  });

  root.addEventListener('keydown', function (e) {
    if (e.target.id === 'capture-text' && e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      var form = e.target.form;
      if (form && typeof form.requestSubmit === 'function') form.requestSubmit(); else if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }
  });

  root.addEventListener('submit', function (e) {
    var form = e.target;
    var kind = form.getAttribute('data-form');
    if (!kind) return;
    e.preventDefault();
    var data = new FormData(form);
    function val(name) { return String(data.get(name) || '').trim(); }
    var p = current();
    if (kind === 'capture') {
      var text = val('text');
      if (!text) return;
      if (ui.kind === 'later') {
        state.chosen.push({ id: uid(), title: text, kind: 'Later', link: '' });
        say('Saved to Unwind.');
      } else {
        state.inbox.push({ id: uid(), kind: ui.kind, text: text, when: now() });
        say('Kept.');
      }
      save();
      render('#capture-text');
    } else if (kind === 'next' && p) {
      p.next = val('text');
      p.touched = now();
      ui.editingNext = false;
      save();
      render();
    } else if (kind === 'done' && p) {
      finishNext(p, val('text'));
      ui.doneFlow = false;
      save();
      render();
      say(p.next ? 'Next step saved.' : 'Done. Decide the next step whenever you\'re ready.');
    } else if ((kind === 'stuck-next') && p) {
      p.next = val('text');
      p.touched = now();
      ui.stuck = false;
      ui.why = '';
      save();
      render();
      say('Smaller step saved. Try five minutes on it.');
    } else if (kind === 'stuck-missing') {
      state.inbox.push({ id: uid(), kind: 'question', text: val('text'), when: now() });
      ui.stuck = false;
      ui.why = '';
      save();
      render();
      say('Noted in your inbox.');
    } else if (kind === 'note' && p) {
      var note = val('text');
      if (!note) return;
      p.notes.push({ when: now(), text: note });
      p.notes = p.notes.slice(-30);
      p.touched = now();
      save();
      render();
      say('Saved for next time.');
    } else if (kind === 'project') {
      var title = val('title');
      if (!title) return;
      var np = { id: 'p-' + uid(), seed: '', title: title, link: '', next: val('next'), milestones: [], notes: [], created: now(), touched: now() };
      state.projects.unshift(np);
      state.current = np.id;
      save();
      render();
      say('On the bench: ' + title + '.');
    } else if (kind === 'chosen') {
      var link = val('link');
      if (link && !safeUrl(link)) { say('That link doesn\'t look right. Try one starting with https://'); return; }
      state.chosen.push({ id: uid(), title: val('title'), kind: val('kind') || 'Other', link: safeUrl(link) });
      save();
      render('#ch-title');
    } else if (kind === 'offline') {
      var off = val('text');
      if (off) { state.offline.push(off); save(); render('#off-new'); }
    } else if (kind === 'door') {
      var url = safeUrl(val('url'));
      if (!url) { say('That address doesn\'t look right. Try one starting with https://'); return; }
      state.doors.push({ title: val('title'), url: url });
      save();
      render('#door-title');
    }
  });

  function copyText(text) {
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'absolute';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); say('Copied.'); } catch (e) { say('Couldn\'t copy. Select the text instead.'); }
      document.body.removeChild(ta);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { say('Copied.'); }, fallback);
    else fallback();
  }

  /* Backups: the only way the desk leaves this browser is a file you download. */
  function backup() {
    var d = new Date();
    var file = { app: 'vikas-in-pencil-desk', version: 1, saved: d.toISOString(), state: state };
    var blob = new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'desk-backup-' + d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) + '.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    say('Backup downloaded. Keep it somewhere safe.');
  }
  function restore(file) {
    var reader = new FileReader();
    reader.onload = function () {
      var parsed = null;
      try { parsed = JSON.parse(String(reader.result || '')); } catch (e) { parsed = null; }
      if (!parsed || parsed.app !== 'vikas-in-pencil-desk' || !parsed.state || !Array.isArray(parsed.state.projects)) {
        say('That file isn\'t a desk backup.');
        return;
      }
      if (!window.confirm('Replace what\'s on this desk with the backup from ' + String(parsed.saved || '').slice(0, 10) + '?')) return;
      var before = state;
      state = tidy(parsed.state);
      seedProjects();
      save();
      render();
      say('Backup restored.', function () { state = before; });
    };
    reader.readAsText(file);
  }

  ui.view = viewFromHash();
  render();
  if (ui.view !== 'home') slotIntoView();
})();
