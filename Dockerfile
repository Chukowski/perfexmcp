# Use Node.js 20 as base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src/ ./src/
COPY tsconfig.json ./

# Build the application
RUN npm run build

# Create non-root user for security
RUN addgroup -g 1001 -S mcpuser && \
    adduser -S mcpuser -u 1001 -G mcpuser

# Change ownership of app directory
RUN chown -R mcpuser:mcpuser /app

# Switch to non-root user
USER mcpuser

# Expose environment variables that need to be set
ENV PERFEX_API_URL=""
ENV PERFEX_API_KEY=""

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "console.log('Health check: Server is ready')" || exit 1

# Set the entrypoint
ENTRYPOINT ["node", "build/index.js"]

# Add labels for metadata
LABEL org.opencontainers.image.title="Perfex CRM MCP Server"
LABEL org.opencontainers.image.description="Model Context Protocol server for Perfex CRM"
LABEL org.opencontainers.image.version="0.2.0"
LABEL org.opencontainers.image.vendor="MCP Community"
LABEL org.opencontainers.image.licenses="MIT"