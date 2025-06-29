import Parser from 'rss-parser';
import * as xml2js from 'xml2js';

interface NewsItem {
  title: string;
  link: string;
  pubDate?: string;
  source: string;
  image?: string;
}

// Função para realizar uma solicitação direta via fetch com mais opções de headers
export async function fetchFeedDirectly(url: string): Promise<string | null> {
  try {
    console.log(`Tentando fetch direto para ${url.substring(0, 30)}...`);
    
    // Configurações para contornar limitações de CORS e aceitar diferentes formatos
    const headers = {
      'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    };
    
    const response = await fetch(url, { 
      headers,
      cache: 'no-store',
      next: { revalidate: 0 }
    });
    
    if (!response.ok) {
      console.error(`Erro HTTP ${response.status} ao buscar feed: ${url}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const text = await response.text();
    console.log(`Feed obtido. Tamanho: ${text.length} caracteres`);
    
    // Verificação básica do formato
    if (text.length < 100) {
      console.log('Resposta muito pequena, provavelmente não é um feed válido');
      return null;
    }
    
    // Verificação de conteúdo XML
    const hasXmlTags = text.includes('<rss') || text.includes('<feed') || 
                       text.includes('<channel') || text.includes('<item') || 
                       text.includes('<entry');
                       
    if (!hasXmlTags) {
      console.log('Resposta não parece ser um feed XML válido');
      
      // Verificar se é JSON (alguns feeds modernos usam JSON)
      try {
        JSON.parse(text);
        console.log('Feed parece estar em formato JSON');
        return text;
      } catch {
        console.log('Feed não é XML nem JSON válido');
        return null;
      }
    }
    
    return text;
  } catch (e) {
    console.error('Erro no fetch direto:', e);
    return null;
  }
}

// Função para buscar dados do feed de forma robusta
async function fetchWithFallback(url: string): Promise<string | null> {
  try {
    // Primeiro tentar diretamente
    let feedText = await fetchFeedDirectly(url);
    
    // Se falhar, tentar com proxy do servidor (usando nossa API)
    if (!feedText) {
      console.log('Tentando buscar via servidor...');
      const encodedUrl = encodeURIComponent(url);
      const response = await fetch(`/api/proxy-feed?url=${encodedUrl}`);
      
      if (response.ok) {
        feedText = await response.text();
      }
    }
    
    return feedText;
  } catch (e) {
    console.error('Erro em todas as tentativas de fetch:', e);
    return null;
  }
}

// Função para extrair notícias usando xml2js como alternativa ao parser rss
export async function parseRssWithXml2js(xmlData: string, source: string): Promise<NewsItem[]> {
  try {
    const parser = new xml2js.Parser({ 
      explicitArray: false,
      normalize: true,
      normalizeTags: true,
      mergeAttrs: true 
    });
    
    const result = await parser.parseStringPromise(xmlData);
    
    let items: any[] = [];
    
    // Tenta diferentes formatos de RSS
    if (result.rss && result.rss.channel) {
      // Formato RSS padrão
      const channel = result.rss.channel;
      items = channel.item ? (Array.isArray(channel.item) ? channel.item : [channel.item]) : [];
    } else if (result.feed && result.feed.entry) {
      // Formato Atom
      items = result.feed.entry ? (Array.isArray(result.feed.entry) ? result.feed.entry : [result.feed.entry]) : [];
    } else if (result.feed && result.feed.item) {
      // Algumas variações do formato Atom
      items = result.feed.item ? (Array.isArray(result.feed.item) ? result.feed.item : [result.feed.item]) : [];
    } else if (result.channel && result.channel.item) {
      // Formato RSS sem o elemento rss (raro, mas acontece)
      items = result.channel.item ? (Array.isArray(result.channel.item) ? result.channel.item : [result.channel.item]) : [];
    }
    
    console.log(`XML2JS encontrou ${items.length} itens no feed ${source}`);
    
    return items.map(item => {
      // Tenta extrair informações em diferentes formatos
      const title = extractTextContent(item.title);
      const link = extractLinkUrl(item);
      const pubDate = extractDate(item);
      const image = extractImageUrl(item);
      
      return {
        title: removeHtmlTags(title),
        link,
        pubDate,
        source,
        image
      };
    });
  } catch (e) {
    console.error(`Erro ao analisar XML com xml2js para ${source}:`, e);
    return [];
  }
}

// Funções auxiliares para extração de dados
function extractTextContent(field: any): string {
  if (!field) return '';
  
  if (typeof field === 'string') return field;
  
  if (typeof field === 'object') {
    // Verificar campos comuns que contêm texto
    if (field._) return field._;
    if (field.text) return field.text;
    if (field.content) return field.content;
    if (field.value) return field.value;
  }
  
  return String(field);
}

function extractLinkUrl(item: any): string {
  if (!item) return '';
  
  // Link direto
  if (item.link) {
    if (typeof item.link === 'string') return item.link;
    
    // Link como objeto (comum em Atom)
    if (typeof item.link === 'object') {
      if (item.link.href) return item.link.href;
      if (Array.isArray(item.link) && item.link.length > 0) {
        const link = item.link[0];
        if (typeof link === 'string') return link;
        if (link.href) return link.href;
      }
    }
  }
  
  // URL direto (alguns feeds usam isso)
  if (item.url) return item.url;
  
  // GUID às vezes é usado como link
  if (item.guid && typeof item.guid === 'string' && item.guid.startsWith('http')) {
    return item.guid;
  }
  
  // Em alguns feeds, o id é uma URL
  if (item.id && typeof item.id === 'string' && item.id.startsWith('http')) {
    return item.id;
  }
  
  return '';
}

function extractDate(item: any): string | undefined {
  // Lista de possíveis campos de data
  const dateFields = [
    'pubDate', 'published', 'pubdate', 'date', 
    'dc:date', 'dcdate', 'created', 'updated',
    'issued', 'modified', 'lastBuildDate', 'lastmod',
    'isoDate'
  ];
  
  for (const field of dateFields) {
    if (item[field]) {
      const value = item[field];
      if (typeof value === 'string') return value;
      if (typeof value === 'object' && value._) return value._;
    }
  }
  
  return undefined;
}

function extractImageUrl(item: any): string | undefined {
  if (!item) return undefined;
  
  // Campos comuns para imagens em RSS/Atom
  const imageFields = [
    'enclosure', 'media:thumbnail', 'media:content', 'image', 
    'thumbnail', 'media:group', 'content:encoded', 'description'
  ];
  
  // 1. Verificar enclosure (muito comum em RSS)
  if (item.enclosure) {
    if (typeof item.enclosure === 'string' && isImageUrl(item.enclosure)) {
      return item.enclosure;
    }
    if (typeof item.enclosure === 'object') {
      if (item.enclosure.url && isImageUrl(item.enclosure.url)) {
        return item.enclosure.url;
      }
      if (item.enclosure.href && isImageUrl(item.enclosure.href)) {
        return item.enclosure.href;
      }
      // Se é um array de enclosures
      if (Array.isArray(item.enclosure)) {
        for (const enc of item.enclosure) {
          if (typeof enc === 'string' && isImageUrl(enc)) {
            return enc;
          }
          if (typeof enc === 'object') {
            if (enc.url && isImageUrl(enc.url)) {
              return enc.url;
            }
            if (enc.href && isImageUrl(enc.href)) {
              return enc.href;
            }
          }
        }
      }
    }
  }
  
  // 2. Verificar media:thumbnail (namespace media)
  if (item['media:thumbnail']) {
    const thumb = item['media:thumbnail'];
    if (typeof thumb === 'string' && isImageUrl(thumb)) {
      return thumb;
    }
    if (typeof thumb === 'object') {
      if (thumb.url && isImageUrl(thumb.url)) {
        return thumb.url;
      }
      if (thumb.href && isImageUrl(thumb.href)) {
        return thumb.href;
      }
    }
  }
  
  // 3. Verificar media:content
  if (item['media:content']) {
    const content = item['media:content'];
    if (typeof content === 'string' && isImageUrl(content)) {
      return content;
    }
    if (typeof content === 'object') {
      if (content.url && isImageUrl(content.url)) {
        return content.url;
      }
      if (content.href && isImageUrl(content.href)) {
        return content.href;
      }
    }
  }
  
  // 4. Verificar campo image direto
  if (item.image) {
    if (typeof item.image === 'string' && isImageUrl(item.image)) {
      return item.image;
    }
    if (typeof item.image === 'object') {
      if (item.image.url && isImageUrl(item.image.url)) {
        return item.image.url;
      }
      if (item.image.href && isImageUrl(item.image.href)) {
        return item.image.href;
      }
    }
  }
  
  // 5. Procurar em content:encoded ou description (HTML content)
  const htmlFields = ['content:encoded', 'description', 'content', 'summary'];
  for (const field of htmlFields) {
    if (item[field]) {
      const htmlContent = extractTextContent(item[field]);
      const imageFromHtml = extractImageFromHtml(htmlContent);
      if (imageFromHtml) {
        return imageFromHtml;
      }
    }
  }
  
  // 6. Como fallback, gerar um avatar baseado no título
  if (item.title) {
    return generateAvatarUrl(item.title);
  }
  
  return undefined;
}

function generateAvatarUrl(title: string): string {
  // Usar o serviço DiceBear para gerar avatares únicos baseados no título
  const seed = encodeURIComponent(title.substring(0, 50)); // Usar primeiros 50 caracteres como seed
  return `https://api.dicebear.com/7.x/initials/svg?seed=${seed}&backgroundColor=3b82f6,8b5cf6,ef4444,f59e0b,10b981&size=48`;
}

function isImageUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  
  // Verificar se é uma URL válida
  try {
    new URL(url);
  } catch {
    return false;
  }
  
  // Verificar extensões de imagem comuns
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
  const urlLower = url.toLowerCase();
  
  // Verificar extensão
  if (imageExtensions.some(ext => urlLower.includes(ext))) {
    return true;
  }
  
  // Verificar se contém parâmetros que indicam imagem
  if (urlLower.includes('image') || urlLower.includes('photo') || urlLower.includes('picture')) {
    return true;
  }
  
  return false;
}

function extractImageFromHtml(html: string): string | undefined {
  if (!html || typeof html !== 'string') return undefined;
  
  // Regex para encontrar tags img
  const imgRegex = /<img[^>]+src\s*=\s*["']([^"']+)["'][^>]*>/gi;
  const matches = html.match(imgRegex);
  
  if (matches && matches.length > 0) {
    // Extrair o src da primeira imagem encontrada
    const srcRegex = /src\s*=\s*["']([^"']+)["']/i;
    const srcMatch = matches[0].match(srcRegex);
    
    if (srcMatch && srcMatch[1] && isImageUrl(srcMatch[1])) {
      return srcMatch[1];
    }
  }
  
  return undefined;
}

function removeHtmlTags(text: string): string {
  return text.replace(/<\/?[^>]+(>|$)/g, "");
}

// Função principal para buscar e analisar feeds RSS
export async function fetchRssFeed(url: string, sourceName: string): Promise<NewsItem[]> {
  const parser = new Parser({
    customFields: {
      item: [
        'pubDate', 'title', 'link', 'content', 'contentSnippet', 'guid', 'dc:date', 'isoDate',
        'enclosure', 'media:thumbnail', 'media:content', 'image', 'thumbnail', 'media:group',
        'content:encoded', 'description', 'summary'
      ],
    },
  });
  
  try {
    // Tentar primeiro com fetch direto
    const feedText = await fetchFeedDirectly(url);
    
    let items: NewsItem[] = [];
    
    if (feedText) {
      try {
        // Tentar com o parser padrão primeiro
        const feed = await parser.parseString(feedText);
        
        if (feed.items && feed.items.length > 0) {
          console.log(`Parser: ${feed.items.length} itens encontrados para ${sourceName}`);
          items = feed.items.map((item: any) => ({
            title: (item.title || '').replace(/<\/?[^>]+(>|$)/g, ""),
            link: item.link || '',
            pubDate: item.pubDate || item.isoDate || item['dc:date'],
            source: sourceName,
            image: extractImageUrl(item)
          }));
        } else {
          // Se o parser padrão não encontrou itens, tentar com xml2js
          console.log(`Parser não encontrou itens para ${sourceName}, tentando xml2js`);
          items = await parseRssWithXml2js(feedText, sourceName);
        }
      } catch (e) {
        console.error(`Erro ao usar parser padrão para ${sourceName}:`, e);
        // Se falhar com o parser padrão, tentar com xml2js
        items = await parseRssWithXml2js(feedText, sourceName);
      }
    } else {
      // Se o fetch direto falhar, tentar com o parser URL
      try {
        console.log(`Fetch direto falhou para ${sourceName}, tentando parser.parseURL`);
        const feed = await parser.parseURL(url);
        if (feed.items) {
          items = feed.items.map((item: any) => ({
            title: (item.title || '').replace(/<\/?[^>]+(>|$)/g, ""),
            link: item.link || '',
            pubDate: item.pubDate || item.isoDate || item['dc:date'],
            source: sourceName,
            image: extractImageUrl(item)
          }));
        }
      } catch (e) {
        console.error(`Erro ao usar parser.parseURL para ${sourceName}:`, e);
      }
    }
    
    console.log(`Total de ${items.length} notícias encontradas para ${sourceName}`);
    return items;
  } catch (error) {
    console.error(`Erro geral ao buscar feed ${sourceName}:`, error);
    return [];
  }
} 