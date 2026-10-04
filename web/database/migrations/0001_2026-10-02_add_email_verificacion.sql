-- Verificación de correo al autoregistrarse (ver HISTORIAL_CAMBIOS.md, 2026-10-02e).
-- DEFAULT 1 a propósito: una cuenta sembrada o creada por un asistente/admin
-- nunca pasa por este flujo y no debe quedar bloqueada — solo el autoregistro
-- desde login.html la pone en 0 explícitamente.
ALTER TABLE duenos
  ADD COLUMN email_verificado TINYINT(1) NOT NULL DEFAULT 1 AFTER reset_token_expira,
  ADD COLUMN verificacion_token VARCHAR(64) DEFAULT NULL AFTER email_verificado,
  ADD INDEX idx_verificacion_token (verificacion_token);
