/* ══════════════════════════════════════════════════ */
/*  DATA — cargada de la API real en initAdmin()      */
/* ══════════════════════════════════════════════════ */
let allPets = [];
let stats   = {};

/* ══════════════════════════════════════════════════ */
/*  TABLAS: orden por columna + paginación             */
/*  (compartido entre Usuarios y Roles — con miles de   */
/*  cuentas, listar todo de golpe traba el navegador)   */
/* ══════════════════════════════════════════════════ */
const PAGE_SIZE = 25;

function updateSortIndicators(theadSelector, state) {
  document.querySelectorAll(`${theadSelector} th[data-sort]`).forEach(th => {
    const key = th.dataset.sort;
    const active = key === state.sortKey;
    th.classList.toggle('sorted', active);
    const arrow = th.querySelector('.sort-arrow');
    if (arrow) arrow.textContent = active ? (state.sortDir === 1 ? '↑' : '↓') : '⇅';
  });
}

function renderPagerFooter(footerId, state, total, onChangeFn) {
  const el = document.getElementById(footerId);
  if (!el) return;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const start = total === 0 ? 0 : (state.page - 1) * PAGE_SIZE + 1;
  const end = Math.min(state.page * PAGE_SIZE, total);
  el.innerHTML = `
    <span>${total === 0 ? 'Sin resultados' : `${start}–${end} de ${total.toLocaleString('es-MX')}`}</span>
    <span style="display:flex; gap:6px;">
      <button class="btn btn-ghost btn-sm" ${state.page <= 1 ? 'disabled' : ''} onclick="${onChangeFn}(${state.page - 1})">‹ Anterior</button>
      <span style="align-self:center; color:var(--gray-2);">Página ${state.page} de ${totalPages}</span>
      <button class="btn btn-ghost btn-sm" ${state.page >= totalPages ? 'disabled' : ''} onclick="${onChangeFn}(${state.page + 1})">Siguiente ›</button>
    </span>`;
}

/* Espera a que la persona deje de escribir antes de mandar la búsqueda al
   servidor — la búsqueda pasó de filtrar un arreglo ya en memoria (gratis)
   a pedirle una página nueva a la API en cada letra (ya no es gratis). */
function debounce(fn, wait) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
}

function compactNum(n) {
  n = Number(n) || 0;
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 10000)   return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return n.toLocaleString('es-MX');
}

function renderKpiRow() {
  const totalMascotas = stats.total_mascotas ?? 0;
  const totalDuenos   = stats.total_duenos ?? 0;
  const vacunados     = stats.vacunados ?? 0;
  const nuevosMes     = stats.registros_este_mes ?? 0;
  const perros = stats.por_especie?.perro ?? 0;
  const gatos  = stats.por_especie?.gato ?? 0;
  const pctVac = totalMascotas > 0 ? Math.round((vacunados / totalMascotas) * 100) : 0;

  const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setText('kpi-mascotas',        compactNum(totalMascotas));
  setText('kpi-mascotas-delta',  `${compactNum(perros)} perros · ${compactNum(gatos)} gatos`);
  setText('kpi-duenos',          compactNum(totalDuenos));
  setText('kpi-vacunados',       compactNum(vacunados));
  setText('kpi-vacunados-delta', `${pctVac}% del padrón`);
  setText('kpi-nuevos',          compactNum(nuevosMes));
}

let faqData = [];
let avisoData = [];
let editingFaqId = null;

// El Grullo coordinates: ~19.8056, -104.2139
const EL_GRULLO = [19.8056, -104.2139];
// Distribución circular pareja alrededor del centro (ángulos iguales entre
// las 40 colonias sin coordenada real + radio variado para verse natural),
// para que ningún lado del mapa se vea vacío por casualidad — siguen sin
// ser coordenadas agrimensadas, solo mejor repartidas que el primer intento.
const colonias = {
  'El Grullo centro':      [19.8056, -104.2139],
  '10 de mayo':            [19.8141, -104.2139],
  '7 de abril':            [19.8169, -104.2120],
  'Ayuquila':              [19.8193, -104.2092],
  'Charco de los adobes':  [19.8140, -104.2094],
  'Colomitos':             [19.8156, -104.2062],
  'Colomos':               [19.8164, -104.2024],
  'Del álamo':             [19.8116, -104.2051],
  'Del sur':               [19.8116, -104.2014],
  'El Aguacate':           [19.8106, -104.1975],
  'El álamo':              [19.8073, -104.2022],
  'El Cacalote':           [19.8056, -104.1989],
  'El cerrito':            [19.8042, -104.2044],
  'El Pedregal':           [19.8019, -104.2017],
  'Ixtlán':                [19.7988, -104.1997],
  'Jardines de manantlán': [19.7998, -104.2054],
  'Juan Canal':            [19.7965, -104.2042],
  'Juaquiniquil':          [19.7928, -104.2040],
  'La cañada':             [19.7960, -104.2087],
  'La Laja':               [19.7925, -104.2094],
  'La Puerta del Barro':   [19.7970, -104.2124],
  'La Quinta':             [19.7939, -104.2139],
  'Las flores':            [19.7911, -104.2163],
  'Las Pilas':             [19.7965, -104.2171],
  'Laureles':              [19.7944, -104.2200],
  'Lomas del Valle':       [19.7930, -104.2236],
  'Los pinos':             [19.7982, -104.2218],
  'Magisterial':           [19.7977, -104.2255],
  'Mirador del Rosal':     [19.7981, -104.2295],
  'Nueva creación':        [19.8021, -104.2254],
  'Oriente 1ra. Sección':  [19.8060, -104.2030],
  'Oriente 2da. Sección':  [19.8080, -104.2010],
  'Palma Sola':            [19.8034, -104.2290],
  'Palo Blanco':           [19.8056, -104.2238],
  'Patria':                [19.8075, -104.2268],
  'Pocito Santo':          [19.8103, -104.2293],
  'Residencial':           [19.8102, -104.2235],
  'San Isidro':            [19.8133, -104.2252],
  'San José':              [19.8170, -104.2260],
  'San Pedro':             [19.8145, -104.2208],
  'Santa Cecilia':         [19.8181, -104.2207],
  'Senderos del Manantial':[19.8141, -104.2168],
  'Teposilama':            [19.8174, -104.2159],
};

/* ══════════════════════════════════════════════════ */
/*  NAVIGATION                                        */
/* ══════════════════════════════════════════════════ */
const sections = {
  datos:       { title: 'Datos del Padrón',       sub: 'Mapa de mascotas · Gráficas · Seguimiento en tiempo real' },
  seguimiento: { title: 'Seguimiento de Mascotas', sub: 'Busca y gestiona el registro individual de cada mascota' },
  usuarios:    { title: 'Cuentas Ciudadanas',      sub: 'Consulta y gestiona las cuentas registradas de los ciudadanos' },
  roles:       { title: 'Roles y Cuentas', sub: 'Todas las cuentas de Ciudadano y Asistente — busca, activa/desactiva, o crea cuentas nuevas' },
  bitacora:    { title: 'Bitácora',                 sub: 'Registro de quién hizo cambios de rol, activó/desactivó cuentas, o dio de baja/editó una mascota ajena' },
  articulo:    { title: 'Nuevo Artículo',           sub: 'Crea y gestiona los tips de salud animal para ciudadanos' },
  config:      { title: 'Configuración del Sitio',  sub: 'Administra el contenido público del portal' },
  perfil:      { title: 'Mi perfil',                sub: 'Actualiza tus datos de contacto' },
};

function showAdmin(name) {
  Object.keys(sections).forEach(s => {
    const el = document.getElementById('sec-' + s);
    if (el) el.style.display = s === name ? 'block' : 'none';
  });
  document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
  document.getElementById('nav-' + name)?.classList.add('active');
  const info = sections[name] || {};
  document.getElementById('adminTitle').textContent = info.title || '';
  document.getElementById('adminSub').textContent   = info.sub   || '';

  if (name === 'datos' && !window._mapInit) initMap();
  if (name === 'seguimiento') loadSeguimiento();
  if (name === 'roles') loadRolesTable();
  if (name === 'usuarios') loadUsuariosTable();
  if (name === 'bitacora') loadBitacora();

  toggleSidebar(false);
}

/**
 * Menú deslizable del sidebar en móvil. Sin args alterna, con
 * booleano fuerza abrir/cerrar (usado al navegar o tocar el fondo).
 */
function toggleSidebar(force) {
  const sidebar  = document.getElementById('sidebar');
  const backdrop = document.getElementById('sidebarBackdrop');
  const open = typeof force === 'boolean' ? force : !sidebar.classList.contains('open');
  sidebar.classList.toggle('open', open);
  backdrop.classList.toggle('open', open);
}

// Accesibilidad: los enlaces del menú (role="button", sin href propio) no
// responden a Enter/Espacio por defecto como sí lo hace un <button> real
// — se delega aquí en vez de cablear cada uno por separado.
document.addEventListener('keydown', e => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[role="button"]') && e.target.tagName !== 'BUTTON') {
    e.preventDefault();
    e.target.click();
  }
});

