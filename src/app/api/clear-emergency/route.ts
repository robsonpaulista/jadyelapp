import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    // Imprime informações de diagnóstico
    console.log('[EMERGENCY] Iniciando limpeza de emergência de todas as sessões');
    
    // Obter todos os cookies
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('session');
    
    // Se existe cookie de sessão, tenta decodificar para diagnóstico
    if (sessionCookie?.value) {
      try {
        const sessionData = JSON.parse(decodeURIComponent(sessionCookie.value));
        console.log('[EMERGENCY] Conteúdo da sessão:', JSON.stringify(sessionData, null, 2));
        
        // Verifica especificamente por datas futuras
        if (sessionData.loggedAt) {
          console.log('[EMERGENCY] Data da sessão:', sessionData.loggedAt);
          if (sessionData.loggedAt.includes('2025')) {
            console.log('[EMERGENCY] DETECTADA DATA DE 2025!!!');
          }
        }
      } catch (decodeError) {
        console.error('[EMERGENCY] Erro ao decodificar sessão:', decodeError);
      }
    }
    
    // Limpar session cookie
    cookieStore.delete('session');
    
    // Forçar limpeza de todas as sessões
    console.log('[EMERGENCY] Cookies de sessão limpos com sucesso');
    
    return NextResponse.json({
      success: true,
      message: 'Limpeza de emergência realizada com sucesso',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[EMERGENCY] Erro durante limpeza de emergência:', error);
    return NextResponse.json(
      { error: 'Erro durante limpeza de emergência' },
      { status: 500 }
    );
  }
} 