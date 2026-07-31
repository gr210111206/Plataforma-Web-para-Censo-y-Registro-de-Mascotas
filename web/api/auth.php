<?php
/**
 * REMAC — API: Autenticación
 * POST /api/auth.php?action=register → Crear cuenta de usuario
 * POST /api/auth.php?action=login    → Iniciar sesión (email + password)
 * POST /api/auth.php?action=logout   → Cierra la sesión
 * GET  /api/auth.php?action=me       → Datos del usuario autenticado
 */

require_once __DIR__ . '/config/helpers.php';

setCorsHeaders();

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

/* ── POST /api/auth.php?action=register ─────────────────── */
if ($method === 'POST' && $action === 'register') {
    $body = getBody();

    $nombre   = trim($body['nombre'] ?? '');
    $email    = strtolower(trim($body['email'] ?? ''));
    $password = $body['password'] ?? '';
    $telefono = trim($body['telefono'] ?? '');

    if (empty($nombre)) {
        jsonError('El nombre completo es obligatorio.', 400);
    }
    if (empty($email)) {
        jsonError('El correo electrónico es obligatorio.', 400);
    }
    if (empty($telefono)) {
        jsonError('El teléfono de contacto es obligatorio.', 400);
    }
    if (empty($password) || strlen($password) < 8) {
        jsonError('La contraseña debe tener al menos 8 caracteres.', 400);
    }

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

        $db   = getDB();
        $stmt = $db->prepare("SELECT id, nombre, email, telefono, rol, password_hash FROM duenos WHERE email = ? AND activo = 1");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($pass, $user['password_hash'])) {
            jsonError('Correo o contraseña incorrectos.', 401);
        }

        $token = bin2hex(random_bytes(32));
        $db->prepare('UPDATE duenos SET token_sesion = ?, token_creado_en = NOW() WHERE id = ?')->execute([$token, $user['id']]);

        jsonOk([
            'token'    => $token,
            'id'       => $user['id'],
            'nombre'   => $user['nombre'],
            'email'    => $user['email'],
            'telefono' => $user['telefono'],
            'rol'      => $user['rol'],
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

    $campos  = [];
    $params  = [];
    $allowed = ['nombre', 'telefono', 'direccion', 'colonia'];

    foreach ($allowed as $campo) {
        if (array_key_exists($campo, $body)) {
            $campos[] = "$campo = ?";
            $params[] = clean($body[$campo]);
        }
    }

    if (!$campos) jsonError('No se recibieron campos para actualizar.');

    $params[] = $user['id'];
    $db = getDB();
    $db->prepare('UPDATE duenos SET ' . implode(', ', $campos) . ' WHERE id = ?')->execute($params);

    $updated = $db->prepare('SELECT id, nombre, email, telefono, direccion, colonia, rol FROM duenos WHERE id = ?');
    $updated->execute([$user['id']]);
    jsonOk($updated->fetch());
}

jsonError('Acción no reconocida.', 404);
