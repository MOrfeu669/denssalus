@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0"
title Denssalus

echo.
echo Iniciando o Denssalus...
echo.

docker info >nul 2>&1
if errorlevel 1 call :subir_docker
if errorlevel 1 exit /b 1

echo Subindo o banco local...
call npx --yes supabase start
if errorlevel 1 (
  echo.
  echo Nao foi possivel subir o Supabase.
  pause
  exit /b 1
)

call :app_no_ar
if not errorlevel 1 (
  echo O app ja esta no ar.
  start "" "http://127.0.0.1:3000"
  exit /b 0
)

echo Subindo o app...
start "Denssalus" /D "%~dp0" cmd /k npx next dev --hostname 127.0.0.1 --port 3000

set /a n=0
:espera_app
set /a n+=1
if !n! gtr 40 (
  echo.
  echo O app nao respondeu. Veja a janela do Denssalus.
  pause
  exit /b 1
)
timeout /t 2 /nobreak >nul
call :app_no_ar
if errorlevel 1 goto espera_app

start "" "http://127.0.0.1:3000"
echo.
echo Pronto: http://127.0.0.1:3000
timeout /t 2 /nobreak >nul
exit /b 0

:app_no_ar
powershell -NoProfile -Command "try { Invoke-WebRequest -Uri http://127.0.0.1:3000 -UseBasicParsing -TimeoutSec 2 | Out-Null; exit 0 } catch { exit 1 }"
exit /b

:subir_docker
echo Abrindo o Docker Desktop...
set "DOCKER=%LOCALAPPDATA%\Programs\DockerDesktop\Docker Desktop.exe"
if not exist "%DOCKER%" (
  echo Docker Desktop nao encontrado.
  pause
  exit /b 1
)
start "" "%DOCKER%"
set /a d=0
:espera_docker
set /a d+=1
if !d! gtr 40 (
  echo O Docker nao ficou pronto.
  pause
  exit /b 1
)
timeout /t 3 /nobreak >nul
docker info >nul 2>&1
if errorlevel 1 goto espera_docker
exit /b 0
