<?php
/**
 * REMAC — API: Gestión de cuentas ciudadanas (solo admin)
 * GET /api/usuarios          → Listar ciudadanos registrados
 * PUT /api/usuarios?id=X     → Activar/desactivar una cuenta ({activo: true|false})
 */

require_once __DIR__ . '/config/helpers.php';

setCorsHeaders();

$method = $_SERVER['REQUEST_METHOD'];
$id     = $_GET['id'] ?? null;

requireAdmin();
$db = getDB();

/* ── GET — listar ciudadanos ─────────────────────── */
if ($method === 'GET') {
    $where  = ['rol = "ciudadano"'];
    $params = [];

    if (!empty($_GET['q'])) {
        $q = '%' . $_GET['q'] . '%';
        $where[] = '(nombre LIKE ? OR email LIKE ? OR telefono LIKE ?)';
        $params  = [$q, $q, $q];
    }

    $sql = '
        SELECT d.id, d.nombre, d.email, d.telefono, d.direccion, d.colonia, d.activo, d.created_at,
               (SELECT COUNT(*) FROM mascotas m WHERE m.dueno_id = d.id) AS total_mascotas
        FROM duenos d
        WHERE ' . implode(' AND ', $where) . '
        ORDER BY d.created_at DESC
    ';
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    jsonOk($stmt->fetchAll());
}

/* ── PUT — activar / desactivar cuenta ───────────── */
if ($method === 'PUT' && $id) {
    $body = getBody();
    if (!array_key_exists('activo', $body)) jsonError('Falta el campo "activo".', 400);

    $stmt = $db->prepare('SELECT id FROM duenos WHERE id = ? AND rol = "ciudadano"');
    $stmt->execute([$id]);
    if (!$stmt->fetch()) jsonError('Cuenta no encontrada.', 404);

    $activo = (int)(bool)$body['activo'];
    $db->prepare('UPDATE duenos SET activo = ?, token_sesion = NULL WHERE id = ?')->execute([$activo, $id]);

    $updated = $db->prepare('SELECT id, nombre, email, telefono, activo FROM duenos WHERE id = ?');
    $updated->execute([$id]);
    jsonOk($updated->fetch());
}

jsonError('Método o ruta no soportada.', 405);
