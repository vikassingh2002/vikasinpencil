/* Curiosity Cat: the page (curiosity.html).
   Content: content/curiosity.js · What's next: cat-brain.js · Saving: cat-store.js · Simulations: cat-labs.js
   Routes: #/ home · #d/<id> a discovery · #d/<id>/<variant> a review · #explore · #notes · #tune · #recap
   Old links (desk.html#curiosity/<id>, #curiosity/<id>) are redirected here. */
(function () {
  'use strict';

  var NB = window.NB || {};
  var C = NB.curiosity || { discoveries: [] };
  var Brain = window.CatBrain;
  var Store = window.CatStore;
  var Labs = window.CatLabs || {};
  var app = document.getElementById('cat');
  if (!app || !Brain || !Store) return;
  var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  var ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ESC[c]; }); }
  function list(x) { return Array.isArray(x) ? x : []; }
  function now() { return Date.now(); }
  function S() { return Store.get(); }
  function safeUrl(u) { u = String(u || ''); return /^https?:\/\/[^\s"'<>]+$/i.test(u) ? u : ''; }
  function niceDate(d) {
    var m = /^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?/.exec(String(d || ''));
    if (!m) return '';
    var M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return (m[3] ? Number(m[3]) + ' ' : '') + (m[2] ? M[Number(m[2]) - 1] + ' ' : '') + m[1];
  }
  function shuffle(arr, seed) {
    var a = arr.slice();
    var x = seed || 7;
    for (var i = a.length - 1; i > 0; i--) { x = (x * 9301 + 49297) % 233280; var j = Math.floor(x / 233280 * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    if (a.join('|') === arr.join('|') && a.length > 1) a.push(a.shift()); // never start in the right order
    return a;
  }
  function hash(s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h) + 1; }

  /* ---------- the cat ---------- */
  var CAT = '<svg class="kitty" viewBox="0 0 120 110" aria-hidden="true">' +
    '<path class="kitty__tail" d="M92 92 C 112 88, 116 66, 104 56"/>' +
    '<ellipse class="kitty__body" cx="62" cy="88" rx="30" ry="18"/>' +
    '<g class="kitty__head">' +
      '<path class="kitty__ear kitty__ear--l" d="M30 40 L36 12 L52 30 Z"/>' +
      '<path class="kitty__ear kitty__ear--r" d="M90 40 L84 12 L68 30 Z"/>' +
      '<ellipse class="kitty__face" cx="60" cy="48" rx="32" ry="27"/>' +
      '<g class="kitty__eyes"><ellipse class="kitty__eye" cx="47" cy="46" rx="5" ry="6.5"/><ellipse class="kitty__eye" cx="73" cy="46" rx="5" ry="6.5"/></g>' +
      '<path class="kitty__closed" d="M41 47 q6 4 12 0 M67 47 q6 4 12 0"/>' +
      '<path class="kitty__nose" d="M57 56 h6 l-3 3 z"/>' +
      '<path class="kitty__mouth" d="M60 59 q-4 5 -8 2 M60 59 q4 5 8 2"/>' +
      '<path class="kitty__whisk" d="M22 54 h16 M22 60 l16 -2 M98 54 h-16 M98 60 l-16 -2"/>' +
    '</g></svg>';
  var cat = document.createElement('div');
  cat.className = 'cat-buddy';
  cat.innerHTML = CAT + '<p class="cat-buddy__say" role="status" aria-live="polite"></p>';
  document.body.appendChild(cat);
  var moodTimer = null;
  function mood(m, line) {
    cat.setAttribute('data-mood', m || 'idle');
    var say = cat.querySelector('.cat-buddy__say');
    clearTimeout(moodTimer);
    if (line) { say.textContent = line; cat.classList.add('is-talking'); }
    moodTimer = setTimeout(function () { cat.classList.remove('is-talking'); cat.setAttribute('data-mood', 'idle'); say.textContent = ''; }, line ? 4200 : 2600);
  }

  /* ---------- page state (not saved) ---------- */
  var ui = { route: 'home', id: '', variant: '', pick: null, order: null, many: {}, estimate: null, phase: 'predict', confidence: 0, open: {} };

  function resetDiscovery() { ui.pick = null; ui.order = null; ui.many = {}; ui.estimate = null; ui.phase = 'predict'; ui.confidence = 0; ui.open = {}; }

  function parseRoute() {
    var h = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
    var old = /^curiosity\/?(.*)$/.exec(h); // links from the desk's earlier feed
    if (old) { location.replace('#' + (old[1] ? 'd/' + old[1] : '')); return false; }
    var parts = h.split('/');
    var route = parts[0] || 'home';
    if (route === 'd' && Brain.byId(C, parts[1])) {
      if (ui.route !== 'd' || ui.id !== parts[1] || ui.variant !== (parts[2] || '')) resetDiscovery();
      ui.route = 'd'; ui.id = parts[1]; ui.variant = parts[2] || '';
    } else if (['explore', 'notes', 'tune', 'recap'].indexOf(route) !== -1) { ui.route = route; }
    else if (Brain.byId(C, route)) { location.replace('#d/' + route); return false; }
    else { ui.route = 'home'; }
    return true;
  }

  /* ---------- pieces ---------- */
  function header() {
    var links = [['explore', 'Explore'], ['notes', 'Notes'], ['tune', 'Tune']];
    var m = Store.mode();
    return '<header class="top">' +
      '<a class="top__brand" href="#/" aria-label="Curiosity Cat, home">' + CAT + '<span>Curiosity<em>Cat</em></span></a>' +
      '<nav class="top__nav" aria-label="Curiosity Cat">' + links.map(function (l) {
        return '<a href="#' + l[0] + '"' + (ui.route === l[0] ? ' aria-current="page"' : '') + '>' + l[1] + '</a>';
      }).join('') + '<a class="top__desk" href="desk.html">Desk ↗</a></nav>' +
      '<p class="top__sync">' + (m === 'cloud' ? 'Synced with your desk' : 'Saved in this browser · <a href="desk.html#signin">sign in to sync</a>') + '</p>' +
    '</header>';
  }

  function predictPreview(d, r) {
    var p = d.predict;
    var quick = p.type === 'choice' || p.type === 'conditional';
    var href = '#d/' + d.id + (r && r.variant ? '/' + r.variant.id : '');
    return quick
      ? '<div class="hero__opts">' + p.options.map(function (o, i) {
          return '<a class="opt opt--hero" href="' + href + '" data-quick="' + i + '"><span class="opt__key">' + String.fromCharCode(65 + i) + '</span>' + esc(o.t) + '</a>';
        }).join('') + '</div>'
      : '<a class="cat-btn cat-btn--big" href="' + href + '">' + esc(kindVerb(p.type)) + ' →</a>';
  }
  function kindVerb(t) {
    return { estimate: 'Make your estimate', spot: 'Spot the problem', rank: 'Put them in order', pickmany: 'Choose the ones that matter' }[t] || 'Make your prediction';
  }
  function kindLabel(t) {
    return { choice: 'Predict', conditional: 'It depends?', estimate: 'Estimate', spot: 'Spot it', rank: 'Rank', pickmany: 'Choose several' }[t] || 'Predict';
  }

  function home() {
    var r = Brain.next(S(), C, now(), []);
    var u = Brain.unfinished(S(), C);
    var st = Brain.stats(S(), C);
    var saved = Brain.ordered(C).filter(function (d) { return S().saved[d.id]; });
    var d = r && r.d;
    var item = r && r.variant ? r.variant : d;
    var html = header();
    if (u && (!d || u.id !== d.id)) {
      var stage = S().seen[u.id].stage === 'open' ? 'you hadn\'t predicted yet' : 'the reveal is waiting for you to finish';
      html += '<a class="resume" href="#d/' + esc(u.id) + '"><span class="resume__tag">Unfinished</span><b>' + esc(u.title) + '</b><span>' + stage + '</span><span class="resume__go">Resume →</span></a>';
    }
    if (d) {
      html += '<section class="hero" aria-labelledby="hero-title">' +
        '<p class="hero__why"><span class="chip chip--' + esc(r.kind) + '">' + esc(kindLabel(item.predict.type)) + '</span>' + esc(r.reason) + '</p>' +
        '<h1 class="hero__title" id="hero-title">' + esc(item.title || d.title) + '</h1>' +
        '<p class="hero__hook">' + esc(item.hook) + '</p>' +
        '<p class="hero__ask">' + esc(item.predict.prompt) + '</p>' +
        predictPreview(d, r) +
        '<div class="hero__ways">' +
          '<a class="cat-btn" href="#d/' + esc(d.id) + (r.variant ? '/' + esc(r.variant.id) : '') + '" data-session="quick">Quick discovery · ' + (d.minutes || 3) + ' min</a>' +
          '<button type="button" class="cat-btn cat-btn--quiet" data-act="deep">Deeper session · 3 discoveries</button>' +
        '</div>' +
      '</section>';
    } else {
      html += '<section class="hero"><h1 class="hero__title">Nothing here yet.</h1></section>';
    }
    html += '<section class="map" aria-labelledby="map-title"><h2 class="sec" id="map-title">Your map</h2>' +
      '<p class="map__sum">' + st.discovered + ' of ' + st.total + ' discoveries · ' + st.labsDone + ' of ' + st.labsTotal + ' experiments run · ' + st.notes + (st.notes === 1 ? ' note' : ' notes') + '</p>' +
      '<ul class="map__list">' + st.concepts.map(function (c) {
        var cls = c.done === c.total ? 'is-full' : c.done ? 'is-some' : '';
        return '<li class="map__node ' + cls + '"><span class="map__dot" aria-hidden="true"></span>' + esc(c.name) + '<span class="map__n">' + c.done + '/' + c.total + '</span></li>';
      }).join('') + '</ul></section>';
    if (saved.length) {
      html += '<section aria-labelledby="saved-title"><h2 class="sec" id="saved-title">Saved</h2><ul class="cards">' + saved.map(card).join('') + '</ul></section>';
    }
    return html;
  }

  function card(d) {
    var s = S().seen[d.id];
    var state = !s ? 'New' : s.stage === 'done' ? (s.correct === false ? 'Surprised you' : 'Discovered') : 'In progress';
    return '<li><a class="card" href="#d/' + esc(d.id) + '"><span class="card__concept">' + esc(Brain.conceptName(C, d.concept)) + '</span>' +
      '<span class="card__title">' + esc(d.title) + '</span><span class="card__meta">' + esc(kindLabel(d.predict.type)) + ' · ' + (d.minutes || 3) + ' min · ' + state +
      (d.lab ? ' · has a simulation' : '') + '</span></a></li>';
  }

  function explore() {
    var groups = Brain.concepts(C).map(function (c) {
      return { c: c, ds: Brain.ordered(C).filter(function (d) { return (d.concept || 'other') === c.id; }) };
    }).filter(function (g) { return g.ds.length; });
    return header() + '<section class="page"><h1 class="page__title">Explore</h1><p class="page__lede">The suggested path runs top to bottom, but open anything. Nothing is locked.</p>' +
      groups.map(function (g) { return '<h2 class="sec">' + esc(g.c.name) + '</h2><ul class="cards">' + g.ds.map(card).join('') + '</ul>'; }).join('') + '</section>';
  }

  function notesPage() {
    var withNotes = Brain.ordered(C).filter(function (d) { return list(S().notes[d.id]).length; });
    return header() + '<section class="page"><h1 class="page__title">What you noticed</h1>' +
      '<p class="page__lede">Notes from your experiments. They\'re yours: kept with your progress, never shared.</p>' +
      (withNotes.length ? withNotes.map(function (d) {
        return '<article class="notecard"><a class="notecard__title" href="#d/' + esc(d.id) + '">' + esc(d.title) + '</a>' +
          list(S().notes[d.id]).map(function (n) { return '<p class="notecard__text">' + esc(n.text) + '<span>' + new Date(n.at).toLocaleDateString() + '</span></p>'; }).join('') + '</article>';
      }).join('') : '<p class="empty">No notes yet. Each discovery has an experiment with a place to write what you noticed.</p>') + '</section>';
  }

  function tune() {
    var st = Brain.stats(S(), C);
    return header() + '<section class="page"><h1 class="page__title">Tune what comes next</h1>' +
      '<p class="page__lede">How the next discovery is chosen: first, ideas that are due back (a new scenario, sooner if you were unsure or surprised); then more of what you asked for; then something related to what you just did; then the next step on the path. Ideas you already know are skipped; ideas you want less of come last.</p>' +
      '<ul class="tune">' + st.concepts.map(function (c) {
        return '<li class="tune__row"><span class="tune__name">' + esc(c.name) + '<small>' + c.done + ' of ' + c.total + ' discovered</small></span>' +
          '<span class="seg" role="group" aria-label="' + esc(c.name) + '">' + [['', 'Normal'], ['more', 'More'], ['less', 'Less'], ['known', 'Know it']].map(function (p) {
            return '<button type="button" data-act="pref" data-c="' + esc(c.id) + '" data-v="' + p[0] + '" aria-pressed="' + (c.pref === p[0]) + '">' + p[1] + '</button>';
          }).join('') + '</span></li>';
      }).join('') + '</ul>' +
      '<p class="page__lede"><button type="button" class="cat-btn cat-btn--quiet" data-act="reset-prefs">Reset to normal</button></p></section>';
  }

  /* ---------- a discovery ---------- */
  function predictHtml(d, item) {
    var p = item.predict;
    var locked = ui.phase !== 'predict';
    if (p.type === 'choice' || p.type === 'conditional') {
      return '<div class="opts" role="group" aria-label="Your prediction">' + p.options.map(function (o, i) {
        var cls = 'opt' + (ui.pick === i ? ' is-picked' : '') + (locked && i === p.answer ? ' is-right' : '') + (locked && ui.pick === i && i !== p.answer ? ' is-wrong' : '');
        return '<button type="button" class="' + cls + '" data-act="pick" data-i="' + i + '" aria-pressed="' + (ui.pick === i) + '"' + (locked ? ' aria-disabled="true"' : '') + '>' +
          '<span class="opt__key">' + String.fromCharCode(65 + i) + '</span><span>' + esc(o.t) + '</span></button>';
      }).join('') + '</div>';
    }
    if (p.type === 'estimate') {
      var v = ui.estimate === null ? Math.round((p.min + p.max) / 2) : ui.estimate;
      return '<div class="est"><label class="est__label" for="est">Your estimate: <b id="est-v">' + v + esc(p.unit || '') + '</b></label>' +
        '<input type="range" id="est" min="' + p.min + '" max="' + p.max + '" step="' + (p.step || 1) + '" value="' + v + '"' + (locked ? ' disabled' : '') + '>' +
        '<div class="est__scale"><span>' + p.min + esc(p.unit || '') + '</span><span>' + p.max + esc(p.unit || '') + '</span></div>' +
        (locked ? '<div class="est__truth" style="left:' + ((p.answer - p.min) / (p.max - p.min) * 100) + '%"><span>Actual ≈ ' + p.answer + esc(p.unit || '') + '</span></div>' : '') +
        (!locked ? '<button type="button" class="cat-btn" data-act="est-lock">Lock it in</button>' : '') + '</div>';
    }
    if (p.type === 'spot') {
      return '<pre class="spot" role="group" aria-label="Pick the faulty line">' + p.lines.map(function (l, i) {
        var cls = 'spot__line' + (ui.pick === i ? ' is-picked' : '') + (locked && i === p.answer ? ' is-right' : '') + (locked && ui.pick === i && i !== p.answer ? ' is-wrong' : '');
        return '<button type="button" class="' + cls + '" data-act="pick" data-i="' + i + '" aria-pressed="' + (ui.pick === i) + '"' + (locked ? ' aria-disabled="true"' : '') + '>' + esc(l) + '</button>';
      }).join('') + '</pre>';
    }
    if (p.type === 'rank') {
      if (!ui.order) ui.order = shuffle(p.items.map(function (_, i) { return i; }), hash(d.id));
      return '<ol class="rank">' + ui.order.map(function (k, pos) {
        var ok = locked && k === pos;
        return '<li class="rank__item' + (locked ? (ok ? ' is-right' : ' is-wrong') : '') + '"><span class="rank__n">' + (pos + 1) + '</span><span class="rank__t">' + esc(p.items[k]) + '</span>' +
          (locked ? '' : '<span class="rank__btns"><button type="button" class="ico" data-act="rank" data-pos="' + pos + '" data-dir="-1" aria-label="Move up"' + (pos === 0 ? ' disabled' : '') + '>↑</button>' +
            '<button type="button" class="ico" data-act="rank" data-pos="' + pos + '" data-dir="1" aria-label="Move down"' + (pos === ui.order.length - 1 ? ' disabled' : '') + '>↓</button></span>') + '</li>';
      }).join('') + '</ol>' + (!locked ? '<button type="button" class="cat-btn" data-act="lock">Lock in this order</button>' : '');
    }
    if (p.type === 'pickmany') {
      return '<div class="many" role="group" aria-label="Choose all that apply">' + p.options.map(function (o, i) {
        var on = !!ui.many[i];
        var cls = 'many__item' + (on ? ' is-on' : '') + (locked ? (on === !!o.yes ? ' is-right' : ' is-wrong') : '');
        return '<button type="button" class="' + cls + '" data-act="many" data-i="' + i + '" aria-pressed="' + on + '"' + (locked ? ' aria-disabled="true"' : '') + '>' +
          '<span class="many__box" aria-hidden="true">' + (on ? '✓' : '') + '</span>' + esc(o.t) + (locked ? '<small>' + esc(o.why) + '</small>' : '') + '</button>';
      }).join('') + '</div>' + (!locked ? '<button type="button" class="cat-btn" data-act="lock">Lock it in</button>' : '');
    }
    return '';
  }

  function grade(item) {
    var p = item.predict;
    if (p.type === 'choice' || p.type === 'conditional' || p.type === 'spot') return ui.pick === p.answer;
    if (p.type === 'estimate') return Math.abs(ui.estimate - p.answer) <= (p.tolerance || 0);
    if (p.type === 'rank') return ui.order.every(function (k, pos) { return k === pos; });
    if (p.type === 'pickmany') return p.options.every(function (o, i) { return !!ui.many[i] === !!o.yes; });
    return null;
  }
  function ready(item) {
    var p = item.predict;
    if (p.type === 'choice' || p.type === 'conditional' || p.type === 'spot') return ui.pick !== null;
    return true;
  }

  function confidenceHtml() {
    return '<div class="sure" role="group" aria-labelledby="sure-q"><p id="sure-q">How sure are you?</p>' +
      [[1, 'Just guessing'], [2, 'Fairly sure'], [3, 'Certain']].map(function (c) {
        return '<button type="button" class="sure__btn" data-act="sure" data-v="' + c[0] + '">' + c[1] + '</button>';
      }).join('') + '</div>';
  }

  function verdict(item, right) {
    var p = item.predict;
    var conf = ui.confidence;
    var head = right ? (conf === 1 ? 'Right, and now you know why.' : 'Spot on.') : (conf === 3 ? 'Surprising, isn\'t it?' : 'Not quite, and that\'s the interesting part.');
    var detail = '';
    if (p.type === 'choice' || p.type === 'conditional') detail = esc(p.options[ui.pick].why);
    if (p.type === 'spot') detail = esc(p.why);
    if (p.type === 'estimate') detail = 'You said ' + ui.estimate + esc(p.unit || '') + '; the answer is about ' + p.answer + esc(p.unit || '') + '.';
    if (p.type === 'rank') detail = esc(p.why);
    return '<div class="verdict ' + (right ? 'verdict--yes' : 'verdict--no') + '"><p class="verdict__head">' + head + '</p><p class="verdict__detail">' + detail + '</p></div>';
  }

  function fold(key, title, inner) {
    var open = !!ui.open[key];
    return '<section class="fold' + (open ? ' is-open' : '') + '"><h3><button type="button" class="fold__btn" data-act="fold" data-k="' + key + '" aria-expanded="' + open + '">' + esc(title) + '<span aria-hidden="true">' + (open ? '−' : '+') + '</span></button></h3>' +
      (open ? '<div class="fold__body">' + inner + '</div>' : '') + '</section>';
  }

  function discovery() {
    var d = Brain.byId(C, ui.id);
    var v = ui.variant ? list(d.variants).filter(function (x) { return x.id === ui.variant; })[0] : null;
    var item = v || d;
    var s = S().seen[d.id] || {};
    var session = S().session;
    var inSession = session && session.ids.indexOf(d.id) !== -1;
    var revealed = ui.phase === 'reveal';
    var right = revealed ? grade(item) : null;
    var rv = item.reveal || {};
    var html = header() + '<article class="disc' + (revealed ? ' is-revealed' : '') + '" aria-labelledby="disc-title">' +
      '<p class="disc__meta"><span class="chip">' + esc(Brain.conceptName(C, d.concept)) + '</span>' +
        (v ? '<span class="chip chip--review">Back with a new scenario</span>' : '') +
        (inSession ? '<span class="chip chip--session">Session ' + (session.ids.indexOf(d.id) + 1) + ' of ' + session.ids.length + '</span>' : '') +
        '<button type="button" class="heart' + (S().saved[d.id] ? ' is-on' : '') + '" data-act="save" aria-pressed="' + !!S().saved[d.id] + '" aria-label="' + (S().saved[d.id] ? 'Saved' : 'Save') + '">♥</button></p>' +
      '<h1 class="disc__title" id="disc-title">' + esc(v ? d.title : d.title) + '</h1>' +
      '<p class="disc__hook">' + esc(item.hook) + '</p>' +
      '<p class="disc__ask"><span class="chip chip--kind">' + esc(kindLabel(item.predict.type)) + '</span>' + esc(item.predict.prompt) + '</p>' +
      predictHtml(d, item);
    if (ui.phase === 'sure') html += confidenceHtml();
    if (ui.phase === 'predict' && ready(item) && ['choice', 'conditional', 'spot'].indexOf(item.predict.type) !== -1) html += '<button type="button" class="cat-btn" data-act="lock">Lock it in</button>';
    if (revealed) {
      html += verdict(item, right) +
        '<section class="reveal"><p class="reveal__say">' + esc(rv.say) + '</p><p class="reveal__text">' + esc(rv.text) + '</p></section>';
      if (rv.tempting) html += fold('tempting', 'Why the other answers were tempting', '<p>' + esc(rv.tempting) + '</p>');
      if (rv.limits) html += fold('limits', 'Where this explanation has limits', '<p>' + esc(rv.limits) + '</p>');
      if (!v && list(d.deeper).length) html += fold('deeper', 'Go deeper', list(d.deeper).map(function (sec) {
        return '<h4>' + esc(sec.h) + '</h4>' + list(sec.p).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('');
      }).join(''));
      if (!v && d.lab && Labs[d.lab.kind]) {
        html += '<section class="lab" aria-labelledby="lab-title"><p class="lab__kind">Simulation · illustrative, not a live model</p>' +
          '<h2 class="lab__title" id="lab-title">Try it here' + (S().labs[d.id] ? ' <span class="lab__done">✓ explored</span>' : '') + '</h2><div class="lab__body" id="lab-body"></div></section>';
      }
      if (!v && d.experiment) {
        var notes = list(S().notes[d.id]);
        html += '<section class="exp" aria-labelledby="exp-title"><p class="lab__kind">Experiment · with a real chatbot</p><h2 class="lab__title" id="exp-title">Test it for real</h2>' +
          '<dl class="exp__steps"><div><dt>Do</dt><dd>' + esc(d.experiment.task) + '</dd></div><div><dt>Change one thing</dt><dd>' + esc(d.experiment.change) + '</dd></div>' +
          '<div><dt>Compare</dt><dd>' + esc(d.experiment.observe) + '</dd></div></dl>' +
          notes.map(function (n) { return '<p class="exp__note">' + esc(n.text) + '</p>'; }).join('') +
          '<form class="exp__form" data-form="note"><label for="note">What did you notice?</label><textarea id="note" name="note" rows="2" placeholder="The second run stopped after 4 steps, because…"></textarea>' +
          '<button type="submit" class="cat-btn cat-btn--quiet">Save note</button></form></section>';
      }
      if (!v && d.project) html += '<section class="proj"><p class="lab__kind">Your satellite project · <span class="badge">' + esc(d.project.status === 'done' ? 'Done' : 'Planned, not built yet') + '</span></p><p>' + esc(d.project.text) + '</p></section>';
      if (list(d.sources).length) html += '<section class="src"><h2 class="sec">Sources</h2><ul>' + d.sources.map(function (x) {
          var u = safeUrl(x.url);
          return '<li>' + (u ? '<a href="' + esc(u) + '" target="_blank" rel="noopener">' + esc(x.title) + ' ↗</a>' : esc(x.title)) + (x.date ? ' <span>' + esc(niceDate(x.date)) + '</span>' : '') + '</li>';
        }).join('') + '</ul><p class="src__rev">Reviewed ' + esc(niceDate(C.reviewed)) + '. Figures are as reported by their sources.</p></section>';
      html += '<section class="tunebar" aria-label="Tune"><span>This idea:</span>' +
        [['known', 'I already knew this'], ['more', 'More like this'], ['less', 'Less like this']].map(function (p) {
          return '<button type="button" class="pill" data-act="pref" data-c="' + esc(d.concept) + '" data-v="' + p[0] + '" aria-pressed="' + (S().prefs[d.concept] === p[0]) + '">' + p[1] + '</button>';
        }).join('') + '</section>';
      html += nextHtml(d);
    }
    html += '</article>';
    return html;
  }

  function nextHtml(d) {
    var session = S().session;
    if (session && session.ids.indexOf(d.id) !== -1) {
      var i = session.ids.indexOf(d.id);
      if (i < session.ids.length - 1) {
        var n = Brain.byId(C, session.ids[i + 1]);
        return '<a class="next" href="#d/' + esc(n.id) + '" data-act="finish" data-to="d/' + esc(n.id) + '"><span class="next__why">Next in this session</span><b>' + esc(n.title) + '</b><span class="next__go">Continue →</span></a>';
      }
      return '<a class="next" href="#recap" data-act="finish" data-to="recap"><span class="next__why">That was the last one</span><b>See your session recap</b><span class="next__go">Finish →</span></a>';
    }
    var r = Brain.next(S(), C, now(), [d.id]);
    if (!r) return '<a class="next" href="#/" data-act="finish" data-to=""><b>Back home</b></a>';
    return '<a class="next" href="#d/' + esc(r.d.id) + (r.variant ? '/' + esc(r.variant.id) : '') + '" data-act="finish" data-to="d/' + esc(r.d.id) + (r.variant ? '/' + esc(r.variant.id) : '') + '">' +
      '<span class="next__why">' + esc(r.reason) + '</span><b>' + esc(r.d.title) + '</b><span class="next__go">Next discovery →</span></a>' +
      '<p class="stop"><a href="#/" data-act="finish" data-to="">Or stop here. Good place for it.</a></p>';
  }

  function recap() {
    var session = S().session;
    if (!session) return header() + '<section class="page"><h1 class="page__title">No session yet</h1><p class="page__lede"><a href="#/">Start one from home.</a></p></section>';
    var ds = session.ids.map(function (id) { return Brain.byId(C, id); }).filter(Boolean);
    var right = ds.filter(function (d) { return S().seen[d.id] && S().seen[d.id].correct === true; }).length;
    var labs = ds.filter(function (d) { return S().labs[d.id]; }).length;
    var notes = ds.filter(function (d) { return list(S().notes[d.id]).length; }).length;
    var r = Brain.next(S(), C, now(), session.ids);
    return header() + '<section class="page recap"><p class="recap__kicker">Session complete</p><h1 class="page__title">A good place to stop.</h1>' +
      '<ul class="recap__list">' + ds.map(function (d) {
        var s = S().seen[d.id] || {};
        return '<li><b>' + esc(d.title) + '</b><span>' + esc((d.reveal || {}).say || '') + '</span><small>' + (s.correct === true ? 'Predicted it' : s.correct === false ? 'Surprised you, comes back in a few days' : 'Explored') + '</small></li>';
      }).join('') + '</ul>' +
      '<p class="recap__sum">' + right + ' of ' + ds.length + ' predicted · ' + labs + (labs === 1 ? ' simulation' : ' simulations') + ' explored · ' + notes + (notes === 1 ? ' note' : ' notes') + ' written</p>' +
      (r ? '<p class="recap__next">Another time: <a href="#d/' + esc(r.d.id) + '">' + esc(r.d.title) + '</a><br><small>' + esc(r.reason) + '</small></p>' : '') +
      '<a class="cat-btn" href="#/" data-act="end-session">Back home</a></section>';
  }

  /* ---------- drawing ---------- */
  function render(focus) {
    var html = ui.route === 'd' ? discovery() : ui.route === 'explore' ? explore() : ui.route === 'notes' ? notesPage() : ui.route === 'tune' ? tune() : ui.route === 'recap' ? recap() : home();
    app.innerHTML = html;
    if (ui.route === 'd' && ui.phase === 'reveal') {
      var d = Brain.byId(C, ui.id);
      var lab = document.getElementById('lab-body');
      if (lab && d.lab && Labs[d.lab.kind]) Labs[d.lab.kind](lab, function () {
        if (S().labs[d.id]) return;
        Store.update(function (s) { s.labs[d.id] = now(); });
        var t = document.querySelector('.lab__title');
        if (t && !t.querySelector('.lab__done')) t.insertAdjacentHTML('beforeend', ' <span class="lab__done">✓ explored</span>');
        mood('happy', 'Nice experiment.');
      });
    }
    if (focus) { var el = app.querySelector(focus); if (el) el.focus(); }
  }

  function go() {
    if (!parseRoute()) return;
    if (ui.route === 'd') {
      Store.update(function (s) {
        var seen = s.seen[ui.id] || {};
        if (!seen.stage) { seen.stage = 'open'; seen.at = now(); }
        s.seen[ui.id] = seen;
      });
      mood('curious');
    }
    render();
    window.scrollTo(0, 0);
    var h = app.querySelector('h1');
    if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
  }

  /* ---------- doing things ---------- */
  function reveal() {
    var d = Brain.byId(C, ui.id);
    var v = ui.variant ? list(d.variants).filter(function (x) { return x.id === ui.variant; })[0] : null;
    var item = v || d;
    var right = grade(item);
    var answer = item.predict.type === 'conditional' && right ? true : right;
    ui.phase = 'reveal';
    var days = 0;
    Store.update(function (s) { days = Brain.recordAnswer(s, d, answer, ui.confidence, now(), v ? v.id : ''); s.lastId = d.id; });
    if (right && ui.confidence === 3) mood('happy', 'Called it.');
    else if (!right && ui.confidence === 3) mood('surprised', 'Ooh. Didn\'t see that coming.');
    else if (!right) mood('surprised');
    else mood('happy');
    render('.verdict__head');
    var vh = app.querySelector('.verdict__head');
    if (vh) { vh.setAttribute('tabindex', '-1'); vh.focus(); if (!reduce) vh.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    return days;
  }

  var ACT = {
    pick: function (t) { if (ui.phase !== 'predict') return; ui.pick = Number(t.getAttribute('data-i')); render('[data-act="pick"][data-i="' + ui.pick + '"]'); },
    many: function (t) { if (ui.phase !== 'predict') return; var i = t.getAttribute('data-i'); ui.many[i] = !ui.many[i]; render('[data-act="many"][data-i="' + i + '"]'); },
    rank: function (t) {
      var pos = Number(t.getAttribute('data-pos'));
      var to = pos + Number(t.getAttribute('data-dir'));
      if (to < 0 || to >= ui.order.length) return;
      var x = ui.order[pos]; ui.order[pos] = ui.order[to]; ui.order[to] = x;
      render('[data-act="rank"][data-pos="' + to + '"][data-dir="' + t.getAttribute('data-dir') + '"]');
    },
    'est-lock': function () { var e = document.getElementById('est'); ui.estimate = Number(e.value); ui.phase = 'sure'; render('.sure__btn'); },
    lock: function () { ui.phase = 'sure'; render('.sure__btn'); },
    sure: function (t) { ui.confidence = Number(t.getAttribute('data-v')); reveal(); },
    fold: function (t) { var k = t.getAttribute('data-k'); ui.open[k] = !ui.open[k]; render('[data-k="' + k + '"]'); },
    save: function () {
      var on = !S().saved[ui.id];
      Store.update(function (s) { if (on) s.saved[ui.id] = now(); else delete s.saved[ui.id]; });
      if (on) mood('happy', 'Saved for later.');
      render('.heart');
    },
    pref: function (t) {
      var c = t.getAttribute('data-c');
      var v = t.getAttribute('data-v');
      Store.update(function (s) { if (!v || s.prefs[c] === v) delete s.prefs[c]; else s.prefs[c] = v; });
      render('[data-act="pref"][data-c="' + c + '"][data-v="' + v + '"]');
    },
    'reset-prefs': function () { Store.update(function (s) { s.prefs = {}; }); render(); },
    finish: function (t) {
      Store.update(function (s) { var x = s.seen[ui.id]; if (x) { x.stage = 'done'; x.at = now(); } });
      var to = t.getAttribute('data-to');
      location.hash = to ? to : '/';
      return true;
    },
    deep: function () {
      var picks = [];
      for (var i = 0; i < 3; i++) { var r = Brain.next(S(), C, now(), picks); if (r) picks.push(r.d.id); }
      if (!picks.length) return;
      Store.update(function (s) { s.session = { ids: picks, started: now() }; });
      location.hash = 'd/' + picks[0];
    },
    'end-session': function () { Store.update(function (s) { s.session = null; }); return true; }
  };

  app.addEventListener('click', function (e) {
    var quick = e.target.closest && e.target.closest('[data-quick]');
    if (quick) { ui._quick = Number(quick.getAttribute('data-quick')); return; } // follow the link, then pre-select
    var sess = e.target.closest && e.target.closest('[data-session]');
    if (sess) { Store.update(function (s) { s.session = null; }); return; }
    var t = e.target.closest ? e.target.closest('[data-act]') : null;
    if (!t || t.getAttribute('aria-disabled') === 'true') return;
    var fn = ACT[t.getAttribute('data-act')];
    if (!fn) return;
    var keep = fn(t, e);
    if (keep !== true && t.tagName === 'A') e.preventDefault();
  });
  app.addEventListener('input', function (e) {
    if (e.target.id === 'est') { ui.estimate = Number(e.target.value); var o = document.getElementById('est-v'); if (o) o.textContent = e.target.value + (Brain.byId(C, ui.id).predict.unit || ''); }
  });
  app.addEventListener('submit', function (e) {
    if (e.target.getAttribute('data-form') !== 'note') return;
    e.preventDefault();
    var text = String(new FormData(e.target).get('note') || '').trim();
    if (!text) { var ta = e.target.querySelector('textarea'); ta.setAttribute('aria-invalid', 'true'); ta.focus(); return; }
    Store.update(function (s) { s.notes[ui.id] = list(s.notes[ui.id]).concat([{ text: text, at: now() }]); });
    mood('happy', 'Noted.');
    render('#note');
  });
  window.addEventListener('hashchange', function () {
    var q = ui._quick;
    ui._quick = undefined;
    go();
    if (typeof q === 'number' && ui.route === 'd' && ui.phase === 'predict') { ui.pick = q; render('[data-act="lock"]'); }
  });

  /* ---------- start ---------- */
  app.innerHTML = '<p class="loading">Waking the cat…</p>';
  Store.init().then(function () {
    Store.update(function (s) { s.visits = (s.visits || 0) + 1; });
    go();
  });
})();
