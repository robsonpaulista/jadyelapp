export type UserLevel = 'admin' | 'user' | 'gabineteemendas' | 'gabinetejuridico' | 'piloto';

export interface Permission {
  route: string;
  allowed: boolean;
}

export interface UserPermissions {
  level: UserLevel;
  routes: string[];
  menuAccess: {
    leads: boolean;
    municipios: boolean;
    eleicoes: boolean;
    configuracoes: boolean;
  };
}

// Definição das rotas permitidas por nível de usuário
export const ROUTE_PERMISSIONS: Record<UserLevel, string[]> = {
  admin: [
    '/',
    '/painel-aplicacoes',
    '/acoes',
    '/acoes/nova',
    '/acoes/[id]',
    '/acoes/[id]/editar',
    '/monitoramento-noticias',
    '/instagram-analytics',
    '/obras_demandas',
    '/emendas2025',
    '/analise-territorial',
    '/consultar-tetos',
    '/baseliderancas',
    '/projecao2026',
    '/chapas',
    '/chapas-estaduais',
    '/pesquisas-eleitorais',
    '/eleicoes-anteriores',
    '/eleicoes-anteriores/projecao-municipios',
    '/evolucao-republicanos',
    '/configuracoes',
    '/gerenciar-usuarios',
    '/usuarios',
    '/tipos-acao',
    '/pessoas',
    '/relatorios',
    '/pacientes',
    '/eleitores-municipio',
    '/criaremendas',
    '/dashboardemendas',
    '/emendas',
    '/emendas/[id]',
    '/aeronave'
  ],
  user: [
    '/',
    '/painel-aplicacoes',
    '/acoes',
    '/acoes/nova',
    '/acoes/[id]',
    '/acoes/[id]/editar',
    '/monitoramento-noticias',
    '/instagram-analytics',
    '/analise-territorial',
    '/projecao2026',
    '/chapas',
    '/chapas-estaduais',
    '/pesquisas-eleitorais',
    '/eleicoes-anteriores',
    '/eleicoes-anteriores/projecao-municipios',
    '/evolucao-republicanos',
    '/pessoas',
    '/pacientes',
    '/aeronave'
  ],
  gabineteemendas: [
    '/',
    '/painel-aplicacoes',
    '/consultar-tetos',
    '/emendas2025',
    '/analise-territorial'
  ],
  gabinetejuridico: [
    '/',
    '/painel-aplicacoes',
    '/projetos' // Página que ainda será criada
  ],
  piloto: [
    '/',
    '/painel-aplicacoes',
    '/aeronave'
  ]
};

// Definição do acesso aos menus por nível de usuário
export const MENU_PERMISSIONS: Record<UserLevel, UserPermissions['menuAccess']> = {
  admin: {
    leads: true,
    municipios: true,
    eleicoes: true,
    configuracoes: true
  },
  user: {
    leads: true,
    municipios: false,
    eleicoes: true,
    configuracoes: false
  },
  gabineteemendas: {
    leads: false,
    municipios: true,
    eleicoes: false,
    configuracoes: false
  },
  gabinetejuridico: {
    leads: false,
    municipios: false,
    eleicoes: false,
    configuracoes: false
  },
  piloto: {
    leads: true,
    municipios: false,
    eleicoes: false,
    configuracoes: false
  }
};

export function getUserPermissions(userLevel: UserLevel): UserPermissions {
  // Normalizar o nível do usuário para lowercase para garantir compatibilidade
  const normalizedLevel = userLevel?.toLowerCase() as UserLevel;
  
  console.log('getUserPermissions - userLevel original:', userLevel);
  console.log('getUserPermissions - normalizedLevel:', normalizedLevel);
  
  return {
    level: userLevel,
    routes: ROUTE_PERMISSIONS[normalizedLevel] || [],
    menuAccess: MENU_PERMISSIONS[normalizedLevel] || {
      leads: false,
      municipios: false,
      eleicoes: false,
      configuracoes: false
    }
  };
}

export function hasRoutePermission(userLevel: UserLevel, route: string): boolean {
  // Normalizar o nível do usuário para lowercase
  const normalizedLevel = userLevel?.toLowerCase() as UserLevel;
  
  console.log('hasRoutePermission - userLevel original:', userLevel);
  console.log('hasRoutePermission - normalizedLevel:', normalizedLevel);
  
  const permissions = getUserPermissions(userLevel);
  
  // Debug log para chapas-estaduais
  if (route === '/chapas-estaduais') {
    console.log('Debug hasRoutePermission - route:', route);
    console.log('Debug hasRoutePermission - userLevel:', userLevel);
    console.log('Debug hasRoutePermission - permissions.routes:', permissions.routes);
    console.log('Debug hasRoutePermission - includes result:', permissions.routes.includes(route));
  }
  
  // Debug log para piloto (case-insensitive)
  if (normalizedLevel === 'piloto') {
    console.log('Debug hasRoutePermission PILOTO - route:', route);
    console.log('Debug hasRoutePermission PILOTO - permissions.routes:', permissions.routes);
    console.log('Debug hasRoutePermission PILOTO - includes result:', permissions.routes.includes(route));
    console.log('Debug hasRoutePermission PILOTO - permissions object:', permissions);
  }
  
  // Verifica se a rota exata está nas permissões
  if (permissions.routes.includes(route)) {
    console.log(`Debug hasRoutePermission - ROTA PERMITIDA: ${route} para ${userLevel}`);
    return true;
  }
  
  // Verifica rotas dinâmicas (com [id])
  const dynamicRoute = permissions.routes.find(permittedRoute => {
    if (permittedRoute.includes('[id]')) {
      const pattern = permittedRoute.replace('[id]', '[^/]+');
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(route);
    }
    return false;
  });
  
  const result = !!dynamicRoute;
  console.log(`Debug hasRoutePermission - RESULTADO FINAL: ${route} para ${userLevel} = ${result}`);
  return result;
}

export function hasMenuPermission(userLevel: UserLevel, menu: keyof UserPermissions['menuAccess']): boolean {
  const permissions = getUserPermissions(userLevel);
  return permissions.menuAccess[menu];
}

export function getRedirectRoute(userLevel: UserLevel): string {
  const permissions = getUserPermissions(userLevel);
  
  console.log('getRedirectRoute - userLevel:', userLevel);
  console.log('getRedirectRoute - permissions.routes:', permissions.routes);
  
  // Se tem acesso ao painel de aplicações, redireciona para lá
  if (permissions.routes.includes('/painel-aplicacoes')) {
    return '/painel-aplicacoes';
  }
  
  // Se tem outras rotas, redireciona para a primeira disponível (exceto /)
  const availableRoutes = permissions.routes.filter(route => route !== '/');
  if (availableRoutes.length > 0) {
    return availableRoutes[0];
  }
  
  // Fallback para página inicial
  return '/';
}

// Função para validar se o usuário pode acessar uma rota específica
export function validateRouteAccess(userLevel: UserLevel, currentRoute: string): {
  allowed: boolean;
  redirectTo?: string;
} {
  const hasAccess = hasRoutePermission(userLevel, currentRoute);
  
  if (!hasAccess) {
    return {
      allowed: false,
      redirectTo: getRedirectRoute(userLevel)
    };
  }
  
  return { allowed: true };
} 