<?php
/**
 * REMAC — Funciones auxiliares de la API
 */

require_once __DIR__ . '/database.php';

/* ── Manejo global de errores: SIEMPRE responder JSON, nunca HTML ──
   Sin esto, cualquier error o advertencia de PHP (ej. un dato que no
   cabe en una columna de la BD) se imprime como HTML antes del JSON y
   rompe res.json() en el navegador con "Unexpected token '<'". */
set_error_handler(function (int $errno, string $errstr, string $errfile, int $errline): bool {
    if (!(error_reporting() & $errno)) return false;
    throw new ErrorException($errstr, 0, $errno, $errfile, $errline);
});

set_exception_handler(function (Throwable $e): void {
    error_log($e->getMessage());
    if (!headers_sent()) {
        header('Content-Type: application/json; charset=utf-8');
    }
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Error interno del servidor. Inténtalo de nuevo.'], JSON_UNESCAPED_UNICODE);
    exit;
});

/* ── CORS ──────────────────────────────────────── */
/* Antes: 'Access-Control-Allow-Origin: *' — la API respondía a
   cualquier sitio del mundo. El frontend de REMAC solo llama a su
   propio dominio (API_BASE_URL en api-client.js usa
   window.location.origin), así que restringir esto a los orígenes de
   desarrollo local + PRODUCTION_ORIGINS (database.php) no rompe nada
   propio, y bloquea que otro sitio use la API con las cookies/token de
   un usuario. */
function setCorsHeaders(): void {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $esOrigenLocal = (bool) preg_match(
        '#^https?://(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3})(:\d+)?$#',
        $origin
    );

    if ($origin !== '' && ($esOrigenLocal || in_array($origin, PRODUCTION_ORIGINS, true))) {
        header("Access-Control-Allow-Origin: $origin");
        header('Vary: Origin');
    }
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
    header('Content-Type: application/json; charset=utf-8');

    // Pre-flight
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

/* ── Respuestas JSON ────────────────────────────── */
function jsonOk(mixed $data, int $code = 200): never {
    http_response_code($code);
    echo json_encode(['ok' => true, 'data' => $data], JSON_UNESCAPED_UNICODE);
    exit;
}

function jsonError(string $msg, int $code = 400): never {
    http_response_code($code);
    echo json_encode(['ok' => false, 'error' => $msg], JSON_UNESCAPED_UNICODE);
    exit;
}

/* ── Leer cuerpo JSON del request ───────────────── */
function getBody(): array {
    $raw = file_get_contents('php://input');
    return $raw ? (json_decode($raw, true) ?? []) : [];
}

/* ── Autenticación por token ────────────────────── */
function getAuthToken(): ?string {
    // Distintas configuraciones de Apache/PHP (mod_php, PHP-FPM, tras
    // RewriteRule) exponen el header Authorization en variables distintas.
    $h = $_SERVER['HTTP_AUTHORIZATION']
        ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
        ?? '';

    if (!$h && function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
        $h = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    }

    if (str_starts_with($h, 'Bearer ')) {
        return substr($h, 7);
    }
    return null;
}

function requireAuth(): array {
    $token = getAuthToken();
    if (!$token) jsonError('No autorizado. Falta el token.', 401);

    $db   = getDB();
    $stmt = $db->prepare('SELECT id, nombre, email, telefono, rol, es_superadmin, token_creado_en FROM duenos WHERE token_sesion = ? AND activo = 1');
    $stmt->execute([$token]);
    $user = $stmt->fetch();

    if (!$user) jsonError('Token inválido o expirado.', 401);

    if ($user['token_creado_en'] && (time() - strtotime($user['token_creado_en'])) > TOKEN_EXPIRY) {
        $db->prepare('UPDATE duenos SET token_sesion = NULL, token_creado_en = NULL WHERE id = ?')->execute([$user['id']]);
        jsonError('Tu sesión expiró. Vuelve a iniciar sesión.', 401);
    }

    $user['es_superadmin'] = (int) $user['es_superadmin']; // normaliza a 0|1 (PDO puede devolver string)
    unset($user['token_creado_en']);
    return $user;
}

function requireAdmin(): array {
    $user = requireAuth();
    if ($user['rol'] !== 'admin') jsonError('Acceso denegado. Se requiere rol admin.', 403);
    return $user;
}

/* Igual que requireAdmin() pero además exige que la cuenta esté marcada
   como superadmin (columna es_superadmin, activada a mano en la BD solo
   para admin@remac.elgrullo.mx — ver HISTORIAL_CAMBIOS.md). Los admins
   normales (los que el superadmin cree después) no pasan este check. */
function requireSuperAdmin(): array {
    $user = requireAdmin();
    if ($user['es_superadmin'] !== 1) jsonError('Acceso denegado. Se requiere ser superadmin.', 403);
    return $user;
}

/* Igual que requireAdmin() pero acepta una lista de roles permitidos,
   ej. requireRole(['admin', 'asistente']). */
function requireRole(array $roles): array {
    $user = requireAuth();
    if (!in_array($user['rol'], $roles, true)) {
        jsonError('Acceso denegado. No tienes permiso para esta acción.', 403);
    }
    return $user;
}

/* ── Generador de folio REMAC-GRU-XXXXX ─────────── */
function generarFolioREMAC(): string {
    $db = getDB();
    $db->beginTransaction();
    try {
        $db->exec('UPDATE folio_counter SET ultimo = ultimo + 1');
        $num = $db->query('SELECT ultimo FROM folio_counter LIMIT 1')->fetchColumn();
        $db->commit();
        return 'REMAC-GRU-' . str_pad((string)$num, 5, '0', STR_PAD_LEFT);
    } catch (Throwable $e) {
        $db->rollBack();
        throw $e;
    }
}

/* ── Sanitizar string ───────────────────────────── */
function clean(?string $val): ?string {
    if ($val === null) return null;
    return trim(htmlspecialchars($val, ENT_QUOTES, 'UTF-8'));
}
