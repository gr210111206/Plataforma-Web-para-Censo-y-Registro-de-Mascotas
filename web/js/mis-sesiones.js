/**
 * "Sesiones activas" en Mi perfil — compartido por dashboard.html (ciudadano),
 * admin.html y asistente.html. Cada página solo pone un
 * <div id="mis-sesiones"></div> en su sección de perfil y carga este archivo
 * después de api-client.js. Usa showToast() de cada página.
 *
 * La lista se pide al servidor cuando la tarjeta se vuelve visible (al abrir
 * "Mi perfil"), no al cargar la página — así no cuesta nada a quien nunca
 * entra a su perfil.
 */
(function () {
  const ICONO_CELULAR = '<svg class="icon-line" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2" /><path d="M12 18h.01" /></svg>';
  const ICONO_COMPU   = '<svg class="icon-line" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="3" rx="2" /><path d="M8 21h8" /><path d="M12 17v4" /></svg>';
  const ICONO_TITULO  = '<svg class="icon-line" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /></svg>';

  let ultimaCarga = 0;

  function esc(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // Los minutos los calcula MySQL (ver auth.php ?action=sesiones), así que
  // no importa la zona horaria de este navegador.
  function haceCuanto(min) {
    if (min < 2) return 'hace un momento';
    if (min < 60) return `hace ${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24) return `hace ${h} h`;
    const d = Math.floor(h / 24);
    return d === 1 ? 'hace 1 día' : `hace ${d} días`;
  }

  function esCelular(dispositivo) {
    return /iPhone|iPad|Android/.test(dispositivo);
  }

  function filaSesion(s) {
    const icono = esCelular(s.dispositivo) ? ICONO_CELULAR : ICONO_COMPU;
    const detalle = s.actual
      ? '<span style="color:var(--green); font-weight:600;">Esta sesión</span>'
      : `Usada ${haceCuanto(s.minutos_sin_uso)} · inició ${haceCuanto(s.minutos_desde_inicio)}`;
    const boton = s.actual ? '' :
      `<button class="btn btn-outline btn-sm" type="button" data-cerrar-sesion="${s.id}" data-dispositivo="${esc(s.dispositivo)}">Cerrar</button>`;
    return `
      <div style="display:flex; align-items:center; gap:12px; padding:12px 0; border-top:1px solid var(--gray-4);">
        <div style="width:36px; height:36px; border-radius:var(--radius-sm); background:var(--surface); display:flex; align-items:center; justify-content:center; flex-shrink:0;">${icono}</div>
        <div style="flex:1; min-width:0;">
          <div style="font-weight:600; font-size:.88rem;">${esc(s.dispositivo)}</div>
          <div style="font-size:.78rem; color:var(--gray-2);">${detalle}</div>
        </div>
        ${boton}
      </div>`;
  }

  function pintar(cont, data) {
    const { sesiones, maximo } = data;
    const otras = sesiones.filter(s => !s.actual).length;
    cont.innerHTML = `
      <div style="font-family:'Outfit',sans-serif; font-weight:700; font-size:.9rem; margin-bottom:6px; display:flex; align-items:center; gap:8px;">${ICONO_TITULO} Sesiones activas</div>
      <div class="form-hint" style="margin-bottom:12px;">Dispositivos donde tu cuenta tiene la sesión abierta (máximo ${maximo}; al entrar desde uno más se cierra el que lleva más tiempo sin usarse). Si no reconoces alguno, ciérralo y cambia tu contraseña.</div>
      ${sesiones.map(filaSesion).join('')}
      ${otras > 0 ? `
        <div style="border-top:1px solid var(--gray-4); padding-top:14px;">
          <button class="btn btn-outline btn-sm" type="button" data-cerrar-otras>Cerrar todas las demás sesiones</button>
        </div>` : ''}`;
  }

  async function cargar(cont) {
    ultimaCarga = Date.now();
    try {
      pintar(cont, await apiGetSesiones());
    } catch (err) {
      cont.innerHTML = `<div class="form-hint">No se pudieron cargar las sesiones: ${esc(err.message)}</div>`;
    }
  }

  /* Ventana "confirma con tu contraseña" — se crea una sola vez, con las
     mismas clases que el resto de modales del sitio (.modal-overlay/.modal).
     `accion(password)` hace la petición; si falla (contraseña incorrecta,
     bloqueo por intentos), el error se muestra DENTRO de la ventana y esta
     sigue abierta para reintentar. */
  let modal = null;
  function crearModal() {
    modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'modal-confirmar-sesion';
    modal.innerHTML = `
      <div class="modal" style="max-width:420px;" role="dialog" aria-modal="true" aria-labelledby="ms-titulo">
        <div class="modal-header">
          <h2 class="modal-title" id="ms-titulo" style="display:flex; align-items:center; gap:10px;">${ICONO_TITULO} Confirma que eres tú</h2>
          <button type="button" class="modal-close" data-ms-cancelar aria-label="Cerrar">✕</button>
        </div>
        <form class="modal-body" id="ms-form" style="padding-bottom:20px;">
          <p id="ms-mensaje" style="font-size:.92rem; color:var(--gray-1); line-height:1.6; margin:0 0 16px;"></p>
          <div class="form-group" style="margin-bottom:0;">
            <label for="ms-password">Tu contraseña</label>
            <div class="pw-wrap">
              <input class="form-control has-toggle" type="password" id="ms-password" autocomplete="current-password" />
              <button type="button" class="input-toggle" aria-label="Mostrar contraseña" onclick="togglePassword('ms-password', this)">${typeof ICONO_OJO !== 'undefined' ? ICONO_OJO : ''}</button>
            </div>
            <div id="ms-error" role="alert" style="display:none; color:var(--red); font-size:.82rem; margin-top:8px;"></div>
          </div>
        </form>
        <div class="modal-footer">
          <button type="button" class="btn btn-ghost" data-ms-cancelar>Cancelar</button>
          <button type="submit" form="ms-form" class="btn btn-primary" id="ms-aceptar">Cerrar sesión</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', e => {
      if (e.target === modal || e.target.closest('[data-ms-cancelar]')) cerrarModal();
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && modal.classList.contains('open')) cerrarModal();
    });
  }

  function cerrarModal() {
    modal.classList.remove('open');
    modal.querySelector('#ms-password').value = '';
  }

  function pedirPassword(mensaje, textoBoton, accion) {
    if (!modal) crearModal();
    const input = modal.querySelector('#ms-password');
    const error = modal.querySelector('#ms-error');
    const aceptar = modal.querySelector('#ms-aceptar');
    modal.querySelector('#ms-mensaje').textContent = mensaje;
    aceptar.textContent = textoBoton;
    error.style.display = 'none';
    input.value = '';
    modal.classList.add('open');
    setTimeout(() => input.focus(), 50);

    modal.querySelector('#ms-form').onsubmit = async e => {
      e.preventDefault();
      if (!input.value) {
        error.textContent = 'Escribe tu contraseña para confirmar.';
        error.style.display = 'block';
        input.focus();
        return;
      }
      aceptar.disabled = true;
      try {
        const r = await accion(input.value);
        cerrarModal();
        showToast(r.message, 'success');
      } catch (err) {
        error.textContent = err.message;
        error.style.display = 'block';
        input.select();
      } finally {
        aceptar.disabled = false;
      }
    };
  }

  function onClick(e, cont) {
    const btnUna = e.target.closest('[data-cerrar-sesion]');
    const btnOtras = e.target.closest('[data-cerrar-otras]');
    if (btnUna) {
      const id = Number(btnUna.dataset.cerrarSesion);
      pedirPassword(
        `Vas a cerrar la sesión de "${btnUna.dataset.dispositivo}". Quien la esté usando tendrá que volver a iniciar sesión.`,
        'Cerrar sesión',
        async pw => { const r = await apiCerrarSesion(id, pw); cargar(cont); return r; }
      );
    } else if (btnOtras) {
      pedirPassword(
        'Vas a cerrar la sesión en todos tus otros dispositivos. Este dispositivo seguirá con la sesión abierta.',
        'Cerrar las demás',
        async pw => { const r = await apiCerrarOtrasSesiones(pw); cargar(cont); return r; }
      );
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const cont = document.getElementById('mis-sesiones');
    if (!cont) return;
    cont.addEventListener('click', e => onClick(e, cont));

    // Carga al volverse visible (al abrir "Mi perfil"), y de nuevo cada vez
    // que se regresa a esa sección, sin repetir más de una vez cada 30 s.
    const obs = new IntersectionObserver(entries => {
      if (entries.some(en => en.isIntersecting) && Date.now() - ultimaCarga > 30000) cargar(cont);
    });
    obs.observe(cont);
  });
})();
