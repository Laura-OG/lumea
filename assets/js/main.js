/* ==========================================================================
   Lumea — interações
   1. Parallax da foto do hero
   2. Revelar a foto escondida ao passar o mouse no hero
   3. Cursor brilhante nas seções depois do hero
   ========================================================================== */

(function () {
  'use strict';

  var CONFIG = {
    revealImage: 'assets/img/hero-revelar.webp',
    revealSize: 0.4,       // tamanho da mancha (fração da menor dimensão do hero)
    revealFade: 1.6,       // segundos para a mancha sumir
    parallaxSpeed: 0.35,   // quanto a foto do hero "atrasa" na rolagem
    trailColor: '#F5D264', // cor da ponta do rastro
    trailColor2: '#9976FF',// cor do fim do rastro
    trailLength: 36        // pontos do rastro (4 a 64)
  };

  var WHATSAPP_NUMBER = '5500000000000'; // TODO: número da Lumea com DDI e DDD, só dígitos

  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* Formulário: sem servidor, a mensagem é aberta no WhatsApp já preenchida */
  var form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var data = new FormData(form);
      var text = 'Olá, Lumea! Sou ' + (data.get('nome') || '') +
        ' (' + (data.get('email') || '') + ').\n\n' + (data.get('mensagem') || '');
      window.open('https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(text), '_blank', 'noopener');
    });
  }

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  var host = document.getElementById('hero');
  var imgLayer = document.getElementById('hero-img-layer');
  var revealCanvas = document.getElementById('hero-reveal');
  var zone = document.getElementById('glow-zone');
  var layer = document.getElementById('glow-layer');
  var trailCanvas = document.getElementById('glow-canvas');

  var t = 0;
  var last = performance.now();

  /* ---------- 2. Revelar ---------- */

  var ptr = { x: 0, y: 0, active: false };
  var reveal = new Image();
  reveal.src = CONFIG.revealImage;
  var mask = document.createElement('canvas');
  var mctx = null, mdata = null, alpha = null;
  var maskEmpty = true, cleared = false;

  function onHeroMove(e) {
    var r = host.getBoundingClientRect();
    ptr.x = (e.clientX - r.left) / 4;
    ptr.y = (e.clientY - r.top) / 4;
    ptr.active = true;
  }
  host.addEventListener('pointermove', onHeroMove);
  host.addEventListener('pointerdown', onHeroMove);
  host.addEventListener('pointerleave', function () { ptr.active = false; });

  function frameHero(dt) {
    var c = revealCanvas;
    if (!ptr.active && maskEmpty) {
      if (!cleared) {
        var cx0 = c.getContext('2d');
        cx0.setTransform(1, 0, 0, 1, 0, 0);
        cx0.clearRect(0, 0, c.width, c.height);
        cleared = true;
      }
      return;
    }
    cleared = false;
    var w = host.clientWidth, h = host.clientHeight;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var cw = Math.round(w * dpr), ch = Math.round(h * dpr);
    if (c.width !== cw || c.height !== ch) { c.width = cw; c.height = ch; }
    var mw = Math.ceil(w / 4), mh = Math.ceil(h / 4);
    if (!alpha || mask.width !== mw || mask.height !== mh) {
      mask.width = mw; mask.height = mh;
      alpha = new Float32Array(mw * mh);
      mctx = mask.getContext('2d');
      mdata = mctx.createImageData(mw, mh);
      var d0 = mdata.data;
      for (var i0 = 0; i0 < d0.length; i0 += 4) { d0[i0] = 255; d0[i0 + 1] = 255; d0[i0 + 2] = 255; d0[i0 + 3] = 0; }
    }
    var A = alpha, dec = (dt * 1.4) / CONFIG.revealFade, maxA = 0, i, v;
    for (i = 0; i < A.length; i++) { v = A[i] - dec; if (v < 0) v = 0; A[i] = v; if (v > maxA) maxA = v; }

    if (ptr.active) {
      var R = CONFIG.revealSize * Math.min(mw, mh);
      var k = Math.min(1, dt * 60);
      for (var n = 0; n < 6; n++) {
        var a = (n / 6) * Math.PI * 2 + t * 0.7;
        var off = R * 0.35 * (0.6 + 0.4 * Math.sin(t * 1.3 + n * 1.7));
        var cx = ptr.x + Math.cos(a) * off;
        var cy = ptr.y + Math.sin(a) * off;
        var rr = R * (0.5 + 0.15 * Math.sin(t * 2 + n));
        var x0 = Math.max(0, Math.floor(cx - rr)), x1 = Math.min(mw - 1, Math.ceil(cx + rr));
        var y0 = Math.max(0, Math.floor(cy - rr)), y1 = Math.min(mh - 1, Math.ceil(cy + rr));
        for (var y = y0; y <= y1; y++) {
          for (var x = x0; x <= x1; x++) {
            var dx = (x - cx) / rr, dy = (y - cy) / rr, d = Math.sqrt(dx * dx + dy * dy);
            if (d >= 1) continue;
            var sm = d * d * (3 - 2 * d);
            var idx = y * mw + x;
            v = A[idx] + 0.22 * (1 - sm) * k;
            if (v > 1) v = 1;
            A[idx] = v;
            if (v > maxA) maxA = v;
          }
        }
      }
    }
    maskEmpty = maxA <= 0;
    var D = mdata.data;
    for (i = 0; i < A.length; i++) D[i * 4 + 3] = (A[i] * 255) | 0;
    mctx.putImageData(mdata, 0, 0);

    var ctx = c.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, w, h);
    if (maskEmpty || !reveal.complete || !reveal.naturalWidth) return;
    var iw = reveal.naturalWidth, ih = reveal.naturalHeight;
    var s = Math.max(w / iw, h / ih);
    var dw = iw * s, dh = ih * s;
    ctx.drawImage(reveal, (w - dw) / 2, (h - dh) * 0.5, dw, dh);
    ctx.globalCompositeOperation = 'destination-in';
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(mask, 0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';
  }

  /* ---------- 1. Parallax ---------- */

  var lastY = -1;
  function frameParallax() {
    var r = host.getBoundingClientRect();
    var y = Math.max(0, Math.min(r.height, -r.top));
    if (y === lastY) return;
    lastY = y;
    imgLayer.style.transform = 'translate3d(0,' + (y * CONFIG.parallaxSpeed).toFixed(1) + 'px,0)';
  }

  /* ---------- 3. Cursor brilhante ---------- */

  var tr = { init: false, inside: false, lastInput: 0, fade: 0, parked: false, head: { x: 0, y: 0 }, target: { x: 0, y: 0 }, pts: [] };

  zone.addEventListener('pointermove', function (e) {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    var r = layer.getBoundingClientRect();
    var x = e.clientX - r.left, y = e.clientY - r.top;
    if (!tr.init) {
      tr.head.x = x; tr.head.y = y;
      for (var i = 0; i < 64; i++) tr.pts.push({ x: x, y: y });
      tr.init = true;
    }
    tr.target.x = x; tr.target.y = y;
    tr.inside = true;
    tr.lastInput = performance.now();
  });
  zone.addEventListener('pointerleave', function () { tr.inside = false; });

  function hexRgb(hex) {
    var v = String(hex || '').replace('#', '');
    if (v.length === 3) v = v.split('').map(function (ch) { return ch + ch; }).join('');
    var n = parseInt(v || '000000', 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  var C1 = hexRgb(CONFIG.trailColor), C2 = hexRgb(CONFIG.trailColor2);

  function frameTrail(dt, now) {
    var c = trailCanvas;
    if (!tr.init) return;
    var fadeTarget = tr.inside && (now - tr.lastInput) < 700 ? 1 : 0;
    tr.fade += (fadeTarget - tr.fade) * Math.min(1, dt * 5);
    if (!tr.inside && tr.fade < 0.004) {
      if (!tr.parked) {
        var cx = c.getContext('2d');
        cx.setTransform(1, 0, 0, 1, 0, 0);
        cx.clearRect(0, 0, c.width, c.height);
        tr.parked = true;
      }
      return;
    }
    tr.parked = false;
    var w = layer.clientWidth, h = layer.clientHeight;
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var cw = Math.round(w * dpr), ch = Math.round(h * dpr);
    if (c.width !== cw || c.height !== ch) { c.width = cw; c.height = ch; }

    var d = dt * 60;
    var headEase = 1 - Math.pow(1 - 0.12, d);
    var chainEase = 1 - Math.pow(1 - 0.33, d);
    tr.head.x += (tr.target.x - tr.head.x) * headEase;
    tr.head.y += (tr.target.y - tr.head.y) * headEase;
    var pts = tr.pts;
    pts[0].x = tr.head.x; pts[0].y = tr.head.y;
    for (var i = 1; i < pts.length; i++) {
      pts[i].x += (pts[i - 1].x - pts[i].x) * chainEase;
      pts[i].y += (pts[i - 1].y - pts[i].y) * chainEase;
    }

    var ctx = c.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, w, h);
    if (tr.fade <= 0.01) return;

    var n = Math.max(4, Math.min(64, CONFIG.trailLength));
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    for (var j = 0; j < n - 1; j++) {
      var p = j / (n - 1);
      var life = Math.pow(1 - p, 0.9) * tr.fade;
      var pulse = 1 + Math.sin(t * 3.3 - p * 11) * 0.16;
      var wd = 8 * (1 - 0.75 * Math.pow(p, 0.9));
      var r = Math.round(C1[0] + (C2[0] - C1[0]) * p);
      var g = Math.round(C1[1] + (C2[1] - C1[1]) * p);
      var b = Math.round(C1[2] + (C2[2] - C1[2]) * p);
      var a = pts[j], z = pts[j + 1];
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(z.x, z.y);
      ctx.strokeStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + (0.07 * life * pulse).toFixed(3) + ')';
      ctx.lineWidth = wd * 4.5; ctx.stroke();
      ctx.strokeStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + (0.55 * life * pulse).toFixed(3) + ')';
      ctx.lineWidth = wd; ctx.stroke();
      if (p < 0.35) {
        ctx.strokeStyle = 'rgba(255,255,255,' + (0.45 * life * (1 - p / 0.35)).toFixed(3) + ')';
        ctx.lineWidth = wd * 0.35; ctx.stroke();
      }
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  /* ---------- Loop ---------- */

  function tick(now) {
    var dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now; t += dt;
    frameParallax();
    frameHero(dt);
    frameTrail(dt, now);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
