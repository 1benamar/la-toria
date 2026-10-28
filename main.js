/* La Tòria: el tique que suma. Cada tapa de la pizarra lleva − / + y el tique calcula el total
   (precios copiados de la pizarra: es para hacerse una idea, pueden cambiar). */
(function () {
  "use strict";
  var tq = document.querySelector("[data-tiquet]");
  if (!tq) return;
  var llista = tq.querySelector(".tq-linies");
  var linies = [].slice.call(llista.querySelectorAll("li"));
  var T = {
    ca: { mes: "Afegeix", menys: "Treu", buit: "Marca el que et ve de gust", res: "plats", neteja: "Esborra" },
    es: { mes: "Añade", menys: "Quita", buit: "Marca lo que te apetece", res: "platos", neteja: "Borrar" }
  };
  var q = linies.map(function () { return 0; });
  var preus = linies.map(function (li) { return parseFloat(li.querySelector("b").textContent.replace(",", ".")) || 0; });
  var total = document.createElement("div");
  total.className = "tq-total";
  total.innerHTML = '<p class="tq-total-fila"><span>TOTAL</span><b data-total>0,00 €</b></p><p class="tq-total-nota" data-nota></p><button type="button" class="tq-esborra" data-esborra hidden></button>';
  llista.parentNode.insertBefore(total, llista.nextSibling);
  var bTotal = total.querySelector("[data-total]"), nota = total.querySelector("[data-nota]"), esborra = total.querySelector("[data-esborra]");
  function t() { return T[document.documentElement.lang === "es" ? "es" : "ca"]; }
  function eur(x) { return x.toFixed(2).replace(".", ",") + " €"; }
  function pinta(bot) {
    var s = 0, n = 0;
    linies.forEach(function (li, i) {
      s += q[i] * preus[i]; n += q[i];
      li.querySelector("output").textContent = q[i];
      li.classList.toggle("triat", q[i] > 0);
      li.querySelector(".tq-menys").disabled = q[i] === 0;
    });
    bTotal.textContent = eur(s);
    nota.textContent = n ? n + " " + t().res : t().buit;
    esborra.hidden = !n;
    esborra.textContent = t().neteja;
    if (bot) { bTotal.classList.remove("bot"); void bTotal.offsetWidth; bTotal.classList.add("bot"); }
  }
  function rotula() {
    linies.forEach(function (li) {
      var nom = li.querySelector("span:not(.tq-quant)").textContent;
      li.querySelector(".tq-mes").setAttribute("aria-label", t().mes + ": " + nom);
      li.querySelector(".tq-menys").setAttribute("aria-label", t().menys + ": " + nom);
    });
  }
  linies.forEach(function (li, i) {
    var c = document.createElement("span");
    c.className = "tq-quant";
    c.innerHTML = '<button type="button" class="tq-menys">−</button><output aria-live="polite">0</output><button type="button" class="tq-mes">+</button>';
    li.insertBefore(c, li.firstChild);
    c.querySelector(".tq-mes").addEventListener("click", function () { q[i] = Math.min(9, q[i] + 1); pinta(true); });
    c.querySelector(".tq-menys").addEventListener("click", function () { q[i] = Math.max(0, q[i] - 1); pinta(true); });
  });
  esborra.addEventListener("click", function () { q = q.map(function () { return 0; }); pinta(true); });
  document.addEventListener("idioma", function () { rotula(); pinta(false); });
  rotula(); pinta(false);
})();

/* El cartel de neón de la portada dice OBERT o TANCAT según el horario real (lo pinta base.js en [data-estat]). */
(function () {
  "use strict";
  var neo = document.querySelector("[data-neo-estat]"), estat = document.querySelector("[data-estat]");
  if (!neo || !estat) return;
  var span = neo.querySelector("span");
  function pinta() {
    var obert = estat.getAttribute("data-obert") === "si", es = document.documentElement.lang === "es";
    span.textContent = obert ? (es ? "ABIERTO" : "OBERT") : (es ? "CERRADO" : "TANCAT");
    neo.classList.toggle("tancat", !obert);
  }
  pinta();
  setInterval(pinta, 30000);
  document.addEventListener("idioma", function () { setTimeout(pinta, 0); });
})();

/* 00:00: el interruptor apaga (y vuelve a encender) todos los neones de la página. */
(function () {
  "use strict";
  var b = document.querySelector("[data-interruptor]");
  if (!b) return;
  var txt = b.querySelector("[data-int-txt]"), root = document.documentElement;
  function rotula() {
    var apagat = b.getAttribute("aria-pressed") === "true", es = root.lang === "es";
    txt.textContent = apagat ? (es ? "Enciende el neón" : "Encén el neó") : (es ? "Apaga el neón" : "Apaga el neó");
  }
  b.addEventListener("click", function () {
    var apagat = b.getAttribute("aria-pressed") !== "true";
    b.setAttribute("aria-pressed", apagat ? "true" : "false");
    root.classList.toggle("neo-apagat", apagat);
    rotula();
  });
  document.addEventListener("idioma", rotula);
  rotula();
})();
