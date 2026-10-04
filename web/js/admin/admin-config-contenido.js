/* ══════════════════════════════════════════════════ */
/*  SEO Y METADATOS                                   */
/* ══════════════════════════════════════════════════ */
function updateSeoPreview() {
  const title = document.getElementById('seo-title')?.value || '';
  const desc  = document.getElementById('seo-desc')?.value  || '';

  // Update counters
  const tc = document.getElementById('seo-title-count');
  const dc = document.getElementById('seo-desc-count');
  if (tc) {
    tc.textContent = `${title.length}/60 caracteres`;
    tc.style.color = title.length > 60 ? '#EF5350' : title.length > 50 ? '#4CAF50' : '#FF9800';
  }
  if (dc) {
    dc.textContent = `${desc.length}/160 caracteres`;
    dc.style.color = desc.length > 160 ? '#EF5350' : desc.length > 120 ? '#4CAF50' : '#FF9800';
  }

  // Update Google preview
  const pt = document.getElementById('seo-prev-title');
  const pd = document.getElementById('seo-prev-desc');
  const ot = document.getElementById('og-prev-title');
  if (pt) pt.textContent = title || '(sin título)';
  if (pd) pd.textContent = desc  || '(sin descripción)';
  if (ot) ot.textContent = title || '(sin título)';

  renderSeoChecklist();
}

function renderSeoChecklist() {
  const list = document.getElementById('seoChecklist');
  if (!list) return;
  const title    = document.getElementById('seo-title')?.value    || '';
  const desc     = document.getElementById('seo-desc')?.value     || '';
  const keywords = document.getElementById('seo-keywords')?.value || '';
  const ogImg    = document.getElementById('seo-og-img')?.value   || '';
  const ga       = document.getElementById('seo-ga')?.value       || '';
  const indexed  = document.getElementById('seo-index')?.checked;

  const items = [
    { ok: title.length >= 30 && title.length <= 60, text: 'Título entre 30 y 60 caracteres' },
    { ok: desc.length  >= 120 && desc.length <= 160, text: 'Descripción entre 120 y 160 caracteres' },
    { ok: keywords.length > 0,                       text: 'Palabras clave definidas' },
    { ok: ogImg.length > 0,                          text: 'Imagen OG configurada' },
    { ok: indexed,                                   text: 'Sitio indexable por buscadores' },
    { ok: ga.startsWith('G-'),                       text: 'Google Analytics conectado' },
  ];

  list.innerHTML = items.map(i => `
    <div style="display:flex; align-items:center; gap:8px;">
      <span style="color:${i.ok ? '#388E3C' : '#EF6C00'};">${i.ok ? ICON_CHECK_CIRCLE : ICON_ALERT}</span>
      <span style="color:${i.ok ? '#388E3C' : '#EF6C00'};">${i.text}</span>
    </div>`).join('');
}

function previewOgImg(input) {
  const file = input.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const thumb = document.getElementById('og-img-preview');
    const big   = document.getElementById('og-preview-img');
    if (thumb) thumb.innerHTML = `<img src="${e.target.result}" alt="Vista previa de la imagen para redes sociales" style="width:100%;height:100%;object-fit:cover;" />`;
    if (big)   big.innerHTML   = `<img src="${e.target.result}" alt="Vista previa de la imagen para redes sociales" style="width:100%;height:100%;object-fit:cover;" />`;
  };
  reader.readAsDataURL(file);
}

function previewOgImgUrl() {
  const url = document.getElementById('seo-og-img').value.trim();
  const big = document.getElementById('og-preview-img');
  if (big && url) big.innerHTML = `<img src="${url}" alt="Vista previa de la imagen para redes sociales" style="width:100%;height:100%;object-fit:cover;" onerror="this.parentNode.innerHTML='URL inválida'" />`;
}

function saveSEO() {
  const data = {
    title:     document.getElementById('seo-title').value,
    desc:      document.getElementById('seo-desc').value,
    keywords:  document.getElementById('seo-keywords').value,
    og_img:    document.getElementById('seo-og-img').value,
    ga:        document.getElementById('seo-ga').value,
    canonical: document.getElementById('seo-canonical').value,
    indexed:   document.getElementById('seo-index').checked,
  };
  localStorage.setItem('padron_seo_config', JSON.stringify(data));
  const stEl = document.getElementById('statusSEO');
  if (stEl) stEl.innerHTML = '<div class="status-dot saved"></div> SEO guardado';
  document.querySelector('#cnav-seo .config-nav-badge')?.remove();
  const badge = document.createElement('div');
  badge.className = 'config-nav-badge saved';
  document.getElementById('cnav-seo').prepend(badge);
  showToast('Configuración SEO guardada correctamente', 'success');
}

function resetSEO() {
  localStorage.removeItem('padron_seo_config');
  showToast('Configuración SEO restablecida', 'info');
}

/* ══════════════════════════════════════════════════ */
/*  AVISOS — en realidad son la tabla campanas: mismo   */
/*  concepto (título/descripción/fechas/banner), ya se  */
/*  mostraban juntos en el sitio público. Antes "avisos" */
/*  vivía aparte en site_config, desconectado de la      */
/*  tabla real — los cambios se perdían en cada recarga  */
/*  del panel (ver HISTORIAL_CAMBIOS.md, 2026-09-08).    */
/* ══════════════════════════════════════════════════ */
let editingAvisoId = null;

async function saveAviso() {
  const titulo = document.getElementById('aviso-titulo').value.trim();
  const desc   = document.getElementById('aviso-desc').value.trim();
  if (!titulo) { showToast('El título es obligatorio', 'error'); return; }
  const imgEl  = document.querySelector('#aviso-prev img');
  const datos  = {
    titulo, descripcion: desc, publicado: true,
    banner_color: '#F27A00', icono: '📢',
    fecha_inicio: document.getElementById('aviso-inicio').value || null,
    fecha_fin: document.getElementById('aviso-fin').value || null,
  };
  if (imgEl) datos.imagen = imgEl.src;

  try {
    if (editingAvisoId !== null) {
      const updated = await apiActualizarCampana(editingAvisoId, datos);
      const idx = avisoData.findIndex(a => a.id === editingAvisoId);
      if (idx !== -1) avisoData[idx] = updated;
      editingAvisoId = null;
      document.getElementById('avisoSaveBtn').innerHTML = ICON_SEND + ' Publicar aviso';
      document.getElementById('avisoCancelBtn').style.display = 'none';
      showToast('Aviso actualizado correctamente', 'success');
    } else {
      const created = await apiCrearCampana(datos);
      avisoData.push(created);
      showToast('Aviso publicado correctamente', 'success');
    }
    renderAvisos();
    document.getElementById('aviso-titulo').value = '';
    document.getElementById('aviso-desc').value = '';
    document.getElementById('aviso-inicio').value = '';
    document.getElementById('aviso-fin').value = '';
    document.getElementById('aviso-prev').innerHTML = '';
  } catch (err) {
    showToast(`${err.message}`, 'error');
  }
}
function renderAvisos() {
  const list = document.getElementById('avisosList');
  list.innerHTML = avisoData.map(a => `
    <div style="background:white; border:1px solid var(--gray-4); border-radius:var(--radius); padding:14px;">
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
        <span>${a.icono || '📢'}</span>
        <div style="font-weight:700; font-size:.88rem;">${a.titulo}</div>
        <span class="badge badge-green" style="margin-left:auto; font-size:.65rem;">Publicado</span>
      </div>
      <div style="font-size:.78rem; color:var(--gray-2); margin-bottom:8px;">${(a.descripcion || '').substring(0,80)}</div>
      <div style="display:flex; gap:6px;">
        <button class="btn btn-ghost btn-sm" onclick="editAviso(${a.id})" style="font-size:.72rem; padding:4px 10px; display:inline-flex; align-items:center; gap:4px;">${ICON_PENCIL} Editar</button>
        <button class="btn btn-danger btn-sm" onclick="deleteAviso(${a.id})" style="font-size:.72rem; padding:4px 10px;" aria-label="Eliminar aviso">${ICON_TRASH}</button>
      </div>
    </div>`).join('');
}
function editAviso(id) {
  const a = avisoData.find(x => x.id === id);
  if (!a) return;
  editingAvisoId = id;
  document.getElementById('aviso-titulo').value = a.titulo;
  document.getElementById('aviso-desc').value = a.descripcion || '';
  document.getElementById('aviso-inicio').value = a.fecha_inicio || '';
  document.getElementById('aviso-fin').value = a.fecha_fin || '';
  document.getElementById('aviso-prev').innerHTML = a.imagen ? `<img src="${a.imagen}" alt="Vista previa del banner" style="width:100%; max-height:120px; object-fit:cover; border-radius:var(--radius); margin-top:6px;" />` : '';
  document.getElementById('avisoSaveBtn').innerHTML = ICON_SAVE + ' Guardar cambios';
  document.getElementById('avisoCancelBtn').style.display = 'inline-flex';
  document.getElementById('aviso-titulo').scrollIntoView({ behavior: 'smooth', block: 'center' });
}
function cancelEditAviso() {
  editingAvisoId = null;
  document.getElementById('aviso-titulo').value = '';
  document.getElementById('aviso-desc').value = '';
  document.getElementById('aviso-inicio').value = '';
  document.getElementById('aviso-fin').value = '';
  document.getElementById('aviso-prev').innerHTML = '';
  document.getElementById('avisoSaveBtn').innerHTML = ICON_SEND + ' Publicar aviso';
  document.getElementById('avisoCancelBtn').style.display = 'none';
}
async function deleteAviso(id) {
  try {
    await apiEliminarCampana(id);
    avisoData = avisoData.filter(a => a.id !== id);
    renderAvisos();
    showToast('Aviso eliminado', 'success');
  } catch (err) {
    showToast(`${err.message}`, 'error');
  }
}

/* ══════════════════════════════════════════════════ */
/*  EVENTOS                                           */
/* ══════════════════════════════════════════════════ */
let eventosData = [];
function saveEvento() {
  const titulo = document.getElementById('evt-titulo').value.trim();
  const fecha  = document.getElementById('evt-fecha').value;
  const hora   = document.getElementById('evt-hora').value;
  const lugar  = document.getElementById('evt-lugar').value.trim();
  const desc   = document.getElementById('evt-desc').value.trim();
  if (!titulo || !fecha) { showToast('Completa título y fecha', 'error'); return; }
  eventosData.push({ id: Date.now(), titulo, fecha, hora, lugar, descripcion: desc });
  renderEventos();
  persistEventos();
  document.getElementById('evt-titulo').value = '';
  document.getElementById('evt-fecha').value = '';
  document.getElementById('evt-hora').value = '';
  document.getElementById('evt-lugar').value = '';
  document.getElementById('evt-desc').value = '';
  showToast('Evento agregado', 'success');
}
function renderEventos() {
  const list = document.getElementById('eventosList');
  list.innerHTML = eventosData.map((e, i) => `
    <div style="background:white; border:1px solid var(--gray-4); border-radius:var(--radius); padding:14px; display:flex; gap:12px; align-items:center;">
      <div style="background:var(--orange-pale); border-radius:var(--radius-sm); padding:10px; text-align:center; flex-shrink:0; min-width:52px;">
        <div style="font-size:.68rem; font-weight:700; color:var(--orange-dark); text-transform:uppercase;">${e.fecha ? new Date(e.fecha+'T12:00:00').toLocaleString('es-MX', {month:'short'}).toUpperCase() : '—'}</div>
        <div style="font-size:1.3rem; font-weight:800; color:var(--orange-dark); font-family:'Outfit',sans-serif;">${e.fecha ? new Date(e.fecha+'T12:00:00').getDate() : '—'}</div>
      </div>
      <div style="flex:1;">
        <div style="font-weight:700; font-size:.88rem;">${e.titulo}</div>
        <div style="font-size:.75rem; color:var(--gray-2); display:flex; align-items:center; gap:4px; flex-wrap:wrap;"><svg class="icon-line" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" /><circle cx="12" cy="10" r="3" /></svg> ${e.lugar || '—'} · <svg class="icon-line" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg> ${e.hora || '—'}</div>
      </div>
      <button class="btn btn-danger btn-sm" onclick="eventosData.splice(${i},1); renderEventos(); persistEventos(); showToast('Evento eliminado','success')" style="padding:4px 8px;" aria-label="Eliminar evento">${ICON_TRASH}</button>
    </div>`).join('');
}
function persistEventos() {
  localStorage.setItem('padron_eventos', JSON.stringify(eventosData));
  pushConfigToServer('padron_eventos', eventosData);
}
function loadEventosFromServer() {
  const raw = localStorage.getItem('padron_eventos');
  if (!raw) return;
  try {
    const saved = JSON.parse(raw);
    if (Array.isArray(saved)) { eventosData = saved; renderEventos(); }
  } catch (e) { /* ignore */ }
}

/* ══════════════════════════════════════════════════ */
/*  FAQ MANAGEMENT                                    */
/* ══════════════════════════════════════════════════ */
function renderFaqTable() {
  const tbody = document.getElementById('faqTableBody');
  tbody.innerHTML = faqData.map((f, i) => `
    <tr>
      <td style="max-width:160px;">${f.pregunta}</td>
      <td style="max-width:200px; color:var(--gray-1);">${f.respuesta.substring(0, 60)}...</td>
      <td style="white-space:nowrap;">
        <button class="btn btn-ghost btn-sm" onclick="editFaq(${i})" style="padding:4px 8px;" title="Editar" aria-label="Editar pregunta frecuente">${ICON_PENCIL}</button>
        <button class="btn btn-danger btn-sm" onclick="deleteFaq(${i})" style="padding:4px 8px;" title="Eliminar" aria-label="Eliminar pregunta frecuente">${ICON_TRASH}</button>
      </td>
    </tr>`).join('');
}
// Guarda faqData completo en localStorage y lo sincroniza con el servidor,
// para que el FAQ público (index.html) refleje siempre lo último editado.
function persistFaq() {
  localStorage.setItem('padron_faq', JSON.stringify(faqData));
  pushConfigToServer('padron_faq', faqData);
}

function loadFaqFromServer() {
  const raw = localStorage.getItem('padron_faq');
  if (!raw) return;
  try {
    const saved = JSON.parse(raw);
    if (Array.isArray(saved)) { faqData = saved; renderFaqTable(); }
  } catch (e) { /* ignore */ }
}

function saveFaq() {
  const pregunta  = document.getElementById('faq-pregunta').value.trim();
  const respuesta = document.getElementById('faq-respuesta').value.trim();
  if (!pregunta || !respuesta) { showToast('Completa pregunta y respuesta', 'error'); return; }
  if (editingFaqId !== null) {
    faqData[editingFaqId] = { ...faqData[editingFaqId], pregunta, respuesta };
    editingFaqId = null;
    document.getElementById('faqSaveBtn').textContent = '+ Agregar';
    document.getElementById('faqFormTitle').innerHTML = ICON_QUESTION + ' Preguntas';
    document.getElementById('faqCancelBtn').style.display = 'none';
    showToast('Pregunta actualizada y publicada', 'success');
  } else {
    faqData.push({ id: Date.now(), pregunta, respuesta });
    showToast('Pregunta agregada y publicada', 'success');
  }
  document.getElementById('faq-pregunta').value = '';
  document.getElementById('faq-respuesta').value = '';
  renderFaqTable();
  persistFaq();
}
function editFaq(i) {
  editingFaqId = i;
  document.getElementById('faq-pregunta').value = faqData[i].pregunta;
  document.getElementById('faq-respuesta').value = faqData[i].respuesta;
  document.getElementById('faqSaveBtn').innerHTML = ICON_SAVE + ' Guardar cambios';
  document.getElementById('faqFormTitle').innerHTML = ICON_PENCIL + ' Editar pregunta';
  document.getElementById('faqCancelBtn').style.display = 'inline-flex';
}
function cancelEditFaq() {
  editingFaqId = null;
  document.getElementById('faq-pregunta').value = '';
  document.getElementById('faq-respuesta').value = '';
  document.getElementById('faqSaveBtn').textContent = '+ Agregar';
  document.getElementById('faqFormTitle').innerHTML = ICON_QUESTION + ' Preguntas';
  document.getElementById('faqCancelBtn').style.display = 'none';
}
function deleteFaq(i) {
  faqData.splice(i, 1);
  renderFaqTable();
  persistFaq();
  showToast('Pregunta eliminada', 'success');
}

