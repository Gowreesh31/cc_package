# ─────────────────────────────────────────────
# Stage 1: Build the React/Vite frontend
# ─────────────────────────────────────────────
FROM node:20-alpine AS builder
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ─────────────────────────────────────────────
# Stage 2: Production API + static file server
# ─────────────────────────────────────────────
FROM node:20-alpine AS production
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

# Copy built frontend from Stage 1
COPY --from=builder /app/dist ./dist

# Copy server source
COPY server.ts ./
COPY tsconfig.json ./
COPY prisma ./prisma

RUN npx prisma generate

EXPOSE 3000

HEALTHCHECK --interval=20s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && npx tsx server.ts"]
