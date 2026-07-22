<?php
/**
 * REMAC — API: Mascotas
 *
 * GET    /api/mascotas            → Listar (admin: todas | ciudadano: las suyas)
 * GET    /api/mascotas?id=XXXXX   → Ver una (PÚBLICO — para el QR)
 * POST   /api/mascotas            → Registrar nueva mascota
 * PUT    /api/mascotas?id=XXXXX   → Actualizar mascota
 * DELETE /api/mascotas?id=XXXXX   → Dar de baja (estatus = 'Baja')
 */

require_once __DIR__ . '/config/helpers.php';

setCorsHeaders();

$method = $_SERVER['REQUEST_METHOD'];
$id     = $_GET['id'] ?? null;

/* ════════════════════════════════════════════════
   GET — Ver una mascota por ID (PÚBLICO, para QR)
   ════════════════════════════════════════════════ */
if ($method === 'GET' && $id) {
    $db   = getDB();
    $stmt = $db->prepare('
        SELECT m.*, d.nombre AS persona, d.telefono, d.direccion AS dir_dueno, d.colonia AS colonia_dueno
        FROM mascotas m
        JOIN duenos d ON m.dueno_id = d.id
        WHERE m.id = ?
    ');
    $stmt->execute([$id]);
    $pet = $stmt->fetch();

    if (!$pet) jsonError('Mascota no encontrada.', 404);
    jsonOk($pet);
}

/* ════════════════════════════════════════════════
   GET — Listar mascotas
   ════════════════════════════════════════════════ */
if ($method === 'GET') {
    $user = requireAuth();

    $db     = getDB();
    $where  = [];
    $params = [];

    // Ciudadano: solo ve las suyas
    if ($user['rol'] !== 'admin') {
        $where[]  = 'm.dueno_id = ?';
        $params[] = $user['id'];
    }

    // Filtros opcionales
    if (!empty($_GET['especie'])) {
        $where[]  = 'm.especie = ?';
        $params[] = $_GET['especie'];
    }
    if (!empty($_GET['estatus'])) {
        $where[]  = 'm.estatus = ?';
        $params[] = $_GET['estatus'];
    }
    if (!empty($_GET['colonia'])) {
        $where[]  = 'd.colonia = ?';
        $params[] = $_GET['colonia'];
    }
    if (!empty($_GET['q'])) {
        $q        = '%' . $_GET['q'] . '%';
        $where[]  = '(m.nombre LIKE ? OR m.id LIKE ? OR d.nombre LIKE ? OR d.colonia LIKE ?)';
        $params   = array_merge($params, [$q, $q, $q, $q]);
    }

    $sql = '
        SELECT m.*, d.nombre AS persona, d.telefono, d.colonia
        FROM mascotas m
        JOIN duenos d ON m.dueno_id = d.id'
        . ($where ? ' WHERE ' . implode(' AND ', $where) : '')
        . ' ORDER BY m.created_at DESC';

    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    jsonOk($stmt->fetchAll());
}

/* ════════════════════════════════════════════════
   POST — Registrar nueva mascota
   ════════════════════════════════════════════════ */
if ($method === 'POST') {
    $user = requireAuth();
    $body = getBody();

    // Validaciones
    if (empty($body['nombre']))  jsonError('El nombre de la mascota es obligatorio.');
    if (empty($body['especie'])) jsonError('La especie es obligatoria.');
    if (!in_array($body['especie'], ['perro','gato'])) jsonError('Especie no válida.');

    $db    = getDB();
    $folio = generarFolioREMAC();

    $stmt = $db->prepare('
        INSERT INTO mascotas
          (id, nombre, especie, raza, edad, edad_label, sexo, color, senias_particulares,
           foto_url, vacunado, esterilizado, estatus, dueno_id, fecha_registro, link_publico, ficha)
        VALUES
          (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ');

    $fecha = !empty($body['fecha_registro']) ? $body['fecha_registro'] : date('Y-m-d');

    $stmt->execute([
        $folio,
        clean($body['nombre']),
        $body['especie'],
        clean($body['raza']   ?? null),
        clean($body['edad']   ?? null),
        clean($body['edad_label'] ?? null),
        $body['sexo']         ?? null,
        clean($body['color']  ?? null),
        clean($body['senias_particulares'] ?? null),
        $body['foto_url']     ?? null,
        (int)($body['vacunado']    ?? 0),
        (int)($body['esterilizado']?? 0),
        $body['estatus']      ?? 'Alta',
        $user['id'],
        $fecha,
        "mascota.php?id=$folio",
        "$folio.pdf",
    ]);

    $created = $db->prepare('SELECT m.*, d.nombre AS persona, d.telefono, d.colonia FROM mascotas m JOIN duenos d ON m.dueno_id = d.id WHERE m.id = ?');
    $created->execute([$folio]);

    jsonOk($created->fetch(), 201);
}

/* ════════════════════════════════════════════════
   PUT — Actualizar mascota
   ════════════════════════════════════════════════ */
if ($method === 'PUT' && $id) {
    $user = requireAuth();
    $body = getBody();
    $db   = getDB();

    // Verificar que la mascota le pertenece (o es admin)
    $stmt = $db->prepare('SELECT dueno_id FROM mascotas WHERE id = ?');
    $stmt->execute([$id]);
    $pet = $stmt->fetch();

    if (!$pet) jsonError('Mascota no encontrada.', 404);
    if ($user['rol'] !== 'admin' && $pet['dueno_id'] != $user['id']) {
        jsonError('No tienes permiso para editar esta mascota.', 403);
    }

    $campos = [];
    $params = [];
    $allowed = ['nombre','especie','raza','edad','edad_label','sexo','color',
                'senias_particulares','foto_url','vacunado','esterilizado','estatus','fecha_registro'];

    foreach ($allowed as $campo) {
        if (array_key_exists($campo, $body)) {
            $campos[] = "$campo = ?";
            $params[] = in_array($campo, ['vacunado','esterilizado'])
                ? (int)$body[$campo]
                : clean($body[$campo]);
        }
    }

    if (!$campos) jsonError('No se recibieron campos para actualizar.');

    $params[] = $id;
    $db->prepare('UPDATE mascotas SET ' . implode(', ', $campos) . ' WHERE id = ?')
       ->execute($params);

    $updated = $db->prepare('SELECT m.*, d.nombre AS persona, d.telefono, d.colonia FROM mascotas m JOIN duenos d ON m.dueno_id = d.id WHERE m.id = ?');
    $updated->execute([$id]);
    jsonOk($updated->fetch());
}

/* ════════════════════════════════════════════════
   DELETE — Dar de baja (soft delete)
   ════════════════════════════════════════════════ */
if ($method === 'DELETE' && $id) {
    $user = requireAuth();
    $db   = getDB();

    $stmt = $db->prepare('SELECT dueno_id FROM mascotas WHERE id = ?');
    $stmt->execute([$id]);
    $pet = $stmt->fetch();

    if (!$pet) jsonError('Mascota no encontrada.', 404);
    if ($user['rol'] !== 'admin' && $pet['dueno_id'] != $user['id']) {
        jsonError('No tienes permiso para dar de baja esta mascota.', 403);
    }

    $db->prepare("UPDATE mascotas SET estatus = 'Baja' WHERE id = ?")
       ->execute([$id]);

    jsonOk(['message' => "Mascota $id dada de baja correctamente."]);
}

jsonError('Método o ruta no soportada.', 405);
