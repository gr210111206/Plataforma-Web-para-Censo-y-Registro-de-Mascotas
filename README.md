# 🐾 Plataforma Web para Censo y Registro de Mascotas

> **H. Ayuntamiento Constitucional de El Grullo, Jalisco · 2024-2027**  
> Portal municipal para el registro oficial y seguimiento del padrón de mascotas.

---

## 🌐 Demo

Abre `web/index.html` en tu navegador para ver el portal público.

| Página | Descripción |
|---|---|
| `web/index.html` | Portal público / Landing page |
| `web/login.html` | Inicio de sesión y registro ciudadano |
| `web/dashboard.html` | Portal del ciudadano |
| `web/admin.html` | Panel de administración |

### Cuentas de prueba

| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | admin@demo.com | Admin1234 |
| Ciudadano | ciudadano@demo.com | Demo1234 |

---

## 🗂️ Estructura del proyecto

```
web/
├── index.html          # Página principal pública
├── login.html          # Autenticación
├── dashboard.html      # Dashboard ciudadano
├── admin.html          # Panel administrador
├── css/
│   └── styles.css      # Hoja de estilos global
└── js/
    └── mock-data.js    # Datos de prueba (mock)
```

---

## ✨ Características

### Portal Público (`index.html`)
- Hero animado con slogan municipal
- Sección "¿Cómo funciona?" con pasos visuales
- Campañas de vacunación y esterilización
- Artículos / Tips de cuidado animal
- Preguntas frecuentes (FAQ)
- Mapa interactivo (Leaflet / OpenStreetMap)
- Footer dinámico configurable desde el admin

### Panel Ciudadano (`dashboard.html`)
- Registro y administración de mascotas
- Descarga de acta oficial con folio único
- Perfil editable con foto de avatar
- Sección de campañas y artículos

### Panel Administrador (`admin.html`)
- Dashboard con estadísticas y mapa de mascotas
- Gráficas (dona + barras horizontales)
- Tabla de búsqueda del padrón
- Módulo de artículos con editor WYSIWYG
- Gestión de avisos y eventos
- **Configuración del sitio:**
  - 🎨 Apariencia e íconos (emoji / imagen / GIF)
  - 🏛️ Datos del municipio (presidente, responsables, escudo)
  - 🖌️ Tema visual (color picker, tipografía, toggles) con **vista previa en vivo**
  - 🌐 SEO y metadatos (título, descripción, Open Graph, Google Analytics) con **preview de Google**
  - 📞 Contactos y redes sociales (footer dinámico)
  - 📋 Reglamento municipal
  - 📢 Avisos y promociones
  - 📅 Eventos / campañas
  - ❓ Preguntas frecuentes

---

## 🛠️ Tecnologías

- **Frontend:** HTML5, CSS3 (Vanilla), JavaScript ES6+
- **Fuentes:** Google Fonts — Inter, Outfit
- **Mapa:** Leaflet.js + OpenStreetMap
- **Persistencia:** localStorage (datos de configuración)
- **Backend (pendiente):** Laravel 11 + MySQL (ver guía adjunta)

---

## 📋 Instalación

No requiere instalación. Es un sitio estático:

```bash
# Clona el repositorio
git clone https://github.com/gr210111206/Plataforma-Web-para-Censo-y-Registro-de-Mascotas.git

# Abre en navegador
start web/index.html   # Windows
open web/index.html    # macOS
```

> Para un entorno de desarrollo completo con servidor local, usa Live Server (VS Code extension).

---

## 👥 Autores

Desarrollado como proyecto de **Residencias Profesionales**  
Instituto Tecnológico José Mario Molina Pasquel y Henríquez (ITJMM) — Campus El Grullo

---

## 📄 Licencia

Uso interno municipal. © 2024-2027 H. Ayuntamiento de El Grullo, Jalisco.
