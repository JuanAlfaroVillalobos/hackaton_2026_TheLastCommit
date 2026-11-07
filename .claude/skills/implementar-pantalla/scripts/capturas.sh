#!/usr/bin/env bash
# Capturas de pantallas de Vecinos en un teléfono o emulador Android, para compararlas con los frames.
#
# Uso:
#   capturas.sh --esquema <scheme> --paquete <android.package> --out <carpeta> \
#     --rutas /inicio,/favores,/perfil [--espera 3] [--serial <id de adb>]
#
# - <scheme> y <android.package> salen de app/app.config.ts (o app.json): "scheme" y "android.package".
# - Las rutas son las de Expo Router SIN los grupos entre paréntesis:
#   src/app/(privado)/(pestanas)/inicio/index.tsx  →  /inicio
# - Requiere el development build instalado, la sesión ya iniciada en el teléfono
#   y el servidor corriendo: npx expo start --dev-client
# - Guarda una captura PNG por ruta (resolución nativa del teléfono) e imprime la ruta del archivo.
set -euo pipefail

esquema="" paquete="" out="capturas" rutas="/inicio" espera=3 serial=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --esquema) esquema="$2"; shift 2 ;;
    --paquete) paquete="$2"; shift 2 ;;
    --out) out="$2"; shift 2 ;;
    --rutas) rutas="$2"; shift 2 ;;
    --espera) espera="$2"; shift 2 ;;
    --serial) serial="$2"; shift 2 ;;
    *) echo "Opción desconocida: $1" >&2; exit 1 ;;
  esac
done
[[ -z "$esquema" || -z "$paquete" ]] && { echo "Faltan --esquema y --paquete" >&2; exit 1; }

adb_cmd=(adb)
[[ -n "$serial" ]] && adb_cmd+=(-s "$serial")
"${adb_cmd[@]}" get-state >/dev/null || { echo "No hay un dispositivo Android conectado (adb devices)" >&2; exit 1; }

mkdir -p "$out"
IFS=',' read -ra lista <<< "$rutas"
for ruta in "${lista[@]}"; do
  "${adb_cmd[@]}" shell am start -W -a android.intent.action.VIEW -d "${esquema}://${ruta#/}" "$paquete" >/dev/null
  sleep "$espera"
  nombre=$(echo "$ruta" | sed -E 's/[^A-Za-z0-9]+/_/g; s/^_+|_+$//g')
  archivo="$out/${nombre:-inicio}.png"
  "${adb_cmd[@]}" exec-out screencap -p > "$archivo"
  echo "captura: $archivo"
done
