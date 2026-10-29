(function () {
  'use strict';
  var pending;
  window.addEventListener('beforeinstallprompt', function (event) {
    event.preventDefault(); pending = event;
  });
  window.addEventListener('appinstalled', function () { pending = null; });
  if ('serviceWorker' in navigator && location.pathname.indexOf('/agentic/') === 0) {
    navigator.serviceWorker.register('/agentic/sw.js', {scope:'/agentic/',updateViaCache:'none'}).catch(function () {});
  }
  document.addEventListener('click', async function (event) {
    if (!event.target.closest('[data-install-agentic]')) return;
    if (location.pathname.indexOf('/agentic/') !== 0) {
      location.assign('/agentic/?install=1' + location.hash); return;
    }
    if (pending) { var prompt = pending; pending = null; await prompt.prompt(); await prompt.userChoice; return; }
    showHelp();
  });
  function showHelp() {
    if (document.querySelector('.install-dialog')) return;
    var dialog = document.createElement('dialog'); dialog.className = 'install-dialog';
    var apple = /iPhone|iPad|iPod/.test(navigator.userAgent);
    dialog.innerHTML = '<h2>Install Agentic AI</h2><p>' + (apple ? 'In Safari, tap Share, then Add to Home Screen. Turn on Open as Web App if offered.' : 'Open your browser menu and choose Install Agentic AI or Install app. On a laptop, you can also use the install icon in the address bar. If installation is unavailable, try Chrome or Edge.') + '</p><p>Agentic AI opens separately from Desk. Your existing desk sign-in is still required to read.</p><button type="button">Close</button>';
    document.body.appendChild(dialog); dialog.querySelector('button').onclick = function () { dialog.close(); };
    dialog.addEventListener('close', function () { dialog.remove(); }); dialog.showModal();
  }
  if (new URLSearchParams(location.search).has('install')) {
    window.addEventListener('load', function () { showHelp(); });
  }
})();
