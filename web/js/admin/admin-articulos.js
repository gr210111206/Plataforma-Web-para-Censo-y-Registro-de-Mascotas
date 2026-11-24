/* ══════════════════════════════════════════════════ */
/*  WYSIWYG EDITOR                                    */
/* ══════════════════════════════════════════════════ */

// ── Core execCommand wrapper ──────────────────────
function wExec(cmd, val = null) {
  document.getElementById('wysiwygEditor').focus();
  document.execCommand(cmd, false, val);
  updateToolbarState();
  updateWordCount();
}

// ── Block-level style (paragraph format) ─────────
function wExecBlock(tag) {
  const editor = document.getElementById('wysiwygEditor');
  editor.focus();
  if (tag === 'blockquote') {
    document.execCommand('formatBlock', false, 'blockquote');
  } else {
    document.execCommand('formatBlock', false, tag);
  }
  updateToolbarState();
  // Reset select to avoid confusion
  setTimeout(() => { document.getElementById('styleSelect').value = tag; }, 0);
}

// ── Toolbar active state ──────────────────────────
function updateToolbarState() {
  const cmds = ['bold','italic','underline','strikeThrough'];
  const ids   = ['btn-bold','btn-italic','btn-under','btn-strike'];
  cmds.forEach((cmd, i) => {
    const btn = document.getElementById(ids[i]);
    if (btn) btn.classList.toggle('active', document.queryCommandState(cmd));
  });
  updateWordCount();
}

// ── Word counter ──────────────────────────────────
function updateWordCount() {
  const editor = document.getElementById('wysiwygEditor');
  const text = editor.innerText.trim();
  const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
  document.getElementById('wordCount').textContent = words;
}

// ── Keyboard shortcuts ────────────────────────────
function handleEditorKey(e) {
  if (e.ctrlKey || e.metaKey) {
    if (e.key === 'b') { e.preventDefault(); wExec('bold'); }
    if (e.key === 'i') { e.preventDefault(); wExec('italic'); }
    if (e.key === 'u') { e.preventDefault(); wExec('underline'); }
  }
  updateWordCount();
}

// ── Insert image into editor ──────────────────────
// Antes se insertaba el archivo tal cual (sin redimensionar) — con
// articulos.contenido en TEXT (~64KB), cualquier imagen real de más de
// ~45KB fallaba al guardar el artículo. Ya se corrigió la columna a
// LONGTEXT, pero además se redimensiona aquí (igual que mascota/perfil/
// apariencia) para no seguir incrustando imágenes pesadas sin necesidad
// — cada visita a la portada pública descarga ese HTML completo.
function insertImageInEditor(input) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) { showToast('Imagen máximo 2 MB', 'error'); return; }
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      const maxDim = 800;
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
      const optimized = canvas.toDataURL('image/jpeg', 0.82);

      document.getElementById('wysiwygEditor').focus();
      document.execCommand('insertHTML', false, `<img src="${optimized}" alt="Imagen" style="max-width:100%; border-radius:8px; margin:8px 0;" />`);
    };
    img.onerror = () => showToast('No se pudo procesar la imagen', 'error');
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
  input.value = '';
}

// ── Emoji picker ──────────────────────────────────
const EMOJIS = [
  '🐕','🐈','🐾','💉','✂️','❤️','🏥','🔍','📋','⭐',
  '🌟','✅','❌','⚠️','📢','📅','📍','📞','✉️','🏛️',
  '🌿','🌱','🐇','🐠','🦜','🦴','🐟','🏡','🔒','🎉',
  '👏','💪','🙌','🤝','👍','😊','😢','😮','🥰','😷',
];

function buildEmojiGrid() {
  const grid = document.getElementById('emojiGrid');
  grid.innerHTML = EMOJIS.map(e => `
    <div class="emoji-item" onclick="insertEmoji('${e}')" title="${e}">${e}</div>
  `).join('');
}

function toggleEmoji() {
  const grid = document.getElementById('emojiGrid');
  grid.classList.toggle('open');
}

function insertEmoji(emoji) {
  const editor = document.getElementById('wysiwygEditor');
  editor.focus();
  document.execCommand('insertText', false, emoji);
  document.getElementById('emojiGrid').classList.remove('open');
  updateWordCount();
}

// Close emoji picker on outside click
document.addEventListener('click', e => {
  const wrap = document.getElementById('emojiPickerWrap');
  if (wrap && !wrap.contains(e.target)) {
    document.getElementById('emojiGrid')?.classList.remove('open');
  }
});

// ── Ícono del artículo (tarjeta sin imagen de portada) ────
// Reemplaza al emoji libre de antes (podía no tener nada que ver con el
// tema del artículo, y se veía distinto según el sistema operativo) por
// los mismos íconos de línea (Lucide) que ya se usan para la especie de
// una mascota — ver ARTICLE_ICONS en api-client.js.
const ART_ICON_LABELS = { perro: 'Perro', gato: 'Gato', pata: 'Pata', vacuna: 'Vacuna' };
let articuloIconoSeleccionado = 'perro';

function buildArtIconGrid() {
  const grid = document.getElementById('artIconGrid');
  if (!grid) return;
  grid.innerHTML = Object.keys(ART_ICON_LABELS).map(key => `
    <div class="art-icon-item" data-key="${key}" onclick="selectArtIcon('${key}')" title="${ART_ICON_LABELS[key]}"
         style="width:48px; height:48px; border:1.5px solid var(--gray-4); border-radius:var(--radius); display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:1.3rem;">${ARTICLE_ICONS[key]}</div>
  `).join('');
  selectArtIcon(articuloIconoSeleccionado);
}

function selectArtIcon(key) {
  articuloIconoSeleccionado = key;
  document.querySelectorAll('#artIconGrid > div').forEach(el => {
    const seleccionado = el.dataset.key === key;
    el.style.borderColor = seleccionado ? 'var(--orange)' : 'var(--gray-4)';
    el.style.background  = seleccionado ? 'var(--orange-pale)' : '';
  });
}

// ── Save / Reset article ──────────────────────────
let editingArticuloId = null;

async function saveArticulo() {
  const titulo   = document.getElementById('art-titulo').value.trim();
  const editor   = document.getElementById('wysiwygEditor');
  // El editor (negritas/listas/títulos con execCommand) guarda formato
  // real en innerHTML — mandar solo innerText perdía todo ese formato
  // (Falla 18, Reporte_fallas_PRUEBA_GENERAL_2026-11-22.txt); el servidor
  // ya lo limpia con sanitizeArticleHtml(). innerText se sigue usando
  // nada más para saber si el editor está "vacío" (igual que el servidor,
  // que también acepta un artículo que solo trae una imagen).
  const contenido = editor.innerHTML.trim();
  const soloTexto = editor.innerText.trim();

  if (!titulo) { showToast('El título es obligatorio', 'error'); return; }
  if (!soloTexto && !contenido.includes('<img')) { showToast('El contenido no puede estar vacío', 'error'); return; }

  const payload = { titulo, contenido, imagen_icono: articuloIconoSeleccionado };
  const imgEl = document.querySelector('#art-banner-prev img');
  if (imgEl) payload.imagen = imgEl.src;

  try {
    if (editingArticuloId !== null) {
      const updated = await apiActualizarArticulo(editingArticuloId, payload);
      const idx = adminArticulos.findIndex(a => a.id === editingArticuloId);
      if (idx !== -1) adminArticulos[idx] = updated;
      showToast(`Artículo "${titulo}" actualizado`, 'success');
    } else {
      const created = await apiCrearArticulo(payload);
      adminArticulos.unshift(created);
      showToast(`Artículo "${titulo}" publicado correctamente`, 'success');
    }
    resetArticulo();
    renderAdminArtList();
  } catch (err) {
    showToast(`${err.message}`, 'error');
  }
}

function resetArticulo() {
  document.getElementById('art-titulo').value  = '';
  document.getElementById('wysiwygEditor').innerHTML = '';
  document.getElementById('wordCount').textContent   = '0';
  document.getElementById('art-img').value = '';
  document.getElementById('art-banner-prev').innerHTML = '';
  updateToolbarState();
  editingArticuloId = null;
  selectArtIcon('perro');
  document.getElementById('art-save-btn').innerHTML = ICON_SAVE + ' Guardar artículo';
}

function editarArticulo(id) {
  const a = adminArticulos.find(x => x.id === id);
  if (!a) return;
  editingArticuloId = id;
  // a.titulo ya viene escapado del servidor (clean()) — sin
  // unescapeHtmlEntities() el campo mostraba literalmente "&quot;" en vez
  // de la comilla, y empeoraba con cada edición (Falla 20).
  document.getElementById('art-titulo').value = unescapeHtmlEntities(a.titulo);
  document.getElementById('wysiwygEditor').innerHTML = a.contenido;
  document.getElementById('art-img').value = '';
  document.getElementById('art-banner-prev').innerHTML = a.imagen ? htmlVistaPreviaRecorte(a.imagen, 'Vista previa de la imagen de portada') : '';
  // Si el artículo ya tenía un emoji libre (de antes de este cambio, no
  // una de las 4 llaves de ARTICLE_ICONS), se deja "perro" seleccionado
  // en vez de intentar adivinar cuál de los 4 nuevos le queda mejor.
  selectArtIcon(Object.prototype.hasOwnProperty.call(ARTICLE_ICONS, a.imagen_icono) ? a.imagen_icono : 'perro');
  updateWordCount();
  document.getElementById('art-save-btn').innerHTML = ICON_SAVE + ' Guardar cambios';
  showAdmin('articulo');
}

async function eliminarArticulo(id) {
  const a = adminArticulos.find(x => x.id === id);
  if (!(await confirmarAccion(`¿Eliminar el artículo "${a ? a.titulo : ''}"? Esta acción no se puede deshacer.`, { danger: true, textoAceptar: 'Eliminar' }))) return;
  try {
    await apiEliminarArticulo(id);
    adminArticulos = adminArticulos.filter(a => a.id !== id);
    renderAdminArtList();
    showToast('Artículo eliminado', 'success');
  } catch (err) {
    showToast(`${err.message}`, 'error');
  }
}

function renderAdminArtList() {
  const container = document.getElementById('adminArtList');
  container.innerHTML = adminArticulos.map(a => `
    <div class="article-card">
      ${a.imagen ? `<img src="${a.imagen}" alt="" class="article-image" />` : ''}
      <div class="article-card-body">
        ${a.imagen ? '' : `<span class="article-icon">${iconoArticuloHtml(a.imagen_icono)}</span>`}
        <div class="article-title">${a.titulo}</div>
        <div class="article-excerpt">${escapeHtml(extraerTextoPlano(a.contenido, 80))}...</div>
        <div style="display:flex; gap:6px; margin-top:10px;">
          <button class="btn btn-ghost btn-sm" onclick="editarArticulo(${a.id})" style="display:inline-flex; align-items:center; gap:5px;">${ICON_PENCIL} Editar</button>
          <button class="btn btn-danger btn-sm" onclick="eliminarArticulo(${a.id})" aria-label="Eliminar artículo">${ICON_TRASH}</button>
        </div>
      </div>
    </div>`).join('');
}

