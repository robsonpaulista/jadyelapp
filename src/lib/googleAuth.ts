import { google } from 'googleapis';

export async function getGoogleAuth() {
  try {
    // Verificar se todas as variáveis de ambiente necessárias estão definidas
    const requiredEnvVars = [
      'GOOGLE_CLIENT_EMAIL',
      'GOOGLE_PRIVATE_KEY',
      'GOOGLE_SHEETS_SPREADSHEET_ID'
    ];

    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new Error(`Variável de ambiente ${envVar} não está definida`);
      }
    }

    // Criar credenciais JWT
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    // Autenticar
    await auth.authorize();
    
    return auth;
  } catch (error) {
    console.error('Erro na autenticação com o Google:', error);
    throw error;
  }
} 