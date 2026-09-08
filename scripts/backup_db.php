<?php
/**
 * REMAC — Respaldo automático de la base de datos
 *
 * Pensado para correr como Cron Job de HostGator (cPanel → "Cron Jobs"),
 * ej. todos los días a las 3am:
 *   0 3 * * *  /usr/local/bin/php /home/TU_USUARIO/scripts/backup_db.php
 *
 * IMPORTANTE — dónde vive este archivo:
 * Esta carpeta ("scripts/") va FUERA de "public_html" (donde se sube el
 * contenido de web/), no dentro. Un respaldo de la base de datos accesible
 * por URL es exactamente el mismo riesgo que ya causó una fuga real en
 * este proyecto (ver HISTORIAL_CAMBIOS.md, 2026-09-07 — web.zip con la
 * contraseña real de la BD adentro). Layout típico en HostGator:
 *   /home/TU_USUARIO/
 *     ├── public_html/        ← aquí va el contenido de web/ (sí es público)
 *     ├── scripts/            ← este archivo va aquí (NO es público)
 *     └── backups_remac/      ← los respaldos se guardan aquí (NO es público)
 *
 * Requiere que el binario `mysqldump` esté disponible en el servidor
 * (normal en HostGator). Si el cron falla, primero confirma la ruta
 * exacta de PHP y de mysqldump con el soporte de HostGator o por SSH.
 */

// Reutiliza las credenciales reales de config/database.php. Ese archivo
// detecta local vs. producción vía $_SERVER['HTTP_HOST'], que no existe
// en un cron (CLI) — así que en un cron SIEMPRE cae en la rama de
// producción, que es exactamente lo que se quiere aquí.
require_once __DIR__ . '/../web/api/config/database.php';

$backupDir = __DIR__ . '/../backups_remac';
if (!is_dir($backupDir) && !mkdir($backupDir, 0700, true)) {
    fwrite(STDERR, "ERROR: no se pudo crear la carpeta de respaldos ($backupDir)\n");
    exit(1);
}

$archivo = $backupDir . '/remac_' . date('Y-m-d_His') . '.sql.gz';

// La contraseña va por la variable de entorno MYSQL_PWD, no como argumento
// del comando: los argumentos de un proceso pueden verlos otros usuarios
// del mismo servidor compartido con `ps aux`; una variable de entorno no.
putenv('MYSQL_PWD=' . DB_PASS);

$cmd = sprintf(
    'mysqldump --host=%s --user=%s --single-transaction --routines %s | gzip > %s 2>&1',
    escapeshellarg(DB_HOST),
    escapeshellarg(DB_USER),
    escapeshellarg(DB_NAME),
    escapeshellarg($archivo)
);

exec($cmd, $salida, $codigoSalida);
putenv('MYSQL_PWD'); // limpia la variable de entorno apenas termina

if ($codigoSalida !== 0 || !file_exists($archivo) || filesize($archivo) === 0) {
    fwrite(STDERR, "ERROR: el respaldo falló (código $codigoSalida).\n" . implode("\n", $salida) . "\n");
    if (file_exists($archivo)) unlink($archivo); // no dejar un .sql.gz vacío/roto
    exit(1);
}

echo 'Respaldo creado: ' . basename($archivo) . ' (' . round(filesize($archivo) / 1024, 1) . " KB)\n";

// Rotación: conserva solo los últimos 14 respaldos (uno diario ≈ 2 semanas).
$RESPALDOS_A_CONSERVAR = 14;
$existentes = glob($backupDir . '/remac_*.sql.gz');
sort($existentes); // los más viejos primero (el nombre ya trae fecha/hora)
$sobrantes = count($existentes) - $RESPALDOS_A_CONSERVAR;
for ($i = 0; $i < $sobrantes; $i++) {
    unlink($existentes[$i]);
    echo 'Eliminado respaldo antiguo: ' . basename($existentes[$i]) . "\n";
}
