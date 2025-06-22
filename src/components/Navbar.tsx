"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Settings, Users, BarChart, ListTree, FileText, Building2, UserCheck, Instagram, 
  MapPin, ArrowLeft, LogOut, Newspaper, BarChart2, Building, Coins, Users2,
  Vote, UserCog, LineChart
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { getCurrentUser } from '@/lib/storage';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';

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
}

const MENUS: Menu[] = [
  {
    label: 'Leads',
    href: '/acoes',
    icon: <UserCheck size={20} />,
    submenus: [
      { label: 'Monitoramento de Notícias', href: '/monitoramento-noticias', icon: <Newspaper size={16} /> },
      { label: 'Instagram Analytics', href: '/instagram-analytics', icon: <Instagram size={16} /> }
    ]
  },
  {
    label: 'Municípios',
    href: '/obras_demandas',
    icon: <MapPin size={20} />,
    submenus: [
      { label: 'Demandas', href: '/obras_demandas', icon: <Building size={16} /> },
      { label: 'Emendas 2025', href: '/emendas2025', icon: <Coins size={16} /> },
      { label: 'Consultar Tetos', href: '/consultar-tetos', icon: <BarChart2 size={16} /> },
      { label: 'Lideranças', href: '/baseliderancas', icon: <Users2 size={16} /> }
    ]
  },
  {
    label: 'Eleições',
    href: '/projecao2026',
    icon: <BarChart size={20} />,
    submenus: [
      { label: 'Formação de chapas 2026', href: '/chapas', icon: <Vote size={16} /> },
      { label: 'Pesquisas Eleitorais', href: '/pesquisas-eleitorais', icon: <BarChart2 size={16} /> },
      { label: 'Dashboard Resultados', href: '/eleicoes-anteriores', icon: <LineChart size={16} /> }
    ]
  },
  {
    label: '',
    href: '/configuracoes',
    icon: <Settings size={20} />,
    submenus: [
      { label: 'Usuários', href: '/gerenciar-usuarios', icon: <UserCog size={16} /> }
    ]
  }
];

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

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

  return (
    <nav className="bg-blue-600 flex items-center px-6 py-2 shadow z-[9998] relative">
      {/* Avatar do deputado - estilo igual à sidebar */}
      <Link href="/painel-aplicacoes" className="cursor-pointer">
        <div className="h-10 w-10 rounded-full shadow-xl border-4 border-white bg-gradient-to-r from-blue-50 to-blue-100 flex items-center justify-center overflow-hidden mr-4">
          <img src="/avatar-banner.png" alt="Deputado" className="w-full h-full object-contain" />
        </div>
      </Link>
      <span className="text-white font-bold text-lg mr-8">Dynamics Integration</span>
      <div className="flex gap-8 flex-1">
        {MENUS.map(menu => (
          <div key={menu.label || 'config'} className="relative group">
            <Link href={menu.href} className="flex items-center gap-2 text-white font-medium px-3 py-2 rounded hover:bg-blue-700 transition whitespace-nowrap">
              {menu.icon}
              {menu.label}
            </Link>
            {menu.submenus && menu.submenus.length > 0 && (
              <div className="absolute left-0 mt-0 bg-white rounded shadow-lg py-2 min-w-[220px] invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200 z-[9999]">
                <div className="absolute top-0 left-0 w-full h-2 bg-transparent -translate-y-full"></div>
                {menu.submenus.map(sub => (
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
        ))}
      </div>
      <div className="flex items-center gap-2">
        {user && (
          <div className="mr-2">
            <p className="text-sm text-white">Usuário: {user.name.split(' ')[0]}</p>
          </div>
        )}
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
    </nav>
  );
} 