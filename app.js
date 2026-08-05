/* ============ DATOS DEL NEGOCIO (según menú Velvet Frut) ============ */
const MENU = [
  {
    key: "frutosRojos", nombre: "Frutos Rojos", precio: 45, dot: "#8E2A45",
    gratis: ["Miel de abeja", "Jalea de fresa"],
    pagoPrecio: 5,
    pago: ["Nutella", "Oreo triturada", "Chispas de chocolate"],
  },
  {
    key: "huertoDulce", nombre: "Huerto Dulce", precio: 45, dot: "#4F7942",
    gratis: ["Miel de abeja", "Jalea de durazno"],
    pagoPrecio: 5,
    pago: ["Nutella", "Canelitas trituradas", "Chispas de chocolate"],
  },
  {
    key: "zeroCulpas", nombre: "Zero Culpas", precio: 55, dot: "#C96A2E",
    gratis: ["Amaranto tostado", "Semillas de chía"],
    pagoPrecio: 7,
    pago: ["Crema de cacahuate 100% natural", "Almendras fileteadas", "Chispas de chocolate oscuro"],
  },
];

const MATERIA_PRIMA = [
  { id: "vasos", cat: "Desechables", nombre: "Vasos 12 oz con tapa domo", meta: "1 pqte (50 pzas)", precio: 85 },
  { id: "cucharas", cat: "Desechables", nombre: "Cucharas de plástico", meta: "1 pqte (50 pzas)", precio: 30 },
  { id: "bolsitas", cat: "Desechables", nombre: "Bolsitas celofán", meta: "1 pqte", precio: 20 },
  { id: "granola", cat: "Bases", nombre: "Granola (Súper)", meta: "800 gr", precio: 65 },
  { id: "galleta", cat: "Bases", nombre: "Galleta María", meta: "1 kg", precio: 49 },
  { id: "mermFresa", cat: "Dulces", nombre: "Mermelada Fresa", meta: "440 gr", precio: 28 },
  { id: "mermChab", cat: "Dulces", nombre: "Mermelada Chabacano", meta: "440 gr", precio: 28 },
  { id: "miel", cat: "Dulces", nombre: "Miel de abeja", meta: "Frasco 1/2 litro", precio: 60 },
  { id: "canelitas", cat: "Toppings extras ($5)", nombre: "Canelitas", meta: "224 gr", precio: 26 },
  { id: "oreos", cat: "Toppings extras ($5)", nombre: "Oreos", meta: "1 paquete chico", precio: 10 },
  { id: "avellana", cat: "Toppings extras ($5)", nombre: "Crema de Avellana", meta: "Tarro 350 gr", precio: 70 },
  { id: "chispas", cat: "Toppings extras ($5)", nombre: "Chispas de Chocolate", meta: "150 gr", precio: 35 },
  { id: "almendra", cat: "Toppings extras ($5)", nombre: "Almendra Fileteada", meta: "100 gr", precio: 40 },
  { id: "amaranto", cat: "Toppings gratis", nombre: "Amaranto y Chía", meta: "Bolsitas chicas", precio: 30 },
  { id: "yogurNat", cat: "Lácteos", nombre: "Yogur Natural Lala 900g", meta: "2 botes", precio: 78 },
  { id: "yogurGriego", cat: "Lácteos", nombre: "Yogur Griego Lala s/azúcar 900g", meta: "1 bote", precio: 86 },
  { id: "fresa", cat: "Fruta", nombre: "Fresa", meta: "1/2 kilo", precio: 30 },
  { id: "cereza", cat: "Fruta", nombre: "Cereza en almíbar", meta: "450 gr", precio: 68 },
  { id: "manzana", cat: "Fruta", nombre: "Manzana Golden mediana", meta: "1 kilo (total)", precio: 58 },
  { id: "durazno", cat: "Fruta", nombre: "Duraznos en almíbar", meta: "450 gr", precio: 40 },
  { id: "mixFit", cat: "Fruta", nombre: "Plátano y Kiwi (Fruta Mix FIT)", meta: "Aprox. 1 kg total", precio: 60 },
];

const DIAS_VENTA = [1, 3, 5]; // lunes, miércoles, viernes (0=domingo)
const DIA_NOMBRE = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

/* ============ FIREBASE ============
   PERSONALIZA AQUÍ: crea un proyecto NUEVO (puede ser el mismo Google, no
   hace falta otro correo) en https://console.firebase.google.com →
   "Agregar proyecto" → dentro del proyecto: Compilación → Firestore
   Database → Crear base de datos (modo producción) → luego, en
   Configuración del proyecto → tus apps → ícono "</>" (Web), regístrala y
   pega aquí los 6 valores que te da. */
const firebaseConfig = {
  apiKey: "PON_AQUI_TU_API_KEY",
  authDomain: "PON_AQUI_TU_PROYECTO.firebaseapp.com",
  projectId: "PON_AQUI_TU_PROYECTO",
  storageBucket: "PON_AQUI_TU_PROYECTO.firebasestorage.app",
  messagingSenderId: "PON_AQUI_TU_MESSAGING_ID",
  appId: "PON_AQUI_TU_APP_ID",
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
// caché sin conexión: si vendes sin wifi/datos, la app sigue funcionando y
// sincroniza sola en cuanto vuelva la señal.
db.enablePersistence({ synchronizeTabs: true }).catch(() => {});

/* ============ PERSISTENCIA (Firestore, en tiempo real) ============ */
let materiaCache = {};
let ventasCache = [];

const store = {
  get materia() { return materiaCache; },
  get ventas() { return ventasCache; },
};

function saveMateria(precios) {
  db.collection("config").doc("materiaPrima").set(precios).catch((err) => {
    console.error("No se pudo guardar el precio:", err);
  });
}
function saveVenta(data) {
  return db.collection("ventas").doc(data.id).set(data);
}
function deleteVenta(id) {
  return db.collection("ventas").doc(id).delete();
}

// se actualiza sola en cuanto cambia algo en Firestore (aunque sea desde otro
// celular): no hace falta jalar/refrescar nada a mano.
db.collection("config").doc("materiaPrima").onSnapshot((doc) => {
  materiaCache = doc.exists ? doc.data() : {};
  renderSuper();
}, (err) => {
  console.error("No se pudo cargar la lista del súper:", err);
});

db.collection("ventas").onSnapshot((snap) => {
  ventasCache = [];
  snap.forEach((doc) => ventasCache.push(doc.data()));
  renderVentas();
  renderGanancias();
}, (err) => {
  console.error("No se pudieron cargar las clientas:", err);
});

function fmt(n) {
  return "$" + (Math.round(n * 100) / 100).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtInt(n) {
  return "$" + Math.round(n).toLocaleString("es-MX");
}
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function todayISO() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}
function parseISO(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/* ============ TABS ============ */
const panels = { super: document.getElementById("panel-super"), ventas: document.getElementById("panel-ventas"), ganancias: document.getElementById("panel-ganancias") };
const titles = {
  super: ["Lista del Súper", "Ingresa lo que te costó cada producto"],
  ventas: ["Control de Ventas", "Tus clientas y sus pedidos"],
  ganancias: ["Ganancias de la Semana", "Solo lunes, miércoles y viernes"],
};
document.querySelectorAll(".tabbar__item").forEach((btn) => {
  btn.addEventListener("click", () => {
    const tab = btn.dataset.tab;
    document.querySelectorAll(".tabbar__item").forEach((b) => b.classList.toggle("is-active", b === btn));
    Object.entries(panels).forEach(([key, el]) => (el.hidden = key !== tab));
    document.getElementById("pageTitle").textContent = titles[tab][0];
    document.getElementById("pageSubtitle").textContent = titles[tab][1];
    document.getElementById("fabNuevaClienta").hidden = tab !== "ventas";
  });
});
document.getElementById("fabNuevaClienta").hidden = false;

/* ============ SÚPER ============ */
function renderSuper() {
  const precios = store.materia;
  const cats = [...new Set(MATERIA_PRIMA.map((i) => i.cat))];
  const list = document.getElementById("superList");
  list.innerHTML = "";
  let granTotal = 0;

  cats.forEach((cat) => {
    const items = MATERIA_PRIMA.filter((i) => i.cat === cat);
    let subtotal = 0;
    const group = document.createElement("div");
    group.className = "cat-group";
    const itemsWrap = document.createElement("div");
    itemsWrap.className = "cat-group__items";

    items.forEach((item) => {
      const val = precios[item.id] !== undefined ? precios[item.id] : item.precio;
      subtotal += Number(val) || 0;
      const row = document.createElement("div");
      row.className = "item-row";
      row.innerHTML = `
        <div class="item-row__info">
          <div class="item-row__name">${item.nombre}</div>
          <div class="item-row__meta">${item.meta}</div>
        </div>
        <div class="item-row__input-wrap">
          <span>$</span>
          <input type="number" inputmode="decimal" min="0" step="0.01" value="${val}" data-id="${item.id}">
        </div>`;
      itemsWrap.appendChild(row);
    });

    granTotal += subtotal;
    group.innerHTML = `<div class="cat-group__header">
        <span class="cat-group__title">${cat}</span>
        <span class="cat-group__subtotal">${fmt(subtotal)}</span>
      </div>`;
    group.appendChild(itemsWrap);
    list.appendChild(group);
  });

  document.getElementById("superTotal").textContent = fmt(granTotal);

  list.querySelectorAll("input[data-id]").forEach((input) => {
    input.addEventListener("input", () => {
      const precios = Object.assign({}, materiaCache);
      precios[input.dataset.id] = input.value === "" ? 0 : parseFloat(input.value);
      materiaCache = precios; // respuesta instantánea mientras Firestore confirma
      saveMateria(precios);
      renderSuper();
      // mantener el foco tras re-render
      const again = list.querySelector(`input[data-id="${input.dataset.id}"]`);
      if (again) { again.focus(); again.setSelectionRange(again.value.length, again.value.length); }
    });
  });
}

/* ============ VENTAS ============ */
let ventasFiltro = "todas";
let editandoId = null;
let modalEstado = "pendiente";

function calcularTotal(venta) {
  let total = 0;
  MENU.forEach((m) => {
    const linea = venta.pedido[m.key];
    if (!linea || !linea.qty) return;
    total += linea.qty * m.precio;
    total += (linea.pago || []).length * m.pagoPrecio;
  });
  return total;
}

function renderVentas() {
  const ventas = store.ventas.slice().sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
  const cobrado = ventas.filter((v) => v.estado === "pagado").reduce((s, v) => s + calcularTotal(v), 0);
  const pendiente = ventas.filter((v) => v.estado === "pendiente").reduce((s, v) => s + calcularTotal(v), 0);
  document.getElementById("ventasCobrado").textContent = fmtInt(cobrado);
  document.getElementById("ventasPendiente").textContent = fmtInt(pendiente);

  const filtradas = ventasFiltro === "todas" ? ventas : ventas.filter((v) => v.estado === ventasFiltro);
  const list = document.getElementById("ventasList");
  list.innerHTML = "";
  document.getElementById("ventasEmpty").hidden = filtradas.length > 0;

  filtradas.forEach((v) => {
    const total = calcularTotal(v);
    const lineas = MENU.filter((m) => v.pedido[m.key] && v.pedido[m.key].qty > 0);

    const card = document.createElement("div");
    card.className = "client-card";
    card.style.borderLeftColor = lineas[0]?.dot || "#8E2A45";

    const flavorHtml = lineas
      .map((m) => `<span class="flavor-dot"><span class="flavor-dot__swatch" style="background:${m.dot}"></span>${v.pedido[m.key].qty}× ${m.nombre}</span>`)
      .join("");

    const toppingsTxt = lineas
      .map((m) => {
        const linea = v.pedido[m.key];
        const partes = [];
        if (linea.gratis) partes.push(linea.gratis);
        (linea.pago || []).forEach((t) => partes.push(`${t} (+$${m.pagoPrecio})`));
        return partes.length ? `${m.nombre}: ${partes.join(", ")}` : "";
      })
      .filter(Boolean)
      .join(" · ");

    const fechaObj = parseISO(v.fecha);
    card.innerHTML = `
      <div class="client-card__top">
        <div>
          <div class="client-card__name">${v.nombre}</div>
          <div class="client-card__date">${DIA_NOMBRE[fechaObj.getDay()]} ${fechaObj.getDate()}/${fechaObj.getMonth() + 1}</div>
        </div>
        <div class="client-card__total">${fmt(total)}</div>
      </div>
      <div class="client-card__flavors">${flavorHtml}</div>
      ${toppingsTxt ? `<div class="client-card__toppings">${toppingsTxt}</div>` : ""}
      <div class="client-card__bottom">
        <span class="status-badge status-badge--${v.estado}" data-toggle-id="${v.id}">${v.estado === "pagado" ? "Pagado" : "Pendiente"}</span>
      </div>`;

    card.addEventListener("click", (e) => {
      if (e.target.closest("[data-toggle-id]")) return;
      abrirModal(v);
    });
    card.querySelector("[data-toggle-id]").addEventListener("click", (e) => {
      e.stopPropagation();
      const nuevoEstado = v.estado === "pagado" ? "pendiente" : "pagado";
      db.collection("ventas").doc(v.id).update({ estado: nuevoEstado }).catch((err) => {
        console.error("No se pudo actualizar el estado:", err);
      });
    });

    list.appendChild(card);
  });
}

document.querySelectorAll(".filter-chip").forEach((btn) => {
  btn.addEventListener("click", () => {
    ventasFiltro = btn.dataset.filter;
    document.querySelectorAll(".filter-chip").forEach((b) => b.classList.toggle("is-active", b === btn));
    renderVentas();
  });
});

/* ---------- MODAL CLIENTA ---------- */
const modal = document.getElementById("modalClienta");
// modalPedido[key] = { qty, gratis, pago: [] }
let modalPedido = {};

function lineaVacia() { return { qty: 0, gratis: null, pago: [] }; }

function renderMenuSteppers() {
  const wrap = document.getElementById("menuSteppers");
  wrap.innerHTML = "";
  MENU.forEach((m) => {
    if (!modalPedido[m.key]) modalPedido[m.key] = lineaVacia();
    const linea = modalPedido[m.key];

    const block = document.createElement("div");
    block.className = "menu-stepper-block";

    const row = document.createElement("div");
    row.className = "menu-stepper";
    row.style.borderLeftColor = m.dot;
    row.innerHTML = `
      <div class="menu-stepper__info">
        <span class="menu-stepper__name">${m.nombre}</span>
        <span class="menu-stepper__price">$${m.precio}</span>
      </div>
      <div class="menu-stepper__controls">
        <button type="button" class="menu-stepper__btn" data-op="menos" data-key="${m.key}">–</button>
        <span class="menu-stepper__qty">${linea.qty}</span>
        <button type="button" class="menu-stepper__btn" data-op="mas" data-key="${m.key}">+</button>
      </div>`;
    block.appendChild(row);

    if (linea.qty > 0) {
      const panel = document.createElement("div");
      panel.className = "topping-panel";

      const gratisWrap = document.createElement("div");
      gratisWrap.innerHTML = `<p class="topping-panel__label">Topping gratis (elige 1)</p>`;
      const gratisChips = document.createElement("div");
      gratisChips.className = "chip-group";
      m.gratis.forEach((nombre) => {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "chip-toggle chip-toggle--gratis" + (linea.gratis === nombre ? " is-active" : "");
        chip.textContent = nombre;
        chip.addEventListener("click", () => {
          linea.gratis = linea.gratis === nombre ? null : nombre;
          renderMenuSteppers();
          actualizarTotalModal();
        });
        gratisChips.appendChild(chip);
      });
      gratisWrap.appendChild(gratisChips);
      panel.appendChild(gratisWrap);

      const pagoWrap = document.createElement("div");
      pagoWrap.innerHTML = `<p class="topping-panel__label">Toppings extra (+$${m.pagoPrecio} c/u)</p>`;
      const pagoChips = document.createElement("div");
      pagoChips.className = "chip-group";
      m.pago.forEach((nombre) => {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "chip-toggle chip-toggle--pago" + (linea.pago.includes(nombre) ? " is-active" : "");
        chip.textContent = `${nombre} +$${m.pagoPrecio}`;
        chip.addEventListener("click", () => {
          const idx = linea.pago.indexOf(nombre);
          if (idx >= 0) linea.pago.splice(idx, 1); else linea.pago.push(nombre);
          renderMenuSteppers();
          actualizarTotalModal();
        });
        pagoChips.appendChild(chip);
      });
      pagoWrap.appendChild(pagoChips);
      panel.appendChild(pagoWrap);

      block.appendChild(panel);
    }

    wrap.appendChild(block);
  });

  wrap.querySelectorAll("button[data-op]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const k = btn.dataset.key;
      const linea = modalPedido[k];
      if (btn.dataset.op === "mas") {
        linea.qty += 1;
      } else {
        linea.qty = Math.max(0, linea.qty - 1);
        if (linea.qty === 0) { linea.gratis = null; linea.pago = []; }
      }
      renderMenuSteppers();
      actualizarTotalModal();
    });
  });
}

function actualizarTotalModal() {
  let total = 0;
  MENU.forEach((m) => {
    const linea = modalPedido[m.key];
    if (!linea) return;
    total += linea.qty * m.precio;
    total += linea.pago.length * m.pagoPrecio;
  });
  document.getElementById("modalTotal").textContent = fmt(total);
}

function setEstadoModal(estado) {
  modalEstado = estado;
  document.querySelectorAll(".segmented__btn").forEach((b) => b.classList.toggle("is-active", b.dataset.estado === estado));
}
document.querySelectorAll(".segmented__btn").forEach((b) => b.addEventListener("click", () => setEstadoModal(b.dataset.estado)));

function abrirModal(venta) {
  editandoId = venta ? venta.id : null;
  document.getElementById("modalTitle").textContent = venta ? "Editar clienta" : "Nueva clienta";
  document.getElementById("inputNombre").value = venta ? venta.nombre : "";
  document.getElementById("inputFecha").value = venta ? venta.fecha : todayISO();
  modalPedido = {};
  MENU.forEach((m) => {
    const origen = venta ? venta.pedido[m.key] : null;
    modalPedido[m.key] = origen
      ? { qty: origen.qty || 0, gratis: origen.gratis || null, pago: [...(origen.pago || [])] }
      : lineaVacia();
  });
  setEstadoModal(venta ? venta.estado : "pendiente");
  document.getElementById("btnEliminar").hidden = !venta;

  renderMenuSteppers();
  actualizarTotalModal();
  checarDiaVenta();
  modal.hidden = false;
}

function cerrarModal() { modal.hidden = true; }

function checarDiaVenta() {
  const iso = document.getElementById("inputFecha").value;
  const hint = document.getElementById("fechaHint");
  if (!iso) { hint.textContent = ""; return; }
  const dow = parseISO(iso).getDay();
  hint.textContent = DIAS_VENTA.includes(dow) ? "" : `${DIA_NOMBRE[dow]}: normalmente no vendes este día`;
}
document.getElementById("inputFecha").addEventListener("change", checarDiaVenta);

document.getElementById("fabNuevaClienta").addEventListener("click", () => abrirModal(null));
document.getElementById("btnCancelar").addEventListener("click", cerrarModal);
modal.addEventListener("click", (e) => { if (e.target === modal) cerrarModal(); });

document.getElementById("btnGuardar").addEventListener("click", () => {
  const nombre = document.getElementById("inputNombre").value.trim();
  const fecha = document.getElementById("inputFecha").value || todayISO();
  if (!nombre) { document.getElementById("inputNombre").focus(); return; }
  const tieneAlgo = MENU.some((m) => modalPedido[m.key] && modalPedido[m.key].qty > 0);
  if (!tieneAlgo) { alert("Agrega al menos un producto al pedido."); return; }

  const pedido = {};
  MENU.forEach((m) => {
    const l = modalPedido[m.key];
    pedido[m.key] = { qty: l.qty, gratis: l.gratis, pago: [...l.pago] };
  });

  const esNueva = !editandoId;
  const data = {
    id: editandoId || uid(),
    nombre,
    fecha,
    pedido,
    estado: modalEstado,
    origen: "admin", // distingue de futuros pedidos que lleguen desde la PWA de clientas
    actualizadoEn: firebase.firestore.FieldValue.serverTimestamp(),
  };
  if (esNueva) data.creadoEn = firebase.firestore.FieldValue.serverTimestamp();

  const btnGuardar = document.getElementById("btnGuardar");
  btnGuardar.disabled = true;
  btnGuardar.textContent = "Guardando…";

  saveVenta(data)
    .then(() => {
      cerrarModal();
    })
    .catch((err) => {
      console.error("No se pudo guardar la clienta:", err);
      alert("No se pudo guardar. Revisa tu conexión e intenta de nuevo (tu información no se perdió, sigue en el formulario).");
    })
    .finally(() => {
      btnGuardar.disabled = false;
      btnGuardar.textContent = "Guardar";
    });
});

document.getElementById("btnEliminar").addEventListener("click", () => {
  if (!editandoId) return;
  if (!confirm("¿Eliminar esta clienta?")) return;
  deleteVenta(editandoId)
    .then(() => cerrarModal())
    .catch((err) => {
      console.error("No se pudo eliminar la clienta:", err);
      alert("No se pudo eliminar. Revisa tu conexión.");
    });
});

/* ============ GANANCIAS ============ */
let weekOffset = 0;

function getMonday(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}
function isoOf(d) {
  const x = new Date(d);
  x.setMinutes(x.getMinutes() - x.getTimezoneOffset());
  return x.toISOString().slice(0, 10);
}

function renderGanancias() {
  const monday = getMonday(new Date());
  monday.setDate(monday.getDate() + weekOffset * 7);
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);

  const rangeTxt = `${monday.getDate()}/${monday.getMonth() + 1} – ${sunday.getDate()}/${sunday.getMonth() + 1}`;
  document.getElementById("weekRange").textContent = rangeTxt;
  document.getElementById("weekBadge").hidden = weekOffset !== 0;

  const ventas = store.ventas.filter((v) => {
    const f = parseISO(v.fecha);
    return f >= monday && f <= sunday;
  });

  const ingreso = ventas.reduce((s, v) => s + calcularTotal(v), 0);
  const cobrado = ventas.filter((v) => v.estado === "pagado").reduce((s, v) => s + calcularTotal(v), 0);
  const pendiente = ventas.filter((v) => v.estado === "pendiente").reduce((s, v) => s + calcularTotal(v), 0);

  document.getElementById("ganIngreso").textContent = fmt(ingreso);
  document.getElementById("ganCobrado").textContent = fmtInt(cobrado);
  document.getElementById("ganPendiente").textContent = fmtInt(pendiente);
  document.getElementById("ganClientas").textContent = ventas.length;

  const diasWrap = document.getElementById("ganDias");
  diasWrap.innerHTML = "";
  DIAS_VENTA.forEach((dow) => {
    const fecha = new Date(monday);
    fecha.setDate(fecha.getDate() + (dow === 0 ? 6 : dow - 1));
    const delDia = ventas.filter((v) => v.fecha === isoOf(fecha));
    const totalDia = delDia.reduce((s, v) => s + calcularTotal(v), 0);
    const row = document.createElement("div");
    row.className = "day-row";
    row.innerHTML = `
      <div>
        <div class="day-row__name">${DIA_NOMBRE[dow]}</div>
        <div class="day-row__date">${fecha.getDate()}/${fecha.getMonth() + 1} · ${delDia.length} clienta${delDia.length === 1 ? "" : "s"}</div>
      </div>
      <div class="day-row__amount">${fmt(totalDia)}</div>`;
    diasWrap.appendChild(row);
  });

  const pendienteTotalGlobal = store.ventas.filter((v) => v.estado === "pendiente").reduce((s, v) => s + calcularTotal(v), 0);
  document.getElementById("quincenaNote").textContent = pendienteTotalGlobal > 0
    ? `Tienes ${fmt(pendienteTotalGlobal)} pendientes por cobrar en la quincena.`
    : "No tienes pagos pendientes por cobrar. ✨";
}

document.getElementById("weekPrev").addEventListener("click", () => { weekOffset--; renderGanancias(); });
document.getElementById("weekNext").addEventListener("click", () => { weekOffset++; renderGanancias(); });

/* ============ INSTALAR APP ============ */
let deferredInstallPrompt = null;
const installBtn = document.getElementById("installBtn");

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  installBtn.hidden = false;
});
installBtn.addEventListener("click", async () => {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  installBtn.hidden = true;
});
window.addEventListener("appinstalled", () => {
  installBtn.hidden = true;
});

/* ============ INIT ============ */
renderSuper();
renderVentas();
renderGanancias();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}
