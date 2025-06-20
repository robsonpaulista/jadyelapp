'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';
import { ChevronLeft, Edit, Trash2, Calendar, User, Clock, Loader2, Users } from 'lucide-react';
import { isUserLoggedIn } from '@/lib/storage';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Acao } from '@/app/api/acoes/route';

// Interface para pessoa
interface Pessoa {
  id: string;
  nome: string;
  cpf: string;
  dataNascimento: string;
  genero: string;
  endereco: string;
  numero: string;
  bairro: string;
  municipio: string;
  telefone: string;
  email: string;
  escolaridade: string;
  rendaFamiliar: string;
  observacoes: string;
  acaoId: string;
  acaoTitulo: string;
  dataAgendamento: string;
  hora: string;
  local: string;
  dataDoAtendimento: string;
  criadoEm: string;
  atualizadoEm: string;
}

const DetalhesAcaoPage = () => {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  
  const [acao, setAcao] = useState<Acao | null>(null);
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Buscar a ação pelo ID e as pessoas relacionadas
  useEffect(() => {
    if (!isUserLoggedIn()) {
      router.push('/login');
      return;
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Buscar ação
        const acaoResponse = await fetch(`/api/acoes?id=${id}`);
        if (!acaoResponse.ok) {
          const errorData = await acaoResponse.json();
          throw new Error(errorData.error || 'Erro ao buscar ação');
        }
        
        const acaoData = await acaoResponse.json();
        
        if (!acaoData.success || !acaoData.data) {
          throw new Error('Erro ao buscar ação');
        }
        
        setAcao(acaoData.data);

        // Buscar pessoas filtradas por ação
        const pessoasResponse = await fetch(`/api/pessoas?acaoId=${id}`);
        if (!pessoasResponse.ok) {
          throw new Error('Erro ao buscar pessoas');
        }

        const pessoasData = await pessoasResponse.json();
        if (!Array.isArray(pessoasData)) {
          throw new Error('Formato de dados inválido');
        }

        setPessoas(pessoasData);
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
        setError(error instanceof Error ? error.message : 'Erro desconhecido ao carregar dados');
        toast.error(`Erro ao carregar dados: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id, router]);

  // Função para formatar data
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'dd/MM/yyyy', { locale: ptBR });
    } catch (error) {
      return dateString || 'N/A';
    }
  };

  // Cores baseadas no status da ação
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'em andamento':
        return 'bg-blue-100 text-blue-800';
      case 'concluído':
      case 'concluida':
      case 'concluída':
        return 'bg-green-100 text-green-800';
      case 'atrasado':
        return 'bg-red-100 text-red-800';
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelado':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-500';
    }
  };

  // Função para determinar o status da pessoa
  const getPessoaStatus = (pessoa: Pessoa) => {
    if (pessoa.dataDoAtendimento) {
      return 'Atendimento Finalizado';
    } else if (pessoa.dataAgendamento) {
      return 'Agendamento Realizado';
    } else {
      return 'Aguardando Agendamento';
    }
  };

  // Função para obter a cor do status da pessoa
  const getPessoaStatusColor = (status: string) => {
    switch (status) {
      case 'Atendimento Finalizado':
        return 'bg-green-100 text-green-800';
      case 'Agendamento Realizado':
        return 'bg-blue-100 text-blue-800';
      case 'Aguardando Agendamento':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-500';
    }
  };

  // Agrupar pessoas por município e bairro
  const pessoasAgrupadas = pessoas.reduce((acc, pessoa) => {
    const key = `${pessoa.municipio}-${pessoa.bairro}`;
    if (!acc[key]) {
      acc[key] = {
        municipio: pessoa.municipio,
        bairro: pessoa.bairro,
        pessoas: []
      };
    }
    acc[key].pessoas.push(pessoa);
    return acc;
  }, {} as Record<string, { municipio: string; bairro: string; pessoas: Pessoa[] }>);

  // Deletar a ação
  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir esta ação? Todas as pessoas vinculadas a ela também serão excluídas.')) {
      return;
    }
    
    try {
      setIsDeleting(true);
      
      const response = await fetch(`/api/acoes/delete?id=${id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Erro ao excluir ação');
      }
      
      toast.success(data.message || 'Ação excluída com sucesso!');
      
      // Redirecionar para a lista de ações
      router.push('/acoes');
    } catch (error) {
      console.error('Erro ao excluir ação:', error);
      toast.error(`Erro ao excluir: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="sticky top-0 z-10 bg-gradient-to-r from-blue-800 to-indigo-900 text-white shadow-md p-4">
        <div className="container mx-auto px-2">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Detalhes da Ação</h1>
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
            <p className="text-gray-500">Carregando dados...</p>
          </div>
        ) : acao ? (
          <div className="space-y-6">
            <Card className="max-w-3xl mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div>{acao.titulo}</div>
                  <Badge className={getStatusColor(acao.status)}>
                    {acao.status}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  ID: {acao.id}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Descrição</h3>
                  <div className="bg-gray-50 p-4 rounded-md whitespace-pre-wrap">
                    {acao.descricao}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Informações Gerais</h3>
                    <div className="space-y-3">
                      <div className="flex items-center text-gray-700">
                        <User className="h-4 w-4 mr-2" />
                        <span className="font-medium mr-2">Responsável:</span>
                        {acao.responsavel}
                      </div>
                      <div className="flex items-center text-gray-700">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span className="font-medium mr-2">Data de Início:</span>
                        {formatDate(acao.dataInicio)}
                      </div>
                      <div className="flex items-center text-gray-700">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span className="font-medium mr-2">Data de Fim:</span>
                        {formatDate(acao.dataFim)}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">Histórico</h3>
                    <div className="space-y-3">
                      <div className="flex items-center text-gray-700">
                        <Clock className="h-4 w-4 mr-2" />
                        <span className="font-medium mr-2">Criado em:</span>
                        {formatDate(acao.criadoEm || '')}
                      </div>
                      <div className="flex items-center text-gray-700">
                        <Clock className="h-4 w-4 mr-2" />
                        <span className="font-medium mr-2">Atualizado em:</span>
                        {formatDate(acao.atualizadoEm || '')}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/acoes/${id}/editar`)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  className="text-red-600 hover:text-red-700 hover:bg-red-100 border-red-200"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Excluindo...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>

            {/* Seção de Pessoas */}
            <Card className="max-w-3xl mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Pessoas Incluídas
                </CardTitle>
                <CardDescription>
                  Total de {pessoas.length} pessoas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {Object.values(pessoasAgrupadas).map((grupo) => (
                    <div key={`${grupo.municipio}-${grupo.bairro}`} className="border rounded-lg p-4">
                      <h3 className="text-lg font-medium mb-3">
                        {grupo.municipio} - {grupo.bairro}
                      </h3>
                      <div className="space-y-4">
                        {grupo.pessoas.map((pessoa) => (
                          <div key={pessoa.id} className="bg-gray-50 p-4 rounded-md">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-medium">{pessoa.nome}</h4>
                                <p className="text-sm text-gray-500">
                                  {pessoa.telefone} | {pessoa.email}
                                </p>
                              </div>
                              <Badge className={getPessoaStatusColor(getPessoaStatus(pessoa))}>
                                {getPessoaStatus(pessoa)}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="font-medium">Endereço:</span> {pessoa.endereco}, {pessoa.numero}
                              </div>
                              <div>
                                <span className="font-medium">CPF:</span> {pessoa.cpf}
                              </div>
                              {pessoa.dataAgendamento && (
                                <div>
                                  <span className="font-medium">Agendamento:</span>{' '}
                                  {format(parseISO(pessoa.dataAgendamento), 'dd/MM/yyyy', { locale: ptBR })} às {pessoa.hora}
                                </div>
                              )}
                              {pessoa.dataDoAtendimento && (
                                <div>
                                  <span className="font-medium">Atendimento:</span>{' '}
                                  {format(parseISO(pessoa.dataDoAtendimento), 'dd/MM/yyyy', { locale: ptBR })}
                                </div>
                              )}
                              <div>
                                <span className="font-medium">Local:</span> {pessoa.local}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="max-w-3xl mx-auto border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="text-yellow-700 mb-4">Ação não encontrada.</div>
              <Button
                variant="outline"
                onClick={() => router.push('/acoes')}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Voltar para a lista
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Rodapé */}
      <footer className="mt-auto border-t border-blue-800 p-4 text-center text-sm text-blue-300">
        © 2025 Deputado Federal Jadyel Alencar - Todos os direitos reservados
      </footer>
    </div>
  );
};

export default DetalhesAcaoPage; 