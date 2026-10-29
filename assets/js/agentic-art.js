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
    brief: function () {
      var sheets = '';
      for (var i = 0; i < 3; i++) {
        var x = 150 + i * 70, y = 70 + i * 26;
        sheets += '<g transform="rotate(' + (i * 6 - 6) + ' ' + (x + 120) + ' ' + (y + 110) + ')"><rect x="' + x + '" y="' + y + '" width="240" height="220" fill="#fff" stroke="' + INK + '" stroke-width="2"/>' +
          '<rect x="' + (x + 18) + '" y="' + (y + 20) + '" width="120" height="14" fill="' + RED + '"/>' +
          '<path d="M' + (x + 18) + ' ' + (y + 58) + ' h200 M' + (x + 18) + ' ' + (y + 82) + ' h200 M' + (x + 18) + ' ' + (y + 106) + ' h160 M' + (x + 18) + ' ' + (y + 140) + ' h200 M' + (x + 18) + ' ' + (y + 164) + ' h120" stroke="' + PALE + '" stroke-width="8"/></g>';
      }
      return { svg: scene(sheets, '#cfe3ea'), caption: 'Illustration: the news in brief' };
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

  function editorial(id) {
    var palettes = [['#f1c83d', '#202e52'], ['#e6a08c', '#202e52'], ['#84bdcb', '#183b43']];
    var index = id === 'tool-contract' ? 1 : id === 'reasoning-evidence' ? 2 : 0;
    var bg = palettes[index][0], dark = palettes[index][1];
    var subject = index === 0
      ? '<path d="M90 265H560" stroke="'+dark+'" stroke-width="4"/><g transform="rotate(-9 205 170)"><rect x="130" y="80" width="160" height="190" fill="#fff9ed"/><path d="M154 118h108m-108 24h85m-85 24h108m-108 24h60" stroke="'+dark+'" stroke-width="7"/><path d="M175 220l18 17 39-43" fill="none" stroke="#d13227" stroke-width="10"/></g><path d="M390 170h95v95h-95zM370 170l67-90 67 90" fill="'+dark+'"/><circle cx="438" cy="184" r="17" fill="'+bg+'"/><path d="M438 201v30" stroke="'+bg+'" stroke-width="8"/>'
      : index === 1
      ? '<rect x="65" y="87" width="215" height="184" fill="#fcf7ec"/><path d="M88 121h160m-160 28h110m-110 28h144m-144 28h75" stroke="'+dark+'" stroke-width="7"/><path d="M320 180h60" stroke="'+dark+'" stroke-width="5"/><circle cx="450" cy="177" r="90" fill="'+dark+'"/><path d="M410 126v103m80-103v103m-80-57h80" fill="none" stroke="'+bg+'" stroke-width="20"/><circle cx="410" cy="123" r="17" fill="#fcf7ec"/><circle cx="490" cy="229" r="17" fill="#fcf7ec"/>'
      : '<rect x="120" y="75" width="210" height="235" fill="#fff9ed" transform="rotate(-7 225 190)"/><path d="M150 127h135m-135 27h100m-100 27h135m-135 27h70" stroke="'+dark+'" stroke-width="7"/><circle cx="386" cy="160" r="83" fill="none" stroke="'+dark+'" stroke-width="17"/><path d="M444 222l78 84" stroke="'+dark+'" stroke-width="28"/><path d="M350 163l24 23 45-54" fill="none" stroke="#fff9ed" stroke-width="12"/>';
    return { svg: scene(subject, bg), caption: 'Original editorial illustration: ' + (index === 0 ? 'giving automation a bounded job' : index === 1 ? 'a clearer interface between instructions and action' : 'checking the evidence behind an explanation') };
  }
  var NEW = ['workflow-dividend', 'tool-contract', 'reasoning-evidence'];
  return { get: function (id, context) {
    if (NEW.indexOf(id) !== -1) return editorial(id);
    // Keep numerical charts readable at article size; avoid chart text in tiny cards.
    if (context === 'thumbnail' && ['pilots', 'deepseek', 'power', 'novices', 'agents'].indexOf(id) !== -1) {
      var illustrations = {
        pilots: ['#e8c449', '<path d="M100 280h440" stroke="#182d46" stroke-width="5"/><path d="M120 280V110h150v170m60 0V180h150v100" fill="#fff7e9" stroke="#182d46" stroke-width="4"/><path d="M145 140h28m35 0h28m-91 35h28m35 0h28m-91 35h28m35 0h28" stroke="#182d46" stroke-width="10"/><path d="M390 85c80-30 135 50 65 95l-42 25-30-34 28-42-21-44" fill="#d33428"/><circle cx="435" cy="130" r="13" fill="#fff7e9"/>'],
        deepseek: ['#94c2d2', '<rect x="96" y="65" width="300" height="230" fill="#f9f4e9"/><path d="M125 100v160h240" fill="none" stroke="#17364d" stroke-width="4"/><path d="M140 160l45-30 38 15 42-55 34 28 40 115 36 15" fill="none" stroke="#d33428" stroke-width="10"/><g transform="rotate(12 470 175)"><rect x="415" y="120" width="110" height="110" fill="#17364d"/><rect x="438" y="143" width="64" height="64" fill="#f9f4e9"/><path d="M425 106v-18m30 18v-18m30 18v-18m30 18v-18M425 244v18m30-18v18m30-18v18m30-18v18" stroke="#17364d" stroke-width="8"/></g>'],
        power: ['#193d45', '<path d="M120 270h400" stroke="#adc4c1" stroke-width="4"/><rect x="145" y="94" width="100" height="175" fill="#e1e8dc"/><rect x="267" y="94" width="100" height="175" fill="#e1e8dc"/><path d="M163 126h64m-64 30h64m-64 30h64m58-60h64m-64 30h64m-64 30h64" stroke="#193d45" stroke-width="9"/><path d="M458 58l-65 126h49l-32 114 98-150h-55z" fill="#f4cd46"/>'],
        novices: ['#e5a28b', '<path d="M105 275h440" stroke="#24364d" stroke-width="4"/><rect x="165" y="170" width="235" height="90" fill="#f9f4e9"/><path d="M170 165l70-100 92 78 78-105" fill="none" stroke="#24364d" stroke-width="14"/><path d="M370 40h44v44" fill="none" stroke="#24364d" stroke-width="12"/><circle cx="450" cy="220" r="44" fill="#24364d"/><path d="M428 220l17 17 30-36" fill="none" stroke="#f9f4e9" stroke-width="9"/>'],
        agents: ['#c8d5c7', '<circle cx="320" cy="180" r="112" fill="none" stroke="#273a50" stroke-width="4"/><path d="M420 125l20 30 19-37" fill="none" stroke="#d33428" stroke-width="10"/><rect x="100" y="138" width="115" height="84" fill="#273a50"/><rect x="265" y="60" width="110" height="75" fill="#fff8eb"/><rect x="425" y="138" width="115" height="84" fill="#273a50"/><rect x="265" y="240" width="110" height="75" fill="#fff8eb"/><circle cx="138" cy="175" r="9" fill="#fff8eb"/><circle cx="175" cy="175" r="9" fill="#fff8eb"/><path d="M450 167h65m-65 25h45" stroke="#fff8eb" stroke-width="7"/>']
      };
      var item = illustrations[id];
      return { svg: scene(item[1], item[0]), caption: 'Original conceptual illustration; numerical evidence is shown in the article' };
    }
    return ART[id] ? ART[id]() : null;
  } };
})();

/* Licensed local photographs and original raster artwork. Charts remain separate. */
(function () {
 var original = window.AgenticArt;
 var media = {"workflow-dividend": ["office", "An open-plan office. Photograph: Arlington Research / Unsplash. Illustrative photograph; not the hypothetical accounts department described.", "https://unsplash.com/photos/kN_kViDchA0"], "tool-contract": ["tools", "A key and a computer port. Original AI-generated editorial illustration.", ""], "reasoning-evidence": ["reasoning", "Examining an explanation. Original AI-generated editorial illustration.", ""], "pilots": ["servers", "Data-centre cabinets and cabling. Photograph: Taylor Vick / Unsplash. Illustrative photograph.", "https://unsplash.com/photos/aWslrFhs1w4"], "deepseek": ["markets", "A cryptocurrency trading chart. Photograph: Behnam Norouzi / Unsplash. Illustrative photograph; not Nvidia trading data.", "https://unsplash.com/photos/RDXcFY5g5O4"], "llm": ["circuits", "Arduino electronics on a blue surface. Photograph: Sahand Babali / Unsplash. Illustrative photograph; not a model-training chip.", "https://unsplash.com/photos/gavODTHG36Y"], "agents": ["tools", "Delegating control. Original AI-generated editorial illustration.", ""], "power": ["power", "Electricity transmission infrastructure. Photograph: Ilona Frey / Unsplash.", "https://unsplash.com/photos/4r7orhB4YWA"], "novices": ["office", "People at work in an open-plan office. Photograph: Arlington Research / Unsplash. Illustrative photograph; not study participants.", "https://unsplash.com/photos/kN_kViDchA0"], "alphafold": ["science", "A researcher at an electron microscope. Photograph: National Cancer Institute / Unsplash. Illustrative photograph; not the AlphaFold team.", "https://unsplash.com/photos/rAJHnQz5jHc"], "euaiact": ["reasoning", "Scrutinising the evidence. Original AI-generated editorial illustration.", ""], "deploy": ["servers", "Inside a data centre. Photograph: Taylor Vick / Unsplash. Illustrative photograph.", "https://unsplash.com/photos/aWslrFhs1w4"]};

 Object.assign(media, {"cost-of-correct": ["servers", "Inside a data centre. Photograph: Taylor Vick / Unsplash. Illustrative photograph.", "https://unsplash.com/photos/aWslrFhs1w4"], "integration-moat": ["office", "People at work in an open-plan office. Photograph: Arlington Research / Unsplash. Illustrative photograph; not study participants.", "https://unsplash.com/photos/kN_kViDchA0"], "open-weight-economics": ["circuits", "Arduino electronics on a blue surface. Photograph: Sahand Babali / Unsplash. Illustrative photograph; not a model-training chip.", "https://unsplash.com/photos/gavODTHG36Y"], "electricity-option": ["power", "Electricity transmission infrastructure. Photograph: Ilona Frey / Unsplash.", "https://unsplash.com/photos/4r7orhB4YWA"], "context-tax": ["tools", "Delegating control. Original AI-generated editorial illustration.", ""], "benchmark-theatre": ["servers", "Inside a data centre. Photograph: Taylor Vick / Unsplash. Illustrative photograph.", "https://unsplash.com/photos/aWslrFhs1w4"], "apprentice-economy": ["office", "People at work in an open-plan office. Photograph: Arlington Research / Unsplash. Illustrative photograph; not study participants.", "https://unsplash.com/photos/kN_kViDchA0"], "reviewer-bottleneck": ["reasoning", "Scrutinising the evidence. Original AI-generated editorial illustration.", ""], "prediction-laboratory": ["science", "A researcher at an electron microscope. Photograph: National Cancer Institute / Unsplash. Illustrative photograph; not the AlphaFold team.", "https://unsplash.com/photos/rAJHnQz5jHc"], "negative-results": ["science", "A researcher at an electron microscope. Photograph: National Cancer Institute / Unsplash. Illustrative photograph; not the AlphaFold team.", "https://unsplash.com/photos/rAJHnQz5jHc"], "audit-trail": ["reasoning", "Scrutinising the evidence. Original AI-generated editorial illustration.", ""], "open-not-identical": ["circuits", "Arduino electronics on a blue surface. Photograph: Sahand Babali / Unsplash. Illustrative photograph; not a model-training chip.", "https://unsplash.com/photos/gavODTHG36Y"]});
 var chartIds = ['pilots', 'deepseek', 'power', 'novices', 'agents'];
 window.AgenticArt = {
  get: function (id, context) {
   var m = media[id];
   if (!m) return original.get(id, context);
   return { svg: '<img src="assets/img/editorial/' + m[0] + '.jpg" alt="" width="1200" height="800" decoding="async" loading="' + (context === 'lead' ? 'eager' : 'lazy') + '"' + (context === 'lead' ? ' fetchpriority="high"' : '') + '>', caption: m[1], creditUrl: m[2] };
  },
  chart: function (id) { return chartIds.indexOf(id) >= 0 ? original.get(id) : null; }
 };
})();
