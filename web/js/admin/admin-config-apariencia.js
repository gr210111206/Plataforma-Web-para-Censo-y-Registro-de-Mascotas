/* ══════════════════════════════════════════════════ */
/*  APARIENCIA — ICON SELECTOR                        */
/* ══════════════════════════════════════════════════ */

// Definitions: all customizable elements
const ICON_ELEMENTS = [
  { id: 'nav-logo-icon',    label: 'Logo del portal (navbar)',  default: '🐾' },
  { id: 'hero-mascot-icon', label: 'Imagen principal (hero)',   default: '🐾' },
  { id: 'banner-icon',      label: 'Ícono del aviso/banner',    default: '💉' },
  { id: 'step-1-icon',      label: 'Paso 1 — Crear cuenta',     default: '📧' },
  { id: 'step-2-icon',      label: 'Paso 2 — Registrar mascota',default: '🐕' },
  { id: 'step-3-icon',      label: 'Paso 3 — Descargar acta',   default: '📄' },
  { id: 'footer-logo-icon', label: 'Logo del footer',           default: '🐾' },
  { id: 'footer-brand-1',   label: 'Footer — logo del municipio', default: '🏛️' },
  { id: 'footer-brand-2',   label: 'Footer — logo Ciudad Mágica', default: '✨' },
  { id: 'admin-sidebar-logo', label: 'Logo del Panel Admin (sidebar)', default: '🏛️' },
];

// Quick emoji palette for the selector (pet/municipal themed)
const ICON_EMOJIS = [
  '🐾','🐕','🐈','🐩','🐶','🐱','🐾','🦮','🐕‍🦺','🐇',
  '🐠','🦜','🦴','💉','✂️','❤️','🏥','🏛️','📋','📄',
  '⭐','✅','🌿','🌱','📍','📞','✉️','🎉','🔍','💪',
  '🐾','🔒','🏡','🐟','🦜','🌟','👏','🤝','🥰','😊',
];

// In-memory state: { elementId: { type, value } }
let appearanceState = {};

// ── Build all icon-selector cards ────────────────
function buildIconSelectors() {
  const grid = document.getElementById('iconSelGrid');
  if (!grid) return;

  grid.innerHTML = ICON_ELEMENTS.map(el => `
    <div class="icon-sel-card" id="card-${el.id}">
      <div class="icon-sel-label">${el.label}</div>

      <!-- Preview -->
      <div class="icon-sel-preview" id="prev-${el.id}">${el.default}</div>

      <!-- Type selector -->
      <div class="icon-sel-types">
        <button class="icon-sel-type-btn active" id="type-emoji-${el.id}" onclick="setIconSelType('${el.id}','emoji')">${ICON_SMILE} Emoji</button>
        <button class="icon-sel-type-btn"        id="type-image-${el.id}" onclick="setIconSelType('${el.id}','image')">${ICON_IMAGE} Imagen</button>
        <button class="icon-sel-type-btn"        id="type-gif-${el.id}"   onclick="setIconSelType('${el.id}','gif')">${ICON_SPARKLES} GIF/URL</button>
        <button class="icon-sel-type-btn"        id="type-none-${el.id}"  onclick="setIconSelType('${el.id}','none')">${ICON_EYE_OFF} Ocultar</button>
      </div>

      <!-- Emoji panel -->
      <div class="icon-sel-input" id="inp-emoji-${el.id}">
        <input type="text" class="form-control" id="emoji-text-${el.id}"
               placeholder="Escribe un emoji: 🐾"
               maxlength="8"
               oninput="updateIconPreview('${el.id}')"
               style="font-size:1.2rem; text-align:center; letter-spacing:.1em;" />
        <div class="icon-sel-emoji-row" id="emoji-row-${el.id}">
          ${ICON_EMOJIS.map(e => `
            <div class="icon-sel-emoji-item" title="${e}" onclick="selectEmoji('${el.id}','${e}')">${e}</div>
          `).join('')}
        </div>
      </div>

      <!-- Image upload panel (hidden) -->
      <div class="icon-sel-input" id="inp-image-${el.id}" style="display:none;">
        <div style="font-size:.7rem; font-weight:700; color:var(--gray-2); margin-bottom:4px;">Logos oficiales de El Grullo:</div>
        <div style="display:flex; flex-wrap:wrap; gap:4px; margin-bottom:8px;">
          <button type="button" class="btn btn-ghost btn-sm" style="font-size:.65rem; padding:3px 6px; border:1px solid var(--gray-4); display:inline-flex; align-items:center; gap:4px;" onclick="selectPresetImage('${el.id}','Imagenes/LOGO 1.png')">${ICON_LANDMARK} Escudo</button>
          <button type="button" class="btn btn-ghost btn-sm" style="font-size:.65rem; padding:3px 6px; border:1px solid var(--gray-4); display:inline-flex; align-items:center; gap:4px;" onclick="selectPresetImage('${el.id}','Imagenes/Logo blanco.png')"><span style="width:9px; height:9px; border-radius:50%; background:#fff; border:1px solid var(--gray-4); flex-shrink:0;"></span> Blanco</button>
          <button type="button" class="btn btn-ghost btn-sm" style="font-size:.65rem; padding:3px 6px; border:1px solid var(--gray-4); display:inline-flex; align-items:center; gap:4px;" onclick="selectPresetImage('${el.id}','Imagenes/Logo negro.png')"><span style="width:9px; height:9px; border-radius:50%; background:#000; flex-shrink:0;"></span> Negro</button>
          <button type="button" class="btn btn-ghost btn-sm" style="font-size:.65rem; padding:3px 6px; border:1px solid var(--gray-4); display:inline-flex; align-items:center; gap:4px;" onclick="selectPresetImage('${el.id}','Imagenes/CIUDAD MÁGICA LOGO.png')">${ICON_SPARKLES} Ciudad Mágica</button>
        </div>

        <div class="icon-sel-drop"
             id="drop-${el.id}"
             onclick="document.getElementById('file-${el.id}').click()"
             ondragover="event.preventDefault(); this.classList.add('drag-over')"
             ondragleave="this.classList.remove('drag-over')"
             ondrop="handleIconDrop(event,'${el.id}')">
          <div style="display:flex; align-items:center; justify-content:center; gap:6px;"><svg class="icon-line" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px; height:14px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg> Subir propia imagen o arrastrar</div>
          <div style="font-size:.65rem; color:var(--gray-3); margin-top:4px;">JPG · PNG · GIF · SVG · Máx. 1 MB</div>
        </div>
        <input type="file" id="file-${el.id}" accept="image/*,.gif,.svg" style="display:none;" onchange="handleIconFile(this,'${el.id}')" />
      </div>

      <!-- GIF/URL panel (hidden) -->
      <div class="icon-sel-input" id="inp-gif-${el.id}" style="display:none;">
        <input type="url" class="form-control" id="gif-url-${el.id}"
               placeholder="https://media.giphy.com/..."
               oninput="updateIconPreviewUrl('${el.id}')" />
        <div style="font-size:.68rem; color:var(--gray-2);">
          Pega una URL de imagen o GIF animado (Giphy, Tenor, etc.)
        </div>
      </div>

      <!-- Ocultar panel (hidden) -->
      <div class="icon-sel-input" id="inp-none-${el.id}" style="display:none;">
        <div style="font-size:.75rem; color:var(--gray-3); text-align:center; padding:8px 0; display:flex; align-items:center; justify-content:center; gap:6px;">
          ${ICON_EYE_OFF} Este elemento no se mostrará en el sitio público. Guarda para aplicar.
        </div>
      </div>

    </div>
  `).join('');

  // Restore previously saved state
  loadAppearance();
}

// ── Switch input type ─────────────────────────────
function setIconSelType(id, type) {
  ['emoji','image','gif','none'].forEach(t => {
    document.getElementById(`inp-${t}-${id}`).style.display  = t === type ? '' : 'none';
    document.getElementById(`type-${t}-${id}`).classList.toggle('active', t === type);
  });
  if (type === 'none') {
    // "Ocultar" no necesita más datos: se marca completo de inmediato.
    appearanceState[id] = { type: 'none', value: 'hidden' };
    const prev = document.getElementById(`prev-${id}`);
    if (prev) prev.innerHTML = ICON_EYE_OFF;
  } else {
    // Si venía de "Ocultar", empieza limpio (no arrastrar value:'hidden'
    // como si fuera un emoji/URL real).
    const was = appearanceState[id];
    appearanceState[id] = (was && was.type === 'none') ? { type } : (was || {});
    appearanceState[id].type = type;
  }
}

// ── Select a preset emoji ─────────────────────────
function selectEmoji(id, emoji) {
  document.getElementById(`emoji-text-${id}`).value = emoji;
  // highlight selected
  document.querySelectorAll(`#emoji-row-${id} .icon-sel-emoji-item`).forEach(el => {
    el.classList.toggle('selected', el.textContent === emoji);
  });
  appearanceState[id] = { type: 'emoji', value: emoji };
  document.getElementById(`prev-${id}`).innerHTML = emoji;
}

// ── Live preview from text input ──────────────────
function updateIconPreview(id) {
  const val = document.getElementById(`emoji-text-${id}`).value;
  if (!val) return;
  appearanceState[id] = { type: 'emoji', value: val };
  document.getElementById(`prev-${id}`).innerHTML = val;
}

// ── Live preview from URL input ───────────────────
function updateIconPreviewUrl(id) {
  const url = document.getElementById(`gif-url-${id}`).value.trim();
  if (!url) return;
  appearanceState[id] = { type: 'gif', value: url };
  document.getElementById(`prev-${id}`).innerHTML =
    `<img src="${url}" alt="Vista previa del ícono" style="width:100%;height:100%;object-fit:contain;" onerror="this.parentNode.innerHTML='✕'"/>`;
}

// ── Select a preset official municipal logo ───────
function selectPresetImage(id, url) {
  appearanceState[id] = { type: 'image', value: url };
  document.getElementById(`prev-${id}`).innerHTML =
    `<img src="${url}" alt="Vista previa del ícono" style="width:100%;height:100%;object-fit:contain;border-radius:8px;"/>`;
  const name = url.split('/').pop();
  document.getElementById(`drop-${id}`).innerHTML =
    `<div style="display:flex; align-items:center; gap:5px;">${ICON_CHECK_CIRCLE} Seleccionado: ${name}</div><div style="font-size:.65rem;color:var(--gray-3);margin-top:3px;">Haz clic para cambiar o subir otra</div>`;
}

// ── Handle file upload (con optimización Canvas) ──
function handleIconFile(input, id) {
  const files = input.files || (input.target && input.target.files);
  const file = files ? files[0] : null;
  if (!file) return;

  const reader = new FileReader();
  reader.onload = e => {
    const rawSrc = e.target.result;
    const img = new Image();
    img.onload = () => {
      // Redimensionar canvas a máx 400px para almacenamiento inmediato en localStorage sin rebasar cuota
      const maxDim = 400;
      let w = img.width;
      let h = img.height;
      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);

      const mime = (file.type === 'image/png' || file.name.toLowerCase().endsWith('.png')) ? 'image/png' : 'image/jpeg';
      const optimizedSrc = canvas.toDataURL(mime, 0.85);

      appearanceState[id] = { type: 'image', value: optimizedSrc, name: file.name };

      const prev = document.getElementById(`prev-${id}`);
      if (prev) prev.innerHTML = `<img src="${optimizedSrc}" alt="Vista previa del ícono" style="width:100%;height:100%;object-fit:contain;border-radius:8px;"/>`;

      const drop = document.getElementById(`drop-${id}`);
      if (drop) drop.innerHTML = `<div style="display:flex; align-items:center; gap:5px;">${ICON_CHECK_CIRCLE} ${file.name}</div><div style="font-size:.65rem;color:var(--gray-3);margin-top:3px;">Imagen lista para guardar y publicar</div>`;
    };

    img.onerror = () => {
      appearanceState[id] = { type: 'image', value: rawSrc, name: file.name };
      const prev = document.getElementById(`prev-${id}`);
      if (prev) prev.innerHTML = `<img src="${rawSrc}" alt="Vista previa del ícono" style="width:100%;height:100%;object-fit:contain;border-radius:8px;"/>`;
    };

    img.src = rawSrc;
  };
  reader.readAsDataURL(file);
  if (input.value !== undefined) input.value = '';
}

// ── Handle drag & drop file ───────────────────────
function handleIconDrop(event, id) {
  event.preventDefault();
  document.getElementById(`drop-${id}`)?.classList.remove('drag-over');
  const file = event.dataTransfer.files[0];
  if (!file) return;
  const fakeInput = { files: [file] };
  handleIconFile(fakeInput, id);
}

// ── Save all to localStorage ──────────────────────
function saveAppearance() {
  if (Object.keys(appearanceState).length === 0) {
    showToast('No hay cambios que guardar', 'error');
    return;
  }

  // Descarta tarjetas incompletas: pasa cuando se hace clic en una pestaña
  // (Emoji/Imagen/GIF) pero nunca se llega a elegir un emoji, subir un
  // archivo o pegar una URL — sin esto se guardaba un ícono "vacío" que
  // rompía esa imagen en TODO el sitio público.
  const incompletos = Object.entries(appearanceState).filter(([, v]) => !v || !v.value);
  incompletos.forEach(([id]) => delete appearanceState[id]);

  if (Object.keys(appearanceState).length === 0 && incompletos.length) {
    showToast('No se guardó nada: elige un emoji, imagen o GIF antes de guardar', 'error');
    return;
  }

  try {
    localStorage.setItem('padron_appearance_config', JSON.stringify(appearanceState));
    pushConfigToServer('padron_appearance_config', appearanceState);
    if (incompletos.length) {
      const nombres = incompletos.map(([id]) => ICON_ELEMENTS.find(e => e.id === id)?.label || id).join(', ');
      showToast(`Guardado, pero "${nombres}" no tenía nada seleccionado y se omitió`, 'error');
    } else {
      showToast('Apariencia e íconos guardados y publicados con éxito', 'success');
    }
    if (typeof applyAppearanceConfig === 'function') applyAppearanceConfig();
  } catch(err) {
    showToast('Error de almacenamiento: El archivo es demasiado grande', 'error');
  }
}

// ── Reset all to defaults ─────────────────────────
function resetAppearance() {
  appearanceState = {};
  localStorage.removeItem('padron_appearance_config');
  buildIconSelectors(); // re-render with defaults
  showToast('Apariencia restablecida a valores predeterminados', 'info');
}

// ── Load appearance from localStorage ────────────
function loadAppearance() {
  const raw = localStorage.getItem('padron_appearance_config');
  if (!raw) return;
  try {
    const saved = JSON.parse(raw);
    appearanceState = saved;
    Object.entries(saved).forEach(([id, val]) => {
      const prev = document.getElementById(`prev-${id}`);
      if (!prev || !val) return;

      setIconSelType(id, val.type);
      if (val.type === 'none') return; // setIconSelType ya puso el 🚫 en el preview

      if (val.type === 'emoji') {
        const input = document.getElementById(`emoji-text-${id}`);
        if (input) input.value = val.value;
        prev.innerHTML = val.value;
        document.querySelectorAll(`#emoji-row-${id} .icon-sel-emoji-item`).forEach(el => {
          el.classList.toggle('selected', el.textContent === val.value);
        });
      } else {
        prev.innerHTML = `<img src="${val.value}" alt="Vista previa del ícono" style="width:100%;height:100%;object-fit:contain;" onerror="this.parentNode.innerHTML='✕'"/>`;
        if (val.type === 'gif') {
          const input = document.getElementById(`gif-url-${id}`);
          if (input) input.value = val.value;
        } else if (val.type === 'image') {
          const drop = document.getElementById(`drop-${id}`);
          const name = val.value.startsWith('data:') ? 'Imagen personal subida' : val.value.split('/').pop();
          if (drop) drop.innerHTML = `<div style="display:flex; align-items:center; gap:5px;">${ICON_CHECK_CIRCLE} ${name}</div><div style="font-size:.65rem;color:var(--gray-3);margin-top:3px;">Haz clic para cambiar</div>`;
        }
      }
    });
  } catch(e) { /* ignore */ }
}

// (buildIconSelectors() se llama desde initAdmin(), ver primeConfigFromServer())

