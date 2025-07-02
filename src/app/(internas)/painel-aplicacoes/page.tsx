'use client';

import React, { useEffect } from 'react';
import { 
  MonitorSmartphone, CircuitBoard, Wallet,
  Newspaper, Instagram, Users2, BarChart2,
  Vote, LineChart, UserCog
} from 'lucide-react';

export default function ApplicationsDashboard() {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4">
          <div className="flex flex-col gap-1 px-4 sm:px-6 lg:px-8">
            <h1 className="text-lg font-semibold text-gray-900">Hub de Aplicações Dep.Federal Jadyel Alencar</h1>
            <p className="text-sm text-gray-500">Bem-vindo ao portal integrado de gestão política e administrativa</p>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card Monitoramento de Notícias */}
          <div className="bg-white rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start space-x-4">
              <div className="p-2.5 bg-blue-100 rounded-lg">
                <Newspaper className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-medium text-gray-900">Monitoramento de Notícias</h3>
                <p className="mt-1.5 text-sm text-gray-500">Acompanhamento de notícias e menções na mídia</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center px-2.5 py-1.5 rounded-md bg-gray-100 text-sm text-gray-600">Notícias</span>
              <span className="inline-flex items-center px-2.5 py-1.5 rounded-md bg-gray-100 text-sm text-gray-600">Mídia</span>
              <span className="inline-flex items-center px-2.5 py-1.5 rounded-md bg-gray-100 text-sm text-gray-600">Menções</span>
            </div>
          </div>

          {/* Card Instagram Analytics */}
          <div className="bg-white rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start space-x-4">
              <div className="p-2.5 bg-blue-100/80 rounded-lg">
                <Instagram className="h-6 w-6 text-blue-600/90" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-medium text-gray-900">Instagram Analytics</h3>
                <p className="mt-1.5 text-sm text-gray-500">Análise de desempenho e engajamento no Instagram</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center px-2.5 py-1.5 rounded-md bg-gray-100 text-sm text-gray-600">Métricas</span>
              <span className="inline-flex items-center px-2.5 py-1.5 rounded-md bg-gray-100 text-sm text-gray-600">Engajamento</span>
              <span className="inline-flex items-center px-2.5 py-1.5 rounded-md bg-gray-100 text-sm text-gray-600">Alcance</span>
            </div>
          </div>

          {/* Card Base de Lideranças */}
          <div className="bg-white rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start space-x-4">
              <div className="p-2.5 bg-blue-100/70 rounded-lg">
                <Users2 className="h-6 w-6 text-blue-600/80" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-medium text-gray-900">Base de Lideranças</h3>
                <p className="mt-1.5 text-sm text-gray-500">Gestão e acompanhamento de lideranças políticas</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center px-2.5 py-1.5 rounded-md bg-gray-100 text-sm text-gray-600">Lideranças</span>
              <span className="inline-flex items-center px-2.5 py-1.5 rounded-md bg-gray-100 text-sm text-gray-600">Contatos</span>
              <span className="inline-flex items-center px-2.5 py-1.5 rounded-md bg-gray-100 text-sm text-gray-600">Demandas</span>
            </div>
          </div>

          {/* Card Formação de Chapas */}
          <div className="bg-white rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start space-x-4">
              <div className="p-2.5 bg-blue-100/60 rounded-lg">
                <Vote className="h-6 w-6 text-blue-600/70" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-medium text-gray-900">Formação de Chapas</h3>
                <p className="mt-1.5 text-sm text-gray-500">Planejamento e formação de chapas para eleições 2026</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center px-2.5 py-1.5 rounded-md bg-gray-100 text-sm text-gray-600">Chapas</span>
              <span className="inline-flex items-center px-2.5 py-1.5 rounded-md bg-gray-100 text-sm text-gray-600">Candidatos</span>
              <span className="inline-flex items-center px-2.5 py-1.5 rounded-md bg-gray-100 text-sm text-gray-600">2026</span>
            </div>
          </div>

          {/* Card Pesquisas Eleitorais */}
          <div className="bg-white rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start space-x-4">
              <div className="p-2.5 bg-blue-100/50 rounded-lg">
                <BarChart2 className="h-6 w-6 text-blue-600/60" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-medium text-gray-900">Pesquisas Eleitorais</h3>
                <p className="mt-1.5 text-sm text-gray-500">Acompanhamento e análise de pesquisas eleitorais</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center px-2.5 py-1.5 rounded-md bg-gray-100 text-sm text-gray-600">Pesquisas</span>
              <span className="inline-flex items-center px-2.5 py-1.5 rounded-md bg-gray-100 text-sm text-gray-600">Análises</span>
              <span className="inline-flex items-center px-2.5 py-1.5 rounded-md bg-gray-100 text-sm text-gray-600">Tendências</span>
            </div>
          </div>

          {/* Card Dashboard Municípios */}
          <div className="bg-white rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start space-x-4">
              <div className="p-2.5 bg-blue-100/40 rounded-lg">
                <LineChart className="h-6 w-6 text-blue-600/50" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-medium text-gray-900">Dashboard Municípios</h3>
                <p className="mt-1.5 text-sm text-gray-500">Análise de resultados eleitorais por município</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center px-2.5 py-1.5 rounded-md bg-gray-100 text-sm text-gray-600">Resultados</span>
              <span className="inline-flex items-center px-2.5 py-1.5 rounded-md bg-gray-100 text-sm text-gray-600">Estatísticas</span>
              <span className="inline-flex items-center px-2.5 py-1.5 rounded-md bg-gray-100 text-sm text-gray-600">Mapas</span>
            </div>
          </div>

          {/* Card Gestão de Emendas */}
          <div className="bg-white rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start space-x-4">
              <div className="p-2.5 bg-blue-100/30 rounded-lg">
                <Wallet className="h-6 w-6 text-blue-600/40" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-medium text-gray-900">Gestão de Emendas</h3>
                <p className="mt-1.5 text-sm text-gray-500">Gestão e acompanhamento de emendas e recursos</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center px-2.5 py-1.5 rounded-md bg-gray-100 text-sm text-gray-600">Emendas</span>
              <span className="inline-flex items-center px-2.5 py-1.5 rounded-md bg-gray-100 text-sm text-gray-600">Planejamento</span>
              <span className="inline-flex items-center px-2.5 py-1.5 rounded-md bg-gray-100 text-sm text-gray-600">Recursos</span>
            </div>
          </div>

          {/* Card Obras e Demandas */}
          <div className="bg-white rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start space-x-4">
              <div className="p-2.5 bg-blue-100/20 rounded-lg">
                <CircuitBoard className="h-6 w-6 text-blue-600/30" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-medium text-gray-900">Obras e Demandas</h3>
                <p className="mt-1.5 text-sm text-gray-500">Controle de obras públicas e demandas municipais</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center px-2.5 py-1.5 rounded-md bg-gray-100 text-sm text-gray-600">Obras</span>
              <span className="inline-flex items-center px-2.5 py-1.5 rounded-md bg-gray-100 text-sm text-gray-600">Demandas</span>
              <span className="inline-flex items-center px-2.5 py-1.5 rounded-md bg-gray-100 text-sm text-gray-600">Municípios</span>
            </div>
          </div>

          {/* Card Gestão de Usuários */}
          <div className="bg-white rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start space-x-4">
              <div className="p-2.5 bg-blue-100/10 rounded-lg">
                <UserCog className="h-6 w-6 text-blue-600/20" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-medium text-gray-900">Gestão de Usuários</h3>
                <p className="mt-1.5 text-sm text-gray-500">Gerenciamento de usuários e permissões do sistema</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center px-2.5 py-1.5 rounded-md bg-gray-100 text-sm text-gray-600">Usuários</span>
              <span className="inline-flex items-center px-2.5 py-1.5 rounded-md bg-gray-100 text-sm text-gray-600">Permissões</span>
              <span className="inline-flex items-center px-2.5 py-1.5 rounded-md bg-gray-100 text-sm text-gray-600">Acessos</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 