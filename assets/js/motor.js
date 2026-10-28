/* Motor de movimiento e interacción de las demos de Girona (v3, 27-10-2026).
   GSAP 3.13 (ScrollTrigger, ScrollSmoother y SplitText) servido desde assets/js, como en Nácar
   y centroebm.com. Todo se activa con atributos y cada web elige lo suyo:

   Con GSAP (si no hay, o se pide reducir movimiento, o la URL lleva ?captura, todo queda quieto y visible):
     #smooth-wrapper > #smooth-content   scroll suave en escritorio con ratón
     [data-split] / [data-split="portada"] titular que entra línea a línea desde una máscara
     [data-reveal] (="esquerra"|"dreta"|"escala")  bloque que aparece; hermanos escalonados
     .marc > img                          foto que se asienta (escala 1,18 → 1) al entrar
     [data-speed="0.9"]                   paralaje (con el scroll suave)
     .franja > img                        paralaje de franja a todo el ancho
     [data-contar="4.8"]                  cifra que cuenta (coma decimal)
     [data-cinta] > .cinta-grup           cinta que gira y acelera con la velocidad del scroll
     [data-gira]                          anillo de texto que gira y acelera con el scroll
     [data-horitzontal] > .pista          sección fijada que avanza en horizontal (escritorio)
     [data-fixa="1.5"]                   sección fijada mientras --p va de 0 a 1
     [data-dibuixa] path[pathLength=1]    trazo que se dibuja con el scroll
     [data-iman]                          botón imantado (ratón)
     header[data-amaga]                   cabecera que se retira al bajar
   Sin GSAP (funcionan siempre):
     [data-escrub]                        pone --p (0→1) según el paso por pantalla, para efectos en CSS
     [data-arrossega]                     carrusel que se arrastra con el ratón, con inercia
     [data-slider]                        pasador de opiniones (flechas, puntos, deslizar, automático)
     [data-previsual] [data-img]          lista que enseña una foto flotante al pasar el ratón
     [data-lupa]                          lupa sobre una foto
     [data-llum]                          luz que sigue al cursor (--mx, --my)
     [data-tilt]                          inclinación 3D que sigue al ratón
     .velo                                velo de entrada que se retira al cargar
   v5 (28-10-2026):
     [data-capitol="19:00"] + [data-hud]  capítulos con hora: regla de horas que lleva a cada uno, reloj
                                          que corre con el scroll y --nit (0→1) en la raíz para el cielo
     [data-mascara="1.3"] > .mz-capa      portada fijada: la capa de letras crece hacia .mz-focus hasta
                                          que se ve el vídeo de debajo (--p de 0 a 1 para lo demás)
     [data-inercia] (="x")                se inclina con la velocidad del scroll y vuelve a su sitio
     [data-progres] (en cualquier sitio)  la raíz recibe --pg (0→1): cuánto se ha leído de la página
     [data-rasca] > img                   capa (harina) que se quita pasando el ratón o el dedo;
                                          [data-rasca-tot] la quita entera */
(function () {
  "use strict";
  var root = document.documentElement;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var quiet = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (/[?&]captura(&|$)/.test(location.search)) { root.classList.add("captura"); quiet = true; }
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var gsap = window.gsap, ST = window.ScrollTrigger;
  var smoother = null;
  var api = window.__motor = { smoother: null, refresh: function () { if (ST) ST.refresh(); } };
  if (gsap && ST && !quiet) root.classList.add("motor");
  function safe(fn, n) { try { fn(); } catch (e) { if (window.console) console.warn("[motor " + n + "]", e); } }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  /* ---------- Velo de entrada ---------- */
  function velo() {
    var v = $(".velo");
    if (!v) return;
    if (gsap && !quiet) gsap.to(v, { opacity: 0, duration: 0.8, delay: 0.25, ease: "power2.out", onComplete: function () { v.remove(); } });
    else v.remove();
  }

  /* ---------- --p según el paso por pantalla ---------- */
  function escrub() {
    var els = $$("[data-escrub]");
    if (!els.length) return;
    if (quiet) { els.forEach(function (el) { el.style.setProperty("--p", "1"); }); return; }
    var vis = [], pend = false;
    function calc() {
      pend = false;
      var vh = window.innerHeight;
      vis.forEach(function (el) {
        var r = el.getBoundingClientRect();
        var a = parseFloat(el.getAttribute("data-escrub-ini") || "0.1"), b = parseFloat(el.getAttribute("data-escrub-fi") || "0.7");
        var p = (vh - r.top) / (vh + r.height);
        el.style.setProperty("--p", clamp((p - a) / (b - a), 0, 1).toFixed(3));
      });
    }
    function demana() { if (!pend) { pend = true; requestAnimationFrame(calc); } }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { var i = vis.indexOf(e.target); if (e.isIntersecting && i < 0) vis.push(e.target); if (!e.isIntersecting && i >= 0) vis.splice(i, 1); });
      demana();
    }, { rootMargin: "10% 0px" });
    els.forEach(function (el) { el.style.setProperty("--p", "0"); io.observe(el); });
    window.addEventListener("scroll", demana, { passive: true });
    window.addEventListener("resize", demana);
  }

  /* ---------- Carrusel que se arrastra ---------- */
  function arrossega() {
    $$("[data-arrossega]").forEach(function (box) {
      var sec = box.closest("section") || box.parentElement;
      var ant = $("[data-arrossega-ant]", sec), seg = $("[data-arrossega-seg]", sec);
      function pas(d) { box.scrollBy({ left: d * box.clientWidth * 0.8, behavior: quiet ? "auto" : "smooth" }); }
      if (ant) ant.addEventListener("click", function () { pas(-1); });
      if (seg) seg.addEventListener("click", function () { pas(1); });
      if (!fine) return;
      var down = false, x0 = 0, s0 = 0, vx = 0, lx = 0, lt = 0, mogut = false, raf = 0;
      box.addEventListener("pointerdown", function (e) {
        if (e.pointerType !== "mouse" || e.button !== 0) return;
        down = true; mogut = false; x0 = lx = e.clientX; s0 = box.scrollLeft; vx = 0; lt = performance.now();
        cancelAnimationFrame(raf);
      });
      window.addEventListener("pointermove", function (e) {
        if (!down) return;
        var dx = e.clientX - x0;
        if (Math.abs(dx) > 4 && !mogut) { mogut = true; box.classList.add("arrossegant"); }
        if (!mogut) return;
        box.scrollLeft = s0 - dx;
        var t = performance.now(); vx = (e.clientX - lx) / Math.max(1, t - lt); lx = e.clientX; lt = t;
      });
      window.addEventListener("pointerup", function () {
        if (!down) return;
        down = false;
        box.classList.remove("arrossegant");
        if (!mogut || quiet) return;
        var v = -vx * 16;
        (function inercia() { if (Math.abs(v) < 0.5) return; box.scrollLeft += v; v *= 0.93; raf = requestAnimationFrame(inercia); })();
      });
      box.addEventListener("click", function (e) { if (mogut) { e.preventDefault(); e.stopPropagation(); mogut = false; } }, true);
      box.addEventListener("dragstart", function (e) { e.preventDefault(); });
    });
  }

  /* ---------- Pasador de opiniones ---------- */
  function slider() {
    $$("[data-slider]").forEach(function (s) {
      var pista = $(".slider-pista", s), slides = $$(".slide", s), punts = $(".slider-punts", s);
      if (!pista || slides.length < 2) return;
      var i = 0, t = null, dins = false, vist = false;
      var botons = slides.map(function (_, k) {
        if (!punts) return null;
        var b = document.createElement("button");
        b.type = "button"; b.setAttribute("aria-label", String(k + 1));
        b.addEventListener("click", function () { anar(k, true); });
        punts.appendChild(b); return b;
      });
      function anar(k, usuari) {
        i = (k + slides.length) % slides.length;
        pista.style.transform = "translateX(" + (-100 * i) + "%)";
        slides.forEach(function (sl, j) { sl.setAttribute("aria-hidden", String(j !== i)); sl.classList.toggle("actiu", j === i); });
        botons.forEach(function (b, j) { if (b) b.setAttribute("aria-current", String(j === i)); });
        if (usuari) programa();
      }
      function programa() {
        clearInterval(t);
        if (quiet || slides.length < 2) return;
        t = setInterval(function () { if (!dins && vist && !document.hidden) anar(i + 1); }, 6500);
      }
      var a = $("[data-slider-ant]", s), b = $("[data-slider-seg]", s);
      if (a) a.addEventListener("click", function () { anar(i - 1, true); });
      if (b) b.addEventListener("click", function () { anar(i + 1, true); });
      s.addEventListener("mouseenter", function () { dins = true; });
      s.addEventListener("mouseleave", function () { dins = false; });
      s.addEventListener("focusin", function () { dins = true; });
      s.addEventListener("focusout", function () { dins = false; });
      var x0 = null;
      s.addEventListener("pointerdown", function (e) { x0 = e.clientX; });
      s.addEventListener("pointerup", function (e) { if (x0 === null) return; var dx = e.clientX - x0; x0 = null; if (Math.abs(dx) > 50) anar(i + (dx < 0 ? 1 : -1), true); });
      new IntersectionObserver(function (es) { vist = es[0].isIntersecting; }).observe(s);
      anar(0); programa();
    });
  }

  /* ---------- Lista con foto flotante ---------- */
  function previsual() {
    if (!fine) return;
    $$("[data-previsual]").forEach(function (llista) {
      var flota = document.createElement("div");
      flota.className = "previsual-flota"; flota.setAttribute("aria-hidden", "true");
      flota.innerHTML = "<img alt=\"\">";
      document.body.appendChild(flota);
      var img = $("img", flota), x = 0, y = 0, cx = 0, cy = 0, raf = 0, on = false;
      function mou() {
        cx += (x - cx) * (quiet ? 1 : 0.16); cy += (y - cy) * (quiet ? 1 : 0.16);
        flota.style.transform = "translate3d(" + cx.toFixed(1) + "px," + cy.toFixed(1) + "px,0)";
        if (on || Math.abs(x - cx) > 0.5) raf = requestAnimationFrame(mou); else raf = 0;
      }
      $$("[data-img]", llista).forEach(function (it) {
        new Image().src = it.getAttribute("data-img");
        it.addEventListener("mouseenter", function (e) {
          img.src = it.getAttribute("data-img");
          if (!on) { cx = x = e.clientX; cy = y = e.clientY; }
          on = true; flota.classList.add("on"); if (!raf) raf = requestAnimationFrame(mou);
        });
        it.addEventListener("mouseleave", function () { on = false; flota.classList.remove("on"); });
      });
      llista.addEventListener("mousemove", function (e) { x = e.clientX; y = e.clientY; if (!raf) raf = requestAnimationFrame(mou); });
    });
  }

  /* ---------- Lupa ---------- */
  function lupa() {
    if (!fine) return;
    $$("[data-lupa]").forEach(function (box) {
      var img = $("img", box);
      if (!img) return;
      var zoom = parseFloat(box.getAttribute("data-lupa")) || 2.4;
      var lent = document.createElement("div");
      lent.className = "lupa-lent"; lent.setAttribute("aria-hidden", "true");
      box.appendChild(lent);
      box.addEventListener("mouseenter", function () { lent.style.backgroundImage = "url(\"" + (box.getAttribute("data-lupa-src") || img.currentSrc || img.src) + "\")"; });
      box.addEventListener("mousemove", function (e) {
        var r = img.getBoundingClientRect(), bx = box.getBoundingClientRect();
        var px = e.clientX - r.left, py = e.clientY - r.top, w = lent.offsetWidth;
        lent.style.left = (e.clientX - bx.left - w / 2) + "px";
        lent.style.top = (e.clientY - bx.top - w / 2) + "px";
        lent.style.backgroundSize = (r.width * zoom) + "px " + (r.height * zoom) + "px";
        lent.style.backgroundPosition = (-(px * zoom - w / 2)) + "px " + (-(py * zoom - w / 2)) + "px";
      });
    });
  }

  /* ---------- Luz que sigue al cursor ---------- */
  function llum() {
    $$("[data-llum]").forEach(function (el) {
      if (!fine) { el.classList.add("llum-sola"); return; }
      var x = 0.5, y = 0.4, cx = x, cy = y, raf = 0;
      function mou() {
        cx += (x - cx) * 0.12; cy += (y - cy) * 0.12;
        el.style.setProperty("--mx", (cx * 100).toFixed(2) + "%"); el.style.setProperty("--my", (cy * 100).toFixed(2) + "%");
        if (Math.abs(x - cx) + Math.abs(y - cy) > 0.001) raf = requestAnimationFrame(mou); else raf = 0;
      }
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect(); x = (e.clientX - r.left) / r.width; y = (e.clientY - r.top) / r.height;
        if (quiet) { cx = x; cy = y; }
        if (!raf) raf = requestAnimationFrame(mou);
      });
    });
  }

  /* ---------- Inclinación 3D ---------- */
  function tilt() {
    if (!fine || quiet) return;
    $$("[data-tilt]").forEach(function (el) {
      var zona = el.closest("[data-tilt-zona]") || el, max = parseFloat(el.getAttribute("data-tilt")) || 8;
      var rx = 0, ry = 0, cx = 0, cy = 0, raf = 0;
      function mou() {
        cx += (rx - cx) * 0.1; cy += (ry - cy) * 0.1;
        el.style.setProperty("--rx", cx.toFixed(2) + "deg"); el.style.setProperty("--ry", cy.toFixed(2) + "deg");
        if (Math.abs(rx - cx) + Math.abs(ry - cy) > 0.02) raf = requestAnimationFrame(mou); else raf = 0;
      }
      zona.addEventListener("pointermove", function (e) {
        var r = zona.getBoundingClientRect();
        ry = ((e.clientX - r.left) / r.width - 0.5) * 2 * max;
        rx = -((e.clientY - r.top) / r.height - 0.5) * 2 * max;
        if (!raf) raf = requestAnimationFrame(mou);
      });
      zona.addEventListener("pointerleave", function () { rx = ry = 0; if (!raf) raf = requestAnimationFrame(mou); });
    });
  }

  /* ---------- Pantalla de carga ----------
     .carrega con su dibujo propio; aquí solo se calcula --c (0→1) con las fuentes y las
     imágenes de la portada, durante al menos data-carrega-min ms (para que se vea la animación)
     y nunca más de 6 s. Al acabar se añade .surt (cada web anima la salida) y se quita. */
  function carrega() {
    var c = $(".carrega");
    if (!c) return Promise.resolve();
    if (quiet) { c.remove(); return Promise.resolve(); }
    root.classList.add("carregant");
    var pct = $("[data-carrega-pct]", c), t0 = performance.now();
    var MIN = +c.getAttribute("data-carrega-min") || 2200, MAX = 6000;
    var primera = $("main > section");
    var imgs = primera ? $$("img", primera).concat($$("img", c)) : [];
    var tasques = [document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()].concat(imgs.map(function (im) {
      return im.complete ? Promise.resolve() : new Promise(function (r) { im.addEventListener("load", r, { once: true }); im.addEventListener("error", r, { once: true }); });
    }));
    var fetes = 0;
    tasques.forEach(function (p) { p.then(function () { fetes++; }); });
    return new Promise(function (resol) {
      var vist = 0;
      (function pas() {
        var ara = performance.now() - t0;
        var obj = Math.min(fetes / tasques.length, Math.min(1, ara / MIN));
        if (ara > MAX) obj = 1;
        vist += (obj - vist) * 0.09;
        if (obj === 1 && 1 - vist < 0.005) vist = 1;
        c.style.setProperty("--c", vist.toFixed(3));
        if (pct) {
          var de = pct.getAttribute("data-de");
          pct.textContent = de !== null ? Math.round(+de + (+pct.getAttribute("data-a") - +de) * vist) : String(Math.round(vist * 100)).padStart(2, "0");
        }
        if (vist < 1) { requestAnimationFrame(pas); return; }
        c.classList.add("surt");
        root.classList.remove("carregant"); root.classList.add("carregat");
        resol();
        setTimeout(function () { c.remove(); }, +c.getAttribute("data-carrega-surt") || 1200);
      })();
    });
  }

  /* ---------- Capas que siguen al ratón (con translate, para no pisar otros transform) ---------- */
  function raton() {
    if (!fine || quiet) return;
    var st = $$("[data-raton]").map(function (el) { return { el: el, d: parseFloat(el.getAttribute("data-raton")) || 20, x: 0, y: 0 }; });
    if (!st.length) return;
    var mx = 0, my = 0, raf = 0;
    function mou() {
      var segueix = false;
      st.forEach(function (s) {
        var tx = mx * s.d, ty = my * s.d;
        s.x += (tx - s.x) * 0.08; s.y += (ty - s.y) * 0.08;
        s.el.style.translate = s.x.toFixed(1) + "px " + s.y.toFixed(1) + "px";
        if (Math.abs(tx - s.x) + Math.abs(ty - s.y) > 0.1) segueix = true;
      });
      raf = segueix ? requestAnimationFrame(mou) : 0;
    }
    document.addEventListener("pointermove", function (e) {
      mx = e.clientX / window.innerWidth - 0.5; my = e.clientY / window.innerHeight - 0.5;
      if (!raf) raf = requestAnimationFrame(mou);
    }, { passive: true });
  }

  /* ---------- Partículas (lienzo): bombolles, farina, sucre, purpurina, espurnes, pols ----------
     Se apartan del cursor y solo se mueven mientras se ven. */
  function particules() {
    if (quiet) return;
    $$("[data-particules]").forEach(function (box) {
      var tipus = box.getAttribute("data-particules"), col = box.getAttribute("data-particules-color") || "255,255,255";
      var N = +box.getAttribute("data-particules-n") || 46;
      var cv = document.createElement("canvas");
      cv.className = "particules"; cv.setAttribute("aria-hidden", "true");
      box.appendChild(cv);
      var ctx = cv.getContext("2d"), dpr = Math.min(2, window.devicePixelRatio || 1), W = 1, H = 1, ps = [], mx = -999, my = -999, on = false, raf = 0;
      function mida() { var r = box.getBoundingClientRect(); W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
      function nova(ini) {
        var puja = tipus === "bombolles" || tipus === "espurnes";
        var cau = tipus === "farina" || tipus === "sucre";
        return {
          x: Math.random() * W, y: ini ? Math.random() * H : (puja ? H + 10 : cau ? -10 : Math.random() * H),
          r: tipus === "bombolles" ? 2 + Math.random() * 5 : tipus === "purpurina" ? 0.8 + Math.random() * 2 : 1 + Math.random() * 2.2,
          vx: (Math.random() - 0.5) * 0.3, vy: puja ? -(0.35 + Math.random() * 0.9) : cau ? 0.25 + Math.random() * 0.6 : (Math.random() - 0.5) * 0.15,
          f: Math.random() * 6.28, g: Math.random() * 6.28
        };
      }
      function pas() {
        ctx.clearRect(0, 0, W, H);
        for (var i = 0; i < ps.length; i++) {
          var p = ps[i], dx = p.x - mx, dy = p.y - my, d2 = dx * dx + dy * dy;
          if (d2 < 10000) { var k = (10000 - d2) / 10000 * 2.4 / Math.sqrt(d2 + 1); p.x += dx * k; p.y += dy * k; }
          p.f += 0.02; p.x += p.vx + Math.sin(p.f) * 0.25; p.y += p.vy;
          if (tipus === "bombolles") { ctx.strokeStyle = "rgba(" + col + ",0.6)"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.28); ctx.stroke(); }
          else if (tipus === "sucre") { ctx.fillStyle = "rgba(" + col + ",0.85)"; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.f); ctx.fillRect(-p.r, -p.r, p.r * 2, p.r * 2); ctx.restore(); }
          else if (tipus === "purpurina") { var a = 0.35 + 0.65 * Math.abs(Math.sin(p.f * 2 + p.g)); ctx.fillStyle = "rgba(" + col + "," + a.toFixed(2) + ")"; ctx.beginPath(); ctx.moveTo(p.x, p.y - p.r * 2.4); ctx.lineTo(p.x + p.r * 0.6, p.y); ctx.lineTo(p.x, p.y + p.r * 2.4); ctx.lineTo(p.x - p.r * 0.6, p.y); ctx.closePath(); ctx.fill(); ctx.fillRect(p.x - p.r * 2.2, p.y - 0.4, p.r * 4.4, 0.8); }
          else if (tipus === "espurnes") { var b = Math.max(0, Math.min(1, p.y / H)); ctx.fillStyle = "rgba(" + col + "," + (0.2 + 0.8 * b).toFixed(2) + ")"; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.28); ctx.fill(); }
          else { ctx.fillStyle = "rgba(" + col + "," + (tipus === "farina" ? 0.45 : 0.3) + ")"; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.28); ctx.fill(); }
          if (p.y < -20 || p.y > H + 20 || p.x < -20 || p.x > W + 20) ps[i] = nova(false);
        }
        raf = on ? requestAnimationFrame(pas) : 0;
      }
      mida();
      for (var i = 0; i < N; i++) ps.push(nova(true));
      new IntersectionObserver(function (es) { on = es[0].isIntersecting && !document.hidden; if (on && !raf) raf = requestAnimationFrame(pas); }).observe(box);
      window.addEventListener("resize", mida);
      box.addEventListener("pointermove", function (e) { var r = box.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; });
      box.addEventListener("pointerleave", function () { mx = my = -999; });
    });
  }

  /* ---------- Aro del cursor con su rótulo sobre fotos y carruseles ([data-cursor]) ---------- */
  function cursor() {
    if (!fine) return;
    var el = document.createElement("div");
    el.className = "cursor-anell"; el.setAttribute("aria-hidden", "true"); el.innerHTML = "<span></span>";
    document.body.appendChild(el);
    var txt = el.firstChild, x = 0, y = 0, cx = 0, cy = 0, raf = 0, on = false;
    function mou() {
      cx += (x - cx) * (quiet ? 1 : 0.24); cy += (y - cy) * (quiet ? 1 : 0.24);
      el.style.transform = "translate3d(" + cx.toFixed(1) + "px," + cy.toFixed(1) + "px,0)";
      raf = Math.abs(x - cx) + Math.abs(y - cy) > 0.3 ? requestAnimationFrame(mou) : 0;
    }
    document.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse") return;
      x = e.clientX; y = e.clientY;
      var t = e.target.closest && e.target.closest("[data-cursor]");
      if (t) {
        if (!on) { cx = x; cy = y; }
        on = true;
        txt.textContent = (root.lang === "es" && t.getAttribute("data-cursor-es")) || t.getAttribute("data-cursor");
        el.classList.add("on");
      } else if (on) { on = false; el.classList.remove("on"); }
      if (!raf) raf = requestAnimationFrame(mou);
    }, { passive: true });
    document.addEventListener("mouseout", function (e) { if (!e.relatedTarget) { on = false; el.classList.remove("on"); } });
  }

  /* ---------- La semana: horario en franjas, cuenta atrás y mapa a demanda ---------- */
  function setmana() {
    var dades = document.getElementById("dades-horari");
    var boxes = $$("[data-setmana]"), comptes = $$("[data-compte]");
    if (!dades || (!boxes.length && !comptes.length)) return;
    var H; try { H = JSON.parse(dades.textContent); } catch (e) { return; }
    var DL = { ca: ["Diumenge", "Dilluns", "Dimarts", "Dimecres", "Dijous", "Divendres", "Dissabte"], es: ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"] };
    var T = { ca: { tanca: "Tanca d'aquí a", obre: "Obre d'aquí a", tancat: "Tancat", dies: "dies" }, es: { tanca: "Cierra en", obre: "Abre en", tancat: "Cerrado", dies: "días" } };
    function lang() { return root.lang === "es" ? "es" : "ca"; }
    function madrid() {
      var o = {};
      new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Madrid", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false })
        .formatToParts(new Date()).forEach(function (p) { o[p.type] = p.value; });
      return { dia: { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[o.weekday], min: (+o.hour % 24) * 60 + (+o.minute) };
    }
    function mn(s) { var p = s.split(":"); return +p[0] * 60 + +p[1]; }
    function hh(m) { m = m % 1440; return Math.floor(m / 60) + ":" + String(m % 60).padStart(2, "0"); }
    function franges(d) { return (H[String(d)] || []).map(function (f) { var x = f.split("-"), a = mn(x[0]), b = mn(x[1]); if (b <= a) b += 1440; return [a, b]; }); }
    function durada(m) {
      var l = lang();
      if (m >= 2880) return Math.floor(m / 1440) + " " + T[l].dies;
      var h = Math.floor(m / 60), r = m % 60;
      return (h ? h + " h " : "") + r + " min";
    }
    function pinta() {
      var l = lang(), ara = madrid();
      boxes.forEach(function (box) {
        var rg = (box.getAttribute("data-setmana") || "6-24").split("-").map(Number), A = rg[0] * 60, B = rg[1] * 60;
        var pc = function (m) { return Math.max(0, Math.min(100, (m - A) / (B - A) * 100)); };
        var marques = "";
        for (var h = rg[0]; h <= rg[1]; h += Math.max(2, Math.round((rg[1] - rg[0]) / 6))) marques += '<span style="left:' + pc(h * 60) + '%">' + (h % 24) + "h</span>";
        box.innerHTML = '<div class="sm-hores" aria-hidden="true">' + marques + "</div>" + [1, 2, 3, 4, 5, 6, 0].map(function (d) {
          var fr = franges(d), avui = d === ara.dia;
          return '<div class="sm-fila' + (avui ? " sm-avui" : "") + (fr.length ? "" : " sm-tancat") + '"><span class="sm-dia">' + DL[l][d] + '</span><span class="sm-pista" aria-hidden="true">' +
            fr.map(function (f) { return '<i style="left:' + pc(f[0]) + "%;width:" + (pc(f[1]) - pc(f[0])) + '%"></i>'; }).join("") +
            (avui ? '<b class="sm-ara" style="left:' + pc(ara.min) + '%"></b>' : "") + '</span><span class="sm-text">' +
            (fr.length ? fr.map(function (f) { return hh(f[0]) + "–" + hh(f[1]).replace(/^0:00$/, "24:00"); }).join(" · ") : T[l].tancat) + "</span></div>";
        }).join("");
      });
      if (comptes.length) {
        var txt = "";
        var dins = franges(ara.dia).filter(function (f) { return ara.min >= f[0] && ara.min < f[1]; })[0];
        if (dins) txt = T[l].tanca + " " + durada(dins[1] - ara.min);
        else {
          for (var k = 0; k < 8 && !txt; k++) {
            var d = (ara.dia + k) % 7, fr = franges(d);
            for (var i = 0; i < fr.length; i++) { var m = fr[i][0] + k * 1440 - ara.min; if (m > 0) { txt = T[l].obre + " " + durada(m); break; } }
          }
        }
        comptes.forEach(function (c) { c.textContent = txt; c.setAttribute("data-obert", dins ? "si" : "no"); });
      }
    }
    pinta();
    setInterval(pinta, 30000);
    document.addEventListener("idioma", pinta);
  }
  function mapa() {
    $$("[data-mapa-q]").forEach(function (box) {
      var b = $("[data-mapa-boto]", box);
      if (!b) return;
      b.addEventListener("click", function () {
        if ($("iframe", box)) return;
        var f = document.createElement("iframe");
        f.title = box.getAttribute("data-mapa-titol") || "Mapa";
        f.loading = "lazy"; f.referrerPolicy = "no-referrer-when-downgrade";
        f.src = "https://www.google.com/maps?q=" + encodeURIComponent(box.getAttribute("data-mapa-q")) + "&z=17&output=embed";
        f.addEventListener("load", function () { box.classList.add("viu"); });
        box.appendChild(f);
      });
    });
  }

  /* ---------- Enlaces internos con el scroll suave ---------- */
  function anclas() {
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest("a[href^=\"#\"]");
      if (!a || !smoother) return;
      var id = a.getAttribute("href");
      if (id.length < 2) return;
      var t = document.getElementById(id.slice(1));
      if (!t) return;
      e.preventDefault();
      var barra = $(".barra");
      smoother.scrollTo(t, true, "top " + ((barra ? barra.offsetHeight : 0) + 8) + "px");
    });
  }

  /* ---------- Capítulos con reloj ----------
     Cada [data-capitol] lleva su hora; el reloj va de una a la siguiente según por dónde se lee
     (00:00 después de las 23:00 cuenta como medianoche) y la regla del HUD lleva a cada capítulo. */
  function hud() {
    var caps = $$("[data-capitol]"), h = $("[data-hud]");
    if (!caps.length) return;
    function mn(s) { var p = String(s).split(":"); return +p[0] * 60 + +(p[1] || 0); }
    var hores = [], ant = -1;
    caps.forEach(function (c, i) {
      var m = mn(c.getAttribute("data-capitol"));
      while (m < ant) m += 1440;
      hores.push(m); ant = m;
      if (!c.id) c.id = "capitol-" + (i + 1);
    });
    var rel = h && $("[data-hud-hora]", h), nom = h && $("[data-hud-nom]", h), regla = h && $(".hud-regle", h), items = [];
    function nomDe(c) { return (root.lang === "es" && c.getAttribute("data-capitol-nom-es")) || c.getAttribute("data-capitol-nom") || ""; }
    if (regla) caps.forEach(function (c) {
      var li = document.createElement("li"), a = document.createElement("a");
      a.href = "#" + c.id;
      a.innerHTML = "<b>" + c.getAttribute("data-capitol") + "</b><span></span>";
      li.appendChild(a); regla.appendChild(li); items.push(a);
    });
    var actiu = -1, ultim = "";
    function rotula() { items.forEach(function (a, k) { a.lastChild.textContent = nomDe(caps[k]); }); actiu = -1; }
    function calc() {
      var mig = window.innerHeight * 0.5, i = 0, f = 0, n = caps.length;
      var tops = caps.map(function (c) { return c.getBoundingClientRect().top; });
      for (var k = 0; k < n; k++) if (tops[k] <= mig) i = k;
      if (i < n - 1 && tops[i] <= mig) f = clamp((mig - tops[i]) / Math.max(1, tops[i + 1] - tops[i]), 0, 1);
      var m = hores[i] + (i < n - 1 ? (hores[i + 1] - hores[i]) * f : 0), tot = hores[n - 1] - hores[0];
      root.style.setProperty("--nit", (tot ? (m - hores[0]) / tot : 0).toFixed(4));
      if (h) h.style.setProperty("--hp", (n > 1 ? (i + f) / (n - 1) : 0).toFixed(4));
      var d = Math.floor(m) % 1440, txt = String(Math.floor(d / 60)).padStart(2, "0") + ":" + String(d % 60).padStart(2, "0");
      if (rel && txt !== ultim) { rel.textContent = txt; ultim = txt; }
      if (i !== actiu) {
        actiu = i;
        if (nom) nom.textContent = nomDe(caps[i]);
        items.forEach(function (a, k) {
          if (k === i) a.setAttribute("aria-current", "step"); else a.removeAttribute("aria-current");
          a.parentNode.classList.toggle("passat", k < i);
        });
      }
    }
    rotula(); calc();
    document.addEventListener("idioma", function () { rotula(); calc(); });
    // Con el scroll suave el contenido llega después que el scroll nativo: se recalcula cada fotograma
    if (gsap) gsap.ticker.add(calc);
    else { window.addEventListener("scroll", function () { requestAnimationFrame(calc); }, { passive: true }); window.addEventListener("resize", calc); }
  }

  /* ---------- --pg: cuánto se ha leído de la página ---------- */
  function progres() {
    if (!$("[data-progres]")) return;
    var pend = false;
    function calc() {
      pend = false;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      root.style.setProperty("--pg", (max > 0 ? clamp(window.scrollY / max, 0, 1) : 0).toFixed(4));
    }
    function demana() { if (!pend) { pend = true; requestAnimationFrame(calc); } }
    window.addEventListener("scroll", demana, { passive: true });
    window.addEventListener("resize", demana);
    calc();
  }

  /* ---------- Capa que se rasca ----------
     Encima de la foto se pinta una capa con grano (harina, por defecto) y un texto; el ratón la va
     quitando al pasar y el dedo al deslizar de lado. Cuando falta más de la mitad, se retira sola. */
  function rasca() {
    if (root.classList.contains("captura")) return;
    $$("[data-rasca]").forEach(function (box) {
      var cv = document.createElement("canvas");
      cv.className = "rasca-capa"; cv.setAttribute("aria-hidden", "true");
      box.appendChild(cv);
      var ctx = cv.getContext("2d"), W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1), net = false, ultim = null, n = 0;
      var col = box.getAttribute("data-rasca-color") || "243,236,222";
      function pinta() {
        var r = box.getBoundingClientRect();
        if (!r.width) return;
        W = r.width; H = r.height;
        cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = "rgb(" + col + ")"; ctx.fillRect(0, 0, W, H);
        // montoncitos de harina: manchas blancas suaves y alguna sombra
        for (var m = 0; m < 30; m++) {
          var mx = Math.random() * W, my = Math.random() * H, mr = 18 + Math.random() * Math.min(W, H) / 3.5;
          var mg = ctx.createRadialGradient(mx, my, 0, mx, my, mr), clar = Math.random() < 0.75;
          mg.addColorStop(0, clar ? "rgba(255,255,255,0.6)" : "rgba(160,140,110,0.18)"); mg.addColorStop(1, clar ? "rgba(255,255,255,0)" : "rgba(160,140,110,0)");
          ctx.fillStyle = mg; ctx.fillRect(mx - mr, my - mr, mr * 2, mr * 2);
        }
        for (var i = 0; i < W * H / 50; i++) {
          ctx.fillStyle = Math.random() < 0.55 ? "rgba(255,255,255," + (Math.random() * 0.7).toFixed(2) + ")" : "rgba(170,150,120," + (Math.random() * 0.35).toFixed(2) + ")";
          ctx.fillRect(Math.random() * W, Math.random() * H, 1.6, 1.6);
        }
        var txt = (root.lang === "es" && box.getAttribute("data-rasca-text-es")) || box.getAttribute("data-rasca-text");
        if (txt) {
          ctx.fillStyle = "rgba(110,88,60,0.62)"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
          // un signo suelto («?») va grande; una frase, a la medida del ancho
          var mida = txt.length <= 2 ? Math.min(W, H) / 2.4 : Math.max(18, Math.min(W / 14, 44));
          ctx.font = (txt.length <= 2 ? "400 " : "italic 500 ") + Math.round(mida) + "px " + (box.getAttribute("data-rasca-font") || "serif");
          ctx.fillText(txt, W / 2, H / 2);
        }
      }
      function treu(x, y) {
        var rad = Math.max(30, Math.min(W, H) / 8);
        ctx.globalCompositeOperation = "destination-out";
        var g = ctx.createRadialGradient(x, y, 0, x, y, rad);
        g.addColorStop(0, "rgba(0,0,0,0.9)"); g.addColorStop(0.55, "rgba(0,0,0,0.5)"); g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.fill();
        if (++n % 14 === 0) mira();
      }
      function mira() {
        var d = ctx.getImageData(0, 0, cv.width, cv.height).data, buit = 0, tot = 0;
        for (var i = 3; i < d.length; i += 4 * 37) { tot++; if (d[i] < 60) buit++; }
        if (tot && buit / tot > 0.5) acaba();
      }
      function acaba() {
        if (net) return;
        net = true; box.classList.add("rasca-neta");
        setTimeout(function () { cv.remove(); }, 900);
      }
      function pos(e) { var r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
      function ratlla(e) {
        var p = pos(e);
        if (ultim) {
          var dx = p[0] - ultim[0], dy = p[1] - ultim[1], st = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 12));
          for (var k = 1; k <= st; k++) treu(ultim[0] + dx * k / st, ultim[1] + dy * k / st);
        } else treu(p[0], p[1]);
        ultim = p;
      }
      cv.addEventListener("pointerdown", function (e) { ultim = null; ratlla(e); });
      cv.addEventListener("pointermove", function (e) { if (e.pointerType === "mouse" || e.pressure > 0) ratlla(e); });
      cv.addEventListener("pointerleave", function () { ultim = null; });
      cv.addEventListener("pointerup", function () { ultim = null; });
      var tot = $("[data-rasca-tot]", box.closest("[data-rasca-grup]") || box.parentElement);
      if (tot) tot.addEventListener("click", acaba);
      var amp = 0;
      new ResizeObserver(function () { var w = box.getBoundingClientRect().width; if (!net && Math.abs(w - amp) > 40) { amp = w; pinta(); } }).observe(box);
      document.addEventListener("idioma", function () { if (!net) pinta(); });
    });
  }

  /* ---------- Todo lo que va con GSAP ---------- */
  function moviment() {
    if (!gsap || !ST || quiet) { $$("[data-fixa]").forEach(function (s) { s.style.setProperty("--p", "1"); }); root.classList.add("motor-llest"); return; }
    gsap.registerPlugin(ST);
    var Suave = window.ScrollSmoother, Split = window.SplitText;
    if (Suave) gsap.registerPlugin(Suave);
    if (Split) gsap.registerPlugin(Split);

    if (Suave && $("#smooth-wrapper") && !ST.isTouch && window.innerWidth > 1000) {
      smoother = api.smoother = Suave.create({ wrapper: "#smooth-wrapper", content: "#smooth-content", smooth: 1.05, effects: true, ignoreMobileResize: true });
      root.classList.add("con-suave");
    }

    $$("[data-cinta]").forEach(function (p) { var g = $(".cinta-grup", p); if (g) p.appendChild(g.cloneNode(true)); });

    var mm = gsap.matchMedia();
    mm.add({ ample: "(min-width: 1001px)", estret: "(max-width: 1000px)" }, function (ctx) {
      var ample = ctx.conditions.ample, neteja = [];

      $$("[data-split]").forEach(function (el) {
        if (!Split) return;
        var linies = new Split(el, { type: "lines", mask: "lines", linesClass: "split-linia" }).lines;
        var portada = el.getAttribute("data-split") === "portada";
        gsap.from(linies, { yPercent: 115, duration: 1.1, ease: "power3.out", stagger: 0.09, delay: portada ? 0.3 : 0,
          scrollTrigger: portada ? null : { trigger: el, start: "top 88%", once: true } });
      });

      $$("[data-reveal]").forEach(function (el) {
        var germans = $$(":scope > [data-reveal]", el.parentElement), i = Math.max(0, germans.indexOf(el));
        // fromTo con el final explícito: mientras arranca, el CSS los tiene a opacidad 0
        var tipus = el.getAttribute("data-reveal"), de = { opacity: 0, y: 36 }, a = { opacity: 1, y: 0 };
        if (tipus === "esquerra") { de = { opacity: 0, x: -48 }; a = { opacity: 1, x: 0 }; }
        if (tipus === "dreta") { de = { opacity: 0, x: 48 }; a = { opacity: 1, x: 0 }; }
        if (tipus === "escala") { de = { opacity: 0, scale: 0.9 }; a = { opacity: 1, scale: 1 }; }
        var portada = el.closest("[data-portada]");
        gsap.fromTo(el, de, Object.assign(a, { duration: 1, ease: "power3.out", delay: (portada ? 0.45 : 0) + Math.min(i, 6) * 0.08,
          scrollTrigger: portada ? null : { trigger: el, start: "top 90%", once: true } }));
      });

      $$(".marc").forEach(function (m) {
        var img = $("img, video", m);
        if (img) gsap.from(img, { scale: 1.18, duration: 1.6, ease: "power2.out", scrollTrigger: { trigger: m, start: "top 92%", once: true } });
      });

      $$(".franja > img, .franja > video").forEach(function (img) {
        gsap.fromTo(img, { yPercent: -7 }, { yPercent: 7, ease: "none", scrollTrigger: { trigger: img.parentElement, start: "top bottom", end: "bottom top", scrub: true } });
      });

      if (!smoother) {
        $$("[data-speed]").forEach(function (el) {
          var s = parseFloat(el.getAttribute("data-speed")) || 1;
          if (s === 1 || !ample) return;
          gsap.to(el, { y: function () { return (1 - s) * window.innerHeight * 0.6; }, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } });
        });
      }

      $$("[data-contar]").forEach(function (n) {
        var fi = parseFloat(n.getAttribute("data-contar")), dec = (String(n.getAttribute("data-contar")).split(".")[1] || "").length;
        if (isNaN(fi)) return;
        var o = { v: 0 }, posa = function () { n.textContent = o.v.toFixed(dec).replace(".", ","); };
        posa();
        gsap.to(o, { v: fi, duration: 1.8, ease: "power2.out", onUpdate: posa, scrollTrigger: { trigger: n, start: "top 92%", once: true } });
      });

      $$("[data-cinta]").forEach(function (p) {
        var tw = gsap.to(p, { xPercent: -50, duration: parseFloat(p.getAttribute("data-cinta")) || 38, ease: "none", repeat: -1 });
        var torna;
        ST.create({ trigger: p, start: "top bottom", end: "bottom top", onUpdate: function (self) {
          gsap.to(tw, { timeScale: clamp(1 + Math.abs(self.getVelocity()) / 650, 1, 5) * (self.direction < 0 ? -1 : 1), duration: 0.3, overwrite: true });
          clearTimeout(torna);
          torna = setTimeout(function () { gsap.to(tw, { timeScale: 1, duration: 1.2, ease: "power2.out", overwrite: true }); }, 180);
        } });
      });

      $$("[data-gira]").forEach(function (g) {
        var tw = gsap.to(g, { rotation: 360, duration: parseFloat(g.getAttribute("data-gira")) || 26, ease: "none", repeat: -1, transformOrigin: "50% 50%" });
        var torna;
        ST.create({ trigger: g, start: "top bottom", end: "bottom top", onUpdate: function (self) {
          gsap.to(tw, { timeScale: clamp(1 + Math.abs(self.getVelocity()) / 400, 1, 8), duration: 0.25, overwrite: true });
          clearTimeout(torna);
          torna = setTimeout(function () { gsap.to(tw, { timeScale: 1, duration: 1.4, ease: "power2.out", overwrite: true }); }, 200);
        } });
      });

      // Portada de letras: la capa (negra, con el texto en blanco y mix-blend multiply) crece hacia el
      // centro de .mz-focus hasta que solo queda el vídeo; después se deja ver lo que pide --p
      $$("[data-mascara]").forEach(function (sec) {
        var capa = $(".mz-capa", sec), focus = $(".mz-focus", sec);
        if (!capa) return;
        var n = parseFloat(sec.getAttribute("data-mascara")) || 1.2, escala = parseFloat(sec.getAttribute("data-mascara-escala")) || 40;
        function origen() {
          var s = gsap.getProperty(capa, "scale");
          gsap.set(capa, { scale: 1 });
          var c = capa.getBoundingClientRect(), fr = (focus || capa).getBoundingClientRect();
          gsap.set(capa, { scale: s, transformOrigin: (fr.left - c.left + fr.width / 2).toFixed(1) + "px " + (fr.top - c.top + fr.height * 0.55).toFixed(1) + "px" });
        }
        sec.style.setProperty("--p", "0");
        origen();
        gsap.timeline({ scrollTrigger: { trigger: sec, start: "top top", end: "+=" + (n * 100) + "%", pin: true, scrub: 0.6, onRefreshInit: origen,
          onUpdate: function (self) { sec.style.setProperty("--p", self.progress.toFixed(3)); sec.classList.toggle("mz-fet", self.progress > 0.6); } } })
          .to(capa, { scale: escala, ease: "power3.in", duration: 0.68 })
          .to(capa, { opacity: 0, ease: "none", duration: 0.08 }, 0.6)
          .to({}, { duration: 0.32 });
      });

      // Sección que se queda fija mientras avanza --p de 0 a 1 (data-fixa = altura extra en pantallas)
      $$("[data-fixa]").forEach(function (sec) {
        var n = parseFloat(sec.getAttribute("data-fixa")) || 1;
        // data-fixa-ample: solo se fija en pantallas anchas; en el móvil --p avanza igual mientras la
        // sección sube y sale de la pantalla (sin fijarla, porque es más alta que la pantalla)
        if (sec.hasAttribute("data-fixa-ample") && !ample) {
          sec.style.setProperty("--p", "0");
          ST.create({ trigger: sec, start: "top top", end: sec.getAttribute("data-fixa-mobil") || "bottom 30%", scrub: 0.5,
            onUpdate: function (self) { sec.style.setProperty("--p", self.progress.toFixed(3)); } });
          return;
        }
        sec.style.setProperty("--p", "0");
        ST.create({ trigger: sec, start: "top top", end: "+=" + (n * 100) + "%", pin: true, scrub: true,
          onUpdate: function (self) { sec.style.setProperty("--p", self.progress.toFixed(3)); } });
      });

      // Inercia: lo marcado se inclina con la velocidad del scroll y vuelve con suavidad
      var inercia = $$("[data-inercia]");
      if (inercia.length) {
        var sk = { v: 0 }, posaY = gsap.quickSetter(inercia.filter(function (e) { return e.getAttribute("data-inercia") !== "x"; }), "skewY", "deg"),
          posaX = gsap.quickSetter(inercia.filter(function (e) { return e.getAttribute("data-inercia") === "x"; }), "skewX", "deg");
        ST.create({ start: 0, end: "max", onUpdate: function (self) {
          var v = clamp(self.getVelocity() / -300, -6, 6);
          if (Math.abs(v) > Math.abs(sk.v)) {
            sk.v = v;
            gsap.to(sk, { v: 0, duration: 0.9, ease: "power3", overwrite: true, onUpdate: function () { posaY(sk.v); posaX(sk.v * 1.4); } });
          }
        } });
        neteja.push(function () { gsap.set(inercia, { skewX: 0, skewY: 0 }); });
      }

      $$("[data-dibuixa]").forEach(function (box) {
        var paths = $$("path[pathLength]", box);
        gsap.fromTo(paths, { strokeDashoffset: 1 }, { strokeDashoffset: 0, ease: "none",
          scrollTrigger: { trigger: box, start: box.getAttribute("data-dibuixa-ini") || "top 75%", end: box.getAttribute("data-dibuixa-fi") || "bottom 45%", scrub: 0.6 } });
      });

      if (ample) {
        $$("[data-horitzontal]").forEach(function (sec) {
          var pista = $(".pista", sec);
          if (!pista) return;
          var dist = function () { return Math.max(0, pista.scrollWidth - pista.clientWidth); };
          sec.classList.add("fixada");
          gsap.to(pista, { x: function () { return -dist(); }, ease: "none",
            scrollTrigger: { trigger: sec, start: "top top", end: function () { return "+=" + dist(); }, pin: true, scrub: 0.8, invalidateOnRefresh: true } });
          neteja.push(function () { sec.classList.remove("fixada"); });
        });

        var barra = $("header[data-amaga]");
        if (barra) {
          ST.create({ start: "top top", end: "max", onUpdate: function (self) {
            var amaga = self.direction === 1 && self.scroll() > 420 && !barra.contains(document.activeElement);
            gsap.to(barra, { yPercent: amaga ? -110 : 0, duration: 0.45, ease: "power2.out", overwrite: true });
          } });
          neteja.push(function () { gsap.set(barra, { clearProps: "transform" }); });
        }

        if (fine) $$("[data-iman]").forEach(function (b) {
          var xTo = gsap.quickTo(b, "x", { duration: 0.5, ease: "power3" }), yTo = gsap.quickTo(b, "y", { duration: 0.5, ease: "power3" });
          var mou = function (e) { var r = b.getBoundingClientRect(); xTo((e.clientX - r.left - r.width / 2) * 0.25); yTo((e.clientY - r.top - r.height / 2) * 0.35); };
          var deixa = function () { xTo(0); yTo(0); };
          b.addEventListener("mousemove", mou); b.addEventListener("mouseleave", deixa);
          neteja.push(function () { b.removeEventListener("mousemove", mou); b.removeEventListener("mouseleave", deixa); });
        });
      }
      return function () { neteja.forEach(function (f) { f(); }); };
    });
    root.classList.add("motor-llest");
    ST.refresh();
    document.addEventListener("idioma", function () { setTimeout(function () { ST.refresh(); }, 60); });
    window.addEventListener("load", function () { ST.refresh(); });
  }

  function arrencar() {
    safe(escrub, "escrub");
    safe(arrossega, "arrossega");
    safe(slider, "slider");
    safe(previsual, "previsual");
    safe(lupa, "lupa");
    safe(llum, "llum");
    safe(tilt, "tilt");
    safe(anclas, "anclas");
    safe(raton, "raton");
    safe(particules, "particules");
    safe(cursor, "cursor");
    safe(setmana, "setmana");
    safe(mapa, "mapa");
    safe(hud, "hud");
    safe(progres, "progres");
    safe(rasca, "rasca");
    var fet = false;
    function mou() { if (fet) return; fet = true; safe(moviment, "moviment"); velo(); }
    // La portada se anima cuando sale la pantalla de carga (si la hay)
    var carregada = carrega();
    if (quiet || !gsap) carregada.then(mou);
    else carregada.then(function () {
      if (document.fonts && document.fonts.ready) { document.fonts.ready.then(mou); setTimeout(mou, 1500); } else mou();
    });
    // Red de seguridad: si algo falla, el contenido se ve igual
    setTimeout(function () {
      root.classList.add("motor-llest"); root.classList.remove("carregant");
      var v = $(".velo"); if (v) v.remove();
      var c = $(".carrega"); if (c) c.remove();
    }, 9000);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", arrencar); else arrencar();
})();
