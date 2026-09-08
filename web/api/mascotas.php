<?php
/**
 * REMAC — API: Mascotas
 *
 * GET    /api/mascotas              → Listar (admin: todas | ciudadano: las suyas)
 * GET    /api/mascotas?token=XXXXX  → Ver una (PÚBLICO — para el QR/acta)
 * POST   /api/mascotas              → Registrar nueva mascota
 * PUT    /api/mascotas?id=XXXXX     → Actualizar mascota
 * DELETE /api/mascotas?id=XXXXX     → Dar de baja (estatus = 'Baja')
 */

require_once __DIR__ . '/config/helpers.php';

setCorsHeaders();

$method = $_SERVER['REQUEST_METHOD'];
$id     = $_GET['id'] ?? null;
$token  = $_GET['token'] ?? null;

/* ════════════════════════════════════════════════
   GET — Ver una mascota por su token público (PÚBLICO, para QR)
   ════════════════════════════════════════════════ */
if ($method === 'GET' && $token) {
    // Vista pública (QR, sin sesión): solo lo necesario para reunir a la mascota
    // con su dueño. NO se expone dirección/colonia (dato sensible). Se busca
    // por un token aleatorio (token_publico), NUNCA por el folio — el folio
    // es consecutivo y por lo tanto enumerable; conocerlo no debe alcanzar
    // para sacarle el teléfono a nadie del padrón.
    $db   = getDB();
    $stmt = $db->prepare('
        SELECT m.*, d.nombre AS persona, d.telefono
        FROM mascotas m
        JOIN duenos d ON m.dueno_id = d.id
        WHERE m.token_publico = ?
    ');
    $stmt->execute([$token]);
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

    $baseSql = '
        FROM mascotas m
        JOIN duenos d ON m.dueno_id = d.id'
        . ($where ? ' WHERE ' . implode(' AND ', $where) : '');

    // Paginación real: solo si se pide explícitamente (?page=). Así un
    // ciudadano consultando sus propias mascotas (siempre pocas) sigue
    // recibiendo el arreglo plano de siempre — dashboard.html/asistente.html
    // no necesitan cambiar nada. Antes esto siempre traía TODAS las filas
    // (con foto en Base64 incluida) sin importar cuántas hubiera; con
    // volumen real eso fue lo que congeló el panel admin (ver
    // HISTORIAL_CAMBIOS.md, 2026-08-25).
    if (!empty($_GET['page'])) {
        $countStmt = $db->prepare('SELECT COUNT(*) ' . $baseSql);
        $countStmt->execute($params);
        $total = (int) $countStmt->fetchColumn();

        $page     = max(1, (int)$_GET['page']);
        $pageSize = min(100, max(1, (int)($_GET['pageSize'] ?? 25)));
        $offset   = ($page - 1) * $pageSize;

        $stmt = $db->prepare("SELECT m.*, d.nombre AS persona, d.telefono, d.colonia $baseSql ORDER BY m.created_at DESC LIMIT $pageSize OFFSET $offset");
        $stmt->execute($params);
        jsonOk(['rows' => $stmt->fetchAll(), 'total' => $total]);
    }

    $stmt = $db->prepare("SELECT m.*, d.nombre AS persona, d.telefono, d.colonia $baseSql ORDER BY m.created_at DESC");
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

    // Un ciudadano solo puede registrar mascotas para sí mismo. Admin y
    // asistente pueden registrar a nombre de otro ciudadano (ej. registro
    // asistido de alguien sin correo electrónico) si mandan un dueno_id.
    $duenoId = $user['id'];
    if (in_array($user['rol'], ['admin', 'asistente'], true) && !empty($body['dueno_id'])) {
        $chk = $db->prepare('SELECT id FROM duenos WHERE id = ? AND rol = "ciudadano" AND activo = 1');
        $chk->execute([$body['dueno_id']]);
        if (!$chk->fetch()) jsonError('El ciudadano seleccionado no es válido.', 400);
        $duenoId = (int)$body['dueno_id'];
    }

    $fotoErr = validarFotoBase64($body['foto_url'] ?? null);
    if ($fotoErr) jsonError($fotoErr, 400);

    $folio        = generarFolioREMAC();
    $tokenPublico = bin2hex(random_bytes(16));

    $stmt = $db->prepare('
        INSERT INTO mascotas
          (id, token_publico, nombre, especie, raza, edad, edad_label, sexo, color, senias_particulares,
           foto_url, vacunado, esterilizado, estatus, dueno_id, fecha_registro, link_publico, ficha)
        VALUES
          (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ');

    $fecha = !empty($body['fecha_registro']) ? $body['fecha_registro'] : date('Y-m-d');

    $stmt->execute([
        $folio,
        $tokenPublico,
        clean($body['nombre']),
        $body['especie'],
        clean($body['raza']   ?? null),
        clean($body['edad']   ?? null),
        clean($body['edad_label'] ?? null),
        clean($body['sexo']   ?? null),
        clean($body['color']  ?? null),
        clean($body['senias_particulares'] ?? null),
        $body['foto_url']     ?? null,
        (int)($body['vacunado']    ?? 0),
        (int)($body['esterilizado']?? 0),
        clean($body['estatus'] ?? 'Alta'),
        $duenoId,
        $fecha,
        "mascota.html?token=$tokenPublico",
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

    if (array_key_exists('foto_url', $body)) {
        $fotoErr = validarFotoBase64($body['foto_url']);
        if ($fotoErr) jsonError($fotoErr, 400);
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
