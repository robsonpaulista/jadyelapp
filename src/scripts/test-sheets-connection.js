require('dotenv').config({ path: '.env.local' });
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

async function testConnection() {
  try {
    console.log('Iniciando teste de conexão com Google Sheets...');
    console.log('Informações de ambiente:');
    console.log('GOOGLE_SERVICE_ACCOUNT_EMAIL:', process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL);
    console.log('GOOGLE_SHEET_ID:', process.env.GOOGLE_SHEET_ID);
    console.log('GOOGLE_PRIVATE_KEY disponível:', !!process.env.GOOGLE_PRIVATE_KEY);

    // Criar credenciais JWT
    const auth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    console.log('Autenticando com Google...');
    await auth.authorize();
    console.log('✅ Autenticação bem-sucedida!');

    // Conectar à planilha
    console.log('Conectando à planilha...');
    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, auth);
    await doc.loadInfo();
    console.log('✅ Planilha carregada com sucesso!');
    console.log('Título da planilha:', doc.title);

    // Verificar se a aba pessoas existe
    console.log('Verificando aba "pessoas"...');
    const sheet = doc.sheetsByTitle['pessoas'];
    if (sheet) {
      console.log('✅ Aba "pessoas" encontrada!');
      await sheet.loadHeaderRow();
      console.log('Cabeçalhos:', sheet.headerValues);

      // Tentar carregar algumas linhas
      console.log('Carregando linhas da planilha...');
      const rows = await sheet.getRows();
      console.log(`✅ ${rows.length} linhas carregadas com sucesso!`);
      
      if (rows.length > 0) {
        console.log('Amostra da primeira linha:');
        const firstRow = rows[0];
        const sample = {};
        sheet.headerValues.slice(0, 5).forEach(header => {
          sample[header] = firstRow.get(header);
        });
        console.log(sample);
      }
    } else {
      console.log('❌ Aba "pessoas" não encontrada!');
      console.log('Abas disponíveis:', Object.keys(doc.sheetsByTitle).join(', '));
    }

    console.log('Teste concluído com sucesso! ✅');
  } catch (error) {
    console.error('❌ Erro durante o teste de conexão:');
    console.error(error);

    if (error.message?.includes('JWT')) {
      console.error('\nPossível problema com as credenciais JWT:');
      console.error('- Verifique se a chave privada está corretamente formatada no .env.local');
      console.error('- Certifique-se de que a chave esteja entre aspas duplas e que as quebras de linha (\\n) sejam preservadas');
    }

    if (error.code === 'ECONNRESET') {
      console.error('\nErro de conexão ECONNRESET:');
      console.error('- Pode ser um problema de rede ou firewall bloqueando a conexão');
      console.error('- Verifique sua conexão com a internet');
      console.error('- Tente usar uma rede diferente ou desativar temporariamente o firewall');
    }
  }
}

testConnection(); 