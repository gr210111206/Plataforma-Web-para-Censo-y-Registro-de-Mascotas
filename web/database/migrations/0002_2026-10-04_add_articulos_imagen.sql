-- Imagen de portada en los artículos / Tips de salud animal (ver HISTORIAL_CAMBIOS.md, 2026-10-04).
-- Mismo patrón que campanas.imagen: Base64 opcional, se muestra arriba de
-- la tarjeta en la portada si existe.
ALTER TABLE articulos
  ADD COLUMN imagen LONGTEXT DEFAULT NULL AFTER imagen_icono;
