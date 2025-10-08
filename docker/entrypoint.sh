#!/usr/bin/env sh
set -e

echo "⏳ A iniciar SmartFarm Core..."

# Aplicar migrations
echo "🛠  prisma migrate deploy"
prisma migrate deploy || { echo "❌ prisma migrate falhou"; exit 1; }

echo "🚀 a iniciar a app"
# Tentar ambas as localizações de build do Nest
if [ -f "dist/main.js" ]; then
  exec node dist/main.js
elif [ -f "dist/src/main.js" ]; then
  exec node dist/src/main.js
else
  echo "❌ não encontrei o ficheiro de arranque (dist/main.js nem dist/src/main.js)"
  ls -la dist || true
  exit 1
fi
