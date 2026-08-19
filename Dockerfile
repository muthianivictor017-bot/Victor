# Duka Business Manager — production image
FROM node:20-alpine AS base
WORKDIR /app
ENV NODE_ENV=production

# Install deps (use npm ci if lock exists)
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --ignore-scripts || npm install --omit=dev

# Copy app
COPY . .

# Non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup && chown -R appuser:appgroup /app
USER appuser

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1

CMD ["node", "server.js"]
