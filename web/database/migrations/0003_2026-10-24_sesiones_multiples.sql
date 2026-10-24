-- Varias sesiones por cuenta + aviso por correo de dispositivo nuevo
-- (ver HISTORIAL_CAMBIOS.md, 2026-10-24).
--
-- Antes la sesión vivía en duenos.token_sesion: UNA sola por cuenta, así
-- que iniciar sesión en el celular cerraba la de la computadora. Ahora
-- cada dispositivo tiene su fila en `sesiones` (máximo 5 por cuenta, ver
-- MAX_SESIONES en helpers.php), y el token se guarda como hash SHA-256 —
-- si alguien llegara a copiar la base de datos, esos hashes no sirven
-- para entrar.
--
-- ⚠️ Al aplicarla se cierran TODAS las sesiones abiertas (las columnas
-- viejas se eliminan): todos tienen que volver a iniciar sesión una vez.
-- Aplicarla en phpMyAdmin ANTES de desplegar el código nuevo — el código
-- nuevo ya no usa duenos.token_sesion, y el viejo no conoce `sesiones`.
--
-- Para revertir (solo si se regresa al código anterior):
--   DROP TABLE sesiones; DROP TABLE dispositivos_conocidos;
--   ALTER TABLE duenos ADD COLUMN token_sesion VARCHAR(64) DEFAULT NULL AFTER activo,
--     ADD COLUMN token_creado_en TIMESTAMP NULL DEFAULT NULL AFTER token_sesion,
--     ADD INDEX idx_token_sesion (token_sesion);

CREATE TABLE IF NOT EXISTS sesiones (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  dueno_id    INT UNSIGNED NOT NULL,
  token_hash  CHAR(64)     NOT NULL,
  dispositivo VARCHAR(100) NOT NULL DEFAULT 'Dispositivo desconocido',
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ultimo_uso  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_token_hash (token_hash),
  INDEX idx_sesiones_dueno (dueno_id),
  FOREIGN KEY fk_sesiones_dueno (dueno_id) REFERENCES duenos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS dispositivos_conocidos (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  dueno_id         INT UNSIGNED NOT NULL,
  dispositivo_hash CHAR(64)     NOT NULL,
  created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_dueno_dispositivo (dueno_id, dispositivo_hash),
  FOREIGN KEY fk_dispositivos_dueno (dueno_id) REFERENCES duenos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE duenos
  DROP INDEX idx_token_sesion,
  DROP COLUMN token_sesion,
  DROP COLUMN token_creado_en;
