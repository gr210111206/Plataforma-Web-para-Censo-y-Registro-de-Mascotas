<?php
/**
 * Configuración de la base de datos (PLANTILLA)
 * H. Ayuntamiento de El Grullo, Jalisco
 *
 * Copia este archivo como "database.php" (mismo folder) y rellena
 * tus credenciales reales. "database.php" NUNCA se sube a git
 * (está en .gitignore) precisamente para no exponer contraseñas
 * reales en un repositorio público.
 */

define('DB_HOST', 'localhost');
define('DB_NAME', 'remac_db');
define('DB_USER', 'remac_local');
define('DB_PASS', 'remac_local_pw');
define('DB_CHARSET', 'utf8mb4');

/**
 * Configuración de la aplicación
 */
define('BASE_URL',    'http://localhost/remac');  // ← Cambiar al dominio/URL real antes de subir
define('TOKEN_EXPIRY', 2592000);                  // 30 días en segundos (techo máx.; ver "Recordarme" en api-client.js)

/**
 * Correo para enviar el enlace de recuperación de contraseña, por SMTP
 * autenticado (ver enviarCorreo() en helpers.php) — NO con mail() nativo
 * de PHP: se probó primero así y el servidor lo aceptaba pero Gmail
 * nunca lo entregaba (sin la reputación/autenticación del proveedor de
 * correo real del dominio). MAIL_FROM_ADDRESS debe ser una cuenta de
 * correo real que exista de verdad (cPanel → "Cuentas de correo" o el
 * panel de tu proveedor, ej. Titan en HostGator) con su propia
 * contraseña — MAIL_SMTP_HOST/PORT son los datos SMTP de ese proveedor
 * (para Titan: smtp.titan.email, puerto 465).
 */
define('MAIL_FROM_ADDRESS', 'no-responder@tudominio.com');
define('MAIL_FROM_NAME', 'Padrón de Mascotas');
define('MAIL_SMTP_HOST', 'smtp.titan.email');
define('MAIL_SMTP_PORT', 465);
define('MAIL_SMTP_PASS', 'contraseña-del-buzón-no-responder');

/**
 * Orígenes permitidos para CORS. Rellena con el/los dominio(s) reales
 * desde donde se sirve el sitio (ver setCorsHeaders() en helpers.php).
 */
define('PRODUCTION_ORIGINS', [
    'https://tudominio.com',
    'https://www.tudominio.com',
]);

/**
 * Devuelve una conexión PDO a la BD.
 * Lanza una excepción si no puede conectar.
 */
function getDB(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = sprintf(
            'mysql:host=%s;dbname=%s;charset=%s',
            DB_HOST, DB_NAME, DB_CHARSET
        );
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
    }
    return $pdo;
}
