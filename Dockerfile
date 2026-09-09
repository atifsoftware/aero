# Stage 1: Build & Runtime
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install system utilities needed for native builds
RUN apk add --no-cache libc6-compat python3 make g++

# Copy package manifests across monorepo workspaces
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/
COPY packages/shared/package*.json ./packages/shared/

# Install production dependencies for the backend and shared workspace
RUN npm ci --omit=dev --workspace=@aero/backend --workspace=@aero/shared

# Copy application source code
COPY . .

# Generate Prisma Client for backend
RUN npm --prefix apps/backend run prisma:generate || true

# Ensure storage and sessions directories exist
RUN mkdir -p apps/backend/storage/logs apps/backend/storage/cache apps/backend/sessions apps/backend/public/uploads

# Expose server port
EXPOSE 3000

# Set environment
ENV NODE_ENV=production

# Run the Aero server via root gateway
CMD ["node", "server.js"]
