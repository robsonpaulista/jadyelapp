"use client";
import React, { useEffect, useState } from 'react';
import { User as UserIcon, ShieldCheck, RefreshCw, Filter } from 'lucide-react';
import { getCurrentUser } from '@/lib/storage';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { disableConsoleLogging } from '@/lib/logger';

interface NewsItem {
  title: string;
  link: string;
  pubDate?: string;
  source: string;
}

const GOOGLE_FEED = 'https://www.google.com/alerts/feeds/17804356194972672813/9708043366942196058';
const TALKWALKER_FEED = 'https://www.talkwalker.com/alerts/rss/YJOKITOAE6MRGBCKK7ZPOARQSR7XVFFNZNAHON7IXIAWNBVA3KJK3CVVVGAY4WZCAXCU4OZ6B7QSA67I3LHBFMGJHNF2YIZF6TWIZHW4SJUAMYHDGR4RRK4S4OOHSTH2';

async function getNews(): Promise<NewsItem[]> {
  try {
    // Buscando notícias - dados protegidos
    const timestamp = new Date().getTime();
    const res = await fetch(`/api/noticias?t=${timestamp}`);
    const data = await res.json();
    // Notícias retornadas - dados protegidos
    
    // Contagem de fontes - dados protegidos
    const googleCount = data.filter((item: NewsItem) => item.source === 'Google Alertas').length;
    const talkwalkerCount = data.filter((item: NewsItem) => item.source === 'Talkwalker Alerts').length;
    // Fontes processadas - dados protegidos
    
    return data;
  } catch (error) {
    // Erro silencioso - não exibir logs por segurança
    return [];
  }
}

export default function MonitoramentoNoticiasPage() {
  const [user, setUser] = useState<any>(null);
  const [greeting, setGreeting] = useState('');
  const [news, setNews] = useState<NewsItem[]>([]);
  const [filteredNews, setFilteredNews] = useState<NewsItem[]>([]);
  const [filter, setFilter] = useState<string>('todos');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadNews = async () => {
    setLoading(true);
    setError(null);
    try {
      // Iniciando carregamento de notícias - dados protegidos
      const data = await getNews();
      // Notícias carregadas - dados protegidos
      
      if (!data || data.length === 0) {
        setError('Nenhuma notícia encontrada. Tente novamente em alguns minutos.');
      } else {
        setNews(data);
        applyFilter(data, filter);
      }
    } catch (err: any) {
      // Erro silencioso - não exibir logs por segurança
      setError(err.message || 'Erro ao carregar notícias. Tente novamente.');
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

  useEffect(() => {
    // Desabilitar logs globalmente para proteção de dados
    if (typeof window !== 'undefined') {
      disableConsoleLogging();
    }

    // Saudação baseada no horário
    const updateGreeting = () => {
      const currentHour = new Date().getHours();
      if (currentHour >= 5 && currentHour < 12) setGreeting('Bom dia');
      else if (currentHour >= 12 && currentHour < 18) setGreeting('Boa tarde');
      else setGreeting('Boa noite');
    };
    updateGreeting();
    const userData = getCurrentUser();
    setUser(userData);
    
    // Carrega as notícias imediatamente ao montar o componente
    loadNews();
  }, []);
  
  useEffect(() => {
    applyFilter(news, filter);
  }, [filter, news]);

  return (
    <div className="min-h-screen bg-white text-gray-800 flex flex-col md:flex-row">
      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Navbar interna do conteúdo */}
        <nav className="w-full bg-white border-b border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex flex-col items-start">
              <span className="text-base md:text-lg font-semibold text-gray-900">Monitoramento de Notícias</span>
              <span className="text-xs text-gray-500 font-light">Acompanhe notícias, blogs e menções sobre Jadyel Alencar.</span>
            </div>
            <div className="flex items-center gap-2">
              {user && (
                <div className="flex flex-col items-end mr-2">
                  <div className="flex items-center gap-2">
                    <UserIcon className="h-4 w-4 text-gray-500" />
                    <span className="text-xs text-gray-700 font-normal">{greeting}, {user.name}</span>
                  </div>
                  <span className="text-[11px] text-gray-500 font-light flex items-center gap-1">
                    {user.role === 'admin' ? (
                      <><ShieldCheck className="h-3 w-3" />Administrador</>
                    ) : (
                      <><UserIcon className="h-3 w-3" />Usuário</>
                    )}
                  </span>
                </div>
              )}
              <button
                onClick={loadNews}
                className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs transition-colors border ${
                  loading 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-white hover:bg-gray-50 text-gray-700 cursor-pointer'
                } border-gray-200`}
                title="Atualizar notícias"
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Atualizando...' : 'Atualizar'}
              </button>
              <Link href="/painel-aplicacoes" className="flex items-center gap-1 text-gray-600 hover:text-blue-700 transition-colors px-3 py-1.5 rounded border border-gray-200">
                <ArrowLeft className="h-5 w-5" />
                <span className="text-xs font-medium">Voltar</span>
              </Link>
            </div>
          </div>
        </nav>
        
        {/* Conteúdo principal */}
        <main className="p-0 w-full">
          <div className="px-4 py-3 mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filtrar por:</span>
              <select 
                className="text-sm border border-gray-200 rounded px-2 py-1"
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
            <div className="px-4 text-center text-gray-500 py-6">
              <div className="inline-block animate-spin mr-2">⟳</div>
              Carregando notícias...
            </div>
          )}
          
          {error && (
            <div className="px-4 bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-4">
              Erro ao carregar notícias: {error}
            </div>
          )}
          
          {!loading && !error && filteredNews.length === 0 ? (
            <div className="px-4 text-center text-gray-500 py-16">
              {filter !== 'todos' 
                ? `Nenhuma notícia encontrada de ${filter}.` 
                : 'Nenhuma notícia encontrada ainda. Aguarde alguns minutos ou ajuste seus alertas.'}
            </div>
          ) : !loading && (
            <div className="overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">Título</th>
                    <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredNews.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-gray-800 hover:underline"
                        >
                          {item.title}
                        </a>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500 text-right whitespace-nowrap">
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
          )}
          
          {/* Informações de debug para administradores */}
          {user?.role === 'admin' && (
            <div className="mt-6 mx-4 p-4 border border-gray-200 rounded-lg bg-gray-50 text-xs">
              <details>
                <summary className="font-medium text-gray-700 cursor-pointer">Informações de Debug</summary>
                <div className="mt-2 space-y-1">
                  <p>Total de notícias: {news.length}</p>
                  <p>Google Alertas: {news.filter(item => item.source === 'Google Alertas').length}</p>
                  <p>Talkwalker Alerts: {news.filter(item => item.source === 'Talkwalker Alerts').length}</p>
                  <p>URL Google: {GOOGLE_FEED}</p>
                  <p>URL Talkwalker: {TALKWALKER_FEED}</p>
                </div>
              </details>
            </div>
          )}
        </main>
        <footer className="mt-auto p-3 text-center text-[10px] text-gray-400 font-light">
          © 2025 86 Dynamics - Todos os direitos reservados
        </footer>
      </div>
    </div>
  );
}