/* ══════════════════════════════════════════════════ */
/*  SITE CONFIG (footer editor)                       */
/* ══════════════════════════════════════════════════ */

// ── Helper to get all field values ───────────────
function getSiteConfigValues() {
  const g = id => (document.getElementById(id)?.value || '').trim();
  return {
    nombre:      g('cfg-nombre'),
    header_sub:  g('cfg-header-sub'),
    slogan:      g('cfg-slogan'),
    descripcion: g('cfg-desc'),
    telefono:    g('cfg-telefono'),
    copyright:   g('cfg-copyright'),
    creditos:    g('cfg-creditos'),
    instagram:   g('cfg-instagram'),
    facebook:    g('cfg-facebook'),
    web_oficial: g('cfg-web'),
    extra_icono:  g('cfg-extra-icono'),
    extra_nombre: g('cfg-extra-nombre'),
    extra_url:    g('cfg-extra-url'),
    contactos: {
      direccion:          g('cfg-direccion'),
      telefono:           g('cfg-telefono'),
      email_medioambiente: g('cfg-email-ma'),
      email_informatica:   g('cfg-email-inf'),
    },
  };
}

// ── Live preview (mini footer in admin) ──────────
function previewFooter() {
  const cfg = getSiteConfigValues();
  const prev = document.getElementById('footerPreview');
  if (!prev) return;

  prev.innerHTML = `
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:14px;">
      <div>
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
          <div style="width:28px;height:28px;background:var(--orange);border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:1rem;color:white;">${ICON_PAW_PLACEHOLDER}</div>
          <div>
            <div style="color:white; font-weight:700; font-size:.78rem;">${cfg.nombre || 'Padrón de Mascotas'}</div>
            <div style="font-size:.65rem; color:var(--orange-light);">${cfg.slogan || 'La Ciudad de la Gente'}</div>
          </div>
        </div>
        <div style="font-size:.65rem; line-height:1.7; color:rgba(255,255,255,.6);">
          ${(cfg.descripcion || '').replace(/\n/g, '<br/>')}
        </div>
        <div style="margin-top:8px; display:flex; gap:6px;">
          <span style="width:22px;height:22px;background:rgba(255,255,255,.1);border-radius:5px;display:inline-flex;align-items:center;justify-content:center;"><svg class="icon-line" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13px; height:13px;"><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg></span>
          <span style="width:22px;height:22px;background:rgba(255,255,255,.1);border-radius:5px;display:inline-flex;align-items:center;justify-content:center;"><svg class="icon-line" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13px; height:13px;"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg></span>
          <span style="width:22px;height:22px;background:rgba(255,255,255,.1);border-radius:5px;display:inline-flex;align-items:center;justify-content:center;"><svg class="icon-line" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13px; height:13px;"><circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" /></svg></span>
          ${cfg.extra_url ? `<span title="${cfg.extra_nombre || 'Otra red'}" style="width:22px;height:22px;background:rgba(255,255,255,.1);border-radius:5px;display:inline-flex;align-items:center;justify-content:center;">${cfg.extra_icono || '🔗'}</span>` : ''}
        </div>
      </div>
      <div>
        <div style="color:white; font-weight:700; font-size:.7rem; margin-bottom:6px;">Contacto</div>
        <div style="font-size:.65rem; color:rgba(255,255,255,.65); display:flex; flex-direction:column; gap:3px;">
          <span style="display:flex; align-items:center; gap:4px;"><svg class="icon-line" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:11px; height:11px; flex-shrink:0;"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" /><circle cx="12" cy="10" r="3" /></svg> ${cfg.contactos.direccion || '—'}</span>
          <span style="display:flex; align-items:center; gap:4px;"><svg class="icon-line" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:11px; height:11px; flex-shrink:0;"><path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384" /></svg> ${cfg.contactos.telefono || '—'}</span>
          <span style="display:flex; align-items:center; gap:4px;"><svg class="icon-line" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:11px; height:11px; flex-shrink:0;"><path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7" /><rect x="2" y="4" width="20" height="16" rx="2" /></svg> ${cfg.contactos.email_medioambiente || '—'}</span>
          <span style="display:flex; align-items:center; gap:4px;"><svg class="icon-line" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:11px; height:11px; flex-shrink:0;"><path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7" /><rect x="2" y="4" width="20" height="16" rx="2" /></svg> ${cfg.contactos.email_informatica  || '—'}</span>
        </div>
      </div>
    </div>
    <div style="border-top:1px solid rgba(255,255,255,.1); padding-top:10px; font-size:.6rem; color:rgba(255,255,255,.4); display:flex; justify-content:space-between; flex-wrap:wrap; gap:4px;">
      <span>${cfg.copyright || ''}</span>
      <span>${cfg.creditos  || ''}</span>
    </div>
  `;
}

// ── Save to localStorage ──────────────────────────
function saveSiteConfig() {
  const cfg = getSiteConfigValues();
  localStorage.setItem('padron_site_config', JSON.stringify(cfg));
  pushConfigToServer('padron_site_config', cfg);
  const stEl = document.getElementById('statusContactos');
  if (stEl) stEl.innerHTML = '<div class="status-dot saved"></div> Contactos guardados';
  showToast('Configuración guardada — el encabezado y footer del portal han sido actualizados', 'success');

  // Flash the preview border
  const prev = document.getElementById('footerPreview');
  if (prev) {
    prev.style.borderColor = '#4CAF50';
    prev.style.boxShadow = '0 0 0 4px rgba(76,175,80,.2)';
    setTimeout(() => {
      prev.style.borderColor = 'var(--orange)';
      prev.style.boxShadow   = '';
    }, 1500);
  }
}

// ── Reset to defaults ─────────────────────────────
function resetSiteConfig() {
  const defaults = {
    'cfg-nombre':     'Padrón de Mascotas',
    'cfg-header-sub': 'H. Ayuntamiento de El Grullo · 2024-2027',
    'cfg-slogan':     'La Ciudad de la Gente',
    'cfg-desc':       'H. Ayuntamiento Constitucional de El Grullo, Jalisco.\nGobierno Municipal 2024–2027.\nDirección de Medio Ambiente e Informática Municipal.',
    'cfg-telefono':   '(341) 123-4567',
    'cfg-direccion':  'El Grullo, Jalisco',
    'cfg-email-ma':   'medioambiente@elgrullo.gob.mx',
    'cfg-email-inf':  'informatica@elgrullo.gob.mx',
    'cfg-instagram':  'https://www.instagram.com/laciudaddelagente',
    'cfg-facebook':   'https://www.facebook.com/laciudaddelagente',
    'cfg-web':        'https://elgrullo.gob.mx',
    'cfg-copyright':  '© 2026 H. Ayuntamiento de El Grullo, Jalisco · Todos los derechos reservados.',
    'cfg-creditos':   'Desarrollado como proyecto de Residencias Profesionales — ITJMM Campus El Grullo',
    'cfg-extra-icono':  '',
    'cfg-extra-nombre': '',
    'cfg-extra-url':    '',
  };
  Object.entries(defaults).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.value = val;
  });
  localStorage.removeItem('padron_site_config');
  previewFooter();
  showToast('Configuración restablecida a valores predeterminados', 'info');
}

// ── Load saved config on page open ───────────────
function loadSiteConfig() {
  const raw = localStorage.getItem('padron_site_config');
  if (!raw) return;
  try {
    const cfg = JSON.parse(raw);
    const set = (id, val) => { const el = document.getElementById(id); if (el && val) el.value = val; };
    set('cfg-nombre',     cfg.nombre);
    set('cfg-header-sub', cfg.header_sub);
    set('cfg-slogan',     cfg.slogan);
    set('cfg-desc',       cfg.descripcion);
    set('cfg-copyright',  cfg.copyright);
    set('cfg-creditos',   cfg.creditos);
    set('cfg-instagram',  cfg.instagram);
    set('cfg-facebook',   cfg.facebook);
    set('cfg-web',        cfg.web_oficial);
    set('cfg-extra-icono',  cfg.extra_icono);
    set('cfg-extra-nombre', cfg.extra_nombre);
    set('cfg-extra-url',    cfg.extra_url);
    if (cfg.contactos) {
      set('cfg-telefono',   cfg.contactos.telefono);
      set('cfg-direccion',  cfg.contactos.direccion);
      set('cfg-email-ma',   cfg.contactos.email_medioambiente);
      set('cfg-email-inf',  cfg.contactos.email_informatica);
    }
  } catch(e) { /* ignore */ }
}

