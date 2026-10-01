# 📦 Librerías de terceros y licencias

Este documento lista **todo** lo externo que usa el proyecto (confirmado revisando el código real, no de memoria) y la licencia de cada cosa, para dejar claro que el proyecto se puede entregar al H. Ayuntamiento de El Grullo sin ningún problema legal ni de derechos de autor.

**Resumen corto: todo lo que usa el proyecto es gratuito, de código abierto, y ninguna licencia exige pagar nada ni pedir permiso para usarlo en un sistema de gobierno.** La única obligación real (ya cumplida) es mostrar el crédito de OpenStreetMap en el mapa.

---

## 1. Librerías de JavaScript (cargadas desde CDN)

| Librería | Versión | Dónde se usa | Licencia | ¿Atribución obligatoria? |
|---|---|---|---|---|
| **[Leaflet](https://leafletjs.com/)** | 1.9.4 | Mapa de mascotas por colonia (`index.html`, `admin.html`) | [BSD de 2 cláusulas](https://github.com/Leaflet/Leaflet/blob/main/LICENSE) | No |
| **[jsPDF](https://github.com/parallax/jsPDF)** | 2.5.1 | Generar el acta oficial en PDF (`dashboard.html`, `admin.html`, `asistente.html`) | [MIT](https://github.com/parallax/jsPDF/blob/master/LICENSE) | No |
| **[QRCode.js](https://github.com/davidshimjs/qrcodejs)** (davidshimjs) | 1.0.0 | Generar el código QR del acta (`dashboard.html`, `admin.html`, `asistente.html`) | [MIT](https://github.com/davidshimjs/qrcodejs/blob/master/LICENSE) | No |

Las 3 se cargan directo desde un CDN público (`cdnjs.cloudflare.com` / `unpkg.com`) con `<script src="...">` — el proyecto nunca copió ni modificó su código fuente, solo las usa tal cual las publican sus autores.

**BSD-2-Clause y MIT** son de las licencias más permisivas que existen: permiten usar, copiar, modificar y usar en cualquier proyecto (incluido uno de gobierno o comercial) sin pagar nada y sin tener que hacer público el código propio. Solo piden conservar el aviso de copyright **si se redistribuye el código fuente de la librería misma** — como aquí solo se *usa* (no se redistribuye su código), ni siquiera aplica esa condición.

---

## 2. Mapa de calles — OpenStreetMap

| Recurso | Dónde se usa | Licencia | ¿Atribución obligatoria? |
|---|---|---|---|
| **Teselas del mapa** (`tile.openstreetmap.org`) | `index.html`, `admin.html` | [ODbL](https://www.openstreetmap.org/copyright) (datos) | **Sí — ya está puesta** |

A diferencia de las librerías de arriba, el mapa de calles de OpenStreetMap **sí exige** mostrar el crédito "© OpenStreetMap contributors" junto al mapa — el proyecto ya lo hace (está en el código: `attribution: '© OpenStreetMap contributors'`), así que ya se cumple.

**Nota para cuando el sitio tenga tráfico real:** el servidor público de teselas (`tile.openstreetmap.org`) tiene una [política de uso](https://operations.osmfoundation.org/policies/tiles/) pensada para uso ligero/de pruebas, no para un sitio de producción con mucho tráfico — no es un tema de licencia (los datos siguen siendo gratis), sino de no saturar su servidor gratuito. Si el padrón crece mucho, lo recomendable sería cambiar a un proveedor de teselas con mejor capacidad (ej. MapTiler o Stadia Maps, ambos tienen una capa gratuita). No es urgente, solo algo a vigilar más adelante.

---

## 3. Tipografías — Google Fonts

| Fuente | Dónde se usa | Licencia | ¿Atribución obligatoria? |
|---|---|---|---|
| **Outfit** | Títulos, en todo el sitio | [SIL Open Font License 1.1](https://openfontlicense.org/) | No |
| **Inter** | Texto de cuerpo, en todo el sitio | [SIL Open Font License 1.1](https://openfontlicense.org/) | No |

Se cargan desde `fonts.googleapis.com` (gratis, sin cuenta ni API key) — una en `web/css/styles.css` (línea 7, con `@import`, la usan `index.html`/`login.html`/`dashboard.html`/`admin.html`/`asistente.html`) y otra copia independiente en `mascota.html` (que no comparte esa hoja de estilos). La licencia OFL es la estándar para tipografías libres: se pueden usar en cualquier proyecto, incluso comercial, sin pagar ni pedir permiso.

---

## 4. Íconos — Lucide

| Recurso | Dónde se usa | Licencia | ¿Atribución obligatoria? |
|---|---|---|---|
| **[Lucide](https://lucide.dev/)** (fork de Feather Icons) | Casi todos los íconos de línea del sitio (sidebar, botones, tarjetas) | [ISC](https://github.com/lucide-icons/lucide/blob/main/LICENSE) | No |

Importante: **no es una librería cargada en tiempo real** — el proyecto tomó el SVG (`<path>`) de cada ícono que necesitaba directo del repositorio oficial de Lucide y lo pegó dentro del propio HTML (ver `HISTORIAL_CAMBIOS.md`, 2026-08-06). No hay ningún `<script>` ni archivo de Lucide en el proyecto, solo se reutilizó el *dibujo* de cada ícono. La licencia ISC es, en la práctica, igual de permisiva que MIT (a veces hasta se confunden — por eso la entrada original del historial decía "MIT/ISC"; la correcta es **ISC**).

---

## 5. Lo que NO es una librería (para que quede claro)

Estos aparecen como enlaces (`<a href="...">`) en el sitio, pero el proyecto no ejecuta ni depende de su código — un visitante simplemente puede darles clic para salir a otra página, como cualquier liga a internet:

- `giphy.com` — en "Apariencia e íconos" del panel admin, solo como sugerencia de dónde buscar un GIF para subir (no se usa su API).
- `facebook.com/laciudaddelagente`, `instagram.com/laciudaddelagente` — redes sociales del footer.
- `elgrullo.gob.mx` — enlace al sitio oficial del Ayuntamiento.

---

## 6. Backend (PHP) y base de datos

El backend es **100% PHP nativo sin ninguna librería ni paquete externo** (no hay Composer, no hay `vendor/`, no hay `package.json`) — por decisión del propio proyecto, para no depender de nada fuera de lo que ya trae un hosting compartido como HostGator. Lo único que usa son extensiones que **ya vienen incluidas con PHP mismo** (PDO para MySQL, `password_hash()`, etc.), cubiertas por la [licencia de PHP](https://www.php.net/license/) — igual de libre, sin restricciones para este uso.

---

## ✅ Conclusión

| Pregunta | Respuesta |
|---|---|
| ¿Alguna librería exige pagar una licencia? | No, ninguna. |
| ¿Alguna obliga a hacer público el código del proyecto? | No — todas son licencias permisivas (MIT/BSD/ISC/OFL), no "copyleft" tipo GPL. |
| ¿Hay que pedirle permiso a algún autor? | No. |
| ¿Hay alguna atribución pendiente de poner? | No — la única obligatoria (OpenStreetMap) ya está en el mapa. |
| ¿Es seguro entregar el proyecto al Ayuntamiento tal como está? | Sí, en cuanto a librerías de terceros no hay ningún impedimento legal. |

*(Última revisión: 2026-10-01, verificado contra el código real del repositorio — no se asumió nada de memoria.)*
