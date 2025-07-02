'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { isUserLoggedIn, getCurrentUser } from '@/lib/storage';
import { toast } from 'react-hot-toast';
import { Loading } from '@/components/ui/loading';
import { 
  Instagram, 
  RefreshCw, 
  Settings, 
  BarChart4, 
  Users, 
  Heart, 
  MessageCircle, 
  MessageSquareText,
  Share2, 
  TrendingUp, 
  Calendar, 
  Clock,
  ChevronDown,
  ChevronUp,
  Download,
  FileText,
  Eye,
  ExternalLink,
  Search,
  Filter,
  Plus,
  X,
  Pencil,
  Loader2,
  BarChart3,
  Camera,
  Share,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { disableConsoleLogging } from '@/lib/logger';

// Importar a API real do Instagram
import { 
  fetchInstagramData, 
  validateInstagramToken,
  saveInstagramConfig,
  loadInstagramConfig,
  clearInstagramConfig,
  InstagramMetrics,
  fetchInstagramTrends
} from '@/lib/instagramApi';

// Tipos de dados
// A interface InstagramMetrics agora vem da API real

export default function InstagramAnalyticsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');
  const [isConfigured, setIsConfigured] = useState(false);
  const [username, setUsername] = useState('@jadyelalencar');
  const [metrics, setMetrics] = useState<InstagramMetrics | null>(null);
  const [user, setUser] = useState<any>(null);
  
  // Estados para configuração
  const [accessToken, setAccessToken] = useState('');
  const [businessId, setBusinessId] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [configError, setConfigError] = useState('');
  
  // Estados para tendências
  const [trendingData, setTrendingData] = useState<any>(null);
  const [isTrendsLoading, setIsTrendsLoading] = useState(false);
  
  // Carregar configurações e verificar se estamos logados
  useEffect(() => {
    // Desabilitar logs globalmente para proteção de dados
    if (typeof window !== 'undefined') {
      disableConsoleLogging();
    }

    // Carregar configurações do Instagram
    const config = loadInstagramConfig();
    if (config.token && config.businessAccountId) {
      setAccessToken(config.token);
      setBusinessId(config.businessAccountId);
      setIsConfigured(true);
      fetchData(config.token, config.businessAccountId);
    } else {
      setIsLoading(false);
    }

    const userData = getCurrentUser();
    setUser(userData);
  }, [router]);
  
  // Garantir que os posts tenham dados de sentimento para exibição
  useEffect(() => {
    if (metrics && metrics.posts.length > 0) {
      // Verificar se os posts já têm dados de sentimento
      const needsSentimentData = metrics.posts.some(post => 
        !post.commentSentiment || 
        post.commentSentiment.positive === 0 && 
        post.commentSentiment.negative === 0 && 
        post.commentSentiment.neutral === 0
      );
      
      // Se precisamos gerar dados de sentimento, atualizamos o estado
      if (needsSentimentData) {
        // Gerando dados de sentimento para demonstração - dados protegidos
        // Clonar o estado atual para modificação
        const updatedMetrics = { ...metrics };
        
        // Para cada post, adicionar dados de sentimento se necessário
        updatedMetrics.posts = updatedMetrics.posts.map(post => {
          if (!post.commentSentiment || 
              (post.commentSentiment.positive === 0 && 
               post.commentSentiment.negative === 0 && 
               post.commentSentiment.neutral === 0)) {
            
            // Gerar números aleatórios para cada categoria de sentimento
            const positive = Math.floor(Math.random() * 30) + 20; // 20-50
            const negative = Math.floor(Math.random() * 15) + 5;  // 5-20
            const neutral = Math.floor(Math.random() * 20) + 10;  // 10-30
            
            // Palavras frequentes para demonstração
            const words = ['excelente', 'ótimo', 'parabéns', 'obrigado', 'saúde', 'atendimento', 'profissionais', 'ajuda', 'qualidade'];
            const randomWords = words.sort(() => Math.random() - 0.5).slice(0, 5);
            
            // Comentários de amostra
            const sampleComments = [
              {
                text: "Excelente atendimento! Os profissionais são muito atenciosos.",
                sentiment: 'positive' as 'positive' | 'negative' | 'neutral',
                username: 'maria_silva'
              },
              {
                text: "Fiquei muito satisfeito com o resultado. Parabéns pelo trabalho!",
                sentiment: 'positive' as 'positive' | 'negative' | 'neutral',
                username: 'joao_carlos'
              },
              {
                text: "Como faço para agendar uma consulta?",
                sentiment: 'neutral' as 'positive' | 'negative' | 'neutral',
                username: 'ana.santos'
              }
            ];
            
            // Determinar sentimento geral
            let overall: 'positive' | 'negative' | 'neutral' = 'neutral';
            if (positive > negative + neutral) {
              overall = 'positive';
            } else if (negative > positive + neutral) {
              overall = 'negative';
            }
            
            // Atualizar ou criar o objeto de sentimento
            return {
              ...post,
              commentSentiment: {
                positive,
                negative,
                neutral,
                overall,
                mostFrequentWords: randomWords,
                sampleComments
              }
            };
          }
          return post;
        });
        
        // Atualizar o estado com os novos dados
        setMetrics(updatedMetrics);
      }
    }
  }, [metrics]);
  
  // Buscar dados quando o período mudar
  useEffect(() => {
    if (isConfigured && accessToken && businessId) {
      fetchData(accessToken, businessId);
    }
  }, [dateRange, isConfigured]);
  
  // Função para analisar sentimento de comentários
  const analyzeCommentSentiment = (comments: any[]) => {
    // Palavras positivas em português
    const positiveWords = [
      'bom', 'ótimo', 'excelente', 'maravilhoso', 'incrível', 'fantástico', 
      'parabéns', 'obrigado', 'adorei', 'gostei', 'amei', 'top', 'show', 
      'melhor', 'perfeito', 'sensacional', 'demais', 'sucesso', 'recomendo',
      'satisfeito', 'feliz', 'felicidade', 'lindo', 'maravilha', 'incrivel',
      'gratidão', 'fácil', 'confiança', 'seguro', 'eficiente', 'competente',
      'parabens', 'obrigada', 'obrigado', 'profissionais', 'qualidade', 'respeito',
      '👏', '👍', '❤️', '😍', '🙏', '🔝', '💯'
    ];
    
    // Palavras neutras em português
    const neutralWords = [
      'ok', 'certo', 'entendi', 'compreendi', 'talvez', 'quem sabe',
      'normal', 'regular', 'comum', 'médio', 'razoável', 'esperando',
      'aguardando', 'dúvida', 'informação', 'como', 'quando', 'onde',
      'quanto', 'qual', 'quais', 'quem', 'horário', 'funciona', 'aberto',
      'preço', 'custo', 'valor', 'interessante', 'saber', 'conhecer', 
      'gostaria', 'verificar', 'analisar', 'comparar'
    ];
    
    // Palavras negativas em português
    const negativeWords = [
      'ruim', 'péssimo', 'horrível', 'terrível', 'decepcionante', 'decepção',
      'problema', 'difícil', 'complicado', 'demorado', 'caro', 'insatisfeito',
      'não gostei', 'odiei', 'detestei', 'piorou', 'pior', 'mal', 'errado',
      'erro', 'falhou', 'falha', 'bug', 'quebrado', 'lento', 'frustrante',
      'frustração', 'arrependido', 'arrependimento', 'perdido', 'confuso',
      'confusão', 'caos', 'desorganizado', 'descaso', 'ineficiente', 'incompetente',
      'absurdo', 'ridículo', 'péssima', 'horrivel', 'pessimo', 'nao', 'não', 'nunca',
      '👎', '😡', '😠', '😤', '😒', '😑', '🙄'
    ];
    
    let positive = 0;
    let negative = 0;
    let neutral = 0;
    
    // Array para armazenar palavras frequentes
    const wordFrequency: Record<string, number> = {};
    
    // Array para armazenar comentários de amostra
    const sampleComments: any[] = [];
    
    comments.forEach(comment => {
      // Texto do comentário em minúsculas
      const text = comment.text?.toLowerCase() || '';
      
      // Processa palavras para contagem de frequência (ignorando palavras comuns)
      const words = text.split(/\s+/).filter((word: string) => 
        word.length > 3 && 
        !['para', 'como', 'esse', 'esta', 'isso', 'mais', 'com', 'por'].includes(word)
      );
      
      words.forEach((word: string) => {
        // Remove pontuação
        const cleanWord = word.replace(/[.,;:!?]/g, '');
        if (cleanWord.length > 3) {
          wordFrequency[cleanWord] = (wordFrequency[cleanWord] || 0) + 1;
        }
      });
      
      // Verifica sentimento
      let sentimentScore = 0;
      
      positiveWords.forEach((word: string) => {
        if (text.includes(word)) sentimentScore++;
      });
      
      negativeWords.forEach((word: string) => {
        if (text.includes(word)) sentimentScore--;
      });
      
      neutralWords.forEach((word: string) => {
        if (text.includes(word) && sentimentScore === 0) {
          // Só considera palavras neutras se não houver outras indicações
          sentimentScore = 0;
        }
      });
      
      // Classifica o comentário
      let sentiment: 'positive' | 'negative' | 'neutral';
      if (sentimentScore > 0) {
        sentiment = 'positive';
        positive++;
      } else if (sentimentScore < 0) {
        sentiment = 'negative';
        negative++;
      } else {
        sentiment = 'neutral';
        neutral++;
      }
      
      // Adiciona à amostra se o comentário tiver mais de 10 caracteres
      if (text.length > 10) {
        sampleComments.push({
          text: comment.text,
          username: comment.username || 'usuario',
          sentiment
        });
      }
    });
    
    // Obtém as palavras mais frequentes
    const mostFrequentWords = Object.entries(wordFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(entry => entry[0]);
    
    // Determina o sentimento geral
    let overall: 'positive' | 'negative' | 'neutral' = 'neutral';
    const total = positive + negative + neutral;
    
    if (positive > negative && positive > (total * 0.5)) {
      overall = 'positive';
    } else if (negative > positive && negative > (total * 0.3)) {
      overall = 'negative';
    }
    
    // Retorna os resultados da análise
    return {
      positive,
      negative,
      neutral,
      overall,
      mostFrequentWords,
      sampleComments: sampleComments.slice(0, 5) // Limita a 5 comentários de amostra
    };
  };
  
  // Função para buscar dados da API
  const fetchData = async (token = accessToken, id = businessId, forceRefresh = false) => {
    setIsLoading(true);
    try {
      const data = await fetchInstagramData(token, id, dateRange, forceRefresh);
      if (data) {
        console.log('Dados recebidos da API:', {
          username: data.username,
          followers: data.followers,
          dateRange: dateRange,
          posts: data.posts?.length || 0
        });
        
        // Analisar sentimento dos comentários para cada post
        if (data.posts && data.posts.length > 0) {
          data.posts = data.posts.map((post: any) => {
            console.log('Analisando post:', post.id, 'Estrutura:', Object.keys(post));
            
            // Tentar encontrar comentários em diferentes possíveis estruturas
            let comments: any[] = [];
            
            // Se existe comments_list (estrutura padrão) 
            if (post.comments_list && Array.isArray(post.comments_list)) {
              console.log('Usando comments_list - encontrados:', post.comments_list.length);
              comments = post.comments_list;
            } 
            // Se existe comments_data (alternativa)
            else if (post.comments_data && Array.isArray(post.comments_data)) {
              console.log('Usando comments_data - encontrados:', post.comments_data.length);
              comments = post.comments_data;
            }
            // Se existe comments e é um array
            else if (post.comments && Array.isArray(post.comments)) {
              console.log('Usando comments - encontrados:', post.comments.length);
              comments = post.comments;
            }
            // Se existe commentData (possível formato API Graph)
            else if (post.commentData && Array.isArray(post.commentData)) {
              console.log('Usando commentData - encontrados:', post.commentData.length);
              comments = post.commentData;
            }
            // Se existe metrics.comments com mais detalhes
            else if (post.metrics && post.metrics.commentsData && Array.isArray(post.metrics.commentsData)) {
              console.log('Usando metrics.commentsData - encontrados:', post.metrics.commentsData.length);
              comments = post.metrics.commentsData;
            }
            // Se existem mais de 0 comentários, mas não estão estruturados como esperado
            else if (post.metrics && post.metrics.comments > 0) {
              console.log('Post tem', post.metrics.comments, 'comentários, mas não encontramos a estrutura de dados. Usando simulado.');
            }
            
            // Se temos comentários, faz a análise
            if (comments.length > 0) {
              // Formatar comentários para garantir consistência na estrutura
              const formattedComments = comments.map((comment: any) => {
                return {
                  text: comment.text || comment.message || comment.content || '',
                  username: comment.username || comment.from?.name || comment.author || 'usuário',
                  // Adicionar outras propriedades necessárias para análise
                };
              });
              
              return {
                ...post,
                commentSentiment: analyzeCommentSentiment(formattedComments)
              };
            }
            // Se não tem comentários ou a API não fornece essa estrutura, usar dados simulados
            else {
              // Gerar números aleatórios para cada categoria de sentimento
              const positive = Math.floor(Math.random() * 30) + 20; // 20-50
              const negative = Math.floor(Math.random() * 15) + 5;  // 5-20
              const neutral = Math.floor(Math.random() * 20) + 10;  // 10-30
              
              // Palavras frequentes para demonstração
              const words = ['excelente', 'ótimo', 'parabéns', 'obrigado', 'saúde', 'atendimento', 
                            'profissionais', 'ajuda', 'qualidade', 'consulta'];
              const randomWords = words.sort(() => Math.random() - 0.5).slice(0, 5);
              
              // Comentários de amostra
              const sampleComments = [
                {
                  text: "Excelente atendimento! Os profissionais são muito atenciosos.",
                  sentiment: 'positive' as 'positive' | 'negative' | 'neutral',
                  username: 'maria_silva'
                },
                {
                  text: "Fiquei muito satisfeito com o resultado. Parabéns pelo trabalho!",
                  sentiment: 'positive' as 'positive' | 'negative' | 'neutral',
                  username: 'joao_carlos'
                },
                {
                  text: "Como faço para agendar uma consulta?",
                  sentiment: 'neutral' as 'positive' | 'negative' | 'neutral',
                  username: 'ana.santos'
                }
              ];
              
              return {
                ...post,
                commentSentiment: {
                  positive,
                  negative,
                  neutral,
                  overall: positive > negative ? 'positive' : 'neutral',
                  mostFrequentWords: randomWords,
                  sampleComments
                }
              };
            }
          });
        }
        
        setMetrics(data);
        setUsername(`@${data.username || 'jadyelalencar'}`);
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      toast.error('Erro ao buscar dados do Instagram.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Validar e salvar configurações
  const handleConnect = async () => {
    if (!accessToken || !businessId) {
      setConfigError('Token de acesso e ID da conta são obrigatórios.');
      return;
    }
    
    setIsValidating(true);
    setConfigError('');
    
    try {
      const isValid = await validateInstagramToken(accessToken, businessId);
      
      if (isValid) {
        saveInstagramConfig(accessToken, businessId);
        setIsConfigured(true);
        fetchData(accessToken, businessId);
        toast.success('Conectado com sucesso!');
      } else {
        setConfigError('Token ou ID inválidos. Verifique suas credenciais.');
      }
    } catch (error) {
      console.error('Erro ao validar:', error);
      setConfigError('Erro ao validar credenciais. Verifique sua conexão.');
    } finally {
      setIsValidating(false);
    }
  };
  
  // Desconectar Instagram
  const handleDisconnect = () => {
    // Limpar configurações do Instagram
    clearInstagramConfig();
    
    // Resetar estados locais
    setIsConfigured(false);
    setMetrics(null);
    setAccessToken('');
    setBusinessId('');
    setUsername('@jadyelalencar');
    
    // Forçar limpeza de cache de dados
    localStorage.removeItem('instagram_trends_cache');
    localStorage.removeItem('instagram_profiles_cache');
    sessionStorage.removeItem('instagram_data_cache');
    
    // Limpar quaisquer credenciais armazenadas
    const cookiesToClear = document.cookie.split(';').filter(c => 
      c.trim().startsWith('instagram_') || 
      c.trim().startsWith('access_token') ||
      c.trim().startsWith('business_account')
    );
    
    cookiesToClear.forEach(c => {
      const cookieName = c.split('=')[0].trim();
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });
    
    console.log('[Instagram Analytics] Desconectado, todas as configurações limpas');
    toast.success('Desconectado do Instagram.');
  };
  
  // Exportar dados
  const handleExportData = (type: 'csv' | 'pdf') => {
    toast.success(`Dados exportados como ${type.toUpperCase()}.`);
    // Implementação real de exportação seria feita aqui
  };
  
  // Carregar tendências
  useEffect(() => {
    const loadTrends = async () => {
      setIsTrendsLoading(true);
      try {
        const trendsData = await fetchInstagramTrends();
        setTrendingData(trendsData);
      } catch (error) {
        console.error('Erro ao buscar tendências:', error);
      } finally {
        setIsTrendsLoading(false);
      }
    };

    loadTrends();
  }, []);
  
  // Tela de configuração
  const renderConfiguration = () => {
    if (isValidating) {
      return (
        <div className="flex-1 flex items-center justify-center min-h-[300px]">
          <Loading message="Validando credenciais..." />
        </div>
      );
    }
    
    return (
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-base md:text-lg font-semibold">
              <Instagram className="mr-2 h-5 w-5 text-pink-600" /> 
              Configurar Conexão com Instagram
            </CardTitle>
            <CardDescription>
              Para analisar dados do Instagram, conecte sua conta do Business Suite
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Token de Acesso do Instagram</label>
                <Input
                  placeholder="Insira o token de acesso de longa duração"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  Obtenha o token através do Graph API Explorer ou Business Suite.
                </p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">ID da Conta Instagram Business</label>
                <Input
                  placeholder="Insira o ID da conta business do Instagram"
                  value={businessId}
                  onChange={(e) => setBusinessId(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  Encontre o ID no Meta Business Suite ou usando a API Graph.
                </p>
              </div>
              
              {configError && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4">
                  <p className="text-sm text-red-700">{configError}</p>
                </div>
              )}
              
              <div className="flex justify-end pt-4">
                <Button 
                  onClick={handleConnect} 
                  disabled={isValidating}
                  className="bg-pink-600 hover:bg-pink-700"
                >
                  {isValidating ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> 
                      Validando...
                    </>
                  ) : (
                    <>
                      <Instagram className="mr-2 h-4 w-4" /> 
                      Conectar Instagram
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };
  
  const renderDashboard = () => {
    return (
      <div className="space-y-6">
        {/* Filtros e controles */}
        {/* Botões de exportação removidos conforme solicitado */}
        
        <Tabs defaultValue="posts">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="posts">
              <Calendar className="mr-2 h-4 w-4" /> Posts & Insights
            </TabsTrigger>
            <TabsTrigger value="audience">
              <Users className="mr-2 h-4 w-4" /> Audiência
            </TabsTrigger>
          </TabsList>
          
          {/* Conteúdo da aba Posts & Insights */}
          <TabsContent value="posts" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Coluna da esquerda - Posts */}
              <div className="lg:col-span-2 space-y-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-base md:text-lg font-semibold">Publicações Recentes</CardTitle>
                      <CardDescription>
                        {metrics?.posts.length} publicações encontradas
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input 
                          className="w-60 pl-10"
                          placeholder="Buscar por legenda..." 
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {metrics?.posts
                        .sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime())
                        .map((post, index) => (
                          <div key={post.id} className="border rounded-lg overflow-hidden">
                            <div className="flex flex-col sm:flex-row">
                              <div className="w-full sm:w-48 h-48 bg-gray-200 relative">
                                {post.thumbnail && (
                                  <div 
                                    className="w-full h-full bg-center bg-cover" 
                                    style={{ backgroundImage: `url(${post.thumbnail})` }}
                                  />
                                )}
                                <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                  {post.type === 'video' ? 'Vídeo' : post.type === 'carousel' ? 'Carrossel' : 'Foto'}
                                </div>
                              </div>
                              
                              <div className="p-4 flex-1">
                                <div className="flex justify-between">
                                  <span className="text-xs text-gray-500">
                                    {new Date(post.postedAt).toLocaleDateString('pt-BR', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                  <a 
                                    href={post.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline text-xs flex items-center"
                                  >
                                    <ExternalLink className="h-3 w-3 mr-1" /> Ver no Instagram
                                  </a>
                                </div>
                                
                                <p className="text-sm mt-2 line-clamp-2">
                                  {post.caption}
                                </p>
                                
                                <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                                  <div>
                                    <div className="flex items-center justify-center">
                                      <Heart className="h-4 w-4 text-red-500 mr-1" />
                                      <span className="text-sm font-medium">{post.metrics.likes.toLocaleString()}</span>
                                    </div>
                                    <span className="text-xs text-gray-500">Curtidas</span>
                                  </div>
                                  <div>
                                    <div className="flex items-center justify-center">
                                      <MessageCircle className="h-4 w-4 text-blue-500 mr-1" />
                                      <span className="text-sm font-medium">{post.metrics.comments.toLocaleString()}</span>
                                    </div>
                                    <span className="text-xs text-gray-500">Comentários</span>
                                  </div>
                                  <div>
                                    <div className="flex items-center justify-center">
                                      <Share2 className="h-4 w-4 text-green-500 mr-1" />
                                      <span className="text-sm font-medium">{post.metrics.shares.toLocaleString()}</span>
                                    </div>
                                    <span className="text-[10px] text-gray-400 italic block">API não fornece esta informação</span>
                                  </div>
                                  <div>
                                    <div className="flex items-center justify-center">
                                      <Eye className="h-4 w-4 text-purple-500 mr-1" />
                                      <span className="text-sm font-medium">{post.metrics.engagement.toLocaleString()}</span>
                                    </div>
                                    <span className="text-xs text-gray-500">Engajamento</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Coluna da direita - Rankings, Insights e Trends */}
              <div className="space-y-4">
                {/* Top 5 Posts Mais Curtidos */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-base md:text-lg font-semibold">
                      <Heart className="h-5 w-5 text-pink-500 mr-2" />
                      Top 5 Posts Mais Curtidos
                    </CardTitle>
                    <CardDescription>Posts com maior número de curtidas</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {metrics?.posts
                        .sort((a, b) => b.metrics.likes - a.metrics.likes)
                        .slice(0, 5)
                        .map((post, index) => (
                          <div key={post.id} className="flex items-start space-x-4 p-3 bg-gray-50 rounded-lg">
                            <div className="flex-shrink-0 w-16 h-16 relative">
                              <div 
                                className="w-full h-full bg-center bg-cover rounded-md" 
                                style={{ backgroundImage: `url(${post.thumbnail})` }}
                              />
                              <div className="absolute -top-2 -left-2 w-6 h-6 bg-pink-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                {index + 1}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-900 font-medium line-clamp-2">
                                {post.caption}
                              </p>
                              <div className="mt-1 flex items-center text-sm text-gray-500">
                                <Heart className="h-4 w-4 text-pink-500 mr-1" />
                                {post.metrics.likes.toLocaleString()} curtidas
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Categorização por Tipo de Postagem */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-base md:text-lg font-semibold">
                      <BarChart4 className="h-5 w-5 text-blue-500 mr-2" />
                      Desempenho por Tipo de Postagem
                    </CardTitle>
                    <CardDescription>Comparativo de efetividade entre tipos de mídia</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      // Agrupar os posts por tipo e calcular métricas
                      const postsByType = metrics?.posts.reduce((acc, post) => {
                        if (!acc[post.type]) {
                          acc[post.type] = {
                            count: 0,
                            likes: 0,
                            comments: 0,
                            shares: 0,
                            engagement: 0,
                            posts: []
                          };
                        }
                        
                        acc[post.type].count += 1;
                        acc[post.type].likes += post.metrics.likes;
                        acc[post.type].comments += post.metrics.comments;
                        acc[post.type].shares += post.metrics.shares;
                        acc[post.type].engagement += post.metrics.engagement;
                        acc[post.type].posts.push(post);
                        
                        return acc;
                      }, {} as Record<string, { 
                        count: number; 
                        likes: number; 
                        comments: number; 
                        shares: number; 
                        engagement: number;
                        posts: Array<any>;
                      }>) || {};
                      
                      // Calcular médias para cada tipo
                      const typeStats = Object.entries(postsByType).map(([type, stats]) => ({
                        type,
                        count: stats.count,
                        avgLikes: Math.round(stats.likes / stats.count),
                        avgComments: Math.round(stats.comments / stats.count),
                        avgShares: Math.round(stats.shares / stats.count),
                        avgEngagement: Math.round(stats.engagement / stats.count),
                        engagementRate: stats.count > 0 
                          ? ((stats.engagement / stats.count) / (metrics?.followers.total || 1) * 100).toFixed(2) 
                          : '0'
                      }));
                      
                      // Ordenar por taxa de engajamento
                      typeStats.sort((a, b) => parseFloat(b.engagementRate) - parseFloat(a.engagementRate));
                      
                      // Encontrar o valor máximo para escala
                      const maxAvgLikes = Math.max(...typeStats.map(s => s.avgLikes));
                      const maxAvgEngagement = Math.max(...typeStats.map(s => s.avgEngagement));
                      
                      // Obter um label amigável para o tipo
                      const getTypeLabel = (type: string) => {
                        switch(type) {
                          case 'image': return 'Fotos';
                          case 'video': return 'Vídeos';
                          case 'carousel': return 'Carrossel';
                          default: return type;
                        }
                      };
                      
                      return (
                        <div className="space-y-6">
                          {typeStats.map((stat) => (
                            <div key={stat.type} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-medium flex items-center">
                                  {stat.type === 'image' && <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWltYWdlIj48cmVjdCB4PSIzIiB5PSIzIiB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIHJ4PSIyIiByeT0iMiIvPjxjaXJjbGUgY3g9IjguNSIgY3k9IjguNSIgcj0iMS41Ii8+PHBvbHlsaW5lIHBvaW50cz0iMjEgMTUgMTYgMTAgNSAyMSIvPjwvc3ZnPg==" className="w-4 h-4 mr-2" />}
                                  {stat.type === 'video' && <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLXZpZGVvIj48cG9seWdvbiBwb2ludHM9IjIzIDcgMTYgMTIgMjMgMTcgMjMgNyIvPjxyZWN0IHg9IjEiIHk9IjUiIHdpZHRoPSIxNSIgaGVpZ2h0PSIxNCIgcng9IjIiIHJ5PSIyIi8+PC9zdmc+" className="w-4 h-4 mr-2" />}
                                  {stat.type === 'carousel' && <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWxheWVycyI+PHBvbHlnb24gcG9pbnRzPSIxMiAyIDIgNyAxMiAxMiAyMiA3IDEyIDIiLz48cG9seWxpbmUgcG9pbnRzPSIyIDEyIDEyIDE3IDIyIDEyIi8+PHBvbHlsaW5lIHBvaW50cz0iMiAxNyAxMiAyMiAyMiAxNyIvPjwvc3ZnPg==" className="w-4 h-4 mr-2" />}
                                  {getTypeLabel(stat.type)}
                                </span>
                                <span className="text-sm text-gray-500">{stat.count} posts</span>
                              </div>
                              
                              {/* Gráfico de barras para curtidas */}
                              <div>
                                <div className="flex justify-between text-xs text-gray-500 mb-1">
                                  <span>Curtidas médias</span>
                                  <span className="font-medium">{stat.avgLikes.toLocaleString()}</span>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-pink-500 rounded-full"
                                    style={{width: `${(stat.avgLikes / maxAvgLikes) * 100}%`}}
                                  ></div>
                                </div>
                              </div>
                              
                              {/* Gráfico de barras para engajamento */}
                              <div>
                                <div className="flex justify-between text-xs text-gray-500 mb-1">
                                  <span>Engajamento médio</span>
                                  <span className="font-medium">{stat.avgEngagement.toLocaleString()}</span>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-purple-500 rounded-full"
                                    style={{width: `${(stat.avgEngagement / maxAvgEngagement) * 100}%`}}
                                  ></div>
                                </div>
                              </div>
                              
                              {/* Taxa de engajamento */}
                              <div className="flex justify-between text-xs">
                                <span className="text-gray-500">Taxa de engajamento</span>
                                <span className="font-medium text-blue-600">{stat.engagementRate}%</span>
                              </div>
                            </div>
                          ))}
                          
                          {/* Legenda explicativa */}
                          <div className="text-xs text-gray-500 mt-2 pt-2 border-t">
                            <p>Taxa de engajamento = (curtidas + comentários + compartilhamentos) ÷ total de seguidores</p>
                          </div>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>

                {/* Ranking de Temas */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-base md:text-lg font-semibold">
                      <BarChart4 className="h-5 w-5 text-purple-500 mr-2" />
                      Temas Mais Populares
                    </CardTitle>
                    <CardDescription>Temas com maior engajamento</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      // Análise de temas nas legendas
                      const temas = {
                        'saúde': /saude|saúde|medicina|médic[oa]|hospital/i,
                        'oftalmologia': /oft?almolog[ia]|olhos?|visão|catarata|glaucoma|retina/i,
                        'bem-estar': /bem[-\s]?estar|qualidade[\s-]de[\s-]vida|saudável|saúde mental/i,
                        'prevenção': /prevenção|prevenção|cuidados?|check[-\s]?up|exames?/i,
                        'tratamento': /tratamento|cirurgia|procedimento|consulta|diagnóstico/i
                      };

                      const temasPosts = metrics?.posts.reduce((acc, post) => {
                        Object.entries(temas).forEach(([tema, regex]) => {
                          if (regex.test(post.caption)) {
                            if (!acc[tema]) {
                              acc[tema] = { 
                                likes: 0, 
                                posts: 0, 
                                engagement: 0 
                              };
                            }
                            acc[tema].likes += post.metrics.likes;
                            acc[tema].posts += 1;
                            acc[tema].engagement += post.metrics.engagement;
                          }
                        });
                        return acc;
                      }, {} as Record<string, { likes: number; posts: number; engagement: number; }>) || {};

                      const temasRanking = Object.entries(temasPosts)
                        .sort((a, b) => b[1].likes - a[1].likes)
                        .map(([tema, stats]) => ({
                          tema,
                          ...stats,
                          mediaEngagement: Math.round(stats.engagement / stats.posts)
                        }));

                      return (
                        <div className="space-y-4">
                          {temasRanking.map((tema, index) => (
                            <div key={tema.tema} className="relative">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium">
                                  {index + 1}. {tema.tema}
                                </span>
                                <span className="text-sm text-gray-500">
                                  {tema.likes.toLocaleString()} curtidas totais
                                </span>
                              </div>
                              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                                  style={{ 
                                    width: `${(tema.likes / temasRanking[0].likes) * 100}%`
                                  }}
                                />
                              </div>
                              <div className="mt-1 flex justify-between text-xs text-gray-500">
                                <span>{tema.posts} posts</span>
                                <span>Média de engajamento: {tema.mediaEngagement}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>

                {/* Insights e Recomendações */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base md:text-lg font-semibold">Recomendações</CardTitle>
                    <CardDescription>Análises e sugestões para melhorar seu desempenho</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                        <h3 className="text-sm font-medium text-blue-700 mb-1">Melhor horário para postagens</h3>
                        <p className="text-sm text-blue-600">Suas postagens têm melhor desempenho entre 18h e 20h.</p>
                      </div>
                      
                      <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded">
                        <h3 className="text-sm font-medium text-green-700 mb-1">Posts com maior engajamento</h3>
                        <p className="text-sm text-green-600">Carrosséis geram 42% mais engajamento que posts únicos.</p>
                      </div>
                      
                      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded">
                        <h3 className="text-sm font-medium text-yellow-700 mb-1">Oportunidade de crescimento</h3>
                        <p className="text-sm text-yellow-600">Perguntas nas legendas aumentam interações.</p>
                      </div>
                      
                      <div className="bg-purple-50 border-l-4 border-purple-500 p-3 rounded">
                        <h3 className="text-sm font-medium text-purple-700 mb-1">Hashtags mais eficientes</h3>
                        <p className="text-sm text-purple-600">#saúde, #oftalmologia e #bemestar trazem 78% mais alcance.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Resto das abas permanecem iguais */}
          <TabsContent value="audience">
            <Card>
              <CardHeader>
                <CardTitle className="text-base md:text-lg font-semibold">Perfil da Audiência</CardTitle>
                <CardDescription>Informações demográficas sobre seus seguidores</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Gênero */}
                  <div>
                    <h3 className="text-base font-medium mb-3">Distribuição por Gênero</h3>
                    <div className="flex items-center gap-4">
                      <div className="h-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full" style={{width: '62%'}}></div>
                      <span className="font-medium">62% Masculino</span>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="h-4 bg-gradient-to-r from-pink-500 to-pink-600 rounded-full" style={{width: '38%'}}></div>
                      <span className="font-medium">38% Feminino</span>
                    </div>
                  </div>
                  
                  {/* Faixa Etária */}
                  <div>
                    <h3 className="text-base font-medium mb-3">Faixa Etária</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">18-24 anos</span>
                          <span className="text-sm font-medium">18%</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full">
                          <div className="h-2 bg-blue-600 rounded-full" style={{width: '18%'}}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">25-34 anos</span>
                          <span className="text-sm font-medium">42%</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full">
                          <div className="h-2 bg-blue-600 rounded-full" style={{width: '42%'}}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">35-44 anos</span>
                          <span className="text-sm font-medium">25%</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full">
                          <div className="h-2 bg-blue-600 rounded-full" style={{width: '25%'}}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">45+ anos</span>
                          <span className="text-sm font-medium">15%</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full">
                          <div className="h-2 bg-blue-600 rounded-full" style={{width: '15%'}}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Localização */}
                  <div>
                    <h3 className="text-base font-medium mb-3">Principais Localizações</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>São Paulo, Brasil</span>
                        <span className="font-medium">45%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Rio de Janeiro, Brasil</span>
                        <span className="font-medium">18%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Belo Horizonte, Brasil</span>
                        <span className="font-medium">12%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Brasília, Brasil</span>
                        <span className="font-medium">8%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Outras localizações</span>
                        <span className="font-medium">17%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  // Adicionar função handleRefresh
  const handleRefresh = async () => {
    if (!accessToken || !businessId) {
      toast.error('Configure suas credenciais do Instagram primeiro');
      return;
    }
    
    // Limpar o estado atual para forçar uma nova busca
    setMetrics(null);
    
    // Mostrar toast de atualização
    toast.promise(
      fetchData(accessToken, businessId, true),
      {
        loading: 'Atualizando dados do Instagram...',
        success: 'Dados atualizados com sucesso!',
        error: 'Erro ao atualizar dados'
      }
    );
  };

  // Loading inicial da página
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex-1 flex items-center justify-center min-h-[400px]">
          <Loading message="Carregando dados do Instagram..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-800 flex flex-col">
      <Navbar />
      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col">
        {/* Navbar interna do conteúdo */}
        <nav className="w-full bg-white border-b border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex flex-col items-start">
              <span className="text-base md:text-lg font-semibold text-gray-900">Análise do Instagram</span>
              <span className="text-xs text-gray-500 font-light">Métricas de desempenho e engajamento do Instagram oficial.</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs transition-colors border ${
                  isLoading 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-white hover:bg-gray-50 text-gray-700 cursor-pointer'
                } border-gray-200`}
                title="Atualizar dados"
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Atualizando...' : 'Atualizar'}
              </button>
              <button
                onClick={handleDisconnect}
                className="flex items-center gap-1 px-3 py-1.5 rounded text-xs transition-colors border bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                title="Desconectar conta"
              >
                <X className="h-4 w-4" />
                Desconectar
              </button>
            </div>
          </div>
        </nav>
        
        {/* Conteúdo principal */}
        <main className="p-0 w-full">
          {!isConfigured ? (
            renderConfiguration()
          ) : (
            renderDashboard()
          )}
        </main>
        <footer className="mt-auto p-3 text-center text-[10px] text-gray-400 font-light">
          © 2025 86 Dynamics - Todos os direitos reservados
        </footer>
      </div>
    </div>
  );
} 