/* ══════════════════════════════════════════════════ */
/*  ROLES — todas las cuentas (Ciudadano + Asistente)  */
/* ══════════════════════════════════════════════════ */
let allCuentas = [];
const rolesState = { sortKey: null, sortDir: 1, page: 1 };

async function loadRolesTable() {
  const params = { rol: 'todos', page: rolesState.page, pageSize: PAGE_SIZE };
  const q = document.getElementById('rolesSearch').value.trim();
  if (q) params.q = q;
  if (rolesState.sortKey) { params.sort = rolesState.sortKey; params.dir = rolesState.sortDir === 1 ? 'asc' : 'desc'; }
  try {
    const { rows, total } = await apiGetUsuarios(params);
    allCuentas = rows;
    renderRolesTable(rows, total, !q);
  } catch (err) {
    showToast(`No se pudieron cargar las cuentas: ${err.message}`, 'error');
  }
}

function filterRoles() {
  rolesState.page = 1;
  loadRolesTable();
}
const debouncedFilterRoles = debounce(filterRoles, 350);

function sortRoles(key) {
  if (rolesState.sortKey === key) rolesState.sortDir *= -1;
  else { rolesState.sortKey = key; rolesState.sortDir = 1; }
  rolesState.page = 1;
  loadRolesTable();
}

function goToRolesPage(page) {
  rolesState.page = page;
  loadRolesTable();
}

/* Íconos de línea (mismo estilo que el resto del sitio) para las
   acciones de fila de Roles/Usuarios — antes eran emojis sueltos. */
const ICON_SHIELD_CHECK = '<svg class="icon-line" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></svg>';
const ICON_SHIELD_MINUS = '<svg class="icon-line" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="M9.5 12h5" /></svg>';
const ICON_MAIL_PLUS    = '<svg class="icon-line" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /><path d="M16 19h6" /><path d="M19 16v6" /></svg>';
const ICON_BAN           = '<svg class="icon-line" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><path d="m4.9 4.9 14.2 14.2" /></svg>';
const ICON_CHECK_CIRCLE  = '<svg class="icon-line" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg>';
const ICON_SAVE          = '<svg class="icon-line" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" /><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7" /><path d="M7 3v4a1 1 0 0 0 1 1h7" /></svg>';
const ICON_SEND          = '<svg class="icon-line" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" /><path d="m21.854 2.147-10.94 10.939" /></svg>';
const ICON_ARCHIVE       = '<svg class="icon-line" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="5" x="2" y="3" rx="1" /><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" /><path d="M10 12h4" /></svg>';
const ICON_PENCIL        = '<svg class="icon-line" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" /><path d="m15 5 4 4" /></svg>';

/* Más íconos de línea reutilizados en tablas/tarjetas/toasts de todo
   el panel (Seguimiento, Roles, Avisos, FAQ, notificaciones). */
const ICON_SYRINGE       = '<svg class="icon-line" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 2 4 4" /><path d="m17 7 3-3" /><path d="M19 9 8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.5 0-3.4L15 5" /><path d="m9 11 4 4" /><path d="m5 19-3 3" /><path d="m14 4 6 6" /></svg>';
const ICON_SCISSORS      = '<svg class="icon-line" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3" /><path d="M8.12 8.12 12 12" /><path d="M20 4 8.12 15.88" /><circle cx="6" cy="18" r="3" /><path d="M14.8 14.8 20 20" /></svg>';
const ICON_EYE           = '<svg class="icon-line" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" /><circle cx="12" cy="12" r="3" /></svg>';
const ICON_X_CIRCLE      = '<svg class="icon-line" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" /></svg>';
const ICON_ALERT         = '<svg class="icon-line" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>';
const ICON_TRASH         = '<svg class="icon-line" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>';
const ICON_REFRESH       = '<svg class="icon-line" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" /><path d="M16 16h5v5" /></svg>';
const ICON_FILE_TEXT     = '<svg class="icon-line" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="M10 9H8" /><path d="M16 13H8" /><path d="M16 17H8" /></svg>';
const ICON_STAR          = '<svg class="icon-line" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" /></svg>';
const ICON_IMAGE         = '<svg class="icon-line" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" /></svg>';
const ICON_QUESTION      = '<svg class="icon-line" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><path d="M12 17h.01" /></svg>';
const ICON_PAW_PLACEHOLDER = '<svg class="icon-line" viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="4" r="2" /><circle cx="18" cy="8" r="2" /><circle cx="20" cy="16" r="2" /><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z" /></svg>';
const ICON_SMILE          = '<svg class="icon-line" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" x2="9.01" y1="9" y2="9" /><line x1="15" x2="15.01" y1="9" y2="9" /></svg>';
const ICON_EYE_OFF        = '<svg class="icon-line" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" x2="22" y1="2" y2="22" /></svg>';
const ICON_SPARKLES       = '<svg class="icon-line" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" /><path d="M20 3v4" /><path d="M22 5h-4" /><path d="M4 17v2" /><path d="M5 18H3" /></svg>';
const ICON_LANDMARK       = '<svg class="icon-line" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 9h4" /><path d="M12 7v5" /><path d="M14 22v-4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v4" /><path d="M18 22V5.618a1 1 0 0 0-.553-.894l-4.553-2.277a2 2 0 0 0-1.788 0L6.553 4.724A1 1 0 0 0 6 5.618V22" /><path d="m18 7 3.447 1.724a1 1 0 0 1 .553.894V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9.618a1 1 0 0 1 .553-.894L6 7" /></svg>';

function renderRolesTable(data, total, sinFiltro) {
  const tbody = document.getElementById('rolesTableBody');

  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="padding:30px; text-align:center; color:var(--gray-2);">${(total === 0 && sinFiltro) ? 'Todavía no hay cuentas. Crea la primera con "+ Nueva cuenta".' : 'No se encontraron cuentas.'}</td></tr>`;
  } else {
    tbody.innerHTML = data.map(u => `
      <tr>
        <td style="font-weight:600;">${u.nombre}</td>
        <td style="font-size:.82rem; color:var(--gray-1);">${u.email || '<span style="color:var(--gray-2);">Sin correo</span>'}<br/><span style="color:var(--gray-2);">${u.telefono || '—'}</span></td>
        <td>${
          u.rol === 'admin'
            ? (Number(u.es_superadmin) === 1 ? `<span class="badge badge-amber">${ICON_STAR} Superadmin</span>` : `<span class="badge badge-amber">Administrador</span>`)
            : u.rol === 'asistente' ? '<span class="badge badge-orange">Asistente</span>' : '<span class="badge badge-blue">Ciudadano</span>'
        }</td>
        <td style="font-size:.78rem; color:var(--gray-2);">${(u.created_at || '').split(' ')[0]}</td>
        <td>
          ${u.activo == 1
            ? `<span class="badge badge-green">${ICON_CHECK_CIRCLE} Activa</span>`
            : '<span class="badge" style="background:var(--gray-4);color:var(--gray-1);">Desactivada</span>'}
        </td>
        <td>
          <div class="row-actions">
            ${esSuperAdmin(currentUser) && u.rol !== 'admin' && u.activo == 1 && u.email
              ? `<button class="btn-tag amber" onclick="promoverAAdmin(${u.id})">${ICON_SHIELD_CHECK} Hacer administrador</button>`
              : ''}
            ${esSuperAdmin(currentUser) && u.rol === 'admin' && Number(u.es_superadmin) !== 1
              ? `<button class="btn-tag red" onclick="revocarAdmin(${u.id})">${ICON_SHIELD_MINUS} Quitar administrador</button>`
              : ''}
            ${u.rol === 'ciudadano' && !u.email && u.activo == 1
              ? `<button class="btn-icon info" onclick="abrirAsignarCorreo(${u.id})" title="Agregar correo">${ICON_MAIL_PLUS}</button>`
              : ''}
            ${u.rol !== 'admin'
              ? (u.activo == 1
                  ? `<button class="btn-icon danger" onclick="toggleCuentaActiva(${u.id}, true)" title="Desactivar cuenta">${ICON_BAN}</button>`
                  : `<button class="btn-icon success" onclick="toggleCuentaActiva(${u.id}, false)" title="Activar cuenta">${ICON_CHECK_CIRCLE}</button>`)
              : ''}
          </div>
        </td>
      </tr>`).join('');
  }

  updateSortIndicators('#sec-roles', rolesState);
  renderPagerFooter('rolesPager', rolesState, total, 'goToRolesPage');
}

async function toggleCuentaActiva(id, estaActivo) {
  try {
    await apiSetUsuarioActivo(id, !estaActivo);
    loadRolesTable();
    showToast(estaActivo ? 'Cuenta desactivada' : 'Cuenta reactivada', 'success');
  } catch (err) {
    showToast(`${err.message}`, 'error');
  }
}

/** Convierte una cuenta de Ciudadano/Asistente en Administrador. Solo
    visible/permitido para el superadmin (ver esSuperAdmin()). */
async function promoverAAdmin(id) {
  const u = allCuentas.find(x => x.id === id);
  if (!u) return;
  try {
    await apiPromoverAAdmin(id);
    showToast(`${u.nombre} ahora es Administrador`, 'success');
    loadRolesTable(); // la fila desaparece de "ciudadano/asistente"... ahora sigue apareciendo, pero como Administrador
  } catch (err) {
    showToast(`${err.message}`, 'error');
  }
}

/** Le quita el rol admin a una cuenta (vuelve a Ciudadano). Solo visible/
    permitido para el superadmin, y nunca contra la propia cuenta
    superadmin (ver revocar-admin en usuarios.php). */
async function revocarAdmin(id) {
  const u = allCuentas.find(x => x.id === id);
  if (!u) return;
  try {
    await apiRevocarAdmin(id);
    showToast(`Se le quitó el rol de administrador a ${u.nombre}`, 'success');
    loadRolesTable();
  } catch (err) {
    showToast(`${err.message}`, 'error');
  }
}

/* Le da correo y contraseña a un ciudadano que no tenía (lo registró un
   asistente sin correo, ej. un adulto mayor) para que pueda entrar por
   su cuenta. Cualquier admin puede hacerlo (no requiere ser superadmin
   — a diferencia de "Hacer administrador", esto no da ningún privilegio
   nuevo, solo credenciales de acceso a una cuenta que ya existe). */
let _asignarCorreoId = null;
function abrirAsignarCorreo(id) {
  const u = allCuentas.find(x => x.id === id);
  if (!u) return;
  _asignarCorreoId = id;
  document.getElementById('form-asignar-correo').reset();
  document.getElementById('ac-nombre').textContent = u.nombre;
  openModal('modal-asignar-correo');
}

async function handleAsignarCorreo(e) {
  e.preventDefault();
  const email    = document.getElementById('ac-email').value.trim();
  const pass     = document.getElementById('ac-password').value;
  const passConf = document.getElementById('ac-password-confirm').value;

  if (pass !== passConf) { showToast('Las contraseñas no coinciden', 'error'); return; }
  if (pass.length < 8)   { showToast('La contraseña debe tener al menos 8 caracteres', 'error'); return; }

  try {
    await apiAsignarCorreo(_asignarCorreoId, email, pass);
    closeModal('modal-asignar-correo');
    showToast('Correo y contraseña asignados — ya puede iniciar sesión', 'success');
    loadRolesTable();
  } catch (err) {
    showToast(`${err.message}`, 'error');
  }
}

function abrirNuevoUsuario() {
  document.getElementById('form-nuevo-usuario').reset();
  document.getElementById('nu-rol').value = 'asistente';
  openModal('modal-nuevo-usuario');
}

async function handleNuevoUsuario(e) {
  e.preventDefault();
  const rol      = document.getElementById('nu-rol').value;
  const nombre   = document.getElementById('nu-nombre').value.trim();
  const email    = document.getElementById('nu-email').value.trim();
  const telefono = document.getElementById('nu-telefono').value.trim();
  const pass     = document.getElementById('nu-password').value;
  const passConf = document.getElementById('nu-password-confirm').value;

  if (pass !== passConf) { showToast('Las contraseñas no coinciden', 'error'); return; }
  if (pass.length < 8)   { showToast('La contraseña debe tener al menos 8 caracteres', 'error'); return; }

  try {
    await apiCrearCuentaUsuario({ nombre, email, telefono, password: pass, rol });
    closeModal('modal-nuevo-usuario');
    showToast(`Cuenta de ${rol === 'asistente' ? 'Asistente' : 'Ciudadano'} creada correctamente`, 'success');
    loadRolesTable();
  } catch (err) {
    showToast(`${err.message}`, 'error');
  }
}

