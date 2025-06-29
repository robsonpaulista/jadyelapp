'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import { disableConsoleLogging } from '@/lib/logger';

export default function BaseLiderancasPage() {
  const router = useRouter();

  useEffect(() => {
    // Desabilitar logs globalmente para proteção de dados
    if (typeof window !== 'undefined') {
      disableConsoleLogging();
    }
  }, []);

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      {/* Navbar interna do conteúdo */}
      <nav className="w-full bg-white border-b border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex flex-col items-start">
            <span className="text-base md:text-lg font-semibold text-gray-900">Base de Lideranças</span>
            <span className="text-xs text-gray-500 font-light">Gerencie e acompanhe a base de lideranças políticas</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/painel-aplicacoes')}
              className="flex items-center gap-1 text-gray-600 hover:text-blue-700 transition-colors"
            >
              <Home className="h-4 w-4" />
              Voltar ao Painel
            </Button>
          </div>
        </div>
      </nav>

      {/* Conteúdo Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Base de Lideranças em Desenvolvimento
          </h2>
          <p className="text-gray-600">
            Esta página está em desenvolvimento. Em breve você poderá visualizar e gerenciar a base de lideranças.
          </p>
        </div>
      </main>
      
      {/* Rodapé */}
      <footer className="mt-auto border-t border-gray-200 p-4 text-center text-[10px] text-gray-400 font-light">
        © 2025 Deputado Federal Jadyel Alencar - Todos os direitos reservados
      </footer>
    </div>
  );
} 