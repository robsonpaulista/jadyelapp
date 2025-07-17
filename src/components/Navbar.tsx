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
      { label: 'Dashboard Municípios', href: '/eleicoes-anteriores', icon: <LineChart size={16} /> },
      { label: 'Projeção por Municípios', href: '/eleicoes-anteriores/projecao-municipios', icon: <LineChart size={16} /> }
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
    }
  };

  const getVisibleMenus = () => {
    if (isLoading) return [];
    return MENUS.filter(menu => {
      if (!menu.permission) return true;
      return hasMenuAccess(menu.permission);
    });
  };

  const getVisibleSubmenus = (submenus: Submenu[] | undefined) => {
    if (isLoading || !submenus) return [];
    
    if (userLevel === 'gabineteemendas') {
      return submenus.filter(submenu => {
        return submenu.href === '/consultar-tetos' || submenu.href === '/emendas2025';
      });
    }
    
    return submenus;
  };

  const visibleMenus = getVisibleMenus();

  const handleMobileLinkClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 bg-gradient-to-r from-orange-500 to-red-500 text-white z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center">
              <Link href="/painel-aplicacoes" className="text-lg font-semibold mr-8">
                Dynamics Integration
              </Link>
              <Link href="/painel-aplicacoes" className="flex items-center gap-2 text-sm font-medium hover:bg-orange-600 px-3 py-2 rounded-lg transition-colors mr-6">
                <Home className="h-5 w-5" />
                <span>Home</span>
              </Link>
            </div>

            <div className="hidden lg:flex gap-8 flex-1">
              {visibleMenus.map(menu => {
                const visibleSubmenus = getVisibleSubmenus(menu.submenus);
                
                return (
                  <div key={menu.label || 'config'} className="relative group">
                    {menu.href === '#' ? (
                      <button className="flex items-center gap-2 text-sm font-medium hover:bg-orange-600 px-3 py-2 rounded-lg transition-colors">
                        {menu.icon}
                        <span>{menu.label || 'Configurações'}</span>
                      </button>
                    ) : (
                      <Link 
                        href={menu.href} 
                        className="flex items-center gap-2 text-sm font-medium hover:bg-orange-600 px-3 py-2 rounded-lg transition-colors"
                      >
                      {menu.icon}
                        <span>{menu.label || 'Configurações'}</span>
                      </Link>
                    )}
                    
                    {visibleSubmenus.length > 0 && (
                      <div className="absolute top-full left-0 mt-1 w-64 bg-white text-gray-700 shadow-lg rounded-lg border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                        <div className="p-2">
                        {visibleSubmenus.map(sub => (
                          <Link 
                            key={sub.href} 
                            href={sub.href} 
                              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                          >
                            {sub.icon}
                            {sub.label}
                          </Link>
                        ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              {user && (
                <div className="mr-2 hidden sm:block">
                  <div className="flex items-center text-xs lg:text-sm text-white">
                    <span className="hidden lg:inline">Usuário: </span>
                    {user.name?.split(' ')[0] || (user as any).nome?.split(' ')[0] || user.email?.split('@')[0] || 'Admin'}
                    {userLevel && (
                      <Badge variant="secondary" className="ml-1 lg:ml-2 text-xs">
                        {userLevel}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
              
              <div className="hidden lg:flex items-center gap-2">
                <Button 
                  onClick={() => router.back()} 
                  variant="ghost" 
                  size="sm"
                  className="text-white hover:text-white hover:bg-orange-600"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
                <Button 
                  onClick={handleLogout} 
                  variant="ghost" 
                  size="sm"
                  className="text-white hover:text-white hover:bg-orange-600"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </Button>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden text-white hover:text-white hover:bg-orange-600 p-2"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[9997] bg-black bg-opacity-50" onClick={() => setMobileMenuOpen(false)}>
          <div 
            className="fixed top-0 right-0 h-full w-80 max-w-[90vw] bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-orange-500 to-red-500 p-4 text-white">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Menu</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:text-white hover:bg-orange-600 p-1"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <X size={20} />
                </Button>
              </div>
              {user && (
                <div className="mt-2 pt-2 border-t border-orange-400">
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