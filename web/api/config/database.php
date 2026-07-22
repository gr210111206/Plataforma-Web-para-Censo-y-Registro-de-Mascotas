<?php
/**
 * REMAC — Configuración de la base de datos
 * H. Ayuntamiento de El Grullo, Jalisco
 *
 * ⚠️  IMPORTANTE: Cambia estos valores con los datos
 *     que HostGator te da en el cPanel al crear la BD.
 */

define('DB_HOST', 'localhost');         // HostGator siempre es localhost
define('DB_NAME', 'remac_db');          // Nombre de tu BD en cPanel
define('DB_USER', 'tu_usuario_db');     // Usuario MySQL de cPanel
define('DB_PASS', 'tu_password_db');    // Contraseña MySQL de cPanel
define('DB_CHARSET', 'utf8mb4');

/**
 * Configuración de la aplicación
 */
define('BASE_URL',    'https://tudominio.com');   // Cambia a tu dominio real
define('TOKEN_EXPIRY', 86400);                    // 24 horas en segundos

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
