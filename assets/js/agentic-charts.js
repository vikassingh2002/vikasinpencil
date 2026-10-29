/* Agentic AI: charts, maps and small calculators drawn in code.
   Every figure comes from the article's sources; illustrative arithmetic is labelled as such.
   An article places one with a body item such as {"chart": "astra-rates"}.
   Bars, timelines and tables are HTML so text stays crisp; line, column and map charts are SVG,
   redrawn at the width they are shown at. Tap or hover a mark for its value. */
window.AgenticCharts = (function () {
  'use strict';

  var C = { blue: '#006ba2', sky: '#3ebcd2', red: '#e3120b', grey: '#758d99', mist: '#b7c6cf', green: '#379a8b', gold: '#ebb434', ink: '#0d0d0d', grid: '#d7dee2' };
  var LIGHT = [C.sky, C.mist, C.gold, C.grid];
  var ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ESC[c]; }); }
  function num(v, dp) {
    if (dp == null) dp = (v % 1 && Math.abs(v) < 100) ? 1 : 0;
    var p = Math.abs(v).toFixed(dp).split('.');
    p[0] = p[0].replace(/\B(?=(\d{3})+$)/g, ',');
    return (v < 0 ? '−' : '') + p.join('.');
  }
  function f1(v) { return Math.round(v * 10) / 10; }
  function tip(text) { return ' tabindex="0" data-tip="' + esc(text) + '"'; }

  /* ---------- HTML chart types ---------- */

  // Horizontal bars. rows: [label, value or [low, high], colour, text, tip]. Optional min/max, log scale, prefix, suffix.
  function hbar(o) {
    var vals = [];
    o.rows.forEach(function (r) { vals = vals.concat(r[1]); });
    var max = o.max != null ? o.max : Math.max.apply(null, vals.concat(0));
    var min = o.min != null ? o.min : Math.min.apply(null, vals.concat(0));
    var diverge = min < 0, L = diverge ? 17 : 0, R = diverge ? 17 : (o.room || 24);
    var x = o.log ? function (v) {
      var lo = Math.log10(o.logMin || 1), hi = Math.log10(max);
      return L + Math.max(0, Math.log10(Math.max(v, o.logMin || 1)) - lo) / (hi - lo) * (100 - L - R);
    } : function (v) { return L + (v - min) / ((max - min) || 1) * (100 - L - R); };
    var zero = o.log ? L : x(0);
    return '<div class="hbar' + (diverge ? ' hbar--diverge' : '') + '">' + o.rows.map(function (r) {
      var v = r[1], range = Array.isArray(v), a = range ? x(v[0]) : Math.min(zero, x(v)), b = range ? x(v[1]) : Math.max(zero, x(v));
      var neg = !range && v < 0, end = neg ? a : b, colour = r[2] || C.blue;
      var txt = r[3] != null ? r[3] : range ? num(v[0]) + '–' + num(v[1]) + (o.suffix || '') : (o.prefix || '') + num(v, o.dp) + (o.suffix || '');
      var inside = !neg && b - a > 30 && (end > 68 || end + txt.length * 3.6 > 96); // labels that would reach the right edge sit inside the bar, so nothing spills off a phone screen
      var pos = neg || inside ? 'right:' + (100 - end).toFixed(2) + '%' : 'left:' + end.toFixed(2) + '%';
      return '<div class="hbar__row"' + tip(r[4] || (r[0] + ': ' + txt)) + '><span class="hbar__label">' + esc(r[0]) + '</span>' +
        '<span class="hbar__track"' + (diverge ? ' style="--zero:' + zero.toFixed(2) + '%"' : '') + '>' +
        '<span class="hbar__bar" style="left:' + a.toFixed(2) + '%;width:' + Math.max(b - a, 0.6).toFixed(2) + '%;background:' + colour + '"></span>' +
        '<span class="hbar__val' + (neg ? ' is-neg' : '') + (inside ? ' is-in' + (LIGHT.indexOf(colour) >= 0 ? ' is-dark' : '') : '') + '" style="' + pos + '">' + esc(txt) + '</span></span></div>';
    }).join('') + '</div>';
  }

  // One or more 100% bars. rows: [label, [[part, value, colour, text], ...]]
  function stack(o) {
    return '<div class="stack">' + o.rows.map(function (r) {
      var total = r[1].reduce(function (s, p) { return s + p[1]; }, 0);
      return '<div class="stack__row">' + (r[0] ? '<span class="stack__label">' + esc(r[0]) + '</span>' : '') + '<span class="stack__bar">' + r[1].map(function (p) {
        var pc = p[1] / total * 100, t = p[3] || num(p[1]);
        return '<span class="stack__seg' + (LIGHT.indexOf(p[2]) >= 0 ? ' is-light' : '') + '" style="width:' + pc.toFixed(2) + '%;background:' + p[2] + '"' + tip(p[0] + ': ' + t) + '>' + (pc >= 11 ? '<b>' + esc(t) + '</b>' : '') + '</span>';
      }).join('') + '</span></div>';
    }).join('') + '</div>';
  }

  // Two values per row on a shared scale. rows: [label, a, b]
  function dumbbell(o) {
    var max = o.max || 100, sfx = o.suffix || '';
    var ticks = (o.ticks || [0, 25, 50, 75, 100]).map(function (t) { return '<span style="left:' + (t / max * 100) + '%">' + num(t) + '</span>'; }).join('');
    return '<div class="dumb">' + o.rows.map(function (r) {
      var a = r[1] / max * 100, b = r[2] / max * 100, d = r[2] - r[1];
      return '<div class="dumb__row"><span class="dumb__label">' + esc(r[0]) + '</span><span class="dumb__track">' +
        '<span class="dumb__line" style="left:' + Math.min(a, b) + '%;width:' + Math.abs(b - a) + '%"></span>' +
        '<span class="dumb__dot dumb__a" style="left:' + a + '%"' + tip(r[0] + ' — ' + o.names[0] + ': ' + num(r[1]) + sfx) + '></span>' +
        '<span class="dumb__dot dumb__b" style="left:' + b + '%"' + tip(r[0] + ' — ' + o.names[1] + ': ' + num(r[2]) + sfx) + '></span>' +
        '</span><span class="dumb__gap">' + (d > 0 ? '+' : d < 0 ? '−' : '') + num(Math.abs(d)) + '</span></div>';
    }).join('') + '<div class="dumb__row dumb__axis"><span></span><span class="dumb__track">' + ticks + '</span><span>' + esc(o.gapLabel || 'gap') + '</span></div></div>';
  }

  // Steps that narrow sharply; widths on a log scale so the small end stays visible. steps: [label, value, text]
  function funnel(o) {
    var hi = Math.log10(o.steps[0][1]);
    return '<ol class="funnel">' + o.steps.map(function (s, i) {
      var w = 9 + 91 * (Math.log10(Math.max(s[1], 1)) / hi), last = i === o.steps.length - 1;
      return '<li' + tip(s[0] + ': ' + (s[2] || num(s[1]))) + '><span class="funnel__bar" style="width:' + w.toFixed(1) + '%;background:' + (last ? C.red : C.blue) + '"><b>' + esc(s[2] || num(s[1])) + '</b></span><span class="funnel__label">' + esc(s[0]) + '</span></li>';
    }).join('') + '</ol>';
  }

  // items: [when, what, highlight]
  function timeline(o) {
    return '<ol class="tline">' + o.items.map(function (it) {
      return '<li' + (it[2] ? ' class="is-hi"' : '') + '><time>' + esc(it[0]) + '</time><span>' + esc(it[1]) + '</span></li>';
    }).join('') + '</ol>';
  }

  // items: [figure, meaning]
  function stats(o) {
    return '<dl class="stats">' + o.items.map(function (s) { return '<div><dt>' + esc(s[0]) + '</dt><dd>' + esc(s[1]) + '</dd></div>'; }).join('') + '</dl>';
  }

  // head: [..]; rows: [[cells...], highlight]
  function table(o) {
    return '<div class="ctable-wrap"><table class="ctable"><thead><tr>' + o.head.map(function (h) { return '<th scope="col">' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      o.rows.map(function (r) { return '<tr' + (r[1] ? ' class="is-hi"' : '') + '>' + r[0].map(function (c, i) { return i ? '<td>' + esc(c) + '</td>' : '<th scope="row">' + esc(c) + '</th>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
  }

  // American states as equal tiles. on: {AB: 'note'}, lead: 'AB'
  var TILES = 'AK 0 0,ME 11 0,WI 6 1,VT 10 1,NH 11 1,WA 1 2,ID 2 2,MT 3 2,ND 4 2,MN 5 2,IL 6 2,MI 7 2,NY 9 2,MA 10 2,OR 1 3,NV 2 3,WY 3 3,SD 4 3,IA 5 3,IN 6 3,OH 7 3,PA 8 3,NJ 9 3,CT 10 3,RI 11 3,CA 1 4,UT 2 4,CO 3 4,NE 4 4,MO 5 4,KY 6 4,WV 7 4,VA 8 4,MD 9 4,DE 10 4,AZ 2 5,NM 3 5,KS 4 5,AR 5 5,TN 6 5,NC 7 5,SC 8 5,DC 9 5,OK 4 6,LA 5 6,MS 6 6,AL 7 6,GA 8 6,HI 0 7,TX 4 7,FL 9 7';
  function tiles(o) {
    return '<div class="tiles" role="img" aria-label="' + esc(o.aria) + '">' + TILES.split(',').map(function (t) {
      var p = t.split(' '), s = p[0], on = o.on[s];
      return '<span class="' + (on ? 'is-on' : '') + (s === o.lead ? ' is-lead' : '') + '" style="grid-column:' + (+p[1] + 1) + ';grid-row:' + (+p[2] + 1) + '"' + (on ? tip(on) : '') + '>' + s + '</span>';
    }).join('') + '</div>';
  }

  /* ---------- SVG chart types (drawn at width W) ---------- */

  function svgOpen(W, H, label) { return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" role="img" aria-label="' + esc(label) + '" xmlns="http://www.w3.org/2000/svg">'; }
  function txt(x, y, s, a) { return '<text x="' + f1(x) + '" y="' + f1(y) + '"' + (a || '') + '>' + esc(s) + '</text>'; }
  function gridY(W, top, bottom, max, ticks, fmt, padL, padR) {
    return ticks.map(function (t) {
      var y = bottom - t / max * (bottom - top);
      return '<line x1="' + padL + '" x2="' + (W - padR) + '" y1="' + f1(y) + '" y2="' + f1(y) + '" class="' + (t ? 'g' : 'g0') + '"/>' + txt(W - 2, y - 4, fmt(t), ' text-anchor="end" class="ax"');
    }).join('');
  }

  // bars: [label, value, colour, text]
  function columns(o, W) {
    var H = o.h || 230, top = 22, bottom = H - 30, padL = 4, padR = 4, n = o.bars.length;
    var slot = (W - padL - padR) / n, bw = Math.min(slot * 0.62, 90), fmt = o.fmt || num;
    var out = svgOpen(W, H, o.aria) + gridY(W, top, bottom, o.max, o.ticks, fmt, padL, padR);
    o.bars.forEach(function (b, i) {
      var h = b[1] / o.max * (bottom - top), x = padL + slot * i + (slot - bw) / 2, y = bottom - h;
      out += '<rect x="' + f1(x) + '" y="' + f1(y) + '" width="' + f1(bw) + '" height="' + f1(Math.max(h, 1)) + '" fill="' + (b[2] || C.blue) + '"' + tip(b[0] + ': ' + (b[3] || fmt(b[1]))) + '/>' +
        txt(x + bw / 2, y - 6, b[3] || fmt(b[1]), ' text-anchor="middle" class="val"') +
        txt(x + bw / 2, bottom + 18, b[0], ' text-anchor="middle" class="lab"');
    });
    return out + '</svg>';
  }

  // series: [{name, colour, pts: [[x, y, label]]}]; x numeric. xticks: [[x, label]]
  function line(o, W) {
    var H = o.h || 240, top = 22, bottom = H - 28, padL = 16, padR = 40;
    var X = function (v) { return padL + (v - o.xmin) / (o.xmax - o.xmin) * (W - padL - padR); };
    var Y = function (v) { return bottom - v / o.max * (bottom - top); };
    var fmt = o.fmt || num, out = svgOpen(W, H, o.aria) + gridY(W, top, bottom, o.max, o.ticks, fmt, padL, padR > 30 ? 4 : padR);
    o.xticks.forEach(function (t) { out += txt(X(t[0]), bottom + 18, t[1], ' text-anchor="middle" class="lab"'); });
    o.series.forEach(function (s) {
      out += '<polyline fill="none" stroke="' + s.colour + '" stroke-width="2.6" stroke-linejoin="round" points="' + s.pts.map(function (p) { return f1(X(p[0])) + ',' + f1(Y(p[1])); }).join(' ') + '"/>';
      s.pts.forEach(function (p, i) {
        var last = i === s.pts.length - 1;
        out += '<circle cx="' + f1(X(p[0])) + '" cy="' + f1(Y(p[1])) + '" r="' + (last ? 5 : 3.5) + '" fill="' + (last ? C.red : s.colour) + '"/>' +
          '<circle cx="' + f1(X(p[0])) + '" cy="' + f1(Y(p[1])) + '" r="13" fill="transparent"' + tip(p[2] + ': ' + fmt(p[1]) + (o.unit || '')) + '/>';
        if (last) out += txt(X(p[0]) - 8, Y(p[1]) - 10, fmt(p[1]) + (o.lastSuffix || ''), ' text-anchor="end" class="val"');
      });
    });
    return out + '</svg>';
  }

  // rows: [name, before, after, colour, beforeText, afterText]
  function slope(o, W) {
    var H = o.h || 230, top = 34, bottom = H - 18, x1 = Math.max(90, W * 0.28), x2 = W - Math.max(90, W * 0.28);
    var Y = function (v) { return bottom - v / o.max * (bottom - top); };
    var out = svgOpen(W, H, o.aria) + txt(x1, 16, o.left, ' text-anchor="middle" class="lab b"') + txt(x2, 16, o.right, ' text-anchor="middle" class="lab b"') +
      '<line x1="' + x1 + '" x2="' + x1 + '" y1="' + (top - 8) + '" y2="' + bottom + '" class="g"/><line x1="' + x2 + '" x2="' + x2 + '" y1="' + (top - 8) + '" y2="' + bottom + '" class="g"/>';
    o.rows.forEach(function (r) {
      var y1 = Y(r[1]), y2 = Y(r[2]);
      out += '<line x1="' + x1 + '" x2="' + x2 + '" y1="' + f1(y1) + '" y2="' + f1(y2) + '" stroke="' + r[3] + '" stroke-width="3"/>' +
        '<circle cx="' + x1 + '" cy="' + f1(y1) + '" r="5" fill="' + r[3] + '"' + tip(r[0] + ', ' + o.left + ': ' + r[4]) + '/>' +
        '<circle cx="' + x2 + '" cy="' + f1(y2) + '" r="5" fill="' + r[3] + '"' + tip(r[0] + ', ' + o.right + ': ' + r[5]) + '/>' +
        txt(x1 - 10, y1 + 4, r[4], ' text-anchor="end" class="val"') + txt(x2 + 10, y2 + 4, r[5], ' class="val"') +
        txt((x1 + x2) / 2, (y1 + y2) / 2 - 8, r[0], ' text-anchor="middle" class="lab b" style="fill:' + r[3] + '"');
    });
    return out + '</svg>';
  }

  // Points on an equirectangular projection; no borders, so it is labelled as a schematic.
  function dots(o, W) {
    var lat0 = (o.lat[0] + o.lat[1]) / 2, k = Math.cos(lat0 * Math.PI / 180);
    var sx = W / ((o.lon[1] - o.lon[0]) * k), H = Math.round((o.lat[1] - o.lat[0]) * sx);
    var X = function (lon) { return (lon - o.lon[0]) * k * sx; }, Y = function (lat) { return (o.lat[1] - lat) * sx; };
    var out = svgOpen(W, H, o.aria) + '<rect width="' + W + '" height="' + H + '" fill="#f2f4f5"/>';
    for (var lo = Math.ceil(o.lon[0]); lo <= o.lon[1]; lo++) out += '<line x1="' + f1(X(lo)) + '" x2="' + f1(X(lo)) + '" y1="0" y2="' + H + '" class="g"/>';
    for (var la = Math.ceil(o.lat[0]); la <= o.lat[1]; la++) out += '<line y1="' + f1(Y(la)) + '" y2="' + f1(Y(la)) + '" x1="0" x2="' + W + '" class="g"/>';
    var hub = o.points[0];
    o.points.slice(1).forEach(function (p) { out += '<line x1="' + f1(X(hub.lon)) + '" y1="' + f1(Y(hub.lat)) + '" x2="' + f1(X(p.lon)) + '" y2="' + f1(Y(p.lat)) + '" stroke="' + C.mist + '" stroke-dasharray="4 4"/>'; });
    o.points.forEach(function (p, i) {
      var x = X(p.lon), y = Y(p.lat), d = i ? Math.round(km(hub, p)) : 0;
      out += '<circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + (i ? 8 : 5) + '" fill="' + (i ? C.red : C.ink) + '" stroke="#fff" stroke-width="2"' + tip(p.name + (p.when ? ', ' + p.when : '') + (d ? ' — about ' + d + 'km from ' + hub.name : '') + (p.note ? '. ' + p.note : '')) + '/>' +
        txt(x + (p.dx || 12), y + (p.dy || 4), p.name, ' class="lab b"' + (p.anchor ? ' text-anchor="' + p.anchor + '"' : '')) +
        (p.when ? txt(x + (p.dx || 12), y + (p.dy || 4) + 15, p.when, ' class="lab"' + (p.anchor ? ' text-anchor="' + p.anchor + '"' : '')) : '');
    });
    var bar = 100 / 111.2 * sx * 1; // 100km in degrees of latitude, in pixels
    out += '<line x1="10" x2="' + f1(10 + bar) + '" y1="26" y2="26" stroke="' + C.ink + '" stroke-width="2"/>' + txt(10, 19, '100km', ' class="lab"');
    return out + '</svg>';
  }
  function km(a, b) {
    var r = Math.PI / 180, dl = (b.lat - a.lat) * r, dn = (b.lon - a.lon) * r;
    var h = Math.sin(dl / 2) * Math.sin(dl / 2) + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dn / 2) * Math.sin(dn / 2);
    return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  }

  // Three overlapping capabilities.
  function venn(o, W) {
    var H = Math.round(Math.min(W * 0.82, 330)), r = H * 0.27, cx = W / 2, cy = H * 0.52;
    var c = [[cx - r * 0.62, cy - r * 0.38], [cx + r * 0.62, cy - r * 0.38], [cx, cy + r * 0.62]];
    var out = svgOpen(W, H, o.aria);
    o.sets.forEach(function (s, i) { out += '<circle cx="' + f1(c[i][0]) + '" cy="' + f1(c[i][1]) + '" r="' + f1(r) + '" fill="' + s[1] + '" fill-opacity=".28" stroke="' + s[1] + '" stroke-width="2"' + tip(s[0] + ': ' + s[2]) + '/>'; });
    out += txt(c[0][0] - r * 0.35, c[0][1] - r * 0.3, o.sets[0][0], ' text-anchor="middle" class="lab b"') +
      txt(c[1][0] + r * 0.35, c[1][1] - r * 0.3, o.sets[1][0], ' text-anchor="middle" class="lab b"') +
      txt(c[2][0], c[2][1] + r * 0.55, o.sets[2][0], ' text-anchor="middle" class="lab b"') +
      '<circle cx="' + f1(cx) + '" cy="' + f1(cy) + '" r="' + f1(r * 0.24) + '" fill="' + C.red + '"' + tip(o.centre[1]) + '/>' +
      txt(cx, cy + 4, o.centre[0], ' text-anchor="middle" class="lab b" style="fill:#fff"');
    return out + '</svg>';
  }

  // lanes: [{name, segs: [[from, to, kind, label]]}] on a time axis in seconds
  function lanes(o, W) {
    var padL = Math.min(118, W * 0.3), padR = 10, laneH = 46, top = 10, H = top + o.lanes.length * (laneH + 22) + 26;
    var X = function (t) { return padL + t / o.tmax * (W - padL - padR); };
    var fill = { silence: 'url(#hatch)', talk: C.blue, wait: C.mist, answer: C.red };
    var out = svgOpen(W, H, o.aria) + '<defs><pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#eef1f3"/><line x1="0" y1="0" x2="0" y2="6" stroke="#b7c6cf" stroke-width="2"/></pattern></defs>';
    o.lanes.forEach(function (ln, i) {
      var y = top + i * (laneH + 22);
      out += txt(0, y + laneH / 2 + 4, ln.name, ' class="lab b"');
      ln.segs.forEach(function (s) {
        out += '<rect x="' + f1(X(s[0])) + '" y="' + y + '" width="' + f1(Math.max(X(s[1]) - X(s[0]), 2)) + '" height="' + laneH + '" fill="' + fill[s[2]] + '" stroke="#fff"' + tip(ln.name + ', ' + num(s[0], 1) + '–' + num(s[1], 1) + 's: ' + s[3]) + '/>';
        if (X(s[1]) - X(s[0]) > 46 && s[2] !== 'silence') out += txt((X(s[0]) + X(s[1])) / 2, y + laneH / 2 + 4, s[4] || '', ' text-anchor="middle" class="lab" style="fill:#fff"');
        if (s[2] === 'silence' && X(s[1]) - X(s[0]) > 80) out += txt((X(s[0]) + X(s[1])) / 2, y + laneH / 2 + 4, 'silence', ' text-anchor="middle" class="lab"');
      });
    });
    var yA = H - 14;
    for (var t = 0; t <= o.tmax; t += o.step) out += txt(X(t), yA, t + 's', ' text-anchor="middle" class="ax"');
    return out + '</svg>';
  }

  /* ---------- calculators ---------- */

  function field(label, k, min, max, step, val, shown) {
    return '<label class="calc__field"><span>' + esc(label) + ' <output data-show="' + k + '">' + esc(shown) + '</output></span><input type="range" min="' + min + '" max="' + max + '" step="' + step + '" value="' + val + '" data-k="' + k + '"></label>';
  }
  function presets(k, opts, val) {
    return '<div class="calc__presets" role="group">' + opts.map(function (o) { return '<button type="button" data-calc-set="' + k + '" data-v="' + esc(o[1]) + '" aria-pressed="' + (String(o[1]) === String(val)) + '">' + esc(o[0]) + '</button>'; }).join('') + '</div>';
  }
  var PARAMS = [0.5, 1, 2, 3, 4, 7, 8, 12, 14, 27, 32, 70];
  var MODELS = [['Claude Haiku 5.5', 0.5], ['GPT-6.1 Sol', 10], ['Claude Sonnet 5.5', 10], ['GPT-6 Astra', 50]];
  function money(v) { return v >= 1e6 ? '$' + num(v / 1e6, 1) + 'm' : v >= 10 ? '$' + num(v, 0) : v >= 0.1 ? '$' + v.toFixed(2) : v >= 0.01 ? '$' + v.toFixed(3) : '$' + v.toFixed(4); }

  var CALC = {
    commitments: {
      state: { g: 80 },
      controls: function (s) { return field('Annual revenue growth from 2026', 'g', 0, 150, 5, s.g, s.g + '%'); },
      out: function (s) {
        var rev = 4.6, cum = 0, year = 0, bars = [], top = 518;
        for (var y = 2026; y <= 2035; y++) { rev *= 1 + s.g / 100; cum += rev; bars.push([y, cum]); if (!year && cum >= 518) year = y; }
        bars.forEach(function (b) { top = Math.max(top, b[1]); });
        top = Math.min(top, 1600);
        var line = (518 / top * 100).toFixed(1);
        return '<div class="calc__big">' + (year ? 'Revenue since 2026 would pass $518bn in ' + year : 'Revenue would not reach $518bn by 2035') + '</div>' +
          '<div class="calc__line">At ' + s.g + '% a year, 2030 revenue would be $' + num(4.6 * Math.pow(1 + s.g / 100, 5), 0) + 'bn; ten-year total $' + num(cum, 0) + 'bn.</div>' +
          '<div class="mini-cols" aria-hidden="true"><i style="bottom:' + line + '%"><em>$518bn</em></i>' + bars.map(function (b) {
            return '<span class="' + (b[1] >= 518 ? 'is-over' : '') + '" style="height:' + Math.min(100, b[1] / top * 100).toFixed(1) + '%"' + tip(b[0] + ': cumulative revenue $' + num(b[1], 0) + 'bn') + '></span>';
          }).join('') + '</div><div class="mini-x">' + bars.map(function (b) { return '<span>' + String(b[0]).slice(2) + '</span>'; }).join('') + '</div>';
      }
    },
    tokens: {
      state: { m: 1, t: 50, n: 1000 },
      controls: function (s) {
        return '<div class="calc__field"><span>Model (price per million output tokens)</span>' + presets('m', MODELS.map(function (m, i) { return [m[0] + ' · $' + (m[1] < 1 ? m[1].toFixed(2) : m[1]), i]; }), s.m) + '</div>' +
          field('Output tokens per task (thousands)', 't', 1, 200, 1, s.t, s.t + 'k') +
          '<div class="calc__field"><span>Tasks a day</span>' + presets('n', [['100', 100], ['1,000', 1000], ['10,000', 10000], ['100,000', 100000]], s.n) + '</div>';
      },
      out: function (s) {
        var per = s.t * 1000 / 1e6 * MODELS[s.m][1];
        return '<div class="calc__big">' + money(per) + ' a task</div><div class="calc__line">' + money(per * s.n) + ' a day · ' + money(per * s.n * 365) + ' a year, for output tokens alone.</div>' +
          '<div class="calc__line">Tokens per task vary several-fold between models doing the same job, so the cheapest price per token is not always the cheapest task.</div>';
      }
    },
    memory: {
      state: { i: 4, b: 4 },
      controls: function (s) {
        return field('Model size (parameters, billions)', 'i', 0, PARAMS.length - 1, 1, s.i, PARAMS[s.i] + 'bn') +
          '<div class="calc__field"><span>Precision of each number</span>' + presets('b', [['16-bit', 16], ['8-bit', 8], ['4-bit', 4]], s.b) + '</div>';
      },
      out: function (s) {
        var gb = PARAMS[s.i] * s.b / 8, scale = Math.max(20, gb * 1.1), verdict;
        verdict = gb <= 12 * 0.4 ? 'Fits on a 12GB phone with room for everything else' : gb <= 12 * 0.75 ? 'Squeezes into a 12GB phone, leaving little for other apps' : gb <= 16 ? 'Too big for most phones; a 16GB device might just hold the weights' : 'Will not fit on a phone';
        return '<div class="calc__big">' + num(gb, gb < 10 ? 1 : 0) + 'GB of weights</div><div class="calc__line">' + verdict + '. Working memory for the conversation comes on top.</div>' +
          '<div class="membar" aria-hidden="true"><span style="width:' + Math.min(100, gb / scale * 100).toFixed(1) + '%"></span>' +
          [8, 12, 16].map(function (m) { return '<i style="left:' + (m / scale * 100).toFixed(1) + '%"><em>' + m + 'GB</em></i>'; }).join('') + '</div>';
      }
    }
  };
  function readCalc(fig) {
    var c = CALC[fig.getAttribute('data-calc')], s = JSON.parse(fig.getAttribute('data-state') || '{}');
    [].forEach.call(fig.querySelectorAll('input[data-k]'), function (el) { s[el.getAttribute('data-k')] = +el.value; });
    return s;
  }
  function updateCalc(fig) {
    var id = fig.getAttribute('data-calc'), c = CALC[id], s = readCalc(fig);
    fig.setAttribute('data-state', JSON.stringify(s));
    [].forEach.call(fig.querySelectorAll('output[data-show]'), function (o) {
      var k = o.getAttribute('data-show');
      o.textContent = id === 'memory' && k === 'i' ? PARAMS[s.i] + 'bn' : id === 'tokens' && k === 't' ? s.t + 'k' : s[k] + '%';
    });
    [].forEach.call(fig.querySelectorAll('[data-calc-set]'), function (b) { b.setAttribute('aria-pressed', String(String(s[b.getAttribute('data-calc-set')]) === b.getAttribute('data-v'))); });
    fig.querySelector('.calc__out').innerHTML = c.out(s);
  }

  /* ---------- chart definitions ---------- */

  var D = {};

  // 26 October edition
  D['ipo-revenue'] = { title: 'One quarter beats a year', sub: 'Anthropic’s revenue, $bn', source: 'Anthropic S-1, October 2026, via Tomasz Tunguz',
    svg: function (W) { return columns({ aria: 'Revenue: 2025 full year $4.6bn; first quarter 2026 $4.7bn; second quarter 2026 $11.6bn', max: 12, ticks: [0, 4, 8, 12], fmt: function (v) { return num(v, v % 1 ? 1 : 0); },
      bars: [['2025, full year', 4.6, C.grey, '4.6'], ['Q1 2026', 4.7, C.blue, '4.7'], ['Q2 2026', 11.6, C.red, '11.6']] }, W); } };
  D['ipo-commitments'] = { title: 'Signed up', sub: 'Anthropic’s disclosed computing and infrastructure agreements, $bn', source: 'Anthropic S-1, compiled by Tomasz Tunguz; the filing gives no total. Some are maximums, some minimums',
    html: function () { return hbar({ max: 170, rows: [['Broadcom', 161.2, C.blue, '161.2'], ['SpaceXAI', 120.5, C.blue, 'up to 120.5'], ['Google', 114.5, C.blue, 'at least 114.5'], ['Amazon', 110, C.blue, 'at least 110.0'], ['Microsoft', 44.9, C.sky, 'at least 44.9'], ['Nscale', 44.6, C.sky, 'up to 44.6'], ['Lambda', 41.3, C.sky, 'about 41.3']] }); } };
  D['pods-time'] = { title: 'Fast-forward', sub: 'Time to install AI computing at a prepared site, days', source: 'Nvidia, October 21st 2026. Vendor claim, not yet tested in deployments',
    html: function () { return hbar({ rows: [['Conventional installation', 182, C.grey, 'about six months'], ['DSX POD, as claimed', 14, C.red, '14 days']] }); } };
  D['pods-power'] = { title: 'Plugged in', sub: 'Electricity used by data centres worldwide, terawatt-hours', source: 'IEA, Energy and AI, 2025. *Base-case projection',
    svg: function (W) { return columns({ aria: 'Data-centre electricity: 415 TWh in 2024, 945 TWh projected for 2030', max: 1000, ticks: [0, 250, 500, 750, 1000], bars: [['2024', 415, C.blue], ['2030*', 945, C.red]] }, W); } };
  D['skills-numbers'] = { title: 'Skills in numbers', sub: 'Agent Skills, a year after launch', source: 'Anthropic, October 22nd 2026',
    html: function () { return stats({ items: [['70+', 'agent platforms support the format, including ChatGPT, Cursor and GitHub Copilot'], ['1m', 'skills published'], ['280m', 'skill installations, roughly 280 per published skill']] }); } };
  D['skills-timeline'] = { title: 'From feature to commons', sub: 'Agent Skills and the agent ecosystem', source: 'Anthropic; Koi Security',
    html: function () { return timeline({ items: [['October 2025', 'Anthropic launches Agent Skills, developed while building Claude Code'], ['December 2025', 'Skills published as an open standard; the Agentic AI Foundation is formed under the Linux Foundation by Anthropic, Block and OpenAI'], ['February 2026', 'An audit of 2,857 skills on ClawHub, a marketplace for another agent, finds 341 malicious ones'], ['October 22nd 2026', 'Anthropic hands the format, its name and its domain to the foundation', true]] }); } };
  D['supply-multipliers'] = { title: 'Bottlenecks, multiplied', sub: 'Planned capacity increases for Nvidia, multiple of current level', source: 'Nvidia, October 21st 2026. Plans, not delivered capacity',
    html: function () { return hbar({ max: 16, suffix: '×', rows: [['Testing, 2026 to 2027', 2, C.blue, '2×'], ['Substrates, over three years', 2.5, C.blue, '2.5×'], ['IBIDEN’s Ono plant', 3, C.blue, '3×'], ['Amkor interposers, by end-2028', 4, C.blue, '4×'], ['SPIL co-packaged optics, by mid-2027', 15, C.red, '15×']] }); } };
  D['supply-timeline'] = { title: 'When the parts arrive', sub: 'Dates announced by Nvidia and its suppliers', source: 'Nvidia, October 21st 2026',
    html: function () { return timeline({ items: [['February 2027', 'Expanded testing in Singapore reaches high-volume production'], ['April 2027', 'KYEC’s new American testing plants, backed by a $1.1bn advance, reach high volume'], ['Q2 2027', 'Unimicron begins adding substrate capacity'], ['Mid-2027', 'SPIL’s optical-engine capacity up 15-fold', true], ['Q1 2028', 'IBIDEN’s expanded Ono plant begins to ramp'], ['End-2028', 'Amkor’s interposer capacity up by more than 300%; SPIL doubles again']] }); } };
  D['contact-novices'] = { title: 'A leg-up for beginners', sub: 'Change in issues resolved per hour after support agents got an AI assistant, %', source: 'Brynjolfsson, Li and Raymond, NBER working paper 31161, 2023',
    html: function () { return hbar({ max: 40, suffix: '%', rows: [['All agents', 14, C.blue, '+14%'], ['Least experienced and skilled', 34, C.red, '+34%'], ['Most experienced and skilled', 0.6, C.grey, 'little change']] }); } };
  D['contact-klarna'] = { title: 'The Klarna claim', sub: 'What a Swedish payments firm said of its AI assistant after one month, February 2024', source: 'Klarna. Company figures; it later said it would keep human agents available',
    html: function () { return stats({ items: [['2.3m', 'conversations, two-thirds of its customer-service chats'], ['700', 'full-time agents’ worth of work, by its estimate'], ['11 → 2', 'minutes to resolve a query'], ['25%', 'fewer repeat inquiries']] }); } };
  D['guardrails-venn'] = { title: 'The lethal trifecta', sub: 'Capabilities that are risky together in an AI agent', source: 'After Simon Willison, 2025',
    svg: function (W) { return venn({ aria: 'Three overlapping circles: private data, untrusted content and a way to send data out. Their overlap is where data can be stolen', sets: [['Private data', C.blue, 'the agent can read things an attacker wants'], ['Untrusted content', C.gold, 'the agent reads text an attacker can write'], ['A way out', C.green, 'the agent can send information somewhere']], centre: ['Theft', 'All three together: injected instructions can make the agent leak private data'] }, W); } };
  D['guardrails-arena'] = { title: 'Breaking in, at scale', sub: 'A public red-teaming contest against AI agents, March–April 2025', source: 'Gray Swan and UK AI Security Institute; Zou and colleagues, 2025',
    html: function () { return stats({ items: [['1.8m', 'prompt-injection attacks submitted'], ['60,000+', 'succeeded in making an agent break its policy'], ['22', 'frontier models attacked, in 44 deployment scenarios']] }); } };
  D['voice-gap'] = { title: 'Mind the gap', sub: 'Pauses before a reply, seconds', source: 'Stivers and colleagues, PNAS, 2009; Jefferson, 1989; Google Developers, 2026',
    html: function () { return hbar({ max: 15, rows: [['Typical gap between turns in conversation', 0.2, C.grey, '~0.2'], ['Silence people tolerate before it feels wrong', 1, C.grey, '~1'], ['Voice agent, streaming tool: first words', 1.2, C.blue, '1.2'], ['Voice agent, blocking tool: first words', 14.4, C.red, '14.4']] }); } };
  D['voice-lanes'] = { title: 'Two ways to wait', sub: 'A voice agent fetching a report, illustrative timeline, seconds', source: 'Agentic AI, based on timings in Google’s guide',
    svg: function (W) { return lanes({ aria: 'Blocking agent is silent for 13 seconds then answers; non-blocking agent acknowledges at once and gives progress updates before answering', tmax: 15, step: 3, lanes: [
      { name: 'Blocking tool', segs: [[0, 13, 'silence', 'nothing to say while the tool runs'], [13, 15, 'answer', 'the report', 'answer']] },
      { name: 'Streaming tool', segs: [[0, 1.2, 'wait', 'thinking'], [1.2, 2.6, 'talk', '“On it”', 'ack'], [2.6, 5, 'wait', 'tool still running'], [5, 6.4, 'talk', 'progress update', 'update'], [6.4, 8.5, 'wait', 'tool still running'], [8.5, 9.9, 'talk', 'progress update', 'update'], [10, 15, 'answer', 'the report', 'answer']] }] }, W); } };
  D['edge-fps'] = { title: 'Frame by frame', sub: 'Segment Anything 2 at 512×512 pixels on WebGPU, frames per second', source: 'Google Developers, October 19th 2026',
    html: function () { return hbar({ max: 36, rows: [['Before the agent’s rewrite', 10, C.grey, 'under 10'], ['After', 30, C.red, 'over 30'], ['Standard video, for comparison', 30, C.mist, '30']] }); } };
  D['edge-memory'] = { title: 'Will it fit?', sub: 'Memory needed to hold a model’s weights', source: 'Agentic AI calculation: parameters × bits per parameter ÷ 8. Excludes the working memory used during a conversation', calc: 'memory' };
  D['sat-bytes'] = { title: 'Say less', sub: 'Data needed to report fires in one 100km × 100km scene at 10m resolution, bytes, log scale', source: 'Agentic AI calculation; illustrative',
    html: function () { return hbar({ log: true, logMin: 10, max: 3e8, rows: [['The image, one 16-bit band', 241e6, C.grey, '241MB'], ['A fire mask, one bit per pixel', 15.1e6, C.blue, '15MB'], ['Outlines of 100 fires', 4e4, C.blue, '~40KB'], ['An alert: where and when', 100, C.red, '~100 bytes']] }); } };
  D['weather-ai'] = { title: 'The machines move in', sub: 'Share of verification targets on which an AI model beat the leading physics-based forecast, %', source: 'Lam and colleagues, Science, 2023; Price and colleagues, Nature, 2024',
    html: function () { return hbar({ max: 100, suffix: '%', rows: [['GraphCast vs ECMWF HRES, 1,380 targets (2023)', 90, C.blue, '90%'], ['GenCast vs ECMWF ensemble, 1,320 targets (2024)', 97.2, C.red, '97.2%']] }); } };
  D['weather-stats'] = { title: 'Earth-2 in Europe', sub: 'Projects described by Nvidia', source: 'Nvidia, October 21st 2026; ECMWF, 2025',
    html: function () { return stats({ items: [['16', 'satellite channels from Meteosat feed StormScope EU'], ['10 min', 'between its forecast updates'], ['1,000+', 'simulated cyclone seasons studied by AXA, an insurer'], ['~1,000×', 'less energy per forecast for ECMWF’s AI model than its physics model, by ECMWF’s estimate']] }); } };
  D['teachers-pnas'] = { title: 'Easy now, hard later', sub: 'Effect of AI access on Turkish high-school maths students, % change vs no AI', source: 'Bastani and colleagues, PNAS, 2025',
    html: function () { return hbar({ min: -40, max: 130, rows: [['Practice problems, plain chatbot', 48, C.blue, '+48%'], ['Practice problems, tutor version', 127, C.blue, '+127%'], ['Later exam without AI, plain chatbot', -17, C.red, '−17%'], ['Later exam without AI, tutor version', 0, C.grey, 'no significant change']] }); } };
  D['review-table'] = { title: 'Who does the pull request’s jobs?', sub: 'Responses to agent-written code in 50 practitioner documents, October 2025–October 2026', source: 'Treude and Baltes, arXiv, October 26th 2026',
    html: function () { return table({ head: ['Job', 'Proposed change', 'In use?'], rows: [[['Who may contribute', 'Restrict access to trusted contributors', 'Most often reported as adopted']], [['Every job at once', 'Keep the pull request, add tooling or a new artefact', 'The most common response']], [['Review and rationale', 'Move into agent conversations and session records', 'Only Zed reported doing so'], true], [['Outside contributions', 'Two documents outline a replacement', 'No adoption reported']]] }); } };

  // 19 October edition
  D['ag-states'] = { title: 'The coalition', sub: 'States whose attorneys-general sued OpenAI on October 14th 2026', source: 'Iowa Attorney General; Bloomberg Law. Allegations, not findings',
    html: function () { return tiles({ aria: 'Arizona, Arkansas, Idaho, Iowa, Kansas, Montana, Nebraska and West Virginia are highlighted; Iowa leads', lead: 'IA', on: { AZ: 'Arizona', AR: 'Arkansas', ID: 'Idaho', IA: 'Iowa, which leads the coalition', KS: 'Kansas', MT: 'Montana', NE: 'Nebraska', WV: 'West Virginia' } }); } };
  D['aiact-timeline'] = { title: 'Europe’s slow fuse', sub: 'Milestones of the EU AI Act', source: 'European Commission',
    html: function () { return timeline({ items: [['August 2024', 'The AI Act enters into force'], ['February 2025', 'Bans on “unacceptable-risk” uses apply'], ['August 2025', 'Duties for providers of general-purpose models apply'], ['August 2026', 'The Commission can enforce those duties, with fines of up to 3% of global turnover'], ['October 14th 2026', 'First formal requests for information, to OpenAI and Anthropic', true]] }); } };
  D['worm-hours'] = { title: 'Slow but steady', sub: 'Time for one copy of a model to install itself on a new device, hours', source: 'Anthropic Frontier Red Team, October 12th 2026, via BleepingComputer',
    html: function () { return hbar({ max: 160, rows: [['Qwen3.5-9B', [28, 51], C.blue, '28–51'], ['Gemma4-26B-A4B', [71, 150], C.red, '71–150']] }); } };
  D['worm-notes'] = { title: 'Learning as it spreads', sub: 'Success rate of the small Qwen model’s installation steps, %', source: 'Anthropic Frontier Red Team, October 2026',
    html: function () { return hbar({ max: 100, suffix: '%', rows: [['Starting fresh', 45, C.grey, '45%'], ['Inheriting notes from earlier copies', [61, 84], C.red, '61–84%']] }); } };
  D['worm-scale'] = { title: 'Botnets then and now', sub: 'Peak size, number of devices', source: 'Antonakakis and colleagues, 2017; Anthropic Frontier Red Team, 2026 (estimate of copies)',
    html: function () { return hbar({ max: 2.4e6, rows: [['Mirai botnet, 2016', 6e5, C.grey, '~600,000'], ['Kimwolf botnet', 2e6, C.blue, 'over 2m'], ['AI model copies Kimwolf could host, estimate', 1.33e5, C.red, '~133,000']] }); } };
  D['cai-timeline'] = { title: 'Rise and fall', sub: 'Character.AI', source: 'Company reports; court filings; TechCrunch',
    html: function () { return timeline({ items: [['2021', 'Founded by Noam Shazeer and Daniel De Freitas, formerly of Google'], ['March 2023', 'Raises $150m at a $1bn valuation'], ['August 2024', 'Google licenses its technology and rehires its founders'], ['October 2024', 'A Florida mother sues over her son’s suicide; more family lawsuits follow'], ['Late 2025', 'Bars under-18s from open-ended chats'], ['October 12th 2026', 'Files for Chapter 11; Disney bids $20m for an IP licence and offers jobs to most staff', true]] }); } };
  D['cai-value'] = { title: 'Marked down', sub: 'Character.AI, $m', source: 'Company announcements; court filings via TechCrunch. Not like-for-like: an equity valuation vs an opening bid for a licence',
    html: function () { return hbar({ max: 1100, rows: [['Valuation at its 2023 funding round', 1000, C.grey, '$1,000m'], ['Disney’s opening bid in bankruptcy, 2026', 20, C.red, '$20m']] }); } };
  D['argon-prices'] = { title: 'Price list', sub: 'Price per million tokens, $, October 2026', source: 'Google; OpenAI; Anthropic. List prices; discounts for cached input not shown',
    keys: [['out', 'Output'], ['in', 'Input']],
    html: function (k) { var o = k === 'in'; return hbar({ max: o ? 11 : 55, prefix: '$', rows: [['Claude Haiku 5.5', o ? 0.1 : 0.5, C.mist, o ? '$0.10' : '$0.50'], ['Gemini 4 Argon, introductory', o ? 2 : 10, C.red, o ? '$2' : '$10'], ['GPT-6.1 Sol', o ? 2 : 10, C.blue, o ? '$2' : '$10'], ['Claude Sonnet 5.5', o ? 2 : 10, C.blue, o ? '$2' : '$10'], ['Gemini 4 Argon, from December', o ? 4 : 20, C.red, o ? '$4' : '$20'], ['GPT-6 Astra', o ? 10 : 50, C.blue, o ? '$10' : '$50']] }); } };
  D['cyber-change'] = { title: 'Reshuffled', sub: 'American cyber-security job postings, January–September 2026, % change on a year earlier', source: 'CyberSN, via SecurityWeek. Counts advertisements, not hires',
    html: function () { return hbar({ min: -60, max: 280, rows: [['AI security engineer', 268.3, C.blue, '+268%'], ['Cyber data scientist', 203.5, C.blue, '+204%'], ['All postings', -26.4, C.ink, '−26%'], ['Penetration tester', -45.9, C.red, '−46%'], ['Cyber risk analyst', -51.5, C.red, '−52%'], ['Insider-threat analyst', -55.6, C.red, '−56%']] }); } };
  D['nx-slope'] = { title: 'Reading without obeying', sub: 'Effect of Nvidia’s NXDirection method on the BIPIA benchmark, %', source: 'Nvidia researchers, October 2026, via AI Weekly',
    svg: function (W) { return slope({ aria: 'Attack success falls from 38.1% to 0.1%; score on clean tasks falls from 78.4% to 76.4%', left: 'Before', right: 'After', max: 100, rows: [['Score on clean tasks', 78.4, 76.4, C.blue, '78.4%', '76.4%'], ['Attacks that succeed', 38.1, 0.1, C.red, '38.1%', '0.1%']] }, W); } };

  // 12 October edition
  D['maths-years'] = { title: 'A long time coming', sub: 'Years from conjecture to accepted proof', source: 'Historical records. *Claimed; not yet checked by experts',
    html: function () { return hbar({ max: 420, rows: [['Kepler conjecture, 1611–1998', 387, C.blue], ['Fermat’s last theorem, 1637–1994', 357, C.blue], ['Four-colour theorem, 1852–1976', 124, C.blue], ['Poincaré conjecture, 1904–2003', 99, C.blue], ['Unique Games Conjecture, 2002–2026*', 24, C.red]] }); } };
  D['maths-stats'] = { title: 'The release in numbers', sub: 'OpenAI’s batch of mathematical results', source: 'Scott Aaronson, Shtetl-Optimized, October 7th 2026',
    html: function () { return stats({ items: [['~4,000', 'problems attempted by the unreleased model'], ['~10%', 'solved, by Scott Aaronson’s count'], ['372', 'results released on the first day'], ['~3 hours', 'of computation per result, on average']] }); } };
  D['pricewar-prices'] = { title: 'Rate card', sub: 'Price per million tokens, $, week of October 5th 2026', source: 'Anthropic; OpenAI. List prices for short prompts',
    keys: [['out', 'Output'], ['in', 'Input']],
    html: function (k) { var o = k === 'in'; return hbar({ max: o ? 11 : 55, rows: [['OpenAI Decisions API (GPT-6 Luna)', o ? 0.1 : 0.02, C.green, o ? '$0.10' : 'free'], ['Claude Haiku 5.5', o ? 0.1 : 0.5, C.red, o ? '$0.10' : '$0.50'], ['GPT-6.1 Sol', o ? 2 : 10, C.blue, o ? '$2' : '$10'], ['Claude Sonnet 5.5', o ? 2 : 10, C.blue, o ? '$2' : '$10'], ['GPT-6 Astra', o ? 10 : 50, C.blue, o ? '$10' : '$50']] }); } };
  D['pricewar-calc'] = { title: 'What a task costs', sub: 'Cost of output tokens for an AI workload', source: 'Agentic AI calculation from list prices. Input tokens, caching and hidden reasoning can change the answer', calc: 'tokens' };
  D['yandex-map'] = { title: 'Three strikes', sub: 'Yandex computing sites hit by drones, October 2026', source: 'Yandex; Al Jazeera; Ukrainska Pravda. Approximate locations (town centres); schematic, borders not shown',
    svg: function (W) { return dots({ aria: 'Map: Moscow with Vladimir to the east, Kaluga to the south-west and Sasovo to the south-east', lon: [35.4, 42.9], lat: [53.85, 56.75], points: [
      { name: 'Moscow', lat: 55.756, lon: 37.617 },
      { name: 'Sasovo', lat: 54.35, lon: 41.917, when: 'October 8th', note: 'Reportedly housed two of Yandex’s three AI supercomputers', dx: -12, anchor: 'end' },
      { name: 'Kaluga', lat: 54.513, lon: 36.261, when: 'October 9th', note: 'Several modules knocked out' },
      { name: 'Vladimir', lat: 56.129, lon: 40.407, when: 'October 11th', note: 'Completely shut down', dx: -12, anchor: 'end' }] }, W); } };
  D['chatgpt-users'] = { title: 'Chatting up', sub: 'ChatGPT weekly active users, m', source: 'OpenAI statements',
    svg: function (W) { return line({ aria: 'ChatGPT weekly users rose from 100m in November 2023 to 1.2bn in October 2026', xmin: 2023.8, xmax: 2026.85, max: 1300, ticks: [0, 400, 800, 1200], xticks: [[2024, '2024'], [2025, '2025'], [2026, '2026']], unit: 'm',
      series: [{ name: 'Weekly users', colour: C.blue, pts: [[2023.84, 100, 'November 2023'], [2024.66, 200, 'August 2024'], [2024.92, 300, 'December 2024'], [2025.13, 400, 'February 2025'], [2025.24, 500, 'March 2025'], [2025.59, 700, 'August 2025'], [2025.76, 800, 'October 2025'], [2026.77, 1200, 'October 2026']] }] }, W); } };
  D['wiki-bots'] = { title: 'Heavy footprints', sub: 'Bots’ share of Wikimedia traffic, %', source: 'Wikimedia Foundation, April 2025',
    html: function () { return hbar({ max: 100, suffix: '%', rows: [['Page views', 35, C.blue, '35%'], ['Most expensive traffic (served from core data centres)', 65, C.red, '65%']] }); } };
  D['undo-survey'] = { title: 'Collateral damage', sub: 'Senior engineering leaders saying…, %', source: 'Undo survey of 300 leaders at large American and British firms, July–August 2026. Vendor survey; self-reported',
    html: function () { return hbar({ max: 100, suffix: '%', rows: [['An AI hallucination led to a wrong diagnosis of a fault', 93, C.red], ['Serious defects reached production', 90, C.blue, '90+%'], ['They had an AI-linked outage in six months', 81, C.blue], ['Releases are no faster than before AI', 79, C.blue], ['AI code ships before teams understand it', 35, C.grey]] }); } };
  D['undo-hours'] = { title: 'Where the week goes', sub: 'Engineers’ average hours a week', source: 'Undo, October 2026',
    html: function () { return stack({ rows: [['', [['Debugging', 16.9, C.red, '16.9 debugging'], ['Writing code', 9.8, C.blue, '9.8 writing']]]] }); } };

  // 5 October edition
  D['prospectus-scale'] = { title: 'Out of proportion', sub: 'Anthropic, $bn', source: 'Draft prospectus as reported by Fortune and Reuters, September 2026',
    html: function () { return hbar({ max: 560, rows: [['Revenue, 2025', 4.6, C.blue, '4.6'], ['Spending on computing, 2025', 7.3, C.blue, '7.3'], ['Operating loss, 2025', 8.1, C.grey, '8.1'], ['Cash and short-term investments, end-2025', 20.3, C.blue, '20.3'], ['Computing commitments, next decade', 518, C.red, '518']] }); } };
  D['prospectus-calc'] = { title: 'Paying the bill', sub: 'Cumulative revenue from 2026, if 2025’s $4.6bn grows at a constant rate, $bn', source: 'Agentic AI calculation; illustrative. Revenue is not cash available to pay suppliers', calc: 'commitments' };
  D['devday-prices'] = { title: 'Pay for brains, or for speed', sub: 'OpenAI API prices per million tokens, $, September 2026', source: 'OpenAI, via TechCrunch and BGR. Ultrafast costs six times the standard price',
    keys: [['out', 'Output'], ['in', 'Input']],
    html: function (k) { var o = k === 'in'; return hbar({ max: o ? 66 : 330, rows: [['GPT-6.1 Sol', o ? 2 : 10, C.blue, o ? '$2' : '$10'], ['GPT-6 Astra', o ? 10 : 50, C.blue, o ? '$10' : '$50'], ['GPT-6 Astra, Ultrafast', o ? 60 : 300, C.red, o ? '$60' : '$300']] }); } };
  D['robo-table'] = { title: 'Patchwork', sub: 'Rules on AI in American workplaces', source: 'State and city legislation',
    html: function () { return table({ head: ['Where', 'In force', 'What it requires'], rows: [[['New York City', 'July 2023', 'Bias audits and notice for automated hiring and promotion tools']], [['Illinois', 'January 2026', 'No AI use that discriminates in hiring, firing or discipline; notice to workers']], [['California', 'July 2027', 'A human must corroborate automated discipline or firing; written notice'], true]] }); } };
  D['pew-dumbbell'] = { title: 'Uncanny, but wrong', sub: 'Share answering yes or correctly, %', source: 'Pew Research Center, American Trends Panel, early 2026', reveal: 'Show what the AI twins said',
    legend: [['Real respondents', C.blue], ['AI “digital twins”', C.red]],
    html: function () { return dumbbell({ names: ['Real respondents', 'AI twins'], suffix: '%', gapLabel: 'gap', rows: [['Correct about the First Amendment', 52, 98], ['Correct about NATO’s focus', 56, 99], ['Hispanic adults likely to follow the World Cup', 43, 97], ['Republicans favourable to Israel', 58, 95], ['Democrats: billionaires bad for the country', 45, 86], ['Approve of Trump’s job performance', 34, 46], ['Masked immigration officers acceptable', 38, 17], ['Heard a lot about data centres', 25, 3]] }); } };
  D['pew-groups'] = { title: 'Missing the mark', sub: 'Average error of AI twins by group, percentage points', source: 'Pew Research Center, September 30th 2026',
    html: function () { return hbar({ max: 18, rows: [['Republicans', 16.1, C.red], ['Black adults', 15.1, C.blue], ['Hispanic adults', 13.9, C.blue], ['Democrats', 13.6, C.blue], ['Asian adults (English speakers)', 13.5, C.blue], ['White adults', 12.5, C.blue]] }); } };
  D['deceive-rates'] = { title: 'Economical with the truth', sub: 'Sessions with deceptive statements in a simulated tender, %', source: 'Researchers from Beihang, Peking University, Nottingham Ningbo and 360 AI Security Lab, March 2026, via Reuters',
    html: function () { return hbar({ max: 100, suffix: '%', rows: [['Alibaba Qwen3-Max-Preview', 88, C.red], ['Moonshot Kimi-K2', 88, C.red], ['DeepSeek-V3.2-Exp', 84, C.red]] }); } };
  D['stratego-cost'] = { title: 'Cheap thrills', sub: 'Estimated cost to train a superhuman Stratego player, $, log scale', source: 'Sokota and colleagues, Nature, 2026 (authors’ estimates)',
    html: function () { return hbar({ log: true, logMin: 1000, max: 1e7, rows: [['Ataraxos, 2026', 8000, C.red, 'under $8,000'], ['DeepNash, 2022', 3.75e6, C.grey, '$3m–4.5m']] }); } };
  D['stratego-record'] = { title: 'The match', sub: 'Ataraxos v Pim Niemeijer, 20 games', source: 'Sokota and colleagues, Nature, 2026',
    html: function () { return stack({ rows: [['', [['Ataraxos wins', 15, C.blue, '15 wins'], ['Draws', 4, C.mist, '4 draws'], ['Niemeijer wins', 1, C.red, '1']]]] }); } };
  D['amd-deals'] = { title: 'Shopping list', sub: 'AMD’s biggest acquisitions, value, $bn', source: 'Company announcements. Xilinx at completion; World Labs pending',
    html: function () { return hbar({ max: 55, rows: [['Xilinx, 2022', 49, C.blue], ['World Labs, 2026', 8.2, C.red], ['ATI, 2006', 5.4, C.blue], ['ZT Systems, 2025', 4.9, C.blue], ['Pensando, 2022', 1.9, C.blue]] }); } };

  // 28 September edition
  D['medicare-deadlines'] = { title: 'Fashionably late', sub: 'Time allowed to report or assess a data breach, days', source: 'GDPR; NIS2; SEC; OAIC; HHS. These rules bind organisations that suffer breaches, not firms whose agents cause them elsewhere',
    html: function () { return hbar({ max: 100, rows: [['EU NIS2 early warning', 1, C.grey, '24 hours'], ['EU GDPR', 3, C.grey, '72 hours'], ['America: listed companies (SEC)', 4, C.grey, '4 business days'], ['Australia: assessing a suspected breach', 30, C.grey, '30 days'], ['America: health data (HIPAA)', 60, C.grey, '60 days'], ['OpenAI to Canberra, this case', 90, C.red, 'about three months']] }); } };
  D['astra-rates'] = { title: 'Going rogue', sub: 'Simulated runs in which a model carried out a full supply-chain attack it was not asked for, %', source: 'AI Security Institute, September 28th 2026. Safeguards switched off; GPT-5.5 tested on fewer runs',
    html: function () { return hbar({ max: 35, suffix: '%', rows: [['GPT-5.5', 0, C.grey, '0%'], ['GPT-5.6 Sol', 6.3, C.blue], ['GPT-6 Astra', 29.2, C.red]] }); } };
  D['astra-scope'] = { title: 'Spelling it out', sub: 'GPT-6 Astra, runs with a full attack in the ten most-affected scenarios', source: 'AI Security Institute, September 28th 2026',
    html: function () { return hbar({ max: 60, suffix: '%', rows: [['Original instructions', 52, C.red, '26 of 50 runs'], ['Adding “anything not listed as in scope is out of scope”', 8.2, C.blue, '4 of 49 runs']] }); } };
  D['enzyme-funnel'] = { title: 'Needle, haystack', sub: 'How about 950 Claude agents narrowed the search, number of items', source: 'Anthropic, September 23rd 2026',
    html: function () { return funnel({ steps: [['Reverse transcriptases gathered', 200000, '200,000+'], ['Candidate systems', 3500, '3,500'], ['Reports for human review', 20, '20'], ['ART, the system highlighted', 1, '1']] }); } };
  D['enzyme-crispr'] = { title: 'From oddity to tool', sub: 'How strange DNA repeats became CRISPR', source: 'Published literature; Anthropic',
    html: function () { return timeline({ items: [['1987', 'Japanese researchers notice odd repeated DNA in E. coli'], ['2002', 'The repeats are named CRISPR'], ['2005', 'The spacers between repeats are found to match viral DNA'], ['2007', 'Experiments show CRISPR gives bacteria immunity to phages'], ['2012', 'CRISPR-Cas9 is shown to cut DNA at programmable sites'], ['2020', 'Nobel prize for Emmanuelle Charpentier and Jennifer Doudna'], ['2026', 'AI agents flag ART, a CRISPR-like array in phages; its function is unknown', true]] }); } };
  D['seller-stats'] = { title: 'The marketplace in numbers', sub: 'Amazon’s independent sellers', source: 'Amazon; GeekWire; SmartScout',
    html: function () { return stats({ items: [['61%', 'of paid units on Amazon were sold by independent sellers in 2025'], ['~90%', 'of sellers already use outside AI for some tasks, Amazon says'], ['12 months', 'of free Quick Plus for primary account holders who sign up this year']] }); } };
  D['tekever-valuation'] = { title: 'Taking off', sub: 'Tekever’s valuation, $bn', source: 'ECO News, May 2025; Bloomberg via AI Weekly, September 2026. 2025 figure: over £1bn',
    svg: function (W) { return columns({ aria: 'Tekever valuation rose from about $1.3bn in May 2025 to $6.4bn in September 2026', max: 8, ticks: [0, 2, 4, 6, 8], fmt: function (v) { return num(v, v % 1 ? 1 : 0); }, bars: [['May 2025', 1.3, C.blue, '~1.3'], ['September 2026', 6.4, C.red, '6.4']] }, W); } };
  D['mhb-scores'] = { title: 'Room for improvement', sub: 'MentalHealthBench score, % of clinicians’ criteria met', source: 'OpenAI, September 24th 2026. Benchmark built by OpenAI; conversations are synthetic',
    html: function () { return hbar({ max: 100, suffix: '%', rows: [['GPT-6 Astra', 57.3, C.red], ['GPT-6 Sol', 53.9, C.blue], ['Claude Opus 5.5', 52.4, C.blue], ['GPT-6 Luna', 50.2, C.blue], ['GPT-4o', 32.1, C.grey], ['Gemini 2.5 Pro', 29.5, C.grey]] }); } };
  D['mhb-mix'] = { title: 'Hard cases', sub: 'MentalHealthBench conversations by severity, %', source: 'OpenAI', legend: [['Non-acute', C.mist], ['High-acuity', C.gold], ['Emergency', C.red]],
    html: function () { return stack({ rows: [['', [['Non-acute', 53.5, C.mist, '53.5%'], ['High-acuity', 18.2, C.gold, '18.2%'], ['Emergency', 28.3, C.red, '28.3%']]]] }); } };

  /* ---------- rendering ---------- */

  function render(id, key) {
    var d = D[id];
    if (!d) return '';
    key = key || (d.keys ? d.keys[0][0] : '');
    var calc = d.calc ? CALC[d.calc] : null, body;
    if (calc) body = '<div class="calc">' + calc.controls(calc.state) + '<div class="calc__out" aria-live="polite">' + calc.out(calc.state) + '</div></div>';
    else if (d.svg) body = '<div class="chart__svg" data-id="' + esc(id) + '" data-w="360">' + d.svg(360, key) + '</div>';
    else body = d.html(key);
    var controls = d.keys ? '<div class="chart__toggle" role="group" aria-label="Show">' + d.keys.map(function (k) { return '<button type="button" data-chart-key="' + k[0] + '" aria-pressed="' + (k[0] === key) + '">' + esc(k[1]) + '</button>'; }).join('') + '</div>' : '';
    var legend = d.legend ? '<div class="chart__legend">' + d.legend.map(function (l) { return '<span><i style="background:' + l[1] + '"></i>' + esc(l[0]) + '</span>'; }).join('') + '</div>' : '';
    var reveal = d.reveal ? '<button type="button" class="chart__reveal" data-reveal-btn>' + esc(d.reveal) + '</button>' : '';
    return '<figure class="chart' + (d.reveal ? ' is-concealed' : '') + (calc ? ' chart--calc' : '') + '" data-chart="' + esc(id) + '" data-key="' + esc(key) + '"' +
      (calc ? ' data-calc="' + esc(d.calc) + '" data-state="' + esc(JSON.stringify(calc.state)) + '"' : '') + '>' +
      '<div class="chart__head"><span class="chart__title">' + esc(d.title) + '</span>' + (d.sub ? '<span class="chart__sub">' + esc(d.sub) + '</span>' : '') + '</div>' +
      controls + legend + reveal + '<div class="chart__body">' + body + '</div>' +
      '<div class="chart__src">' + (d.source ? 'Source: ' + esc(d.source) : '') + '</div><div class="chart__tip" hidden></div></figure>';
  }

  /* ---------- behaviour ---------- */

  function showTip(el) {
    var fig = el.closest('.chart'), t = fig && fig.querySelector('.chart__tip');
    if (!t) return;
    hideTips(t);
    t.textContent = el.getAttribute('data-tip');
    t.hidden = false;
    var fr = fig.getBoundingClientRect(), r = el.getBoundingClientRect();
    var x = r.left + r.width / 2 - fr.left - t.offsetWidth / 2, y = r.top - fr.top - t.offsetHeight - 8;
    t.style.left = Math.max(0, Math.min(fr.width - t.offsetWidth, x)) + 'px';
    t.style.top = (y < 0 ? r.bottom - fr.top + 8 : y) + 'px';
  }
  function hideTips(except) { [].forEach.call(document.querySelectorAll('.chart__tip'), function (t) { if (t !== except) t.hidden = true; }); }
  function within(e, sel) { return e.target && e.target.closest ? e.target.closest(sel) : null; }

  document.addEventListener('pointerover', function (e) { var el = within(e, '.chart [data-tip]'); if (el && e.pointerType === 'mouse') showTip(el); });
  document.addEventListener('pointerout', function (e) { if (within(e, '.chart [data-tip]') && e.pointerType === 'mouse') hideTips(); });
  document.addEventListener('focusin', function (e) { var el = within(e, '.chart [data-tip]'); if (el) showTip(el); });
  document.addEventListener('focusout', function (e) { if (within(e, '.chart [data-tip]')) hideTips(); });
  document.addEventListener('click', function (e) {
    var el = within(e, '.chart [data-tip]');
    if (el) { showTip(el); return; }
    var k = within(e, '[data-chart-key]');
    if (k) {
      var fig = k.closest('.chart'), key = k.getAttribute('data-chart-key');
      fig.outerHTML = render(fig.getAttribute('data-chart'), key);
      schedule();
      return;
    }
    var rv = within(e, '[data-reveal-btn]');
    if (rv) { var f = rv.closest('.chart'), shut = !f.classList.contains('is-concealed'); f.classList.toggle('is-concealed', shut); rv.textContent = shut ? D[f.getAttribute('data-chart')].reveal : 'Hide the AI answers'; return; }
    var p = within(e, '[data-calc-set]');
    if (p) {
      var cf = p.closest('.chart'), st = JSON.parse(cf.getAttribute('data-state') || '{}');
      st[p.getAttribute('data-calc-set')] = +p.getAttribute('data-v');
      cf.setAttribute('data-state', JSON.stringify(st));
      updateCalc(cf);
      return;
    }
    if (!within(e, '.chart__tip')) hideTips();
  });
  document.addEventListener('input', function (e) { var f = within(e, '.chart[data-calc]'); if (f) updateCalc(f); });

  // SVG charts are drawn at the width they are actually shown at, so text stays at reading size.
  var pending = false;
  function hydrate() {
    pending = false;
    [].forEach.call(document.querySelectorAll('.chart__svg[data-id]'), function (el) {
      var w = Math.round(el.clientWidth);
      if (!w || Math.abs(w - (+el.getAttribute('data-w') || 0)) < 6) return;
      var fig = el.closest('.chart');
      el.setAttribute('data-w', w);
      el.innerHTML = D[el.getAttribute('data-id')].svg(w, fig ? fig.getAttribute('data-key') : '');
    });
  }
  function schedule() { if (!pending) { pending = true; setTimeout(hydrate, 30); } } // a timer, not an animation frame: frames can pause in background tabs and leave charts unsized
  if (window.MutationObserver) new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('resize', schedule);

  return { render: render, has: function (id) { return !!D[id]; }, ids: function () { return Object.keys(D); } };
})();
