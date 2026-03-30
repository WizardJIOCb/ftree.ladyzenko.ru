@echo off
setlocal

cd /d "%~dp0"
set "POSTGRES_PORT=5432"

if not exist ".env" (
  copy ".env.example" ".env" >nul
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

echo Launching Vite dev server...
start "Geodom Dev Server" cmd /k "cd /d %~dp0geodom-app && npm run dev -- --host 0.0.0.0"

echo.
echo Local services:
echo - Frontend: http://localhost:5173
echo - PostgreSQL: localhost:%POSTGRES_PORT%
echo.
echo Database config is stored in .env

endlocal
