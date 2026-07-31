<?php
/**
 * REMAC — API: Configuración del sitio
 * GET  /api/settings              → Lee toda la configuración (PÚBLICO)
 * POST /api/settings { key, value } → Guarda una clave (solo ADMIN)
 *
 * Reemplaza el uso exclusivo de localStorage para apariencia,
 * contenidos de portada, municipio y contactos: así los cambios
 * del admin se ven en el navegador de CUALQUIER visitante.
 */

require_once __DIR__ . '/config/helpers.php';

setCorsHeaders();

$method = $_SERVER['REQUEST_METHOD'];

/* ── GET — Lee todas las claves de configuración (público) ── */
if ($method === 'GET') {
    $db   = getDB();
    $rows = $db->query('SELECT config_key, config_value FROM site_config')->fetchAll();

    $out = [];
    foreach ($rows as $row) {
        $decoded = json_decode($row['config_value'], true);
        $out[$row['config_key']] = $decoded !== null ? $decoded : $row['config_value'];
    }
    jsonOk($out);
}

/* ── POST — Guarda una clave de configuración (solo admin) ── */
if ($method === 'POST') {
    requireAdmin();
    $body = getBody();

    $key   = trim($body['key'] ?? '');
    $value = $body['value'] ?? null;

    if ($key === '' || !preg_match('/^[a-zA-Z0-9_\-]{1,60}$/', $key)) {
        jsonError('Clave de configuración inválida.', 400);
    }
    if ($value === null) {
        jsonError('Falta el valor de configuración.', 400);
    }

    $json = json_encode($value, JSON_UNESCAPED_UNICODE);
    $db   = getDB();
    $stmt = $db->prepare('
        INSERT INTO site_config (config_key, config_value)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE config_value = VALUES(config_value)
    ');
    $stmt->execute([$key, $json]);

    jsonOk(['key' => $key, 'message' => 'Configuración guardada.']);
}

jsonError('Método no soportado.', 405);
