<?php
/**
 * REMAC — Configuración de la base de datos
 * H. Ayuntamiento de El Grullo, Jalisco
 *
 * ⚠️  ESTOS SON VALORES DE DESARROLLO LOCAL (XAMPP).
 *     ANTES DE SUBIR A HOSTGATOR: reemplaza DB_USER, DB_PASS
 *     y BASE_URL con los datos reales que te da el cPanel
 *     al crear la base de datos (ver checklist de despliegue).
 */

define('DB_HOST', 'localhost');
define('DB_NAME', 'remac_db');
define('DB_USER', 'remac_local');       // ← Cambiar por el usuario real de HostGator
define('DB_PASS', 'remac_local_pw');    // ← Cambiar por la contraseña real de HostGator
define('DB_CHARSET', 'utf8mb4');

/**
 * Configuración de la aplicación
 */
define('BASE_URL',    'http://localhost/remac');  // ← Cambiar al dominio real antes de subir
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
