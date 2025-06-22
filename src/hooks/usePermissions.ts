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
  }, []);

  // Removendo o redirecionamento automático daqui para evitar loops
  // O redirecionamento será feito apenas no RouteGuard quando necessário

  const hasAccess = (route: string): boolean => {
    if (!userLevel) return false;
    
    // Sempre permitir acesso à página inicial e login
    if (route === '/' || route === '/login') return true;
    
    return hasRoutePermission(userLevel, route);
  };

  const hasMenuAccess = (menu: keyof UserPermissions['menuAccess']): boolean => {
    if (!userLevel) return false;
    return hasMenuPermission(userLevel, menu);
  };

  const isAdmin = (): boolean => {
    return userLevel === 'admin';
  };

  const isUser = (): boolean => {
    return userLevel === 'user';
  };

  const isGabineteEmendas = (): boolean => {
    return userLevel === 'gabineteemendas';
  };

  const isGabineteJuridico = (): boolean => {
    return userLevel === 'gabinetejuridico';
  };

  const canAccessRoute = (route: string): boolean => {
    return hasAccess(route);
  };

  const getDefaultRoute = (): string => {
    switch (userLevel) {
      case 'gabineteemendas':
        return '/consultar-tetos';
      case 'gabinetejuridico':
        return '/projetos';
      default:
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