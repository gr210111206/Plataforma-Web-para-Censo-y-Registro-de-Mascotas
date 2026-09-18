<?php
/**
 * Funciones auxiliares de la API
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
   cualquier sitio del mundo. El frontend solo llama a su
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

    // El "¿ya expiró?" se calcula DENTRO de MySQL (mismo motivo que el
    // bloqueo de login en auth.php): comparar token_creado_en con
    // time()/strtotime() de PHP depende de que PHP y MySQL coincidan en
    // zona horaria, y en este mismo proyecto no coinciden (PHP quedó en
    // Europe/Berlin, MySQL en la del sistema). Con TOKEN_EXPIRY de 30
    // días un desfase de unas horas casi no se nota, pero es el mismo
    // bug de fondo — se corrige aquí también en vez de dejarlo latente.
    $db   = getDB();
    $stmt = $db->prepare('
        SELECT id, nombre, email, telefono, direccion, colonia, foto_perfil, rol, es_superadmin,
               (token_creado_en IS NOT NULL AND token_creado_en < DATE_SUB(NOW(), INTERVAL ? SECOND)) AS token_expirado
        FROM duenos WHERE token_sesion = ? AND activo = 1
    ');
    $stmt->execute([TOKEN_EXPIRY, $token]);
    $user = $stmt->fetch();

    if (!$user) jsonError('Token inválido o expirado.', 401);

    if ($user['token_expirado']) {
        $db->prepare('UPDATE duenos SET token_sesion = NULL, token_creado_en = NULL WHERE id = ?')->execute([$user['id']]);
        jsonError('Tu sesión expiró. Vuelve a iniciar sesión.', 401);
    }

    $user['es_superadmin'] = (int) $user['es_superadmin']; // normaliza a 0|1 (PDO puede devolver string)
    unset($user['token_expirado']);
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

/* ── Bitácora de auditoría ───────────────────────── */
/* Solo para acciones de gobierno (cambios de rol, activar/desactivar
   cuentas, dar de baja o editar una mascota ajena) — nunca para el uso
   normal del sistema por un ciudadano. Si el registro de bitácora fallara
   por lo que sea, NO debe tumbar la acción real (ya se hizo el cambio de
   verdad) — por eso el try/catch aquí adentro en vez de dejar que la
   excepción suba. */
function registrarBitacora(array $user, string $accion, ?string $detalle = null): void {
    try {
        $db = getDB();
        $db->prepare('INSERT INTO bitacora (usuario_id, usuario_nombre, accion, detalle) VALUES (?, ?, ?, ?)')
           ->execute([$user['id'], $user['nombre'], $accion, $detalle]);
    } catch (Throwable $e) {
        error_log('No se pudo registrar en bitácora: ' . $e->getMessage());
    }
}

/* ── Generador de folio M-GRU-XXXXXXXXX ─────────── */
function generarFolioMunicipal(): string {
    $db = getDB();
    $db->beginTransaction();
    try {
        $db->exec('UPDATE folio_counter SET ultimo = ultimo + 1');
        $num = $db->query('SELECT ultimo FROM folio_counter LIMIT 1')->fetchColumn();
        $db->commit();
        return 'M-GRU-' . str_pad((string)$num, 9, '0', STR_PAD_LEFT);
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

/* ── Sanitizar HTML del editor de artículos (contenido.php) ──────
   articulos.contenido es la ÚNICA columna del proyecto que necesita
   guardar HTML de verdad (el editor WYSIWYG de admin.html genera
   negritas, listas, títulos e imágenes) — por eso no puede pasar por
   clean()/htmlspecialchars() como el resto de los campos, eso rompería
   el formato a propósito. Sin sanitizar, un admin podía publicar
   <img onerror="robar-la-sesión-de-quien-lo-vea"> y ese HTML se
   ejecutaba tal cual en la portada pública, en el dashboard del
   ciudadano y en el propio panel admin (ver ANALISIS_SEGURIDAD.md,
   hallazgo #1). Esto aplica una lista blanca real de etiquetas,
   atributos y esquemas de URL con DOMDocument (ya viene con PHP, sin
   librerías externas — coherente con "sin build step" del proyecto). */
function sanitizeArticleHtml(?string $html): string {
    if ($html === null || trim($html) === '') return '';

    $tagsPermitidos = [
        'p', 'br', 'b', 'strong', 'i', 'em', 'u', 's', 'strike',
        'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'blockquote', 'div', 'span', 'img', 'a',
    ];
    // Etiquetas peligrosas: se elimina TODO el subárbol (nunca solo la
    // etiqueta) — no tiene caso "desenvolver" el contenido de un <script>.
    $tagsPeligrosos = ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'link', 'meta', 'base', 'svg', 'math'];
    $atributosPorTag = [
        'img' => ['src', 'alt', 'width', 'height'],
        'a'   => ['href', 'title'],
    ];
    $atributosGlobales = ['style']; // el resto de las etiquetas permitidas solo pueden traer "style"
    $propiedadesCssPermitidas = [
        'text-align', 'font-weight', 'font-style', 'text-decoration',
        'max-width', 'width', 'height', 'border-radius',
        'margin', 'margin-top', 'margin-bottom', 'margin-left', 'margin-right',
    ];

    libxml_use_internal_errors(true);
    $doc = new DOMDocument('1.0', 'UTF-8');
    $doc->loadHTML('<?xml encoding="utf-8"?><div>' . $html . '</div>', LIBXML_NOERROR | LIBXML_NOWARNING);
    libxml_clear_errors();

    $body = $doc->getElementsByTagName('body')->item(0);
    $root = null;
    if ($body) {
        foreach ($body->childNodes as $n) {
            if ($n->nodeType === XML_ELEMENT_NODE) { $root = $n; break; }
        }
    }
    if (!$root) return '';

    $limpiarNodo = function (DOMNode $nodo) use (&$limpiarNodo, $tagsPermitidos, $tagsPeligrosos, $atributosPorTag, $atributosGlobales, $propiedadesCssPermitidas) {
        foreach (iterator_to_array($nodo->childNodes) as $hijo) {
            if ($hijo->nodeType === XML_TEXT_NODE) continue;

            if ($hijo->nodeType !== XML_ELEMENT_NODE) {
                $nodo->removeChild($hijo);
                continue;
            }

            $tag = strtolower($hijo->nodeName);

            if (in_array($tag, $tagsPeligrosos, true)) {
                $nodo->removeChild($hijo);
                continue;
            }

            if (!in_array($tag, $tagsPermitidos, true)) {
                // Etiqueta no reconocida (ej. pegada desde Word/otra web):
                // se conserva el contenido de adentro, se quita solo la envoltura.
                $limpiarNodo($hijo);
                while ($hijo->firstChild) {
                    $nodo->insertBefore($hijo->firstChild, $hijo);
                }
                $nodo->removeChild($hijo);
                continue;
            }

            $permitidosTag = array_merge($atributosPorTag[$tag] ?? [], $atributosGlobales);
            foreach (iterator_to_array($hijo->attributes ?? []) as $attr) {
                $nombreAttr = strtolower($attr->nodeName);
                if (!in_array($nombreAttr, $permitidosTag, true)) {
                    $hijo->removeAttribute($attr->nodeName);
                    continue;
                }
                if ($nombreAttr === 'href') {
                    $valor = trim($attr->nodeValue);
                    if ($valor !== '' && !preg_match('~^(https?:|mailto:|tel:|/|#)~i', $valor)) {
                        $hijo->removeAttribute('href');
                    }
                } elseif ($nombreAttr === 'src') {
                    $valor = trim($attr->nodeValue);
                    if (!preg_match('~^(https://|data:image/(jpeg|png|webp|gif);base64,)~i', $valor)) {
                        $hijo->removeAttribute('src');
                    }
                } elseif ($nombreAttr === 'style') {
                    $limpio = [];
                    foreach (explode(';', $attr->nodeValue) as $decl) {
                        $partes = explode(':', $decl, 2);
                        if (count($partes) !== 2) continue;
                        $prop = strtolower(trim($partes[0]));
                        $val  = trim($partes[1]);
                        if (!in_array($prop, $propiedadesCssPermitidas, true)) continue;
                        if (preg_match('/url\s*\(|expression\s*\(|javascript:/i', $val)) continue;
                        $limpio[] = "$prop: $val";
                    }
                    $hijo->setAttribute('style', implode('; ', $limpio));
                }
            }

            $limpiarNodo($hijo);
        }
    };

    $limpiarNodo($root);

    $out = '';
    foreach (iterator_to_array($root->childNodes) as $child) {
        $out .= $doc->saveHTML($child);
    }
    return $out;
}

/* ── Validar foto en Base64 (mascota, perfil) ───── */
/* El redimensionado con Canvas ya limita esto desde el navegador, pero
   una llamada directa a la API (sin pasar por la UI) podría mandar un
   archivo enorme o que ni siquiera sea una imagen — esto es el respaldo
   del lado del servidor. Un solo límite/formato para los tres lugares
   que guardan fotos (perfil, mascota) en vez de una copia distinta en
   cada endpoint. Devuelve null si es válida, o el mensaje de error. */
function validarFotoBase64(?string $foto, int $maxBytes = 3_000_000): ?string {
    if ($foto === null || $foto === '') return null;
    if (!preg_match('#^data:image/(jpeg|png|webp);base64,#', $foto)) {
        return 'La imagen debe ser una foto en formato JPG, PNG o WEBP.';
    }
    if (strlen($foto) > $maxBytes) {
        return 'La imagen es demasiado grande.';
    }
    return null;
}

/* ── Validar contraseña ─────────────────────────── */
/* Mínimo razonable para un padrón ciudadano: al menos 8 caracteres, con
   al menos una letra y un número — bloquea casos como "123456789" (pura
   secuencia numérica, lo que reportó un usuario real probando el
   registro) sin exigir símbolos que compliquen de más a quien no es muy
   técnico. Usada en todos los lugares donde se define una contraseña
   (registro, crear-cuenta, asignar-correo, cambiar contraseña) para que
   la regla sea una sola, no una copia distinta en cada endpoint.
   Devuelve null si es válida, o el mensaje de error si no. */
function validarPassword(string $password): ?string {
    if (strlen($password) < 8) {
        return 'La contraseña debe tener al menos 8 caracteres.';
    }
    if (!preg_match('/[a-zA-Z]/', $password) || !preg_match('/[0-9]/', $password)) {
        return 'La contraseña debe incluir al menos una letra y un número.';
    }
    return null;
}
