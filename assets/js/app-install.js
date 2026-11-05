(function () {
  'use strict';
  var config = document.currentScript.dataset.app === 'watch'
    ? {name: 'Watch in Pencil', worker: '/watch/sw.js', scope: '/watch/'}
    : {name: 'Desk', worker: '/desk-sw.js', scope: '/desk.html'};
  var pending = null;
  var installButton;
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register(config.worker, {scope: config.scope, updateViaCache: 'none'}).catch(function () {});
  }
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault(); pending = e;
    if (installButton) installButton.hidden = false;
  });
  window.addEventListener('appinstalled', function () {
    pending = null;
    var dialog = document.getElementById('app-install-dialog');
    if (dialog) dialog.close();
  });
  function showHelp() {
    var standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    var dialog = document.createElement('dialog');
    dialog.id = 'app-install-dialog';
    dialog.style.cssText = 'max-width:26rem;width:calc(100% - 3rem);padding:1.5rem;border:1px solid #ddd;border-radius:12px;background:#fffdf7;color:#23374b;font:16px/1.6 system-ui;';
    var apple = /iPhone|iPad|iPod/.test(navigator.userAgent);
    var heading = document.createElement('h2'); heading.textContent = 'Install ' + config.name;
    var text = document.createElement('p');
    text.textContent = standalone ? 'Open this page in your phone’s regular browser to install it separately.' : apple
      ? 'In Safari, tap Share, then Add to Home Screen. Turn on Open as Web App if offered.'
      : 'Tap Install below, or use your browser menu → Add to Home screen → Install. Open this link in Chrome if you are using an in-app browser.';
    var note = document.createElement('p'); note.textContent = 'Desk, Agentic AI and Watch have separate home-screen icons. Installing them does not copy data between devices.';
    installButton = document.createElement('button'); installButton.textContent = 'Install'; installButton.hidden = !pending || !!standalone;
    installButton.onclick = async function () {
      if (!pending) return;
      var event = pending; pending = null; installButton.hidden = true;
      await event.prompt(); await event.userChoice;
    };
    var close = document.createElement('button'); close.textContent = 'Close'; close.style.marginLeft = '1rem'; close.onclick = function () { dialog.close(); };
    dialog.append(heading, text, note, installButton, close);
    dialog.addEventListener('close', function () { installButton = null; dialog.remove(); });
    document.body.appendChild(dialog); dialog.showModal();
  }
  if (new URLSearchParams(location.search).has('install')) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', showHelp);
    else showHelp();
  }
})();
