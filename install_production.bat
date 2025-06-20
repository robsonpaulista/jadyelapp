@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo   Instalacao do Sistema Mutirao Catarata
echo   Configuracao do ambiente de producao
echo ===================================================
echo.

REM Verificar se Node.js está instalado
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERRO] Node.js nao encontrado. Por favor, instale o Node.js e tente novamente.
    echo Download: https://nodejs.org/
    exit /b 1
)

REM Verificar versão do Node
for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo [INFO] Versao do Node encontrada: %NODE_VERSION%

REM Instalar dependências
echo [INFO] Instalando dependencias do projeto...
call npm install

if %ERRORLEVEL% NEQ 0 (
    echo [ERRO] Falha na instalacao das dependencias.
    exit /b 1
)

REM Criar build de produção
echo [INFO] Criando build de producao...
call npm run build

if %ERRORLEVEL% NEQ 0 (
    echo [ERRO] Falha na criacao do build.
    exit /b 1
)

REM Perguntar se quer instalar PM2
echo.
echo Deseja instalar o PM2 (gerenciador de processos)? (S/N)
set /p INSTALL_PM2="Resposta: "

if /i "%INSTALL_PM2%" == "S" (
    echo [INFO] Instalando PM2...
    call npm install -g pm2
    
    if %ERRORLEVEL% NEQ 0 (
        echo [ERRO] Falha na instalacao do PM2.
        exit /b 1
    )
    
    echo [INFO] Configurando PM2 para iniciar o aplicativo...
    call pm2 start npm --name "mutirao_catarata" -- start
    
    echo [INFO] Configurando PM2 para iniciar com o Windows...
    call pm2 save
    call pm2 startup
    
    echo [SUCESSO] Instalacao com PM2 concluida!
) else (
    echo [INFO] PM2 nao sera instalado.
    
    echo Para iniciar o servidor manualmente, execute:
    echo npm run start
)

REM Obter endereço IP local
for /f "tokens=*" %%i in ('ipconfig ^| findstr "IPv4" ^| findstr /v "169.254"') do (
    set IP_ADDRESS=%%i
)

echo.
echo ===================================================
echo   Instalacao concluida com sucesso!
echo ===================================================
echo.
echo Seu servidor esta configurado para ser acessado em:
echo - Localmente: http://localhost:3006
if defined IP_ADDRESS (
    echo - Na rede local: http:%IP_ADDRESS:~36%:3006
) else (
    echo - Na rede local: Execute 'ipconfig' para ver seu IP
)
echo.
echo Para mais informacoes, consulte INSTALL_NETWORK.md
echo.

pause 