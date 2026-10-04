/* ══════════════════════════════════════════════════ */
/*  BITÁCORA DE AUDITORÍA                             */
/* ══════════════════════════════════════════════════ */
const bitacoraState = { page: 1 };

const ACCION_LABELS = {
  rol_promovido_admin:       ICON_SHIELD_CHECK + ' Rol promovido a Administrador',
  rol_revocado_admin:        ICON_SHIELD_MINUS + ' Rol de Administrador revocado',
  cuenta_activada:           ICON_CHECK_CIRCLE + ' Cuenta activada',
  cuenta_desactivada:        ICON_BAN + ' Cuenta desactivada',
  mascota_baja:              ICON_ARCHIVE + ' Mascota dada de baja',
  mascota_editada_por_admin: ICON_PENCIL + ' Mascota editada por admin',
};

async function loadBitacora() {
  try {
    const { rows, total } = await apiGetBitacora({ page: bitacoraState.page, pageSize: PAGE_SIZE });
    renderBitacoraTable(rows, total);
  } catch (err) {
    showToast(`No se pudo cargar la bitácora: ${err.message}`, 'error');
  }
}

function goToBitacoraPage(page) {
  bitacoraState.page = page;
  loadBitacora();
}

function renderBitacoraTable(data, total) {
  const tbody = document.getElementById('bitacoraTableBody');
  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="padding:30px; text-align:center; color:var(--gray-2);">Todavía no hay nada registrado en la bitácora.</td></tr>`;
  } else {
    tbody.innerHTML = data.map(b => `
      <tr>
        <td style="font-size:.78rem; color:var(--gray-2); white-space:nowrap;">${b.created_at}</td>
        <td style="font-weight:600;">${b.usuario_nombre}</td>
        <td style="font-size:.85rem;">${ACCION_LABELS[b.accion] || b.accion}</td>
        <td style="font-size:.82rem; color:var(--gray-1);">${b.detalle || '—'}</td>
      </tr>`).join('');
  }
  renderPagerFooter('bitacoraPager', bitacoraState, total, 'goToBitacoraPage');
}

