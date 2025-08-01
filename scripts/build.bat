@echo off
REM Build script for Perfex CRM MCP Server (Windows)

echo 🔨 Building Perfex CRM MCP Server...

REM Clean previous build
if exist "build" (
    echo 🧹 Cleaning previous build...
    rmdir /s /q build
)

REM Install dependencies
echo 📦 Installing dependencies...
call npm ci
if errorlevel 1 goto error

REM Build TypeScript
echo 🏗️ Compiling TypeScript...
call npm run build
if errorlevel 1 goto error

echo ✅ Build completed successfully!
echo 📍 Executable: .\build\index.js

REM Show file size if possible
for /f %%A in ('dir build /s /-c  ^| find " bytes"') do set size=%%A
echo 📊 Build completed

goto end

:error
echo ❌ Build failed!
exit /b 1

:end