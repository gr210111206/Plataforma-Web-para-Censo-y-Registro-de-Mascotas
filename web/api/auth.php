<?php
/**
 * REMAC — API: Autenticación
 * POST /api/auth.php?action=register → Crear cuenta de usuario
 * POST /api/auth.php?action=login    → Iniciar sesión (email/curp + password)
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
    $curp     = strtoupper(trim($body['curp'] ?? ''));

    if (empty($nombre)) {
        jsonError('El nombre completo es obligatorio.', 400);
    }
    if (empty($email)) {
        jsonError('El correo electrónico es obligatorio.', 400);
    }
    if (empty($password) || strlen($password) < 4) {
        jsonError('La contraseña debe tener al menos 4 caracteres.', 400);
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
        INSERT INTO duenos (nombre, email, password_hash, telefono, curp, rol, token_sesion)
        VALUES (?, ?, ?, ?, ?, "ciudadano", ?)
    ');
    $ins->execute([$nombre, $email, $hash, $telefono ?: null, $curp ?: null, $token]);
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
        $stmt = $db->prepare("SELECT id, nombre, email, curp, telefono, rol, password_hash FROM duenos WHERE (email = ? OR curp = ?) AND activo = 1");
        $stmt->execute([$email, strtoupper($email)]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($pass, $user['password_hash'])) {
            jsonError('Correo o contraseña incorrectos.', 401);
        }

        $token = bin2hex(random_bytes(32));
        $db->prepare('UPDATE duenos SET token_sesion = ? WHERE id = ?')->execute([$token, $user['id']]);

        jsonOk([
            'token'    => $token,
            'id'       => $user['id'],
            'nombre'   => $user['nombre'],
            'email'    => $user['email'],
            'curp'     => $user['curp'],
            'telefono' => $user['telefono'],
            'rol'      => $user['rol'],
        ]);
    }

    // Login con CURP y Nombre (Compatibilidad previa)
    if (!empty($body['curp']) && !empty($body['nombre'])) {
        $curp   = strtoupper(trim($body['curp']));
        $nombre = trim($body['nombre']);

        $db   = getDB();
        $stmt = $db->prepare('SELECT id, nombre, email, curp, rol FROM duenos WHERE curp = ? AND activo = 1');
        $stmt->execute([$curp]);
        $user = $stmt->fetch();

        if (!$user) {
            $ins = $db->prepare('INSERT INTO duenos (nombre, curp, rol) VALUES (?, ?, "ciudadano")');
            $ins->execute([$nombre, $curp]);
            $user = ['id' => $db->lastInsertId(), 'nombre' => $nombre, 'curp' => $curp, 'rol' => 'ciudadano'];
        }

        $token = bin2hex(random_bytes(32));
        $db->prepare('UPDATE duenos SET token_sesion = ? WHERE id = ?')->execute([$token, $user['id']]);

        jsonOk([
            'token'  => $token,
            'id'     => $user['id'],
            'nombre' => $user['nombre'],
            'curp'   => $user['curp'],
            'rol'    => $user['rol'],
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

jsonError('Acción no reconocida.', 404);
