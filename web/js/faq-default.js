/* ══════════════════════════════════════════════════ */
/*  FAQ de fábrica — compartido entre el portal público */
/*  (index.html) y el panel admin (Preguntas FAQ), para  */
/*  no tener dos copias que se puedan desincronizar.     */
/* ══════════════════════════════════════════════════ */
const FAQS_DEFAULT = [
  { pregunta: '¿Por qué debo registrar a mi mascota?', respuesta: 'El registro es gratuito y te permite obtener la ficha oficial de tu mascota, acceder a campañas de vacunación y esterilización, y contar con un respaldo digital oficial del Ayuntamiento.' },
  { pregunta: '¿Qué documentos necesito para registrar a mi mascota?', respuesta: 'Solo necesitas tu correo electrónico, teléfono de contacto y datos básicos. No se requieren documentos físicos. Puedes subir una foto de tu mascota opcionalmente.' },
  { pregunta: '¿El registro tiene algún costo?', respuesta: 'No. El registro en el padrón municipal de mascotas de El Grullo es completamente gratuito para todos los ciudadanos.' },
  { pregunta: '¿Puedo registrar más de una mascota?', respuesta: 'Sí. Con una sola cuenta puedes registrar todos los perros y gatos que tengas. Cada mascota recibirá su propio folio M-GRU único.' },
  { pregunta: '¿Qué es el estatus Alta y Baja?', respuesta: 'Alta significa que la mascota está activa en el padrón. Baja se aplica cuando la mascota ha fallecido o fue dada de baja del registro.' },
];
