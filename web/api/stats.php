<?php
/**
 * REMAC — API: Estadísticas
 * GET /api/stats → Números para el dashboard y mapa
 */

require_once __DIR__ . '/config/helpers.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonError('Método no soportado.', 405);
}

$db = getDB();

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
]);
