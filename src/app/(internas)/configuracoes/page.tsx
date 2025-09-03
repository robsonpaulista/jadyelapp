'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Settings, 
  ChevronLeft, 
  Users,
  Shield
} from 'lucide-react';
import { getCurrentUser } from '@/lib/storage';

export default function ConfiguracoesPage() {
  const router = useRouter();
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    console.log('🔍 ConfiguracoesPage: useEffect executado');
    console.log('🔍 ConfiguracoesPage: window.location.pathname:', window.location.pathname);
    console.log('🔍 ConfiguracoesPage: document.title:', document.title);
    
    // Verificar usuário atual
    const user = getCurrentUser();
    console.log('🔍 ConfiguracoesPage: usuário atual:', user);
    console.log('🔍 ConfiguracoesPage: localStorage user:', localStorage.getItem('user'));
    console.log('🔍 ConfiguracoesPage: localStorage isLoggedIn:', localStorage.getItem('isLoggedIn'));
    
    // Verificar se estamos realmente na página de configurações
    if (window.location.pathname === '/configuracoes') {
      console.log('✅ ConfiguracoesPage: Rota correta detectada');
    } else {
      console.log('❌ ConfiguracoesPage: Rota incorreta:', window.location.pathname);
    }

    // Verificar se o usuário tem permissão
    if (user) {
      console.log('🔍 ConfiguracoesPage: usuário tem level:', user.level);
      console.log('🔍 ConfiguracoesPage: usuário tem perfil:', user.perfil);
      
      // Atualizar debug info
      setDebugInfo({
        userLevel: user.level,
        userPerfil: user.perfil,
        userName: user.name,
        userEmail: user.email,
        timestamp: new Date().toISOString(),
        pathname: window.location.pathname
      });
    } else {
      console.log('❌ ConfiguracoesPage: NENHUM usuário encontrado!');
    }

    // Monitorar mudanças no localStorage
    const handleStorageChange = () => {
      console.log('🔍 ConfiguracoesPage: localStorage mudou!');
      console.log('🔍 ConfiguracoesPage: novo user:', localStorage.getItem('user'));
      console.log('🔍 ConfiguracoesPage: novo isLoggedIn:', localStorage.getItem('isLoggedIn'));
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Verificar a cada 2 segundos se o usuário ainda existe
    const interval = setInterval(() => {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        console.log('❌ ConfiguracoesPage: Usuário foi removido durante a sessão!');
        clearInterval(interval);
      }
    }, 2000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  console.log('🔍 ConfiguracoesPage: renderizando página');

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      {/* Navbar interna do conteúdo */}
      <nav className="w-full bg-white border-b border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex flex-col items-start">
            <span className="text-base md:text-lg font-semibold text-gray-900">Configurações do Sistema</span>
            <span className="text-xs text-gray-500 font-light">Gerencie as configurações e preferências do sistema</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                console.log('🔍 ConfiguracoesPage: Botão Voltar clicado');
                router.push('/painel-aplicacoes');
              }}
              className="flex items-center gap-1 text-gray-600 hover:text-blue-700 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Voltar
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Configurações do Sistema</h1>
          <p className="text-gray-600">
            Bem-vindo às configurações do sistema! 🎉
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Se você está vendo esta mensagem, a página está funcionando!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card de Informações do Usuário */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Informações do Usuário
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="text-green-600 font-medium">Conectado</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Página:</span>
                  <span className="font-medium">Configurações</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Rota:</span>
                  <span className="font-medium text-blue-600">{window.location.pathname}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Nível:</span>
                  <span className="font-medium text-purple-600">{debugInfo.userLevel || 'N/A'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card de Configurações do Sistema */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="mr-2 h-5 w-5" />
                Configurações do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Versão:</span>
                  <span className="font-medium">1.2.3</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ambiente:</span>
                  <span className="font-medium">Produção</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="text-green-600 font-medium">Funcionando</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card de Segurança */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="mr-2 h-5 w-5" />
                Segurança
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="text-green-600 font-medium">Ativo</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Verificação:</span>
                  <span className="text-green-600 font-medium">OK</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Proteção:</span>
                  <span className="text-green-600 font-medium">Ativa</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Seção de Ações */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Teste de Funcionamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Button 
                  variant="outline"
                  onClick={() => {
                    console.log('🔍 ConfiguracoesPage: Teste de botão clicado');
                    alert('Página funcionando! ✅\nRota: ' + window.location.pathname);
                  }}
                >
                  Teste de Botão
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    console.log('🔍 ConfiguracoesPage: Teste de console clicado');
                    console.log('✅ Console funcionando!');
                    console.log('📍 Rota atual:', window.location.pathname);
                    console.log('🕐 Timestamp:', new Date().toISOString());
                  }}
                >
                  Teste de Console
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    console.log('🔍 ConfiguracoesPage: Ir para painel clicado');
                    router.push('/painel-aplicacoes');
                  }}
                >
                  Ir para Painel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Debug Info */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium mb-2">Debug Info</h3>
          <p className="text-sm text-gray-600">
            Se você está vendo esta página, ela está funcionando! 🎉
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Timestamp: {new Date().toLocaleString()}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Rota atual: <code className="bg-gray-200 px-2 py-1 rounded">{window.location.pathname}</code>
          </p>
          <p className="text-sm text-gray-600 mt-1">
            User Agent: <code className="bg-gray-200 px-2 py-1 rounded text-xs">{navigator.userAgent.substring(0, 50)}...</code>
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Usuário: <code className="bg-gray-200 px-2 py-1 rounded">{debugInfo.userName || 'N/A'}</code>
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Nível: <code className="bg-gray-200 px-2 py-1 rounded">{debugInfo.userLevel || 'N/A'}</code>
          </p>
        </div>
      </div>
    </div>
  );
} 