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

// Se calcula solo a partir de dónde se cargó la página (no un valor fijo):
// http://localhost/remac/index.html      → http://localhost/remac/api
// http://192.168.0.230/remac/index.html  → http://192.168.0.230/remac/api  (celular en la misma red)
// https://tudominio.com/index.html       → https://tudominio.com/api      (HostGator, sin tocar nada)
// La carpeta api/ siempre vive junto a los archivos .html, así que esto
// funciona en cualquier equipo/dispositivo/dominio sin editar este archivo.
const API_BASE_URL = window.location.origin +
  window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/')) + '/api';

// En desarrollo local, usa mock-data en vez de la API:
const USE_MOCK = false;  // → Cambia a true si aún no tienes hosting

/* ══════════════════════════════════════════════
   HELPERS INTERNOS
   ══════════════════════════════════════════════ */

function _getSessionRaw() {
  return localStorage.getItem('padron_session') || sessionStorage.getItem('padron_session');
}

function _getToken() {
  try {
    const session = JSON.parse(_getSessionRaw() || '{}');
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
 * Registro de cuenta de usuario (nombre, email, telefono, password)
 */
async function apiRegisterUser(nombre, email, telefono, password) {
  const data = await _fetch(`${API_BASE_URL}/auth?action=register`, {
    method: 'POST',
    body: JSON.stringify({ nombre, email, telefono, password }),
  });
  localStorage.setItem('padron_session', JSON.stringify({
    token:    data.token,
    nombre:   data.nombre,
    email:    data.email,
    telefono: data.telefono,
    rol:      data.rol,
  }));
  return data;
}

/**
 * Login de usuario con email + password.
 * Si remember=true, la sesión se guarda en localStorage (sobrevive a cerrar
 * el navegador). Si remember=false, se guarda en sessionStorage (se pierde
 * al cerrar la pestaña/navegador, sin importar cuánto le quede al token).
 */
async function apiLoginUser(email, password, remember = false) {
  const data = await _fetch(`${API_BASE_URL}/auth?action=login`, {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  const session = JSON.stringify({
    token:         data.token,
    nombre:        data.nombre,
    email:         data.email,
    telefono:      data.telefono,
    rol:           data.rol,
    es_superadmin: data.es_superadmin,
  });
  if (remember) {
    localStorage.setItem('padron_session', session);
    sessionStorage.removeItem('padron_session');
  } else {
    sessionStorage.setItem('padron_session', session);
    localStorage.removeItem('padron_session');
  }
  return data;
}

/**
 * Cerrar sesión
 */
async function apiLogout() {
  await _fetch(`${API_BASE_URL}/auth?action=logout`, { method: 'POST' });
  localStorage.removeItem('padron_session');
  sessionStorage.removeItem('padron_session');
}

/**
 * Valida el token guardado contra el servidor y devuelve los datos
 * del usuario autenticado. Lanza si no hay sesión válida.
 * Úsala al cargar dashboard.html / admin.html para proteger la página
 * (no basta con confiar en lo que haya en localStorage).
 */
async function apiGetMe() {
  return _fetch(`${API_BASE_URL}/auth?action=me`);
}

/**
 * Protege una página: exige sesión válida (y opcionalmente un rol).
 * Si no hay sesión válida, limpia localStorage y redirige a login.html.
 * @param {string|null} rolRequerido  'admin' | 'ciudadano' | null (cualquiera)
 * @returns {Promise<Object>} datos del usuario autenticado
 */
/**
 * Actualiza datos del perfil del usuario en sesión (nombre, teléfono, dirección, colonia).
 */
async function apiUpdateProfile(data) {
  return _fetch(`${API_BASE_URL}/auth?action=update-profile`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

async function apiRequireSession(rolRequerido = null) {
  try {
    const user = await apiGetMe();
    if (rolRequerido && user.rol !== rolRequerido) {
      throw new Error('No tienes permiso para ver esta página.');
    }
    return user;
  } catch (err) {
    localStorage.removeItem('padron_session');
    sessionStorage.removeItem('padron_session');
    window.location.href = 'login.html';
    throw err;
  }
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

/** Crea un artículo nuevo. Requiere sesión de admin. */
async function apiCrearArticulo(data) {
  return _fetch(`${API_BASE_URL}/articulos`, { method: 'POST', body: JSON.stringify(data) });
}

/** Actualiza un artículo existente. Requiere sesión de admin. */
async function apiActualizarArticulo(id, data) {
  return _fetch(`${API_BASE_URL}/articulos?id=${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) });
}

/** Elimina un artículo. Requiere sesión de admin. */
async function apiEliminarArticulo(id) {
  return _fetch(`${API_BASE_URL}/articulos?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
}

/* ══════════════════════════════════════════════
   USUARIOS (gestión de cuentas ciudadanas y de personal)
   ══════════════════════════════════════════════ */

/** Lista/busca cuentas de ciudadanos registrados. Requiere sesión de admin o asistente. */
async function apiGetUsuarios(filtros = {}) {
  const params = new URLSearchParams(filtros);
  return _fetch(`${API_BASE_URL}/usuarios?${params}`);
}

/** Activa o desactiva la cuenta de un ciudadano. Requiere sesión de admin. */
async function apiSetUsuarioActivo(id, activo) {
  return _fetch(`${API_BASE_URL}/usuarios?id=${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify({ activo }),
  });
}

/**
 * Crea una cuenta con correo y contraseña (puede iniciar sesión).
 * Requiere sesión de admin. rol debe ser 'ciudadano' o 'asistente'
 * (el servidor rechaza cualquier otro valor, incluido 'admin').
 */
async function apiCrearCuentaUsuario(data) {
  return _fetch(`${API_BASE_URL}/usuarios?action=crear-cuenta`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Convierte una cuenta existente (ciudadano o asistente) en admin.
 * Requiere sesión de SUPERADMIN (no cualquier admin) — el servidor
 * responde 403 si la llama un admin normal.
 */
async function apiPromoverAAdmin(id) {
  return _fetch(`${API_BASE_URL}/usuarios?action=promover-admin`, {
    method: 'POST',
    body: JSON.stringify({ id }),
  });
}

/**
 * Busca un ciudadano por teléfono; si no existe, lo crea SIN correo
 * (registro asistido). Requiere sesión de admin o asistente.
 * @returns {Promise<Object>} el ciudadano encontrado o recién creado,
 *          con `existed: true|false`.
 */
async function apiBuscarOCrearCiudadano(data) {
  return _fetch(`${API_BASE_URL}/usuarios?action=buscar-o-crear`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/* ══════════════════════════════════════════════
   CONFIGURACIÓN DEL SITIO (apariencia, portada, municipio, contactos)
   Guardada en el servidor para que TODOS los visitantes vean los
   mismos cambios hechos desde el panel admin (no solo el propio
   navegador del administrador).
   ══════════════════════════════════════════════ */

/**
 * Obtiene toda la configuración pública del sitio.
 * @returns {Promise<Object>} { padron_site_config: {...}, padron_appearance_config: {...}, ... }
 */
async function apiGetSiteConfig() {
  return _fetch(`${API_BASE_URL}/settings`);
}

/**
 * Guarda (upsert) una clave de configuración. Requiere sesión de admin.
 * @param {string} key    Ej: 'padron_appearance_config'
 * @param {Object} value  Objeto serializable a JSON
 */
async function apiSaveSiteConfig(key, value) {
  return _fetch(`${API_BASE_URL}/settings`, {
    method: 'POST',
    body: JSON.stringify({ key, value }),
  });
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
