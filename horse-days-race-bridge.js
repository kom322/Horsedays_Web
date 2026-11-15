/* HorseDays v18: legacy phone-web race spectator integration for a same-origin GitHub Pages site.
 * The Unity WebGL .jslib sends JSON to window.HorseDaysInkRace.
 * Race renderer is hosted in a separate iframe and returns commands through postMessage.
 */
(function () {
  'use strict';
  var element = null;
  var ready = false;
  var rendered = false;
  var latestFrame = null;
  var pendingCommand = 0;
  var startTimer = null;
  var loadSequence = 0;
  var origin = location.origin;

  function unmount() {
    clearTimeout(startTimer);
    startTimer = null;
    ready = false;
    rendered = false;
    latestFrame = null;
    if (element) {
      var node = element;
      element = null;
      node.remove();
      // Discard the renderer page and free its WebGL context.
      try { node.src = 'about:blank'; } catch (_) {}
    }
  }

  function fail(message) {
    console.warn('HorseDays: 専用観戦画面を表示できませんでした。Unity表示に戻します。', message);
    pendingCommand = 3;
    unmount();
  }

  function sendFrame(frame) {
    if (!ready || !element || !element.contentWindow) return;
    element.contentWindow.postMessage({type:'horse-days-race-frame', frame:frame}, origin);
  }

  addEventListener('message', function (event) {
    if (!element || event.source !== element.contentWindow || event.origin !== origin) return;
    var packet = event.data;
    if (!packet || typeof packet !== 'object') return;
    if (packet.type === 'horse-days-race-ready') {
      ready = true;
      if (latestFrame) sendFrame(latestFrame);
    } else if (packet.type === 'horse-days-render-ready') {
      rendered = true;
      clearTimeout(startTimer);
      startTimer = null;
      element.style.opacity = '1';
    } else if (packet.type === 'horse-days-race-command') {
      var command = Number(packet.command);
      if ([1,2,3,4].includes(command)) pendingCommand = command;
    } else if (packet.type === 'horse-days-race-fallback') {
      fail('renderer reported fallback');
    }
  });

  window.HorseDaysInkRace = {
    show: function (frame) {
      if (!frame || !Array.isArray(frame.runners) || frame.runners.length < 2 ||
          typeof document.createElement !== 'function' || !window.WebGLRenderingContext) return 0;
      unmount();
      pendingCommand = 0;
      latestFrame = frame;
      var sequence = ++loadSequence;
      var node = document.createElement('iframe');
      node.setAttribute('title', 'HorseDays 専用3Dレース中継');
      node.setAttribute('allow', 'autoplay');
      node.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;height:100dvh;border:0;display:block;z-index:2147483000;background:#0d1a13;opacity:0;transition:opacity .16s linear;';
      node.addEventListener('error', function () { if (element === node) fail('iframe load error'); });
      element = node;
      // The iframe uses the same origin, so its renderer can call parent audio helpers safely.
      node.src = new URL('model-lab/race.html?live=1', document.baseURI).href;
      document.body.appendChild(node);
      startTimer = setTimeout(function () {
        if (element === node && loadSequence === sequence && !rendered) fail('renderer load timeout');
      }, 30000);
      return 1;
    },
    update: function (frame) {
      if (!element || !frame) return;
      latestFrame = frame;
      sendFrame(frame);
    },
    command: function () {
      var value = pendingCommand;
      pendingCommand = 0;
      return value;
    },
    hide: function () { unmount(); pendingCommand = 0; }
  };
})();
