"use client";

import React, { useState, useEffect } from 'react';
import { X, Users, Building, User, Trash2, Edit, RefreshCw, TrendingUp } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RelacionamentoDuploClique {
  id?: string;
  municipio: string;
  nomePolitico: string;
  tipoPolitico: 'prefeito' | 'vereador';
  deputadosRelacionados: string[];
  votosPolitico?: number;
  observacoes?: string;
  dataCriacao?: string;
  dataAtualizacao?: string;
}

interface ModalRelacionamentosListProps {
  isOpen: boolean;
  onClose: () => void;
  municipio: string;
  onEdit?: (relacionamento: RelacionamentoDuploClique) => void;
  onDelete?: (id: string) => void;
}

export default function ModalRelacionamentosList({
  isOpen,
  onClose,
  municipio,
  onEdit,
  onDelete
}: ModalRelacionamentosListProps) {
  const [relacionamentos, setRelacionamentos] = useState<RelacionamentoDuploClique[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Carregar relacionamentos
  const carregarRelacionamentos = async () => {
    if (!municipio) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/relacionamentos-duplo-clique?municipio=${encodeURIComponent(municipio)}`);
      const data = await response.json();
      
      if (data.success) {
        setRelacionamentos(data.data);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Erro ao carregar relacionamentos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Carregar relacionamentos quando modal abrir
  useEffect(() => {
    if (isOpen) {
      carregarRelacionamentos();
    }
  }, [isOpen, municipio]);

  // Auto-refresh a cada 30 segundos
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      carregarRelacionamentos();
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [isOpen, municipio]);

  // Listener para atualizações em tempo real
  useEffect(() => {
    const handleRelacionamentoAtualizado = () => {
      carregarRelacionamentos();
    };

    window.addEventListener('relacionamentoAtualizado', handleRelacionamentoAtualizado);
    
    return () => {
      window.removeEventListener('relacionamentoAtualizado', handleRelacionamentoAtualizado);
    };
  }, [municipio]);

  // Calcular totalizadores
  const totalizadores = {
    totalRelacionamentos: relacionamentos.length,
    totalPoliticos: relacionamentos.length,
    totalDeputados: relacionamentos.reduce((acc, rel) => acc + rel.deputadosRelacionados.length, 0),
    totalVotos: relacionamentos.reduce((acc, rel) => acc + (rel.votosPolitico || 0), 0),
    prefeitos: relacionamentos.filter(rel => rel.tipoPolitico === 'prefeito').length,
    vereadores: relacionamentos.filter(rel => rel.tipoPolitico === 'vereador').length,
    deputadosUnicos: new Set(relacionamentos.flatMap(rel => rel.deputadosRelacionados)).size
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este relacionamento?')) return;
    
    try {
      const response = await fetch(`/api/relacionamentos-duplo-clique?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        await carregarRelacionamentos();
        // Notificar outros componentes
        window.dispatchEvent(new CustomEvent('relacionamentoAtualizado'));
      } else {
        alert('Erro ao remover relacionamento');
      }
    } catch (error) {
      console.error('Erro ao remover relacionamento:', error);
      alert('Erro ao remover relacionamento');
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Relacionamentos - {municipio}
            <Badge variant="secondary" className="ml-2">
              {totalizadores.totalRelacionamentos} relacionamentos
            </Badge>
          </DialogTitle>
        </DialogHeader>


        {/* Tabela de relacionamentos */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Carregando relacionamentos...</span>
            </div>
          ) : relacionamentos.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhum relacionamento encontrado para {municipio}</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border overflow-hidden">
              {/* Cabeçalho da tabela */}
              <div className="bg-gray-50 px-4 py-3 border-b">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Exibindo {relacionamentos.length} pessoas • {totalizadores.prefeitos} prefeitos • {totalizadores.vereadores} vereadores
                  </div>
                  <div className="text-sm font-semibold text-orange-600">
                    Total de Votos: {totalizadores.totalVotos.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Tabela */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        NOME
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        CARGO
                      </th>
                      {(() => {
                        // Obter todos os deputados únicos
                        const deputadosUnicos = Array.from(new Set(relacionamentos.flatMap(rel => rel.deputadosRelacionados)));
                        return deputadosUnicos.map((deputado, index) => (
                          <th key={index} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {deputado}
                          </th>
                        ));
                      })()}
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        AÇÕES
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {/* Linha de totais */}
                    <tr className="bg-blue-50 font-semibold">
                      <td className="px-4 py-3 text-sm font-bold text-gray-900">TOTAL</td>
                      <td className="px-4 py-3 text-sm font-bold text-gray-900">-</td>
                      {(() => {
                        const deputadosUnicos = Array.from(new Set(relacionamentos.flatMap(rel => rel.deputadosRelacionados)));
                        return deputadosUnicos.map((deputado, index) => {
                          const totalVotos = relacionamentos
                            .filter(rel => rel.deputadosRelacionados.includes(deputado))
                            .reduce((acc, rel) => acc + (rel.votosPolitico || 0), 0);
                          return (
                            <td key={index} className="px-4 py-3 text-sm font-bold text-blue-600">
                              {totalVotos.toLocaleString()}
                            </td>
                          );
                        });
                      })()}
                      <td className="px-4 py-3 text-sm font-bold text-gray-900">-</td>
                    </tr>

                    {/* Linhas dos relacionamentos */}
                    {relacionamentos.map((relacionamento) => {
                      const deputadosUnicos = Array.from(new Set(relacionamentos.flatMap(rel => rel.deputadosRelacionados)));
                      return (
                        <tr key={relacionamento.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                            {relacionamento.nomePolitico}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {relacionamento.tipoPolitico === 'prefeito' ? 'Prefeito' : 'Vereador'}
                          </td>
                          {deputadosUnicos.map((deputado, index) => (
                            <td key={index} className="px-4 py-3 text-sm text-gray-900">
                              {relacionamento.deputadosRelacionados.includes(deputado) ? 
                                (relacionamento.votosPolitico || 0).toLocaleString() : 
                                '-'
                              }
                            </td>
                          ))}
                          <td className="px-4 py-3 text-sm text-gray-500">
                            <div className="flex gap-2">
                              {onEdit && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => onEdit(relacionamento)}
                                  className="h-7 px-2 text-xs"
                                >
                                  Editar
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete(relacionamento.id!)}
                                className="h-7 px-2 text-xs text-red-600 hover:text-red-800 hover:bg-red-50"
                              >
                                Remover
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer com informações de atualização */}
        <div className="flex justify-between items-center pt-4 border-t text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span>Última atualização: {lastUpdate.toLocaleTimeString()}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={carregarRelacionamentos}
            disabled={loading}
            className="flex items-center gap-1"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
