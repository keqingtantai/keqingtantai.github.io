/* Walking Again — chapter page runtime: scaling, entrance, video, lightbox */
(function () {
  var stage = document.querySelector('.stage');
  function fit() {
    var w = window.innerWidth, h = window.innerHeight, s = Math.min(w / 1920, h / 1080);
    stage.style.transform = 'translate(' + ((w - 1920 * s) / 2) + 'px,' + ((h - 1080 * s) / 2) + 'px) scale(' + s + ')';
  }
  fit(); window.addEventListener('resize', fit);

  var inFrame = window.parent !== window;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var animate = inFrame && !reduce;
  var played = false;
  if (animate) document.documentElement.classList.add('js-anim');

  function enter() {
    if (played) return; played = true;
    var root = document.documentElement;
    var els = Array.prototype.slice.call(document.querySelectorAll('.a'));
    var step = Math.min(70, els.length > 1 ? 900 / (els.length - 1) : 70);
    els.forEach(function (el, i) { el.style.transitionDelay = (i * step) + 'ms'; });
    requestAnimationFrame(function () { root.classList.add('on'); });
  }
  function playVideos(on) {
    document.querySelectorAll('video').forEach(function (v) { if (on) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } else v.pause(); });
  }
  window.addEventListener('message', function (e) {
    if (e.data === 'in') { enter(); playVideos(true); document.dispatchEvent(new Event('pagein')); }
    else if (e.data === 'out') { playVideos(false); }
  });
  if (!inFrame) { document.addEventListener('DOMContentLoaded', function () { document.dispatchEvent(new Event('pagein')); }); setTimeout(function () { document.dispatchEvent(new Event('pagein')); }, 0); }

  document.addEventListener('click', function (e) {
    var img = e.target.closest && e.target.closest('img[data-full]');
    if (!img) return;
    var url = new URL(img.getAttribute('data-full'), location.href).href;
    if (inFrame) window.parent.postMessage({ lb: url }, '*'); else window.open(url, '_blank');
  });
})();
