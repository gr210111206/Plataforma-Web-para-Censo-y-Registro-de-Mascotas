<?php
/**
 * REMAC — API: Campañas y artículos
 * GET    /api/campanas               → Lista de campañas publicadas (público)
 * GET    /api/articulos              → Lista de artículos publicados (público)
 * POST   /api/articulos              → Crear artículo (solo admin)
 * PUT    /api/articulos?id=X         → Actualizar artículo (solo admin)
 * DELETE /api/articulos?id=X         → Eliminar artículo (solo admin)
 */

require_once __DIR__ . '/config/helpers.php';

setCorsHeaders();

$method   = $_SERVER['REQUEST_METHOD'];
$resource = $_GET['resource'] ?? '';
$id       = $_GET['id'] ?? null;

/* ── GET — lectura pública ──────────────────────── */
if ($method === 'GET') {
    $db = getDB();

    if ($resource === 'campanas') {
        $rows = $db->query('SELECT * FROM campanas WHERE publicado = 1 ORDER BY fecha_inicio ASC')->fetchAll();
        jsonOk($rows);
    }

    if ($resource === 'articulos') {
        $rows = $db->query('SELECT * FROM articulos WHERE publicado = 1 ORDER BY created_at DESC')->fetchAll();
        jsonOk($rows);
    }

    jsonError('Recurso no reconocido. Usa ?resource=campanas o ?resource=articulos', 404);
}

/* ── POST /api/articulos — crear (solo admin) ───── */
if ($method === 'POST' && $resource === 'articulos') {
    requireAdmin();
    $body = getBody();

    $titulo = trim($body['titulo'] ?? '');
    $contenido = trim($body['contenido'] ?? '');
    if ($titulo === '')    jsonError('El título es obligatorio.', 400);
    if ($contenido === '') jsonError('El contenido no puede estar vacío.', 400);

    $db = getDB();
    $stmt = $db->prepare('
        INSERT INTO articulos (titulo, contenido, imagen_icono, publicado)
        VALUES (?, ?, ?, ?)
    ');
    $stmt->execute([
        clean($titulo),
        $contenido,
        clean($body['imagen_icono'] ?? null) ?: '📄',
        isset($body['publicado']) ? (int)(bool)$body['publicado'] : 1,
    ]);

    $newId = $db->lastInsertId();
    $created = $db->prepare('SELECT * FROM articulos WHERE id = ?');
    $created->execute([$newId]);
    jsonOk($created->fetch(), 201);
}

/* ── PUT /api/articulos?id=X — actualizar (solo admin) ── */
if ($method === 'PUT' && $resource === 'articulos' && $id) {
    requireAdmin();
    $body = getBody();
    $db   = getDB();

    $campos  = [];
    $params  = [];
    $allowed = ['titulo', 'contenido', 'imagen_icono', 'publicado'];

    foreach ($allowed as $campo) {
        if (array_key_exists($campo, $body)) {
            $campos[] = "$campo = ?";
            $params[] = $campo === 'publicado' ? (int)(bool)$body[$campo]
                : ($campo === 'contenido' ? $body[$campo] : clean($body[$campo]));
        }
    }
    if (!$campos) jsonError('No se recibieron campos para actualizar.');

    $params[] = $id;
    $db->prepare('UPDATE articulos SET ' . implode(', ', $campos) . ' WHERE id = ?')->execute($params);

    $updated = $db->prepare('SELECT * FROM articulos WHERE id = ?');
    $updated->execute([$id]);
    $row = $updated->fetch();
    if (!$row) jsonError('Artículo no encontrado.', 404);
    jsonOk($row);
}

/* ── DELETE /api/articulos?id=X — eliminar (solo admin) ── */
if ($method === 'DELETE' && $resource === 'articulos' && $id) {
    requireAdmin();
    $db = getDB();
    $db->prepare('DELETE FROM articulos WHERE id = ?')->execute([$id]);
    jsonOk(['message' => 'Artículo eliminado.']);
}

jsonError('Método o ruta no soportada.', 405);
