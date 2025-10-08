#!/usr/bin/env sh
set -e

echo "⏳ A iniciar SmartFarm Core..."

# Aplicar migrations (assume que a CLI 'prisma' existe na imagem)
echo "🛠  prisma migrate deploy"
prisma migrate deploy || { echo "❌ prisma migrate falhou"; exit 1; }

echo "🚀 a iniciar a app"
exec node dist/main.js
