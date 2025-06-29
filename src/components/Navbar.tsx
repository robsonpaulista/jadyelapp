"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Settings, Users, BarChart, ListTree, FileText, Building2, UserCheck, Instagram, 
  MapPin, ArrowLeft, LogOut, Newspaper, BarChart2, Building, Coins, Users2,
  Vote, UserCog, LineChart, Menu, X, Home
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { getCurrentUser } from '@/lib/storage';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { usePermissions } from '@/hooks/usePermissions';

interface Submenu {
  label: string;
  href: string;
  icon: JSX.Element;
}

interface Menu {
  label: string;
  href: string;
  icon: JSX.Element;
  submenus?: Submenu[];
  permission?: 'leads' | 'municipios' | 'eleicoes' | 'configuracoes';
}

const MENUS: Menu[] = [
  {
    label: 'Leads',
    href: '#',
    icon: <UserCheck size={20} />,
    permission: 'leads',
    submenus: [
      { label: 'Monitoramento de Notícias', href: '/monitoramento-noticias', icon: <Newspaper size={16} /> },
      { label: 'Instagram Analytics', href: '/instagram-analytics', icon: <Instagram size={16} /> }
    ]
  },
  {
    label: 'Municípios',
    href: '#',
    icon: <MapPin size={20} />,
    permission: 'municipios',
    submenus: [
      { label: 'Demandas', href: '/obras_demandas', icon: <Building size={16} /> },
      { label: 'Emendas 2025', href: '/emendas2025', icon: <Coins size={16} /> },
      { label: 'Consultar Tetos', href: '/consultar-tetos', icon: <BarChart2 size={16} /> },
      { label: 'Lideranças', href: '/baseliderancas', icon: <Users2 size={16} /> }
    ]
  },
  {
    label: 'Eleições',
    href: '#',
    icon: <BarChart size={20} />,
    permission: 'eleicoes',
    submenus: [
      { label: 'Formação de chapas 2026', href: '/chapas', icon: <Vote size={16} /> },
      { label: 'Pesquisas Eleitorais', href: '/pesquisas-eleitorais', icon: <BarChart2 size={16} /> },
      { label: 'Dashboard Municípios', href: '/eleicoes-anteriores', icon: <LineChart size={16} /> }
    ]
  },
  {
    label: '',
    href: '/configuracoes',
    icon: <Settings size={20} />,
    permission: 'configuracoes',
    submenus: [
      { label: 'Usuários', href: '/gerenciar-usuarios', icon: <UserCog size={16} /> }
    ]
  }
];

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { hasMenuAccess, hasAccess, isLoading, userLevel } = usePermissions();

  useEffect(() => {
    const user = getCurrentUser();
    setUser(user);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.clear();
      router.push('/');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      // Opcional: Mostrar uma notificação de erro para o usuário
    }
  };

  // Sistema de permissões
  const getVisibleMenus = () => {
    if (isLoading) return []; // Não mostrar menus enquanto carrega
    
    return MENUS.filter(menu => {
      // Se não tem permissão definida, mostrar sempre (como o ícone de configurações)
      if (!menu.permission) return true;
      
      // Verificar se tem acesso ao menu baseado no nível do usuário
      return hasMenuAccess(menu.permission);
    });
  };

  const getVisibleSubmenus = (submenus: Submenu[] | undefined) => {
    if (isLoading || !submenus) return [];
    
    // Para usuários gabineteemendas, filtrar apenas as rotas permitidas
    if (userLevel === 'gabineteemendas') {
      return submenus.filter(submenu => {
        return submenu.href === '/consultar-tetos' || submenu.href === '/emendas2025';
      });
    }
    
    // Por enquanto, mostrar todos os submenus se o menu principal está visível
    // Posteriormente podemos adicionar permissões específicas para submenus
    return submenus;
  };

  const visibleMenus = getVisibleMenus();

  // Fechar menu mobile quando clicar em um link
  const handleMobileLinkClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 bg-blue-600 text-white z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center">
              <Link href="/painel-aplicacoes" className="text-lg font-semibold mr-8">
                Dynamics Integration
              </Link>
              <Link href="/painel-aplicacoes" className="flex items-center gap-2 text-sm font-medium hover:bg-blue-700 px-3 py-2 rounded-lg transition-colors mr-6">
                <Home className="h-5 w-5" />
                <span>Home</span>
              </Link>
            </div>

            {/* Menu Desktop - Oculto no mobile */}
            <div className="hidden lg:flex gap-8 flex-1">
              {visibleMenus.map(menu => {
                const visibleSubmenus = getVisibleSubmenus(menu.submenus);
                
                return (
                  <div key={menu.label || 'config'} className="relative group">
                    <div className={`flex items-center gap-2 text-white font-medium px-3 py-2 rounded hover:bg-blue-700 transition whitespace-nowrap cursor-pointer ${menu.href === '#' ? 'pointer-events-none' : ''}`}>
              {menu.icon}
              {menu.label}
                    </div>
                    {visibleSubmenus.length > 0 && (
                      <div className="absolute left-0 mt-0 bg-white rounded shadow-lg py-2 min-w-[220px] invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200 z-[9999]">
                        <div className="absolute top-0 left-0 w-full h-2 bg-transparent -translate-y-full"></div>
                        {visibleSubmenus.map(sub => (
                          <Link 
                            key={sub.href} 
                            href={sub.href} 
                            className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-blue-50 whitespace-nowrap"
                          >
                            {sub.icon}
                    {sub.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
                );
              })}
            </div>

            {/* Informações do usuário - Adaptadas para mobile */}
            <div className="flex items-center gap-2 ml-auto">
              {user && (
                <div className="mr-2 hidden sm:block">
                  <p className="text-xs lg:text-sm text-white">
                    <span className="hidden lg:inline">Usuário: </span>
                    {user.name?.split(' ')[0] || (user as any).nome?.split(' ')[0] || user.email?.split('@')[0] || 'Admin'}
                    {userLevel && (
                      <Badge variant="secondary" className="ml-1 lg:ml-2 text-xs">
                        {userLevel}
                      </Badge>
                    )}
                  </p>
                </div>
              )}
              
              {/* Botões Desktop */}
              <div className="hidden lg:flex items-center gap-2">
                <Button 
                  onClick={() => router.back()} 
                  variant="ghost" 
                  size="sm"
                  className="text-white hover:text-white hover:bg-blue-700"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
                <Button 
                  onClick={handleLogout} 
                  variant="ghost" 
                  size="sm"
                  className="text-white hover:text-white hover:bg-blue-700"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </Button>
              </div>

              {/* Botão Menu Mobile */}
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden text-white hover:text-white hover:bg-blue-700 p-2"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Menu Mobile Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[9997] bg-black bg-opacity-50" onClick={() => setMobileMenuOpen(false)}>
          <div 
            className="fixed top-0 right-0 h-full w-80 max-w-[90vw] bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header do menu mobile */}
            <div className="bg-blue-600 p-4 text-white">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Menu</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:text-white hover:bg-blue-700 p-1"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <X size={20} />
                </Button>
              </div>
              {user && (
                <div className="mt-2 pt-2 border-t border-blue-500">
                  <p className="text-sm">
                    {user.name?.split(' ')[0] || (user as any).nome?.split(' ')[0] || user.email?.split('@')[0] || 'Admin'}
                    {userLevel && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {userLevel}
                      </Badge>
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* Conteúdo do menu mobile */}
            <div className="p-4 space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
              {visibleMenus.map(menu => {
                const visibleSubmenus = getVisibleSubmenus(menu.submenus);
                
                return (
                  <div key={menu.label || 'config'} className="space-y-1">
                    {menu.href === '#' ? (
                      <div className="flex items-center gap-3 p-3 text-gray-700 rounded-lg transition">
                        {menu.icon}
                        <span className="font-medium">{menu.label || 'Configurações'}</span>
                      </div>
                    ) : (
                      <Link 
                        href={menu.href} 
                        className="flex items-center gap-3 p-3 text-gray-700 hover:bg-blue-50 rounded-lg transition"
                        onClick={handleMobileLinkClick}
                      >
                        {menu.icon}
                        <span className="font-medium">{menu.label || 'Configurações'}</span>
                      </Link>
                    )}
                    
                    {visibleSubmenus.length > 0 && (
                      <div className="ml-6 space-y-1">
                        {visibleSubmenus.map(sub => (
                          <Link 
                            key={sub.href} 
                            href={sub.href} 
                            className="flex items-center gap-3 p-2 text-gray-600 hover:bg-gray-50 rounded text-sm"
                            onClick={handleMobileLinkClick}
                          >
                            {sub.icon}
                            {sub.label}
                          </Link>
        ))}
      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer do menu mobile */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gray-50 border-t space-y-2">
              <Button 
                onClick={() => {
                  router.back();
                  handleMobileLinkClick();
                }} 
                variant="outline" 
                size="sm"
                className="w-full justify-start"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <Button 
                onClick={() => {
                  handleLogout();
                  handleMobileLinkClick();
                }} 
                variant="outline" 
                size="sm"
                className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 