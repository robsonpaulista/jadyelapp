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
  vereadores: string[];
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
  prefeitos: string[];
  vereadores: string[];
  onSave: (relacionamento: RelacionamentoDeputado) => Promise<void>;
  relacionamentoExistente?: RelacionamentoDeputado | null;
}

export default function RelacionamentosDeputadosModal({
  isOpen,
  onClose,
  municipio,
  deputadosFederais,
  prefeitos,
  vereadores,
  onSave,
  relacionamentoExistente
}: RelacionamentosDeputadosModalProps) {
  const [formData, setFormData] = useState<RelacionamentoDeputado>({
    municipio: municipio,
    deputadoFederal: '',
    prefeito: '',
    vereadores: [],
    nomesAdicionais: [],
    observacoes: ''
  });

  const [novoVereador, setNovoVereador] = useState('');
  const [novoNomeAdicional, setNovoNomeAdicional] = useState('');
  const [loading, setLoading] = useState(false);

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
          vereadores: [],
          nomesAdicionais: [],
          observacoes: ''
        });
      }
    }
  }, [isOpen, relacionamentoExistente, municipio]);

  const handleInputChange = (field: keyof RelacionamentoDeputado, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const adicionarVereador = () => {
    if (novoVereador.trim() && !formData.vereadores.includes(novoVereador.trim())) {
      setFormData(prev => ({
        ...prev,
        vereadores: [...prev.vereadores, novoVereador.trim()]
      }));
      setNovoVereador('');
    }
  };

  const removerVereador = (vereador: string) => {
    setFormData(prev => ({
      ...prev,
      vereadores: prev.vereadores.filter(v => v !== vereador)
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
          </div>

          {/* Prefeito */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="h-4 w-4 inline mr-1" />
              Prefeito
            </label>
            <select
              value={formData.prefeito}
              onChange={(e) => handleInputChange('prefeito', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione um Prefeito</option>
              {prefeitos.map((prefeito, index) => (
                <option key={index} value={prefeito}>
                  {prefeito}
                </option>
              ))}
            </select>
          </div>

          {/* Vereadores */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Building className="h-4 w-4 inline mr-1" />
              Vereadores
            </label>
            
            {/* Lista de vereadores selecionados */}
            {formData.vereadores.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {formData.vereadores.map((vereador, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {vereador}
                    <button
                      type="button"
                      onClick={() => removerVereador(vereador)}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
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
                {vereadores
                  .filter(v => !formData.vereadores.includes(v))
                  .map((vereador, index) => (
                    <option key={index} value={vereador}>
                      {vereador}
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
