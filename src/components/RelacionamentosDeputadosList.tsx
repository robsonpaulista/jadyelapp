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
                {relacionamentos.length} relacionamento{relacionamentos.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </div>
      )}

      {relacionamentos.map((relacionamento) => (
        <Card key={relacionamento.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  {relacionamento.deputadoFederal}
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  {relacionamento.municipio}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit(relacionamento)}
                  className="flex items-center gap-1"
                >
                  <Edit className="h-4 w-4" />
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => relacionamento.id && onDelete(relacionamento.id)}
                  disabled={!relacionamento.id}
                  className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Remover
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            <div className="space-y-4">
              {/* Prefeito */}
              {relacionamento.prefeito && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-gray-700">Prefeito</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {relacionamento.prefeito}
                    </Badge>
                    {relacionamento.votacaoPrefeito && (
                      <span className="text-sm text-gray-600">
                        ({relacionamento.votacaoPrefeito.toLocaleString()} votos)
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Vereadores */}
              {relacionamento.vereadores.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Building className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">
                      Vereadores ({relacionamento.vereadores.length})
                    </span>
                  </div>
                  <div className="space-y-2">
                    {relacionamento.vereadores.map((vereador, index) => {
                      const votacao = relacionamento.votacoesVereadores?.find(v => v.nome === vereador);
                      return (
                        <div key={index} className="flex items-center gap-2">
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            {vereador}
                          </Badge>
                          {votacao && (
                            <span className="text-sm text-gray-600">
                              ({votacao.votos.toLocaleString()} votos)
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Nomes Adicionais */}
              {relacionamento.nomesAdicionais.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium text-gray-700">
                      Nomes Adicionais ({relacionamento.nomesAdicionais.length})
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {relacionamento.nomesAdicionais.map((nome, index) => (
                      <Badge key={index} variant="outline" className="bg-purple-50 text-purple-800 border-purple-200">
                        {nome}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Observações */}
              {relacionamento.observacoes && (
                <div>
                  <span className="text-sm font-medium text-gray-700">Observações:</span>
                  <p className="text-sm text-gray-600 mt-1 bg-gray-50 p-2 rounded">
                    {relacionamento.observacoes}
                  </p>
                </div>
              )}

              {/* Totalizador de Votos */}
              {(() => {
                const totalVotosPrefeito = relacionamento.votacaoPrefeito || 0;
                const totalVotosVereadores = relacionamento.votacoesVereadores?.reduce((acc, v) => acc + v.votos, 0) || 0;
                const totalGeral = totalVotosPrefeito + totalVotosVereadores;
                
                if (totalGeral > 0) {
                  return (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800">Total de Votos</span>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-blue-900">
                            {totalGeral.toLocaleString()}
                          </div>
                          <div className="text-xs text-blue-600">
                            {totalVotosPrefeito > 0 && `${totalVotosPrefeito.toLocaleString()} prefeito`}
                            {totalVotosPrefeito > 0 && totalVotosVereadores > 0 && ' + '}
                            {totalVotosVereadores > 0 && `${totalVotosVereadores.toLocaleString()} vereadores`}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Datas */}
              <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>Criado: {formatDate(relacionamento.dataCriacao)}</span>
                </div>
                {relacionamento.dataAtualizacao && relacionamento.dataAtualizacao !== relacionamento.dataCriacao && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>Atualizado: {formatDate(relacionamento.dataAtualizacao)}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
