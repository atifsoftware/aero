# Stage 1: Build & Runtime
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install system utilities needed for native builds
RUN apk add --no-cache libc6-compat python3 make g++

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy application source code
COPY . .

# Ensure storage and sessions directories exist
RUN mkdir -p storage/logs storage/cache sessions public/uploads

# Expose server port
EXPOSE 3000

# Set environment
ENV NODE_ENV=production

# Run the Aero server
CMD ["node", "server.js"]
