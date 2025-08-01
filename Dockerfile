# Stage 1: Build the application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev dependencies for TypeScript)
RUN npm ci

# Copy source code
COPY src/ ./src/
COPY tsconfig.json ./

# Build TypeScript to JavaScript
RUN npm run build

# Stage 2: Create the runtime image
FROM node:20-alpine AS runtime

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy built application from builder stage
COPY --from=builder /app/build ./build

# Create non-root user for security
RUN addgroup -g 1001 -S mcpuser && \
    adduser -S mcpuser -u 1001 -G mcpuser

# Change ownership of app directory
RUN chown -R mcpuser:mcpuser /app

# Switch to non-root user
USER mcpuser

# Environment variables will be set at runtime
# PERFEX_API_URL and PERFEX_API_KEY should be provided when running the container
ENV NODE_ENV=production
ENV MCP_HTTP_MODE=true
ENV PORT=3000

# Expose the HTTP port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Set the entrypoint
ENTRYPOINT ["node", "build/index.js"]

# Add labels for metadata
LABEL org.opencontainers.image.title="Perfex CRM MCP Server"
LABEL org.opencontainers.image.description="Model Context Protocol server for Perfex CRM"
LABEL org.opencontainers.image.version="0.2.1"
LABEL org.opencontainers.image.vendor="MCP Community"
LABEL org.opencontainers.image.licenses="MIT"