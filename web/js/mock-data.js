/**
 * MOCK DATA — Plataforma Web Censo y Registro de Mascotas
 * H. Ayuntamiento de El Grullo, Jalisco
 *
 * NOTA: Cuando el backend esté listo, reemplaza las funciones de este
 * archivo con llamadas fetch() a la API REST.
 * Ejemplo: en lugar de "return MOCK.mascotas", usa:
 *   const res = await fetch('/api/mascotas', { headers: authHeaders() });
 *   return res.json();
 */

const MOCK = {
  stats: {
    total_mascotas: 342,
    total_duenos: 289,
    vacunados: 187,
    esterilizados: 134,
    por_especie: { perro: 218, gato: 124 },
    por_estatus: { activo: 330, extraviado: 8, fallecido: 4 },
    registros_este_mes: 23,
  },

  mascotas: [
    {
      id: 1,
      nombre: "Max",
      especie: "perro",
      raza: "Labrador",
      edad_anios: 3,
      sexo: "macho",
      color: "Dorado",
      vacunado: true,
      esterilizado: false,
      estatus: "activo",
      foto_url: null,
      dueno: "María García López",
      colonia: "Centro",
      folio: "EG-2026-00012",
      created_at: "2026-01-15",
    },
    {
      id: 2,
      nombre: "Luna",
      especie: "gato",
      raza: "Siamés",
      edad_anios: 2,
      sexo: "hembra",
      color: "Blanco y gris",
      vacunado: true,
      esterilizado: true,
      estatus: "activo",
      foto_url: null,
      dueno: "Carlos Ramírez Flores",
      colonia: "El Sabino",
      folio: "EG-2026-00031",
      created_at: "2026-02-03",
    },
    {
      id: 3,
      nombre: "Rocky",
      especie: "perro",
      raza: "Pastor Alemán",
      edad_anios: 5,
      sexo: "macho",
      color: "Negro y café",
      vacunado: false,
      esterilizado: false,
      estatus: "activo",
      foto_url: null,
      dueno: "Ana Pérez Morales",
      colonia: "La Loma",
      folio: "EG-2026-00047",
      created_at: "2026-02-20",
    },
    {
      id: 4,
      nombre: "Mishi",
      especie: "gato",
      raza: "Persa",
      edad_anios: 4,
      sexo: "hembra",
      color: "Naranja",
      vacunado: true,
      esterilizado: true,
      estatus: "activo",
      foto_url: null,
      dueno: "José Hernández Ruiz",
      colonia: "Centro",
      folio: "EG-2026-00058",
      created_at: "2026-03-10",
    },
    {
      id: 5,
      nombre: "Toby",
      especie: "perro",
      raza: "Chihuahua",
      edad_anios: 1,
      sexo: "macho",
      color: "Café",
      vacunado: true,
      esterilizado: false,
      estatus: "extraviado",
      foto_url: null,
      dueno: "Laura Mendoza Cruz",
      colonia: "El Sabino",
      folio: "EG-2026-00073",
      created_at: "2026-03-22",
    },
    {
      id: 6,
      nombre: "Canela",
      especie: "perro",
      raza: "Criolla",
      edad_anios: 7,
      sexo: "hembra",
      color: "Canela",
      vacunado: false,
      esterilizado: true,
      estatus: "activo",
      foto_url: null,
      dueno: "Roberto Vargas Soto",
      colonia: "La Loma",
      folio: "EG-2026-00089",
      created_at: "2026-04-05",
    },
  ],

  // Mascotas del usuario ciudadano en sesión (para el dashboard)
  mis_mascotas: [
    {
      id: 1,
      nombre: "Max",
      especie: "perro",
      raza: "Labrador",
      edad_anios: 3,
      sexo: "macho",
      color: "Dorado",
      vacunado: true,
      esterilizado: false,
      estatus: "activo",
      folio: "EG-2026-00012",
      created_at: "2026-01-15",
    },
    {
      id: 2,
      nombre: "Luna",
      especie: "gato",
      raza: "Siamés",
      edad_anios: 2,
      sexo: "hembra",
      color: "Blanco y gris",
      vacunado: true,
      esterilizado: true,
      estatus: "activo",
      folio: "EG-2026-00031",
      created_at: "2026-02-03",
    },
  ],

  campanas: [
    {
      id: 1,
      titulo: "Campaña de Vacunación Antirrábica 2026",
      descripcion:
        "Vacunación gratuita contra la rabia para perros y gatos. Presentate con tu mascota en el Centro de Salud Municipal los días 15 y 16 de julio.",
      fecha_inicio: "2026-07-15",
      fecha_fin: "2026-07-16",
      publicado: true,
      banner_color: "#1B6B3A",
      icono: "💉",
    },
    {
      id: 2,
      titulo: "Esterilización a Bajo Costo — Julio 2026",
      descripcion:
        "La Dirección de Medio Ambiente ofrece esterilizaciones a precio preferencial. Cupo limitado. Registro previo en el portal.",
      fecha_inicio: "2026-07-20",
      fecha_fin: "2026-07-31",
      publicado: true,
      banner_color: "#C8882A",
      icono: "🏥",
    },
    {
      id: 3,
      titulo: "Taller de Tenencia Responsable",
      descripcion:
        "Aprende sobre nutrición, higiene y cuidado básico de tu mascota. Impartido por veterinarios municipales. Entrada libre.",
      fecha_inicio: "2026-08-05",
      fecha_fin: "2026-08-05",
      publicado: true,
      banner_color: "#2A6B8A",
      icono: "📚",
    },
  ],

  articulos: [
    {
      id: 1,
      titulo: "¿Con qué frecuencia debo vacunar a mi perro?",
      contenido:
        "Los perros necesitan la vacuna antirrábica anualmente. Además, la vacuna pentavalente se aplica en cachorros y se refuerza cada año. Consulta a tu veterinario para el calendario completo.",
      imagen_icono: "🐕",
      created_at: "2026-01-10",
    },
    {
      id: 2,
      titulo: "Señales de alerta en la salud de tu gato",
      contenido:
        "Si tu gato deja de comer, tiene fiebre, ojos llorosos o cambia de comportamiento, visita al veterinario. La detección temprana salva vidas.",
      imagen_icono: "🐈",
      created_at: "2026-02-15",
    },
    {
      id: 3,
      titulo: "Importancia de la esterilización",
      contenido:
        "La esterilización reduce la sobrepoblación animal, previene enfermedades como el cáncer de mama en hembras y hace a tu mascota más tranquila y saludable.",
      imagen_icono: "❤️",
      created_at: "2026-03-20",
    },
    {
      id: 4,
      titulo: "¿Qué hacer si encuentras una mascota extraviada?",
      contenido:
        "Repórtala en este portal o acude a la Dirección de Medio Ambiente del Ayuntamiento. No la abandones. Juntos podemos reunirla con su familia.",
      imagen_icono: "🔍",
      created_at: "2026-04-01",
    },
  ],

  faq: [
    {
      id: 1,
      pregunta: "¿Por qué debo registrar a mi mascota?",
      respuesta:
        "El registro es gratuito y te permite obtener el acta oficial de tu mascota, acceder a campañas de vacunación y esterilización a bajo costo, y contar con un respaldo digital en caso de extravío.",
    },
    {
      id: 2,
      pregunta: "¿Qué documentos necesito para registrar a mi mascota?",
      respuesta:
        "Solo necesitas crear una cuenta en el portal con tu correo electrónico. No se requieren documentos físicos. Puedes subir una foto de tu mascota opcionalmente.",
    },
    {
      id: 3,
      pregunta: "¿El registro tiene algún costo?",
      respuesta:
        "No. El registro en el padrón municipal de mascotas es completamente gratuito para todos los ciudadanos de El Grullo, Jalisco.",
    },
    {
      id: 4,
      pregunta: "¿Puedo registrar más de una mascota?",
      respuesta:
        "Sí. Con una sola cuenta puedes registrar todos los perros y gatos que tengas bajo tu cuidado. Cada mascota recibirá su propio folio único.",
    },
    {
      id: 5,
      pregunta: "¿Qué pasa si mi mascota se extravía?",
      respuesta:
        "Puedes reportar el extravío directamente en tu dashboard. El estatus de la mascota cambiará a 'extraviado' y el Ayuntamiento podrá ayudarte en la búsqueda.",
    },
  ],

  usuario_actual: {
    id: 1,
    nombre: "Luis Fernando Vargas Ramírez",
    correo: "luis.vargas@ejemplo.com",
    rol: "ciudadano",
    activo: true,
    dueno: {
      nombre_completo: "Luis Fernando Vargas Ramírez",
      telefono: "341-123-4567",
      domicilio: "Calle Morelos #45",
      colonia: "Centro",
    },
  },
};

// ─── Utilidades de datos ───────────────────────────────────────────────────

function getStats() {
  return MOCK.stats;
}

function getCampanas() {
  return MOCK.campanas.filter((c) => c.publicado);
}

function getArticulos() {
  return MOCK.articulos;
}

function getFaq() {
  return MOCK.faq;
}

function getMisMascotas() {
  return MOCK.mis_mascotas;
}

function getTodasMascotas(filtros = {}) {
  let mascotas = [...MOCK.mascotas];
  if (filtros.especie) mascotas = mascotas.filter((m) => m.especie === filtros.especie);
  if (filtros.estatus) mascotas = mascotas.filter((m) => m.estatus === filtros.estatus);
  if (filtros.vacunado !== undefined) mascotas = mascotas.filter((m) => m.vacunado === filtros.vacunado);
  if (filtros.busqueda) {
    const q = filtros.busqueda.toLowerCase();
    mascotas = mascotas.filter(
      (m) =>
        m.nombre.toLowerCase().includes(q) ||
        m.dueno.toLowerCase().includes(q) ||
        m.folio.toLowerCase().includes(q)
    );
  }
  return mascotas;
}

function getUsuarioActual() {
  return MOCK.usuario_actual;
}
