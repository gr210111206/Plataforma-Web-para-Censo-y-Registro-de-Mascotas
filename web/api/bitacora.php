<?php
/**
 * API: Bitácora de auditoría
 * GET /api/bitacora.php?page=&pageSize= → Lista paginada (solo SUPERADMIN,
 *   no cualquier admin — restringido el 2026-09-30 a petición del usuario;
 *   antes cualquier cuenta admin podía verla).
 */

require_once __DIR__ . '/config/helpers.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonError('Método no soportado.', 405);
}

requireSuperAdmin();

$db = getDB();

$page     = max(1, (int)($_GET['page'] ?? 1));
$pageSize = min(100, max(1, (int)($_GET['pageSize'] ?? 25)));
$offset   = ($page - 1) * $pageSize;

$total = (int) $db->query('SELECT COUNT(*) FROM bitacora')->fetchColumn();

$stmt = $db->prepare("SELECT id, usuario_nombre, accion, detalle, created_at FROM bitacora ORDER BY created_at DESC LIMIT $pageSize OFFSET $offset");
$stmt->execute();

jsonOk(['rows' => $stmt->fetchAll(), 'total' => $total]);
