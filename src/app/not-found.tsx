'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle className="text-2xl">Página não encontrada</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Desculpe, a página que você está procurando não existe ou foi movida.
          </p>
          <div className="flex justify-end">
            <Link href="/">
              <Button>Voltar para a página inicial</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 