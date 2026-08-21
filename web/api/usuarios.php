<?php
/**
 * REMAC — API: Gestión de cuentas ciudadanas y de personal (admin/asistente)
 * GET  /api/usuarios                        → Listar/buscar ciudadanos (admin y asistente)
 * GET  /api/usuarios?rol=asistente          → Listar cuentas de personal de apoyo (solo admin)
 * GET  /api/usuarios?rol=todos              → Listar ciudadanos + asistentes juntos (solo admin)
 * PUT  /api/usuarios?id=X                   → Activar/desactivar una cuenta (solo admin)
 * POST /api/usuarios?action=crear-cuenta    → Crear cuenta de Ciudadano o Asistente (solo admin, nunca Administrador)
 * POST /api/usuarios?action=buscar-o-crear  → Buscar por teléfono o crear ciudadano sin correo (admin y asistente)
 */

require_once __DIR__ . '/config/helpers.php';

setCorsHeaders();

$method = $_SERVER['REQUEST_METHOD'];
$id     = $_GET['id'] ?? null;
$action = $_GET['action'] ?? '';

/* ── GET — listar/buscar cuentas. Por default solo ciudadanos (admin y
   asistente pueden verlos); ?rol=asistente o ?rol=todos exponen al
   personal de apoyo, reservado solo a admin (para no exponer datos de
   otro personal a un asistente). ── */
if ($method === 'GET') {
    $rolFiltro = $_GET['rol'] ?? 'ciudadano';
    if (!in_array($rolFiltro, ['ciudadano', 'asistente', 'todos'], true)) {
        jsonError('Filtro de rol no válido.', 400);
    }
    if ($rolFiltro === 'asistente' || $rolFiltro === 'todos') {
        requireAdmin();
    } else {
        requireRole(['admin', 'asistente']);
    }
    $db = getDB();

    $where  = [];
    $params = [];
    if ($rolFiltro === 'todos') {
        $where[] = "rol IN ('ciudadano', 'asistente')";
    } else {
        $where[]  = 'rol = ?';
        $params[] = $rolFiltro;
    }

    if (!empty($_GET['q'])) {
        $q = '%' . $_GET['q'] . '%';
        $where[] = '(nombre LIKE ? OR email LIKE ? OR telefono LIKE ?)';
        $params  = array_merge($params, [$q, $q, $q]);
    }

    $sql = '
        SELECT d.id, d.nombre, d.email, d.telefono, d.direccion, d.colonia, d.rol, d.activo, d.created_at,
               (SELECT COUNT(*) FROM mascotas m WHERE m.dueno_id = d.id) AS total_mascotas
        FROM duenos d
        WHERE ' . implode(' AND ', $where) . '
        ORDER BY d.created_at DESC
    ';
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    jsonOk($stmt->fetchAll());
}

/* ── PUT — activar / desactivar cuenta (solo admin) ── */
if ($method === 'PUT' && $id) {
    requireAdmin();
    $db = getDB();

    $body = getBody();
    if (!array_key_exists('activo', $body)) jsonError('Falta el campo "activo".', 400);

    $stmt = $db->prepare('SELECT id FROM duenos WHERE id = ? AND rol IN ("ciudadano", "asistente")');
    $stmt->execute([$id]);
    if (!$stmt->fetch()) jsonError('Cuenta no encontrada.', 404);

    $activo = (int)(bool)$body['activo'];
    $db->prepare('UPDATE duenos SET activo = ?, token_sesion = NULL WHERE id = ?')->execute([$activo, $id]);

    $updated = $db->prepare('SELECT id, nombre, email, telefono, activo FROM duenos WHERE id = ?');
    $updated->execute([$id]);
    jsonOk($updated->fetch());
}

/* ── POST ?action=crear-cuenta — admin crea una cuenta de Ciudadano o
   Asistente CON correo y contraseña (para que esa cuenta pueda iniciar
   sesión). Nunca permite crear "admin" desde aquí, aunque se manipule
   la petición — es una validación de servidor, no solo del formulario. ── */
if ($method === 'POST' && $action === 'crear-cuenta') {
    requireAdmin();
    $db = getDB();

    $body     = getBody();
    $nombre   = trim($body['nombre'] ?? '');
    $email    = strtolower(trim($body['email'] ?? ''));
    $telefono = trim($body['telefono'] ?? '');
    $password = $body['password'] ?? '';
    $rol      = $body['rol'] ?? '';

    if (empty($nombre))   jsonError('El nombre completo es obligatorio.', 400);
    if (empty($email))    jsonError('El correo electrónico es obligatorio.', 400);
    if (empty($telefono)) jsonError('El teléfono de contacto es obligatorio.', 400);
    if (empty($password) || strlen($password) < 8) {
        jsonError('La contraseña debe tener al menos 8 caracteres.', 400);
    }
    if (!in_array($rol, ['ciudadano', 'asistente'], true)) {
        jsonError('Rol no válido. Solo se pueden crear cuentas de Ciudadano o Asistente.', 400);
    }

    $stmt = $db->prepare('SELECT id FROM duenos WHERE email = ?');
    $stmt->execute([$email]);
    if ($stmt->fetch()) jsonError('Este correo electrónico ya está registrado.', 400);

    $hash = password_hash($password, PASSWORD_DEFAULT);
    $ins  = $db->prepare('
        INSERT INTO duenos (nombre, email, password_hash, telefono, rol, activo)
        VALUES (?, ?, ?, ?, ?, 1)
    ');
    $ins->execute([$nombre, $email, $hash, $telefono, $rol]);

    jsonOk([
        'id'      => $db->lastInsertId(),
        'nombre'  => $nombre,
        'email'   => $email,
        'telefono'=> $telefono,
        'rol'     => $rol,
        'message' => 'Cuenta creada correctamente.',
    ]);
}

/* ── POST ?action=buscar-o-crear — admin/asistente buscan por teléfono
   o crean un ciudadano SIN correo (registro asistido en ventanilla o
   en campo, ej. una persona adulta mayor sin correo electrónico). ── */
if ($method === 'POST' && $action === 'buscar-o-crear') {
    requireRole(['admin', 'asistente']);
    $db = getDB();

    $body     = getBody();
    $nombre   = trim($body['nombre'] ?? '');
    $telefono = trim($body['telefono'] ?? '');
    $direccion = trim($body['direccion'] ?? '');
    $colonia   = trim($body['colonia'] ?? '');

    if (empty($nombre))   jsonError('El nombre completo es obligatorio.', 400);
    if (empty($telefono)) jsonError('El teléfono de contacto es obligatorio.', 400);

    // Evita duplicar a la misma persona si ya se había registrado antes
    // (ej. vuelve con una segunda mascota en otra visita).
    $stmt = $db->prepare('SELECT id, nombre, telefono, email, direccion, colonia, activo FROM duenos WHERE telefono = ? AND rol = "ciudadano" LIMIT 1');
    $stmt->execute([$telefono]);
    $existente = $stmt->fetch();
    if ($existente) {
        jsonOk(array_merge(['existed' => true], $existente));
    }

    $ins = $db->prepare('
        INSERT INTO duenos (nombre, telefono, email, direccion, colonia, password_hash, rol, activo)
        VALUES (?, ?, NULL, ?, ?, NULL, "ciudadano", 1)
    ');
    $ins->execute([$nombre, $telefono, $direccion ?: null, $colonia ?: null]);

    jsonOk([
        'existed'   => false,
        'id'        => $db->lastInsertId(),
        'nombre'    => $nombre,
        'telefono'  => $telefono,
        'email'     => null,
        'direccion' => $direccion ?: null,
        'colonia'   => $colonia ?: null,
        'activo'    => 1,
    ]);
}

jsonError('Método o ruta no soportada.', 405);
