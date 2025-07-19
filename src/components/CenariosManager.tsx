'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Copy, 
  Trash2, 
  Edit, 
  Eye, 
  Check, 
  X, 
  Save,
  AlertTriangle,
  Info,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Cenario, 
  CenarioCompleto, 
  PartidoCenario,
  listarCenarios, 
  carregarCenario, 
  criarNovoCenario, 
  excluirCenario, 
  ativarCenario,
  criarCenarioBase
} from '@/services/chapasService';

interface CenariosManagerProps {
  partidosAtuais: PartidoCenario[];
  quocienteAtual: number;
  onCenarioChange: (cenario: CenarioCompleto) => void;
  onCenarioBaseCreated: () => void;
  onCenarioDeleted?: () => void;
  onCenarioClick?: (cenarioId: string) => void;
}

export default function CenariosManager({ 
  partidosAtuais, 
  quocienteAtual, 
  onCenarioChange,
  onCenarioBaseCreated,
  onCenarioDeleted,
  onCenarioClick
}: CenariosManagerProps) {
  const [cenarios, setCenarios] = useState<Cenario[]>([]);
  const [cenarioAtivo, setCenarioAtivo] = useState<Cenario | null>(null);
  const [loading, setLoading] = useState(false);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [novoCenario, setNovoCenario] = useState({ nome: '', descricao: '', cenarioOrigem: '' });
  const [editandoCenario, setEditandoCenario] = useState<Cenario | null>(null);
  const [modoComparacao, setModoComparacao] = useState(false);
  const [cenarioComparacao, setCenarioComparacao] = useState<string>('');

  // Carregar cenários
  const carregarCenarios = async () => {
    setLoading(true);
    try {
      const cenariosList = await listarCenarios();
      setCenarios(cenariosList);
      
      // Encontrar cenário ativo
      const ativo = cenariosList.find(c => c.ativo);
      setCenarioAtivo(ativo || null);
    } catch (error) {
      console.error('Erro ao carregar cenários:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarCenarios();
  }, []);

  // Criar cenário base se não existir
  const criarBaseSeNecessario = async () => {
    if (cenarios.length === 0) {
      setLoading(true);
      try {
        await criarCenarioBase(partidosAtuais, quocienteAtual);
        await carregarCenarios();
        onCenarioBaseCreated();
      } catch (error) {
        console.error('Erro ao criar cenário base:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    criarBaseSeNecessario();
  }, [cenarios.length]);

  // Criar novo cenário
  const handleCriarCenario = async () => {
    if (!novoCenario.nome.trim()) {
      alert('Por favor, digite um nome para o cenário');
      return;
    }

    setLoading(true);
    try {
      const cenarioOrigemId = novoCenario.cenarioOrigem || (cenarioAtivo?.id || 'base');
      const novoCenarioId = await criarNovoCenario(
        novoCenario.nome,
        novoCenario.descricao,
        cenarioOrigemId
      );

      // Carregar o novo cenário
      const cenarioCompleto = await carregarCenario(novoCenarioId);
      if (cenarioCompleto) {
        onCenarioChange(cenarioCompleto);
      }

      // Limpar formulário e fechar dialog
      setNovoCenario({ nome: '', descricao: '', cenarioOrigem: '' });
      setDialogAberto(false);
      await carregarCenarios();
    } catch (error) {
      console.error('Erro ao criar cenário:', error);
      alert('Erro ao criar cenário. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Ativar cenário
  const handleAtivarCenario = async (cenarioId: string) => {
    setLoading(true);
    try {
      console.log('Ativando cenário:', cenarioId);
      
      // Desativar todos os cenários
      for (const cenario of cenarios) {
        await ativarCenario(cenario.id, false);
      }

      // Ativar o cenário selecionado
      await ativarCenario(cenarioId, true);

      // Carregar o cenário ativo
      const cenarioCompleto = await carregarCenario(cenarioId);
      if (cenarioCompleto) {
        console.log('Cenário carregado:', cenarioCompleto.nome);
        onCenarioChange(cenarioCompleto);
      } else {
        console.error('Erro: não foi possível carregar o cenário ativado');
      }

      await carregarCenarios();
    } catch (error) {
      console.error('Erro ao ativar cenário:', error);
      alert('Erro ao ativar cenário. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Excluir cenário
  const handleExcluirCenario = async (cenarioId: string) => {
    setLoading(true);
    try {
      // Verificar se o cenário sendo excluído é o ativo
      const cenarioSendoExcluido = cenarios.find(c => c.id === cenarioId);
      const eraCenarioAtivo = cenarioSendoExcluido?.ativo;
      
      await excluirCenario(cenarioId);
      await carregarCenarios();
      
      // Se o cenário excluído era o ativo, ativar o cenário base
      if (eraCenarioAtivo) {
        console.log('Cenário ativo foi excluído, ativando cenário base...');
        await ativarCenario('base', true);
        
        // Carregar o cenário base como ativo
        const cenarioBase = await carregarCenario('base');
        if (cenarioBase) {
          onCenarioChange(cenarioBase);
        }
        
        await carregarCenarios();
      }
      
      // Notificar a página principal sobre a exclusão
      if (onCenarioDeleted) {
        onCenarioDeleted();
      }
    } catch (error) {
      console.error('Erro ao excluir cenário:', error);
      alert('Erro ao excluir cenário. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Duplicar cenário
  const handleDuplicarCenario = async (cenario: Cenario) => {
    setLoading(true);
    try {
      const novoNome = `${cenario.nome} (Cópia)`;
      const novoCenarioId = await criarNovoCenario(
        novoNome,
        cenario.descricao || '',
        cenario.id
      );

      await carregarCenarios();
    } catch (error) {
      console.error('Erro ao duplicar cenário:', error);
      alert('Erro ao duplicar cenário. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Carregar cenário ao clicar no card
  const handleCenarioClick = async (cenarioId: string) => {
    if (onCenarioClick) {
      onCenarioClick(cenarioId);
    }
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-4">
      {/* Header com controles */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900">Cenários Eleitorais</h2>
          <Badge variant={cenarioAtivo?.tipo === 'base' ? 'default' : 'secondary'}>
            {cenarioAtivo?.tipo === 'base' ? 'BASE' : 'SIMULAÇÃO'}
          </Badge>
          {cenarioAtivo && (
            <span className="text-sm text-gray-600">
              Ativo: {cenarioAtivo.nome}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setModoComparacao(!modoComparacao)}
            className={modoComparacao ? 'bg-blue-50 border-blue-200' : ''}
          >
            <Eye className="h-4 w-4 mr-1" />
            Comparar
          </Button>
          
          <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Novo Cenário
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Criar Novo Cenário</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Nome do Cenário</label>
                  <Input
                    placeholder="Ex: Cenário Otimista"
                    value={novoCenario.nome}
                    onChange={(e) => setNovoCenario(prev => ({ ...prev, nome: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Descrição (opcional)</label>
                  <Textarea
                    placeholder="Descreva o cenário..."
                    value={novoCenario.descricao}
                    onChange={(e) => setNovoCenario(prev => ({ ...prev, descricao: e.target.value }))}
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Baseado em</label>
                  <Select
                    value={novoCenario.cenarioOrigem}
                    onValueChange={(value) => setNovoCenario(prev => ({ ...prev, cenarioOrigem: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cenário base" />
                    </SelectTrigger>
                    <SelectContent>
                      {cenarios.map((cenario) => (
                        <SelectItem key={cenario.id} value={cenario.id}>
                          {cenario.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setDialogAberto(false)}
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleCriarCenario}
                    disabled={loading || !novoCenario.nome.trim()}
                  >
                    {loading ? 'Criando...' : 'Criar Cenário'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Lista de cenários */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cenarios.map((cenario) => (
          <Card 
            key={cenario.id} 
            className={`relative transition-all cursor-pointer group ${
              cenario.ativo 
                ? 'ring-2 ring-blue-500 bg-blue-50' 
                : 'hover:shadow-md hover:ring-1 hover:ring-gray-300'
            }`}
            onClick={() => handleCenarioClick(cenario.id)}
            title="Clique para carregar este cenário"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base flex items-center gap-2">
                    {cenario.nome}
                    {cenario.tipo === 'base' && (
                      <Badge variant="default" className="text-xs">
                        BASE
                      </Badge>
                    )}
                    {cenario.ativo && (
                      <Badge variant="secondary" className="text-xs">
                        ATIVO
                      </Badge>
                    )}
                  </CardTitle>
                  {cenario.descricao && (
                    <p className="text-sm text-gray-600 mt-1">
                      {cenario.descricao}
                    </p>
                  )}
                  {/* Indicador sutil de que o card é clicável */}
                  <div className="text-xs text-gray-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    Clique para carregar
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="text-xs text-gray-500">
                  <div>Criado: {formatarData(cenario.criadoEm)}</div>
                  <div>Atualizado: {formatarData(cenario.atualizadoEm)}</div>
                  <div>Quociente: {cenario.quocienteEleitoral.toLocaleString('pt-BR')}</div>
                </div>
                
                <div className="flex items-center gap-2 pt-2">
                  {cenario.ativo ? (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={loading}
                      className="flex-1 bg-green-50 border-green-200 text-green-700"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Ativo
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAtivarCenario(cenario.id);
                      }}
                      disabled={loading}
                      className="flex-1"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Ativar
                    </Button>
                  )}
                  
                  {cenario.tipo !== 'base' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicarCenario(cenario);
                        }}
                        disabled={loading}
                        className="flex-1"
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Duplicar
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            disabled={loading}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir Cenário</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir o cenário "{cenario.nome}"?
                              Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleExcluirCenario(cenario.id)}
                              className="bg-red-500 hover:bg-red-600 text-white"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modo de comparação */}
      {modoComparacao && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Comparar Cenários</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Cenário para comparar</label>
                <Select
                  value={cenarioComparacao}
                  onValueChange={setCenarioComparacao}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cenário" />
                  </SelectTrigger>
                  <SelectContent>
                    {cenarios
                      .filter(c => c.id !== cenarioAtivo?.id)
                      .map((cenario) => (
                        <SelectItem key={cenario.id} value={cenario.id}>
                          {cenario.nome}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setModoComparacao(false);
                  setCenarioComparacao('');
                }}
              >
                <X className="h-4 w-4 mr-1" />
                Fechar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-600 mr-2" />
          <span className="text-gray-600">Carregando cenários...</span>
        </div>
      )}

      {/* Empty state */}
      {!loading && cenarios.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum cenário encontrado
            </h3>
            <p className="text-gray-600 mb-4">
              Crie o primeiro cenário para começar a simular diferentes cenários eleitorais.
            </p>
            <Button onClick={() => setDialogAberto(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Criar Primeiro Cenário
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 