<?php
/**
 * API: Estadísticas
 * GET /api/stats → Números para el dashboard y mapa (público: la portada también los usa)
 * GET /api/stats?serie=registros&periodo=semana|mes|ano → Mascotas y ciudadanos
 *     registrados por día (semana = últimos 7 días, mes = últimos 30) o por
 *     mes (ano = últimos 12 meses). Solo admin — gráfica "Registros nuevos"
 *     de la pestaña Datos.
 */

require_once __DIR__ . '/config/helpers.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonError('Método no soportado.', 405);
}

$db = getDB();

if (($_GET['serie'] ?? '') === 'registros') {
    requireAdmin();
    $periodo = $_GET['periodo'] ?? 'mes';
    if (!in_array($periodo, ['semana', 'mes', 'ano'], true)) {
        jsonError('Periodo inválido. Usa semana, mes o ano.', 400);
    }

    // "Hoy" según MySQL, no según PHP: en el servidor tienen zonas horarias
    // distintas (ver requireAuth en helpers.php), y los created_at los
    // escribe MySQL. A partir de esa fecha todo es aritmética de fechas
    // (sin horas), así que ya no importa la zona horaria de PHP.
    $hoy = new DateTimeImmutable($db->query('SELECT CURDATE()')->fetchColumn());

    // Se usa created_at (cuándo se guardó de verdad en el sistema), no
    // mascotas.fecha_registro: esa la escribe/edita la persona en el
    // formulario, así que no sirve para saber cuándo hubo registros.
    if ($periodo === 'ano') {
        $inicio  = $hoy->modify('first day of this month')->modify('-11 months');
        $formato = '%Y-%m';
        $claves  = [];
        for ($i = 0; $i < 12; $i++) $claves[] = $inicio->modify("+$i months")->format('Y-m');
    } else {
        $dias    = $periodo === 'semana' ? 7 : 30;
        $inicio  = $hoy->modify('-' . ($dias - 1) . ' days');
        $formato = '%Y-%m-%d';
        $claves  = [];
        for ($i = 0; $i < $dias; $i++) $claves[] = $inicio->modify("+$i days")->format('Y-m-d');
    }

    // $formato viene de las dos constantes de arriba, nunca del cliente.
    $contar = function (string $sql) use ($db, $inicio): array {
        $stmt = $db->prepare($sql);
        $stmt->execute([$inicio->format('Y-m-d')]);
        return $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
    };
    $mascotas   = $contar("SELECT DATE_FORMAT(created_at, '$formato') AS k, COUNT(*) FROM mascotas WHERE created_at >= ? GROUP BY k");
    $ciudadanos = $contar("SELECT DATE_FORMAT(created_at, '$formato') AS k, COUNT(*) FROM duenos WHERE rol = 'ciudadano' AND created_at >= ? GROUP BY k");

    $puntos = array_map(fn($k) => [
        'clave'      => $k,
        'mascotas'   => (int) ($mascotas[$k] ?? 0),
        'ciudadanos' => (int) ($ciudadanos[$k] ?? 0),
    ], $claves);

    jsonOk([
        'periodo' => $periodo,
        'puntos'  => $puntos,
        'totales' => [
            'mascotas'   => array_sum(array_column($puntos, 'mascotas')),
            'ciudadanos' => array_sum(array_column($puntos, 'ciudadanos')),
        ],
    ]);
}

// Totales generales
$totales = $db->query('
    SELECT
        COUNT(*)                                      AS total_mascotas,
        SUM(especie = "perro")                        AS total_perros,
        SUM(especie = "gato")                         AS total_gatos,
        SUM(vacunado    = 1)                          AS vacunados,
        SUM(esterilizado = 1)                         AS esterilizados,
        SUM(estatus = "Alta")                         AS en_alta,
        SUM(estatus = "Baja")                         AS en_baja
    FROM mascotas
')->fetch();

// Total dueños registrados
$totalDuenos = $db->query('SELECT COUNT(*) FROM duenos WHERE rol = "ciudadano"')->fetchColumn();

// Registros este mes
$estesMes = $db->query('
    SELECT COUNT(*) FROM mascotas
    WHERE MONTH(fecha_registro) = MONTH(CURDATE())
      AND YEAR(fecha_registro)  = YEAR(CURDATE())
')->fetchColumn();

// Por colonia (para el mapa)
$porColonia = $db->query('
    SELECT d.colonia, COUNT(m.id) AS total
    FROM mascotas m
    JOIN duenos d ON m.dueno_id = d.id
    WHERE m.estatus = "Alta" AND d.colonia IS NOT NULL
    GROUP BY d.colonia
    ORDER BY total DESC
')->fetchAll();

// Top razas (para la mini-gráfica de barras del panel admin). Antes esto se
// calculaba en el navegador recorriendo TODAS las mascotas (allPets) solo
// para sacar este conteo — ya no hace falta traer ni una fila para esto.
$porRaza = $db->query('
    SELECT COALESCE(NULLIF(TRIM(raza), \'\'), \'Sin especificar\') AS raza, COUNT(*) AS total
    FROM mascotas
    GROUP BY raza
    ORDER BY total DESC
    LIMIT 6
')->fetchAll();

jsonOk([
    'total_mascotas'      => (int) $totales['total_mascotas'],
    'total_duenos'        => (int) $totalDuenos,
    'por_especie'         => [
        'perro' => (int) $totales['total_perros'],
        'gato'  => (int) $totales['total_gatos'],
    ],
    'vacunados'           => (int) $totales['vacunados'],
    'esterilizados'       => (int) $totales['esterilizados'],
    'por_estatus'         => [
        'alta' => (int) $totales['en_alta'],
        'baja' => (int) $totales['en_baja'],
    ],
    'registros_este_mes'  => (int) $estesMes,
    'por_colonia'         => $porColonia,
    'por_raza'            => $porRaza,
]);
