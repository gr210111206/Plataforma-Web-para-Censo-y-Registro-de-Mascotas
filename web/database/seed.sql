-- ══════════════════════════════════════════════════
-- REMAC — Datos de prueba (seed)
-- Ejecutar DESPUÉS de schema.sql
-- ══════════════════════════════════════════════════

USE remac_db;

-- ── Dueños / Usuarios ────────────────────────────
INSERT INTO duenos (nombre, curp, telefono, direccion, colonia, email, password_hash, rol) VALUES
('Administrador REMAC',   'ADMIN0000000000000', NULL,            NULL,          NULL,                'admin@remac.elgrullo.mx', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'),
('María García López',   'GALM800101HJCXX00', '341-123-4567', 'Morelos 45',   'El Grullo centro', NULL, NULL, 'ciudadano'),
('Carlos Ramírez Flores','RAFC850210HJCLR01', '341-234-5678', 'Hidalgo 12',   '10 de mayo',       NULL, NULL, 'ciudadano'),
('Ana Pérez Morales',    'PEMA900315MJCRL05', '341-345-6789', 'Juárez 78',    'Del sur',          NULL, NULL, 'ciudadano'),
('Nacho Tello',          'TELN780520HJCLL00', '321-387-4444', 'Obregón 53',   'El Grullo centro', NULL, NULL, 'ciudadano'),
('Laura Mendoza Cruz',   'MECL920105MJCNRL0', '341-567-8901', 'Reforma 56',   'Jardines de manantlán', NULL, NULL, 'ciudadano'),
('Roberto Vargas Soto',  'VASR750830HJCRGB0', '341-678-9012', 'Constitución 89','Del álamo',     NULL, NULL, 'ciudadano');

-- Actualiza el contador de folios
UPDATE folio_counter SET ultimo = 6;

-- ── Mascotas ─────────────────────────────────────
INSERT INTO mascotas (id, nombre, especie, raza, edad, edad_label, sexo, color, senias_particulares, vacunado, esterilizado, estatus, dueno_id, fecha_registro, link_publico, ficha) VALUES
('REMAC-GRU-00001','Max',      'perro','Labrador Retriever','3','3 años', 'macho', 'Dorado',            'Mancha blanca en el pecho',        1,0,'Alta',2,'2026-01-15','mascota.html?id=REMAC-GRU-00001','REMAC-GRU-00001.pdf'),
('REMAC-GRU-00002','Luna',     'gato', 'Siamés',           '2','2 años', 'hembra','Blanco y gris',      'Ojos azules, cola corta',          1,1,'Alta',3,'2026-02-03','mascota.html?id=REMAC-GRU-00002','REMAC-GRU-00002.pdf'),
('REMAC-GRU-00003','Rocky',    'perro','Pastor alemán',    '5','5 años', 'macho', 'Negro y café',       'Cicatriz en oreja izquierda',      0,0,'Alta',4,'2026-02-20','mascota.html?id=REMAC-GRU-00003','REMAC-GRU-00003.pdf'),
('REMAC-GRU-00004','Solovino', 'perro','Mestizo',          '5','5 años', 'macho', 'Amarillo con blanco','Ninguna en especial',              1,0,'Alta',5,'2026-05-11','mascota.html?id=REMAC-GRU-00004','REMAC-GRU-00004.pdf'),
('REMAC-GRU-00005','Toby',     'perro','Chihuahua',        '1','1 año',  'macho', 'Café',               'Manchas en la espalda',            1,0,'Alta',6,'2026-03-22','mascota.html?id=REMAC-GRU-00005','REMAC-GRU-00005.pdf'),
('REMAC-GRU-00006','Canela',   'perro','Mestizo',          '7','7 años', 'hembra','Canela',             'Pata trasera derecha más corta',   0,1,'Baja',7,'2026-04-05','mascota.html?id=REMAC-GRU-00006','REMAC-GRU-00006.pdf');

-- ── Campañas ─────────────────────────────────────
INSERT INTO campanas (titulo, descripcion, fecha_inicio, fecha_fin, icono, banner_color, publicado) VALUES
('Campaña de Vacunación Antirrábica 2026',
 'Vacunación gratuita contra la rabia para perros y gatos. Preséntate con tu mascota en el Centro de Salud Municipal los días 15 y 16 de julio.',
 '2026-07-15','2026-07-16','💉','#1B6B3A',1),
('Esterilización a Bajo Costo — Julio 2026',
 'La Dirección de Medio Ambiente ofrece esterilizaciones a precio preferencial. Cupo limitado. Registro previo en el portal.',
 '2026-07-20','2026-07-31','🏥','#C8882A',1),
('Taller de Tenencia Responsable',
 'Aprende sobre nutrición, higiene y cuidado básico de tu mascota. Impartido por veterinarios municipales. Entrada libre.',
 '2026-08-05','2026-08-05','📚','#2A6B8A',1);

-- ── Artículos ────────────────────────────────────
INSERT INTO articulos (titulo, contenido, imagen_icono, publicado) VALUES
('¿Con qué frecuencia debo vacunar a mi perro?',
 'Los perros necesitan la vacuna antirrábica anualmente. Además, la vacuna pentavalente se aplica en cachorros y se refuerza cada año. Consulta a tu veterinario para el calendario completo.',
 '🐕',1),
('Señales de alerta en la salud de tu gato',
 'Si tu gato deja de comer, tiene fiebre, ojos llorosos o cambia de comportamiento, visita al veterinario. La detección temprana salva vidas.',
 '🐈',1),
('Importancia de la esterilización',
 'La esterilización reduce la sobrepoblación animal, previene enfermedades como el cáncer de mama en hembras y hace a tu mascota más tranquila y saludable.',
 '❤️',1);

-- ── Contraseña del admin es "Admin1234" (bcrypt) ─
-- La hash ya está incluida arriba: $2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
