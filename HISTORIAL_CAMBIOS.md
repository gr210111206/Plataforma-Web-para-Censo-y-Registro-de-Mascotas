# 📜 Historial de Cambios — REMAC (Padrón Municipal de Mascotas El Grullo)

Este documento registra cronológicamente todos los cambios, mejoras, correcciones y actualizaciones realizadas en la plataforma web y base de datos del proyecto **REMAC**.

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
