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
    <div className="min-h-screen bg-gray-50">
      {/* Cabeçalho */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Base de Lideranças</h1>
              <p className="mt-1 text-sm text-gray-500">
                Bem-vindo à Base de Lideranças
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => router.push('/painel-aplicacoes')}
                className="flex items-center"
              >
                <Home className="h-4 w-4 mr-2" />
                Voltar ao Painel
              </Button>
            </div>
          </div>
        </div>
      </header>

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