/* ══════════════════════════════════════════════════ */
/*  DRAG & DROP HELPERS                               */
/* ══════════════════════════════════════════════════ */
function handleDrop(e, inputId) {
  e.preventDefault();
  e.currentTarget.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) {
    const dt = new DataTransfer();
    dt.items.add(file);
    document.getElementById(inputId).files = dt.files;
    const prevId = inputId.replace('-img', '-prev').replace('art-img', 'art-banner-prev');
    previewBanner({ files: dt.files }, prevId);
  }
}
function previewBanner(input, prevId) {
  const file = input.files ? input.files[0] : null;
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) { showToast('La imagen no debe superar 5 MB', 'error'); return; }

  // Antes esto recortaba directo al centro (object-fit:cover) sin que la
  // persona pudiera elegir qué parte de la foto se ve — si lo importante
  // de la imagen no estaba justo en el centro, se cortaba. Ahora se abre
  // el recortador (arrastrar + zoom, ver admin-image-crop.js) y el
  // recorte final se escribe en el preview hasta que la persona confirma.
  const reader = new FileReader();
  reader.onload = e => openImageCropper(e.target.result, prevId);
  reader.onerror = () => showToast('No se pudo leer la imagen', 'error');
  reader.readAsDataURL(file);
}

/* ══════════════════════════════════════════════════ */
/*  EXPORT CSV                                        */
/* ══════════════════════════════════════════════════ */
function exportCSV() {
  const header = ['Folio','Nombre','Especie','Raza','Edad','Sexo','Vacunado','Esterilizado','Estatus','Dueño','Colonia','Registro'];
  const rows = allPets.map(m => [
    m.id, m.nombre, m.especie, m.raza||'', m.edad_label||m.edad||'',
    m.sexo||'', m.vacunado?'Sí':'No', m.esterilizado?'Sí':'No',
    m.estatus, m.persona||'', m.colonia||'', m.fecha_registro||m.created_at||'',
  ]);
  const csv = [header,...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob(['\uFEFF'+csv], {type:'text/csv;charset=utf-8;'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `padron_mascotas_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  showToast('CSV descargado correctamente', 'success');
}

/* ══════════════════════════════════════════════════ */
/*  TOAST                                             */
/* ══════════════════════════════════════════════════ */
/* Un solo ícono por tipo (éxito/error/info) en vez de un emoji distinto
   pegado a mano en cada llamada a showToast() — más fácil de mantener
   consistente y menos "ensalada de emoji" en el código. */
const ICON_TOAST = {
  success: '<svg class="icon-line" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--green);"><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg>',
  error:   '<svg class="icon-line" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--red);"><circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" /></svg>',
  info:    '<svg class="icon-line" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--orange);"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>',
};

function showToast(msg, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = ICON_TOAST[type] || ICON_TOAST.info;
  const texto = document.createElement('span');
  texto.textContent = msg;
  toast.appendChild(texto);
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }

