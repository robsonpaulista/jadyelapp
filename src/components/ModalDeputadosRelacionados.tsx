"use client";

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, Users, User, Building } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

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

interface ModalDeputadosRelacionadosProps {
  isOpen: boolean;
  onClose: () => void;
  municipio: string;
  nomePolitico: string;
  tipoPolitico: 'prefeito' | 'vereador';
  votosPolitico?: number;
  deputadosFederais: string[];
  onSave: (relacionamento: RelacionamentoDuploClique) => Promise<void>;
  relacionamentoExistente?: RelacionamentoDuploClique | null;
}

export default function ModalDeputadosRelacionados({
  isOpen,
  onClose,
  municipio,
  nomePolitico,
  tipoPolitico,
  votosPolitico = 0,
  deputadosFederais,
  onSave,
  relacionamentoExistente
}: ModalDeputadosRelacionadosProps) {
  const [formData, setFormData] = useState<RelacionamentoDuploClique>({
    municipio: municipio,
    nomePolitico: nomePolitico,
    tipoPolitico: tipoPolitico,
    deputadosRelacionados: [],
    votosPolitico: votosPolitico,
    observacoes: ''
  });

  const [novoDeputado, setNovoDeputado] = useState('');
  const [novoDeputadoFederal, setNovoDeputadoFederal] = useState('');
  const [loading, setLoading] = useState(false);
  const [deputadosAdicionais, setDeputadosAdicionais] = useState<string[]>([]);
  const [loadingAdicionar, setLoadingAdicionar] = useState(false);

  // Carregar deputados adicionais
  const carregarDeputadosAdicionais = async () => {
    try {
      const response = await fetch('/api/deputados-federais');
      const data = await response.json();
      if (data.success) {
        const nomes = data.data.map((dep: any) => dep.nome);
        setDeputadosAdicionais(nomes);
      }
    } catch (error) {
      console.error('Erro ao carregar deputados adicionais:', error);
    }
  };

  // Inicializar formulário quando modal abrir ou relacionamento existente mudar
  useEffect(() => {
    if (isOpen) {
      // Carregar deputados adicionais
      carregarDeputadosAdicionais();
      
      if (relacionamentoExistente) {
        setFormData(relacionamentoExistente);
      } else {
        setFormData({
          municipio: municipio,
          nomePolitico: nomePolitico,
          tipoPolitico: tipoPolitico,
          deputadosRelacionados: [],
          votosPolitico: votosPolitico,
          observacoes: ''
        });
      }
    }
  }, [isOpen, relacionamentoExistente, municipio, nomePolitico, tipoPolitico, votosPolitico, deputadosFederais]);

  const adicionarDeputado = () => {
    if (novoDeputado.trim() && !formData.deputadosRelacionados.includes(novoDeputado.trim())) {
      setFormData(prev => ({
        ...prev,
        deputadosRelacionados: [...prev.deputadosRelacionados, novoDeputado.trim()]
      }));
      setNovoDeputado('');
    }
  };

  const removerDeputado = (deputado: string) => {
    setFormData(prev => ({
      ...prev,
      deputadosRelacionados: prev.deputadosRelacionados.filter(d => d !== deputado)
    }));
  };

  const adicionarNovoDeputado = async () => {
    if (novoDeputadoFederal.trim()) {
      const nomeDeputado = novoDeputadoFederal.trim();
      
      // Verificar se já existe na lista original ou adicionais
      const todosDeputados = [...deputadosFederais, ...deputadosAdicionais];
      if (todosDeputados.includes(nomeDeputado)) {
        alert('Este deputado já existe na lista.');
        return;
      }

      setLoadingAdicionar(true);
      try {
        // Salvar no Firebase
        const response = await fetch('/api/deputados-federais', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ nome: nomeDeputado }),
        });

        const data = await response.json();
        
        if (data.success) {
          // Adicionar à lista local
          setDeputadosAdicionais(prev => [...prev, nomeDeputado]);
          
          // Adicionar ao relacionamento atual
          setFormData(prev => ({
            ...prev,
            deputadosRelacionados: [...prev.deputadosRelacionados, nomeDeputado]
          }));
          
          setNovoDeputadoFederal('');
          alert('Deputado adicionado com sucesso!');
        } else {
          alert(data.error || 'Erro ao adicionar deputado.');
        }
      } catch (error) {
        console.error('Erro ao adicionar deputado:', error);
        alert('Erro ao adicionar deputado. Tente novamente.');
      } finally {
        setLoadingAdicionar(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.deputadosRelacionados.length === 0) {
      alert('Selecione pelo menos um deputado federal.');
      return;
    }

    setLoading(true);
    try {
      const relacionamentoCompleto = {
        ...formData,
        dataCriacao: relacionamentoExistente?.dataCriacao || new Date().toISOString(),
        dataAtualizacao: new Date().toISOString()
      };
      
      await onSave(relacionamentoCompleto);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar relacionamento:', error);
      alert('Erro ao salvar relacionamento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Relacionar Deputados - {tipoPolitico === 'prefeito' ? 'Prefeito' : 'Vereador'}: {nomePolitico}
            {votosPolitico > 0 && (
              <Badge variant="secondary" className="ml-2">
                {votosPolitico.toLocaleString()} votos
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações do Político */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Building className="h-4 w-4 text-gray-600" />
              <span className="font-medium text-gray-700">Município: {municipio}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-600" />
              <span className="text-gray-700">
                {tipoPolitico === 'prefeito' ? 'Prefeito' : 'Vereador'}: {nomePolitico}
              </span>
            </div>
          </div>

          {/* Deputados Federais Relacionados */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deputados Federais Relacionados *
            </label>
            
            <div className="flex gap-2">
              <select
                value={novoDeputado}
                onChange={(e) => setNovoDeputado(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione um Deputado Federal</option>
                {[...deputadosFederais, ...deputadosAdicionais]
                  .filter(d => !formData.deputadosRelacionados.includes(d))
                  .map((deputado, index) => (
                    <option key={index} value={deputado}>
                      {deputado}
                    </option>
                  ))}
              </select>
              <Button
                type="button"
                onClick={adicionarDeputado}
                disabled={!novoDeputado.trim()}
                size="sm"
                variant="outline"
                className="flex items-center gap-1"
              >
                <Plus className="h-3 w-3" />
                Adicionar
              </Button>
            </div>
            
            {/* Campo para adicionar novo deputado */}
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={novoDeputadoFederal}
                onChange={(e) => setNovoDeputadoFederal(e.target.value)}
                placeholder="Ou digite um novo deputado federal"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <Button
                type="button"
                onClick={adicionarNovoDeputado}
                disabled={!novoDeputadoFederal.trim() || loadingAdicionar}
                size="sm"
                variant="outline"
                className="flex items-center gap-1"
              >
                {loadingAdicionar ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Users className="h-3 w-3" />
                    Adicionar
                  </>
                )}
              </Button>
            </div>

            {/* Lista de deputados selecionados */}
            {formData.deputadosRelacionados.length > 0 && (
              <div className="mt-3 space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Deputados Selecionados:</h4>
                <div className="space-y-1">
                  {formData.deputadosRelacionados.map((deputado, index) => (
                    <div key={index} className="flex items-center justify-between bg-blue-50 px-3 py-2 rounded-md">
                      <span className="text-sm text-blue-800">{deputado}</span>
                      <Button
                        type="button"
                        onClick={() => removerDeputado(deputado)}
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-red-600 hover:text-red-800 hover:bg-red-100"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Observações */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observações
            </label>
            <Textarea
              value={formData.observacoes}
              onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
              placeholder="Informações adicionais sobre o relacionamento..."
              className="w-full"
              rows={3}
            />
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || formData.deputadosRelacionados.length === 0}
              className="flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Salvar
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}