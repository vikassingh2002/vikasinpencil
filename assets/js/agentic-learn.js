/* Agentic AI: what the reader knows and wants, and what to read next.
   A concept map, a reader model with separate interest and familiarity per concept, and transparent
   scoring. Every number in a recommendation comes from the breakdown it shows; nothing is trained.
   Reading is evidence of exposure, never of mastery; only an "Explain it back" note marks a concept demonstrated. */
window.AgenticLearn = (function () {
  'use strict';
  var VERSION = 'learn-1';
  var DAY = 86400000;
  // Weights for the final score. Change them here and bump VERSION so the dashboard can compare versions.
  var W = { interest: 3, fit: 2.5, need: 4, connect: 1, fresh: 0.5, dismissed: 4, ignored: 0.6, reopen: 0.8 };
  var HALF_LIFE = 14 * DAY;   // interest fades by half in two weeks without new evidence
  var READ = 0.6;             // engagement at which an article counts as read and leaves the picks

  // id: [label, section, concepts it builds on]
  var C = {
    llm: ['Large language models', 'technology', []], tokens: ['Tokens', 'technology', ['llm']],
    training: ['Model training', 'technology', ['llm']], inference: ['Inference', 'technology', ['llm']],
    'reasoning-models': ['Reasoning models', 'technology', ['inference']], 'open-weights': ['Open-weight models', 'technology', ['llm']],
    benchmarks: ['Benchmarks and evaluation', 'technology', ['llm']], tools: ['Tool use', 'technology', ['llm']],
    agents: ['AI agents', 'technology', ['tools']], context: ['Context windows', 'technology', ['tokens']],
    skills: ['Agent skills', 'technology', ['agents', 'context']], protocols: ['Agent standards', 'technology', ['agents']],
    'voice-ai': ['Voice agents', 'technology', ['agents', 'inference']], multimodal: ['Vision and 3D models', 'technology', ['llm']],
    quantisation: ['Quantisation', 'technology', ['inference']], 'on-device': ['On-device AI', 'technology', ['quantisation']],
    interfaces: ['Generative interfaces', 'technology', ['llm']],
    gpus: ['GPUs and accelerators', 'business', []], 'memory-bandwidth': ['Memory bandwidth', 'business', ['gpus']],
    'chip-supply': ['Chip supply chains', 'business', ['gpus']], packaging: ['Advanced packaging', 'business', ['chip-supply']],
    'data-centres': ['Data centres', 'business', ['gpus']], power: ['Electricity for AI', 'business', ['data-centres']],
    cooling: ['Liquid cooling', 'business', ['data-centres']], cloud: ['Cloud computing', 'business', ['data-centres']],
    satellites: ['Satellites and sensing', 'science', ['on-device']],
    'token-pricing': ['Token pricing', 'markets', ['tokens', 'inference']], 'unit-economics': ['Cost per task', 'markets', ['token-pricing']],
    'ai-revenue': ['AI company revenue', 'markets', ['unit-economics']], 'compute-commitments': ['Compute commitments', 'markets', ['cloud', 'ai-revenue']],
    ipo: ['IPOs and public markets', 'markets', ['ai-revenue']], 'm-and-a': ['Mergers and talent deals', 'markets', []],
    venture: ['Venture funding', 'markets', []], platforms: ['Platform strategy', 'business', ['cloud']],
    'defence-tech': ['Defence technology', 'markets', ['venture']],
    'prompt-injection': ['Prompt injection', 'technology', ['agents']], 'least-privilege': ['Permissions and least privilege', 'technology', ['agents']],
    sandboxing: ['Sandboxing and monitoring', 'technology', ['least-privilege']], 'supply-chain-attacks': ['Software supply-chain attacks', 'technology', []],
    'self-replication': ['Self-replicating AI', 'technology', ['open-weights', 'agents']], deception: ['Deceptive model behaviour', 'technology', ['agents', 'benchmarks']],
    'red-teaming': ['Red-teaming and safety tests', 'technology', ['benchmarks']], 'iot-security': ['Device security', 'technology', []],
    'incident-reporting': ['Incident reporting', 'policy', []], 'breach-law': ['Data-breach rules', 'policy', []],
    'eu-ai-act': ['The EU AI Act', 'policy', []], 'us-state-law': ['American state AI laws', 'policy', []],
    'child-safety': ['Children and chatbots', 'policy', []], 'algorithmic-management': ['AI decisions at work', 'work', []],
    'infrastructure-security': ['Infrastructure as a target', 'policy', ['data-centres']], 'web-commons': ['The open web and crawlers', 'policy', ['agents']],
    'coding-agents': ['Coding agents', 'work', ['agents']], 'code-review': ['Code review and verification', 'work', ['coding-agents']],
    productivity: ['AI and productivity', 'work', []], 'customer-service': ['AI in customer service', 'work', ['agents']],
    'jobs-skills': ['Jobs and skills', 'work', []], education: ['AI in education', 'work', ['llm']],
    'formal-proof': ['Formal proof', 'science', []], 'ai-maths': ['AI in mathematics', 'science', ['reasoning-models']],
    'ai-biology': ['AI in biology', 'science', ['agents']], 'weather-ai': ['AI weather forecasting', 'science', ['training']],
    'polling-ai': ['Synthetic survey respondents', 'science', ['llm']], 'games-ai': ['Game-playing AI', 'science', ['training']],
    'mental-health': ['Chatbots and mental health', 'science', ['llm']]
  };
  // article: [concepts covered, concepts assumed, depth 1 primer – 3 expert]. Hand-tagged; review as the archive grows.
  var A = {
    'ipo-20261026': [['ai-revenue', 'ipo', 'compute-commitments'], ['unit-economics', 'cloud'], 3],
    'pods-20261021': [['data-centres', 'cooling', 'power'], ['gpus'], 2],
    'skills-20261022': [['skills', 'protocols'], ['agents', 'context'], 2],
    'supply-20261021': [['chip-supply', 'packaging'], ['gpus'], 3],
    'contact-20261023': [['customer-service', 'productivity'], ['agents'], 1],
    'guardrails-20261021': [['prompt-injection', 'least-privilege', 'sandboxing'], ['agents', 'tools'], 2],
    'voice-20261019': [['voice-ai'], ['tools', 'inference'], 2],
    'edge-20261019': [['on-device', 'quantisation', 'memory-bandwidth'], ['inference', 'gpus'], 2],
    'satellite-20261019': [['satellites', 'on-device'], ['quantisation'], 2],
    'weather-20261021': [['weather-ai'], ['training', 'benchmarks'], 2],
    'teachers-20261019': [['education'], ['llm'], 1],
    'review-20261026': [['code-review', 'coding-agents'], ['agents'], 2],
    'medicare-20260924': [['incident-reporting', 'breach-law', 'agents'], [], 1],
    'astra-20260928': [['red-teaming', 'supply-chain-attacks', 'sandboxing'], ['agents', 'benchmarks'], 2],
    'enzyme-20260923': [['ai-biology', 'agents'], ['llm'], 1],
    'seller-20260923': [['platforms', 'agents'], [], 1],
    'tekever-20260923': [['defence-tech', 'venture'], [], 1],
    'mentalhealth-20260924': [['mental-health', 'benchmarks'], ['llm'], 1],
    'prospectus-20260930': [['compute-commitments', 'unit-economics', 'ai-revenue'], ['cloud'], 2],
    'devday-20260929': [['agents', 'token-pricing', 'platforms'], ['llm'], 1],
    'robobosses-20260930': [['algorithmic-management', 'us-state-law'], [], 1],
    'pew-20260930': [['polling-ai', 'benchmarks'], ['llm'], 1],
    'deceive-20260929': [['deception', 'red-teaming'], ['agents', 'open-weights'], 2],
    'stratego-20260930': [['games-ai', 'training'], [], 1],
    'worldlabs-20260928': [['m-and-a', 'multimodal'], ['gpus'], 1],
    'maths-20261007': [['ai-maths', 'formal-proof'], ['reasoning-models'], 3],
    'pricewar-20261008': [['token-pricing', 'unit-economics', 'reasoning-models'], ['tokens'], 2],
    'yandex-20261011': [['infrastructure-security', 'data-centres'], [], 1],
    'intelligentui-20261007': [['interfaces'], ['llm'], 1],
    'wikimedia-20261008': [['web-commons', 'agents'], [], 1],
    'incidents-20261012': [['coding-agents', 'code-review', 'productivity'], [], 1],
    'regulators-20261014': [['eu-ai-act', 'us-state-law', 'child-safety', 'incident-reporting'], [], 2],
    'worm-20261012': [['self-replication', 'iot-security'], ['open-weights', 'agents'], 3],
    'characterai-20261013': [['child-safety', 'm-and-a'], [], 1],
    'argon-20261013': [['token-pricing', 'benchmarks'], ['llm'], 2],
    'cyberjobs-20261019': [['jobs-skills', 'red-teaming'], [], 1],
    'nxdirection-20261014': [['prompt-injection'], ['llm', 'agents'], 3],
    'leader-20260928': [['incident-reporting', 'sandboxing', 'agents'], ['agents'], 2],
    'leader-20261005': [['unit-economics', 'token-pricing'], ['ai-revenue'], 2],
    'leader-20261012': [['formal-proof', 'code-review'], ['ai-maths'], 2],
    'leader-20261019': [['incident-reporting', 'eu-ai-act', 'iot-security'], [], 2],
    'leader-20261026': [['ipo', 'compute-commitments'], ['ai-revenue'], 2]
  };

  function meta(a) {
    var m = A[a.id] || [[], [], 2];
    return { covers: m[0], assumes: m[1], depth: m[2], tags: m[0], prerequisites: m[1], explains: m[0], difficulty: m[2], reviewed: !!A[a.id] };
  }
  function label(c) { return C[c] ? C[c][0] : c; }
  // lower-case a label for use mid-sentence, keeping acronyms such as AI, GPUs and EU
  function lc(c) { var s = label(c); return /^[A-Z]{2}/.test(s) ? s : s.charAt(0).toLowerCase() + s.slice(1); }
  function clamp(x, lo, hi) { return Math.max(lo, Math.min(hi, x)); }
  function mean(xs) { return xs.length ? xs.reduce(function (s, x) { return s + x; }, 0) / xs.length : 0; }
  function union(spans) {
    spans.sort(function (a, b) { return a[0] - b[0]; });
    var total = 0, end = 0;
    spans.forEach(function (s) { total += Math.max(0, s[1] - Math.max(s[0], end)); end = Math.max(end, s[1]); });
    return total;
  }

  /* ---------- the reader model ---------- */
  // events: the shared event log; articles: the catalogue; t: now (for tests)
  function model(events, articles, t) {
    t = t || Date.now();
    var byId = {}; articles.forEach(function (a) { byId[a.id] = a; });
    var lastReset = 0;
    events.forEach(function (e) { if (e.type === 'preference' && e.payload && e.payload.reset) lastReset = Math.max(lastReset, e.at); });
    var raw = {}, fam = {}, demo = {}, depthPref = {}, need = {}, needFrom = {}, notes = {};
    var spans = {}, sections = {}, lastSeen = {}, feedback = {}, saved = {}, dismissed = {}, shown = {}, selected = {}, prefs = {};
    function decay(at) { return Math.pow(0.5, Math.max(0, t - at) / HALF_LIFE); }
    function bump(c, n, why) { if (!C[c]) return; raw[c] = (raw[c] || 0) + n; (notes[c] = notes[c] || []).push(why); }
    events.forEach(function (e) {
      var p = e.payload || {}, id = e.article;
      if (e.type === 'activity' && p.end > p.start) (spans[id] = spans[id] || []).push([p.start, p.end]);
      if (e.type === 'section') { (sections[id] = sections[id] || {})[p.index] = 1; sections[id].total = p.total; }
      if (e.type === 'open' || e.type === 'activity') lastSeen[id] = Math.max(lastSeen[id] || 0, e.at);
      if (e.type === 'feedback') feedback[id + ':' + p.key] = p.on ? e.at : 0;
      if (e.type === 'bookmark') saved[id] = p.on ? e.at : 0;
      if (e.type === 'exposure') shown[id] = (shown[id] || 0) + 1;
      if (e.type === 'decision') { if (p.selected === false) dismissed[id] = e.at; else selected[id] = e.at; }
      if (e.type === 'preference' && p.topic && !p.reset) prefs[p.topic] = { value: Number(p.value) || 0, at: e.at };
    });
    // How much of each article was actually read: active time against its length, plus sections seen.
    var engagement = {};
    articles.forEach(function (a) {
      var ms = union(spans[a.id] || []), s = sections[a.id], frac = s && s.total ? (Object.keys(s).length - 1) / s.total : 0;
      if (!ms && !frac) return;
      var timeShare = clamp(ms / ((a.minutes || 4) * 60000 * 0.5), 0, 1); // reading at twice normal speed still counts in full
      engagement[a.id] = ms < 30000 ? frac * 0.2 : clamp(0.65 * timeShare + 0.35 * frac, 0, 1);
    });
    articles.forEach(function (a) {
      var m = meta(a), e = engagement[a.id] || 0, at = lastSeen[a.id] || 0, d = decay(at), title = '«' + a.title + '»';
      if (e > 0.15 && at > lastReset) {
        m.covers.forEach(function (c) { bump(c, 1.2 * e * d, 'read ' + title); });
        m.assumes.forEach(function (c) { bump(c, 0.4 * e * d, 'read ' + title); });
      }
      m.covers.forEach(function (c) { fam[c] = clamp((fam[c] || 0) + 0.45 * e * (m.depth / 2), 0, 1); });
      m.assumes.forEach(function (c) { fam[c] = clamp((fam[c] || 0) + 0.15 * e, 0, 1); });
      var f = function (k) { return feedback[a.id + ':' + k] || 0; };
      if (f('useful') > lastReset) m.covers.forEach(function (c) { bump(c, 2 * decay(f('useful')), 'found ' + title + ' worth your time'); });
      if (f('more') > lastReset) m.covers.forEach(function (c) { bump(c, 3 * decay(f('more')), 'asked for more after ' + title); });
      if (saved[a.id] > lastReset) m.covers.forEach(function (c) { bump(c, 1 * decay(saved[a.id]), 'saved ' + title); });
      if (f('basic')) m.covers.forEach(function (c) { fam[c] = Math.max(fam[c] || 0, 0.75); depthPref[c] = (depthPref[c] || 0) + 1; });
      if (f('background')) m.assumes.concat(m.assumes.length ? [] : m.covers.map(function (c) { return (C[c] || [, , []])[2]; }).reduce(function (x, y) { return x.concat(y); }, []))
        .forEach(function (c) { need[c] = Math.max(need[c] || 0, 1); needFrom[c] = { article: a, at: f('background'), explicit: true }; fam[c] = Math.min(fam[c] || 0, 0.25); });
    });
    // Notes: accepted interpretations add interest or background; "Explain it back" notes mark a concept demonstrated.
    var latest = {};
    events.forEach(function (e) { if (e.type === 'comment' && e.payload) latest[e.payload.id] = e; });
    Object.keys(latest).forEach(function (k) {
      var e = latest[k], c = e.payload;
      if (c.deleted) return;
      if (c.kind === 'recall' && c.concept && C[c.concept] && c.text && c.text.length >= 20) { demo[c.concept] = e.at; fam[c.concept] = Math.max(fam[c.concept] || 0, 0.7); }
      if (c.accepted && c.interpretation && e.at > lastReset) {
        (c.interpretation.interests || []).forEach(function (x) { bump(x, 2 * decay(e.at), 'wrote a note on «' + ((byId[c.article] || {}).title || c.article) + '»'); });
        (c.interpretation.background || []).forEach(function (x) { if (C[x]) { need[x] = Math.max(need[x] || 0, 1); needFrom[x] = { article: byId[c.article], at: e.at, explicit: true }; } });
      }
    });
    // Implicit gaps: a recently read article assumed something you have barely met.
    articles.forEach(function (a) {
      var e = engagement[a.id] || 0;
      if (e < 0.5 || t - (lastSeen[a.id] || 0) > 21 * DAY) return;
      meta(a).assumes.forEach(function (c) { if ((fam[c] || 0) < 0.25 && !need[c]) { need[c] = 0.5; needFrom[c] = { article: a, at: lastSeen[a.id], explicit: false }; } });
    });
    // A request is answered once something covering it has been read afterwards.
    var answered = {};
    Object.keys(needFrom).forEach(function (c) {
      var since = needFrom[c].at; // only reading done after the request counts as answering it
      var hit = articles.filter(function (a) {
        var after = union((spans[a.id] || []).filter(function (s) { return s[1] > since; }).map(function (s) { return [Math.max(s[0], since), s[1]]; }));
        return meta(a).covers.indexOf(c) >= 0 && after >= (a.minutes || 4) * 60000 * 0.25;
      })[0];
      if (hit) { answered[c] = { by: hit, after: lastSeen[hit.id] - needFrom[c].at }; delete need[c]; }
    });
    // Explicit corrections from the dashboard override inferred interest.
    Object.keys(prefs).forEach(function (c) { if (prefs[c].at > lastReset) raw[c] = prefs[c].value / 2; });
    var interest = {};
    Object.keys(raw).forEach(function (c) { interest[c] = 1 - Math.exp(-raw[c] / 2.5); });
    return { interest: interest, raw: raw, familiarity: fam, demonstrated: demo, depthPref: depthPref, need: need, needFrom: needFrom, answered: answered,
      engagement: engagement, lastSeen: lastSeen, saved: saved, feedback: feedback, dismissed: dismissed, shown: shown, selected: selected, why: notes, reset: lastReset };
  }

  /* ---------- scoring ---------- */
  function score(a, R, t) {
    var m = meta(a), I = R.interest, F = R.familiarity;
    var interest = m.covers.length ? Math.max.apply(null, m.covers.map(function (c) { return I[c] || 0; })) * 0.6 + mean(m.covers.map(function (c) { return I[c] || 0; })) * 0.4 : 0;
    var novelty = 1 - mean(m.covers.map(function (c) { return F[c] || 0; }));
    var ready = m.assumes.length ? 0.5 + 0.5 * mean(m.assumes.map(function (c) { return clamp((F[c] || 0) / 0.5, 0, 1); })) : 1;
    var target = clamp(1 + 2 * mean(m.covers.map(function (c) { return F[c] || 0; })) + 0.5 * mean(m.covers.map(function (c) { return R.depthPref[c] || 0; })), 1, 3);
    var depthFit = 1 - Math.abs(m.depth - target) / 2;
    var fit = 0.45 * novelty + 0.3 * depthFit + 0.25 * ready;
    var needC = m.covers.filter(function (c) { return R.need[c]; });
    var need = Math.min(1.5, needC.reduce(function (s, c) { return s + R.need[c]; }, 0));
    var link = null;
    Object.keys(R.engagement).forEach(function (id) {
      if (id === a.id || R.engagement[id] < 0.5 || link) return;
      var other = byIdCache[id]; if (!other) return;
      var mo = meta(other), shared = m.covers.concat(m.assumes).filter(function (c) { return mo.covers.indexOf(c) >= 0; });
      if (shared.length) link = { article: other, concept: shared[0] };
    });
    var connect = link ? 1 : 0;
    var days = (t - Date.parse(a.date || '2000-01-01')) / DAY, fresh = 1 - clamp(days / 60, 0, 1);
    var dismissed = R.dismissed[a.id] ? W.dismissed : 0;
    var ignored = Math.max(0, (R.shown[a.id] || 0) - 2 - (R.selected[a.id] ? 99 : 0)) * W.ignored;
    var reopen = (R.lastSeen[a.id] && t - R.lastSeen[a.id] < 3 * DAY) ? W.reopen : 0;
    var parts = { interest: W.interest * interest, fit: W.fit * fit, need: W.need * need, connect: W.connect * connect, fresh: W.fresh * fresh,
      dismissed: -dismissed, ignored: -Math.min(2, ignored), reopen: -reopen };
    var total = Object.keys(parts).reduce(function (s, k) { return s + parts[k]; }, 0);
    return { article: a, total: Math.round(total * 100) / 100, parts: round(parts), facts: { interest: interest, novelty: novelty, ready: ready, depthFit: depthFit, target: target, needC: needC, link: link }, meta: m };
  }
  function round(o) { var r = {}; Object.keys(o).forEach(function (k) { r[k] = Math.round(o[k] * 100) / 100; }); return r; }
  var byIdCache = {};

  var SLOT_HELP = { Continue: 'develops an interest you already have', Understand: 'fills in background you need', Explore: 'widens your reading' };
  function sectionName(id) { var s = ((window.NB && NB.aiArticles && NB.aiArticles.sections) || []).filter(function (x) { return x.id === id; })[0]; return s ? s.name : id; }

  // Three slots with distinct jobs; a slot stays empty rather than holding a poor pick.
  function recommend(events, articles, opts) {
    opts = opts || {}; var t = opts.now || Date.now();
    byIdCache = {}; articles.forEach(function (a) { byIdCache[a.id] = a; });
    var R = model(events, articles, t), used = {}, picks = [];
    var unread = articles.filter(function (a) { return (R.engagement[a.id] || 0) < READ && !R.dismissed[a.id]; });
    var scored = unread.map(function (a) { return score(a, R, t); });
    var sparse = !Object.keys(R.engagement).some(function (k) { return R.engagement[k] >= 0.3; }) && !Object.keys(R.interest).length && !Object.keys(R.need).length;
    function take(slot, list, reason) {
      var best = list.filter(function (s) { return !used[s.article.id]; })[0];
      if (!best) { picks.push({ slot: slot, empty: true, reason: 'Nothing suitable yet: ' + SLOT_HELP[slot] + ' once there is more to go on.' }); return; }
      used[best.article.id] = 1;
      picks.push({ slot: slot, article: best.article, id: best.article.id, score: best.total, breakdown: best.parts, reason: reason(best), version: VERSION });
    }
    if (sparse) { // editorial starting points for a new profile
      var current = (NB.aiArticles.editions || []).filter(function (e) { return e.id === NB.aiArticles.currentEdition; })[0] || {};
      var lead = scored.filter(function (s) { return s.article.id === current.leadId; });
      var counts = {}; articles.forEach(function (a) { meta(a).assumes.forEach(function (c) { counts[c] = (counts[c] || 0) + 1; }); });
      var primers = scored.filter(function (s) { return s.meta.depth === 1; }).sort(function (x, y) {
        var cx = Math.max.apply(null, x.meta.covers.map(function (c) { return counts[c] || 0; }).concat(0)), cy = Math.max.apply(null, y.meta.covers.map(function (c) { return counts[c] || 0; }).concat(0));
        return cy - cx || y.total - x.total;
      });
      var leaders = scored.filter(function (s) { return s.article.section === 'leaders'; }).sort(function (x, y) { return String(y.article.date).localeCompare(String(x.article.date)); });
      take('Continue', lead.length ? lead : scored.sort(function (x, y) { return y.total - x.total; }), function () { return 'Start here: this week’s cover story. Your picks will adapt as you read and react.'; });
      take('Understand', primers, function (s) { var c = s.meta.covers.slice().sort(function (x, y) { return (counts[y] || 0) - (counts[x] || 0); })[0]; return 'A primer on ' + lc(c) + ', which ' + (counts[c] || 0) + ' other articles take for granted.'; });
      take('Explore', leaders, function () { return 'Our view of the week: an argument rather than a report.'; });
      return { picks: picks, model: R, version: VERSION, sparse: true };
    }
    var topInterest = Object.keys(R.interest).sort(function (x, y) { return R.interest[y] - R.interest[x]; }).slice(0, 5);
    // Continue: deeper on what you care about
    take('Continue', scored.filter(function (s) { return s.facts.interest > 0.15 && s.meta.covers.some(function (c) { return topInterest.indexOf(c) >= 0; }); })
      .sort(function (x, y) { return (y.total + W.interest * y.facts.interest) - (x.total + W.interest * x.facts.interest); }), function (s) {
      var c = s.meta.covers.filter(function (x) { return topInterest.indexOf(x) >= 0; })[0], why = (R.why[c] || []).slice(-1)[0];
      return 'Because you ' + (why || 'showed interest in ' + lc(c)) + ', this goes ' + (s.meta.depth >= 2 ? 'deeper' : 'further') + ' into ' + lc(c) + '.';
    });
    // Understand: background you asked for, or that a recent article assumed
    take('Understand', scored.filter(function (s) { return s.facts.needC.length; }).sort(function (x, y) { return y.parts.need - x.parts.need || y.total - x.total; }), function (s) {
      var c = s.facts.needC[0], src = R.needFrom[c] || {};
      return src.explicit ? 'You asked for background after «' + (src.article ? src.article.title : 'an article') + '»; this explains ' + lc(c) + '.'
        : '«' + (src.article ? src.article.title : 'An article you read') + '» assumed you knew about ' + lc(c) + '; this covers it.';
    });
    // Explore: the section you have read least, starting somewhere you can follow
    var bySection = {}; articles.forEach(function (a) { bySection[a.section] = (bySection[a.section] || 0) + (R.engagement[a.id] || 0); });
    var quiet = Object.keys(bySection).sort(function (x, y) { return bySection[x] - bySection[y]; });
    take('Explore', scored.filter(function (s) { return s.facts.ready >= 0.6 || s.meta.depth === 1; })
      .sort(function (x, y) { return quiet.indexOf(x.article.section) - quiet.indexOf(y.article.section) || (y.parts.fit + y.parts.connect) - (x.parts.fit + x.parts.connect); }), function (s) {
      var l = s.facts.link;
      return 'You have read little in ' + sectionName(s.article.section) + (l ? '; this connects to ' + lc(l.concept) + ' from «' + l.article.title + '».' : '; this one needs no background.');
    });
    return { picks: picks, model: R, version: VERSION, sparse: false };
  }

  /* ---------- evaluation: is any of this working? ---------- */
  function evaluate(events, articles) {
    byIdCache = {}; articles.forEach(function (a) { byIdCache[a.id] = a; });
    var R = model(events, articles), versions = {};
    var picksShown = events.filter(function (e) { return e.type === 'exposure'; });
    picksShown.forEach(function (e) {
      var v = (e.payload || {}).version || 'unknown', s = versions[v] = versions[v] || { shown: {}, selected: 0, sustained: 0, worthwhile: 0, dismissed: 0 };
      s.shown[e.article] = 1;
    });
    Object.keys(versions).forEach(function (v) {
      var s = versions[v], ids = Object.keys(s.shown);
      s.shownCount = ids.length;
      s.selected = ids.filter(function (id) { return R.selected[id]; }).length;
      s.sustained = ids.filter(function (id) { return R.selected[id] && (R.engagement[id] || 0) >= 0.5; }).length;
      s.worthwhile = ids.filter(function (id) { return R.feedback[id + ':useful']; }).length;
      s.dismissed = ids.filter(function (id) { return R.dismissed[id]; }).length;
      delete s.shown;
    });
    var engaged = articles.filter(function (a) { return (R.engagement[a.id] || 0) >= 0.3; });
    var bySec = {}; engaged.forEach(function (a) { bySec[a.section] = (bySec[a.section] || 0) + 1; });
    var n = engaged.length, keys = Object.keys(bySec), H = keys.reduce(function (h, k) { var p = bySec[k] / n; return h - p * Math.log(p); }, 0);
    var nSec = (NB.aiArticles.sections || []).length || 1;
    var depth = { 1: 0, 2: 0, 3: 0 }; engaged.forEach(function (a) { depth[meta(a).depth]++; });
    var requested = Object.keys(R.needFrom).filter(function (c) { return R.needFrom[c].explicit; });
    return { versions: versions, spread: n ? H / Math.log(nSec) : 0, sectionsRead: bySec, depth: depth, engagedCount: n,
      background: { requested: requested.length, answered: requested.filter(function (c) { return R.answered[c]; }).length, within7: requested.filter(function (c) { return R.answered[c] && R.answered[c].after < 7 * DAY; }).length } };
  }

  // Concepts nothing in the archive explains as its main subject: candidates for future explainers.
  function gaps(articles) {
    var covered = {}, assumed = {};
    articles.forEach(function (a) { var m = meta(a); m.covers.forEach(function (c) { covered[c] = 1; }); m.assumes.forEach(function (c) { assumed[c] = (assumed[c] || 0) + 1; }); });
    return Object.keys(assumed).filter(function (c) { return !covered[c]; }).sort(function (x, y) { return assumed[y] - assumed[x]; }).map(function (c) { return { concept: c, label: label(c), assumedBy: assumed[c] }; });
  }

  return { VERSION: VERSION, W: W, CONCEPTS: C, ARTICLES: A, meta: meta, label: label, model: model, recommend: recommend, evaluate: evaluate, gaps: gaps, union: union, READ: READ };
})();
