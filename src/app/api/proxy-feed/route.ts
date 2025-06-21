import { NextRequest, NextResponse } from 'next/server';

// Força runtime dinâmico para permitir uso de searchParams
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const url = searchParams.get('url');
    
    if (!url) {
      return NextResponse.json(
        { error: 'URL parameter is required' },
        { status: 400 }
      );
    }
    
    console.log(`Proxy: Buscando feed em ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });
    
    if (!response.ok) {
      return NextResponse.json(
        { error: `HTTP error! status: ${response.status}` },
        { status: response.status }
      );
    }
    
    const content = await response.text();
    console.log(`Proxy: Feed obtido. Tamanho: ${content.length} caracteres`);
    
    return new NextResponse(content, {
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/xml'
      }
    });
  } catch (error: any) {
    console.error('Erro no proxy de feed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch feed' },
      { status: 500 }
    );
  }
} 