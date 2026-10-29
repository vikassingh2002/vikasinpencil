/* =============================================================
   Vikas in Pencil: the desk.

   A personal home page for choosing how to spend the time, built
   around three questions: what do I want to do, what is the easiest
   way to begin, and where did I leave off?

   Where things are kept:
   - With Supabase connected (assets/js/desk-config.js), the desk
     lives in the cloud, so the laptop and the phone see the same
     desk. Only the owner's account can read private items or change
     anything; anyone can see items marked as shared. The database
     enforces both rules itself (supabase/schema.sql).
   - Every change lands on this device first and reaches the cloud
     in the background, so nothing waits on the network and nothing
     is lost while offline.
   - Without Supabase connected, the desk keeps everything in this
     browser.
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
  function now() { return Date.now(); }
  function stamp() { return new Date().toISOString(); }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function uid() {
    var c = window.crypto;
    if (c && c.randomUUID) return c.randomUUID();
    var b = new Uint8Array(16);
    if (c && c.getRandomValues) c.getRandomValues(b);
    else for (var i = 0; i < 16; i++) b[i] = Math.floor(Math.random() * 256);
    b[6] = (b[6] & 15) | 64;
    b[8] = (b[8] & 63) | 128;
    var h = Array.prototype.map.call(b, function (x) { return (x < 16 ? '0' : '') + x.toString(16); }).join('');
    return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20);
  }

  var DAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var MONTH = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  function longDay(d) { return DAY[d.getDay()] + ', ' + d.getDate() + ' ' + MONTH[d.getMonth()]; }
  function ago(ts) {
    if (typeof ts === 'string') ts = Date.parse(ts);
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
  function firstLine(text) {
    var t = String(text || '').trim().split('\n')[0];
    return t.length > 90 ? t.slice(0, 87).replace(/\s+\S*$/, '') + '…' : t;
  }
  // A web address, or one of the notebook's own pages (brief.html, notes.html#N-04).
  function safeUrl(u) {
    u = String(u || '').trim();
    if (/^https?:\/\/[^\s"'<>]+$/i.test(u)) return u;
    if (/^[\w-]+\.html(#[\w-]*)?$/.test(u)) return u;
    return '';
  }
  // What people type: "celestrak.org" means https://celestrak.org. Empty if it isn't an address at all.
  function typedUrl(u) {
    u = String(u || '').trim();
    if (!u || safeUrl(u)) return u;
    if (/^[\w-]+(\.[\w-]+)+([/?#][^\s"'<>]*)?$/.test(u)) return 'https://' + u;
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
  function dayNumber() { return Math.floor((now() - new Date().getTimezoneOffset() * 60000) / 86400000); }
  function readJSON(k, fallback) { try { var v = window.localStorage.getItem(k); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; } }
  function writeJSON(k, v) { try { window.localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  function forget(k) { try { window.localStorage.removeItem(k); } catch (e) { /* nothing to forget */ } }

  /* ------------------------------------------------------------
     The desk's items, and where they're kept
     ------------------------------------------------------------ */

  // Every item is one row: { id, kind, data, position, shared, archived, created_at, updated_at }.
  var TABLE = 'desk_items';
  var KINDS = ['project', 'note', 'library', 'idea', 'link', 'offline', 'setting'];
  var SHAREABLE = ['project', 'library', 'link'];
  var CACHE = 'nb.desk.v2';
  var PENDING = 'nb.desk.v2.pending';
  var LEGACY = 'nb.desk';
  var LEGACY_DONE = 'nb.desk.imported';

  // A secret key would let anyone who reads the published config do anything to the database.
  function looksSecret(key) {
    key = String(key || '');
    if (/^sb_secret_/i.test(key)) return true;
    var part = key.split('.')[1];
    if (!part) return false;
    try { return JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/'))).role === 'service_role'; } catch (e) { return false; }
  }

  var site = NB.site || {};
  var me = String(site.name || '').split(' ')[0] || 'the owner'; // the desk's owner, by name
  var cfg = NB.deskConfig || {};
  var secretKey = looksSecret(cfg.supabaseKey);
  var configured = !!(cfg.supabaseUrl && cfg.supabaseKey) && !secretKey;
  var lib = window.supabase;
  var client = configured && lib && typeof lib.createClient === 'function'
    ? lib.createClient(cfg.supabaseUrl, cfg.supabaseKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } })
    : null;

  // local: no cloud set up, kept in this browser · loading · visitor: sees what's shared
  // owner: can change everything · stranger: signed in, but not the owner
  var mode = configured ? 'loading' : 'local';
  var user = null;
  var rows = [];
  var pending = {};
  var touched = {}; // when this device last changed each item
  var status = 'idle';
  var problem = '';
  var lastPull = 0;
  var heard = false; // has the cloud answered yet?

  function canEdit() { return mode === 'owner' || mode === 'local'; }
  function pendingKey() { return PENDING + ':' + (mode === 'local' ? 'local' : user ? user.id : 'none'); }
  function persist() {
    if (mode === 'local') writeJSON(CACHE, { user: 'local', rows: rows });
    else if (mode === 'owner' && user) writeJSON(CACHE, { user: user.id, owner: true, rows: rows });
  }
  function find(id) { for (var i = 0; i < rows.length; i++) if (rows[i].id === id) return rows[i]; return null; }
  function byKind(kind, archived) {
    return rows.filter(function (r) { return r.kind === kind && !!r.archived === !!archived; })
      .sort(function (a, b) { return (a.position - b.position) || String(a.created_at).localeCompare(String(b.created_at)); });
  }
  function newestFirst(list) { return list.slice().sort(function (a, b) { return String(b.created_at).localeCompare(String(a.created_at)); }); }
  function edge(kind, last) {
    var ps = rows.filter(function (r) { return r.kind === kind; }).map(function (r) { return r.position; });
    if (!ps.length) return 1;
    return last ? Math.max.apply(null, ps) + 1 : Math.min.apply(null, ps) - 1;
  }
  function make(kind, data, first) {
    var t = stamp();
    return { id: uid(), kind: kind, data: data || {}, position: edge(kind, !first), shared: false, archived: false, created_at: t, updated_at: t };
  }
  function put(r) {
    if (!canEdit()) return r;
    if (SHAREABLE.indexOf(r.kind) === -1) r.shared = false; // notes and settings are never shared
    r.updated_at = stamp();
    if (!r.created_at) r.created_at = r.updated_at;
    var at = -1;
    for (var i = 0; i < rows.length; i++) if (rows[i].id === r.id) { at = i; break; }
    if (at === -1) rows.push(r); else rows[at] = r;
    mark(r.id, 'upsert');
    return r;
  }
  function remove(r) {
    if (!canEdit() || !r) return;
    rows = rows.filter(function (x) { return x.id !== r.id; });
    mark(r.id, 'delete');
  }
  function mark(id, op) {
    touched[id] = now();
    if (mode === 'owner') {
      pending[id] = { op: op, v: (pending[id] ? pending[id].v : 0) + 1 };
      writeJSON(pendingKey(), pending);
      setStatus('saving');
      schedulePush(400);
    }
    persist();
  }

  /* Sending changes to the cloud: the latest version of each changed item, in one go. */
  var pushing = false;
  var pushTimer = null;
  function schedulePush(ms) { clearTimeout(pushTimer); pushTimer = setTimeout(push, ms); }
  function toCloud(r) { return { id: r.id, kind: r.kind, data: r.data, position: r.position, shared: !!r.shared, archived: !!r.archived, created_at: r.created_at }; }
  function isNetwork(err) {
    return navigator.onLine === false || !err || err.name === 'TypeError' || /fetch|network|load failed|timeout/i.test(String(err.message || err));
  }
  function describe(err) {
    if (!err) return 'Something went wrong.';
    if (err.code === '42501' || /row-level security|permission/i.test(String(err.message))) return 'This account isn\'t allowed to change the desk.';
    if (err.status === 401 || /JWT|token/i.test(String(err.message))) return 'You\'ve been signed out. Sign in again to save.';
    return String(err.message || err);
  }
  function push() {
    if (mode !== 'owner' || pushing || !client) return Promise.resolve();
    var ids = Object.keys(pending);
    if (!ids.length) { setStatus('idle'); return Promise.resolve(); }
    if (navigator.onLine === false) { setStatus('offline'); return Promise.resolve(); }
    pushing = true;
    setStatus('saving');
    var sent = {};
    ids.forEach(function (id) { sent[id] = pending[id].v; });
    var ups = ids.filter(function (id) { return pending[id].op === 'upsert' && find(id); }).map(function (id) { return toCloud(find(id)); });
    var dels = ids.filter(function (id) { return pending[id].op === 'delete' || !find(id); });
    var first = ups.length ? client.from(TABLE).upsert(ups) : Promise.resolve({ error: null });
    return first.then(function (res) {
      if (res && res.error) throw res.error;
      return dels.length ? client.from(TABLE).delete().in('id', dels) : { error: null };
    }).then(function (res) {
      if (res && res.error) throw res.error;
      ids.forEach(function (id) { if (pending[id] && pending[id].v === sent[id]) delete pending[id]; });
      writeJSON(pendingKey(), pending);
      pushing = false;
      problem = '';
      if (Object.keys(pending).length) schedulePush(150);
      else setStatus('idle');
    }).catch(function (err) {
      pushing = false;
      if (isNetwork(err)) { setStatus('offline'); schedulePush(15000); }
      else { problem = describe(err); setStatus('error'); schedulePush(60000); }
    });
  }

  /* Fetching the desk: everything this account may see. Anything changed on this device
     while the answer was on its way, or not yet sent, stays as this device has it. */
  var pullSeq = 0;
  function pull() {
    if (!client) return Promise.resolve();
    var seq = ++pullSeq;
    var asked = now();
    var unsent = Object.keys(pending); // the cloud may answer from before these arrive
    return client.from(TABLE).select('id,kind,data,position,shared,archived,created_at,updated_at').order('position', { ascending: true })
      .then(function (res) {
        if (res.error) throw res.error;
        if (seq !== pullSeq) return; // a newer answer is on its way
        var first = !heard;
        var before = signature(rows);
        var keep = {};
        unsent.concat(Object.keys(pending)).forEach(function (id) { keep[id] = true; });
        Object.keys(touched).forEach(function (id) {
          if (touched[id] >= asked) keep[id] = true;
          else if (now() - touched[id] > 120000) delete touched[id];
        });
        var fresh = list(res.data).filter(function (r) { return r && KINDS.indexOf(r.kind) !== -1 && !keep[r.id]; });
        Object.keys(keep).forEach(function (id) { var mine = find(id); if (mine) fresh.push(mine); });
        rows = fresh;
        lastPull = now();
        heard = true;
        persist();
        if (mode === 'owner' && status === 'offline' && !Object.keys(pending).length) setStatus('idle');
        if (first || signature(rows) !== before) renderSoon();
      })
      .catch(function (err) {
        if (seq !== pullSeq) return;
        heard = true;
        if (mode === 'owner') {
          if (isNetwork(err)) setStatus('offline');
          else { problem = describe(err); setStatus('error'); }
          return;
        }
        problem = isNetwork(err) ? 'The desk can\'t reach the cloud right now. Check the connection and try again.' : describe(err);
        renderSoon();
      });
  }

  // What the desk holds, ignoring the order rows arrive in and how the cloud spells dates and keys.
  function canon(x) {
    if (Array.isArray(x)) return '[' + x.map(canon).join(',') + ']';
    if (x && typeof x === 'object') return '{' + Object.keys(x).sort().map(function (k) { return JSON.stringify(k) + ':' + canon(x[k]); }).join(',') + '}';
    return JSON.stringify(x);
  }
  function signature(rs) {
    return rs.map(function (r) {
      return [r.id, r.kind, r.position, !!r.shared, !!r.archived, Date.parse(r.created_at), canon(r.data)].join('|');
    }).sort().join('\n');
  }

  function setStatus(s) {
    var was = status;
    status = s;
    if (s === 'error' || was === 'error') { renderSoon(); return; } // the warning line comes and goes with it
    var el = $('#sync', root);
    if (el) el.outerHTML = syncHtml();
  }

  /* Who is here: the owner, someone signed in who isn't, or a visitor. */
  var knownUser;
  var leaving = false; // signing out on purpose, rather than being signed out
  function useSession(session) {
    var u = session ? session.user : null;
    var id = u ? u.id : null;
    if (id === knownUser) return;
    var was = knownUser;
    knownUser = id;
    user = u;
    heard = false;
    problem = '';
    if (!u) {
      // Signing out on purpose leaves nothing private behind on this device. Being signed out
      // keeps unsent changes here, to send once you're back.
      if (leaving && was) { forget(CACHE); forget(PENDING + ':' + was); }
      else if (was && Object.keys(pending).length) problem = 'You were signed out before every change reached the cloud. Sign in again on this device and they\'ll be sent.';
      leaving = false;
      mode = 'visitor';
      rows = [];
      pending = {};
      render();
      pull();
      return;
    }
    var cached = readJSON(CACHE, null);
    var mine = cached && cached.user === u.id;
    rows = mine ? list(cached.rows) : [];
    mode = mine && cached.owner ? 'owner' : 'loading';
    pending = readJSON(pendingKey(), {}) || {};
    render();
    client.rpc('desk_is_owner').then(function (res) {
      if (res.error) throw res.error;
      if (res.data === true) {
        mode = 'owner';
        render();
        return pull().then(push);
      }
      mode = 'stranger';
      if (mine) { forget(CACHE); forget(pendingKey()); } // no longer the owner: nothing private stays here
      rows = [];
      pending = {};
      render();
      return pull();
    }).catch(function (err) {
      if (mine && cached.owner) { mode = 'owner'; setStatus('offline'); render(); return; } // offline: carry on with this device's copy
      mode = 'visitor';
      problem = isNetwork(err) ? 'You\'re signed in, but the desk can\'t reach the cloud right now.' : describe(err);
      render();
    });
  }

  function start() {
    if (!configured) {
      var cached = readJSON(CACHE, null);
      rows = cached && cached.user === 'local' ? list(cached.rows) : [];
      pending = {};
      render();
      return;
    }
    if (!client) {
      // The cloud library didn't load (offline?). Use this device's copy if it's the owner's.
      var c = readJSON(CACHE, null);
      if (c && c.owner) { mode = 'owner'; user = { id: c.user }; rows = list(c.rows); pending = readJSON(pendingKey(), {}) || {}; status = 'offline'; }
      else { mode = 'visitor'; problem = 'The desk can\'t reach the cloud right now. Check the connection and reload.'; }
      render();
      return;
    }
    client.auth.onAuthStateChange(function (event, session) {
      // supabase-js asks that this callback doesn't call back into it straight away
      setTimeout(function () { useSession(session); }, 0);
    });
  }

  // Coming back to the tab, or back online: catch up with the other device.
  function refresh() {
    if (!client || mode === 'loading') return;
    if (mode === 'owner') push();
    if (now() - lastPull > 10000) pull();
  }
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') refresh(); });
  window.addEventListener('focus', refresh);
  setInterval(function () { if (document.visibilityState === 'visible') refresh(); }, 60000);
  window.addEventListener('online', function () { if (mode === 'owner') setStatus('saving'); refresh(); });
  window.addEventListener('offline', function () { if (mode === 'owner') setStatus('offline'); });

  /* ------------------------------------------------------------
     Reading the desk
     ------------------------------------------------------------ */

  function setting() { return byKind('setting')[0] || null; }
  function projects() { return byKind('project'); }
  function current() {
    var s = setting();
    var p = s && s.data && find(s.data.current);
    if (p && p.kind === 'project' && !p.archived) return p;
    return projects()[0] || null;
  }
  function setCurrent(p) {
    var s = setting() || make('setting', {});
    if (s.data.current === (p && p.id)) return;
    s.data.current = p ? p.id : '';
    put(s);
  }
  function notesFor(p) {
    return rows.filter(function (r) { return r.kind === 'note' && r.data && r.data.project === p.id; })
      .sort(function (a, b) { return String(a.created_at).localeCompare(String(b.created_at)); });
  }
  function milestoneNow(p) {
    var ms = list(p.data.milestones);
    for (var i = 0; i < ms.length; i++) if (!ms[i].done) return { i: i, m: ms[i] };
    return null;
  }
  function ideas() { return newestFirst(byKind('idea')); }
  function library() { return byKind('library'); }
  function links() { return byKind('link'); }
  function offline() { return byKind('offline'); }
  function categories() {
    var seen = [];
    links().forEach(function (l) { var c = (l.data.category || 'Everyday').trim() || 'Everyday'; if (seen.indexOf(c) === -1) seen.push(c); });
    return seen;
  }

  /* From the public notebook: books on the go, and questions worth sitting with. */
  var refNotes = (NB.references || {}).notes || {};
  var goodreads = list((NB.goodreads || {}).books).filter(function (b) { return b.shelf === 'currently-reading' && !(refNotes[b.id] || {}).hide; }).map(function (b) {
    var n = refNotes[b.id] || {};
    return { id: 'gr-' + b.id, title: n.title || b.title, by: n.author || b.author };
  });
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
    ideas().forEach(function (i) { if (i.data.kind === 'question') qs.push(i.data.text); });
    return qs;
  }

  /* ------------------------------------------------------------
     What's on screen right now (not kept)
     ------------------------------------------------------------ */

  var VIEWS = ['continue', 'choose', 'capture', 'unwind', 'curiosity', 'library', 'doors', 'settings', 'signin'];
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
    editProject: false,
    editMilestones: false,
    editId: '',
    msDraft: null,
    msNew: '',
    libFilter: 'open',
    ideaFilter: 'all',
    kind: 'thought',
    prefill: '',
    open: {}, // which folded sections are open
    preview: false,
    authError: '',
    busy: false,
    cur: { id: '', guess: -1, more: false, topic: 'all', kept: false } // the curiosity card on screen
  };
  function viewFromHash() {
    var h = location.hash.replace('#', '');
    return VIEWS.indexOf(h) !== -1 ? h : 'home';
  }
  function resetEditing() {
    ui.stuck = false;
    ui.why = '';
    ui.editingNext = false;
    ui.doneFlow = false;
    ui.editProject = false;
    ui.editMilestones = false;
    ui.msDraft = null;
    ui.msNew = '';
    ui.editId = '';
  }
  function folded(key, openByDefault) {
    var on = key in ui.open ? ui.open[key] : openByDefault;
    return '<details class="desk__fold" data-keep="' + key + '" data-was="' + (on ? 1 : 0) + '"' + (on ? ' open' : '') + '>';
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
  var MORE = [['curiosity', 'Curiosity'], ['library', 'Library'], ['doors', 'Doors'], ['settings', 'Settings']];
  var TYPES = ['Book', 'Article', 'Essay', 'Video', 'Podcast', 'Course', 'Film', 'Show', 'Music', 'Other'];
  var SHELVES = [['reading', 'To read or learn'], ['unwind', 'To unwind with']];
  var STATUS = [['queued', 'Up next'], ['doing', 'In progress'], ['done', 'Finished']];
  var IDEA_KINDS = [['thought', 'Thought'], ['idea', 'Idea'], ['question', 'Question']];
  function labelOf(pairs, key) { for (var i = 0; i < pairs.length; i++) if (pairs[i][0] === key) return pairs[i][1]; return ''; }
  function options(values, selected) {
    return values.map(function (v) {
      var key = Array.isArray(v) ? v[0] : v;
      var name = Array.isArray(v) ? v[1] : v;
      return '<option value="' + esc(key) + '"' + (key === selected ? ' selected' : '') + '>' + esc(name) + '</option>';
    }).join('');
  }
  function sharedBox(r, key) {
    return '<label class="desk__check"><input type="checkbox" id="share-' + esc(key) + '" name="shared"' + (r && r.shared ? ' checked' : '') + '> Show this to visitors</label>';
  }
  var SHARED_TAG = '<span class="desk__tag">Shared</span>';

  function syncHtml() {
    var text = '';
    var cls = 'sync';
    if (mode === 'local') text = 'Kept in this browser';
    else if (mode === 'owner') {
      if (status === 'saving') text = 'Saving…';
      else if (status === 'offline') { text = 'Offline · will sync'; cls += ' sync--offline'; }
      else if (status === 'error') return '<button type="button" class="sync sync--error" id="sync" data-act="retry" title="' + esc(problem) + '">Not saved · try again</button>';
      else text = 'Saved';
    }
    return '<span class="' + cls + '" id="sync" role="status">' + esc(text) + '</span>';
  }

  function topHtml() {
    var d = new Date();
    var h = d.getHours();
    var hello = h < 5 ? 'Still up' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
    var name = String(site.name || '').split(' ')[0];
    return '<header class="desk__top">' +
        '<p class="desk__kicker">Desk · ' + esc(longDay(d)) + '</p>' +
        '<p class="desk__right">' + syncHtml() + '<a class="desk__out ink-link" href="index.html">The notebook →</a></p>' +
      '</header>' +
      (mode === 'local' ? '<p class="desk__banner">The cloud isn\'t connected yet, so this desk is kept in this browser only. <a class="ink-link" href="#settings">How to connect it</a></p>' : '') +
      (mode === 'owner' && status === 'error' && problem ? '<p class="desk__banner desk__banner--warn">' + esc(problem) + '</p>' : '') +
      '<p class="desk__hello">' + esc(hello + (name ? ', ' + name : '')) + '.</p>' +
      '<h1 class="desk__ask">What would you like to do?</h1>' +
      '<nav class="desk__ways" aria-label="What to do">' + WAYS.map(function (w) {
        var on = ui.view === w.key;
        return '<a class="way' + (on ? ' is-on' : '') + '" href="#' + w.key + '"' + (on ? ' aria-current="page"' : '') + '>' +
          '<span class="way__name">' + esc(w.name) + '</span><span class="way__sub">' + esc(w.sub) + '</span></a>';
      }).join('') + '</nav>' +
      '<div class="desk__under">' +
        '<nav class="desk__more" aria-label="More of the desk">' + MORE.map(function (m) {
          var on = ui.view === m[0];
          return '<a class="desk__morelink' + (on ? ' is-on' : '') + '" href="#' + m[0] + '"' + (on ? ' aria-current="page"' : '') + '>' + esc(m[1]) + '</a>';
        }).join('') + '</nav>' +
        '<button type="button" class="btn btn--text desk__leave" data-act="leave">Or leave the screen for a while →</button>' +
      '</div>';
  }

  function welcomeHtml() {
    var empty = !rows.some(function (r) { return r.kind !== 'setting'; });
    var legacy = readJSON(LEGACY, null);
    var showLegacy = legacy && list(legacy.projects).length + list(legacy.inbox).length + list(legacy.chosen).length > 0 && !readJSON(LEGACY_DONE, null);
    var html = '';
    if (showLegacy) {
      html += '<section class="box welcome"><p class="label">From before</p>' +
        '<p class="prose">This browser still has the earlier desk: ' + esc(plural(list(legacy.projects).length, 'project', 'projects')) + ', ' + esc(plural(list(legacy.inbox).length, 'captured note', 'captured notes')) + ' and ' + esc(plural(list(legacy.chosen).length, 'saved thing', 'saved things')) + '.</p>' +
        '<div class="actions"><button type="button" class="btn" data-act="import-legacy">Bring it in</button><button type="button" class="btn btn--text" data-act="skip-legacy">Leave it</button></div></section>';
    }
    if (empty) {
      html += '<section class="box welcome"><p class="label">A fresh desk</p>' +
        '<h2 class="hand-l">Start with something small.</h2>' +
        '<p class="prose">Everything here is yours to change. A few ways to begin:</p>' +
        '<div class="actions">' +
          (list(NB.experiments).some(function (e) { return e.status === 'planned' || e.status === 'running'; }) ? '<button type="button" class="btn" data-act="starter-projects">Bring in my notebook\'s experiments</button>' : '') +
          '<a class="btn btn--line" href="#continue">Start a project</a>' +
          '<button type="button" class="btn btn--line" data-act="starter-doors">Add a few doors</button>' +
          '<button type="button" class="btn btn--text" data-act="starter-offline">Add some off-screen ideas</button>' +
        '</div></section>';
    }
    return html;
  }

  function leftOffHtml() {
    var p = current();
    if (!p) {
      if (!rows.some(function (r) { return r.kind !== 'setting'; })) return '';
      return '<section class="box leftoff"><p class="label">Right where you left off</p>' +
        '<p class="hand-m">Nothing on the bench right now.</p>' +
        '<div class="actions"><a class="btn btn--line" href="#continue">Start a project</a><a class="btn btn--text" href="#choose">Or choose something</a></div></section>';
    }
    var parts = split(p.data.next);
    var mn = milestoneNow(p);
    var ns = notesFor(p);
    var note = ns[ns.length - 1];
    return '<section class="leftoff box" aria-labelledby="leftoff-title">' +
      '<p class="label">Right where you left off</p>' +
      '<h2 class="hand-l leftoff__title" id="leftoff-title">' + esc(p.data.title) + '</h2>' +
      (mn ? '<p class="leftoff__step">Step ' + (mn.i + 1) + ' of ' + p.data.milestones.length + ' · ' + esc(mn.m.name) + '</p>' : '') +
      (p.data.next
        ? '<p class="leftoff__next"><span class="leftoff__tag">Next</span>' + esc(parts[0]) + '</p>' + (parts[1] ? '<p class="leftoff__detail">' + esc(parts[1]) + '</p>' : '')
        : '<p class="leftoff__next"><span class="leftoff__tag">Next</span>Decide the next small step.</p>') +
      (note ? '<p class="leftoff__note">Last time you wrote: “' + esc(note.data.text) + '” <span>· ' + esc(ago(note.created_at)) + '</span></p>' : '') +
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
      help = '<p class="prose">Write down what you need and who might have it. It goes to Capture as a question, so you can work on another part meanwhile.</p>' +
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

  function newProjectHtml(open) {
    return folded('project-new', open) + '<summary class="desk__summary">Start a new project</summary>' +
      '<form class="desk__form" data-form="project-new">' +
        '<label class="field-label" for="np-title">What is it?</label><input class="input" id="np-title" name="title" autocomplete="off" required>' +
        '<label class="field-label" for="np-next">The first small step</label><input class="input" id="np-next" name="next" autocomplete="off">' +
        '<label class="field-label" for="np-ms">Milestones, one per line (optional)</label><textarea class="textarea" id="np-ms" name="milestones" rows="3"></textarea>' +
        '<button class="btn" type="submit">Put it on the bench</button>' +
      '</form></details>';
  }

  function continueHtml() {
    var p = current();
    var others = projects().filter(function (o) { return o !== p; });
    var away = byKind('project', true);
    if (!p) {
      return '<section class="panel"><p class="label">Continue</p><h2 class="hand-l">Nothing on the bench</h2>' +
        '<p class="lede">Start something small. The desk will remember where you stop.</p>' + newProjectHtml(true) + awayHtml(away) + '</section>';
    }
    var d = p.data;
    var ms = list(d.milestones);
    var mn = milestoneNow(p);
    var ns = notesFor(p);
    var done = list(d.done).slice(-4).reverse();
    var head = ui.editProject
      ? '<form class="desk__form edit" data-form="project-edit">' +
          '<label class="field-label" for="pe-title">Project</label><input class="input" id="pe-title" name="title" value="' + esc(d.title) + '" autocomplete="off" required>' +
          '<label class="field-label" for="pe-link">A link for it (optional)</label><input class="input" id="pe-link" name="link" value="' + esc(d.link || '') + '" autocomplete="off" inputmode="url">' +
          sharedBox(p, 'pe') +
          '<p class="note-mono">Sharing shows visitors its title, link, next step, milestones and finished steps. Your notes always stay private.</p>' +
          '<div class="actions"><button class="btn" type="submit">Save</button><button type="button" class="btn btn--text" data-act="cancel">Cancel</button></div>' +
        '</form>'
      : '<h2 class="hand-l" id="panel-title">' + esc(d.title) + '</h2>' +
        '<p class="panel__meta">' + (d.seed ? esc(d.seed) + ' · ' : '') + (safeUrl(d.link) ? '<a class="ink-link" href="' + esc(safeUrl(d.link)) + '">' + (d.seed ? 'in the notebook' : 'open the link') + '</a> · ' : '') +
          (p.shared ? SHARED_TAG + ' · ' : '') +
          '<button type="button" class="btn btn--text panel__edit" data-act="edit-project">Edit</button></p>';
    var milestones = ui.editMilestones && ui.msDraft
      ? '<form class="desk__form edit" data-form="milestones"><p class="field-label">Milestones, in order</p>' +
          ui.msDraft.map(function (m, i) {
            return '<div class="desk__row"><label class="visually-hidden" for="ms-' + i + '">Milestone ' + (i + 1) + '</label>' +
              '<input class="input" id="ms-' + i + '" name="m' + i + '" value="' + esc(m.name) + '" autocomplete="off">' +
              '<button type="button" class="iconbtn" data-act="ms-up" data-i="' + i + '" aria-label="Move ' + esc(m.name) + ' up"' + (i === 0 ? ' disabled' : '') + '>↑</button>' +
              '<button type="button" class="iconbtn" data-act="ms-x" data-i="' + i + '" aria-label="Remove ' + esc(m.name) + '">×</button></div>';
          }).join('') +
          '<label class="visually-hidden" for="ms-new">A new milestone</label><input class="input" id="ms-new" name="new" value="' + esc(ui.msNew) + '" autocomplete="off" placeholder="Add a milestone">' +
          '<div class="actions"><button class="btn" type="submit">Save milestones</button><button type="button" class="btn btn--text" data-act="cancel">Cancel</button></div>' +
        '</form>'
      : (ms.length
          ? '<ol class="milestones">' + ms.map(function (m, i) {
              return '<li class="' + (m.done ? 'is-done' : mn && mn.i === i ? 'is-now' : '') + '"><label>' +
                '<input type="checkbox" data-act="milestone" data-i="' + i + '"' + (m.done ? ' checked' : '') + '>' +
                '<span>' + esc(m.name) + '</span></label></li>';
            }).join('') + '</ol>'
          : '') +
        '<p class="desk__minor"><button type="button" class="btn btn--text" data-act="edit-milestones">' + (ms.length ? 'Change the milestones' : 'Add milestones') + '</button></p>';
    return '<section class="panel" aria-labelledby="panel-title">' +
      '<p class="label">Continue</p>' + head + milestones +
      '<div class="box nextbox">' +
        '<p class="label">The next step</p>' +
        (ui.editingNext
          ? '<form class="desk__form" data-form="next"><label class="visually-hidden" for="next-text">The next step</label>' +
            '<textarea class="textarea textarea--hand" id="next-text" name="text" rows="2">' + esc(d.next || '') + '</textarea>' +
            '<div class="actions"><button class="btn" type="submit">Save</button><button type="button" class="btn btn--text" data-act="cancel">Cancel</button></div></form>'
          : '<p class="nextbox__text">' + (d.next ? lines(d.next) : 'No next step yet. Write one down, however small.') + '</p>') +
        (ui.doneFlow
          ? '<form class="desk__form" data-form="done"><p class="hand-s">Done. What\'s the next small step?</p>' +
            '<label class="visually-hidden" for="done-next">The next small step</label>' +
            '<input class="input input--hand" id="done-next" name="text" autocomplete="off" placeholder="The next small step">' +
            '<div class="actions"><button class="btn" type="submit">Save it</button><button type="button" class="btn btn--text" data-act="cancel">Not now</button></div></form>'
          : '') +
        (!ui.editingNext && !ui.doneFlow
          ? '<div class="actions">' +
              '<button type="button" class="btn" data-act="session" data-min="25">Start · 25 min</button>' +
              '<button type="button" class="btn btn--line" data-act="session" data-min="5">Just 5 minutes</button>' +
              (d.next ? '<button type="button" class="btn btn--line" data-act="done">Done, what\'s next?</button>' : '') +
              '<button type="button" class="btn btn--text" data-act="edit-next">' + (d.next ? 'Change it' : 'Write it') + '</button>' +
              '<button type="button" class="btn btn--text" data-act="stuck">I\'m stuck</button>' +
            '</div>'
          : '') +
        (ui.stuck ? stuckHtml() : '') +
      '</div>' +
      '<p class="label gap-l">Where you stopped</p>' +
      (ns.length
        ? '<ul class="stops">' + ns.slice(-5).reverse().map(function (n) {
            return '<li><p class="stops__text">' + lines(n.data.text) + '</p><p class="stops__when">' + esc(ago(n.created_at)) +
              ' · <button type="button" class="btn btn--text stops__x" data-act="note-x" data-id="' + esc(n.id) + '">Remove</button></p></li>';
          }).join('') + '</ul>'
        : '<p class="muted">No notes yet. A line for next time makes starting again much easier.</p>') +
      '<form class="desk__form" data-form="note"><label class="visually-hidden" for="stop-note">A note for next time</label>' +
        '<textarea class="textarea textarea--hand" id="stop-note" name="text" rows="2" placeholder="I stopped at… Next time, start with…" required></textarea>' +
        '<button class="btn btn--line" type="submit">Leave a note for next time</button></form>' +
      (done.length
        ? '<p class="label gap-l">Recently done</p><ul class="donelist">' + done.map(function (x) {
            return '<li><s>' + esc(x.text) + '</s> <span>' + esc(ago(x.when)) + '</span></li>';
          }).join('') + '</ul>'
        : '') +
      (others.length
        ? '<p class="label gap-l">Also on the bench</p><ul class="bench">' + others.map(function (o) {
            return '<li><div><p class="bench__title">' + esc(o.data.title) + (o.shared ? ' ' + SHARED_TAG : '') + '</p>' +
              (o.data.next ? '<p class="bench__next">Next: ' + esc(split(o.data.next)[0]) + '</p>' : '') + '</div>' +
              '<div class="bench__acts"><button type="button" class="btn btn--line" data-act="switch" data-id="' + esc(o.id) + '">Work on this</button>' +
              '<button type="button" class="btn btn--text" data-act="put-away" data-id="' + esc(o.id) + '">Put away</button></div></li>';
          }).join('') + '</ul>'
        : '') +
      '<p class="desk__minor gap-m"><button type="button" class="btn btn--text" data-act="put-away" data-id="' + esc(p.id) + '">Put this project away</button>' +
        '<button type="button" class="btn btn--text" data-act="delete-project" data-id="' + esc(p.id) + '">Delete it</button></p>' +
      newProjectHtml(false) + awayHtml(away) +
    '</section>';
  }
  function awayHtml(away) {
    if (!away.length) return '';
    return folded('away', false) + '<summary class="desk__summary">Put away (' + away.length + ')</summary><ul class="bench">' + away.map(function (o) {
      return '<li><div><p class="bench__title">' + esc(o.data.title) + '</p></div><div class="bench__acts">' +
        '<button type="button" class="btn btn--line" data-act="bring-back" data-id="' + esc(o.id) + '">Bring it back</button>' +
        '<button type="button" class="btn btn--text" data-act="delete-project" data-id="' + esc(o.id) + '">Delete</button></div></li>';
    }).join('') + '</ul></details>';
  }

  /* Choose: a few honest suggestions for the energy and time you have. */
  function picksFor(energy, time) {
    var all = [];
    function add(c) { if (c.e.indexOf(energy) !== -1 && c.t.indexOf(time) !== -1) all.push(c); }
    var LOW = ['low'], SOME = ['some'], MOST = ['some', 'plenty'], ANY = ['low', 'some', 'plenty'];
    var p = current();
    if (p) {
      var head = split(p.data.next)[0];
      var mins = time === 60 ? 50 : 25;
      if (p.data.next) add({ key: 'p-now', kind: 'Project', title: head, sub: p.data.title, e: MOST, t: [30, 60], w: 6, begin: { type: 'session', minutes: mins, project: p.id }, label: 'Start ' + mins + ' minutes' });
      add({ key: 'p-five', kind: 'Project', title: 'Five minutes on ' + p.data.title, sub: 'Open it and read where you stopped. Starting is most of it.', e: ANY, t: [5], w: 6, begin: { type: 'session', minutes: 5, project: p.id }, label: 'Start 5 minutes' });
      add({ key: 'p-tidy', kind: 'Project', title: 'Small jobs on ' + p.data.title, sub: 'Rename files, sort notes, or write tomorrow\'s first step.', e: LOW, t: [30, 60], w: 3, begin: { type: 'session', minutes: 15, project: p.id }, label: 'Start 15 minutes' });
    }
    projects().forEach(function (o) {
      if (o === p) return;
      add({ key: 'p-' + o.id, kind: 'Project', title: 'An hour on ' + o.data.title, sub: o.data.next ? 'Next: ' + split(o.data.next)[0] : 'Start by writing its next step.', e: ['plenty'], t: [60], w: 2, begin: { type: 'session', minutes: 50, project: o.id }, label: 'Start 50 minutes' });
    });
    var saved = library().filter(function (r) { return r.data.status !== 'done'; });
    saved.filter(function (r) { return r.data.shelf !== 'unwind'; }).forEach(function (r) {
      var going = r.data.status === 'doing';
      add({ key: 'l-' + r.id, kind: 'Library', title: (going ? 'Carry on with: ' : 'Start something you saved: ') + r.data.title, sub: (r.data.type || 'Saved') + (r.data.by ? ' · ' + r.data.by : ''), e: going ? ['low', 'some'] : SOME, t: [30, 60], w: going ? 4 : 2, begin: safeUrl(r.data.url) ? { type: 'link', url: r.data.url, start: r.id } : { type: 'session', minutes: time, label: r.data.title }, label: safeUrl(r.data.url) ? 'Open it' : 'Start ' + time + ' minutes' });
    });
    goodreads.forEach(function (b) {
      add({ key: b.id, kind: 'Reading', title: 'Read: ' + b.title, sub: b.by + ' · pick up where the bookmark is', e: ['low', 'some'], t: [30, 60], w: 3, begin: { type: 'session', minutes: time, label: 'Reading ' + b.title }, label: 'Read for ' + (time === 60 ? 'an hour' : 'half an hour') });
    });
    questions().forEach(function (q, i) {
      add({ key: 'q-' + i, kind: 'Curiosity', title: q, sub: 'Think it through, then write a few lines.', e: MOST, t: [5, 30], w: 2, begin: { type: 'capture', kind: 'thought', prefill: q + '\n\n' }, label: 'Write about it' });
    });
    add({ key: 'w-note', kind: 'Writing', title: 'Write a field note', sub: 'What did you learn this week, and what surprised you?', e: MOST, t: [30, 60], w: 2, begin: { type: 'capture', kind: 'thought', prefill: 'Field note: ' }, label: 'Start writing' });
    var waiting = ideas().length;
    if (waiting) add({ key: 'i-sort', kind: 'Capture', title: 'Sort what you captured', sub: plural(waiting, 'thing is', 'things are') + ' waiting. Turn one into a next step.', e: ['low', 'some'], t: [5, 30], w: 3, begin: { type: 'view', view: 'capture' }, label: 'Open Capture' });
    saved.filter(function (r) { return r.data.shelf === 'unwind'; }).forEach(function (r) {
      add({ key: 'u-' + r.id, kind: 'Rest', title: 'Enjoy something you chose: ' + r.data.title, sub: (r.data.type || 'Saved') + ' · you picked it, so no guilt.', e: LOW, t: [30, 60], w: 3, begin: safeUrl(r.data.url) ? { type: 'link', url: r.data.url } : { type: 'view', view: 'unwind' }, label: safeUrl(r.data.url) ? 'Open it' : 'Go to Unwind' });
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
    var away = offline();
    var off = away.length ? away[Math.floor(pick() * away.length)].data.text : 'A walk outside';
    if (time === 5) off = 'Stand up, stretch and look out of a window';
    chosen.push({ key: 'o', kind: 'Off the screen', title: off, sub: 'The desk will keep your place.', begin: { type: 'leave', item: off }, label: 'Go' });
    return chosen;
  }

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

  function ideaFormHtml(r) {
    return '<form class="desk__form edit" data-form="idea-edit" data-id="' + esc(r.id) + '">' +
      '<label class="visually-hidden" for="ie-text">Edit</label><textarea class="textarea textarea--hand" id="ie-text" name="text" rows="3" required>' + esc(r.data.text) + '</textarea>' +
      '<div class="desk__row"><label class="field-label" for="ie-kind">It\'s a</label><select class="lib-select" id="ie-kind" name="kind">' + options(IDEA_KINDS, r.data.kind) + '</select></div>' +
      '<div class="actions"><button class="btn" type="submit">Save</button><button type="button" class="btn btn--text" data-act="cancel">Cancel</button></div></form>';
  }
  function captureHtml() {
    var p = current();
    var all = ideas();
    var shown = ui.ideaFilter === 'all' ? all : all.filter(function (r) { return r.data.kind === ui.ideaFilter; });
    var pre = ui.prefill;
    ui.prefill = '';
    var KINDS_HERE = IDEA_KINDS.concat([['later', 'To read or watch']]);
    return '<section class="panel" aria-labelledby="panel-title">' +
      '<p class="label">Capture</p>' +
      '<h2 class="hand-l" id="panel-title">Get it out of your head</h2>' +
      '<form class="capture" data-form="capture">' +
        '<label class="visually-hidden" for="capture-text">What\'s on your mind?</label>' +
        '<textarea class="textarea textarea--hand" id="capture-text" name="text" rows="3" placeholder="What\'s on your mind?" required>' + esc(pre) + '</textarea>' +
        '<div class="capture__bar"><div class="lib-chips" role="group" aria-label="What is it?">' + KINDS_HERE.map(function (k) {
          return '<button type="button" class="lib-chip" data-act="kind" data-v="' + k[0] + '" aria-pressed="' + (ui.kind === k[0]) + '">' + esc(k[1]) + '</button>';
        }).join('') + '</div><button class="btn" type="submit">Keep it</button></div>' +
        '<p class="note-mono">' + (ui.kind === 'later' ? 'Goes to the Library, to read or watch later.' : 'Ctrl + Enter keeps it too.') + '</p>' +
      '</form>' +
      (all.length
        ? '<div class="lib-chips gap-m" role="group" aria-label="Show">' + [['all', 'Everything']].concat(IDEA_KINDS).map(function (k) {
            var n = k[0] === 'all' ? all.length : all.filter(function (r) { return r.data.kind === k[0]; }).length;
            return '<button type="button" class="lib-chip" data-act="idea-filter" data-v="' + k[0] + '" aria-pressed="' + (ui.ideaFilter === k[0]) + '">' + esc(k[1]) + ' <span>' + n + '</span></button>';
          }).join('') + '</div>' +
          '<ul class="inbox">' + shown.map(function (r) {
            if (ui.editId === r.id) return '<li class="inbox__item">' + ideaFormHtml(r) + '</li>';
            return '<li class="inbox__item"><p class="inbox__kind">' + esc(labelOf(IDEA_KINDS, r.data.kind) || 'Note') + ' · ' + esc(ago(r.created_at)) + '</p>' +
              '<p class="inbox__text">' + lines(r.data.text) + '</p>' +
              '<div class="inbox__acts">' +
                (p ? '<button type="button" class="btn btn--text" data-act="to-next" data-id="' + esc(r.id) + '">Make it the next step</button>' : '') +
                '<button type="button" class="btn btn--text" data-act="to-project" data-id="' + esc(r.id) + '">Make it a project</button>' +
                '<button type="button" class="btn btn--text" data-act="edit" data-id="' + esc(r.id) + '">Edit</button>' +
                '<button type="button" class="btn btn--text" data-act="copy" data-id="' + esc(r.id) + '">Copy</button>' +
                '<button type="button" class="btn btn--text" data-act="let-go" data-id="' + esc(r.id) + '">Let it go</button>' +
              '</div></li>';
          }).join('') + '</ul>'
        : '<p class="muted gap-m">Whatever is on your mind can wait here, out of your head.</p>') +
    '</section>';
  }

  function libraryFormHtml(r, shelf) {
    var d = r ? r.data : { shelf: shelf || 'reading', type: 'Book', status: 'queued' };
    var id = r ? r.id : 'new';
    return '<form class="desk__form edit" data-form="library" data-id="' + esc(id) + '">' +
      '<label class="field-label" for="lf-title-' + id + '">Title</label><input class="input" id="lf-title-' + id + '" name="title" value="' + esc(d.title || '') + '" autocomplete="off" required>' +
      '<div class="form-grid">' +
        '<div><label class="field-label" for="lf-by-' + id + '">By (optional)</label><input class="input" id="lf-by-' + id + '" name="by" value="' + esc(d.by || '') + '" autocomplete="off"></div>' +
        '<div><label class="field-label" for="lf-url-' + id + '">Link (optional)</label><input class="input" id="lf-url-' + id + '" name="url" value="' + esc(d.url || '') + '" autocomplete="off" inputmode="url" placeholder="https://…"></div>' +
        '<div><label class="field-label" for="lf-type-' + id + '">Kind</label><select class="lib-select" id="lf-type-' + id + '" name="type">' + options(TYPES, d.type) + '</select></div>' +
        '<div><label class="field-label" for="lf-shelf-' + id + '">For</label><select class="lib-select" id="lf-shelf-' + id + '" name="shelf">' + options(SHELVES, d.shelf) + '</select></div>' +
      '</div>' +
      '<label class="field-label" for="lf-note-' + id + '">Your note (optional)</label><textarea class="textarea" id="lf-note-' + id + '" name="note" rows="2">' + esc(d.note || '') + '</textarea>' +
      sharedBox(r, 'lf-' + id) +
      '<div class="actions"><button class="btn" type="submit">' + (r ? 'Save' : 'Add it') + '</button>' + (r ? '<button type="button" class="btn btn--text" data-act="cancel">Cancel</button>' : '') + '</div>' +
    '</form>';
  }
  function libraryItemHtml(r, compact) {
    if (ui.editId === r.id) return '<li class="lib">' + libraryFormHtml(r) + '</li>';
    var d = r.data;
    var url = safeUrl(d.url);
    var next = d.status === 'queued' ? ['doing', 'Start'] : d.status === 'doing' ? ['done', 'Finished'] : ['queued', 'Back on the list'];
    return '<li class="lib">' +
      '<p class="lib__meta">' + esc(d.type || 'Saved') + ' · ' + esc(labelOf(STATUS, d.status) || 'Up next') + (compact ? '' : ' · ' + esc(labelOf(SHELVES, d.shelf))) + (r.shared ? ' · ' + SHARED_TAG : '') + '</p>' +
      '<p class="lib__title">' + (url ? '<a class="ink-link" href="' + esc(url) + '" target="_blank" rel="noopener" data-act="opened" data-id="' + esc(r.id) + '">' + esc(d.title) + ' ↗</a>' : esc(d.title)) + '</p>' +
      (d.by ? '<p class="lib__by">' + esc(d.by) + '</p>' : '') +
      (d.note ? '<p class="lib__note">' + lines(d.note) + '</p>' : '') +
      '<div class="lib__acts">' +
        '<button type="button" class="btn btn--text" data-act="lib-status" data-id="' + esc(r.id) + '" data-v="' + next[0] + '">' + next[1] + '</button>' +
        '<button type="button" class="btn btn--text" data-act="edit" data-id="' + esc(r.id) + '">Edit</button>' +
        '<button type="button" class="btn btn--text" data-act="lib-x" data-id="' + esc(r.id) + '">Remove</button>' +
      '</div></li>';
  }
  function libraryHtml() {
    var all = library();
    var F = [['open', 'To get to'], ['queued', 'Up next'], ['doing', 'In progress'], ['done', 'Finished'], ['all', 'Everything']];
    function matches(r, f) { return f === 'all' || (f === 'open' ? r.data.status !== 'done' : r.data.status === f); }
    var shown = all.filter(function (r) { return matches(r, ui.libFilter); });
    return '<section class="panel" aria-labelledby="panel-title">' +
      '<p class="label">Library</p>' +
      '<h2 class="hand-l" id="panel-title">Things to read, watch and listen to</h2>' +
      '<p class="lede">Saved on purpose, so the next good thing is already chosen.</p>' +
      folded('lib-add', !all.length) + '<summary class="desk__summary">Add something</summary>' + libraryFormHtml(null) + '</details>' +
      (all.length
        ? '<div class="lib-chips gap-m" role="group" aria-label="Show">' + F.map(function (f) {
            var n = all.filter(function (r) { return matches(r, f[0]); }).length;
            return '<button type="button" class="lib-chip" data-act="lib-filter" data-v="' + f[0] + '" aria-pressed="' + (ui.libFilter === f[0]) + '">' + esc(f[1]) + ' <span>' + n + '</span></button>';
          }).join('') + '</div>' +
          (shown.length ? '<ul class="libs">' + shown.map(function (r) { return libraryItemHtml(r, false); }).join('') + '</ul>' : '<p class="muted gap-m">Nothing here.</p>')
        : '') +
    '</section>';
  }

  function unwindHtml() {
    var chosen = library().filter(function (r) { return r.data.shelf === 'unwind' && r.data.status !== 'done'; });
    var reading = library().filter(function (r) { return r.data.shelf !== 'unwind' && r.data.status === 'doing'; })[0];
    var away = offline();
    return '<section class="panel" aria-labelledby="panel-title">' +
      '<p class="label">Unwind</p>' +
      '<h2 class="hand-l" id="panel-title">Rest with intention</h2>' +
      '<p class="lede">Things you chose on purpose, instead of a feed. And sometimes, nothing on a screen at all.</p>' +
      '<div class="unwind">' +
        '<div class="unwind__col">' +
          '<p class="label">Something you chose</p>' +
          (chosen.length
            ? '<ul class="libs">' + chosen.map(function (r) { return libraryItemHtml(r, true); }).join('') + '</ul>'
            : '<p class="muted">Nothing saved yet. When a film, a talk or an album is worth your evening, keep it here.</p>') +
          folded('unwind-add', !chosen.length) + '<summary class="desk__summary">Save something for later</summary>' + libraryFormHtml(null, 'unwind') + '</details>' +
          (reading ? '<p class="unwind__book">Or carry on with ' + esc(reading.data.title) + '.</p>' : '') +
        '</div>' +
        '<div class="unwind__col">' +
          '<p class="label">A pause</p>' +
          '<p class="prose">Two minutes of slow breathing, before the next thing.</p>' +
          '<div class="actions"><button type="button" class="btn btn--line" data-act="breathe">Breathe for two minutes</button></div>' +
          '<p class="label gap-l">Leave the screen</p>' +
          (away.length
            ? '<ul class="offline">' + away.map(function (o) {
                return '<li><span>' + esc(o.data.text) + '</span><button type="button" class="offline__x" data-act="offline-x" data-id="' + esc(o.id) + '" aria-label="Remove ' + esc(o.data.text) + '">×</button></li>';
              }).join('') + '</ul>'
            : '<p class="muted">Write down a few things you enjoy away from screens.</p>') +
          '<form class="desk__row desk__form--inline" data-form="offline"><label class="visually-hidden" for="off-new">Something to do away from screens</label>' +
            '<input class="input" id="off-new" name="text" autocomplete="off" placeholder="Something away from screens" required><button class="btn btn--line" type="submit">Add</button></form>' +
          '<div class="actions"><button type="button" class="btn" data-act="leave">Leave the screen</button></div>' +
        '</div>' +
      '</div>' +
    '</section>';
  }

  // On an Android phone a door can open an app instead of its website, falling back to the
  // site when the app isn't installed. (An installed desk opens plain links in a browser tab,
  // which never hands them to apps.)
  var ANDROID = /Android/i.test(navigator.userAgent);
  function appId(s) {
    s = String(s || '').trim();
    var m = /[?&]id=([\w.]+)/.exec(s); // a Google Play link works as well as the bare id
    if (m) s = m[1];
    return /^[a-zA-Z]\w*(\.[a-zA-Z]\w*)+$/.test(s) ? s : '';
  }
  function doorAttrs(l) {
    var url = safeUrl(l.data.url);
    var app = appId(l.data.app);
    if (ANDROID && app && /^https?:\/\//i.test(url)) {
      var scheme = /^https/i.test(url) ? 'https' : 'http';
      var rest = url.replace(/^https?:\/\//i, '').split('#')[0];
      return ' href="' + esc('intent://' + rest + '#Intent;scheme=' + scheme + ';package=' + app + ';S.browser_fallback_url=' + encodeURIComponent(url) + ';end') + '"';
    }
    if (!url && app) {
      // An app with no website (an audiobook player, say): web pages can't start it directly,
      // so open its Play Store page, where "Open" starts it.
      var play = 'https://play.google.com/store/apps/details?id=' + app;
      return ' href="' + esc('intent://details?id=' + app + '#Intent;scheme=market;package=com.android.vending;S.browser_fallback_url=' + encodeURIComponent(play) + ';end') + '"';
    }
    return ' href="' + esc(url) + '"' + (/^https?:/i.test(url) ? ' target="_blank" rel="noopener"' : '');
  }
  // Doors this device can open: a door with no website only works on an Android phone.
  function opensHere(l) { return !!safeUrl(l.data.url) || (ANDROID && !!appId(l.data.app)); }
  function linkFormHtml(r) {
    var d = r ? r.data : { category: categories()[0] || 'Everyday' };
    var id = r ? r.id : 'new';
    return '<form class="desk__form edit" data-form="link" data-id="' + esc(id) + '">' +
      '<div class="form-grid">' +
        '<div><label class="field-label" for="kf-title-' + id + '">Name</label><input class="input" id="kf-title-' + id + '" name="title" value="' + esc(d.title || '') + '" autocomplete="off" required></div>' +
        '<div><label class="field-label" for="kf-url-' + id + '">Address</label><input class="input" id="kf-url-' + id + '" name="url" value="' + esc(d.url || '') + '" autocomplete="off" inputmode="url" placeholder="https://…"></div>' +
        '<div><label class="field-label" for="kf-cat-' + id + '">Group</label><input class="input" id="kf-cat-' + id + '" name="category" value="' + esc(d.category || 'Everyday') + '" list="door-groups" autocomplete="off"></div>' +
        '<div><label class="field-label" for="kf-app-' + id + '">Android app (optional)</label><input class="input" id="kf-app-' + id + '" name="app" value="' + esc(d.app || '') + '" autocomplete="off" placeholder="Paste its Google Play link"></div>' +
      '</div>' +
      '<p class="note-mono">With an app, this door opens the app on an Android phone, and the website everywhere else. For an app with no website, leave Address empty: the door then shows only on Android, and opens the app\'s Play Store page, where Open starts it.</p>' +
      sharedBox(r, 'kf-' + id) +
      '<div class="actions"><button class="btn" type="submit">' + (r ? 'Save' : 'Add the door') + '</button>' + (r ? '<button type="button" class="btn btn--text" data-act="cancel">Cancel</button>' : '') + '</div>' +
    '</form>';
  }
  function grouped(items) {
    var groups = [];
    items.forEach(function (l) {
      var c = (l.data.category || 'Everyday').trim() || 'Everyday';
      var g = groups.filter(function (x) { return x.name === c; })[0];
      if (!g) groups.push(g = { name: c, items: [] });
      g.items.push(l);
    });
    return groups;
  }
  function doorsHtml() {
    var groups = grouped(links());
    return '<section class="panel" aria-labelledby="panel-title">' +
      '<p class="label">Doors</p>' +
      '<h2 class="hand-l" id="panel-title">The places you go from here</h2>' +
      '<p class="lede">Your usual websites and tools, in groups you name yourself.</p>' +
      (groups.length
        ? groups.map(function (g) {
            return '<div class="doorgroup"><p class="doorgroup__name">' + esc(g.name) + '</p><ul class="linkrows">' + g.items.map(function (l, i) {
              if (ui.editId === l.id) return '<li>' + linkFormHtml(l) + '</li>';
              var url = safeUrl(l.data.url);
              var app = appId(l.data.app);
              var where = url ? esc(url.replace(/^https?:\/\//, '')) + (app ? ' · opens the app on Android' : '')
                : app ? 'Phone only · opens ' + esc(app) + ' on Android' : 'This address doesn\'t work. Edit it.';
              return '<li class="linkrow"><div class="linkrow__main">' +
                (opensHere(l) ? '<a class="ink-link"' + doorAttrs(l) + '>' + esc(l.data.title) + '</a>' : esc(l.data.title)) +
                (l.shared ? ' ' + SHARED_TAG : '') + '<p class="linkrow__url">' + where + '</p></div>' +
                '<div class="linkrow__acts">' +
                  '<button type="button" class="iconbtn" data-act="door-move" data-id="' + esc(l.id) + '" data-v="-1" aria-label="Move ' + esc(l.data.title) + ' up"' + (i === 0 ? ' disabled' : '') + '>↑</button>' +
                  '<button type="button" class="iconbtn" data-act="door-move" data-id="' + esc(l.id) + '" data-v="1" aria-label="Move ' + esc(l.data.title) + ' down"' + (i === g.items.length - 1 ? ' disabled' : '') + '>↓</button>' +
                  '<button type="button" class="btn btn--text" data-act="edit" data-id="' + esc(l.id) + '">Edit</button>' +
                  '<button type="button" class="btn btn--text" data-act="door-x" data-id="' + esc(l.id) + '">Remove</button>' +
                '</div></li>';
            }).join('') + '</ul></div>';
          }).join('')
        : '<p class="muted gap-m">No doors yet. Add the sites and tools you open most, and they\'ll wait at the foot of the desk.</p>') +
      '<p class="label gap-l">Add a door</p>' + linkFormHtml(null) +
      '<datalist id="door-groups">' + categories().map(function (c) { return '<option value="' + esc(c) + '">'; }).join('') + '</datalist>' +
    '</section>';
  }
  function doorsStripHtml(onlyShared) {
    var groups = grouped(links().filter(function (l) { return (!onlyShared || l.shared) && opensHere(l); }));
    if (!groups.length) return onlyShared ? '' : '<nav class="doors" aria-label="Doors"><p class="label">Doors</p><p class="muted">Your usual sites and tools can wait here. <a class="ink-link" href="#doors">Add some doors</a></p></nav>';
    return '<nav class="doors" aria-labelledby="doors-title"><p class="label" id="doors-title">Doors</p>' + groups.map(function (g) {
      return '<div class="doors__group">' + (groups.length > 1 ? '<p class="doors__cat">' + esc(g.name) + '</p>' : '') + '<ul class="doors__list">' + g.items.map(function (l) {
        return '<li><a class="door"' + doorAttrs(l) + '>' + esc(l.data.title) + '</a></li>';
      }).join('') + '</ul></div>';
    }).join('') + (onlyShared ? '' : '<p><a class="btn btn--text" href="#doors">Change the doors</a></p>') + '</nav>';
  }

  function settingsHtml() {
    var shared = rows.filter(function (r) { return r.shared; }).length;
    var legacy = readJSON(LEGACY, null);
    var hasLegacy = legacy && (list(legacy.projects).length || list(legacy.inbox).length || list(legacy.chosen).length);
    return '<section class="panel" aria-labelledby="panel-title">' +
      '<p class="label">Settings</p>' +
      '<h2 class="hand-l" id="panel-title">The desk itself</h2>' +
      '<div class="settings">' +
        '<div class="box"><p class="label">Where it\'s kept</p>' +
          (mode === 'owner'
            ? '<p class="prose">In the cloud, under ' + esc(user && user.email ? user.email : 'your account') + '. Open the desk on any device and sign in to see the same desk.</p>' +
              '<div class="actions"><button type="button" class="btn btn--line" data-act="sync-now">Sync now</button><button type="button" class="btn btn--text" data-act="signout">Sign out</button></div>'
            : '<p class="prose">In this browser only. To keep the desk in the cloud and use it from your phone too, connect Supabase: the steps are in the README, under "Your desk".</p>') +
        '</div>' +
        '<div class="box"><p class="label">What visitors see</p>' +
          '<p class="prose">' + (shared ? plural(shared, 'item is', 'items are') + ' shared. ' : 'Nothing is shared. ') + 'Anyone who opens the desk sees only shared projects, library items and doors, never notes or anything else. Only you can change the desk.</p>' +
          '<div class="actions"><button type="button" class="btn btn--line" data-act="preview">See what visitors see</button>' + (shared ? '<button type="button" class="btn btn--text" data-act="unshare-all">Stop sharing everything</button>' : '') + '</div>' +
        '</div>' +
        '<div class="box"><p class="label">Backups</p>' +
          '<p class="prose">A copy of everything as one file, kept wherever you like. Restoring adds the backup\'s items back; it doesn\'t delete anything.</p>' +
          '<div class="actions"><button type="button" class="btn btn--line" data-act="backup">Download a backup</button>' +
          '<label class="btn btn--text desk__restore">Restore a backup<input type="file" accept="application/json,.json" data-act="restore"></label></div>' +
        '</div>' +
        '<div class="box"><p class="label">Starting points</p>' +
          '<p class="prose">Add suggestions in one go, then change them however you like.</p>' +
          '<div class="actions">' +
            '<button type="button" class="btn btn--text" data-act="starter-projects">My notebook\'s experiments</button>' +
            '<button type="button" class="btn btn--text" data-act="starter-doors">A few doors</button>' +
            '<button type="button" class="btn btn--text" data-act="starter-offline">Off-screen ideas</button>' +
            (hasLegacy ? '<button type="button" class="btn btn--text" data-act="import-legacy">The earlier desk in this browser</button>' : '') +
          '</div>' +
        '</div>' +
      '</div>' +
    '</section>';
  }

  function footHtml() {
    return '<footer class="desk__foot">' +
      (mode === 'owner'
        ? '<p>Saved to the cloud as you go, so this desk is the same on your laptop and your phone. Only you can change it.</p>'
        : '<p>Everything you write here stays in this browser, on this device, until the cloud is connected.</p>') +
    '</footer>';
  }

  /* What visitors see: only the parts marked as shared, and nothing to change. */
  function visitorHtml() {
    var d = new Date();
    var name = String(site.name || 'Vikas');
    var ps = projects().filter(function (r) { return r.shared; });
    var lib = library().filter(function (r) { return r.shared; });
    var top =
      '<header class="desk__top"><p class="desk__kicker">Desk · ' + esc(longDay(d)) + '</p><p class="desk__right"><a class="desk__out ink-link" href="index.html">The notebook →</a></p></header>' +
      (ui.preview ? '<p class="desk__banner">This is what visitors see. <button type="button" class="btn btn--text" data-act="preview-off">Back to my desk</button></p>' : '') +
      (mode === 'stranger' ? '<p class="desk__banner">You\'re signed in as ' + esc(user && user.email) + ', which isn\'t ' + esc(me) + '\'s account, so you see what\'s shared. <button type="button" class="btn btn--text" data-act="signout">Sign out</button></p>' : '') +
      (problem && mode === 'visitor' ? '<p class="desk__banner desk__banner--warn">' + esc(problem) + (user ? ' <button type="button" class="btn btn--text" data-act="recheck">Try again</button>' : '') + '</p>' : '') +
      '<h1 class="desk__ask desk__ask--visit">' + esc(name) + '\'s desk</h1>' +
      '<p class="lede">The projects, reading and doors that are shared from it. It\'s a working desk, so it changes; only ' + esc(me) + ' can change it.</p>';
    var body = '';
    if (mode === 'loading' || (!heard && !ui.preview)) body = '<p class="muted gap-l">Opening the desk…</p>';
    else if (!ps.length && !lib.length && !links().some(function (l) { return l.shared; })) body = '<p class="hand-m gap-l">Nothing is shared from the desk right now.</p>';
    else {
      body += ps.length ? '<p class="label gap-l">On the desk</p><ul class="visit">' + ps.map(function (p) {
        var ms = list(p.data.milestones);
        var doneN = ms.filter(function (m) { return m.done; }).length;
        return '<li class="box visit__item"><p class="hand-m">' + esc(p.data.title) + '</p>' +
          (ms.length ? '<p class="leftoff__step">' + doneN + ' of ' + ms.length + ' milestones done</p>' : '') +
          (p.data.next ? '<p class="leftoff__next"><span class="leftoff__tag">Next</span>' + esc(split(p.data.next)[0]) + '</p>' : '') + '</li>';
      }).join('') + '</ul>' : '';
      body += lib.length ? '<p class="label gap-l">Reading, watching, listening</p><ul class="libs">' + lib.map(function (r) {
        var url = safeUrl(r.data.url);
        return '<li class="lib"><p class="lib__meta">' + esc(r.data.type || 'Saved') + ' · ' + esc(labelOf(STATUS, r.data.status) || 'Up next') + '</p>' +
          '<p class="lib__title">' + (url ? '<a class="ink-link" href="' + esc(url) + '" target="_blank" rel="noopener">' + esc(r.data.title) + ' ↗</a>' : esc(r.data.title)) + '</p>' +
          (r.data.by ? '<p class="lib__by">' + esc(r.data.by) + '</p>' : '') + (r.data.note ? '<p class="lib__note">' + lines(r.data.note) + '</p>' : '') + '</li>';
      }).join('') + '</ul>' : '';
      body += doorsStripHtml(true);
    }
    var foot = '<footer class="desk__foot"><p>Only ' + esc(me) + ' can change this desk.' +
      (mode === 'visitor' && client && !user && !ui.preview ? ' <a class="ink-link" href="#signin">Sign in as ' + esc(me) + '</a>' : '') + '</p></footer>';
    return top + body + foot;
  }

  function signinHtml() {
    return '<header class="desk__top"><p class="desk__kicker">Desk</p><p class="desk__right"><a class="desk__out ink-link" href="index.html">The notebook →</a></p></header>' +
      '<section class="signin">' +
        '<h1 class="hand-xl">Sign in to the desk</h1>' +
        '<p class="lede">For ' + esc(me) + '. Everyone else can see what\'s shared without signing in.</p>' +
        '<form class="desk__form" data-form="signin" novalidate>' +
          '<label class="field-label" for="si-email">Email</label><input class="input" id="si-email" name="email" type="email" autocomplete="username" required>' +
          '<label class="field-label" for="si-password">Password</label><input class="input" id="si-password" name="password" type="password" autocomplete="current-password" required>' +
          (ui.authError ? '<p class="desk__error" role="alert">' + esc(ui.authError) + '</p>' : '') +
          '<div class="actions"><button class="btn" type="submit"' + (ui.busy ? ' disabled' : '') + '>' + (ui.busy ? 'Signing in…' : 'Sign in') + '</button><a class="btn btn--text" href="#">Back to the desk</a></div>' +
        '</form>' +
      '</section>';
  }

  /* Curiosity: a page of its own, one card at a time. Guess first, then see why.
     Cards you miss, or ask to see again, come back in about two weeks. No score. */
  var CARDS = list(NB.curiosity).filter(function (c) { return c && c.id && c.scene && list(c.options).length > 1; });
  var TOPICS = [['all', 'Both'], ['agents', 'AI agents'], ['talk', 'Communication']];
  var AGAIN = 14 * 86400000;
  function curState() {
    var s = setting();
    var c = s && s.data.curiosity;
    return c && c.cards ? c : { at: '', cards: {} };
  }
  function saveCur(fn) {
    var s = setting() || make('setting', {});
    var c = s.data.curiosity && s.data.curiosity.cards ? s.data.curiosity : { at: '', cards: {} };
    fn(c);
    s.data.curiosity = c;
    put(s);
  }
  function cardById(id) {
    for (var i = 0; i < CARDS.length; i++) if (CARDS[i].id === id) return CARDS[i];
    return null;
  }
  function inTopic(c) { return ui.cur.topic === 'all' || c.topic === ui.cur.topic; }
  // What comes next: a card that's due back, then a new one (taking turns between topics), then the one seen longest ago.
  function nextCard(after) {
    var seen = curState().cards;
    var pool = CARDS.filter(function (c) { return inTopic(c) && c.id !== after; });
    if (!pool.length) pool = CARDS.filter(inTopic);
    if (!pool.length) return null;
    var due = pool.filter(function (c) { return seen[c.id] && seen[c.id].again && seen[c.id].again <= now(); })
      .sort(function (a, b) { return seen[a.id].again - seen[b.id].again; })[0];
    if (due) return due;
    var fresh = pool.filter(function (c) { return !seen[c.id]; });
    if (fresh.length) {
      var last = cardById(after);
      var turn = ui.cur.topic === 'all' && last ? fresh.filter(function (c) { return c.topic !== last.topic; })[0] : null;
      return turn || fresh[0];
    }
    return pool.slice().sort(function (a, b) { return (seen[a.id].when || 0) - (seen[b.id].when || 0); })[0];
  }
  function showCard(c) {
    ui.cur.id = c ? c.id : '';
    ui.cur.guess = -1;
    ui.cur.more = false;
    ui.cur.kept = false;
  }
  function currentCard() {
    var c = cardById(ui.cur.id);
    if (c && inTopic(c)) return c;
    var st = curState();
    var at = cardById(st.at);
    showCard(at && inTopic(at) && !st.cards[at.id] ? at : nextCard('')); // pick up where you stopped
    return cardById(ui.cur.id);
  }
  function curiosityHtml() {
    var c = currentCard();
    var top = '<header class="desk__top"><p class="desk__kicker">Desk · Curiosity</p>' +
      '<p class="desk__right">' + syncHtml() + '<a class="desk__out ink-link" href="#">← Back to the desk</a></p></header>' +
      '<div class="lib-chips curio__topics" role="group" aria-label="Topic">' + TOPICS.map(function (t) {
        return '<button type="button" class="lib-chip" data-act="cur-topic" data-v="' + t[0] + '" aria-pressed="' + (ui.cur.topic === t[0]) + '">' + esc(t[1]) + '</button>';
      }).join('') + '</div>';
    if (!c) return '<div class="curio-page">' + top + '<p class="hand-m gap-l">No cards here yet.</p></div>';
    var g = ui.cur.guess;
    var answered = g !== -1;
    var right = g === c.answer;
    var mine = curState().cards[c.id];
    var comingBack = mine && mine.again && mine.again > now();
    var opts = '<div class="curio__opts">' + c.options.map(function (o, i) {
      var cls = 'curio__opt' + (answered && i === c.answer ? ' is-right' : '') + (answered && i === g && !right ? ' is-picked' : '');
      return '<button type="button" class="' + cls + '" data-act="cur-guess" data-i="' + i + '"' + (answered ? ' aria-disabled="true"' : '') + '>' + esc(o) + '</button>';
    }).join('') + '</div>';
    var sayBox = !c.say ? '' : ui.cur.kept
      ? '<p class="note-mono">Your sentence is in Capture. Good ones can become field notes.</p>'
      : '<form class="desk__form curio__say" data-form="cur-say"><label class="field-label" for="cur-say">If you like · ' + esc(c.say) + '</label>' +
        '<textarea class="textarea textarea--hand" id="cur-say" name="text" rows="2" required></textarea>' +
        '<button class="btn btn--line" type="submit">Keep it in Capture</button></form>';
    var reveal = !answered
      ? '<p class="curio__hint">Guess first. There\'s no score.</p>'
      : '<div class="curio__reveal">' +
          '<p class="curio__verdict">' + (right ? 'Yes.' : 'Not quite. It\'s: ' + esc(c.options[c.answer]) + '.') + '</p>' +
          '<p class="prose">' + esc(c.why) + '</p>' +
          (ui.cur.more && c.more ? '<p class="prose curio__more">' + esc(c.more) + '</p>' : '') +
          sayBox +
          '<div class="actions">' +
            '<button type="button" class="btn" data-act="cur-next">Next curiosity</button>' +
            (!ui.cur.more && c.more ? '<button type="button" class="btn btn--line" data-act="cur-more">Tell me more</button>' : '') +
            (comingBack ? '<span class="note-mono curio__back">Coming back in about two weeks</span>'
              : '<button type="button" class="btn btn--text" data-act="cur-again">Show me this again later</button>') +
          '</div>' +
        '</div>';
    return '<div class="curio-page">' + top +
      '<article class="curio" aria-labelledby="curio-scene">' +
        '<p class="label">' + (c.topic === 'agents' ? 'AI agents' : 'Communication') + '</p>' +
        '<p class="curio__scene" id="curio-scene">' + esc(c.scene) + '</p>' +
        '<p class="curio__ask">' + esc(c.ask) + '</p>' + opts +
        '<div aria-live="polite">' + reveal + '</div>' +
      '</article></div>';
  }

  function slotHtml() {
    if (ui.view === 'continue') return continueHtml();
    if (ui.view === 'choose') return chooseHtml();
    if (ui.view === 'capture') return captureHtml();
    if (ui.view === 'unwind') return unwindHtml();
    if (ui.view === 'library') return libraryHtml();
    if (ui.view === 'doors') return doorsHtml();
    if (ui.view === 'settings') return settingsHtml();
    return welcomeHtml() + leftOffHtml();
  }

  function render(focusSel) {
    var html;
    renderWaiting = false; // this draw includes whatever arrived
    if (waitTimer) { clearInterval(waitTimer); waitTimer = null; }
    if (secretKey) html = '<section class="signin"><h1 class="hand-xl">The desk is switched off</h1><p class="desk__banner desk__banner--warn">assets/js/desk-config.js holds a secret key. Anyone can read that file, so the desk won\'t use it. Replace it with the publishable key, and in Supabase, create a new secret key and delete this one.</p></section>';
    else if (ui.view === 'signin' && client && mode !== 'owner') html = signinHtml();
    else if (!canEdit() || ui.preview) html = visitorHtml();
    else if (ui.view === 'curiosity') html = curiosityHtml(); // a page of its own: nothing else on it
    else if (mode === 'owner' && !heard && !rows.length) html = '<header class="desk__top"><p class="desk__kicker">Desk</p></header><p class="muted gap-l">Opening the desk…</p>'; // a new device: wait for the cloud's copy
    else html = topHtml() + '<div class="desk__slot" id="slot">' + slotHtml() + '</div>' + (ui.view === 'doors' || ui.view === 'settings' ? '' : doorsStripHtml(false)) + footHtml();
    root.innerHTML = html;
    if (focusSel) {
      var el = $(focusSel, root);
      if (el) { el.focus(); if (el.setSelectionRange && el.value && el.type !== 'email' && el.type !== 'password') el.setSelectionRange(el.value.length, el.value.length); }
    }
  }
  // A sync arriving while you're working on the desk waits until you've finished, then
  // redraws without losing anything half-typed.
  var renderWaiting = false;
  var waitTimer = null;
  function busyHere() {
    var a = document.activeElement;
    return !!(a && a !== root && root.contains(a));
  }
  function renderSoon() {
    if (ui.view === 'signin' && mode !== 'owner') return; // the sign-in page shows none of the desk
    if (busyHere()) {
      renderWaiting = true;
      if (!waitTimer) waitTimer = setInterval(flushWaiting, 1500); // in case the browser never says that focus moved
      return;
    }
    renderKeeping();
  }
  function flushWaiting() { if (renderWaiting && !busyHere()) renderKeeping(); }
  function renderKeeping() {
    var kept = {};
    Array.prototype.forEach.call(root.querySelectorAll('input[id], textarea[id], select[id]'), function (el) {
      if (el.type !== 'file') kept[el.id] = el.type === 'checkbox' ? el.checked : el.value;
    });
    render();
    Object.keys(kept).forEach(function (id) {
      var el = document.getElementById(id);
      if (!el || !root.contains(el)) return;
      if (el.type === 'checkbox') el.checked = kept[id]; else el.value = kept[id];
    });
  }
  // Remember the sections you open or close; browsers also announce the ones drawn open, so skip those.
  root.addEventListener('toggle', function (e) {
    var el = e.target;
    var key = el.getAttribute && el.getAttribute('data-keep');
    if (!key || el.open === (el.getAttribute('data-was') === '1')) return;
    ui.open[key] = el.open;
    el.setAttribute('data-was', el.open ? '1' : '0');
  }, true);
  root.addEventListener('focusout', function () { setTimeout(flushWaiting, 0); });

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
      render();
    }
  });
  // Removing something can be undone: put the same items back.
  function removeWithUndo(items, message) {
    var copies = items.map(clone);
    items.forEach(remove);
    render();
    say(message, function () { copies.forEach(function (c) { put(c); }); });
  }

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
    var p = projectId ? find(projectId) : null;
    if (p) setCurrent(p);
    if (run && run.timer) clearInterval(run.timer);
    run = { label: label || (p ? split(p.data.next)[0] || p.data.title : 'Focus'), project: p ? p.id : '', ends: now() + minutes * 60000, timer: null };
    paintSession();
    open(sessionBox);
    run.timer = setInterval(tick, 1000);
    tick();
  }
  function paintSession() {
    var p = run.project ? find(run.project) : null;
    sessionBox.innerHTML =
      '<div class="desk-dialog__paper">' +
        '<p class="label">' + (p ? esc(p.data.title) : 'Now') + '</p>' +
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
    var p = run.project ? find(run.project) : null;
    sessionBox.innerHTML =
      '<div class="desk-dialog__paper">' +
        '<p class="label">' + (timeUp ? 'Time' : 'Stopped') + '</p>' +
        '<p class="session__task">' + (timeUp ? 'That\'s the time you set.' : 'A good place to stop.') + '</p>' +
        (p && canEdit()
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
    var p = run && run.project ? find(run.project) : null;
    if (p && text) put(make('note', { project: p.id, text: text }));
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
    var begun = now();
    var LEN = 120000;
    function step() {
      var t = now() - begun;
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
      $('#breathe-left', breatheBox).textContent = clock(Math.ceil((LEN - t) / 1000));
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
    var ideasAway = offline().map(function (o) { return o.data.text; });
    if (!ideasAway.length) ideasAway = ['A walk outside'];
    var pickOne = item || ideasAway[Math.floor(Math.random() * ideasAway.length)];
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
     Starting points, the earlier desk, and backups
     ------------------------------------------------------------ */

  function addExperiments() {
    var have = projects().concat(byKind('project', true)).map(function (p) { return p.data.seed; });
    var added = 0;
    var featured = null;
    list(NB.experiments).slice().reverse().forEach(function (e) {
      if (!e || (e.status !== 'planned' && e.status !== 'running') || have.indexOf(e.id) !== -1) return;
      var p = put(make('project', {
        title: e.title || e.id,
        seed: e.id,
        link: 'experiments.html#' + e.id,
        next: e.next || '',
        milestones: list(e.steps).map(function (s) { return { name: s.name, done: s.state === 'done' }; }),
        done: []
      }, true));
      if (e.featured) featured = p;
      added++;
    });
    if (featured) setCurrent(featured);
    return added;
  }
  function addDoors() {
    var gr = NB.goodreads || {};
    var have = links().map(function (l) { return l.data.url; });
    var added = 0;
    [
      ['My notebook', 'index.html', 'Everyday'],
      ['The 30-second brief', 'brief.html', 'Everyday'],
      gr.profile ? ['Goodreads', gr.profile, 'Reading'] : null,
      site.linkedin ? ['LinkedIn', site.linkedin, 'Everyday'] : null,
      ['Site code on GitHub', 'https://github.com/vikassingh2002/vikasinpencil', 'Projects']
    ].filter(Boolean).forEach(function (d) {
      if (have.indexOf(d[1]) !== -1) return;
      put(make('link', { title: d[0], url: d[1], category: d[2] }));
      added++;
    });
    return added;
  }
  function addOffline() {
    var have = offline().map(function (o) { return o.data.text; });
    var added = 0;
    ['A twenty-minute walk, without the phone', 'Cook something simple', 'Call a friend you haven\'t spoken to in a while',
      'Make tea and look out of the window', 'Ten minutes of stretching', 'A paper book, somewhere comfortable'].forEach(function (t) {
      if (have.indexOf(t) !== -1) return;
      put(make('offline', { text: t }));
      added++;
    });
    return added;
  }

  // The first desk kept one object in this browser; turn it into rows.
  function fromLegacy(s) {
    var out = [];
    var ids = {};
    var t = stamp();
    function row(kind, data, extra) {
      var r = { id: uid(), kind: kind, data: data, position: out.filter(function (x) { return x.kind === kind; }).length + 1, shared: false, archived: false, created_at: t, updated_at: t };
      if (extra) Object.keys(extra).forEach(function (k) { r[k] = extra[k]; });
      out.push(r);
      return r;
    }
    function iso(ms) { var d = new Date(Number(ms) || 0); return isNaN(d.getTime()) || !ms ? t : d.toISOString(); }
    list(s.projects).forEach(function (p) {
      if (!p || !p.title) return;
      var r = row('project', { title: String(p.title), seed: p.seed || '', link: p.link || '', next: String(p.next || ''), milestones: list(p.milestones).map(function (m) { return { name: String(m.name || ''), done: !!m.done }; }), done: list(s.done).filter(function (x) { return x.project === p.id; }).map(function (x) { return { when: Number(x.when) || now(), text: String(x.text || '') }; }) }, { archived: !!p.archived });
      ids[p.id] = r.id;
      list(p.notes).forEach(function (n) { row('note', { project: r.id, text: String(n.text || '') }, { created_at: iso(n.when) }); });
    });
    if (s.current && ids[s.current]) row('setting', { current: ids[s.current] });
    list(s.inbox).forEach(function (i) { if (i && i.text) row('idea', { text: String(i.text), kind: ['thought', 'idea', 'question'].indexOf(i.kind) !== -1 ? i.kind : 'thought' }, { created_at: iso(i.when) }); });
    list(s.chosen).forEach(function (c) { if (c && c.title) row('library', { title: String(c.title), type: TYPES.indexOf(c.kind) !== -1 ? c.kind : 'Other', url: safeUrl(c.link), shelf: 'unwind', status: 'queued', note: '' }); });
    list(s.offline).forEach(function (o) { if (o) row('offline', { text: String(o) }); });
    list(s.doors).forEach(function (d) { if (d && d.title && safeUrl(d.url)) row('link', { title: String(d.title), url: safeUrl(d.url), category: 'Everyday' }); });
    return out;
  }
  function bringIn(newRows, message) {
    var hadCurrent = !!current();
    newRows.forEach(function (r) {
      if (r.kind === 'setting') { if (!hadCurrent && find(r.data.current)) setCurrent(find(r.data.current)); return; }
      put(r);
    });
    if (!hadCurrent) {
      var s = newRows.filter(function (r) { return r.kind === 'setting'; })[0];
      if (s && find(s.data.current)) setCurrent(find(s.data.current));
    }
    render();
    say(message);
  }
  function cleanRow(r) {
    if (!r || typeof r !== 'object' || KINDS.indexOf(r.kind) === -1 || !/^[0-9a-f-]{36}$/i.test(String(r.id)) || !r.data || typeof r.data !== 'object') return null;
    return {
      id: String(r.id), kind: r.kind, data: r.data, position: Number(r.position) || 0,
      shared: SHAREABLE.indexOf(r.kind) !== -1 && !!r.shared, archived: !!r.archived,
      created_at: r.created_at || stamp(), updated_at: r.updated_at || stamp()
    };
  }

  function backup() {
    var d = new Date();
    var file = { app: 'vikas-in-pencil-desk', version: 2, saved: d.toISOString(), rows: rows.map(clone) };
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
      if (!parsed || parsed.app !== 'vikas-in-pencil-desk') { say('That file isn\'t a desk backup.'); return; }
      var incoming = parsed.version === 2 ? list(parsed.rows).map(cleanRow).filter(Boolean) : parsed.state ? fromLegacy(parsed.state) : [];
      var things = incoming.filter(function (r) { return r.kind !== 'setting'; }).length;
      if (!things) { say('That backup is empty.'); return; }
      if (!window.confirm('Add ' + plural(things, 'item', 'items') + ' from the backup of ' + String(parsed.saved || '').slice(0, 10) + '? Items that are already here are replaced by the backup\'s copy; nothing is deleted.')) return;
      bringIn(incoming, 'Backup restored.');
    };
    reader.readAsText(file);
  }

  /* ------------------------------------------------------------
     Doing things
     ------------------------------------------------------------ */

  var pendingFocus = '';
  function go(view, after) {
    resetEditing();
    if (location.hash.replace('#', '') === view) { ui.view = view; render(after); slotIntoView(); return; }
    pendingFocus = after || '';
    location.hash = view;
  }
  function slotIntoView() {
    var slot = $('#slot', root);
    if (!slot || ui.view === 'home') return;
    var r = slot.getBoundingClientRect();
    if (r.top > window.innerHeight * 0.6 || r.top < 0) {
      try { slot.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' }); } catch (e) { slot.scrollIntoView(); }
    }
  }
  window.addEventListener('hashchange', function () {
    var keepStuck = ui.stuck && viewFromHash() === 'continue';
    resetEditing();
    ui.stuck = keepStuck;
    ui.view = viewFromHash();
    if (ui.view !== 'signin') ui.authError = '';
    render(pendingFocus || (ui.view === 'signin' ? '#si-email' : ''));
    pendingFocus = '';
    if (ui.view === 'curiosity') window.scrollTo(0, 0);
    else slotIntoView();
  });

  function begin(c) {
    var b = c.begin || {};
    if (b.type === 'session') startSession(b.minutes, b.label, b.project);
    else if (b.type === 'capture') { ui.kind = b.kind || 'thought'; ui.prefill = b.prefill || ''; go('capture', '#capture-text'); }
    else if (b.type === 'view') go(b.view);
    else if (b.type === 'breathe') breathe();
    else if (b.type === 'leave') leave(b.item);
    else if (b.type === 'link' && safeUrl(b.url)) {
      if (b.start) { var r = find(b.start); if (r && r.data.status === 'queued') { r.data.status = 'doing'; put(r); } }
      window.open(safeUrl(b.url), '_blank', 'noopener');
    }
  }

  function finishNext(p, newNext) {
    var d = p.data;
    d.done = list(d.done);
    if (d.next) d.done.push({ when: now(), text: split(d.next)[0] });
    d.done = d.done.slice(-60);
    d.next = newNext;
    put(p);
  }
  // Whatever has been typed into the milestone form so far, so redrawing it loses nothing.
  function readDraft() {
    var form = $('[data-form="milestones"]', root);
    if (!ui.msDraft) ui.msDraft = [];
    if (!form) return;
    ui.msDraft.forEach(function (m, i) {
      var el = form.elements['m' + i];
      if (el) m.name = String(el.value || '');
    });
    var extra = form.elements['new'];
    ui.msNew = extra ? String(extra.value || '') : '';
  }

  var ACT = {
    retry: function () { problem = ''; push(); },
    recheck: function () { var u = user; knownUser = undefined; useSession(u ? { user: u } : null); },
    'sync-now': function () { push(); pull(); say('Syncing.'); },
    session: function (t) {
      var p = current();
      startSession(Number(t.getAttribute('data-min')) || 25, p ? '' : 'Focus', p ? p.id : '');
    },
    stuck: function () {
      resetEditing();
      ui.stuck = true;
      if (location.hash !== '#continue') location.hash = 'continue';
      else { render(); slotIntoView(); }
    },
    why: function (t) { ui.why = t.getAttribute('data-why'); render('#stuck-next, #stuck-missing'); },
    lighter: function () { ui.energy = 'low'; go('choose'); },
    'edit-next': function () { resetEditing(); ui.editingNext = true; render('#next-text'); },
    done: function () { resetEditing(); ui.doneFlow = true; render('#done-next'); },
    cancel: function () { resetEditing(); render(); },
    'edit-project': function () { resetEditing(); ui.editProject = true; render('#pe-title'); },
    'edit-milestones': function () {
      var p = current();
      if (!p) return;
      resetEditing();
      ui.editMilestones = true;
      ui.msDraft = clone(list(p.data.milestones));
      render('#ms-new');
    },
    // Removing and moving change the draft; nothing is kept until "Save milestones".
    'ms-x': function (t) {
      var i = Number(t.getAttribute('data-i'));
      readDraft();
      ui.msDraft.splice(i, 1);
      render('#ms-new');
    },
    'ms-up': function (t) {
      var i = Number(t.getAttribute('data-i'));
      readDraft();
      if (i < 1 || i >= ui.msDraft.length) return;
      var m = ui.msDraft[i];
      ui.msDraft[i] = ui.msDraft[i - 1];
      ui.msDraft[i - 1] = m;
      render('#ms-' + (i - 1));
    },
    switch: function (t) {
      var o = find(t.getAttribute('data-id'));
      if (!o) return;
      setCurrent(o);
      resetEditing();
      render();
      var slot = $('#slot', root);
      if (slot) window.scrollTo(0, slot.offsetTop - 16);
    },
    'put-away': function (t) {
      var p = find(t.getAttribute('data-id'));
      if (!p) return;
      p.archived = true;
      put(p);
      if (current() === null || (setting() && setting().data.current === p.id)) setCurrent(projects()[0] || null);
      resetEditing();
      render();
      say('Put away: ' + p.data.title + '.', function () { p.archived = false; put(p); setCurrent(p); });
    },
    'bring-back': function (t) {
      var p = find(t.getAttribute('data-id'));
      if (!p) return;
      p.archived = false;
      put(p);
      setCurrent(p);
      render();
    },
    'delete-project': function (t) {
      var p = find(t.getAttribute('data-id'));
      if (!p || !window.confirm('Delete "' + p.data.title + '" and its notes? You can undo this for a few seconds.')) return;
      var gone = [p].concat(notesFor(p));
      var wasCurrent = setting() && setting().data.current === p.id;
      removeWithUndo(gone, 'Deleted ' + p.data.title + '.');
      if (wasCurrent) setCurrent(projects()[0] || null);
      resetEditing();
      render();
    },
    'note-x': function (t) { var n = find(t.getAttribute('data-id')); if (n) removeWithUndo([n], 'Note removed.'); },
    energy: function (t) { ui.energy = t.getAttribute('data-v'); ui.shuffle = 0; render(); },
    time: function (t) { ui.time = Number(t.getAttribute('data-v')); ui.shuffle = 0; render(); },
    reshuffle: function () { ui.shuffle++; render(); },
    begin: function (t) { var c = ui.picks[Number(t.getAttribute('data-i'))]; if (c) begin(c); },
    kind: function (t) { ui.kind = t.getAttribute('data-v'); var ta = $('#capture-text', root); ui.prefill = ta ? ta.value : ''; render('#capture-text'); },
    'idea-filter': function (t) { ui.ideaFilter = t.getAttribute('data-v'); render(); },
    'lib-filter': function (t) { ui.libFilter = t.getAttribute('data-v'); render(); },
    edit: function (t) { resetEditing(); ui.editId = t.getAttribute('data-id'); render('[data-id="' + ui.editId + '"] input[name="title"], [data-id="' + ui.editId + '"] textarea'); },
    'to-next': function (t) {
      var it = find(t.getAttribute('data-id'));
      var p = current();
      if (!it || !p) return;
      var before = p.data.next;
      var copy = clone(it);
      p.data.next = it.data.text; // replacing a step isn't the same as finishing it
      put(p);
      remove(it);
      render();
      say('That\'s the next step on ' + p.data.title + ' now.', function () { p.data.next = before; put(p); put(copy); });
    },
    'to-project': function (t) {
      var it = find(t.getAttribute('data-id'));
      if (!it) return;
      var text = String(it.data.text || '');
      var title = firstLine(text);
      var rest = text.trim().split('\n').slice(1).join('\n').trim();
      var p = put(make('project', { title: title, next: rest, milestones: [], done: [] }, true));
      setCurrent(p);
      var copy = clone(it);
      remove(it);
      go('continue');
      say('Now a project: ' + title + '.', function () { remove(p); put(copy); });
    },
    copy: function (t) { var it = find(t.getAttribute('data-id')); if (it) copyText(it.data.text); },
    'let-go': function (t) { var it = find(t.getAttribute('data-id')); if (it) removeWithUndo([it], 'Let it go.'); },
    'lib-status': function (t) {
      var r = find(t.getAttribute('data-id'));
      if (!r) return;
      r.data.status = t.getAttribute('data-v');
      if (r.data.status === 'done') r.data.finished = stamp();
      put(r);
      render();
      if (r.data.status === 'done') say(r.data.shelf === 'unwind' ? 'Hope it was good.' : 'Finished. On to the next.');
    },
    opened: function (t) { var r = find(t.getAttribute('data-id')); if (r && r.data.status === 'queued') { r.data.status = 'doing'; put(r); setTimeout(render, 50); } return true; },
    'lib-x': function (t) { var r = find(t.getAttribute('data-id')); if (r) removeWithUndo([r], 'Removed ' + r.data.title + '.'); },
    'offline-x': function (t) { var r = find(t.getAttribute('data-id')); if (r) removeWithUndo([r], 'Removed.'); },
    'door-x': function (t) { var r = find(t.getAttribute('data-id')); if (r) removeWithUndo([r], 'Removed ' + r.data.title + '.'); },
    'door-move': function (t) {
      var r = find(t.getAttribute('data-id'));
      if (!r) return;
      var cat = (r.data.category || 'Everyday').trim() || 'Everyday';
      var same = links().filter(function (l) { return ((l.data.category || 'Everyday').trim() || 'Everyday') === cat; });
      var i = same.indexOf(r);
      var j = i + Number(t.getAttribute('data-v'));
      if (j < 0 || j >= same.length) return;
      var other = same[j];
      var p = r.position;
      r.position = other.position;
      other.position = p;
      if (r.position === other.position) r.position += Number(t.getAttribute('data-v')) * 0.5;
      put(r);
      put(other);
      render();
    },
    breathe: function () { breathe(); },
    leave: function () { leave(); },
    backup: function () { backup(); },
    preview: function () { ui.preview = true; render(); window.scrollTo(0, 0); },
    'preview-off': function () { ui.preview = false; render(); },
    'unshare-all': function () {
      if (!window.confirm('Stop sharing everything? Visitors will see an empty desk.')) return;
      rows.filter(function (r) { return r.shared; }).forEach(function (r) { r.shared = false; put(r); });
      render();
      say('Nothing is shared now.');
    },
    signout: function () {
      if (Object.keys(pending).length && !window.confirm('Some changes haven\'t reached the cloud yet, and signing out removes them from this device. Sign out anyway?')) return;
      leaving = true;
      if (client) client.auth.signOut({ scope: 'local' }); // just this device; the phone stays signed in
    },
    'starter-projects': function () { var n = addExperiments(); render(); say(n ? plural(n, 'project', 'projects') + ' on the bench.' : 'Those are already here.'); },
    'starter-doors': function () { var n = addDoors(); render(); say(n ? plural(n, 'door', 'doors') + ' added.' : 'Those are already here.'); },
    'starter-offline': function () { var n = addOffline(); render(); say(n ? plural(n, 'idea', 'ideas') + ' added to Unwind.' : 'Those are already here.'); },
    'import-legacy': function () {
      var legacy = readJSON(LEGACY, null);
      if (!legacy) return;
      var incoming = fromLegacy(legacy);
      writeJSON(LEGACY_DONE, stamp());
      bringIn(incoming, 'The earlier desk is in. ' + plural(incoming.filter(function (r) { return r.kind !== 'setting'; }).length, 'item', 'items') + ' brought across.');
    },
    'cur-topic': function (t) { ui.cur.topic = t.getAttribute('data-v'); showCard(null); render(); },
    'cur-guess': function (t) {
      var c = cardById(ui.cur.id);
      if (!c || ui.cur.guess !== -1) return;
      var i = Number(t.getAttribute('data-i'));
      ui.cur.guess = i;
      saveCur(function (st) {
        var mine = st.cards[c.id] || {};
        mine.when = now();
        mine.right = i === c.answer;
        mine.again = mine.right ? 0 : now() + AGAIN; // missed ones come back
        st.cards[c.id] = mine;
        st.at = c.id;
      });
      render();
    },
    'cur-more': function () { ui.cur.more = true; render(); },
    'cur-again': function () {
      var c = cardById(ui.cur.id);
      if (!c) return;
      saveCur(function (st) { st.cards[c.id] = st.cards[c.id] || { when: now() }; st.cards[c.id].again = now() + AGAIN; });
      render();
      say('It\'ll come back in about two weeks.');
    },
    'cur-next': function () {
      var n = nextCard(ui.cur.id);
      showCard(n);
      if (n) saveCur(function (st) { st.at = n.id; });
      render();
      window.scrollTo(0, 0);
    },
    'skip-legacy': function () { writeJSON(LEGACY_DONE, 'skipped ' + stamp()); render(); }
  };

  root.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-act]') : null;
    if (!t || t.tagName === 'INPUT') return;
    var act = ACT[t.getAttribute('data-act')];
    if (!act) return;
    var looking = ['retry', 'recheck', 'sync-now', 'energy', 'time', 'reshuffle', 'begin', 'idea-filter', 'lib-filter', 'breathe', 'leave', 'backup', 'preview', 'preview-off', 'copy', 'why', 'cancel', 'session', 'stuck', 'lighter', 'signout', 'opened'];
    if (!canEdit() && looking.indexOf(t.getAttribute('data-act')) === -1) return; // without edit rights, only what changes nothing
    if (act(t, e) !== true && t.tagName === 'A') e.preventDefault();
  });

  root.addEventListener('change', function (e) {
    var t = e.target;
    var act = t.getAttribute && t.getAttribute('data-act');
    if (act === 'milestone' && canEdit()) {
      var p = current();
      var m = p && list(p.data.milestones)[Number(t.getAttribute('data-i'))];
      if (m) { m.done = t.checked; put(p); render(); }
    } else if (act === 'restore' && t.files && t.files[0] && canEdit()) {
      restore(t.files[0]);
      t.value = '';
    }
  });

  root.addEventListener('keydown', function (e) {
    if (e.target.id === 'capture-text' && e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      var form = e.target.form;
      if (form && typeof form.requestSubmit === 'function') form.requestSubmit(); else if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }
  });

  var FORM = {
    signin: function (val, form) {
      var email = val('email');
      var password = String(new FormData(form).get('password') || '');
      if (!email || !password) { ui.authError = 'Fill in both your email and your password.'; render(email ? '#si-password' : '#si-email'); return; }
      ui.authError = '';
      ui.busy = true;
      render();
      client.auth.signInWithPassword({ email: email, password: password }).then(function (res) {
        ui.busy = false;
        if (res.error) {
          ui.authError = /invalid/i.test(res.error.message) ? 'That email and password don\'t match.' : isNetwork(res.error) ? 'Can\'t reach the desk right now. Check the connection.' : res.error.message;
          render('#si-password');
          return;
        }
        location.hash = '';
      }, function (err) { ui.busy = false; ui.authError = describe(err); render('#si-email'); });
    },
    capture: function (val) {
      var text = val('text');
      if (!text) return;
      if (ui.kind === 'later') {
        var link = (text.match(/https?:\/\/\S+/) || [''])[0];
        var name = firstLine(text.replace(link, '').replace(/[\s:–—-]+$/, '').trim()) || link.replace(/^https?:\/\/(www\.)?/, '');
        put(make('library', { title: name, url: safeUrl(link), type: 'Article', shelf: 'reading', status: 'queued', note: '' }, true));
        say('Saved to the Library.');
      } else {
        put(make('idea', { text: text, kind: ui.kind }));
        say('Kept.');
      }
      render('#capture-text');
    },
    next: function (val) { var p = current(); if (!p) return; p.data.next = val('text'); put(p); resetEditing(); render(); },
    done: function (val) {
      var p = current();
      if (!p) return;
      finishNext(p, val('text'));
      resetEditing();
      render();
      say(p.data.next ? 'Next step saved.' : 'Done. Decide the next step whenever you\'re ready.');
    },
    'stuck-next': function (val) { var p = current(); if (!p) return; p.data.next = val('text'); put(p); resetEditing(); render(); say('Smaller step saved. Try five minutes on it.'); },
    'stuck-missing': function (val) { put(make('idea', { text: val('text'), kind: 'question' })); resetEditing(); render(); say('Noted in Capture.'); },
    note: function (val) {
      var p = current();
      var text = val('text');
      if (!p || !text) return;
      put(make('note', { project: p.id, text: text }));
      render();
      say('Saved for next time.');
    },
    'project-new': function (val) {
      var title = val('title');
      if (!title) return;
      var ms = val('milestones').split('\n').map(function (s) { return s.trim(); }).filter(Boolean).map(function (s) { return { name: s, done: false }; });
      var p = put(make('project', { title: title, next: val('next'), milestones: ms, done: [] }, true));
      setCurrent(p);
      resetEditing();
      ui.open['project-new'] = false;
      render();
      say('On the bench: ' + title + '.');
    },
    'project-edit': function (val, form) {
      var p = current();
      if (!p) return;
      var link = typedUrl(val('link'));
      if (val('link') && !link) { say('That link doesn\'t look right. Try one starting with https://'); return; }
      p.data.title = val('title') || p.data.title;
      p.data.link = link;
      p.shared = !!form.elements.shared.checked;
      put(p);
      resetEditing();
      render();
    },
    milestones: function () {
      var p = current();
      if (!p) return;
      readDraft();
      var kept = ui.msDraft.map(function (m) { return { name: String(m.name || '').trim(), done: !!m.done }; }).filter(function (m) { return m.name; });
      var extra = ui.msNew.trim();
      if (extra) kept.push({ name: extra, done: false });
      p.data.milestones = kept;
      put(p);
      resetEditing();
      render();
    },
    'idea-edit': function (val, form) {
      var r = find(form.getAttribute('data-id'));
      if (!r) return;
      r.data.text = val('text') || r.data.text;
      r.data.kind = val('kind') || r.data.kind;
      put(r);
      resetEditing();
      render();
    },
    library: function (val, form) {
      var url = typedUrl(val('url'));
      if (val('url') && !url) { say('That link doesn\'t look right. Try one starting with https://'); return; }
      var id = form.getAttribute('data-id');
      var r = id === 'new' ? make('library', { status: 'queued' }, true) : find(id);
      if (!r) return;
      r.data.title = val('title');
      r.data.by = val('by');
      r.data.url = url;
      r.data.type = val('type') || 'Other';
      r.data.shelf = val('shelf') === 'unwind' ? 'unwind' : 'reading';
      r.data.note = val('note');
      if (!r.data.status) r.data.status = 'queued';
      r.shared = !!form.elements.shared.checked;
      put(r);
      resetEditing();
      var fold = form.closest('details');
      if (id === 'new' && fold) ui.open[fold.getAttribute('data-keep')] = true; // ready for the next one
      render(id === 'new' ? '#lf-title-new' : '');
      if (id === 'new') say(r.data.shelf === 'unwind' ? 'Saved for an evening.' : 'Added to the Library.');
    },
    'cur-say': function (val) {
      var c = cardById(ui.cur.id);
      var text = val('text');
      if (!c || !text) return;
      put(make('idea', { text: text + '\n\n(From Curiosity: ' + c.scene + ')', kind: 'thought' }));
      ui.cur.kept = true;
      render();
      say('Kept in Capture.');
    },
    offline: function (val) { var text = val('text'); if (text) { put(make('offline', { text: text })); render('#off-new'); } },
    link: function (val, form) {
      var url = typedUrl(val('url'));
      var app = appId(val('app'));
      if (val('app') && !app) { say('That app link doesn\'t look right. Paste the app\'s Google Play link.'); return; }
      if (!url && !(app && !val('url'))) { say(val('url') ? 'That address doesn\'t look right. Try one starting with https://' : 'Add an address, or an Android app.'); return; }
      var id = form.getAttribute('data-id');
      var r = id === 'new' ? make('link', {}) : find(id);
      if (!r) return;
      r.data.title = val('title');
      r.data.url = url;
      r.data.category = val('category') || 'Everyday';
      r.data.app = app;
      r.shared = !!form.elements.shared.checked;
      put(r);
      resetEditing();
      render(id === 'new' ? '#kf-title-new' : '');
      if (id === 'new') say('Door added.');
    }
  };

  root.addEventListener('submit', function (e) {
    var form = e.target;
    var kind = form.getAttribute('data-form');
    if (!kind || !FORM[kind]) return;
    e.preventDefault();
    if (kind !== 'signin' && !canEdit()) return;
    var data = new FormData(form);
    FORM[kind](function (name) { return String(data.get(name) || '').trim(); }, form);
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

  ui.view = viewFromHash();
  start();
  if (mode === 'local' && ui.view !== 'home') slotIntoView();
})();
