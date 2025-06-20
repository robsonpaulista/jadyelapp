@echo off
echo.
echo =================================================
echo    Teste de Conexao com Google Sheets (Windows)
echo =================================================
echo.

echo Definindo NODE_OPTIONS para compatibilidade OpenSSL...
set NODE_OPTIONS=--openssl-legacy-provider

echo.
echo Executando script de teste...
echo.
node src/scripts/windows-google-test.js
set RESULT=%ERRORLEVEL%

echo.
echo =================================================
if %RESULT% == 0 (
  echo [SUCESSO] Conexao com Google Sheets estabelecida!
  echo Seu ambiente esta configurado corretamente.
) else (
  echo [FALHA] Nao foi possivel conectar com o Google Sheets.
  echo.
  echo Se o teste falhou, tente as seguintes alternativas:
  echo  1. Verifique se o arquivo .env.local existe e contém:
  echo     - GOOGLE_SERVICE_ACCOUNT_EMAIL
  echo     - GOOGLE_PRIVATE_KEY (com formatacao adequada)
  echo     - GOOGLE_SHEET_ID
  echo.
  echo  2. Verifique sua conexao de internet
  echo  3. Desative temporariamente o firewall para teste
  echo  4. Execute o comando manualmente no PowerShell:
  echo     $env:NODE_OPTIONS="--openssl-legacy-provider"; node src/scripts/windows-google-test.js
  echo.
  echo  5. Certifique-se de que o arquivo temp-key.json foi removido se existir
)
echo =================================================
echo.

pause 