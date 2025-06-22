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

    // Obtém o nível do usuário (assumindo que está no campo 'level' do usuário)
    const level = user.level as UserLevel;
    
    if (level) {
      setUserLevel(level);
      const userPermissions = getUserPermissions(level);
      setPermissions(userPermissions);
    }
    
    setIsLoading(false);
  }, []);

  // Verifica se o usuário pode acessar a rota atual
  useEffect(() => {
    if (!isLoading && userLevel && pathname) {
      const routeValidation = validateRouteAccess(userLevel, pathname);
      
      if (!routeValidation.allowed && routeValidation.redirectTo) {
        console.log(`Acesso negado para ${pathname}. Redirecionando para ${routeValidation.redirectTo}`);
        router.replace(routeValidation.redirectTo);
      }
    }
  }, [userLevel, pathname, isLoading, router]);

  const hasAccess = (route: string): boolean => {
    if (!userLevel) return false;
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

  return {
    userLevel,
    permissions,
    isLoading,
    hasAccess,
    hasMenuAccess,
    isAdmin,
    isUser,
    isGabineteEmendas,
    isGabineteJuridico
  };
} 