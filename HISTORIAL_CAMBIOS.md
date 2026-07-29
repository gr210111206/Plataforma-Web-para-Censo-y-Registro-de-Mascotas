# 📜 Historial de Cambios — REMAC (Padrón Municipal de Mascotas El Grullo)

Este documento registra cronológicamente todos los cambios, mejoras, correcciones y actualizaciones realizadas en la plataforma web y base de datos del proyecto **REMAC**.

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
