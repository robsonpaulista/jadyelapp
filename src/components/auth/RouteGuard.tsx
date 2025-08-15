'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';
import { getCurrentUser } from '@/lib/storage';

interface RouteGuardProps {
  children: React.ReactNode;
}

export function RouteGuard({ children }: RouteGuardProps) {
  const [isChecking, setIsChecking] = useState(true);
  const { hasAccess, isLoading, userLevel } = usePermissions();
  const router = useRouter();
  const pathname = usePathname();

  // Função para limpar cache de usuário piloto
  const clearPilotCache = (userId: string) => {
    console.log('Limpando cache para usuário piloto:', userId);
    
    // Verificar cache antes da limpeza
    const cacheBefore = Object.keys(sessionStorage).filter(key => 
      key.includes(userId) || key.includes('painel-aplicacoes') || key.includes('piloto')
    );
    console.log('Cache antes da limpeza:', cacheBefore);
    
    // Limpeza agressiva de todos os caches
    Object.keys(sessionStorage).forEach(key => {
      if (key.includes(userId) || key.includes('painel-aplicacoes') || key.includes('piloto')) {
        console.log('Removendo cache:', key);
        sessionStorage.removeItem(key);
      }
    });
    
    // Limpeza específica por padrões
    const patternsToRemove = [
      `${userId}-`,
      'painel-aplicacoes',
      'piloto'
    ];
    
    patternsToRemove.forEach(pattern => {
      Object.keys(sessionStorage).forEach(key => {
        if (key.includes(pattern)) {
          console.log('Removendo cache por padrão:', key);
          sessionStorage.removeItem(key);
        }
      });
    });
    
    // Verificar cache após a limpeza
    const cacheAfter = Object.keys(sessionStorage).filter(key => 
      key.includes(userId) || key.includes('painel-aplicacoes') || key.includes('piloto')
    );
    console.log('Cache após a limpeza:', cacheAfter);
    console.log('Cache limpo para usuário piloto');
  };

  useEffect(() => {
    const checkAccess = async () => {
      if (isLoading) return;

      const user = getCurrentUser();
      
      // Se não há usuário logado, redireciona para login
      if (!user) {
        console.log('RouteGuard: Nenhum usuário encontrado, redirecionando para login');
        router.replace('/');
        return;
      }

      console.log('RouteGuard: Usuário encontrado:', user.name, 'Level:', userLevel);
      console.log('RouteGuard: userLevel type:', typeof userLevel);
      console.log('RouteGuard: userLevel value:', userLevel);
      console.log('RouteGuard: userLevel === "piloto":', userLevel === 'piloto');

      // Cache de permissões para evitar verificações repetidas
      const cacheKey = `${user.id}-${pathname}`;

      // SEMPRE limpar cache para usuários piloto ANTES de qualquer verificação
      if (userLevel === 'piloto' || userLevel?.toLowerCase() === 'piloto') {
        console.log('RouteGuard: Usuário piloto detectado - limpando cache imediatamente');
        clearPilotCache(user.id);
        
        // Verificar se ainda há cache após a limpeza
        const remainingCache = sessionStorage.getItem(cacheKey);
        console.log('Cache restante após limpeza:', remainingCache);
        
        // Para usuários piloto, SEMPRE verificar permissões reais (não usar cache)
        console.log('Usuário piloto - verificando permissões reais (sem cache)');
        console.log('Debug - pathname:', pathname);
        console.log('Debug - userLevel:', userLevel);
        console.log('Debug - hasAccess result:', hasAccess(pathname));
        
        // Se não tem acesso à rota atual
        if (!hasAccess(pathname)) {
          console.log(`Usuário ${user.name} (${userLevel}) tentou acessar ${pathname} sem permissão`);
          console.log('Debug - pathname:', pathname);
          console.log('Debug - userLevel:', userLevel);
          console.log('Debug - hasAccess result:', hasAccess(pathname));
          
          // Redirecionar para o painel de aplicações quando não tiver acesso
          router.replace('/painel-aplicacoes');
          return;
        }
        
        // Se tem acesso, permitir
        console.log('Usuário piloto tem acesso - permitindo');
        setIsChecking(false);
        return;
      } else {
        console.log('RouteGuard: Usuário NÃO é piloto - userLevel:', userLevel);
        
        // Para outros usuários, verificar cache primeiro
        const cachedResult = sessionStorage.getItem(cacheKey);
        if (cachedResult !== null) {
          if (cachedResult === 'false') {
            console.log(`Usuário ${user.name} (${userLevel}) tentou acessar ${pathname} sem permissão (cache)`);
            router.replace('/painel-aplicacoes');
            return;
          }
          setIsChecking(false);
          return;
        }
        
        // Se não tem acesso à rota atual
        if (!hasAccess(pathname)) {
          console.log(`Usuário ${user.name} (${userLevel}) tentou acessar ${pathname} sem permissão`);
          console.log('Debug - pathname:', pathname);
          console.log('Debug - userLevel:', userLevel);
          console.log('Debug - hasAccess result:', hasAccess(pathname));
          
          // Salvar cache negativo para usuários que não são piloto
          sessionStorage.setItem(cacheKey, 'false');
          
          // Redirecionar para o painel de aplicações quando não tiver acesso
          router.replace('/painel-aplicacoes');
          return;
        }

        // Cache do resultado positivo (só para usuários que não são piloto)
        sessionStorage.setItem(cacheKey, 'true');
        setIsChecking(false);
      }
    };

    checkAccess();
  }, [pathname, hasAccess, isLoading, userLevel, router]);

  // Tela de carregamento enquanto verifica permissões
  if (isChecking || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Componente específico para rotas que precisam de nível admin
export function AdminRouteGuard({ children }: RouteGuardProps) {
  const [isChecking, setIsChecking] = useState(true);
  const { isAdmin, isLoading } = usePermissions();
  const router = useRouter();

  useEffect(() => {
    const checkAdminAccess = () => {
      if (isLoading) return;
      
      if (!isAdmin()) {
        router.replace('/painel-aplicacoes');
        return;
      }
      
      setIsChecking(false);
    };

    checkAdminAccess();
  }, [isAdmin, isLoading, router]);

  if (isChecking || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando permissões de administrador...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Componente para mostrar mensagem de acesso negado
export function AccessDenied({ message = "Você não tem permissão para acessar esta página." }) {
  const router = useRouter();
  const { userLevel } = usePermissions();

  const handleGoBack = () => {
    switch (userLevel) {
              case 'gabineteemendas':
        router.push('/consultar-tetos');
        break;
      case 'gabinetejuridico':
        router.push('/projetos');
        break;
      default:
        router.push('/painel-aplicacoes');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h1>
        <p className="text-gray-600 mb-6">{message}</p>
        <button
          onClick={handleGoBack}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
        >
          Voltar para área permitida
        </button>
      </div>
    </div>
  );
} 