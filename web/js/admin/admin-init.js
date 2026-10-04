/* ══════════════════════════════════════════════════ */
/*  INIT — protege la página (solo admin) y carga datos reales */
/* ══════════════════════════════════════════════════ */
let adminArticulos = [];
let currentUser = null;

/** true si la cuenta en sesión es la única marcada es_superadmin=1 en la BD. */
function esSuperAdmin(u) {
  return !!u && Number(u.es_superadmin) === 1;
}

/* ══════════════════════════════════════════════════ */
/*  MI PERFIL — mismo patrón que dashboard.html (ciudadano),  */
/*  aplicado a la cuenta de admin/superadmin en sesión.        */
/* ══════════════════════════════════════════════════ */

/** Devuelve el HTML del avatar: la foto guardada si existe, si no las iniciales. */
function _avatarHtml(fotoPerfil, initials) {
  return fotoPerfil
    ? `<img src="${fotoPerfil}" alt="Foto de perfil" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`
    : initials;
}

function applyCurrentUserToUI() {
  const nombre   = currentUser.nombre || 'Administrador';
  const initials = nombre.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';
  const avatar   = _avatarHtml(currentUser.foto_perfil, initials);

  document.getElementById('sidebarAvatar').innerHTML  = avatar;
  document.getElementById('sidebarUserName').textContent = nombre.split(' ').slice(0, 2).join(' ');
  document.getElementById('sidebarUserRole').textContent = esSuperAdmin(currentUser) ? 'Superadmin' : 'Panel admin';

  document.getElementById('profileAvatar').innerHTML  = avatar;
  document.getElementById('profileName').textContent  = nombre;
  document.getElementById('profileRoleLabel').textContent = esSuperAdmin(currentUser) ? 'Superadmin' : 'Administrador';
  document.getElementById('perfil-nombre').value      = nombre;
  document.getElementById('perfil-telefono').value    = currentUser.telefono || '';
  document.getElementById('perfil-email-field').value = currentUser.email || '';
}

async function saveProfile() {
  const nombre   = document.getElementById('perfil-nombre').value.trim();
  const telefono = document.getElementById('perfil-telefono').value.trim();
  const email    = document.getElementById('perfil-email-field').value.trim();

  if (!nombre)   { showToast('El nombre no puede quedar vacío', 'error'); return; }
  if (!telefono) { showToast('El teléfono de contacto es obligatorio', 'error'); return; }
  if (!email)    { showToast('El correo electrónico no puede quedar vacío', 'error'); return; }

  const payload = { nombre, telefono, email };
  if (window._pendingAvatarFoto) payload.foto_perfil = window._pendingAvatarFoto;

  try {
    const updated = await apiUpdateProfile(payload);
    currentUser = { ...currentUser, ...updated };
    window._pendingAvatarFoto = null;
    applyCurrentUserToUI();
    localStorage.setItem('padron_session', JSON.stringify({ ...JSON.parse(localStorage.getItem('padron_session') || '{}'), ...updated }));
    // Si el correo cambió, el servidor manda un aviso distinto (hay que
    // volver a confirmarlo) — se muestra tal cual en vez del genérico.
    showToast(updated.message || 'Perfil actualizado correctamente', 'success');
  } catch (err) {
    showToast(`${err.message}`, 'error');
  }
}

async function changePassword() {
  const actual  = document.getElementById('pass-actual').value;
  const nueva   = document.getElementById('pass-nueva').value;
  const confirm = document.getElementById('pass-nueva-confirm').value;

  if (!actual) { showToast('Escribe tu contraseña actual', 'error'); return; }
  if (nueva !== confirm) { showToast('Las contraseñas nuevas no coinciden', 'error'); return; }
  if (nueva.length < 8) { showToast('La nueva contraseña debe tener al menos 8 caracteres', 'error'); return; }

  try {
    await apiChangePassword(actual, nueva);
    // El servidor ya invalidó el token de esta sesión al cambiar la
    // contraseña (por seguridad) — hay que volver a iniciar sesión.
    showToast('Contraseña actualizada. Vuelve a iniciar sesión.', 'success');
    localStorage.removeItem('padron_session');
    sessionStorage.removeItem('padron_session');
    setTimeout(() => { window.location.href = 'login.html'; }, 1500);
  } catch (err) {
    showToast(`${err.message}`, 'error');
  }
}

/* Mismo bug que se corrigió en dashboard.html: antes esto no existía aquí
   (el admin no tenía "Mi perfil"); se implementa ya con validación de
   tamaño y redimensionado por Canvas desde el inicio, dejando la foto
   pendiente hasta que se pulse "Guardar cambios". */
function changeAvatar(input) {
  const file = input.files[0]; if (!file) return;
  if (file.size > 5 * 1024 * 1024) { showToast('La foto no debe superar 5 MB', 'error'); return; }

  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      const maxDim = 300;
      let w = img.width, h = img.height;
      if (w > maxDim || h > maxDim) {
        if (w > h) { h = Math.round((h * maxDim) / w); w = maxDim; }
        else       { w = Math.round((w * maxDim) / h); h = maxDim; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      const optimized = canvas.toDataURL('image/jpeg', 0.85);

      window._pendingAvatarFoto = optimized;
      document.getElementById('profileAvatar').innerHTML = _avatarHtml(optimized, '');
      document.getElementById('sidebarAvatar').innerHTML = _avatarHtml(optimized, '');
      showToast('Foto lista — pulsa "Guardar cambios" para aplicarla', 'info');
    };
    img.onerror = () => showToast('No se pudo procesar la imagen', 'error');
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

async function initAdmin() {
  currentUser = await apiRequireSession(); // redirige a login.html si no hay sesión válida
  if (currentUser.rol === 'asistente') { window.location.href = 'asistente.html'; return; }
  if (currentUser.rol !== 'admin') { window.location.href = 'dashboard.html'; return; }

  // "Datos" y "Bitácora" solo para el superadmin (a petición del usuario,
  // 2026-09-30). "Datos" es solo ocultar el menú — sus números ya son
  // públicos de todas formas (los mismos que ve cualquiera en index.html),
  // así que no hace falta protegerlo también en el servidor. "Bitácora" sí
  // queda protegida de verdad en el servidor (bitacora.php ahora exige
  // requireSuperAdmin()) — ocultar el link es solo para que no aparezca un
  // botón que de todos modos fallaría con 403 para un admin normal.
  //
  // Importante: el HTML ya trae estos 2 links ocultos por defecto (y
  // "Seguimiento" como sección inicial) — aquí solo se REVELAN para quien
  // sí es superadmin, nunca al revés. Antes era al revés (visibles por
  // defecto, se ocultaban aquí) y eso dejaba ver "Datos"/"Bitácora" un
  // instante a CUALQUIER admin mientras la página cargaba, antes de que
  // este código alcanzara a correr (bug reportado con capturas, 2026-10-01).
  if (esSuperAdmin(currentUser)) {
    document.getElementById('nav-datos').style.display = '';
    document.getElementById('nav-bitacora').style.display = '';
  }

  await primeConfigFromServer();
  applyAdminOwnAppearance();
  applyCurrentUserToUI();

  const notaRoles = document.getElementById('roles-admin-note');
  if (notaRoles && esSuperAdmin(currentUser)) {
    notaRoles.innerHTML = 'Como <strong>superadmin</strong>, eres la única cuenta que puede convertir a un Ciudadano o Asistente en Administrador (botón "Hacer administrador") o quitarle ese rol de vuelta (botón "Quitar administrador"). La cuenta resultante de "Hacer administrador" será un admin normal: no podrá promover ni revocar a nadie más. Tu propia cuenta superadmin nunca puede perder el rol de administrador desde aquí.';
  }

  try {
    stats = await apiGetStats();
  } catch (err) {
    showToast(`No se pudieron cargar las estadísticas: ${err.message}`, 'error');
    stats = {};
  }
  try {
    avisoData = [...(await apiGetCampanas())];
  } catch (err) { avisoData = []; }
  try {
    adminArticulos = await apiGetArticulos();
  } catch (err) { adminArticulos = []; }

  const badge = document.getElementById('seguimiento-badge');
  if (badge) badge.textContent = stats.total_mascotas ?? 0;

  const mapCountEl = document.getElementById('mapCount');
  if (mapCountEl) mapCountEl.textContent = stats.total_mascotas ?? 0;

  renderVacunacionPie();
  renderKpiRow();
  renderMiniBar();

  // Solo las 10 más recientes para la mini-tabla de "Datos" — antes se
  // traían TODAS las mascotas (con foto en Base64 incluida) nada más para
  // sacar estas 10, en cada carga del panel. "Seguimiento" (tarjetas
  // detalladas) y "Usuarios"/"Roles y Cuentas" ya cargan solo cuando el
  // admin abre esa pestaña (ver showAdmin), cada una con su propia página
  // — con miles de registros, traer todo de entrada fue lo que congeló el
  // panel antes (ver HISTORIAL_CAMBIOS.md, 2026-08-25).
  try {
    const { rows } = await apiGetTodasMascotas({ page: 1, pageSize: 10 });
    renderMiniTable(rows);
  } catch (err) {
    showToast(`No se pudieron cargar las mascotas recientes: ${err.message}`, 'error');
    renderMiniTable([]);
  }

  renderAdminArtList();
  renderAvisos();
  renderEventos();
  renderFaqTable();

  // Sección inicial: "Datos" (con su mapa) para quien sí puede verla,
  // "Seguimiento" para todos los demás — showAdmin() ya se encarga de
  // inicializar el mapa la primera vez que se entra a "datos".
  showAdmin(esSuperAdmin(currentUser) ? 'datos' : 'seguimiento');
}

