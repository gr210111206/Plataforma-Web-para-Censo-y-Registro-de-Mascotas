/**
 * Cliente de la API REST
 * H. Ayuntamiento de El Grullo, Jalisco
 *
 * USO: carga este archivo en cada página HTML:
 *   <script src="js/api-client.js"></script>
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

// Site key de reCAPTCHA v3 — NO es secreta (a diferencia de la Secret Key,
// que solo vive en el servidor, ver database.php), por eso puede ir aquí
// en el frontend. Debe coincidir con el "render=" del <script> de Google
// cargado en login.html — es la misma llave en local y en producción
// (registrada para mascota-elgrullo.com y localhost a la vez).
const RECAPTCHA_SITE_KEY = '6Lc6aewtAAAAABAFuKrWLE0lyvFuWjylgaIx6UjS';

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

/**
 * Identificador aleatorio de ESTE navegador, para el correo de "se inició
 * sesión desde un dispositivo nuevo" (el servidor solo guarda su hash, ver
 * registrarDispositivo() en helpers.php). Vive en localStorage aparte de la
 * sesión, así que sobrevive a cerrar sesión. Si el navegador no deja usar
 * localStorage (modo privado estricto), se manda vacío y simplemente no
 * hay aviso.
 */
function _getDeviceId() {
  try {
    let id = localStorage.getItem('padron_device_id');
    if (!id) {
      id = (crypto.randomUUID ? crypto.randomUUID()
        : Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join(''));
      localStorage.setItem('padron_device_id', id);
    }
    return id;
  } catch { return ''; }
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

/**
 * Pide a reCAPTCHA v3 un token para la acción indicada (login, registro,
 * recuperar_password — deben coincidir exactamente con lo que espera cada
 * endpoint en auth.php). Si el script de Google no cargó (ej. sin
 * internet, o un bloqueador de contenido), devuelve null y el servidor
 * decide qué hacer sin token — no rompe el formulario por eso.
 */
function _getRecaptchaToken(action) {
  if (typeof grecaptcha === 'undefined') return Promise.resolve(null);
  return new Promise(resolve => {
    grecaptcha.ready(() => {
      grecaptcha.execute(RECAPTCHA_SITE_KEY, { action }).then(resolve).catch(() => resolve(null));
    });
  });
}

/* ══════════════════════════════════════════════
   AUTENTICACIÓN
   ══════════════════════════════════════════════ */

/**
 * Registro de cuenta de usuario (nombre, email, telefono, password,
 * direccion, colonia). Ya NO inicia sesión sola: la cuenta queda sin
 * confirmar hasta que la persona le da clic al enlace que le llega por
 * correo (ver HISTORIAL_CAMBIOS.md 2026-10-02 — verificación de correo).
 */
async function apiRegisterUser(nombre, email, telefono, password, direccion, colonia) {
  const recaptcha_token = await _getRecaptchaToken('registro');
  return _fetch(`${API_BASE_URL}/auth?action=register`, {
    method: 'POST',
    body: JSON.stringify({ nombre, email, telefono, password, direccion, colonia, recaptcha_token }),
  });
}

/**
 * Confirma el correo de una cuenta recién registrada, a partir del token
 * que llegó en el enlace del correo.
 */
async function apiVerificarEmail(token) {
  return _fetch(`${API_BASE_URL}/auth?action=verificar-email`, {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}

/**
 * Pide que se reenvíe el correo de confirmación (si esa cuenta existe y
 * todavía no se ha verificado). Responde el mismo mensaje en todos los
 * casos, para no revelar si el correo existe.
 */
async function apiReenviarVerificacion(email) {
  return _fetch(`${API_BASE_URL}/auth?action=reenviar-verificacion`, {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

/**
 * Login de usuario con email + password.
 * Si remember=true, la sesión se guarda en localStorage (sobrevive a cerrar
 * el navegador). Si remember=false, se guarda en sessionStorage (se pierde
 * al cerrar la pestaña/navegador, sin importar cuánto le quede al token).
 */
async function apiLoginUser(email, password, remember = false) {
  const recaptcha_token = await _getRecaptchaToken('login');
  const data = await _fetch(`${API_BASE_URL}/auth?action=login`, {
    method: 'POST',
    body: JSON.stringify({ email, password, recaptcha_token, device_id: _getDeviceId() }),
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
 * "Mis sesiones": dispositivos con sesión abierta en la cuenta actual.
 * @returns {Promise<{sesiones: Array, maximo: number}>}
 */
async function apiGetSesiones() {
  return _fetch(`${API_BASE_URL}/auth?action=sesiones`);
}

/** Cierra la sesión de OTRO dispositivo de la propia cuenta (pide la contraseña). */
async function apiCerrarSesion(id, password) {
  return _fetch(`${API_BASE_URL}/auth?action=cerrar-sesion`, {
    method: 'POST',
    body: JSON.stringify({ id, password }),
  });
}

/** Cierra todas las sesiones de la cuenta menos la de este dispositivo (pide la contraseña). */
async function apiCerrarOtrasSesiones(password) {
  return _fetch(`${API_BASE_URL}/auth?action=cerrar-otras-sesiones`, {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
}

/**
 * Cerrar sesión (solo la de este dispositivo)
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

/**
 * Cambia la contraseña de la sesión actual. El servidor exige la
 * contraseña actual correcta antes de aceptar la nueva.
 */
async function apiChangePassword(actual, nueva) {
  return _fetch(`${API_BASE_URL}/auth?action=change-password`, {
    method: 'POST',
    body: JSON.stringify({ actual, nueva }),
  });
}

/**
 * Solicita el correo de recuperación de contraseña. El servidor siempre
 * responde con el mismo mensaje exista o no esa cuenta registrada.
 */
async function apiSolicitarRecuperacion(email) {
  const recaptcha_token = await _getRecaptchaToken('recuperar_password');
  return _fetch(`${API_BASE_URL}/auth?action=solicitar-recuperacion`, {
    method: 'POST',
    body: JSON.stringify({ email, recaptcha_token }),
  });
}

/**
 * Fija una nueva contraseña a partir del token recibido por correo
 * (enlace tipo login.html?reset=TOKEN).
 */
async function apiRestablecerPassword(token, password) {
  return _fetch(`${API_BASE_URL}/auth?action=restablecer-password`, {
    method: 'POST',
    body: JSON.stringify({ token, password }),
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
 * Ver una mascota por su token público (PÚBLICO — para el QR/acta).
 * No es el folio: es un valor aleatorio (mascotas.token_publico) para que
 * conocer/adivinar un folio no alcance para consultar los datos de nadie.
 * @param {string} token  pet.link_publico ya trae este valor listo para usar
 */
async function apiGetMascotaPublica(token) {
  return _fetch(`${API_BASE_URL}/mascotas?token=${encodeURIComponent(token)}`);
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
 * @param {string} id    Folio M-GRU-XXXXXXXXX
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
 * @param {string} id  Folio M-GRU-XXXXXXXXX
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

/**
 * Mascotas y ciudadanos registrados en el tiempo (solo admin).
 * @param {'semana'|'mes'|'ano'} periodo  últimos 7 días / 30 días / 12 meses
 * @returns {Promise<{periodo, puntos: Array<{clave, mascotas, ciudadanos}>, totales}>}
 */
async function apiGetRegistros(periodo) {
  return _fetch(`${API_BASE_URL}/stats?serie=registros&periodo=${encodeURIComponent(periodo)}`);
}

/* ══════════════════════════════════════════════
   CONTENIDO PÚBLICO
   ══════════════════════════════════════════════ */

async function apiGetCampanas() {
  return _fetch(`${API_BASE_URL}/campanas`);
}

/** Crea una campaña/aviso. Requiere sesión de admin. */
async function apiCrearCampana(data) {
  return _fetch(`${API_BASE_URL}/campanas`, { method: 'POST', body: JSON.stringify(data) });
}

/** Actualiza una campaña/aviso existente. Requiere sesión de admin. */
async function apiActualizarCampana(id, data) {
  return _fetch(`${API_BASE_URL}/campanas?id=${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) });
}

/** Elimina una campaña/aviso. Requiere sesión de admin. */
async function apiEliminarCampana(id) {
  return _fetch(`${API_BASE_URL}/campanas?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
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
 * Edita nombre/teléfono/dirección/colonia de una cuenta de Ciudadano o
 * Asistente. Requiere sesión de SUPERADMIN — el servidor responde 403
 * si la llama un admin normal.
 */
async function apiEditarCuentaUsuario(id, data) {
  return _fetch(`${API_BASE_URL}/usuarios?action=editar-cuenta`, {
    method: 'POST',
    body: JSON.stringify({ id, ...data }),
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
 * Le quita el rol admin a una cuenta (vuelve a 'ciudadano'). Requiere
 * sesión de SUPERADMIN — el servidor responde 403 si la llama un admin
 * normal, y 400 si se intenta contra la propia cuenta superadmin.
 */
async function apiRevocarAdmin(id) {
  return _fetch(`${API_BASE_URL}/usuarios?action=revocar-admin`, {
    method: 'POST',
    body: JSON.stringify({ id }),
  });
}

/**
 * Le asigna correo y contraseña a un ciudadano que no tenía (registrado
 * sin correo por un asistente), para que pueda iniciar sesión por su
 * cuenta. Requiere sesión de admin (cualquiera, no solo superadmin).
 * Solo funciona si la cuenta todavía no tiene correo.
 */
async function apiAsignarCorreo(id, email, password) {
  return _fetch(`${API_BASE_URL}/usuarios?action=asignar-correo`, {
    method: 'POST',
    body: JSON.stringify({ id, email, password }),
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
   BITÁCORA (auditoría — solo admin)
   ══════════════════════════════════════════════ */

/** Lista paginada de la bitácora de auditoría. Requiere sesión de admin. */
async function apiGetBitacora(filtros = {}) {
  const params = new URLSearchParams(filtros);
  return _fetch(`${API_BASE_URL}/bitacora?${params}`);
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

