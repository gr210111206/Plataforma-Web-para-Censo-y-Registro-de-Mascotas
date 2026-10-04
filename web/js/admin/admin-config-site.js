/* ══════════════════════════════════════════════════ */
/*  CONFIG DEL SITIO ↔ SERVIDOR (settings.php)         */
/* ══════════════════════════════════════════════════ */

// Claves que hoy vivían solo en localStorage y ahora también se
// guardan/leen del servidor, para que TODOS los visitantes vean
// los mismos cambios hechos desde este panel.
const SERVER_CONFIG_KEYS = [
  'padron_site_config',
  'padron_appearance_config',
  'padron_site_content',
  'padron_municipio_config',
  'padron_reglamento',
  'padron_faq',
  'padron_eventos',
  'padron_tema_config',
];

// Envía una clave al servidor (además de guardarse en localStorage
// desde la función de guardado correspondiente). No bloqueante: si
// falla (sin red), la configuración sigue disponible localmente.
async function pushConfigToServer(key, value) {
  try {
    await apiSaveSiteConfig(key, value);
  } catch (err) {
    showToast(`Se guardó localmente, pero no se pudo sincronizar con el servidor: ${err.message}`, 'error');
  }
}

// Trae la configuración real del servidor y la vuelca a localStorage
// ANTES de que corran los loaders existentes (loadSiteConfig, etc.),
// así cualquier navegador que abra el panel ve siempre lo último
// guardado, no solo lo que quedó cacheado en ese equipo.
async function primeConfigFromServer() {
  try {
    const all = await apiGetSiteConfig();
    SERVER_CONFIG_KEYS.forEach(key => {
      if (all[key]) localStorage.setItem(key, JSON.stringify(all[key]));
    });
  } catch (err) { /* sin conexión: seguimos con lo que haya en localStorage */ }

  loadSiteConfig();
  loadSiteContentConfig();
  loadReglamento();
  loadFaqFromServer();
  loadEventosFromServer();
  loadTemaFromServer();
  aplicarTemaVisual();
  previewFooter();
  buildIconSelectors();
}

// Aplica el logo del panel admin a su PROPIO sidebar (a diferencia de los
// demás elementos de ICON_ELEMENTS, este no vive en el portal público).
function applyAdminOwnAppearance() {
  try {
    const raw = localStorage.getItem('padron_appearance_config');
    if (!raw) return;
    const cfg = JSON.parse(raw);
    const val = cfg['admin-sidebar-logo'];
    const el  = document.getElementById('admin-sidebar-logo');
    if (!val || !val.value || !el) return;
    el.innerHTML = val.type === 'emoji'
      ? val.value
      : `<img src="${val.value}" alt="Logo" style="width:100%;height:100%;object-fit:contain;" />`;
  } catch (e) { /* ignore */ }
}
