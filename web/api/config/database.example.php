<?php
/**
 * REMAC — Configuración de la base de datos (PLANTILLA)
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
