import { NextRequest } from 'next/server';
import { fetchRssFeed } from '@/lib/rssFeedParser';

const GOOGLE_FEED = 'https://www.google.com/alerts/feeds/17804356194972672813/9708043366942196058';
const TALKWALKER_FEED = 'https://www.talkwalker.com/alerts/rss/YJOKITOAE6MRGBCKK7ZPOARQSR7XVFFNZNAHON7IXIAWNBVA3KJK3CVVVGAY4WZCAXCU4OZ6B7QSA67I3LHBFMGJHNF2YIZF6TWIZHW4SJUAMYHDGR4RRK4S4OOHSTH2';

// Cache em memória para otimização
let newsCache: any = null;
let lastFetchTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const forceRefresh = url.searchParams.get('refresh') === 'true';
    const now = Date.now();
    
    // Se tiver cache válido e não for forçar atualização, retorna o cache
    if (!forceRefresh && newsCache && (now - lastFetchTime) < CACHE_DURATION) {
      console.log('Retornando notícias do cache');
      return new Response(JSON.stringify(newsCache), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    }

    console.log('Buscando feeds RSS...');
    
    // Buscar feeds em paralelo com timeout
    const timeout = 10000; // 10 segundos
    const fetchWithTimeout = async (url: string, source: string) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        const result = await fetchRssFeed(url, source);
        clearTimeout(timeoutId);
        return result;
      } catch (error) {
        console.error(`Erro ao buscar feed ${source}:`, error);
        return [];
      }
    };
    
    const [googleNews, talkwalkerNews] = await Promise.all([
      fetchWithTimeout(GOOGLE_FEED, 'Google Alertas'),
      fetchWithTimeout(TALKWALKER_FEED, 'Talkwalker Alerts')
    ]);
    
    // Combinar e ordenar as notícias por data
    const news = [...googleNews, ...talkwalkerNews].sort((a, b) => {
      if (!a.pubDate) return 1;
      if (!b.pubDate) return -1;
      return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
    });
    
    console.log(`Total de notícias combinadas: ${news.length}`);
    console.log(`Google: ${googleNews.length}, Talkwalker: ${talkwalkerNews.length}`);
    
    if (news.length === 0) {
      console.warn('Nenhuma notícia encontrada em nenhum dos feeds');
    }
    
    // Atualiza o cache
    newsCache = news;
    lastFetchTime = now;
    
    // Retorna as notícias com headers anti-cache
    return new Response(JSON.stringify(news), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Last-Modified': new Date().toUTCString()
      }
    });
  } catch (error: any) {
    console.error('Erro geral na API de notícias:', error.message);
    return new Response(JSON.stringify({ 
      error: 'Erro ao buscar notícias',
      details: error.message,
      timestamp: new Date().toISOString()
    }), { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  }
}