/* ══════════════════════════════════════════════════ */
/*  CUENTAS CIUDADANAS                                */
/* ══════════════════════════════════════════════════ */
let allUsuarios = [];
const usuariosState = { sortKey: null, sortDir: 1, page: 1 };

async function loadUsuariosTable() {
  const params = { page: usuariosState.page, pageSize: PAGE_SIZE };
  const q = document.getElementById('userSearch').value.trim();
  if (q) params.q = q;
  if (usuariosState.sortKey) { params.sort = usuariosState.sortKey; params.dir = usuariosState.sortDir === 1 ? 'asc' : 'desc'; }
  try {
    const { rows, total } = await apiGetUsuarios(params);
    allUsuarios = rows;
    renderUsuariosTable(rows, total);
  } catch (err) {
    showToast(`No se pudieron cargar las cuentas: ${err.message}`, 'error');
  }
}

function renderUsuariosTable(data, total) {
  const tbody = document.getElementById('usuariosTableBody');

  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="padding:30px; text-align:center; color:var(--gray-2);">No se encontraron cuentas.</td></tr>`;
  } else {
    tbody.innerHTML = data.map(u => `
      <tr>
        <td style="font-weight:600;">${u.nombre}</td>
        <td style="font-size:.82rem; color:var(--gray-1);">${u.email || '<span style="color:var(--gray-2);">Sin correo</span>'}<br/><span style="color:var(--gray-2);">${u.telefono || '—'}</span></td>
        <td style="font-size:.82rem;">${u.colonia || '—'}</td>
        <td style="text-align:center;">${u.total_mascotas}</td>
        <td style="font-size:.78rem; color:var(--gray-2);">${(u.created_at || '').split(' ')[0]}</td>
        <td>
          ${u.activo == 1
            ? `<span class="badge badge-green">${ICON_CHECK_CIRCLE} Activa</span>`
            : '<span class="badge" style="background:var(--gray-4);color:var(--gray-1);">Desactivada</span>'}
        </td>
        <td>
          <div class="row-actions">
            ${esSuperAdmin(currentUser)
              ? `<button class="btn-icon info" onclick="verEditarUsuario(${u.id})" title="Ver y editar datos">${ICON_EYE}</button>`
              : ''}
            ${u.activo == 1
              ? `<button class="btn-icon danger" onclick="toggleUsuarioActivo(${u.id}, true)" title="Desactivar cuenta">${ICON_BAN}</button>`
              : `<button class="btn-icon success" onclick="toggleUsuarioActivo(${u.id}, false)" title="Activar cuenta">${ICON_CHECK_CIRCLE}</button>`}
          </div>
        </td>
      </tr>`).join('');
  }

  updateSortIndicators('#sec-usuarios', usuariosState);
  renderPagerFooter('usuariosPager', usuariosState, total, 'goToUsuariosPage');
}

function sortUsuarios(key) {
  if (usuariosState.sortKey === key) usuariosState.sortDir *= -1;
  else { usuariosState.sortKey = key; usuariosState.sortDir = 1; }
  usuariosState.page = 1;
  loadUsuariosTable();
}

function goToUsuariosPage(page) {
  usuariosState.page = page;
  loadUsuariosTable();
}

function filterUsuarios() {
  usuariosState.page = 1;
  loadUsuariosTable();
}
const debouncedFilterUsuarios = debounce(filterUsuarios, 350);

async function toggleUsuarioActivo(id, estaActivo) {
  try {
    await apiSetUsuarioActivo(id, !estaActivo);
    loadUsuariosTable();
    showToast(estaActivo ? 'Cuenta desactivada' : 'Cuenta reactivada', 'success');
  } catch (err) {
    showToast(`${err.message}`, 'error');
  }
}

/* ── Ver / editar cuenta ciudadana (solo superadmin) ── */
let editingUsuarioId = null;

function verEditarUsuario(id) {
  const u = allUsuarios.find(x => x.id === id);
  if (!u) return;
  editingUsuarioId = id;
  document.getElementById('vu-titulo').textContent = u.nombre;
  document.getElementById('vu-nombre').value    = u.nombre || '';
  document.getElementById('vu-email').value     = u.email || 'Sin correo';
  document.getElementById('vu-telefono').value  = u.telefono || '';
  document.getElementById('vu-direccion').value = u.direccion || '';
  document.getElementById('vu-colonia').value   = u.colonia || '';
  openModal('modal-ver-usuario');
}

async function guardarEdicionUsuario(e) {
  e.preventDefault();
  if (!editingUsuarioId) return;

  const nombre   = document.getElementById('vu-nombre').value.trim();
  const telefono = document.getElementById('vu-telefono').value.trim();
  if (!nombre)   { showToast('El nombre completo es obligatorio', 'error'); return; }
  if (!telefono) { showToast('El teléfono de contacto es obligatorio', 'error'); return; }

  const datos = {
    nombre, telefono,
    direccion: document.getElementById('vu-direccion').value.trim() || null,
    colonia:   document.getElementById('vu-colonia').value.trim() || null,
  };

  try {
    await apiEditarCuentaUsuario(editingUsuarioId, datos);
    closeModal('modal-ver-usuario');
    editingUsuarioId = null;
    loadUsuariosTable();
    showToast('Cuenta actualizada', 'success');
  } catch (err) {
    showToast(`${err.message}`, 'error');
  }
}

/* ══════════════════════════════════════════════════ */
/*  MOSTRAR/OCULTAR CONTRASEÑA                        */
/* ══════════════════════════════════════════════════ */
const ICONO_OJO = '<svg class="icon-line" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" /><circle cx="12" cy="12" r="3" /></svg>';
const ICONO_OJO_TACHADO = '<svg class="icon-line" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" /><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" /><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" /><path d="m2 2 20 20" /></svg>';

function togglePassword(inputId, btn) {
  const input = document.getElementById(inputId);
  const mostrar = input.type === 'password';
  input.type = mostrar ? 'text' : 'password';
  btn.innerHTML = mostrar ? ICONO_OJO_TACHADO : ICONO_OJO;
  btn.setAttribute('aria-label', mostrar ? 'Ocultar contraseña' : 'Mostrar contraseña');
}
document.querySelectorAll('.input-toggle[aria-label="Mostrar contraseña"]').forEach(btn => btn.innerHTML = ICONO_OJO);

/* ══════════════════════════════════════════════════ */
/*  MODAL genérico (admin.html no tenía ninguno antes) */
/* ══════════════════════════════════════════════════ */
function openModal(id) {
  document.getElementById(id).classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  document.body.style.overflow = '';
}
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(overlay.id); });
});

