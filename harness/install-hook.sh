#!/bin/sh
# ──────────────────────────────────────────────────────────────────────────
# install-hook.sh — Instala el arnés de seguridad como Git pre-push hook
# Corre una vez: sh harness/install-hook.sh
# ──────────────────────────────────────────────────────────────────────────

ROOT=$(git rev-parse --show-toplevel)
HOOK_DIR="$ROOT/.git/hooks"
HOOK_FILE="$HOOK_DIR/pre-push"
HARNESS="$ROOT/harness/pre-push.sh"

echo ""
echo "📦 Instalando arnés de seguridad como Git pre-push hook..."

# Verificar que Node.js esté disponible
if ! command -v node >/dev/null 2>&1; then
  echo "❌ Node.js no encontrado. Instálalo en https://nodejs.org y vuelve a correr este script."
  exit 1
fi

# Copiar el hook y hacerlo ejecutable
cp "$HARNESS" "$HOOK_FILE"
chmod +x "$HOOK_FILE"

echo ""
echo "✅ Hook instalado en: $HOOK_FILE"
echo ""
echo "   Ahora cada vez que hagas 'git push', el arnés de seguridad"
echo "   verificará el código antes de subirlo a producción."
echo ""
echo "   Para correr el arnés manualmente:"
echo "   node harness/check.js"
echo ""
