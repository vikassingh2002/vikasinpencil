/* Agentic AI: pictures for the articles, drawn in code (no image files).
   Charts use only figures stated in the articles, with their sources; illustrations
   are original. AgenticArt.get(id) returns { svg, caption } or null. */
window.AgenticArt = (function () {
  'use strict';

  var BLUE = '#006ba2', SKY = '#3ebcd2', RED = '#e3120b', INK = '#0d0d0d', GREY = '#758d99', PALE = '#d7dee2';
  var FONT = "font-family=\"Inter, -apple-system, 'Segoe UI', Arial, sans-serif\"";

  // A bar chart in the weekly-magazine manner: red tag, bold title, subtitle, light grid, source line.
  function bars(o) {
    var W = 640, H = 360, left = 150, right = 40, top = 96, rowH = Math.min(56, (H - top - 50) / o.rows.length);
    var max = o.max || Math.max.apply(null, o.rows.map(function (r) { return r[1]; }));
    var span = W - left - right;
    var grid = '';
    var ticks = o.ticks || [0, max / 2, max];
    ticks.forEach(function (t) {
      var x = left + t / max * span;
      grid += '<line x1="' + x + '" y1="' + (top - 8) + '" x2="' + x + '" y2="' + (top + rowH * o.rows.length) + '" stroke="' + PALE + '" stroke-width="1"/>' +
        '<text x="' + x + '" y="' + (top - 14) + '" font-size="13" fill="' + GREY + '" text-anchor="middle" ' + FONT + '>' + (o.fmt ? o.fmt(t) : t) + '</text>';
    });
    var rows = o.rows.map(function (r, i) {
      var y = top + i * rowH + 8;
      var w = Math.max(2, r[1] / max * span);
      return '<text x="' + (left - 10) + '" y="' + (y + rowH / 2 - 2) + '" font-size="14" fill="' + INK + '" text-anchor="end" ' + FONT + '>' + r[0] + '</text>' +
        '<rect x="' + left + '" y="' + y + '" width="' + w + '" height="' + (rowH - 22) + '" fill="' + (r[2] || BLUE) + '"/>' +
        '<text x="' + (left + w + 6) + '" y="' + (y + rowH / 2 - 2) + '" font-size="14" font-weight="700" fill="' + INK + '" ' + FONT + '>' + (r[3] || r[1]) + '</text>';
    }).join('');
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + o.title + '. ' + o.sub + '" xmlns="http://www.w3.org/2000/svg">' +
      '<rect width="' + W + '" height="' + H + '" fill="#fff"/>' +
      '<rect x="24" y="0" width="40" height="8" fill="' + RED + '"/>' +
      '<text x="24" y="40" font-size="20" font-weight="700" fill="' + INK + '" ' + FONT + '>' + o.title + '</text>' +
      '<text x="24" y="64" font-size="15" fill="' + INK + '" ' + FONT + '>' + o.sub + '</text>' +
      grid + rows +
      '<text x="24" y="' + (H - 16) + '" font-size="12" fill="' + GREY + '" ' + FONT + '>Source: ' + o.source + '</text></svg>';
  }

  function scene(inner, bg) {
    return '<svg viewBox="0 0 640 360" role="img" xmlns="http://www.w3.org/2000/svg"><rect width="640" height="360" fill="' + (bg || '#f2ece4') + '"/>' + inner + '</svg>';
  }

  var ART = {
    pilots: function () {
      return { svg: bars({ title: 'All talk', sub: 'Organisations in the study, by return on generative AI, %', rows: [['No measurable', 95, BLUE], ['Measurable', 5, RED]], max: 100, ticks: [0, 25, 50, 75, 100],
        source: 'MIT NANDA, The GenAI Divide, 2025 (interview-based)' }), caption: 'Chart: what the companies studied reported' };
    },
    deepseek: function () {
      return { svg: bars({ title: 'Down in one', sub: "Nvidia's largest one-day losses of market value, $bn", rows: [['Sep 2024', 279, SKY, '279'], ['Jan 27th 2025', 589, BLUE, '589']], max: 600, ticks: [0, 200, 400, 600],
        source: 'Bloomberg; Forbes, as reported' }), caption: 'Chart: a record day for Nvidia' };
    },
    power: function () {
      return { svg: bars({ title: 'Plugged in', sub: 'Electricity used by data centres worldwide, terawatt-hours', rows: [['2024', 415, BLUE], ['2030*', 945, SKY]], max: 1000, ticks: [0, 250, 500, 750, 1000],
        source: 'IEA, Energy and AI, 2025. *Base-case projection' }), caption: 'Chart: data-centre demand set to more than double' };
    },
    novices: function () {
      return { svg: bars({ title: 'Helping hand', sub: 'Increase in issues resolved per hour with an AI assistant, %', rows: [['All agents', 14, BLUE, '14'], ['Least experienced', 34, SKY, '34'], ['Most experienced', 0.5, GREY, 'little change']], max: 40, ticks: [0, 10, 20, 30, 40],
        source: 'Brynjolfsson, Li and Raymond, NBER working paper 31161' }), caption: 'Chart: the gains went mostly to novices' };
    },
    agents: function () {
      return { svg: bars({ title: 'Running up the meter', sub: 'Tokens used, relative to a chat (=1)', rows: [['Chat', 1, GREY, '1'], ['Agent', 4, BLUE, '~4'], ['Several agents', 15, SKY, '~15']], max: 16, ticks: [0, 4, 8, 12, 16],
        source: 'Anthropic, How we built our multi-agent research system, 2025' }), caption: 'Chart: autonomy costs tokens' };
    },
    llm: function () {
      var words = ['The', 'cat', 'sat', 'on', 'the'];
      var tiles = words.map(function (w, i) {
        return '<rect x="' + (30 + i * 92) + '" y="150" width="82" height="56" fill="#fff" stroke="' + INK + '" stroke-width="2"/>' +
          '<text x="' + (71 + i * 92) + '" y="186" font-size="22" text-anchor="middle" fill="' + INK + '" font-family="Georgia, serif">' + w + '</text>';
      }).join('');
      var guesses = [['mat', 0.62], ['sofa', 0.21], ['roof', 0.09]].map(function (g, i) {
        var y = 110 + i * 62;
        return '<rect x="530" y="' + y + '" width="' + Math.round(g[1] * 40 + 66) + '" height="44" fill="' + (i ? SKY : RED) + '"/>' +
          '<text x="540" y="' + (y + 29) + '" font-size="19" fill="' + (i ? INK : '#fff') + '" font-family="Georgia, serif" font-weight="700">' + g[0] + '</text>';
      }).join('');
      return { svg: scene(tiles + '<path d="M492 178 h28" stroke="' + INK + '" stroke-width="3"/>' + guesses +
        '<text x="40" y="70" font-size="17" fill="' + INK + '" ' + FONT + ' font-weight="700">Which word comes next?</text>', '#e9eef1'), caption: 'Illustration: a model ranks the likely next words' };
    },
    alphafold: function () {
      var path = 'M60 250 C 120 80, 180 80, 220 200 S 320 320, 360 180 S 440 40, 500 170 S 560 290, 590 150';
      return { svg: scene('<path d="' + path + '" fill="none" stroke="' + BLUE + '" stroke-width="26" stroke-linecap="round" opacity="0.9"/>' +
        '<path d="' + path + '" fill="none" stroke="' + SKY + '" stroke-width="8" stroke-linecap="round" stroke-dasharray="2 18"/>' +
        '<circle cx="220" cy="200" r="16" fill="' + RED + '"/><circle cx="500" cy="170" r="16" fill="' + RED + '"/>', '#f4efe6'), caption: 'Illustration: a protein, folded' };
    },
    euaiact: function () {
      var stars = '';
      for (var i = 0; i < 12; i++) {
        var a = i / 12 * Math.PI * 2;
        stars += '<circle cx="' + (320 + Math.cos(a) * 110).toFixed(1) + '" cy="' + (180 + Math.sin(a) * 110).toFixed(1) + '" r="9" fill="#ffcc00"/>';
      }
      return { svg: scene(stars + '<rect x="270" y="130" width="100" height="100" fill="#fff" stroke="' + INK + '" stroke-width="3"/>' +
        '<path d="M290 160 h60 M290 182 h60 M290 204 h40" stroke="' + INK + '" stroke-width="5"/>', '#1f3a8a'), caption: 'Illustration: a rulebook for AI' };
    },
    deploy: function () {
      var cells = '';
      for (var r = 0; r < 4; r++) for (var c = 0; c < 6; c++) {
        var ok = (r * 6 + c) % 5 !== 3;
        cells += '<rect x="' + (300 + c * 46) + '" y="' + (80 + r * 52) + '" width="38" height="42" fill="' + (ok ? '#fff' : RED) + '" stroke="' + INK + '" stroke-width="1.5"/>' +
          '<text x="' + (319 + c * 46) + '" y="' + (108 + r * 52) + '" font-size="18" text-anchor="middle" fill="' + (ok ? BLUE : '#fff') + '" ' + FONT + '>' + (ok ? '✓' : '✗') + '</text>';
      }
      return { svg: scene('<circle cx="150" cy="190" r="90" fill="#fff4b8"/><path d="M150 60 l-70 260 h140 z" fill="#fff" opacity="0.55"/>' +
        '<rect x="110" y="170" width="80" height="60" fill="' + BLUE + '"/><text x="150" y="208" font-size="18" text-anchor="middle" fill="#fff" ' + FONT + ' font-weight="700">Demo</text>' + cells, '#e9eef1'),
        caption: 'Illustration: one demo, many tests' };
    }
  };

  return { get: function (id) { return ART[id] ? ART[id]() : null; } };
})();
