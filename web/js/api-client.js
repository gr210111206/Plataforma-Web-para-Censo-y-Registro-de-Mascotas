/**
 * REMAC — Cliente de la API REST
 * H. Ayuntamiento de El Grullo, Jalisco
 *
 * Este archivo reemplaza las llamadas a mock-data.js
 * cuando el backend en HostGator esté listo.
 *
 * USO:
 *   1. Cambia API_BASE_URL a tu dominio real.
 *   2. En cada página HTML, carga este archivo
 *      EN VEZ de mock-data.js:
 *        <script src="js/api-client.js"></script>
 */

/* ══════════════════════════════════════════════
   CONFIGURACIÓN
   ══════════════════════════════════════════════ */

// Cambia esto a tu dominio real cuando tengas el hosting:
const API_BASE_URL = 'https://tudominio.com/api';

// En desarrollo local, usa mock-data en vez de la API:
const USE_MOCK = false;  // → Cambia a true si aún no tienes hosting

/* ══════════════════════════════════════════════
   HELPERS INTERNOS
   ══════════════════════════════════════════════ */

function _getToken() {
  try {
    const session = JSON.parse(localStorage.getItem('padron_session') || '{}');
    return session.token || null;
  } catch { return null; }
}

function _authHeaders() {
  const token = _getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function _fetch(url, options = {}) {
  options.headers = { ..._authHeaders(), ...(options.headers || {}) };
  const res = await fetch(url, options);
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || 'Error desconocido');
  return json.data;
}

/* ══════════════════════════════════════════════
   AUTENTICACIÓN
   ══════════════════════════════════════════════ */

/**
 * Login de ciudadano con CURP + Nombre
 */
async function apiLoginCiudadano(nombre, curp) {
  const data = await _fetch(`${API_BASE_URL}/auth?action=login`, {
    method: 'POST',
    body: JSON.stringify({ nombre, curp }),
  });
  localStorage.setItem('padron_session', JSON.stringify({
    token:  data.token,
    nombre: data.nombre,
    curp:   data.curp,
    rol:    data.rol,
  }));
  return data;
}

/**
 * Login de administrador con email + password
 */
async function apiLoginAdmin(email, password) {
  const data = await _fetch(`${API_BASE_URL}/auth?action=login`, {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  localStorage.setItem('padron_session', JSON.stringify({
    token:  data.token,
    nombre: data.nombre,
    rol:    data.rol,
  }));
  return data;
}

/**
 * Cerrar sesión
 */
async function apiLogout() {
  await _fetch(`${API_BASE_URL}/auth?action=logout`, { method: 'POST' });
  localStorage.removeItem('padron_session');
}

/* ══════════════════════════════════════════════
   MASCOTAS
   ══════════════════════════════════════════════ */

/**
 * Obtener las mascotas del ciudadano en sesión.
 * Equivalente a getMisMascotas() de mock-data.js
 */
async function apiGetMisMascotas() {
  return _fetch(`${API_BASE_URL}/mascotas`);
}

/**
 * Obtener todas las mascotas (admin) con filtros opcionales.
 * @param {Object} filtros  { especie, estatus, colonia, q }
 */
async function apiGetTodasMascotas(filtros = {}) {
  const params = new URLSearchParams(filtros);
  return _fetch(`${API_BASE_URL}/mascotas?${params}`);
}

/**
 * Ver una mascota por su ID REMAC (PÚBLICO — para el QR).
 * @param {string} id  Ej: "REMAC-GRU-00004"
 */
async function apiGetMascota(id) {
  return _fetch(`${API_BASE_URL}/mascotas?id=${encodeURIComponent(id)}`);
}

/**
 * Registrar una nueva mascota.
 * @param {Object} data  Datos del formulario de registro
 */
async function apiRegistrarMascota(data) {
  return _fetch(`${API_BASE_URL}/mascotas`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Actualizar datos de una mascota.
 * @param {string} id    Folio REMAC-GRU-XXXXX
 * @param {Object} data  Campos a actualizar
 */
async function apiActualizarMascota(id, data) {
  return _fetch(`${API_BASE_URL}/mascotas?id=${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Dar de baja una mascota (soft delete — estatus = 'Baja').
 * @param {string} id  Folio REMAC-GRU-XXXXX
 */
async function apiDarDeBajaMascota(id) {
  return _fetch(`${API_BASE_URL}/mascotas?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

/* ══════════════════════════════════════════════
   ESTADÍSTICAS
   ══════════════════════════════════════════════ */

/**
 * Obtener estadísticas para el dashboard y mapa.
 * Equivalente a getStats() de mock-data.js
 */
async function apiGetStats() {
  return _fetch(`${API_BASE_URL}/stats`);
}

/* ══════════════════════════════════════════════
   CONTENIDO PÚBLICO
   ══════════════════════════════════════════════ */

async function apiGetCampanas() {
  return _fetch(`${API_BASE_URL}/campanas`);
}

async function apiGetArticulos() {
  return _fetch(`${API_BASE_URL}/articulos`);
}

/* ══════════════════════════════════════════════
   COMPATIBILIDAD con mock-data.js
   Si USE_MOCK = true, las llamadas van a mock-data.
   Así puedes cambiar fácilmente de mock → API real.
   ══════════════════════════════════════════════ */

if (typeof USE_MOCK !== 'undefined' && USE_MOCK) {
  console.info('[REMAC] Modo MOCK activo — usando datos locales');
} else {
  console.info('[REMAC] Modo API activo →', API_BASE_URL);
}
