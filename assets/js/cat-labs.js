/* Curiosity Cat: small simulations ("labs") that go with some discoveries.
   Each is illustrative: simple, honest arithmetic or a scripted trace, not a live model.
   CatLabs[kind](el, done) draws into el and calls done() once you've really tried it. */
window.CatLabs = (function () {
  'use strict';

  var ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ESC[c]; }); }
  function fmt(n) { return Math.round(n).toLocaleString('en-IN'); }
  function on(el, sel, ev, fn) { Array.prototype.forEach.call(el.querySelectorAll(sel), function (x) { x.addEventListener(ev, fn); }); }
  function range(id, label, min, max, step, value, unit) {
    return '<label class="lab__ctl" for="' + id + '"><span>' + esc(label) + ' <b id="' + id + '-v">' + fmt(value) + (unit || '') + '</b></span>' +
      '<input type="range" id="' + id + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + value + '"></label>';
  }
  function val(el, id) { return Number(el.querySelector('#' + id).value); }
  function show(el, id, text) { var x = el.querySelector('#' + id + '-v'); if (x) x.textContent = text; }
  function trace(rows) {
    return '<ol class="trace">' + rows.map(function (r) {
      return '<li class="trace__row trace__row--' + r[0] + '"><span class="trace__tag">' + esc(r[0]) + '</span><span>' + esc(r[1]) + '</span></li>';
    }).join('') + '</ol>';
  }

  /* The agent loop, one step at a time. */
  function loop(el, done) {
    var busy = false;
    var stepAt = 0;
    function script() {
      var s = [
        ['think', 'Goal: book 30 minutes with Asha this week. I need her free slots.'],
        ['act', 'calendar.free_slots(person="Asha", week="this")'],
        ['observe', 'Thursday 15:00, Friday 11:00']
      ];
      if (busy) s = s.concat([
        ['think', 'Thursday 15:00 is first. Book it.'],
        ['act', 'calendar.book(time="Thu 15:00")'],
        ['observe', 'Error: that slot was just taken']
      ]);
      return s.concat([
        ['think', busy ? 'Thursday failed, so try Friday 11:00.' : 'Thursday 15:00 is first. Book it.'],
        ['act', busy ? 'calendar.book(time="Fri 11:00")' : 'calendar.book(time="Thu 15:00")'],
        ['observe', 'Booked.'],
        ['think', 'Goal met. Confirm and stop.']
      ]);
    }
    function draw() {
      var s = script();
      el.innerHTML =
        '<div class="lab__bar"><label class="lab__toggle"><input type="checkbox" id="lab-busy"' + (busy ? ' checked' : '') + '> Someone grabs Thursday first</label></div>' +
        trace(s.slice(0, stepAt)) +
        (stepAt < s.length ? '<button type="button" class="cat-btn" id="lab-step">' + (stepAt ? 'Next step' : 'Start the loop') + '</button>'
          : '<p class="lab__out">Done in ' + s.filter(function (x) { return x[0] === 'act'; }).length + ' actions. ' + (busy ? 'The failed booking changed the plan: that reaction is the loop.' : 'Now tick the box and run it again.') + '</p>' +
            '<button type="button" class="cat-btn cat-btn--quiet" id="lab-again">Run again</button>');
      var st = el.querySelector('#lab-step');
      if (st) st.addEventListener('click', function () { stepAt++; draw(); var b = el.querySelector('#lab-step'); if (b) b.focus(); });
      var ag = el.querySelector('#lab-again');
      if (ag) ag.addEventListener('click', function () { stepAt = 0; draw(); });
      el.querySelector('#lab-busy').addEventListener('change', function (e) { busy = e.target.checked; stepAt = 0; draw(); });
      if (busy && stepAt >= s.length) done();
    }
    draw();
  }

  /* Vague versus precise tool descriptions, on five tasks. */
  function tooldesc(el, done) {
    var tried = {};
    var tasks = [
      ['Has ESA launched anything this month?', 'Has ESA launched anything this month?', 'ESA launch October'],
      ['Find the debris report from last week', 'Can you find the space debris report from last week please', 'debris report'],
      ['What did the press office say about Sentinel?', 'What did the ESA press office say about Sentinel?', 'Sentinel press release'],
      ['Any news on the Ariane 6 schedule?', 'Is there any news about the Ariane 6 launch schedule?', 'Ariane 6 schedule'],
      ['Who leads the anomaly team?', 'anomaly team lead', 'anomaly team lead']
    ];
    function draw(which) {
      var precise = which === 'precise';
      var ok = 0;
      var rows = tasks.map(function (t) {
        var q = precise ? t[2] : t[1];
        var good = q.split(' ').length <= 4;
        if (good) ok++;
        return '<li class="trace__row ' + (good ? 'trace__row--ok' : 'trace__row--bad') + '"><span class="trace__tag">' + (good ? 'found' : 'none') + '</span><span>search("' + esc(q) + '")</span></li>';
      }).join('');
      el.innerHTML =
        '<div class="lab__seg" role="radiogroup" aria-label="Tool description">' +
          '<button type="button" role="radio" aria-checked="' + !precise + '" data-w="vague">“query: The query.”</button>' +
          '<button type="button" role="radio" aria-checked="' + precise + '" data-w="precise">“query: 2–4 keywords, e.g. ESA debris 2026”</button>' +
        '</div>' +
        '<ol class="trace">' + rows + '</ol>' +
        '<p class="lab__out">' + ok + ' of 5 searches found something. ' + (precise ? 'Same model, same tasks: only the description changed.' : 'Now switch to the precise description.') + '</p>';
      tried[which] = true;
      on(el, '[data-w]', 'click', function (e) { draw(e.currentTarget.getAttribute('data-w')); var b = el.querySelector('[aria-checked="true"]'); if (b) b.focus(); });
      if (tried.vague && tried.precise) done();
    }
    draw('vague');
  }

  /* Stopping rules on a search that can't succeed. */
  function stopping(el, done) {
    var rules = { limit: false, repeat: false, help: false };
    var limit = 8;
    function run() {
      var steps = [];
      var outcome = '';
      var repeats = 0;
      for (var i = 1; i <= 30; i++) {
        if (rules.limit && i > limit) { outcome = 'Stopped at the step limit and reported what it had: no price found.'; break; }
        repeats++;
        if (rules.repeat && repeats > 3) {
          if (rules.help) { steps.push(['ask', 'The price isn\'t on this page. Should I check the shop\'s app instead?']); outcome = 'Noticed it was repeating, and asked for help after ' + (i - 1) + ' steps.'; break; }
          steps.push(['think', 'Same result three times. Try a different page.']);
          repeats = 0;
        }
        steps.push(['act', 'open("shop.example/laptop-x")  → price not shown']);
      }
      if (!outcome) outcome = 'Still "working" after 30 steps. Nothing told it to stop.';
      var shown = steps.length > 8 ? steps.slice(0, 4).concat([['…', (steps.length - 6) + ' more steps']]).concat(steps.slice(-2)) : steps;
      var tokens = 0;
      for (var k = 1; k <= steps.length; k++) tokens += 1000 + 1500 * (k - 1);
      return { html: trace(shown), outcome: outcome, steps: steps.length, tokens: tokens };
    }
    function draw() {
      var r = run();
      el.innerHTML =
        '<p class="lab__note">The page never shows a price. Pick the agent\'s exits:</p>' +
        '<div class="lab__bar">' +
          '<label class="lab__toggle"><input type="checkbox" data-r="limit"' + (rules.limit ? ' checked' : '') + '> Step limit</label>' +
          '<label class="lab__toggle"><input type="checkbox" data-r="repeat"' + (rules.repeat ? ' checked' : '') + '> Notice repeats</label>' +
          '<label class="lab__toggle"><input type="checkbox" data-r="help"' + (rules.help ? ' checked' : '') + '> Ask for help</label>' +
        '</div>' +
        (rules.limit ? range('lab-limit', 'Step limit', 3, 20, 1, limit) : '') +
        r.html +
        '<p class="lab__out"><b>' + esc(r.outcome) + '</b><br>' + r.steps + ' steps · about ' + fmt(r.tokens) + ' tokens sent</p>';
      on(el, '[data-r]', 'change', function (e) { rules[e.target.getAttribute('data-r')] = e.target.checked; draw(); var b = el.querySelector('[data-r="' + e.target.getAttribute('data-r') + '"]'); if (b) b.focus(); });
      var lim = el.querySelector('#lab-limit');
      if (lim) lim.addEventListener('input', function () { limit = Number(lim.value); draw(); el.querySelector('#lab-limit').focus(); });
      if (rules.limit || rules.repeat) done();
    }
    draw();
  }

  /* One demo versus a test set. */
  function evalgrid(el, done) {
    var seen = {};
    var tasks = ['The demo', 'Refund, damaged item', 'Refund, late delivery', 'Two orders, one email', 'Angry customer', 'Wrong language', 'Order number missing',
      'Asks for a manager', 'Duplicate charge', 'Gift order', 'Address change', 'Spam email'];
    var A = [0, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1];
    var B = [1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1];
    function draw(v) {
      seen[v] = true;
      var r = v === 'A' ? A : B;
      var pass = r.filter(Boolean).length;
      el.innerHTML =
        '<div class="lab__seg" role="radiogroup" aria-label="Version">' +
          '<button type="button" role="radio" aria-checked="' + (v === 'A') + '" data-v="A">Version A</button>' +
          '<button type="button" role="radio" aria-checked="' + (v === 'B') + '" data-v="B">Version B</button>' +
        '</div>' +
        '<ul class="grid12">' + tasks.map(function (t, i) {
          var changed = A[i] !== B[i];
          return '<li class="grid12__cell ' + (r[i] ? 'is-pass' : 'is-fail') + (changed ? ' is-changed' : '') + '"><span>' + (r[i] ? '✓' : '✗') + '</span>' + esc(t) + '</li>';
        }).join('') + '</ul>' +
        '<p class="lab__out">' + pass + ' of 12 pass. ' + (seen.A && seen.B ? 'B fixes the demo and three other cases, but breaks "Two orders, one email", which A handled. You\'d only know from the full set.' : 'Now look at the other version.') + '</p>';
      on(el, '[data-v]', 'click', function (e) { draw(e.currentTarget.getAttribute('data-v')); var b = el.querySelector('[aria-checked="true"]'); if (b) b.focus(); });
      if (seen.A && seen.B) done();
    }
    draw('A');
  }

  /* What fills the context as an agent runs. */
  function context(el, done) {
    var touched = false;
    function draw(focusId) {
      var ins = focusId ? val(el, 'lab-ins') : 1000;
      var out = focusId ? val(el, 'lab-out') : 2000;
      var steps = focusId ? val(el, 'lab-steps') : 20;
      var summ = focusId ? el.querySelector('#lab-sum').checked : false;
      var results = summ ? Math.min(steps, 3) * out + (steps > 3 ? 300 : 0) : steps * out;
      var total = ins + results;
      var share = ins / total * 100;
      el.innerHTML =
        range('lab-ins', 'Instructions', 200, 4000, 100, ins, ' tokens') +
        range('lab-out', 'Each tool result', 200, 6000, 100, out, ' tokens') +
        range('lab-steps', 'Steps so far', 1, 40, 1, steps, '') +
        '<label class="lab__toggle"><input type="checkbox" id="lab-sum"' + (summ ? ' checked' : '') + '> Summarise all but the last 3 steps</label>' +
        '<div class="stack" role="img" aria-label="Instructions are ' + share.toFixed(1) + '% of the context">' +
          '<span class="stack__ins" style="width:' + Math.max(share, 0.6) + '%"></span><span class="stack__res" style="width:' + (100 - share) + '%"></span></div>' +
        '<p class="lab__out">Context: ' + fmt(total) + ' tokens. Your instructions are <b>' + share.toFixed(1) + '%</b> of it.' + (summ ? ' Summarising keeps them visible.' : '') + '</p>';
      on(el, 'input', 'input', function (e) { touched = true; draw(e.target.id); });
      on(el, '#lab-sum', 'change', function () { touched = true; draw('lab-sum'); });
      if (focusId) { var f = el.querySelector('#' + focusId); if (f) f.focus(); }
      if (touched) done();
    }
    draw('');
  }

  /* Tokens sent over a whole run. */
  function cost(el, done) {
    var touched = false;
    function draw(focusId) {
      var steps = focusId ? val(el, 'lab-csteps') : 20;
      var out = focusId ? val(el, 'lab-cout') : 2000;
      var cache = focusId ? el.querySelector('#lab-cache').checked : false;
      var per = [];
      var total = 0;
      var billed = 0;
      for (var k = 1; k <= steps; k++) {
        var send = 1000 + out * (k - 1);
        per.push(send);
        total += send;
        var fresh = k === 1 ? send : out; // only the newest part is new
        billed += cache ? fresh + (send - fresh) * 0.1 : send;
      }
      var max = per[per.length - 1] || 1;
      el.innerHTML =
        range('lab-csteps', 'Steps', 1, 40, 1, steps, '') +
        range('lab-cout', 'Each tool result', 200, 6000, 100, out, ' tokens') +
        '<label class="lab__toggle"><input type="checkbox" id="lab-cache"' + (cache ? ' checked' : '') + '> Cache the unchanged part (illustrative: billed at a tenth)</label>' +
        '<div class="bars" role="img" aria-label="Tokens sent at each step grow from ' + fmt(per[0]) + ' to ' + fmt(max) + '">' +
          per.map(function (p) { return '<span style="height:' + Math.max(3, p / max * 100) + '%"></span>'; }).join('') + '</div>' +
        '<p class="lab__out">Sent over the run: <b>' + fmt(total) + '</b> tokens' + (cache ? ', billed like about <b>' + fmt(billed) + '</b>' : '') +
          '. The final context alone is ' + fmt(max + out) + '. Doubling the steps roughly quadruples the total.</p>';
      on(el, 'input[type=range]', 'input', function (e) { touched = true; draw(e.target.id); });
      on(el, '#lab-cache', 'change', function () { touched = true; draw('lab-cache'); });
      if (focusId) { var f = el.querySelector('#' + focusId); if (f) f.focus(); }
      if (touched) done();
    }
    draw('');
  }

  /* One agent or several: a toy model of time, tokens and clashes. */
  function multi(el, done) {
    var touched = false;
    function draw(focusId) {
      var n = focusId ? val(el, 'lab-n') : 1;
      var dep = focusId ? el.querySelector('[data-k][aria-checked="true"]').getAttribute('data-k') === 'dep' : false;
      var time = dep ? 60 + (n - 1) * 8 : Math.round(60 / n) + (n > 1 ? 6 : 0);
      var tokens = n === 1 ? 1 : n * 1.2 + 1;
      var clash = dep ? Math.min(90, (n - 1) * 22) : (n > 1 ? 5 : 0);
      el.innerHTML =
        '<div class="lab__seg" role="radiogroup" aria-label="Kind of work">' +
          '<button type="button" role="radio" aria-checked="' + !dep + '" data-k="ind">Research five companies (independent)</button>' +
          '<button type="button" role="radio" aria-checked="' + dep + '" data-k="dep">Build one app (parts depend on each other)</button>' +
        '</div>' +
        range('lab-n', 'Agents', 1, 5, 1, n, '') +
        '<dl class="meters">' +
          '<div><dt>Time</dt><dd><span style="width:' + Math.min(100, time / 1.0) + '%"></span><b>' + time + ' min</b></dd></div>' +
          '<div><dt>Tokens</dt><dd><span style="width:' + Math.min(100, tokens / 8 * 100) + '%"></span><b>' + tokens.toFixed(1) + '×</b></dd></div>' +
          '<div><dt>Clashing choices</dt><dd><span style="width:' + clash + '%"></span><b>' + clash + '%</b></dd></div>' +
        '</dl>' +
        '<p class="lab__out">' + (dep ? 'More agents don\'t speed up work that waits on itself, and they start making choices that don\'t fit.' : 'Independent parts split cleanly: faster, at a token cost.') + ' A toy model with made-up rates, to show the shape, not real figures.</p>';
      on(el, '[data-k]', 'click', function (e) { touched = true; el.querySelectorAll('[data-k]').forEach(function (b) { b.setAttribute('aria-checked', String(b === e.currentTarget)); }); draw('lab-n'); });
      on(el, '#lab-n', 'input', function () { touched = true; draw('lab-n'); });
      if (focusId) { var f = el.querySelector('#' + focusId); if (f) f.focus(); }
      if (touched) done();
    }
    draw('');
  }

  return { loop: loop, tooldesc: tooldesc, stopping: stopping, evalgrid: evalgrid, context: context, cost: cost, multi: multi };
})();
