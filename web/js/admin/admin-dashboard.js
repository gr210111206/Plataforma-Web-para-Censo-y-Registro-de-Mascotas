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

