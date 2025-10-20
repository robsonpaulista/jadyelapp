@echo off
echo 🚀 REINICIANDO SISTEMA MUTIRÃO CATARATA...
echo.

echo 1️⃣ Finalizando processos Node.js...
taskkill /f /im node.exe 2>nul
if %errorlevel% equ 0 (
    echo    ✅ Processos Node.js finalizados
) else (
    echo    ℹ️  Nenhum processo Node.js encontrado
)

echo.
echo 2️⃣ Limpando cache do npm...
if exist node_modules (
    echo    ℹ️  Mantendo node_modules (não removendo para economizar tempo)
) else (
    echo    ⚠️  node_modules não encontrado
)

echo.
echo 3️⃣ Verificando Firebase...
node scripts/verificar-firebase.js
if %errorlevel% equ 0 (
    echo    ✅ Firebase OK
) else (
    echo    ❌ Problema no Firebase detectado
    echo    🔧 Executando limpeza...
    node scripts/limpar-firebase.js
)

echo.
echo 4️⃣ Iniciando servidor de desenvolvimento...
echo    💡 Execute: npm run dev
echo.
echo ✅ SISTEMA PRONTO PARA REINICIALIZAÇÃO!
echo.
pause














