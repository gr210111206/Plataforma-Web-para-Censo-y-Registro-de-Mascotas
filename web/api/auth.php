<?php
/**
 * REMAC — API: Autenticación
 * POST /api/auth/login   → Login ciudadano (CURP) o admin (email+password)
 * POST /api/auth/logout  → Cierra la sesión
 * GET  /api/auth/me      → Datos del usuario autenticado
 */

require_once __DIR__ . '/../config/helpers.php';

setCorsHeaders();

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

/* ── POST /api/auth/login ───────────────────────── */
if ($method === 'POST' && $action === 'login') {
    $body = getBody();

    // ─ Login ciudadano: solo CURP + nombre ─
    if (!empty($body['curp']) && !empty($body['nombre'])) {
        $curp   = strtoupper(trim($body['curp']));
        $nombre = trim($body['nombre']);

        $db   = getDB();
        $stmt = $db->prepare('SELECT id, nombre, curp, rol FROM duenos WHERE curp = ? AND activo = 1');
        $stmt->execute([$curp]);
        $user = $stmt->fetch();

        if (!$user) {
            // Ciudadano nuevo: lo registramos automáticamente
            $ins = $db->prepare(
                'INSERT INTO duenos (nombre, curp, rol) VALUES (?, ?, "ciudadano")'
            );
            $ins->execute([$nombre, $curp]);
            $userId = $db->lastInsertId();
            $user = ['id' => $userId, 'nombre' => $nombre, 'curp' => $curp, 'rol' => 'ciudadano'];
        }

        // Generar token
        $token = bin2hex(random_bytes(32));
        $db->prepare('UPDATE duenos SET token_sesion = ? WHERE id = ?')
           ->execute([$token, $user['id']]);

        jsonOk([
            'token'  => $token,
            'nombre' => $user['nombre'],
            'curp'   => $user['curp'],
            'rol'    => $user['rol'],
        ]);
    }

    // ─ Login admin: email + password ─
    if (!empty($body['email']) && !empty($body['password'])) {
        $email = trim($body['email']);
        $pass  = $body['password'];

        $db   = getDB();
        $stmt = $db->prepare("SELECT id, nombre, curp, rol, password_hash FROM duenos WHERE email = ? AND rol = 'admin' AND activo = 1");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($pass, $user['password_hash'])) {
            jsonError('Correo o contraseña incorrectos.', 401);
        }

        $token = bin2hex(random_bytes(32));
        $db->prepare('UPDATE duenos SET token_sesion = ? WHERE id = ?')
           ->execute([$token, $user['id']]);

        jsonOk([
            'token'  => $token,
            'nombre' => $user['nombre'],
            'curp'   => $user['curp'],
            'rol'    => 'admin',
        ]);
    }

    jsonError('Se requiere curp+nombre (ciudadano) o email+password (admin).', 400);
}

/* ── POST /api/auth/logout ──────────────────────── */
if ($method === 'POST' && $action === 'logout') {
    $token = getAuthToken();
    if ($token) {
        $db = getDB();
        $db->prepare('UPDATE duenos SET token_sesion = NULL WHERE token_sesion = ?')
           ->execute([$token]);
    }
    jsonOk(['message' => 'Sesión cerrada.']);
}

/* ── GET /api/auth/me ───────────────────────────── */
if ($method === 'GET' && $action === 'me') {
    $user = requireAuth();
    jsonOk($user);
}

jsonError('Acción no reconocida.', 404);
