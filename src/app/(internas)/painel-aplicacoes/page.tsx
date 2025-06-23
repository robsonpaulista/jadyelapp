'use client';

import React from 'react';
import Link from 'next/link';
import { 
  UserCheck, MapPin, BarChart, Settings, 
  Newspaper, Instagram, Building, Coins, 
  BarChart2, Users2, Vote, LineChart, UserCog 
} from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';

interface Application {
  title: string;
  description: string;
  href: string;
  icon: JSX.Element;
  color: string;
  permission?: 'leads' | 'municipios' | 'eleicoes' | 'configuracoes';
}

const APPLICATIONS: Application[] = [
  // Leads
  {
    title: 'Ações/Leads',
    description: 'Gerencie ações e leads do gabinete',
    href: '/acoes',
    icon: <UserCheck size={24} />,
    color: 'bg-blue-500',
    permission: 'leads'
  },
  {
    title: 'Monitoramento de Notícias',
    description: 'Monitore notícias relevantes',
    href: '/monitoramento-noticias',
    icon: <Newspaper size={24} />,
    color: 'bg-green-500',
    permission: 'leads'
  },
  {
    title: 'Instagram Analytics',
    description: 'Análise de performance do Instagram',
    href: '/instagram-analytics',
    icon: <Instagram size={24} />,
    color: 'bg-pink-500',
    permission: 'leads'
  },
  
  // Municípios
  {
    title: 'Demandas e Obras',
    description: 'Gestão de demandas municipais',
    href: '/obras_demandas',
    icon: <Building size={24} />,
    color: 'bg-orange-500',
    permission: 'municipios'
  },
  {
    title: 'Emendas 2025',
    description: 'Gestão de emendas parlamentares',
    href: '/emendas2025',
    icon: <Coins size={24} />,
    color: 'bg-yellow-500',
    permission: 'municipios'
  },
  {
    title: 'Consultar Tetos',
    description: 'Consulte tetos de emendas',
    href: '/consultar-tetos',
    icon: <BarChart2 size={24} />,
    color: 'bg-purple-500',
    permission: 'municipios'
  },
  {
    title: 'Base de Lideranças',
    description: 'Gestão de lideranças municipais',
    href: '/baseliderancas',
    icon: <Users2 size={24} />,
    color: 'bg-indigo-500',
    permission: 'municipios'
  },
  
  // Eleições
  {
    title: 'Projeção 2026',
    description: 'Projeções eleitorais 2026',
    href: '/projecao2026',
    icon: <BarChart size={24} />,
    color: 'bg-red-500',
    permission: 'eleicoes'
  },
  {
    title: 'Formação de Chapas',
    description: 'Gestão de chapas eleitorais',
    href: '/chapas',
    icon: <Vote size={24} />,
    color: 'bg-teal-500',
    permission: 'eleicoes'
  },
  {
    title: 'Pesquisas Eleitorais',
    description: 'Gestão de pesquisas de opinião',
    href: '/pesquisas-eleitorais',
    icon: <BarChart2 size={24} />,
    color: 'bg-cyan-500',
    permission: 'eleicoes'
  },
  {
    title: 'Eleições Anteriores',
    description: 'Resultados de eleições passadas',
    href: '/eleicoes-anteriores',
    icon: <LineChart size={24} />,
    color: 'bg-lime-500',
    permission: 'eleicoes'
  },
  
  // Configurações
  {
    title: 'Configurações',
    description: 'Configurações do sistema',
    href: '/configuracoes',
    icon: <Settings size={24} />,
    color: 'bg-gray-500',
    permission: 'configuracoes'
  },
  {
    title: 'Gerenciar Usuários',
    description: 'Gestão de usuários do sistema',
    href: '/gerenciar-usuarios',
    icon: <UserCog size={24} />,
    color: 'bg-slate-500',
    permission: 'configuracoes'
  }
];

export default function ApplicationsDashboard() {
  const { hasMenuAccess, isLoading } = usePermissions();

  const getVisibleApplications = () => {
    if (isLoading) return [];
    
    return APPLICATIONS.filter(app => {
      if (!app.permission) return true;
      return hasMenuAccess(app.permission);
    });
  };

  const visibleApps = getVisibleApplications();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 p-4 pt-20">
        <div className="container mx-auto">
          <div className="text-center mb-8">
            <div className="h-8 bg-gray-200 rounded-md w-64 mx-auto mb-4 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded-md w-96 mx-auto animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, index) => (
              <div key={index} className="h-32 bg-gray-200 rounded-lg animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 p-4 pt-20">
      {/* Header */}
      <div className="container mx-auto mb-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            Hub de Aplicações
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Acesse todas as ferramentas e sistemas do gabinete em um só lugar
          </p>
        </div>

        {/* Grid de Aplicações */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {visibleApps.map((app) => (
            <Link
              key={app.href}
              href={app.href}
              className="group block p-6 bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className={`${app.color} p-4 rounded-xl text-white group-hover:scale-110 transition-transform duration-300`}>
                  {app.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">
                    {app.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {app.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Footer com informações */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full text-blue-700 text-sm">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            Sistema integrado do Deputado Federal Jadyel Alencar
          </div>
        </div>
      </div>
    </div>
  );
} 