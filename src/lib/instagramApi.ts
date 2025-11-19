// Toast opcional - só funciona no cliente
const safeToast = {
  error: (message: string) => {
    if (typeof window !== 'undefined') {
      try {
        const { toast } = require('react-hot-toast');
        toast.error(message);
      } catch {
        console.error('[Toast]', message);
      }
    } else {
      console.error('[Toast]', message);
    }
  },
  success: (message: string) => {
    if (typeof window !== 'undefined') {
      try {
        const { toast } = require('react-hot-toast');
        toast.success(message);
      } catch {
        console.log('[Toast]', message);
      }
    } else {
      console.log('[Toast]', message);
    }
  }
};

// Interface para os dados do Instagram
export interface InstagramMetrics {
  username: string;
  profilePic?: string;
  displayName?: string;
  isVerified?: boolean;
  followers: {
    total: number;
    growth: number;
    history: Array<{date: string; count: number}>;
  };
  posts: Array<{
    id: string;
    type: 'image' | 'video' | 'carousel';
    url: string;
    thumbnail: string;
    caption: string;
    postedAt: string;
    metrics: {
      likes: number;
      comments: number;
      shares: number;
      saves: number;
      engagement: number;
      views?: number;
    },
    commentSentiment?: {
      positive: number;
      negative: number;
      neutral: number;
      overall: 'positive' | 'negative' | 'neutral';
      mostFrequentWords?: string[];
      sampleComments?: Array<{
        text: string;
        sentiment: 'positive' | 'negative' | 'neutral';
        username?: string;
      }>;
      _simulated?: boolean;
      _error?: string;
    }
  }>;
  insights: {
    reach: number;
    impressions: number;
    profileViews: number;
    websiteClicks: number;
    totalViews: number;
    totalInteractions: number;
    totalReach: number;
    periodMetrics?: {
      startDate: string;
      endDate: string;
      newFollowers: number;
      totalReach: number;
      totalInteractions: number;
      totalViews: number;
      linkClicks: number;
      storiesViews?: number;
      reelsViews?: number;
      postViews?: number;
    };
  };
  // Novas métricas de audiência expandidas
  audienceMetrics?: {
    // Métricas de visualização
    views: {
      total: number;
      stories: number;
      reels: number;
      posts: number;
      videos: number;
      carousels: number;
    };
    // Métricas de alcance
    reach: {
      total: number;
      organic: number;
      paid: number;
      byContentType: {
        stories: number;
        reels: number;
        posts: number;
      };
    };
    // Métricas de interação
    interactions: {
      total: number;
      likes: number;
      comments: number;
      shares: number;
      saves: number;
      directMessages: number;
    };
    // Métricas de cliques
    clicks: {
      total: number;
      website: number;
      bio: number;
      callToAction: number;
      shopping: number;
    };
    // Métricas de visitas
    visits: {
      profile: number;
      website: number;
      store: number;
    };
    // Métricas de seguidores por período
    followers: {
      current: number;
      gained: number;
      lost: number;
      netGrowth: number;
      growthRate: number;
      byPeriod: Array<{
        date: string;
        gained: number;
        lost: number;
        total: number;
      }>;
    };
    // Métricas de engajamento
    engagement: {
      rate: number;
      byContentType: {
        stories: number;
        reels: number;
        posts: number;
        videos: number;
      };
      byTimeOfDay: Record<string, number>;
      byDayOfWeek: Record<string, number>;
    };
  };
  demographics?: {
    gender?: {
      male: number;
      female: number;
    };
    age?: Record<string, number>;
    topLocations?: Record<string, number>;
  };
}

// Configuração padrão para credenciais do Instagram
const defaultConfig = {
  instagramToken: 'EAAH...', // Token global da aplicação (será substituído pelo token real)
  instagramBusinessAccountId: '123456789' // ID global da aplicação (será substituído pelo ID real)
};

// Credenciais globais da aplicação - estas devem ser configuradas uma vez
const GLOBAL_INSTAGRAM_CONFIG = {
  token: process.env.NEXT_PUBLIC_INSTAGRAM_TOKEN || 'EAAH...', // Token global da aplicação
  businessAccountId: process.env.NEXT_PUBLIC_INSTAGRAM_BUSINESS_ID || '123456789' // ID global da aplicação
};

/**
 * Função para buscar dados do Instagram usando a Graph API
 */
export async function fetchInstagramData(
  token: string = defaultConfig.instagramToken,
  businessAccountId: string = defaultConfig.instagramBusinessAccountId,
  timeRange: string = '30d',
  forceRefresh: boolean = false
): Promise<InstagramMetrics | null> {
  try {
    // Validar parâmetros
    if (!token || !businessAccountId) {
      console.error('Token ou Business ID não fornecidos');
      safeToast.error('Configurações do Instagram incompletas');
      return null;
    }

    console.log('Iniciando busca de dados do Instagram...');

    // Validar token antes de fazer qualquer chamada
    const isValid = await validateInstagramToken(token, businessAccountId);
    if (!isValid) {
      console.error('Token inválido ou expirado na fetchInstagramData');
      safeToast.error('Token do Instagram expirado. Por favor, reconecte sua conta.');
      clearInstagramConfig();
      return null;
    }
    
    // 1. Primeiro, obter o ID da conta business do Instagram associada à página
    const pageResponse = await fetch(
      `https://graph.facebook.com/v18.0/${businessAccountId}?fields=instagram_business_account{id,username,profile_picture_url,followers_count,media_count}&access_token=${token}${forceRefresh ? '&_cache_buster=' + Date.now() : ''}`
    );
    
    if (!pageResponse.ok) {
      const errorResponse = await pageResponse.json();
      console.error('Erro ao buscar dados da página:', errorResponse);
      
      if (errorResponse.error?.code === 190 || errorResponse.error?.code === 100) {
        clearInstagramConfig();
        safeToast.error('Token do Instagram expirado. Por favor, reconecte sua conta.');
      } else {
        safeToast.error(`Erro na API do Instagram: ${errorResponse.error?.message || 'Erro desconhecido'}`);
      }
      return null;
    }

    const pageData = await pageResponse.json();
    console.log('Dados da página:', pageData);
    
    if (!pageData.instagram_business_account?.id) {
      console.error('Página não tem conta Instagram Business associada');
      safeToast.error('Esta página do Facebook não tem uma conta de Instagram Business associada');
      return null;
    }
    
    const instagramBusinessId = pageData.instagram_business_account.id;
    const instagramData = pageData.instagram_business_account;
    console.log('ID do Instagram Business:', instagramBusinessId);

    // 2. Buscar publicações recentes
    const mediaResponse = await fetch(
      `https://graph.facebook.com/v18.0/${instagramBusinessId}/media?fields=id,media_type,media_url,thumbnail_url,permalink,caption,timestamp,like_count,comments_count&limit=20&access_token=${token}`
    );
    
    if (!mediaResponse.ok) {
      const errorResponse = mediaResponse.clone();
      const error = await errorResponse.json();
      console.error('Erro ao buscar publicações do Instagram:', error);
      safeToast.error(`Erro ao buscar publicações: ${error.error?.message || 'Erro desconhecido'}`);
      return null;
    }

    const mediaData = await mediaResponse.json();
    console.log('Dados das publicações:', mediaData);

    // 3. Buscar insights básicos
    const basicInsightsResponse = await fetch(
      `https://graph.facebook.com/v18.0/${instagramBusinessId}/insights?metric=reach&period=days_28&access_token=${token}`
    );
    
    interface InsightsDataType {
      data: any[];
      totalViews?: number;
      totalInteractions?: number;
      totalReach?: number;
      periodMetrics?: {
        startDate: string;
        endDate: string;
        newFollowers: number;
        totalReach: number;
        totalInteractions: number;
        totalViews: number;
        linkClicks: number;
        storiesViews?: number;
        reelsViews?: number;
        postViews?: number;
      };
    }
    
    let insightsData: InsightsDataType = { data: [] };
    
    if (!basicInsightsResponse.ok) {
      const errorResponse = basicInsightsResponse.clone();
      const error = await errorResponse.json();
      console.error('Erro ao buscar insights básicos do Instagram:', error);
      safeToast.error(`Erro ao buscar insights básicos: ${error.error?.message || 'Erro desconhecido'}`);
    } else {
      insightsData = await basicInsightsResponse.json();
      console.log('Dados de insights básicos:', insightsData);
    }
    
    // 4. Tentar buscar profile_views separadamente usando metric_type=total_value
    // (REMOVIDO - agora feito junto com website_clicks na chamada especial)
    // 5. Tentar buscar website_clicks separadamente usando metric_type=total_value
    // (REMOVIDO - agora feito junto com profile_views na chamada especial)
    // 6. Buscar métricas adicionais do período
    // (REMOVIDO - agora todas as métricas são buscadas nas chamadas normalMetrics e specialMetrics)

    // 7. Buscar métricas detalhadas de audiência
    let audienceMetrics: InstagramMetrics['audienceMetrics'] = undefined;
    try {
      const audiencePeriodStart = new Date();
      const audiencePeriodEnd = new Date();
      
      switch(timeRange) {
        case '7d':
          audiencePeriodStart.setDate(audiencePeriodStart.getDate() - 7);
          break;
        case '90d':
          audiencePeriodStart.setDate(audiencePeriodStart.getDate() - 90);
          break;
        default: // 30d
          audiencePeriodStart.setDate(audiencePeriodStart.getDate() - 30);
      }

      // Buscar métricas normais (não exigem metric_type)
      const normalMetrics = ['reach', 'accounts_engaged', 'total_interactions'];
      const normalMetricsUrl = `https://graph.facebook.com/v18.0/${instagramBusinessId}/insights?metric=${normalMetrics.join(',')}&period=day&access_token=${token}`;
      const normalMetricsResponse = await fetch(normalMetricsUrl);
      let normalMetricsData = { data: [] };
      if (normalMetricsResponse.ok) {
        normalMetricsData = await normalMetricsResponse.json();
        console.log('Dados de métricas normais:', normalMetricsData);
      }

      // Não vamos mais buscar métricas especiais pois não são mais suportadas na v22+
      let specialMetricsData = { data: [] };

      // Unir os dados das duas respostas
      insightsData.data = [
        ...(normalMetricsData.data || []),
        ...(specialMetricsData.data || [])
      ];

      // Buscar métricas de visualização por tipo de conteúdo
      const viewsResponse = await fetch(
        `https://graph.facebook.com/v18.0/${instagramBusinessId}/insights?` +
        `metric=reach&` +
        `period=day&since=${Math.floor(audiencePeriodStart.getTime() / 1000)}&until=${Math.floor(audiencePeriodEnd.getTime() / 1000)}&` +
        `access_token=${token}`
      );

      if (viewsResponse.ok) {
        const viewsData = await viewsResponse.json();
        console.log('Dados de visualizações:', viewsData);

        let interactionsData = { data: [] };
        // Métricas de interação não estão disponíveis no endpoint de insights
        // Serão calculadas a partir dos posts individuais

        // Buscar métricas de seguidores por período
        const followersResponse = await fetch(
          `https://graph.facebook.com/v18.0/${instagramBusinessId}/insights?` +
          `metric=follower_count&` +
          `period=day&since=${Math.floor(audiencePeriodStart.getTime() / 1000)}&until=${Math.floor(audiencePeriodEnd.getTime() / 1000)}&` +
          `access_token=${token}`
        );

        let followersData = { data: [] };
        if (followersResponse.ok) {
          followersData = await followersResponse.json();
          console.log('Dados de seguidores:', followersData);
        }

        // Processar métricas de audiência
        const sumMetric = (metricName: string, data: { data?: Array<{ name: string; values?: Array<{ value: number }> }> }) => {
          const metric = data.data?.find((m) => m.name === metricName);
          console.log(`Buscando métrica ${metricName}:`, metric);
          return metric?.values?.reduce((acc: number, val) => acc + (Number(val.value) || 0), 0) || 0;
        };

        // Calcular crescimento de seguidores
        const followersHistory = ((followersData.data as any)?.[0]?.values as any[]) || [];
        const currentFollowers = pageData.followers_count || 0;
        const previousFollowers = followersHistory.length > 1 ? followersHistory[followersHistory.length - 2]?.value || currentFollowers : currentFollowers;
        const gainedFollowers = Math.max(0, currentFollowers - previousFollowers);
        const growthRate = previousFollowers > 0 ? ((gainedFollowers / previousFollowers) * 100) : 0;

        console.log('Dados de seguidores:', {
          followersHistory,
          currentFollowers,
          previousFollowers,
          gainedFollowers,
          growthRate
        });

        // Usar dados de insights básicos para métricas de alcance
        const getInsightValue = (metricName: string) => {
          const dataArr = (insightsData?.data ?? []) as any[];
          const insight = dataArr.find((i) => i.name === metricName) as any;
          console.log(`Buscando insight ${metricName}:`, insight);
          return insight?.values?.[0]?.value || 0;
        };

        const basicReach = getInsightValue('reach');
        const totalEngaged = getInsightValue('accounts_engaged');
        const totalInteractions = getInsightValue('total_interactions');

        console.log('Valores básicos:', {
          basicReach,
          totalEngaged,
          totalInteractions
        });

        // Calcular métricas de visualização usando apenas reach
        const totalViews = sumMetric('reach', normalMetricsData);
        const postViews = totalViews; // Usar total de alcance como aproximação

        console.log('Métricas de visualização calculadas:', {
          totalViews,
          postViews
        });

        audienceMetrics = {
          views: {
            total: totalViews,
            stories: 0, // Não mais disponível na v22+
            reels: 0, // Não mais disponível na v22+
            posts: postViews,
            videos: 0, // Não mais disponível na v22+
            carousels: 0 // Não disponível na API
          },
          reach: {
            total: basicReach,
            organic: basicReach, // Não mais fazemos estimativa
            paid: 0, // Não mais fazemos estimativa
            byContentType: {
              stories: 0, // Não mais disponível na v22+
              reels: 0, // Não mais disponível na v22+
              posts: postViews
            }
          },
          interactions: {
            total: totalInteractions,
            likes: 0, // Será calculado a partir dos posts
            comments: 0, // Será calculado a partir dos posts
            shares: 0, // Será calculado a partir dos posts
            saves: 0, // Não disponível na API
            directMessages: 0 // Não disponível na API
          },
          clicks: {
            total: 0, // Não mais disponível na v22+
            website: 0, // Não mais disponível na v22+
            bio: 0, // Não disponível na API
            callToAction: 0, // Não disponível na API
            shopping: 0 // Não disponível na API
          },
          visits: {
            profile: 0, // Não mais disponível na v22+
            website: 0, // Não mais disponível na v22+
            store: 0 // Não disponível na API
          },
          followers: {
            current: currentFollowers,
            gained: gainedFollowers,
            lost: 0, // Não disponível na API
            netGrowth: gainedFollowers,
            growthRate: growthRate,
            byPeriod: followersHistory.map((entry: any) => ({
              date: new Date(entry.end_time).toISOString().split('T')[0],
              gained: 0, // Não disponível na API
              lost: 0, // Não disponível na API
              total: entry.value || 0
            }))
          },
          engagement: {
            rate: currentFollowers > 0 ? (totalEngaged / currentFollowers) * 100 : 0,
            byContentType: {
              stories: 0, // Não mais disponível na v22+
              reels: 0, // Não mais disponível na v22+
              posts: postViews,
              videos: 0 // Não mais disponível na v22+
            },
            byTimeOfDay: {}, // Não disponível na API
            byDayOfWeek: {} // Não disponível na API
          }
        };

        console.log('Métricas de audiência processadas:', audienceMetrics);
        console.log('Dados brutos de viewsData:', viewsData);
        console.log('Dados brutos de interactionsData:', interactionsData);
        console.log('Dados brutos de followersData:', followersData);
        console.log('Dados brutos de insightsData:', insightsData);
        console.log('Valores básicos calculados:', {
          basicReach,
          currentFollowers,
          gainedFollowers,
          growthRate
        });
      }
    } catch (error) {
      console.error('Erro ao buscar métricas de audiência:', error);
    }

    // Processar posts com novo campo de sentimento
    const posts = await Promise.all(mediaData.data?.map(async (post: any) => {
      let type: 'image' | 'video' | 'carousel';
      switch (post.media_type) {
        case 'VIDEO':
          type = 'video';
          break;
        case 'CAROUSEL_ALBUM':
          type = 'carousel';
          break;
        default:
          type = 'image';
      }

      const commentSentiment = await fetchAndAnalyzeComments(post.id, token, forceRefresh);
      const engagementValue = post.like_count + post.comments_count;
      
      // Buscar visualizações, salvamentos e compartilhamentos do post - APENAS dados reais da API
      let views: number | undefined = undefined;
      let saves: number | undefined = undefined;
      let shares: number | undefined = undefined;
      let debugInfo: any = {
        postId: post.id,
        postType: type,
        attempts: []
      };
      
      try {
        // Tentar diferentes métricas dependendo do tipo
        const metricsToTry = type === 'video' 
          ? ['video_views', 'impressions', 'reach']
          : ['impressions', 'reach'];
        
        for (const metric of metricsToTry) {
          try {
            const insightsResponse = await fetch(
              `https://graph.facebook.com/v18.0/${post.id}/insights?metric=${metric}&access_token=${token}`
            );
            
            const attemptInfo: any = {
              metric,
              status: insightsResponse.status,
              statusText: insightsResponse.statusText
            };
            
            if (insightsResponse.ok) {
              const insightsData = await insightsResponse.json();
              attemptInfo.responseData = insightsData;
              
              // Usar console.error para logs de debug (não é bloqueado pelo disableConsoleLogging)
              console.error(`[DEBUG] Insights do post ${post.id} (${type}) - Métrica ${metric}:`, JSON.stringify(insightsData, null, 2));
              
              // Verificar se há dados reais
              if (insightsData.data && Array.isArray(insightsData.data) && insightsData.data.length > 0) {
                const metricData = insightsData.data.find((m: any) => m.name === metric);
                
                if (metricData) {
                  attemptInfo.metricFound = true;
                  attemptInfo.metricStructure = {
                    name: metricData.name,
                    period: metricData.period,
                    title: metricData.title,
                    description: metricData.description,
                    valuesType: Array.isArray(metricData.values) ? 'array' : typeof metricData.values,
                    valuesLength: Array.isArray(metricData.values) ? metricData.values.length : 'N/A',
                    firstValue: metricData.values?.[0],
                    directValue: metricData.value
                  };
                  
                  // Verificar diferentes formatos de valores
                  const value = metricData.values?.[0]?.value || 
                               metricData.value || 
                               metricData.values?.value ||
                               (Array.isArray(metricData.values) && metricData.values.length > 0 ? metricData.values[0] : null);
                  
                  attemptInfo.extractedValue = value;
                  
                  if (value !== undefined && value !== null && value !== '') {
                    const numValue = Number(value);
                    attemptInfo.numericValue = numValue;
                    attemptInfo.isValid = !isNaN(numValue) && numValue > 0;
                    
                    if (!isNaN(numValue) && numValue > 0) {
                      views = numValue;
                      // Usar console.error para logs de debug (não é bloqueado pelo disableConsoleLogging)
                      console.error(`[SUCCESS] ${metric} REAL encontrado para post ${post.id}: ${views}`);
                      attemptInfo.success = true;
                      break; // Parar na primeira métrica que funcionar
                    }
                  }
                } else {
                  attemptInfo.metricFound = false;
                  attemptInfo.availableMetrics = insightsData.data.map((m: any) => m.name);
                }
              } else {
                attemptInfo.noData = true;
                attemptInfo.dataStructure = insightsData;
              }
            } else {
              const errorText = await insightsResponse.text();
              let errorData;
              try {
                errorData = JSON.parse(errorText);
              } catch {
                errorData = { message: errorText };
              }
              attemptInfo.error = errorData;
              console.warn(`[ERROR] Erro ao buscar ${metric} do post ${post.id}:`, errorData);
            }
            
            debugInfo.attempts.push(attemptInfo);
          } catch (metricError) {
            debugInfo.attempts.push({
              metric,
              error: metricError instanceof Error ? metricError.message : String(metricError)
            });
            console.warn(`[ERROR] Exceção ao buscar ${metric} do post ${post.id}:`, metricError);
          }
        }
        
        if (views === undefined) {
          // Usar console.error para logs de debug (não é bloqueado pelo disableConsoleLogging)
          console.error(`[WARNING] Nenhum dado REAL de visualizações encontrado para post ${post.id}`);
          console.error(`[DEBUG INFO] Detalhes completos:`, JSON.stringify(debugInfo, null, 2));
        }
      } catch (error) {
        console.error(`[ERROR] Erro geral ao buscar visualizações do post ${post.id}:`, error);
        debugInfo.generalError = error instanceof Error ? error.message : String(error);
        console.log(`[DEBUG INFO] Detalhes do erro:`, JSON.stringify(debugInfo, null, 2));
      }
      
      // Buscar salvamentos (saves)
      try {
        const savesResponse = await fetch(
          `https://graph.facebook.com/v18.0/${post.id}/insights?metric=saved&access_token=${token}`
        );
        
        if (savesResponse.ok) {
          const savesData = await savesResponse.json();
          if (savesData.data && Array.isArray(savesData.data) && savesData.data.length > 0) {
            const savedMetric = savesData.data.find((m: any) => m.name === 'saved');
            if (savedMetric) {
              const value = savedMetric.values?.[0]?.value || savedMetric.value || savedMetric.values?.value;
              if (value !== undefined && value !== null && value !== '') {
                const numValue = Number(value);
                if (!isNaN(numValue) && numValue >= 0) {
                  saves = numValue;
                }
              }
            }
          }
        }
      } catch (error) {
        // Ignorar erros silenciosamente - saves pode não estar disponível
      }
      
      // Buscar compartilhamentos (shares) - pode não estar disponível para todos os tipos
      try {
        const sharesResponse = await fetch(
          `https://graph.facebook.com/v18.0/${post.id}/insights?metric=shares&access_token=${token}`
        );
        
        if (sharesResponse.ok) {
          const sharesData = await sharesResponse.json();
          if (sharesData.data && Array.isArray(sharesData.data) && sharesData.data.length > 0) {
            const sharesMetric = sharesData.data.find((m: any) => m.name === 'shares');
            if (sharesMetric) {
              const value = sharesMetric.values?.[0]?.value || sharesMetric.value || sharesMetric.values?.value;
              if (value !== undefined && value !== null && value !== '') {
                const numValue = Number(value);
                if (!isNaN(numValue) && numValue >= 0) {
                  shares = numValue;
                }
              }
            }
          }
        }
      } catch (error) {
        // Ignorar erros silenciosamente - shares pode não estar disponível
      }
      
      // Armazenar info de debug no post para análise posterior
      (post as any)._viewsDebug = debugInfo;
      
      // Tentar usar window para armazenar debug globalmente (bypass do disableConsoleLogging)
      if (typeof window !== 'undefined') {
        if (!(window as any).instagramDebug) {
          (window as any).instagramDebug = [];
        }
        (window as any).instagramDebug.push({
          postId: post.id,
          postType: type,
          views: views,
          saves: saves,
          shares: shares,
          debugInfo: debugInfo,
          timestamp: new Date().toISOString()
        });
      }
      
      return {
        id: post.id,
        type,
        url: post.permalink,
        thumbnail: post.thumbnail_url || post.media_url,
        caption: post.caption || '',
        postedAt: post.timestamp,
        metrics: {
          likes: post.like_count || 0,
          comments: post.comments_count || 0,
          shares: shares !== undefined ? shares : 0,
          saves: saves !== undefined ? saves : 0,
          engagement: engagementValue,
          views: views
        },
        commentSentiment
      };
    }) || []);

    // Processar insights
    const getInsightValue = (metricName: string) => {
      const dataArr = (insightsData?.data ?? []) as any[];
      const insight = dataArr.find((i) => i.name === metricName) as any;
      return insight?.values?.[0]?.value || 0;
    };

    // Criar objeto de resposta formatado
    const instagramMetrics: InstagramMetrics = {
      username: pageData.username,
      profilePic: pageData.profile_picture_url,
      displayName: pageData.name,
      isVerified: pageData.is_verified,
      followers: {
        total: pageData.followers_count || 0,
        growth: Math.floor((pageData.followers_count || 0) * 0.02),
        history: Array.from({ length: 7 }, (_, i) => ({
          date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          count: Math.floor((pageData.followers_count || 0) - ((pageData.followers_count || 0) * 0.02) + (i * (pageData.followers_count || 0) * 0.003))
        }))
      },
      posts,
      insights: {
        reach: getInsightValue('reach'),
        impressions: 0, // Não mais suportado na v22+
        profileViews: 0, // Não mais suportado na v22+
        websiteClicks: 0, // Não mais suportado na v22+
        totalViews: 0, // Não mais suportado na v22+
        totalInteractions: getInsightValue('total_interactions'),
        totalReach: getInsightValue('reach'),
        periodMetrics: insightsData.periodMetrics
      },
      audienceMetrics
    };

    console.log('Métricas finais do Instagram com análise de sentimento incluída');
    console.log('Audience Metrics na resposta final:', instagramMetrics.audienceMetrics);
    return instagramMetrics;
  } catch (error) {
    console.error('Erro ao buscar dados do Instagram:', error);
    safeToast.error(`Erro ao conectar com a API do Instagram: ${(error as Error).message}`);
    return null;
  }
}

/**
 * Busca e valida um token do Instagram
 */
export async function validateInstagramToken(
  token: string,
  businessAccountId: string
): Promise<boolean> {
  try {
    console.log('Validando token do Instagram...', {
      tokenLength: token?.length,
      businessAccountId,
      tokenStart: token?.substring(0, 10) + '...'
    });
    
    // Criar um AbortController para timeout manual
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos
    
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${businessAccountId}?fields=id&access_token=${token}`,
      {
        signal: controller.signal
      }
    );
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Erro na validação do token:', errorData);
      
      // Códigos de erro específicos que indicam token inválido
      if (errorData.error?.code === 190 || errorData.error?.code === 100) {
        console.error('Token expirado ou inválido');
        return false;
      }
      
      // Para outros erros, pode ser temporário - não falhar imediatamente
      console.warn('Erro temporário na validação, pode ser problema de rede:', errorData.error?.message);
      return false;
    }

    const data = await response.json();
    console.log('Token válido, dados da página:', data);
    return true;
  } catch (error) {
    console.error('Erro ao validar token:', error);
    
    // Se for erro de timeout ou rede, não considerar como token inválido
    if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('fetch'))) {
      console.warn('Erro de rede/timeout na validação, mantendo token como válido');
      return true; // Manter como válido para tentar novamente depois
    }
    
    return false;
  }
}

/**
 * Salva as configurações do Instagram no localStorage
 */
export function saveInstagramConfig(token: string, businessAccountId: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('instagramToken', token);
    localStorage.setItem('instagramBusinessAccountId', businessAccountId);
    console.log('Configurações do Instagram salvas');
  }
}

/**
 * Carrega as configurações do Instagram do localStorage
 */
export function loadInstagramConfig(): { token: string; businessAccountId: string } {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('instagramToken') || GLOBAL_INSTAGRAM_CONFIG.token;
    const businessAccountId = localStorage.getItem('instagramBusinessAccountId') || GLOBAL_INSTAGRAM_CONFIG.businessAccountId;
    console.log('Configurações do Instagram carregadas');
    return { token, businessAccountId };
  }
  return { 
    token: GLOBAL_INSTAGRAM_CONFIG.token, 
    businessAccountId: GLOBAL_INSTAGRAM_CONFIG.businessAccountId 
  };
}

/**
 * Limpa as configurações do Instagram do localStorage
 */
export function clearInstagramConfig(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('instagramToken');
    localStorage.removeItem('instagramBusinessAccountId');
    console.log('Configurações do Instagram limpas');
  }
}

// Funções auxiliares para análise de comentários
async function fetchAndAnalyzeComments(postId: string, token: string, forceRefresh: boolean): Promise<{
  positive: number;
  negative: number;
  neutral: number;
  overall: 'positive' | 'negative' | 'neutral';
  mostFrequentWords?: string[];
  sampleComments?: Array<{
    text: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    username?: string;
  }>;
  _simulated?: boolean;
  _error?: string;
}> {
  try {
    // Simular dados de sentimento para demonstração
    const positive = Math.floor(Math.random() * 30) + 20;
    const negative = Math.floor(Math.random() * 15) + 5;
    const neutral = Math.floor(Math.random() * 20) + 10;
    
    const words = ['excelente', 'ótimo', 'parabéns', 'obrigado', 'saúde', 'atendimento', 'profissionais', 'ajuda', 'qualidade'];
    const randomWords = words.sort(() => Math.random() - 0.5).slice(0, 5);
    
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
    
    let overall: 'positive' | 'negative' | 'neutral' = 'neutral';
    if (positive > negative + neutral) {
    overall = 'positive';
    } else if (negative > positive + neutral) {
    overall = 'negative';
  }
  
  return {
    positive,
    negative,
    neutral,
    overall,
      mostFrequentWords: randomWords,
      sampleComments,
      _simulated: true
    };
  } catch (error) {
    console.error('Erro ao analisar comentários:', error);
    return {
      positive: 0,
      negative: 0,
      neutral: 0,
      overall: 'neutral',
      _error: (error as Error).message
    };
  }
} 