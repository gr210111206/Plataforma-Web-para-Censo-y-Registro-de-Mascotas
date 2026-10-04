/* ══════════════════════════════════════════════════ */
/*  CONTENIDOS PORTADA (index.html Editor)            */
/* ══════════════════════════════════════════════════ */
function getSiteContentValues() {
  const g = id => (document.getElementById(id)?.value || '').trim();
  return {
    hero_eyebrow:      g('edit-hero-eyebrow'),
    hero_title:        g('edit-hero-title'),
    hero_desc:         g('edit-hero-desc'),
    hero_btn_1:        g('edit-hero-btn-1'),
    hero_btn_2:        g('edit-hero-btn-2'),
    stat_1_num:        g('edit-stat-1-num'),
    stat_1_label:      g('edit-stat-1-label'),
    stat_2_num:        g('edit-stat-2-num'),
    stat_2_label:      g('edit-stat-2-label'),
    stat_3_num:        g('edit-stat-3-num'),
    stat_3_label:      g('edit-stat-3-label'),
    hero_mascot_title: g('edit-hero-mascot-title'),
    hero_step_1:       g('edit-hero-step-1'),
    hero_step_2:       g('edit-hero-step-2'),
    hero_step_3:       g('edit-hero-step-3'),
    banner_title:      g('edit-banner-title'),
    banner_desc:       g('edit-banner-desc'),
    banner_btn:        g('edit-banner-btn'),
    proc_eyebrow:      g('edit-proc-eyebrow'),
    proc_title:        g('edit-proc-title'),
    proc_desc:         g('edit-proc-desc'),
    step_1_title:      g('edit-step-1-title'),
    step_1_desc:       g('edit-step-1-desc'),
    step_2_title:      g('edit-step-2-title'),
    step_2_desc:       g('edit-step-2-desc'),
    step_3_title:      g('edit-step-3-title'),
    step_3_desc:       g('edit-step-3-desc'),
    why_title:         g('edit-why-title'),
    why_desc:          g('edit-why-desc'),
    why_btn:           g('edit-why-btn'),
    camp_eyebrow:      g('edit-camp-eyebrow'),
    camp_title:        g('edit-camp-title'),
    camp_desc:         g('edit-camp-desc'),
    tips_eyebrow:      g('edit-tips-eyebrow'),
    tips_title:        g('edit-tips-title'),
    tips_desc:         g('edit-tips-desc'),
    faq_eyebrow:       g('edit-faq-eyebrow'),
    faq_title:         g('edit-faq-title'),
  };
}

function saveSiteContentConfig() {
  const content = getSiteContentValues();
  localStorage.setItem('padron_site_content', JSON.stringify(content));
  pushConfigToServer('padron_site_content', content);
  showToast('Contenidos de la portada guardados y publicados con éxito', 'success');
}

function loadSiteContentConfig() {
  const raw = localStorage.getItem('padron_site_content');
  if (!raw) return;
  try {
    const cfg = JSON.parse(raw);
    const set = (id, val) => { const el = document.getElementById(id); if (el && val !== undefined && val !== null) el.value = val; };
    Object.entries(cfg).forEach(([k, v]) => {
      set('edit-' + k.replace(/_/g, '-'), v);
    });
  } catch(e) {}
}

function resetSiteContentConfig() {
  localStorage.removeItem('padron_site_content');
  showToast('Contenidos de portada restablecidos a valores por defecto', 'info');
  setTimeout(() => location.reload(), 800);
}

// (loadSiteConfig/loadSiteContentConfig/previewFooter se llaman desde initAdmin(),
// después de traer la configuración real del servidor — ver primeConfigFromServer())

