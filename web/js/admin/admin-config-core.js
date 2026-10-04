/* ══════════════════════════════════════════════════ */
/*  CONFIG TABS                                       */
/* ══════════════════════════════════════════════════ */
function switchConfig(tab, navItem) {
  document.querySelectorAll('.config-nav-item').forEach(n => n.classList.remove('active'));
  document.querySelectorAll('.config-panel').forEach(p => p.classList.remove('active'));
  if (navItem) navItem.classList.add('active');
  document.getElementById('cfg-' + tab).classList.add('active');

  // Run tab-specific init
  if (tab === 'seo')        { updateSeoPreview(); renderSeoChecklist(); }
  if (tab === 'tema')       { renderThemePreview(); }
  if (tab === 'apariencia') { buildIconSelectors(); }
}

/* ══════════════════════════════════════════════════ */
/*  MUNICIPIO                                         */
/* ══════════════════════════════════════════════════ */
function saveMunicipio() {
  const data = {
    nombre:     document.getElementById('mun-nombre').value.trim(),
    municipio:  document.getElementById('mun-municipio').value.trim(),
    estado:     document.getElementById('mun-estado').value.trim(),
    periodo:    document.getElementById('mun-periodo').value.trim(),
    presidente: document.getElementById('mun-presidente').value.trim(),
    dir_ma:     document.getElementById('mun-dir-ma').value.trim(),
    dir_inf:    document.getElementById('mun-dir-inf').value.trim(),
    credito:    document.getElementById('mun-credito').value.trim(),
    escudo_url: document.getElementById('escudo-url').value.trim(),
  };
  localStorage.setItem('padron_municipio_config', JSON.stringify(data));
  pushConfigToServer('padron_municipio_config', data);
  // Update nav badge
  document.querySelector('#cnav-municipio .config-nav-badge')?.remove();
  const badge = document.createElement('div');
  badge.className = 'config-nav-badge saved';
  document.getElementById('cnav-municipio').prepend(badge);
  showToast('Datos del municipio guardados correctamente', 'success');
}

function resetMunicipio() {
  localStorage.removeItem('padron_municipio_config');
  showToast('Datos del municipio restablecidos', 'info');
}

/* ══════════════════════════════════════════════════ */
/*  REGLAMENTO — persistido en el servidor            */
/* ══════════════════════════════════════════════════ */
function saveReglamento() {
  const data = {
    titulo:    document.getElementById('reg-titulo').value.trim(),
    contenido: document.getElementById('reg-contenido').value.trim(),
  };
  if (!data.titulo || !data.contenido) {
    showToast('El título y el contenido no pueden estar vacíos', 'error');
    return;
  }
  localStorage.setItem('padron_reglamento', JSON.stringify(data));
  pushConfigToServer('padron_reglamento', data);
  const stEl = document.getElementById('statusReglamento');
  if (stEl) stEl.innerHTML = '<div class="status-dot saved"></div> Reglamento guardado';
  showToast('Reglamento actualizado y publicado en el portal', 'success');
}

function loadReglamento() {
  const raw = localStorage.getItem('padron_reglamento');
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    if (data.titulo)    document.getElementById('reg-titulo').value = data.titulo;
    if (data.contenido) document.getElementById('reg-contenido').value = data.contenido;
  } catch (e) { /* ignore */ }
}

function previewMunImg(input, targetId) {
  const file = input.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const el = document.getElementById(targetId);
    el.innerHTML = `<img src="${e.target.result}" alt="Vista previa" style="width:100%;height:100%;object-fit:contain;" />`;
  };
  reader.readAsDataURL(file);
}

function applyEscudoUrl() {
  const url = document.getElementById('escudo-url').value.trim();
  if (!url) return;
  document.getElementById('escudo-preview').innerHTML =
    `<img src="${url}" alt="Escudo municipal" style="width:100%;height:100%;object-fit:contain;" onerror="this.parentNode.innerHTML='✕'" />`;
}

/* ══════════════════════════════════════════════════ */
/*  TEMA VISUAL                                       */
/* ══════════════════════════════════════════════════ */
let _currentColor = '#F27A00';
let _currentFont  = 'Inter';

function selectColor(hex, el) {
  _currentColor = hex;
  // Unselect all swatches
  document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
  if (el) el.classList.add('selected');
  // Update preview swatch
  const ps = document.getElementById('colorPreviewSwatch');
  const pc = document.getElementById('colorPreviewCode');
  if (ps) ps.style.background = hex;
  if (pc) pc.textContent = hex;
  renderThemePreview();
}

function selectFont(font, el) {
  _currentFont = font;
  document.querySelectorAll('.font-card').forEach(c => c.classList.remove('selected'));
  if (el) el.classList.add('selected');
  renderThemePreview();
}

function renderThemePreview() {
  const preview = document.getElementById('themePreview');
  if (!preview) return;
  preview.innerHTML = `
    <div style="font-family:'${_currentFont}',sans-serif;">
      <!-- Mini nav -->
      <div style="background:${_currentColor}; border-radius:8px 8px 0 0; padding:10px 14px; display:flex; align-items:center; gap:8px; margin-bottom:10px;">
        <span style="color:white; font-size:1.2rem; display:flex;">${ICON_PAW_PLACEHOLDER}</span>
        <span style="color:white; font-weight:700; font-size:.78rem;">Padrón de Mascotas</span>
      </div>
      <!-- Button preview -->
      <div style="display:flex; gap:8px; margin-bottom:10px; flex-wrap:wrap;">
        <button style="background:${_currentColor}; color:white; border:none; border-radius:6px; padding:7px 14px; font-size:.72rem; font-weight:700; cursor:pointer; font-family:inherit;">Registrarme →</button>
        <button style="background:transparent; color:${_currentColor}; border:1.5px solid ${_currentColor}; border-radius:6px; padding:7px 14px; font-size:.72rem; font-weight:700; cursor:pointer; font-family:inherit;">Ver más</button>
      </div>
      <!-- Stat card preview -->
      <div style="background:white; border:1px solid #e0e0e0; border-radius:10px; padding:12px; display:flex; gap:10px; align-items:center; margin-bottom:10px;">
        <div style="width:36px;height:36px;background:${_currentColor}20;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:1.1rem;color:${_currentColor};">${ICON_PAW_PLACEHOLDER}</div>
        <div>
          <div style="font-size:.65rem;color:#666;font-family:inherit;">Total de mascotas</div>
          <div style="font-size:1.2rem;font-weight:800;color:#1A1A2E;font-family:inherit;">342</div>
        </div>
      </div>
      <!-- Badge preview -->
      <div style="display:flex; gap:6px; flex-wrap:wrap;">
        <span style="background:${_currentColor}20;color:${_currentColor};border-radius:99px;padding:3px 10px;font-size:.65rem;font-weight:700; display:inline-flex; align-items:center; gap:3px;">${ICON_CHECK_CIRCLE} Activo</span>
        <span style="background:#E8F5E9;color:#388E3C;border-radius:99px;padding:3px 10px;font-size:.65rem;font-weight:700; display:inline-flex; align-items:center; gap:3px;">${ICON_SYRINGE} Vacunado</span>
      </div>
      <div style="margin-top:10px;font-size:.65rem;color:#666;font-family:inherit;">
        Fuente: <b>${_currentFont}</b> · Color: <b>${_currentColor}</b>
      </div>
    </div>`;
}

function saveTema() {
  const data = {
    color:      _currentColor,
    font:       _currentFont,
    darkmode:   document.getElementById('toggle-darkmode').checked,
    anim:       document.getElementById('toggle-anim').checked,
    radius:     document.getElementById('toggle-radius').checked,
    showFolio:  document.getElementById('toggle-folio').checked,
  };
  localStorage.setItem('padron_tema_config', JSON.stringify(data));
  pushConfigToServer('padron_tema_config', data);
  aplicarTemaVisual(); // aplica el color/bordes de inmediato, también aquí en el propio admin
  // Mark status bar
  const stEl = document.getElementById('statusTema');
  if (stEl) stEl.innerHTML = '<div class="status-dot saved"></div> Tema guardado';
  // Update nav badge
  document.querySelector('#cnav-tema .config-nav-badge')?.remove();
  const badge = document.createElement('div');
  badge.className = 'config-nav-badge saved';
  document.getElementById('cnav-tema').prepend(badge);
  showToast('Tema aplicado en todo el sitio.', 'success');
}

function resetTema() {
  localStorage.removeItem('padron_tema_config');
  pushConfigToServer('padron_tema_config', {});
  _currentColor = '#F27A00';
  _currentFont  = 'Inter';
  document.documentElement.style.removeProperty('--orange');
  document.documentElement.style.removeProperty('--orange-dark');
  document.documentElement.style.removeProperty('--orange-light');
  document.documentElement.style.removeProperty('--orange-pale');
  document.documentElement.style.removeProperty('--orange-rgb');
  document.documentElement.style.removeProperty('--brand-dark-1');
  document.documentElement.style.removeProperty('--brand-dark-2');
  document.documentElement.style.removeProperty('--brand-dark-3');
  document.documentElement.style.removeProperty('--brand-dark-4');
  document.documentElement.style.removeProperty('--radius-sm');
  document.documentElement.style.removeProperty('--radius');
  document.documentElement.style.removeProperty('--radius-lg');
  document.documentElement.style.removeProperty('--radius-xl');
  document.querySelectorAll('.color-swatch').forEach(s => { s.classList.remove('selected'); if (s.style.background.includes('242, 122') || s.style.background === 'rgb(242, 122, 0)') s.classList.add('selected'); });
  document.querySelectorAll('.font-card').forEach(c => { c.classList.remove('selected'); if (c.querySelector('.font-card-name')?.textContent === 'Inter') c.classList.add('selected'); });
  renderThemePreview();
  showToast('Tema restablecido al predeterminado', 'info');
}

// Restaura el tema guardado al abrir el panel (antes no se recordaba
// ni siquiera dentro del propio admin al recargar la página).
function loadTemaFromServer() {
  const raw = localStorage.getItem('padron_tema_config');
  if (!raw) return;
  try {
    const saved = JSON.parse(raw);
    if (saved && saved.color) {
      _currentColor = saved.color;
      _currentFont  = saved.font || 'Inter';
      document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
      document.querySelectorAll('.font-card').forEach(c => c.classList.remove('selected'));
      if (document.getElementById('toggle-darkmode')) document.getElementById('toggle-darkmode').checked = !!saved.darkmode;
      if (document.getElementById('toggle-anim'))     document.getElementById('toggle-anim').checked     = saved.anim !== false;
      if (document.getElementById('toggle-radius'))   document.getElementById('toggle-radius').checked   = saved.radius !== false;
      if (document.getElementById('toggle-folio'))    document.getElementById('toggle-folio').checked    = saved.showFolio !== false;
      renderThemePreview();
    }
  } catch (e) { /* ignore */ }
}

