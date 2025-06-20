'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { isUserLoggedIn, getCurrentUser, getAllUsers, logout } from '@/lib/storage';
import { toast } from 'react-hot-toast';
import { 
  Users, 
  RefreshCw, 
  Activity, 
  Settings, 
  Database, 
  ChevronLeft, 
  Check, 
  XCircle, 
  Shield, 
  BarChart4, 
  Clock, 
  UserX 
} from 'lucide-react';
import { disableConsoleLogging } from '@/lib/logger';

// Tipos para as páginas e estatísticas
interface PageStat {
  name: string;
  path: string;
  visits: number;
  lastVisited: string;
}

// Tipo para os status das APIs
interface ApiStatus {
  name: string;
  endpoint: string;
  status: 'online' | 'offline' | 'warning';
  responseTime: number;
  lastChecked: string;
}

// Tipo para sessões de usuários
interface UserSession {
  id: string;
  name: string;
  email: string;
  lastActivity: string;
  device: string;
  browser: string;
  ip: string;
  isActive: boolean;
}

export default function ConfiguracoesPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('geral');
  const [apiStatuses, setApiStatuses] = useState<ApiStatus[]>([]);
  const [pageStats, setPageStats] = useState<PageStat[]>([]);
  const [userSessions, setUserSessions] = useState<UserSession[]>([]);
  const [systemInfo, setSystemInfo] = useState({
    uptime: '7 dias, 3 horas',
    version: '1.2.3',
    lastUpdate: '23/03/2024',
    environment: 'Produção',
    nextScheduledMaintenance: 'Não agendada'
  });

  useEffect(() => {
    // Desabilitar logs globalmente para proteção de dados
    if (typeof window !== 'undefined') {
      disableConsoleLogging();
    }

    // Verificar se o usuário está logado e tem permissões de administrador
    const currentUser = getCurrentUser();
    if (!currentUser) {
      toast.error('Sessão expirada. Por favor, faça login novamente.');
      router.push('/');
      return;
    }

    // Obter informações de APIs
    fetchApiStatus();
    
    // Obter estatísticas de páginas
    fetchPageStats();
    
    // Obter sessões de usuários
    fetchUserSessions();
    
    setIsLoading(false);
  }, [router]);

  // Função para verificar o status das APIs
  const fetchApiStatus = () => {
    // Em um ambiente real, isso seria uma chamada real para cada API
    // Por agora, simularemos dados
    setApiStatuses([
      {
        name: 'API de Projeção',
        endpoint: '/api/projecao',
        status: 'online',
        responseTime: 231,
        lastChecked: new Date().toLocaleString()
      },
      {
        name: 'API de Obras',
        endpoint: '/api/obras',
        status: 'online',
        responseTime: 187,
        lastChecked: new Date().toLocaleString()
      },
      {
        name: 'API de Usuários',
        endpoint: '/api/usuarios',
        status: 'online',
        responseTime: 156,
        lastChecked: new Date().toLocaleString()
      },
      {
        name: 'API de Emendas',
        endpoint: '/api/emendas',
        status: 'warning',
        responseTime: 789,
        lastChecked: new Date().toLocaleString()
      }
    ]);
  };

  // Função para obter estatísticas de páginas
  const fetchPageStats = () => {
    // Em um ambiente real, isso viria de um sistema de analytics
    // Por agora, simularemos dados
    setPageStats([
      { name: 'Dashboard', path: '/dashboard', visits: 342, lastVisited: new Date().toLocaleString() },
      { name: 'Obras e Demandas', path: '/obras_demandas', visits: 187, lastVisited: new Date().toLocaleString() },
      { name: 'Projeção 2026', path: '/projecao2026', visits: 156, lastVisited: new Date().toLocaleString() },
      { name: 'Emendas', path: '/dashboardemendas', visits: 123, lastVisited: new Date().toLocaleString() },
      { name: 'Usuários', path: '/usuarios', visits: 89, lastVisited: new Date().toLocaleString() },
    ]);
  };

  // Função para obter sessões de usuários
  const fetchUserSessions = () => {
    // Em um ambiente real, isso viria de um sistema de gerenciamento de sessões
    // Por agora, obteremos a lista de usuários e simularemos sessões
    const users = getAllUsers();
    
    // Simular sessões para cada usuário
    const sessions: UserSession[] = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      lastActivity: new Date().toLocaleString(),
      device: ['Desktop Windows', 'iPhone', 'Android Phone', 'iPad', 'MacBook'][Math.floor(Math.random() * 5)],
      browser: ['Chrome', 'Firefox', 'Safari', 'Edge'][Math.floor(Math.random() * 4)],
      ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      isActive: Math.random() > 0.3
    }));
    
    setUserSessions(sessions);
  };

  // Função para desconectar um usuário
  const disconnectUser = (userId: string) => {
    // Em um ambiente real, isso enviaria uma solicitação para invalidar a sessão do usuário
    toast.success(`Usuário desconectado com sucesso!`);
    
    // Atualizar a lista de sessões
    setUserSessions(prev => 
      prev.map(session => 
        session.id === userId 
          ? { ...session, isActive: false } 
          : session
      )
    );
  };

  // Função para verificar uma API específica
  const checkApi = (endpoint: string) => {
    // Em um ambiente real, isso faria uma solicitação real para a API
    toast.success(`Verificando API: ${endpoint}`);
    
    // Simular uma verificação
    setApiStatuses(prev => 
      prev.map(api => 
        api.endpoint === endpoint 
          ? { 
              ...api, 
              lastChecked: new Date().toLocaleString(),
              responseTime: Math.floor(Math.random() * 500) + 100,
              status: Math.random() > 0.9 ? 'warning' : 'online'
            } 
          : api
      )
    );
  };

  const refreshAllStatus = () => {
    toast.success('Atualizando status de todas as APIs');
    fetchApiStatus();
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-gray-50 to-gray-100">
      <header className="sticky top-0 z-10 bg-gradient-to-r from-blue-800 to-indigo-900 text-white shadow-md p-4">
        <div className="container mx-auto px-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Settings className="h-6 w-6" />
              <h1 className="text-2xl font-bold">Configurações do Sistema</h1>
            </div>
            <Button 
              variant="ghost" 
              className="text-white hover:bg-white/10"
              onClick={() => router.push('/painel-aplicacoes')}
            >
              <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-4 flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
              <p className="mt-4 text-gray-600">Carregando configurações...</p>
            </div>
          </div>
        ) : (
          <Tabs defaultValue="geral" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 mb-6">
              <TabsTrigger value="geral">
                <Settings className="mr-2 h-4 w-4" /> Geral
              </TabsTrigger>
              <TabsTrigger value="apis">
                <Database className="mr-2 h-4 w-4" /> Status APIs
              </TabsTrigger>
              <TabsTrigger value="usuarios">
                <Users className="mr-2 h-4 w-4" /> Usuários Conectados
              </TabsTrigger>
              <TabsTrigger value="estatisticas">
                <BarChart4 className="mr-2 h-4 w-4" /> Estatísticas
              </TabsTrigger>
            </TabsList>
            
            {/* Aba de Informações Gerais */}
            <TabsContent value="geral">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="mr-2 h-5 w-5" /> Informações do Sistema
                  </CardTitle>
                  <CardDescription>
                    Visão geral do sistema e suas configurações
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center">
                          <Activity className="mr-2 h-4 w-4" /> Status do Sistema
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          <li className="flex items-center justify-between py-1 border-b">
                            <span className="text-gray-600">Tempo online:</span>
                            <span className="font-medium">{systemInfo.uptime}</span>
                          </li>
                          <li className="flex items-center justify-between py-1 border-b">
                            <span className="text-gray-600">Versão:</span>
                            <span className="font-medium">{systemInfo.version}</span>
                          </li>
                          <li className="flex items-center justify-between py-1 border-b">
                            <span className="text-gray-600">Última atualização:</span>
                            <span className="font-medium">{systemInfo.lastUpdate}</span>
                          </li>
                          <li className="flex items-center justify-between py-1 border-b">
                            <span className="text-gray-600">Ambiente:</span>
                            <span className="font-medium">{systemInfo.environment}</span>
                          </li>
                          <li className="flex items-center justify-between py-1">
                            <span className="text-gray-600">Próxima manutenção:</span>
                            <span className="font-medium">{systemInfo.nextScheduledMaintenance}</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center">
                          <Shield className="mr-2 h-4 w-4" /> Segurança do Sistema
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          <li className="flex items-center justify-between py-1 border-b">
                            <span className="text-gray-600">Verificação de segurança:</span>
                            <span className="text-green-600 font-medium flex items-center">
                              <Check className="mr-1 h-4 w-4" /> Atualizado
                            </span>
                          </li>
                          <li className="flex items-center justify-between py-1 border-b">
                            <span className="text-gray-600">Última varredura:</span>
                            <span className="font-medium">26/03/2024</span>
                          </li>
                          <li className="flex items-center justify-between py-1 border-b">
                            <span className="text-gray-600">Tentativas de login:</span>
                            <span className="font-medium">23 hoje</span>
                          </li>
                          <li className="flex items-center justify-between py-1 border-b">
                            <span className="text-gray-600">Login falhos:</span>
                            <span className="font-medium">3 hoje</span>
                          </li>
                          <li className="flex items-center justify-between py-1">
                            <span className="text-gray-600">Backups:</span>
                            <span className="text-green-600 font-medium flex items-center">
                              <Check className="mr-1 h-4 w-4" /> Automáticos diários
                            </span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Aba de Status das APIs */}
            <TabsContent value="apis">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      <Database className="mr-2 h-5 w-5" /> Status das APIs
                    </CardTitle>
                    <CardDescription>
                      Monitoramento do status das APIs do sistema
                    </CardDescription>
                  </div>
                  <Button onClick={refreshAllStatus} className="flex items-center">
                    <RefreshCw className="mr-2 h-4 w-4" /> Atualizar Tudo
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4">API</th>
                          <th className="text-left py-3 px-4">Endpoint</th>
                          <th className="text-center py-3 px-4">Status</th>
                          <th className="text-center py-3 px-4">Tempo de Resposta</th>
                          <th className="text-center py-3 px-4">Última Verificação</th>
                          <th className="text-center py-3 px-4">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {apiStatuses.map((api, index) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                            <td className="py-3 px-4 font-medium">{api.name}</td>
                            <td className="py-3 px-4 text-gray-600">{api.endpoint}</td>
                            <td className="py-3 px-4 text-center">
                              {api.status === 'online' ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <Check className="mr-1 h-3 w-3" /> Online
                                </span>
                              ) : api.status === 'warning' ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  ⚠️ Lento
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  <XCircle className="mr-1 h-3 w-3" /> Offline
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {api.status !== 'offline' && (
                                <span className={`font-medium ${api.responseTime > 500 ? 'text-yellow-600' : 'text-green-600'}`}>
                                  {api.responseTime} ms
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center text-gray-600">{api.lastChecked}</td>
                            <td className="py-3 px-4 text-center">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => checkApi(api.endpoint)}
                              >
                                <RefreshCw className="mr-1 h-3 w-3" /> Verificar
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Aba de Usuários Conectados */}
            <TabsContent value="usuarios">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="mr-2 h-5 w-5" /> Usuários Conectados
                  </CardTitle>
                  <CardDescription>
                    Gerenciamento de sessões de usuários ativos no sistema
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4">Usuário</th>
                          <th className="text-left py-3 px-4">Email</th>
                          <th className="text-left py-3 px-4">Dispositivo</th>
                          <th className="text-left py-3 px-4">IP</th>
                          <th className="text-center py-3 px-4">Última Atividade</th>
                          <th className="text-center py-3 px-4">Status</th>
                          <th className="text-center py-3 px-4">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userSessions.map((session, index) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                            <td className="py-3 px-4 font-medium">{session.name}</td>
                            <td className="py-3 px-4 text-gray-600">{session.email}</td>
                            <td className="py-3 px-4 text-gray-600">{session.device} - {session.browser}</td>
                            <td className="py-3 px-4 text-gray-600">{session.ip}</td>
                            <td className="py-3 px-4 text-center">
                              <span className="flex items-center justify-center text-gray-600">
                                <Clock className="mr-1 h-3 w-3" /> {session.lastActivity}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              {session.isActive ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <Check className="mr-1 h-3 w-3" /> Ativo
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  <XCircle className="mr-1 h-3 w-3" /> Inativo
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {session.isActive && (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="text-red-600 border-red-200 hover:bg-red-50"
                                  onClick={() => disconnectUser(session.id)}
                                >
                                  <UserX className="mr-1 h-3 w-3" /> Desconectar
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Aba de Estatísticas */}
            <TabsContent value="estatisticas">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart4 className="mr-2 h-5 w-5" /> Estatísticas de Uso
                  </CardTitle>
                  <CardDescription>
                    Análise de uso e acesso às páginas do sistema
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4">Página</th>
                          <th className="text-left py-3 px-4">Caminho</th>
                          <th className="text-center py-3 px-4">Visitas</th>
                          <th className="text-center py-3 px-4">Último Acesso</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pageStats.map((page, index) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                            <td className="py-3 px-4 font-medium">{page.name}</td>
                            <td className="py-3 px-4 text-gray-600">{page.path}</td>
                            <td className="py-3 px-4 text-center font-medium">
                              {page.visits}
                            </td>
                            <td className="py-3 px-4 text-center text-gray-600">
                              <span className="flex items-center justify-center">
                                <Clock className="mr-1 h-3 w-3" /> {page.lastVisited}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="mt-8">
                    <h3 className="text-lg font-medium mb-4">Análise de Desempenho</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base text-center">Páginas Mais Visitadas</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <p className="text-2xl font-bold text-center text-blue-700">Dashboard</p>
                          <p className="text-sm text-center text-gray-500">342 visitas este mês</p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base text-center">Tempo Médio na Página</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <p className="text-2xl font-bold text-center text-green-700">4m 23s</p>
                          <p className="text-sm text-center text-gray-500">Média de todas as sessões</p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base text-center">Total de Acessos</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <p className="text-2xl font-bold text-center text-purple-700">897</p>
                          <p className="text-sm text-center text-gray-500">Total este mês</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
} 