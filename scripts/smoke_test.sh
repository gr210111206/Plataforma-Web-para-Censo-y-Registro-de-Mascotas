#!/bin/bash
# REMAC — Smoke test de la API
#
# Prueba de extremo a extremo, contra un servidor real (local o remoto):
# login por rol, permisos correctos por rol, y un ciclo CRUD completo de
# mascota. Pensado para correrse a mano después de tocar el backend, para
# agarrar regresiones antes de subir a producción — NO es parte del
# despliegue ni corre solo.
#
# Uso:
#   bash scripts/smoke_test.sh                                    # usa http://localhost/remac
#   BASE_URL=https://tumascota-elgrullo.com bash scripts/smoke_test.sh
#
# Requiere las cuentas de prueba de CUENTAS_PRUEBA.md ya sembradas
# (seed.sql) en la base de datos contra la que se corre.

BASE_URL="${BASE_URL:-http://localhost/remac}"
API="$BASE_URL/api"

ADMIN_EMAIL="admin@remac.elgrullo.mx"
ADMIN_PASS="Admin1234"
CIUDADANO_EMAIL="maria@demo.com"
CIUDADANO_PASS="Demo12345"
ASISTENTE_EMAIL="asistente.test@elgrullo.mx"
ASISTENTE_PASS="Asistente123"

PASOS=0
FALLOS=0

# ── Helpers ──────────────────────────────────────
extraer() { # extraer '"campo":"valor"' "$json" "campo"
  echo "$1" | grep -o "\"$2\":\"[^\"]*\"" | head -1 | cut -d'"' -f4
}
extraer_num() { # extrae un campo numérico (sin comillas)
  echo "$1" | grep -o "\"$2\":[0-9]*" | head -1 | grep -o '[0-9]*$'
}
check() { # check "descripción" "condición ya evaluada (0=paso, 1=falla)"
  PASOS=$((PASOS+1))
  if [ "$2" = "0" ]; then
    echo "  OK   $1"
  else
    echo "  FAIL $1"
    FALLOS=$((FALLOS+1))
  fi
}
codigo_http() { # codigo_http METHOD URL [TOKEN] [BODY]  → imprime el código HTTP
  local method="$1" url="$2" token="$3" body="$4"
  if [ -n "$token" ] && [ -n "$body" ]; then
    curl -s -o /dev/null -w "%{http_code}" -X "$method" "$url" -H "Authorization: Bearer $token" -H "Content-Type: application/json" -d "$body"
  elif [ -n "$token" ]; then
    curl -s -o /dev/null -w "%{http_code}" -X "$method" "$url" -H "Authorization: Bearer $token"
  elif [ -n "$body" ]; then
    curl -s -o /dev/null -w "%{http_code}" -X "$method" "$url" -H "Content-Type: application/json" -d "$body"
  else
    curl -s -o /dev/null -w "%{http_code}" -X "$method" "$url"
  fi
}

echo "REMAC — smoke test contra $BASE_URL"
echo "───────────────────────────────────────────"

# ── 1. Login por rol ─────────────────────────────
echo "1. Login"
RESP=$(curl -s -X POST "$API/auth?action=login" -H "Content-Type: application/json" -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASS\"}")
ADMIN_TOKEN=$(extraer "$RESP" "token")
check "admin inicia sesión" $([ -n "$ADMIN_TOKEN" ] && echo 0 || echo 1)
check "admin trae rol=admin" $([ "$(extraer "$RESP" rol)" = "admin" ] && echo 0 || echo 1)

RESP=$(curl -s -X POST "$API/auth?action=login" -H "Content-Type: application/json" -d "{\"email\":\"$CIUDADANO_EMAIL\",\"password\":\"$CIUDADANO_PASS\"}")
CIUDADANO_TOKEN=$(extraer "$RESP" "token")
check "ciudadana inicia sesión" $([ -n "$CIUDADANO_TOKEN" ] && echo 0 || echo 1)

RESP=$(curl -s -X POST "$API/auth?action=login" -H "Content-Type: application/json" -d "{\"email\":\"$ASISTENTE_EMAIL\",\"password\":\"$ASISTENTE_PASS\"}")
ASISTENTE_TOKEN=$(extraer "$RESP" "token")
check "asistente inicia sesión" $([ -n "$ASISTENTE_TOKEN" ] && echo 0 || echo 1)

RESP=$(curl -s -X POST "$API/auth?action=login" -H "Content-Type: application/json" -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"wrong-password-123\"}")
check "contraseña incorrecta → rechazada" $([ "$(extraer "$RESP" error | grep -ic 'incorrect')" != "0" ] && echo 0 || echo 1)

# ── 2. Endpoints públicos (sin sesión) ───────────
echo "2. Endpoints públicos"
check "GET /stats sin sesión → 200"    $([ "$(codigo_http GET "$API/stats")" = "200" ] && echo 0 || echo 1)
check "GET /campanas sin sesión → 200" $([ "$(codigo_http GET "$API/campanas")" = "200" ] && echo 0 || echo 1)
check "GET /articulos sin sesión → 200" $([ "$(codigo_http GET "$API/articulos")" = "200" ] && echo 0 || echo 1)

# ── 3. Endpoints protegidos rechazan sin token ───
echo "3. Autenticación requerida"
check "GET /mascotas sin token → 401"  $([ "$(codigo_http GET "$API/mascotas")" = "401" ] && echo 0 || echo 1)
check "GET /usuarios sin token → 401"  $([ "$(codigo_http GET "$API/usuarios")" = "401" ] && echo 0 || echo 1)
check "GET /bitacora sin token → 401"  $([ "$(codigo_http GET "$API/bitacora")" = "401" ] && echo 0 || echo 1)

# ── 4. Permisos por rol ──────────────────────────
echo "4. Permisos por rol"
check "ciudadana NO puede listar /usuarios (403)" $([ "$(codigo_http GET "$API/usuarios" "$CIUDADANO_TOKEN")" = "403" ] && echo 0 || echo 1)
check "ciudadana NO puede ver /bitacora (403)"     $([ "$(codigo_http GET "$API/bitacora" "$CIUDADANO_TOKEN")" = "403" ] && echo 0 || echo 1)
check "ciudadana NO puede crear campaña (403)"     $([ "$(codigo_http POST "$API/campanas" "$CIUDADANO_TOKEN" '{"titulo":"x"}')" = "403" ] && echo 0 || echo 1)
check "admin SÍ puede ver /bitacora (200)"         $([ "$(codigo_http GET "$API/bitacora" "$ADMIN_TOKEN")" = "200" ] && echo 0 || echo 1)
check "asistente puede leer /mascotas (200)"       $([ "$(codigo_http GET "$API/mascotas" "$ASISTENTE_TOKEN")" = "200" ] && echo 0 || echo 1)

# ── 5. Ciclo CRUD de mascota (ciudadana) ─────────
echo "5. CRUD de mascota (ciudadana de prueba)"
RESP=$(curl -s -X POST "$API/mascotas" -H "Authorization: Bearer $CIUDADANO_TOKEN" -H "Content-Type: application/json" \
  -d '{"nombre":"SmokeTest","especie":"perro","sexo":"macho"}')
FOLIO=$(extraer "$RESP" "id")
TOKEN_PUB=$(extraer "$RESP" "token_publico")
check "crear mascota → folio recibido" $([ -n "$FOLIO" ] && echo 0 || echo 1)
check "folio con formato M-GRU-#########" $(echo "$FOLIO" | grep -qE '^M-GRU-[0-9]{9}$' && echo 0 || echo 1)
check "token_publico ≠ folio (no enumerable)" $([ "$TOKEN_PUB" != "$FOLIO" ] && [ -n "$TOKEN_PUB" ] && echo 0 || echo 1)

if [ -n "$FOLIO" ]; then
  check "consulta pública por token → 200" $([ "$(codigo_http GET "$API/mascotas?token=$TOKEN_PUB")" = "200" ] && echo 0 || echo 1)
  check "consulta pública por folio (?id=) → NO expone datos (401)" $([ "$(codigo_http GET "$API/mascotas?id=$FOLIO")" = "401" ] && echo 0 || echo 1)

  RESP=$(curl -s -X PUT "$API/mascotas?id=$FOLIO" -H "Authorization: Bearer $CIUDADANO_TOKEN" -H "Content-Type: application/json" -d '{"color":"gris"}')
  check "editar mascota propia → color actualizado" $([ "$(extraer "$RESP" color)" = "gris" ] && echo 0 || echo 1)

  RESP=$(curl -s -X PUT "$API/mascotas?id=$FOLIO" -H "Authorization: Bearer $ASISTENTE_TOKEN" -H "Content-Type: application/json" -d '{"color":"negro"}')
  check "asistente NO puede editar mascota ajena (403)" $([ "$(extraer "$RESP" error | grep -c 'permiso')" != "0" ] && echo 0 || echo 1)

  DEL=$(curl -s -X DELETE "$API/mascotas?id=$FOLIO" -H "Authorization: Bearer $CIUDADANO_TOKEN")
  check "dar de baja mascota propia" $(echo "$DEL" | grep -q '"ok":true' && echo 0 || echo 1)
  echo "  (nota: $FOLIO queda en la BD con estatus Baja — el DELETE de la API es soft-delete, mismo comportamiento que en producción. Bórrala a mano si te estorba.)"
fi

# ── Resumen ───────────────────────────────────────
echo "───────────────────────────────────────────"
echo "$PASOS verificaciones, $FALLOS fallidas"
if [ "$FALLOS" -gt 0 ]; then
  exit 1
fi
exit 0
