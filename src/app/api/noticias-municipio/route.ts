import { NextRequest } from 'next/server';
import { fetchRssFeed } from '@/lib/rssFeedParser';

// Configuração de feeds por município
interface FeedMunicipio {
  municipio: string;
  googleAlert?: string;
  talkwalkerAlert?: string;
  rssCustom?: string[];
}

// Configuração de feeds específicos por município
const FEEDS_POR_MUNICIPIO: FeedMunicipio[] = [
  {
    municipio: "TERESINA",
    googleAlert: "https://www.google.com/alerts/feeds/[ID_ESPECÍFICO_TERESINA]/[TOKEN_TERESINA]",
    talkwalkerAlert: "https://www.talkwalker.com/alerts/rss/[TOKEN_ESPECÍFICO_TERESINA]",
  },
  {
    municipio: "PARNAÍBA", 
    googleAlert: "https://www.google.com/alerts/feeds/[ID_ESPECÍFICO_PARNAIBA]/[TOKEN_PARNAIBA]",
    talkwalkerAlert: "https://www.talkwalker.com/alerts/rss/[TOKEN_ESPECÍFICO_PARNAIBA]",
  },
  {
    municipio: "ALTOS",
    googleAlert: "https://www.google.com/alerts/feeds/17804356194972672813/1216134778087352017",
    talkwalkerAlert: "https://alerts.talkwalker.com/alerts/rss/Z37HR5MYXHKNAIZQGSL3EJC4Z4QSWM3HO65FE4YJKEPWJ4RZGZ5TXLUZFQ6GGRZTK5TDIY7Y4CPR667I3LHBFMGJHNF2YIZF6TWIZHW4SJUAMYHDGR4RRK4S4OOHSTH2",
  },
  // Adicionar mais municípios conforme necessário...
];

// Feeds genéricos como fallback
const FEEDS_GENERICOS = {
  googleAlert: 'https://www.google.com/alerts/feeds/17804356194972672813/9708043366942196058',
  talkwalkerAlert: 'https://www.talkwalker.com/alerts/rss/YJOKITOAE6MRGBCKK7ZPOARQSR7XVFFNZNAHON7IXIAWNBVA3KJK3CVVVGAY4WZCAXCU4OZ6B7QSA67I3LHBFMGJHNF2YIZF6TWIZHW4SJUAMYHDGR4RRK4S4OOHSTH2'
};

// Cache em memória por município
const cacheNoticias: { [municipio: string]: { data: any[], timestamp: number } } = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

function normalizeString(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const municipio = url.searchParams.get('municipio');
    const forceRefresh = url.searchParams.get('refresh') === 'true';
    
    if (!municipio) {
      return new Response(JSON.stringify({ 
        error: 'Parâmetro municipio é obrigatório' 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const municipioNormalizado = normalizeString(municipio);
    const now = Date.now();
    
    // Verificar cache se não for forçar refresh
    if (!forceRefresh && cacheNoticias[municipioNormalizado]) {
      const cached = cacheNoticias[municipioNormalizado];
      if ((now - cached.timestamp) < CACHE_DURATION) {
        console.log(`Retornando notícias do cache para ${municipio}`);
        return new Response(JSON.stringify(cached.data), {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'Pragma': 'no-cache'
          }
        });
      }
    }

    console.log(`Buscando notícias específicas para: ${municipio}`);
    
    // Buscar configuração específica do município
    const configMunicipio = FEEDS_POR_MUNICIPIO.find(
      feed => normalizeString(feed.municipio) === municipioNormalizado
    );
    
    let googleNews: any[] = [];
    let talkwalkerNews: any[] = [];
    
    const timeout = 10000; // 10 segundos
    const fetchWithTimeout = async (url: string, source: string) => {
      try {
        if (!url || url.includes('[ID_ESPECÍFICO') || url.includes('[TOKEN_')) {
          console.log(`Feed não configurado para ${source} - ${municipio}`);
          return [];
        }
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        const result = await fetchRssFeed(url, source);
        clearTimeout(timeoutId);
        return result;
      } catch (error) {
        console.error(`Erro ao buscar feed ${source} para ${municipio}:`, error);
        return [];
      }
    };
    
    if (configMunicipio) {
      // Usar feeds específicos do município
      console.log(`Usando feeds específicos para ${municipio}`);
      
      const [googleResult, talkwalkerResult] = await Promise.all([
        configMunicipio.googleAlert ? 
          fetchWithTimeout(configMunicipio.googleAlert, `Google Alertas - ${municipio}`) : 
          Promise.resolve([]),
        configMunicipio.talkwalkerAlert ? 
          fetchWithTimeout(configMunicipio.talkwalkerAlert, `Talkwalker Alerts - ${municipio}`) : 
          Promise.resolve([])
      ]);
      
      googleNews = googleResult;
      talkwalkerNews = talkwalkerResult;
      
      // Se não encontrou notícias específicas, usar feeds genéricos como fallback
      if (googleNews.length === 0 && talkwalkerNews.length === 0) {
        console.log(`Sem notícias específicas para ${municipio}, usando feeds genéricos como fallback`);
        
        const [genericGoogle, genericTalkwalker] = await Promise.all([
          fetchWithTimeout(FEEDS_GENERICOS.googleAlert, 'Google Alertas (Genérico)'),
          fetchWithTimeout(FEEDS_GENERICOS.talkwalkerAlert, 'Talkwalker Alerts (Genérico)')
        ]);
        
        // Filtrar notícias que mencionam o município
        googleNews = genericGoogle.filter((noticia: any) => 
          noticia.title?.toLowerCase().includes(municipio.toLowerCase()) ||
          noticia.description?.toLowerCase().includes(municipio.toLowerCase())
        );
        
        talkwalkerNews = genericTalkwalker.filter((noticia: any) => 
          noticia.title?.toLowerCase().includes(municipio.toLowerCase()) ||
          noticia.description?.toLowerCase().includes(municipio.toLowerCase())
        );
      }
    } else {
      // Município não configurado, usar feeds genéricos filtrados
      console.log(`Município ${municipio} não configurado, usando feeds genéricos filtrados`);
      
      const [genericGoogle, genericTalkwalker] = await Promise.all([
        fetchWithTimeout(FEEDS_GENERICOS.googleAlert, 'Google Alertas (Filtrado)'),
        fetchWithTimeout(FEEDS_GENERICOS.talkwalkerAlert, 'Talkwalker Alerts (Filtrado)')
      ]);
      
      // Filtrar notícias que mencionam o município
      googleNews = genericGoogle.filter((noticia: any) => 
        noticia.title?.toLowerCase().includes(municipio.toLowerCase()) ||
        noticia.description?.toLowerCase().includes(municipio.toLowerCase())
      );
      
      talkwalkerNews = genericTalkwalker.filter((noticia: any) => 
        noticia.title?.toLowerCase().includes(municipio.toLowerCase()) ||
        noticia.description?.toLowerCase().includes(municipio.toLowerCase())
      );
    }
    
    // Combinar e ordenar as notícias por data
    const news = [...googleNews, ...talkwalkerNews].sort((a, b) => {
      if (!a.pubDate) return 1;
      if (!b.pubDate) return -1;
      return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
    });
    
    console.log(`${municipio}: ${news.length} notícias encontradas (Google: ${googleNews.length}, Talkwalker: ${talkwalkerNews.length})`);
    
    // Atualizar cache
    cacheNoticias[municipioNormalizado] = {
      data: news,
      timestamp: now
    };
    
    return new Response(JSON.stringify(news), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Last-Modified': new Date().toUTCString()
      }
    });
    
  } catch (error: any) {
    console.error('Erro na API de notícias por município:', error.message);
    return new Response(JSON.stringify({ 
      error: 'Erro ao buscar notícias específicas do município',
      details: error.message,
      municipio: req.url
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 