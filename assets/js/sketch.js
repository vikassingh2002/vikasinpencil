/* Pencil drawings for vikasinpencil.com.
   Every picture is plain SVG line art. Sketch.draw(svg) traces it stroke by
   stroke with a pencil tip; Sketch.show(svg) shows it finished at once.
   Classes inside a drawing: acc (green: what is real), thin (construction
   lines), soft (filled shading), note (annotation text). */
window.Sketch = (function () {
  'use strict';
  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  // ?still shows every drawing finished (used for screenshots).
  if (/[?&]still(&|=|$)/.test(location.search)) { reduce = true; document.documentElement.classList.add('still'); }

  var D = {
    // Sheet drawings, 360 x 280
    home: '<path class="thin" d="M30 236 H330"/>' +
      '<rect x="58" y="150" width="244" height="14" rx="2"/><path d="M80 164 L70 236 M280 164 L290 236"/>' +
      '<path d="M112 150 L148 78 L196 74"/><circle cx="148" cy="78" r="5"/><path d="M196 74 L228 102 L212 115 Z"/>' +
      '<path class="thin" d="M212 115 L196 148"/>' +
      '<rect x="230" y="122" width="56" height="28" rx="2"/><path class="thin" d="M238 130 H278 M238 138 H266"/>' +
      '<path class="acc" d="M86 146 L140 139"/><path d="M140 139 L150 137.6"/>' +
      '<path class="thin" d="M246 112 C 252 96, 270 92, 280 80"/><text class="note" x="282" y="76">fig. 1</text>',
    now: '<circle cx="180" cy="128" r="84" class="thin"/>' +
      '<path d="M180 52 L180 66 M180 190 L180 204 M104 128 L118 128 M242 128 L256 128"/>' +
      '<path d="M180 128 L150 74"/><path class="acc" d="M180 128 L226 150"/><circle cx="180" cy="128" r="5"/>' +
      '<path class="thin" d="M64 244 C 120 214, 150 252, 206 226 S 290 210, 316 230"/>' +
      '<circle cx="96" cy="230" r="4"/><circle class="soft-acc" cx="164" cy="240" r="5"/><circle cx="236" cy="220" r="4"/><circle cx="300" cy="224" r="4"/>' +
      '<text class="note" x="150" y="262">you are here</text>',
    work: '<path d="M60 220 L300 220 L280 92 L80 92 Z"/>' +
      '<path class="thin" d="M100 116 H180 M100 132 H160 M100 148 H170"/>' +
      '<rect x="196" y="110" width="66" height="50" rx="2"/><circle cx="229" cy="135" r="14" class="thin"/>' +
      '<path class="acc" d="M100 176 H226"/><path class="thin" d="M226 176 H262"/>' +
      '<path d="M90 220 L80 256 M270 220 L280 256"/>' +
      '<path d="M300 60 L246 196"/><path d="M300 60 L312 66 L258 202 L246 196"/><path class="thin" d="M246 196 L243 208 L252 202"/>',
    thinking: '<path d="M180 46 C 128 46, 112 108, 148 140 C 158 150, 161 160, 161 174 H199 C 199 160, 202 150, 212 140 C 248 108, 232 46, 180 46 Z"/>' +
      '<path d="M166 188 H194 M170 200 H190"/><path class="thin" d="M170 174 L175 120 L185 120 L190 174"/>' +
      '<path class="thin" d="M70 262 A 110 110 0 0 1 290 262"/>' +
      '<path class="thin dash" d="M180 262 L258 211"/><path class="acc" d="M180 262 L246 198"/>' +
      '<text class="note" x="266" y="220">was</text><text class="note" x="214" y="186">now</text>',
    reading: '<rect x="70" y="204" width="220" height="26" rx="2"/><rect x="86" y="178" width="190" height="26" rx="2"/>' +
      '<rect x="100" y="152" width="172" height="26" rx="2"/><rect class="acc" x="80" y="126" width="200" height="26" rx="2"/>' +
      '<path class="thin" d="M120 204 V230 M150 178 V204 M240 152 V178 M110 126 V152"/>' +
      '<path d="M252 126 C 262 84, 300 72, 312 42"/><path d="M302 46 L312 42 L314 54"/>' +
      '<text class="note" x="88" y="118">reading now</text>',

    // Project drawings, 160 x 110
    magazine: '<rect x="44" y="12" width="72" height="88" rx="2"/><path class="acc" d="M54 26 H106"/><path class="thin" d="M54 38 H96 M54 74 H106 M54 82 H100 M54 90 H90"/><rect x="54" y="46" width="52" height="22" class="thin"/>',
    screen: '<rect x="30" y="16" width="100" height="64" rx="4"/><path class="acc" d="M72 36 L94 48 L72 60 Z"/><path d="M64 96 H96 M80 80 V96"/>',
    club: '<rect x="28" y="56" width="44" height="44" rx="2" class="thin"/><rect x="88" y="56" width="44" height="44" rx="2" class="thin"/><circle cx="50" cy="30" r="12"/><circle cx="110" cy="30" r="12"/><path class="acc" d="M62 78 H98"/>',
    satellite: '<rect x="64" y="40" width="32" height="32" rx="3"/><path d="M64 56 H44 M96 56 H116"/><rect x="12" y="44" width="32" height="24"/><rect x="116" y="44" width="32" height="24"/><path class="thin" d="M12 52 H44 M12 60 H44 M116 52 H148 M116 60 H148"/><path d="M80 40 V20 M72 20 H88"/><path class="acc" d="M64 64 H96"/>',
    report: '<path d="M40 12 H96 L112 28 V100 H40 Z"/><path class="thin" d="M52 36 H96 M52 48 H100 M52 60 H88"/><circle cx="96" cy="78" r="14"/><path class="acc" d="M106 88 L122 104"/>',
    house: '<path d="M24 96 V58 L56 32 L88 58 V96 Z"/><path class="thin" d="M48 96 V74 H64 V96"/><path class="thin" d="M100 96 H146"/><path class="acc" d="M104 84 L118 70 L130 76 L144 50"/>',
    flow: '<rect x="12" y="40" width="34" height="30" rx="3"/><rect x="63" y="40" width="34" height="30" rx="3"/><rect x="114" y="40" width="34" height="30" rx="3"/><path d="M46 55 H63 M97 55 H114"/><path class="acc" d="M28 86 C 60 104, 100 104, 132 86"/>'
  };

  function pathsOf(svg) { return [].slice.call(svg.querySelectorAll('path,rect,circle,line,polyline,polygon,ellipse')); }
  function prep(svg) {
    pathsOf(svg).forEach(function (e) { if (!e.hasAttribute('pathLength')) e.setAttribute('pathLength', '1'); });
  }
  function show(svg) {
    prep(svg);
    pathsOf(svg).forEach(function (e) { e.style.strokeDasharray = ''; e.style.strokeDashoffset = ''; e.style.opacity = ''; });
    [].forEach.call(svg.querySelectorAll('text'), function (t) { t.style.opacity = ''; });
    svg.classList.add('is-drawn');
  }
  // Trace every stroke in document order, with a pencil tip that follows the line.
  function draw(svg, done, speed) {
    if (reduce) { show(svg); if (done) done(); return; }
    prep(svg);
    var els = pathsOf(svg), texts = [].slice.call(svg.querySelectorAll('text')), k = speed || 1;
    els.forEach(function (e) { e.style.strokeDasharray = '1'; e.style.strokeDashoffset = '1'; if (e.classList.contains('soft-acc')) e.style.opacity = '0'; });
    texts.forEach(function (t) { t.style.opacity = '0'; });
    var ns = 'http://www.w3.org/2000/svg', tip = document.createElementNS(ns, 'circle');
    tip.setAttribute('r', '2.6'); tip.setAttribute('class', 'tip'); svg.appendChild(tip);
    var i = 0;
    function next() {
      if (i >= els.length) {
        tip.remove(); texts.forEach(function (t) { t.style.transition = 'opacity .4s'; t.style.opacity = '1'; });
        svg.classList.add('is-drawn'); if (done) done(); return;
      }
      var e = els[i++];
      if (e.classList.contains('soft-acc')) { e.style.transition = 'opacity .3s'; e.style.opacity = '1'; e.style.strokeDashoffset = '0'; setTimeout(next, 80); return; }
      var len = 100; try { len = e.getTotalLength(); } catch (x) {}
      var dur = Math.min(360, Math.max(110, len * 1.6)) / k, t0 = null;
      function step(ts) {
        if (t0 === null) t0 = ts;
        var f = Math.min(1, (ts - t0) / dur), g = 1 - Math.pow(1 - f, 2);
        e.style.strokeDashoffset = String(1 - g);
        try { var p = e.getPointAtLength(len * g); tip.setAttribute('cx', p.x); tip.setAttribute('cy', p.y); } catch (x) {}
        if (f < 1) requestAnimationFrame(step); else { e.style.strokeDasharray = ''; e.style.strokeDashoffset = ''; next(); }
      }
      requestAnimationFrame(step);
    }
    // Background tabs pause animation frames; finish instantly if the page is hidden.
    if (document.hidden) { show(svg); tip.remove(); if (done) done(); return; }
    next();
  }
  function erase(svg, ms) {
    if (!svg || reduce) return;
    prep(svg);
    pathsOf(svg).forEach(function (e) { e.style.transition = 'stroke-dashoffset ' + ms + 'ms ease-in, opacity ' + ms + 'ms'; e.style.strokeDasharray = '1'; e.style.strokeDashoffset = '0'; });
    requestAnimationFrame(function () { pathsOf(svg).forEach(function (e) { e.style.strokeDashoffset = '-1'; e.style.opacity = '0'; }); });
    [].forEach.call(svg.querySelectorAll('text'), function (t) { t.style.transition = 'opacity ' + ms + 'ms'; t.style.opacity = '0'; });
  }
  function svg(name, vb, cls, label) {
    return '<svg class="sk ' + (cls || '') + '" viewBox="' + vb + '" role="img" aria-label="' + (label || '') + '" xmlns="http://www.w3.org/2000/svg">' + (D[name] || '') + '</svg>';
  }
  return { D: D, draw: draw, show: show, erase: erase, svg: svg, reduce: reduce };
})();
