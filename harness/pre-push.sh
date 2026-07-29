#!/bin/sh
# ──────────────────────────────────────────────────────────────────────────
# Git Pre-Push Hook — Gestor de Autos
# Se ejecuta automáticamente antes de cada `git push`.
# Si el arnés de seguridad falla, el push es BLOQUEADO.
# ──────────────────────────────────────────────────────────────────────────

# Encuentra el directorio raíz del repo (funciona desde cualquier directorio)
ROOT=$(git rev-parse --show-toplevel)

echo ""
echo "════════════════════════════════════════════════"
echo " 🔒  Corriendo arnés de seguridad antes de push"
echo "════════════════════════════════════════════════"

node "$ROOT/harness/check.js"
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
  echo ""
  echo "🚫 Push cancelado por el arnés de seguridad."
  echo "   Revisa los errores arriba y corrígelos antes de volver a hacer push."
  echo ""
  exit 1
fi

exit 0
