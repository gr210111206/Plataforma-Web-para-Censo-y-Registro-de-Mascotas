/* ══════════════════════════════════════════════════ */
/*  AJUSTAR IMAGEN (arrastrar + zoom) — modal          */
/*  Compartido por el banner de Avisos y la imagen de  */
/*  portada de Artículos (los dos llaman previewBanner  */
/*  en admin-config-shared.js, que abre este modal en   */
/*  vez de recortar directo al centro).                 */
/* ══════════════════════════════════════════════════ */
let cropState = null;

function openImageCropper(dataUrl, targetPrevId) {
  const probe = new Image();
  probe.onload = () => {
    // El modal debe abrirse ANTES de medir el recuadro: .modal-overlay
    // empieza en display:none, y un elemento oculto siempre mide 0x0.
    openModal('modal-image-crop');
    const stage = document.getElementById('crop-stage');
    // offsetWidth/offsetHeight, NO getBoundingClientRect(): el modal tiene
    // una animación de entrada (transform: scale(.95) → scale(1), ver
    // @keyframes modal-in en styles.css) y getBoundingClientRect() SÍ
    // incluye esa transformación en curso — medía el recuadro todavía
    // encogido al primer instante de la animación. offsetWidth/Height
    // reportan el tamaño real del layout, sin verse afectados por
    // transform, así que no importa en qué momento de la animación se
    // llame a esto.
    cropState = {
      targetPrevId,
      naturalW: probe.naturalWidth,
      naturalH: probe.naturalHeight,
      stageW: stage.offsetWidth,
      stageH: stage.offsetHeight,
      zoomFactor: 1,
      offsetX: 0,
      offsetY: 0,
    };
    // Zoom mínimo (1) = la imagen completa cubre el recuadro sin dejar
    // huecos, igual que object-fit:cover — a partir de ahí la persona
    // acerca/mueve a su gusto. Se probó que el zoom arrancara ya acercado
    // automáticamente al "contenido" detectado de la imagen, pero no
    // siempre acertaba qué parte era la interesante (ver HISTORIAL_CAMBIOS,
    // 2026-10-07e/i) — mejor arrancar siempre igual: completa y centrada,
    // lista para que la persona decida.
    cropState.baseScale = Math.max(cropState.stageW / cropState.naturalW, cropState.stageH / cropState.naturalH);

    document.getElementById('crop-img').src = dataUrl;
    resetImageCrop();
  };
  probe.onerror = () => showToast('No se pudo procesar la imagen', 'error');
  probe.src = dataUrl;
}

function applyCropTransform() {
  const s = cropState;
  const displayScale = s.baseScale * s.zoomFactor;
  const img = document.getElementById('crop-img');
  img.style.width  = (s.naturalW * displayScale) + 'px';
  img.style.height = (s.naturalH * displayScale) + 'px';
  img.style.transform = `translate(${s.offsetX}px, ${s.offsetY}px)`;
}

// Nunca deja que se vea un hueco vacío dentro del recuadro — el borde de
// la imagen nunca puede quedar más adentro que el borde del recuadro.
function clampCropOffset() {
  const s = cropState;
  const displayScale = s.baseScale * s.zoomFactor;
  const displayW = s.naturalW * displayScale;
  const displayH = s.naturalH * displayScale;
  const minX = Math.min(0, s.stageW - displayW);
  const minY = Math.min(0, s.stageH - displayH);
  s.offsetX = Math.min(0, Math.max(minX, s.offsetX));
  s.offsetY = Math.min(0, Math.max(minY, s.offsetY));
}

function updateCropZoom(val) {
  if (!cropState) return;
  const s = cropState;
  // Acerca/aleja manteniendo fijo el punto que está al centro del
  // recuadro (si no, el zoom "salta" hacia la esquina superior
  // izquierda en vez de sentirse natural).
  const oldScale = s.baseScale * s.zoomFactor;
  const cx = s.stageW / 2, cy = s.stageH / 2;
  const imgCx = (cx - s.offsetX) / oldScale;
  const imgCy = (cy - s.offsetY) / oldScale;

  s.zoomFactor = parseFloat(val);
  const newScale = s.baseScale * s.zoomFactor;
  s.offsetX = cx - imgCx * newScale;
  s.offsetY = cy - imgCy * newScale;

  clampCropOffset();
  applyCropTransform();
}

function resetImageCrop() {
  if (!cropState) return;
  const s = cropState;
  s.zoomFactor = 1;
  document.getElementById('crop-zoom').value = 1;
  s.offsetX = (s.stageW - s.naturalW * s.baseScale) / 2;
  s.offsetY = (s.stageH - s.naturalH * s.baseScale) / 2;
  applyCropTransform();
}

function cancelImageCrop() {
  cropState = null;
  closeModal('modal-image-crop');
}

function applyImageCrop() {
  if (!cropState) return;
  const s = cropState;
  const displayScale = s.baseScale * s.zoomFactor;

  // Convierte el recuadro visible (en px de pantalla) a coordenadas
  // reales dentro de la imagen original, para recortar justo esa parte.
  const srcX = -s.offsetX / displayScale;
  const srcY = -s.offsetY / displayScale;
  const srcW = s.stageW / displayScale;
  const srcH = s.stageH / displayScale;

  const outW = 1200;
  const outH = Math.round(outW * (s.stageH / s.stageW));
  const canvas = document.createElement('canvas');
  canvas.width = outW; canvas.height = outH;
  const ctx = canvas.getContext('2d');
  // Mismo motivo que en previewBanner(): JPEG no tiene canal alpha.
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, outW, outH);
  ctx.drawImage(document.getElementById('crop-img'), srcX, srcY, srcW, srcH, 0, 0, outW, outH);
  const optimized = canvas.toDataURL('image/jpeg', 0.85);

  const el = document.getElementById(s.targetPrevId);
  if (el) {
    el.innerHTML = `<img src="${optimized}" alt="Vista previa del banner" style="width:100%; max-height:120px; object-fit:cover; border-radius:var(--radius); margin-top:6px;" />`;
  }
  cropState = null;
  closeModal('modal-image-crop');
  showToast('Imagen ajustada', 'success');
}

/* Arrastrar con el puntero (mouse o dedo, pointer events cubre los dos). */
document.addEventListener('DOMContentLoaded', () => {
  const stage = document.getElementById('crop-stage');
  if (!stage) return;
  let dragging = false, startX = 0, startY = 0, startOffX = 0, startOffY = 0;

  stage.addEventListener('pointerdown', e => {
    if (!cropState) return;
    dragging = true;
    stage.setPointerCapture(e.pointerId);
    startX = e.clientX; startY = e.clientY;
    startOffX = cropState.offsetX; startOffY = cropState.offsetY;
    stage.style.cursor = 'grabbing';
  });
  stage.addEventListener('pointermove', e => {
    if (!dragging || !cropState) return;
    cropState.offsetX = startOffX + (e.clientX - startX);
    cropState.offsetY = startOffY + (e.clientY - startY);
    clampCropOffset();
    applyCropTransform();
  });
  const endDrag = () => { dragging = false; stage.style.cursor = 'grab'; };
  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', endDrag);
  stage.addEventListener('pointerleave', () => { if (dragging) endDrag(); });

  // Manijas de esquina: jalarlas hacia afuera/adentro cambia el zoom,
  // anclado al centro del recuadro — mismo mecanismo que ya usa el slider
  // (updateCropZoom), solo que impulsado por la distancia que se arrastró
  // en vez del valor del input. Así se sienten como si "estiraran" el
  // recorte en vez de ser nada más decorativas.
  ['tl', 'tr', 'bl', 'br'].forEach(corner => {
    const handle = document.getElementById(`crop-handle-${corner}`);
    if (!handle) return;
    let handleDragging = false, startDist = 1, startZoom = 1;

    handle.addEventListener('pointerdown', e => {
      if (!cropState) return;
      e.stopPropagation(); // que no dispare también el arrastre de imagen del recuadro
      handleDragging = true;
      handle.setPointerCapture(e.pointerId);
      const rect = stage.getBoundingClientRect();
      const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
      startDist = Math.hypot(e.clientX - cx, e.clientY - cy) || 1;
      startZoom = cropState.zoomFactor;
    });
    handle.addEventListener('pointermove', e => {
      if (!handleDragging || !cropState) return;
      const rect = stage.getBoundingClientRect();
      const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
      const dist = Math.hypot(e.clientX - cx, e.clientY - cy) || 1;
      const newZoom = Math.min(3, Math.max(1, startZoom * (dist / startDist)));
      document.getElementById('crop-zoom').value = newZoom;
      updateCropZoom(newZoom);
    });
    const endHandleDrag = () => { handleDragging = false; };
    handle.addEventListener('pointerup', endHandleDrag);
    handle.addEventListener('pointercancel', endHandleDrag);
  });
});
