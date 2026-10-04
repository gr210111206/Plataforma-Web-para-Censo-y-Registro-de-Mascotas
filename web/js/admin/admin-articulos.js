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

// ── Save / Reset article ──────────────────────────
let editingArticuloId = null;

async function saveArticulo() {
  const titulo   = document.getElementById('art-titulo').value.trim();
  const editor   = document.getElementById('wysiwygEditor');
  const contenido = editor.innerText.trim();

  if (!titulo)    { showToast('El título es obligatorio', 'error'); return; }
  if (!contenido) { showToast('El contenido no puede estar vacío', 'error'); return; }

  const payload = { titulo, contenido };
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
  document.getElementById('art-save-btn').innerHTML = ICON_SAVE + ' Guardar artículo';
}

function editarArticulo(id) {
  const a = adminArticulos.find(x => x.id === id);
  if (!a) return;
  editingArticuloId = id;
  document.getElementById('art-titulo').value = a.titulo;
  document.getElementById('wysiwygEditor').innerHTML = a.contenido;
  document.getElementById('art-img').value = '';
  document.getElementById('art-banner-prev').innerHTML = a.imagen ? `<img src="${a.imagen}" alt="Vista previa de la imagen de portada" style="width:100%; max-height:120px; object-fit:cover; border-radius:var(--radius); margin-top:6px;" />` : '';
  updateWordCount();
  document.getElementById('art-save-btn').innerHTML = ICON_SAVE + ' Guardar cambios';
  showAdmin('articulo');
}

async function eliminarArticulo(id) {
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
        <div class="article-title">${a.titulo}</div>
        <div class="article-excerpt">${a.contenido.substring(0, 80)}...</div>
        <div style="display:flex; gap:6px; margin-top:10px;">
          <button class="btn btn-ghost btn-sm" onclick="editarArticulo(${a.id})" style="display:inline-flex; align-items:center; gap:5px;">${ICON_PENCIL} Editar</button>
          <button class="btn btn-danger btn-sm" onclick="eliminarArticulo(${a.id})" aria-label="Eliminar artículo">${ICON_TRASH}</button>
        </div>
      </div>
    </div>`).join('');
}

