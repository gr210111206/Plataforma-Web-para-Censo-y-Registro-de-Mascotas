# 🏛️ Contexto y Guía del Proyecto: Padrón Municipal de Mascotas · El Grullo

Este documento sirve como archivo de contexto principal (`CLAUDE.md`) para guiar a asistentes de IA (como Claude Code) y desarrolladores en la comprensión profunda, mantenimiento y evolución del sistema.

---

## 📌 1. Visión General del Proyecto
Este proyecto (título oficial: **"Desarrollo de Plataforma Web para Censo y Registro de Mascotas en el Municipio de El Grullo, Jalisco"**) es el Portal Web y Sistema de Gestión para el Censo y Registro Oficial de Animales de Compañía del **H. Ayuntamiento Constitucional de El Grullo, Jalisco (Gobierno Municipal 2024–2027)**, desarrollado en coordinación con la Dirección de Medio Ambiente e Informática Municipal.

- **Objetivo Principal:** Permitir a los ciudadanos registrar a sus mascotas (perros y gatos), obtener un acta digital oficial con folio único garantizado (`M-GRU-XXXXXXXXX`) y permitir al Ayuntamiento administrar estadísticas, campañas y control de salud animal.
- **Repositorio GitHub:** `gr210111206/Plataforma-Web-para-Censo-y-Registro-de-Mascotas`
- **Servidor de Producción Target:** HostGator (Entorno cPanel con Apache, PHP 8.x y MySQL/phpMyAdmin).
- **Dominio real:** pendiente de confirmar/comprar (ver `HISTORIAL_CAMBIOS.md`, entradas de 2026-09-10) — no asumir un dominio fijo en el código sin confirmarlo primero.

---

## 🛠️ 2. Arquitectura y Tecnologías
La plataforma está diseñada con una arquitectura ligera, rápida y modular sin dependencias complejas de build:

1. **Frontend Público y Administrativo:**
   - **HTML5 Semántico:** Estructura limpia y accesible (`index.html`, `login.html`, `dashboard.html`, `mascota.html`, `admin.html`, `asistente.html`).
   - **CSS Vanilla Moderno (`web/css/styles.css`):** Sistema de diseño con variables CSS (`--orange`, `--dark`, `--surface`), glassmorphism, degradados, animaciones micro-interactivas y diseño 100% responsivo.
   - **JavaScript Vanilla Modular (`web/js/`):** `api-client.js` (cliente HTTP para todas las APIs), `el-grullo-data.js` (colonias/calles reales), `tema.js` (aplica el tema visual configurado desde el panel admin). No hay build step ni framework.

2. **Backend e Integración de Datos (APIs PHP):**
   - Ubicación: `web/api/`
   - APIs RESTful en PHP nativo con autenticación por token Bearer: `auth.php`, `mascotas.php`, `usuarios.php`, `stats.php`, `contenido.php` (campañas/artículos), `settings.php`, `bitacora.php` (auditoría, solo admin) y `config/helpers.php` (funciones auxiliares y control de sesión) + `config/database.php` (conexión PDO, gitignored — ver `database.example.php` como plantilla).
   - Cada endpoint necesita su propia `RewriteRule` en `web/api/.htaccess` para poder llamarse sin `.php` — si agregas un archivo nuevo, agrega también su regla ahí.

3. **Base de Datos MySQL (`web/database/`):**
   - **Esquema (`schema.sql`):** Tablas principales (`duenos`, `mascotas`, `campanas`, `articulos`, `bitacora`, `site_config`, `folio_counter`). ⚠️ No existen tablas `vacunas` ni `avisos` como tal: la vacunación es solo el booleano `mascotas.vacunado`, y los "avisos"/campañas del panel viven en la propia tabla `campanas` (ver §3.B).
   - **Datos Semilla (`seed.sql`):** Registros iniciales de prueba y cuenta administrativa.

---

## 🔑 3. Reglas de Negocio y Estructura de Datos Importantes

### A. Autenticación y Cuentas de Usuarios (`duenos`)
- ⚠️ **CURP ELIMINADA:** La CURP fue eliminada por completo de todo el sistema (base de datos, formularios HTML, perfil y APIs PHP).
- 📧 **Correo Electrónico (Email):** Es el identificador único principal de acceso junto con la **Contraseña** — pero ya **no es obligatorio a nivel de base de datos** (ver rol `asistente` abajo).
- 📞 **Teléfono de Contacto:** Campo **OBLIGATORIO (`NOT NULL`)** en el registro de usuarios.
- **Tres roles:** `ciudadano` (autoregistro con correo), `admin` (por defecto solo se crea directo en la base de datos, nunca desde la interfaz — ver excepción de superadmin abajo), y **`asistente`** — personal municipal que registra mascotas a nombre de ciudadanos sin correo electrónico (ej. personas adultas mayores), en ventanilla o en campañas fuera de la oficina. Las cuentas de asistente las crea un admin desde la pestaña "Roles" del panel admin (`web/admin.html`), nunca se auto-registran.
- ⭐ **Superadmin (excepción puntual):** la columna `duenos.es_superadmin` (activada solo a mano en la base de datos, nunca desde la interfaz) marca una única cuenta — hoy `admin@remac.elgrullo.mx` — como la única capaz de convertir, desde el panel ("Roles y Cuentas" → botón "⭐ Hacer administrador"), a un Ciudadano o Asistente existente en `admin`. Los admins creados así **no** heredan ese poder. Revocar el rol admin sigue siendo solo por base de datos directa (no hay endpoint ni botón para eso). Ver `web/api/config/helpers.php` (`requireSuperAdmin()`) y `web/api/usuarios.php` (`?action=promover-admin`).
- 🔒 **Login**: bloqueo temporal (15 min) tras 5 contraseñas incorrectas seguidas (`duenos.intentos_fallidos`/`bloqueado_hasta`) — la comparación de tiempo se hace **dentro** de la consulta MySQL (`bloqueado_hasta > NOW()`), nunca comparando con `time()`/`strtotime()` de PHP (ver `HISTORIAL_CAMBIOS.md`, 2026-09-07 — PHP y MySQL pueden tener zonas horarias distintas en el mismo servidor).
- **Estructura de la tabla `duenos`:**
  `id`, `nombre`, `telefono` (NOT NULL), `email` (UNIQUE, puede ser `NULL` — un ciudadano registrado por un asistente no tiene correo ni puede iniciar sesión él mismo), `direccion`, `colonia`, `foto_perfil`, `password_hash`, `rol` ('ciudadano' | 'admin' | 'asistente'), `es_superadmin` (0|1, ver arriba), `activo`, `intentos_fallidos`, `bloqueado_hasta`, `created_at`, `updated_at`.

### B. Registro de Mascotas (`mascotas`)
- Pertenecen a un dueño (`dueno_id`) y registran quién las dio de alta (`registrado_por` — distinto de `dueno_id` cuando un asistente registra a nombre de un ciudadano; así el asistente puede ver/buscar lo que él mismo registró).
- El **folio** (`mascotas.id`, ej: `M-GRU-000000001`) es la propia llave primaria — se genera con `generarFolioMunicipal()` (`web/api/config/helpers.php`), contador transaccional en `folio_counter`.
- Contienen: `nombre`, `especie` ('perro' | 'gato'), `raza`, `edad`, `edad_label`, `sexo` ('macho' | 'hembra'), `color`, `senias_particulares`, `foto_url`, `vacunado` (T/F), `esterilizado` (T/F), `estatus` ('Alta' | 'Baja'), `fecha_registro`, `link_publico`, `ficha`.
- ⚠️ **`token_publico`** (VARCHAR(32), aleatorio, `UNIQUE`): identificador público real para `mascota.html`/el QR del acta — **nunca el folio**, que es consecutivo y por lo tanto adivinable. Conocer o adivinar un folio ya NO alcanza para consultar los datos de nadie. Ver `web/api/mascotas.php` (`GET ?token=`).

### C. Campañas / Avisos (`campanas`)
- Una sola tabla real cubre tanto "campañas oficiales" como los "avisos" que edita el admin — antes eran dos mecanismos desconectados (avisos vivían en `site_config` como JSON, se perdían en cada recarga del panel); se unificaron el 2026-09-08. CRUD completo en `web/api/contenido.php` (`?resource=campanas`).

### D. Bitácora de auditoría (`bitacora`)
- Registra **solo** acciones de gobierno (cambios de rol, activar/desactivar cuentas, dar de baja una mascota, o que un admin edite la mascota de otra persona) — nunca el uso normal del sistema (login, autoregistro, un ciudadano editando lo suyo). Ver `registrarBitacora()` en `helpers.php` y la pestaña "Bitácora" del panel admin.

---

## 🎨 4. Sistema de Personalización Dinámica (Panel Admin)
El Panel de Administración (`web/admin.html`) incluye un motor de configuración dinámica que se sincroniza en tiempo real con el portal público a través de `localStorage` (y backend PHP, tabla `site_config`):

1. **`🏠 Contenidos de Portada` (`cfg-portada`):**
   - Permite editar títulos, descripciones, contadores estadísticos y textos del héroe y secciones de `index.html`.
   - Llave `localStorage`: `padron_site_content`.

2. **`🎨 Apariencia e íconos` (`cfg-apariencia`):**
   - Permite cambiar la apariencia de 7 elementos clave (`nav-logo-icon`, `hero-mascot-icon`, `banner-icon`, `step-1-icon`, `step-2-icon`, `step-3-icon`, `footer-logo-icon`).
   - Soporta 3 tipos de entrada: **😀 Emojis**, **🖼️ Imágenes** (`web/Imagenes/` o subidas desde el equipo/Descargas) y **✨ GIFs / URLs**.
   - **Procesador Canvas HTML5:** Las imágenes subidas desde el equipo se optimizan y redimensionan automáticamente (máx. 400px, calidad 0.85) en formato Base64 DataURL para evitar errores de límite de memoria (`QuotaExceededError`).
   - Llave `localStorage`: `padron_appearance_config`.

3. **`🏛️ Municipio` & `📞 Contactos` (`cfg-municipio`, `cfg-contactos`):**
   - Configura datos institucionales del H. Ayuntamiento, nombres de directores, teléfonos y enlaces del pie de página.
   - Llaves `localStorage`: `padron_municipio_config`, `padron_site_config`.

---

## 📂 5. Estructura del Proyecto
```
Anteproyecto/
├── .agents/
│   └── AGENTS.md                  # Reglas del proyecto para agentes IA
├── CLAUDE.md                       # Guía de contexto detallada para Claude Code
├── HISTORIAL_CAMBIOS.md           # Registro obligatorio cronológico de cambios
├── scripts/
│   ├── backup_db.php               # Respaldo de BD (cron de HostGator) — fuera de web/ a propósito
│   └── smoke_test.sh               # Prueba de humo de la API (login/permisos/CRUD por rol)
└── web/
    ├── admin.html                 # Panel de administración completo
    ├── asistente.html             # Registro asistido (rol Asistente: mascotas para ciudadanos sin correo)
    ├── dashboard.html             # Panel ciudadano (mis mascotas, perfil, actas)
    ├── index.html                 # Portada principal pública
    ├── login.html                 # Acceso y registro de ciudadanos
    ├── mascota.html               # Vista pública de ficha de mascota (QR, por token_publico)
    ├── Imagenes/                  # Recursos gráficos (logos de El Grullo, escudos)
    ├── css/
    │   └── styles.css             # Estilos globales y componentes del sistema
    ├── js/
    │   ├── api-client.js          # Cliente HTTP para todas las APIs PHP
    │   ├── el-grullo-data.js      # Colonias/calles reales de El Grullo
    │   └── tema.js                # Aplica el tema visual configurado desde el panel admin
    ├── api/
    │   ├── config/
    │   │   ├── database.php       # Conexión MySQL PDO (gitignored — credenciales reales)
    │   │   ├── database.example.php # Plantilla de config, sin credenciales reales
    │   │   └── helpers.php        # Funciones auxiliares, sesión, CORS, bitácora
    │   ├── auth.php                # Login, registro, sesión, cambio de contraseña
    │   ├── mascotas.php            # CRUD de mascotas
    │   ├── usuarios.php            # Gestión de cuentas (ciudadanos/asistentes/promover a admin)
    │   ├── bitacora.php            # Lectura de la bitácora de auditoría (solo admin)
    │   ├── stats.php                # Estadísticas del censo
    │   ├── contenido.php           # Campañas/avisos y artículos
    │   └── settings.php            # Configuración del sitio (site_config)
    └── database/
        ├── schema.sql             # Estructura DDL de base de datos MySQL
        └── seed.sql               # Datos iniciales para desarrollo y pruebas
```

---

## 📜 6. Regla de Oro del Proyecto: Registro en Changelog
Cualquier modificación realizada en el código fuente, hojas de estilo, scripts o estructura de base de datos **DEBE documentarse inmediatamente** en `HISTORIAL_CAMBIOS.md` especificando:
1. Fecha (`YYYY-MM-DD`).
2. Título de la mejora o corrección.
3. Lista detallada de modificaciones realizadas.
4. Archivos creados o modificados.
