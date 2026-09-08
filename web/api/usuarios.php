<?php
/**
 * REMAC — API: Gestión de cuentas ciudadanas y de personal (admin/asistente)
 * GET  /api/usuarios                        → Listar/buscar ciudadanos (admin y asistente)
 * GET  /api/usuarios?rol=asistente          → Listar cuentas de personal de apoyo (solo admin)
 * GET  /api/usuarios?rol=todos              → Listar ciudadanos + asistentes juntos (solo admin)
 * PUT  /api/usuarios?id=X                   → Activar/desactivar una cuenta (solo admin)
 * POST /api/usuarios?action=crear-cuenta    → Crear cuenta de Ciudadano o Asistente (solo admin, nunca Administrador)
 * POST /api/usuarios?action=asignar-correo  → Da correo/contraseña a un ciudadano sin correo (solo admin)
 * POST /api/usuarios?action=promover-admin  → Convierte una cuenta existente en admin (solo superadmin)
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

    // Orden: lista blanca de columnas — nunca se interpola el sort del
    // cliente directo en el SQL, igual de "seguro por diseño" que el resto
    // de este archivo (ver promover-admin más abajo).
    $sortColumnas = [
        'nombre' => 'd.nombre', 'colonia' => 'd.colonia', 'total_mascotas' => 'total_mascotas',
        'created_at' => 'd.created_at', 'activo' => 'd.activo', 'rol' => 'd.rol',
    ];
    $sortCol = $sortColumnas[$_GET['sort'] ?? ''] ?? 'd.created_at';
    $sortDir = (($_GET['dir'] ?? '') === 'asc') ? 'ASC' : 'DESC';

    $selectCols = '
        d.id, d.nombre, d.email, d.telefono, d.direccion, d.colonia, d.rol, d.activo, d.created_at,
        (SELECT COUNT(*) FROM mascotas m WHERE m.dueno_id = d.id) AS total_mascotas
    ';
    $baseSql = 'FROM duenos d WHERE ' . implode(' AND ', $where);

    // Paginación real: solo si se pide explícitamente (?page=) — mismo
    // criterio que mascotas.php. Antes esto siempre traía TODAS las cuentas
    // que hicieran match, y el panel las paginaba/ordenaba en el navegador
    // ya con todo descargado (con miles de cuentas, eso fue justo lo que
    // congeló el panel — ver HISTORIAL_CAMBIOS.md, 2026-08-25).
    if (!empty($_GET['page'])) {
        $countStmt = $db->prepare('SELECT COUNT(*) ' . $baseSql);
        $countStmt->execute($params);
        $total = (int) $countStmt->fetchColumn();

        $page     = max(1, (int)$_GET['page']);
        $pageSize = min(100, max(1, (int)($_GET['pageSize'] ?? 25)));
        $offset   = ($page - 1) * $pageSize;

        $stmt = $db->prepare("SELECT $selectCols $baseSql ORDER BY $sortCol $sortDir LIMIT $pageSize OFFSET $offset");
        $stmt->execute($params);
        jsonOk(['rows' => $stmt->fetchAll(), 'total' => $total]);
    }

    $stmt = $db->prepare("SELECT $selectCols $baseSql ORDER BY $sortCol $sortDir");
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
    $nombre   = clean(trim($body['nombre'] ?? ''));
    $email    = strtolower(trim($body['email'] ?? ''));
    $telefono = clean(trim($body['telefono'] ?? ''));
    $password = $body['password'] ?? '';
    $rol      = $body['rol'] ?? '';

    if (empty($nombre))   jsonError('El nombre completo es obligatorio.', 400);
    if (empty($email))    jsonError('El correo electrónico es obligatorio.', 400);
    if (empty($telefono)) jsonError('El teléfono de contacto es obligatorio.', 400);
    $passErr = validarPassword($password);
    if ($passErr) jsonError($passErr, 400);
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

/* ── POST ?action=asignar-correo — el admin (cualquiera, no requiere
   superadmin) le da correo y contraseña a una cuenta de CIUDADANO que
   todavía no tiene (registrada sin correo por un asistente, ej. una
   persona adulta mayor), para que pueda iniciar sesión por su cuenta.
   Solo funciona si la cuenta TODAVÍA no tiene correo — no sirve para
   cambiarle el correo a alguien que ya puede iniciar sesión (eso lo
   hace la propia persona desde "Mi perfil"), así ningún admin puede
   "robarse" una cuenta ya activa cambiándole las credenciales sin que
   esa persona se entere. ── */
if ($method === 'POST' && $action === 'asignar-correo') {
    requireAdmin();
    $db = getDB();

    $body     = getBody();
    $id       = (int)($body['id'] ?? 0);
    $email    = strtolower(trim($body['email'] ?? ''));
    $password = $body['password'] ?? '';

    if ($id <= 0) jsonError('Falta el id de la cuenta.', 400);
    if (empty($email)) jsonError('El correo electrónico es obligatorio.', 400);
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) jsonError('El correo electrónico no es válido.', 400);
    $passErr = validarPassword($password);
    if ($passErr) jsonError($passErr, 400);

    $stmt = $db->prepare('SELECT id, nombre, email, rol FROM duenos WHERE id = ?');
    $stmt->execute([$id]);
    $cuenta = $stmt->fetch();
    if (!$cuenta) jsonError('Cuenta no encontrada.', 404);
    if ($cuenta['rol'] !== 'ciudadano') jsonError('Solo se puede asignar correo a una cuenta de Ciudadano.', 400);
    if ($cuenta['email'] !== null) jsonError('Esta cuenta ya tiene correo — solo la propia persona puede cambiarlo, desde "Mi perfil".', 400);

    $chk = $db->prepare('SELECT id FROM duenos WHERE email = ?');
    $chk->execute([$email]);
    if ($chk->fetch()) jsonError('Ese correo electrónico ya está en uso por otra cuenta.', 400);

    $hash = password_hash($password, PASSWORD_DEFAULT);
    $upd  = $db->prepare("UPDATE duenos SET email = ?, password_hash = ? WHERE id = ? AND rol = 'ciudadano' AND email IS NULL");
    $upd->execute([$email, $hash, $id]);
    if ($upd->rowCount() === 0) {
        jsonError('La cuenta cambió mientras se procesaba (puede que ya le hayan asignado correo). Intenta de nuevo.', 409);
    }

    jsonOk([
        'id'      => $cuenta['id'],
        'nombre'  => $cuenta['nombre'],
        'email'   => $email,
        'message' => 'Correo y contraseña asignados. Ya puede iniciar sesión con este correo.',
    ]);
}

/* ── POST ?action=promover-admin — el superadmin (única cuenta con
   es_superadmin=1 en la BD) convierte una cuenta YA existente (ciudadano
   o asistente) en admin. Los admins normales (los que el superadmin cree
   después) NO pueden llamar esto — requireSuperAdmin() lo exige en el
   servidor, no solo se oculta el botón en el HTML. Esta acción NUNCA
   marca es_superadmin=1 en la cuenta promovida: solo otorga rol='admin'
   normal, sin el poder de promover a otros. Revocar el rol admin sigue
   siendo solo por acceso directo a la base de datos, igual que hoy. ── */
if ($method === 'POST' && $action === 'promover-admin') {
    $yo = requireSuperAdmin();
    $db = getDB();

    $body = getBody();
    $id   = (int)($body['id'] ?? 0);
    if ($id <= 0) jsonError('Falta el id de la cuenta a promover.', 400);

    if ($id === (int)$yo['id']) {
        jsonError('No puedes cambiar tu propio rol desde aquí.', 400);
    }

    $stmt = $db->prepare('SELECT id, nombre, email, rol, activo, password_hash FROM duenos WHERE id = ?');
    $stmt->execute([$id]);
    $cuenta = $stmt->fetch();
    if (!$cuenta) jsonError('Cuenta no encontrada.', 404);

    if (!in_array($cuenta['rol'], ['ciudadano', 'asistente'], true)) {
        jsonError('Rol no válido para promover. Solo se puede convertir en admin a una cuenta de Ciudadano o Asistente.', 400);
    }
    if ((int)$cuenta['activo'] !== 1) {
        jsonError('No se puede promover una cuenta desactivada. Actívala primero.', 400);
    }
    if (empty($cuenta['email']) || empty($cuenta['password_hash'])) {
        jsonError('Esta cuenta no tiene correo y contraseña propios (fue registrada sin correo por un asistente) — no podría iniciar sesión como admin.', 400);
    }

    // UPDATE atómico con las mismas condiciones ya validadas arriba: si otra
    // petición cambió la cuenta justo en medio (doble clic, otra pestaña),
    // rowCount() da 0 en vez de promover una fila que ya no cumple.
    $upd = $db->prepare("
        UPDATE duenos SET rol = 'admin', token_sesion = NULL
        WHERE id = ? AND rol IN ('ciudadano', 'asistente') AND activo = 1
          AND email IS NOT NULL AND password_hash IS NOT NULL
    ");
    $upd->execute([$id]);
    if ($upd->rowCount() === 0) {
        jsonError('La cuenta cambió mientras se procesaba. Intenta de nuevo.', 409);
    }

    jsonOk([
        'id'      => $cuenta['id'],
        'nombre'  => $cuenta['nombre'],
        'email'   => $cuenta['email'],
        'rol'     => 'admin',
        'message' => 'Cuenta promovida a administrador correctamente.',
    ]);
}

/* ── POST ?action=buscar-o-crear — admin/asistente buscan por teléfono
   o crean un ciudadano SIN correo (registro asistido en ventanilla o
   en campo, ej. una persona adulta mayor sin correo electrónico). ── */
if ($method === 'POST' && $action === 'buscar-o-crear') {
    requireRole(['admin', 'asistente']);
    $db = getDB();

    $body     = getBody();
    $nombre   = clean(trim($body['nombre'] ?? ''));
    $telefono = clean(trim($body['telefono'] ?? ''));
    $direccion = clean(trim($body['direccion'] ?? ''));
    $colonia   = clean(trim($body['colonia'] ?? ''));

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
