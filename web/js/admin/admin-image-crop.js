/* ══════════════════════════════════════════════════ */
/*  AJUSTAR IMAGEN (arrastrar + zoom) — modal          */
/*  Compartido por el banner de Avisos y la imagen de  */
/*  portada de Artículos (los dos llaman previewBanner  */
/*  en admin-config-shared.js, que abre este modal en   */
/*  vez de recortar directo al centro).                 */
/* ══════════════════════════════════════════════════ */
let cropState = null;

// Para que el recuadro de análisis sea rápido sin importar qué tan grande
// sea la foto original (un celular fácil da 3000px+ de lado), se dibuja
// primero a esta escala reducida nada más para detectar bordes.
const CONTENT_SCAN_MAX = 220;

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
    // Zoom mínimo (1) = la imagen completa (con todo y márgenes) cubre el
    // recuadro sin dejar huecos, igual que object-fit:cover — el usuario
    // siempre puede volver hasta aquí con el control deslizante.
    cropState.baseScale = Math.max(cropState.stageW / cropState.naturalW, cropState.stageH / cropState.naturalH);
    // Muchos íconos/logos traen de fábrica bastante relleno blanco o
    // transparente alrededor del dibujo real (como este caso: un ícono de
    // puente con medio recuadro en blanco debajo de los arcos). Cubrir el
    // recuadro con la imagen completa es "correcto" mostrando lo que sea
    // que tenga la imagen — pero no es lo que casi siempre se quiere de
    // entrada. Se detectan esos márgenes y se arranca ya enfocado en el
    // contenido real; el usuario sigue pudiendo alejar el zoom hasta 1
    // para ver la imagen completa si así la prefiere.
    cropState.content = detectContentBounds(probe, cropState.naturalW, cropState.naturalH);

    document.getElementById('crop-img').src = dataUrl;
    applyAutoFrame();
  };
  probe.onerror = () => showToast('No se pudo procesar la imagen', 'error');
  probe.src = dataUrl;
}

// Analiza la imagen a baja resolución para encontrar el rectángulo que
// envuelve el contenido "real" (lo que no es fondo blanco/transparente).
// Devuelve coordenadas ya convertidas a píxeles naturales, o null si no
// hay un margen claro que recortar (ej. una foto normal sin bordes).
function detectContentBounds(img, naturalW, naturalH) {
  try {
    const scale = Math.min(1, CONTENT_SCAN_MAX / Math.max(naturalW, naturalH));
    const w = Math.max(1, Math.round(naturalW * scale));
    const h = Math.max(1, Math.round(naturalH * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, w, h);
    const data = ctx.getImageData(0, 0, w, h).data;

    const isBackground = (r, g, b, a) => a < 16 || (r > 243 && g > 243 && b > 243);
    let minX = w, minY = h, maxX = -1, maxY = -1;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        if (isBackground(data[i], data[i+1], data[i+2], data[i+3])) continue;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }

    if (maxX < 0 || maxY < 0) return null; // imagen toda en blanco/transparente: no hay nada que enfocar
    const contentW = maxX - minX + 1, contentH = maxY - minY + 1;
    // Si el contenido ya ocupa casi todo el lienzo (foto normal, sin
    // márgenes de sobra) no vale la pena forzar un zoom automático.
    if (contentW > w * 0.96 && contentH > h * 0.96) return null;

    return {
      x: minX / scale, y: minY / scale,
      w: contentW / scale, h: contentH / scale,
    };
  } catch (e) {
    return null; // cualquier falla de lectura del canvas: se sigue con la imagen completa, sin romper el recortador
  }
}

// Calcula el zoom/posición inicial: si se detectaron márgenes de sobra,
// arranca ya acercado y centrado en el contenido real; si no, el
// comportamiento de siempre (imagen completa centrada, zoom mínimo).
function applyAutoFrame() {
  const s = cropState;
  let zoom = 1, cx = s.naturalW / 2, cy = s.naturalH / 2;

  if (s.content) {
    const contentCoverScale = Math.max(s.stageW / s.content.w, s.stageH / s.content.h);
    // El slider llega hasta 3x — no tiene sentido forzar un zoom inicial
    // más allá de eso (se vería pixelado); el usuario puede seguir
    // acercando a mano si de verdad lo necesita.
    zoom = Math.min(3, Math.max(1, contentCoverScale / s.baseScale));
    cx = s.content.x + s.content.w / 2;
    cy = s.content.y + s.content.h / 2;
  }

  s.zoomFactor = zoom;
  document.getElementById('crop-zoom').value = zoom;
  const displayScale = s.baseScale * zoom;
  s.offsetX = s.stageW / 2 - cx * displayScale;
  s.offsetY = s.stageH / 2 - cy * displayScale;
  clampCropOffset();
  applyCropTransform();
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
  applyAutoFrame();
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
