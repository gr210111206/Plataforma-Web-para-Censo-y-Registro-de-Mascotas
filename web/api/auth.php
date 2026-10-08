<?php
/**
 * API: Autenticación
 * POST /api/auth.php?action=register → Crear cuenta de usuario
 * POST /api/auth.php?action=login    → Iniciar sesión (email + password)
 * POST /api/auth.php?action=logout   → Cierra la sesión
 * GET  /api/auth.php?action=me       → Datos del usuario autenticado
 * POST /api/auth.php?action=update-profile   → Actualiza nombre/correo/teléfono/foto/etc. de la sesión actual
 * POST /api/auth.php?action=change-password  → Cambia la contraseña de la sesión actual (pide la actual)
 * POST /api/auth.php?action=solicitar-recuperacion  → Manda correo con enlace para restablecer contraseña (sin sesión)
 * POST /api/auth.php?action=restablecer-password    → Fija nueva contraseña a partir del token del correo (sin sesión)
 * POST /api/auth.php?action=verificar-email         → Confirma el correo a partir del token del enlace (sin sesión)
 * POST /api/auth.php?action=reenviar-verificacion   → Reenvía el correo de confirmación si aún no se ha verificado (sin sesión)
 */

require_once __DIR__ . '/config/helpers.php';

setCorsHeaders();

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

/* ── POST /api/auth.php?action=register ─────────────────── */
if ($method === 'POST' && $action === 'register') {
    $body = getBody();

    $nombre    = clean(trim($body['nombre'] ?? ''));
    $email     = strtolower(trim($body['email'] ?? ''));
    $password  = $body['password'] ?? '';
    $telefono  = clean(trim($body['telefono'] ?? ''));
    $direccion = clean(trim($body['direccion'] ?? ''));
    $colonia   = clean(trim($body['colonia'] ?? ''));

    if (empty($nombre)) {
        jsonError('El nombre completo es obligatorio.', 400);
    }
    if (empty($email)) {
        jsonError('El correo electrónico es obligatorio.', 400);
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        jsonError('El correo electrónico no es válido.', 400);
    }
    if (empty($telefono)) {
        jsonError('El teléfono de contacto es obligatorio.', 400);
    }
    if (empty($direccion)) {
        jsonError('El domicilio es obligatorio.', 400);
    }
    if (empty($colonia)) {
        jsonError('La colonia es obligatoria.', 400);
    }
    $passErr = validarPassword($password);
    if ($passErr) jsonError($passErr, 400);

    $db = getDB();

    // Verificar si el correo ya existe
    $stmt = $db->prepare('SELECT id FROM duenos WHERE email = ?');
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        jsonError('Este correo electrónico ya está registrado. Inicia sesión.', 400);
    }

    $hash = password_hash($password, PASSWORD_DEFAULT);

    // La cuenta NO inicia sesión sola al crearse (a diferencia de antes):
    // queda con email_verificado = 0 hasta que confirme el enlace que se le
    // manda por correo — login() más abajo rechaza entrar mientras tanto.
    // Esto evita que alguien registre una cuenta con un correo inventado o
    // mal escrito y la use de todos modos.
    $verifToken = bin2hex(random_bytes(32));

    $ins = $db->prepare('
        INSERT INTO duenos (nombre, email, password_hash, telefono, direccion, colonia, rol, email_verificado, verificacion_token)
        VALUES (?, ?, ?, ?, ?, ?, "ciudadano", 0, ?)
    ');
    $ins->execute([$nombre, $email, $hash, $telefono, $direccion ?: null, $colonia ?: null, $verifToken]);
    $userId = $db->lastInsertId();

    $link = BASE_URL . '/login.html?verificar=' . $verifToken;
    // Respaldo para poder probar el flujo en local sin depender de que el
    // correo real llegue — mismo patrón que solicitar-recuperacion.
    error_log("Verificación de correo para $email → $link");

    $cuerpo = '
        <p>Hola ' . htmlspecialchars($nombre, ENT_QUOTES, 'UTF-8') . ',</p>
        <p>Gracias por registrarte en el Padrón Municipal de Mascotas de El Grullo. Antes de poder iniciar sesión, confirma que este correo es tuyo:</p>
        ' . botonCorreo($link, 'Confirmar mi correo') . '
        <p>Si tú no creaste esta cuenta, puedes ignorar este correo.</p>
    ';
    enviarCorreo($email, 'Confirma tu correo — Padrón de Mascotas El Grullo', $cuerpo);

    jsonOk([
        'id'        => $userId,
        'nombre'    => $nombre,
        'email'     => $email,
        'telefono'  => $telefono,
        'direccion' => $direccion ?: null,
        'colonia'   => $colonia ?: null,
        'rol'       => 'ciudadano',
        'message'   => 'Cuenta creada. Revisa tu correo (y la carpeta de spam) para confirmarla antes de iniciar sesión.'
    ]);
}

/* ── POST /api/auth.php?action=login ────────────────────── */
if ($method === 'POST' && ($action === 'login' || empty($action))) {
    $body = getBody();

    // Login estándar: Email / Usuario + Contraseña
    if (!empty($body['email']) && !empty($body['password'])) {
        $email = strtolower(trim($body['email']));
        $pass  = $body['password'];

        // El "¿sigue bloqueada?" se calcula DENTRO de MySQL (bloqueado_hasta
        // > NOW()), no comparando con time()/strtotime() de PHP: en hosting
        // compartido el reloj/zona horaria de PHP y el de MySQL casi nunca
        // coinciden (aquí mismo, PHP quedó en Europe/Berlin y MySQL en la
        // zona del sistema) — comparar entre los dos rompía el bloqueo por
        // completo. Manteniendo la comparación 100% del lado de MySQL, da
        // igual qué zona horaria tenga cada quién.
        $db   = getDB();
        $stmt = $db->prepare("
            SELECT id, nombre, email, telefono, direccion, colonia, foto_perfil, rol, es_superadmin,
                   password_hash, intentos_fallidos, email_verificado,
                   (bloqueado_hasta IS NOT NULL AND bloqueado_hasta > NOW()) AS bloqueado
            FROM duenos WHERE email = ? AND activo = 1
        ");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        // Bloqueo temporal tras varios intentos fallidos seguidos (fuerza
        // bruta). Se revisa antes de verificar la contraseña para que ni
        // siquiera un intento correcto "cuente" mientras sigue bloqueada.
        if ($user && $user['bloqueado']) {
            jsonError('Demasiados intentos fallidos. Intenta de nuevo en unos minutos.', 429);
        }

        if (!$user || !password_verify($pass, $user['password_hash'])) {
            if ($user) {
                $intentos = (int)$user['intentos_fallidos'] + 1;
                if ($intentos >= 5) {
                    $db->prepare('UPDATE duenos SET intentos_fallidos = 0, bloqueado_hasta = DATE_ADD(NOW(), INTERVAL 15 MINUTE) WHERE id = ?')
                       ->execute([$user['id']]);
                } else {
                    $db->prepare('UPDATE duenos SET intentos_fallidos = ? WHERE id = ?')->execute([$intentos, $user['id']]);
                }
            }
            jsonError('Correo o contraseña incorrectos.', 401);
        }

        // Cuenta autoregistrada (login.html) que todavía no confirmó su
        // correo — las creadas por un asistente/admin, o sembradas antes de
        // este cambio, ya quedan con email_verificado = 1 (ver schema.sql) y
        // no les afecta. Se revisa DESPUÉS de validar la contraseña, para no
        // revelar aquí si el correo existe o no (ver solicitar-recuperacion).
        if (!$user['email_verificado']) {
            jsonError('Todavía no confirmas tu correo. Revisa tu bandeja de entrada (y spam), o pide que te reenviemos el enlace.', 403);
        }

        $token = bin2hex(random_bytes(32));
        $db->prepare('UPDATE duenos SET token_sesion = ?, token_creado_en = NOW(), intentos_fallidos = 0, bloqueado_hasta = NULL WHERE id = ?')
           ->execute([$token, $user['id']]);

        jsonOk([
            'token'         => $token,
            'id'            => $user['id'],
            'nombre'        => $user['nombre'],
            'email'         => $user['email'],
            'telefono'      => $user['telefono'],
            'direccion'     => $user['direccion'],
            'colonia'       => $user['colonia'],
            'foto_perfil'   => $user['foto_perfil'],
            'rol'           => $user['rol'],
            'es_superadmin' => (int) $user['es_superadmin'],
        ]);
    }

    jsonError('Por favor ingresa tu correo electrónico y contraseña.', 400);
}

/* ── POST /api/auth.php?action=logout ───────────────────── */
if ($method === 'POST' && $action === 'logout') {
    $token = getAuthToken();
    if ($token) {
        $db = getDB();
        $db->prepare('UPDATE duenos SET token_sesion = NULL WHERE token_sesion = ?')->execute([$token]);
    }
    jsonOk(['message' => 'Sesión cerrada.']);
}

/* ── GET /api/auth.php?action=me ────────────────────────── */
if ($method === 'GET' && $action === 'me') {
    $user = requireAuth();
    jsonOk($user);
}

/* ── POST /api/auth.php?action=update-profile ───────────── */
if ($method === 'POST' && $action === 'update-profile') {
    $user = requireAuth();
    $body = getBody();
    $db   = getDB();

    $campos = [];
    $params = [];
    $correoCambio = false;
    $nuevoEmail   = null;

    // Correo: es el identificador con el que se inicia sesión (columna
    // UNIQUE), así que además de limpiarlo hay que validar formato y que
    // no choque con otra cuenta ya existente antes de aceptarlo.
    if (array_key_exists('email', $body)) {
        $nuevoEmail = strtolower(trim((string)$body['email']));
        if (empty($nuevoEmail)) jsonError('El correo electrónico no puede quedar vacío.', 400);
        if (!filter_var($nuevoEmail, FILTER_VALIDATE_EMAIL)) jsonError('El correo electrónico no es válido.', 400);
        if ($nuevoEmail !== strtolower((string)($user['email'] ?? ''))) {
            $chk = $db->prepare('SELECT id FROM duenos WHERE email = ? AND id != ?');
            $chk->execute([$nuevoEmail, $user['id']]);
            if ($chk->fetch()) jsonError('Ese correo electrónico ya está en uso por otra cuenta.', 400);
            $correoCambio = true;
        }
        $campos[] = 'email = ?';
        $params[] = $nuevoEmail;
    }

    // Si de verdad cambia a un correo distinto, hay que volver a confirmarlo
    // — si no, quedaba marcado "verificado" sin que nadie hubiera probado
    // que el nuevo correo es real/le pertenece a quien lo puso (ver
    // HISTORIAL_CAMBIOS.md). No afecta la sesión actual, que sigue
    // funcionando igual — solo bloquea un futuro login hasta confirmarlo,
    // mismo criterio que el registro nuevo.
    $verifToken = null;
    if ($correoCambio) {
        $verifToken = bin2hex(random_bytes(32));
        $campos[] = 'email_verificado = 0';
        $campos[] = 'verificacion_token = ?';
        $params[] = $verifToken;
    }

    // Foto de perfil: Base64 (mismo patrón que mascotas.foto_url). El
    // cliente ya la redimensiona antes de enviarla; este límite es solo
    // un respaldo por si la petición se hace directo, sin pasar por la UI.
    if (array_key_exists('foto_perfil', $body)) {
        $fotoErr = validarFotoBase64($body['foto_perfil']);
        if ($fotoErr) jsonError($fotoErr, 400);
        $campos[] = 'foto_perfil = ?';
        $params[] = clean($body['foto_perfil']);
    }

    $allowed = ['nombre', 'telefono', 'direccion', 'colonia'];
    foreach ($allowed as $campo) {
        if (array_key_exists($campo, $body)) {
            $campos[] = "$campo = ?";
            $params[] = clean($body[$campo]);
        }
    }

    if (!$campos) jsonError('No se recibieron campos para actualizar.');

    $params[] = $user['id'];
    $db->prepare('UPDATE duenos SET ' . implode(', ', $campos) . ' WHERE id = ?')->execute($params);

    if ($correoCambio) {
        $link = BASE_URL . '/login.html?verificar=' . $verifToken;
        error_log("Verificación de correo (cambio de email) para $nuevoEmail → $link");
        $cuerpo = '
            <p>Hola ' . htmlspecialchars($user['nombre'], ENT_QUOTES, 'UTF-8') . ',</p>
            <p>Confirmaste un nuevo correo para tu cuenta del Padrón Municipal de Mascotas de El Grullo. Antes de poder volver a iniciar sesión con este correo, confirma que es tuyo:</p>
            ' . botonCorreo($link, 'Confirmar mi nuevo correo') . '
            <p>Si tú no hiciste este cambio, contacta al Ayuntamiento lo antes posible.</p>
        ';
        enviarCorreo($nuevoEmail, 'Confirma tu nuevo correo — Padrón de Mascotas El Grullo', $cuerpo);
    }

    $updated = $db->prepare('SELECT id, nombre, email, telefono, direccion, colonia, foto_perfil, rol, email_verificado FROM duenos WHERE id = ?');
    $updated->execute([$user['id']]);
    $datos = $updated->fetch();
    if ($correoCambio) {
        $datos['message'] = 'Datos actualizados. Revisa tu nuevo correo (y la carpeta de spam) para confirmarlo — lo vas a necesitar la próxima vez que inicies sesión.';
    }
    jsonOk($datos);
}

/* ── POST /api/auth.php?action=change-password ──────────── */
if ($method === 'POST' && $action === 'change-password') {
    $user = requireAuth();
    $body = getBody();

    $actual = $body['actual'] ?? '';
    $nueva  = $body['nueva'] ?? '';

    if (empty($actual)) jsonError('Escribe tu contraseña actual.', 400);
    $passErr = validarPassword($nueva);
    if ($passErr) jsonError($passErr, 400);

    $db   = getDB();
    $stmt = $db->prepare('SELECT password_hash FROM duenos WHERE id = ?');
    $stmt->execute([$user['id']]);
    $row = $stmt->fetch();
    if (!$row || !$row['password_hash'] || !password_verify($actual, $row['password_hash'])) {
        jsonError('La contraseña actual no es correcta.', 401);
    }
    if (password_verify($nueva, $row['password_hash'])) {
        jsonError('La nueva contraseña debe ser distinta a la actual.', 400);
    }

    // Invalida la sesión actual (y cualquier otro token que ya hubiera
    // circulando, robado o no): tras cambiar la contraseña hay que volver
    // a iniciar sesión. Antes el token viejo seguía funcionando hasta por
    // 30 días más, aun después de que la persona "aseguró" su cuenta.
    $hash = password_hash($nueva, PASSWORD_DEFAULT);
    $db->prepare('UPDATE duenos SET password_hash = ?, token_sesion = NULL, token_creado_en = NULL WHERE id = ?')
       ->execute([$hash, $user['id']]);
    jsonOk(['message' => 'Contraseña actualizada correctamente. Vuelve a iniciar sesión.']);
}

/* ── POST /api/auth.php?action=solicitar-recuperacion ───── */
/* Sin sesión a propósito: es justo para quien NO puede iniciar sesión
   porque olvidó su contraseña. SIEMPRE responde el mismo mensaje exista
   o no esa cuenta — si cambiara según el caso, cualquiera podría usar
   este formulario para averiguar qué correos están registrados en el
   padrón (enumeración de cuentas), igual de grave que si lo revelara el
   registro normal. */
if ($method === 'POST' && $action === 'solicitar-recuperacion') {
    $body  = getBody();
    $email = strtolower(trim($body['email'] ?? ''));

    $mensajeGenerico = 'Si ese correo está registrado, se envió un enlace de recuperación. Revisa tu bandeja de entrada (y la carpeta de spam).';

    if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        jsonOk(['message' => $mensajeGenerico]);
    }

    $db   = getDB();
    $stmt = $db->prepare('SELECT id, nombre FROM duenos WHERE email = ? AND activo = 1');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if ($user) {
        $token = bin2hex(random_bytes(32));
        $db->prepare('UPDATE duenos SET reset_token = ?, reset_token_expira = DATE_ADD(NOW(), INTERVAL 1 HOUR) WHERE id = ?')
           ->execute([$token, $user['id']]);

        $link = BASE_URL . '/login.html?reset=' . $token;
        // Respaldo para poder probar el flujo en local (XAMPP normalmente
        // no tiene un servidor de correo real configurado) sin depender de
        // que mail() entregue de verdad — ver enviarCorreo() en helpers.php.
        error_log("Recuperación de contraseña para $email → $link");

        $cuerpo = '
            <p>Hola ' . htmlspecialchars($user['nombre'], ENT_QUOTES, 'UTF-8') . ',</p>
            <p>Pediste recuperar el acceso a tu cuenta del Padrón Municipal de Mascotas de El Grullo. Elige una nueva contraseña (el enlace es válido por 1 hora):</p>
            ' . botonCorreo($link, 'Elegir nueva contraseña') . '
            <p>Si tú no pediste esto, puedes ignorar este correo — tu contraseña actual sigue funcionando igual.</p>
        ';
        enviarCorreo($email, 'Recupera tu contraseña — Padrón de Mascotas El Grullo', $cuerpo);
    }

    jsonOk(['message' => $mensajeGenerico]);
}

/* ── POST /api/auth.php?action=restablecer-password ─────── */
/* Sin sesión a propósito, por la misma razón que el endpoint anterior:
   el token (no una contraseña) es la credencial aquí. */
if ($method === 'POST' && $action === 'restablecer-password') {
    $body  = getBody();
    $token = trim($body['token'] ?? '');
    $nueva = $body['password'] ?? '';

    if (empty($token)) jsonError('Enlace inválido.', 400);
    $passErr = validarPassword($nueva);
    if ($passErr) jsonError($passErr, 400);

    // La vigencia se compara DENTRO de MySQL (reset_token_expira > NOW()),
    // nunca con time()/strtotime() de PHP — mismo motivo que
    // bloqueado_hasta/token_creado_en (ver sus comentarios arriba): PHP y
    // MySQL pueden tener zonas horarias distintas en el mismo servidor.
    $db   = getDB();
    $stmt = $db->prepare('
        SELECT id FROM duenos
        WHERE reset_token = ? AND reset_token_expira IS NOT NULL AND reset_token_expira > NOW() AND activo = 1
    ');
    $stmt->execute([$token]);
    $user = $stmt->fetch();

    if (!$user) {
        jsonError('El enlace no es válido o ya venció. Solicita uno nuevo.', 400);
    }

    // Al restablecer también se invalida la sesión/bloqueo existentes
    // (igual que en change-password) y se borra el token de un solo uso
    // para que el mismo enlace no se pueda reutilizar después.
    $hash = password_hash($nueva, PASSWORD_DEFAULT);
    $db->prepare('
        UPDATE duenos
        SET password_hash = ?, reset_token = NULL, reset_token_expira = NULL,
            token_sesion = NULL, token_creado_en = NULL,
            intentos_fallidos = 0, bloqueado_hasta = NULL
        WHERE id = ?
    ')->execute([$hash, $user['id']]);

    jsonOk(['message' => 'Contraseña actualizada. Ya puedes iniciar sesión.']);
}

/* ── POST /api/auth.php?action=verificar-email ───────────── */
/* Sin sesión a propósito: se dispara al dar clic en el enlace del correo,
   antes de que la cuenta pueda iniciar sesión siquiera. */
if ($method === 'POST' && $action === 'verificar-email') {
    $body  = getBody();
    $token = trim($body['token'] ?? '');

    if (empty($token)) jsonError('Enlace inválido.', 400);

    $db   = getDB();
    $stmt = $db->prepare('SELECT id FROM duenos WHERE verificacion_token = ? AND activo = 1');
    $stmt->execute([$token]);
    $user = $stmt->fetch();

    if (!$user) {
        jsonError('El enlace no es válido o esta cuenta ya fue confirmada antes.', 400);
    }

    $db->prepare('UPDATE duenos SET email_verificado = 1, verificacion_token = NULL WHERE id = ?')
       ->execute([$user['id']]);

    jsonOk(['message' => 'Correo confirmado. Ya puedes iniciar sesión.']);
}

/* ── POST /api/auth.php?action=reenviar-verificacion ─────── */
/* Mismo patrón anti-enumeración que solicitar-recuperacion: responde
   siempre el mismo mensaje, exista o no esa cuenta, y aunque ya esté
   verificada — así nadie puede usar este formulario para averiguar qué
   correos están registrados en el padrón. */
if ($method === 'POST' && $action === 'reenviar-verificacion') {
    $body  = getBody();
    $email = strtolower(trim($body['email'] ?? ''));

    $mensajeGenerico = 'Si ese correo está registrado y aún no se ha confirmado, se reenvió el enlace de confirmación. Revisa tu bandeja de entrada (y la carpeta de spam).';

    if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        jsonOk(['message' => $mensajeGenerico]);
    }

    $db   = getDB();
    $stmt = $db->prepare('SELECT id, nombre FROM duenos WHERE email = ? AND activo = 1 AND email_verificado = 0');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if ($user) {
        $verifToken = bin2hex(random_bytes(32));
        $db->prepare('UPDATE duenos SET verificacion_token = ? WHERE id = ?')->execute([$verifToken, $user['id']]);

        $link = BASE_URL . '/login.html?verificar=' . $verifToken;
        error_log("Reenvío de verificación de correo para $email → $link");

        $cuerpo = '
            <p>Hola ' . htmlspecialchars($user['nombre'], ENT_QUOTES, 'UTF-8') . ',</p>
            <p>Confirma tu correo del Padrón Municipal de Mascotas de El Grullo:</p>
            ' . botonCorreo($link, 'Confirmar mi correo') . '
            <p>Si tú no pediste esto, puedes ignorar este correo.</p>
        ';
        enviarCorreo($email, 'Confirma tu correo — Padrón de Mascotas El Grullo', $cuerpo);
    }

    jsonOk(['message' => $mensajeGenerico]);
}

jsonError('Acción no reconocida.', 404);
