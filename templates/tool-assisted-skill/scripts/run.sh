#!/usr/bin/env bash
set -euo pipefail

# Script auxiliar de ejemplo para la skill
echo "==> [tool-assisted-skill] Ejecutando diagnóstico..."
MODE="${1:---check}"

if [ "$MODE" = "--check" ]; then
    echo "✔ Chequeo completado sin incidencias."
    exit 0
elif [ "$MODE" = "--fix" ]; then
    echo "✔ Correcciones aplicadas."
    exit 0
else
    echo "Modo desconocido: $MODE. Usa --check o --fix" >&2
    exit 1
fi
