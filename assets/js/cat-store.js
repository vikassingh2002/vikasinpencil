/* Curiosity Cat: where progress is kept.

   Always in this browser. When the desk's owner is signed in (the same sign-in as
   desk.html), it is also kept in the desk's cloud table, as a private 'setting' row
   marked scope: 'curiosity-cat', so the laptop and phone share it. Visitors' progress
   stays in their own browser; nothing private is ever read for them.

   The first time the owner opens it, progress from the earlier Curiosity feed (kept
   inside the desk's main settings) is carried over. */
window.CatStore = (function () {
  'use strict';

  var NB = window.NB || {};
  var cfg = NB.deskConfig || {};
  var Brain = window.CatBrain;
  var SCOPE = 'curiosity-cat';
  var PREFIX = 'nb.cat.v1:';
  var state = Brain.blank();
  var who = 'local';         // 'local' or the owner's user id
  var mode = 'local';        // 'local' (this browser) or 'cloud'
  var client = null;
  var row = null;            // the cloud row, once known
  var timer = null;
  var dirty = false;
  var listeners = [];

  function read(k) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; } }
  function write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode: memory only */ } }
  function uid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 3 | 8)).toString(16);
    });
  }
  function clean(s) {
    var b = Brain.blank();
    if (!s || typeof s !== 'object') return b;
    Object.keys(b).forEach(function (k) { if (s[k] !== undefined && s[k] !== null) b[k] = s[k]; });
    return b;
  }
  function emit() { listeners.forEach(function (fn) { try { fn(mode); } catch (e) { /* a listener's problem */ } }); }

  // The earlier feed kept { cards: { id: { when, right, again, saved } } } in the desk's settings.
  function fromOldFeed(old) {
    var s = Brain.blank();
    var cards = old && old.cards;
    if (!cards) return null;
    Object.keys(cards).forEach(function (id) {
      var c = cards[id] || {};
      if (c.saved) s.saved[id] = true;
      if (c.when) {
        s.seen[id] = { stage: 'done', at: c.when, correct: typeof c.right === 'boolean' ? c.right : null, confidence: 2,
          review: { due: c.again || (c.when + 8 * Brain.DAY), days: c.again ? 14 : 8 }, variantsUsed: [] };
      }
    });
    s.migratedFrom = 'desk-feed';
    return s;
  }

  function saveLocal() { write(PREFIX + who, state); }

  function scheduleCloud() {
    if (mode !== 'cloud') return;
    dirty = true;
    clearTimeout(timer);
    timer = setTimeout(push, 800);
  }
  var pushing = false;
  function push() {
    if (mode !== 'cloud' || !client || !dirty || pushing) return Promise.resolve();
    if (navigator.onLine === false) return Promise.resolve();
    // Decide the row's id before the first save, so every save after it updates the same row.
    if (!row) { row = { id: uid(), created_at: new Date().toISOString() }; write(PREFIX + who + ':row', row); }
    dirty = false;
    pushing = true;
    var payload = { id: row.id, kind: 'setting', data: { scope: SCOPE, state: state }, position: 1000, shared: false, archived: false, created_at: row.created_at };
    return client.from('desk_items').upsert([payload]).then(function (res) {
      if (res && res.error) throw res.error;
      pushing = false;
      if (dirty) scheduleCloud(); // changed while saving: save again
    }).catch(function () { pushing = false; dirty = true; clearTimeout(timer); timer = setTimeout(push, 20000); });
  }
  window.addEventListener('online', function () { if (dirty) push(); });
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden' && dirty) push(); });

  function useState(s) { state = clean(s); saveLocal(); }

  // Find out who is here, and bring the cloud copy in if it's the owner.
  function init() {
    state = clean(read(PREFIX + 'local'));
    var lib = window.supabase;
    if (!cfg.supabaseUrl || !cfg.supabaseKey || !lib || typeof lib.createClient !== 'function' || /^sb_secret_/i.test(cfg.supabaseKey)) {
      return Promise.resolve(mode);
    }
    client = lib.createClient(cfg.supabaseUrl, cfg.supabaseKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } });
    return client.auth.getSession().then(function (res) {
      var session = res && res.data && res.data.session;
      if (!session) return mode;
      return client.rpc('desk_is_owner').then(function (r) {
        if (!r || r.error || r.data !== true) return mode;
        who = session.user.id;
        mode = 'cloud';
        var cached = read(PREFIX + who);
        row = read(PREFIX + who + ':row');
        state = clean(cached);
        return client.from('desk_items').select('id,data,created_at').eq('kind', 'setting').then(function (q) {
          if (q.error) throw q.error;
          var rows = q.data || [];
          // normally one row; if two devices ever made one at once, the most recently updated wins
          var mine = rows.filter(function (x) { return x.data && x.data.scope === SCOPE; })
            .sort(function (a, b) { return ((b.data.state || {}).updatedAt || 0) - ((a.data.state || {}).updatedAt || 0); })[0];
          var main = rows.filter(function (x) { return !(x.data && x.data.scope); })[0];
          if (mine) {
            row = { id: mine.id, created_at: mine.created_at };
            write(PREFIX + who + ':row', row);
            var cloud = clean(mine.data.state);
            if (!cached || cloud.updatedAt >= (state.updatedAt || 0)) useState(cloud);
            else { dirty = true; push(); }
          } else if (!cached) {
            var carried = fromOldFeed(main && main.data && main.data.curiosity);
            if (carried) { useState(carried); dirty = true; push(); }
          } else { dirty = true; push(); }
          return mode;
        });
      });
    }).catch(function () {
      // Offline or the cloud is unreachable: carry on with this browser's copy.
      return mode;
    }).then(function (m) { emit(); return m; });
  }

  return {
    init: init,
    get: function () { return state; },
    update: function (fn) {
      fn(state);
      state.updatedAt = Date.now();
      saveLocal();
      scheduleCloud();
    },
    mode: function () { return mode; },
    onChange: function (fn) { listeners.push(fn); },
    flush: push,
    // for tests: replace the whole state
    _reset: function (s) { useState(s || Brain.blank()); }
  };
})();
