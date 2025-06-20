'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { LucideIcon, LogOut, Settings, User as UserIcon, Search, ChevronDown, Loader2, ArrowRight } from 'lucide-react';
import * as Icons from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getApplications } from "@/lib/storage";
import { logout, getCurrentUser } from '@/lib/auth';
import { disableConsoleLogging } from '@/lib/logger';

// Interfaces definidas localmente
interface AppUser {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions?: string[];
}

interface Application {
  id: string;
  name: string;
  description: string;
  icon: string;
  href: string;
  isActive: boolean;
}

// Função para buscar o ícone adequado
const getDynamicIcon = (iconName: string): LucideIcon => {
  const Icon = (Icons as any)[iconName] || Icons.LayoutDashboard;
  return Icon;
};

export default function ApplicationsDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<AppUser | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [greeting, setGreeting] = useState<string>('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [visibleApps, setVisibleApps] = useState<string[]>([]);

  // Função para verificar se há alguma aplicação disponível para o usuário
  const hasVisibleApps = () => {
    // Se o usuário é admin, sempre tem acesso a todas as aplicações
    if (user?.role === 'admin') return true;
    
    // Verificar se há aplicações visíveis além do painel-aplicacoes
    return visibleApps.some(app => app !== 'painel-aplicacoes') && visibleApps.length > 1;
  };

  // Função para definir a saudação de acordo com o horário
  const updateGreeting = () => {
    const currentHour = new Date().getHours();
    let newGreeting = '';
    
    if (currentHour >= 5 && currentHour < 12) {
      newGreeting = 'Bom dia';
    } else if (currentHour >= 12 && currentHour < 18) {
      newGreeting = 'Boa tarde';
    } else {
      newGreeting = 'Boa noite';
    }
    
    setGreeting(newGreeting);
  };

  // Função para buscar dados do usuário atual
  const fetchUserData = async () => {
    try {
      const userData = await getCurrentUser();
      
      if (userData) {
        // Se temos dados do usuário, usar dados da API
        setUser(userData);
        updateGreeting();
        // Limpar qualquer erro anterior
        setError(null);
      } else {
        // Verificar se já estávamos com um usuário definido
        if (!user) {
          // Caso contrário, usar dados padrão apenas se não tivermos dados anteriores
          setUser({
            id: '1',
            name: 'Usuário',
            email: 'usuario@exemplo.com',
            role: 'admin',
            permissions: []
          });
          updateGreeting();
        }
      }
    } catch (err) {
      // Erro silencioso - não exibir logs por segurança
      
      // Mostrar mensagem toast apenas se for erro de conexão
      if (err instanceof Error && (
        err.message.includes('network') || 
        err.message.includes('connection') ||
        err.message.includes('offline')
      )) {
        toast.error('Não foi possível conectar ao servidor. Verifique sua conexão.', {
          id: 'connection-error', // ID único para evitar duplicados
          duration: 3000,
        });
      }
      
      // Em caso de erro, manter os dados do usuário atual se houver, ou usar padrão
      if (!user) {
        setUser({
          id: '1',
          name: 'Usuário',
          email: 'usuario@exemplo.com',
          role: 'admin',
          permissions: []
        });
        updateGreeting();
      }
    } finally {
      if (isLoading) {
        setIsLoading(false);
      }
    }
  };

  // Marcar esta página como origem de navegação e inicializar dados
  useEffect(() => {
    // Desabilitar logs globalmente para proteção de dados
    if (typeof window !== 'undefined') {
      disableConsoleLogging();
    }

    // Armazenar informação que o usuário está no painel
    sessionStorage.setItem('lastRoute', '/painel-aplicacoes');
    localStorage.setItem('fromAuthorizedRoute', 'true');
    
    // Atualizar saudação baseada no horário
    updateGreeting();
    
    // Definir dados padrão imediatamente
    const defaultApps = getApplications();
    setApplications(defaultApps || []);
    
    // Buscar dados do usuário
    fetchUserData();
    
    return () => {
      // Ao desmontar, registrar que o componente foi desmontado normalmente
      sessionStorage.setItem('panelUnmounted', 'true');
    };
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  // Atualizar dados do usuário periodicamente
  useEffect(() => {
    // Verificar dados do usuário a cada 2 minutos
    const intervalId = setInterval(() => {
      fetchUserData();
    }, 2 * 60 * 1000); // 2 minutos
    
    // Limpar intervalo ao desmontar
    return () => clearInterval(intervalId);
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps
  
  // Filtrar aplicações baseado nas permissões
  useEffect(() => {
    const newVisibleApps = applications
      .filter(app => app.isActive)
      .map(app => app.id);
    setVisibleApps(newVisibleApps);
  }, [user]);

  // Atualizar a lista de aplicações visíveis com base nas permissões do usuário
  useEffect(() => {
    if (!user) return;
    
    // Lista de todos os IDs de aplicações
    const allAppIds = [
      "acoes",
      "obras_demandas",
      "emendas2025",
      "baseliderancas",
      "projecao2026",
      "instagram-analytics",
      "gerenciar-usuarios",
      "configuracoes",
      "painel-aplicacoes"
    ];
    
    // Filtrar aplicações com base nas permissões
    const newVisibleApps = allAppIds.filter(appId => 
      user.role === 'admin' || 
      appId === "painel-aplicacoes" || 
      (user.permissions && user.permissions.includes(appId))
    );
    
    // Aplicações visíveis - dados protegidos
    setVisibleApps(newVisibleApps);
  }, [user]);
  
  // Atualizar saudação a cada hora
  useEffect(() => {
    // Atualizar a saudação inicialmente
    updateGreeting();
    
    // Configurar intervalo para atualizar a cada hora
    const intervalId = setInterval(() => {
      updateGreeting();
    }, 60 * 60 * 1000); // 1 hora
    
    return () => clearInterval(intervalId);
  }, []);

  const handleLogout = async () => {
    try {
      // Indicar que o logout está em progresso
      setIsLoggingOut(true);
      
      // Exibir feedback para o usuário
      toast.loading('Saindo do sistema...', { id: 'logout' });
      
      // Limpar marcadores de rota antes do logout
      sessionStorage.removeItem('lastRoute');
      localStorage.removeItem('fromAuthorizedRoute');
      
      // Usar a função de logout aprimorada
      const logoutSuccess = await logout();
      
      if (logoutSuccess) {
        toast.success('Logout realizado com sucesso', { id: 'logout' });
      } else {
        toast.error('Não foi possível realizar o logout. Tente novamente.', { id: 'logout' });
      }
      
      // Forçar redirecionamento para a página inicial em qualquer caso
      router.push('/');
      
      // Em caso de problemas com o router, fazer um redirecionamento alternativo
      setTimeout(() => {
        window.location.href = '/';
      }, 500);
    } catch (err) {
      console.error('Erro ao fazer logout:', err);
      toast.error('Erro ao fazer logout. Por favor, tente novamente.', { id: 'logout' });
      
      // Mesmo com erro, tentar redirecionar
      router.push('/');
    } finally {
      // Resetar estado de logout mesmo em caso de erro
      setIsLoggingOut(false);
    }
  };

  // Função para renderizar um card
  const renderCard = (title: string, description: string, icon: React.ReactNode, href: string, bgColor: string = "from-blue-600 to-blue-500", appId: string, extraLinks?: { label: string, href: string }[]) => {
    // Verificar se o card deve ser visível com base nas permissões
    if (!visibleApps.includes(appId) && appId !== 'painel-aplicacoes') {
      return null;
    }
    
    return (
      <motion.div 
        className="bg-white border border-gray-200 rounded-xl overflow-hidden transition-shadow hover:shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      >
        <div className="p-7">
          <div className="flex items-center mb-3">
            <div className="relative w-8 h-8 rounded-full flex items-center justify-center border border-gray-100 overflow-hidden group mr-3">
              <motion.div 
                className="text-gray-600 group-hover:text-gray-800 transition-colors"
                whileHover={{ rotate: [0, -5, 5, -5, 0], transition: { duration: 0.5 } }}
                animate={{ scale: [1, 1.05, 1], transition: { duration: 2, repeat: Infinity, repeatType: "reverse" } }}
              >
                {icon}
              </motion.div>
              <div className="absolute inset-0 bg-gray-50 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            </div>
            <h3 className="text-sm font-medium text-gray-800">{title}</h3>
          </div>
          <div className="flex flex-col gap-1">
            <Link href={href} className="flex items-center gap-1 text-gray-700 hover:underline text-xs font-light min-h-[28px] w-fit">
              <span>{description}</span>
              <ArrowRight className="h-3 w-3 text-gray-400 ml-1" />
            </Link>
            {extraLinks && extraLinks.map((link, idx) => (
              <Link key={idx} href={link.href} className="flex items-center gap-1 text-gray-700 hover:underline text-xs font-light w-fit">
                <span>{link.label}</span>
                <ArrowRight className="h-3 w-3 text-gray-400 ml-1" />
              </Link>
            ))}
          </div>
        </div>
      </motion.div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white text-gray-800 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-2 border-gray-200 animate-ping"></div>
            <div className="absolute inset-0 rounded-full border-t-2 border-blue-500 animate-spin"></div>
            <Loader2 className="h-12 w-12 absolute inset-0 text-blue-500 animate-pulse opacity-75" />
          </div>
          <p className="text-gray-500 font-light mt-4 text-sm">Carregando aplicações...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white text-gray-800 flex items-center justify-center">
        <div className="flex flex-col items-center text-center max-w-md p-6 bg-gray-50 border border-gray-200 rounded-lg shadow-sm">
          <div className="text-red-500 text-lg font-light mb-3">Erro ao carregar dados</div>
          <p className="text-gray-500 mb-5 font-light text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 rounded-full text-xs font-light transition-colors text-gray-700"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-800">
      {/* Header */}
      <header className="bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-4">
          <div className="flex justify-between items-center py-3">
            {/* Removido bloco do usuário do header */}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-[1800px] 2xl:max-w-[2400px] 3xl:max-w-full mx-auto px-8 py-12 bg-white">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Coluna da imagem + bloco do usuário */}
          <div className="flex-shrink-0 flex flex-col items-center md:items-end justify-center w-full md:w-1/3 lg:w-1/4 mb-8 md:mb-0">
            <div className="w-64 h-64 rounded-full shadow-xl border-4 border-white bg-gradient-to-r from-blue-50 to-blue-100 flex items-center justify-center overflow-hidden p-1">
              <img
                src="/avatar-banner.png"
                alt="Dono da aplicação"
                className="w-full h-full object-contain translate-y-2"
              />
            </div>
            <div className="mt-4 flex flex-col items-center">
              <div className="text-lg md:text-xl font-semibold text-gray-800 text-center">HUB de Aplicações Deputado Federal Jadyel Alencar</div>
            </div>
            {user && (
              <div className="flex flex-col items-center mt-32 md:mt-0 md:justify-center w-full">
                <div className="flex flex-col items-center gap-1 px-3 py-1.5">
                  <div className="relative mb-1">
                    <UserIcon className="h-4 w-4 text-gray-500" />
                    {/* Indicador de status online */}
                    <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-400 rounded-full border border-white"></div>
                  </div>
                  <div className="text-xs text-gray-700 font-normal text-center">
                    {greeting}, {user.name}
                  </div>
                  <div className="flex flex-col items-center mt-1">
                    <span className="text-[11px] text-gray-500 font-light flex items-center gap-1">
                      {user.role === 'admin' ? (
                        <>
                          <Icons.ShieldCheck className="h-3 w-3" />
                          Administrador
                        </>
                      ) : (
                        <>
                          <Icons.User className="h-3 w-3" />
                          Usuário
                        </>
                      )}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs transition-colors border mt-2 ${
                    isLoggingOut 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200' 
                      : 'bg-white hover:bg-gray-50 text-gray-700 cursor-pointer border-gray-200'
                  }`}
                >
                  {isLoggingOut ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span className="font-light">Saindo...</span>
                    </>
                  ) : (
                    <>
                      <LogOut className="h-3 w-3" />
                      <span className="font-light">Sair</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
          {/* Coluna dos cards */}
          <div className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-6 gap-8">
              {/* 1. Central de Leads */}
              {renderCard(
                "Central de Leads",
                "Gerenciamento de atendimentos",
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-r from-blue-600 to-blue-500">
                  <Icons.UserCheck size={20} className="text-white" />
                </div>,
                "/acoes",
                "",
                "acoes",
                [
                  { label: "Monitoramento de Notícias", href: "/monitoramento-noticias" }
                ]
              )}

              {/* Obras e Demandas */}
              {renderCard(
                "Obras e Demandas",
                "Controle de obras e demandas parlamentares",
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-r from-blue-600 to-blue-500">
                  <Icons.Building2 size={20} className="text-white" />
                </div>,
                "/obras_demandas",
                "",
                "obras_demandas"
              )}

              {/* 2. Emendas */}
              {renderCard(
                "Emendas",
                "Sistema de gerenciamento de emendas parlamentares",
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-r from-blue-600 to-blue-500">
                  <Icons.FileText size={20} className="text-white" />
                </div>,
                "/emendas2025",
                "",
                "emendas2025",
                [
                  { label: "Consultar Tetos", href: "/consultar-tetos" }
                ]
              )}

              {/* 3. Base de Lideranças */}
              {renderCard(
                "Base de Lideranças",
                "Dashboard de análise hierárquica da base de lideranças",
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-r from-blue-600 to-blue-500">
                  <Icons.ListTree size={20} className="text-white" />
                </div>,
                "/baseliderancas",
                "",
                "baseliderancas"
              )}

              {/* 4. Projeção Votação 2026 */}
              {renderCard(
                "Eleições 2026",
                "Projeção de Votos 2026",
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-r from-blue-600 to-blue-500">
                  <Icons.BarChart size={20} className="text-white" />
                </div>,
                "/projecao2026",
                "",
                "projecao2026",
                [
                  { label: "Formação de chapas 2026", href: "/chapas" },
                  { label: "Pesquisas Eleitorais", href: "/pesquisas-eleitorais" },
                  { label: "Eleições Anteriores", href: "/eleicoes-anteriores" },
                  { label: "Eleitores por Município", href: "/eleitores-municipio" }
                ]
              )}

              {/* 5. Análise Instagram */}
              {renderCard(
                "Análise Instagram",
                "Métricas de desempenho e engajamento do Instagram",
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-r from-blue-600 to-blue-500">
                  <Icons.Instagram size={20} className="text-white" />
                </div>,
                "/instagram-analytics",
                "",
                "instagram-analytics"
              )}

              {/* 6. Gerenciar Usuários */}
              {renderCard(
                "Gerenciar Usuários",
                "Gerenciamento de usuários e permissões do sistema",
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-r from-blue-600 to-blue-500">
                  <Icons.Users size={20} className="text-white" />
                </div>,
                "/gerenciar-usuarios",
                "",
                "gerenciar-usuarios"
              )}

              {/* 7. Configurações */}
              {renderCard(
                "Configurações",
                "Configurações do sistema e monitoramento de APIs",
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-r from-blue-600 to-blue-500">
                  <Icons.Settings size={20} className="text-white" />
                </div>,
                "/configuracoes",
                "",
                "configuracoes"
              )}
            </div>

            {/* Mensagem quando não há aplicações disponíveis para o usuário */}
            {!hasVisibleApps() && user?.role !== 'admin' && (
              <div className="mt-6 text-center p-5 bg-white border border-gray-200 rounded-lg shadow-sm">
                <Icons.AlertTriangle className="h-8 w-8 text-amber-400 mx-auto mb-2 opacity-80" />
                <h3 className="text-sm font-normal mb-2 text-gray-800">Sem acesso às aplicações</h3>
                <p className="text-gray-500 mb-3 font-light text-xs max-w-md mx-auto">
                  Você não possui permissões para acessar nenhuma aplicação no momento.
                  <br />
                  Entre em contato com um administrador para solicitar acesso.
                </p>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1 bg-white border border-gray-200 hover:bg-gray-50 rounded text-xs font-light transition-colors text-gray-700"
                >
                  Sair do sistema
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Rodapé */}
      <footer className="mt-auto p-3 text-center text-[10px] text-gray-400 font-light">
        © 2025 86 Dynamics - Todos os direitos reservados
      </footer>
    </div>
  );
} 