# 📜 Historial de Cambios — REMAC (Padrón Municipal de Mascotas El Grullo)

Este documento registra cronológicamente todos los cambios, mejoras, correcciones y actualizaciones realizadas en la plataforma web y base de datos del proyecto **REMAC**.

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
