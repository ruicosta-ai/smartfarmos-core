# ===== deps =====
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ===== builder =====
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY --from=deps /app/node_modules ./node_modules
# copiar apenas o necessário para build
COPY tsconfig*.json nest-cli.json ./
COPY prisma ./prisma
COPY src ./src
# gerar prisma client e compilar
RUN npx prisma generate
RUN npm run build

# ===== runner (produção) =====
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# deps de produção + prisma CLI (para migrate deploy no arranque)
COPY package*.json ./
RUN npm ci --omit=dev && npm i -g prisma@6

# artefactos de build + migrations
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# entrypoint que aplica migrations e arranca a app
COPY docker/entrypoint.sh /app/entrypoint.sh
ENTRYPOINT ["sh","/app/entrypoint.sh"]

EXPOSE 3000
