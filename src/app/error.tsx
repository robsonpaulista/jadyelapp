'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { disableConsoleLogging } from '@/lib/logger';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Desabilitar logs globalmente para proteção de dados
    if (typeof window !== 'undefined') {
      disableConsoleLogging();
    }
    
    // Erro silencioso - não exibir logs por segurança
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle className="text-red-600">Ops! Algo deu errado</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            {error.message || 'Ocorreu um erro inesperado. Por favor, tente novamente.'}
          </p>
          <div className="flex justify-end">
            <Button onClick={reset} variant="outline">
              Tentar novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 