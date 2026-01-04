# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root configuration files required for build tooling
COPY package.json ./
COPY package-lock.json ./
COPY next.config.js ./
COPY tsconfig.json ./
COPY tailwind.config.js ./
COPY postcss.config.js ./
COPY postcss.config.mjs ./

# Copy source
COPY src ./src
COPY public ./public

# Install and build
RUN npm install
RUN npm run build

# Runtime stage
FROM node:20-alpine

WORKDIR /app

# Copy built Next.js app and required runtime assets
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/auth/providers', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start Next.js
CMD ["npm", "run", "start"]
