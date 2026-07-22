-- ══════════════════════════════════════════════════
-- REMAC — Sistema Municipal de Registro de Mascotas
-- H. Ayuntamiento de El Grullo, Jalisco
-- Base de datos MySQL — schema.sql
-- Ejecutar en phpMyAdmin de HostGator
-- ══════════════════════════════════════════════════

CREATE DATABASE IF NOT EXISTS remac_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE remac_db;

-- ── Tabla de dueños / ciudadanos ─────────────────
CREATE TABLE IF NOT EXISTS duenos (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre        VARCHAR(150)  NOT NULL,
  curp          VARCHAR(18)   NOT NULL UNIQUE,
  telefono      VARCHAR(20)   DEFAULT NULL,
  direccion     VARCHAR(200)  DEFAULT NULL,
  colonia       VARCHAR(100)  DEFAULT NULL,
  email         VARCHAR(150)  DEFAULT NULL,
  password_hash VARCHAR(255)  DEFAULT NULL,
  rol           ENUM('ciudadano','admin') NOT NULL DEFAULT 'ciudadano',
  activo        TINYINT(1)   NOT NULL DEFAULT 1,
  token_sesion  VARCHAR(64)   DEFAULT NULL,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_curp (curp),
  INDEX idx_rol  (rol)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Tabla de mascotas ────────────────────────────
CREATE TABLE IF NOT EXISTS mascotas (
  id               VARCHAR(20)  NOT NULL PRIMARY KEY,   -- REMAC-GRU-XXXXX
  nombre           VARCHAR(100) NOT NULL,
  especie          ENUM('perro','gato') NOT NULL,
  raza             VARCHAR(100) DEFAULT NULL,
  edad             VARCHAR(10)  DEFAULT NULL,            -- valor decimal: "3", "0.6"
  edad_label       VARCHAR(30)  DEFAULT NULL,            -- "3 años", "6 meses"
  sexo             ENUM('macho','hembra') DEFAULT NULL,
  color            VARCHAR(100) DEFAULT NULL,
  senias_particulares TEXT       DEFAULT NULL,
  foto_url         TEXT         DEFAULT NULL,
  vacunado         TINYINT(1)   NOT NULL DEFAULT 0,
  esterilizado     TINYINT(1)   NOT NULL DEFAULT 0,
  estatus          ENUM('Alta','Baja') NOT NULL DEFAULT 'Alta',
  dueno_id         INT UNSIGNED NOT NULL,
  fecha_registro   DATE         DEFAULT NULL,
  link_publico     VARCHAR(255) DEFAULT NULL,
  ficha            VARCHAR(100) DEFAULT NULL,
  created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY fk_dueno (dueno_id) REFERENCES duenos(id) ON DELETE CASCADE,
  INDEX idx_especie (especie),
  INDEX idx_estatus (estatus),
  INDEX idx_dueno   (dueno_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Tabla de campañas ────────────────────────────
CREATE TABLE IF NOT EXISTS campanas (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  titulo       VARCHAR(200) NOT NULL,
  descripcion  TEXT         DEFAULT NULL,
  fecha_inicio DATE         DEFAULT NULL,
  fecha_fin    DATE         DEFAULT NULL,
  icono        VARCHAR(10)  DEFAULT '📋',
  banner_color VARCHAR(20)  DEFAULT '#F27A00',
  publicado    TINYINT(1)  NOT NULL DEFAULT 1,
  created_at   TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Tabla de artículos / tips ────────────────────
CREATE TABLE IF NOT EXISTS articulos (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  titulo       VARCHAR(200) NOT NULL,
  contenido    TEXT         NOT NULL,
  imagen_icono VARCHAR(10)  DEFAULT '📄',
  publicado    TINYINT(1)  NOT NULL DEFAULT 1,
  created_at   TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ══════════════════════════════════════════════════
-- Contador global para folios REMAC-GRU
-- ══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS folio_counter (
  id      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ultimo  INT UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB;

INSERT INTO folio_counter (ultimo) VALUES (0);
