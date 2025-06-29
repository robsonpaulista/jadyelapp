'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getCurrentUser } from '@/lib/storage';
import { User } from '@/types/user';
import { 
  UserLevel, 
  getUserPermissions, 
  hasRoutePermission, 
  hasMenuPermission, 
  validateRouteAccess,
  UserPermissions 
} from '@/lib/permissions';

export function usePermissions() {
  const [userLevel, setUserLevel] = useState<UserLevel | null>(null);
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    try {
      const user = getCurrentUser() as User | null;
      
      if (!user) {
        setIsLoading(false);
        return;
      }

      // Obtém o nível do usuário, com fallback para 'user' se não existir
      const level = (user.level || 'user') as UserLevel;
      
      setUserLevel(level);
      const userPermissions = getUserPermissions(level);
      setPermissions(userPermissions);
      
      setIsLoading(false);
    } catch (error) {
      console.error('Erro no usePermissions:', error);
      // Em caso de erro, definir valores padrão seguros
      setUserLevel('user');
      setPermissions(getUserPermissions('user'));
      setIsLoading(false);
    }
  }, []);

  // Removendo o redirecionamento automático daqui para evitar loops
  // O redirecionamento será feito apenas no RouteGuard quando necessário

  const hasAccess = (route: string): boolean => {
    try {
      if (!userLevel) return false;
      
      // Sempre permitir acesso à página inicial e login
      if (route === '/' || route === '/login') return true;
      
      return hasRoutePermission(userLevel, route);
    } catch (error) {
      console.error('Erro em hasAccess:', error);
      return false;
    }
  };

  const hasMenuAccess = (menu: keyof UserPermissions['menuAccess']): boolean => {
    try {
      if (!userLevel) {
        return false;
      }
      const result = hasMenuPermission(userLevel, menu);
      return result;
    } catch (error) {
      console.error('Erro em hasMenuAccess:', error);
      return false;
    }
  };

  const isAdmin = (): boolean => {
    try {
      return userLevel === 'admin';
    } catch (error) {
      console.error('Erro em isAdmin:', error);
      return false;
    }
  };

  const isUser = (): boolean => {
    try {
      return userLevel === 'user';
    } catch (error) {
      console.error('Erro em isUser:', error);
      return false;
    }
  };

  const isGabineteEmendas = (): boolean => {
    try {
      return userLevel === 'gabineteemendas';
    } catch (error) {
      console.error('Erro em isGabineteEmendas:', error);
      return false;
    }
  };

  const isGabineteJuridico = (): boolean => {
    try {
      return userLevel === 'gabinetejuridico';
    } catch (error) {
      console.error('Erro em isGabineteJuridico:', error);
      return false;
    }
  };

  const canAccessRoute = (route: string): boolean => {
    try {
      return hasAccess(route);
    } catch (error) {
      console.error('Erro em canAccessRoute:', error);
      return false;
    }
  };

  const getDefaultRoute = (): string => {
    try {
      return '/painel-aplicacoes';
    } catch (error) {
      console.error('Erro em getDefaultRoute:', error);
      return '/painel-aplicacoes';
    }
  };

  return {
    userLevel,
    permissions,
    isLoading,
    hasAccess,
    hasMenuAccess,
    canAccessRoute,
    getDefaultRoute,
    isAdmin,
    isUser,
    isGabineteEmendas,
    isGabineteJuridico
  };
} 