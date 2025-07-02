"use client";
import React, { useEffect, useState } from 'react';
import { RefreshCw, Filter } from 'lucide-react';
import { disableConsoleLogging } from '@/lib/logger';
import { toast } from 'react-hot-toast';
import { Loading } from '@/components/ui/loading';

interface NewsItem {
  title: string;
  link: string;
  pubDate?: string;
  source: string;
  image?: string;
}

const GOOGLE_FEED = 'https://www.google.com/alerts/feeds/17804356194972672813/9708043366942196058';
const TALKWALKER_FEED = 'https://www.talkwalker.com/alerts/rss/YJOKITOAE6MRGBCKK7ZPOARQSR7XVFFNZNAHON7IXIAWNBVA3KJK3CVVVGAY4WZCAXCU4OZ6B7QSA67I3LHBFMGJHNF2YIZF6TWIZHW4SJUAMYHDGR4RRK4S4OOHSTH2';

async function getNews(forceRefresh: boolean = false): Promise<NewsItem[]> {
  try {
    const timestamp = new Date().getTime();
    const refreshParam = forceRefresh ? `&refresh=true` : '';
    const res = await fetch(`/api/noticias?t=${timestamp}${refreshParam}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
    
    if (!res.ok) {
      throw new Error('Falha ao carregar notícias');
    }
    
    const data = await res.json();
    return data;
  } catch (error) {
    console.error('Erro ao buscar notícias:', error);
    throw error;
  }
}

export default function MonitoramentoNoticiasPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [filteredNews, setFilteredNews] = useState<NewsItem[]>([]);
  const [filter, setFilter] = useState<string>('todos');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const loadNews = async (forceRefresh: boolean = false) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await getNews(forceRefresh);
      
      if (!data || data.length === 0) {
        setError('Nenhuma notícia encontrada. Tente novamente em alguns minutos.');
      } else {
        setNews(data);
        applyFilter(data, filter);
        setLastUpdate(new Date());
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao carregar notícias. Tente novamente.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  const applyFilter = (newsData: NewsItem[], filterValue: string) => {
    if (filterValue === 'todos') {
      setFilteredNews(newsData);
    } else {
      setFilteredNews(newsData.filter(item => item.source === filterValue));
    }
  };

  const getAvatarColor = (title: string) => {
    const colors = [
      'from-blue-500 to-purple-600',
      'from-green-500 to-teal-600',
      'from-red-500 to-pink-600',
      'from-yellow-500 to-orange-600',
      'from-indigo-500 to-blue-600',
      'from-purple-500 to-indigo-600',
      'from-pink-500 to-rose-600',
      'from-teal-500 to-cyan-600'
    ];
    
    const charCode = title.charCodeAt(0);
    return colors[charCode % colors.length];
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      disableConsoleLogging();
    }
    loadNews(false);
  }, []);
  
  useEffect(() => {
    applyFilter(news, filter);
  }, [filter, news]);

  return (
    <div className="min-h-screen bg-white text-gray-800 flex flex-col md:flex-row">
      <div className="flex-1 flex flex-col min-h-screen">
        <nav className="w-full bg-white border-b border-gray-100 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col items-start">
                <span className="text-base md:text-lg font-semibold text-gray-900">Monitoramento de Notícias</span>
                <span className="text-xs text-gray-500 font-light">
                  Última atualização: {lastUpdate.toLocaleTimeString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => loadNews(true)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded text-xs transition-colors border bg-white hover:bg-gray-50 text-gray-700 cursor-pointer border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  {loading ? 'Atualizando...' : 'Atualizar'}
                </button>
              </div>
            </div>
          </div>
        </nav>
        
        <main className="flex-1 w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-4 flex flex-col md:flex-row items-start md:items-center justify-between space-y-2 md:space-y-0">
              <div className="flex items-center gap-2 w-full md:w-auto">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Filtrar por:</span>
                <select 
                  className="text-sm border border-gray-200 rounded px-2 py-1 flex-1 md:flex-none"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="todos">Todas as fontes</option>
                  <option value="Google Alertas">Google Alertas</option>
                  <option value="Talkwalker Alerts">Talkwalker Alerts</option>
                </select>
              </div>
              <div className="text-xs text-gray-500">
                Total: {filteredNews.length} notícia(s)
                {filter !== 'todos' && ` de ${filter}`}
              </div>
            </div>
            
            {loading && (
              <div className="flex-1 flex items-center justify-center min-h-[400px]">
                <Loading message={
                  filter !== 'todos'
                    ? `Carregando notícias de ${filter}...`
                    : 'Carregando todas as notícias...'
                } />
              </div>
            )}
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-4">
                {error}
              </div>
            )}
            
            {!loading && !error && filteredNews.length === 0 ? (
              <div className="text-center text-gray-500 py-16">
                {filter !== 'todos' 
                  ? `Nenhuma notícia encontrada de ${filter}.` 
                  : 'Nenhuma notícia encontrada ainda. Aguarde alguns minutos ou ajuste seus alertas.'}
              </div>
            ) : !loading && (
              <div className="md:overflow-x-auto">
                <div className="block md:hidden">
                  <div className="divide-y divide-gray-200">
                    {filteredNews.map((item, idx) => (
                      <div key={idx} className="p-4 hover:bg-gray-50 transition-colors flex gap-3">
                        <div className={`flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br ${getAvatarColor(item.title)} flex items-center justify-center text-white text-xs font-bold`}>
                          {item.title.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-gray-800 hover:underline font-medium leading-snug block mb-1"
                          >
                            {item.title}
                          </a>
                          <div className="text-xs text-gray-500">
                            {item.pubDate && (
                              new Date(item.pubDate).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="hidden md:block">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4 w-16">Imagem</th>
                        <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">Título</th>
                        <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4 w-32">Data</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {filteredNews.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4 w-16">
                            <div className={`w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br ${getAvatarColor(item.title)} flex items-center justify-center text-white text-xs font-bold`}>
                              {item.title.substring(0, 2).toUpperCase()}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <a
                              href={item.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-gray-800 hover:underline font-medium leading-tight"
                            >
                              {item.title}
                            </a>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-500 text-right whitespace-nowrap w-32">
                            {item.pubDate && (
                              new Date(item.pubDate).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}