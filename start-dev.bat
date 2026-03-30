@echo off
setlocal

cd /d "%~dp0"
set "POSTGRES_PORT=5432"
set "API_PORT=3000"

if not exist ".env" (
  copy ".env.example" ".env" >nul
)

if not exist "server\.env" (
  copy "server\.env.example" "server\.env" >nul
)

echo Starting PostgreSQL in Docker...
docker compose up -d postgres
if errorlevel 1 (
  echo Failed to start PostgreSQL.
  exit /b 1
)

echo Installing frontend dependencies if needed...
call npm --prefix geodom-app install
if errorlevel 1 (
  echo Failed to install frontend dependencies.
  exit /b 1
)

echo Installing backend dependencies if needed...
call npm --prefix server install
if errorlevel 1 (
  echo Failed to install backend dependencies.
  exit /b 1
)

echo Launching Fastify API server...
start "Geodom API Server" cmd /k "cd /d %~dp0server && npm run dev"

echo Launching Vite dev server...
start "Geodom Dev Server" cmd /k "cd /d %~dp0geodom-app && npm run dev -- --host 0.0.0.0"

echo.
echo Local services:
echo - Frontend: http://localhost:5173
echo - API: http://localhost:%API_PORT%
echo - PostgreSQL: localhost:%POSTGRES_PORT%
echo.
echo Database config is stored in .env and server\.env

endlocal
