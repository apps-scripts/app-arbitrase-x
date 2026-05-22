# --- Stage 1: Build ---
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package configurations
COPY package*.json ./

# Install all dependencies
RUN npm ci

# Copy full source code
COPY . .

# Build Vite frontend and Express server with esbuild
RUN npm run build

# --- Stage 2: Production Runner ---
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy package files for production dependency installation
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy compiled bundles from the builder stage
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3000

# Start compiled server
CMD ["node", "dist/server.cjs"]
