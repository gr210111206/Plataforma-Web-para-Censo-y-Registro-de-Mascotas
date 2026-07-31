# 📜 Historial de Cambios — REMAC (Padrón Municipal de Mascotas El Grullo)

Este documento registra cronológicamente todos los cambios, mejoras, correcciones y actualizaciones realizadas en la plataforma web y base de datos del proyecto **REMAC**.

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
