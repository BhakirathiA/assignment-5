# ---------- Build stage ----------
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---------- Runtime stage ----------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist

# If you use static/public/uploads at runtime, keep these:
# COPY --from=builder /app/public ./public
# RUN mkdir -p uploads

EXPOSE 3001
CMD ["node", "dist/server.js"]