'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from 'lucide-react';

interface EmendaFormData {
  id: string;
  emenda: string;
  municipio: string;
  funcional: string;
  gnd: string;
  valor_indicado: number;
  alteracao: string;
  nroproposta: string;
  valor_empenho: number;
  empenho: string;
  dataempenho: string;
  portaria_convenio: string;
  valoraempenhar: number;
  pagamento: string;
  valorpago: number;
  valoraserpago: number;
  tipo: string;
  classificacao_emenda: string;
  natureza: string;
  status_situacao: string;
}

export default function CriarEmendas() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEdit, setIsEdit] = useState(false);

  const [formData, setFormData] = useState<EmendaFormData>({
    id: '',
    emenda: '',
    municipio: '',
    funcional: '',
    gnd: '',
    valor_indicado: 0,
    alteracao: '',
    nroproposta: '',
    valor_empenho: 0,
    empenho: '',
    dataempenho: '',
    portaria_convenio: '',
    valoraempenhar: 0,
    pagamento: '',
    valorpago: 0,
    valoraserpago: 0,
    tipo: '',
    classificacao_emenda: '',
    natureza: '',
    status_situacao: ''
  });

  useEffect(() => {
    const isEditMode = searchParams.get('edit') === 'true';
    const emendaData = searchParams.get('data');
    
    if (isEditMode && emendaData) {
      try {
        const decodedData = JSON.parse(decodeURIComponent(emendaData));
        setFormData(decodedData);
        setIsEdit(true);
      } catch (error) {
        console.error('Erro ao decodificar dados da emenda:', error);
        setError('Erro ao carregar dados da emenda');
      }
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const endpoint = isEdit ? '/api/emendas/update' : '/api/emendas/create';
      const response = await fetch(endpoint, {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao salvar emenda');
      }

      router.push('/emendas2025');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar emenda');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let processedValue = value;

    // Converter valores numéricos
    if (['valor_indicado', 'valor_empenho', 'valoraempenhar', 'valorpago', 'valoraserpago'].includes(name)) {
      processedValue = value === '' ? '0' : value.replace(/[^\d.,]/g, '').replace(',', '.');
    }

    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-gray-50 to-gray-100">
      <header className="sticky top-0 z-10 bg-gradient-to-r from-blue-800 to-indigo-900 text-white shadow-md p-4">
        <div className="container mx-auto px-2">
          <h1 className="text-2xl font-bold">{isEdit ? 'Editar Emenda' : 'Criar Nova Emenda'}</h1>
            </div>
      </header>

      <div className="container mx-auto p-4 flex-1">
        <Card>
          <CardHeader>
            <CardTitle>{isEdit ? 'Editar Emenda' : 'Nova Emenda'}</CardTitle>
          </CardHeader>
          <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Emenda
                  </label>
                  <Input
                  name="emenda"
                  value={formData.emenda}
                    onChange={handleInputChange}
                  required
                />
              </div>
              
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Município
                  </label>
                  <Input
                    name="municipio"
                    value={formData.municipio}
                    onChange={handleInputChange}
                  required
                  />
              </div>

              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Funcional
                  </label>
                  <Input
                    name="funcional"
                    value={formData.funcional}
                    onChange={handleInputChange}
                />
              </div>

              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    GND
                  </label>
                  <Input
                    name="gnd"
                    value={formData.gnd}
                    onChange={handleInputChange}
                />
              </div>

              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor Indicado
                  </label>
                  <Input
                    type="number"
                    name="valor_indicado"
                    value={formData.valor_indicado}
                    onChange={handleInputChange}
                    step="0.01"
                    required
                  />
              </div>

              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor a Empenhar
                  </label>
                  <Input
                    type="number"
                    name="valoraempenhar"
                    value={formData.valoraempenhar}
                    onChange={handleInputChange}
                    step="0.01"
                />
              </div>

              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor Empenhado
                  </label>
                  <Input
                    type="number"
                    name="valor_empenho"
                    value={formData.valor_empenho}
                    onChange={handleInputChange}
                    step="0.01"
                />
              </div>

              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor Pago
                  </label>
                  <Input
                    type="number"
                    name="valorpago"
                    value={formData.valorpago}
                    onChange={handleInputChange}
                    step="0.01"
                />
              </div>

              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor a ser Pago
                  </label>
                  <Input
                    type="number"
                    name="valoraserpago"
                    value={formData.valoraserpago}
                    onChange={handleInputChange}
                    step="0.01"
                />
              </div>

              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo
                  </label>
                  <Input
                    name="tipo"
                    value={formData.tipo}
                    onChange={handleInputChange}
                />
              </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Classificação
                  </label>
                  <Input
                    name="classificacao_emenda"
                    value={formData.classificacao_emenda}
                    onChange={handleInputChange}
                />
              </div>

              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Natureza
                  </label>
                  <Input
                    name="natureza"
                    value={formData.natureza}
                    onChange={handleInputChange}
                />
              </div>

              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status/Situação
                  </label>
                  <Input
                    name="status_situacao"
                    value={formData.status_situacao}
                    onChange={handleInputChange}
                />
              </div>

              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alteração
                  </label>
                  <Input
                  name="alteracao"
                  value={formData.alteracao}
                    onChange={handleInputChange}
                />
              </div>

              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nº Proposta
                  </label>
                  <Input
                    name="nroproposta"
                    value={formData.nroproposta}
                    onChange={handleInputChange}
                />
              </div>

              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Empenho
                  </label>
                  <Input
                    name="empenho"
                    value={formData.empenho}
                    onChange={handleInputChange}
                />
              </div>

              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data Empenho
                  </label>
                  <Input
                  type="date"
                  name="dataempenho"
                  value={formData.dataempenho}
                    onChange={handleInputChange}
                />
              </div>

              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Portaria/Convênio
                  </label>
                  <Input
                    name="portaria_convenio"
                    value={formData.portaria_convenio}
                    onChange={handleInputChange}
                />
              </div>

              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pagamento
                  </label>
                  <Input
                  name="pagamento"
                  value={formData.pagamento}
                    onChange={handleInputChange}
                />
              </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mt-4">
                  {error}
              </div>
              )}

            <div className="flex justify-end space-x-4 mt-6">
                <Button
                type="button"
                  variant="outline"
                  onClick={() => router.push('/emendas2025')}
              >
                Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isEdit ? 'Atualizando...' : 'Salvando...'}
                    </>
                  ) : (
                    isEdit ? 'Atualizar Emenda' : 'Criar Emenda'
                  )}
                </Button>
            </div>
          </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 