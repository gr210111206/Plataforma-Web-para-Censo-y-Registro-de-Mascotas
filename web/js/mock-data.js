/**
 * MOCK DATA — Plataforma Web Censo y Registro de Mascotas
 * H. Ayuntamiento de El Grullo, Jalisco — Sistema REMAC
 *
 * NOTA: Cuando el backend esté listo, reemplaza las funciones de este
 * archivo con llamadas fetch() a la API REST.
 * Ejemplo: en lugar de "return MOCK.mascotas", usa:
 *   const res = await fetch('/api/mascotas', { headers: authHeaders() });
 *   return res.json();
 */

/* ── Catálogos ── */
const RAZAS_PERRO = [
  'Chihuahua', 'Labrador Retriever', 'Pastor alemán', 'Bulldog',
  'Golden retriever', 'Pug', 'Mestizo', 'Husky siberiano',
  'Pitbull terrier', 'Poodle/Caniche', 'Dálmata', 'Beagle',
  'Rottweiler', 'Doberman', 'Boxer', 'Schnauzer', 'Cocker Spaniel',
  'Yorkshire Terrier', 'Shih Tzu', 'Dachshund', 'Border Collie',
  'French Bulldog', 'Pomerania', 'Maltés', 'Otro'
];

const RAZAS_GATO = [
  'Siamés', 'Persa', 'Maine Coon', 'Ragdoll', 'Bengalí',
  'Abisinio', 'Birmano', 'Sphynx', 'Angora', 'Scottish Fold',
  'Doméstico de pelo corto', 'Doméstico de pelo largo', 'Mestizo', 'Otro'
];

const COLONIAS_EL_GRULLO = [
  '10 de Mayo',
  '7 de Abril',
  'Ayuquila',
  'Charco de los Adobes',
  'Colomitos',
  'Colomos',
  'Del Álamo',
  'Del Sur',
  'El Álamo',
  'El Aguacate',
  'El Cacalote',
  'El Cerrito',
  'El Grullo Centro',
  'El Pedregal',
  'Ixtlán',
  'Jardines de Manantlán',
  'Juan Canal',
  'Juaquiniquil',
  'La Cañada',
  'La Laja',
  'La Noria',
  'La Puerta del Barro',
  'La Quinta',
  'Las Flores',
  'Las Pilas',
  'Laureles',
  'Lomas del Valle',
  'Los Pinos',
  'Magisterial',
  'Mirador del Rosal',
  'Nueva Creación',
  'Oriente 1ra. Sección',
  'Oriente 2da. Sección',
  'Palma Sola',
  'Palo Blanco',
  'Patria',
  'Pocito Santo',
  'Potrero Grande',
  'Residencial',
  'San José',
  'San Pedro',
  'Santa Cecilia',
  'Senderos del Manantial',
  'Teposilama',
  'Villas del Sol'
];

const EDADES_OPCIONES = [
  { valor: '0.1',  label: '1 mes' },
  { valor: '0.2',  label: '2 meses' },
  { valor: '0.3',  label: '3 meses' },
  { valor: '0.4',  label: '4 meses' },
  { valor: '0.5',  label: '5 meses' },
  { valor: '0.6',  label: '6 meses' },
  { valor: '0.7',  label: '7 meses' },
  { valor: '0.8',  label: '8 meses' },
  { valor: '0.9',  label: '9 meses' },
  { valor: '0.10', label: '10 meses' },
  { valor: '0.11', label: '11 meses' },
  { valor: '1',    label: '1 año' },
  { valor: '2',    label: '2 años' },
  { valor: '3',    label: '3 años' },
  { valor: '4',    label: '4 años' },
  { valor: '5',    label: '5 años' },
  { valor: '6',    label: '6 años' },
  { valor: '7',    label: '7 años' },
  { valor: '8',    label: '8 años' },
  { valor: '9',    label: '9 años' },
  { valor: '10',   label: '10 años' },
  { valor: '11',   label: '11 años' },
  { valor: '12',   label: '12 años' },
  { valor: '13',   label: '13 años' },
  { valor: '14',   label: '14 años' },
  { valor: '15',   label: '15 años' },
  { valor: '15+',  label: 'Más de 15 años' },
];

const MOCK = {
  stats: {
    total_mascotas: 342,
    total_duenos: 289,
    vacunados: 187,
    esterilizados: 134,
    por_especie: { perro: 218, gato: 124 },
    por_estatus: { alta: 338, baja: 4 },
    registros_este_mes: 23,
  },

  mascotas: [
    {
      id: 'REMAC-GRU-00001',
      nombre: 'Max',
      especie: 'perro',
      raza: 'Labrador Retriever',
      edad: '3',
      edad_label: '3 años',
      sexo: 'macho',
      color: 'Dorado',
      senias_particulares: 'Mancha blanca en el pecho',
      vacunado: true,
      esterilizado: false,
      estatus: 'Alta',
      foto_url: null,
      persona: 'María García López',
      telefono: '341-123-4567',
      direccion: 'Morelos 45',
      colonia: 'El Grullo centro',
      fecha_registro: '2026-01-15',
      link_publico: 'https://remac-elgrullo.vercel.app/?id=REMAC-GRU-00001',
      ficha: 'REMAC-GRU-00001.pdf',
    },
    {
      id: 'REMAC-GRU-00002',
      nombre: 'Luna',
      especie: 'gato',
      raza: 'Siamés',
      edad: '2',
      edad_label: '2 años',
      sexo: 'hembra',
      color: 'Blanco y gris',
      senias_particulares: 'Ojos azules, cola corta',
      vacunado: true,
      esterilizado: true,
      estatus: 'Alta',
      foto_url: null,
      persona: 'Carlos Ramírez Flores',
      telefono: '341-234-5678',
      direccion: 'Hidalgo 12',
      colonia: '10 de mayo',
      fecha_registro: '2026-02-03',
      link_publico: 'https://remac-elgrullo.vercel.app/?id=REMAC-GRU-00002',
      ficha: 'REMAC-GRU-00002.pdf',
    },
    {
      id: 'REMAC-GRU-00003',
      nombre: 'Rocky',
      especie: 'perro',
      raza: 'Pastor alemán',
      edad: '5',
      edad_label: '5 años',
      sexo: 'macho',
      color: 'Negro y café',
      senias_particulares: 'Cicatriz en oreja izquierda',
      vacunado: false,
      esterilizado: false,
      estatus: 'Alta',
      foto_url: null,
      persona: 'Ana Pérez Morales',
      telefono: '341-345-6789',
      direccion: 'Juárez 78',
      colonia: 'Del sur',
      fecha_registro: '2026-02-20',
      link_publico: 'mascota.html?id=REMAC-GRU-00003',
      ficha: 'REMAC-GRU-00003.pdf',
    },
    {
      id: 'REMAC-GRU-00004',
      nombre: 'Solovino',
      especie: 'perro',
      raza: 'Mestizo',
      edad: '5',
      edad_label: '5 años',
      sexo: 'macho',
      color: 'Amarillo con blanco',
      senias_particulares: 'Ninguna en especial',
      vacunado: true,
      esterilizado: false,
      estatus: 'Alta',
      foto_url: null,
      persona: 'Nacho Tello',
      telefono: '321 387 4444',
      direccion: 'Obregón 53',
      colonia: 'El Grullo centro',
      fecha_registro: '2026-05-11',
      link_publico: 'mascota.html?id=REMAC-GRU-00004',
      ficha: 'REMAC-GRU-00004.pdf',
    },
    {
      id: 'REMAC-GRU-00005',
      nombre: 'Toby',
      especie: 'perro',
      raza: 'Chihuahua',
      edad: '1',
      edad_label: '1 año',
      sexo: 'macho',
      color: 'Café',
      senias_particulares: 'Manchas en la espalda',
      vacunado: true,
      esterilizado: false,
      estatus: 'Alta',
      foto_url: null,
      persona: 'Laura Mendoza Cruz',
      telefono: '341-567-8901',
      direccion: 'Reforma 56',
      colonia: 'Jardines de manantlán',
      fecha_registro: '2026-03-22',
      link_publico: 'mascota.html?id=REMAC-GRU-00005',
      ficha: 'REMAC-GRU-00005.pdf',
    },
    {
      id: 'REMAC-GRU-00006',
      nombre: 'Canela',
      especie: 'perro',
      raza: 'Mestizo',
      edad: '7',
      edad_label: '7 años',
      sexo: 'hembra',
      color: 'Canela',
      senias_particulares: 'Pata trasera derecha más corta',
      vacunado: false,
      esterilizado: true,
      estatus: 'Baja',
      foto_url: null,
      persona: 'Roberto Vargas Soto',
      telefono: '341-678-9012',
      direccion: 'Constitución 89',
      colonia: 'Del álamo',
      fecha_registro: '2026-04-05',
      link_publico: 'mascota.html?id=REMAC-GRU-00006',
      ficha: 'REMAC-GRU-00006.pdf',
    },
  ],

  // Mascotas del usuario ciudadano en sesión (para el dashboard)
  mis_mascotas: [
    {
      id: 'REMAC-GRU-00001',
      nombre: 'Max',
      especie: 'perro',
      raza: 'Labrador Retriever',
      edad: '3',
      edad_label: '3 años',
      sexo: 'macho',
      color: 'Dorado',
      senias_particulares: 'Mancha blanca en el pecho',
      vacunado: true,
      esterilizado: false,
      estatus: 'Alta',
      foto_url: null,
      persona: 'Luis Fernando Vargas Ramírez',
      telefono: '341-123-4567',
      direccion: 'Morelos 45',
      colonia: 'El Grullo centro',
      fecha_registro: '2026-01-15',
      link_publico: 'https://remac-elgrullo.vercel.app/?id=REMAC-GRU-00001',
      ficha: 'REMAC-GRU-00001.pdf',
    },
    {
      id: 'REMAC-GRU-00002',
      nombre: 'Luna',
      especie: 'gato',
      raza: 'Siamés',
      edad: '2',
      edad_label: '2 años',
      sexo: 'hembra',
      color: 'Blanco y gris',
      senias_particulares: 'Ojos azules, cola corta',
      vacunado: true,
      esterilizado: true,
      estatus: 'Alta',
      foto_url: null,
      persona: 'Luis Fernando Vargas Ramírez',
      telefono: '341-123-4567',
      direccion: 'Morelos 45',
      colonia: 'El Grullo centro',
      fecha_registro: '2026-02-03',
      link_publico: 'https://remac-elgrullo.vercel.app/?id=REMAC-GRU-00002',
      ficha: 'REMAC-GRU-00002.pdf',
    },
  ],

  campanas: [
    {
      id: 1,
      titulo: 'Campaña de Vacunación Antirrábica 2026',
      descripcion: 'Vacunación gratuita contra la rabia para perros y gatos. Preséntate con tu mascota en el Centro de Salud Municipal los días 15 y 16 de julio.',
      fecha_inicio: '2026-07-15',
      fecha_fin: '2026-07-16',
      publicado: true,
      banner_color: '#1B6B3A',
      icono: '💉',
    },
    {
      id: 2,
      titulo: 'Esterilización a Bajo Costo — Julio 2026',
      descripcion: 'La Dirección de Medio Ambiente ofrece esterilizaciones a precio preferencial. Cupo limitado. Registro previo en el portal.',
      fecha_inicio: '2026-07-20',
      fecha_fin: '2026-07-31',
      publicado: true,
      banner_color: '#C8882A',
      icono: '🏥',
    },
    {
      id: 3,
      titulo: 'Taller de Tenencia Responsable',
      descripcion: 'Aprende sobre nutrición, higiene y cuidado básico de tu mascota. Impartido por veterinarios municipales. Entrada libre.',
      fecha_inicio: '2026-08-05',
      fecha_fin: '2026-08-05',
      publicado: true,
      banner_color: '#2A6B8A',
      icono: '📚',
    },
  ],

  articulos: [
    {
      id: 1,
      titulo: '¿Con qué frecuencia debo vacunar a mi perro?',
      contenido: 'Los perros necesitan la vacuna antirrábica anualmente. Además, la vacuna pentavalente se aplica en cachorros y se refuerza cada año. Consulta a tu veterinario para el calendario completo.',
      imagen_icono: '🐕',
      created_at: '2026-01-10',
    },
    {
      id: 2,
      titulo: 'Señales de alerta en la salud de tu gato',
      contenido: 'Si tu gato deja de comer, tiene fiebre, ojos llorosos o cambia de comportamiento, visita al veterinario. La detección temprana salva vidas.',
      imagen_icono: '🐈',
      created_at: '2026-02-15',
    },
    {
      id: 3,
      titulo: 'Importancia de la esterilización',
      contenido: 'La esterilización reduce la sobrepoblación animal, previene enfermedades como el cáncer de mama en hembras y hace a tu mascota más tranquila y saludable.',
      imagen_icono: '❤️',
      created_at: '2026-03-20',
    },
  ],

  faq: [
    {
      id: 1,
      pregunta: '¿Por qué debo registrar a mi mascota?',
      respuesta: 'El registro es gratuito y te permite obtener la ficha oficial REMAC de tu mascota, acceder a campañas de vacunación y esterilización, y contar con un respaldo digital oficial del Ayuntamiento.',
    },
    {
      id: 2,
      pregunta: '¿Qué documentos necesito para registrar a mi mascota?',
      respuesta: 'Solo necesitas tu nombre, CURP y datos básicos. No se requieren documentos físicos. Puedes subir una foto de tu mascota opcionalmente.',
    },
    {
      id: 3,
      pregunta: '¿El registro tiene algún costo?',
      respuesta: 'No. El registro en el padrón REMAC del municipio de El Grullo es completamente gratuito para todos los ciudadanos.',
    },
    {
      id: 4,
      pregunta: '¿Puedo registrar más de una mascota?',
      respuesta: 'Sí. Con una sola cuenta puedes registrar todos los perros y gatos que tengas. Cada mascota recibirá su propio folio REMAC-GRU único.',
    },
    {
      id: 5,
      pregunta: '¿Qué es el estatus Alta y Baja?',
      respuesta: 'Alta significa que la mascota está activa en el padrón. Baja se aplica cuando la mascota ha fallecido o fue dada de baja del registro.',
    },
  ],

  usuario_actual: {
    id: 1,
    nombre: 'Luis Fernando Vargas Ramírez',
    curp: 'VARL900101HJCXX00',
    rol: 'ciudadano',
    activo: true,
    dueno: {
      nombre_completo: 'Luis Fernando Vargas Ramírez',
      telefono: '341-123-4567',
      direccion: 'Morelos 45',
      colonia: 'El Grullo centro',
    },
  },
};

// ─── Utilidades de datos ───────────────────────────────────────────────────

function getStats() { return MOCK.stats; }
function getCampanas() { return MOCK.campanas.filter((c) => c.publicado); }
function getArticulos() { return MOCK.articulos; }
function getFaq() { return MOCK.faq; }

function getMisMascotas() {
  const stored = getStoredMascotas();
  return [...MOCK.mis_mascotas, ...stored];
}

function getTodasMascotas(filtros = {}) {
  let mascotas = [...MOCK.mascotas, ...getStoredMascotas()];
  if (filtros.especie) mascotas = mascotas.filter((m) => m.especie === filtros.especie);
  if (filtros.estatus) mascotas = mascotas.filter((m) => m.estatus === filtros.estatus);
  if (filtros.colonia) mascotas = mascotas.filter((m) => m.colonia === filtros.colonia);
  if (filtros.busqueda) {
    const q = filtros.busqueda.toLowerCase();
    mascotas = mascotas.filter(
      (m) =>
        m.nombre.toLowerCase().includes(q) ||
        (m.persona || '').toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q) ||
        (m.colonia || '').toLowerCase().includes(q)
    );
  }
  return mascotas;
}

function getUsuarioActual() { return MOCK.usuario_actual; }
function getRazas(especie) { return especie === 'gato' ? RAZAS_GATO : RAZAS_PERRO; }
function getColonias() { return COLONIAS_EL_GRULLO; }
function getEdades() { return EDADES_OPCIONES; }

/* ── Generador de folio REMAC ── */
function generarFolioREMAC() {
  const stored = getStoredMascotas();
  const total  = MOCK.mascotas.length + stored.length + 1;
  return 'REMAC-GRU-' + String(total).padStart(5, '0');
}

/* ── localStorage para nuevos registros ── */
function getStoredMascotas() {
  try {
    const raw = localStorage.getItem('remac_mascotas');
    return raw ? JSON.parse(raw) : [];
  } catch(e) { return []; }
}

function saveStoredMascota(mascota) {
  // Make sure link_publico points to mascota.html
  if (!mascota.link_publico || mascota.link_publico.includes('vercel')) {
    mascota.link_publico = `mascota.html?id=${mascota.id}`;
  }
  const lista = getStoredMascotas();
  lista.push(mascota);
  localStorage.setItem('remac_mascotas', JSON.stringify(lista));
}

function deleteStoredMascota(id) {
  const lista = getStoredMascotas().filter(m => m.id !== id);
  localStorage.setItem('remac_mascotas', JSON.stringify(lista));
}
