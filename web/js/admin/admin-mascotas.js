/* ══════════════════════════════════════════════════ */
/*  SEGUIMIENTO                                       */
/* ══════════════════════════════════════════════════ */
function renderSeguimiento(data, total) {
  const grid = document.getElementById('seguimientoGrid');
  if (data.length === 0) {
    grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:60px; background:white; border:2px dashed var(--gray-4); border-radius:var(--radius-lg);">
      <div style="color:var(--gray-3); margin-bottom:10px;"><svg class="icon-line" viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:40px; height:40px;"><path d="m21 21-4.34-4.34" /><circle cx="11" cy="11" r="8" /></svg></div>
      <div style="font-size:.95rem; color:var(--gray-2);">No se encontraron mascotas con ese criterio</div>
    </div>`;
    renderPagerFooter('seguimientoPager', seguimientoState, total, 'goToSeguimientoPage');
    return;
  }

  // El servidor ya solo manda una página (seguimientoState.pageSize filas) —
  // antes se traían TODAS las mascotas de un jalón y se recortaba aquí en el
  // navegador, lo que fue justo lo que congeló el panel con volumen real
  // (ver HISTORIAL_CAMBIOS.md, 2026-08-25).
  grid.innerHTML = data.map((pet, i) => {
    // Antes siempre mostraba el emoji de la especie, aunque la mascota
    // tuviera una foto real subida — nunca se revisaba pet.foto_url.
    const fotoHtml = pet.foto_url
      ? `<img src="${pet.foto_url}" alt="Foto de ${pet.nombre}" style="width:100%;height:100%;object-fit:cover;border-radius:calc(var(--radius) - 2px);" />`
      : ICON_PAW_PLACEHOLDER;
    const statusColor = { Alta: 'var(--green)', Baja: 'var(--gray-2)' }[pet.estatus] || 'var(--green)';
    const edad = pet.edad_label || (pet.edad ? `${pet.edad} años` : '?');
    return `
    <div class="pet-detail-card">
      <div style="font-size:.72rem; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:var(--gray-2); margin-bottom:12px;">Datos de la mascota</div>
      <div style="display:flex; gap:14px; margin-bottom:16px;">
        <div class="pet-detail-photo">${fotoHtml}</div>
        <div>
          <div style="font-family:'Outfit',sans-serif; font-weight:800; font-size:1.1rem;">${pet.nombre}</div>
          <div style="font-size:.8rem; color:var(--gray-2); margin-top:2px;">${capitalize(pet.especie)} · ${capitalize(pet.sexo || '')} · ${pet.raza || 'Sin raza'}</div>
          <div style="font-size:.8rem; color:var(--gray-2); margin-top:2px;">Edad: ${edad}</div>
          <div style="margin-top:6px;">
            ${pet.vacunado ? `<span class="badge badge-green">${ICON_SYRINGE} Vacunado</span>` : `<span class="badge badge-red">${ICON_SYRINGE} Sin vacuna</span>`}
            ${pet.esterilizado ? `<span class="badge badge-blue" style="margin-left:4px;">${ICON_SCISSORS} Esterilizado</span>` : ''}
          </div>
        </div>
      </div>

      <div class="detail-field">
        <div class="detail-label">Datos de dueño</div>
        <div class="detail-value">${pet.persona || '—'}</div>
      </div>
      <div class="detail-field">
        <div class="detail-label">Domicilio</div>
        <div class="detail-value">${pet.colonia ? pet.colonia + ', El Grullo, Jal.' : '—'}</div>
      </div>
      <div class="detail-field">
        <div class="detail-label">Folio</div>
        <div class="detail-value" style="font-family:monospace; font-size:.85rem;">${pet.id}</div>
      </div>
      <div class="detail-field">
        <div class="detail-label">Estatus:</div>
        <div class="detail-value" style="color:${statusColor};">● ${pet.estatus}</div>
      </div>

      <div style="display:flex; gap:8px; margin-top:14px; flex-wrap:wrap;">
        <button class="btn btn-ghost btn-sm" onclick="changeEstatus('${pet.id}')" style="flex:1; min-width:110px; display:inline-flex; align-items:center; justify-content:center; gap:6px;">${ICON_REFRESH} Cambiar estatus</button>
        <button class="btn btn-ghost btn-sm" onclick="editarMascotaAdmin('${pet.id}')" style="flex:1; min-width:110px; display:inline-flex; align-items:center; justify-content:center; gap:6px;">${ICON_PENCIL} Editar</button>
        <button class="btn btn-ghost btn-sm" onclick="verQRAdmin('${pet.id}')" style="flex:1; min-width:90px;"><svg class="icon-line" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="5" height="5" x="3" y="3" rx="1" /><rect width="5" height="5" x="16" y="3" rx="1" /><rect width="5" height="5" x="3" y="16" rx="1" /><path d="M21 16h-3a2 2 0 0 0-2 2v3" /><path d="M21 21v.01" /><path d="M12 7v3a2 2 0 0 1-2 2H7" /><path d="M3 12h.01" /><path d="M12 3h.01" /><path d="M12 16v.01" /><path d="M16 12h1" /><path d="M21 12v.01" /><path d="M12 21v-1" /></svg> QR</button>
        <button class="btn btn-primary btn-sm" onclick="downloadActaAdmin('${pet.id}')" style="flex:1; min-width:110px; display:inline-flex; align-items:center; justify-content:center; gap:6px;">${ICON_FILE_TEXT} Ver acta</button>
      </div>
    </div>`;
  }).join('');

  renderPagerFooter('seguimientoPager', seguimientoState, total, 'goToSeguimientoPage');
}

const seguimientoState = { page: 1, pageSize: PAGE_SIZE, q: '', especie: '', estatus: '' };

async function loadSeguimiento() {
  const params = { page: seguimientoState.page, pageSize: seguimientoState.pageSize };
  if (seguimientoState.q)       params.q       = seguimientoState.q;
  if (seguimientoState.especie) params.especie = seguimientoState.especie;
  if (seguimientoState.estatus) params.estatus = seguimientoState.estatus;
  try {
    const { rows, total } = await apiGetTodasMascotas(params);
    allPets = rows; // la página actual — la usan changeEstatus/editar/acta
    renderSeguimiento(rows, total);
  } catch (err) {
    showToast(`${err.message}`, 'error');
  }
}

function filterSeguimiento() {
  seguimientoState.q       = document.getElementById('segSearch').value.trim();
  seguimientoState.especie = document.getElementById('segFilterEspecie').value;
  seguimientoState.estatus = document.getElementById('segFilterEstatus').value;
  seguimientoState.page    = 1;
  loadSeguimiento();
}
const debouncedFilterSeguimiento = debounce(filterSeguimiento, 350);

function goToSeguimientoPage(page) {
  seguimientoState.page = page;
  loadSeguimiento();
}

async function changeEstatus(id) {
  const pet = allPets.find(m => m.id === id);
  if (!pet) return;
  const next = pet.estatus === 'Alta' ? 'Baja' : 'Alta';
  try {
    await apiActualizarMascota(id, { estatus: next });
    loadSeguimiento();
    showToast(`Estatus cambiado a: ${next}`, 'success');
  } catch (err) {
    showToast(`${err.message}`, 'error');
  }
}

/* ══════════════════════════════════════════════════ */
/*  EDITAR MASCOTA (desde Seguimiento, como admin)    */
/* ══════════════════════════════════════════════════ */
let editingMascotaAdminId = null;
let pendingFotoEditarMascota = null;

function editarMascotaAdmin(id) {
  const pet = allPets.find(m => m.id === id);
  if (!pet) return;

  editingMascotaAdminId = id;
  pendingFotoEditarMascota = null;

  document.getElementById('em-nombre').value = pet.nombre || '';
  document.getElementById('em-especie').value = pet.especie || 'perro';
  document.getElementById('em-raza').value = pet.raza || '';
  document.getElementById('em-edad').value = pet.edad || '';
  document.getElementById('em-sexo').value = pet.sexo || 'macho';
  document.getElementById('em-color').value = pet.color || '';
  document.getElementById('em-vacunado').checked = !!pet.vacunado;
  document.getElementById('em-esterilizado').checked = !!pet.esterilizado;

  const preview = document.getElementById('em-foto-preview');
  preview.innerHTML = (pet.foto_url && pet.foto_url.length > 10)
    ? `<img src="${pet.foto_url}" alt="Foto de ${pet.nombre}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;" />`
    : `<svg class="icon-line" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1.6em;height:1.6em;"><path d="M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z" /><circle cx="12" cy="13" r="3" /></svg>`;

  document.getElementById('editar-mascota-titulo').textContent = `Editar a ${pet.nombre}`;
  openModal('modal-editar-mascota');
}

function previewFotoEditarMascota(input) {
  const file = input.files[0]; if (!file) return;
  if (file.size > 5 * 1024 * 1024) { showToast('La foto no debe superar 5 MB', 'error'); return; }

  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      const maxDim = 600;
      let w = img.width, h = img.height;
      if (w > maxDim || h > maxDim) {
        if (w > h) { h = Math.round((h * maxDim) / w); w = maxDim; }
        else       { w = Math.round((w * maxDim) / h); h = maxDim; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      const optimized = canvas.toDataURL('image/jpeg', 0.85);

      pendingFotoEditarMascota = optimized;
      document.getElementById('em-foto-preview').innerHTML = `<img src="${optimized}" alt="Vista previa de la foto" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;" />`;
      showToast('Foto lista — pulsa "Guardar cambios" para aplicarla', 'info');
    };
    img.onerror = () => showToast('No se pudo procesar la imagen', 'error');
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

async function guardarEdicionMascota(e) {
  e.preventDefault();
  if (!editingMascotaAdminId) return;

  const nombre  = document.getElementById('em-nombre').value.trim();
  const especie = document.getElementById('em-especie').value;
  const sexo    = document.getElementById('em-sexo').value;
  if (!nombre || !especie || !sexo) {
    showToast('Completa los campos obligatorios', 'error'); return;
  }

  const edadAnios = parseInt(document.getElementById('em-edad').value) || null;
  const payload = {
    nombre, especie, sexo,
    raza:         document.getElementById('em-raza').value || null,
    edad:         edadAnios !== null ? String(edadAnios) : null,
    edad_label:   edadAnios !== null ? `${edadAnios} ${edadAnios === 1 ? 'año' : 'años'}` : null,
    color:        document.getElementById('em-color').value || null,
    vacunado:     document.getElementById('em-vacunado').checked,
    esterilizado: document.getElementById('em-esterilizado').checked,
  };
  if (pendingFotoEditarMascota !== null) payload.foto_url = pendingFotoEditarMascota;

  try {
    const updated = await apiActualizarMascota(editingMascotaAdminId, payload);
    const idx = allPets.findIndex(p => p.id === editingMascotaAdminId);
    if (idx !== -1) allPets[idx] = updated;
    filterSeguimiento();
    closeModal('modal-editar-mascota');
    editingMascotaAdminId = null;
    pendingFotoEditarMascota = null;
    showToast(`${nombre} actualizado/a correctamente`, 'success');
  } catch (err) {
    showToast(`${err.message}`, 'error');
  }
}

/* ══════════════════════════════════════════════════ */
/*  DOWNLOAD ACTA — admin (Seguimiento)               */
/* ══════════════════════════════════════════════════ */
/* Agrega la foto de la mascota (si tiene) arriba a la derecha del acta.
   Se espera a que la imagen cargue (aunque ya venga en Base64, jsPDF
   necesita conocer su ancho/alto reales) para no deformarla al encajarla
   en un cuadro de máximo 38×38mm. Si no hay foto o falla al cargar, el
   acta se genera igual, solo sin la imagen. */
function _agregarFotoActaPDF(doc, fotoUrl, pageW) {
  return new Promise((resolve) => {
    if (!fotoUrl || fotoUrl.length < 10) { resolve(); return; }
    const img = new Image();
    img.onload = () => {
      try {
        const maxW = 38, maxH = 38;
        let w = img.naturalWidth || 1, h = img.naturalHeight || 1;
        const ratio = Math.min(maxW / w, maxH / h);
        w *= ratio; h *= ratio;
        const formato = fotoUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
        doc.addImage(fotoUrl, formato, pageW - 14 - w, 30, w, h);
      } catch (e) { /* imagen no compatible con jsPDF: el acta sigue sin ella */ }
      resolve();
    };
    img.onerror = () => resolve();
    img.src = fotoUrl;
  });
}

async function downloadActaAdmin(id) {
  const pet = allPets.find(p => p.id === id);
  if (!pet) { showToast('No se encontró la mascota para generar el acta.', 'error'); return; }

  showToast(`Generando acta ${id}...`, 'info');

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'letter' });
  const pageW = doc.internal.pageSize.getWidth();

  doc.setFillColor(242, 122, 0);
  doc.rect(0, 0, pageW, 24, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('H. Ayuntamiento Constitucional de El Grullo, Jalisco', pageW / 2, 10, { align: 'center' });
  doc.setFontSize(11);
  doc.text('Acta Oficial de Registro — Padrón Municipal de Mascotas', pageW / 2, 18, { align: 'center' });

  doc.setTextColor(30, 30, 30);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(`Folio: ${id}`, 14, 36);

  await _agregarFotoActaPDF(doc, pet.foto_url, pageW);

  const edad = pet.edad_label || (pet.edad ? `${pet.edad} años` : 'N/D');
  const rows = [
    ['Nombre de la mascota', pet.nombre || ''],
    ['Especie', capitalize(pet.especie || '')],
    ['Raza', pet.raza || 'No especificada'],
    ['Edad', edad],
    ['Sexo', capitalize(pet.sexo || '')],
    ['Color', pet.color || '—'],
    ['Vacunado', pet.vacunado ? 'Sí' : 'No'],
    ['Esterilizado', pet.esterilizado ? 'Sí' : 'No'],
    ['Estatus', pet.estatus || 'Alta'],
    ['Fecha de registro', pet.fecha_registro || pet.created_at || 'N/D'],
    ['Propietario', pet.persona || '—'],
    ['Teléfono de contacto', pet.telefono || '—'],
    ['Dirección', pet.direccion || '—'],
    ['Colonia', pet.colonia || '—'],
  ];

  let y = 46;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  rows.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, 14, y);
    doc.setFont('helvetica', 'normal');
    doc.text(String(value), 80, y);
    y += 8;
  });

  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text(`Verifica este registro en: ${window.location.origin}${window.location.pathname.replace('admin.html','')}${pet.link_publico}`, 14, y + 6);
  doc.text('Documento generado por el Padrón Municipal de Mascotas. Válido como comprobante de registro municipal.', 14, y + 12);

  doc.save(`${id}.pdf`);
  showToast('Acta descargada correctamente', 'success');
}

/* ══════════════════════════════════════════════════ */
/*  VER QR — admin (Seguimiento). Mismo patrón que      */
/*  verQR() en dashboard.html, adaptado a allPets.       */
/* ══════════════════════════════════════════════════ */
function verQRAdmin(id) {
  const pet = allPets.find(p => p.id === id);
  if (!pet) { showToast('No se encontró la mascota.', 'error'); return; }
  if (!pet.link_publico) { showToast('Esta mascota no tiene un link público generado.', 'error'); return; }
  const link  = pet.link_publico;
  const folio = pet.id || '—';

  let qrModal = document.getElementById('modal-qr');
  if (!qrModal) {
    qrModal = document.createElement('div');
    qrModal.className = 'modal-overlay';
    qrModal.id = 'modal-qr';
    qrModal.innerHTML = `
      <div class="modal" style="max-width:340px; text-align:center;">
        <div class="modal-header">
          <h2 class="modal-title" id="qr-titulo">Código QR</h2>
          <button class="modal-close" onclick="closeModal('modal-qr')" aria-label="Cerrar">✕</button>
        </div>
        <div class="modal-body" style="display:flex; flex-direction:column; align-items:center; gap:16px;">
          <div id="qr-canvas" style="padding:16px; background:white; border-radius:12px; border:2px solid var(--gray-4);"></div>
          <div id="qr-info" style="font-size:.82rem; color:var(--gray-1); text-align:center;"></div>
          <a id="qr-link-btn" href="#" target="_blank" rel="noopener noreferrer" class="btn btn-primary" style="width:100%;"><svg class="icon-line" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" /></svg> Abrir página pública</a>
          <button type="button" class="btn btn-ghost" onclick="copiarEnlaceQR()" style="width:100%; display:inline-flex; align-items:center; justify-content:center; gap:6px;"><svg class="icon-line" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg> Copiar enlace</button>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" onclick="closeModal('modal-qr')">Cerrar</button>
          <button class="btn btn-primary" onclick="printQR()"><svg class="icon-line" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6" /><rect x="6" y="14" width="12" height="8" rx="1" /></svg> Imprimir QR</button>
        </div>
      </div>`;
    document.body.appendChild(qrModal);
    // Este modal se crea dinámicamente, ya corrido el
    // querySelectorAll('.modal-overlay').forEach(...) de más abajo que
    // engancha "clic en el fondo oscuro cierra" — por eso a este le faltaba
    // ese comportamiento. Se engancha aquí a mano.
    qrModal.addEventListener('click', e => { if (e.target === qrModal) closeModal('modal-qr'); });
  }
  openModal('modal-qr');

  const qrCanvas = document.getElementById('qr-canvas');
  qrCanvas.innerHTML = '';

  const linkAbsoluto = `${window.location.origin}${window.location.pathname.replace('admin.html', '')}${link}`;
  try {
    new QRCode(qrCanvas, {
      text: linkAbsoluto,
      width:  200,
      height: 200,
      colorDark:  '#1A1A1A',
      colorLight: '#FFFFFF',
      correctLevel: QRCode.CorrectLevel.M,
    });
  } catch (err) {
    qrCanvas.innerHTML = '<div style="padding:20px; font-size:.82rem; color:var(--gray-2);">No se pudo generar el código QR. Revisa tu conexión e intenta de nuevo.</div>';
  }

  document.getElementById('qr-titulo').innerHTML = '<svg class="icon-line" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="5" height="5" x="3" y="3" rx="1" /><rect width="5" height="5" x="16" y="3" rx="1" /><rect width="5" height="5" x="3" y="16" rx="1" /><path d="M21 16h-3a2 2 0 0 0-2 2v3" /><path d="M21 21v.01" /><path d="M12 7v3a2 2 0 0 1-2 2H7" /><path d="M3 12h.01" /><path d="M12 3h.01" /><path d="M12 16v.01" /><path d="M16 12h1" /><path d="M21 12v.01" /><path d="M12 21v-1" /></svg> QR — ' + pet.nombre;
  document.getElementById('qr-info').innerHTML = `
    <strong style="font-size:.95rem; color:var(--dark); display:inline-flex; align-items:center; gap:5px;"><svg class="icon-line" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="4" r="2" /><circle cx="18" cy="8" r="2" /><circle cx="20" cy="16" r="2" /><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z" /></svg> ${pet.nombre}</strong><br/>
    ${capitalize(pet.especie)}${pet.raza ? ' · ' + pet.raza : ''}<br/>
    ${pet.persona ? '<svg class="icon-line" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-3px;"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg> ' + pet.persona : ''}
    ${pet.telefono ? '<br/><svg class="icon-line" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-3px;"><path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384" /></svg> <strong>' + pet.telefono + '</strong>' : ''}<br/>
    <span style="font-family:monospace; font-size:.75rem; color:var(--orange-dark);">${folio}</span>
  `;
  document.getElementById('qr-link-btn').href = linkAbsoluto;
}

function printQR() {
  const canvas = document.querySelector('#qr-canvas canvas');
  if (!canvas) return;
  const win = window.open('');
  win.document.write(`
    <html><head><title>QR - Padrón de Mascotas</title></head>
    <body style="display:flex;align-items:center;justify-content:center;min-height:100vh;flex-direction:column;font-family:Arial;gap:12px;">
      <img src="${canvas.toDataURL()}" alt="Código QR" style="width:220px;height:220px;border:2px solid #eee;padding:12px;border-radius:12px;" />
      <div style="font-size:18px;font-weight:700;">${document.getElementById('qr-titulo').textContent.replace('QR — ','').trim()}</div>
      <div style="font-size:12px;color:#888;">Padrón Municipal de Mascotas · H. Ayuntamiento El Grullo</div>
    </body></html>`);
  win.document.close();
  setTimeout(() => win.print(), 500);
}

async function copiarEnlaceQR() {
  const link = document.getElementById('qr-link-btn').href;
  try {
    await navigator.clipboard.writeText(link);
    showToast('🔗 Enlace copiado — pégalo donde quieras', 'success');
  } catch (err) {
    // Respaldo para navegadores/contextos sin Clipboard API.
    const temp = document.createElement('textarea');
    temp.value = link;
    temp.style.position = 'fixed';
    temp.style.opacity = '0';
    document.body.appendChild(temp);
    temp.select();
    try {
      document.execCommand('copy');
      showToast('🔗 Enlace copiado — pégalo donde quieras', 'success');
    } catch (err2) {
      showToast('No se pudo copiar — selecciona el enlace manualmente', 'error');
    }
    document.body.removeChild(temp);
  }
}

