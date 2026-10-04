# Migraciones de base de datos

`schema.sql` siempre refleja la estructura **completa y actual** (sirve para crear la base desde cero). Esta carpeta guarda, en orden, cada cambio de esquema que ya se aplicó a una base de datos que **ya existía** (producción en HostGator, o tu copia local) — para no depender solo de la memoria o de lo que diga la conversación con Claude.

## Regla de oro

Cualquier `ALTER TABLE` (o similar) que se corra a mano en phpMyAdmin — local o producción — **también se guarda aquí** como archivo nuevo, además de reflejarse en `schema.sql` y documentarse en `HISTORIAL_CAMBIOS.md`. Las tres cosas van juntas en el mismo cambio.

## Convención de nombres

```
NNNN_YYYY-MM-DD_descripcion-corta.sql
```

- `NNNN`: número consecutivo con ceros a la izquierda (`0001`, `0002`, ...), en el orden en que se deben aplicar.
- Fecha: cuando se aplicó por primera vez en producción.
- Nunca se edita un archivo ya aplicado en producción — si hace falta corregir algo, se crea un archivo nuevo.

## Cómo aplicar una migración pendiente

Igual que siempre: copiar el contenido del archivo y correrlo en la pestaña SQL de phpMyAdmin **con la base de datos correcta seleccionada** (local: `remac_db`; producción: la base bajo `ferna814`).

## Historial

| # | Archivo | Qué hace |
|---|---|---|
| 0001 | `0001_2026-10-02_add_email_verificacion.sql` | Agrega `duenos.email_verificado` / `duenos.verificacion_token` (verificación de correo al autoregistrarse). |
| 0002 | `0002_2026-10-04_add_articulos_imagen.sql` | Agrega `articulos.imagen` (imagen de portada de los Tips de salud animal). |
