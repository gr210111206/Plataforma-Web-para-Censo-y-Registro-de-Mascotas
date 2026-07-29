# 🏛️ Contexto y Guía del Proyecto: REMAC (Padrón Municipal de Mascotas · El Grullo)

Este documento sirve como archivo de contexto principal (`CLAUDE.md`) para guiar a asistentes de IA (como Claude Code) y desarrolladores en la comprensión profunda, mantenimiento y evolución del sistema **REMAC**.

---

## 📌 1. Visión General del Proyecto
**REMAC** es el Portal Web y Sistema de Gestión para el Censo y Registro Oficial de Animales de Compañía del **H. Ayuntamiento Constitucional de El Grullo, Jalisco (Gobierno Municipal 2024–2027)**, desarrollado en coordinación con la Dirección de Medio Ambiente e Informática Municipal.

- **Objetivo Principal:** Permitir a los ciudadanos registrar a sus mascotas (perros y gatos), obtener un acta digital oficial con folio único garantizado (`REMAC-GRU-XXXX`) y permitir al Ayuntamiento administrar estadísticas, campañas y control de salud animal.
- **Repositorio GitHub:** `gr210111206/Plataforma-Web-para-Censo-y-Registro-de-Mascotas`
- **Servidor de Producción Target:** HostGator (Entorno cPanel con Apache, PHP 8.x y MySQL/phpMyAdmin).

---

## 🛠️ 2. Arquitectura y Tecnologías
La plataforma está diseñada con una arquitectura ligera, rápida y modular sin dependencias complejas de build:

1. **Frontend Público y Administrativo:**
   - **HTML5 Semántico:** Estructura limpia y accesible (`index.html`, `login.html`, `dashboard.html`, `mascota.html`, `admin.html`).
   - **CSS Vanilla Moderno (`web/css/styles.css`):** Sistema de diseño con variables CSS (`--orange`, `--dark`, `--surface`), glassmorphism, degradados, animaciones micro-interactivas y diseño 100% responsivo.
   - **JavaScript Vanilla Modular (`web/js/`):** Manipulación dinámica del DOM, clientes de API HTTP (`api-client.js`) y fallback simulado (`mock-data.js`).

2. **Backend e Integración de Datos (APIs PHP):**
   - Ubicación: `web/api/`
   - APIs RESTful en PHP nativo con autenticación basada en sesiones/tokens (`auth.php`, `mascotas.php`, `stats.php`, `contenido.php`, `helpers.php`).
   - Gestión de sesiones con cookies seguras y HTTP headers.

3. **Base de Datos MySQL (`web/database/`):**
   - **Esquema (`schema.sql`):** Tablas principales (`duenos`, `mascotas`, `vacunas`, `campanas`, `avisos`).
   - **Datos Semilla (`seed.sql`):** Registros iniciales de prueba y cuenta administrativa.

---

## 🔑 3. Reglas de Negocio y Estructura de Datos Importantes

### A. Autenticación y Cuentas de Usuarios (`duenos`)
- ⚠️ **CURP ELIMINADA:** La CURP fue eliminada por completo de todo el sistema (base de datos, formularios HTML, perfil y APIs PHP).
- 📧 **Correo Electrónico (Email):** Es el identificador único principal de acceso junto con la **Contraseña**.
- 📞 **Teléfono de Contacto:** Campo **OBLIGATORIO (`NOT NULL`)** en el registro de usuarios.
- **Estructura de la tabla `duenos`:**
  `id`, `nombre`, `telefono` (NOT NULL), `email` (NOT NULL UNIQUE), `direccion`, `colonia`, `password_hash`, `rol` ('ciudadano' | 'admin'), `activo`, `created_at`, `updated_at`.

### B. Registro de Mascotas (`mascotas`)
- Pertenecen a un dueño (`dueno_id`).
- Contienen: `folio` (ej: `REMAC-GRU-2026-001`), `nombre`, `especie` ('perro' | 'gato'), `raza`, `sexo` ('macho' | 'hembra'), `edad_anos`, `color`, `esterilizado` (T/F), `microchip`, `estatus` ('activo' | 'fallecido'), `foto_url`.

---

## 🎨 4. Sistema de Personalización Dinámica (Panel Admin)
El Panel de Administración (`web/admin.html`) incluye un motor de configuración dinámica que se sincroniza en tiempo real con el portal público a través de `localStorage` (y backend PHP):

1. **`🏠 Contenidos de Portada` (`cfg-portada`):**
   - Permite editar títulos, descripciones, contadores estadísticos y textos del héroe y secciones de `index.html`.
   - Llave `localStorage`: `padron_site_content`.

2. **`🎨 Apariencia e íconos` (`cfg-apariencia`):**
   - Permite cambiar la apariencia de 7 elementos clave (`nav-logo-icon`, `hero-mascot-icon`, `banner-icon`, `step-1-icon`, `step-2-icon`, `step-3-icon`, `footer-logo-icon`).
   - Soporta 3 tipos de entrada: **😀 Emojis**, **🖼️ Imágenes** (`web/Imagenes/` o subidas desde el equipo/Descargas) y **✨ GIFs / URLs**.
   - **Procesador Canvas HTML5:** Las imágenes subidas desde el equipo se optimizan y redimensionan automáticamente a máximo 400px x 400px (calidad 0.85) en formato Base64 DataURL para evitar errores de límite de memoria (`QuotaExceededError`).
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
└── web/
    ├── admin.html                 # Panel de administración completo
    ├── dashboard.html             # Panel ciudadano (mis mascotas, perfil, actas)
    ├── index.html                 # Portada principal pública
    ├── login.html                 # Acceso y registro de ciudadanos
    ├── mascota.html               # Vista pública de ficha de mascota (QR)
    ├── Imagenes/                  # Recursos gráficos (logos de El Grullo, escudos)
    ├── css/
    │   └── styles.css             # Estilos globales y componentes del sistema
    ├── js/
    │   ├── api-client.js          # Métodos JS para consumir APIs PHP
    │   ├── mock-data.js           # Datos simulados y fallback en cliente
    │   └── main.js                # Lógica de interfaz general
    ├── api/
    │   ├── config/
    │   │   ├── db.php             # Conexión MySQL PDO
    │   │   └── helpers.php        # Funciones auxiliares y control de sesión
    │   ├── auth.php               # Login, registro y sesión de usuarios
    │   ├── mascotas.php           # CRUD de mascotas
    │   ├── stats.php              # Estadísticas del censo
    │   └── contenido.php          # API de configuración del sitio
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
