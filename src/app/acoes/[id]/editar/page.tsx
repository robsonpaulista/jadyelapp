'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-hot-toast';
import { ChevronLeft, Save, Loader2 } from 'lucide-react';
import { isUserLoggedIn } from '@/lib/storage';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Acao } from '@/app/api/acoes/route';

// Schema de validação para o formulário de ação
const acaoSchema = z.object({
  titulo: z.string().min(3, { message: 'O título deve ter pelo menos 3 caracteres' }),
  descricao: z.string().min(5, { message: 'A descrição deve ter pelo menos 5 caracteres' }),
  responsavel: z.string().min(3, { message: 'O responsável deve ter pelo menos 3 caracteres' }),
  dataInicio: z.string().min(1, { message: 'A data de início é obrigatória' }),
  dataFim: z.string().min(1, { message: 'A data de fim é obrigatória' }),
  status: z.string().min(1, { message: 'O status é obrigatório' }),
});

// Tipo derivado do schema
type AcaoFormValues = z.infer<typeof acaoSchema>;

const EditarAcaoPage = () => {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inicializar o formulário com o schema de validação
  const form = useForm<AcaoFormValues>({
    resolver: zodResolver(acaoSchema),
    defaultValues: {
      titulo: '',
      descricao: '',
      responsavel: '',
      dataInicio: '',
      dataFim: '',
      status: '',
    },
  });

  // Buscar a ação pelo ID
  useEffect(() => {
    if (!isUserLoggedIn()) {
      router.push('/login');
      return;
    }

    const fetchAcao = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`/api/acoes?id=${id}`);
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.message || 'Erro ao buscar ação');
        }
        
        const acao = data.data as Acao;
        
        // Converter as datas para o formato esperado pelo input date (YYYY-MM-DD)
        const formatarData = (dataString: string) => {
          try {
            const data = new Date(dataString);
            return data.toISOString().split('T')[0];
          } catch (error) {
            return dataString || '';
          }
        };
        
        // Preencher o formulário com os dados da ação
        form.reset({
          titulo: acao.titulo,
          descricao: acao.descricao,
          responsavel: acao.responsavel,
          dataInicio: formatarData(acao.dataInicio),
          dataFim: formatarData(acao.dataFim),
          status: acao.status,
        });
      } catch (error) {
        console.error('Erro ao buscar ação:', error);
        setError(error instanceof Error ? error.message : 'Erro desconhecido ao carregar ação');
        toast.error(`Erro ao carregar dados: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchAcao();
    }
  }, [id, router, form]);

  // Função para lidar com o envio do formulário
  const onSubmit = async (data: AcaoFormValues) => {
    try {
      setIsSubmitting(true);
      
      const response = await fetch('/api/acoes', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          ...data,
        }),
      });
      
      const responseData = await response.json();
      
      if (!responseData.success) {
        throw new Error(responseData.message || 'Erro ao atualizar ação');
      }
      
      toast.success('Ação atualizada com sucesso!');
      
      // Redirecionar para a lista de ações
      router.push('/acoes');
    } catch (error) {
      console.error('Erro ao atualizar ação:', error);
      toast.error(`Erro ao atualizar ação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="sticky top-0 z-10 bg-gradient-to-r from-blue-800 to-indigo-900 text-white shadow-md p-4">
        <div className="container mx-auto px-2">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Editar Ação</h1>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-blue-700"
              onClick={() => router.push('/acoes')}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Voltar
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 flex-1">
        {error ? (
          <Card className="max-w-3xl mx-auto border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="text-red-700 mb-4">{error}</div>
              <Button
                variant="outline"
                onClick={() => router.push('/acoes')}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Voltar para a lista
              </Button>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
            <p className="text-gray-500">Carregando ação...</p>
          </div>
        ) : (
          <Card className="max-w-3xl mx-auto">
            <CardHeader>
              <CardTitle>Editar Ação</CardTitle>
              <CardDescription>
                Atualize os campos abaixo para modificar a ação.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="titulo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título</FormLabel>
                        <FormControl>
                          <Input placeholder="Título da ação" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="descricao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Descreva os detalhes da ação" 
                            className="min-h-[100px]" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="responsavel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Responsável</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome do responsável" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="dataInicio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Início</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dataFim"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Conclusão</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Pendente">Pendente</SelectItem>
                            <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                            <SelectItem value="Concluído">Concluído</SelectItem>
                            <SelectItem value="Atrasado">Atrasado</SelectItem>
                            <SelectItem value="Cancelado">Cancelado</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push('/acoes')}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Salvar
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}
      </main>

      <footer className="mt-auto border-t border-blue-800 p-4 text-center text-sm text-blue-300">
        © 2025 Deputado Federal Jadyel Alencar - Todos os direitos reservados
      </footer>
    </div>
  );
};

export default EditarAcaoPage; 