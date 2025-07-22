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
  RefreshCw,
  Settings,
  RotateCcw,
  Printer
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

interface CenariosTabsProps {
  partidosAtuais: PartidoCenario[];
  quocienteAtual: number;
  onCenarioChange: (cenario: CenarioCompleto) => void;
  onCenarioBaseCreated: () => void;
  onCenarioDeleted?: () => void;
  onCenarioClick?: (cenarioId: string) => void;
  onSalvarMudancas?: (cenarioId: string) => void;
  onLimparCenario?: (cenarioId: string) => void;
  onImprimirPDF?: (cenarioId: string) => void;
  salvandoMudancas?: boolean;
}

export default function CenariosTabs({ 
  partidosAtuais, 
  quocienteAtual, 
  onCenarioChange,
  onCenarioBaseCreated,
  onCenarioDeleted,
  onCenarioClick,
  onSalvarMudancas,
  onLimparCenario,
  onImprimirPDF,
  salvandoMudancas = false
}: CenariosTabsProps) {
  const [cenarios, setCenarios] = useState<Cenario[]>([]);
  const [cenarioAtivo, setCenarioAtivo] = useState<Cenario | null>(null);
  const [loading, setLoading] = useState(false);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [novoCenario, setNovoCenario] = useState({ nome: '', descricao: '', cenarioOrigem: '' });
  const [editandoCenario, setEditandoCenario] = useState<Cenario | null>(null);
  const [activeTab, setActiveTab] = useState<string>('');

  // Carregar cenários
  const carregarCenarios = async () => {
    setLoading(true);
    try {
      const cenariosList = await listarCenarios();
      
      // Garantir que apenas um cenário esteja ativo
      const cenariosAtivos = cenariosList.filter(c => c.ativo);
      if (cenariosAtivos.length > 1) {
        console.warn('Múltiplos cenários ativos detectados:', cenariosAtivos.map(c => c.nome));
        // Manter apenas o primeiro como ativo e desativar os outros
        for (let i = 1; i < cenariosAtivos.length; i++) {
          await ativarCenario(cenariosAtivos[i].id, false);
        }
        // Recarregar após correção
        const cenariosCorrigidos = await listarCenarios();
        setCenarios(cenariosCorrigidos);
        const ativo = cenariosCorrigidos.find(c => c.ativo);
        setCenarioAtivo(ativo || null);
        setActiveTab(ativo?.id || '');
      } else {
        setCenarios(cenariosList);
        const ativo = cenariosList.find(c => c.ativo);
        setCenarioAtivo(ativo || null);
        setActiveTab(ativo?.id || '');
      }
      
      console.log('Cenários carregados:', cenariosList.map(c => ({ nome: c.nome, ativo: c.ativo })));
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
      
      // Desativar todos os cenários primeiro
      for (const cenario of cenarios) {
        if (cenario.ativo) {
          console.log('Desativando cenário:', cenario.nome);
          await ativarCenario(cenario.id, false);
        }
      }

      // Ativar o cenário selecionado
      console.log('Ativando cenário selecionado:', cenarioId);
      await ativarCenario(cenarioId, true);

      // Recarregar cenários para garantir consistência
      await carregarCenarios();

      // Carregar automaticamente o cenário ativado
      const cenarioCompleto = await carregarCenario(cenarioId);
      if (cenarioCompleto) {
        console.log('Cenário carregado automaticamente:', cenarioCompleto.nome);
        onCenarioChange(cenarioCompleto);
      } else {
        console.error('Erro: não foi possível carregar o cenário ativado');
      }
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

  // Carregar cenário ao clicar na aba
  const handleTabChange = async (cenarioId: string) => {
    setActiveTab(cenarioId);
    
    // Se o cenário não está ativo, ativá-lo
    const cenario = cenarios.find(c => c.id === cenarioId);
    if (cenario && !cenario.ativo) {
      await handleAtivarCenario(cenarioId);
    } else if (onCenarioClick) {
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

  if (loading && cenarios.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="h-6 w-6 animate-spin text-blue-600 mr-2" />
        <span className="text-gray-600">Carregando cenários...</span>
      </div>
    );
  }

  if (cenarios.length === 0) {
    return (
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
    );
  }

  return (
    <div className="space-y-4">
      {/* Header compacto */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-gray-700">Cenários</h3>
          {cenarioAtivo && (
            <Badge variant={cenarioAtivo.tipo === 'base' ? 'default' : 'secondary'} className="text-xs">
              {cenarioAtivo.tipo === 'base' ? 'BASE' : 'SIMULAÇÃO'}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="h-7 px-2">
                <Plus className="h-3 w-3 mr-1" />
                Novo
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

      {/* Sistema de Abas Compacto */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-auto-fit h-10">
          {cenarios.map((cenario) => (
            <TabsTrigger 
              key={cenario.id} 
              value={cenario.id}
              className="flex items-center justify-between gap-1 px-2 py-1 text-xs relative group"
            >
              <div className="flex items-center gap-1 min-w-0 flex-1">
                <span className="truncate">{cenario.nome}</span>
                {cenario.tipo === 'base' && (
                  <Badge variant="default" className="text-xs px-1 py-0 h-4">
                    B
                  </Badge>
                )}
                {cenario.ativo && (
                  <Badge variant="secondary" className="text-xs px-1 py-0 h-4">
                    A
                  </Badge>
                )}
              </div>
              
              {/* Botões de ação que aparecem no hover */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {!cenario.ativo && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAtivarCenario(cenario.id);
                    }}
                    disabled={loading}
                    className="h-5 w-5 p-0 text-xs hover:bg-blue-100"
                    title="Ativar"
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                )}
                
                {/* Botão Salvar/Mudanças */}
                {onSalvarMudancas && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSalvarMudancas(cenario.id);
                    }}
                    disabled={salvandoMudancas}
                    className="h-5 w-5 p-0 text-xs hover:bg-green-100 text-green-600"
                    title={cenario.tipo === 'base' ? 'Salvar' : 'Salvar Mudanças'}
                  >
                    {salvandoMudancas ? (
                      <RefreshCw className="h-3 w-3 animate-spin" />
                    ) : (
                      <Save className="h-3 w-3" />
                    )}
                  </Button>
                )}
                
                {/* Botão Limpar (apenas para cenário base) */}
                {cenario.tipo === 'base' && onLimparCenario && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onLimparCenario(cenario.id);
                    }}
                    disabled={loading}
                    className="h-5 w-5 p-0 text-xs hover:bg-orange-100 text-orange-600"
                    title="Limpar Cenário"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                )}
                
                {/* Botão PDF */}
                {onImprimirPDF && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onImprimirPDF(cenario.id);
                    }}
                    disabled={loading}
                    className="h-5 w-5 p-0 text-xs hover:bg-purple-100 text-purple-600"
                    title="Gerar PDF"
                  >
                    <Printer className="h-3 w-3" />
                  </Button>
                )}
                
                {cenario.tipo !== 'base' && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicarCenario(cenario);
                      }}
                      disabled={loading}
                      className="h-5 w-5 p-0 text-xs hover:bg-blue-100"
                      title="Duplicar"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 text-xs hover:bg-red-100 text-red-600"
                          disabled={loading}
                          title="Excluir"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Trash2 className="h-3 w-3" />
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
            </TabsTrigger>
          ))}
        </TabsList>

        {cenarios.map((cenario) => (
          <TabsContent key={cenario.id} value={cenario.id} className="mt-2">
            {cenario.descricao && (
              <div className="text-center text-xs text-gray-500 py-2">
                {cenario.descricao}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>


    </div>
  );
} 