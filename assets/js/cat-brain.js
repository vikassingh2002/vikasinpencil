/* Curiosity Cat: what to show next, and when ideas come back.
   Pure functions over (state, content); no page or storage code here.

   state.seen[id] = { stage: 'open'|'revealed'|'done', at, correct, confidence (1-3),
                      review: { due, days }, variantsUsed: [] }
   state.prefs[concept] = 'more' | 'less' | 'known'                                        */
window.CatBrain = (function () {
  'use strict';

  var DAY = 86400000;

  function blank() {
    return { v: 1, updatedAt: 0, visits: 0, seen: {}, saved: {}, prefs: {}, labs: {}, notes: {}, session: null, lastId: '' };
  }

  function list(x) { return Array.isArray(x) ? x : []; }
  function all(content) { return list(content && content.discoveries).filter(function (d) { return d && d.id && d.predict; }); }
  function byId(content, id) { var a = all(content); for (var i = 0; i < a.length; i++) if (a[i].id === id) return a[i]; return null; }

  // Concepts in the content's order, then any others the discoveries mention: new topics need no code changes.
  function concepts(content) {
    var out = list(content && content.concepts).map(function (c) { return { id: c.id, name: c.name || c.id }; });
    all(content).forEach(function (d) {
      var id = d.concept || 'other';
      if (!out.some(function (c) { return c.id === id; })) out.push({ id: id, name: id.charAt(0).toUpperCase() + id.slice(1) });
    });
    return out;
  }
  function conceptName(content, id) {
    var c = concepts(content).filter(function (x) { return x.id === id; })[0];
    return c ? c.name : id;
  }

  // The suggested path first, then extras grouped by concept. Safe for any number of topics.
  function ordered(content) {
    var order = {};
    concepts(content).forEach(function (c, i) { order[c.id] = i; });
    return all(content).slice().sort(function (a, b) {
      var pa = typeof a.path === 'number' ? a.path : 1e6;
      var pb = typeof b.path === 'number' ? b.path : 1e6;
      if (pa !== pb) return pa - pb;
      var ca = order[a.concept || 'other'] || 0;
      var cb = order[b.concept || 'other'] || 0;
      return ca - cb;
    });
  }

  function isDone(state, id) { var s = state.seen[id]; return !!(s && s.stage === 'done'); }
  function pref(state, d) { return state.prefs[d.concept || 'other'] || ''; }

  // How long until an idea comes back, from whether you got it right and how sure you were.
  function reviewDays(correct, confidence, previousDays) {
    var c = confidence || 2;
    if (correct === false) return c === 3 ? 1 : 2;            // confidently wrong: soonest
    if (correct === null || correct === undefined) return 5;   // no right answer (it depends): a light revisit
    var base = c === 1 ? 4 : c === 2 ? 8 : 21;                 // right, but guessing: sooner
    return previousDays ? Math.min(90, Math.round(Math.max(base, previousDays * 2.5))) : base;
  }

  // A review brings back a new scenario on the same idea, if one is left.
  function variantFor(state, d) {
    var used = list(state.seen[d.id] && state.seen[d.id].variantsUsed);
    return list(d.variants).filter(function (v) { return v && v.id && used.indexOf(v.id) === -1; })[0] || null;
  }

  function due(state, content, now) {
    return all(content).filter(function (d) {
      var s = state.seen[d.id];
      return s && s.stage === 'done' && s.review && s.review.due <= now && pref(state, d) !== 'known' && pref(state, d) !== 'less' && variantFor(state, d);
    }).sort(function (a, b) { return state.seen[a.id].review.due - state.seen[b.id].review.due; });
  }

  function unfinished(state, content) {
    return all(content).filter(function (d) {
      var s = state.seen[d.id];
      return s && s.stage && s.stage !== 'done';
    }).sort(function (a, b) { return (state.seen[b.id].at || 0) - (state.seen[a.id].at || 0); })[0] || null;
  }

  // The next discovery, with a reason you can read. skip: ids to leave out (already in this session).
  function next(state, content, now, skip) {
    skip = skip || [];
    var pool = ordered(content).filter(function (d) { return skip.indexOf(d.id) === -1; });
    var fresh = pool.filter(function (d) { return !state.seen[d.id] && pref(state, d) !== 'known'; });

    var d = due(state, content, now).filter(function (x) { return skip.indexOf(x.id) === -1; })[0];
    if (d) {
      var s = state.seen[d.id];
      return { d: d, variant: variantFor(state, d), kind: 'review',
        reason: s.correct === false ? 'Back with a new scenario: this one surprised you last time.'
          : s.confidence === 1 ? 'Back with a new scenario: you were guessing last time.'
          : 'Back with a new scenario, to see if it stuck.' };
    }
    var more = fresh.filter(function (x) { return pref(state, x) === 'more'; })[0];
    if (more) return { d: more, kind: 'more', reason: 'More on ' + conceptName(content, more.concept) + ', as you asked.' };

    var last = byId(content, state.lastId);
    var rel = last ? list(last.related).map(function (id) { return byId(content, id); })
      .filter(function (x) { return x && fresh.indexOf(x) !== -1 && pref(state, x) !== 'less'; })[0] : null;
    if (rel) return { d: rel, kind: 'related', reason: 'Follows from "' + last.title.replace(/[.?!]+$/, '') + '".' };

    var path = fresh.filter(function (x) { return typeof x.path === 'number' && pref(state, x) !== 'less'; })[0];
    if (path) return { d: path, kind: 'path', reason: 'Next on the path: ' + conceptName(content, path.concept) + '.' };

    var extra = fresh.filter(function (x) { return pref(state, x) !== 'less'; })[0] || fresh[0];
    if (extra) return { d: extra, kind: 'explore', reason: 'Something you haven\'t explored: ' + conceptName(content, extra.concept) + '.' };

    var oldest = pool.filter(function (x) { return pref(state, x) !== 'known'; })
      .sort(function (a, b) { return ((state.seen[a.id] || {}).at || 0) - ((state.seen[b.id] || {}).at || 0); })[0];
    return oldest ? { d: oldest, kind: 'revisit', reason: 'You\'ve seen everything. Here\'s one from a while ago.' } : null;
  }

  // Record a prediction and schedule the idea's return.
  function recordAnswer(state, d, correct, confidence, now, variantId) {
    var s = state.seen[d.id] || {};
    var prev = s.review && s.review.days;
    s.correct = correct;
    s.confidence = confidence;
    s.at = now;
    if (s.stage !== 'done') s.stage = 'revealed';
    var days = reviewDays(correct, confidence, variantId && correct ? prev : 0);
    s.review = { due: now + days * DAY, days: days };
    if (variantId) {
      s.variantsUsed = list(s.variantsUsed).concat([variantId]);
      s.stage = 'done';
    }
    s.answers = (s.answers || 0) + 1;
    state.seen[d.id] = s;
    return days;
  }

  function stats(state, content) {
    var cs = concepts(content).map(function (c) {
      var ds = all(content).filter(function (d) { return (d.concept || 'other') === c.id; });
      var done = ds.filter(function (d) { return isDone(state, d.id); }).length;
      return { id: c.id, name: c.name, total: ds.length, done: done, pref: state.prefs[c.id] || '' };
    }).filter(function (c) { return c.total; });
    var labsTotal = all(content).filter(function (d) { return d.lab; }).length;
    var labsDone = Object.keys(state.labs || {}).filter(function (k) { return state.labs[k] && byId(content, k); }).length;
    var notes = Object.keys(state.notes || {}).filter(function (k) { return list(state.notes[k]).length; }).length;
    return { concepts: cs, explored: cs.filter(function (c) { return c.done; }).length, labsDone: labsDone, labsTotal: labsTotal, notes: notes,
      discovered: all(content).filter(function (d) { return isDone(state, d.id); }).length, total: all(content).length };
  }

  return { blank: blank, all: all, byId: byId, concepts: concepts, conceptName: conceptName, ordered: ordered,
    next: next, unfinished: unfinished, due: due, recordAnswer: recordAnswer, reviewDays: reviewDays, variantFor: variantFor,
    stats: stats, isDone: isDone, DAY: DAY };
})();
