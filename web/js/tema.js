/**
 * REMAC — Aplica el tema visual configurado desde el panel admin
 * H. Ayuntamiento de El Grullo, Jalisco
 *
 * Antes, "Tema visual" (color + bordes) solo actualizaba una vista
 * previa dentro del propio panel admin y nunca tocaba el sitio real
 * — ni siquiera se guardaba en el servidor. Este archivo se incluye
 * en TODAS las páginas y aplica el color elegido sobrescribiendo las
 * variables CSS (--orange y derivadas) directamente en <html>.
 *
 * La tipografía y el modo oscuro del selector de "Tema visual" NO se
 * aplican todavía: el sitio no carga ninguna fuente externa (Inter/
 * Outfit/Roboto/etc. son solo el nombre, sin @font-face real) y no
 * existe una hoja de estilos de modo oscuro. Aplicar el color ya es
 * la mejora visible que se pedía resolver primero.
 */

function _hexToHsl(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h * 360, s * 100, l * 100];
}
function _hslToHex(h, s, l) {
  h /= 360; s /= 100; l /= 100;
  let r, g, b;
  if (s === 0) { r = g = b = l; }
  else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3); g = hue2rgb(p, q, h); b = hue2rgb(p, q, h - 1 / 3);
  }
  const toHex = x => Math.round(x * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
/** Aclara (lFactor > 0) u oscurece (lFactor < 0) un color hex conservando su tono. */
function _shadeColor(hex, lFactor) {
  try {
    const [h, s, l] = _hexToHsl(hex);
    let newL = lFactor > 0 ? l + (100 - l) * lFactor : l * (1 + lFactor);
    newL = Math.max(4, Math.min(97, newL));
    return _hslToHex(h, s, newL);
  } catch (e) { return hex; }
}

/**
 * Lee padron_tema_config (del servidor si hay conexión, si no de
 * localStorage) y sobrescribe las variables CSS del sitio. Debe
 * llamarse en cada página después de api-client.js.
 */
async function aplicarTemaVisual() {
  let cfg = null;
  try {
    if (typeof apiGetSiteConfig === 'function') {
      const all = await apiGetSiteConfig();
      if (all && all['padron_tema_config']) {
        cfg = all['padron_tema_config'];
        localStorage.setItem('padron_tema_config', JSON.stringify(cfg));
      }
    }
  } catch (e) { /* sin conexión: seguimos con lo que haya en localStorage */ }

  if (!cfg) {
    try {
      const raw = localStorage.getItem('padron_tema_config');
      cfg = raw ? JSON.parse(raw) : null;
    } catch (e) { return; }
  }
  if (!cfg) return;

  const root = document.documentElement.style;
  if (cfg.color) {
    root.setProperty('--orange', cfg.color);
    root.setProperty('--orange-dark', _shadeColor(cfg.color, -0.18));
    root.setProperty('--orange-light', _shadeColor(cfg.color, 0.3));
    root.setProperty('--orange-pale', _shadeColor(cfg.color, 0.85));
  }
  if (cfg.radius === false) {
    root.setProperty('--radius-sm', '3px');
    root.setProperty('--radius', '5px');
    root.setProperty('--radius-lg', '8px');
    root.setProperty('--radius-xl', '10px');
  }
}
