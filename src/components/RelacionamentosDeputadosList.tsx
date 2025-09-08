"use client";

import React from 'react';
import { Edit, Trash2, Users, User, Building, Calendar } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RelacionamentoDeputado {
  id?: string;
  municipio: string;
  deputadoFederal: string;
  prefeito?: string;
  votacaoPrefeito?: number;
  vereadores: string[];
  votacoesVereadores: { nome: string; votos: number }[];
  nomesAdicionais: string[];
  observacoes?: string;
  dataCriacao?: string;
  dataAtualizacao?: string;
}

interface RelacionamentosDeputadosListProps {
  relacionamentos: RelacionamentoDeputado[];
  onEdit: (relacionamento: RelacionamentoDeputado) => void;
  onDelete: (id: string) => void;
  loading?: boolean;
}

export default function RelacionamentosDeputadosList({
  relacionamentos,
  onEdit,
  onDelete,
  loading = false
}: RelacionamentosDeputadosListProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Carregando relacionamentos...</span>
      </div>
    );
  }

  if (relacionamentos.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Users className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">Nenhum relacionamento encontrado</p>
          <p className="text-sm text-gray-400 mt-1">
            Clique em "Novo Relacionamento" para começar
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calcular total geral de votos
  const totalGeralVotos = relacionamentos.reduce((total, rel) => {
    const votosPrefeito = rel.votacaoPrefeito || 0;
    const votosVereadores = rel.votacoesVereadores?.reduce((acc, v) => acc + v.votos, 0) || 0;
    return total + votosPrefeito + votosVereadores;
  }, 0);

  // Preparar dados para a tabela - Deputados como colunas, Pessoas como linhas
  const deputadosFederais = [...new Set(relacionamentos.map(rel => rel.deputadoFederal))];
  
  // Coletar todas as pessoas (prefeitos e vereadores) únicas
  const todasPessoas = [];
  relacionamentos.forEach(rel => {
    // Adicionar prefeito se existir
    if (rel.prefeito && rel.votacaoPrefeito) {
      todasPessoas.push({
        nome: rel.prefeito,
        cargo: 'Prefeito',
        votos: rel.votacaoPrefeito,
        relacionamentoId: rel.id,
        relacionamento: rel
      });
    }
    
    // Adicionar vereadores
    if (rel.vereadores.length > 0 && rel.votacoesVereadores) {
      rel.vereadores.forEach(vereador => {
        const votacao = rel.votacoesVereadores.find(v => v.nome === vereador);
        if (votacao) {
          todasPessoas.push({
            nome: vereador,
            cargo: 'Vereador',
            votos: votacao.votos,
            relacionamentoId: rel.id,
            relacionamento: rel
          });
        }
      });
    }
  });

  // Remover duplicatas baseado no nome
  const pessoasUnicas = todasPessoas.filter((pessoa, index, array) => 
    array.findIndex(p => p.nome === pessoa.nome) === index
  );

  return (
    <div className="space-y-4">
      {/* Totalizador Geral */}
      {totalGeralVotos > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Total Geral de Votos</span>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-900">
                {totalGeralVotos.toLocaleString()}
              </div>
              <div className="text-xs text-blue-600">
                {relacionamentos.length} relacionamento{relacionamentos.length !== 1 ? 's' : ''} • {pessoasUnicas.length} pessoa{pessoasUnicas.length !== 1 ? 's' : ''} • {deputadosFederais.length} deputado{deputadosFederais.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabela - Deputados como colunas, Pessoas como linhas */}
      {pessoasUnicas.length > 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50">
                    Nome
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-16 bg-gray-50">
                    Cargo
                  </th>
                  {deputadosFederais.map((deputado, index) => (
                    <th key={index} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                      <div className="flex flex-col items-center">
                        <Users className="h-4 w-4 text-blue-600 mb-1" />
                        <span className="text-xs leading-tight">{deputado}</span>
                      </div>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pessoasUnicas.map((pessoa, index) => (
                  <tr key={`${pessoa.nome}_${index}`} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap sticky left-0 bg-white">
                      <span className="text-sm font-medium text-gray-900">{pessoa.nome}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap sticky left-16 bg-white">
                      <Badge 
                        variant="secondary" 
                        className={
                          pessoa.cargo === 'Prefeito' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }
                      >
                        {pessoa.cargo}
                      </Badge>
                    </td>
                    {deputadosFederais.map((deputado, depIndex) => {
                      // Verificar se esta pessoa está relacionada a este deputado
                      const relacionamento = relacionamentos.find(rel => 
                        rel.deputadoFederal === deputado && 
                        ((rel.prefeito === pessoa.nome) || 
                         (rel.vereadores.includes(pessoa.nome)))
                      );
                      
                      return (
                        <td key={depIndex} className="px-4 py-3 whitespace-nowrap text-center">
                          {relacionamento ? (
                            <div className="flex flex-col items-center">
                              <span className="text-sm font-medium text-gray-900">
                                {pessoa.votos.toLocaleString()}
                              </span>
                              <span className="text-xs text-gray-500">votos</span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onEdit(pessoa.relacionamento)}
                          className="flex items-center gap-1"
                        >
                          <Edit className="h-3 w-3" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => pessoa.relacionamentoId && onDelete(pessoa.relacionamentoId)}
                          disabled={!pessoa.relacionamentoId}
                          className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                          Remover
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <Users className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Nenhum relacionamento encontrado</p>
            <p className="text-sm text-gray-400 mt-1">
              Clique em "Novo Relacionamento" para começar
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
