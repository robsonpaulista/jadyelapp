import { NextRequest, NextResponse } from 'next/server';
import { fetchInstagramData } from '@/lib/instagramApi';

// Credenciais seguras apenas no servidor
const INSTAGRAM_CONFIG = {
  token: process.env.INSTAGRAM_TOKEN || '',
  businessAccountId: process.env.INSTAGRAM_BUSINESS_ID || ''
};

/**
 * Valida um token do Instagram
 */
async function validateInstagramToken(token: string, businessAccountId: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${businessAccountId}?fields=id&access_token=${token}`,
      {
        signal: AbortSignal.timeout(10000)
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Erro na validação do token:', errorData);
      
      if (errorData.error?.code === 190 || errorData.error?.code === 100) {
        return false;
      }
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao validar token:', error);
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verificar se as credenciais estão configuradas
    if (!INSTAGRAM_CONFIG.token || !INSTAGRAM_CONFIG.businessAccountId) {
      return NextResponse.json(
        { error: 'Credenciais do Instagram não configuradas' },
        { status: 500 }
      );
    }

    // Validar token
    const isValid = await validateInstagramToken(INSTAGRAM_CONFIG.token, INSTAGRAM_CONFIG.businessAccountId);
    
    if (!isValid) {
      return NextResponse.json(
        { error: 'Token do Instagram expirado ou inválido' },
        { status: 401 }
      );
    }

    // Buscar dados usando a função completa que inclui busca de visualizações e debug
    const data = await fetchInstagramData(
      INSTAGRAM_CONFIG.token, 
      INSTAGRAM_CONFIG.businessAccountId,
      '30d',
      false
    );
    
    if (!data) {
      return NextResponse.json(
        { error: 'Erro ao buscar dados do Instagram' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro na API do Instagram:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, token, businessAccountId } = body;

    if (action === 'validate') {
      // Validar credenciais fornecidas
      if (!token || !businessAccountId) {
        return NextResponse.json(
          { error: 'Token e Business ID são obrigatórios' },
          { status: 400 }
        );
      }

      const isValid = await validateInstagramToken(token, businessAccountId);
      
      if (isValid) {
        return NextResponse.json({ valid: true });
      } else {
        return NextResponse.json(
          { error: 'Credenciais inválidas' },
          { status: 401 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Ação não suportada' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Erro na validação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 