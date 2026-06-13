# =============================================================================
# Stage 1: Builder — compile Vue/React frontend with Vite + TypeScript
# =============================================================================
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies first (layer caching)
COPY package.json package-lock.json ./
RUN npm ci

# Copy build configuration files
COPY tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts index.html ./

# Copy source code and build
COPY src/ src/
RUN npm run build

# =============================================================================
# Stage 2: Runtime — serve the Hono.js backend and static frontend
# =============================================================================
FROM node:22-alpine AS runtime

WORKDIR /app

# Install only production dependencies
COPY package.json package-lock.json ./
RUN npm ci --production

# Copy built frontend from builder stage
COPY --from=builder /app/dist ./dist

# Copy backend source
COPY server/ server/

# Create required runtime directories
RUN mkdir -p /app/server/config /app/uploads

# Expose backend API port
EXPOSE 3001

# Environment variables
ENV NODE_ENV=production
ENV NODE_TLS_REJECT_UNAUTHORIZED=0

# Start the Hono.js backend with tsx
CMD ["npx", "tsx", "server/index.ts"]
