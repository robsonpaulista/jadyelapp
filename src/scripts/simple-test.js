// Script simples para testar a autenticação com o Google Sheets
const fs = require('fs');
const path = require('path');
const { JWT } = require('google-auth-library');

// Função para ler o arquivo .env.local
function readEnvFile(filePath = '.env.local') {
  const envVars = {};
  try {
    const absolutePath = path.resolve(process.cwd(), filePath);
    console.log(`Tentando ler arquivo: ${absolutePath}`);
    
    if (!fs.existsSync(absolutePath)) {
      console.log(`Arquivo ${absolutePath} não encontrado.`);
      return envVars;
    }
    
    const fileContent = fs.readFileSync(absolutePath, 'utf8');
    const lines = fileContent.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      // Ignorar linhas vazias e comentários
      if (!trimmedLine || trimmedLine.startsWith('#')) continue;
      
      const separatorIndex = trimmedLine.indexOf('=');
      if (separatorIndex !== -1) {
        let key = trimmedLine.substring(0, separatorIndex).trim();
        let value = trimmedLine.substring(separatorIndex + 1).trim();
        
        // Remover aspas se houverem
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        }
        if (value.startsWith("'") && value.endsWith("'")) {
          value = value.slice(1, -1);
        }
        
        envVars[key] = value;
      }
    }
    
    console.log(`Variáveis encontradas no arquivo: ${Object.keys(envVars).join(', ')}`);
    return envVars;
  } catch (error) {
    console.error(`Erro ao ler arquivo ${filePath}:`);
    console.error(error);
    return envVars;
  }
}

// Função para testar a autenticação
async function testAuth() {
  console.log('\n===== TESTE DE CONEXÃO GOOGLE SHEETS =====\n');
  
  const env = readEnvFile();
  
  console.log('Verificando variáveis de ambiente necessárias:');
  
  // Verificar se as variáveis necessárias estão presentes
  const serviceAccountEmail = env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const fallbackEmail = env.GOOGLE_SHEETS_CLIENT_EMAIL;
  const privateKey = env.GOOGLE_PRIVATE_KEY;
  const sheetId = env.GOOGLE_SHEET_ID;
  
  const emailToUse = serviceAccountEmail || fallbackEmail;
  
  console.log('Valores encontrados:');
  console.log(`- GOOGLE_SERVICE_ACCOUNT_EMAIL: ${serviceAccountEmail}`);
  console.log(`- GOOGLE_SHEETS_CLIENT_EMAIL: ${fallbackEmail}`);
  console.log(`- Email a ser usado: ${emailToUse}`);
  
  if (!emailToUse || !privateKey) {
    console.error('❌ Uma ou mais variáveis de ambiente necessárias estão faltando:');
    if (!emailToUse) console.error('- Email da conta de serviço não configurado');
    if (!privateKey) console.error('- Chave privada não configurada');
    return;
  }
  
  // Verificar se a chave privada contém os caracteres corretos
  console.log(`- Chave privada: ${privateKey ? 'Configurada ✓' : 'Não configurada ❌'}`);
  
  // Processar a chave para garantir que contém os caracteres de nova linha corretos
  let processedKey = privateKey;
  if (!processedKey.includes('\\n')) {
    // Se não tiver escape sequences (\n), assumimos que já está no formato correto
    console.log('- Formatação da chave: Já em formato apropriado');
  } else {
    // Substitui escape sequences (\n) por caracteres de nova linha reais
    processedKey = processedKey.replace(/\\n/g, '\n');
    console.log('- Formatação da chave: Convertida escape sequences para nova linha');
  }
  
  try {
    // Criar cliente JWT
    const client = new JWT({
      email: emailToUse,
      key: processedKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    
    console.log('\nTentando autenticar com o Google Sheets...');
    
    // Tentar autenticar
    const tokens = await client.authorize();
    console.log('✅ Autenticação bem-sucedida!');
    console.log('Tokens recebidos:', JSON.stringify(tokens).substring(0, 100) + '...');
    
    if (sheetId) {
      console.log(`\nSheet ID configurado: ${sheetId}`);
      console.log('Você pode acessar esta planilha usando as credenciais fornecidas.');
    } else {
      console.log('\n⚠️ Sheet ID não configurado. Configure GOOGLE_SHEET_ID para acessar uma planilha específica.');
    }
  } catch (error) {
    console.error('\n❌ Erro na autenticação:');
    console.error(error.message);
    
    if (error.code === 'ERR_OSSL_UNSUPPORTED') {
      console.error('\n📋 Solução para ERR_OSSL_UNSUPPORTED:');
      console.error('Execute o comando com NODE_OPTIONS=--openssl-legacy-provider:');
      console.error('NODE_OPTIONS=--openssl-legacy-provider node src/scripts/simple-test.js');
    }
    
    console.error(error);
  }
}

// Executar teste
testAuth(); 