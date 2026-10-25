/* ══════════════════════════════════════════════════ */
/*  AJUSTAR IMAGEN (arrastrar + zoom) — modal          */
/*  Compartido por el banner de Avisos y la imagen de  */
/*  portada de Artículos (los dos llaman previewBanner  */
/*  en admin-config-shared.js, que abre este modal en   */
/*  vez de recortar directo al centro).                 */
/* ══════════════════════════════════════════════════ */
let cropState = null;

// Recuadros que arrancan con la imagen COMPLETA y centrada (como en
// "Apariencia e íconos"), rellenando lo que sobra con el color del borde
// de la propia imagen. Los demás (banner de Avisos) arrancan llenando el
// recuadro (tipo object-fit:cover), porque en la portada llevan texto
// encima y un banner con franjas se vería mal.
const CROP_COMPLETA = ['art-banner-prev'];

// Color MÁS COMÚN del borde de la imagen (compuesta sobre blanco, por si
// es PNG con transparencia) — para rellenar las franjas sin que se noten
// en ilustraciones con fondo liso. Es el más común y no el promedio a
// propósito: con el promedio, una franja de color en una sola orilla
// teñía todo el relleno (una franja roja abajo lo volvía rosa).
function colorDeBorde(img) {
  const N = 32;
  const c = document.createElement('canvas');
  c.width = N; c.height = N;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, N, N);
  ctx.drawImage(img, 0, 0, N, N);
  const px = ctx.getImageData(0, 0, N, N).data;
  // Agrupa los píxeles del borde en "cubetas" de color parecido (16 tonos
  // por canal) y se queda con el promedio de la cubeta más llena.
  const cubetas = new Map();
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      if (x !== 0 && y !== 0 && x !== N - 1 && y !== N - 1) continue;
      const i = (y * N + x) * 4;
      const clave = (px[i] >> 4) << 8 | (px[i + 1] >> 4) << 4 | (px[i + 2] >> 4);
      const cub = cubetas.get(clave) || { r: 0, g: 0, b: 0, n: 0 };
      cub.r += px[i]; cub.g += px[i + 1]; cub.b += px[i + 2]; cub.n++;
      cubetas.set(clave, cub);
    }
  }
  const mayor = [...cubetas.values()].reduce((a, b) => (b.n > a.n ? b : a));
  return `rgb(${Math.round(mayor.r / mayor.n)}, ${Math.round(mayor.g / mayor.n)}, ${Math.round(mayor.b / mayor.n)})`;
}

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
    // Zoom mínimo (1):
    //  - Artículos (CROP_COMPLETA): la imagen ENTERA cabe en el recuadro y
    //    queda centrada (como object-fit:contain); lo que sobra se rellena
    //    con el color del borde. Antes arrancaba como "cover" y en una
    //    imagen casi cuadrada eso cortaba arriba y abajo (el texto quedaba
    //    pegado arriba y al perro se le cortaba el cuerpo, 2026-10-25).
    //  - Avisos: la imagen cubre el recuadro sin dejar huecos (como
    //    object-fit:cover).
    // A partir de ahí la persona acerca/mueve a su gusto. Se probó que el
    // zoom arrancara ya acercado al "contenido" detectado, pero no siempre
    // acertaba (ver HISTORIAL_CAMBIOS, 2026-10-07e/i).
    const s = cropState;
    const fit   = Math.min(s.stageW / s.naturalW, s.stageH / s.naturalH);
    const cover = Math.max(s.stageW / s.naturalW, s.stageH / s.naturalH);
    s.completa  = CROP_COMPLETA.includes(targetPrevId);
    s.baseScale = s.completa ? fit : cover;
    // El zoom máximo sigue siendo 3× "cover", sin importar desde dónde arranque.
    s.zoomMax = 3 * cover / s.baseScale;
    s.relleno = s.completa ? colorDeBorde(probe) : '#fff';
    document.getElementById('crop-zoom').max = s.zoomMax;
    stage.style.background = s.completa ? s.relleno : '';

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

// En el sentido en que la imagen es MÁS GRANDE que el recuadro, nunca deja
// ver un hueco (su borde no puede quedar más adentro que el del recuadro).
// En el sentido en que es más chica (solo pasa en modo "completa"), la
// mantiene centrada — así nunca queda pegada a una orilla.
function clampCropOffset() {
  const s = cropState;
  const displayScale = s.baseScale * s.zoomFactor;
  const ajustar = (offset, stage, display) =>
    display <= stage ? (stage - display) / 2 : Math.min(0, Math.max(stage - display, offset));
  s.offsetX = ajustar(s.offsetX, s.stageW, s.naturalW * displayScale);
  s.offsetY = ajustar(s.offsetY, s.stageH, s.naturalH * displayScale);
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

// Vista previa en el formulario con la MISMA forma (2.5:1) que el recuadro
// de "Ajustar imagen" y que la tarjeta de la portada — antes era una franja
// de 120px de alto con object-fit:cover que volvía a recortar la imagen y
// no se parecía a lo que se veía al ajustarla.
function htmlVistaPreviaRecorte(src, alt) {
  return `<img src="${src}" alt="${alt}" style="display:block; width:100%; max-width:420px; aspect-ratio:2.5/1; object-fit:cover; border-radius:var(--radius); margin-top:6px; border:1px solid var(--gray-4);" />`;
}

function applyImageCrop() {
  if (!cropState) return;
  const s = cropState;
  const displayScale = s.baseScale * s.zoomFactor;

  // Dibuja la imagen con el mismo tamaño y posición que tiene en el
  // recuadro, solo que a la resolución de salida. Así funciona igual si la
  // imagen se sale del recuadro (se recorta sola) o si queda más chica
  // (modo "completa": las franjas llevan el color de relleno).
  const k = 1200 / s.stageW;
  const outW = 1200;
  const outH = Math.round(outW * (s.stageH / s.stageW));
  const canvas = document.createElement('canvas');
  canvas.width = outW; canvas.height = outH;
  const ctx = canvas.getContext('2d');
  // Mismo motivo que en previewBanner(): JPEG no tiene canal alpha.
  ctx.fillStyle = s.relleno;
  ctx.fillRect(0, 0, outW, outH);
  ctx.drawImage(document.getElementById('crop-img'),
    s.offsetX * k, s.offsetY * k, s.naturalW * displayScale * k, s.naturalH * displayScale * k);
  const optimized = canvas.toDataURL('image/jpeg', 0.85);

  const el = document.getElementById(s.targetPrevId);
  if (el) el.innerHTML = htmlVistaPreviaRecorte(optimized, 'Vista previa de la imagen');
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
      const newZoom = Math.min(cropState.zoomMax, Math.max(1, startZoom * (dist / startDist)));
      document.getElementById('crop-zoom').value = newZoom;
      updateCropZoom(newZoom);
    });
    const endHandleDrag = () => { handleDragging = false; };
    handle.addEventListener('pointerup', endHandleDrag);
    handle.addEventListener('pointercancel', endHandleDrag);
  });
});
