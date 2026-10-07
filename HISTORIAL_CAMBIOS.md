# 📜 Historial de Cambios — Padrón Municipal de Mascotas (El Grullo)

Este documento registra cronológicamente todos los cambios, mejoras, correcciones y actualizaciones realizadas en la plataforma web y base de datos del proyecto. Nota: en entradas anteriores al 2026-09-10 el proyecto se refería a sí mismo internamente como "REMAC" — se dejó tal cual en el cuerpo de esas entradas por ser un registro histórico, aunque el nombre ya no se usa (ver entrada del 2026-09-10).

## 📅 [2026-10-07h] — Las esquinas del recortador de imagen ahora son manijas arrastrables

### 🤔 Contexto
El usuario vio las marcas de esquina de la entrada anterior y notó que eran solo decorativas — esperaba poder "agarrarlas" para cambiar el tamaño del recorte, como una manija real.

### 🔧 Cambios
- **`web/admin.html`**: las 4 marcas de esquina de `#crop-stage` pasaron de un solo `<div>` decorativo a 4 `<span>` independientes (`crop-handle-tl/tr/bl/br`), cada uno con un área de arrastre de 22×22px (el trazo visible sigue siendo de 16px, el área alrededor es más fácil de agarrar con el mouse) y cursor de redimensionar (`nwse-resize`/`nesw-resize` según la esquina).
- **`web/js/admin/admin-image-crop.js`**: se agregó el manejo de arrastre de las 4 manijas — al jalar una esquina hacia afuera o hacia adentro, se calcula qué tanto cambió la distancia al centro del recuadro desde que empezó el arrastre, y ese cambio se traduce a zoom (misma función `updateCropZoom()` que ya usa el slider, así que queda anclado al centro igual que siempre). `e.stopPropagation()` en el `pointerdown` de cada manija evita que también se dispare el arrastre de la imagen del recuadro al mismo tiempo.

### 🔎 Verificado
- `node --check` sin errores.
- Revisado a mano que la posición visual de las 4 marcas no cambió al anidarlas dentro de su propio `<span>` de 22×22px (las coordenadas internas se ajustaron para que el trazo visible caiga exactamente donde antes).
- Sin navegador disponible en este entorno — pendiente que el usuario lo pruebe.

### 📂 Archivos modificados
- `web/admin.html`
- `web/js/admin/admin-image-crop.js`

## 📅 [2026-10-07g] — Marcas de esquina decorativas en el recortador de imagen

### 🤔 Contexto
El usuario (voz a texto, mensaje largo) pidió que el recuadro de recorte tuviera "cuadritos en las esquinas" como las capturas de referencia que había compartido antes. Se le preguntó directo con dos opciones: (a) mantener el sistema actual de arrastrar+zoom y solo agregar marcas decorativas en las esquinas para que se vea más claramente como herramienta de recorte, o (b) rediseñar el control completo a un recuadro de selección con manijas reales y arrastrables sobre la imagen fija (como el recorte de Fotos de Windows). Eligió la opción (a).

### 🔧 Cambios
- **`web/admin.html`**: se agregaron 4 marcas de esquina (estilo visor de cámara / herramienta de recorte de Photoshop) dentro de `#crop-stage`, en una capa `pointer-events:none` para no interferir con arrastrar la imagen. Es puramente visual — no cambia la mecánica de arrastrar+zoom que ya existía, ni afecta el recorte que se genera al dar "Aplicar" (que sigue leyendo directo de `#crop-img`, no de esta capa).

### 🔎 Verificado
- Revisión de que la nueva capa de marcas no contribuye al tamaño de `#crop-stage` (es `position:absolute` con `inset:0`) y no afecta `openImageCropper()`/`applyImageCrop()`, que miden/leen otros elementos.
- Sin navegador disponible en este entorno — pendiente que el usuario lo vea.

### 📂 Archivos modificados
- `web/admin.html`

## 📅 [2026-10-07f] — Íconos de alejar/acercar del recortador de imagen

### 🤔 Contexto
El usuario confirmó que el recortador ya funciona bien y notó, de paso, que los dos íconos a los lados del control de zoom eran el mismo ícono genérico de "imagen" repetido — no comunicaban que ese control acerca/aleja.

### 🔧 Cambios
- **`web/admin.html`**: los dos `<svg>` junto al slider `#crop-zoom` ahora son una lupa con signo "−" (alejar, a la izquierda) y una lupa con signo "+" (acercar, a la derecha), en vez del mismo ícono de imagen repetido dos veces.

### 🔎 Verificado
- Revisión visual del SVG a mano (coordenadas de los íconos estándar de lupa con +/−).

### 📂 Archivos modificados
- `web/admin.html`

## 📅 [2026-10-07e] — El recortador de imagen ahora enfoca el contenido real, no el margen en blanco

### 🤔 Contexto
Después del fix del `max-width` (entrada anterior), el usuario probó de nuevo con un ícono de prueba (un puente, con bastante blanco dibujado debajo de los arcos) y seguía viendo el recuadro "mal". Revisando la captura con cuidado: el recuadro sí estaba lleno de borde a borde — ya no era el bug del hueco. El problema era otro: al abrir el recortador en zoom mínimo (object-fit:cover de la imagen completa), lo que se veía de entrada era, en parte, el propio relleno blanco que ya traía ese ícono — no un defecto del recortador, sino el contenido real del archivo. Muchos íconos/logos traen ese tipo de margen de fábrica.

### 🔧 Cambios
- **`web/js/admin/admin-image-crop.js`**: se agregó `detectContentBounds()`, que dibuja la imagen a baja resolución (máx. 220px de lado, para que sea rápido sin importar el tamaño real de la foto) y recorre los píxeles para encontrar el rectángulo que envuelve el contenido que no es fondo blanco/transparente (umbral: alfa < 16 o RGB > 243,243,243). Si encuentra un margen real (el contenido ocupa menos del 96% del lienzo en cualquier eje), `openImageCropper()` ya no arranca en el zoom mínimo centrado en la imagen completa — arranca con `applyAutoFrame()`, que calcula el zoom/posición necesarios para que ese contenido real cubra el recuadro desde un inicio, centrado. El control de zoom (1×–3×) sigue funcionando igual que antes para ajustar a mano; "Reiniciar" ahora vuelve a este mismo encuadre automático en vez de a la imagen completa sin recortar. Para fotos normales (sin márgenes, que es la mayoría de lo que se sube) el comportamiento no cambia: `detectContentBounds()` devuelve `null` y todo sigue igual que antes.
- Se quitó `centerCropImage()` (ya sin uso — `applyAutoFrame()` cubre ese caso cuando no hay contenido que recortar).

### 🔎 Verificado
- `node --check` sin errores.
- Revisado a mano: para una imagen sin márgenes (ej. una foto normal que llena todo su lienzo), `contentW`/`contentH` salen ≥96% del lienzo analizado y la función devuelve `null` → se usa el mismo camino de siempre (zoom 1, imagen completa centrada), sin cambio de comportamiento.
- Sin navegador disponible en este entorno para confirmar visualmente — pendiente que el usuario lo pruebe.

### 📂 Archivos modificados
- `web/js/admin/admin-image-crop.js`

## 📅 [2026-10-07d] — Corrige que el recortador de imagen no llenaba bien el recuadro (tercera causa)

### 🤔 Contexto
El usuario probó el fix anterior (medir con `offsetWidth`/`offsetHeight` en vez de `getBoundingClientRect()`) en PC de escritorio y la imagen seguía sin llenar el recuadro. El cálculo en JS (`baseScale`, `offsetX`/`offsetY`) ya era correcto, pero nunca se reflejaba bien en pantalla.

### 🔧 Cambios
- **`web/admin.html`**: la causa real era una regla CSS global, `img { max-width: 100%; }` (`styles.css:83`), pensada para que las imágenes normales del sitio no se desborden de su contenedor. `#crop-img` necesita justo lo contrario a propósito: para poder cubrir el recuadro y luego arrastrar/hacer zoom, el `<img>` tiene que poder renderizarse **más grande** que `#crop-stage` (eso es lo que permite que sobre tela para recortar). Esa regla global recortaba en silencio el ancho visual del `<img>` de vuelta al 100% del recuadro cada vez que la imagen necesitaba desbordarse horizontalmente para cubrirlo — la vista en pantalla ya no coincidía con lo que el JS pensaba que medía, dejando un hueco visible. Se agregó `max-width:none; max-height:none;` al estilo en línea de `#crop-img` para que esta regla global no le aplique a este elemento en particular.

### 🔎 Verificado
- Revisado que ningún otro elemento del flujo del recortador (las vistas previas ya aplicadas en `#aviso-prev`/`#art-banner-prev`) depende de `max-width:100%` — esas sí usan `width:100%` fijo y no necesitan desbordarse, así que no les afecta el cambio.
- No hay navegador disponible en este entorno — pendiente que el usuario lo vuelva a probar.

### 📂 Archivos modificados
- `web/admin.html`

## 📅 [2026-10-07c] — Corrige que el recortador de imagen no llenaba bien el recuadro (segunda causa)

### 🤔 Contexto
El fix anterior sí resolvió que la imagen apareciera, pero el usuario probó de nuevo (con capturas) y la imagen seguía sin llenar todo el recuadro — se veía encogida hacia la izquierda, con una franja gris vacía a la derecha. De paso compartió una referencia (documentación técnica, MIT, del recortador de imágenes de la app de escritorio VRCX) con el patrón general de este tipo de herramienta (recuadro de proporción fija + zoom + arrastrar), que confirmó que el diseño ya iba por buen camino — el problema seguía siendo de implementación, no de diseño.

### 🔧 Cambios
- **`web/js/admin/admin-image-crop.js`**: la causa real era más sutil que la del fix anterior. `.modal` tiene una animación de entrada (`@keyframes modal-in` en `styles.css`: `transform: scale(.95) → scale(1)`). `getBoundingClientRect()` **sí incluye las transformaciones CSS en curso** en el resultado — así que, aunque el modal ya estaba abierto (`display:flex`, el fix anterior), medía el recuadro justo en el primer instante de esa animación de "encogido" (`scale(.95)`), no su tamaño real ya asentado. Se cambió la medición a `offsetWidth`/`offsetHeight`, que reportan el tamaño real del layout **sin verse afectados por `transform`** — así no importa en qué momento exacto de la animación se mida.

### 🔎 Verificado
- `node --check` sin errores.
- Confirmado que ya no queda ningún uso de `getBoundingClientRect()` en el archivo.
- No hay navegador disponible en este entorno — pendiente que el usuario lo vuelva a probar tras desplegar.

### 📂 Archivos modificados
- `web/js/admin/admin-image-crop.js`

## 📅 [2026-10-07b] — Corrige que el recortador de imagen se veía en blanco y el recorte salía roto

### 🤔 Contexto
El usuario probó el recortador de imagen de la entrada anterior (minutos después de desplegarlo) y reportó, con capturas, que el recuadro de "Ajustar imagen" aparecía completamente vacío al seleccionar una foto, y que después de darle "Aplicar" la vista previa del banner quedaba como imagen rota.

### 🔧 Cambios
- **`web/js/admin/admin-image-crop.js`**: `openImageCropper()` medía el tamaño del recuadro (`#crop-stage`, con `getBoundingClientRect()`) **antes** de abrir el modal — en ese momento `.modal-overlay` todavía estaba en `display:none` (se abre hasta `openModal()`), y un elemento oculto siempre mide 0×0 con ese método. Con el recuadro midiendo 0×0, la imagen se escalaba a 0px de ancho/alto (por eso no se veía nada) y, al recortar, las coordenadas salían `NaN`/división entre cero, produciendo un recorte inválido (de ahí la vista previa rota). Se invirtió el orden: ahora `openModal('modal-image-crop')` se llama primero, y el recuadro se mide ya visible, con su tamaño real.

### 🔎 Verificado
- `node --check` sin errores.
- Revisado el cálculo a mano: con el recuadro ya visible, `getBoundingClientRect()` devuelve el ancho/alto reales del `<div>` (no 0), así que `baseScale` y el recorte final quedan con números válidos.
- No hay navegador disponible en este entorno — pendiente que el usuario lo vuelva a probar tras desplegar.

### 📂 Archivos modificados
- `web/js/admin/admin-image-crop.js`

## 📅 [2026-10-07] — Recortador de imagen (arrastrar + zoom) para el banner de Avisos y la portada de Artículos

### 🤔 Contexto
El usuario notó que la imagen de portada de un artículo se veía mal recortada en la tarjeta pública — no era un bug de CSS: `object-fit:cover` siempre recorta centrado, y si lo importante de la foto no está justo al centro, se corta mal de todos modos. Pidió algo como el editor de avatar de Discord: poder arrastrar y hacer zoom a la imagen antes de guardarla, para elegir a mano qué parte se usa.

### 🔧 Cambios
- **`web/js/admin/admin-image-crop.js`** (nuevo): modal de recorte interactivo — arrastrar con el puntero (mouse o dedo, vía Pointer Events) para reposicionar la imagen, control deslizante para acercar/alejar (de 1× = la imagen ya cubre todo el recuadro, hasta 3×), con "Reiniciar"/"Cancelar"/"Aplicar". Al aplicar, recorta exactamente lo que se ve en el recuadro a un canvas de 1200×480px (mismo relleno blanco contra transparencia que ya usaban las demás fotos del sitio) y lo deja listo en el mismo lugar donde antes quedaba el recorte automático.
- **`web/js/admin/admin-config-shared.js`** (`previewBanner()`): ya no recorta directo al centro — ahora abre el recortador nuevo y espera a que la persona confirme. Como esta función ya era compartida entre "Avisos y promociones" y la imagen de portada de "Nuevo artículo", el recortador quedó disponible en los dos de una vez, sin duplicar nada.
- **`web/admin.html`**: nuevo modal `modal-image-crop` (recuadro de recorte en proporción 2.5:1, igual que el alto fijo de la tarjeta de artículo en la portada pública) y su `<script src>` correspondiente.

### 🔎 Verificado
- `node --check` sin errores en `admin-image-crop.js` y `admin-config-shared.js`.
- Revisión de código del cálculo de recorte (coordenadas de pantalla → coordenadas reales de la imagen) y de que no hay colisión de nombres de función/variable con el resto de los archivos de `web/js/admin/`.
- No hay navegador disponible en este entorno para probar el arrastre/zoom de verdad — pendiente confirmarlo en el emulador tras desplegar.

### 📂 Archivos modificados
- `web/js/admin/admin-image-crop.js` (nuevo)
- `web/js/admin/admin-config-shared.js`
- `web/admin.html`

## 📅 [2026-10-04j] — Revisión completa de "Configuración" en celular: 2 columnas con ancho fijo más corregidas

### 🤔 Contexto
A petición del usuario ("revisa todos los botones de configuración del sitio porque en celular está como movido"), se revisaron a fondo las 10 pestañas de "Configuración del Sitio" (Portada, Reglamento, Avisos, Eventos, Contactos, FAQ, Apariencia, Municipio, Tema, SEO) buscando el mismo tipo de problema de las dos entradas anteriores.

### 🔧 Cambios
- **`web/admin.html`**: se encontraron 2 casos más del mismo problema, esta vez con columnas de **ancho fijo en píxeles** en vez de fracciones iguales (por eso no los cubría el fix de `.cfg-grid-2`/`.cfg-grid-3` de la entrada anterior):
  - **Contactos** (editor del footer): formulario + vista previa en vivo, columna derecha fija a `380px`.
  - **Tema visual**: formulario de color + vista previa en vivo, columna derecha fija a `300px`.
  - Se agregó la clase `cfg-grid-preview` a ambas, con `grid-template-columns: 1fr !important` en el `@media (max-width: 768px)` ya existente — el `!important` es necesario aquí porque el ancho de escritorio (380px/300px) sigue viniendo del `style=""` en línea de cada una, que por especificidad le gana a una regla externa sin él.
- **Revisado y confirmado SIN problema** (no requirió cambios): el selector de tipo de ícono (Emoji/Imagen/GIF-URL/Ocultar) en Apariencia ya tenía `flex-wrap` desde antes; Reglamento es una sola columna; FAQ ya usa `.faq-mgmt-layout`, que ya colapsaba a 1 columna; las filas tipo "etiqueta + control" (`.setting-row`, `grid-template-columns:1fr auto`) se adaptan solas porque su segunda columna es de ancho automático, no fijo.

### 🔎 Verificado
- Revisión completa, pestaña por pestaña, del HTML de las 10 secciones de Configuración — no quedó ninguna cuadrícula de ancho fijo sin su colapso a 1 columna en celular.
- No hay navegador disponible en este entorno — pendiente que el usuario lo confirme en el emulador tras desplegar.

### 📂 Archivos modificados
- `web/admin.html`

## 📅 [2026-10-04i] — Corrige el botón "Guardar apariencia" que se salía de la pantalla en celular

### 🤔 Contexto
Siguiendo la prueba en el emulador (entrada anterior), el usuario encontró con otra captura que en "Apariencia e íconos" el botón "Guardar apariencia" quedaba cortado, empujado fuera del borde derecho de la pantalla.

### 🔧 Cambios
- **`web/admin.html`** (`.appearance-save-bar`): a diferencia de las demás barras de "Guardar"/"Restablecer" del panel (que solo tienen los 2 botones en su propia fila), esta barra además trae un texto de ayuda ("Tip: Los GIFs animados son compatibles...") compartiendo la misma fila con los botones (`justify-content:space-between`, sin `flex-wrap`) — en celular, sin espacio para encogerse, el botón "Guardar apariencia" se salía del contenedor.
- Se agregó `flex-wrap: wrap` a la barra, y en el `@media (max-width: 768px)` ya existente se bajó el grupo de botones a su propia fila completa (abajo del texto), con los dos botones repartiéndose el ancho entre sí — mismo criterio que ya usan `.cfg-grid-2`/`.cfg-grid-3` (entrada anterior) para este mismo tipo de problema.

### 🔎 Verificado
- Revisión de código del cambio (acotado, sin tocar el resto del layout de escritorio, que sigue con el texto y los botones en la misma fila).
- No hay navegador disponible en este entorno — pendiente que el usuario lo confirme en el emulador tras desplegar.

### 📂 Archivos modificados
- `web/admin.html`

## 📅 [2026-10-04h] — Corrige cuadrículas de "Configuración" que se veían apretadas en celular

### 🤔 Contexto
Probando el panel admin en el emulador Android, el usuario encontró (con captura real) que la pestaña "Avisos y promociones" de Configuración se veía apretada en el celular — el formulario y la lista de avisos publicados, pensados como dos columnas lado a lado en escritorio, se comprimían una junto a la otra en pantallas angostas. Al revisar el código se encontró que era el mismo problema en **6 lugares** de "Configuración", no solo en Avisos: Portada (contadores y pasos), Avisos, Eventos, Municipio (logo/escudo) y SEO — todos usaban `display:grid; grid-template-columns:1fr 1fr` (o `1fr 1fr 1fr`) fijo, sin colapsar a una columna en pantallas angostas, a diferencia de `.form-row` y otros layouts del sitio que sí ya tenían ese ajuste.

### 🔧 Cambios
- **`web/admin.html`**: se crearon dos clases nuevas, `.cfg-grid-2` y `.cfg-grid-3`, que reemplazan el `grid-template-columns` que antes estaba escrito directo en cada `style=""` — mismo patrón ya usado por `.form-row`/`.seguimiento-layout`/`.faq-mgmt-layout` en este archivo. Se agregó `.cfg-grid-2, .cfg-grid-3 { grid-template-columns: 1fr; }` al `@media (max-width: 768px)` que ya existía, para que colapsen a una sola columna en celular.
- Se aplicaron las clases nuevas en los 6 lugares: Contenidos de Portada (Contadores del hero, Pasos del proceso), Avisos y promociones, Eventos, Municipio (Logotipo y escudo oficial), SEO y metadatos.

### 🔎 Verificado
- Revisión de código confirmando que no quedó ningún `grid-template-columns:1fr 1fr` suelto en `admin.html`.
- No hay navegador disponible en este entorno para confirmar visualmente — pendiente que el usuario lo revise en el emulador/celular tras desplegar.

### 📂 Archivos modificados
- `web/admin.html`

## 📅 [2026-10-04g] — Cambiar de correo desde "Mi perfil" ahora vuelve a pedir confirmación

### 🤔 Contexto
Revisión de seguridad a petición del usuario (base de datos, API, flujo de login/verificación de correo). Se confirmó que la mayoría de los hallazgos de auditorías anteriores ya estaban resueltos — este fue el único hueco real que seguía abierto: si alguien cambiaba el correo de una cuenta desde "Mi perfil" (`?action=update-profile`), el nuevo correo quedaba marcado como `email_verificado = 1` sin que nadie hubiera confirmado que de verdad le pertenece a esa persona — el mecanismo de verificación (agregado el 2026-10-02) solo cubría el autoregistro nuevo, no un cambio de correo posterior.

### 🔧 Cambios
- **`web/api/auth.php`** (`?action=update-profile`): cuando el correo que se manda es distinto al que ya tenía la cuenta, además de validarlo y de que no esté en uso por otra cuenta (como ya hacía), ahora también genera un `verificacion_token` nuevo, pone `email_verificado = 0`, y manda un correo de confirmación al nuevo correo (mismo patrón y plantilla que el registro). La sesión actual **no** se cierra — la persona sigue dentro, solo necesitará confirmar el correo antes de volver a iniciar sesión más adelante. La respuesta incluye un `message` distinto avisando esto.
- **`web/dashboard.html`, `web/js/admin/admin-init.js`, `web/asistente.html`** ("Mi perfil" → Guardar cambios): el toast de éxito ahora usa el `message` que manda el servidor cuando viene (el aviso de "revisa tu nuevo correo"), en vez de siempre mostrar el genérico "Perfil actualizado correctamente".

### 🔎 Verificado
- Extremo a extremo contra la base de datos local: cambiar el correo de una cuenta → `email_verificado` pasa a `0` y se genera `verificacion_token` → intentar iniciar sesión con el correo nuevo da `403` ("Todavía no confirmas tu correo") → confirmar con el token real → iniciar sesión funciona de nuevo con normalidad.
- `php -l` sin errores en `auth.php`.
- Revisión completa de `schema.sql` y los 8 archivos de `web/api/*.php`: prepared statements en el 100% de las consultas, sanitización (`clean()`/`sanitizeArticleHtml()`) en todos los puntos de entrada, límite de intentos de login, cabeceras de seguridad activas en todo el sitio (no solo la API), `scripts/backup_db.php` ya existe y está bien diseñado (fuera de `public_html`). No se encontraron más huecos de seguridad reales — solo quedan pendientes de confirmar por el usuario (contraseña del admin sembrado, si el cron del respaldo ya está agendado en cPanel) y mejoras menores no urgentes (CSP en modo Report-Only, sin límite de intentos en registro/recuperación).

### 📂 Archivos modificados
- `web/api/auth.php`
- `web/dashboard.html`
- `web/js/admin/admin-init.js`
- `web/asistente.html`

## 📅 [2026-10-04f] — Se separa el JavaScript de `admin.html` en archivos propios (`web/js/admin/`)

### 🤔 Contexto
`admin.html` tenía todo su JavaScript (~2,900 líneas) metido en un único `<script>` inline, mezclado con el HTML y el CSS del archivo. Esto se identificó como el problema de fondo tras probar "Graphify" (entrada anterior): cualquier herramienta de mapeo de código, y en la práctica también Claude Code al buscar una función específica, trata un `.html` como "documento", no como código — además de ser más difícil de mantener y con más riesgo de romper algo al editar en medio de miles de líneas.

### 🔧 Cambios
- Se dividió el `<script>` inline de `admin.html` en **16 archivos** dentro de `web/js/admin/`, agrupados por sección del panel: `admin-core.js` (utilidades compartidas: tablas, paginación, navegación del sidebar), `admin-dashboard.js` (mapa y gráficas de "Datos"), `admin-mascotas.js` (Seguimiento), `admin-usuarios.js` (Cuentas Ciudadanas), `admin-roles.js`, `admin-bitacora.js`, `admin-articulos.js` (editor WYSIWYG), `admin-config-core.js`/`admin-config-contenido.js`/`admin-config-shared.js`/`admin-config-footer.js`/`admin-config-portada.js`/`admin-config-apariencia.js`/`admin-config-site.js` (las pestañas de "Configuración"), `admin-init.js` (protección de la página + carga de datos reales) y `admin-bootstrap.js`.
- **División 100% mecánica, sin tocar ninguna línea de lógica** — se usó `sed` para cortar por los límites de sección que el propio archivo ya traía marcados con comentarios (`/* ══════ */`), y se verificó con un `diff` que el contenido reconstruido es idéntico, carácter por carácter, al `<script>` original. Cada archivo resultante se validó por separado con `node --check` (JS válido).
- ⚠️ **Único ajuste real de comportamiento**: la llamada `initAdmin();` (y las 2 líneas que la acompañaban) se movieron a un archivo nuevo, `admin-bootstrap.js`, cargado **al final de todos los demás**. Causa: dentro de un único `<script>`, el *hoisting* de JavaScript hace que no importe en qué orden estén las funciones — pero al separar en varios `<script src>`, cada uno es su propio programa y el hoisting ya no cruza entre archivos. `initAdmin()` llama a `primeConfigFromServer()` (definida en `admin-config-site.js`, el archivo más tardío), que a su vez llama a `buildIconSelectors()` (`admin-config-apariencia.js`) — si `admin-bootstrap.js` no cargara al final, el panel admin habría tronado con "function is not defined" apenas cargara la página.

### 🔎 Verificado
- `diff` entre el contenido original y la reconstrucción de los 16 archivos (en su orden original, con `admin-bootstrap.js` reinsertado en su posición de origen): **0 diferencias**.
- `node --check` sin errores en los 16 archivos nuevos.
- Revisión manual de todas las llamadas a nivel superior (no dentro de una función) del script original, para confirmar que ninguna otra, aparte de `initAdmin()`, dependiera de una función definida más adelante en el archivo.
- No hay navegador disponible en este entorno para abrir el panel admin y confirmarlo de primera mano — pendiente que el usuario lo pruebe a fondo tras desplegar (entrar a cada pestaña: Datos, Seguimiento, Usuarios, Roles, Bitácora, Artículo, Configuración, Mi perfil).

### 📂 Archivos modificados
- `web/admin.html` (el `<script>` inline se reemplazó por 16 `<script src="js/admin/...">`)
- `web/js/admin/` (carpeta nueva, 16 archivos)
- `CLAUDE.md` (documentada la carpeta nueva y la regla de orden de carga)

## 📅 [2026-10-04e] — Se probó "Graphify" (mapa de código por IA) y se descartó por ahora; limpieza de `.gitignore`

### 🤔 Contexto
Un compañero del usuario le recomendó Graphify (herramienta de terceros que convierte el código en un "mapa" navegable) diciendo que le ayudó en su propio proyecto de residencia. Se clonó el repo (`Graphify-Labs/graphify`) y se instaló el CLI para probarlo de verdad contra este proyecto antes de decidir si valía la pena adoptarlo.

### 🔬 Prueba real (no solo lectura de documentación)
Se corrió `graphify extract web --code-only` (modo gratis/local, sin API) sobre `web/`. Resultado:
- Solo 88 nodos / 133 conexiones en todo el proyecto.
- **7 de los 8 archivos de `web/api/*.php`** (`auth.php`, `mascotas.php`, `usuarios.php`, `contenido.php`, `bitacora.php`, `settings.php`) **no aportaron ningún nodo** — la herramienta solo mapea funciones/clases con nombre, y esos archivos son scripts planos con bloques `if ($method === 'POST' && $action === '...')` en vez de funciones separadas.
- **Ninguno de los `.html`** (`admin.html`, `dashboard.html`, `login.html`, `asistente.html`, `index.html`, `mascota.html`) se mapeó — Graphify los trata como "documentos", no como código, y ahí vive la mayoría de la lógica real del sistema (todo el JS del panel admin).
- Lo único que se mapeó bien fue `api-client.js`, `tema.js` y `helpers.php` — los únicos archivos del proyecto con funciones nombradas de verdad.

### 🤔 Decisión
Con este proyecto en su forma actual (PHP en scripts planos + todo el JS metido dentro de archivos `.html` gigantes), Graphify no aporta un mapa útil — no por ser mala herramienta, sino porque no es la forma de código que sabe mapear bien. Se decidió **no** dejar su integración permanente activa:
- Se revirtió la sección "## graphify" que el instalador había agregado a `CLAUDE.md` — esa sección le indicaba a futuras sesiones de Claude Code "usar el mapa antes que leer los archivos", lo cual habría sido contraproducente con un mapa tan incompleto.
- La carpeta `.claude/` (que el instalador creó con el skill y los hooks) se dejó en disco pero fuera de git.
- El CLI de `graphify` (instalado vía `uv tool install graphifyy`) se queda instalado en la máquina por si más adelante se separa el JS de `admin.html`/`dashboard.html` en archivos propios (la mejora real pendiente) y entonces sí vale la pena retomarlo.

### 🔧 Limpieza de `.gitignore`
Se agregaron reglas para que estas carpetas de herramientas externas, sueltas en el escritorio del proyecto, nunca se suban por accidente:
- `Herramienras/` (otro framework de terceros, "ECC", descargado para revisar por separado).
- `graphify/` (código fuente clonado de la herramienta).
- `graphify-out/` (la salida del experimento: `graph.json`, `graph.html`, etc.).
- `.claude/` (la integración de graphify descartada arriba).

### 📂 Archivos modificados
- `.gitignore`
- `CLAUDE.md` (revertido a su versión anterior a la instalación de graphify)

## 📅 [2026-10-04d] — Carpeta `migrations/` para no perder el historial de cambios a la base de datos

### 🤔 Contexto
Cada cambio de esquema de este proyecto se venía aplicando a mano en phpMyAdmin (local y producción), con el `ALTER TABLE` exacto solo documentado en prosa dentro de `HISTORIAL_CAMBIOS.md` — sin ningún archivo `.sql` real guardado en el repo. Si algún día hay que reconstruir la base desde cero, o alguien más retoma el proyecto, esos `ALTER TABLE` ya aplicados no estaban en ningún lado como archivo ejecutable.

### 🔧 Cambios
- Nueva carpeta **`web/database/migrations/`**, con `README.md` explicando la convención (`NNNN_YYYY-MM-DD_descripcion.sql`, nunca editar un archivo ya aplicado en producción, siempre junto con el cambio en `schema.sql` y la entrada de changelog).
- Se "rellenaron" con los dos `ALTER TABLE` que ya se habían aplicado esta semana pero solo vivían en texto dentro del changelog:
  - `0001_2026-10-02_add_email_verificacion.sql` (verificación de correo).
  - `0002_2026-10-04_add_articulos_imagen.sql` (imagen de portada de artículos).
- **`CLAUDE.md`**: se documentó la carpeta nueva en la sección de Base de Datos y en el árbol de estructura del proyecto.

### 🚫 Lo que NO se tocó
- No se reconstruyó el historial completo de cambios de esquema desde el inicio del proyecto — se empezó desde los dos cambios más recientes. `schema.sql` sigue siendo la fuente de verdad de la estructura completa.

### 📂 Archivos modificados
- `web/database/migrations/README.md` (nuevo)
- `web/database/migrations/0001_2026-10-02_add_email_verificacion.sql` (nuevo)
- `web/database/migrations/0002_2026-10-04_add_articulos_imagen.sql` (nuevo)
- `CLAUDE.md`

## 📅 [2026-10-04c] — El superadmin puede ver y editar los datos de una cuenta ciudadana

### 🤔 Contexto
El usuario pidió que, desde "Cuentas Ciudadanas", el superadmin pudiera ver y editar los datos de una persona registrada (antes la única acción disponible en esa tabla era activar/desactivar la cuenta).

### 🔧 Cambios
- **`web/api/usuarios.php`**: nueva acción `POST ?action=editar-cuenta` que edita `nombre`, `telefono`, `direccion` y `colonia` de una cuenta de Ciudadano o Asistente. Reservada a **superadmin** (`requireSuperAdmin()`), mismo criterio que ya usan `promover-admin`/`revocar-admin` — el usuario pidió explícitamente que fuera el superadmin quien tuviera este permiso, no cualquier admin. A propósito **no** permite tocar correo ni contraseña desde aquí (eso sigue siendo "Agregar correo", solo si la cuenta todavía no tiene, o lo que la propia persona cambia desde "Mi perfil") para no abrir una vía de robo de cuenta. Queda registrado en la bitácora de auditoría (`cuenta_editada_admin`).
- **`web/js/api-client.js`**: nueva `apiEditarCuentaUsuario(id, data)`.
- **`web/admin.html`** ("Cuentas Ciudadanas"): nuevo botón (ícono de ojo, visible solo si quien tiene la sesión es superadmin) que abre el modal "Ver / editar cuenta" con nombre, correo (de solo lectura), teléfono, domicilio y colonia. Nuevas funciones `verEditarUsuario(id)` y `guardarEdicionUsuario(event)`.

### 🔎 Verificado
- Contra la base de datos local: edición completa de una cuenta (nombre con acentos, teléfono, domicilio, colonia) se guarda correctamente y aparece en la bitácora con el nombre real del superadmin que la hizo.
- Un admin normal (no superadmin) que intenta llamar `?action=editar-cuenta` recibe `403 — Acceso denegado. Se requiere ser superadmin.`
- `php -l` sin errores en `usuarios.php`.
- No hay navegador disponible en este entorno para probar el modal visualmente — pendiente que el usuario lo confirme tras desplegar.

### 📂 Archivos modificados
- `web/api/usuarios.php`
- `web/js/api-client.js`
- `web/admin.html`

## 📅 [2026-10-04b] — Corrige que los PNG con transparencia se vuelven negros al subir una foto

### 🤔 Contexto
El usuario reportó (con captura) que al subir como imagen de portada de un artículo un PNG con fondo transparente, el fondo transparente se mostraba **negro** en vez de transparente/blanco.

### 🔧 Cambios
- Causa real: todo el sitio optimiza las fotos subidas redimensionándolas en el navegador con un `<canvas>` y exportándolas como **JPEG** (`canvas.toDataURL('image/jpeg', …)`) antes de guardarlas — JPEG no tiene canal alfa (transparencia). Un `<canvas>` recién creado no tiene ningún color de fondo propio; al "aplanar" a JPEG, esas zonas sin pintar se guardan como negro puro en vez de blanco.
- Se agregó `ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);` **antes** de `drawImage()` en las 8 funciones del sitio que procesan fotos de este modo, para que cualquier zona transparente del PNG de origen quede blanca (no negra) en el JPEG final:
  - `web/admin.html`: imagen de portada de artículo/aviso (`previewBanner`), foto al editar mascota desde el panel, imagen insertada en el editor de artículos (`insertImageInEditor`), foto de perfil del admin.
  - `web/dashboard.html`: foto de perfil, foto al registrar/editar mascota.
  - `web/asistente.html`: foto de perfil, foto al registrar mascota.
- **No se tocó** la subida de `imagen` de campañas/avisos vía `previewBanner()` — ya quedó cubierta porque es la misma función que usan ahora los artículos.

### 🚫 Lo que NO se arregla solo
- Las fotos que ya se guardaron **antes** de este cambio (como el artículo "¿Con qué frecuencia debo vacunar a mi perro?" de la captura) ya tienen el fondo negro "horneado" en el archivo guardado — este fix solo evita el problema en subidas nuevas. Hay que volver a subir/reemplazar esas imágenes ya guardadas después de desplegar.

### 🔎 Verificado
- Revisión de código: las 8 funciones comparten exactamente el mismo patrón (`canvas.getContext('2d').drawImage(...)` seguido de `toDataURL('image/jpeg', …)`), confirmando que el bug no era exclusivo de artículos sino de cualquier foto subida en el sitio.
- No hay navegador disponible en este entorno para probar visualmente con un PNG real — pendiente que el usuario lo confirme tras desplegar, volviendo a subir la imagen del artículo de prueba.

### 📂 Archivos modificados
- `web/admin.html`, `web/dashboard.html`, `web/asistente.html`

## 📅 [2026-10-04] — Imagen de portada en los artículos / Tips de salud animal

### 🤔 Contexto
El usuario pidió poder agregar una imagen a los artículos (sección "Tips de salud animal") desde el panel admin, y que esa imagen se reflejara adaptada a la forma de la tarjeta en la portada pública — igual que ya pasa con el banner de los avisos/campañas.

### 🔧 Cambios
- **`web/database/schema.sql`** (tabla `articulos`): se agregó `imagen LONGTEXT DEFAULT NULL`, mismo patrón que `campanas.imagen`. Migración para producción (phpMyAdmin):
  ```sql
  ALTER TABLE articulos ADD COLUMN imagen LONGTEXT DEFAULT NULL AFTER imagen_icono;
  ```
- **`web/admin.html`** ("Nuevo artículo / Tip de cuidado"): se agregó un campo "Imagen de portada (opcional)" con la misma zona de arrastrar/soltar que ya usan los avisos (`banner-drop`, `previewBanner()`, `handleDrop()` — de hecho `handleDrop()` ya traía una referencia a `art-img`/`art-banner-prev` sin usar, dejada a medias de una versión anterior; ahora sí está conectada). `saveArticulo()` manda la imagen si hay una en la vista previa; `editarArticulo()` la precarga al editar; `resetArticulo()` la limpia.
- **`web/api/contenido.php`** (`POST`/`PUT` de `?resource=articulos`): acepta y valida `imagen` con `validarFotoBase64()` (mismo helper que ya usan las campañas — exige JPG/PNG/WEBP y un tamaño máximo), y la guarda/actualiza en la tabla.
- **`web/css/styles.css`** (`.article-card`): se reestructuró para que la imagen (si existe) ocupe todo el ancho de la tarjeta arriba (`.article-image`, `object-fit:cover`, 140px de alto) y el resto del contenido quede en un contenedor `.article-card-body` con el padding de siempre — mismo patrón que ya usa `.campaign-card`/`.campaign-banner`. Si el artículo no tiene imagen, la tarjeta se ve exactamente igual que antes.
- **`web/index.html`**: `renderArticles()` ahora pinta la imagen (si existe) arriba de cada tarjeta; el modal de "artículo completo" (agregado el 2026-10-02) también la muestra, arriba del texto.
- Se actualizó también la lista de artículos propia del admin (`renderAdminArtList()`) para usar la misma estructura `.article-card-body` y mostrar la miniatura, por consistencia.

### 🔎 Verificado
- Contra la base de datos local: `POST` de un artículo con imagen válida (JPEG en Base64) → se guarda y el `GET` público la devuelve; `PUT` con una imagen inválida (no es `data:image/...;base64,`) se rechaza con 400; `PUT` sin tocar `imagen` deja la imagen existente intacta.
- `php -l` sin errores en `contenido.php`.
- No hay navegador disponible en este entorno para confirmar visualmente cómo se ve la tarjeta — pendiente que el usuario lo revise tras desplegar.
- Pendiente aplicar la migración (`ALTER TABLE` de arriba) en producción antes de desplegar este código — si se despliega sin la migración, `contenido.php` fallará con "Unknown column" al leer/escribir `imagen` en `articulos`.

### 📂 Archivos modificados
- `web/database/schema.sql`
- `web/api/contenido.php`
- `web/admin.html`
- `web/css/styles.css`
- `web/index.html`

## 📅 [2026-10-02i] — Botón "Copiar enlace" en el QR y corrige el "Leer más" de los Tips de salud animal

### 🤔 Contexto
Dos observaciones de la asesora del usuario:
1. En la ventana del código QR, pidió un botón para copiar el enlace al portapapeles, para poder pegarlo en Word u otro documento/aplicación (no solo abrirlo o imprimir el QR).
2. En la portada pública, la sección "Tips de salud animal" muestra cada tarjeta recortada a ~100 caracteres con un enlace "Leer más →" que no mostraba el resto del texto.

### 🔧 Cambios
**1. Botón "Copiar enlace" en el modal de QR (`web/dashboard.html`, `web/admin.html`, `web/asistente.html`):**
- Se agregó un botón junto a "Abrir página pública" que copia el enlace público de la mascota (el mismo `href` del QR) al portapapeles con `navigator.clipboard.writeText()`, con un respaldo (`document.execCommand('copy')` sobre un `<textarea>` oculto) para navegadores o contextos sin Clipboard API. Muestra un `showToast` de confirmación.
- Se agregó la nueva función `copiarEnlaceQR()` igual en los tres archivos (mismo patrón ya usado para `printQR()`).

**2. "Leer más" de los artículos en la portada (`web/index.html`):**
- Causa real: el enlace "Leer más" tenía `href="#"` y **ningún manejador de clic** — no hacía absolutamente nada al dar clic (ni mostraba el resto del texto ni llevaba a otro lado), por eso el artículo se quedaba siempre cortado en el extracto de 100 caracteres.
- Se agregó un modal (`modal-articulo`, mismo patrón visual que el resto del sitio) que muestra el título y el contenido completo del artículo. `renderArticles()` ahora guarda los artículos recibidos en `ARTICULOS_DATA` y cada "Leer más" llama a `verArticulo(i)`, que llena y abre el modal.
- `index.html` no tenía antes ningún modal ni los helpers `openModal()`/`closeModal()` — se agregaron (mismo patrón que `login.html`/`dashboard.html`/`admin.html`/`asistente.html`), incluyendo el `querySelectorAll('.modal-overlay').forEach(...)` que engancha "clic en el fondo cierra el modal".

### 🔎 Verificado
- `copiarEnlaceQR()`: revisión de código — mismo elemento (`qr-link-btn`) que ya usa "Abrir página pública" para el enlace real, sin recalcularlo aparte.
- "Leer más": revisión de código confirmando que antes no había `onclick` ni JS asociado al enlace (la causa raíz del reporte); el nuevo modal reutiliza clases CSS ya probadas en el resto del sitio.
- No hay navegador disponible en este entorno para probar ambos cambios de primera mano — pendiente que el usuario confirme tras desplegar.

### 📂 Archivos modificados
- `web/dashboard.html`, `web/admin.html`, `web/asistente.html` (botón copiar enlace QR)
- `web/index.html` (modal de artículo completo)

## 📅 [2026-10-02h] — El buscador de "Seguimiento de Mascotas" ahora busca también por dueño, características y ubicación

### 🤔 Contexto
La asesora del usuario revisó el panel admin y pidió que el buscador de "Seguimiento de Mascotas" permitiera buscar no solo por el nombre de la mascota, sino también por el dueño, características de la mascota y la ubicación.

### 🔧 Cambios
- **`web/api/mascotas.php`** (`GET`, filtro `?q=`): antes solo comparaba `m.nombre` (nombre de la mascota), `m.id` (folio), `d.nombre` (dueño) y `d.colonia`. Se amplió para comparar también `m.raza`, `m.color`, `m.sexo`, `m.senias_particulares` (características de la mascota), `d.telefono` (dato adicional del dueño) y `d.direccion` (ubicación, además de la colonia que ya estaba).
- **`web/admin.html`**: se actualizó el placeholder/aria-label del campo de búsqueda de "Seguimiento" (`segSearch`) de "Buscar otra mascota..." a "Buscar por mascota, dueño, raza, color o colonia..." para que quede claro que ahora cubre más campos.

### 🔎 Verificado
- Contra la base de datos local, con sesión de admin real: búsquedas por raza (`labrador`), nombre de dueño (`Salvador Ruiz`), colonia (`Pedregal`), dirección (`Zaragoza`) y color (`Atigrado`) devuelven las mascotas correctas en cada caso.
- `php -l` sin errores en `mascotas.php`.

### 📂 Archivos modificados
- `web/api/mascotas.php`
- `web/admin.html`

## 📅 [2026-10-02g] — Ventana emergente avisando que falta confirmar el correo al crear una cuenta

### 🤔 Contexto
Tras la entrada anterior (verificación de correo al registrarse), el aviso de "revisa tu correo" solo salía como un toast (una notificación chiquita que desaparece sola) — el usuario pidió que en vez de eso fuera una ventana emergente (modal), como la de "Recuperar contraseña", para que no pase desapercibido.

### 🔧 Cambios
- **`web/login.html`**: se agregó el modal `modal-cuenta-creada` (mismo patrón visual que `modal-recuperar`/`modal-reenviar-verificacion`) con el mensaje "Revisa tu correo" y el correo de la cuenta recién creada en negrita.
- `handleRegistroUsuario()`: en vez de `showToast('✅ ...')`, ahora llena el correo en el modal y lo abre con `openModal('modal-cuenta-creada')`. El resto del flujo sigue igual (limpia el formulario, cambia a la pestaña de inicio de sesión, precarga el correo en el campo de login).

### 📂 Archivos modificados
- `web/login.html`

## 📅 [2026-10-02f] — Corrige que la ventana del código QR no se cerraba con la "X" ni con "Cerrar"

### 🤔 Contexto
El usuario reportó (con capturas, desde el panel ciudadano, QR de la mascota "MAX") que al abrir la ventana del código QR de una mascota, ni el botón "✕" ni el botón "Cerrar" la cerraban.

### 🔧 Cambios
- **`web/dashboard.html`, `web/admin.html`, `web/asistente.html`** (función `verQR`/equivalente): los dos botones de cerrar usaban `document.getElementById('modal-qr').classList.remove('open')` directamente en vez del helper compartido `closeModal('modal-qr')` que usa el resto de los modales del sitio. Se cambiaron ambos a `closeModal('modal-qr')`.
- Se encontró además una inconsistencia real: este modal se crea de forma dinámica con JavaScript (`document.createElement`) la primera vez que se abre, **después** de que ya corrió — una sola vez, al cargar la página — el `querySelectorAll('.modal-overlay').forEach(...)` que engancha "clic en el fondo oscuro cierra el modal" a todos los demás modales (que sí existen desde el HTML inicial). Por eso el modal de QR, a diferencia de todos los otros, tampoco se cerraba haciendo clic afuera. Se agregó ese mismo listener a mano justo después de crear el modal, y se cambió el `classList.add('open')` por `openModal('modal-qr')` para que use el mismo mecanismo de apertura que el resto.

### 🚫 Lo que NO se tocó
- El diseño visual del modal ni la lógica de generación del QR — solo cómo se abre/cierra.

### 🔎 Verificado
- Revisión de código: se confirmó que `closeModal`/`openModal` existen y tienen la misma firma en los tres archivos (helpers ya usados por el resto de los modales de cada página).
- No hay navegador disponible en este entorno para reproducir en vivo el síntoma exacto reportado (clic en "✕"/"Cerrar"); el cambio aplicado es correcto y consistente con el patrón del resto del sitio independientemente de si explica el 100% del síntoma — pendiente que el usuario confirme en producción tras desplegar.

### 📂 Archivos modificados
- `web/dashboard.html`
- `web/admin.html`
- `web/asistente.html`

## 📅 [2026-10-02e] — Verificación de correo al autoregistrarse (evita cuentas con correos inventados/mal escritos)

### 🤔 Contexto
El usuario pidió revisar, al crear una cuenta, que el correo electrónico "sí exista" — para evitar que alguien registre una cuenta con un correo inventado o con errores de dedo. Antes de construir nada se le explicó por qué una verificación en vivo (preguntarle a Gmail/Outlook "¿existe este correo?" en el momento mismo del registro) no es confiable: la mayoría de los proveedores de correo bloquean o mienten a ese tipo de sondeo para no facilitar spam, así que daría falsos positivos/negativos todo el tiempo. Se le planteó la alternativa estándar — verificación por enlace de confirmación — y se le preguntó qué tan estricto debía ser mientras una cuenta nueva no confirma: **se eligió bloquear el inicio de sesión por completo** hasta que la persona le dé clic al enlace de su correo.

### 🔧 Cambios
- **`web/database/schema.sql`** (tabla `duenos`): se agregaron `email_verificado TINYINT(1) NOT NULL DEFAULT 1` y `verificacion_token VARCHAR(64) DEFAULT NULL` (+ índice). El `DEFAULT 1` es a propósito: una cuenta sembrada (`seed.sql`) o creada por un asistente/admin nunca pasa por este flujo y no debe quedar bloqueada — solo el autoregistro desde `login.html` la pone en `0` explícitamente. Migración aplicada en la base de datos local con `ALTER TABLE` (ver abajo el `ALTER` para producción).
- **`web/api/auth.php`**:
  - `?action=register`: ya NO inicia sesión sola a la cuenta recién creada (antes regresaba un `token` de sesión de una vez). Ahora genera un `verificacion_token` de un solo uso, lo guarda, y manda un correo con el enlace `login.html?verificar=TOKEN` (reutilizando `enviarCorreo()`, la misma función SMTP real de Titan que ya usa la recuperación de contraseña — sin esto habría que volver a resolver el mismo problema de entrega a Gmail que ya se resolvió en 2026-10-01e).
  - `?action=login`: después de validar la contraseña (para no revelar por este medio si el correo existe), revisa `email_verificado` — si sigue en `0`, rechaza con 403 y un mensaje claro en vez de dejarla entrar.
  - Nuevo `?action=verificar-email`: confirma la cuenta a partir del token del enlace (`email_verificado = 1`, borra el token para que el enlace no se reuse).
  - Nuevo `?action=reenviar-verificacion`: por si el correo nunca llegó o se fue a spam — mismo patrón anti-enumeración que `solicitar-recuperacion` (responde siempre el mismo mensaje, exista o no esa cuenta, esté o no ya verificada).
- **`web/js/api-client.js`**: `apiRegisterUser()` ya no guarda una sesión en `localStorage` (no hay token que guardar); nuevas `apiVerificarEmail(token)` y `apiReenviarVerificacion(email)`.
- **`web/login.html`**: al registrarse, ya no manda a `dashboard.html` — muestra el mensaje de "revisa tu correo" y regresa a la pestaña de inicio de sesión con el correo precargado. Se agregó el link "¿No confirmaste tu correo? Reenviar enlace" (abre un modal nuevo, mismo patrón visual que "Recuperar contraseña") y la detección de `?verificar=TOKEN` en la URL (igual que ya existía para `?reset=TOKEN`): confirma el correo al cargar la página y limpia la URL después para que el enlace ya gastado no se vea reutilizable.

### 🚫 Lo que NO se tocó
- `asistente.html` ("Nuevo ciudadano"): esas cuentas se crean con `email_verificado = 1` por el `DEFAULT` de la columna — no pasan por este flujo, porque normalmente ni siquiera tienen correo (las registra el personal municipal en campo).
- Cuentas que ya existían antes de este cambio (admin, demo, ciudadanos reales ya registrados): todas quedaron en `email_verificado = 1` por el mismo `DEFAULT` — nadie que ya tenía cuenta se queda bloqueado de golpe.
- No se tocó qué pasa si alguien **cambia** su correo después, desde "Mi perfil" — se queda verificado sin volver a confirmar el nuevo correo. Es un hueco real pero distinto al que se pidió resolver hoy (ese era sobre el registro); se deja anotado para si se quiere cerrar en otra sesión.

### 🔎 Verificado
- `php -l` sin errores en `auth.php`.
- Prueba de extremo a extremo contra el servidor local: registro → login antes de confirmar da `403` con el mensaje de "todavía no confirmas tu correo" → se confirma con el token real de la BD → login después de confirmar da `200` con sesión normal.
- `error_log` confirma que el enlace de verificación se genera y que `enviarCorreo()` no reportó ningún fallo de envío (mismo SMTP de Titan ya verificado en producción).
- `scripts/smoke_test.sh`: 24 verificaciones, mismas fallas preexistentes de la cuenta admin real (no relacionadas) — login de ciudadana y asistente (cuentas ya existentes, migradas a `email_verificado = 1`) siguen funcionando igual que antes.
- Cuentas de prueba borradas de la base local después de probar.
- Pendiente: aplicar esta misma migración en la base de datos de producción (HostGator) antes de desplegar este código — si se despliega el código sin la migración, `auth.php` fallará con "Unknown column" al intentar leer/escribir `email_verificado`/`verificacion_token`. SQL exacto a correr en phpMyAdmin de producción:
  ```sql
  ALTER TABLE duenos
    ADD COLUMN email_verificado TINYINT(1) NOT NULL DEFAULT 1 AFTER reset_token_expira,
    ADD COLUMN verificacion_token VARCHAR(64) DEFAULT NULL AFTER email_verificado,
    ADD INDEX idx_verificacion_token (verificacion_token);
  ```
- Pendiente también que el usuario confirme en el navegador que el correo de confirmación llega y que el enlace funciona — no hay navegador disponible en este entorno para probarlo de primera mano.

### 📂 Archivos modificados
- `web/database/schema.sql`
- `web/api/auth.php`
- `web/js/api-client.js`
- `web/login.html`

## 📅 [2026-10-02d] — Domicilio/colonia pasan a ser obligatorios al registrarse; el acta en PDF ya incluye la foto de la mascota

### 🤔 Contexto
Dos pedidos de seguimiento a la entrada anterior (2026-10-02c):
1. El usuario vio los campos nuevos "Domicilio (opcional)"/"Colonia (opcional)" en "Crear Cuenta de Usuario" y pidió que fueran **obligatorios**, no opcionales.
2. Pidió que, si la mascota ya tiene una foto cargada, el acta en PDF la incluya — antes el PDF era puro texto, sin importar si la mascota tenía fotografía o no.

### 🔧 Cambios
**1. Domicilio/colonia obligatorios (solo en el autoregistro de `login.html`):**
- `web/login.html`: se quitó la leyenda "(opcional)" de ambas etiquetas, se agregó `*` (mismo estilo que los demás campos obligatorios del formulario) y `required` al campo de texto de Domicilio. `handleRegistroUsuario()` ahora rechaza el envío si falta el domicilio, y también si no se seleccionó una colonia real de la lista (se valida contra el input oculto que llena `initCombo`, no contra el texto visible — así no se cuela alguien que solo escribió texto libre sin elegir ninguna opción).
- `web/api/auth.php` (`?action=register`): ahora exige `direccion`/`colonia` igual que ya exige `telefono` — devuelve 400 con "El domicilio es obligatorio."/"La colonia es obligatoria." si faltan, en vez de guardarlos como `NULL` silenciosamente.
- Se actualizó el texto del Aviso de Privacidad (ya no dice "de forma opcional dirección y colonia").
- **A propósito NO se tocó** `asistente.html` ("Nuevo ciudadano"): ahí sigue siendo opcional, porque el personal municipal puede estar registrando en campo a alguien (ej. adulto mayor) sin tener a la mano su domicilio completo — es un caso de uso distinto al autoregistro.

**2. Foto de la mascota en el acta PDF:**
- Se agregó la función `_agregarFotoActaPDF(doc, fotoUrl, pageW)` (duplicada en los 3 generadores de acta, mismo patrón que ya tenía el resto del código del PDF) en `dashboard.html`, `admin.html` y `asistente.html`. Cuando la mascota tiene `foto_url`, la imagen se dibuja arriba a la derecha del acta (máximo 38×38mm, conservando su proporción real en vez de estirarla/achatarla — se espera a que el navegador cargue la imagen para conocer su ancho/alto antes de insertarla). Si la mascota no tiene foto, o la imagen falla al cargar, el acta se genera igual, solo sin la imagen.
- Las 3 funciones (`downloadActa` en `dashboard.html`/`asistente.html`, `downloadActaAdmin` en `admin.html`) pasaron a ser `async` para poder esperar la carga de la imagen antes de seguir dibujando el resto del acta. Se revisaron todos los `onclick="downloadActa(...)"` que las llaman — ninguno esperaba un valor de regreso, así que el cambio no afecta a quien las llama.

### 🚫 Lo que NO se tocó
- El domicilio/colonia de cuentas creadas por `asistente.html` sigue siendo opcional (ver arriba).
- Las cuentas ya existentes sin domicilio/colonia no se obligan a completarlo retroactivamente — solo aplica a registros nuevos desde `login.html`.

### 🔎 Verificado
- `php -l` sin errores en `auth.php`.
- `curl` directo a `POST /auth?action=register`: sin `direccion` → `{"ok":false,"error":"El domicilio es obligatorio."}`; sin `colonia` → `{"ok":false,"error":"La colonia es obligatoria."}`.
- Revisión manual de los 3 generadores de PDF editados (llaves/paréntesis balanceados, mismo patrón en los 3 archivos).
- Pendiente que el usuario pruebe en el navegador que el PDF sí trae la foto cuando la mascota tiene una — no hay navegador disponible en este entorno para generarlo de primera mano.

### 📂 Archivos modificados
- `web/api/auth.php`
- `web/login.html`
- `web/dashboard.html`
- `web/admin.html`
- `web/asistente.html`

## 📅 [2026-10-02c] — Pide domicilio/colonia al autoregistrarse y corrige que nunca se mostraba la dirección guardada

### 🤔 Contexto
El usuario reportó (con 4 capturas) que "Crear Cuenta de Usuario" (`login.html`) nunca pidió domicilio/colonia — a pesar de que el propio Aviso de Privacidad del sitio ya decía que se recababan "de forma opcional". Pidió revisar **todos los lugares donde debería aparecer la ubicación**, no solo el formulario.

Auditoría completa de los 3 flujos de registro/edición que tocan `duenos.direccion`/`duenos.colonia`:

| Flujo | ¿Pedía domicilio/colonia? |
|---|---|
| `asistente.html` → "Nuevo ciudadano" (`usuarios.php?action=buscar-o-crear`) | ✅ Sí, ya funcionaba |
| `dashboard.html` → "Mi perfil" (editar después de crear la cuenta) | ✅ Sí, ya funcionaba |
| `login.html` → "Crear Cuenta de Usuario" (autoregistro) | ❌ **No existían los campos ni en el HTML ni en el backend** |

Y un segundo bug, independiente del anterior: **aunque** un ciudadano sí tuviera domicilio guardado (por `asistente.html` o por "Mi perfil"), `GET /api/mascotas.php` — el endpoint que alimenta "Mis mascotas" (`dashboard.html`), "Seguimiento"/"Datos" (`admin.html`) y la lista de `asistente.html` — nunca seleccionaba `duenos.direccion` en su SQL (solo `d.colonia`). Por eso la tarjeta de detalle de una mascota mostraba "DIRECCIÓN: —" aunque "Mi perfil" sí mostrara el domicilio real para esa misma cuenta: eran dos consultas distintas, y solo una de las dos traía el dato completo.

### 🔧 Cambios
- **`web/api/auth.php`** (`?action=register`): ahora acepta `direccion`/`colonia` (opcionales, `clean()`), los guarda en el `INSERT` y los regresa en la respuesta — antes el endpoint los ignoraba por completo aunque se le mandaran.
- **`web/js/api-client.js`** (`apiRegisterUser`): acepta los 2 parámetros nuevos y los manda al backend; también los guarda en `padron_session` junto con el resto de la sesión.
- **`web/login.html`**: se agregó una fila "Domicilio (opcional)" + "Colonia (opcional)" al formulario de registro, con el mismo buscador de colonias real de El Grullo que ya usan `dashboard.html`/`asistente.html` (`initCombo`/`initComboSugerencias`, catálogo de `js/el-grullo-data.js`) — reutilizando el mismo patrón visual en vez de inventar uno nuevo. `handleRegistroUsuario()` ahora lee y manda estos 2 campos.
- **`web/api/mascotas.php`**: se agregó `d.direccion` junto a `d.colonia` en las 4 consultas autenticadas (listar propias/admin con y sin paginación, confirmación al crear, confirmación al editar). La vista **pública** por token (`?token=`, usada por el QR) se dejó intacta a propósito — su comentario ya decía explícitamente "NO se expone dirección/colonia (dato sensible)" y así debe seguir.
- **`web/dashboard.html`, `web/admin.html`, `web/asistente.html`**: el acta en PDF ahora incluye renglones "Dirección" y "Colonia" (antes solo traía "Propietario" y "Teléfono de contacto") — en `dashboard.html` con la misma prioridad que ya tenían esos 2 campos (`session.X || pet.X || '—'`).

### 🚫 Lo que NO se tocó
- La vista pública `mascota.html` y el endpoint público `?token=` de `mascotas.php` — a propósito nunca exponen domicilio exacto ni colonia a un desconocido que escanee el QR, eso no cambió.
- El modal "Datos de dueño"/"Domicilio" de `admin.html` (el que solo muestra colonia combinada, ej. "10 de Mayo, El Grullo, Jal.") no se tocó — es un resumen compacto distinto al modal de detalle con campos separados, y mostrar solo la colonia ahí (no la calle exacta) parece intencional, no un bug.
- Las cuentas que ya existen con `direccion`/`colonia` vacíos (porque se registraron antes de este cambio) no se migran ni se completan automáticamente — pueden llenarlos ellos mismos desde "Mi perfil" cuando quieran.

### 🔎 Verificado
- `php -l` sin errores en `auth.php` y `mascotas.php`.
- Prueba de extremo a extremo contra el servidor local: `POST /auth?action=register` con `direccion`/`colonia` → se guardan y regresan; `POST /mascotas.php` para esa cuenta nueva → la mascota creada ya trae `"direccion":"Calle Falsa 123","colonia":"10 de Mayo"` en la respuesta (antes esos campos no existían en el JSON).
- `scripts/smoke_test.sh`: 24 verificaciones, mismas fallas preexistentes de la cuenta admin real (bloqueo temporal de intentos previos, no relacionado) — el CRUD de mascota de la cuenta ciudadana de prueba pasó completo.
- Cuenta y mascota de prueba (`test.direccion.*@example.com`, `M-GRU-000000080`) borradas de la base local después de la prueba.
- Pendiente que el usuario confirme visualmente en el navegador que el buscador de colonia en "Crear cuenta" se ve y filtra bien — no hay navegador disponible en este entorno para probarlo de primera mano.

### 📂 Archivos modificados
- `web/api/auth.php`
- `web/api/mascotas.php`
- `web/js/api-client.js`
- `web/login.html`
- `web/dashboard.html`
- `web/admin.html`
- `web/asistente.html`

## 📅 [2026-10-02b] — Corrige el destello del color original al cambiar el tema visual

### 🤔 Contexto
El usuario reportó (con capturas) que al personalizar el color del sitio desde "Apariencia e íconos" → "Tema visual", cada vez que se carga cualquier página se alcanza a ver por una fracción de segundo el color naranja original del sitio, antes de que se aplique el color elegido. Pidió corregirlo en todas las páginas donde afecta.

**Diagnóstico:** `aplicarTemaVisual()` (`web/js/tema.js`) es asíncrona — espera una llamada de red a `/api/settings` (o, si falla, lee `localStorage`) — y en las 5 páginas se llamaba **al final del body**, después de que el HTML ya se había pintado con los colores por defecto de `styles.css`. Ese hueco (red + posición tardía en el documento) es el destello: no era un bug de un solo lugar, sino el mismo patrón repetido en `index.html`, `login.html`, `dashboard.html`, `admin.html` y `asistente.html`.

### 🔧 La solución: aplicar el color guardado de forma síncrona, antes de pintar el body
- `web/js/tema.js`: se extrajo la lógica de "escribir las variables CSS en `<html>`" a una función nueva `_aplicarVariables(cfg)`, reutilizada tanto por la función síncrona nueva como por la asíncrona de siempre. Se agregó `aplicarTemaSincrono()`, que **solo lee `localStorage`** (sin red) y aplica el color/bordes de inmediato si ya existe una configuración guardada de una visita anterior.
- En las 5 páginas (`index.html`, `login.html`, `dashboard.html`, `admin.html`, `asistente.html`): se movió `<script src="js/tema.js"></script>` de donde estaba (al final del `<body>`, junto a `api-client.js`) al `<head>`, justo después de la hoja de estilos, seguido de `<script>aplicarTemaSincrono();</script>`. Al ser scripts normales (sin `defer`/`async`) en `<head>`, el navegador los ejecuta y bloquea el resto del parseo **antes** de pintar cualquier contenido — así el color correcto ya está puesto en `<html>` desde antes del primer frame.
- La llamada ya existente a `aplicarTemaVisual()` (asíncrona, contra el servidor) se dejó tal cual donde estaba en cada página — sigue sirviendo para refrescar `localStorage` por si el tema cambió desde otro dispositivo, pero ya no es la que evita el destello.

### 🚫 Lo que NO se tocó
- `web/mascota.html` (ficha pública de una mascota, por QR) no carga `tema.js` y no se vio afectada por este bug — pero tampoco aplica el color personalizado del admin en absoluto (usa siempre el naranja por defecto). Queda fuera de este arreglo porque es un gap distinto (falta de la función, no un destello); se deja anotado para una sesión futura si se pide.
- No se tocó la lógica de **qué** colores se calculan (`_hexToHsl`/`_shadeColor`/etc.), solo se reorganizó **cuándo** y **con qué fuente de datos** (local vs. red) se aplican.

### 🔎 Verificado
- `grep` confirma que cada una de las 5 páginas carga `tema.js` una sola vez (ya no hay una carga duplicada entre `<head>` y el final del `<body>`).
- Revisión manual del `<head>` resultante de las 5 páginas: el script y la llamada síncrona quedan antes de cualquier contenido visible del `<body>`.
- Pendiente que el usuario confirme visualmente en el navegador que ya no ve el destello — no hay navegador disponible en este entorno para probarlo de primera mano.

### 📂 Archivos modificados
- `web/js/tema.js`
- `web/index.html`
- `web/login.html`
- `web/dashboard.html`
- `web/admin.html`
- `web/asistente.html`

## 📅 [2026-10-02] — Ignora la carpeta `mobile-mcp/` en git

### 🔧 Cambios
- Se clonó el repositorio externo `github.com/mobile-next/mobile-mcp` (servidor MCP para controlar celulares/emuladores desde Claude Code) dentro de `mobile-mcp/`, en la raíz del proyecto. Es una herramienta de desarrollo con su propio repositorio git, no forma parte de la plataforma.
- Se agregó `mobile-mcp/` al `.gitignore` para que nunca se suba por error al repositorio del proyecto (por ejemplo con un `git add .`).

### 📁 Archivos modificados
- `.gitignore`
- `HISTORIAL_CAMBIOS.md`

## 📅 [2026-10-01g] — Corrige el destello de "Datos"/"Bitácora" al cargar el panel admin

### 🤔 Contexto
El usuario reportó (con capturas) un bug real de seguridad/percepción: al entrar como admin normal (no superadmin), por una fracción de segundo se alcanzaba a ver el menú completo (con "Datos" y "Bitácora", que no le corresponden) y un avatar/nombre genérico ("AD" / "Administrador"), antes de que la página se corrigiera sola. Preguntó si convenía separar `admin.html` en dos archivos (uno por rol) para evitarlo.

**Diagnóstico:** no hacía falta duplicar el archivo — el bug era de *orden*, no de arquitectura. `initAdmin()` mostraba todo por defecto y **recién después** de varias llamadas a la API (sesión, configuración, estadísticas, campañas, artículos...) ocultaba "Datos"/"Bitácora" si la cuenta no era superadmin. Mientras esas llamadas iban y venían, el HTML ya pintado en el navegador mostraba el menú completo — un caso clásico de "destello de contenido no autorizado" (flash of unauthorized content).

### 🔧 La solución: invertir la lógica por defecto
En vez de "mostrar todo y ocultar lo que no toca" (depende de que JS alcance a correr), ahora es "ocultar todo lo privilegiado desde el HTML mismo, y mostrarlo solo si se confirma que sí es superadmin":

- `web/admin.html`: los links `nav-datos` y `nav-bitacora` del sidebar ahora traen `style="display:none"` **directo en el HTML** (no agregado por JavaScript) — un admin normal nunca los ve, ni por una fracción de segundo, pase lo que pase con la red. `nav-seguimiento` pasa a ser el link con `class="active"` por defecto.
- La sección `sec-datos` (con el mapa y las tarjetas) también arranca oculta por HTML; `sec-seguimiento` arranca visible — se intercambiaron respecto a como estaban antes.
- El título/subtítulo por defecto del encabezado (`adminTitle`/`adminSub`) se cambiaron de "Datos del Padrón" a "Seguimiento de Mascotas", para que coincidan con lo que de verdad se ve primero.
- En `initAdmin()`: el bloque que decidía mostrar/ocultar "Datos"/"Bitácora" se movió al inicio de la función (justo después de confirmar el rol, antes de las demás llamadas a la API) y se invirtió — ahora **revela** esos 2 links solo si `esSuperAdmin(currentUser)` es verdadero, en vez de ocultarlos si no lo es. Al final de la función, la sección inicial se decide con una sola línea simétrica (`showAdmin(esSuperAdmin(currentUser) ? 'datos' : 'seguimiento')`), reutilizando la inicialización de mapa que `showAdmin()` ya traía incorporada en vez del `setTimeout` suelto que había antes.

Con esto, aunque JavaScript tardara varios segundos en correr (red lenta, muchas llamadas a la API), un admin normal **nunca** llega a ver en el DOM los links ni la sección de "Datos"/"Bitácora" — no es que se oculten rápido, es que nunca estuvieron visibles para empezar.

### 🚫 Por qué no se hizo un `admin.html` aparte por rol
Se consideró y se descartó: hubiera significado mantener dos copias de ~5,200 líneas de HTML/CSS/JS sincronizadas a mano por siempre (cada botón, cada campo nuevo, cada corrección habría que aplicarla dos veces) — mucho más caro a largo plazo que este cambio de 15 líneas, y con el mismo resultado final para el usuario.

### 🔎 Verificado
- `curl` directo a `admin.html` (sin ejecutar JavaScript) confirma que `nav-datos`, `nav-bitacora` y `sec-datos` ya llegan con `display:none` en el HTML crudo que manda el servidor — la restricción no depende de que el navegador alcance a correr nada.
- `php -l` sin errores.
- `scripts/smoke_test.sh`: 24 verificaciones, mismas 3 fallas preexistentes de la cuenta admin real (no relacionadas).
- Pendiente que el usuario confirme visualmente que ya no ve el destello — no hay navegador disponible en este entorno para probarlo de primera mano.

### 📂 Archivos modificados
- `web/admin.html`.

## 📅 [2026-10-01f] — Termina de quitar los emojis del panel admin (pestaña Datos, Configuración, Roles, Avisos, FAQ)

### 🤔 Contexto
El usuario pidió revisar `admin.html` completo — el rediseño de íconos de sesiones anteriores no había cubierto ni por asomo todo el panel: la pestaña "Datos" (donde se nota más, capturas de pantalla incluidas), toda "Configuración del sitio" y varias tablas/tarjetas dinámicas seguían con emoji sueltos.

### 🔧 Qué se hizo
Barrido completo de `web/admin.html` buscando cada carácter emoji (`[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}\x{2B00}-\x{2BFF}]`) y reemplazándolo por el mismo ícono de línea SVG (estilo Lucide, `class="icon-line"`) ya usado en el resto del sitio — reutilizando trazos ya existentes en el propio archivo (sidebar, login.html) en vez de inventar íconos nuevos:

- **Pestaña "Datos"**: las 4 tarjetas KPI (huella/familias/jeringa/tendencia), el badge "Admin" y "Exportar CSV" del encabezado, el pie del mapa ("Mascotas en el padrón"), el ícono de búsqueda (4 veces), el estado vacío de Seguimiento, las insignias de vacunado/esterilizado en la tabla y en las tarjetas de detalle, y el botón de "Ver seguimiento" (ojo).
- **Modal "Editar mascota"**: casillas de vacunado/esterilizado y botón "Guardar cambios".
- **"Configuración del sitio"**: los 9 íconos de categoría (`setting-section-icon`), los 4 interruptores (modo oscuro, animaciones, bordes, folio), los encabezados de cada sub-sección del editor de portada (Hero, Estadísticas, Banner, Cómo funciona, Campañas/Tips/FAQ), Reglamento, Nuevo evento, Identidad del sitio, Datos de contacto, Redes sociales (con íconos tipo Instagram/Facebook/globo), vista previa del footer, Checklist SEO, vista previa de Open Graph, y Cambiar contraseña.
- **"Apariencia e íconos"**: los 4 botones de modo (Emoji/Imagen/GIF/Ocultar), los 4 botones de logo preconfigurado, el aviso de "elemento oculto" y los mensajes de "Seleccionado"/imagen lista.
- **Editor de artículos**: título de sección y los botones de insertar imagen/emoji de la barra de herramientas.
- **Tablas de Roles/Usuarios**: insignias "Activa" y "⭐ Superadmin".
- **Listas de Avisos, Eventos y FAQ**: botones Editar/Eliminar, detalle de lugar/hora, y el título dinámico del formulario de FAQ (que alternaba entre "❓ Preguntas" y "✏️ Editar pregunta" con `.textContent` — se cambió a `.innerHTML` para que el ícono no se perdiera al cambiar de estado, mismo bug ya visto antes con otros botones).
- **Vista previa de "Tema visual"**: la mini maqueta (logo, tarjeta de estadística, insignias) que antes mezclaba emoji con los colores/tipografía configurados.
- **Toasts (`showToast()`)**: en vez de un emoji distinto pegado a mano en cada uno de los ~90 mensajes, ahora `showToast()` pone un solo ícono según el tipo (✓ verde para éxito, ✕ rojo para error, ℹ naranja para info) — se centralizó con una pasada de PowerShell sobre el archivo (dos rondas: una para emoji del plano básico de Unicode, otra para los de plano suplementario que van en pares subrogados, incluyendo los casos con operador ternario) en vez de editar cada llamada a mano.

### 🚫 Lo que se dejó igual, a propósito
- El botón "✕" de cerrar modal (en ~6 modales) — es un símbolo geométrico simple, no un emoji a color, ya es el estándar del sitio.
- Los símbolos ♂/♀ en el selector de sexo — igual de simples, no emoji a color.
- El emoji por defecto de `campanas.icono` (📢) y el selector de emoji de "Apariencia e íconos" (`ICON_EMOJIS`, `ICON_ELEMENTS`) — son campos de **contenido elegido por el admin**, no adorno fijo de la interfaz; ya se había decidido así en una sesión anterior.
- Los `value=""` por defecto de los campos del editor de portada (ej. "🏛️ Gobierno Municipal...", "🐶 Registrar mi mascota") — son el **contenido real que se publica en index.html**, una decisión de contenido del sitio público, no del panel admin en sí.

### 🔎 Verificado
- `php -l web/admin.html` después de cada tanda de cambios (más de 15 veces) — sin errores de sintaxis.
- `scripts/smoke_test.sh`: 24 verificaciones, mismas 3 fallas preexistentes de la cuenta admin real (no relacionadas).
- Se confirmó que cada `${ICON_...}` usado tiene su `const` correspondiente definida (ninguna referencia suelta) y se borraron 3 constantes que quedaron sin usar (`ICON_X`, `ICON_CAMERA`, `ICON_DOWNLOAD`).
- No se pudo probar visualmente en navegador (sin esa herramienta en este entorno) — pendiente que el usuario confirme viendo el panel en vivo.

### 📂 Archivos modificados
- `web/admin.html` (único archivo tocado — todo el trabajo fue dentro de su CSS y HTML/JS propios, no se tocó `web/css/styles.css` compartido).

## 📅 [2026-10-01e] — El correo de recuperación usa SMTP real de Titan (mail() nativo no llegaba a Gmail)

### 🤔 Contexto
Al probar en producción la recuperación de contraseña de la entrada anterior (2026-10-01d), el correo nunca llegaba a Gmail (ni a la bandeja ni a spam) aunque el servidor no reportaba ningún error. Diagnóstico completo, paso a paso, revisando el `error_log` real del servidor en cada intento:

1. `mail()` nativo de PHP entrega por el servidor genérico de HostGator (`mx74.hostgator.mx`), **no por Titan** — aunque el dominio en realidad usa Titan para su correo real (MX apunta a `mx1.titan.email`/`mx2.titan.email`).
2. El registro SPF del dominio (`v=spf1 include:spf.titan.email ~all`, ya existía de antes) solo autoriza a los servidores de Titan — el servidor de HostGator que usa `mail()` no está cubierto, así que como mucho pasa como "softfail" (`~all`).
3. Se probó agregar un registro DKIM (`titan1._domainkey`, sugerido por el propio panel de Titan) y habilitar "acceso de aplicaciones de terceros" en Titan — ninguno de los dos ayuda a `mail()`, porque ese DKIM es la llave privada de los servidores de Titan, no algo que el `mail()` local pueda usar para firmar.
4. Con esto, Outlook/Hotmail sí entregaba el correo (a la carpeta de correo no deseado — tolera el softfail de SPF), pero **Gmail lo descartaba por completo** (más estricto, sin SPF alineado y sin DKIM real, probablemente lo tira sin ni siquiera mandarlo a spam).

### 🔧 La solución real
En vez de `mail()`, el servidor ahora manda el correo por **SMTP autenticado de verdad contra Titan** (`smtp.titan.email:465`), usando la propia cuenta `no-responder@mascota-elgrullo.com` con su contraseña — la misma ruta que seguiría un humano mandando desde el webmail de Titan, así que sí hereda el SPF/DKIM que ya están configurados para Titan.

- **`web/api/config/helpers.php`**: `enviarCorreo()` reescrita de cero — ya no usa `mail()`, ahora abre un socket TLS (`stream_socket_client`) y habla el protocolo SMTP a mano (`EHLO`, `AUTH LOGIN`, `MAIL FROM`, `RCPT TO`, `DATA`, con dot-stuffing según RFC 5321 y el asunto codificado en MIME `=?UTF-8?B?...?=` para que los acentos no se rompan). Se implementó a mano con sockets (no con una librería tipo PHPMailer) para no romper la regla del proyecto de backend 100% PHP nativo sin paquetes externos — ver `LIBRERIAS_Y_LICENCIAS.md`. Cada paso de la conversación SMTP se valida contra el código de respuesta esperado; si algo falla se registra en `error_log()` identificando el paso (`EHLO`, `AUTH LOGIN`, etc.) — a propósito **nunca** se registra la contraseña ni su base64 (un descuido que sí pasó en una versión intermedia de esta misma sesión, corregido antes de subir a producción).
- **`web/api/config/database.example.php`** y **`web/api/config/database.php`** (gitignored): 3 constantes nuevas — `MAIL_SMTP_HOST` (`smtp.titan.email`), `MAIL_SMTP_PORT` (`465`), `MAIL_SMTP_PASS` (la contraseña real de `no-responder@mascota-elgrullo.com`, documentada también en `CUENTAS_PRUEBA.md`). A diferencia de `mail()`, esto sí funciona igual desde XAMPP local (es una conexión saliente a internet, no depende del servidor), así que `MAIL_FROM_ADDRESS`/`MAIL_FROM_NAME` dejaron de tener una rama distinta para local — es la misma cuenta real en los dos entornos.

### 🔐 Lado de Titan/DNS (ya hecho, documentado para no repetirlo)
- DKIM (`titan1._domainkey`, registro TXT) verificado desde el panel de Titan.
- SPF (`v=spf1 include:spf.titan.email ~all`) ya existía desde que se activó el correo del dominio — confirmado con una consulta DNS real (`dns.google/resolve`), no asumido.
- "Enable Titan on other apps" (acceso SMTP de aplicaciones externas) activado desde el webmail de Titan — viene apagado por default, sin esto Titan rechaza la autenticación con `535 5.7.8 authentication failed` aunque la contraseña sea correcta.

### 🔎 Verificado
- Probado en local (XAMPP) contra el SMTP real de Titan antes de tocar producción.
- Una vez desplegado: `solicitar-recuperacion` contra `https://mascota-elgrullo.com` en vivo, para una cuenta de Gmail y una de Hotmail — confirmado en el buzón real de ambas cuentas (no solo por la respuesta `ok:true` de la API, que siempre es igual a propósito).
- `scripts/smoke_test.sh`: 24 verificaciones, mismas 3 fallas preexistentes de la cuenta admin real (no relacionadas).

### 🚫 Lo que NO se tocó
- No se cambió nada del endpoint `solicitar-recuperacion`/`restablecer-password` en `auth.php` — la firma de `enviarCorreo()` se mantuvo idéntica a propósito, solo cambió su implementación interna.

### 📂 Archivos modificados
- `web/api/config/helpers.php`, `web/api/config/database.example.php`.
- (`web/api/config/database.php` también, en local y en el servidor real vía Administrador de archivos — gitignored, nunca se sube a git.)

## 📅 [2026-10-01d] — Recuperación de contraseña por correo (olvidé mi contraseña)

### 🤔 Contexto
Hasta ahora, si un ciudadano olvidaba su contraseña no había ninguna forma de recuperarla por su cuenta — dependía de que un admin le reseteara la cuenta a mano. El usuario pidió implementar la recuperación por correo y decidió que, para empezar, el envío se haga con una cuenta de correo del propio dominio (`no-responder@mascota-elgrullo.com`, por crear en cPanel) en vez de un servicio externo de pago.

### 🔐 Base de datos (`web/database/schema.sql`)
- 2 columnas nuevas en `duenos`: `reset_token` (VARCHAR 64, token aleatorio de un solo uso) y `reset_token_expira` (DATETIME, vence 1 hora después de solicitarse).
- Nuevo índice `idx_reset_token` — se consulta en cada clic al enlace de recuperación.
- La vigencia se compara `reset_token_expira > NOW()` **dentro de MySQL**, nunca con `time()`/`strtotime()` de PHP — mismo criterio ya usado para `bloqueado_hasta`/`token_creado_en` (PHP y MySQL pueden tener zonas horarias distintas en el mismo servidor).
- Migración aplicada manualmente en la base de datos local (`ALTER TABLE duenos ADD COLUMN reset_token ..., ADD COLUMN reset_token_expira ..., ADD INDEX idx_reset_token`); **pendiente aplicarla también en HostGator** cuando se retome el despliegue — mismo patrón ya usado para migraciones anteriores (rol `asistente`, `es_superadmin`).

### 🔧 Backend (`web/api/auth.php`, `web/api/config/helpers.php`, `web/api/config/database.php`)
- Nuevo endpoint `POST /api/auth?action=solicitar-recuperacion` (sin sesión, es justo para quien no puede iniciar sesión): recibe un correo, genera el token y lo guarda con 1 hora de vigencia, y manda el correo con el enlace (`{BASE_URL}/login.html?reset=TOKEN`). **Siempre responde el mismo mensaje exista o no esa cuenta** — si cambiara según el caso, cualquiera podría usar este formulario para averiguar qué correos están registrados en el padrón (enumeración de cuentas).
- Nuevo endpoint `POST /api/auth?action=restablecer-password` (sin sesión, el token hace de credencial): valida que el token exista y no haya vencido, exige la misma regla de contraseña que el resto del sitio (`validarPassword()`), actualiza `password_hash`, borra el token (de un solo uso — no se puede reusar el mismo enlace) y además invalida la sesión/bloqueo existentes (`token_sesion`, `intentos_fallidos`, `bloqueado_hasta`), igual que ya hace `change-password`.
- Nueva función `enviarCorreo()` en `helpers.php`: usa `mail()` nativo de PHP con la cuenta `MAIL_FROM_ADDRESS`/`MAIL_FROM_NAME` (nuevas constantes en `database.php`, separadas por entorno local/producción igual que `BASE_URL`). Nunca lanza excepción — un correo que no sale no debe tumbar la respuesta de la API (mismo criterio que `registrarBitacora()`).
- `database.php`: en producción, `MAIL_FROM_ADDRESS` queda como `no-responder@mascota-elgrullo.com` — **⚠️ pendiente: crear esa cuenta de correo real en cPanel → "Cuentas de correo" antes de que esto funcione en el sitio en vivo** (gratis, incluida en el hosting; sin ella `mail()` puede fallar o el correo cae a spam).

### 🎨 Frontend (`web/login.html`, `web/js/api-client.js`)
- Link "¿Olvidaste tu contraseña?" junto a "Recordarme" en el formulario de inicio de sesión → abre el modal `#modal-recuperar` (pide el correo).
- Nuevo modal `#modal-restablecer` (nueva contraseña + confirmar) que se abre solo si la URL trae `?reset=TOKEN` (el enlace del correo) — no exige sesión. Al terminar, limpia el `?reset=` de la URL con `history.replaceState` para que el enlace ya gastado no quede visible/reusable por accidente.
- `apiSolicitarRecuperacion(email)` y `apiRestablecerPassword(token, password)` nuevas en `api-client.js`, mismo patrón que el resto del cliente HTTP.

### 🔎 Verificado (con `curl` contra la API local, no hay navegador en este entorno)
- Correo inexistente vs. correo real → **mismo mensaje** en ambos casos (no filtra qué correos están registrados).
- Token inválido → 400. Contraseña débil con token válido → 400 (mismo mensaje que el resto del sitio). Token válido + contraseña válida → 200, contraseña actualizada. Reusar el mismo token después → 400 (ya se gastó). Login con la contraseña restablecida → 200.
- `scripts/smoke_test.sh` completo tras el cambio: 24 verificaciones, mismas 3 fallas preexistentes de la cuenta admin real (no relacionadas con este cambio — ver nota de la importación de datos reales más abajo), el resto OK.
- En local (XAMPP) no hay servidor de correo real configurado, así que `mail()` no llega a enviar de verdad — para poder probar el flujo completo sin depender de eso, `solicitar-recuperacion` también deja el enlace en `error_log()`.

### 🚫 Lo que NO se hizo
- No se armó verificación de correo al registrarse (fuera de alcance de este cambio).
- No se agregó límite de frecuencia (ej. "espera 1 minuto antes de pedir otro enlace") — con el 1-hora de vigencia y que cada solicitud nueva reemplaza el token anterior, no es crítico para el tamaño actual del padrón, pero queda como posible mejora futura si se ve abuso real.
- No se usó ningún servicio externo (Brevo/SendGrid) — decisión explícita del usuario, para no depender de un registro/cuenta de terceros por ahora.

### 📂 Archivos modificados
- `web/database/schema.sql`, `web/api/auth.php`, `web/api/config/helpers.php`, `web/api/config/database.example.php`, `web/js/api-client.js`, `web/login.html`.
- (`web/api/config/database.php` también se actualizó con las mismas constantes, pero ese archivo nunca se sube a git — ver `.gitignore`.)

## 📅 [2026-10-01c] — Bloquea temporalmente que Google/Bing indexen el sitio (sigue en pruebas)

### 🤔 Contexto
El usuario pidió que, mientras el sitio sigue en fase de pruebas, nadie pueda encontrarlo buscando en Google — ni por rastreo normal ni porque alguien ya tenga un link directo.

### 🔧 Cambios
- **`web/robots.txt`** (nuevo): `Disallow: /` para todos los buscadores — les pide no rastrear nada del sitio.
- **`web/.htaccess`**: se agregó el header `X-Robots-Tag: noindex, nofollow, noarchive` — más fuerte que `robots.txt` solo: esto le prohíbe a Google **indexar** el sitio aunque llegue a rastrearlo (por ejemplo si alguien comparte un link directo en otro lado).
- Ambos quedaron marcados explícitamente como **temporales**, con una nota de qué 2 archivos hay que tocar (`robots.txt` y el header de `.htaccess`) cuando el Ayuntamiento autorice que el sitio sea público en buscadores — hace falta quitar los dos, no solo uno.

### 🔎 Verificado
- `curl -I` local confirma el header `X-Robots-Tag` presente; `curl` a `/robots.txt` sirve el archivo correcto.
- `scripts/smoke_test.sh` completo: 24 verificaciones, 0 fallas.

### 📂 Archivos modificados
- `web/robots.txt` (nuevo), `web/.htaccess`.

## 📅 [2026-10-01b] — Nuevo documento `LIBRERIAS_Y_LICENCIAS.md`: revisión legal de todo lo de terceros que usa el proyecto

### 🤔 Contexto
El usuario pidió revisar si las librerías que usa el proyecto son libres o si hace falta acreditar a sus autores, para evitar problemas legales al entregarlo al Ayuntamiento.

### 🔧 Qué se hizo
Se revisó el código real (no de memoria) buscando cada `<script src="http...">`/`<link href="http...">` externo en las 6 páginas HTML y en `styles.css`, y se armó el inventario completo:
- **Leaflet 1.9.4** (mapa) — BSD-2-Clause.
- **jsPDF 2.5.1** (acta en PDF) — MIT.
- **QRCode.js 1.0.0** (código QR) — MIT.
- **Teselas de OpenStreetMap** (mapa de calles) — ODbL, exige mostrar el crédito "© OpenStreetMap contributors" — **ya estaba puesto** en el código desde antes.
- **Google Fonts** (Outfit + Inter) — SIL Open Font License.
- **Íconos de línea** — tomados de **Lucide** (no es una librería cargada, se copió el SVG de cada ícono directo al HTML el 2026-08-06) — licencia **ISC** (se corrige aquí: esa entrada del historial decía "MIT/ISC", la correcta es ISC).
- Backend: PHP nativo puro, sin ninguna librería externa (sin Composer).

**Conclusión: ninguna librería usada cobra licencia, obliga a abrir el código del proyecto, ni requiere permiso del autor — son todas licencias permisivas (MIT/BSD/ISC/OFL). La única atribución obligatoria (OpenStreetMap) ya estaba cumplida.**

### 📂 Archivos
- `LIBRERIAS_Y_LICENCIAS.md` (nuevo — sí se sube al repositorio, a diferencia de `ANALISIS_SEGURIDAD.md`: este documento no contiene ningún dato sensible ni vulnerabilidad, al contrario, es evidencia de que se revisó la procedencia de todo).

## 📅 [2026-10-01] — Renombra "Usuarios" a "Cuentas Ciudadanas" en el menú del panel admin

### 🔧 Cambios
- **`web/admin.html`**: el link del menú lateral decía "Usuarios" aunque el título de la página, al entrar, ya decía "Cuentas Ciudadanas" desde antes — quedaban desalineados. Se igualó el texto del menú al del título. El `id`/`onclick` internos (`nav-usuarios`, `showAdmin('usuarios')`) no se tocaron, son identificadores internos, no texto visible.

### 📂 Archivos modificados
- `web/admin.html`.

## 📅 [2026-09-30] — "Datos"/"Bitácora" solo para el superadmin, y el mapa ya muestra las mascotas de cada colonia

### 🤔 Contexto
El usuario pidió 2 cosas: (1) que al hacer clic en un pin del mapa de "Datos" se pudiera ver la lista real de mascotas de esa colonia, no solo el número total; y (2) que las secciones "Datos" y "Bitácora" del menú solo las pueda ver el superadmin, no cualquier admin.

### 🔧 Cambios

**1. Mapa → lista de mascotas por colonia:**
- **`web/admin.html`**: el popup de cada pin del mapa (antes solo mostraba "X mascotas registradas") ahora tiene un botón **"Ver mascotas →"**. Nueva función `abrirMascotasColonia(colonia)`: reutiliza el filtro `?colonia=` que ya existía en `mascotas.php` (no fue necesario tocar el backend) y muestra el resultado en un modal nuevo (`#modal-mapa-colonia`) como una lista de tarjetas (ícono de mascota, nombre, dueño, especie/raza, insignia de vacunado) — no una tabla de columnas, para que quepan bien los datos sin recortarse. Cada fila es clickeable y manda directo a "Seguimiento" ya buscando esa mascota (reutiliza `goToSeguimiento()`, el mismo patrón que ya usaba la mini-tabla de "Datos").

**2. "Datos" y "Bitácora" restringidos al superadmin:**
- **`web/api/bitacora.php`**: `requireAdmin()` → `requireSuperAdmin()`. Esta sí es una restricción real del lado del servidor — ni por consola del navegador ni llamando la API directo un admin normal puede ya leer la bitácora (probado con `curl`: da `403 Acceso denegado. Se requiere ser superadmin.`).
- **`web/admin.html`**: para una cuenta admin que no es superadmin, se ocultan los links "Datos" y "Bitácora" del menú lateral, y la sección que se muestra al entrar al panel cambia de "Datos" a "Seguimiento" (ya que "Datos" queda oculta). El mapa (`initMap()`) tampoco se inicializa para un admin normal, para no gastar las peticiones a OpenStreetMap de una sección que no va a ver.
- **Nota importante, para que quede claro qué tan protegido queda cada uno:** "Bitácora" quedó protegida de verdad (servidor + menú). "Datos" solo se ocultó del menú — sus números (total de mascotas, vacunados, etc.) **ya eran públicos** desde antes en la propia portada (`index.html`), así que no había nada que proteger ahí del lado del servidor; ocultarlo es solo para simplificar el menú de un admin normal, no una medida de seguridad.

### 🔎 Verificado (contra la API real, no solo el código)
- `GET /api/bitacora` con la cuenta superadmin real → `200`.
- Se creó una cuenta de prueba, se promovió a admin (no superadmin), y `GET /api/bitacora` con esa cuenta → `403` confirmado.
- `GET /api/mascotas?colonia=El Grullo centro` devuelve mascotas reales de esa colonia.
- Cuenta de prueba revocada y desactivada al terminar.
- Balance de `<script>` (6/6) y `<svg>` (65/65) sin cambios inesperados.
- `scripts/smoke_test.sh` completo: 24 verificaciones, 0 fallas.
- No se pudo confirmar visualmente en navegador (sin herramientas de automatización de navegador en este entorno) — pendiente que el usuario confirme en pantalla, sobre todo que el popup del mapa y el modal nuevo se vean bien.

### 📂 Archivos modificados
- `web/api/bitacora.php`, `web/admin.html`.

## 📅 [2026-09-29] — El rediseño de íconos llega al modal de QR (dashboard, admin y asistente)

### 🤔 Contexto
El usuario notó que el modal de QR (el que se abre con el botón "QR" en "Mis mascotas"/Seguimiento/Mascotas registradas) se había quedado fuera del rediseño de íconos de las entradas `2026-09-22f` a `i` — de hecho, ese modal con sus emojis originales fue justo la plantilla que se copió tal cual a `admin.html` y `asistente.html` cuando se agregó el botón QR ahí (`2026-09-22`/`2026-09-22d`), así que el problema estaba multiplicado por 3.

### 🔧 Cambios
- **`web/dashboard.html`, `web/admin.html`, `web/asistente.html`**: en las 3 copias del modal de QR (`verQR()`/`verQRAdmin()`/`verQRRegistro()`), se reemplazaron por íconos de línea SVG: el título "🔲 QR — {nombre}", el botón "🌐 Abrir página pública", el botón "🖨️ Imprimir QR", y dentro de la ficha de info: "🐾 {nombre}" (mascota), "👤 {dueño}" y "📞 {teléfono}" — reutilizando exactamente los mismos SVG ya usados en el resto del sitio (pata, persona, teléfono, globo) en vez de crear íconos nuevos.
- El título (`qr-titulo`) pasó de `textContent` a `innerHTML` para poder incluir el ícono — se ajustó `printQR()` en las 3 páginas (leía ese texto para armar la ventana de impresión y buscaba literalmente el emoji `🔲` para quitarlo).
- De paso, el botón "QR" de la tarjeta de Seguimiento en `admin.html` (que decía "🔲 QR") también quedó con el ícono en vez del emoji.

### 🚫 Lo que NO se tocó
- `admin.html` tiene un emoji 🔲 más, en "Tema visual" → "Bordes redondeados (tarjetas)" — es una fila de configuración sin relación con el QR, se dejó fuera por no ser lo que se pidió.

### 🔎 Verificado
- Las 3 páginas responden 200 en local.
- Balance de `<script>` y `<svg>` en las 3 (todas 1:1).
- `scripts/smoke_test.sh` completo: 24 verificaciones, 0 fallas.
- No se pudo confirmar visualmente en navegador (sin herramientas de automatización de navegador en este entorno).

### 📂 Archivos modificados
- `web/dashboard.html`, `web/admin.html`, `web/asistente.html`.

## 📅 [2026-09-23] — Cuatro documentos Word para el Trello del profesor: Marco Teórico, Metodología, Lista de Requerimientos y Diseño de Base de Datos

### 🤔 Contexto
El profesor lleva la residencia en un tablero de Trello (columnas Pendientes / En Revisión / Finalizado) y pide un documento por cada tarjeta, con el formato de portada de `Word/trello/Formato del Documento.docx` (logo del Tecnológico Superior de Jalisco, título, fecha, profesor, materia, unidad, alumno y número de control). El usuario pidió los cuatro primeros: Marco Teórico, Metodología, Lista de Requerimientos y Diseño de Base de Datos. No se tocó código del sistema.

### 🔧 Cambios
- **Creados 4 documentos en `Word/trello/`** (carpeta ignorada por git; no se sube nada personal):
  - `Marco Teórico.docx` (26 págs.): antecedentes (rabia, RUAC de la CDMX, el caso de El Grullo), marco normativo federal, estatal y municipal, marco conceptual, fundamentos tecnológicos, seguridad de la información, usabilidad y accesibilidad, fundamentos de ingeniería de software y de bases de datos, y 32 fuentes en APA 7.
  - `Metodología.docx` (14 págs.): enfoque incremental e iterativo, 7 fases con horas y estado a la semana 5, técnicas, herramientas, roles, gestión de cambios, criterios de calidad, riesgos y consideraciones éticas.
  - `Lista de Requerimientos.docx` (14 págs.): 42 requerimientos funcionales en 5 módulos, 16 no funcionales, 13 reglas de negocio, restricciones y supuestos, trazabilidad con los 5 objetivos del anteproyecto y resumen de estado (53 implementados, 3 parciales y 2 pendientes, de 58).
  - `Diseño de Base de Datos.docx` (21 págs.): modelo conceptual, lógico y físico de las 7 tablas, diagrama entidad-relación, diccionario de datos, normalización, integridad, índices, consultas principales, seguridad y respaldo, evolución del esquema (11 cambios del 22 de julio al 8 de septiembre) y anexo con el DDL.
- **Formato**: portada idéntica a la plantilla; cuerpo con el estilo "Formato apa" de la plantilla (Arial 12, interlineado doble, sangría de 0.5 cm, justificado); índice automático, número de página en el encabezado, tablas y figuras numeradas con pie tipo APA, y título y autor en las propiedades del archivo.
- **Figuras nuevas**: arquitectura del sistema y ciclo de desarrollo incremental (dibujadas con GDI+); se reutilizan el diagrama de casos de uso y el entidad-relación de la semana 4.
- **Verificación de fuentes legales por búsqueda web** (septiembre de 2026):
  - La «Ley General en Materia de Bienestar Animal» que citaban `Marco_Teorico.rtf` y el reporte MG **no está expedida**: la reforma constitucional (DOF 2-dic-2024, artículos 3, 4 y 73) dio 180 días al Congreso (vencieron el 1-jun-2025) y solo se localizaron iniciativas. Los documentos nuevos citan esa reforma, la Ley de Protección y Cuidado de los Animales del Estado de Jalisco (publicada el 29-nov-2012), la NOM-011-SSA2-2011 y las leyes de protección de datos personales federal y de Jalisco.
  - No se encontró un «Reglamento de Protección y Bienestar Animal» de El Grullo. El Reglamento de Policía y Buen Gobierno sí regula a los animales en la vía pública (artículos 12 fr. V y XIII, y 80 fr. V), pero no prevé un padrón. El enlace que publica el sitio del Ayuntamiento para el Reglamento de Medio Ambiente y Cambio Climático (2025) devuelve en realidad el Código de Ética, por eso quedó un marcador `[VERIFICAR]`.
- Las fuentes de generación (script y JSON con todo el texto) se respaldaron en `Word/Respaldos/trello_fuentes/` para poder regenerar los documentos.

### ⚠️ Pendiente (marcadores en amarillo)
- **Profesor y Materia** en las portadas de los 4 documentos: el usuario no indicó quién es el profesor ni la materia.
- Metodología: fechas y participantes de las reuniones del levantamiento de requerimientos.
- Marco Teórico: revisar con el personal de Medio Ambiente el Reglamento de Medio Ambiente y Cambio Climático.
- Los tres marcadores `[VERIFICAR]` del reporte MG siguen sin corregirse con los datos de arriba; falta el visto bueno del usuario.

### 🔎 Verificado
- Los 4 documentos se generaron con Word (automatización COM) y se revisaron página por página en PDF: sin referencias sin resolver, sin resaltado indebido y con el índice en una sola página.
- Cifras contrastadas con el código y el historial: 24 verificaciones de la prueba de humo, 38 colonias, 7 tablas, 6 páginas HTML, 8 servicios de la API, límites de foto y de paginación.

### 📂 Archivos
- Creados (fuera de git): los 4 `.docx` de `Word/trello/` y `Word/Respaldos/trello_fuentes/`.
- Modificado: `HISTORIAL_CAMBIOS.md`.

## 📅 [2026-09-22i] — Continúa el mismo rediseño en Bitácora y en las 10 pestañas de "Configuración del sitio"

### 🤔 Contexto
El usuario pidió seguir el mismo criterio de la entrada anterior (`2026-09-22h`) en el resto del panel: la columna "Acción" de la Bitácora, el encabezado de "Configuración del sitio", las 10 pestañas de esa sección (Contenidos de Portada, Reglamento, Avisos y promociones, Eventos, Contactos, Preguntas FAQ, Apariencia e íconos, Municipio, Tema visual, SEO y metadatos), y el encabezado + zona de arrastrar de "Avisos y promociones".

### 🔧 Cambios
- **`web/admin.html`**:
  - `ACCION_LABELS` (Bitácora): sus 5 emojis (⭐✅🚫🐾✏️) se reemplazaron por íconos de línea, reutilizando `ICON_SHIELD_CHECK`/`ICON_CHECK_CIRCLE`/`ICON_BAN` ya creados en `2026-09-22f`, más 2 nuevos (`ICON_ARCHIVE` para "mascota dada de baja", `ICON_PENCIL` para "editada por admin").
  - **Bug real encontrado de paso**: a la acción `rol_revocado_admin` (la de "Quitar administrador", agregada en `2026-09-22c`) le faltaba por completo su entrada en `ACCION_LABELS` — hoy mostraría el código interno en la Bitácora en vez de un texto legible. Se agregó: "Rol de Administrador revocado" con `ICON_SHIELD_MINUS`.
  - Encabezado "⚙️ Configuración del sitio" y las **10 pestañas** de navegación (`.config-nav-icon`, antes 🏠📋📢📅📞❓🎨🏛️🖌️🌐) → íconos de línea (casa, portapapeles, megáfono, calendario, teléfono, ayuda, imagen, edificio de gobierno, pincel, globo terráqueo). El teléfono y el globo son exactamente el mismo SVG que ya usan `index.html`/`login.html` en otros lados, reutilizados tal cual.
  - Encabezado "📢 Avisos y promociones" y el ícono de la zona de arrastrar banner (⬆️) → íconos de línea. También el texto "⬆️ Subir propia imagen o arrastrar" dentro de "Apariencia e íconos".

### 🚫 Lo que NO se tocó (a propósito — es contenido, no decoración)
- Los íconos de cada aviso en la lista **"Avisos publicados"** (💉🏥📚 en la captura del usuario) **no se tocaron**: vienen de `campanas.icono`, un campo que el propio admin elige libremente al crear cada campaña (parte de la función real de personalización, no un adorno fijo de la interfaz). Cambiar esto de raíz significaría quitarle esa opción al admin — se dejó pendiente de que el usuario confirme si de verdad quiere eso antes de tocarlo.

### 🔎 Verificado
- `admin.html` responde 200 en local y ya trae `ICON_ARCHIVE`/`ICON_PENCIL`/`rol_revocado_admin`.
- Balance de `<script>` (6/6) y `<svg>` (57/57).
- `scripts/smoke_test.sh` completo: 24 verificaciones, 0 fallas.
- No se pudo confirmar visualmente en navegador (sin herramientas de automatización de navegador en este entorno).

### 📂 Archivos modificados
- `web/admin.html`.

## 📅 [2026-09-22h] — Quita los emojis de los botones de "Mi perfil" y "Configuración sitio" (se veían anticuados)

### 🤔 Contexto
El usuario mandó capturas de "Mi perfil" y "Configuración sitio" señalando que los botones (💾 Guardar cambios, 🔒 Actualizar contraseña, etc.) se veían anticuados/"muy IA" por usar emojis en vez de íconos — mismo tema que ya se corrigió en "Roles y Cuentas"/"Usuarios" la entrada anterior de hoy (`2026-09-22f`), pero ahí no se había tocado.

### 🔧 Cambios
- **`web/admin.html`**: se reemplazaron por íconos de línea SVG los emojis de **13 botones** en "Configuración sitio" (Guardar/Restablecer de Portada, Reglamento, Avisos, Eventos, Contactos, Apariencia, Municipio, Tema, SEO, y los 2 "Subir imagen") y **2 en "Mi perfil"** (Guardar cambios, Actualizar contraseña). También se corrigió el botón de "Nuevo artículo" (Guardar artículo) por la misma inconsistencia. Se agregaron `ICON_SAVE` e `ICON_SEND` a las constantes de íconos reutilizables (junto a las de la entrada `2026-09-22f`).
- **Botones con texto dinámico** (que un `textContent =` en JS les borra el ícono al cambiar de "Publicar aviso"/"Guardar artículo" a "Guardar cambios" y viceversa, al editar/cancelar): se cambiaron esas 5 asignaciones de `textContent` a `innerHTML` con el ícono correspondiente, para que el ícono no desaparezca después del primer editar/cancelar — antes de esto, arreglar solo el HTML inicial se hubiera "deshecho" en cuanto alguien usara el formulario.
- **El lápiz para cambiar la foto de perfil** (⏺️✏️, un círculo pequeño sobre el avatar) también era emoji — se cambió por un ícono de línea, en `admin.html`, `dashboard.html` y `asistente.html` (mismo bloque copiado en las 3 páginas, igual que ya pasó con otros arreglos de "Mi perfil" en entradas anteriores).
- **`web/dashboard.html`, `web/asistente.html`**: se aplicó el mismo cambio a sus botones "Guardar cambios"/"Actualizar contraseña" de "Mi perfil" (idéntico al de `admin.html`), para que las 3 páginas se vean iguales.

### 🚫 Lo que NO se tocó (a propósito, fuera de lo pedido)
- Quedan emojis como encabezados/pestañas de navegación dentro de "Configuración sitio" (📢📅🖌️🌐 en las pestañas Contenido/Eventos/Tema/SEO, y el título "🔒 Cambiar contraseña") — el usuario pidió específicamente los **botones**, no los encabezados; se puede hacer aparte si se pide.
- Otros "✏️ Editar" con emoji en Seguimiento, Artículos, Avisos, FAQ y Bitácora — mismo criterio, no se pidieron esta vez.

### 🔎 Verificado
- Las 3 páginas responden 200 en local; `admin.html` ya trae `ICON_SAVE`/`ICON_SEND`.
- Balance de `<script>` y `<svg>` en las 3 páginas (todas 1:1 abre/cierra).
- `scripts/smoke_test.sh` completo: 24 verificaciones, 0 fallas (cambio puramente visual).
- No se pudo confirmar visualmente en navegador (sin herramientas de automatización de navegador en este entorno).

### 📂 Archivos modificados
- `web/admin.html`, `web/dashboard.html`, `web/asistente.html`.

## 📅 [2026-09-22g] — Corrige la nota del superadmin: seguía citando los emojis que ya se quitaron de los botones

### 🤔 Contexto
El usuario notó que el texto explicativo que ve el superadmin arriba de "Roles y Cuentas" seguía diciendo `botón "⭐ Hacer administrador"` y `botón "🔻 Quitar administrador"` — quedó desactualizado tras el rediseño de la entrada anterior (`2026-09-22f`), que ya quitó esos emojis de los botones reales.

### 🔧 Cambios
- **`web/admin.html`**: se quitaron los emojis `⭐`/`🔻` del texto de `notaRoles` — ahora solo cita el nombre del botón ("Hacer administrador" / "Quitar administrador"), que sí coincide con lo que se ve en pantalla.

### 📂 Archivos modificados
- `web/admin.html`.

## 📅 [2026-09-22f] — Rediseño de los botones de acción en "Roles y Cuentas" / "Usuarios" (menos anticuados, con jerarquía visual)

### 🤔 Contexto
El usuario mandó capturas de "Roles y Cuentas" señalando que los botones se veían "anticuados": cada acción era una pastilla con borde completo del mismo tamaño sin importar su importancia (Hacer/Quitar administrador igual de "grande" visualmente que Desactivar/Agregar correo), con emojis en vez de los íconos de línea que ya usa el resto del sitio, y al envolver en 2 líneas se veía amontonado.

### 🔧 Cambios
- **`web/css/styles.css`**: 3 clases nuevas para acciones de fila en tablas:
  - `.btn-icon` — botón cuadrado compacto (32×32px) de solo ícono, con `title` como tooltip, para acciones frecuentes/de bajo riesgo (Activar/Desactivar, Agregar correo) — variantes `.danger`/`.success`/`.info` para el color según la acción.
  - `.btn-tag` — "etiqueta" con fondo suave (no borde completo) para las 2 acciones de cambio de rol (Hacer/Quitar administrador) — más importantes y menos frecuentes, así que sí llevan texto, pero con menos peso visual que un botón pastilla completo.
  - `.row-actions` — contenedor flex que alinea estos botones a la derecha con espaciado consistente.
- **`web/admin.html`**: se actualizaron `renderRolesTable()` (Roles y Cuentas) y `renderUsuariosTable()` (Usuarios) para usar las clases nuevas. Los emojis (⭐🔻✉️🚫✅) se reemplazaron por íconos de línea SVG — mismo estilo que ya usa el resto del sitio desde el 2026-08-06 ("Reemplaza emojis por íconos de línea profesionales"), que esta tabla en particular se había quedado sin actualizar. Los 5 íconos (escudo con check, escudo con menos, sobre con +, círculo tachado, círculo con check) quedaron como constantes reutilizables (`ICON_SHIELD_CHECK`, etc.) en vez de repetir el SVG completo en cada fila.
- Se subió la versión del CSS (`?v=20260922` → `?v=20260922b`) en las 5 páginas.

### 🔎 Verificado
- `curl` contra el sitio local: `styles.css` ya sirve las 3 clases nuevas, `admin.html` ya trae los íconos y `row-actions`.
- Balance de llaves en `styles.css` (413/413) y de `<script>` en `admin.html` (6/6).
- `scripts/smoke_test.sh` completo: 24 verificaciones, 0 fallas (cambio puramente visual).
- No se pudo confirmar visualmente en navegador (sin herramientas de automatización de navegador en este entorno) — pendiente que el usuario lo vea en pantalla.

### 📂 Archivos modificados
- `web/css/styles.css`, `web/admin.html`, `web/{index,login,dashboard,asistente}.html` (solo el `?v=` del CSS).

## 📅 [2026-09-22e] — El color del "Tema visual" ya se refleja en el sidebar de dashboard.html y asistente.html

### 🤔 Contexto
El usuario comparó capturas: en `admin.html` el sidebar cambia de color según lo configurado en "Tema visual" (panel admin → Configuración), pero en `asistente.html` el sidebar se quedaba negro plano, sin importar el color elegido.

### 🔧 Cambios
- **`web/css/styles.css`**: la regla base `.sidebar { background: var(--dark); ... }` (compartida por `dashboard.html`, `admin.html` y `asistente.html`) se cambió a `background: linear-gradient(180deg, var(--brand-dark-1) 0%, var(--brand-dark-2) 100%)` — las mismas variables que `aplicarTemaVisual()` (`tema.js`) ya actualiza en cada página cuando el admin guarda un color nuevo. Causa real: ese degradado solo existía en el `<style>` interno de `admin.html`, nunca se agregó al CSS compartido — así que `dashboard.html` (panel ciudadano) tenía exactamente el mismo problema que `asistente.html`, aunque el usuario solo lo notó en este último.
- **`web/admin.html`**: se quitó la regla `.sidebar { ... }` de su `<style>` interno — quedó duplicada/redundante ahora que vive en `styles.css`.
- Se subió la versión del CSS (`?v=20260917` → `?v=20260922`) en las 5 páginas que lo cargan.

### 🔎 Verificado
- `curl` contra el sitio local confirma que `styles.css` ya sirve la regla nueva.
- Balance de llaves en `styles.css` (397 abren / 397 cierran) y de `<script>` en `admin.html` (6/6) sin cambios inesperados.
- `scripts/smoke_test.sh` completo: 24 verificaciones, 0 fallas (cambio puramente visual, no toca backend).
- No se pudo confirmar visualmente en navegador (sin herramientas de automatización de navegador en este entorno) — pendiente que el usuario lo vea en pantalla.

### 📂 Archivos modificados
- `web/css/styles.css`, `web/admin.html`, `web/{index,login,dashboard,asistente}.html` (solo el `?v=` del CSS).

## 📅 [2026-09-22d] — Botón QR también en "Mascotas que he registrado" (asistente)

### 🤔 Contexto
El usuario notó que, al igual que pasaba antes en "Seguimiento" del panel admin (ver entrada `2026-09-22`), el modal "Mascotas que he registrado" de `asistente.html` solo tenía botón de "Acta", sin QR.

### 🔧 Cambios
- **`web/asistente.html`**: se agregó el botón **"🔲 QR"** junto a "Acta" en cada fila del modal "Mascotas que he registrado". Nueva función `verQRRegistro(id)` — mismo patrón exacto que `verQR()`/`verQRAdmin()` de `dashboard.html`/`admin.html`, adaptada a `misRegistros`. Se agregó también `printQR()` y la librería `qrcodejs` (CDN, con `defer`, igual que `jsPDF`) — esta página no tenía ninguna de las dos antes.

### 🔎 Verificado
- `curl` contra el sitio local: `asistente.html` responde 200 y ya trae `verQRRegistro`.
- `scripts/smoke_test.sh` completo: 24 verificaciones, 0 fallas.
- No se pudo probar visualmente en navegador (sin herramientas de automatización de navegador en este entorno).

### 📂 Archivos modificados
- `web/asistente.html`.

## 📅 [2026-09-22c] — "Roles y Cuentas" ya muestra a los administradores, y el superadmin puede quitar el rol admin

### 🤔 Contexto
El usuario notó que en "Roles y Cuentas" no aparecían las cuentas de administrador (solo ciudadanos y asistentes), y que no existía forma de quitarle el rol admin a alguien — solo de dárselo (el botón "⭐ Hacer administrador"). Pidió: que las cuentas admin/superadmin se vean ahí (tanto para admin normal como para superadmin, en modo consulta), y que el superadmin también pueda revocar el rol, no solo otorgarlo.

### 🔧 Cambios
- **`web/api/usuarios.php`**:
  - `GET ?rol=todos` ahora incluye también `rol='admin'` (antes solo `'ciudadano','asistente'`) — sigue requiriendo sesión de admin (cualquiera, no solo superadmin), igual que ya era. Se agregó `es_superadmin` a las columnas devueltas, para que el frontend sepa distinguir "Administrador" de "Superadmin" y proteger la fila del superadmin.
  - Nuevo endpoint **`POST ?action=revocar-admin`**: le quita el rol admin a una cuenta (vuelve a `ciudadano`, conserva correo/contraseña — sigue pudiendo iniciar sesión, solo pierde privilegios). Mismas protecciones que `promover-admin`: solo superadmin (`requireSuperAdmin()`), `UPDATE` atómico revalidando las condiciones, y queda registrado en bitácora (`rol_revocado_admin`). Bloqueado explícitamente por partida doble (antes de la consulta y en el propio `WHERE` del `UPDATE`) contra la cuenta `es_superadmin=1` — ni siquiera el superadmin puede quitarse su propio rol desde aquí, para no dejar el sistema sin nadie que pueda volver a promover a nadie.
- **`web/js/api-client.js`**: nueva `apiRevocarAdmin(id)`.
- **`web/admin.html`** (pestaña "Roles y Cuentas"):
  - La columna de rol ahora distingue Administrador/Superadmin (antes solo mostraba Ciudadano/Asistente).
  - Nuevo botón **"🔻 Quitar administrador"**, visible solo para el superadmin y solo en filas de administradores que no son la cuenta superadmin.
  - El botón "⭐ Hacer administrador" ahora se oculta en filas que ya son admin (antes, si un admin llegaba a aparecer en la lista, el botón seguía ofreciendo "promoverlo" otra vez).
  - Los botones "Desactivar/Activar" y "Agregar correo" se ocultan en filas de administrador — activarlos/desactivarlos vía este endpoint no estaba soportado del lado del servidor (`PUT` solo afecta `rol IN ('ciudadano','asistente')`) y hubiera fallado en silencio; no se pidió agregar esa capacidad, así que se dejó fuera del alcance de este cambio.
  - Se actualizó la nota explicativa que ve el superadmin en esa pestaña para mencionar también "Quitar administrador".

### 🔎 Verificado (contra la API real en local, no solo el código)
- `GET /api/usuarios?rol=todos` como admin normal: sí incluye filas con `rol=admin` (antes no aparecían).
- Ciclo completo con una cuenta de prueba: crear → promover a admin → confirmar que aparece como admin en la lista → revocar → confirmar que vuelve a `ciudadano` en la lista.
- Un admin normal (no superadmin) sí puede leer `rol=todos` con filas de admin, pero `revocar-admin` le da `403 Acceso denegado. Se requiere ser superadmin.` — confirmado con una segunda cuenta de prueba.
- Intentar `revocar-admin` contra la propia cuenta superadmin real (`id` de `admin@remac.elgrullo.mx`) da el error esperado en vez de ejecutarse.
- Cuentas de prueba usadas para esto quedaron desactivadas al terminar (no se pueden borrar, el API no tiene `DELETE` para cuentas — mismo diseño que el resto del sistema).
- `scripts/smoke_test.sh` completo: 24 verificaciones, 0 fallas.
- **No se pudo probar el panel visualmente en navegador** (mismo motivo que las 2 entradas anteriores) — se verificó la API real end-to-end con `curl`, pero el HTML/CSS de los botones nuevos en `admin.html` no se vio renderizado.

### 📂 Archivos modificados
- `web/api/usuarios.php`, `web/js/api-client.js`, `web/admin.html`.

## 📅 [2026-09-22b] — "Mi perfil" del Asistente ya no es un modal — ahora es una página como en admin/ciudadano

### 🤔 Contexto
El usuario comparó capturas: en `dashboard.html` (ciudadano) y `admin.html` (admin/superadmin), "Mi perfil" es una sección de página completa dentro del layout del panel; en `asistente.html` era una ventana modal encima del contenido. Pidió que se viera igual en los 3 roles.

### 🔧 Cambios
- **`web/asistente.html`**: se le agregó navegación real entre secciones (algo que antes no existía — todo el archivo era una sola vista fija de "Registrar mascota", con "Mi perfil" como modal encima):
  - El contenido de "Registrar mascota" ahora vive en `id="section-registrar"`; se agregó `id="section-mi-perfil"` con la **misma estructura exacta** que la sección de `admin.html` (tarjeta de avatar+nombre+rol, nombre/teléfono/correo, tarjeta aparte de "Cambiar contraseña" — sin domicilio/colonia, que tampoco tiene la de admin, por ser cuentas de personal municipal, no de ciudadanos).
  - Nueva función `showSection(name, linkEl)` (mismo patrón que `dashboard.html`) que alterna qué sección se muestra y actualiza el título del encabezado.
  - Se eliminó el modal `#modal-mi-perfil` (evitaba además un `id="avatar-upload"` duplicado en el HTML, que ya existía sin querer entre el modal viejo y la sección nueva).
  - `abrirMiPerfil()` se renombró a `applyCurrentUserToUI()` (mismo nombre que la función equivalente en `admin.html`) y ahora también actualiza el nombre/avatar de la barra lateral, no solo los campos del formulario — se llama una sola vez al cargar la página y de nuevo después de guardar cambios, en vez de cada vez que se "abría" el modal.
  - `saveProfile()` ya no cierra ningún modal (no aplica); solo vuelve a llamar `applyCurrentUserToUI()` para refrescar todo en un solo lugar.

### 🔎 Verificado
- `curl` contra el sitio local: `asistente.html` responde 200, ya trae `showSection`/`applyCurrentUserToUI`/`section-mi-perfil`, y cero referencias sueltas a `modal-mi-perfil`.
- Sin IDs duplicados (`avatar-upload`, `profileAvatar` aparecen una sola vez cada uno) y etiquetas `<script>` balanceadas.
- `scripts/smoke_test.sh` completo: 24 verificaciones, 0 fallas.
- **No se pudo probar visualmente en navegador** (mismo motivo que la entrada anterior: sin herramientas de automatización de navegador en este entorno) — pendiente que el usuario lo confirme en pantalla.

### 📂 Archivos modificados
- `web/asistente.html`.

## 📅 [2026-09-22] — Botón QR en Seguimiento (admin) + corrige HTTPS forzado en local

### 🤔 Contexto
El usuario comparó capturas del panel ciudadano (que sí tiene botón "QR" en cada mascota) contra la sección "Seguimiento" del panel admin/superadmin (que solo tenía "Cambiar estatus", "Editar" y "Ver acta") — pidió agregar ahí también el QR.

### 🔧 Cambios
- **`web/admin.html`**: se agregó el botón **"🔲 QR"** a las tarjetas de "Seguimiento", entre "Editar" y "Ver acta". Nueva función `verQRAdmin(id)` — mismo patrón exacto que `verQR()` de `dashboard.html` (que ya se había corregido el 2026-09-08), adaptada para buscar la mascota en `allPets` en vez de `myPets`. Se agregó también `printQR()` (idéntica a la de `dashboard.html`) y la librería `qrcodejs` (CDN, con `defer`, igual que `jsPDF`).
- **`web/.htaccess`**: al probar el cambio anterior en local se detectó que el redirect a HTTPS + HSTS activado ayer (ver entrada `2026-09-21b`) también aplicaba en `localhost` — redirigía a `https://localhost` (certificado autofirmado de XAMPP, advertencia en el navegador) y guardaba HSTS ahí. Se corrigió para que el redirect y el header HSTS **solo apliquen fuera de local** (`RewriteCond %{HTTP_HOST} !^(localhost|127\.0\.0\.1|192\.168\.)` + `SetEnvIf Host ... es_local` / `env=!es_local`), mismo criterio `$esLocal` que ya usa `database.php`. Producción no se ve afectada por esta corrección — su `HTTP_HOST` nunca es `localhost`.

### 🔎 Verificado
- Local (XAMPP): antes del arreglo, `curl http://localhost/remac/admin.html` daba `301` a `https://`; después, `200` directo y sin cabecera `Strict-Transport-Security`. El HTML servido ya trae `verQRAdmin` (confirmado con `curl` + `grep`).
- `scripts/smoke_test.sh` completo tras ambos cambios: 24 verificaciones, 0 fallas.
- **No se pudo probar visualmente en navegador** (este entorno no tiene herramientas de automatización de navegador disponibles) — el usuario lo verificó él mismo en su XAMPP local.

### 📂 Archivos modificados
- `web/admin.html`, `web/.htaccess`.

## 📅 [2026-09-21f] — La portada (`index.html`) ya no se ve "vacía" 2-3 segundos antes de cargar

### 🤔 Contexto
El usuario reportó (con capturas de `mascota-elgrullo.com`) que al entrar a la portada primero se ve todo en 0 y sin la foto del hero, y 2-3 segundos después aparecen los números y la imagen reales. Causa real: `initIndex()` pedía **5 cosas al servidor una tras otra** (`primeConfigFromServer()` → `aplicarTemaVisual()` —que de hecho volvía a pedir la config completa por segunda vez, redundante— → campañas → artículos → estadísticas), esperando cada respuesta antes de empezar la siguiente. Con ~5 vueltas al servidor en fila, ahí estaban los 2-3 segundos.

### 🔧 Cambios
- **`web/index.html`**: se reescribió `initIndex()`. Ahora, en cuanto carga la página: (1) se aplica de inmediato, sin esperar nada, lo que ya haya quedado guardado en el navegador de una visita anterior (`localStorage`) — así un visitante que ya había entrado antes ve la portada completa al instante, sin parpadeo; (2) todo lo que sí necesita el servidor (config del sitio, campañas, artículos, estadísticas) se pide **en paralelo** (`Promise.all`) en vez de uno por uno; (3) al terminar, se vuelve a aplicar la config por si el admin cambió algo desde la última visita guardada. Se eliminó `primeConfigFromServer()` (quedó duplicada dentro de la nueva `initIndex()`).
- **`web/js/tema.js`**: `aplicarTemaVisual()` ahora acepta opcionalmente la configuración ya traída por la página que la llama, para no volver a pedir `/api/settings` una segunda vez en la misma carga (index.html se lo pasa; el resto de páginas la siguen llamando igual que antes, sin cambios para ellas).

### 🚫 Lo que NO se tocó
- El resto de páginas (`login.html`, `dashboard.html`, `admin.html`, `asistente.html`) no se revisaron — el usuario solo reportó esto en la portada pública. Si notan el mismo parpadeo en otra página, se puede aplicar el mismo patrón ahí.

### 📂 Archivos modificados
- `web/index.html`, `web/js/tema.js`.

## 📅 [2026-09-21e] — Reporte de Residencias completado hasta la semana 5 sobre la plantilla del asesor (formato I–XIV)

### 🤔 Contexto
El usuario preguntó si ya estaba completo el Word de la plantilla del asesor interno (formato de 14 secciones); no lo estaba, solo tenía portada, índice y títulos vacíos. Se completó sobre esa misma plantilla, con el alcance que pidió el profesor: contenido hasta la semana 5 (la semana 1 empezó el 24 de agosto de 2026), lo realizado en pasado y el sistema y lo que sigue en curso en presente.

### 🔧 Cambios
- **`Word/Formato_de_Reporte_..._(MG).docx`** (fuera de git: `Word/` está en `.gitignore` por datos personales). Quedó de 40 páginas: portada completa, Resumen, Agradecimientos (opcional, con marcador), Índice automático con las 14 secciones y las secciones I a XIV redactadas con base en el anteproyecto, el marco teórico, este historial, el código y el esquema reales.
- Incluye 8 figuras: mapa de ubicación y organigrama tomados del anteproyecto, diagramas de casos de uso y entidad-relación dibujados a partir del sistema real, las maquetas aprobadas de la portada y del panel, y capturas del sitio publicado (portada e inicio de sesión). Incluye 11 tablas: resumen por semana, servicios de la API y permisos por rol, maquetas frente a plataforma, cronograma frente a avance, diccionario de datos (7 tablas de la base) y el cronograma y las horas del anteproyecto.
- Lo que solo el alumno puede aportar quedó marcado en amarillo (`[COMPLETAR]`, `[VERIFICAR]`, `[CONFIRMAR]`): agradecimientos, reseña histórica y valores del Ayuntamiento, fachada, organigrama resaltado, reuniones con el asesor externo, capturas con sesión iniciada, actividades sociales, asignaturas, y el nombre y año exactos de la ley general y del reglamento municipal citados en el marco teórico, que no se pudieron confirmar.
- Se conservaron los comentarios de instrucciones de la plantilla y el índice se limitó a las 14 secciones. Copia de seguridad de la plantilla en blanco: `Word/Respaldos/MG_original_en_blanco.docx`.
- Se corrigió además la **bitácora** (`Word/Bitacora_Residencias_Semanas_1-5.docx`): su semana 5 aún decía que el sitio publicado era del 8 de septiembre, y eso ya no era cierto.
- Se generó con Word (automatización COM) a partir de un JSON de contenido; los scripts quedaron en la carpeta temporal de la sesión, no en el repositorio.

### 🔎 Verificado
- Producción: a las 13:00 (hora local) se volvió a subir el sitio. Ahora `http://` redirige a `https://` (301), responde con HSTS y las cabeceras de seguridad, y trae los cambios del 15 al 18 de septiembre. Esto reemplaza la nota de «sitio desactualizado» de las entradas anteriores de hoy.
- Revisión automática del texto (sin marcadores sueltos, figuras 1 a 8 y tablas 1 a 11 en orden) y revisión visual de las 40 páginas.

### 📂 Archivos
- `Word/Formato_de_Reporte_..._(MG).docx`, `Word/Bitacora_Residencias_Semanas_1-5.docx` y `Word/Respaldos/MG_original_en_blanco.docx` (ninguno se versiona; se documentan aquí porque la Regla de Oro pide registrar cualquier modificación, igual que la entrada del 2026-09-14).

## 📅 [2026-09-21d] — Bitácora de residencia (semanas 1 a 5) armada a partir de git y de este historial

### 🤔 Contexto
El profesor pidió que el Reporte de Residencias cubra hasta la semana 5 del cronograma, redactando en pasado lo realizado y en presente lo que sigue en curso, y el usuario pidió además una bitácora semanal. Se confirmó con el usuario que la **semana 1 empezó el lunes 24 de agosto de 2026**; por eso hoy (21 de septiembre) es el primer día de la semana 5. El trabajo anterior a esa fecha (38 commits desde el 12 de junio) se resume en una nota de "Antecedentes" en vez de repartirlo dentro de las semanas.

### 🔧 Cambios
- **`Word/Bitacora_Residencias_Semanas_1-5.docx`** (nuevo, 5 páginas, **fuera de git**: `Word/` está en `.gitignore` por contener datos personales). Trae: datos generales, descripción del proyecto (presente), antecedentes, resumen del avance por semana (commits: 6, 14, 10, 4 y 1), registro semanal con evidencia (hashes de commit y entradas de este historial) y bloque de firmas. La semana 5 sigue en curso y se redacta en presente. Formato de la escuela: Arial, hoja carta y el banner SEP/TecNM tomado de la plantilla del asesor.
- Cada actividad se tomó de un commit o de una entrada de este historial; **las horas de cada semana quedaron como `[COMPLETAR]`** (resaltado en amarillo) porque no existe ese dato en el repositorio y no se inventa.
- Se generó con Word (automatización COM) a partir de un JSON de contenido. Los scripts quedaron en la carpeta temporal de la sesión, no en el repositorio.

### 🔎 Verificado en vivo ese mismo día
- Hacia las 12:38, `https://mascota-elgrullo.com` respondía 200 con certificado HTTPS válido y `http://` también respondía 200, sin redirect. Minutos después se activó el redirect a HTTPS y HSTS en el repositorio (entrada 2026-09-21b), que llegará a producción hasta el próximo despliegue.
- El `index.html` publicado tenía fecha de modificación del 8 de septiembre, lo que confirma la nota de la entrada «Dominio real confirmado» de hoy: faltan por subir a producción los cambios posteriores (entre ellos la corrección del XSS de artículos).

### 📂 Archivos creados
- `Word/Bitacora_Residencias_Semanas_1-5.docx` (no versionado — documentado aquí porque la Regla de Oro pide registrar cualquier modificación, igual que la entrada del 2026-09-14).

## 📅 [2026-09-21c] — Despliegue automático vía Git (cPanel)

### 🤔 Contexto
El usuario preguntó si HostGator tenía alguna forma de traer los archivos directo del repositorio de GitHub en vez de subir un `.zip` a mano cada vez — sí existe ("Git™ Version Control" en cPanel), pero como este repo tiene `web/` como subcarpeta (junto con `scripts/`, `PDF/`, etc.) y el sitio debe vivir en la raíz de `public_html`, clonar el repo tal cual habría roto todas las rutas.

### 🔧 Cambios
- **`.cpanel.yml`** (nuevo, raíz del repo): define una tarea de despliegue que cPanel reconoce automáticamente — copia solo el *contenido* de `web/` (con el `.` al final, para incluir los `.htaccess`) hacia `public_html`, nunca el repo completo. `api/config/database.php` no está en el repo (gitignored) así que el `cp` nunca lo toca — sobrevive a cada deploy.

### 📋 Cómo conectarlo en HostGator (pendiente, lo hace el usuario una sola vez)
1. cPanel → **Git™ Version Control** → **Create**.
2. Clone URL: `https://github.com/gr210111206/Plataforma-Web-para-Censo-y-Registro-de-Mascotas.git`
3. Repository Path: algo FUERA de `public_html`, ej. `/home2/ferna814/repositorio` (nunca la carpeta del sitio directamente).
4. Una vez creado, abrir el repo → pestaña **"Pull or Deploy"** → botón **"Deploy HEAD Commit"** — eso ejecuta el `.cpanel.yml` y copia `web/` a `public_html`.
5. **Primera vez nada más**: crear a mano `public_html/api/config/database.php` con las credenciales reales (el deploy nunca lo va a crear ni a borrar).
6. De ahí en adelante: cada vez que haya cambios nuevos, en el repo dar "Update" (trae los commits nuevos) y luego "Deploy HEAD Commit" — ya no hace falta zip/subir/extraer a mano.

### 📂 Archivos modificados
- `.cpanel.yml` (nuevo).

## 📅 [2026-09-21b] — Activa HTTPS/HSTS (SSL confirmado activo)

### 🤔 Contexto
El usuario mandó una captura de cPanel mostrando "Certificado SSL: Active" para `mascota-elgrullo.com`. Se verificó también en vivo con `curl -I https://mascota-elgrullo.com` (200 OK, certificado válido, sin advertencias) antes de activar nada — mismo criterio que ya estaba documentado como condición para hacerlo.

### 🔧 Cambios
- **`web/.htaccess`**: se descomentó el bloque de redirección forzada a HTTPS (`RewriteCond %{HTTPS} off` → redirige a `https://`) y el header `Strict-Transport-Security` (HSTS, 1 año, incluye subdominios).

### ⚠️ Todavía no está en vivo
Este cambio vive en el repositorio local — como el deploy es manual (ver entrada anterior de hoy), **no tiene efecto hasta que se vuelva a subir `web/` completo a `public_html`**, junto con la corrección del XSS del 2026-09-18 y el resto de cambios pendientes de subir.

### 📂 Archivos modificados
- `web/.htaccess`.

## 📅 [2026-09-21] — Dominio real confirmado: `mascota-elgrullo.com`

### 🤔 Contexto
El usuario confirmó (captura de la portada cargando con datos reales) que ya compró y conectó el dominio **`mascota-elgrullo.com`** (con guion, dominio propio en HostGator — no es subdominio de `elgrullo.com` ni de `elgrullo.mx`, los dos dominios que se habían intentado antes y no funcionaron). `CLAUDE.md` y `web/api/config/database.php` (local, gitignored) seguían apuntando al dominio viejo que nunca llegó a funcionar (`mascota.elgrullo.com`, sin guion — resultó ser un dominio ajeno parqueado en venta).

### 🔧 Cambios
- **`CLAUDE.md`**: nota de "dominio pendiente de confirmar/comprar" actualizada a "dominio real: `mascota-elgrullo.com`, comprado y funcionando".
- **`web/api/config/database.php`** (local, no se sube a git): `BASE_URL` y `PRODUCTION_ORIGINS` corregidos de `mascota.elgrullo.com` → `mascota-elgrullo.com`. **Este cambio local no se refleja solo en producción** — hay que editar el archivo directo en cPanel (ver instrucciones que se le dieron al usuario en el chat).

### ⚠️ Importante — el sitio en producción está desactualizado
El deploy de este proyecto es 100% manual (sin CI/CD): el usuario reportó que el sitio ya carga en `mascota-elgrullo.com`, pero los archivos ahí siguen siendo de una subida anterior a esta conversación — le faltan como mínimo los últimos 3 commits (íconos de ojo en login/cambiar-contraseña, y sobre todo la **corrección del XSS de artículos del 2026-09-18**, `44cb82e`). Pendiente que el usuario vuelva a subir `web/` completo a `public_html` (sin pisar el `database.php` real del servidor con el de este repo) y actualice ahí mismo `BASE_URL`/`PRODUCTION_ORIGINS` con los valores de arriba.

### 📂 Archivos modificados
- `CLAUDE.md`.
- `web/api/config/database.php` (local, gitignored — no viaja en este commit).

## 📅 [2026-09-18] — Corrige XSS almacenado en artículos + refuerzo de cabeceras de seguridad

### 🤔 Contexto
Se pidió una auditoría de seguridad completa del proyecto (documentada aparte, sin subirse al repositorio) y luego se pidió corregir el hallazgo más grave que salió de ahí: el editor de artículos del panel admin (`admin.html`, `wysiwygEditor`) guardaba su HTML tal cual, sin sanitizar, y ese HTML se volvía a insertar sin escapar en 3 páginas distintas — incluida la portada pública, sin sesión. Un admin (no hacía falta ser superadmin) podía publicar un artículo con `<img onerror="...">` o `<script>` y ese código se ejecutaba en el navegador de cualquier visitante de la portada, cualquier ciudadano en su dashboard, y cualquier otro admin (incluido el superadmin) al abrir ese artículo para editarlo — encadenable a robo de sesión, porque el token vive en `localStorage`.

### 🔧 Cambios

**1. XSS almacenado en artículos — corregido de raíz:**
- **`web/api/config/helpers.php`**: nueva función `sanitizeArticleHtml()` — sanitizador de HTML con lista blanca real (etiquetas, atributos y esquemas de URL permitidos), escrito con `DOMDocument` (ya viene con PHP, sin librerías externas, coherente con "sin build step"). Permite exactamente lo que el editor WYSIWYG puede producir (negritas, cursivas, subrayado, tachado, títulos, listas, cita, imágenes en Base64, `style` con solo un puñado de propiedades seguras) y elimina por completo `<script>`, `<iframe>`, `<object>`, `<form>`, cualquier atributo `on*` (`onerror`, `onclick`...), `href`/`src` con esquema `javascript:`, y `style` con `expression()`/`url()`.
- **`web/api/contenido.php`**: tanto `POST` como `PUT` de `?resource=articulos` ahora pasan `contenido` por `sanitizeArticleHtml()` antes de guardarlo — antes era la única columna del proyecto excluida a propósito de `clean()`.
- Probado en dos niveles: (1) función aislada contra 7 casos (HTML legítimo, `<script>`, `onerror`, `href="javascript:"`, `style` con `expression()`, `<iframe>`, `onclick`) — el legítimo se conserva intacto, los 6 maliciosos quedan neutralizados; (2) extremo a extremo contra la API real corriendo en local (crear artículo con el mismo payload malicioso vía `curl`, confirmar en la respuesta que el HTML guardado ya viene limpio, borrar el artículo de prueba). Además se corrió `scripts/smoke_test.sh` completo (24 verificaciones, 0 fallas) para confirmar que no se rompió nada más en el resto de la API.

**2. Cabeceras de seguridad reforzadas (arreglo rápido y seguro, sin riesgo de romper nada):**
- **`web/.htaccess`**: antes las páginas HTML (`index.html`, `login.html`, etc.) no tenían NINGUNA cabecera de seguridad — solo las respuestas JSON de la API las tenían. Se agregaron `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy`, `Permissions-Policy`, y `Content-Security-Policy-Report-Only` (en modo solo-reporte a propósito: el sitio usa bastantes `onclick=""` inline, así que un CSP que los bloqueara de verdad rompería la página — en modo Report-Only el navegador no bloquea nada, solo avisa en la consola qué violaría la política, útil para revisar antes de activarlo en serio más adelante).
- **`web/api/.htaccess`**: se agregaron `Referrer-Policy` y `Permissions-Policy` junto a las cabeceras que ya existían.
- 6 enlaces `target="_blank"` (ficha pública de mascota en `dashboard.html`, Giphy en `admin.html`, redes sociales y sitio del Ayuntamiento en `index.html`) ahora llevan `rel="noopener noreferrer"` — cierra el "reverse tabnabbing".

### 🚫 Lo que NO se tocó en esta entrada (a propósito, requieren una decisión o un paso manual)
- **HTTPS/HSTS** (`web/.htaccess`): sigue comentado — activar esto antes de confirmar el certificado SSL del dominio real deja el sitio inaccesible; ya estaba correctamente documentado como pendiente hasta ese momento.
- **Límite de intentos por IP** (solo existe por cuenta hoy): requiere una tabla nueva en la base de datos de producción — pendiente de decidir/ejecutar con el usuario.
- **Teléfono visible en la ficha pública del QR**: es una decisión de producto (una mascota perdida necesita que quien la encuentre pueda llamar), no un bug — queda a confirmar con el Ayuntamiento.
- `ANALISIS_SEGURIDAD.md` (el reporte completo de la auditoría) — **no se sube al repositorio**, agregado a `.gitignore` a petición explícita del usuario.

### 📂 Archivos modificados
- `web/api/config/helpers.php` (nueva función `sanitizeArticleHtml()`).
- `web/api/contenido.php` (usa el sanitizador en `POST`/`PUT` de artículos).
- `web/.htaccess`, `web/api/.htaccess` (cabeceras de seguridad).
- `web/dashboard.html`, `web/admin.html`, `web/index.html` (`rel="noopener noreferrer"`).
- `.gitignore` (agrega `ANALISIS_SEGURIDAD.md`).

## 📅 [2026-09-17] — Ícono de ojo también en "Cambiar contraseña" (dashboard, admin, asistente)

### 🤔 Contexto
El usuario mandó una captura del bloque "Cambiar contraseña" del panel ciudadano y preguntó si convenía agregar ahí también el ícono de ojo — sí, sobre todo en "Confirmar nueva contraseña", que es justo donde más se necesita verificar que coincide sin verla dos veces por separado.

### 🔧 Cambios
- **`web/css/styles.css`**: la regla `padding-right` de `.has-toggle` ya no depende de estar dentro de `.input-group` (ese formulario no usa el ícono izquierdo de `.input-group`/`.input-icon`); se agregó una clase nueva y minúscula `.pw-wrap { position: relative; }` para envolver cada input de contraseña suelto y poder posicionar el botón del ojo encima, sin heredar el `padding-left:40px` que sí necesitan los campos de `login.html` (esos si tienen ícono a la izquierda).
- **`web/dashboard.html`, `web/admin.html`, `web/asistente.html`**: se agregó el mismo botón `.input-toggle` (ícono de ojo) a los 3 campos del bloque "Cambiar contraseña" (Contraseña actual, Nueva contraseña, Confirmar nueva contraseña) en las 3 páginas, siguiendo el mismo patrón que ya se usó en `login.html` el 2026-09-15. La función `togglePassword()` y los íconos SVG se duplicaron en el `<script>` propio de cada página — mismo patrón que ya seguía el proyecto para `openModal()`/`closeModal()` (helpers pequeños de UI viven en cada página, no en un archivo JS compartido).
- Se subió otra vez la versión del CSS (`?v=20260915` → `?v=20260917`) en las 5 páginas que lo cargan.

### 🚫 Lo que NO se tocó
- Los campos de contraseña de "Crear cuenta de asistente"/"Crear cuenta de administrador" en `admin.html` (`nu-password`, `ac-password`, etc.) — no se pidieron esta vez; se puede replicar el mismo patrón ahí si se solicita después.

### 📂 Archivos modificados
- `web/css/styles.css`, `web/dashboard.html`, `web/admin.html`, `web/asistente.html`, `web/{index,login}.html` (solo el `?v=` del CSS).

## 📅 [2026-09-15] — Botón de "mostrar contraseña" (ícono de ojo) en login.html

### 🤔 Contexto
El usuario pidió agregar el típico ícono de ojo para mostrar/ocultar la contraseña en el formulario de inicio de sesión y en el de creación de cuenta.

### 🔧 Cambios
- **`web/css/styles.css`**: se aprovechó la clase `.input-toggle` que ya existía en el CSS pero no se usaba en ningún lado — se le agregó `background:none; border:none; padding:0; line-height:0;` (para poder usarla sobre un `<button>` real, no solo un `<span>`) y una regla nueva `.input-group .form-control.has-toggle { padding-right: 40px; }` para que el texto de la contraseña no quede debajo del ícono.
- **`web/login.html`**: se agregó un `<button type="button" class="input-toggle">` (ícono de ojo) dentro de los 3 campos de contraseña del formulario (inicio de sesión, contraseña de registro y confirmar contraseña). Un clic cambia el `type` del input entre `password`/`text` y cambia el ícono entre ojo abierto y ojo tachado (función `togglePassword()`), incluyendo el `aria-label` ("Mostrar contraseña" / "Ocultar contraseña") para accesibilidad.
- Se subió la versión del CSS (`?v=20260908` → `?v=20260915`) en las 5 páginas que lo cargan, para evitar el mismo bug de caché ya documentado el 2026-09-08 (el navegador sirviendo una copia vieja de `styles.css`).

### 🚫 Lo que NO se tocó
- Los campos de contraseña de `dashboard.html`, `admin.html` y `asistente.html` (cambiar contraseña, crear cuentas de asistente/admin) — el usuario solo pidió login e inicio de sesión/creación de cuenta; se puede replicar el mismo patrón (`has-toggle` + botón `.input-toggle` + `togglePassword()`) ahí si se pide después.

### 📂 Archivos modificados
- `web/css/styles.css`, `web/login.html`, `web/{index,dashboard,admin,asistente}.html` (solo el `?v=` del CSS).

## 📅 [2026-09-14] — Se ignora la carpeta `Word/` y se redacta un primer borrador del Reporte de Residencias

### 🤔 Contexto
El usuario agregó a la carpeta del proyecto (`Word/`) sus 2 documentos Word del Reporte de Residencias Profesionales, y pidió ayuda para completarlos respetando el formato oficial — dejando muy claro que esa carpeta **no debe subirse al repositorio** porque contiene sus datos personales.

### 🔧 Cambios
- **`.gitignore`**: se agregó la línea `Word/` para que esa carpeta (y cualquier archivo dentro de ella) nunca se rastree ni se suba al repositorio remoto. Se confirmó con `git status`/`git ls-files` que la carpeta no estaba rastreada antes de este cambio.
- Se revisaron los 2 documentos de `Word/`: el que corresponde de verdad a la carrera del alumno (Ingeniería Informática, formato TSJ) es solo una portada + índice en blanco, sin contenido de capítulos; el otro trae la portada de otra carrera (Ingeniería en Gestión Empresarial) y es en realidad una guía de qué escribir en cada sección, no una plantilla para llenar — se usó únicamente como referencia.
- **`Word/Formato de Reporte de Residencias Profesionales Ingeniería Informática TSJ.docx`** (fuera de git, no versionado): se completó vía automatización de Word (COM), preservando el formato original del documento:
  - Portada: título real del proyecto, nombre del alumno (Luis Fernando Vargas Ramírez), número de control (210111206) y fecha.
  - Se agregó, a partir de la página del índice, el contenido completo de los 6 capítulos (Introducción, Descripción de la empresa, Problemas a resolver, Objetivos, Justificación, Marco Teórico, Metodología, Desarrollo, Resultados, Conclusiones, Recomendaciones, Competencias y Anexos), redactado con base en el sistema real ya construido.
  - Se dejaron marcados explícitamente con `[COMPLETAR: ...]` los campos que solo el alumno puede llenar de forma verídica: nombre de asesor interno y externo, actividades sociales realizadas, experiencia personal, fuentes de información realmente consultadas, y las capturas de pantalla/diagramas para los Anexos.

### 🚫 Lo que NO se hizo
- No se inventó contenido en secciones que son testimonio personal del alumno (experiencia personal, actividades sociales, asesores, bibliografía) — se dejaron marcadas para que el propio alumno las complete, en vez de rellenarlas con información falsa en un documento oficial.
- No se tocó el segundo documento Word (el de Gestión Empresarial) más allá de leerlo como referencia, por decisión explícita del usuario.

### 📂 Archivos modificados
- `.gitignore` (agrega `Word/`).
- `Word/Formato de Reporte de Residencias Profesionales Ingeniería Informática TSJ.docx` (no versionado — cambio documentado aquí porque la Regla de Oro del proyecto pide registrar cualquier modificación, aunque el archivo en sí no viaje al repositorio).

## 📅 [2026-09-10] — Se quita "REMAC" de todo el proyecto

### 🤔 Contexto
El título oficial del proyecto es **"Desarrollo de Plataforma Web para Censo y Registro de Mascotas en el Municipio de El Grullo, Jalisco"** — "REMAC" nunca fue ese nombre oficial, era solo un apodo interno que se fue colando en comentarios de código, títulos de página, el acta PDF, y hasta en el propio Marco Teórico. El usuario pidió quitarlo de todo el proyecto, sin reemplazarlo por ninguna otra marca/sigla — solo descripciones directas ("Padrón Municipal de Mascotas", "el sistema", etc. según el contexto).

### 🔧 Cambios
- **Código muerto eliminado** (en vez de solo renombrarlo): `web/js/mock-data.js` (nunca lo cargaba ninguna página — confirmado antes de borrar) y el bloque `USE_MOCK`/"modo mock" en `api-client.js` que dependía de él; la clase CSS `.remac-badge` (sin ningún uso en HTML/JS).
- **Identificadores internos renombrados** (seguros de cambiar, sin depender de nada externo): `generarFolioREMAC()` → `generarFolioMunicipal()` (`helpers.php`, `mascotas.php`); la llave de `localStorage` `remac_asistente_estado_*` → `asistente_estado_*` (`asistente.html`).
- **Texto visible para cualquier persona**: títulos de las 6 páginas, el acta PDF oficial (título y pie de página — se genera igual en `dashboard.html`, `admin.html` y `asistente.html`, las 3 copias se corrigieron), el aviso de privacidad, las preguntas frecuentes, la página pública de cada mascota (`mascota.html`).
- **Comentarios de código**: encabezado de los 9 archivos PHP de `web/api/`, los 3 archivos de `web/js/`, `schema.sql`, `seed.sql`, los 2 `.htaccess`, `scripts/backup_db.php` y `scripts/smoke_test.sh`, `styles.css`.
- **Documentación**: `CLAUDE.md` (reescrito — de paso se corrigió que mencionaba `mock-data.js`/`main.js`/`db.php`, archivos que ya no existen con esos nombres, y el formato de folio viejo), `.agents/AGENTS.md`, `MANEJO_DE_IMAGENES.md`, `CUENTAS_PRUEBA.md` (de paso se actualizaron las credenciales reales de HostGator, que ya habían cambiado hoy mismo).
- **El Marco Teórico de verdad** (`Marco_Teorico_REMAC.rtf` → `Marco_Teorico.rtf`): 14 menciones de "REMAC" en el cuerpo del texto académico, corregidas una por una preservando el formato RTF; de paso se actualizó el folio de ejemplo (`REMAC-GRU-2026-001` → `M-GRU-000000001`) y la lista de módulos JS (mencionaba `mock-data.js`/`main.js`, ya no existen).
- **Cuenta admin semilla**: el nombre visible de la cuenta admin de prueba era literalmente "Administrador REMAC" (aparecía tal cual en la bitácora de auditoría) — cambiado a "Administrador Municipal" en `seed.sql` y en la base de datos local ya sembrada.
- **`HISTORIAL_CAMBIOS.md`**: se cambió el título/introducción del documento, pero **a propósito NO se reescribió el cuerpo de entradas ya fechadas** — son un registro histórico de lo que era cierto en su momento, no documentación viva.

### 🚫 Lo que NO se tocó (a propósito)
- El correo `admin@remac.elgrullo.mx` — es una credencial real de acceso (login de la cuenta admin), no una marca; cambiarlo requeriría también cambiar la cuenta real en HostGator/local.
- Nombres de base de datos/usuario/carpeta local (`remac_db`, `remac_local`, `C:\xampp\htdocs\remac`) — son configuración de infraestructura real (local y de ejemplo), no branding visible; renombrarlos exige también renombrar la carpeta XAMPP y la base de datos física, fuera del alcance de este cambio.

### ✅ Verificado
Barrido completo confirmado con `grep` recursivo case-insensitive sobre todo el proyecto — cero coincidencias de "REMAC" fuera de `HISTORIAL_CAMBIOS.md` (histórico, a propósito) y las excepciones documentadas arriba. `php -l` limpio en los 10 archivos PHP tocados. Las 6 páginas cargan (200). `scripts/smoke_test.sh` completo (24 verificaciones, 0 fallas) — confirma que `generarFolioMunicipal()` sigue generando folios válidos tras el renombre.

### 📂 Archivos modificados
- Eliminados: `web/js/mock-data.js`.
- Renombrado: `Marco_Teorico_REMAC.rtf` → `Marco_Teorico.rtf`.
- Backend: `web/api/{auth,bitacora,mascotas,usuarios,settings,stats,contenido}.php`, `web/api/config/{helpers,database,database.example}.php`.
- Frontend: `web/{index,login,dashboard,admin,asistente,mascota}.html`, `web/js/{api-client,el-grullo-data,tema}.js`, `web/css/styles.css`, `web/.htaccess`, `web/api/.htaccess`.
- Base de datos: `web/database/{schema,seed}.sql` + base de datos local ya sembrada.
- Scripts: `scripts/{backup_db.php,smoke_test.sh}`.
- Documentación: `CLAUDE.md`, `.agents/AGENTS.md`, `MANEJO_DE_IMAGENES.md`, `CUENTAS_PRUEBA.md`, `HISTORIAL_CAMBIOS.md`, `Marco_Teorico.rtf`.

## 📅 [2026-09-08] — 3 bugs reportados por el usuario en "Mis mascotas" (dashboard ciudadano)

### 🐛 1. El "Saltar al contenido principal" se veía como texto suelto, siempre visible
El CSS nuevo (`.skip-link`, agregado hoy mismo en el pase de accesibilidad) nunca llegó al navegador del usuario: las 5 páginas cargan `css/styles.css?v=20260829b` con un número de versión que **no se actualizó** al tocar el archivo, así que el navegador siguió sirviendo la copia ya cacheada de antes de hoy. Corregido subiendo la versión a `?v=20260908` en las 5 páginas — fuerza a todos los navegadores a bajar el CSS actualizado.

### 🐛 2. El botón "QR" no abría nada
Dos bugs reales en `verQR()` (dashboard.html), no relacionados con lo de hoy:
- El modal se construía y se llenaba con el código QR, pero **nunca se le agregaba la clase `open`** que usa todo el resto del sitio para mostrar un modal — quedaba armado en el HTML pero invisible.
- La sección de información bajo el QR usaba una variable `folio` que **nunca se declaró** en esa función — al ejecutarse tronaba con `ReferenceError` a medio camino, así que ni siquiera alcanzaba a llegar al final (donde sí estaba, más abajo, el intento de abrir el modal).
Aprovechando que ya estaba adentro corrigiendo esto: el código QR codificaba un link **relativo** (`mascota.html?token=...`) en vez de una URL completa — un celular ajeno escaneándolo probablemente no habría podido abrirlo. Ahora codifica la URL absoluta, y se agregó manejo de error por si la librería del QR (CDN externo) llega a fallar.

### 🐛 3. En el modal de detalle de una mascota, el ícono se veía como texto SVG crudo
`document.getElementById('detalle-titulo').textContent = ...` — cuando el valor es código SVG (el ícono de la especie), `textContent` lo mete como texto literal en vez de dibujarlo. Era `.innerHTML` lo que hacía falta. Bug ya existente, no introducido hoy.

### 📌 Nota para la próxima vez que se edite `web/css/styles.css`
Hay que subir el número de versión en el `<link rel="stylesheet" href="css/styles.css?v=...">` de las 5 páginas (`index`, `login`, `dashboard`, `admin`, `asistente`) — si no, los navegadores que ya visitaron el sitio antes no ven el cambio.

### ✅ Verificado
`dashboard.html` y `css/styles.css?v=20260908` cargan (200); confirmado por curl que la regla `.skip-link` ya viene en el CSS que se sirve con la nueva versión.

### 📂 Archivos modificados
- `web/index.html`, `web/login.html`, `web/dashboard.html`, `web/admin.html`, `web/asistente.html` (versión de `styles.css`).
- `web/dashboard.html` (`verQR()`, `verDetalle()`).

## 📅 [2026-09-08] — Fase 3 (parte 0): smoke test de la API

`scripts/smoke_test.sh` (nuevo) — script de verificación rápida contra un servidor real: login por rol, endpoints públicos sin sesión, permisos correctos por rol (quién puede/no puede cada acción), y un ciclo CRUD completo de mascota (crear, consultar por token público, confirmar que el folio solo no alcanza, editar, dar de baja). No corre solo ni es parte del despliegue — es para correrlo a mano después de tocar el backend, antes de subir a producción, y agarrar regresiones como las que ya pasaron esta sesión (ver las dos correcciones de bugs de esta misma fecha más abajo). 24 verificaciones, las 24 pasan contra el estado actual.

### 📂 Archivos modificados
- `scripts/smoke_test.sh` (nuevo).

## 📅 [2026-09-08] — Fase 3 (parte 2): pase de accesibilidad en las 6 páginas

### 🤔 Contexto
Última parte de la Fase 3 de la hoja de ruta. Se investigó primero con un barrido completo de las 6 páginas (index, login, dashboard, admin, asistente, mascota) antes de tocar nada, para arreglar lo de más impacto real en vez de un cambio superficial.

### 🐛 El hallazgo más importante: el menú lateral no se podía usar solo con teclado
Los enlaces del menú (`<a class="sidebar-link" onclick="...">`) en `admin.html`, `dashboard.html` y `asistente.html` **no tenían `href`** — y un navegador solo agrega un `<a>` al orden de tabulación (Tab) y lo activa con Enter/Espacio cuando SÍ tiene `href`. En la práctica, alguien navegando sin mouse no podía llegar a ninguna sección del panel más allá de la primera. 15 enlaces en total (8 en admin, 4 en dashboard, 3 en asistente) — se corrigieron con `role="button" tabindex="0"` + un manejador de teclado centralizado (Enter/Espacio) en cada archivo. El mismo problema existía en el botón "hamburguesa" de `index.html` (ni siquiera era un botón, un `<div>` sin ningún rol).

### 🔧 Resto de correcciones
- **Botones de solo ícono sin nombre accesible** (17 en total): los 10 botones "✕" de cerrar modal en las 6 páginas, y 6 botones 🗑️/✏️/👁️ en admin.html que solo tenían emoji (o emoji + `title`, que no basta) — todos con `aria-label` ahora.
- **Saltar al contenido**: enlace nuevo (oculto hasta que se enfoca con Tab) en las 5 páginas con menú/navegación repetitivo, más una región `role="main"` para que apunte a algo real.
- **Imágenes sin `alt`**: ~27 en total (fotos de mascota/perfil, vistas previas de banners/íconos, código QR) — todas dinámicas, insertadas por JavaScript al momento de renderizar.
- **Buscadores sin nombre accesible**: 8 cajas de búsqueda/filtro en admin.html y asistente.html (antes solo tenían `placeholder`, que no es lo mismo que una etiqueta) — `aria-label` agregado.
- **Etiquetas de formulario sin `for`**: la sección "Mi perfil" (nombre, teléfono, correo, domicilio, colonia, contraseña) en las 3 páginas con panel — corregido en las 3.

### 📌 Deliberadamente fuera de esta pasada
El editor de "Contenidos de portada / Apariencia" en `admin.html` tiene ~40 etiquetas más sin `for` — es la pantalla de menor uso (solo el admin, y no seguido) y de mayor volumen mecánico de todo el hallazgo; se decidió no gastar el resto de esta pasada ahí. Tampoco se hizo una auditoría de contraste de color (necesita revisión visual, no solo de código). Ambos quedan identificados para una pasada futura si se pide.

### ✅ Verificado
Las 6 páginas cargan (200) después de cada tanda de cambios. Revisión manual del HTML/JS resultante en cada archivo (sin navegador disponible en este entorno para probar Tab/lector de pantalla de verdad — ver nota abajo).

### ⚠️ Nota honesta sobre el alcance de esta verificación
No se probó con un navegador real ni con un lector de pantalla (NVDA/VoiceOver) — este entorno no tiene uno disponible. Lo que sí se verificó: las páginas cargan sin error, y cada cambio se revisó línea por línea contra el patrón ya usado en el resto del proyecto. Antes de dar esto por completamente cerrado, vale la pena que alguien navegue el panel admin solo con Tab/Enter (sin mouse) al menos una vez.

### 📂 Archivos modificados
- `web/css/styles.css` (clase `.skip-link`).
- `web/index.html`, `web/login.html`, `web/dashboard.html`, `web/admin.html`, `web/asistente.html`.

## 📅 [2026-09-08] — Fase 3 (parte 1): "Avisos" y "Campañas" eran dos mecanismos desconectados — ahora es uno solo

### 🐛 El problema real (más grave de lo que parecía)
El panel admin tenía una pestaña "Avisos y promociones" que parecía funcionar (mostraba toast de éxito al guardar), pero en realidad escribía a `site_config` (`padron_avisos`), completamente aparte de la tabla real `campanas`. Como `initAdmin()` siempre vuelve a leer `avisoData` desde `campanas` en cada carga del panel, **cualquier aviso creado o editado se perdía la siguiente vez que el admin abría el panel** — el toast de éxito era falso. Mientras tanto, la tabla `campanas` (con datos reales desde `seed.sql`) no tenía ningún endpoint para crear/editar/eliminar — quedaba congelada para siempre. En el sitio público, ambos mecanismos se pintaban juntos en el mismo bloque (`renderCampaigns()` + `renderAvisos()`, mismo contenedor `campaignsContainer` — el propio encabezado de esa sección ya decía "Avisos y campañas"), confirmando que siempre fueron pensados como una sola cosa.

### 🔧 La corrección: un solo mecanismo, la tabla real
- `campanas` ganó una columna `imagen` (Base64, opcional) para no perder la función de banner con foto que ya tenía "avisos".
- `POST`/`PUT`/`DELETE /api/campanas` nuevos (antes solo existía `GET`) — mismo patrón que ya usaba `articulos`.
- El editor "Avisos y promociones" del panel ahora llama a esos endpoints reales en vez de guardar en `site_config`. Se eliminaron `persistAvisos()`/`loadAvisosFromServer()` y la clave `padron_avisos` de todas partes (admin.html, index.html) — ya no existe ningún lugar donde un cambio se pueda perder.
- `renderCampaigns()` (portada pública) ahora es una sola función que maneja tanto ícono+color como imagen de fondo — se eliminó `renderAvisos()`, que hacía lo mismo con datos de otro lado.
- El subir banner (`previewBanner()`) ahora redimensiona con Canvas antes de guardar (máx. 1200px, calidad .85) — antes no tenía ningún límite ni optimización, a diferencia de las fotos de mascota/perfil que sí.

### 🐛 Bug encontrado y corregido en el camino
Al probar el endpoint nuevo, `POST /api/campanas` tronaba con "Error interno del servidor" siempre que no se mandaba `fecha_inicio`/`fecha_fin` — `$body['fecha_inicio'] ?: null` accede la llave ANTES de aplicar `?:`, y PHP 8 convierte ese aviso de "llave indefinida" en una excepción real (por el manejador global de errores). Corregido con `empty($body[...]) ? null : $body[...]`, que sí es seguro con llaves ausentes.

### ✅ Verificado
Todo contra la API local: crear/editar/eliminar una campaña de prueba (apareció y desapareció del listado público en cada paso), un ciudadano intentando crear una campaña → rechazado (403), imagen válida aceptada. `php -l` limpio; `index.html` y `admin.html` cargan (200). Dato de prueba borrado después.

### 📂 Archivos modificados
- `web/database/schema.sql` (`campanas.imagen`).
- `web/api/contenido.php` (POST/PUT/DELETE de campañas).
- `web/api/.htaccess` (comentario actualizado).
- `web/js/api-client.js` (`apiCrearCampana`, `apiActualizarCampana`, `apiEliminarCampana`).
- `web/admin.html` (editor de avisos reescrito, `previewBanner()` con Canvas).
- `web/index.html` (`renderCampaigns()` unificado, `renderAvisos()` eliminado).
- Base de datos local (no versionada en git): columna `imagen` aplicada.

## 📅 [2026-09-08] — Corrección: la Bitácora (Fase 2) nunca cargaba desde el panel real

### 🐛 El bug
El endpoint nuevo `web/api/bitacora.php` (Fase 2, 2026-09-07) se probó por línea de comandos pidiendo el archivo directo (`bitacora.php`), lo cual siempre funciona — pero el panel de verdad lo llama sin la extensión (`/api/bitacora`, igual que `/api/stats` o `/api/mascotas`), y a ese patrón le faltaba su regla de reescritura en `web/api/.htaccess`. Resultado: `apiGetBitacora()` recibía un 404 real en vez de JSON, y la pestaña "Bitácora" nunca cargaba nada — un hueco en cómo se verificó esa fase, no se abrió el panel de verdad en el navegador.

### 🔧 Corrección
Agregada la regla que faltaba (`RewriteRule ^bitacora$ bitacora.php`), mismo patrón que ya usan `stats`/`mascotas`/`usuarios`. Verificado pidiendo exactamente la URL sin extensión que usa el frontend.

### 📂 Archivos modificados
- `web/api/.htaccess`.

## 📅 [2026-09-08] — Fase 2 de la hoja de ruta: gobernanza institucional

### 🤔 Contexto
Continuación de la auditoría del 2026-09-07 (Fases 0 y 1). Esta fase busca que el Ayuntamiento pueda confiar en el sistema como institución: que quede registro de quién hizo qué, que exista un respaldo real de los datos, y que el rol asistente funcione como se pensó.

### 🔧 Cambios
1. **Respaldo automático de la base de datos** — `scripts/backup_db.php` (nueva carpeta, **fuera** de `web/` a propósito: un respaldo accesible por URL sería el mismo riesgo que ya causó la fuga de `web.zip` el 2026-09-07). Corre `mysqldump` (contraseña por variable de entorno, no visible en la lista de procesos), comprime a `.gz`, y conserva solo los últimos 14 respaldos. Pensado para un Cron Job de HostGator una vez que el hosting esté conectado — **eso queda pendiente del usuario**, no se puede configurar desde aquí.
2. **Bitácora de auditoría** — tabla nueva `bitacora` + función `registrarBitacora()`. Registra solo acciones de gobierno: promover una cuenta a admin, activar/desactivar cuentas, dar de baja una mascota, o que un admin edite la mascota de otra persona. **No** registra el uso normal del sistema (login, autoregistro, un ciudadano editando lo suyo) — eso sería ruido, no rendición de cuentas. Nueva pestaña "Bitácora" en el panel admin (solo lectura, paginada con el mismo patrón de la Fase 1).
3. **Rol asistente: ya puede ver lo que registra.** Nueva columna `mascotas.registrado_por` (quién dio de alta el registro, distinto de `dueno_id` — el ciudadano a quien pertenece la mascota). Antes un asistente no tenía NINGUNA forma de ver ni buscar las mascotas que él mismo había registrado (ni la API las filtraba correctamente, ni `asistente.html` tenía una sección para eso). Ahora `GET /api/mascotas` filtra por `registrado_por` cuando quien pregunta es un asistente, y se agregó "Mascotas registradas" (modal con búsqueda + botón de acta) en `asistente.html`.
4. **HTTPS/HSTS preparado, no activado.** Se agregó el header HSTS (comentado) junto al redirect a HTTPS que ya estaba preparado desde antes — los dos se activan juntos, cuando el certificado SSL esté confirmado funcionando en el dominio real (sigue pendiente la conexión del dominio en HostGator).
5. **`CLAUDE.md` corregido**: ya no dice que existen tablas `vacunas`/`avisos` (nunca existieron en `schema.sql` — la vacunación es solo `mascotas.vacunado`, y los avisos se guardan en `site_config`).

### ✅ Verificado
Respaldo generado y **restaurado de verdad** en una base de datos separada (`remac_restore_test`) — conteos de filas idénticos en las 3 tablas comparadas contra el original, luego borrada. Bitácora probada en vivo: activar/desactivar cuenta, promover a admin, y admin editando una mascota ajena — las 3 quedaron registradas con el detalle correcto; un ciudadano editando su propia mascota (ya probado en fases anteriores) sigue sin generar entradas, como se esperaba. Asistente de prueba: veía 0 mascotas antes de registrar una, exactamente 1 (la que registró) después — confirmando que ya no ve de más ni de menos. `php -l` limpio en los 5 archivos PHP tocados/creados; `admin.html` y `asistente.html` cargan (200). Datos y cuentas de prueba de esta verificación, borrados después.

### 📌 Pendiente (no es parte de esta fase)
Configurar el Cron Job real en HostGator (punto 1) y activar HTTPS/HSTS (punto 4) — ambos bloqueados por la conexión de dominio/hosting que sigue pendiente del usuario. Fase 3 de la hoja de ruta (recuperación de contraseña, panel de avisos conectado a `campanas`, accesibilidad, etc.).

### 📂 Archivos modificados
- `scripts/backup_db.php` (nuevo).
- `web/database/schema.sql` (`bitacora`, `mascotas.registrado_por`).
- `web/api/config/helpers.php` (`registrarBitacora()`).
- `web/api/bitacora.php` (nuevo).
- `web/api/mascotas.php`, `web/api/usuarios.php` (llamadas a `registrarBitacora()`, filtro por `registrado_por`).
- `web/js/api-client.js` (`apiGetBitacora()`).
- `web/admin.html` (pestaña Bitácora), `web/asistente.html` (modal "Mascotas registradas").
- `web/.htaccess` (HSTS preparado, comentado).
- `.gitignore` (`backups_remac/`, `*.sql.gz`).
- `CLAUDE.md`.
- Base de datos local (no versionada en git): columna y tabla nuevas aplicadas.

## 📅 [2026-09-07] — Fase 1 de la hoja de ruta: paginación real en el panel admin (rendimiento)

### 🤔 Contexto
Continuación de la auditoría del 2026-09-07 (Fase 0). El panel admin traía **todas** las mascotas y **todas** las cuentas en cada carga (con fotos en Base64 incluidas) y solo recortaba la vista en el navegador — el mismo patrón que ya había congelado el panel una vez con datos de prueba masivos (ver entrada del 2026-08-25). Esta fase mueve esa paginación al servidor de verdad.

### 🔧 Cambios
1. **Índices nuevos**: `duenos.token_sesion` (se consulta en cada request autenticado) y `duenos.colonia` (filtrado en `mascotas.php`, agrupado en `stats.php`).
2. **`stats.php`** ahora también devuelve `por_raza` (top 6 razas) — antes esa distribución se calculaba en el navegador recorriendo *todas* las mascotas solo para sacar ese conteo.
3. **`GET /api/mascotas` y `GET /api/usuarios` ahora soportan paginación real** (`?page=&pageSize=`, máx. 100 por página) — devuelven `{rows, total}` en vez de un arreglo con todo. Es **retrocompatible a propósito**: sin `?page=`, siguen devolviendo el arreglo plano de siempre, así que `dashboard.html`/`asistente.html` (un ciudadano nunca tiene tantas mascotas como para necesitar paginar) no necesitaron ningún cambio.
4. **`GET /api/usuarios` también soporta orden real en el servidor** (`?sort=&dir=`), con lista blanca de columnas (nombre, colonia, total_mascotas, creada, estatus, rol) — necesario porque esa tabla se puede tanto paginar como ordenar por columna, y ordenar solo la página actual habría dado un orden incorrecto.
5. **Panel admin reescrito para pedir solo lo que se muestra**:
   - "Datos" (KPIs, pastel de vacunación, barra de razas) ahora lee `stats` en vez de recorrer todas las mascotas; la mini-tabla de recientes pide solo 10.
   - "Seguimiento" (tarjetas), "Roles y Cuentas" y "Usuarios" (antes esta última ni siquiera esperaba a que se abriera la pestaña) ahora piden una página a la vez al servidor, con búsqueda/filtro/orden reales — ya no hay un tope arbitrario de tarjetas mostradas escondiendo el resto de los resultados.
   - Búsqueda con debounce (350ms): antes filtrar era gratis (arreglo ya en memoria); ahora cada letra puede disparar una consulta al servidor, así que se espera a que la persona termine de escribir.

### ✅ Verificado
Todo contra la API local (curl), no solo en código: paginación de mascotas y usuarios (offsets correctos, páginas sin filas repetidas), búsqueda por nombre, orden ascendente/descendente incluyendo por la columna calculada `total_mascotas`, un intento de inyección SQL vía `?sort=` cayó al orden por default sin tocar la base de datos (lista blanca funcionando), y `GET /api/mascotas` sin `?page=` sigue devolviendo el arreglo plano de siempre (probado con la sesión de una ciudadana real). `php -l` limpio en los 4 archivos PHP tocados; `admin.html` carga (200).

### 📌 Pendiente (no es parte de esta fase)
Fases 2-3 de la hoja de ruta (respaldo de BD, bitácora de auditoría, rol asistente, HTTPS, accesibilidad, etc.).

### 📂 Archivos modificados
- `web/database/schema.sql` (índices `idx_token_sesion`, `idx_colonia`).
- `web/api/stats.php` (`por_raza`).
- `web/api/mascotas.php`, `web/api/usuarios.php` (paginación + orden).
- `web/admin.html` (KPIs/pastel/barra desde `stats`, Seguimiento/Roles/Usuarios reescritos con paginación real, debounce de búsqueda).
- Base de datos local (no versionada en git): índices aplicados.

## 📅 [2026-09-07] — Fase 0 de seguridad: auditoría completa antes de producción y primeros bloqueantes corregidos

### 🤔 Contexto
El usuario pidió un análisis completo del proyecto (seguridad, rendimiento, arquitectura/roles) pensando en la entrega real al H. Ayuntamiento de El Grullo. Se hizo una auditoría de solo lectura en 3 frentes y se armó una hoja de ruta por fases (guardada como plan de la sesión). Esta entrada cubre la **Fase 0** (bloqueantes de seguridad), la única que ya se implementó — las Fases 1-3 (rendimiento, respaldo/bitácora, roadmap) quedan pendientes para cuando el usuario decida atacarlas.

### 🔧 Cambios de esta fase
1. **`web/web.zip` eliminado.** Contenía una copia de `config/database.php` con la contraseña real de la base de datos de producción en texto plano, físicamente dentro de la carpeta que se sube a HostGator. Nunca llegó a comitearse a git (confirmado con `git log --all --full-history`), pero **la contraseña real debe rotarse en HostGator de todos modos**, ya que estuvo expuesta en un archivo sin cifrar — esto queda pendiente de que el usuario lo haga directo en cPanel.
2. **Saneado contra XSS almacenado**: `nombre`/`telefono` (registro público, `auth.php`) y `nombre`/`telefono`/`direccion`/`colonia` (`crear-cuenta` y `buscar-o-crear`, `usuarios.php`) ahora pasan por `clean()` igual que ya hacían `update-profile` y los campos de mascota — antes, alguien podía autoregistrarse con un nombre tipo `<img src=x onerror=...>` y ese script corría en el navegador de cualquiera que lo viera (admin en "Roles y Cuentas", o cualquier persona que abriera `mascota.html` de esa mascota). Verificado en vivo: un registro de prueba con ese payload quedó guardado como texto escapado (`&lt;img...&gt;`), inofensivo.
3. **Folio público reemplazado por un token aleatorio.** El folio (`M-GRU-XXXXXXXXX`) es consecutivo y por lo tanto adivinable recorriendo números — y `mascota.html` lo aceptaba directo, sin sesión, exponiendo nombre y teléfono del dueño de cualquier mascota registrada. Se agregó `mascotas.token_publico` (32 caracteres aleatorios, `UNIQUE`), generado al registrar cada mascota; `mascota.html` y el QR/acta ahora usan `mascota.html?token=...` en vez de `?id=<folio>`. El folio se sigue usando igual que antes para todo lo interno (búsquedas, edición, actas). Las 70 mascotas ya existentes en local se migraron con un token nuevo cada una.
4. **Límite de intentos de login.** Nuevas columnas `duenos.intentos_fallidos`/`bloqueado_hasta`: tras 5 contraseñas incorrectas seguidas, la cuenta se bloquea 15 minutos (aunque la siguiente contraseña sea la correcta). Se encontró y corrigió en el camino un bug real de zona horaria: comparar `bloqueado_hasta` con `time()`/`strtotime()` de PHP fallaba porque en este equipo PHP está en `Europe/Berlin` y MySQL en la zona del sistema (México) — un desfase de 8 horas que dejaba el bloqueo siempre "vencido". Se corrigió comparando `bloqueado_hasta > NOW()` **dentro** de la misma consulta MySQL, sin mezclar relojes de PHP y de MySQL.
5. **Fotos de mascota validadas también en el servidor.** `foto_url` (POST y PUT de `mascotas.php`) ahora exige `data:image/(jpeg|png|webp);base64,...` y un tope de 3MB — antes solo lo limitaba el redimensionado en el navegador (Canvas), así que una llamada directa a la API podía guardar cualquier cosa. Mismo criterio que ya usaba `foto_perfil`, ahora compartido vía `validarFotoBase64()` en `helpers.php`.
6. **Cambiar contraseña ahora cierra la sesión actual** (`token_sesion = NULL`) — antes, un token robado seguía funcionando hasta 30 días después de que la persona "aseguraba" su cuenta. Las 3 copias de `changePassword()` (dashboard/asistente/admin) ahora redirigen a `login.html` tras el cambio, en vez de solo limpiar el formulario.

### ✅ Verificado
Todo probado en vivo contra la API local (curl), no solo revisado en código: registro con payload XSS quedó escapado en BD; lookup público por `?token=` funciona y por `?id=` (folio) ya no expone nada sin sesión; 5 intentos fallidos + reintento con contraseña correcta → bloqueado (429), y se libera solo tras expirar `bloqueado_hasta`; `foto_url` no-imagen y con MIME no permitido → rechazado, JPEG válido → aceptado; las 70 mascotas migradas tienen `token_publico`/`link_publico` nuevos. Datos de prueba (cuentas y mascota de esta verificación) borrados después; `folio_counter` devuelto a 70. `php -l` limpio en los 4 archivos PHP tocados; las 4 páginas HTML tocadas cargan (200).

### 🔧 Ajuste adicional (mismo día, mismo bug de fondo)
Al diagnosticar el desfase de zona horaria del punto 4, se encontró que `requireAuth()` (`helpers.php`) tenía el mismo patrón de riesgo para la expiración de sesión a los 30 días (`TOKEN_EXPIRY`): comparaba `token_creado_en` con `time()`/`strtotime()` de PHP. Con una ventana de 30 días el desfase de unas horas casi no se nota, pero es el mismo bug — se corrigió con el mismo criterio (comparación 100% dentro de MySQL). Verificado con un token de prueba forzado a 31 días de antigüedad: la sesión se reporta expirada correctamente.

### 📌 Pendiente (no es parte de esta fase)
- Rotar en HostGator la contraseña real de la base de datos (ver punto 1).
- Confirmar que la contraseña real de `admin@remac.elgrullo.mx` en producción ya no es la de `seed.sql` (`Admin1234`).
- Fases 1-3 de la hoja de ruta (índices/paginación, respaldo de BD, bitácora de auditoría, rol asistente, accesibilidad, etc.) — quedaron documentadas pero no implementadas.

### 📂 Archivos modificados
- `web/api/config/helpers.php` (`validarFotoBase64()`).
- `web/api/auth.php`, `web/api/usuarios.php`, `web/api/mascotas.php`.
- `web/js/api-client.js` (`apiGetMascota` → `apiGetMascotaPublica`, ahora por token).
- `web/mascota.html`, `web/dashboard.html`, `web/admin.html`, `web/asistente.html` (link público del acta/QR, `changePassword()`).
- `web/database/schema.sql`, `web/database/seed.sql`.
- `CLAUDE.md` (campo `token_publico`).
- Base de datos local (no versionada en git): columnas nuevas aplicadas, 70 mascotas migradas con token.
- `web/web.zip` eliminado (nunca estuvo en git).

## 📅 [2026-09-04] — Panel admin "Seguimiento": las tarjetas de mascota tenían 3 controles que no funcionaban de verdad

### 🐛 El usuario reportó (con capturas) tres bugs en la sección Seguimiento del panel admin
1. Un botón "+" flotante (`.fab-btn`, posicionado en absoluto sobre la tarjeta) se encimaba visualmente con el botón "Ver acta".
2. El botón "✏️" de esa tarjeta no editaba nada — nunca estuvo conectado a ninguna función real.
3. "Ver acta" tampoco generaba nada — solo mostraba un toast falso (`showToast('📄 Acta ... generada')`), sin PDF real.
4. Las mascotas con foto subida no la mostraban en la tarjeta — `renderSeguimiento()` siempre pintaba el emoji de la especie sin revisar `pet.foto_url`.

El usuario pidió explícitamente que el administrador **sí pueda editar de verdad** los datos de la mascota (no solo el estatus, que ya funcionaba).

### 🔧 Cambios
- **Foto**: `renderSeguimiento()` ahora muestra `<img src="${pet.foto_url}">` cuando existe, con el emoji de especie solo como respaldo.
- **Botones**: se quitó el FAB "+" falso (y su regla CSS `.fab-btn`, sin más usos en el archivo) y el toast falso de "Ver acta". La tarjeta ahora tiene 3 botones reales en fila: 🔄 Cambiar estatus (ya existía), ✏️ Editar y 📄 Ver acta.
- **Editar (`editarMascotaAdmin()` + modal `#modal-editar-mascota`)**: nuevo modal en `admin.html` con los mismos campos que el modal de edición de `dashboard.html` (nombre, especie, raza, edad, sexo, color, vacunado, esterilizado y foto con redimensionado por Canvas, máx. 5 MB). El backend **no necesitó ningún cambio**: el `PUT /api/mascotas?id=` ya aceptaba ediciones de admin sobre cualquier mascota (`mascotas.php`), y `apiActualizarMascota()` ya existía en `api-client.js` — el bug era 100% de frontend, la función simplemente no se había escrito nunca.
- **Ver acta (`downloadActaAdmin()`)**: PDF real con jsPDF, portado de `downloadActa()` de `dashboard.html` pero usando `allPets` (no `myPets`) y los datos de dueño que ya vienen en cada mascota (`pet.persona`, `pet.telefono`) en vez de mezclar con la sesión del propio admin. Se agregó el `<script>` de jsPDF (CDN, `defer`) a `admin.html`, que no lo tenía cargado.

### ✅ Verificado
Página carga (200). Login como admin + `PUT /api/mascotas?id=M-GRU-000000070` en vivo contra la mascota real "maximiliano" del reporte — edición aceptada y reflejada en la respuesta; dato de prueba revertido a su valor original después de confirmar.

### 📂 Archivos modificados
- `web/admin.html` (`renderSeguimiento()`, nuevo modal `#modal-editar-mascota`, `editarMascotaAdmin()`, `previewFotoEditarMascota()`, `guardarEdicionMascota()`, `downloadActaAdmin()`, script de jsPDF, CSS `.fab-btn` eliminado).

## 📅 [2026-09-04] — Nuevo formato de folio: `M-GRU-XXXXXXXXX` (9 dígitos) en vez de `REMAC-GRU-XXXXX` (5)

### 🤔 Contexto y decisiones confirmadas con el usuario
El usuario pidió simplificar el folio — quitar el prefijo "REMAC" (dejar solo "M" de Municipal) y ampliar de 5 a 9 dígitos. Antes de tocar nada se investigaron los 10 archivos donde aparecía el formato viejo, y se confirmaron dos decisiones con impacto real (el folio es la llave primaria de cada mascota, no solo una etiqueta):
1. **Renombrar las 70 mascotas ya existentes** al nuevo formato (no solo aplicarlo a partir de ahora) — decisión explícita del usuario, aunque implica que cualquier QR/acta ya generada con el folio viejo dejaría de apuntar correctamente.
2. **El contador del nuevo formato reinicia en 1** (`M-GRU-000000001`), no continúa desde el ~29,962 que traía el contador viejo (inflado por los datos de prueba masivos ya borrados).

### 🔧 Cambios
- `generarFolioREMAC()` (`helpers.php`): mismo mecanismo (transacción sobre `folio_counter`), prefijo `M-GRU-` y `str_pad` a 9 dígitos en vez de 5.
- **Migración de las 70 mascotas existentes**: script PHP (fuera del proyecto, en el scratchpad de la sesión) que las recorre en orden cronológico de registro y les asigna `M-GRU-000000001` .. `M-GRU-000000070`, actualizando también `link_publico` y `ficha` para que sigan coincidiendo con el nuevo `id`. Se confirmó antes de correrlo que ninguna otra tabla tiene una llave foránea hacia `mascotas.id`. El contador quedó en 70, así que el siguiente folio nuevo es `M-GRU-000000071` (probado en vivo).
- Actualizados los textos que mencionan el formato como ejemplo: `login.html`, `index.html` (banner y FAQ), el textarea por defecto de "Contenidos de portada" en `admin.html`, el valor de respaldo en `dashboard.html`, y los comentarios JSDoc de `api-client.js`.
- `schema.sql`/`seed.sql` actualizados para que una instalación nueva desde cero ya nazca con el formato correcto.
- `js/mock-data.js` (código simulado de antes de conectar el backend real) **no se tocó a propósito** — no lo carga ninguna página, confirmado con búsqueda de `<script src="mock-data.js">` en todo el proyecto.

### ✅ Verificado
Antes del commit: 0 mascotas con formato viejo, 70 con el nuevo, en orden correcto; consulta pública de una mascota migrada (`Max`, ahora `M-GRU-000000001`) funciona igual que antes; se registró una mascota de prueba real vía la API y salió `M-GRU-000000071` exactamente como se esperaba (se borró después y se regresó el contador a 70).

### 📂 Archivos modificados
- `web/api/config/helpers.php` (`generarFolioREMAC()`).
- `web/database/schema.sql`, `web/database/seed.sql`.
- `web/login.html`, `web/index.html`, `web/admin.html`, `web/dashboard.html`, `web/js/api-client.js` (referencias al formato como texto/ejemplo).
- Base de datos local (no versionada en git) — 70 mascotas renombradas, `folio_counter` en 70.

## 📅 [2026-09-03] — El mapa se veía con un hueco vacío de un lado: confirmado que no faltaba ninguna colonia, corregida la distribución de coordenadas

### 🔍 El usuario notó un área sin pines en el mapa y preguntó si faltaba registrar colonias
Antes de tocar nada se verificó directo contra la base de datos: `SELECT COUNT(DISTINCT colonia)` sobre mascotas activas — **las 38 colonias reales siguen teniendo al menos una mascota registrada**, no faltaba ningún dato. El hueco visual era 100% por cómo se habían repartido las coordenadas aproximadas del catálogo del mapa (entrada del 2026-09-03 anterior): se fueron colocando de forma manual/ad-hoc y, por casualidad, dejaron más densidad de un lado del centro que del otro.

### 🔧 Distribución circular pareja (sigue sin ser GPS real, ahora mejor repartida)
Recalculadas las 40 coordenadas sin ubicación oficial (todas menos "El Grullo centro", que se queda en el centro exacto, y "Oriente 1ra./2da. Sección", que se dejaron con su sesgo hacia el este siguiendo el nombre) con ángulos exactamente parejos alrededor del centro (360° ÷ 40) y radio variado para que no se vea como un anillo perfecto artificial. Calculado con `awk` (PowerShell tuvo un bloqueo repetido e inexplicable — "Remove-Item... blocked" — en un script que no tenía ningún `Remove-Item`, así que se cambió de herramienta en vez de insistir). Aplicado en las dos copias del catálogo (`admin.html`, `index.html`).

### ✅ Verificado
Las dos páginas cargan bien, el catálogo tiene las 43 entradas esperadas (38 reales + los 5 nombres del primer intento que no coinciden con el catálogo investigado, sin tocar), y el objeto de JavaScript cierra correctamente.

### 📂 Archivos modificados
- `web/admin.html`, `web/index.html` (coordenadas del catálogo `colonias` recalculadas).

## 📅 [2026-09-03] — `autocomplete="off"` no fue suficiente: Chrome lo seguía ignorando en las cajas de búsqueda

### 🐛 El usuario confirmó que el arreglo anterior no resolvió el problema
Después de agregar `autocomplete="off"` (entrada anterior de hoy) y confirmar que el servidor ya lo tenía (no era caché), el usuario reportó que Chrome seguía rellenando el buscador de "Datos" con el correo de la sesión. Esto es un comportamiento conocido de Chrome: su gestor de contraseñas puede **ignorar `autocomplete="off"`** en campos que detecta como "parecidos a un inicio de sesión" — es una decisión deliberada del navegador (para que los sitios no puedan desactivar el gestor de contraseñas a la fuerza), pero genera justo este falso positivo en cajas de búsqueda normales.

### 🔧 Corrección más fuerte: `readonly` hasta que se toca el campo
Técnica estándar para este problema exacto: el campo empieza como `readonly` (con `autocomplete="off"` de respaldo) y un `onfocus="this.removeAttribute('readonly')"` lo vuelve editable en el instante en que el usuario le da clic o llega con Tab — invisible para quien usa el sitio, pero como el campo "nace" de solo lectura, el navegador no lo considera candidato para autocompletar desde el principio (la decisión de qué campos ofrecer se toma con el estado inicial de la página, no se re-evalúa después de que JavaScript quita el `readonly`). Aplicado en las mismas 5 cajas de búsqueda de la entrada anterior.

### 📂 Archivos modificados
- `web/admin.html`, `web/asistente.html` (`readonly` + `onfocus` en las 5 cajas de búsqueda).

## 📅 [2026-09-03] — El navegador autocompletaba el correo guardado en cajas de búsqueda (mismo tema de autocompletado de antes, ahora en campos de texto normales)

### 🐛 Reportado por el usuario con captura: el buscador de "Datos" (panel admin) se veía con el correo de su cuenta ya escrito
Mismo mecanismo explicado antes (autocompletado del navegador, no una fuga del servidor) pero esta vez en una caja de búsqueda normal (`miniSearch`, "Buscar mascota..."), no en un campo de contraseña. Ninguna de las 5 cajas de búsqueda del sitio tenía `autocomplete`, así que Chrome podía ofrecerse a rellenarlas con el correo guardado de la sesión — más probable aún en `userSearch`/`rolesSearch`, cuyo propio placeholder dice "...correo...", una pista extra para el navegador.

### 🔧 Corrección: `autocomplete="off"` en las 5 cajas de búsqueda
A diferencia de los campos de contraseña (donde `autocomplete="off"` ya no sirve de nada porque los navegadores modernos lo ignoran a propósito), en cajas de búsqueda normales sí se respeta — y es lo correcto, porque una búsqueda es una consulta momentánea, no un dato que valga la pena que el navegador recuerde y ofrezca de nuevo. Aplicado en `miniSearch` y `segSearch` ("Datos"/"Seguimiento"), `userSearch` y `rolesSearch` ("Usuarios"/"Roles y Cuentas") en `admin.html`, y `buscarCiudadanoInput` en `asistente.html`.

### 📂 Archivos modificados
- `web/admin.html`, `web/asistente.html` (`autocomplete="off"` en las 5 cajas de búsqueda).

## 📅 [2026-09-03] — El botón "Descargar acta" de Acciones rápidas nunca pudo funcionar

### 🐛 Reportado por el usuario con captura: "No se encontró la mascota para generar el acta"
El botón "Descargar acta" de la barra de "Acciones rápidas" (distinto del botón "Acta" que ya trae cada tarjeta de mascota) llamaba a `downloadActa()` **sin pasarle ningún folio** — a diferencia de los otros 2 lugares del archivo que sí lo hacen. `downloadActa(folio)` busca `myPets.find(p => (p.id||p.folio) === folio)`; con `folio` en `undefined`, esa búsqueda nunca encuentra nada, sin importar cuántas mascotas tenga la cuenta. El botón estaba roto desde que se agregó, no era un problema de la cuenta del usuario.

### 🔧 Corrección: resuelve solo cuando no hay ambigüedad
Nueva `downloadActaRapida()`: con **0 mascotas**, avisa que registre una primero; con **exactamente 1** (el caso más común, y el del usuario que reportó esto), descarga esa directo sin pedir nada; con **2 o más**, no adivina cuál — llevar al usuario a la lista sería descargar el acta equivocada sin que se diera cuenta, así que en vez de eso lo manda a "Mis animales de compañía" con un aviso de que use el botón de la tarjeta específica.

### 📂 Archivos modificados
- `web/dashboard.html` (`downloadActaRapida()` nueva; el botón de Acciones rápidas ahora la llama a ella).

## 📅 [2026-09-03] — El archivo "del escudo" en realidad no era el escudo: corregido en las 9 partes del sitio donde se usaba, y favicon real agregado

### 🐛 Bug real, grande, encontrado a partir de una pregunta del usuario
El usuario pidió poner `Imagenes/Distintivo HAyto El Grullo CB.png` como ícono de una página. Al revisar esa imagen, resultó ser un **patrón geométrico de triángulos de colores sin relación con El Grullo** — no el escudo institucional. Buscando el nombre del archivo en el proyecto se encontró que **ya estaba en uso en 9 lugares de 7 archivos**: el navbar de `index.html`, el panel lateral de `login.html`, el sidebar de `dashboard.html`/`admin.html`/`asistente.html`, la ficha pública de mascota (`mascota.html`, 3 veces), y hasta el botón de acceso rápido "🏛️ Escudo" del selector de apariencia en `admin.html`. Es decir, **todo el sitio ha estado mostrando ese patrón de triángulos como si fuera el escudo del Ayuntamiento**, sin que nadie lo notara hasta ahora.

Se encontraron los archivos correctos ya existentes en `web/Imagenes/`: `LOGO 1.png`/`LOGO 2.png` (a color, idénticos entre sí), `Logo negro.png` (versión en negro) y `Logo blanco.png` (versión en blanco, para fondos oscuros) — el emblema real del kiosco de El Grullo con "Gobierno Municipal 2024-2027 · La Ciudad de la Gente", coherente con el resto de la identidad del proyecto.

### 🔧 Corrección: cada uso apunta ahora al archivo correcto según su fondo
- Fondos oscuros/naranjas (sidebars de las 3 páginas con sesión, panel lateral de login, badge del encabezado de la ficha de mascota) → `Logo blanco.png`.
- Fondos claros (navbar de portada, pie de la ficha de mascota ×2, botón preset de apariencia) → `LOGO 1.png`.
- El archivo `Distintivo HAyto El Grullo CB.png` se dejó tal cual en la carpeta (no se borró, por si tiene otro uso no encontrado) pero ya no se referencia en ningún lado.

### 🆕 Favicon real (antes era un emoji genérico)
Las 6 páginas usaban un emoji (🐾 o 🔧 en el caso de `admin.html`) como ícono de pestaña del navegador, vía SVG embebido. Se generó `Imagenes/favicon-escudo.png` (256×256, fondo transparente) recortando solo el kiosco de `Logo negro.png` (sin el texto de abajo, que no cabría legible en un ícono tan chico) usando `System.Drawing` de .NET vía PowerShell — no hay librería de imágenes (GD) instalada en este PHP local. Aplicado como favicon en las 6 páginas.

### ✅ Verificado
Ningún archivo hace referencia ya al nombre viejo (`grep` sin resultados). Las 6 páginas y el favicon cargan con 200. Revisión visual de cada imagen (`LOGO 1.png`, `Logo negro.png`, el recorte final) antes de aplicarlas — no se asumió que se veían bien sin comprobarlo.

### 📂 Archivos modificados
- `web/index.html`, `web/login.html`, `web/dashboard.html`, `web/admin.html`, `web/asistente.html`, `web/mascota.html` (favicon real; referencias del logo corregidas).
- `web/Imagenes/favicon-escudo.png` (nuevo).

## 📅 [2026-09-03] — El mapa ya cubre las 38 colonias reales (antes solo 16, y 5 de esas ni eran reales); datos de demostración en cada una

### 🔍 Hallazgo: el catálogo de colonias del mapa no coincidía con el catálogo real investigado antes
El usuario pidió agregar ciudadanos y mascotas en cada colonia real de El Grullo, para poder confirmarlo visualmente en el mapa como administrador. Al revisar, se encontró que el catálogo de coordenadas del mapa (`colonias` en `admin.html` e `index.html`, 16 entradas) y el catálogo real de 38 colonias investigado el 2026-08-17 (`COLONIAS_EL_GRULLO` en `el-grullo-data.js`, con fuente: directorios públicos de códigos postales/callejeros) **no son el mismo catálogo** — ya se sabía que el del mapa era "más chico" (documentado desde entonces), pero no se sabía que **5 de esas 16 no coinciden con ninguna de las 38 colonias reales** (`Magisterial`, `Nueva creación`, `Los pinos`, `La cañada`, `San José`) — se dejaron tal cual (podrían ser reales y solo faltar en la investigación anterior, que su propio comentario admite "no es necesariamente exhaustiva").

### 🗺️ Coordenadas agregadas para las 27 colonias reales que le faltaban al mapa
Se investigó la ubicación general de El Grullo (búsqueda web, confirma las coordenadas del centro ya usadas: 19.8056, -104.2139) pero no hay geocodificación precisa disponible para colonias pequeñas de un municipio chico — así que las 27 coordenadas nuevas son **ubicaciones aproximadas alrededor del centro** (mismo criterio que ya se usó, aparentemente, para las 16 originales, que también están todas apretadas en un radio chico sin ser coordenadas agrimensadas), no coordenadas GPS reales. "Oriente 1ra./2da. Sección" sí se recorrieron hacia el este siguiendo el nombre. Aplicado en las dos copias del catálogo (`admin.html` e `index.html`, que lo duplican igual que otros componentes chicos del proyecto). **Documentado así de manera transparente** — sirve para confirmar que el mecanismo del mapa funciona con las 38 colonias, no para navegación GPS real.

### 🧑‍🤝‍🧑 38 ciudadanos de demostración, uno por colonia real, con 1-2 mascotas cada uno
57 mascotas en total, folios reales consecutivos, nombres/domicilios con formato realista (nombres y calles reales de El Grullo). Documentado en `CUENTAS_PRUEBA.md` (no se sube a git) con el correo/contraseña usados y el comando para borrarlos antes de producción.

### ✅ Verificado
Los 38 nombres de colonia de `GET /api/stats` (`por_colonia`, lo que realmente alimenta el mapa) se cruzaron uno por uno contra el catálogo de coordenadas actualizado — las 38 tienen ahora un pin correspondiente, ninguna cae en el "sin coincidencia" (que usaría el centro del pueblo como respaldo). Confirmado login con una de las cuentas nuevas, y que los acentos se guardan/devuelven correctos vía la API (lo que se veía como `�` en la consola era solo la codificación de la terminal de Windows, no un problema real de datos).

### 📂 Archivos modificados
- `web/admin.html`, `web/index.html` (27 coordenadas nuevas en el catálogo `colonias` del mapa).
- Base de datos local (no versionada en git) — 38 ciudadanos y 57 mascotas de demostración.
- `CUENTAS_PRUEBA.md` (no se sube a git) — documenta el lote nuevo.

## 📅 [2026-09-03] — Aclarado (no era bug del servidor) y corregido: el campo "Contraseña actual" se veía prellenado

### 🐛 Reportado por el usuario con una captura: el campo "Contraseña actual" de "Cambiar contraseña" se veía con fondo azul y ya con puntos, como si la contraseña real ya estuviera ahí al abrir la página — parecía una fuga de seguridad.

**Confirmado con el código (no de memoria) que no lo es:** se buscó cada aparición de `pass-actual` en las tres páginas y ninguna función escribe un valor real ahí — solo se lee para mandarlo al servidor al enviar el formulario, y se limpia (`= ''`) después de un cambio exitoso. El servidor tampoco manda nunca `password_hash` al cliente, en ningún endpoint. Lo que se veía es el **autocompletado del propio navegador** (el fondo azul/lavanda es la marca visual característica de Chrome al rellenar un campo con una contraseña que el usuario ya había guardado antes en ese navegador para este sitio) — no una fuga de datos del servidor.

**Causa real, y por qué valía la pena corregirla igual:** ninguno de los 16 campos de tipo `password` del sitio tenía el atributo `autocomplete` correcto, así que el navegador tenía que **adivinar** cuál era "la actual" y cuál "la nueva" — que es exactamente el comportamiento ambiguo/confuso que preocupó al usuario. Se agregó el valor correcto en los 16 (login, registro, "Nueva cuenta", "Agregar correo", y "Cambiar contraseña" en las 3 páginas): `autocomplete="current-password"` para contraseña actual/login, `autocomplete="new-password"` para cualquier contraseña nueva que se está definiendo. Es la recomendación estándar (MDN/WHATWG) para este tipo de formularios — no se usó `autocomplete="off"` porque los navegadores modernos ya lo ignoran en campos de contraseña a propósito, y desactivar el uso de gestores de contraseñas es considerado una mala práctica de seguridad, no una buena.

### 📂 Archivos modificados
- `web/login.html`, `web/dashboard.html`, `web/admin.html`, `web/asistente.html` (atributo `autocomplete` en los 16 campos de contraseña).

## 📅 [2026-09-02] — Contraseñas más seguras al registrarse, correo validado, y "Cambiar contraseña" en Mi perfil (las 3 páginas)

### 🐛 Reportado por el usuario probando el registro en vivo
Registró una cuenta con contraseña `123456789` (secuencia numérica) y el sistema la aceptó sin problema — la única regla existente era `strlen >= 8`, sin exigir nada más. De paso se confirmó que `?action=register` tampoco validaba que el correo tuviera formato de correo real.

### 🔒 Nueva regla de contraseña, centralizada en un solo lugar
Nueva función `validarPassword()` en `helpers.php`: mínimo 8 caracteres, con al menos una letra y un número (sin exigir símbolos, para no complicar de más a quien no es muy técnico). Se usa ahora en **los 4 lugares donde se define una contraseña** — antes cada uno tenía su propia copia de `strlen < 8`, ahora es una sola regla:
- `POST /api/auth?action=register` (registro de ciudadano) — también se agregó `filter_var($email, FILTER_VALIDATE_EMAIL)`, que tampoco existía ahí.
- `POST /api/usuarios?action=crear-cuenta` (admin crea asistente/ciudadano).
- `POST /api/usuarios?action=asignar-correo` (admin le da correo a un ciudadano sin correo).
- `POST /api/auth?action=change-password` (nuevo, ver abajo).

`login.html` (formulario de registro) refleja la misma regla con `pattern` + texto de ayuda, para avisar antes de mandar la petición — la validación real sigue siendo la del servidor.

### 🆕 "Cambiar contraseña" agregado a Mi perfil (ciudadano, asistente, admin/superadmin)
No existía ninguna forma de cambiar la contraseña una vez creada la cuenta — ni para el ciudadano ni para nadie. Nuevo endpoint `POST /api/auth?action=change-password`: exige la contraseña actual correcta (`password_verify()`), la nueva debe pasar `validarPassword()` y ser distinta a la actual. Nueva sección "🔒 Cambiar contraseña" en las 3 implementaciones de Mi perfil (tarjeta aparte en `dashboard.html`/`admin.html`, dentro del mismo modal en `asistente.html`), con su propio botón — independiente de "Guardar cambios" del resto del perfil.

### ✅ Verificado (curl): 9 casos
Registro con contraseña débil (rechazado), correo inválido (rechazado), registro válido (éxito); `crear-cuenta` con contraseña débil (rechazado); `change-password` con contraseña actual incorrecta (401), nueva contraseña débil (400), nueva igual a la actual (400), cambio válido (200) — confirmado que el login con la contraseña nueva funciona. Cuenta de prueba usada para esto se borró al terminar.

### 🤔 Sobre "recuperar contraseña" (olvidé mi contraseña) — no implementado todavía, a propósito
El usuario preguntó si conviene implementarlo ya. Ver la respuesta completa en el chat — resumen: **no todavía**, porque requiere enviar correos reales (token de recuperación por email), y el dominio/hosting de producción no está completamente conectado aún (tema pendiente de sesiones anteriores). Ya estaba anotado como "más adelante" desde antes de esta sesión. Queda pendiente para cuando el correo del dominio esté funcionando de verdad.

### 📂 Archivos modificados
- `web/api/config/helpers.php` (`validarPassword()`, nueva).
- `web/api/auth.php` (`register` con validación de correo/contraseña; nueva acción `change-password`).
- `web/api/usuarios.php` (`crear-cuenta` y `asignar-correo` usan `validarPassword()`).
- `web/js/api-client.js` (`apiChangePassword`).
- `web/login.html` (pista de contraseña en el formulario de registro).
- `web/dashboard.html`, `web/admin.html`, `web/asistente.html` (sección "Cambiar contraseña" en Mi perfil).

## 📅 [2026-09-02] — Decisión: se mantiene Base64-en-BD para imágenes; limpiadas las 20,000 cuentas de prueba masivas

### 🤔 Contexto
Tras el análisis de `MANEJO_DE_IMAGENES.md` (entrada de abajo), el usuario preguntó cómo evitar problemas de espacio/límites del servidor en HostGator al desplegar, dado el volumen de prueba cargado (~20,000 cuentas/~30,000 mascotas). Se planteó explícitamente la alternativa de cambiar a archivos reales en el servidor en vez de Base64-en-BD, ya que era buen momento para hacerlo (casi no hay fotos reales todavía que migrar).

### ✅ Decisión confirmada con el usuario: se mantiene Base64-en-BD
No se cambia la arquitectura — para el volumen esperado de un municipio pequeño como El Grullo, sumado a las correcciones ya aplicadas (columnas `LONGTEXT`, redimensionado por Canvas en las 4 vías de subida) y las buenas prácticas de higiene de datos (no subir datos de prueba a producción, revisar tamaño de BD periódicamente), no debería acercarse a ningún límite real de un plan de hosting compartido. Cambiar a archivos en servidor implicaría rehacer la subida/muestra de imágenes en 5-6 archivos y gestionar permisos de carpetas en HostGator sin acceso SSH — costo no justificado a esta escala. **Si el volumen real crece mucho más de lo esperado en el futuro, esta es la alternativa a reconsiderar entonces, no ahora.**

### 🧹 Limpiadas las 20,000 cuentas de prueba masivas de la base de datos local
Con confirmación explícita del usuario, se borraron de la base de datos **local**: `DELETE FROM duenos WHERE email LIKE '%@test.local';` (20,000 filas — el `ON DELETE CASCADE` de `mascotas.dueno_id` se encargó de sus ~29,884 mascotas), seguido de `OPTIMIZE TABLE duenos, mascotas;` para que el tamaño en disco reflejara la limpieza real (InnoDB no libera el espacio del archivo automáticamente tras un `DELETE`). Resultado: 20,052 → 52 dueños, 29,895 → 11 mascotas, ~16 MB → 0.69 MB. Documentado en `CUENTAS_PRUEBA.md` (no se sube a git). Las 40 cuentas de prueba más chicas (`ciudadanoN@test.com`, etc., ya documentadas desde el 2026-08-21) **no se tocaron** — siguen pendientes de borrar antes de producción real.

### 📂 Archivos modificados
- Base de datos local (no versionada en git) — 20,000 dueños de prueba y sus mascotas eliminados.
- `CUENTAS_PRUEBA.md` (no se sube a git) — actualizado para reflejar la limpieza.

## 📅 [2026-09-02] — Corregido el pendiente de `articulos.contenido` (TEXT → LONGTEXT) documentado el mismo día

### 🐛 El bug real que se documentó como pendiente en `MANEJO_DE_IMAGENES.md` ya se corrigió
Al escribir ese documento se encontró que `articulos.contenido` seguía siendo `TEXT` (~64 KB) y que `insertImageInEditor()` insertaba la imagen sin redimensionar — mismo bug que ya se había corregido una vez para `mascotas.foto_url`. El usuario preguntó después por recomendaciones para evitar este tipo de problemas en HostGator, así que se corrigió de una vez:
- `articulos.contenido` → `LONGTEXT`.
- `insertImageInEditor()` ahora redimensiona con `<canvas>` (máx. 800px, JPEG .85) antes de insertar la imagen en el editor — igual que ya hacían mascota/perfil/apariencia.

**Verificado:** se creó un artículo de prueba con 100,000 caracteres de contenido (por encima del límite viejo de ~64 KB) directo contra la API — guardó correctamente (antes habría fallado) — y se borró después de confirmar.

### 📝 Documentado un lote de datos de prueba que nunca se había anotado
Revisando cómo limpiar la base de datos antes de subir a HostGator, se encontró que las **20,000 cuentas** de prueba masivas (`cargaN@test.local`, cargadas el 2026-08-25 para probar el panel con volumen) nunca quedaron documentadas en `CUENTAS_PRUEBA.md` — solo el lote más chico de 40. Agregado ahí (archivo local, no se sube a git), con el comando exacto para borrarlas antes de producción real (`mascotas.dueno_id` tiene `ON DELETE CASCADE`, así que un solo `DELETE` sobre `duenos` basta).

### 📂 Archivos modificados
- `web/database/schema.sql` (`articulos.contenido` → `LONGTEXT`).
- `web/admin.html` (`insertImageInEditor()` redimensiona con Canvas).
- `CUENTAS_PRUEBA.md` (no se sube a git — documenta el lote de 20,000 cuentas de prueba).

## 📅 [2026-09-02] — Nuevo documento `MANEJO_DE_IMAGENES.md`: cómo se comprimen y guardan todas las imágenes del sistema

### 📄 Contexto
El usuario preguntó dónde y cómo se guardan las imágenes del sitio (fotos de mascota, fotos de perfil, íconos/logos, imágenes de artículos) — investigado y respondido en el chat. Pidió después un documento aparte, detallado, para poder explicar este apartado ante su asesor/profesor (proyecto de residencia).

### 📝 Nuevo archivo: `MANEJO_DE_IMAGENES.md`
Documenta: el mecanismo común a las 4 vías de subida (FileReader → redimensionar con `<canvas>` → `toDataURL()` → guardar el Base64 resultante en una columna `LONGTEXT`, sin archivos separados en el servidor), tabla comparativa de cada tipo de imagen con su tamaño máximo/redimensionado exactos, la justificación arquitectónica (por qué Base64-en-BD y no una carpeta de `uploads/`, dadas las limitaciones de HostGator sin SSH), límites técnicos reales (columnas `TEXT` vs `LONGTEXT`, `upload_max_filesize`/`post_max_size` de PHP), y un caso de estudio con el bug real ya corregido de `mascotas.foto_url` (era `TEXT`, se corrigió a `LONGTEXT` el 2026-08-01).

**Incluye, a propósito y con honestidad, un pendiente real encontrado al escribir el documento:** `articulos.contenido` sigue siendo `TEXT` y las imágenes insertadas en artículos (`insertImageInEditor()`) nunca se redimensionan — mismo bug que ya se corrigió una vez para mascotas, aquí se pasó por alto. No se corrigió en esta entrada (el usuario no lo pidió todavía) — documentado como pendiente para que la explicación sea honesta.

### 🔒 Verificado antes de subir: sin datos sensibles, `.gitignore` intacto
A petición explícita del usuario, se confirmó con `git status` que `CUENTAS_PRUEBA.md` y `web/api/config/database.php` (credenciales reales) siguen fuera del control de versiones antes de este commit, y se revisó que el documento nuevo no incluya ninguna contraseña, credencial ni dato real de usuarios — solo explicación técnica con ejemplos genéricos.

### 📂 Archivos modificados
- `MANEJO_DE_IMAGENES.md` (nuevo).

## 📅 [2026-09-01] — El admin ya puede asignarle correo y contraseña a un ciudadano sin correo (registrado por un asistente)

### 🆕 Contexto
Los ciudadanos registrados sin correo por un asistente (`buscar-o-crear`, ej. personas adultas mayores) no podían iniciar sesión — no tenían con qué. El usuario pidió una forma de que, si esa persona luego sí quiere una cuenta, un admin o superadmin pueda darle de alta un correo y contraseña sin depender de un desarrollador.

### 🔧 Diseño
Poder de **cualquier admin** (no exclusivo del superadmin, a diferencia de "Hacer administrador") — esto no otorga ningún privilegio nuevo, solo credenciales de acceso a una cuenta de ciudadano que ya existe, mismo nivel que ya tiene un admin para crear cuentas nuevas. Solo funciona si la cuenta **todavía no tiene correo** — no sirve para cambiarle el correo a alguien que ya puede iniciar sesión (eso ahora lo hace la propia persona desde "Mi perfil", ver entrada anterior), así ningún admin puede "robarse" una cuenta ya activa cambiándole las credenciales sin que esa persona se entere.

- Nuevo endpoint `POST /api/usuarios?action=asignar-correo` (`requireAdmin()`): valida formato de correo, que no choque con otra cuenta, contraseña ≥8 caracteres, que el objetivo sea `rol='ciudadano'` y que su `email` sea `NULL` — `UPDATE` con ese mismo `WHERE` para ser seguro ante condiciones de carrera (TOCTOU), igual que ya se hizo con `promover-admin`.
- En "Roles y Cuentas": nuevo botón "✉️ Agregar correo", visible solo en filas de ciudadano activo sin correo, con un modal para capturar el correo y la contraseña (con confirmación, mismo patrón que "+ Nueva cuenta").

### ✅ Verificado (curl): 9 casos
Éxito (y confirmado que la cuenta ya puede iniciar sesión con las credenciales nuevas), rechazo de: sesión no-admin, cuenta que ya tiene correo, cuenta que no es ciudadano (ej. asistente), correo duplicado, correo con formato inválido, contraseña corta.

### 📂 Archivos modificados
- `web/api/usuarios.php` (`?action=asignar-correo`).
- `web/js/api-client.js` (`apiAsignarCorreo`).
- `web/admin.html` (botón "✉️ Agregar correo", modal, handlers).

## 📅 [2026-09-01] — "Mi perfil" (con foto real) ahora existe también para Asistente y Admin/Superadmin; corregido el bug real de la foto de perfil del ciudadano

### 🐛 Bug real encontrado: la foto de perfil del ciudadano nunca se guardó — y podía tronar la pestaña
El usuario reportó que subir una foto en "Mi perfil" a veces cerraba la sesión o crasheaba. Investigando `changeAvatar()` en `dashboard.html` se encontró que **nunca existió backend para esto**: la función solo metía la imagen sin redimensionar directo al `innerHTML` del avatar (ni validaba tamaño, a diferencia de la foto de mascota que sí lo hace) y jamás la mandaba al servidor — no había ni columna en la base de datos para guardarla. Una foto de cámara sin redimensionar (varios MB, miles de píxeles) manejada así en el navegador, sobre todo en celular, es una causa muy plausible del crasheo reportado.

**Corrección:**
- Nueva columna `duenos.foto_perfil LONGTEXT` (mismo patrón que `mascotas.foto_url`).
- `changeAvatar()` ahora valida tamaño (máx. 5 MB) y redimensiona con Canvas (máx. 300px, JPEG calidad .85) antes de usarla — igual que ya hacía la foto de mascota — y la deja pendiente hasta que se pulse "Guardar cambios" (no se guarda sola al elegir el archivo; un solo botón de guardado para todo el perfil).
- `POST /api/auth?action=update-profile` ahora acepta y persiste `foto_perfil`.

### 🐛 Bug real adicional (menor) encontrado de paso: domicilio/colonia "se olvidaban" al volver a iniciar sesión
`requireAuth()` (usada por `GET /auth?action=me`, la que arma la sesión en cada carga de página) no traía `direccion`/`colonia` de la base de datos — solo se completaban en el objeto de sesión justo después de guardar cambios en esa misma pestaña, nunca en una carga nueva. Corregido: ya se incluyen en el `SELECT` de `requireAuth()` y en la respuesta de login.

### 🆕 Correo electrónico ahora editable (antes solo de lectura, con validación real)
El campo de correo en "Mi perfil" se veía pero no se podía cambiar. Decisión confirmada con el usuario: sí debe poder editarse. `update-profile` ahora valida formato (`FILTER_VALIDATE_EMAIL`) y que el nuevo correo no choque con otra cuenta ya existente (columna `UNIQUE`) antes de aceptarlo — como es el identificador de acceso, cambiar a un correo ya usado por otra cuenta se rechaza con un mensaje claro en vez de fallar a medias.

### 🆕 "Mi perfil" extendido a Asistente y Admin/Superadmin (antes solo existía para Ciudadano)
- **`admin.html`**: nueva sección "Mi perfil" (pestaña nueva en el sidebar + el bloque de usuario del sidebar, antes 100% estático con el texto fijo "Administrador", ahora es dinámico y clicable — muestra el nombre real, la foto si existe, y "Superadmin" en vez de "Panel admin" para esa única cuenta).
- **`asistente.html`**: esta página no tiene sistema de pestañas (es un flujo de un solo paso, registrar mascota), así que "Mi perfil" se agregó como modal — mismo patrón ya usado ahí para "Registrar mascota", en vez de forzar una navegación por pestañas que no encaja con el resto de la página.
- Mismos campos en las tres páginas (nombre, teléfono, correo, foto) — se dejaron fuera domicilio/colonia para admin/asistente a propósito: son cuentas de personal municipal, no residentes, y esos campos habrían requerido además incluir el buscador de colonias (`el-grullo-data.js`) que esas dos páginas no cargan.

### ✅ Verificado de punta a punta (curl) para los tres roles
Login + `update-profile` con nombre/teléfono/correo/foto para ciudadano, asistente y admin — los tres guardan y devuelven los datos correctos. Confirmado explícitamente que actualizar el perfil del superadmin **no** afecta su columna `es_superadmin` (sigue en 1 tras volver a iniciar sesión). Confirmado el rechazo de correo duplicado, correo con formato inválido, y que guardar el propio correo sin cambiarlo no dispara el error de "ya está en uso". Pendiente que el usuario confirme visualmente en el navegador (no hay forma de abrir uno real en este entorno).

### 📂 Archivos modificados
- `web/database/schema.sql` (columna `foto_perfil`).
- `web/api/config/helpers.php` (`requireAuth()` incluye `direccion`, `colonia`, `foto_perfil`).
- `web/api/auth.php` (login incluye los mismos campos; `update-profile` valida correo único y acepta `foto_perfil`).
- `web/dashboard.html` (bug real corregido: `changeAvatar()`, `saveProfile()`, correo editable).
- `web/admin.html` (nueva sección "Mi perfil", sidebar de usuario dinámico).
- `web/asistente.html` (nuevo modal "Mi perfil").

## 📅 [2026-08-29] — Encabezado "chueco" en celular, falla silenciosa al cargar estadísticas, y placeholder viejo "342" en el mapa

### 🐛 El encabezado del panel (☰ + título + acciones) se veía descuadrado en celular
La corrección anterior de este mismo día (ocultar el subtítulo largo) resolvió que el contenido se cortara, pero dejó un problema distinto: con `justify-content: space-between` (el valor de escritorio) y solo el botón ☰ + el bloque de título cabiendo en la primera línea, el algoritmo de flexbox manda el título pegado al borde derecho de la pantalla — lejos del botón ☰ — dejando un hueco grande en medio, con las acciones (badge + botón) flotando solas en una segunda línea. Confirmado con una captura real del usuario. Corregido: en celular ahora es `justify-content: flex-start` y el bloque de título crece para ocupar el espacio libre junto al botón ☰ (quedan juntos, como una sola unidad), mientras que el grupo de acciones baja a su propia fila completa alineada a la derecha. Aplica a las 3 páginas que comparten `.dashboard-header` (`admin.html`, `asistente.html`, `dashboard.html`).

### 🐛 Bug real encontrado: si fallaba la carga de estadísticas, no se avisaba — parecía que "no había datos"
El usuario reportó capturas donde el mapa, "Cobertura de vacunación" y "Tipos de mascotas" se veían vacíos/en cero en celular, aunque la base de datos real tiene ~29,900 mascotas (confirmado por consulta directa, y el endpoint `/api/stats` responde correcto y rápido probado por la misma IP de red que usa el celular — no es un problema del servidor ni de CORS). Revisando `initAdmin()` se encontró la causa: **la petición de estadísticas (`apiGetStats()`) tenía un `catch` silencioso** (`catch (err) { stats = {}; }`, sin aviso alguno), a diferencia de la petición de mascotas (`apiGetTodasMascotas()`) que sí muestra un toast de error si falla. `initMap()` **no hace su propia petición** — lee del mismo `stats` ya cargado (`stats.por_colonia`), así que si esa petición fallaba (ej. un hipo de la red WiFi del celular), el mapa se veía igual (siempre se centra en El Grullo) pero sin ningún marcador, y KPIs/gráfica de vacunación/tipos de mascota mostraban ceros silenciosos — indistinguible en pantalla de "el padrón está vacío de verdad". Corregido: ahora muestra el mismo tipo de aviso (`❌ No se pudieron cargar las estadísticas: ...`) que ya usa la petición de mascotas, para que quede claro que fue un error de carga y no falta de datos.

### 🧹 Limpieza: placeholder viejo "342" en el contador del mapa
`<span id="mapCount">342</span>` seguía teniendo el número de ejemplo fijo como valor inicial en el HTML (el mismo "342" que se documentó como dato falso y se quitó de todos lados en la entrada del `[2026-08-01]` de este historial — este `id="mapCount"` en particular se les pasó en aquel momento). El JS sí lo actualiza correctamente al cargar (`mapCountEl.textContent = allPets.length`), pero mientras tanto —o si la carga fallaba— se veía el "342" viejo en vez de un placeholder neutro. Cambiado a "—", igual que el resto de las tarjetas KPI.

### 🔧 Versión del CSS actualizada
`?v=20260829` → `?v=20260829b` en las 5 páginas, para que el cambio de `.dashboard-header` de esta entrada sí llegue a los celulares que ya habían cacheado la versión anterior de hoy.

### 📂 Archivos modificados
- `web/css/styles.css` (`.dashboard-header` reestructurado en `@media (max-width: 768px)`).
- `web/admin.html` (placeholder `mapCount`, toast de error en la carga de estadísticas).
- `web/index.html`, `web/login.html`, `web/dashboard.html`, `web/asistente.html`, `web/admin.html` (versión del link de `styles.css`).

## 📅 [2026-08-29] — El botón "Registrar mascota" se veía gris (no era CSS): el Tema visual guardado en BD estaba en gris; se agrega versión al CSS para evitar caché viejo en celular

### 🐛 No era un bug de layout — el color del sitio estaba mal guardado en la base de datos
El usuario reportó (con captura desde el celular) que el botón "+ Registrar mascota" en `asistente.html` se veía "hueco"/gris en vez del naranja institucional, mientras que el botón secundario de al lado ("Cambiar persona") se veía normal. La diferencia entre un botón primario (usa `--orange`) y uno secundario (no lo usa) fue la pista: se revisó `padron_tema_config` en la tabla `site_config` y su color guardado era **`#b5b5b5`** (gris), no `#F27A00` (el naranja oficial de El Grullo). `web/js/tema.js` (incluido en las 5 páginas) sobreescribe `--orange`/`--orange-dark`/`--orange-light`/`--orange-pale` y los degradados de marca con ese valor guardado — así que **todo** el sitio (no solo ese botón) estaba renderizando en gris: botones primarios, degradados del hero/login/sidebar, badges, etc. Es casi seguro que quedó así de alguna prueba anterior del selector "Tema visual" (Configuración sitio → Tema) que nunca se revirtió en el servidor.

**Corrección:** se actualizó directamente en la base de datos local `padron_tema_config.color` de vuelta a `#F27A00`, conservando el resto de la configuración (tipografía, animaciones, bordes redondeados) tal cual estaba. **Pendiente:** si esta misma prueba se hizo alguna vez contra HostGator, revisar ahí también cuando se retome el despliegue — de momento no aplica porque el sitio en producción no está conectado todavía.

### 🔧 Versión en el link del CSS, para que el celular no siga mostrando cambios viejos
Al revisar la misma captura, el subtítulo del encabezado ("Busca o registra al ciudadano...") seguía apareciendo aunque ya se había ocultado en celular en el cambio anterior de este mismo día — el celular estaba mostrando una copia en caché de `styles.css`, no la más reciente. Se agregó `?v=20260829` al `<link>` de `css/styles.css` en las 5 páginas que lo cargan; hay que subir ese número (fecha del día, o cualquier valor distinto) cada vez que se toque `styles.css` de forma visible, para forzar que el navegador (sobre todo en celular, donde no es tan fácil hacer un "hard refresh") pida el archivo de nuevo en vez de reusar el viejo.

### 📂 Archivos modificados
- `web/database` (BD local, no versionada en git) — `site_config.padron_tema_config` corregido.
- `web/index.html`, `web/login.html`, `web/dashboard.html`, `web/asistente.html`, `web/admin.html` — `?v=20260829` agregado al link de `styles.css`.

## 📅 [2026-08-29] — Corrección de layout en celular: panel admin ("Datos"), encabezados y formularios en modales

### 🐛 Diagnóstico a partir de capturas reales del celular del usuario
El usuario probó el sitio desde su celular (vía la IP de red, `192.168.0.230`) y reportó que varias pantallas se veían "cortadas"/mal centradas, sobre todo la pestaña "Datos" del panel admin, y pidió revisar a fondo que `asistente.html` (el flujo de registro asistido, el más usado en campo) se viera bien. Se investigó el CSS real (no solo las capturas) antes de tocar nada.

### 🐛 Bug real: `.datos-grid` (pestaña "Datos" del admin) recortaba su contenido en celular
`.datos-grid` (mapa + gráficas + tabla, 3 columnas en escritorio) sí bajaba a 1 columna en celular, pero seguía con una altura fija (`calc(100vh - 230px)`) y `overflow: hidden` pensados para el layout de 3 columnas — en celular, apilar las 3 secciones dentro de esa altura fija con recorte activo ocultaba la mayor parte del mapa, las gráficas y la tabla (los recuadros vacíos grandes de las capturas). Corregido: en el `@media (max-width: 768px)` propio de `admin.html`, `.datos-grid` ahora usa `height: auto`/`overflow: visible`, y sus columnas internas (`.charts-col`, `.chart-box`, `.right-col`, `.padron-table-mini`) dejan de depender de `flex:1` sobre una altura que ya no existe.

### 🐛 Bug real (compartido): el encabezado de admin/asistente/dashboard se cortaba en celular
`.dashboard-header` (título + subtítulo + acciones a la derecha, compartido por `admin.html`, `asistente.html` y `dashboard.html`) no tenía tratamiento de celular más allá de reducir el padding: el subtítulo largo ("Mapa de mascotas · Gráficas · Seguimiento en tiempo real", etc.) envolvía en varias líneas, y el botón de la derecha (`.btn` tiene `white-space:nowrap` por diseño) no podía bajar de línea — con `body{overflow-x:hidden}` ya activo en todo el sitio, ese contenido simplemente quedaba cortado contra el borde de la pantalla. Corregido en `styles.css` (beneficia a las 3 páginas por igual): el subtítulo se oculta en celular (mismo criterio que ya usa el navbar con el suyo), y el encabezado ahora permite que las acciones bajen a su propia línea si hace falta.

### 🎨 Mejoras adicionales de celular (mismo `@media (max-width: 768px)` de `styles.css`)
- `.dashboard-content`: el padding fijo de 32px (nunca se reducía en celular) baja a 20px/16px — libera ancho útil en las 3 páginas de panel.
- `.form-row` (pares de campos lado a lado, ej. Nombre/Especie en el modal de registrar mascota de `asistente.html`): ahora se apila a 1 columna en celular — con 2 columnas fijas, cada campo quedaba muy angosto dentro de un modal que además resta su propio padding.
- `.modal-overlay`: padding reducido en celular para dejar más ancho útil al modal mismo.
- `asistente.html`: las tarjetas de resultado al buscar un ciudadano (nombre + datos + botón "Seleccionar") ahora permiten que el botón baje de línea si el texto es largo, en vez de forzar todo en una sola fila sin wrap.

### ✅ Revisado, sin cambios necesarios
`dashboard.html`, `login.html`, `index.html` y `mascota.html` se revisaron buscando el mismo tipo de problema (contenedores con alto fijo + `overflow:hidden`, filas sin `flex-wrap` con botones de ancho fijo) — no se encontró nada equivalente; de todas formas se benefician de las correcciones de `styles.css` al compartir `.dashboard-header`/`.form-row`. `mascota.html` no comparte `styles.css` (tiene su propio `<style>` autocontenido, ya documentado antes) pero su layout de una sola tarjeta centrada con `max-width` ya es responsivo por construcción, sin necesitar media queries.

### ⚠️ Pendiente / no se pudo verificar
No hay forma de abrir un navegador real en este entorno para confirmar visualmente el resultado — los cambios se basan en la lectura directa del CSS/HTML real (contrastada contra las capturas del celular), no en una prueba visual propia. Falta que el usuario confirme en su celular.

### 📂 Archivos modificados
- `web/css/styles.css` (`.dashboard-header`, `.dashboard-subtitle`, `.dashboard-content`, `.form-row`, `.modal-overlay` — dentro de `@media (max-width: 768px)`).
- `web/admin.html` (`.datos-grid` y columnas internas — dentro de su propio `@media (max-width: 768px)`).
- `web/asistente.html` (tarjetas de resultado de búsqueda con `flex-wrap`).

## 📅 [2026-08-29] — Rol "superadmin": `admin@remac.elgrullo.mx` ya puede otorgar el rol Admin desde el panel

### 🆕 Contexto
Hasta ahora, el rol `admin` **solo se podía crear directo en la base de datos, nunca desde la interfaz** — cualquier admin nuevo dependía de alguien con acceso a phpMyAdmin/MySQL. El usuario pidió una excepción controlada: que la única cuenta admin real del sistema (`admin@remac.elgrullo.mx`) se convierta en "superadmin" — la única cuenta capaz de convertir, desde el panel, a un Ciudadano o Asistente existente en Administrador. Los admins que ese superadmin cree después **no** heredan ese poder; siguen siendo admins normales, y revocar el rol admin sigue siendo solo por base de datos directa (fuera de alcance de este cambio, a propósito).

### 🔐 Base de datos
- Nueva columna `duenos.es_superadmin TINYINT(1) NOT NULL DEFAULT 0` (`schema.sql`), activada **solo a mano en la base de datos** — misma filosofía que "admin solo se crea directo en BD, nunca desde la interfaz".
- Migración aplicada manualmente en la base de datos local (`ALTER TABLE` + `UPDATE ... WHERE email = 'admin@remac.elgrullo.mx'`); **pendiente aplicarla también en HostGator** cuando se retome el despliegue — mismo patrón ya usado para la migración del rol `asistente`.
- `seed.sql` actualizado para que una instalación nueva desde cero ya nazca con el superadmin marcado.

### 🔧 Backend
- `requireAuth()` (`helpers.php`) ahora incluye `es_superadmin` en el `SELECT`, por lo que fluye automáticamente a través de `requireAdmin()`, `requireRole()` y `GET /auth?action=me`.
- Nueva `requireSuperAdmin()` en `helpers.php`, mismo patrón que `requireAdmin()`.
- Nuevo endpoint `POST /api/usuarios?action=promover-admin` (protegido con `requireSuperAdmin()`): convierte una cuenta existente (ciudadano o asistente) en admin. Nunca lee `rol`/`es_superadmin` del cliente — el `UPDATE` hardcodea `rol='admin'` como literal SQL, así que auto-otorgarse superadmin vía este endpoint es estructuralmente imposible. `UPDATE` con `WHERE` + `rowCount()` para ser seguro ante condiciones de carrera (doble clic, dos pestañas).
- **Caso límite real encontrado y bloqueado**: `?action=buscar-o-crear` crea ciudadanos sin correo ni contraseña a propósito (personas registradas por un asistente sin correo electrónico). El endpoint nuevo rechaza explícitamente promover una cuenta así (`email`/`password_hash` nulos) — de lo contrario se crearía un "admin fantasma" que nunca podría iniciar sesión.
- `auth.php` (login) ahora también devuelve `es_superadmin` en la respuesta.

### 🎨 Frontend (`admin.html`, "Roles y Cuentas")
- La variable de sesión (antes local a `initAdmin()`) ahora es `currentUser`, a nivel de módulo, reutilizable en el resto del archivo — antes no se guardaba en ningún sitio global.
- Nuevo botón "⭐ Hacer administrador" por fila, visible solo si `esSuperAdmin(currentUser)` (cosmético — la protección real es el 403 del servidor) y solo en cuentas activas con correo propio.
- El aviso fijo de la pestaña ("Nunca se puede crear otra cuenta de Administrador desde aquí") se reemplaza dinámicamente por una nota explicando el poder de superadmin, solo para esa cuenta — para el resto de los admins el texto original sigue siendo cierto y no cambia.
- `api-client.js`: nueva `apiPromoverAAdmin(id)`, y `es_superadmin` agregado al objeto de sesión que guarda `apiLoginUser()`.

### ✅ Verificado
Migración aplicada en la base de datos local (confirmado por consulta directa: `admin@remac.elgrullo.mx` con `es_superadmin=1`). Pendiente que el usuario pruebe el flujo completo en el navegador (login como superadmin, promover una cuenta de prueba, confirmar que la cuenta ya-admin no ve el botón) antes de dar esto por cerrado.

### 📂 Archivos modificados
- `web/database/schema.sql`, `web/database/seed.sql`.
- `web/api/config/helpers.php`, `web/api/usuarios.php`, `web/api/auth.php`.
- `web/admin.html`, `web/js/api-client.js`.
- `CLAUDE.md` (matiza la regla de "admin nunca desde la interfaz" con esta excepción puntual).

## 📅 [2026-08-28] — Recuperación de contexto tras chat trabado; dominio nuevo detectado sin conectar y CORS desalineado

### 🚧 Contexto: la sesión anterior (~6 horas) se quedó en bucle sin responder
El usuario tuvo que abrir una conversación nueva porque la anterior (dedicada a resolver el despliegue en HostGator) dejó de responder. Se recuperó el contexto completo revisando el proyecto, este historial, el log de git y 5 capturas de pantalla del chat anterior que el usuario compartió — todas sobre el mismo tema en el que se quedó: falta el registro DNS en Cloudflare para `tumascota.elgrullo.mx`.

### 🔍 Hallazgo: hubo un cambio de dominio real que nunca quedó documentado
Comparando las capturas (hablan solo de `tumascota.elgrullo.mx`) contra el estado actual del código, se encontró que `web/api/config/database.php` (no rastreado por git) fue editado hoy mismo — después del último commit — cambiando `BASE_URL` a un dominio distinto: **`https://tumascota-elgrullo.com`**. Ese cambio no estaba documentado en ninguna entrada de este historial. Todo indica que, en algún punto de la sesión trabada, se optó por registrar un dominio nuevo directo en HostGator (usando el "dominio gratis" del plan) para evitar seguir esperando el acceso a Cloudflare — pero el cambio quedó a medias y sin registrar.

**Verificado en vivo (DNS + conexión) durante esta sesión:**
- `tumascota.elgrullo.mx` (dominio original): sigue sin existir en DNS (`NXDOMAIN`) — el registro A en Cloudflare **nunca se agregó**. Este punto sigue exactamente donde lo dejaron las capturas, sin ningún avance.
- `tumascota-elgrullo.com` (dominio nuevo): sí resuelve en DNS, pero apunta a `162.240.81.81` — una IP **distinta** a la del hosting real (`162.241.60.122`, confirmada en el primer intento de despliegue del 23 de agosto). No responde nada en el puerto 80 ni 443 (conexión rechazada / tiempo agotado, probado desde dos redes distintas). Esto indica que el dominio se registró en HostGator pero **nunca se conectó al hosting** — falta el mismo tipo de paso que ya se hizo antes para el dominio viejo: entrar a "Dominios" en HostGator y usar "Configurar dominio"/"Administrar" junto a `tumascota-elgrullo.com` para apuntarlo al paquete de hosting con `public_html` (donde ya están subidos los archivos del sitio).

### 🐛 Bug real encontrado y corregido: CORS seguía apuntando solo al dominio viejo
Aunque `BASE_URL` ya apuntaba al dominio nuevo, la lista `PRODUCTION_ORIGINS` (controla qué orígenes acepta la API — ver `setCorsHeaders()` en `helpers.php`) **nunca se actualizó**; seguía teniendo solo `tumascota.elgrullo.mx`. Esto significa que, aunque se termine de conectar `tumascota-elgrullo.com` al hosting, el sitio cargaría pero **todas las llamadas a la API fallarían silenciosamente por CORS** (el navegador las bloquea sin un aviso claro del servidor) — candidato muy probable para explicar buena parte del bucle de 6 horas sin resolución aparente. Se agregó `https://tumascota-elgrullo.com` y su variante `www` a `PRODUCTION_ORIGINS`, dejando también las entradas del dominio `.mx` por si se retoma ese camino más adelante.

### 🔒 Seguridad: `web/web.zip` (paquete de despliegue) estaba en staging de git con credenciales reales adentro
Al revisar `git status` se encontró `web/web.zip` (el paquete subido a HostGator el 23 de agosto) ya agregado al staging (`git add`), listo para el próximo commit. Se confirmó que ese zip **incluye `api/config/database.php` con la contraseña real de la base de datos de producción** — `.gitignore` excluye ese archivo cuando se sube suelto, pero no protegía contra que terminara empaquetado dentro de un `.zip`. Como el repositorio de GitHub del proyecto es público, commitear ese archivo habría expuesto la contraseña real de la base de datos. Se quitó del staging (`git restore --staged`) y se agregó `*.zip` a `.gitignore` para que no vuelva a pasar.

### 📌 Qué sigue pendiente (acciones fuera del código, solo las puede hacer el usuario)
1. **Decidir qué dominio usar de forma definitiva**: ¿seguir con `tumascota-elgrullo.com` (ya registrado en HostGator, solo falta conectarlo al hosting) o seguir esperando el acceso a Cloudflare para `tumascota.elgrullo.mx` (el dominio oficial del municipio, registrado en Namecheap)?
2. Si se sigue con `tumascota-elgrullo.com`: en HostGator → "Dominios" → "Configurar dominio" (o "Administrar") junto a ese dominio, y apuntarlo al mismo `public_html` donde ya están los archivos del sitio.
3. Si se retoma `tumascota.elgrullo.mx`: sigue faltando el registro DNS tipo A (`tumascota` → `162.241.60.122`, proxy de Cloudflare desactivado) en la cuenta de Cloudflare de `elgrullo.mx` — pendiente identificar quién tiene acceso (Informática Municipal o quien haya contratado el dominio).

### 📂 Archivos modificados
- `web/api/config/database.php` (no se sube a git) — `PRODUCTION_ORIGINS` actualizado con el dominio nuevo.
- `.gitignore` — se agrega `*.zip` para evitar que paquetes de despliegue con credenciales vuelvan a quedar en staging.
- `HISTORIAL_CAMBIOS.md` (este registro).

## 📅 [2026-08-25] — El panel admin se trababa con volumen real; tarjetas KPI y tablas ordenables/paginadas

### 🐛 Diagnóstico: "Datos del Padrón" se trababa y el mapa quedaba inutilizable
Con las ~20,000 cuentas y ~30,000 mascotas de prueba cargadas (ver entrada de carga de datos), el panel admin se congelaba al abrir "Datos" y el mapa quedaba amontonado de marcadores imposibles de tocar. Causas reales encontradas:
1. `initMap()` dibujaba **un marcador de Leaflet por cada mascota** (hasta 30,000), sin agregación — y el diccionario `colonias` de `admin.html` tenía solo 5 entradas falsas ("Centro", "El Sabino"...) que no coincidían con las colonias reales, así que casi todos los marcadores caían amontonados en el mismo punto.
2. `renderSeguimiento(allPets)` se ejecutaba **siempre al cargar el panel**, construyendo miles de tarjetas HTML pesadas en una pestaña que ni siquiera estaba visible, bloqueando el hilo principal antes de que "Datos" terminara de pintarse.
3. Las tablas de "Usuarios" y "Roles y Cuentas" tenían el mismo problema latente (listaban `allUsuarios`/`allCuentas` completos sin límite) — no se había disparado porque el usuario no las había abierto todavía con el volumen de prueba cargado.

**Corrección:**
- `initMap()` ahora agrega mascotas por colonia usando `/api/stats` (mismo patrón que el mapa público de `index.html`) — como máximo ~16 marcadores, sin importar si hay 8 o 300,000 mascotas. Se corrigió también el diccionario `colonias` de `admin.html` para que use el catálogo real de 16 colonias.
- `renderSeguimiento()` ahora es perezoso (solo se construye al abrir la pestaña "Seguimiento", vía el mismo patrón `_mapInit`/`_seguimientoInit`), y limita a 60 tarjetas por vista con aviso de "mostrando X de Y — usa la búsqueda".
- Tablas de "Usuarios" y "Roles" reescritas con paginación real (25 filas por página, con botones Anterior/Siguiente) en vez de listar todo de golpe.

### 🎨 Tarjetas KPI y tablas ordenables (inspirado en shadcn/ui, sin dependencias nuevas)
El usuario pidió analizar un dashboard hecho con shadcn/ui + React + Vite para ver qué se podía "agregar". Ese stack requiere Node.js y build step — incompatible con HostGator (hosting compartido, sin SSH ni Node) y con la arquitectura sin build de REMAC — así que en vez de adoptar el repo, se llevó su lenguaje visual a CSS/JS vanilla:
- **Tarjetas KPI** nuevas arriba del mapa en "Datos": mascotas registradas (con desglose perro/gato), familias registradas, vacunados (con % del padrón), nuevos este mes. Alimentadas por `/api/stats`, ya cargado. Valores con formato compacto (`compactNum()`: 1,284 / 12.9K / 4.2M).
- Tablas de "Usuarios" y "Roles" ahora tienen **encabezados ordenables** (clic para ordenar asc/desc, con flecha indicadora) además de la paginación — mismo patrón visual (`.data-table`, header fijo/sticky) reutilizado entre ambas.

**Verificación:** se corrió `admin.html` real vía Chrome headless (con sesión inyectada por token de la API) para confirmar que el JS nuevo carga sin errores en consola — no fue posible tomar una captura de pantalla utilizable en este entorno (permisos de sandbox), así que la revisión visual final la hizo el usuario directamente en su navegador.

**Archivos modificados:** `web/admin.html` (CSS de `.kpi-row`/`.data-table`, HTML de `sec-datos`/`sec-usuarios`/`sec-roles`, y JS: `initMap()`, `colonias`, `renderSeguimiento()`, `showAdmin()`, `renderUsuariosTable()`/`filterUsuarios()`, `renderRolesTable()`/`filterRoles()`, más `sortRows()`/`updateSortIndicators()`/`renderPagerFooter()`/`compactNum()`/`renderKpiRow()` nuevas).

## 📅 [2026-08-23] — Primer intento real de despliegue: base de datos y archivos subidos, bloqueado por DNS

### ✅ Completado en el servidor de HostGator
- Base de datos `ferna814_Mascotas` creada (Database Wizard), usuario `ferna814_remac` con todos los privilegios.
- `web/database/schema.sql` importado correctamente (7 tablas: `duenos`, `mascotas`, `campanas`, `articulos`, `folio_counter`, `site_config`, y una más).
- Todos los archivos de `web/` (excepto `.htaccess` y `database/`) subidos y extraídos en `public_html`.
- `public_html/.htaccess` corregido a mano: se conservó el bloque `# php -- BEGIN/END cPanel-generated handler, do not edit` (fija PHP 8.4) y se agregaron las reglas del proyecto después, sin pisarlo.
- `web/api/config/database.php` de producción subido con `DB_NAME` corregido a `ferna814_Mascotas`.

### 🚧 Bloqueado: `tumascota.elgrullo.mx` no resuelve (DNS)
Visitar el dominio da `DNS_PROBE_FINISHED_NXDOMAIN`. Se investigó con WHOIS: `elgrullo.mx` está registrado en **Namecheap**, pero su DNS real vive en **Cloudflare** (no en HostGator, ni en ninguna de las opciones del asistente "Cambiar dominio" de HostGator). Falta que quien administre esa cuenta de Cloudflare (Informática Municipal, o quien haya contratado el dominio — no identificado aún) agregue un registro **A**: `tumascota` → `162.241.60.122`, con el proxy de Cloudflare desactivado (nube gris).

Se probó apuntar el dominio localmente vía el archivo `hosts` de Windows (como prueba temporal, sin depender del DNS público) — con eso el navegador sí llegó al servidor de HostGator, pero devolvió una página 404 genérica (la misma que da la IP `162.241.60.122` sola sin nombre de dominio), lo que sugiere que HostGator también necesita terminar de aprovisionar el vhost de Apache para este dominio del lado de ellos. Pendiente confirmar con soporte de HostGator en paralelo a resolver el DNS.

**Nota:** no se hicieron cambios de código en esta sesión — todo lo de esta entrada es configuración del servidor/DNS, documentado aquí para no repetir la investigación.

## 📅 [2026-08-22] — Preparación para subir a producción en HostGator (dominio real + CORS restringido)

### 🌐 Contexto
El usuario ya tiene el hosting activo en HostGator (`tumascota.elgrullo.mx`, Plan Personal) y quiere subir el sitio. Antes de eso se resolvieron los dos pendientes marcados como críticos en el análisis técnico del 2026-08-22 antes de esta entrada.

### 🔒 CORS restringido (antes aceptaba cualquier sitio del mundo)
`setCorsHeaders()` en `web/api/config/helpers.php` respondía siempre `Access-Control-Allow-Origin: *`, es decir, cualquier página web de internet podía llamar a la API de REMAC. Como el frontend de REMAC siempre llama a su propio dominio (`API_BASE_URL` en `api-client.js` se calcula con `window.location.origin`), esto nunca hacía falta. Ahora `setCorsHeaders()` solo refleja el origen si es localhost/red local (desarrollo) o si está en la nueva constante `PRODUCTION_ORIGINS` (definida en `database.php`).

### 🏠 Dominio de producción actualizado
`BASE_URL` en `database.php` (bloque de producción) apuntaba al subdominio temporal de pruebas de HostGator (`...misitiohostgator.com/remac-prueba`). Se actualizó a `https://tumascota.elgrullo.mx`, el dominio real ya activo en el hosting. Se agregó `PRODUCTION_ORIGINS` con ese dominio (con y sin `www`) y el subdominio de pruebas, por si todavía lo usan para verificar antes de apuntar el dominio final.

### 📄 Nuevo `web/.htaccess` (raíz del sitio)
No existía `.htaccess` en la raíz de `web/` (solo en `web/api/`). Se agregó uno con la regla de redirección forzada a HTTPS **comentada por default** — debe activarse manualmente solo después de confirmar que el certificado SSL del dominio ya funciona, para no dejar el sitio inaccesible si se activa antes de tiempo.

**Archivos modificados:**
- `web/api/config/database.php` (no se sube a git) — `BASE_URL` actualizado, `PRODUCTION_ORIGINS` agregado.
- `web/api/config/database.example.php` — mismo patrón reflejado en la plantilla, y `TOKEN_EXPIRY` sincronizado a 30 días (ya se había cambiado en el archivo real pero no en la plantilla).
- `web/api/config/helpers.php` — `setCorsHeaders()` ahora valida contra origen local o `PRODUCTION_ORIGINS` en vez de `*`.
- `web/.htaccess` — nuevo, redirección HTTPS lista pero desactivada hasta confirmar el SSL.

## 📅 [2026-08-22] — "Recordarme" funcional en login + fondo naranja del logo del navbar eliminado

### ✅ Checkbox "Recordarme" ahora controla la persistencia real de la sesión
Antes, el checkbox "Recordarme" existía en `login.html` pero ningún JS lo leía: toda sesión (marcada o no) se guardaba igual en `localStorage`, con un token válido 24h en el servidor sin importar la elección del usuario. Ahora:
- **Marcado** → la sesión se guarda en `localStorage` (sobrevive a cerrar el navegador).
- **Desmarcado** → la sesión se guarda en `sessionStorage` (se pierde al cerrar la pestaña/navegador; debe iniciar sesión de nuevo).

**Archivos modificados:**
- `web/api/config/database.php` — `TOKEN_EXPIRY` subido de 24h a 30 días (techo máximo para sesiones "recordadas"; las no recordadas mueren solas al cerrar la pestaña por vivir en `sessionStorage`).
- `web/js/api-client.js` — nuevo helper `_getSessionRaw()` que busca `padron_session` en `localStorage` o `sessionStorage`; `apiLoginUser()` acepta parámetro `remember` y guarda en el storage correspondiente (limpiando el otro); `apiLogout()` y `apiRequireSession()` ahora limpian la sesión en ambos storages.
- `web/login.html` — `handleLogin()` lee `document.getElementById('remember').checked` y lo pasa a `apiLoginUser()`.

### 🧹 Ícono eliminado de "Tips de salud animal" (portada y panel admin)
Se decidió no agregar selector de imagen/ícono para los artículos (se consideró usar Base64 igual que las fotos de mascotas, pero se optó por algo más simple y limpio): se quitó por completo el campo "Ícono" del formulario "Nuevo Artículo" en el admin y el emoji que aparecía en cada tarjeta de tip, tanto en la portada pública como en el listado del panel admin. Ahora las tarjetas muestran solo título y extracto del contenido.

**Archivos modificados:**
- `web/index.html` — quitado `<span class="article-icon">` de `renderArticles()`.
- `web/admin.html` — quitado el campo `art-icono` del formulario, su render en `renderAdminArtList()`, y sus referencias en `saveArticulo()`, `resetArticulo()` y `editarArticulo()`.

No requirió cambios de base de datos ni de `web/api/contenido.php`: la columna `imagen_icono` sigue existiendo con su valor por defecto (`📄`), simplemente ya no se expone ni se edita desde la interfaz.

### ✅ El navbar de la portada ya refleja si hay sesión activa
Antes, `index.html` siempre mostraba "Iniciar sesión" en el navbar aunque el usuario ya tuviera sesión válida (token en `localStorage`/`sessionStorage`), lo que causaba que al hacer clic se le mandara de nuevo a `login.html` como si no hubiera iniciado sesión. Ahora, al cargar la portada, si hay una sesión guardada el botón cambia a "Mi cuenta" y enlaza directo al panel que corresponde según el rol (`admin.html`, `asistente.html` o `dashboard.html`).

**Archivos modificados:**
- `web/index.html` — nueva función `applyNavAuthState()` (llamada en `initIndex()`), e ids `nav-login-btn` / `nav-login-mobile` agregados a los enlaces de "Iniciar sesión" del navbar.

### 🎨 Fondo naranja del logo en la barra de navegación eliminado
Se quitó el fondo naranja del ícono del navbar en `index.html`, dejando visible solo el escudo del H. Ayuntamiento. Se verificó que `applyAppearanceConfig()` (personalización de íconos en el panel admin) solo modifica el contenido del ícono, nunca su fondo, así que la personalización sigue funcionando sin cambios.

**Archivos modificados:**
- `web/index.html` — quitado `background:var(--orange)` inline del `#nav-logo-icon`.
- `web/css/styles.css` — quitado `background: var(--orange)` de la regla `.navbar-logo .logo-icon`.

## 📅 [2026-08-22] — Análisis Técnico Completo del Proyecto REMAC

### 🔍 Revisión General del Estado del Proyecto
Se realizó un análisis integral de todos los archivos del proyecto para evaluar arquitectura, seguridad, calidad de código, UI/UX, base de datos y documentación.

**Archivos analizados:**
- `web/api/auth.php`, `mascotas.php`, `usuarios.php`, `stats.php`, `settings.php`, `contenido.php`
- `web/api/config/database.php`, `helpers.php`
- `web/js/api-client.js`, `mock-data.js`, `tema.js`
- `web/database/schema.sql`, `seed.sql`
- `web/api/.htaccess`
- `CLAUDE.md`, `HISTORIAL_CAMBIOS.md`, `CUENTAS_PRUEBA.md`

**Fortalezas identificadas:**
1. Stack correcto para HostGator (HTML + CSS Vanilla + JS + PHP nativo + MySQL, sin build steps).
2. Detección automática de entorno local/producción en `database.php`.
3. URL dinámica de API en `api-client.js` — funciona en cualquier dominio sin editar código.
4. Autenticación por Bearer Token con expiración 24h.
5. Passwords con `password_hash()` (bcrypt) y PDO prepared statements — protegidos contra SQL Injection.
6. Folio REMAC-GRU-XXXXX generado con transacción atómica (sin colisiones de concurrencia).
7. Sistema de tema dinámico (`tema.js`) sincronizado entre admin y todos los visitantes.
8. Changelog de 60 KB — documentación muy detallada.

**Problemas críticos detectados (acción requerida antes de producción):**
1. ⚠️ Credenciales de BD de producción (HostGator) en texto plano en `database.php` — mover a variables de entorno.
2. ⚠️ CORS con `Access-Control-Allow-Origin: *` — restringir al dominio del sitio en producción.

**Mejoras recomendadas:**
- Agregar `filter_var($email, FILTER_VALIDATE_EMAIL)` en `auth.php`.
- Normalizar números de teléfono antes de buscar en `buscar-o-crear`.
- Agregar paginación (LIMIT/OFFSET) en listado de mascotas.
- Redirect HTTP → HTTPS en `.htaccess`.
- Extraer JS inline de `admin.html` (194 KB) a `js/admin.js`.
- Migrar `foto_url` de Base64 en BD a archivos en servidor.

**Evaluación final: ⭐⭐⭐⭐ (4.2/5)** — Proyecto sólido, bien pensado para su contexto. Listo para pruebas en producción tras resolver credenciales.

**Archivos modificados:** `HISTORIAL_CAMBIOS.md` (solo registro)

## 📅 [2026-08-21] — "Roles" ahora muestra TODAS las cuentas, no solo Asistente

### 🔧 Petición del usuario tras probar el panel
La pestaña "Roles" solo mostraba cuentas de Asistente. El usuario pidió ver ahí también a los ciudadanos (con y sin correo) para poder activarlos/desactivarlos desde el mismo lugar, en vez de tener que ir a la pestaña "Usuarios" aparte.

**Cambios:**
- `GET /api/usuarios?rol=todos` (nuevo, solo admin) — devuelve ciudadanos y asistentes juntos, incluyendo el campo `rol` de cada uno (antes no se regresaba).
- La pestaña "Roles" ahora se llama **"Roles y Cuentas"**, tiene su propio buscador (por nombre/correo/teléfono), y cada fila muestra una etiqueta de color según el rol (Asistente en naranja, Ciudadano en azul). Activar/desactivar funciona igual para cualquiera de los dos.
- La pestaña "Usuarios" (solo ciudadanos) se dejó intacta — "Roles" es ahora un superconjunto, no la reemplaza.

### 🧪 40 cuentas de prueba agregadas (solo en la base de datos LOCAL)
A petición del usuario, para comprobar que la tabla se ve y funciona bien con volumen real: 25 ciudadanos con correo, 10 sin correo, y 5 asistentes adicionales, todas con la contraseña de prueba `12345`. Quedan documentadas en `CUENTAS_PRUEBA.md` (no se sube a git) con instrucciones para borrarlas antes de producción.

### 📂 Archivos modificados
- `web/api/usuarios.php` (`?rol=todos`, `rol` agregado al SELECT).
- `web/admin.html` (buscador y tabla de "Roles" ampliados, sección renombrada).

## 📅 [2026-08-20] — La persona seleccionada y las mascotas registradas se perdían al recargar `asistente.html`

### 🐛 Reportado por el usuario probándolo en vivo
Después de registrar una mascota correctamente, si se recargaba la página (sin querer, o para empezar de nuevo), tanto la persona seleccionada como la lista de "mascotas registradas hoy" desaparecían — vivían solo como variables en memoria de esa pestaña. Esto obligaba a volver a buscar a la misma persona para registrarle otra mascota.

**Corrección:** se guardan en `localStorage` (por asistente, usando su propio id, para que si otra persona usa el mismo equipo no vea información ajena) tanto la persona seleccionada como la lista de mascotas registradas, y se restauran automáticamente al abrir la página. Se agregó un botón "Limpiar lista" para reiniciar manualmente (por ejemplo al empezar un turno nuevo), y ese estado se borra automáticamente al cerrar sesión.

**Nota:** no hacía falta recargar la página para registrar una segunda mascota a la misma persona — el botón "+ Registrar mascota" ya se quedaba disponible sin salir de la pantalla. Este arreglo cubre el caso de una recarga accidental o intencional, no cambia el flujo normal.

### 📂 Archivos modificados
- `web/asistente.html`.

## 📅 [2026-08-19] — Tres bugs reales encontrados al probar el rol Asistente en vivo

Al probar `asistente.html` en un navegador real (no solo en las pruebas automatizadas) aparecieron 3 problemas que las pruebas anteriores no habían detectado:

### 🐛 1. "apiBuscarOCrearCiudadano is not defined" al registrar una persona
`asistente.html` cargaba el script de jsPDF (desde un CDN externo) **antes** de `js/api-client.js`. Los `<script src>` sin `async`/`defer` se ejecutan en orden y cada uno bloquea al siguiente hasta terminar de descargarse — si la conexión al CDN tarda o falla, todo el código propio del sitio que viene después (incluida la función que faltaba) simplemente no llega a cargarse a tiempo, aunque el HTML ya se vea completo y "usable". Se reordenaron los scripts para que el código propio cargue primero, y jsPDF (que solo hace falta hasta el paso de "Descargar acta", mucho después) se movió al final con `defer`. Se corrigió el mismo riesgo en `dashboard.html` (tenía el mismo patrón con jsPDF y QRCode.js), aunque ahí no se había reportado el error.

### 🎨 2. El campo "Domicilio" se veía oscuro/nativo y "Colonia" blanco/propio
"Colonia" ya usaba el buscador propio del sitio (`.combo`), pero "Domicilio" seguía usando el `<datalist>` nativo del navegador — que no se puede personalizar con CSS y toma el tema claro/oscuro del sistema operativo, no el del sitio. Se reemplazó por el mismo componente `.combo`, ahora con una variante de solo-sugerencia (`initComboSugerencias()`) que permite seguir escribiendo libremente (para agregar el número de casa) en vez de forzar una selección exacta. Aplicado también en "Mi perfil" (`dashboard.html`), que tenía el mismo problema.

### 📐 3. La lista de Colonia "se veía mal posicionada"
No era un bug de posición (la lista sí abre pegada a su campo) sino de superposición: si el menú de "Domicilio" quedaba abierto y luego se enfocaba "Colonia" (el campo de justo abajo), ambos menús desplegables quedaban abiertos a la vez y el de arriba tapaba visualmente al de abajo, dando la impresión de que algo se había movido. Se agregó `_cerrarOtrosCombos()`: al abrir cualquier buscador desplegable, cualquier otro que esté abierto se cierra automáticamente.

### 📂 Archivos modificados
- `web/asistente.html`, `web/dashboard.html` (orden de scripts, combo de Domicilio, coordinación entre combos).

## 📅 [2026-08-19] — Nuevo rol "Asistente": registro de mascotas para ciudadanos sin correo electrónico

### 🆕 Contexto
El Ayuntamiento pidió una forma de registrar mascotas de ciudadanos que no tienen correo electrónico (por ejemplo, personas adultas mayores), tanto en ventanilla como en campañas fuera de la oficina (ej. una jornada de vacunación). Hasta ahora la única forma de entrar al padrón era que el propio ciudadano se creara una cuenta con correo y contraseña — no había manera de registrar a alguien sin correo.

### 🔐 Base de datos
- `duenos.rol` ahora acepta tres valores: `'ciudadano'`, `'admin'`, **`'asistente'`**.
- `duenos.email` ya no es obligatorio (antes `NOT NULL UNIQUE`, ahora `NULL` permitido) — un ciudadano registrado por un asistente puede existir sin correo y sin poder iniciar sesión él mismo (no tiene con qué).
- Migración aplicada manualmente en la base de datos local; **pendiente aplicarla también en HostGator** cuando se retome el despliegue.

### 🧑‍💼 ¿Qué puede hacer un Asistente?
- Buscar a cualquier ciudadano (con o sin cuenta propia).
- Registrar a una persona sin correo (nombre, teléfono, domicilio, colonia) si no la encuentra — con protección para no duplicarla si ya existía (busca primero por teléfono).
- Registrarle una mascota (mismo formulario con foto que usa cualquier ciudadano).
- Descargar el acta oficial en PDF.
- **No puede**: ver el panel administrativo completo, editar o dar de baja mascotas después de registrarlas, ni administrar el resto del sitio. Es un rol acotado a propósito.

### 🔑 ¿Quién crea cuentas de Asistente?
Solo el administrador, desde una pestaña nueva **"Roles"** en el panel admin (separada de "Usuarios", que sigue siendo solo para gestionar ciudadanos). El formulario de creación **nunca permite elegir el rol Administrador**, aunque se manipule la petición directamente al servidor — es una validación del backend, no solo del formulario.

### 🐛 Dos bugs reales corregidos de paso
La tabla de "Usuarios" en el admin se habría roto en cuanto existiera el primer ciudadano sin correo: el buscador (`u.email.toLowerCase()`) habría lanzado un error de JavaScript y dejado de funcionar para todos, y la columna de contacto habría mostrado literalmente la palabra `null`. Corregido antes de que pudiera pasar en producción.

### ✅ Verificación
Probado de punta a punta (vía API y visualmente): creación de cuenta de asistente, rechazo explícito al intentar crear un "admin" desde ahí, búsqueda de ciudadanos con y sin cuenta, registro de un ciudadano sin correo (con deduplicación por teléfono), registro de una mascota a su nombre, acta en PDF con los datos correctos del dueño (no de la asistente), y las restricciones de seguridad (un ciudadano no puede forzar el registro de una mascota a nombre de otro; un asistente no puede ver el listado completo de mascotas ni las cuentas de otros asistentes).

### 📂 Archivos modificados / creados
- `web/database/schema.sql` (`rol` con 'asistente', `email` opcional).
- `web/api/config/helpers.php` (nueva `requireRole()`).
- `web/api/usuarios.php` (reestructurado: `?action=crear-cuenta`, `?action=buscar-o-crear`, `?rol=asistente`).
- `web/api/mascotas.php` (POST acepta `dueno_id` explícito para admin/asistente).
- `web/js/api-client.js` (`apiCrearCuentaUsuario`, `apiBuscarOCrearCiudadano`).
- `web/login.html` (redirección de 3 vías según rol).
- `web/dashboard.html`, `web/admin.html` (guardas de redirección para el rol asistente).
- `web/admin.html` (pestaña "Roles", modal "Nueva cuenta", corrección de los 2 bugs de "Usuarios").
- `web/asistente.html` (nuevo — página completa del flujo de registro asistido).

## 📅 [2026-08-18] — Verificación de disponibilidad del subdominio tumascota.elgrullo.com

### 🌐 Verificación DNS y HTTP de tumascota.elgrullo.com
- Se realizó la consulta DNS (`Resolve-DnsName`) confirmando que el subdominio `tumascota.elgrullo.com` ya resuelve a las direcciones IP `76.223.54.146` y `13.248.169.48` (mismas IPs que el dominio raíz `elgrullo.com`).
- Se verificó la respuesta HTTP (`200 OK`), confirmando que la zona DNS está activa y apuntando a la infraestructura de hosting.
- Se documentaron las indicaciones para asociar el subdominio al directorio del proyecto REMAC en cPanel / HostGator y la recomendación de seleccionar la opción "Outro" (Otro) en el asistente de HostGator.

### 📂 Archivos modificados / creados
- Ningún archivo de código modificado (orientación técnica en asistente de HostGator).

---

## 📅 [2026-08-18] — El color del "Tema visual" no se aplicaba, y nuevo buscador de Colonia

### 🐛 Bug real: "Tema visual" en Configuración del sitio no cambiaba nada
El admin podía elegir un color y una tipografía, ver una vista previa dentro del propio panel, y guardar — pero eso era todo. `saveTema()` solo escribía en `localStorage`, nunca se mandaba al servidor, y **ninguna otra página del sitio (portada, login, dashboard) leía esa configuración**. El botón decía "Recarga el portal para verlo", pero recargar no cambiaba nada porque no había código que aplicara el color en ningún lado.

**Corrección:**
- `saveTema()` ahora sí guarda en el servidor (como Reglamento/FAQ/Avisos), y el panel admin recuerda el tema guardado la próxima vez que se abre (antes tampoco hacía eso).
- Se creó `web/js/tema.js`, incluido en `index.html`, `login.html`, `dashboard.html` y `admin.html`: lee el color guardado y sobreescribe las variables `--orange`/`--orange-dark`/`--orange-light`/`--orange-pale` de `styles.css` para **cualquier visitante**, no solo en el navegador del admin. También aplica el interruptor de "Bordes redondeados".
- Verificado cambiando el color a uno de prueba y confirmando por captura de pantalla que toda la portada (botones, logo, fondo del hero, franja inferior) cambia de verdad; luego se regresó al naranja oficial.
- **Pendiente, no resuelto en este cambio:** la Tipografía (Inter/Outfit/Roboto/etc.) no se aplica todavía — el sitio no carga ninguna fuente externa real (son solo nombres sin `@font-face`), así que cambiar la selección no tendría ningún efecto visual aunque se "aplicara". El Modo oscuro tampoco existe como hoja de estilos. `mascota.html` (ficha pública QR) no usa las variables compartidas de `styles.css`, así que el color de tema no le aplica.

### 🎨 Mejora: buscador de Colonia en vez del `<select>` nativo
El selector de Colonia en "Mi perfil" usaba el `<select>` nativo del navegador, que no se puede personalizar visualmente y se veía "feo" según lo reportado. Se reemplazó por un componente propio (`.combo`): un campo de texto que al enfocarse despliega una lista con scroll, con las mismas 38 colonias reales, filtrable escribiendo, con el mismo estilo del resto del sitio (bordes, colores, sombra). El campo real que se guarda sigue siendo el mismo (`#perfil-colonia`, ahora oculto), así que no cambió nada del guardado de perfil. Probado con filtro de texto, selección con clic y en ancho de celular (390px).

### 📂 Archivos modificados / creados
- `web/js/tema.js` (nuevo).
- `web/index.html`, `web/login.html`, `web/dashboard.html`, `web/admin.html` (incluyen `tema.js` y llaman `aplicarTemaVisual()`).
- `web/admin.html` (`saveTema()`, `resetTema()`, nueva `loadTemaFromServer()`, `padron_tema_config` agregado a `SERVER_CONFIG_KEYS`).
- `web/dashboard.html` (nuevo componente `.combo` para Colonia, función reutilizable `initCombo()`).
- `web/css/styles.css` (estilos `.combo`/`.combo-list`/`.combo-option`).

## 📅 [2026-08-17] — Catálogo real de colonias y calles de El Grullo en "Mi perfil"

### 🐛 El selector de Colonia solo tenía 4 opciones de ejemplo
En "Mi perfil" (`dashboard.html`), el campo Colonia era un `<select>` con solo 4 valores inventados (Centro, El Sabino, La Loma, Las Flores), y "Domicilio" era un texto libre sin ninguna ayuda para escribir una calle real del municipio.

**Corrección:** se investigaron las colonias y calles reales de El Grullo, Jalisco (directorios públicos de códigos postales y callejeros) y se creó `web/js/el-grullo-data.js` con:
- **38 colonias reales** con su código postal, usadas para llenar el `<select>` de Colonia dinámicamente.
- **208 calles reales** del municipio, usadas como sugerencias de autocompletado (`<datalist>`) en el campo Domicilio — el usuario puede escribir libremente (para agregar el número de casa) y ver sugerencias reales mientras teclea.

Ambos controles siguen siendo elementos nativos de HTML (`<select>`, `<input list>`), así que en celular abren el picker/lista nativa del sistema operativo — no fue necesario código adicional para que funcionen bien en móvil.

**Nota importante:** el mapa del censo (tanto en `index.html` como en `admin.html`) usa un catálogo *distinto y más chico* de colonias con coordenadas aproximadas para dibujar los pines — ese no se tocó en este cambio, porque ampliarlo a las 38 colonias reales requiere conseguir la ubicación (latitud/longitud) de cada una, no solo el nombre. Queda pendiente si se necesita.

### 📂 Archivos modificados / creados
- `web/js/el-grullo-data.js` (nuevo — catálogo de colonias y calles).
- `web/dashboard.html` (Colonia y Domicilio ahora se llenan con datos reales).

## 📅 [2026-08-14] — Aviso de Privacidad real, Avisos/Eventos ya persisten y se muestran al público

### 📄 Aviso de Privacidad (antes era un enlace muerto)
El checkbox obligatorio del registro ("Acepto el Aviso de Privacidad") enlazaba a "#" — a ningún lado. Comparando contra los wireframes originales del proyecto, esa página sí es un requerimiento real (identidad del responsable, datos que se recaban, finalidad del tratamiento). Se agregó como modal en `login.html`, con contenido real específico de REMAC/H. Ayuntamiento de El Grullo (no genérico): responsable, domicilio, datos recabados, finalidad, y derechos ARCO.

### 🐛 Avisos y Eventos del admin no persistían en el servidor
A diferencia de Reglamento/FAQ/Contactos (ya corregidos antes), las pestañas "Avisos y promociones" y "Eventos próximos" del admin guardaban los datos **solo en memoria del navegador** (ni siquiera en localStorage) — se perdían por completo al recargar la página. Además el botón "✏️ Editar" de Avisos no hacía nada real (solo mostraba un mensaje), el botón "Eliminar" quitaba la tarjeta de la pantalla sin quitarla de los datos, y la imagen subida para el banner de un aviso nunca se guardaba. `eventosData` también traía 2 eventos de ejemplo escritos directo en el código, como si fueran reales.

**Corrección:** ambas listas ahora se guardan en `localStorage` y se sincronizan con el servidor (`padron_avisos`, `padron_eventos` en `site_config`), exactamente igual que Reglamento/FAQ. Se agregó edición real de avisos (con botón "Cancelar"), se corrigió el borrado para que sí actualice los datos, y ahora sí se guarda la imagen del banner subida.

### 🆕 La portada pública nunca mostraba Avisos ni Eventos
Al revisar el alcance completo, se encontró que `index.html` **nunca tuvo una sección que mostrara** lo publicado en esas dos pestañas — ni siquiera antes de este arreglo. Se agregó:
- Los avisos ahora se insertan en la misma sección "Avisos y campañas" (el encabezado ya prometía ambas cosas), usando la imagen subida como fondo de la tarjeta si existe, o el ícono/color si no.
- Nueva sección pública "Próximos eventos" (se oculta sola si no hay eventos publicados), con tarjetas estilo calendario (mes/día + lugar + hora).

### 🔧 Corrección de infraestructura: `database.php` detecta el entorno solo
Durante las pruebas de este cambio se encontró un bug propio: `database.php` tenía las credenciales reales de HostGator puestas a mano, lo que rompía silenciosamente cualquier prueba local en XAMPP (login fallando sin explicación clara). Se corrigió para que el archivo detecte automáticamente si corre en local (`localhost`/`192.168.x.x`) o en HostGator, y use las credenciales correctas en cada caso — ya no hay que ir cambiando esto a mano nunca más.

### 📂 Archivos modificados
- `web/login.html` (modal de Aviso de Privacidad + función `openModal`/`closeModal`).
- `web/admin.html` (persistencia real de Avisos/Eventos, edición real de avisos, botón cancelar).
- `web/index.html` (renderiza avisos dentro de "Avisos y campañas", nueva sección "Próximos eventos").
- `web/css/styles.css` (estilos `.event-card` y responsivo en móvil).
- `web/api/config/database.php` (detección automática de entorno local/producción).

## 📅 [2026-08-09] — Preparación para subir a HostGator de prueba: quitar accesos rápidos y proteger credenciales

### 🧹 Se quitó el bloque "Cuentas de prueba" del login
`login.html` mostraba dos botones ("👤 Ciudadano" / "🔧 Administrador") que rellenaban automáticamente el correo y contraseña de las cuentas de prueba, incluida la del admin. Tenía sentido en desarrollo, pero no debe verse en un sitio ya subido, aunque sea de prueba — cualquier visitante podía iniciar sesión como administrador con un clic. Se eliminó el bloque completo y la función `fillLogin()` que ya no se usaba. Las credenciales de esas cuentas se documentaron aparte en `CUENTAS_PRUEBA.md` (no se sube a git, ver abajo).

### 🔒 Corrección de seguridad: `database.php` con credenciales reales no debe estar en git
Al configurar la conexión a la base de datos real de HostGator, se detectó que `web/api/config/database.php` seguía siendo rastreado por git — y el repositorio de GitHub del proyecto es **público**. Subir ese archivo habría expuesto la contraseña real de la base de datos a cualquiera.

**Corrección:**
- Se sacó `database.php` del control de versiones (`git rm --cached`, el archivo se queda en el equipo local con los datos reales).
- Se agregó `web/api/config/database.php` al `.gitignore`.
- Se creó `web/api/config/database.example.php` (SÍ se sube a git) con valores de ejemplo/desarrollo, para que el repositorio siga documentando la estructura esperada sin exponer secretos reales.

### 📂 Archivos modificados / creados
- `web/login.html` (se quitó el bloque de cuentas de prueba y `fillLogin()`).
- `web/api/config/database.php` (ahora con las credenciales reales de HostGator; dejó de rastrearse en git).
- `web/api/config/database.example.php` (nuevo, plantilla pública sin secretos).
- `.gitignore` (agrega `database.php` y `CUENTAS_PRUEBA.md`).
- `CUENTAS_PRUEBA.md` (nuevo, no se sube a git — referencia local de cuentas/credenciales).

## 📅 [2026-08-07] — El Administrador Podía Terminar Viendo el Dashboard de Ciudadano (y Viceversa)

### 🐛 Bug: `dashboard.html` aceptaba sesión de cualquier rol
`dashboard.html` protegía la página con `apiRequireSession()` sin pedir un rol específico, así que cualquier sesión válida —incluida la de administrador— pasaba el chequeo. Si un admin llegaba ahí (por ejemplo desde el enlace "Mi dashboard" del pie de página, que no distingue el rol), el sidebar se veía como el de un ciudadano normal, pero la tarjeta de perfil de abajo mostraba "Administrador" porque sí traía los datos reales de esa sesión. Además, como el backend (`mascotas.php`) no filtra por dueño cuando el rol es admin, la sección "Mis mascotas" terminaba mostrando **las 6 mascotas de todo el padrón**, no las del usuario.

De paso se revisó `admin.html`, que si tenía el chequeo de rol correcto (`apiRequireSession('admin')`), pero con un efecto secundario duro: si un ciudadano llegaba ahí por error, `apiRequireSession()` le borraba la sesión guardada y lo mandaba a `login.html` — lo desconectaba por completo solo por abrir la página equivocada.

**Corrección:** ambas páginas ahora validan que exista una sesión válida (sin importar el rol) y, si el rol no corresponde a esa página, **redirigen a la página correcta sin tocar la sesión** — el admin que cae en `dashboard.html` rebota a `admin.html`, y el ciudadano que cae en `admin.html` rebota a `dashboard.html`, en ambos casos manteniendo la sesión intacta. Verificado con una prueba automatizada: inicio de sesión real de cada rol, navegación a la página del otro rol, y confirmación de que termina en la URL correcta con la sesión todavía activa.

### 📂 Archivos modificados
- `web/dashboard.html` (redirige a `admin.html` si la sesión es de administrador).
- `web/admin.html` (redirige a `dashboard.html` si la sesión es de ciudadano, sin cerrar sesión).

## 📅 [2026-08-07] — Indicadores de "Reglamento guardado" y "Contactos guardados" Eran Falsos

### 🐛 Bug: la barra de estado de "Configuración sitio" mentía sobre 2 de sus 5 secciones
El usuario preguntó por qué el ícono de la patita del hero no se veía en el portal aunque el panel de "Apariencia e íconos" mostraba uno. Al investigar se confirmó que la tabla `site_config` en la base de datos estaba completamente vacía (0 filas) — nunca se había guardado nada de esa sección, lo cual es correcto y ya lo indicaba el propio panel con "Apariencia (sin cambios)".

Pero se encontró un problema real de paso: los indicadores **"Reglamento guardado"** y **"Contactos guardados"**, a diferencia de Apariencia/Tema/SEO, estaban escritos como texto fijo directo en el HTML — siempre mostraban el punto verde de "guardado" sin importar si en verdad había algo persistido en el servidor, dando una falsa sensación de seguridad al administrador.

**Corrección:** ambos indicadores ahora son dinámicos como los otros tres: arrancan en gris ("Reglamento (sin cambios)" / "Contactos (sin cambios)") y solo cambian a verde ("guardado") cuando `saveReglamento()` o `saveSiteConfig()` (guardado de Contactos) se ejecutan con éxito en esa sesión del panel. Verificado con un arnés headless que simula guardar el Reglamento y confirma que el punto pasa de gris a verde justo en ese momento, mientras los demás siguen en gris hasta que también se guarden.

### 📂 Archivos modificados
- `web/admin.html` (`id="statusReglamento"` / `id="statusContactos"` dinámicos; actualización de estado dentro de `saveReglamento()` y `saveSiteConfig()`).

## 📅 [2026-08-07] — Corrección: el Menú Lateral se Rompía en PC tras el Arreglo Móvil

### 🐛 Bug introducido por la corrección anterior (menú deslizable móvil)
Al agregar el fondo oscuro (`sidebar-backdrop`) para el menú deslizable de celular, ese `<div>` se insertó como hijo directo de `.dashboard-layout` — el contenedor CSS Grid de 2 columnas (menú + contenido). Solo se le dio `position: fixed` **dentro** de la media query de celular; en pantallas de computadora ese `<div>` vacío no tenía ningún estilo, así que el navegador lo trataba como una tercera celda real del grid. Eso corría al menú lateral hacia la segunda columna (estirándolo a todo lo ancho) y empujaba el contenido principal (mapa, gráficas, tabla) fuera de la vista. En celular no se notaba porque ahí `position: fixed` sí sacaba ese `<div>` del flujo del grid.

**Corrección:** se movió el estilo base de `.sidebar-backdrop` (`position: fixed`, `display: none` por defecto) fuera de la media query, para que en cualquier tamaño de pantalla quede completamente fuera del flujo normal del documento y nunca participe del grid del layout. Verificado con una captura de escritorio (1600px) tras el cambio: el panel admin se ve completo y sin deformaciones.

### 📂 Archivos modificados
- `web/css/styles.css` (`.sidebar-backdrop` con `position:fixed` como regla base, no solo dentro de la media query móvil).

## 📅 [2026-08-07] — Menú Lateral Invisible en Celular al Iniciar Sesión (Dashboard y Panel Admin)

### 🐛 Bug crítico: tras iniciar sesión en celular, no había forma de navegar
El usuario probó en su celular real después de la corrección anterior: el login ya funcionaba, pero una vez dentro (como ciudadano o como administrador) el menú lateral (`sidebar`) simplemente desaparecía en pantallas angostas (`display:none` en la media query móvil) **sin dejar ningún botón para abrirlo de nuevo**. Un ciudadano no podía llegar a "Mi perfil" ni "Cerrar sesión"; un administrador no podía llegar a "Seguimiento", "Usuarios", "Nuevo artículo" ni "Configuración sitio" — quedaba atrapado en la primera sección.

**Corrección:** el menú lateral ahora es un panel deslizable ("off-canvas"), igual en `dashboard.html` y `admin.html` (comparten las mismas clases CSS):
- Se agregó un botón ☰ (ícono de línea, `.dashboard-mobile-toggle`) en el encabezado, visible solo en celular.
- El sidebar pasa a `position:fixed` fuera de la pantalla (`translateX(-100%)`) y se desliza a la vista (`.open`) al tocar el botón ☰, con un fondo oscuro semitransparente (`.sidebar-backdrop`) detrás.
- Se cierra tocando el fondo oscuro o al elegir cualquier opción del menú (`toggleSidebar(false)` dentro de `showSection()` / `showAdmin()`).
- En escritorio no cambia nada — el sidebar sigue fijo y visible como siempre.

**Verificación:** se probó con un arnés de iframe a 390px de ancho apuntando a `http://localhost`, con sesión real (login vía API, cuentas de prueba `maria@demo.com` y `admin@remac.elgrullo.mx`) para confirmar visualmente el estado cerrado y abierto en ambas páginas, sin desbordamiento horizontal (`scrollWidth` ≤ `innerWidth` del viewport simulado).

### 📂 Archivos modificados
- `web/css/styles.css` (sidebar off-canvas + backdrop en la media query móvil, botón `.dashboard-mobile-toggle`).
- `web/dashboard.html` (botón ☰, `id="sidebar"`, `sidebar-backdrop`, función `toggleSidebar()`).
- `web/admin.html` (mismos cambios que dashboard.html).

## 📅 [2026-08-07] — Corrección Crítica: el Sitio No Funcionaba desde el Celular (ni Otro Equipo)

### 🐛 Bug crítico: "Failed to fetch" al iniciar sesión desde el celular
**Causa:** `js/api-client.js` tenía la URL de la API escrita fija como `http://localhost/remac/api`. Eso solo funciona en la misma computadora — cuando el celular (o cualquier otro dispositivo) abre el sitio por la IP de la red (`http://192.168.0.230/...`), "localhost" para el celular es el propio celular, no la computadora donde corre el servidor. Por eso no cargaban las estadísticas (mostraba puros ceros) y el login fallaba con "Failed to fetch".

**Corrección:** `API_BASE_URL` ahora se calcula solo, a partir de dónde se cargó la página (`window.location.origin` + carpeta actual), en vez de un valor fijo. Funciona automáticamente en la computadora, en el celular por IP de red, y también en HostGator cuando se suba — **ya no hay que editar este archivo antes de subir a producción**, como sí se pedía antes.

### 🐛 Bug de diseño: el sitio se veía "roto" en pantallas de celular
Revisando capturas reales desde un celular, la portada (`index.html`) tenía scroll lateral y un hueco vacío enorme antes del contenido principal. Se encontraron y corrigieron 3 causas:
1. **Barra de navegación:** el logo completo (ícono + título + subtítulo) más los botones "Iniciar sesión"/"Registrar mascota" más el menú ☰ intentaban caber en una sola fila sin nunca colapsar — no cabían en una pantalla angosta. Ahora en celular se ve solo el ícono del logo, el botón dice "Registrar" (más corto), "Iniciar sesión" se mueve dentro del menú ☰, y ese menú ahora sí se despliega como un panel completo (antes no tenía estilo de menú móvil real).
2. **Sección "El Grullo cuida a sus mascotas":** las gráficas de barra "Por especie"/"Por estatus" tenían columnas de ancho fijo que no cabían a la mitad en pantallas angostas — esta fue la causa real del scroll lateral en todo el sitio. Ahora se apilan en una sola columna en celular.
3. **Hero:** forzaba una altura mínima de 88% de la pantalla (pensada para acomodar 2 columnas en escritorio) y centraba verticalmente el contenido corto de una sola columna dentro de eso, dejando un hueco vacío enorme arriba. Ahora en celular se ajusta al contenido real.
4. Se agregó `overflow-x: hidden` en `body` como protección general para que ningún elemento vuelva a forzar scroll lateral en el sitio.

### 📂 Archivos modificados
- `web/js/api-client.js` (`API_BASE_URL` dinámico).
- `web/css/styles.css` (`overflow-x:hidden`, navbar móvil, `.hero` en móvil).
- `web/index.html` (enlace "Iniciar sesión" dentro del menú móvil, texto corto del botón, clase para la grilla de gráficas).

## 📅 [2026-08-06] — Reemplazo de Emojis por Íconos de Línea Profesionales (Lucide, MIT)

### 🚀 Contexto
Para dar una imagen más institucional al portal, se reemplazaron los emojis (🐾💉📧, etc.) usados como íconos de interfaz por un set de íconos de línea consistente, tomado de **Lucide** (fork de Feather Icons, licencia MIT/ISC — libre, sin necesidad de atribución). Se descargó el SVG de cada ícono directamente del repositorio oficial y se incrustó en el código (sin depender de ningún servicio externo ni CDN), siguiendo el mismo enfoque "sin build" del resto del proyecto.

Alcance de esta pasada (acordado con el usuario): navegación, logos, íconos de pasos/tarjetas, botones principales y campos de formulario en las 5 páginas del sitio. Se dejaron sin tocar los emojis en mensajes de aviso/toast (✅❌⚠️) y en el cuadro de "cuentas de prueba" del login, por ser elementos de estado/temporales donde el emoji es apropiado incluso en apps profesionales.

### 🔧 Cambios
1. **Nueva clase CSS `.icon-line`** (`styles.css`, y una versión local en `mascota.html` que no comparte esa hoja de estilos): íconos de 1em, heredan el color del texto vía `currentColor`.
2. **`index.html`:** insignia del hero, ícono del hero, banner de aviso, los 3 pasos de "¿Cómo funciona?", botones de registro, logos del footer, contactos del footer (estáticos y dinámicos), fecha de campañas.
3. **`login.html`:** las 4 características del panel lateral, e íconos de correo/contraseña/nombre/teléfono en ambos formularios.
4. **`dashboard.html`:** ícono por especie (perro/gato/conejo/ave) centralizado en una sola constante reutilizada en 3 lugares, navegación lateral completa, tarjetas de estadísticas, acciones rápidas, botones de cada mascota (Ver/Editar/QR/Acta), subida de foto, historial de actividad, badge de rol y teléfono del perfil.
5. **`admin.html`:** navegación lateral principal (Datos/Seguimiento/Usuarios/Nuevo artículo/Configuración/Ver portal/Cerrar sesión) e ícono de especie en la tabla de seguimiento rápido.
6. **`mascota.html`:** avatar por especie, folio, sexo, color, señas particulares, dueño, teléfono, colonia, y los botones de llamar/enviar mensaje.
7. **Corrección adicional:** se encontraron y corrigieron 2 desbordamientos de botones (tarjeta de mascota en el dashboard) causados por el texto extra de los íconos — ahora los botones de acción de cada mascota se ajustan en 2 filas si no caben en una.

### 📂 Archivos modificados
- `web/css/styles.css` (`.icon-line`, ajuste de `.pet-card-actions`).
- `web/index.html`, `web/login.html`, `web/dashboard.html`, `web/admin.html`, `web/mascota.html`.

### ⚠️ Pendiente / fuera de este alcance
- Las 9 sub-pestañas de "Configuración sitio" en el admin (Reglamento, Avisos, Eventos, Contactos, FAQ, Apariencia, Municipio, Tema, SEO) siguen con sus emojis originales — son panel interno de personal, no público, y se dejaron para una pasada futura si se desea.
- Mensajes de aviso (toast) y textos dinámicos de estado conservan sus emojis intencionalmente.

## 📅 [2026-08-03] — Login Unificado: Ya No Hace Falta una Pestaña Separada de "Acceso Admin"

### 🐛 Problema reportado
Si un administrador escribía sus credenciales en la pestaña normal de "Iniciar sesión" (en vez de la pestaña separada "Acceso Admin"), el sistema lo dejaba entrar pero como si fuera un ciudadano cualquiera — lo mandaba a `dashboard.html` y no tenía acceso a nada de personalización ni al panel. Forzosamente tenía que saber que existía una pestaña distinta ("Acceso Admin") para poder entrar de verdad como administrador.

### 🔧 Corrección
1. Se eliminó la pestaña y el formulario separado de "Acceso Admin" en `login.html`. Ahora solo hay dos pestañas: **Iniciar sesión** y **Crear cuenta**.
2. El único formulario de login ahora revisa el `rol` que devuelve el servidor al autenticar y redirige automáticamente: `admin.html` si la cuenta es de administrador, `dashboard.html` si es ciudadano — sin que el usuario tenga que elegir de antemano qué tipo de cuenta es.
3. El cuadro de "Cuenta de prueba" ahora incluye también un botón de relleno rápido para la cuenta de administrador, dentro del mismo formulario unificado.
4. Se eliminó `apiLoginAdmin()` de `js/api-client.js` (ya no se usaba, `apiLoginUser()` cubre ambos casos).

### 📂 Archivos modificados
- `web/login.html` (tabs, formulario admin eliminado, `handleLogin()` unificado).
- `web/js/api-client.js` (`apiLoginAdmin` eliminada).

## 📅 [2026-08-01] — Corrección: Contadores del Hero Mostraban Número de Ejemplo al Cargar (Race Condition)

### 🐛 Bug corregido
Al cargar `index.html` por primera vez, los contadores del hero mostraban brevemente el número de ejemplo (342/289/187) en vez del dato real, y solo se corregían si el usuario bajaba y volvía a subir la página.

**Causa:** la animación de los contadores (`animateCounters()`) se disparaba de inmediato al cargar, vía `IntersectionObserver`, usando el `data-target` que trae el HTML por defecto (342/289/187) — porque el fetch real a `/api/stats` (`applyRealStats()`) es asíncrono y todavía no había respondido. La animación (con `setInterval`, dura ~1.2s) seguía corriendo en segundo plano y, aunque los datos reales llegaban y actualizaban el número un instante después, el `setInterval` viejo lo volvía a sobrescribir hasta terminar en el valor falso original. Al bajar y subir la página, el observer se disparaba de nuevo — esta vez con el dato ya correcto — y por eso "se arreglaba solo".

**Corrección:**
1. El `IntersectionObserver` de los contadores ya no se activa al cargar el script; se activa explícitamente en `initIndex()` **después** de que `applyRealStats()` obtiene los datos reales — así la primera (y única) animación ya arranca con el número correcto.
2. `animateCounters()` ahora cancela cualquier animación previa sobre el mismo elemento antes de iniciar una nueva (protección adicional para evitar que esto se repita si la función se llama más de una vez).

### 📂 Archivos modificados
- `web/index.html` (`animateCounters()`, `heroObs`, `initIndex()`).

## 📅 [2026-08-01] — Eliminación de Todos los Datos de Ejemplo (Fake Data) Restantes en Portada y Panel Admin

### 🚀 Contexto
Tras conectar el backend real, quedaban **varias secciones que seguían mostrando números de ejemplo fijos** (342, 289, 187, etc.) en vez de los datos reales del padrón, detectadas al revisar la portada a fondo. Se auditó todo el sitio en busca de estos casos y se corrigieron todos.

### 🔧 Corregido
1. **Sección "El Grullo cuida a sus mascotas" (`index.html`):** los 4 contadores (mascotas en el padrón, perros, gatos, % vacunadas) y las 2 gráficas de barras ("Por especie", "Por estatus") eran completamente estáticos (342/218/124/54%, 218/124, 338/4). Ahora se calculan en tiempo real desde `/api/stats`, con manejo de división entre cero cuando el padrón está vacío.
2. **Contador del mapa en el admin (`mapCount`):** mostraba "342" fijo; ahora muestra la cantidad real de mascotas cargadas.
3. **Gráfica "Enfermedades reportadas" (admin):** esta gráfica de pastel mostraba porcentajes de enfermedades **totalmente inventadas** (no existe ningún campo de enfermedades en la base de datos). Se reemplazó por una gráfica real de **cobertura de vacunación** (vacunados vs. sin vacunar), calculada a partir de las mascotas reales.
4. **"Distribución por raza" (admin):** la barra horizontal mostraba 6 razas con cantidades inventadas (Criolla 80, Otras 127, Labrador 45...) que sumaban exactamente 342 — el origen de casi todos los "342" repetidos por el sitio. Ahora se calcula agrupando las razas reales de `allPets`.
5. **Editor "Tarjetas de Estadísticas" del admin:** los campos numéricos para forzar manualmente los contadores del hero traían precargado 342/289/187 como si fueran el valor real; si el admin guardaba sin darse cuenta, volvía a introducir datos falsos. Ahora quedan vacíos con la indicación "Automático" — solo se usa un valor manual si el admin realmente escribe uno.

### 📂 Archivos modificados
- `web/index.html` (sección de estadísticas del censo con IDs + `applyRealStats()` extendido).
- `web/admin.html` (`mapCount`, gráfica de vacunación nueva, `renderMiniBar()` con datos reales, placeholders de contadores manuales).

## 📅 [2026-08-01] — Corrección de Bug Crítico al Registrar Mascotas, Estadísticas Reales, Edición de Mascotas con Foto, y Módulos del Admin Pendientes (Reglamento, FAQ, Artículos, Usuarios)

### 🐛 Bug crítico corregido: error "Unexpected token '<'" al registrar una mascota
1. **Causa raíz:** la columna `foto_url` de la tabla `mascotas` era `TEXT` (límite real de ~64 KB en MySQL/MariaDB). Una foto subida sin optimizar (hasta 2 MB en base64) superaba ese límite, MySQL rechazaba el `INSERT`, PDO lanzaba una excepción no controlada, y PHP devolvía una página de error en **HTML** donde el navegador esperaba JSON — de ahí el error `Unexpected token '<', "<br /> <b>"... is not valid JSON`.
2. **Corrección en 3 capas:**
   - `database/schema.sql`: `foto_url` cambia de `TEXT` a `LONGTEXT` (aplicado también a la BD local).
   - `dashboard.html`: `previewPhoto()` ahora optimiza la foto con Canvas HTML5 (máx. 600px, calidad 0.85) antes de guardarla, igual que ya se hacía con los íconos del admin — evita fotos pesadas sin necesidad.
   - `api/config/helpers.php`: se agregó un manejador global de errores/excepciones (`set_error_handler` + `set_exception_handler`) para que **cualquier** error de PHP en la API responda siempre JSON limpio, nunca HTML — protege contra este tipo de fallo aunque venga de otra causa en el futuro, incluido en HostGator donde no controlamos la configuración de PHP.

### 📊 Estadísticas y contadores reales (ya no números de ejemplo)
1. **Contadores del hero en `index.html`** (antes fijos: 342 / 289 / 187) ahora se llenan con datos reales de `/api/stats` (`total_mascotas`, `total_duenos`, `vacunados`) al cargar la página; el número manual configurado desde el admin (si existe) sigue teniendo prioridad.
2. **Badge de "Seguimiento" en `admin.html`** (antes fijo: 342) ahora muestra la cantidad real de mascotas registradas.

### ✏️ Edición de mascotas (antes no existía)
1. **Nuevo flujo de edición completo en `dashboard.html`:** botón "✏️ Editar" en cada tarjeta de mascota y en el detalle, que reabre el mismo formulario de registro pre-llenado (incluida la foto) y guarda los cambios contra el servidor (`PUT /api/mascotas`), en vez de solo poder registrar mascotas nuevas.
2. Si no se sube una foto nueva al editar, se conserva la que ya tenía la mascota (no se borra por accidente).

### 📋 Reglamento, ❓ FAQ, 📝 Artículos y 👤 Usuarios — módulos del admin que antes eran simulados, ahora reales
1. **Reglamento municipal:** el botón "Guardar cambios" en el admin solo mostraba un aviso falso; ahora persiste en el servidor (`padron_reglamento` vía `settings.php`) y **se muestra públicamente** en una nueva sección `#reglamento` de `index.html` (antes no existía ninguna página pública con el reglamento).
2. **Preguntas frecuentes (FAQ):** el editor del admin no guardaba nada (se perdía al recargar); ahora persiste en el servidor (`padron_faq`) y el FAQ público en `index.html` lee ese contenido real, con el listado institucional fijo como respaldo si aún no se ha editado nada.
3. **Artículos / Tips de cuidado:** "Publicar" no guardaba el artículo en ningún lado. Se agregaron endpoints reales `POST/PUT/DELETE /api/articulos` (protegidos, solo admin) en `contenido.php`, y el editor WYSIWYG del admin ahora crea, edita y elimina artículos de verdad contra la base de datos.
4. **Gestión de cuentas ciudadanas (nuevo):** nueva pestaña "👤 Usuarios" en el admin con tabla de todos los ciudadanos registrados (nombre, contacto, colonia, cantidad de mascotas, fecha de registro) y botón para activar/desactivar una cuenta. Nuevo endpoint `GET/PUT /api/usuarios` (solo admin) en `web/api/usuarios.php`.

### 📂 Archivos modificados/creados
- **PHP:** `api/config/helpers.php` (manejador global de errores), `api/contenido.php` (CRUD de artículos), `api/usuarios.php` (nuevo), `api/.htaccess` (ruta `/usuarios`).
- **SQL:** `database/schema.sql` (`foto_url` → `LONGTEXT`).
- **JS:** `js/api-client.js` (`apiCrearArticulo`, `apiActualizarArticulo`, `apiEliminarArticulo`, `apiGetUsuarios`, `apiSetUsuarioActivo`).
- **HTML:** `dashboard.html` (edición de mascotas con foto, optimización Canvas), `admin.html` (reglamento/FAQ persistentes, artículos reales, pestaña de usuarios, badge real), `index.html` (contadores reales, sección de reglamento público, FAQ dinámica).

### ⚠️ Pendiente / fuera de este alcance
- Avisos y Eventos del admin siguen siendo solo locales (sin tabla ni endpoint de escritura) — no se tocaron en esta sesión.
- Casos de uso (UML), diagrama entidad-relación, video tutorial e informe final de residencias siguen pendientes — son entregables académicos/documentales, no tareas de código.
- Antes de subir a HostGator: repetir las pruebas end-to-end ya hechas en local, pero contra el servidor real.

## 📅 [2026-07-31] — Íconos Reales de Redes Sociales, Logos del Footer Editables y Opción de Ocultar Cualquier Ícono

### 🚀 Novedades
1. **Íconos reales de Instagram y Facebook en el footer (`index.html`):** se reemplazaron los emojis 📷/👍 por las imágenes oficiales (`Imagenes/Instagram.png`, `Imagenes/facebook.png`) dentro del mismo recuadro de `.footer-social` (36×36px, recortado en círculo).
2. **Logos del footer (municipio y "Ciudad Mágica") ahora editables desde Apariencia e íconos:** antes eran imágenes fijas en el HTML; ahora son dos elementos más (`footer-brand-1`, `footer-brand-2`) del mismo sistema de personalización que ya usan el navbar, el hero, el banner, etc.
3. **Nueva opción "🚫 Ocultar" en el selector de Apariencia:** disponible para **todos** los íconos/imágenes configurables (navbar, hero, banner, pasos, footer, logo del panel admin, logos del footer). Permite quitar cualquiera de ellos del sitio público sin dejar un espacio roto, sin necesidad de tocar código. Se guarda como `{type:'none'}` y se aplica ocultando el elemento (`display:none`) en `index.html`, `login.html` y `dashboard.html`.

### 📂 Archivos modificados
- `web/index.html` (íconos reales de Instagram/Facebook, contenedores `footer-brand-1`/`footer-brand-2`, manejo de `type:'none'`).
- `web/admin.html` (nuevas entradas en `ICON_ELEMENTS`, botón/pestaña "Ocultar" en `buildIconSelectors()`, `setIconSelType()`, `loadAppearance()`).
- `web/login.html`, `web/dashboard.html` (manejo de `type:'none'` en sus funciones de apariencia).
- `web/css/styles.css` (`.footer-social img`).
- `web/Imagenes/Instagram.png`, `web/Imagenes/facebook.png` (nuevos).

## 📅 [2026-07-30] — Corrección de Guardado en Apariencia, Imagen del Hero Más Grande, Logo del Panel Admin y Red Social Extra

### 🚀 Novedades y Correcciones
1. **Bug real de "la imagen no se guarda" en Apariencia e íconos (`admin.html`):**
   - Causa: al hacer clic en la pestaña "🖼️ Imagen"/"✨ GIF/URL" de una tarjeta, el estado ya marcaba esa tarjeta como ese tipo aunque no se hubiera elegido ninguna imagen/URL todavía. Si el admin guardaba en ese momento, la tarjeta se guardaba **vacía** y rompía ese ícono en todo el sitio público (se veía como ❌).
   - `saveAppearance()` ahora descarta automáticamente las tarjetas incompletas antes de guardar y avisa cuál se omitió, sin afectar las demás.
   - Se reparó directamente en base de datos un dato ya corrompido (logo del navbar y del footer) generado al intentar diagnosticar el problema por línea de comandos de MySQL.
2. **Imagen principal del Hero más grande (`css/styles.css`):** `.hero-mascot-icon` pasó de un cuadro fijo de 120×120px (pensado para un emoji) a un marco de hasta 260×260px que se adapta al ancho de la tarjeta, con la imagen llenando el marco (`object-fit: cover`) en vez de verse chica con espacio vacío alrededor.
3. **Logo del Panel Admin personalizable:** el ícono junto a "Panel Admin" en el sidebar (antes una imagen fija) ahora es un elemento más de "Apariencia e íconos" (`admin-sidebar-logo`), configurable con emoji, imagen o GIF igual que los demás. Se aplica al propio panel mediante `applyAdminOwnAppearance()`.
4. **Nuevo campo "Otra red social" (opcional) en Contactos:** además de Instagram/Facebook/Sitio web, el admin puede definir libremente un nombre, emoji/ícono y URL para una red adicional (WhatsApp, TikTok, YouTube, X, etc.), sin necesidad de que el desarrollador la agregue a mano. Se guarda como `extra_icono`/`extra_nombre`/`extra_url` dentro de `padron_site_config` y se muestra en el footer público (`index.html`, nuevo enlace `#ft-extra`) solo si se llena.

### 📂 Archivos modificados
- `web/css/styles.css` (tamaño del hero, `.sidebar-logo-icon`).
- `web/admin.html` (fix de `saveAppearance()`, logo del sidebar propio, campo de red social extra, `getSiteConfigValues()`/`loadSiteConfig()`/`resetSiteConfig()`/`previewFooter()`).
- `web/index.html` (enlace `#ft-extra` en el footer + `applyFooterConfig()`).

---

## 📅 [2026-07-30] — Conexión Real al Backend PHP+MySQL, Cierre de Hoyos de Seguridad y Apariencia Persistente en Servidor

### 🚀 Contexto
El sitio corría enteramente sobre `localStorage`/`mock-data.js` pese a tener un backend PHP+MySQL completo (`web/api/`, `web/database/`) nunca conectado. Esto causaba que el panel "Apariencia e íconos" del admin solo se reflejara en su propio navegador (no en el de los visitantes reales), y que el login tuviera un bypass de administrador explotable. Se conectó todo el frontend a la API real, se cerraron los hoyos de seguridad encontrados, y se dejó un entorno local con XAMPP para probar antes de subir a HostGator.

### 🔒 Seguridad
1. **Bypass de login admin cerrado de raíz:** `login.html` usaba `email === 'admin@demo.com' || pass === 'Admin1234'` (con `||`), permitiendo entrar como admin con cualquier credencial parcial. Ahora el rol viene siempre del backend (`auth.php`, columna `rol` de `duenos`), no del cliente.
2. **Contraseñas dejaron de guardarse en texto plano** en `localStorage` — ahora todo el login/registro pasa por `auth.php` con `password_hash`/`password_verify` (bcrypt).
3. **`dashboard.html` y `admin.html` ya no eran accesibles sin sesión** (no tenían ningún guard). Ahora ambas validan el token contra el servidor (`GET /api/auth?action=me`) al cargar, vía la nueva función `apiRequireSession()`; `admin.html` además exige rol `admin`.
4. **Expiración real de sesión:** nueva columna `token_creado_en` en `duenos`; `requireAuth()` en `helpers.php` ahora sí usa `TOKEN_EXPIRY` (24h) para invalidar tokens viejos — antes se definía pero nunca se comprobaba.
5. **Política de contraseña:** mínimo subido de 4 a 8 caracteres (`auth.php` + formularios).
6. **Exposición de PII en la ficha pública de mascota (QR) reducida:** `mascotas.php` (GET público por folio) ya no devuelve dirección/colonia del dueño (folios son consecutivos y por tanto enumerables); se conserva el teléfono porque es necesario para avisar de una mascota perdida.
7. **Bug de infraestructura crítico corregido:** Apache no reenviaba el header `Authorization` a PHP por defecto (común en hosting compartido, incluido HostGator) — sin esto, *ningún* endpoint protegido con `Bearer <token>` funcionaba. Se agregó `CGIPassAuth On` + regla de rewrite en `web/api/.htaccess`, y `getAuthToken()` en `helpers.php` ahora revisa variantes (`HTTP_AUTHORIZATION`, `REDIRECT_HTTP_AUTHORIZATION`, `apache_request_headers()`).
8. **Hash de contraseña del admin del seed corregido:** el hash bcrypt en `seed.sql` no correspondía realmente a `Admin1234` (login fallaba siempre). Se regeneró.

### 🔌 Conexión real al backend (antes 100% simulado con `mock-data.js`)
1. `login.html`, `dashboard.html`, `admin.html`, `index.html`, `mascota.html` ahora cargan `js/api-client.js` (antes `js/mock-data.js`) y usan las funciones reales de la API (`apiLoginUser`, `apiRegisterUser`, `apiGetMisMascotas`, `apiRegistrarMascota`, `apiActualizarMascota`, `apiGetMascota`, `apiGetTodasMascotas`, `apiGetStats`, `apiGetCampanas`, `apiGetArticulos`, `apiUpdateProfile`, `apiGetMe`, `apiLogout`).
2. **Nuevo endpoint `POST /api/auth?action=update-profile`:** antes "Guardar perfil" en el dashboard ciudadano solo actualizaba la UI, nunca la base de datos.
3. **Folio de mascota unificado:** `dashboard.html` generaba un folio local incompatible (`EG-2026-XXXXX`) y nunca persistía la mascota registrada (se perdía al recargar). Ahora usa el folio real generado por el servidor (`REMAC-GRU-XXXXX`) y persiste de verdad.
4. **Filtro de estatus corregido:** el mapa de `index.html` filtraba `estatus !== 'fallecido'`, valor que nunca existió en el modelo real (`'Alta'/'Baja'`), por lo que nunca excluía nada. `admin.html` tenía el mismo problema en varias funciones (`renderSeguimiento`, `changeEstatus`, filtros, `<select>` de estatus) además de usar nombres de campo del modelo viejo (`folio`, `dueno`, `edad_anios`) en vez de los reales (`id`, `persona`, `edad_label`). Todo se alineó al esquema real.
5. **Bug crítico oculto:** `index.html` llamaba a `applySiteContentConfig()` en su inicialización, pero esa función **nunca estaba definida en ningún archivo** — un `ReferenceError` detenía el resto del script de inicialización (incluyendo `applyAppearanceConfig()` e `initMap()`) en cada carga de la portada. Se implementó la función correctamente.
6. **Bug de folio roto en el QR:** `mascotas.php` guardaba `link_publico` como `mascota.php?id=...` (archivo que no existe) en vez de `mascota.html?id=...`; los QR generados apuntaban a una página inexistente.
7. **Mapa público de `index.html` rediseñado:** antes listaba mascotas individuales (requiere ahora sesión por traer teléfono del dueño, y exponía nombre/colonia de cada mascota a cualquier visitante). Ahora usa el endpoint público agregado `/api/stats` (conteo por colonia), sin datos individuales.
8. **Acta oficial real:** "Descargar acta" en el dashboard ciudadano generaba un toast simulado (`✅ Acta descargada correctamente (simulado)`) sin producir nada. Ahora genera un PDF real con jsPDF (folio, datos de la mascota y del dueño, enlace de verificación).

### 🎨 Apariencia e íconos — ahora persistida en el servidor (arregla el bug reportado)
1. **Causa raíz identificada:** al probar abriendo los `.html` con doble clic (`file://`), cada archivo queda en un origen aislado y el `localStorage` no se comparte entre páginas. Pero incluso arreglando eso, el panel de apariencia solo guardaba en el navegador del propio administrador — **ningún visitante real en HostGator vería los cambios**.
2. **Nueva tabla `site_config`** (`schema.sql`) y **nuevo endpoint `web/api/settings.php`** (`GET` público sin auth, `POST` protegido con `requireAdmin()`), con ruta añadida en `.htaccess`.
3. Las 4 claves de configuración del admin (`padron_site_config`, `padron_appearance_config`, `padron_site_content`, `padron_municipio_config`) ahora se guardan también en el servidor al hacer clic en "Guardar" (`pushConfigToServer()` en `admin.html`), y las páginas públicas (`index.html`, `login.html`, `dashboard.html`, `admin.html`) las leen primero del servidor (`primeConfigFromServer()` / `apiGetSiteConfig()`), con `localStorage` solo como respaldo sin conexión.
4. Verificado con un navegador "limpio" (perfil nuevo, sin caché): una imagen subida desde el panel admin ya se refleja correctamente en la portada pública.

### 🖥️ Entorno de desarrollo local (XAMPP)
- Se instaló XAMPP 8.2 (Apache + MariaDB + PHP + phpMyAdmin) y se enlazó `web/` a `C:\xampp\htdocs\remac` para probar todo el stack real antes de subir a HostGator.
- Se creó la base de datos local `remac_db` (usuario `remac_local`) y se importaron `schema.sql` + `seed.sql`.
- `web/api/config/database.php` y `web/js/api-client.js` quedaron apuntando al entorno local, con comentarios explícitos de qué cambiar antes de subir a producción.

### 📂 Archivos modificados/creados
- **PHP:** `api/auth.php`, `api/mascotas.php`, `api/stats.php` (sin cambios de lógica, solo verificado), `api/config/helpers.php`, `api/config/database.php`, `api/.htaccess`, `api/settings.php` (nuevo).
- **SQL:** `database/schema.sql` (tabla `site_config`, columna `token_creado_en`), `database/seed.sql` (hash de admin corregido, password de cuenta demo).
- **HTML/JS:** `login.html`, `dashboard.html`, `admin.html`, `index.html`, `mascota.html`, `js/api-client.js`.

### ⚠️ Pendiente / fuera de este alcance
- Edición de Avisos/Eventos/FAQ/Artículos/SEO/Tema desde el admin sigue siendo solo local (sin tabla ni endpoint de escritura en el servidor) — no estaba en el alcance acordado para esta sesión.
- Antes de subir a HostGator: crear la BD real en cPanel, importar `schema.sql`+`seed.sql`, actualizar `database.php` y `API_BASE_URL` con credenciales/dominio reales, y cambiar la contraseña del admin del seed.

## 📅 [2026-07-29] — Creación del Archivo de Contexto para Claude Code (CLAUDE.md)

### 🚀 Novedades y Ajustes Principales
1. **Archivo `CLAUDE.md` Creado en la Raíz:**
   - Documento técnico exhaustivo que proporciona a Claude Code (y cualquier agente/desarrollador) el contexto completo del proyecto REMAC.
   - Incluye visión general, arquitectura (HTML5, CSS Vanilla, JS, PHP, MySQL), eliminación total de CURP, obligatoriedad de teléfono, esquemas de BD, sistema de personalización admin con Canvas HTML5, mapa de archivos y reglas de desarrollo.

---

## 📅 [2026-07-29] — Solución Definitiva para Imágenes Subidas desde Descargas y Apariencia

### 🚀 Novedades y Ajustes Principales
1. **Optimización con Canvas para Imágenes Subidas (`admin.html`):**
   - Se implementó un procesador con Canvas HTML5 en `handleIconFile()` que redimensiona automáticamente imágenes grandes de la carpeta de Descargas (o cualquier ubicación local) a un tamaño óptimo (máx 400px).
   - Previene errores silenciosos de cuota en `localStorage` (`QuotaExceededError`) y garantiza un almacenamiento liviano e instantáneo.

2. **Ajustes de Estilos CSS e Imágenes (`styles.css`, `index.html`, `login.html`):**
   - **Corrección de Llave de Cierre en CSS:** Se corrigió un cierre de llave `}` faltante en la regla `.step-num` de `styles.css` que impedía la lectura del resto de la hoja de estilos y provocaba que la página `login.html` se visualizara desestructurada.
   - Se definieron dimensiones fijas, alineación flexbox y reglas `overflow: hidden` con `object-fit: contain` para los contenedores de íconos/imágenes (`.hero-mascot-icon`, `.navbar-logo .logo-icon`, `.step-icon`, `.footer-logo-icon`).
   - Las imágenes seleccionadas o subidas se reflejan al instante con el diseño estilizado completo en `index.html`, `login.html` y `admin.html`.

3. **Eliminación del Mapa Ciudadano en `index.html`:**
   - Se eliminó la sección de mapa sin contenido de `index.html` y se protegió la llamada a `initMap()`.

---

## 📅 [2026-07-29] — Eliminación de CURP y Obligatoriedad del Teléfono

### 🚀 Novedades y Ajustes Principales
1. **Eliminación Total de la CURP:**
   - Se removió por completo la necesidad y el uso de la CURP en toda la plataforma (formulario de registro, inicio de sesión, perfil de usuario, base de datos y API PHP).
   - El identificador principal de inicio de sesión de los ciudadanos pasa a ser su **Correo Electrónico** y **Contraseña**.

2. **Teléfono de Contacto Obligatorio:**
   - El campo **Teléfono de contacto** pasa a ser **obligatorio (`*`)** en el formulario de registro de usuario y en la base de datos MySQL.

3. **Actualización de Base de Datos MySQL:**
   - `schema.sql`: Se eliminó la columna `curp` de la tabla `duenos` y se configuró `telefono` como `VARCHAR(20) NOT NULL`.
   - `seed.sql`: Se actualizaron las cuentas de prueba iniciales eliminando la columna `curp`.

4. **Actualización de APIs PHP:**
   - `api/auth.php`: Se añadió el endpoint `action=register` para creación de cuentas normales y se ajustó `action=login` para autenticación con email y contraseña.
   - `api/config/helpers.php`: Se removió la función `validarCurp()` y se ajustó la consulta de sesión del usuario.

5. **Actualización de Vistas HTML y JavaScript:**
   - `login.html`: Pestaña *"Crear cuenta"* con campos: Nombre completo, Correo electrónico, Teléfono de contacto (obligatorio) y Contraseña.
   - `dashboard.html`: Se sustituyeron las referencias a la CURP en la sección *"Mi perfil"* por el Teléfono y Correo del usuario.
   - `index.html` y `admin.html`: Se actualizaron los textos explicativos del paso a paso eliminando las menciones a la CURP.
   - `js/api-client.js` y `js/mock-data.js`: Se actualizaron los clientes API e información simulada para coincidir con la nueva estructura de datos.

---

## 📅 [2026-07-29] — Editor Dinámico de Contenidos de Portada en Panel Admin

### 🚀 Novedades y Ajustes Principales
1. **Personalización Total de `index.html` desde Admin:**
   - Se creó la pestaña **`🏠 Contenidos de Portada`** dentro del Panel de Administración (`admin.html` → `⚙️ Configuración sitio`).
   - Permite al administrador editar los textos del Hero (título, subtítulo, botones), contadores estadísticos, tarjetas de paso a paso, aviso/banner naranja, sección de beneficios y encabezados de secciones.
2. **Sincronización en Tiempo Real:**
   - Implementación de la función `applySiteContentConfig()` en `index.html` para aplicar automáticamente los contenidos configurados por el administrador.

---

## 📅 [2026-07-29] — Personalización de Apariencia, Logos e Íconos

### 🚀 Novedades y Ajustes Principales
1. **Selector de Apariencia:**
   - Creación de la pestaña **`Apariencia e íconos`** en el Panel Admin (`admin.html`).
   - Permite personalizar los íconos/logos del navbar, hero, pasarela y footer permitiendo usar emojis, imágenes PNG transparentes o GIFs animados.
2. **Corrección de Layout y Logos:**
   - Corrección de desbordamientos de texto en el logo principal y ajuste responsivo de los paneles de login y registro.

---

## ⚠️ Entradas reconstruidas a partir de git — anteriores a este documento
`HISTORIAL_CAMBIOS.md` no existió como archivo hasta el commit `4a624ba` (2026-07-29, ver la entrada de esa fecha "Creación del Archivo de Contexto para Claude Code" — en realidad ese mismo commit también creó este changelog). Las 6 entradas de abajo (2026-06-12 a 2026-07-22) reconstruyen, a partir del historial real de `git log`, el trabajo que sí ocurrió antes de que existiera este documento — a petición del usuario, para no dejar un hueco en el registro. El detalle es más breve que en entradas posteriores porque se redactó después de los hechos, solo a partir del mensaje y el diff de cada commit, no de la sesión real de trabajo.

## 📅 [2026-07-22] — Catálogo de colonias actualizado con datos reales de micodigopostal.org

### 🔧 Cambios
- **`web/js/mock-data.js`, `web/index.html`**: se reemplazó el catálogo de colonias de ejemplo por la lista completa y real de colonias/asentamientos de El Grullo, tomada de micodigopostal.org.

### 📂 Archivos modificados
- `web/js/mock-data.js`, `web/index.html`.

*(commit `fd59a7a`)*

## 📅 [2026-07-22] — Corrección de centrado del aside y scroll de pestañas en registro de mascotas

### 🔧 Cambios
- **`web/css/styles.css`, `web/login.html`**: ajuste de centrado del panel lateral (aside) en la vista de registro de mascotas, y corrección del scroll horizontal de las pestañas.

### 📂 Archivos modificados
- `web/css/styles.css`, `web/login.html`.

*(commit `f833da0`)*

## 📅 [2026-07-22] — Se conecta el backend real: API en PHP, base de datos MySQL y cliente API

### 🤔 Contexto
Hasta este commit el proyecto era un prototipo puramente de frontend, con todos los datos (mascotas, dueños, estadísticas) simulados en `web/js/mock-data.js`. Este es el primer commit que agrega un backend de verdad.

### 🔧 Cambios
- **Nuevo `web/api/`**: primera versión de la API en PHP nativo — `auth.php` (registro/login), `mascotas.php` (CRUD, 200 líneas), `stats.php` (estadísticas), `contenido.php`, `config/database.php` (conexión PDO) y `config/helpers.php` (funciones auxiliares). Incluye su propio `.htaccess` con el ruteo de endpoints.
- **Nuevo `web/database/`**: `schema.sql` (estructura de la base de datos) y `seed.sql` (datos iniciales de prueba) — primera versión del esquema de MySQL del proyecto.
- **Nuevo `web/js/api-client.js`**: primer cliente HTTP para consumir la API real desde el frontend.
- **`web/dashboard.html`, `web/index.html`, `web/css/styles.css`**: ajustes para empezar a consumir datos reales en vez de `mock-data.js` (que en este commit todavía coexiste con la API real, no se elimina).

### 📂 Archivos modificados
- Nuevos: `web/api/.htaccess`, `web/api/auth.php`, `web/api/config/database.php`, `web/api/config/helpers.php`, `web/api/contenido.php`, `web/api/mascotas.php`, `web/api/stats.php`, `web/database/schema.sql`, `web/database/seed.sql`, `web/js/api-client.js`.
- Modificados: `web/css/styles.css`, `web/dashboard.html`, `web/index.html`, `web/js/mock-data.js`.

*(commit `e3641be` — un salto de más de un mes desde el commit anterior, `ed7cb64` del 13 de junio; no hay registro de qué se trabajó en ese periodo, solo de este resultado)*

## 📅 [2026-06-13] — Se sincroniza el README tras quitar el reporte de mascota extraviada

### 🔧 Cambios
- **`README.md`**: se quitó la mención a "Reporte de mascota extraviada" en la lista de funciones del Panel Ciudadano — quedó desactualizada un día después de que esa función se retiró del código (ver commit `16369dc`, 2026-06-12).

### 📂 Archivos modificados
- `README.md`.

*(commit `ed7cb64`)*

## 📅 [2026-06-12] — Se quita el reporte de "mascota extraviada" y se agrega un mapa a la portada

### 🤔 Contexto
En esta etapa muy temprana del proyecto, el identificador de una persona todavía era su **CURP** (se eliminaría por completo más adelante, ver la entrada del 2026-07-29 "Eliminación de CURP y Obligatoriedad del Teléfono") y el padrón incluía un estatus/reporte de "Extraviado" para mascotas perdidas, que se decidió quitar del alcance del proyecto.

### 🔧 Cambios
- Se eliminó la funcionalidad de "mascota extraviada" (estatus, gráfica y textos relacionados) de `admin.html`, `dashboard.html`, `index.html`, `login.html` y `mock-data.js`.
- **`web/index.html`**: se agregó un mapa (Leaflet, vía CDN) a la portada — primera aparición del mapa que más adelante evolucionaría en el mapa de mascotas por colonia del panel admin.
- Ajustes de texto de la portada (de "Registrarme" a "Registrar mascota", pasos de registro).

### 📂 Archivos modificados
- `web/admin.html`, `web/dashboard.html`, `web/index.html`, `web/js/mock-data.js`, `web/login.html`.

*(commit `16369dc`, 43 minutos después del commit inicial)*

## 📅 [2026-06-12] — Primer commit: prototipo inicial de la plataforma (solo frontend, con datos de prueba)

### 🤔 Contexto
Primer commit del repositorio (`16c1554`) — el punto de partida de todo el proyecto.

### 🔧 Cambios
- Primera versión del portal: `index.html` (portada), `login.html` (acceso/registro), `dashboard.html` (panel ciudadano), `admin.html` (panel administrativo) y `css/styles.css` — 6,653 líneas en total.
- **`web/js/mock-data.js`**: todos los datos (mascotas, dueños, estadísticas) eran simulados en este archivo — todavía no existía ningún backend real ni base de datos (eso llegaría hasta el commit `e3641be`, 2026-07-22).
- Cuentas de prueba de esta primera versión (documentadas en el `README.md` original, ya no vigentes): `admin@demo.com` / `Admin1234` y `ciudadano@demo.com` / `Demo1234`.

### 📂 Archivos modificados
- Nuevos: `.gitignore`, `README.md`, `web/admin.html`, `web/css/styles.css`, `web/dashboard.html`, `web/index.html`, `web/js/mock-data.js`, `web/login.html`.

*(commit `16c1554`)*
