/* Ambernath Book Club
   Who has which book, what you can borrow, and what needs your attention.
   Data lives in Supabase (supabase/bookclub.sql); every lending step is a
   database function that checks who may do it, so this page only asks. */
(function () {
  'use strict';

  var cfg = (window.NB && window.NB.deskConfig) || {};
  var view = document.getElementById('view');
  var dialogEl = document.getElementById('dialog');

  var S = {
    client: null,
    session: null,
    me: null,            // bc_members row, or null
    joined: false,       // bc_join has answered for this session
    members: {},         // id -> member
    books: [],
    loans: [],
    pub: null,           // visitors' shelf
    q: '',
    filter: 'all',
    sort: 'title',
    genre: '',
    signin: { step: 'email', email: '' },
    lastLoad: 0
  };

  var ACTIVE = ['approved', 'out', 'returning'];
  var OPEN = ['requested', 'approved', 'out', 'returning'];
  var FILTER_KEY = 'bookclub-shelf';
  try { var saved = JSON.parse(localStorage.getItem(FILTER_KEY) || '{}'); if (saved.filter) S.filter = saved.filter; if (saved.sort) S.sort = saved.sort; if (saved.genre) S.genre = saved.genre; } catch (e) { /* private window */ }

  /* ---------------------------------------------------------------- helpers */

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim(); }
  function hash(s) { var h = 0; s = String(s || ''); for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); }
  var CLOTH = ['#7A2E24', '#2F4B3A', '#24395E', '#6B4A1F', '#4D2F4F', '#2E5458', '#8A5A2B', '#3F3A33', '#5C2B36', '#41537A'];
  function cloth(s) { return CLOTH[hash(s) % CLOTH.length]; }
  function initial(name) { return esc((String(name || '?').trim()[0] || '?').toUpperCase()); }

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function isoDay(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function today() { return isoDay(new Date()); }
  function parseDay(s) { var p = String(s).split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  // The coming Sunday (today, if it's Sunday) plus n weeks. Matches bc__sundays_from_now.
  function sundays(n) { var d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + (7 - d.getDay()) % 7 + 7 * n); return isoDay(d); }
  var DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function fmtDay(s) { if (!s) return ''; var d = parseDay(s); return DAYS[d.getDay()] + ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()]; }
  function fmtWhen(ts) {
    if (!ts) return '';
    var d = new Date(ts), now = new Date();
    var s = d.getDate() + ' ' + MONTHS[d.getMonth()];
    return d.getFullYear() === now.getFullYear() ? s : s + ' ' + d.getFullYear();
  }
  function daysUntil(s) { return Math.round((parseDay(s) - parseDay(today())) / 86400000); }
  function dueText(s) {
    if (!s) return '';
    var n = daysUntil(s);
    if (n < 0) return 'overdue since ' + fmtDay(s);
    if (n === 0) return 'due today';
    if (n === 1) return 'due tomorrow';
    return 'due ' + fmtDay(s);
  }

  function name(id) {
    if (S.me && id === S.me.id) return 'you';
    var m = S.members[id];
    return m ? m.name : 'a former member';
  }
  function Name(id) { var n = name(id); return n === 'you' ? 'You' : n; }
  function isMine(b) { return S.me && b.owner_id === S.me.id; }
  function canManage(b) { return S.me && (b.owner_id === S.me.id || S.me.is_admin); }
  function book(id) { for (var i = 0; i < S.books.length; i++) if (S.books[i].id === id) return S.books[i]; return null; }
  function loansOf(bookId) { return S.loans.filter(function (l) { return l.book_id === bookId; }); }
  function activeLoan(bookId) { return S.loans.find(function (l) { return l.book_id === bookId && ACTIVE.indexOf(l.status) >= 0; }) || null; }
  function queueOf(bookId) {
    return S.loans.filter(function (l) { return l.book_id === bookId && l.status === 'requested'; })
      .sort(function (a, b) { return a.requested_at < b.requested_at ? -1 : 1; });
  }

  // Where a book is and how to describe it.
  function state(b) {
    var a = activeLoan(b.id);
    var q = queueOf(b.id);
    if (a && a.status === 'approved') return { kind: 'wait', loan: a, queue: q, holder: b.owner_id, label: 'Promised to ' + name(a.borrower_id) };
    if (a && a.status === 'returning') return { kind: 'out', loan: a, queue: q, holder: a.borrower_id, label: 'On its way back' };
    if (a) {
      var late = a.due_on && daysUntil(a.due_on) < 0;
      return { kind: late ? 'late' : 'out', loan: a, queue: q, holder: a.borrower_id,
        label: 'With ' + name(a.borrower_id) + (late ? ' · overdue' : a.due_on ? ' · ' + fmtDay(a.due_on) : '') };
    }
    if (!b.lendable) return { kind: 'off', loan: null, queue: q, holder: b.owner_id, label: 'Not lending now' };
    return { kind: 'in', loan: null, queue: q, holder: b.owner_id, label: 'Available' };
  }

  function coverHTML(b, badge) {
    var src = b.cover && /^covers\//.test(b.cover) ? '/bookclub/' + b.cover : b.cover;
    var img = src ? '<img src="' + esc(src) + '" alt="" loading="lazy" decoding="async" onerror="this.remove()">' : '';
    return '<div class="cover" style="background:' + cloth(b.title) + '">' +
      '<div class="drawn"><span class="t">' + esc(b.title) + '</span><span class="a">' + esc(b.author) + '</span></div>' +
      img + (badge || '') + '</div>';
  }
  function badgeHTML(kind, label) { return '<span class="badge ' + kind + '">' + esc(label) + '</span>'; }

  function whatsapp(text) { return 'https://wa.me/?text=' + encodeURIComponent(text); }
  var WA_ICON = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1-1.3-.6-2.4-1.5-3.1-2.8-.2-.4.2-.4.7-1.2.1-.1 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.3-.8.8-1 1.8-.7 2.8.4 1.4 1.3 2.7 2.4 3.7 1.4 1.3 2.6 1.8 4 2.2.9.3 1.8.1 2.4-.5.3-.3.5-.7.5-1.1 0-.2-.1-.3-.3-.4Z"/></svg>';
  function waButton(text, label) {
    return '<a class="btn small ghost wa" target="_blank" rel="noopener" href="' + esc(whatsapp(text)) + '">' + WA_ICON + esc(label || 'Tell them on WhatsApp') + '</a>';
  }
  function clubLink(b) { return location.origin + '/bookclub/#/book/' + b.id; }

  var toastTimer;
  function toast(msg, bad) {
    var t = document.getElementById('toast');
    t.textContent = msg; t.className = 'toast show' + (bad ? ' bad' : '');
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.className = 'toast' + (bad ? ' bad' : ''); }, bad ? 5200 : 2600);
  }
  function errMsg(e) {
    var m = (e && (e.message || e.error_description)) || String(e || 'Something went wrong.');
    if (/Failed to fetch|NetworkError|Load failed/i.test(m)) return 'No connection. Check your internet and try again.';
    if (/duplicate key|bc_loans_one_holder/i.test(m)) return 'Someone else got there first. The shelf has been refreshed.';
    if (/bc_loans_one_open_each/.test(m)) return 'You’ve already asked for this book.';
    if (/violates foreign key.*bc_books_owner/i.test(m)) return 'They still own books on the shelf. Remove or reassign those first.';
    if (/check constraint/i.test(m)) return 'Something in the form isn’t allowed. Check the details and try again.';
    return m;
  }

  // A small modal. fields: HTML inside the form. Resolves with FormData, or null if cancelled.
  function ask(opts) {
    return new Promise(function (resolve) {
      dialogEl.innerHTML = '<form method="dialog">' +
        '<h2>' + esc(opts.title) + '</h2>' + (opts.body || '') +
        '<p class="err" hidden></p>' +
        '<div class="actions"><button class="btn ghost" value="cancel" formnovalidate>' + esc(opts.cancel || 'Cancel') + '</button>' +
        '<button class="btn ' + (opts.danger ? 'danger' : 'primary') + '" value="ok">' + esc(opts.ok || 'OK') + '</button></div></form>';
      var form = dialogEl.querySelector('form');
      var done = false;
      function finish(v) { if (done) return; done = true; if (dialogEl.open) dialogEl.close(); resolve(v); }
      form.addEventListener('submit', function (e) {
        var submitter = e.submitter;
        if (submitter && submitter.value === 'cancel') { finish(null); return; }
        e.preventDefault();
        var fd = new FormData(form);
        if (opts.validate) { var problem = opts.validate(fd); if (problem) { var p = form.querySelector('.err'); p.textContent = problem; p.hidden = false; return; } }
        finish(fd);
      });
      dialogEl.addEventListener('close', function onClose() { dialogEl.removeEventListener('close', onClose); finish(null); });
      if (opts.onOpen) opts.onOpen(form);
      dialogEl.showModal();
      var first = form.querySelector('input:not([type=hidden]):not([type=checkbox]), textarea, select');
      if (first) first.focus();
    });
  }

  // Return-date chooser, in Sundays because the club meets on Sundays.
  function dueField(current) {
    var opts = [2, 3, 4, 6].map(function (n) { return sundays(n); });
    var cur = current || opts[1];
    return '<div class="field"><span class="label">Return by</span><div class="seg" data-due>' +
      opts.map(function (d, i) {
        return '<button type="button" data-v="' + d + '" aria-pressed="' + (d === cur) + '">' + [2, 3, 4, 6][i] + ' Sundays<small>' + fmtDay(d) + '</small></button>';
      }).join('') + '</div><input type="date" name="due" value="' + esc(cur) + '" min="' + today() + '" aria-label="Or pick a date"></div>';
  }
  function wireDue(form) {
    var input = form.querySelector('input[name=due]');
    form.querySelectorAll('[data-due] button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        input.value = btn.dataset.v;
        form.querySelectorAll('[data-due] button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === btn)); });
      });
    });
    input.addEventListener('input', function () {
      form.querySelectorAll('[data-due] button').forEach(function (x) { x.setAttribute('aria-pressed', String(x.dataset.v === input.value)); });
    });
  }

  /* ---------------------------------------------------------------- genres */

  // Same keys as the site's References shelves (content/shelves.js).
  var GENRES = [
    ['literary', 'Literary fiction'], ['classics', 'Classics'], ['thriller', 'Thriller & mystery'], ['horror', 'Horror'],
    ['fantasy', 'Fantasy'], ['scifi', 'Sci-fi & dystopia'], ['romance', 'Romance'], ['comingofage', 'Coming-of-age'],
    ['myth', 'Myths & retellings'], ['paranormal', 'Paranormal'], ['history', 'History'], ['war', 'War & the military'],
    ['lives', 'Biography & memoir'], ['science', 'Science'], ['tech', 'Technology & AI'], ['money', 'Business & money'],
    ['mind', 'Mind & self-help'], ['philosophy', 'Philosophy & meaning'], ['craft', 'Writing & creativity'], ['india', 'India']
  ];
  var GENRE_LABEL = {}; GENRES.forEach(function (g) { GENRE_LABEL[g[0]] = g[1]; });
  var GENRE_RULES = [
    ['fantasy', /fantasy|magic|wizard|dragon/], ['scifi', /science fiction|dystopi|space opera/], ['horror', /horror|supernatural|ghost stor/],
    ['thriller', /thriller|mystery|detective|suspense|crime fiction|murder/], ['romance', /romance|love stor/], ['classics', /classic/],
    ['comingofage', /coming of age|young adult|juvenile fiction|teen/], ['myth', /mytholog|retelling/], ['war', /\bwar\b|military|espionage|spies/],
    ['lives', /biograph|memoir/], ['money', /business|finance|money|economics|management|entrepreneur|invest/],
    ['mind', /self-help|self help|psycholog|habit|success|motivation|happiness|productivity/],
    ['philosophy', /philosoph|stoic|ethics|spiritual|meaning of life/], ['craft', /authorship|creative writing|poetry|creativity/],
    ['tech', /computer|technolog|artificial intelligence|programming|internet/], ['india', /\bindia/]
  ];
  // Open Library's subject tags are messy; turn them into up to three of ours.
  function guessGenres(subjects) {
    var subj = (subjects || []).slice(0, 60).map(function (x) { return String(x).toLowerCase(); });
    var score = {};
    function add(k) { score[k] = (score[k] || 0) + 1; }
    subj.forEach(function (x) {
      GENRE_RULES.forEach(function (r) { if (r[1].test(x)) add(r[0]); });
      if (/\bhistory\b/.test(x) && !/fiction/.test(x)) add('history');
      if (/\bscience\b/.test(x) && !/fiction/.test(x)) add('science');
    });
    var keys = Object.keys(score).sort(function (a, b) { return score[b] - score[a]; }).slice(0, 3);
    var stories = ['fantasy', 'scifi', 'horror', 'thriller', 'romance', 'classics', 'comingofage', 'myth', 'paranormal'];
    var ideas = ['lives', 'money', 'mind', 'philosophy', 'history', 'science', 'tech'];
    var isFiction = subj.some(function (x) { return /\bfiction\b/.test(x); });
    if (isFiction && !keys.some(function (k) { return stories.indexOf(k) >= 0 || ideas.indexOf(k) >= 0; })) keys.unshift('literary');
    return keys.slice(0, 3);
  }
  function genreChips(b) {
    var g = (b.genres || []).filter(function (k) { return GENRE_LABEL[k]; });
    if (!g.length) return '';
    return '<div class="genres">' + g.map(function (k) {
      return '<a class="gchip" href="#/" data-act="genre" data-genre="' + k + '">' + esc(GENRE_LABEL[k]) + '</a>';
    }).join('') + '</div>';
  }

  // Description and rating, fetched when a book page opens (Open Library, then Wikipedia).
  var DETAILS = {};
  function cleanDesc(t) {
    t = String(t || '').replace(/\r/g, '');
    t = t.split(/\n\s*(?:-{3,}|\*{3,}|_{3,})/)[0];
    t = t.replace(/\[([^\]]+)\]\[\d+\]/g, '$1').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/^\s*\[\d+\]:.*$/gm, '').replace(/\(\s*source:[^)]*\)/gi, '')
      .replace(/^\s*from wikipedia:?\s*/i, '')
      .replace(/\\([[\]*_])/g, '$1')
      // "(Russian: ..., tr. ...; IPA: [...])" and similar original-language asides
      .replace(/\s*\((?:Russian|Japanese|German|French|Greek|Latin|Spanish|Italian|Hindi|Ancient Greek|Koine Greek)\s*:[^()]*(?:\([^()]*\)[^()]*)*\)/g, '')
      .replace(/\n{3,}/g, '\n\n');
    return t.trim();
  }
  function looksEnglish(t) { return t && (t.match(/[a-z]/gi) || []).length / t.length > 0.6; }
  async function details(b) {
    var key = b.id + '|' + (b.ol_work || '') + '|' + b.title;
    if (DETAILS[key]) return DETAILS[key];
    var d = { desc: '', source: '', sourceUrl: '', rating: null, count: 0, work: b.ol_work || null };
    try {
      if (!d.work) {
        var found = await fetchJSON('https://openlibrary.org/search.json?limit=1&fields=key&q=' + encodeURIComponent(b.title + ' ' + (b.author || '')));
        d.work = found.docs && found.docs[0] && found.docs[0].key || null;
      }
      if (d.work && /^\/works\/OL\d+W$/.test(d.work)) {
        var both = await Promise.all([
          fetchJSON('https://openlibrary.org' + d.work + '.json').catch(function () { return null; }),
          fetchJSON('https://openlibrary.org' + d.work + '/ratings.json').catch(function () { return null; })
        ]);
        var w = both[0], r = both[1];
        var text = w && w.description ? cleanDesc(typeof w.description === 'string' ? w.description : w.description.value) : '';
        if (text.length >= 120 && looksEnglish(text)) { d.desc = text; d.source = 'Open Library'; d.sourceUrl = 'https://openlibrary.org' + d.work; }
        if (r && r.summary && r.summary.count) { d.rating = r.summary.average; d.count = r.summary.count; }
      }
    } catch (e) { /* try Wikipedia */ }
    if (d.desc.length < 300) {   // none, or only a line: see if Wikipedia says more
      try {
        var short = String(b.title).split(':')[0].trim();
        var last = String(b.author || '').split(/[ ,]+/).filter(Boolean).pop() || '';
        var sr = await fetchJSON('https://en.wikipedia.org/w/api.php?action=query&list=search&format=json&origin=*&srlimit=6&srsearch=' + encodeURIComponent(short + ' ' + last + ' book'));
        var want = norm(short);
        var page = ((sr.query && sr.query.search) || []).find(function (pg) { return norm(pg.title).indexOf(want) === 0; });
        if (page) {
          var sum = await fetchJSON('https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(page.title.replace(/ /g, '_')));
          if (sum && sum.extract && sum.type !== 'disambiguation' && sum.extract.length > Math.max(80, d.desc.length)) {
            sum.extract = cleanDesc(sum.extract);
            d.desc = sum.extract; d.source = 'Wikipedia';
            d.sourceUrl = (sum.content_urls && sum.content_urls.desktop && sum.content_urls.desktop.page) || ('https://en.wikipedia.org/wiki/' + encodeURIComponent(page.title));
          }
        }
      } catch (e) { /* no description */ }
    }
    DETAILS[key] = d;
    return d;
  }
  function stars(avg) {
    var full = Math.round(avg * 2) / 2, h = '';
    for (var i = 1; i <= 5; i++) h += '<span class="star' + (full >= i ? ' on' : full >= i - 0.5 ? ' half' : '') + '">★</span>';
    return '<span class="stars" aria-hidden="true">' + h + '</span>';
  }
  function goodreadsUrl(b) { return 'https://www.goodreads.com/search?q=' + encodeURIComponent(b.isbn || (b.title + ' ' + (b.author || ''))); }
  async function paintAbout(b) {
    var box = document.getElementById('about');
    if (!box) return;
    var d = await details(b);
    box = document.getElementById('about');
    if (!box || box.dataset.book !== String(b.id)) return;   // the reader moved on
    var h = '<h2>About this book</h2>';
    if (d.count >= 3) h += '<p class="rating">' + stars(d.rating) + '<b>' + d.rating.toFixed(1) + '</b> out of 5 <span class="muted">· ' + d.count + ' ratings on Open Library</span></p>';
    if (d.desc) {
      var paras = d.desc.split(/\n\s*\n/).map(function (x) { return '<p>' + esc(x.trim()).replace(/\n/g, '<br>') + '</p>'; }).join('');
      var long = d.desc.length > 650;
      h += '<div class="desc' + (long ? ' clamp' : '') + '">' + paras + '</div>' +
        (long ? '<button class="btn small ghost" data-act="more" type="button">Read more</button>' : '') +
        '<p class="small muted">From <a href="' + esc(d.sourceUrl) + '" target="_blank" rel="noopener">' + esc(d.source) + '</a></p>';
    } else {
      h += '<p class="muted">No description found yet.</p>';
    }
    h += '<div class="actions" style="margin-top:8px"><a class="btn small" href="' + esc(goodreadsUrl(b)) + '" target="_blank" rel="noopener">Reviews on Goodreads</a>' +
      (d.work ? '<a class="btn small ghost" href="https://openlibrary.org' + esc(d.work) + '" target="_blank" rel="noopener">Open Library</a>' : '') + '</div>';
    box.innerHTML = h;
  }

  /* ---------------------------------------------------------------- data */

  async function loadAll() {
    if (!S.me) return;
    var c = S.client;
    var res = await Promise.all([
      c.from('bc_members').select('id,name,is_admin,joined_at').order('joined_at'),
      c.from('bc_books').select('*').order('title'),
      c.from('bc_loans').select('*').order('id')
    ]);
    for (var i = 0; i < res.length; i++) if (res[i].error) throw res[i].error;
    S.members = {};
    res[0].data.forEach(function (m) { S.members[m.id] = m; });
    if (S.members[S.me.id]) S.me = S.members[S.me.id];
    S.books = res[1].data;
    S.loans = res[2].data;
    S.lastLoad = Date.now();
  }

  async function loadPublic() {
    var r = await S.client.rpc('bc_public_shelf');
    if (r.error) throw r.error;
    S.pub = r.data || [];
  }

  async function join() {
    var r = await S.client.rpc('bc_join');
    if (r.error) throw r.error;
    S.me = r.data || null;
    S.joined = true;
  }

  async function refresh() {
    try {
      if (S.session && !S.joined) await join();
      if (S.me) await loadAll(); else await loadPublic();
    } catch (e) { toast(errMsg(e), true); }
    render();
  }

  // Run a lending step, then reload so everyone's view is the truth.
  async function act(fn, args, okMsg) {
    var r = await S.client.rpc(fn, args);
    if (r.error) { toast(errMsg(r.error), true); await refresh(); return false; }
    if (okMsg) toast(okMsg);
    await refresh();
    return true;
  }

  /* ---------------------------------------------------------------- navigation */

  var ICONS = {
    shelf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 4h4v16H4zM10 4h4v16h-4z"/><path d="m16 5 3.8-1 2.2 15.5-3.8 1z"/></svg>',
    add: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></svg>',
    me: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>',
    people: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c1-3.5 3.5-5.5 6.5-5.5s5.5 2 6.5 5.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c1.7.8 2.9 2.6 3.5 5.2"/></svg>',
    signin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M10 16l4-4-4-4M14 12H4"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    back: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>',
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>',
    scan: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M7 8v8M10 8v8M13 8v8M17 8v8"/></svg>'
  };

  function route() {
    var h = location.hash.replace(/^#\/?/, '');
    if (/access_token|error_description|^error=/.test(h)) h = '';
    var parts = h.split('/');
    return { name: parts[0] || 'shelf', id: parts[1] ? Number(parts[1]) : null };
  }

  function needsYou() {
    if (!S.me) return [];
    var me = S.me.id, out = [];
    S.loans.forEach(function (l) {
      var b = book(l.book_id); if (!b) return;
      var mine = b.owner_id === me;
      if (mine && l.status === 'requested' && !activeLoan(b.id)) out.push(l);
      else if (mine && l.status === 'approved') out.push(l);
      else if (mine && l.status === 'returning') out.push(l);
      else if (l.borrower_id === me && l.status === 'approved') out.push(l);
      else if (l.borrower_id === me && l.status === 'out' && l.due_on && daysUntil(l.due_on) <= 1) out.push(l);
    });
    return out;
  }

  function renderNav() {
    var r = route().name;
    var items;
    if (S.me) {
      var n = needsYou().length;
      var dot = n ? '<span class="dot">' + n + '</span>' : '';
      items = [
        { href: '#/', key: 'shelf', label: 'Shelf', icon: ICONS.shelf },
        { href: '#/add', key: 'add', label: 'Add a book', short: 'Add', icon: ICONS.add },
        { href: '#/members', key: 'members', label: 'Members', icon: ICONS.people, desktop: true },
        { href: '#/me', key: 'me', label: 'Me', icon: ICONS.me, extra: dot }
      ];
    } else {
      items = [
        { href: '#/', key: 'shelf', label: 'Shelf', icon: ICONS.shelf },
        { href: '#/signin', key: 'signin', label: S.session ? 'Account' : 'Members sign in', short: S.session ? 'Account' : 'Sign in', icon: ICONS.signin }
      ];
    }
    function link(it, bottom) {
      var cur = (r === it.key || (it.key === 'shelf' && r === 'book')) ? ' aria-current="page"' : '';
      return '<a href="' + it.href + '"' + cur + '>' + it.icon + '<span>' + esc(bottom && it.short ? it.short : it.label) + '</span>' + (it.extra || '') + '</a>';
    }
    document.getElementById('tabs').innerHTML = items.map(function (it) { return link(it, false); }).join('');
    document.getElementById('bottom').innerHTML = items.filter(function (it) { return !it.desktop; }).map(function (it) { return link(it, true); }).join('');
  }

  function render() {
    renderNav();
    var r = route();
    var html;
    if (!S.client) return;
    if (!S.me) {
      html = r.name === 'signin' ? signinView() : visitorView();
    } else if (r.name === 'book') {
      var b = book(r.id);
      html = b ? bookView(b) : '<a class="back" href="#/">' + ICONS.back + 'Shelf</a><p class="empty">That book isn’t on the shelf any more.</p>';
    } else if (r.name === 'add') html = addView();
    else if (r.name === 'me') html = meView();
    else if (r.name === 'members') html = membersView();
    else if (r.name === 'signin') { location.replace('#/me'); return; }
    else html = shelfView();
    view.innerHTML = html;
    wire(r);
  }

  window.addEventListener('hashchange', function () {
    render();
    window.scrollTo(0, 0);
  });

  /* ---------------------------------------------------------------- shelf */

  function filtered() {
    var q = norm(S.q);
    var list = S.books.filter(function (b) {
      var st = state(b);
      if (S.filter === 'available' && st.kind !== 'in') return false;
      if (S.filter === 'out' && ['out', 'late', 'wait'].indexOf(st.kind) < 0) return false;
      if (S.filter === 'mine' && !isMine(b)) return false;
      if (S.filter === 'holding' && !(st.holder === S.me.id && !isMine(b))) return false;
      if (S.genre && (b.genres || []).indexOf(S.genre) < 0) return false;
      if (q && norm(b.title + ' ' + b.author + ' ' + name(b.owner_id) + ' ' + (b.genres || []).map(function (k) { return GENRE_LABEL[k] || ''; }).join(' ')).indexOf(q) < 0) return false;
      return true;
    });
    var key = {
      title: function (b) { return norm(b.title).replace(/^(the|a|an) /, ''); },
      author: function (b) { var a = norm(b.author).split(' '); return a[a.length - 1] + ' ' + norm(b.title); },
      newest: function (b) { return String(9e15 - new Date(b.added_at).getTime()).padStart(20, '0') + b.title; },
      owner: function (b) { return norm(name(b.owner_id)) + ' ' + norm(b.title); }
    }[S.sort] || function (b) { return norm(b.title); };
    return list.sort(function (a, b) { var x = key(a), y = key(b); return x < y ? -1 : x > y ? 1 : 0; });
  }

  function counts() {
    var c = { all: S.books.length, available: 0, out: 0, mine: 0, holding: 0 };
    S.books.forEach(function (b) {
      var st = state(b);
      if (st.kind === 'in') c.available++;
      if (['out', 'late', 'wait'].indexOf(st.kind) >= 0) c.out++;
      if (isMine(b)) c.mine++;
      if (st.holder === S.me.id && !isMine(b)) c.holding++;
    });
    return c;
  }

  function shelfView() {
    var memberCount = Object.keys(S.members).length;
    var c = counts();
    return '<div class="page-head"><div><h1>The shelf</h1>' +
      '<p class="lede">' + c.all + ' books from ' + memberCount + ' member' + (memberCount === 1 ? '' : 's') + ' · ' + c.available + ' ready to borrow · ' + c.out + ' out right now</p></div></div>' +
      '<div class="toolbar">' +
      '<label class="search">' + ICONS.search + '<input id="q" type="search" placeholder="Search titles, authors, owners" value="' + esc(S.q) + '" autocomplete="off" aria-label="Search the shelf"></label>' +
      '<div class="chips" id="chips"></div>' +
      '<label class="sort"><select id="genre" aria-label="Genre"></select></label>' +
      '<label class="sort"><span class="sr-only" hidden>Sort</span><select id="sort" aria-label="Sort">' +
      [['title', 'A–Z'], ['author', 'By author'], ['owner', 'By owner'], ['newest', 'Newest']].map(function (o) {
        return '<option value="' + o[0] + '"' + (S.sort === o[0] ? ' selected' : '') + '>' + o[1] + '</option>';
      }).join('') + '</select></label></div>' +
      '<div class="grid" id="grid"></div>';
  }

  function renderShelfParts() {
    var c = counts();
    var gcount = {};
    S.books.forEach(function (b) { (b.genres || []).forEach(function (k) { gcount[k] = (gcount[k] || 0) + 1; }); });
    if (S.genre && !gcount[S.genre]) S.genre = '';
    document.getElementById('genre').innerHTML = '<option value="">All genres</option>' + GENRES.filter(function (g) { return gcount[g[0]]; }).map(function (g) {
      return '<option value="' + g[0] + '"' + (S.genre === g[0] ? ' selected' : '') + '>' + esc(g[1]) + ' (' + gcount[g[0]] + ')</option>';
    }).join('');
    var chips = [['all', 'All'], ['available', 'Available'], ['out', 'Borrowed'], ['mine', 'My books']];
    if (c.holding) chips.push(['holding', 'With me']);
    document.getElementById('chips').innerHTML = chips.map(function (ch) {
      return '<button class="chip" data-filter="' + ch[0] + '" aria-pressed="' + (S.filter === ch[0]) + '">' + ch[1] + '<span class="n">' + c[ch[0]] + '</span></button>';
    }).join('');
    var list = filtered();
    var grid = document.getElementById('grid');
    if (!list.length) {
      grid.innerHTML = '<p class="empty" style="grid-column:1/-1">' +
        (S.q ? 'Nothing matches “' + esc(S.q) + '”. <a href="#/add">Add it?</a>' :
          S.filter === 'mine' ? 'You haven’t added any books yet. <a href="#/add">Add your first</a>.' : 'No books here right now.') + '</p>';
      return;
    }
    grid.innerHTML = list.map(function (b) {
      var st = state(b);
      return '<a class="card" href="#/book/' + b.id + '">' + coverHTML(b, badgeHTML(st.kind, st.label)) +
        '<div class="meta"><div class="t">' + esc(b.title) + '</div><div class="a">' + esc(b.author) +
        (isMine(b) ? '' : ' · ' + esc(Name(b.owner_id)) + '’s') + '</div></div></a>';
    }).join('');
  }

  function wireShelf() {
    renderShelfParts();
    var q = document.getElementById('q');
    q.addEventListener('input', function () { S.q = q.value; renderShelfParts(); });
    document.getElementById('chips').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-filter]'); if (!btn) return;
      S.filter = btn.dataset.filter; remember(); renderShelfParts();
    });
    document.getElementById('sort').addEventListener('change', function (e) { S.sort = e.target.value; remember(); renderShelfParts(); });
    document.getElementById('genre').addEventListener('change', function (e) { S.genre = e.target.value; remember(); renderShelfParts(); });
  }
  function remember() { try { localStorage.setItem(FILTER_KEY, JSON.stringify({ filter: S.filter, sort: S.sort, genre: S.genre })); } catch (e) { /* fine */ } }

  /* ---------------------------------------------------------------- book page */

  function bookView(b) {
    var st = state(b), me = S.me.id, owner = b.owner_id;
    var a = st.loan, queue = st.queue;
    var myOpen = S.loans.find(function (l) { return l.book_id === b.id && l.borrower_id === me && OPEN.indexOf(l.status) >= 0; });
    var facts = [];
    if (b.year) facts.push(b.year < 1000 ? 'c. ' + b.year : String(b.year));
    if (b.pages) facts.push(b.pages + ' pages');
    facts.push('On the shelf since ' + fmtWhen(b.added_at));

    var whereV, whereS = '', whereCls = '';
    if (!a || a.status === 'approved') { whereV = owner === me ? 'With you' : 'With ' + name(owner); whereS = st.kind === 'off' ? 'Not lending right now' : a ? 'Promised to ' + name(a.borrower_id) : 'Ready to borrow'; }
    else if (a.status === 'returning') { whereV = 'On its way back'; whereS = name(a.borrower_id) === 'you' ? 'You said you’ve returned it' : Name(a.borrower_id) + ' says it’s returned'; }
    else { whereV = a.borrower_id === me ? 'With you' : 'With ' + name(a.borrower_id); whereS = 'Since ' + fmtWhen(a.handed_at) + (a.due_on ? ' · ' + dueText(a.due_on) : ''); if (st.kind === 'late') whereCls = ' late'; }

    var h = '<a class="back" href="#/">' + ICONS.back + 'Shelf</a>' +
      '<article class="book">' + coverHTML(b) + '<div>' +
      '<h1>' + esc(b.title) + '</h1>' + (b.author ? '<div class="by">' + esc(b.author) + '</div>' : '') +
      '<div class="facts">' + facts.map(function (f) { return '<span>' + esc(f) + '</span>'; }).join('') + '</div>' + genreChips(b) +
      '<div class="where"><div><div class="k">Belongs to</div><div class="v">' + esc(Name(owner)) + '</div><div class="s">' + (owner === me ? 'Your book' : 'Club member') + '</div></div>' +
      '<div><div class="k">Where it is now</div><div class="v' + whereCls + '">' + esc(whereV) + '</div><div class="s">' + esc(whereS) + '</div></div></div>' +
      (b.note ? '<p class="note">' + esc(b.note) + '</p>' : '');

    h += '<div class="actions">' + actionsFor(b, st, myOpen) + '</div>';
    h += '<section class="section about" id="about" data-book="' + b.id + '"><h2>About this book</h2><p class="muted">Looking it up…</p></section>';

    // Requests waiting for the owner (they decide here).
    if (canManage(b) && queue.length) {
      h += '<section class="section"><h2>Asked to borrow <span class="count">' + queue.length + '</span></h2><div class="items">' +
        queue.map(function (l, i) {
          return '<div class="item' + (!a ? ' urgent' : '') + '" style="grid-template-columns:40px 1fr"><span class="avatar" style="background:' + cloth(name(l.borrower_id)) + '">' + initial(name(l.borrower_id)) + '</span><div>' +
            '<h3>' + esc(Name(l.borrower_id)) + (i === 0 && a ? ' <span class="muted small">is next</span>' : '') + '</h3>' +
            '<p>Asked ' + fmtWhen(l.requested_at) + (l.note ? ' · “' + esc(l.note) + '”' : '') + '</p>' +
            '<div class="actions">' + (a ? '<p class="hint">Approve once it’s back with you.</p>' :
              '<button class="btn small primary" data-act="approve" data-loan="' + l.id + '">Say yes</button>' +
              '<button class="btn small" data-act="lend-now" data-loan="' + l.id + '">Hand it over now</button>') +
            '<button class="btn small ghost" data-act="decline" data-loan="' + l.id + '">Say no</button></div></div></div>';
        }).join('') + '</div></section>';
    } else if (queue.length) {
      h += '<section class="section"><h2>In line <span class="count">' + queue.length + '</span></h2><ul class="list">' +
        queue.map(function (l, i) { return '<li><b>' + (i + 1) + '.</b> ' + esc(Name(l.borrower_id)) + '<span class="when">asked ' + fmtWhen(l.requested_at) + '</span></li>'; }).join('') + '</ul></section>';
    }

    var past = loansOf(b.id).filter(function (l) { return l.status === 'returned'; }).reverse();
    if (past.length) {
      h += '<section class="section"><h2>Who’s read it here <span class="count">' + past.length + '</span></h2><ul class="list">' +
        past.map(function (l) { return '<li><b>' + esc(Name(l.borrower_id)) + '</b><span class="when">' + fmtWhen(l.handed_at) + ' – ' + fmtWhen(l.returned_at) + '</span></li>'; }).join('') + '</ul></section>';
    }

    if (canManage(b)) {
      h += '<div class="owner-tools">' +
        '<button class="btn small" data-act="edit">Edit details</button>' +
        (!b.cover ? '<button class="btn small" data-act="find-cover">Find a cover</button>' : '') +
        (!a || a.status === 'approved' ? '<button class="btn small" data-act="toggle-lend">' + (b.lendable ? 'Pause lending' : 'Start lending again') + '</button>' : '') +
        (!a ? '<button class="btn small ghost danger" data-act="remove">Remove from the shelf</button>' : '') +
        (owner !== me ? '<span class="muted small" style="align-self:center">You can change this because you’re an admin.</span>' : '') +
        '</div>';
    }
    return h + '</div></article>';
  }

  function actionsFor(b, st, myOpen) {
    var me = S.me.id, a = st.loan, owner = b.owner_id, ownerName = name(owner);
    var mine = owner === me;
    // Owner (or admin) with the book out or promised.
    if (canManage(b) && a && a.borrower_id !== me) {
      var who = Name(a.borrower_id);
      if (a.status === 'approved') {
        return '<p class="hint">You said yes to ' + esc(who) + '. Tap below once you’ve handed it over (Sunday is perfect).</p>' +
          '<button class="btn primary" data-act="handover" data-loan="' + a.id + '">Handed over</button>' +
          '<button class="btn ghost" data-act="cancel" data-loan="' + a.id + '">Call it off</button>';
      }
      var late = a.due_on && daysUntil(a.due_on) < 0;
      return '<p class="hint">' + (a.status === 'returning' ? esc(who) + ' says they’ve given it back. Confirm when you have it.' : esc(who) + ' has it, ' + esc(dueText(a.due_on)) + '.') + '</p>' +
        '<button class="btn primary" data-act="returned" data-loan="' + a.id + '">Got it back</button>' +
        (a.status === 'out' ? '<button class="btn" data-act="extend" data-loan="' + a.id + '">Change return date</button>' +
          waButton('Hi ' + who + ', just a reminder about “' + b.title + '” from the book club' + (late ? ' (it was due ' + fmtDay(a.due_on) + ')' : ', ' + dueText(a.due_on)) + '. Bring it on Sunday? ' + clubLink(b), 'Remind on WhatsApp') : '');
    }
    // I'm the borrower.
    if (myOpen && myOpen.status === 'approved') {
      return '<p class="hint">' + esc(Name(owner)) + ' said yes! Collect it (Sunday works), then tap below so everyone knows it’s with you.</p>' +
        '<button class="btn primary" data-act="handover" data-loan="' + myOpen.id + '">I’ve got it</button>' +
        '<button class="btn ghost" data-act="cancel" data-loan="' + myOpen.id + '">I don’t need it any more</button>';
    }
    if (myOpen && myOpen.status === 'out') {
      return '<p class="hint">It’s with you, ' + esc(dueText(myOpen.due_on)) + '. When you give it back, tap below and ' + esc(ownerName) + ' will confirm.</p>' +
        '<button class="btn primary" data-act="returning" data-loan="' + myOpen.id + '">I’ve given it back</button>' +
        waButton('Hi ' + ownerName + ', could I keep “' + b.title + '” a little longer? ' + clubLink(b), 'Ask for more time');
    }
    if (myOpen && myOpen.status === 'returning') {
      return '<p class="hint">Waiting for ' + esc(ownerName) + ' to confirm it’s back.</p>' +
        waButton('Hi ' + ownerName + ', I’ve returned “' + b.title + '”. Could you tap “Got it back” on the club app? ' + clubLink(b), 'Nudge on WhatsApp');
    }
    if (myOpen && myOpen.status === 'requested') {
      var pos = st.queue.findIndex(function (l) { return l.id === myOpen.id; }) + 1;
      return '<p class="hint">' + (a ? 'You’re number ' + pos + ' in line. ' + esc(Name(owner)) + ' will say yes once it’s back.' : 'You’ve asked. Waiting for ' + esc(ownerName) + ' to say yes.') + '</p>' +
        waButton('Hi ' + ownerName + ', I’ve asked to borrow “' + b.title + '” on the book club app. ' + clubLink(b), 'Tell ' + ownerName) +
        '<button class="btn ghost" data-act="cancel" data-loan="' + myOpen.id + '">Cancel my request</button>';
    }
    if (mine) {
      if (!b.lendable) return '<p class="hint">You’ve paused lending this one. Nobody can ask for it until you start again.</p>';
      return '<p class="hint">It’s on the shelf. Members can ask to borrow it, or you can hand it to someone directly.</p>' +
        '<button class="btn" data-act="lend">Lend it to someone</button>';
    }
    if (canManage(b) && !a && b.lendable) {
      // An admin looking at someone else's book.
      return '<button class="btn primary" data-act="request">Ask to borrow</button><button class="btn" data-act="lend">Record a loan for ' + esc(ownerName) + '</button>';
    }
    if (!b.lendable) return '<p class="hint">' + esc(Name(owner)) + ' isn’t lending this one right now.</p>';
    if (a) {
      var ahead = st.queue.length;
      var back = !a.due_on || a.status === 'approved' ? '' : daysUntil(a.due_on) < 0 ? ', and it was due back ' + fmtDay(a.due_on) : ', due back ' + fmtDay(a.due_on);
      return '<p class="hint">It’s out right now' + back + '. ' + (ahead ? ahead + ' ' + (ahead === 1 ? 'person is' : 'people are') + ' in line.' : 'Nobody’s in line yet.') + '</p>' +
        '<button class="btn primary" data-act="request">Get in line</button>';
    }
    return '<button class="btn primary" data-act="request">Ask to borrow</button>';
  }

  function memberOptions(exclude, selected) {
    return Object.keys(S.members).map(function (id) { return S.members[id]; })
      .filter(function (m) { return m.id !== exclude; })
      .sort(function (x, y) { return x.name.localeCompare(y.name); })
      .map(function (m) { return '<option value="' + esc(m.id) + '"' + (m.id === selected ? ' selected' : '') + '>' + esc(m.id === S.me.id ? m.name + ' (you)' : m.name) + '</option>'; }).join('');
  }

  async function bookAction(b, actName, loanId) {
    var loan = loanId ? S.loans.find(function (l) { return l.id === loanId; }) : null;
    var fd;
    switch (actName) {
      case 'request':
        fd = await ask({
          title: 'Ask to borrow', ok: activeLoan(b.id) ? 'Get in line' : 'Ask ' + Name(b.owner_id),
          body: '<p class="muted" style="margin:0">“' + esc(b.title) + '” belongs to ' + esc(Name(b.owner_id)) + '. They’ll see your request when they open the app.</p>' +
            '<div class="field"><label for="f-note">A note for them (optional)</label><textarea id="f-note" name="note" maxlength="300" placeholder="e.g. Can I pick it up this Sunday?"></textarea></div>'
        });
        if (!fd) return;
        if (await act('bc_request', { book_id: b.id, note: fd.get('note') || null }, 'Asked. Let ' + Name(b.owner_id) + ' know on WhatsApp if it’s urgent.')) return;
        return;
      case 'cancel':
        fd = await ask({ title: loan.borrower_id === S.me.id ? 'Cancel your request?' : 'Call it off?', ok: 'Yes, cancel', danger: true,
          body: '<p class="muted" style="margin:0">' + (loan.borrower_id === S.me.id ? 'The book stays with ' + esc(Name(b.owner_id)) + '.' : esc(Name(loan.borrower_id)) + ' won’t get the book this time.') + '</p>' });
        if (fd) await act('bc_cancel', { loan_id: loanId }, 'Cancelled.');
        return;
      case 'approve':
        fd = await ask({ title: 'Lend it to ' + Name(loan.borrower_id) + '?', ok: 'Say yes', body: dueField(), onOpen: wireDue,
          validate: function (f) { return !f.get('due') ? 'Pick a return date.' : f.get('due') < today() ? 'That date has passed.' : ''; } });
        if (fd) await act('bc_respond', { loan_id: loanId, approve: true, due: fd.get('due') }, 'Said yes. Hand it over, then tap “Handed over”.');
        return;
      case 'lend-now':
        fd = await ask({ title: 'Hand it to ' + Name(loan.borrower_id) + ' now?', ok: 'It’s with them', body: '<p class="muted" style="margin:0">Use this when you’re giving them the book right now.</p>' + dueField(), onOpen: wireDue,
          validate: function (f) { return !f.get('due') ? 'Pick a return date.' : f.get('due') < today() ? 'That date has passed.' : ''; } });
        if (fd) await act('bc_lend', { book_id: b.id, borrower: loan.borrower_id, due: fd.get('due') }, 'Done. It’s with ' + Name(loan.borrower_id) + ' now.');
        return;
      case 'decline':
        fd = await ask({ title: 'Say no to ' + Name(loan.borrower_id) + '?', ok: 'Say no', danger: true, body: '<p class="muted" style="margin:0">Their request is removed. You might tell them why on WhatsApp.</p>' });
        if (fd) await act('bc_respond', { loan_id: loanId, approve: false, due: null }, 'Request declined.');
        return;
      case 'handover':
        await act('bc_handover', { loan_id: loanId }, loan.borrower_id === S.me.id ? 'Enjoy the book!' : 'Marked as handed over.');
        return;
      case 'returning':
        fd = await ask({ title: 'Given it back?', ok: 'Yes, I’ve returned it', body: '<p class="muted" style="margin:0">' + esc(Name(b.owner_id)) + ' will confirm once they have it.</p>' });
        if (fd) await act('bc_returning', { loan_id: loanId }, 'Thanks! Waiting for ' + Name(b.owner_id) + ' to confirm.');
        return;
      case 'returned':
        await act('bc_returned', { loan_id: loanId }, 'Back on the shelf.');
        return;
      case 'extend':
        fd = await ask({ title: 'New return date', ok: 'Save', body: dueField(loan.due_on && loan.due_on >= today() ? loan.due_on : null), onOpen: wireDue,
          validate: function (f) { return !f.get('due') ? 'Pick a date.' : f.get('due') < today() ? 'That date has passed.' : ''; } });
        if (fd) await act('bc_extend', { loan_id: loanId, due: fd.get('due') }, 'Return date changed to ' + fmtDay(fd.get('due')) + '.');
        return;
      case 'lend':
        if (Object.keys(S.members).length < 2) { toast('Invite a member first: there’s nobody to lend to yet.', true); return; }
        fd = await ask({ title: 'Lend “' + b.title + '”', ok: 'It’s with them',
          body: '<div class="field"><label for="f-who">Who has it now?</label><select id="f-who" name="who" required>' + memberOptions(b.owner_id) + '</select></div>' + dueField(), onOpen: wireDue,
          validate: function (f) { return !f.get('due') ? 'Pick a return date.' : f.get('due') < today() ? 'That date has passed.' : ''; } });
        if (fd) await act('bc_lend', { book_id: b.id, borrower: fd.get('who'), due: fd.get('due') }, 'Recorded. It’s with ' + Name(fd.get('who')) + ' now.');
        return;
      case 'toggle-lend': {
        var r = await S.client.from('bc_books').update({ lendable: !b.lendable }).eq('id', b.id);
        if (r.error) toast(errMsg(r.error), true); else toast(b.lendable ? 'Paused. Nobody can ask for it for now.' : 'It’s back on offer.');
        await refresh();
        return;
      }
      case 'find-cover': {
        toast('Looking for a cover…');
        var found = await findCover(b.title, b.author, b.isbn);
        if (!found) { toast('No cover found. You can paste an image link under Edit details.', true); return; }
        var r4 = await S.client.from('bc_books').update({ cover: found }).eq('id', b.id);
        if (r4.error) toast(errMsg(r4.error), true); else toast('Cover added.');
        await refresh();
        return;
      }
      case 'edit':
        fd = await ask({ title: 'Edit details', ok: 'Save', body: bookFields(b, false) });
        if (!fd) return;
        var upd = bookPayload(fd);
        if (!upd.cover) upd.cover = await findCover(upd.title, upd.author, upd.isbn);
        var r2 = await S.client.from('bc_books').update(upd).eq('id', b.id);
        if (r2.error) toast(errMsg(r2.error), true); else toast('Saved.');
        await refresh();
        return;
      case 'remove':
        fd = await ask({ title: 'Remove this book?', ok: 'Remove it', danger: true,
          body: '<p class="muted" style="margin:0">“' + esc(b.title) + '” and its borrowing history will be deleted from the club. This can’t be undone.</p>' });
        if (!fd) return;
        var r3 = await S.client.from('bc_books').delete().eq('id', b.id).select('id');
        if (r3.error || !r3.data || !r3.data.length) { toast(r3.error ? errMsg(r3.error) : 'It couldn’t be removed. Is it out with someone?', true); await refresh(); return; }
        toast('Removed.');
        await refresh();
        location.hash = '#/';
        return;
    }
  }

  function bookFields(b, withOwner) {
    b = b || {};
    return '<div class="field"><label for="f-title">Title</label><input id="f-title" name="title" required maxlength="200" value="' + esc(b.title) + '"></div>' +
      '<div class="field"><label for="f-author">Author</label><input id="f-author" name="author" maxlength="200" value="' + esc(b.author) + '"></div>' +
      '<div class="field"><span class="label">Genres <span class="muted small" style="font-weight:400">pick up to 3</span></span><div class="genre-pick">' +
      GENRES.map(function (g) {
        return '<label><input type="checkbox" name="genre" value="' + g[0] + '"' + ((b.genres || []).indexOf(g[0]) >= 0 ? ' checked' : '') + '><span>' + esc(g[1]) + '</span></label>';
      }).join('') + '</div></div>' +
      '<input type="hidden" name="ol_work" value="' + esc(b.ol_work || '') + '">' +
      '<div class="row"><div class="field"><label for="f-year">Year</label><input id="f-year" name="year" inputmode="numeric" pattern="[0-9]{1,4}" value="' + esc(b.year || '') + '"></div>' +
      '<div class="field"><label for="f-pages">Pages</label><input id="f-pages" name="pages" inputmode="numeric" pattern="[0-9]{1,5}" value="' + esc(b.pages || '') + '"></div></div>' +
      '<div class="field"><label for="f-note">Note for borrowers</label><textarea id="f-note" name="note" maxlength="500" placeholder="Condition, edition, signed copy, “please don’t fold the pages”…">' + esc(b.note || '') + '</textarea></div>' +
      (withOwner && S.me.is_admin ? '<div class="field"><label for="f-owner">Whose book is it?</label><select id="f-owner" name="owner">' + memberOptions(null, S.me.id) + '</select><span class="help">As an admin you can add books for other members.</span></div>' : '') +
      '<details><summary class="small muted">Cover picture and ISBN</summary><div class="form" style="margin-top:10px">' +
      '<div class="field"><label for="f-cover">Cover image link</label><input id="f-cover" name="cover" type="url" placeholder="https://…" value="' + esc(b.cover && /^https:/.test(b.cover) ? b.cover : '') + '">' +
      (b.cover && !/^https:/.test(b.cover) ? '<input type="hidden" name="cover_keep" value="' + esc(b.cover) + '"><span class="help">Leave empty to keep the current cover.</span>' : '') + '</div>' +
      '<div class="field"><label for="f-isbn">ISBN</label><input id="f-isbn" name="isbn" inputmode="numeric" maxlength="17" value="' + esc(b.isbn || '') + '"></div></div></details>';
  }

  function bookPayload(fd) {
    function num(v) { v = String(v || '').replace(/\D/g, ''); return v ? Number(v) : null; }
    var cover = String(fd.get('cover') || '').trim();
    if (cover && !/^https:\/\/[^\s"'<>]+$/.test(cover)) cover = '';
    var isbn = String(fd.get('isbn') || '').replace(/[^0-9Xx]/g, '');
    return {
      title: String(fd.get('title') || '').trim().slice(0, 200),
      author: String(fd.get('author') || '').trim().slice(0, 200),
      year: num(fd.get('year')),
      pages: num(fd.get('pages')),
      note: String(fd.get('note') || '').trim().slice(0, 500) || null,
      cover: cover || fd.get('cover_keep') || null,
      isbn: isbn.length === 10 || isbn.length === 13 ? isbn : null,
      genres: fd.getAll('genre').filter(function (k) { return GENRE_LABEL[k]; }).slice(0, 5),
      ol_work: /^\/works\/OL\d+W$/.test(String(fd.get('ol_work') || '')) ? String(fd.get('ol_work')) : null
    };
  }

  /* ---------------------------------------------------------------- add a book */

  var addState = { found: null, results: [], busy: false, msg: '' };

  function addView() {
    var f = addState.found;
    if (f) {
      var dup = S.books.filter(function (b) { return norm(b.title) === norm(f.title); });
      return '<a class="back" href="#/add" data-act="add-reset">' + ICONS.back + 'Find a different book</a>' +
        '<div class="page-head"><h1>Add to the shelf</h1></div>' +
        '<form class="form" id="add-form">' +
        '<div class="preview">' + coverHTML(f) + '<div><h2 style="font-size:22px">' + esc(f.title || 'New book') + '</h2><p class="muted" style="margin:4px 0 0">' + esc(f.author || '') + '</p>' +
        (dup.length ? '<p class="small" style="margin-top:8px;color:var(--out)">The club already has ' + (dup.length === 1 ? 'a copy' : dup.length + ' copies') + ' (' + dup.map(function (b) { return esc(Name(b.owner_id)) + '’s'; }).join(', ') + '). A second copy is still welcome.</p>' : '') +
        '</div></div>' + bookFields(f, true) +
        '<label class="check"><input type="checkbox" name="lendable" checked> Members can borrow it</label>' +
        '<p class="small muted" style="margin:0">It stays with you until someone borrows it. Nobody sees your address: handovers happen on Sundays or however you two arrange.</p>' +
        '<p class="err" id="add-err" hidden></p>' +
        '<div class="actions"><button class="btn primary" type="submit">Add to the shelf</button><a class="btn ghost" href="#/add" data-act="add-reset">Cancel</a></div></form>';
    }
    var canScan = 'BarcodeDetector' in window && navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
    return '<div class="page-head"><div><h1>Add a book</h1><p class="lede">Find it once and the cover, author and pages fill themselves in.</p></div></div>' +
      (canScan ? '<div class="panel" style="max-width:560px"><button class="btn primary" data-act="scan" type="button">' + ICONS.scan + 'Scan the barcode</button>' +
        '<p class="small muted" style="margin:10px 0 0">Point your camera at the barcode on the back cover.</p><div id="scan-box"></div></div><div class="or">or</div>' : '') +
      '<form class="form" id="find-form"><div class="field"><label for="find-q">Title, author or ISBN</label>' +
      '<div style="display:flex;gap:8px"><input id="find-q" name="q" required placeholder="e.g. The Alchemist" autocomplete="off" style="flex:1"><button class="btn primary" type="submit">Find</button></div></div></form>' +
      '<div id="find-out" style="max-width:560px">' + findResultsHTML() + '</div>' +
      '<p class="small" style="margin-top:22px"><a href="#/add" data-act="manual">Can’t find it? Type it in yourself</a></p>';
  }

  function findResultsHTML() {
    if (addState.busy) return '<p class="muted">Looking…</p>';
    var out = addState.msg ? '<p class="muted">' + esc(addState.msg) + '</p>' : '';
    if (!addState.results.length) return out;
    return out + '<div class="results">' + addState.results.map(function (r, i) {
      return '<button type="button" class="result" data-pick="' + i + '">' +
        (r.cover ? '<img src="' + esc(r.cover) + '" alt="" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement(\'span\'),{className:\'ph\'}))">' : '<span class="ph"></span>') +
        '<span><b>' + esc(r.title) + '</b><span>' + esc([r.author, r.year].filter(Boolean).join(' · ')) + '</span></span><span class="btn small">Pick</span></button>';
    }).join('') + '</div>';
  }

  function cleanIsbn(s) { var x = String(s || '').replace(/[^0-9Xx]/g, ''); return (x.length === 10 || x.length === 13) ? x.toUpperCase() : ''; }

  async function fetchJSON(url) {
    var ctl = new AbortController(); var t = setTimeout(function () { ctl.abort(); }, 10000);
    try { var r = await fetch(url, { signal: ctl.signal }); if (!r.ok) throw new Error('HTTP ' + r.status); return await r.json(); }
    finally { clearTimeout(t); }
  }

  async function googleBooks(q) {
    var d = await fetchJSON('https://www.googleapis.com/books/v1/volumes?maxResults=12&printType=books&q=' + encodeURIComponent(q));
    return (d.items || []).map(function (it) {
      var v = it.volumeInfo || {};
      var ids = v.industryIdentifiers || [];
      var isbn = (ids.find(function (x) { return x.type === 'ISBN_13'; }) || ids.find(function (x) { return x.type === 'ISBN_10'; }) || {}).identifier;
      var img = v.imageLinks && (v.imageLinks.thumbnail || v.imageLinks.smallThumbnail);
      if (img) img = img.replace(/^http:/, 'https:').replace('&edge=curl', '');
      return {
        title: (v.title || '') + (v.subtitle && v.title && v.title.length < 30 ? ': ' + v.subtitle : ''),
        author: (v.authors || []).join(', '),
        year: v.publishedDate ? Number(String(v.publishedDate).slice(0, 4)) || null : null,
        pages: v.pageCount || null,
        isbn: cleanIsbn(isbn) || null,
        cover: img && /^https:\/\//.test(img) ? img : (isbn ? 'https://covers.openlibrary.org/b/isbn/' + cleanIsbn(isbn) + '-M.jpg?default=false' : null),
        genres: guessGenres(v.categories)
      };
    }).filter(function (r) { return r.title; });
  }

  async function openLibrary(q, isbn) {
    var url = 'https://openlibrary.org/search.json?limit=12&fields=key,title,author_name,first_publish_year,number_of_pages_median,cover_i,isbn,subject&' +
      (isbn ? 'isbn=' + encodeURIComponent(isbn) : 'q=' + encodeURIComponent(q));
    var d = await fetchJSON(url);
    return (d.docs || []).map(function (x) {
      var i = isbn || cleanIsbn((x.isbn || []).find(function (n) { return n.length === 13; }) || (x.isbn || [])[0]);
      return {
        title: x.title || '', author: (x.author_name || []).slice(0, 2).join(', '),
        year: x.first_publish_year || null, pages: x.number_of_pages_median || null, isbn: i || null,
        cover: x.cover_i ? 'https://covers.openlibrary.org/b/id/' + x.cover_i + '-M.jpg' : null,
        ol_work: /^\/works\/OL\d+W$/.test(x.key || '') ? x.key : null,
        genres: guessGenres(x.subject)
      };
    }).filter(function (r) { return r.title; });
  }

  async function find(q) {
    var isbn = cleanIsbn(q);
    addState.busy = true; addState.msg = ''; addState.results = []; paintFind();
    var results = [];
    // Open Library first (free, no quota); Google Books as the backup.
    try { results = await openLibrary(q, isbn); } catch (e) { /* try the other source */ }
    if (!results.length) { try { results = await googleBooks(isbn ? 'isbn:' + isbn : q); } catch (e) { /* nothing more to try */ } }
    addState.busy = false;
    if (isbn && results.length) { results[0].isbn = results[0].isbn || isbn; pick(results[0]); return; }
    addState.results = results;
    addState.msg = results.length ? 'Pick the one that matches your copy:' : 'Nothing found' + (isbn ? ' for that ISBN' : '') + '. Try fewer words, or type it in yourself.';
    paintFind();
  }
  function paintFind() { var o = document.getElementById('find-out'); if (o) o.innerHTML = findResultsHTML(); }
  function pick(r) { addState.found = Object.assign({ title: '', author: '' }, r); stopScan(); render(); window.scrollTo(0, 0); }

  var scanStream = null, scanTimer = null;
  function stopScan() {
    if (scanTimer) clearInterval(scanTimer); scanTimer = null;
    if (scanStream) scanStream.getTracks().forEach(function (t) { t.stop(); }); scanStream = null;
  }
  async function startScan() {
    var box = document.getElementById('scan-box');
    try {
      var detector = new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a'] });
      scanStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      box.innerHTML = '<div class="scan" style="margin-top:12px"><video playsinline muted></video></div><button class="btn small ghost" data-act="scan-stop" type="button" style="margin-top:8px">Stop scanning</button>';
      var video = box.querySelector('video');
      video.srcObject = scanStream; await video.play();
      scanTimer = setInterval(async function () {
        try {
          var codes = await detector.detect(video);
          var hit = codes.map(function (c) { return c.rawValue; }).find(function (v) { return /^97[89]\d{10}$/.test(v); });
          if (hit) { stopScan(); box.innerHTML = '<p class="muted">Found ' + esc(hit) + '. Looking it up…</p>'; document.getElementById('find-q').value = hit; find(hit); }
        } catch (e) { /* keep trying */ }
      }, 350);
    } catch (e) {
      stopScan();
      box.innerHTML = '<p class="err" style="margin-top:10px">The camera didn’t open' + (e && e.name === 'NotAllowedError' ? ' (permission was refused)' : '') + '. Type the ISBN under the barcode instead.</p>';
    }
  }

  // A real cover for any book saved without one: Open Library first, then Google Books.
  async function findCover(title, author, isbn) {
    var q = String(title || '') + ' ' + String(author || '');
    try {
      var hit = (await openLibrary(isbn ? '' : q, isbn || '')).find(function (r) { return r.cover; });
      if (!hit && isbn) hit = (await openLibrary(q, '')).find(function (r) { return r.cover; });
      if (hit) return hit.cover;
    } catch (e) { /* try the other source */ }
    try {
      var g = await googleBooks(isbn ? 'isbn:' + isbn : 'intitle:' + title + (author ? ' inauthor:' + author : ''));
      var gh = g.find(function (r) { return r.cover && !/openlibrary\.org\/b\/isbn/.test(r.cover); });
      if (gh) return gh.cover;
    } catch (e) { /* none found */ }
    return null;
  }

  async function saveNewBook(form) {
    var fd = new FormData(form);
    var p = bookPayload(fd);
    var err = document.getElementById('add-err');
    if (!p.title) { err.textContent = 'The book needs a title.'; err.hidden = false; return; }
    p.owner_id = (S.me.is_admin && fd.get('owner')) || S.me.id;
    p.lendable = fd.get('lendable') === 'on';
    if (!p.cover && addState.found && addState.found.cover) p.cover = addState.found.cover;
    var btn = form.querySelector('[type=submit]'); btn.disabled = true; btn.textContent = 'Adding…';
    if (!p.cover) { btn.textContent = 'Finding a cover…'; p.cover = await findCover(p.title, p.author, p.isbn); }
    var r = await S.client.from('bc_books').insert(p).select('id').single();
    if (r.error) { err.textContent = errMsg(r.error); err.hidden = false; btn.disabled = false; btn.textContent = 'Add to the shelf'; return; }
    addState = { found: null, results: [], busy: false, msg: '' };
    toast('Added to the shelf.');
    await refresh();
    location.hash = '#/book/' + r.data.id;
  }

  /* ---------------------------------------------------------------- me */

  function loanItem(l, body, buttons, urgent) {
    var b = book(l.book_id); if (!b) return '';
    return '<div class="item' + (urgent ? ' urgent' : '') + '"><a href="#/book/' + b.id + '" aria-hidden="true" tabindex="-1">' + coverHTML(b) + '</a><div>' +
      '<h3><a href="#/book/' + b.id + '">' + esc(b.title) + '</a></h3><p>' + body + '</p>' +
      (buttons ? '<div class="actions">' + buttons + '</div>' : '') + '</div></div>';
  }
  function btn(actName, l, label, kind) { return '<button class="btn small ' + (kind || '') + '" data-act="' + actName + '" data-loan="' + l.id + '" data-book="' + l.book_id + '">' + esc(label) + '</button>'; }

  function meView() {
    var me = S.me.id;
    var mineIds = {}; S.books.forEach(function (b) { if (b.owner_id === me) mineIds[b.id] = true; });
    var todo = needsYou();
    var holding = S.loans.filter(function (l) { return l.borrower_id === me && (l.status === 'out' || l.status === 'returning') && todo.indexOf(l) < 0; });
    var lent = S.loans.filter(function (l) { return mineIds[l.book_id] && (l.status === 'out') ; });
    var asked = S.loans.filter(function (l) { return l.borrower_id === me && l.status === 'requested'; });
    var waiting = S.loans.filter(function (l) { return mineIds[l.book_id] && l.status === 'requested' && todo.indexOf(l) < 0; });

    var h = '<div class="page-head"><div class="who"><span class="avatar" style="background:' + cloth(S.me.name) + '">' + initial(S.me.name) + '</span><div><h1>Hi, ' + esc(S.me.name) + '</h1>' +
      '<p class="lede" style="margin:0">' + Object.keys(mineIds).length + ' of your books on the shelf' + (S.me.is_admin ? ' · admin' : '') + '</p></div></div></div>';

    h += '<section class="section"><h2>Needs you <span class="count">' + (todo.length || '') + '</span></h2>';
    if (!todo.length) h += '<p class="empty">Nothing to do. Go and read something.</p>';
    else h += '<div class="items">' + todo.map(function (l) {
      var b = book(l.book_id), who = Name(l.borrower_id), owner = Name(b.owner_id);
      if (b.owner_id === me && l.status === 'requested') return loanItem(l, '<b>' + esc(who) + '</b> asked to borrow it' + (l.note ? ': “' + esc(l.note) + '”' : '.'), btn('approve', l, 'Say yes', 'primary') + btn('decline', l, 'Say no', 'ghost'), true);
      if (b.owner_id === me && l.status === 'approved') return loanItem(l, 'You said yes to <b>' + esc(who) + '</b>. Tap once you’ve handed it over.', btn('handover', l, 'Handed over', 'primary') + btn('cancel', l, 'Call it off', 'ghost'), true);
      if (b.owner_id === me && l.status === 'returning') return loanItem(l, '<b>' + esc(who) + '</b> says they’ve given it back. Do you have it?', btn('returned', l, 'Got it back', 'primary'), true);
      if (l.status === 'approved') return loanItem(l, '<b>' + esc(owner) + '</b> said yes! Tap once you have it.', btn('handover', l, 'I’ve got it', 'primary') + btn('cancel', l, 'I don’t need it', 'ghost'), true);
      return loanItem(l, 'From ' + esc(owner) + ', <b>' + esc(dueText(l.due_on)) + '</b>. Bring it on Sunday?', btn('returning', l, 'I’ve given it back', 'primary') + waButton('Hi ' + owner + ', could I keep “' + b.title + '” a little longer? ' + clubLink(b), 'Ask for more time'), true);
    }).join('') + '</div>';
    h += '</section><div class="cols"><div>';

    h += '<section class="section"><h2>With you <span class="count">' + (holding.length || '') + '</span></h2>' + (holding.length ? '<div class="items">' + holding.map(function (l) {
      var b = book(l.book_id);
      if (l.status === 'returning') return loanItem(l, 'You’ve returned it. Waiting for ' + esc(Name(b.owner_id)) + ' to confirm.', '');
      return loanItem(l, 'From ' + esc(Name(b.owner_id)) + ' · ' + esc(dueText(l.due_on)), btn('returning', l, 'I’ve given it back'));
    }).join('') + '</div>' : '<p class="empty">You haven’t borrowed anything. <a href="#/">Browse the shelf</a>.</p>') + '</section>';

    h += '<section class="section"><h2>You asked for <span class="count">' + (asked.length || '') + '</span></h2>' + (asked.length ? '<div class="items">' + asked.map(function (l) {
      var b = book(l.book_id), st = state(b);
      var pos = st.queue.findIndex(function (x) { return x.id === l.id; }) + 1;
      return loanItem(l, st.loan ? 'Out right now · you’re number ' + pos + ' in line' : 'Waiting for ' + esc(Name(b.owner_id)) + ' to say yes', btn('cancel', l, 'Cancel', 'ghost'));
    }).join('') + '</div>' : '<p class="empty">No open requests.</p>') + '</section>';

    h += '</div><div>';
    h += '<section class="section"><h2>Lent out <span class="count">' + (lent.length || '') + '</span></h2>' + (lent.length ? '<div class="items">' + lent.map(function (l) {
      var b = book(l.book_id), who = Name(l.borrower_id), late = l.due_on && daysUntil(l.due_on) < 0;
      return loanItem(l, 'With <b>' + esc(who) + '</b> · <span style="' + (late ? 'color:var(--late)' : '') + '">' + esc(dueText(l.due_on)) + '</span>',
        btn('returned', l, 'Got it back') + btn('extend', l, 'Change date', 'ghost') +
        (late ? waButton('Hi ' + who + ', just a reminder about “' + b.title + '” from the book club (due ' + fmtDay(l.due_on) + '). Bring it on Sunday? ' + clubLink(b), 'Remind') : ''));
    }).join('') + '</div>' : '<p class="empty">None of your books are out.</p>') + '</section>';

    if (waiting.length) {
      h += '<section class="section"><h2>In line for your books <span class="count">' + waiting.length + '</span></h2><div class="items">' + waiting.map(function (l) {
        return loanItem(l, '<b>' + esc(Name(l.borrower_id)) + '</b> is waiting for it to come back.', '');
      }).join('') + '</div></section>';
    }

    h += '<section class="section"><h2>Your books <span class="count">' + Object.keys(mineIds).length + '</span></h2>' +
      '<p class="small muted" style="margin:0 0 10px">Everything you’ve put on the club shelf.</p>' +
      '<div class="actions" style="margin:0"><a class="btn small" href="#/" data-act="show-mine">See them on the shelf</a><a class="btn small primary" href="#/add">Add a book</a></div></section>';
    h += '</div></div>';

    h += '<section class="section"><h2>Your account</h2><div class="panel">' +
      '<ul class="list"><li>Name<span class="when"><b>' + esc(S.me.name) + '</b></span></li>' +
      '<li>Signed in as<span class="when">' + esc((S.session && S.session.user && S.session.user.email) || '') + '</span></li></ul>' +
      '<div class="actions"><button class="btn small" data-act="rename">Change my name</button><button class="btn small" data-act="set-password">' + (S.session && S.session.user && S.session.user.user_metadata && S.session.user.user_metadata.bc_password ? 'Change my password' : 'Set a password') + '</button>' +
      (standalone() ? '' : '<button class="btn small" data-act="install">' + ICONS.download + 'Install the app</button>') +
      '<a class="btn small" href="#/members">Members</a><button class="btn small ghost" data-act="signout">Sign out</button></div>' +
      '<p class="small muted" style="margin:10px 0 0">A password lets you sign in inside the installed app on iPhone, where email links open in Safari instead.</p></div></section>';
    return h;
  }

  /* ---------------------------------------------------------------- members */

  var invites = null;

  function membersView() {
    var list = Object.keys(S.members).map(function (id) { return S.members[id]; }).sort(function (a, b) { return a.joined_at < b.joined_at ? -1 : 1; });
    var owned = {}, reading = {};
    S.books.forEach(function (b) { owned[b.owner_id] = (owned[b.owner_id] || 0) + 1; });
    S.loans.forEach(function (l) { if (l.status === 'out' || l.status === 'returning') reading[l.borrower_id] = (reading[l.borrower_id] || 0) + 1; });
    var h = '<div class="page-head"><div><h1>Members</h1><p class="lede">' + list.length + ' reader' + (list.length === 1 ? '' : 's') + ' sharing ' + S.books.length + ' books.</p></div></div>' +
      '<ul class="list people panel" style="padding:6px 18px">' + list.map(function (m) {
        return '<li><span class="avatar" style="background:' + cloth(m.name) + '">' + initial(m.name) + '</span><div><b>' + esc(m.name) + (m.id === S.me.id ? ' (you)' : '') + '</b>' + (m.is_admin ? ' <span class="badge wait" style="margin-left:4px">admin</span>' : '') +
          '<div class="small muted">' + (owned[m.id] || 0) + ' book' + (owned[m.id] === 1 ? '' : 's') + ' shared' + (reading[m.id] ? ' · reading ' + reading[m.id] + ' from the club' : '') + ' · joined ' + fmtWhen(m.joined_at) + '</div></div>' +
          (S.me.is_admin && m.id !== S.me.id ? '<button class="btn small ghost danger" style="margin-left:auto" data-act="remove-member" data-id="' + esc(m.id) + '">Remove</button>' : '') + '</li>';
      }).join('') + '</ul>';

    if (S.me.is_admin) {
      h += '<section class="section"><h2>Invite someone</h2><div class="panel"><form class="form" id="invite-form">' +
        '<div class="row"><div class="field"><label for="i-name">Their name</label><input id="i-name" name="name" required maxlength="60" autocomplete="off"></div>' +
        '<div class="field"><label for="i-email">Their email</label><input id="i-email" name="email" type="email" required autocomplete="off"></div></div>' +
        '<label class="check"><input type="checkbox" name="admin"> Make them an admin too (they can invite people and fix any book)</label>' +
        '<p class="err" id="invite-err" hidden></p>' +
        '<div class="actions" style="margin:0"><button class="btn primary" type="submit">Add to the invite list</button></div>' +
        '<p class="small muted" style="margin:0">Then send them the link. They sign in with that email and they’re in. No password needed.</p></form></div>';
      if (invites === null) h += '<p class="muted small">Loading invitations…</p>';
      else if (invites.length) {
        h += '<h2 style="font-size:18px;margin-top:20px">Invited, not signed in yet</h2><ul class="list panel" style="padding:6px 18px">' + invites.map(function (i) {
          return '<li><div><b>' + esc(i.name) + '</b> <span class="small muted">' + esc(i.email) + '</span></div><span class="when" style="display:flex;gap:6px">' +
            waButton('Hi ' + i.name + '! You’re invited to the Ambernath Book Club app. Open ' + location.origin + '/bookclub/ in Chrome or Safari and sign in with ' + i.email + ' (you’ll get a sign-in link by email). Then tap “Install the app” to put it on your home screen.', 'Send link') +
            '<button class="btn small ghost danger" data-act="uninvite" data-email="' + esc(i.email) + '">Remove</button></span></li>';
        }).join('') + '</ul>';
      }
      h += '</section>';
    }
    return h;
  }

  async function loadInvites() {
    var r = await S.client.from('bc_invites').select('email,name,is_admin,created_at').order('created_at');
    invites = r.error ? [] : r.data;
    if (route().name === 'members') render();
  }

  /* ---------------------------------------------------------------- visitors & sign in */

  function visitorView() {
    var pub = S.pub || [];
    var inCount = pub.filter(function (b) { return b.available; }).length;
    var h = '<section class="hero"><h1>Ambernath Book Club</h1>' +
      '<p>Friends in Ambernath sharing their books. We meet every Sunday. Members can see who has each book, borrow it, and add their own to the shelf.</p>' +
      '<div class="actions" style="margin:0">' + (S.session && S.joined && !S.me ? '' : '<a class="btn primary" href="#/signin">' + ICONS.signin + 'Members sign in</a>') +
      (standalone() ? '' : '<button class="btn" data-act="install">' + ICONS.download + 'Install the app</button>') + '</div></section>';
    if (S.session && S.joined && !S.me) {
      h += '<div class="panel" style="margin-bottom:24px"><h2 style="font-size:20px">You’re not on the member list yet</h2>' +
        '<p class="muted">You’re signed in as <b>' + esc(S.session.user.email) + '</b>, but this email hasn’t been invited. Ask Vikas to add it, then come back.</p>' +
        '<div class="actions"><button class="btn" data-act="recheck">I’ve been added, check again</button><button class="btn ghost" data-act="signout">Sign out</button></div></div>';
    }
    h += '<div class="page-head"><div><h2 style="font-size:26px">On the shelf</h2><p class="lede">' + pub.length + ' books · ' + inCount + ' available right now</p></div></div>';
    if (!S.pub) h += '<p class="loading">Opening the shelf…</p>';
    else if (!pub.length) h += '<p class="empty">The shelf is being set up.</p>';
    else h += '<div class="grid">' + pub.map(function (b) {
      return '<div class="card">' + coverHTML(b, b.available ? badgeHTML('in', 'Available') : badgeHTML('out', 'Out')) +
        '<div class="meta"><div class="t">' + esc(b.title) + '</div><div class="a">' + esc(b.author) + '</div></div></div>';
    }).join('') + '</div>';
    return h;
  }

  function signinView() {
    var s = S.signin;
    if (S.session && S.joined && !S.me) { location.replace('#/'); return ''; }
    if (s.step === 'code') {
      return '<div class="signin panel"><h1>Check your email</h1><p class="muted">We sent a sign-in link to <b>' + esc(s.email) + '</b>. Open the email on this phone or computer and tap the link: it brings you straight back here, signed in.</p>' +
        '<details style="margin-bottom:14px"><summary class="small muted">The email has a code instead?</summary>' +
        '<form class="form" id="code-form" style="margin-top:10px"><div class="field"><label for="code">Code</label><input id="code" name="code" class="code-input" inputmode="numeric" autocomplete="one-time-code" required pattern="[0-9]{6,10}" maxlength="10"></div>' +
        '<p class="err" id="signin-err" hidden></p><button class="btn primary" type="submit">Sign in</button></form></details>' +
        '<div class="actions"><button class="btn small ghost" data-act="signin-back">Use a different email</button><button class="btn small ghost" data-act="resend">Send a new link</button></div>' +
        '<p class="small muted">Nothing arrived? Check spam, and give it a minute.</p></div>';
    }
    return '<div class="signin panel"><h1>Members sign in</h1><p class="muted">Use the email you gave the club. We’ll email you a sign-in link: no password to remember.</p>' +
      '<form class="form" id="email-form"><div class="field"><label for="email">Email</label><input id="email" name="email" type="email" autocomplete="email" required value="' + esc(s.email) + '"></div>' +
      '<p class="err" id="signin-err" hidden></p><button class="btn primary" type="submit">Email me a link</button></form>' +
      '<details style="margin-top:16px"' + (standalone() && isIOS() ? ' open' : '') + '><summary class="small muted">Sign in with a password instead</summary>' +
      '<form class="form" id="pw-form" style="margin-top:10px"><div class="field"><label for="pw-email">Email</label><input id="pw-email" name="email" type="email" autocomplete="username" required value="' + esc(s.email) + '"></div>' +
      '<div class="field"><label for="pw">Password</label><input id="pw" name="password" type="password" autocomplete="current-password" required minlength="8"></div>' +
      '<p class="err" id="pw-err" hidden></p><button class="btn primary" type="submit">Sign in</button>' +
      '<p class="small muted" style="margin:0">No password yet? Sign in once with the email link, then set one under <b>Me</b>.</p></form></details>' +
      '<p class="small muted" style="margin-top:14px">Not a member yet? Come along on a Sunday and ask Vikas to add you.</p></div>';
  }

  async function sendCode(email) {
    var err = document.getElementById('signin-err');
    var r = await S.client.auth.signInWithOtp({ email: email, options: { shouldCreateUser: true, emailRedirectTo: location.origin + '/bookclub/' } });
    if (r.error) {
      var m = r.error.message || '';
      if (/signups? not allowed|not allowed for otp/i.test(m)) m = 'This email isn’t set up yet. Ask Vikas to add you.';
      else if (/rate limit|security purposes|too many/i.test(m)) m = 'Too many emails just now. Wait a minute and try again.';
      else m = errMsg(r.error);
      if (err) { err.textContent = m; err.hidden = false; } else toast(m, true);
      return false;
    }
    S.signin = { step: 'code', email: email };
    return true;
  }

  /* ---------------------------------------------------------------- events */

  function wire(r) {
    if (S.me && r.name === 'shelf') wireShelf();
    if (S.me && r.name === 'book' && book(r.id)) paintAbout(book(r.id));
    if (S.me && r.name === 'members' && S.me.is_admin && invites === null) loadInvites();
    if (r.name !== 'add') stopScan();

    var findForm = document.getElementById('find-form');
    if (findForm) findForm.addEventListener('submit', function (e) { e.preventDefault(); var q = findForm.q.value.trim(); if (q) find(q); });
    var addForm = document.getElementById('add-form');
    if (addForm) addForm.addEventListener('submit', function (e) { e.preventDefault(); saveNewBook(addForm); });

    var inviteForm = document.getElementById('invite-form');
    if (inviteForm) inviteForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      var fd = new FormData(inviteForm), err = document.getElementById('invite-err');
      var email = String(fd.get('email') || '').trim().toLowerCase();
      var r2 = await S.client.from('bc_invites').insert({ email: email, name: String(fd.get('name') || '').trim(), is_admin: fd.get('admin') === 'on', invited_by: S.me.id });
      if (r2.error) { err.textContent = /duplicate/i.test(r2.error.message) ? 'That email is already on the invite list.' : errMsg(r2.error); err.hidden = false; return; }
      toast('Invited. Now send them the link.');
      await loadInvites();
    });

    var emailForm = document.getElementById('email-form');
    if (emailForm) emailForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      var b = emailForm.querySelector('button'); b.disabled = true; b.textContent = 'Sending…';
      var email = emailForm.email.value.trim().toLowerCase();
      S.signin.email = email;
      if (await sendCode(email)) render(); else { b.disabled = false; b.textContent = 'Email me a link'; }
    });
    var pwForm = document.getElementById('pw-form');
    if (pwForm) pwForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      var b = pwForm.querySelector('button'); b.disabled = true; b.textContent = 'Signing in…';
      var res = await S.client.auth.signInWithPassword({ email: pwForm.email.value.trim().toLowerCase(), password: pwForm.password.value });
      if (res.error) {
        var err = document.getElementById('pw-err');
        err.textContent = /invalid login/i.test(res.error.message) ? 'That email and password don’t match. No password yet? Use the email link once, then set one under Me.' : errMsg(res.error);
        err.hidden = false; b.disabled = false; b.textContent = 'Sign in';
      }
    });
    var codeForm = document.getElementById('code-form');
    if (codeForm) codeForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      var b = codeForm.querySelector('button'); b.disabled = true; b.textContent = 'Checking…';
      var token = codeForm.code.value.replace(/\D/g, '');
      var res = await S.client.auth.verifyOtp({ email: S.signin.email, token: token, type: 'email' });
      if (res.error) {
        var err = document.getElementById('signin-err');
        err.textContent = /expired|invalid/i.test(res.error.message) ? 'That code didn’t work or has expired. Check it, or send a new one.' : errMsg(res.error);
        err.hidden = false; b.disabled = false; b.textContent = 'Sign in';
      }
      // On success, onAuthStateChange takes over.
    });
  }

  view.addEventListener('click', async function (e) {
    var el = e.target.closest('[data-act], [data-pick]');
    if (!el) return;
    if (el.hasAttribute('data-pick')) { pick(addState.results[Number(el.dataset.pick)]); return; }
    var a = el.dataset.act;
    if (el.tagName === 'A' && a !== 'show-mine' && a !== 'add-reset' && a !== 'manual' && a !== 'genre') return;
    e.preventDefault();
    var r = route();

    switch (a) {
      case 'add-reset': addState = { found: null, results: [], busy: false, msg: '' }; render(); return;
      case 'manual': pick({ title: '', author: '' }); return;
      case 'scan': el.disabled = true; await startScan(); el.disabled = false; return;
      case 'scan-stop': stopScan(); document.getElementById('scan-box').innerHTML = ''; return;
      case 'show-mine': S.filter = 'mine'; remember(); location.hash = '#/'; return;
      case 'signout':
        await S.client.auth.signOut();
        return;
      case 'recheck': S.joined = false; await refresh(); if (!S.me) toast('Still not on the list. Ask Vikas to add ' + S.session.user.email + '.', true); return;
      case 'signin-back': S.signin = { step: 'email', email: S.signin.email }; render(); return;
      case 'resend': el.disabled = true; if (await sendCode(S.signin.email)) toast('New link sent.'); el.disabled = false; return;
      case 'install': install(); return;
      case 'genre': S.genre = el.dataset.genre; S.filter = 'all'; S.q = ''; remember(); location.hash = '#/'; return;
      case 'more': { var dsc = view.querySelector('.desc'); if (dsc) dsc.classList.remove('clamp'); el.remove(); return; }
      case 'set-password': {
        var pf = await ask({ title: 'Set a password', ok: 'Save password',
          body: '<p class="muted" style="margin:0">For signing in inside the installed app. Email links still work too.</p>' +
            '<div class="field"><label for="np">New password</label><input id="np" name="np" type="password" autocomplete="new-password" required minlength="8"></div>' +
            '<div class="field"><label for="np2">Type it again</label><input id="np2" name="np2" type="password" autocomplete="new-password" required minlength="8"></div>',
          validate: function (f) { return String(f.get('np')).length < 8 ? 'Use at least 8 characters.' : f.get('np') !== f.get('np2') ? 'The two don’t match.' : ''; } });
        if (!pf) return;
        var up = await S.client.auth.updateUser({ password: String(pf.get('np')), data: { bc_password: true } });
        if (up.error) toast(/reauthenticat|recent/i.test(up.error.message) ? 'For safety, sign out, sign back in with the email link, then try again.' : errMsg(up.error), true);
        else { if (up.data && up.data.user) S.session.user = up.data.user; toast('Password saved.'); render(); }
        return;
      }
      case 'rename': {
        var fd = await ask({ title: 'Your name', ok: 'Save', body: '<div class="field"><label for="f-name">How members see you</label><input id="f-name" name="name" required maxlength="60" value="' + esc(S.me.name) + '"></div>' });
        if (!fd) return;
        var r1 = await S.client.from('bc_members').update({ name: String(fd.get('name')).trim() }).eq('id', S.me.id);
        if (r1.error) toast(errMsg(r1.error), true); else toast('Saved.');
        await refresh(); return;
      }
      case 'uninvite': {
        var r2 = await S.client.from('bc_invites').delete().eq('email', el.dataset.email);
        if (r2.error) toast(errMsg(r2.error), true);
        await loadInvites(); return;
      }
      case 'remove-member': {
        var m = S.members[el.dataset.id];
        var ok = await ask({ title: 'Remove ' + m.name + '?', ok: 'Remove', danger: true,
          body: '<p class="muted" style="margin:0">They won’t see the club any more. Their requests and borrowing history go too. If they still own books on the shelf, remove those first.</p>' });
        if (!ok) return;
        var r3 = await S.client.from('bc_members').delete().eq('id', m.id).select('id');
        if (r3.error) toast(errMsg(r3.error), true); else if (!r3.data.length) toast('They couldn’t be removed.', true); else toast(m.name + ' removed.');
        await refresh(); return;
      }
    }

    // Lending steps: from a book page, or from the Me page (data-book).
    var b = r.name === 'book' ? book(r.id) : book(Number(el.dataset.book));
    if (b) await bookAction(b, a, el.dataset.loan ? Number(el.dataset.loan) : null);
  });

  // Catch up when the app comes back to the front (someone may have lent you something).
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible' && S.client && Date.now() - S.lastLoad > 20000 && !dialogEl.open) refresh();
  });

  /* ---------------------------------------------------------------- start */

  async function start() {
    if (!cfg.supabaseUrl || !cfg.supabaseKey || !window.supabase) {
      view.innerHTML = '<p class="empty">The book club isn’t connected to its database yet' + (!window.supabase ? ' (or the connection library didn’t load: check your internet)' : '') + '.</p>';
      return;
    }
    if (/^sb_secret_|service_role/.test(cfg.supabaseKey)) { view.innerHTML = '<p class="empty">Refusing to run with a secret key in the config.</p>'; return; }
    S.client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey, {
      auth: { storageKey: 'bookclub-auth', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });

    var linkError = /error_description=([^&]+)/.exec(location.hash);
    if (linkError) toast(decodeURIComponent(linkError[1].replace(/\+/g, ' ')).replace(/Email link is invalid or has expired/i, 'That sign-in link has expired. Ask for a new code.'), true);

    var got = await S.client.auth.getSession();
    S.session = got.data.session;
    if (/access_token|error_description/.test(location.hash)) history.replaceState(null, '', location.pathname + '#/');
    await refresh();

    S.client.auth.onAuthStateChange(function (event, session) {
      var before = S.session && S.session.user.id;
      S.session = session;
      var after = session && session.user.id;
      if (before === after) return;            // token refresh, nothing new
      // Leave the auth callback before talking to the database again.
      setTimeout(async function () {
        S.me = null; S.joined = false; S.books = []; S.loans = []; S.members = {}; invites = null;
        S.signin = { step: 'email', email: '' };
        if (session) toast('Signed in.');
        if (route().name === 'signin' || !session) history.replaceState(null, '', location.pathname + '#/');
        await refresh();
      }, 0);
    });
  }

  /* ---------------------------------------------------------------- install */

  var installEvt = null;
  function standalone() { return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; }
  function isIOS() { return /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); }
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); installEvt = e; });
  window.addEventListener('appinstalled', function () { installEvt = null; toast('Installed. Look for the Book Club icon on your home screen.'); render(); });

  async function install() {
    if (standalone()) { toast('You’re already in the installed app.'); return; }
    var title = 'Install the Book Club app';
    if (installEvt) {
      var ok = await ask({ title: title, ok: 'Install', cancel: 'Not now',
        body: '<p class="muted" style="margin:0">It gets its own icon on your home screen and opens straight to the shelf, like any other app.</p>' });
      if (!ok || !installEvt) return;
      var ev = installEvt; installEvt = null;
      try { await ev.prompt(); await ev.userChoice; } catch (e) { /* the browser said no */ }
      return;
    }
    var how;
    if (isIOS()) how = '<ol class="steps"><li>Open this page in <b>Safari</b>.</li><li>Tap <b>Share</b> (the square with an arrow).</li><li>Tap <b>Add to Home Screen</b>, then <b>Add</b>.</li></ol>' +
      '<p class="small muted" style="margin:0">On iPhone the installed app signs in separately. Set a password under <b>Me</b> first, then sign in with it inside the app.</p>';
    else if (/Android/.test(navigator.userAgent)) how = '<ol class="steps"><li>Open this page in <b>Chrome</b> (from WhatsApp, tap <b>⋮</b> then <b>Open in Chrome</b>).</li><li>Tap the <b>⋮</b> menu at the top right.</li><li>Tap <b>Install app</b> or <b>Add to Home screen</b>.</li></ol>';
    else how = '<ol class="steps"><li>In Chrome or Edge, click the <b>install</b> icon at the right end of the address bar,</li><li>or open the browser menu and choose <b>Install Ambernath Book Club</b>.</li></ol>' +
      '<p class="small muted" style="margin:0">On a phone, open vikasinpencil.com/bookclub/ and add it to the home screen.</p>';
    await ask({ title: title, ok: 'Got it', cancel: 'Close', body: how });
  }

  var installBtn = document.getElementById('install-btn');
  if (installBtn) { installBtn.hidden = standalone(); installBtn.addEventListener('click', install); }
  if (/[?&]install\b/.test(location.search)) {
    history.replaceState(null, '', location.pathname + location.hash);
    setTimeout(install, 1500); // give the browser a moment to offer its install prompt
  }

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('/bookclub/sw.js', { scope: '/bookclub/' }).catch(function () { /* works without it */ });
  }

  start();
})();
