/* Base común de las demos de Girona: idioma CA/ES, estado "obert ara",
   apariciones al hacer scroll y visor de fotos. Script clásico (IIFE),
   sin módulos: funciona con doble clic y en cualquier hosting estático. */
(function () {
  "use strict";
  var root = document.documentElement;
  root.classList.add("js");

  function safe(fn, nombre) {
    try { fn(); } catch (e) { if (window.console) console.warn("[" + nombre + "]", e); }
  }
  var guardado = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { /* modo privado */ } }
  };

  var TXT = {
    ca: {
      obert: "Obert ara", tancat: "Tancat ara", fins: "fins a les", obre: "Obre", avui: "avui", dema: "demà", ales: "a les",
      dies: ["diumenge", "dilluns", "dimarts", "dimecres", "dijous", "divendres", "dissabte"]
    },
    es: {
      obert: "Abierto ahora", tancat: "Cerrado ahora", fins: "hasta las", obre: "Abre", avui: "hoy", dema: "mañana", ales: "a las",
      dies: ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"]
    }
  };
  var idioma = "ca";

  /* ---------- Horario y estado ---------- */
  var horari = null;
  function leerHorari() {
    var el = document.getElementById("dades-horari");
    if (!el) return null;
    try { return JSON.parse(el.textContent); } catch (e) { return null; }
  }
  function minutos(hhmm) { var p = hhmm.split(":"); return (+p[0]) * 60 + (+p[1]); }
  function ahoraMadrid() {
    var partes = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Madrid", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date());
    var d = {}; partes.forEach(function (p) { d[p.type] = p.value; });
    var dias = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return { dia: dias[d.weekday], min: (+d.hour % 24) * 60 + (+d.minute) };
  }
  function franjas(dia) {
    return (horari && horari[String(dia)]) || [];
  }
  function hora(m) { var h = Math.floor(m / 60), mm = m % 60; return h + ":" + (mm < 10 ? "0" : "") + mm; }
  function estado() {
    var t = TXT[idioma], ara = ahoraMadrid(), hoy = franjas(ara.dia), i, f, a, b;
    for (i = 0; i < hoy.length; i++) {
      f = hoy[i].split("-"); a = minutos(f[0]); b = minutos(f[1]);
      if (ara.min >= a && ara.min < b) return { obert: true, txt: t.obert, det: t.fins + " " + hora(b % 1440) };
    }
    for (var k = 0; k < 8; k++) {
      var dia = (ara.dia + k) % 7, fs = franjas(dia);
      for (i = 0; i < fs.length; i++) {
        a = minutos(fs[i].split("-")[0]);
        if (k === 0 && a <= ara.min) continue;
        var cuando = k === 0 ? t.avui : (k === 1 ? t.dema : t.dies[dia]);
        return { obert: false, txt: t.tancat, det: t.obre + " " + cuando + " " + t.ales + " " + hora(a) };
      }
    }
    return { obert: false, txt: t.tancat, det: "" };
  }
  function pintarEstado() {
    if (!horari) return;
    var e = estado();
    document.querySelectorAll("[data-estat]").forEach(function (el) {
      el.setAttribute("data-obert", e.obert ? "si" : "no");
      el.innerHTML = '<span class="estat-txt">' + e.txt + "</span>" + (e.det ? ' <span class="estat-det">' + e.det + "</span>" : "");
    });
    var hoy = ahoraMadrid().dia;
    document.querySelectorAll("[data-dia]").forEach(function (fila) {
      fila.classList.toggle("es-avui", +fila.getAttribute("data-dia") === hoy);
    });
  }

  /* ---------- Idioma ---------- */
  var ATRS = ["alt", "aria-label", "title", "content", "data-pie"];
  function ponerIdioma(l) {
    idioma = l === "es" ? "es" : "ca";
    root.lang = idioma;
    document.querySelectorAll("[data-es]").forEach(function (el) {
      if (!el.hasAttribute("data-ca")) el.setAttribute("data-ca", el.innerHTML);
      el.innerHTML = el.getAttribute(idioma === "es" ? "data-es" : "data-ca");
    });
    ATRS.forEach(function (a) {
      document.querySelectorAll("[data-es-" + a + "]").forEach(function (el) {
        if (!el.hasAttribute("data-ca-" + a)) el.setAttribute("data-ca-" + a, el.getAttribute(a) || "");
        el.setAttribute(a, el.getAttribute(idioma === "es" ? "data-es-" + a : "data-ca-" + a));
      });
    });
    document.querySelectorAll("[data-idioma]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-idioma") === idioma));
    });
    guardado.set("idioma", idioma);
    pintarEstado();
    document.dispatchEvent(new CustomEvent("idioma", { detail: idioma }));
  }

  /* ---------- Apariciones ---------- */
  // Lo que entra a la vez en pantalla aparece escalonado (70 ms entre uno y otro).
  function apariciones() {
    var els = document.querySelectorAll(".rv, .rv-foto");
    if (!("IntersectionObserver" in window)) { els.forEach(function (el) { el.classList.add("is-in"); }); return; }
    var io = new IntersectionObserver(function (entradas) {
      var n = 0;
      entradas.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        if (n > 0) {
          el.style.setProperty("--rv-d", Math.min(n, 6) * 70 + "ms");
          setTimeout(function () { el.style.removeProperty("--rv-d"); }, 1800);
        }
        n++;
        el.classList.add("is-in"); io.unobserve(el);
      });
    }, { threshold: 0, rootMargin: "0px 0px -6% 0px" }); // umbral 0: los recortes que empiezan sin área (círculo, persiana…) dan siempre 0 %
    els.forEach(function (el) { io.observe(el); });
    // Red de seguridad: nada se queda escondido aunque falle el observador.
    setTimeout(function () { els.forEach(function (el) { el.classList.add("is-in"); }); }, 6000);
  }

  var quieto = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var ahorro = !!(navigator.connection && navigator.connection.saveData);

  /* ---------- Portada y cabecera ---------- */
  // Con portada a pantalla completa la cabecera va transparente encima y se vuelve
  // sólida (con el logo) al dejarla atrás; la barra de botones del móvil entra entonces.
  function portada() {
    var p = document.querySelector(".portada-media, [data-portada-fosca]");
    if (!p) return;
    var sec = p.closest(".portada, [data-portada-fosca]") || p, barra = document.querySelector(".barra");
    root.classList.add("amb-portada");
    var lim = 0, pendiente = false;
    function medir() { lim = sec.offsetTop + sec.offsetHeight - (barra ? barra.offsetHeight : 0) - 2; mirar(); }
    function mirar() { pendiente = false; root.classList.toggle("passada", window.scrollY > lim); }
    window.addEventListener("scroll", function () { if (!pendiente) { pendiente = true; requestAnimationFrame(mirar); } }, { passive: true });
    window.addEventListener("resize", medir);
    medir();
  }

  /* ---------- Vídeos en bucle ---------- */
  // muted loop playsinline, sin controles. Se cargan y arrancan al verse y se paran al salir.
  // Con "reducir movimiento" o ahorro de datos se queda el póster.
  function videos() {
    var vs = [].slice.call(document.querySelectorAll("video[data-auto]"));
    if (!vs.length || quieto || ahorro || !("IntersectionObserver" in window)) return;
    var vistos = [];
    function jugar(v) {
      if (!v.getAttribute("src")) { v.src = v.getAttribute("data-src"); v.preload = "auto"; }
      v.muted = true;
      var pr = v.play(); if (pr && pr.catch) pr.catch(function () {});
    }
    var io = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        var v = en.target, i = vistos.indexOf(v);
        if (en.isIntersecting) { if (i < 0) vistos.push(v); if (!document.hidden) jugar(v); }
        else { if (i >= 0) vistos.splice(i, 1); if (!v.paused) v.pause(); }
      });
    }, { threshold: 0.08 });
    vs.forEach(function (v) { v.muted = true; v.setAttribute("muted", ""); io.observe(v); });
    document.addEventListener("visibilitychange", function () {
      vistos.forEach(function (v) { if (document.hidden) v.pause(); else jugar(v); });
    });
  }

  /* ---------- Fotos que se turnan ---------- */
  // [data-relleu="5600"] con varias <img>: cada pocos segundos se funde a la siguiente, solo si se ve.
  function relleus() {
    if (quieto || !("IntersectionObserver" in window)) return;
    document.querySelectorAll("[data-relleu]").forEach(function (box) {
      var imgs = [].slice.call(box.querySelectorAll(":scope > img"));
      if (imgs.length < 2) return;
      var cada = +box.getAttribute("data-relleu") || 5600, i = 0, t = null, retard = +box.getAttribute("data-retard") || 0;
      imgs.forEach(function (im, k) { if (k > 0) im.loading = "lazy"; });
      function pas() {
        var seg = imgs[(i + 1) % imgs.length];
        function canviar() { imgs[i].classList.remove("actiu"); i = (i + 1) % imgs.length; imgs[i].classList.add("actiu"); }
        if (seg.complete && seg.naturalWidth) canviar(); else { seg.loading = "eager"; seg.addEventListener("load", canviar, { once: true }); }
      }
      new IntersectionObserver(function (es) {
        es.forEach(function (en) {
          clearTimeout(t); clearInterval(t);
          if (en.isIntersecting) t = setTimeout(function () { pas(); t = setInterval(pas, cada); }, cada + retard);
        });
      }, { threshold: 0.2 }).observe(box);
    });
  }

  /* ---------- Visor de fotos ---------- */
  // Un <dialog> para toda la página (se crea si no está). Las fotos de un mismo
  // [data-galeria] (o de la misma sección) se recorren con flechas, teclado o deslizando.
  var IC = {
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    ant: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
    seg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>'
  };
  var ROT = {
    ca: { dlg: "Foto ampliada", x: "Tancar", ant: "Foto anterior", seg: "Foto següent" },
    es: { dlg: "Foto ampliada", x: "Cerrar", ant: "Foto anterior", seg: "Foto siguiente" }
  };
  function visor() {
    if (!document.querySelector("[data-visor]")) return;
    var vell = document.querySelector("dialog.visor");
    if (vell) vell.remove();
    var dlg = document.createElement("dialog");
    if (typeof dlg.showModal !== "function") return;
    dlg.className = "visor";
    dlg.innerHTML = '<button class="visor-tancar" type="button">' + IC.x + '</button>' +
      '<button class="visor-ant" type="button">' + IC.ant + '</button><button class="visor-seg" type="button">' + IC.seg + '</button>' +
      '<figure><div class="visor-foto"><img alt=""></div><figcaption class="visor-pie"><span class="visor-txt"></span><span class="visor-num"></span></figcaption></figure>';
    document.body.appendChild(dlg);
    var img = dlg.querySelector("img"), txt = dlg.querySelector(".visor-txt"), num = dlg.querySelector(".visor-num");
    var grup = [], idx = 0, origen = null;
    function rotular() {
      var r = ROT[idioma];
      dlg.setAttribute("aria-label", r.dlg);
      dlg.querySelector(".visor-tancar").setAttribute("aria-label", r.x);
      dlg.querySelector(".visor-ant").setAttribute("aria-label", r.ant);
      dlg.querySelector(".visor-seg").setAttribute("aria-label", r.seg);
    }
    document.addEventListener("idioma", function () { rotular(); if (dlg.open) mostrar(idx); });
    rotular();
    function mostrar(i) {
      idx = (i + grup.length) % grup.length;
      var a = grup[idx], mini = a.querySelector("img");
      img.classList.add("carregant");
      var nou = new Image();
      nou.onload = nou.onerror = function () { img.src = nou.src; img.alt = mini ? mini.alt : ""; img.classList.remove("carregant"); };
      nou.src = a.getAttribute("href");
      txt.textContent = a.getAttribute("data-pie") || (mini ? mini.alt : "");
      num.textContent = (idx + 1) + " / " + grup.length;
      [1, -1].forEach(function (d) { var b = grup[(idx + d + grup.length) % grup.length]; if (b) (new Image()).src = b.getAttribute("href"); });
    }
    document.addEventListener("click", function (ev) {
      var a = ev.target.closest("[data-visor]");
      if (!a) return;
      ev.preventDefault();
      var caixa = a.closest("[data-galeria]") || a.closest("section") || document;
      grup = [].slice.call(caixa.querySelectorAll("[data-visor]"));
      origen = a;
      dlg.classList.toggle("sol", grup.length < 2);
      mostrar(grup.indexOf(a));
      dlg.showModal();
    });
    dlg.querySelector(".visor-ant").addEventListener("click", function () { mostrar(idx - 1); });
    dlg.querySelector(".visor-seg").addEventListener("click", function () { mostrar(idx + 1); });
    dlg.addEventListener("keydown", function (ev) {
      if (ev.key === "ArrowLeft") mostrar(idx - 1);
      if (ev.key === "ArrowRight") mostrar(idx + 1);
    });
    var x0 = null, arrossegat = false;
    dlg.addEventListener("click", function (ev) {
      if (arrossegat) { arrossegat = false; return; }
      var t = ev.target;
      if (t === dlg || t.tagName === "FIGURE" || t.classList.contains("visor-foto") || t.closest(".visor-tancar")) dlg.close();
    });
    dlg.addEventListener("close", function () { if (origen) origen.focus({ preventScroll: true }); });
    dlg.addEventListener("pointerdown", function (ev) { x0 = ev.clientX; arrossegat = false; });
    dlg.addEventListener("pointerup", function (ev) {
      if (x0 === null) return;
      var dx = ev.clientX - x0; x0 = null;
      if (Math.abs(dx) > 10) arrossegat = true;
      if (Math.abs(dx) > 48 && grup.length > 1) mostrar(idx + (dx < 0 ? 1 : -1));
    });
  }

  function arrancar() {
    safe(function () { horari = leerHorari(); }, "horari");
    safe(function () {
      document.querySelectorAll("[data-idioma]").forEach(function (b) {
        b.addEventListener("click", function () { ponerIdioma(b.getAttribute("data-idioma")); });
      });
      ponerIdioma(guardado.get("idioma") || "ca");
    }, "idioma");
    safe(function () { pintarEstado(); setInterval(pintarEstado, 60000); }, "estat");
    safe(portada, "portada");
    safe(apariciones, "apariciones");
    safe(videos, "videos");
    safe(relleus, "relleus");
    safe(visor, "visor");
    safe(function () { document.querySelectorAll("[data-any]").forEach(function (el) { el.textContent = new Date().getFullYear(); }); }, "any");
  }
  window.__girona = { safe: safe, idioma: function () { return idioma; } };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", arrancar);
  else arrancar();
})();
