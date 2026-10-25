/* ══════════════════════════════════════════════════ */
/*  MAP (Leaflet + OpenStreetMap)                     */
/* ══════════════════════════════════════════════════ */
let leafletMap;
window._mapInit = false;

function initMap() {
  leafletMap = L.map('map', { zoomControl: true }).setView(EL_GRULLO, 14);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 18,
  }).addTo(leafletMap);

  // Marcador de tamaño variable según cuántas mascotas hay en esa colonia.
  // Un marcador por mascota individual no escala (con miles de registros el
  // mapa se vuelve inutilizable) — se agrega por colonia usando /api/stats,
  // igual que el mapa público de index.html.
  const orangeIcon = (size) => L.divIcon({
    className: '',
    html: `<div style="
      background:var(--orange);
      width:${size}px; height:${size}px;
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      border:3px solid white;
      box-shadow:0 2px 8px rgba(0,0,0,.3);
      display:flex; align-items:center; justify-content:center;
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });

  const porColonia = stats.por_colonia || [];
  const maxTotal = Math.max(1, ...porColonia.map(c => c.total));

  porColonia.forEach(({ colonia, total }) => {
    const colKey = Object.keys(colonias).find(k => k.toLowerCase() === (colonia || '').toLowerCase());
    const base   = colKey ? colonias[colKey] : EL_GRULLO;
    const size   = 24 + Math.round((total / maxTotal) * 24);
    L.marker(base, { icon: orangeIcon(size) })
      .addTo(leafletMap)
      .bindPopup(`
        <div style="font-family:'Inter',sans-serif; min-width:150px;">
          <div style="font-weight:700; font-size:.9rem; margin-bottom:4px;">
            ${colonia || 'Sin colonia'}
          </div>
          <div style="font-size:.78rem; color:#666; margin-bottom:8px;">
            <b>${total}</b> mascota${total === 1 ? '' : 's'} registrada${total === 1 ? '' : 's'}
          </div>
          <button class="btn btn-primary btn-sm" style="width:100%; font-size:.76rem; padding:6px 10px;" onclick='abrirMascotasColonia(${JSON.stringify(colonia || '')})'>Ver mascotas →</button>
        </div>
      `);
  });

  // Add legend
  const legend = L.control({ position: 'topright' });
  legend.onAdd = () => {
    const div = L.DomUtil.create('div');
    div.style.cssText = 'background:white;padding:8px 12px;border-radius:8px;font-size:.72rem;box-shadow:0 2px 8px rgba(0,0,0,.1);font-family:Inter,sans-serif;';
    div.innerHTML = `
      <div style="margin-bottom:4px;"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#F27A00;margin-right:6px;"></span>Activo</div>
    `;
    return div;
  };
  legend.addTo(leafletMap);

  window._mapInit = true;
  setTimeout(() => leafletMap.invalidateSize(), 100);
}

/* Lista real de mascotas de una colonia, al darle "Ver mascotas →" en el
   popup del mapa — antes el popup solo mostraba el total, sin forma de
   ver cuáles eran. Reutiliza el filtro ?colonia= que ya tenía mascotas.php. */
async function abrirMascotasColonia(colonia) {
  document.getElementById('mapaColoniaTitulo').textContent = colonia ? `Mascotas en ${colonia}` : 'Mascotas sin colonia registrada';
  const lista = document.getElementById('mapaColoniaLista');
  lista.innerHTML = '<div style="padding:20px; text-align:center; color:var(--gray-2);">Cargando...</div>';
  openModal('modal-mapa-colonia');

  try {
    const { rows } = await apiGetTodasMascotas({ colonia, page: 1, pageSize: 100 });
    if (rows.length === 0) {
      lista.innerHTML = '<div style="padding:20px; text-align:center; color:var(--gray-2);">No se encontraron mascotas en esta colonia.</div>';
      return;
    }
    lista.innerHTML = rows.map(pet => `
      <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; padding:10px 12px; border:1px solid var(--gray-4); border-radius:var(--radius); cursor:pointer;"
           onclick="closeModal('modal-mapa-colonia'); goToSeguimiento(${JSON.stringify(pet.nombre)})" title="Ver en Seguimiento">
        <div style="display:flex; align-items:center; gap:10px;">
          <svg class="icon-line" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0; color:var(--orange);"><circle cx="11" cy="4" r="2" /><circle cx="18" cy="8" r="2" /><circle cx="20" cy="16" r="2" /><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z" /></svg>
          <div>
            <div style="font-weight:600; font-size:.88rem;">${pet.nombre}</div>
            <div style="font-size:.76rem; color:var(--gray-2);">${pet.persona || '—'} · ${capitalize(pet.especie)}${pet.raza ? ' · ' + pet.raza : ''}</div>
          </div>
        </div>
        ${pet.vacunado
          ? '<span class="badge badge-green" style="font-size:.68rem; flex-shrink:0;">Vacunado</span>'
          : '<span class="badge badge-red" style="font-size:.68rem; flex-shrink:0;">Sin vacunar</span>'}
      </div>`).join('');
  } catch (err) {
    lista.innerHTML = `<div style="padding:20px; text-align:center; color:var(--red); display:flex; align-items:center; justify-content:center; gap:6px;">${ICON_X_CIRCLE} ${err.message}</div>`;
  }
}

/* ══════════════════════════════════════════════════ */
/*  MINI BAR CHART                                    */
/* ══════════════════════════════════════════════════ */
function renderVacunacionPie() {
  // Antes se calculaba recorriendo TODAS las mascotas (allPets) en el
  // navegador solo para sacar 2 números — stats.php ya los trae listos.
  const total = stats.total_mascotas || 0;
  const vacunados = stats.vacunados || 0;
  const pct = total > 0 ? Math.round((vacunados / total) * 100) : 0;
  const deg = Math.round((pct / 100) * 360);

  const chart = document.getElementById('pie-vacunacion');
  if (chart) chart.style.background = `conic-gradient(var(--orange) 0deg ${deg}deg, #9E9E9E ${deg}deg 360deg)`;

  const center = document.getElementById('pie-vacunacion-center');
  if (center) center.textContent = `${pct}%`;

  const legVac = document.getElementById('pie-leg-vacunados');
  if (legVac) legVac.textContent = `Vacunados (${pct}%)`;

  const legSin = document.getElementById('pie-leg-sinvacunar');
  if (legSin) legSin.textContent = `Sin vacunar (${100 - pct}%)`;
}

function renderMiniBar() {
  // Distribución por raza: ya viene calculada de stats.php (por_raza) — antes
  // se recorrían TODAS las mascotas (allPets) en el navegador solo para esto.
  const PALETTE = ['#F27A00', '#FF9A2E', '#C96200', '#FF9800', '#FFB74D', '#BDBDBD'];
  const bars = (stats.por_raza || [])
    .map((r, i) => ({ label: r.raza, val: Number(r.total), color: PALETTE[i % PALETTE.length] }));

  const container = document.getElementById('miniBarChart');
  if (bars.length === 0) { container.innerHTML = '<div style="padding:12px; color:var(--gray-2); font-size:.82rem;">Aún no hay mascotas registradas.</div>'; return; }
  const max = Math.max(...bars.map(b => b.val));
  container.innerHTML = bars.map(b => `
    <div class="hbar-row">
      <div class="hbar-label" title="${b.label}">${b.label}</div>
      <div class="hbar-track">
        <div class="hbar-fill" data-pct="${Math.round((b.val/max)*100)}" style="width:0%; background:${b.color};"></div>
      </div>
      <div class="hbar-val">${b.val}</div>
    </div>`).join('');

  // Animate bars after render
  requestAnimationFrame(() => {
    container.querySelectorAll('.hbar-fill').forEach(el => {
      el.style.width = el.dataset.pct + '%';
    });
  });
}

/* ══════════════════════════════════════════════════ */
/*  MINI TABLE (Datos section)                        */
/* ══════════════════════════════════════════════════ */
function renderMiniTable(data) {
  const tbody = document.getElementById('miniTableBody');
  tbody.innerHTML = data.map((pet, i) => `
    <tr onclick="goToSeguimiento('${pet.nombre}')" title="Ver seguimiento de ${pet.nombre}">
      <td>
        <div style="display:flex; align-items:center; gap:8px;">
          <span>${pet.especie === 'gato'
            ? '<svg class="icon-line" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5c.67 0 1.35.09 2 .26 1.78-2 5.03-2.84 6.42-2.26 1.4.58-.42 7-.42 7 .57 1.07 1 2.24 1 3.44C21 17.9 16.97 21 12 21s-9-3-9-7.56c0-1.25.5-2.4 1-3.44 0 0-1.89-6.42-.5-7 1.39-.58 4.72.23 6.5 2.23A9.04 9.04 0 0 1 12 5Z" /><path d="M8 14v.5" /><path d="M16 14v.5" /><path d="M11.25 16.25h1.5L12 17l-.75-.75Z" /></svg>'
            : '<svg class="icon-line" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11.25 16.25h1.5L12 17z" /><path d="M16 14v.5" /><path d="M4.42 11.247A13.152 13.152 0 0 0 4 14.556C4 18.728 7.582 21 12 21s8-2.272 8-6.444a11.702 11.702 0 0 0-.493-3.309" /><path d="M8 14v.5" /><path d="M8.5 8.5c-.384 1.05-1.083 2.028-2.344 2.5-1.931.722-3.576-.297-3.656-1-.113-.994 1.177-6.53 4-7 1.923-.321 3.651.845 3.651 2.235A7.497 7.497 0 0 1 14 5.277c0-1.39 1.844-2.598 3.767-2.277 2.823.47 4.113 6.006 4 7-.08.703-1.725 1.722-3.656 1-1.261-.472-1.855-1.45-2.239-2.5" /></svg>'}</span>
          <div>
            <div style="font-weight:600; font-size:.84rem;">${pet.nombre}</div>
            <div style="font-size:.72rem; color:var(--gray-2);">${pet.colonia || '—'}</div>
          </div>
        </div>
      </td>
      <td>
        ${pet.vacunado
          ? `<span class="badge badge-green" style="font-size:.68rem;">${ICON_SYRINGE} Sí</span>`
          : `<span class="badge badge-red" style="font-size:.68rem;">${ICON_X_CIRCLE} No</span>`}
      </td>
      <td>
        <button class="seguimiento-btn" onclick="event.stopPropagation(); goToSeguimiento('${pet.nombre}')" title="Ver seguimiento" aria-label="Ver seguimiento de ${pet.nombre}">${ICON_EYE}</button>
      </td>
    </tr>`).join('');
}

function filterMiniTable() {
  const q = document.getElementById('miniSearch').value.toLowerCase();
  const data = allPets.filter(m =>
    m.nombre.toLowerCase().includes(q) ||
    (m.persona && m.persona.toLowerCase().includes(q)) ||
    m.id.toLowerCase().includes(q)
  );
  renderMiniTable(data.slice(0, 10));
}

function goToSeguimiento(nombre) {
  document.getElementById('segSearch').value = nombre;
  seguimientoState.q = nombre;
  seguimientoState.page = 1;
  showAdmin('seguimiento'); // ya dispara loadSeguimiento() con el filtro puesto
}

function filtrarPorEstatus(estatus) {
  document.getElementById('segFilterEstatus').value = estatus;
  filterSeguimiento();
}

/* ══════════════════════════════════════════════════ */
/*  REGISTROS NUEVOS EN EL TIEMPO (gráfica de líneas)  */
/* ══════════════════════════════════════════════════ */
/* Mascotas y ciudadanos dados de alta por día (7/30 días) o por mes
   (12 meses), de stats.php?serie=registros. SVG hecho a mano, igual que
   las demás gráficas del panel (sin librerías). Reglas de diseño: una
   sola escala (los dos son conteos), líneas de 2px, cuadrícula de 1px
   tenue, leyenda con el total del periodo, tooltip con TODAS las series
   en el día señalado, y la misma información en "Ver datos en tabla". */
const REG_SERIES = [
  { key: 'mascotas',   nombre: 'Mascotas',   color: 'var(--serie-mascotas)' },
  { key: 'ciudadanos', nombre: 'Ciudadanos', color: 'var(--serie-ciudadanos)' },
];
const REG_SUBTITULO = { semana: 'últimos 7 días', mes: 'últimos 30 días', ano: 'últimos 12 meses' };
const REG_MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const REG_DIAS  = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const SVG_NS = 'http://www.w3.org/2000/svg';
let regDatos = null;
let regCargaId = 0;

// clave = 'YYYY-MM-DD' (por día) o 'YYYY-MM' (por mes). Se arma la fecha
// con sus partes (no con new Date('YYYY-MM-DD'), que la interpreta en UTC
// y en México la recorre un día hacia atrás).
function regEtiqueta(clave, larga) {
  const [y, m, d] = clave.split('-').map(Number);
  if (!d) return larga ? `${REG_MESES[m - 1]} ${y}` : REG_MESES[m - 1];
  const dia = REG_DIAS[new Date(y, m - 1, d).getDay()];
  return larga ? `${dia} ${d} ${REG_MESES[m - 1]} ${y}` : `${d} ${REG_MESES[m - 1]}`;
}

function regSvg(tag, attrs, padre) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  if (padre) padre.appendChild(el);
  return el;
}

// Línea corta del color de la serie (leyenda y tooltip) — el texto de al
// lado va en color de texto normal, nunca en el color de la serie.
function regKey(color) {
  const key = document.createElement('span');
  key.className = 'registros-key';
  key.style.background = color;
  return key;
}

// Tope "redondo" del eje Y y su paso: 0-1-2-3-4, 0-5-10-15-20, 0-20-40…
function regEscala(max) {
  if (max <= 4) return { tope: 4, paso: 1 };
  const bruto = max / 4;
  const pot = 10 ** Math.floor(Math.log10(bruto));
  const paso = [1, 2, 5, 10].map(f => f * pot).find(p => p >= bruto);
  return { tope: Math.ceil(max / paso) * paso, paso };
}

function renderRegistros() {
  const cont = document.getElementById('registros-grafica');
  if (!cont || !regDatos) return;
  const W = cont.clientWidth;
  if (W < 60) return; // pestaña oculta: el ResizeObserver vuelve a llamar al mostrarse
  const H = cont.clientHeight;
  const { puntos, totales, periodo } = regDatos;
  const n = puntos.length;
  const m = { t: 10, r: 14, b: 26, l: 34 };
  const anchoP = W - m.l - m.r, altoP = H - m.t - m.b;
  const maximo = Math.max(0, ...puntos.flatMap(p => REG_SERIES.map(s => p[s.key])));
  const { tope, paso } = regEscala(maximo);
  const x = i => m.l + (n === 1 ? anchoP / 2 : (i * anchoP) / (n - 1));
  const y = v => m.t + altoP - (v / tope) * altoP;

  document.getElementById('registros-sub').textContent = `Mascotas y ciudadanos dados de alta · ${REG_SUBTITULO[periodo]}`;

  // Leyenda: identidad (línea de color) + total del periodo.
  document.getElementById('registros-leyenda').replaceChildren(...REG_SERIES.map(s => {
    const item = document.createElement('div');
    item.className = 'registros-leyenda-item';
    const nombre = document.createElement('span');
    nombre.textContent = s.nombre;
    const total = document.createElement('strong');
    total.textContent = totales[s.key];
    item.append(regKey(s.color), nombre, total);
    return item;
  }));

  cont.replaceChildren();
  const svg = regSvg('svg', {
    viewBox: `0 0 ${W} ${H}`, tabindex: '0', role: 'img',
    'aria-label': `Registros nuevos, ${REG_SUBTITULO[periodo]}: ${totales.mascotas} mascotas y ${totales.ciudadanos} ciudadanos. Usa las flechas para recorrer los días; la tabla de abajo tiene todos los valores.`,
  }, cont);

  // Cuadrícula + eje Y (tenues, 1px).
  for (let v = 0; v <= tope; v += paso) {
    regSvg('line', { x1: m.l, x2: W - m.r, y1: y(v), y2: y(v), stroke: v === 0 ? '#B0B0B0' : '#ECECEC', 'stroke-width': 1 }, svg);
    regSvg('text', { x: m.l - 8, y: y(v) + 4, 'text-anchor': 'end', 'font-size': 11, fill: '#7A7A7A' }, svg).textContent = v;
  }

  // Eje X: tantas etiquetas como quepan (~56px cada una), siempre la última.
  const cada = Math.max(1, Math.ceil(n / Math.max(1, Math.floor(anchoP / 56))));
  puntos.forEach((p, i) => {
    if ((n - 1 - i) % cada !== 0) return;
    const ancla = n > 1 && i === 0 ? 'start' : (n > 1 && i === n - 1 ? 'end' : 'middle');
    regSvg('text', { x: x(i), y: H - 6, 'text-anchor': ancla, 'font-size': 11, fill: '#7A7A7A' }, svg).textContent = regEtiqueta(p.clave, false);
  });

  // Líneas (2px) y, si hay pocos puntos, un marcador por punto.
  REG_SERIES.forEach(s => {
    const d = puntos.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p[s.key]).toFixed(1)}`).join('');
    regSvg('path', { d, fill: 'none', 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', style: `stroke:${s.color}` }, svg);
    if (n <= 12) {
      puntos.forEach((p, i) => regSvg('circle', { cx: x(i), cy: y(p[s.key]), r: 4, stroke: 'white', 'stroke-width': 2, style: `fill:${s.color}` }, svg));
    }
  });

  if (totales.mascotas === 0 && totales.ciudadanos === 0) {
    const vacio = document.createElement('div');
    vacio.className = 'registros-vacio';
    vacio.textContent = 'No hubo registros en este periodo.';
    cont.appendChild(vacio);
  }

  // Capa de hover: línea vertical que se pega al día más cercano + puntos +
  // tooltip con las dos series. Todo el ancho del área es zona de hover.
  const cruz = regSvg('line', { y1: m.t, y2: m.t + altoP, stroke: '#B0B0B0', 'stroke-width': 1, visibility: 'hidden' }, svg);
  const puntosHover = REG_SERIES.map(s => regSvg('circle', { r: 5, stroke: 'white', 'stroke-width': 2, style: `fill:${s.color}`, visibility: 'hidden' }, svg));
  const zona = regSvg('rect', { x: m.l - 10, y: 0, width: anchoP + 20, height: H, fill: 'transparent' }, svg);
  const tip = document.createElement('div');
  tip.className = 'registros-tip';
  tip.style.display = 'none';
  cont.appendChild(tip);
  let actual = -1;

  function mostrar(i) {
    actual = i;
    const p = puntos[i];
    cruz.setAttribute('x1', x(i));
    cruz.setAttribute('x2', x(i));
    cruz.setAttribute('visibility', 'visible');
    REG_SERIES.forEach((s, k) => {
      puntosHover[k].setAttribute('cx', x(i));
      puntosHover[k].setAttribute('cy', y(p[s.key]));
      puntosHover[k].setAttribute('visibility', 'visible');
    });
    const fecha = document.createElement('div');
    fecha.className = 'registros-tip-fecha';
    fecha.textContent = regEtiqueta(p.clave, true);
    tip.replaceChildren(fecha, ...REG_SERIES.map(s => {
      const fila = document.createElement('div');
      fila.className = 'registros-tip-fila';
      const valor = document.createElement('strong');
      valor.textContent = p[s.key];
      const nombre = document.createElement('span');
      nombre.textContent = s.nombre;
      fila.append(regKey(s.color), valor, nombre);
      return fila;
    }));
    tip.style.display = 'block';
    const izq = x(i) + 14 + tip.offsetWidth > W ? x(i) - 14 - tip.offsetWidth : x(i) + 14;
    tip.style.left = `${Math.max(0, izq)}px`;
  }
  function ocultar() {
    actual = -1;
    tip.style.display = 'none';
    cruz.setAttribute('visibility', 'hidden');
    puntosHover.forEach(c => c.setAttribute('visibility', 'hidden'));
  }
  const indiceEn = clientX => {
    const r = svg.getBoundingClientRect();
    const px = (clientX - r.left) * (W / r.width);
    return n === 1 ? 0 : Math.min(n - 1, Math.max(0, Math.round(((px - m.l) / anchoP) * (n - 1))));
  };
  zona.addEventListener('pointermove', e => mostrar(indiceEn(e.clientX)));
  zona.addEventListener('pointerleave', ocultar);
  svg.addEventListener('focus', () => mostrar(actual >= 0 ? actual : n - 1));
  svg.addEventListener('blur', ocultar);
  svg.addEventListener('keydown', e => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const desde = actual < 0 ? n - 1 : actual;
    mostrar(Math.min(n - 1, Math.max(0, desde + (e.key === 'ArrowRight' ? 1 : -1))));
  });

  // Tabla: los mismos valores, sin depender del hover ni del color.
  const tabla = document.createElement('table');
  const cab = tabla.createTHead().insertRow();
  ['Fecha', ...REG_SERIES.map(s => s.nombre)].forEach(t => {
    const th = document.createElement('th');
    th.textContent = t;
    cab.appendChild(th);
  });
  const cuerpo = tabla.createTBody();
  [...puntos].reverse().forEach(p => {
    const fila = cuerpo.insertRow();
    fila.insertCell().textContent = regEtiqueta(p.clave, true);
    REG_SERIES.forEach(s => { fila.insertCell().textContent = p[s.key]; });
  });
  const pie = tabla.createTFoot().insertRow();
  pie.insertCell().textContent = 'Total';
  REG_SERIES.forEach(s => {
    const c = pie.insertCell();
    c.textContent = totales[s.key];
    c.style.fontWeight = '700';
  });
  document.getElementById('registros-tabla').replaceChildren(tabla);
}

async function cargarRegistros(periodo) {
  const cont = document.getElementById('registros-grafica');
  if (!cont) return;
  const id = ++regCargaId;
  cont.classList.add('cargando'); // conserva la gráfica anterior, atenuada, mientras llega la nueva
  try {
    const datos = await apiGetRegistros(periodo);
    if (id !== regCargaId) return; // ya se pidió otro periodo después
    regDatos = datos;
    renderRegistros();
  } catch (err) {
    if (id !== regCargaId) return;
    if (!regDatos) {
      const aviso = document.createElement('div');
      aviso.className = 'registros-vacio';
      aviso.style.color = 'var(--red)';
      aviso.textContent = `No se pudieron cargar los registros: ${err.message}`;
      cont.replaceChildren(aviso);
    }
    showToast(`No se pudieron cargar los registros: ${err.message}`, 'error');
  } finally {
    if (id === regCargaId) cont.classList.remove('cargando');
  }
}

function initRegistros() {
  const cont = document.getElementById('registros-grafica');
  if (!cont) return;
  const botones = document.querySelectorAll('.registros-periodos button');
  botones.forEach(btn => {
    btn.addEventListener('click', () => {
      botones.forEach(b => {
        b.classList.toggle('activo', b === btn);
        b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
      });
      cargarRegistros(btn.dataset.periodo);
    });
  });
  // Redibuja al cambiar el ancho, y al mostrarse la pestaña Datos (que
  // empieza oculta y mide 0 px).
  let pendiente = false;
  new ResizeObserver(() => {
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(() => { pendiente = false; renderRegistros(); });
  }).observe(cont);
  cargarRegistros('mes');
}

