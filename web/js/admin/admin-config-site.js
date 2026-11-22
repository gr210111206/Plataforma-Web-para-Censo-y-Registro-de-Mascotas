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
  'padron_seo_config',
];

// Envía una clave al servidor (además de guardarse en localStorage
// desde la función de guardado correspondiente). No bloqueante: si
// falla (sin red), la configuración sigue disponible localmente.
async function pushConfigToServer(key, value) {
  try {
    await apiSaveSiteConfig(key, value);
    return true;
  } catch (err) {
    showToast(`Se guardó localmente, pero no se pudo sincronizar con el servidor: ${err.message}`, 'error');
    return false;
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
  loadSEO();
  loadTemaFromServer();
  aplicarTemaVisual();
  previewFooter();
  buildIconSelectors();
}

// Aplica el logo del panel admin a su PROPIO sidebar (a diferencia de los
// demás elementos de ICON_ELEMENTS, este no vive en el portal público).
function applyAdminOwnAppearance() {
  const el = document.getElementById('admin-sidebar-logo');
  if (!el) return;

  let val = null;
  try {
    const raw = localStorage.getItem('padron_appearance_config');
    if (raw) val = JSON.parse(raw)['admin-sidebar-logo'];
  } catch (e) { /* ignore */ }

  el.textContent = '';
  if (val && val.type === 'emoji' && val.value) {
    el.textContent = val.value;
    return;
  }
  // Sin valor guardado (o Restablecer), o un valor que ya no pasa la
  // validación: vuelve al logo de fábrica en vez de dejar el ícono
  // personalizado anterior hasta que alguien recargue la página.
  const url = (val && val.value && esIconoUrlSegura(val.value)) ? val.value : 'Imagenes/Logo blanco.png';
  const img = crearImgVistaPrevia(url);
  img.alt = 'Logo';
  el.appendChild(img);
}
