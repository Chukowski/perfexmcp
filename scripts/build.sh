#!/bin/bash

# Build script for Perfex CRM MCP Server

set -e

echo "🔨 Building Perfex CRM MCP Server..."

# Clean previous build
if [ -d "build" ]; then
    echo "🧹 Cleaning previous build..."
    rm -rf build
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Build TypeScript
echo "🏗️  Compiling TypeScript..."
npm run build

# Make executable
echo "🔧 Making executable..."
chmod +x build/index.js

echo "✅ Build completed successfully!"
echo "📍 Executable: ./build/index.js"

# Optional: Show file size
if command -v du >/dev/null 2>&1; then
    echo "📊 Build size: $(du -sh build/ | cut -f1)"
fi