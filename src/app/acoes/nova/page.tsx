'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-hot-toast';
import { ChevronLeft, Save, Loader2, LogOut, User as UserIcon, ShieldCheck } from 'lucide-react';
import { isUserLoggedIn, getCurrentUser } from '@/lib/storage';
import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

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

const NovaAcaoPage = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [greeting, setGreeting] = useState<string>('');

  // Inicializar o formulário com o schema de validação
  const form = useForm<AcaoFormValues>({
    resolver: zodResolver(acaoSchema),
    defaultValues: {
      titulo: '',
      descricao: '',
      responsavel: '',
      dataInicio: new Date().toISOString().split('T')[0],
      dataFim: '',
      status: 'Pendente',
    },
  });

  // Função para definir a saudação de acordo com o horário
  const updateGreeting = () => {
    const currentHour = new Date().getHours();
    let newGreeting = '';
    
    if (currentHour >= 5 && currentHour < 12) {
      newGreeting = 'Bom dia';
    } else if (currentHour >= 12 && currentHour < 18) {
      newGreeting = 'Boa tarde';
    } else {
      newGreeting = 'Boa noite';
    }
    
    setGreeting(newGreeting);
  };

  // Verificar se o usuário está logado e carregar dados do usuário
  useEffect(() => {
    const loadUserData = async () => {
      if (!isUserLoggedIn()) {
        router.push('/login');
        return;
      }
      
      try {
        const userData = await getCurrentUser();
        if (userData) {
          setUser(userData);
        }
      } catch (error) {
        console.error("Erro ao carregar dados do usuário:", error);
      }
    };
    
    loadUserData();
    updateGreeting();
  }, [router]);

  // Função para lidar com o envio do formulário
  const onSubmit = async (data: AcaoFormValues) => {
    try {
      setIsSubmitting(true);
      
      const response = await fetch('/api/acoes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || `Erro ${response.status} ao criar ação`);
      }
      
      toast.success('Ação criada com sucesso!');
      
      // Redirecionar para a lista de ações
      router.push('/acoes');
    } catch (error) {
      console.error('Erro ao criar ação:', error);
      toast.error(`Erro ao criar ação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-gray-800 to-black">
      <header className="bg-gradient-to-b from-black to-gray-500 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-light tracking-tight text-white">Central de Atendimentos</h1>
            <p className="text-gray-200 text-sm font-extralight">
              Gerencie consultas, cadastros e atendimentos de pacientes
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {user && (
              <div className="hidden md:flex items-center space-x-2 bg-black/20 px-3 py-1 rounded-full border border-white/10">
                <div className="bg-indigo-500/50 rounded-full p-1 relative">
                  <UserIcon className="h-3.5 w-3.5 text-white" />
                  <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-400 rounded-full border border-gray-800"></div>
                </div>
                <div>
                  <div className="text-xs text-white font-light flex items-center">
                    {greeting}, {user.name}
                  </div>
                  <div className="text-[10px] text-gray-200 flex items-center font-extralight">
                    {user.role === 'admin' ? (
                      <>
                        <ShieldCheck className="h-2.5 w-2.5 mr-1" /> 
                        Administrador
                      </>
                    ) : (
                      <>
                        <UserIcon className="h-2.5 w-2.5 mr-1" />
                        Usuário
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
            <Button
              variant="ghost"
              className="gap-2 bg-black/20 hover:bg-black/30 border border-white/10 text-white"
              onClick={() => router.push('/acoes')}
            >
              <ChevronLeft className="h-4 w-4" />
              Voltar
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 flex-1">
        <Card className="max-w-3xl mx-auto bg-gray-800 text-white border-gray-700">
          <CardHeader>
            <CardTitle>Adicionar Nova Ação</CardTitle>
            <CardDescription className="text-gray-300">
              Preencha os campos abaixo para criar uma nova ação no sistema
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
                      <FormLabel className="text-gray-200">Título</FormLabel>
                      <FormControl>
                        <Input placeholder="Título da ação" className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400" {...field} />
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
                      <FormLabel className="text-gray-200">Descrição</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Descreva os detalhes da ação" 
                          className="min-h-[100px] bg-gray-700 border-gray-600 text-white placeholder:text-gray-400" 
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
                      <FormLabel className="text-gray-200">Responsável</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do responsável" className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400" {...field} />
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
                        <FormLabel className="text-gray-200">Data de Início</FormLabel>
                        <FormControl>
                          <Input type="date" className="bg-gray-700 border-gray-600 text-white" {...field} />
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
                        <FormLabel className="text-gray-200">Data de Conclusão</FormLabel>
                        <FormControl>
                          <Input type="date" className="bg-gray-700 border-gray-600 text-white" {...field} />
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
                      <FormLabel className="text-gray-200">Status</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-gray-800 border-gray-600 text-white">
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
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    onClick={() => router.push('/acoes')}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700"
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

        <footer className="mt-auto border-t border-blue-800 p-4 text-center text-sm text-white">
          © 2025 Deputado Federal Jadyel Alencar - Todos os direitos reservados
        </footer>
      </main>
    </div>
  );
};

export default NovaAcaoPage; 