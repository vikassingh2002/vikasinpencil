/* Public magazine preferences. No Desk, Supabase, account or cloud dependency. */
window.AgenticStore = (function () {
  'use strict';
  var KEY = 'agentic.reader.v1';
  function blank() { return {seen:{},saved:{},prefs:{},updatedAt:0}; }
  var state = blank();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* Use memory if storage is unavailable. */ } }
  return {
    init: function () {
      try {
        var data = JSON.parse(localStorage.getItem(KEY) || 'null');
        if (data && typeof data === 'object') ['seen','saved','prefs'].forEach(function(k) {
          if (data[k] && typeof data[k] === 'object' && !Array.isArray(data[k])) state[k] = data[k];
        });
      } catch (e) { /* New reader or unavailable storage. */ }
      return Promise.resolve('local');
    },
    get: function () { return state; },
    update: function (fn) { fn(state); state.updatedAt = Date.now(); save(); },
    flush: function () { save(); return Promise.resolve(); },
    mode: function () { return 'local'; }
  };
})();
