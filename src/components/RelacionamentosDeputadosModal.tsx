"use client";

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, Users, User, Building } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

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

interface RelacionamentosDeputadosModalProps {
  isOpen: boolean;
  onClose: () => void;
  municipio: string;
  deputadosFederais: string[];
  prefeitos: { nome: string; votos: number }[];
  vereadores: { nome: string; votos: number }[];
  onSave: (relacionamento: RelacionamentoDeputado) => Promise<void>;
  relacionamentoExistente?: RelacionamentoDeputado | null;
  relacionamentosExistentes?: RelacionamentoDeputado[];
}

export default function RelacionamentosDeputadosModal({
  isOpen,
  onClose,
  municipio,
  deputadosFederais,
  prefeitos,
  vereadores,
  onSave,
  relacionamentoExistente,
  relacionamentosExistentes = []
}: RelacionamentosDeputadosModalProps) {
  const [formData, setFormData] = useState<RelacionamentoDeputado>({
    municipio: municipio,
    deputadoFederal: '',
    prefeito: '',
    votacaoPrefeito: 0,
    vereadores: [],
    votacoesVereadores: [],
    nomesAdicionais: [],
    observacoes: ''
  });

  const [novoVereador, setNovoVereador] = useState('');
  const [novoNomeAdicional, setNovoNomeAdicional] = useState('');
  const [novoDeputadoFederal, setNovoDeputadoFederal] = useState('');
  const [loading, setLoading] = useState(false);

  // Filtrar opções já utilizadas em outros relacionamentos
  const prefeitosDisponiveis = prefeitos.filter(prefeito => {
    const jaUtilizado = relacionamentosExistentes.some(rel => 
      rel.id !== relacionamentoExistente?.id && 
      rel.prefeito === prefeito.nome
    );
    return !jaUtilizado;
  });

  const vereadoresDisponiveis = vereadores.filter(vereador => {
    const jaUtilizado = relacionamentosExistentes.some(rel => 
      rel.id !== relacionamentoExistente?.id && 
      rel.vereadores && 
      rel.vereadores.includes(vereador.nome)
    );
    return !jaUtilizado;
  });

  // Inicializar formulário quando modal abrir ou relacionamento existente mudar
  useEffect(() => {
    if (isOpen) {
      if (relacionamentoExistente) {
        setFormData(relacionamentoExistente);
      } else {
        setFormData({
          municipio: municipio,
          deputadoFederal: '',
          prefeito: '',
          votacaoPrefeito: 0,
          vereadores: [],
          votacoesVereadores: [],
          nomesAdicionais: [],
          observacoes: ''
        });
      }
    }
  }, [isOpen, relacionamentoExistente, municipio]);

  const handleInputChange = (field: keyof RelacionamentoDeputado, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePrefeitoChange = (prefeitoNome: string) => {
    const prefeitoSelecionado = prefeitos.find(p => p.nome === prefeitoNome);
    const votos = prefeitoSelecionado?.votos || 0;
    
    setFormData(prev => ({
      ...prev,
      prefeito: prefeitoNome,
      votacaoPrefeito: votos
    }));
  };

  const adicionarVereador = () => {
    if (novoVereador.trim() && !formData.vereadores.includes(novoVereador.trim())) {
      const vereadorSelecionado = vereadores.find(v => v.nome === novoVereador.trim());
      const votos = vereadorSelecionado?.votos || 0;
      
      setFormData(prev => ({
        ...prev,
        vereadores: [...prev.vereadores, novoVereador.trim()],
        votacoesVereadores: [...prev.votacoesVereadores, { nome: novoVereador.trim(), votos }]
      }));
      setNovoVereador('');
    }
  };

  const removerVereador = (vereador: string) => {
    setFormData(prev => ({
      ...prev,
      vereadores: prev.vereadores.filter(v => v !== vereador),
      votacoesVereadores: prev.votacoesVereadores.filter(v => v.nome !== vereador)
    }));
  };

  const adicionarNomeAdicional = () => {
    if (novoNomeAdicional.trim() && !formData.nomesAdicionais.includes(novoNomeAdicional.trim())) {
      setFormData(prev => ({
        ...prev,
        nomesAdicionais: [...prev.nomesAdicionais, novoNomeAdicional.trim()]
      }));
      setNovoNomeAdicional('');
    }
  };

  const adicionarNovoDeputado = () => {
    if (novoDeputadoFederal.trim() && !deputadosFederais.includes(novoDeputadoFederal.trim())) {
      setFormData(prev => ({
        ...prev,
        deputadoFederal: novoDeputadoFederal.trim()
      }));
      setNovoDeputadoFederal('');
    }
  };

  const removerNomeAdicional = (nome: string) => {
    setFormData(prev => ({
      ...prev,
      nomesAdicionais: prev.nomesAdicionais.filter(n => n !== nome)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.deputadoFederal.trim()) {
      alert('Selecione um Deputado Federal');
      return;
    }

    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar relacionamento:', error);
      alert('Erro ao salvar relacionamento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {relacionamentoExistente ? 'Editar Relacionamento' : 'Novo Relacionamento'} - {municipio}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Deputado Federal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deputado Federal *
            </label>
            <select
              value={formData.deputadoFederal}
              onChange={(e) => handleInputChange('deputadoFederal', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Selecione um Deputado Federal</option>
              {deputadosFederais.map((deputado, index) => (
                <option key={index} value={deputado}>
                  {deputado}
                </option>
              ))}
            </select>
            
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
                disabled={!novoDeputadoFederal.trim()}
                size="sm"
                variant="outline"
                className="flex items-center gap-1"
              >
                <Users className="h-3 w-3" />
                Adicionar
              </Button>
            </div>
          </div>

          {/* Prefeito */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="h-4 w-4 inline mr-1" />
              Prefeito
            </label>
            <select
              value={formData.prefeito}
              onChange={(e) => handlePrefeitoChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione um Prefeito</option>
              {prefeitosDisponiveis.map((prefeito, index) => (
                <option key={index} value={prefeito.nome}>
                  {prefeito.nome} ({prefeito.votos.toLocaleString()} votos)
                </option>
              ))}
            </select>
            {prefeitosDisponiveis.length === 0 && prefeitos.length > 0 && (
              <p className="text-sm text-orange-600 mt-1">
                ⚠️ Todos os prefeitos já estão relacionados a outros deputados
              </p>
            )}
            {formData.prefeito && formData.votacaoPrefeito && (
              <div className="mt-2 text-sm text-gray-600">
                <span className="font-medium">Votação:</span> {formData.votacaoPrefeito.toLocaleString()} votos
              </div>
            )}
          </div>

          {/* Vereadores */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Building className="h-4 w-4 inline mr-1" />
              Vereadores
            </label>
            
            {/* Lista de vereadores selecionados */}
            {formData.vereadores.length > 0 && (
              <div className="mb-3 space-y-2">
                {formData.vereadores.map((vereador, index) => {
                  const votacao = formData.votacoesVereadores.find(v => v.nome === vereador);
                  return (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          {vereador}
                        </Badge>
                        {votacao && (
                          <span className="text-sm text-gray-600">
                            {votacao.votos.toLocaleString()} votos
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removerVereador(vereador)}
                        className="hover:text-red-600 p-1"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Adicionar novo vereador */}
            <div className="flex gap-2">
              <select
                value={novoVereador}
                onChange={(e) => setNovoVereador(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione um Vereador</option>
                {vereadoresDisponiveis
                  .filter(v => !formData.vereadores.includes(v.nome))
                  .map((vereador, index) => (
                    <option key={index} value={vereador.nome}>
                      {vereador.nome} ({vereador.votos.toLocaleString()} votos)
                    </option>
                  ))}
              </select>
              <Button
                type="button"
                onClick={adicionarVereador}
                disabled={!novoVereador.trim()}
                size="sm"
                variant="outline"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Nomes Adicionais */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nomes Adicionais (fora das listas)
            </label>
            
            {/* Lista de nomes adicionais */}
            {formData.nomesAdicionais.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {formData.nomesAdicionais.map((nome, index) => (
                  <Badge key={index} variant="outline" className="flex items-center gap-1">
                    {nome}
                    <button
                      type="button"
                      onClick={() => removerNomeAdicional(nome)}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Adicionar novo nome */}
            <div className="flex gap-2">
              <Input
                type="text"
                value={novoNomeAdicional}
                onChange={(e) => setNovoNomeAdicional(e.target.value)}
                placeholder="Digite o nome completo"
                className="flex-1"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    adicionarNomeAdicional();
                  }
                }}
              />
              <Button
                type="button"
                onClick={adicionarNomeAdicional}
                disabled={!novoNomeAdicional.trim()}
                size="sm"
                variant="outline"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Totalizador de Votos */}
          {(() => {
            const totalVotosPrefeito = formData.votacaoPrefeito || 0;
            const totalVotosVereadores = formData.votacoesVereadores?.reduce((acc, v) => acc + v.votos, 0) || 0;
            const totalGeral = totalVotosPrefeito + totalVotosVereadores;
            
            if (totalGeral > 0) {
              return (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">Total de Votos</span>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-blue-900">
                        {totalGeral.toLocaleString()}
                      </div>
                      <div className="text-xs text-blue-600">
                        {totalVotosPrefeito > 0 && `${totalVotosPrefeito.toLocaleString()} votos prefeito`}
                        {totalVotosPrefeito > 0 && totalVotosVereadores > 0 && ' + '}
                        {totalVotosVereadores > 0 && `${totalVotosVereadores.toLocaleString()} votos vereadores`}
                      </div>
                    </div>
                  </div>
                </div>
              );
            }
            return null;
          })()}

          {/* Observações */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observações
            </label>
            <Textarea
              value={formData.observacoes}
              onChange={(e) => handleInputChange('observacoes', e.target.value)}
              placeholder="Informações adicionais sobre o relacionamento..."
              rows={3}
              className="w-full"
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
              disabled={loading || !formData.deputadoFederal.trim()}
              className="flex items-center gap-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Save className="h-4 w-4" />
              )}
              {relacionamentoExistente ? 'Atualizar' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
