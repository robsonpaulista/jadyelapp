@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo   Criacao de Servico Windows para Mutirao Catarata
echo ===================================================
echo.

REM Verifica se o usuário tem direitos de administrador
net session >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERRO] Este script precisa ser executado como Administrador.
    echo Clique com o botao direito no arquivo e selecione "Executar como administrador".
    pause
    exit /b 1
)

REM Verificar se o NSSM já está no PATH ou na pasta atual
where nssm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    if not exist nssm.exe (
        echo [INFO] NSSM nao encontrado. Baixando NSSM...
        
        REM Criar diretório para o download
        if not exist "tools" mkdir tools
        
        REM Baixar NSSM usando PowerShell
        powershell -Command "& {Invoke-WebRequest -Uri 'https://nssm.cc/release/nssm-2.24.zip' -OutFile 'tools\nssm.zip'}"
        
        if %ERRORLEVEL% NEQ 0 (
            echo [ERRO] Falha ao baixar NSSM.
            echo Por favor, baixe manualmente de https://nssm.cc/download e extraia na pasta tools.
            pause
            exit /b 1
        )
        
        REM Descompactar o arquivo
        powershell -Command "& {Expand-Archive -Path 'tools\nssm.zip' -DestinationPath 'tools' -Force}"
        
        REM Copiar o executável do NSSM para a pasta atual
        copy "tools\nssm-2.24\win64\nssm.exe" "nssm.exe" >nul
    )
    
    set NSSM_PATH=nssm.exe
) else (
    set NSSM_PATH=nssm
)

REM Configuração do serviço
set SERVICE_NAME=MutiraoCatarata
set SERVICE_DISPLAY_NAME=Sistema Mutirao Catarata
set SERVICE_DESCRIPTION=Servidor da aplicacao Mutirao Catarata para atendimentos

REM Obter diretório atual
set CURRENT_DIR=%cd%

REM Usar caminho completo do Node.js
for /f "tokens=*" %%i in ('where node') do set NODE_PATH=%%i

REM Configurar caminhos dos executáveis
set APP_PATH=%NODE_PATH%
set APP_PARAMS="%CURRENT_DIR%\node_modules\next\dist\bin\next" start -p 3006 -H 0.0.0.0
set WORKING_DIR=%CURRENT_DIR%

REM Verificar se o serviço já existe
%NSSM_PATH% status %SERVICE_NAME% >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [AVISO] O servico '%SERVICE_NAME%' ja existe!
    echo Deseja reinstala-lo? (S/N)
    set /p REINSTALL="Resposta: "
    
    if /i "%REINSTALL%" == "S" (
        echo [INFO] Removendo servico existente...
        %NSSM_PATH% remove %SERVICE_NAME% confirm
    ) else (
        echo [INFO] Operacao cancelada pelo usuario.
        pause
        exit /b 0
    )
)

REM Criar o serviço
echo [INFO] Criando servico Windows...
%NSSM_PATH% install %SERVICE_NAME% %APP_PATH%
%NSSM_PATH% set %SERVICE_NAME% AppParameters %APP_PARAMS%
%NSSM_PATH% set %SERVICE_NAME% AppDirectory %WORKING_DIR%
%NSSM_PATH% set %SERVICE_NAME% DisplayName %SERVICE_DISPLAY_NAME%
%NSSM_PATH% set %SERVICE_NAME% Description %SERVICE_DESCRIPTION%
%NSSM_PATH% set %SERVICE_NAME% Start SERVICE_AUTO_START
%NSSM_PATH% set %SERVICE_NAME% AppStdout %WORKING_DIR%\logs\service_out.log
%NSSM_PATH% set %SERVICE_NAME% AppStderr %WORKING_DIR%\logs\service_err.log
%NSSM_PATH% set %SERVICE_NAME% AppRotateFiles 1
%NSSM_PATH% set %SERVICE_NAME% AppRotateOnline 1
%NSSM_PATH% set %SERVICE_NAME% AppRotateSeconds 86400
%NSSM_PATH% set %SERVICE_NAME% AppRotateBytes 10485760

REM Criar diretório de logs
if not exist logs mkdir logs

echo.
echo [SUCESSO] Servico '%SERVICE_NAME%' criado com sucesso!
echo.
echo Para iniciar o servico, execute:
echo   sc start %SERVICE_NAME%
echo.
echo Para parar o servico, execute:
echo   sc stop %SERVICE_NAME%
echo.
echo Os logs do servico serao salvos em:
echo   %WORKING_DIR%\logs\
echo.
echo Se desejar remover o servico, execute:
echo   %NSSM_PATH% remove %SERVICE_NAME%
echo.

REM Perguntar se deseja iniciar o serviço agora
echo Deseja iniciar o servico agora? (S/N)
set /p START_SERVICE="Resposta: "

if /i "%START_SERVICE%" == "S" (
    echo [INFO] Iniciando servico '%SERVICE_NAME%'...
    sc start %SERVICE_NAME%
    
    if %ERRORLEVEL% NEQ 0 (
        echo [AVISO] Falha ao iniciar o servico. Verifique o status usando 'sc query %SERVICE_NAME%'
    ) else (
        echo [SUCESSO] Servico iniciado com sucesso!
    )
)

echo.
echo Para verificar o status do servico, execute:
echo   sc query %SERVICE_NAME%
echo.

pause 