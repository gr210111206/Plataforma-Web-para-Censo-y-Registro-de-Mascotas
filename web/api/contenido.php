<?php
/**
 * REMAC — API: Campañas y artículos
 * GET /api/campanas  → Lista de campañas publicadas
 * GET /api/articulos → Lista de artículos publicados
 */

require_once __DIR__ . '/config/helpers.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonError('Método no soportado.', 405);
}

$db       = getDB();
$resource = $_GET['resource'] ?? '';

if ($resource === 'campanas') {
    $rows = $db->query('SELECT * FROM campanas WHERE publicado = 1 ORDER BY fecha_inicio ASC')->fetchAll();
    jsonOk($rows);
}

if ($resource === 'articulos') {
    $rows = $db->query('SELECT * FROM articulos WHERE publicado = 1 ORDER BY created_at DESC')->fetchAll();
    jsonOk($rows);
}

jsonError('Recurso no reconocido. Usa ?resource=campanas o ?resource=articulos', 404);
