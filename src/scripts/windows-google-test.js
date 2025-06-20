// Script otimizado para Windows para testar a autenticação com o Google Sheets
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { JWT } = require('google-auth-library');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const https = require('https');
const { Agent } = require('https');

// Função para ler o arquivo .env.local
function readEnvFile(filePath = '.env.local') {
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

// Função para depurar e formatar corretamente a chave privada
function formatPrivateKey(privateKey) {
  if (!privateKey) return null;
  
  // Exibir os primeiros e últimos caracteres da chave para diagnóstico
  console.log(`Primeiros 15 caracteres da chave: ${privateKey.substring(0, 15)}...`);
  console.log(`Últimos 15 caracteres da chave: ...${privateKey.substring(privateKey.length - 15)}`);
  
  // Verificar se a chave já contém quebras de linha
  if (privateKey.includes('-----BEGIN PRIVATE KEY-----') && 
      privateKey.includes('-----END PRIVATE KEY-----')) {
    console.log('A chave já está no formato PEM correto');
    return privateKey;
  }
  
  // Se a chave tiver escape sequences (\n), converter para quebras de linha reais
  let formattedKey = privateKey;
  if (privateKey.includes('\\n')) {
    formattedKey = privateKey.replace(/\\n/g, '\n');
    console.log('Convertidas escape sequences (\\n) para quebras de linha reais');
  }
  
  // Garantir que a chave tenha o formato PEM correto
  if (!formattedKey.startsWith('-----BEGIN PRIVATE KEY-----')) {
    formattedKey = '-----BEGIN PRIVATE KEY-----\n' + formattedKey;
    console.log('Adicionado cabeçalho PEM ausente');
  }
  
  if (!formattedKey.endsWith('-----END PRIVATE KEY-----')) {
    formattedKey = formattedKey + '\n-----END PRIVATE KEY-----';
    console.log('Adicionado rodapé PEM ausente');
  }
  
  // Verificação final do formato da chave
  if (formattedKey.includes('-----BEGIN PRIVATE KEY-----') && 
      formattedKey.includes('-----END PRIVATE KEY-----')) {
    console.log('✅ Chave formatada corretamente no formato PEM');
  } else {
    console.log('⚠️ Chave pode ainda não estar corretamente formatada');
  }
  
  return formattedKey;
}

// Função para testar a autenticação
async function testAuth() {
  console.log('\n===== TESTE DE CONEXÃO GOOGLE SHEETS (WINDOWS) =====\n');
  
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
  
  // Formatar a chave privada corretamente
  const formattedKey = formatPrivateKey(privateKey);
  
  try {
    console.log('\nTentando autenticar com o Google Sheets usando abordagem alternativa...');
    
    // Escrever a chave privada em um arquivo temporário para melhor compatibilidade
    const tempKeyFile = path.resolve(process.cwd(), 'temp-key.json');
    const keyFileData = {
      type: 'service_account',
      project_id: env.GOOGLE_PROJECT_ID || 'aplicacoesacoesbanco',
      private_key_id: 'key-id',
      private_key: formattedKey,
      client_email: emailToUse,
      client_id: '',
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(emailToUse)}`
    };
    
    fs.writeFileSync(tempKeyFile, JSON.stringify(keyFileData, null, 2));
    console.log(`Arquivo de credenciais temporário criado: ${tempKeyFile}`);
    
    // Tentar autenticar usando a biblioteca google-spreadsheet com o arquivo de credenciais
    if (sheetId) {
      console.log(`\nSheet ID configurado: ${sheetId}`);
      console.log('Tentando acessar a planilha usando as credenciais...');
      
      const doc = new GoogleSpreadsheet(sheetId);
      await doc.useServiceAccountAuth(require(tempKeyFile));
      await doc.loadInfo();
      
      console.log(`✅ Conexão bem-sucedida! Título da planilha: "${doc.title}"`);
      console.log(`Número de abas: ${doc.sheetCount}`);
      
      // Listar as primeiras 3 abas da planilha
      let sheetsInfo = '';
      let count = 0;
      doc.sheetsByIndex.forEach(sheet => {
        if (count < 3) {
          sheetsInfo += `\n  - ${sheet.title} (${sheet.rowCount} linhas x ${sheet.columnCount} colunas)`;
          count++;
        }
      });
      
      if (sheetsInfo) {
        console.log(`\nPrimeiras ${Math.min(3, doc.sheetCount)} abas:${sheetsInfo}`);
      }
    } else {
      // Autenticar sem acessar uma planilha específica
      const client = new JWT({
        email: emailToUse,
        keyFile: tempKeyFile,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
      
      const tokens = await client.authorize();
      console.log('✅ Autenticação bem-sucedida!');
      console.log('Tokens recebidos:', JSON.stringify(tokens).substring(0, 100) + '...');
      console.log('\n⚠️ Sheet ID não configurado. Configure GOOGLE_SHEET_ID para acessar uma planilha específica.');
    }
    
    // Remover o arquivo temporário
    fs.unlinkSync(tempKeyFile);
    console.log(`\nArquivo de credenciais temporário removido.`);
    
  } catch (error) {
    console.error('\n❌ Erro na autenticação:');
    console.error(error.message || error);
    
    if (error.code === 'ERR_OSSL_UNSUPPORTED') {
      console.error('\n📋 Solução para ERR_OSSL_UNSUPPORTED:');
      console.error('No Windows com PowerShell:');
      console.error('$env:NODE_OPTIONS="--openssl-legacy-provider"; node src/scripts/windows-google-test.js');
      console.error('\nOu crie um arquivo .bat com:');
      console.error('set NODE_OPTIONS=--openssl-legacy-provider');
      console.error('node src/scripts/windows-google-test.js');
    }
    
    console.error('\nErro completo:', error);
    
    // Tentar remover o arquivo temporário se existir
    try {
      const tempKeyFile = path.resolve(process.cwd(), 'temp-key.json');
      if (fs.existsSync(tempKeyFile)) {
        fs.unlinkSync(tempKeyFile);
        console.log(`\nArquivo de credenciais temporário removido.`);
      }
    } catch (e) {
      console.error('Erro ao remover arquivo temporário:', e.message);
    }
  }
}

// Executar teste
testAuth(); 