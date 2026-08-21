# 📜 Historial de Cambios — REMAC (Padrón Municipal de Mascotas El Grullo)

Este documento registra cronológicamente todos los cambios, mejoras, correcciones y actualizaciones realizadas en la plataforma web y base de datos del proyecto **REMAC**.

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
