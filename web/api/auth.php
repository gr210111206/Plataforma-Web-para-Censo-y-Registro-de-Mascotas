<?php
/**
 * REMAC — API: Autenticación
 * POST /api/auth.php?action=register → Crear cuenta de usuario
 * POST /api/auth.php?action=login    → Iniciar sesión (email + password)
 * POST /api/auth.php?action=logout   → Cierra la sesión
 * GET  /api/auth.php?action=me       → Datos del usuario autenticado
 * POST /api/auth.php?action=update-profile   → Actualiza nombre/correo/teléfono/foto/etc. de la sesión actual
 * POST /api/auth.php?action=change-password  → Cambia la contraseña de la sesión actual (pide la actual)
 */

require_once __DIR__ . '/config/helpers.php';

setCorsHeaders();

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

/* ── POST /api/auth.php?action=register ─────────────────── */
if ($method === 'POST' && $action === 'register') {
    $body = getBody();

    $nombre   = clean(trim($body['nombre'] ?? ''));
    $email    = strtolower(trim($body['email'] ?? ''));
    $password = $body['password'] ?? '';
    $telefono = clean(trim($body['telefono'] ?? ''));

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
    $token = bin2hex(random_bytes(32));

    $ins = $db->prepare('
        INSERT INTO duenos (nombre, email, password_hash, telefono, rol, token_sesion, token_creado_en)
        VALUES (?, ?, ?, ?, "ciudadano", ?, NOW())
    ');
    $ins->execute([$nombre, $email, $hash, $telefono, $token]);
    $userId = $db->lastInsertId();

    jsonOk([
        'token'    => $token,
        'id'       => $userId,
        'nombre'   => $nombre,
        'email'    => $email,
        'telefono' => $telefono,
        'rol'      => 'ciudadano',
        'message'  => 'Cuenta creada exitosamente.'
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
                   password_hash, intentos_fallidos, (bloqueado_hasta IS NOT NULL AND bloqueado_hasta > NOW()) AS bloqueado
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
        }
        $campos[] = 'email = ?';
        $params[] = $nuevoEmail;
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

    $updated = $db->prepare('SELECT id, nombre, email, telefono, direccion, colonia, foto_perfil, rol FROM duenos WHERE id = ?');
    $updated->execute([$user['id']]);
    jsonOk($updated->fetch());
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

jsonError('Acción no reconocida.', 404);
