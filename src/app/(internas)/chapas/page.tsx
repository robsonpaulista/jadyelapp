"use client";

import React, { useEffect, useState } from "react";
import { Trash2, Plus, Pencil, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { carregarChapas, atualizarChapa, excluirChapa, Chapa } from "@/services/chapasService";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { DialogFooter } from "@/components/ui/dialog";

const initialPartidos = [
  {
    nome: "PT",
    cor: "bg-red-600",
    corTexto: "text-white",
    candidatos: [
      { nome: "ZÉ", votos: 120000 },
      { nome: "F COSTA", votos: 120000 },
      { nome: "F NOGUEIRA", votos: 100000 },
      { nome: "FLORENTINO", votos: 80000 },
      { nome: "WILSON", votos: 80000 },
      { nome: "MERLONG", votos: 80000 },
      { nome: "FRANZE", votos: 60000 },
      { nome: "MARINA SANTOS", votos: 10000 },
      { nome: "RAISSA PROTETORA", votos: 10000 },
      { nome: "MULHER", votos: 6000 },
      { nome: "MULHER", votos: 4000 },
      { nome: "LEGENDA", votos: 10000 },
    ],
  },
  {
    nome: "PSD/MDB",
    cor: "bg-yellow-400",
    corTexto: "text-gray-900",
    candidatos: [
      { nome: "GEORGIANO", votos: 200000 },
      { nome: "CASTRO", votos: 180000 },
      { nome: "MARCOS AURELIO", votos: 80000 },
      { nome: "FABIO ABREU", votos: 35000 },
      { nome: "NOME5", votos: 10000 },
      { nome: "NOME6", votos: 10000 },
      { nome: "NOME7", votos: 5000 },
      { nome: "MULHER 1", votos: 5000 },
      { nome: "MULHER 2", votos: 5000 },
      { nome: "MULHER 3", votos: 3000 },
      { nome: "MULHER 4", votos: 2000 },
    ],
  },
  {
    nome: "PP",
    cor: "bg-sky-400",
    corTexto: "text-white",
    candidatos: [
      { nome: "ATILA", votos: 105000 },
      { nome: "JULIO ARCOVERDE", votos: 105000 },
      { nome: "ISMAEL", votos: 20000 },
      { nome: "PETRUS", votos: 20000 },
      { nome: "NOME6", votos: 10000 },
      { nome: "NOME7", votos: 5000 },
      { nome: "NOME8", votos: 5000 },
      { nome: "SAMANTA CAVALCA", votos: 10000 },
      { nome: "MULHER 2", votos: 5000 },
      { nome: "MULHER 3", votos: 3000 },
      { nome: "MULHER 4", votos: 2000 },
    ],
  },
  {
    nome: "REPUBLICANOS",
    cor: "bg-blue-900",
    corTexto: "text-white",
    candidatos: [
      { nome: "JADYEL", votos: 120000 },
      { nome: "ANA FIDELIS", votos: 40000 },
      { nome: "MAGNO", votos: 25000 },
      { nome: "CHARLES", votos: 40000 },
      { nome: "ZE LUIS ASSEMBLEIA DE DEUS", votos: 25000 },
      { nome: "GAIOSO", votos: 10000 },
      { nome: "GABRIELA", votos: 10000 },
      { nome: "PARNAIBA", votos: 10000 },
      { nome: "AGRO/SUL", votos: 10000 },
      { nome: "DIANA IGREJA OU K B", votos: 5000 },
      { nome: "CAUSA ANIMAL", votos: 10000 },
    ],
  },
];

const initialQuociente = 190000;

export default function ChapasPage() {
  const [loading, setLoading] = useState(false);
  const [chapas, setChapas] = useState<Chapa[]>([]);
  const [chapasFiltradas, setChapasFiltradas] = useState<Chapa[]>([]);
  const [municipioSelecionado, setMunicipioSelecionado] = useState("TODOS_MUNICIPIOS");
  const [statusSelecionado, setStatusSelecionado] = useState("TODOS_STATUS");
  const [modalAberto, setModalAberto] = useState(false);
  const [chapaEmEdicao, setChapaEmEdicao] = useState<Chapa | null>(null);
  const [formData, setFormData] = useState<Partial<Chapa>>({
    nome: "",
    partido: "",
    votos: 0,
    status: "Em andamento"
  });

  const [partidos, setPartidos] = useState(initialPartidos);
  const [quociente, setQuociente] = useState(initialQuociente);
  const [editVoto, setEditVoto] = useState<{ partidoIdx: number; candidatoNome: string } | null>(null);
  const [hoveredRow, setHoveredRow] = useState<{ partidoIdx: number; candidatoNome: string } | null>(null);
  const [editingName, setEditingName] = useState<{ partidoIdx: number; candidatoNome: string; tempValue: string } | null>(null);

  // Estados para adicionar novo candidato
  const [dialogAberto, setDialogAberto] = useState<number | null>(null);
  const [novoCandidato, setNovoCandidato] = useState({ nome: '', votos: 0 });
  const [salvandoCandidato, setSalvandoCandidato] = useState(false);

  const handleAtualizar = async () => {
    setLoading(true);
    try {
      const novasChapas = await carregarChapas();
      setChapas(novasChapas);
      filtrarChapas(novasChapas);
    } catch (error) {
      console.error("Erro ao carregar chapas:", error);
    } finally {
      setLoading(false);
    }
  };

  const filtrarChapas = (chapasParaFiltrar: Chapa[] = chapas) => {
    let filtradas = [...chapasParaFiltrar];
    
    if (municipioSelecionado !== "TODOS_MUNICIPIOS") {
      filtradas = filtradas.filter(chapa => chapa.municipio === municipioSelecionado);
    }
    
    if (statusSelecionado !== "TODOS_STATUS") {
      filtradas = filtradas.filter(chapa => chapa.status === statusSelecionado);
    }
    
    setChapasFiltradas(filtradas);
  };

  useEffect(() => {
    handleAtualizar();
  }, []);

  useEffect(() => {
    filtrarChapas();
  }, [municipioSelecionado, statusSelecionado, chapas]);

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" => {
    switch (status) {
      case "Concluída":
        return "default";
      case "Em andamento":
        return "secondary";
      case "Cancelada":
        return "destructive";
      default:
        return "default";
    }
  };

  const handleEditarChapa = (chapa: Chapa) => {
    setChapaEmEdicao(chapa);
    setFormData({
      nome: chapa.nome,
      partido: chapa.partido,
      votos: chapa.votos,
      status: chapa.status
    });
    setModalAberto(true);
  };

  const handleDeletarChapa = async (chapa: Chapa) => {
    if (!confirm("Tem certeza que deseja excluir esta chapa?")) return;
    
    setLoading(true);
    try {
      await excluirChapa(chapa.partido, chapa.nome);
      await handleAtualizar();
    } catch (error) {
      console.error("Erro ao excluir chapa:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    try {
      if (chapaEmEdicao) {
        await atualizarChapa(formData.partido!, formData.nome!, formData.votos!);
      } else {
        // Implementar criação de nova chapa
      }
      await handleAtualizar();
      setModalAberto(false);
    } catch (error) {
      console.error("Erro ao salvar chapa:", error);
    } finally {
      setLoading(false);
    }
  };

  // Carregar dados do Firestore ao abrir a página
  useEffect(() => {
    async function fetchChapasFirestore() {
      const chapas: Chapa[] = await carregarChapas();
      if (chapas && chapas.length > 0) {
        // Agrupar por partido
        const partidosMap: { [partido: string]: { nome: string; cor: string; corTexto: string; candidatos: { nome: string; votos: number }[] } } = {};
        chapas.forEach((chapa) => {
          if (!partidosMap[chapa.partido]) {
            partidosMap[chapa.partido] = {
              nome: chapa.partido,
              cor: getPartidoCor(chapa.partido),
              corTexto: getPartidoCorTexto(chapa.partido),
              candidatos: []
            };
          }
          partidosMap[chapa.partido].candidatos.push({ nome: chapa.nome, votos: chapa.votos });
        });

        // Definir a ordem dos partidos
        const ordemPartidos = ["PT", "PSD/MDB", "PP", "REPUBLICANOS"];
        const partidosOrdenados = ordemPartidos
          .map(partidoNome => partidosMap[partidoNome])
          .filter(Boolean);

        setPartidos(partidosOrdenados);
      }
    }
    fetchChapasFirestore();
  }, []);

  // Funções auxiliares para definir cores dos partidos
  function getPartidoCor(partido: string): string {
    const cores: { [key: string]: string } = {
      "PT": "bg-red-600",
      "PSD/MDB": "bg-yellow-400",
      "PP": "bg-sky-400",
      "REPUBLICANOS": "bg-blue-900"
    };
    return cores[partido] || "bg-gray-200";
  }

  function getPartidoCorTexto(partido: string): string {
    const cores: { [key: string]: string } = {
      "PT": "text-white",
      "PSD/MDB": "text-gray-900",
      "PP": "text-white",
      "REPUBLICANOS": "text-white"
    };
    return cores[partido] || "text-gray-800";
  }

  // Função para atualizar apenas o estado local (sem salvar no Firestore)
  const updateLocalState = (partidoIdx: number, candidatoNome: string, field: 'nome' | 'votos', value: string) => {
    setPartidos(prev => prev.map((p, i) => {
      if (i !== partidoIdx) return p;
      const candidatos = p.candidatos.map((c) => {
        if (c.nome !== candidatoNome) return c;
        if (field === 'nome') {
          return { ...c, nome: value };
        }
        let votos = parseInt(value.replace(/\D/g, ''), 10) || 0;
        if (votos < 0) votos = 0;
        return { ...c, votos };
      });
      return { ...p, candidatos };
    }));
  };

  // Função para iniciar edição de nome
  const startEditingName = (partidoIdx: number, candidatoNome: string) => {
    setEditingName({ partidoIdx, candidatoNome, tempValue: candidatoNome });
  };

  // Função para salvar nome no Firestore
  const saveNameChange = async (partidoIdx: number, oldNome: string) => {
    if (!editingName || editingName.partidoIdx !== partidoIdx || editingName.candidatoNome !== oldNome) return;
    
    const partidoAtual = partidos[partidoIdx];
    const candidatoIndex = partidoAtual.candidatos.findIndex(c => c.nome === oldNome);
    const newNome = editingName.tempValue.trim();
    
    if (candidatoIndex === -1 || newNome === oldNome || !newNome) {
      setEditingName(null);
      return;
    }

    setSalvandoCandidato(true);
    
    try {
      // Atualizar no Firestore primeiro
      const candidato = partidoAtual.candidatos[candidatoIndex];
      await atualizarChapa(partidoAtual.nome, newNome, candidato.votos);
      
      // Depois atualizar estado local
      const novoPartidos = [...partidos];
      novoPartidos[partidoIdx] = {
        ...partidoAtual,
        candidatos: [
          ...partidoAtual.candidatos.slice(0, candidatoIndex),
          { ...partidoAtual.candidatos[candidatoIndex], nome: newNome },
          ...partidoAtual.candidatos.slice(candidatoIndex + 1)
        ]
      };
      
      setPartidos(novoPartidos);
    } catch (error) {
      console.error('Erro ao salvar nome do candidato:', error);
    } finally {
      setSalvandoCandidato(false);
      setEditingName(null);
    }
  };

  // Função para salvar votos no Firestore
  const saveVotosChange = async (partidoIdx: number, candidatoNome: string, votos: number) => {
    const partido = partidos[partidoIdx];
    const candidato = partido.candidatos.find(c => c.nome === candidatoNome);
    if (!candidato) return;
    
    try {
      await atualizarChapa(partido.nome, candidato.nome, votos);
    } catch (error) {
      console.error('Erro ao salvar votos:', error);
    }
  };

  // Soma dos votos e cálculo da projeção
  const getVotosProjetados = (candidatos: { votos: number }[]) => candidatos.reduce((acc, c) => acc + c.votos, 0);
  const getProjecaoEleitos = (votosProjetados: number) => (votosProjetados / quociente).toFixed(2);

  // Função para excluir candidato
  const handleExcluirCandidato = async (partidoIdx: number, candidatoNome: string) => {
    const partido = partidos[partidoIdx];
    const candidato = partido.candidatos.find(c => c.nome === candidatoNome);
    if (!candidato) return;
    
    try {
      await excluirChapa(partido.nome, candidato.nome);
      setPartidos(prev => prev.map((p, i) => {
        if (i !== partidoIdx) return p;
        return {
          ...p,
          candidatos: p.candidatos.filter(c => c.nome !== candidatoNome)
        };
      }));
    } catch (error) {
      console.error('Erro ao excluir candidato:', error);
      alert('Erro ao excluir candidato. Tente novamente.');
    }
  };

  // Função para adicionar novo candidato
  const handleAdicionarCandidato = async (partidoIdx: number) => {
    if (!novoCandidato.nome.trim()) {
      alert('Por favor, digite o nome do candidato');
      return;
    }

    setSalvandoCandidato(true);
    const partido = partidos[partidoIdx];
    
    try {
      // Salvar no Firestore
      await atualizarChapa(partido.nome, novoCandidato.nome, novoCandidato.votos);
      
      // Atualizar estado local
      setPartidos(prev => prev.map((p, i) => {
        if (i !== partidoIdx) return p;
        return {
          ...p,
          candidatos: [...p.candidatos, { nome: novoCandidato.nome, votos: novoCandidato.votos }]
        };
      }));

      // Limpar formulário e fechar dialog
      setNovoCandidato({ nome: '', votos: 0 });
      setDialogAberto(null);
    } catch (error) {
      console.error('Erro ao adicionar candidato:', error);
      alert('Erro ao adicionar candidato. Tente novamente.');
    } finally {
      setSalvandoCandidato(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-4 py-4">
        {/* Header */}
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Eleições 2026</h1>
          <p className="text-sm text-gray-500">Projeção de votos por chapa de partidos</p>
        </div>

        {/* Quociente eleitoral alinhado à direita */}
        <div className="flex justify-end mb-2">
          <div className="flex items-center gap-3 bg-white rounded-lg shadow-sm border border-gray-100 p-2">
            <span className="text-sm font-bold whitespace-nowrap">QUOCIENTE ELEITORAL 2026</span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9.]*"
              value={quociente.toLocaleString('pt-BR')}
              onChange={e => {
                const raw = e.target.value.replace(/\./g, '');
                const num = Number(raw);
                setQuociente(num || 0);
              }}
              className="text-xl font-extrabold text-gray-900 bg-transparent border-b border-gray-200 focus:border-blue-400 outline-none w-28 text-center px-1"
              style={{ maxWidth: 120 }}
            />
          </div>
        </div>

        {/* Grid de partidos */}
        <div className="w-full grid grid-cols-1 md:grid-cols-4 gap-6">
          {partidos.map((partido, pIdx) => (
            <div key={partido.nome} className="flex flex-col items-center bg-white rounded-lg shadow-sm border border-gray-100 p-3 h-full min-h-[420px]">
              <div className="w-full text-center py-1 font-bold text-base mb-2 rounded bg-gray-200 text-gray-800">{partido.nome}</div>
              <div className="w-full flex flex-col flex-1">
                <table className="w-full text-xs mb-2">
                  <tbody>
                    {partido.candidatos
                      .sort((a, b) => b.votos - a.votos) // Ordenar por votos (maior para menor)
                      .map((c, idx) => (
                      <tr 
                        key={c.nome}
                        onMouseEnter={() => setHoveredRow({ partidoIdx: pIdx, candidatoNome: c.nome })}
                        onMouseLeave={() => setHoveredRow(null)}
                        className="group relative hover:bg-gray-50 transition-colors"
                      >
                        <td className="pr-2 text-left whitespace-nowrap font-normal align-top w-2/3">
                          <input
                            type="text"
                            value={editingName?.partidoIdx === pIdx && editingName?.candidatoNome === c.nome 
                              ? editingName.tempValue 
                              : c.nome}
                            onFocus={() => startEditingName(pIdx, c.nome)}
                            onChange={e => {
                              if (editingName?.partidoIdx === pIdx && editingName?.candidatoNome === c.nome) {
                                setEditingName({ ...editingName, tempValue: e.target.value });
                              }
                            }}
                            onBlur={() => saveNameChange(pIdx, c.nome)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                e.currentTarget.blur();
                              } else if (e.key === 'Escape') {
                                setEditingName(null);
                                e.currentTarget.blur();
                              }
                            }}
                            className="bg-transparent border-b border-gray-200 focus:border-blue-400 outline-none w-full text-xs py-0.5 px-1"
                          />
                        </td>
                        <td className="text-right whitespace-nowrap font-normal align-top">
                          {editVoto && editVoto.partidoIdx === pIdx && editVoto.candidatoNome === c.nome ? (
                            <input
                              type="number"
                              min={0}
                              value={c.votos}
                              autoFocus
                              onChange={e => {
                                const value = e.target.value;
                                updateLocalState(pIdx, c.nome, 'votos', value);
                              }}
                              onBlur={() => {
                                saveVotosChange(pIdx, c.nome, c.votos);
                                setEditVoto(null);
                              }}
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  saveVotosChange(pIdx, c.nome, c.votos);
                                  setEditVoto(null);
                                }
                              }}
                              className="bg-transparent border-b border-gray-200 focus:border-blue-400 outline-none w-full text-xs py-0.5 px-1 text-right"
                              style={{ textAlign: 'right' }}
                            />
                          ) : (
                            <span
                              className="cursor-pointer select-text"
                              onClick={() => setEditVoto({ partidoIdx: pIdx, candidatoNome: c.nome })}
                            >
                              {Number(c.votos).toLocaleString('pt-BR')}
                            </span>
                          )}
                        </td>
                        <td className="pl-2 text-right whitespace-nowrap font-normal align-top w-8">
                          {hoveredRow?.partidoIdx === pIdx && hoveredRow?.candidatoNome === c.nome && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Excluir candidato</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja excluir o candidato {c.nome} do partido {partido.nome}?
                                    Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleExcluirCandidato(pIdx, c.nome)}
                                    className="bg-red-500 hover:bg-red-600 text-white"
                                  >
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Botão para adicionar novo candidato */}
              <div className="w-full mt-2 mb-3">
                <Dialog open={dialogAberto === pIdx} onOpenChange={(open) => {
                  if (!open) {
                    setDialogAberto(null);
                    setNovoCandidato({ nome: '', votos: 0 });
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-8 text-xs border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                      onClick={() => setDialogAberto(pIdx)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Adicionar Candidato
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Adicionar Candidato - {partido.nome}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Nome do Candidato</label>
                        <Input
                          placeholder="Digite o nome do candidato"
                          value={novoCandidato.nome}
                          onChange={(e) => setNovoCandidato(prev => ({ ...prev, nome: e.target.value }))}
                          disabled={salvandoCandidato}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Votos Projetados</label>
                        <Input
                          type="number"
                          placeholder="0"
                          min="0"
                          value={novoCandidato.votos}
                          onChange={(e) => setNovoCandidato(prev => ({ ...prev, votos: parseInt(e.target.value) || 0 }))}
                          disabled={salvandoCandidato}
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setDialogAberto(null);
                            setNovoCandidato({ nome: '', votos: 0 });
                          }}
                          disabled={salvandoCandidato}
                        >
                          Cancelar
                        </Button>
                        <Button
                          onClick={() => handleAdicionarCandidato(pIdx)}
                          disabled={salvandoCandidato || !novoCandidato.nome.trim()}
                        >
                          {salvandoCandidato ? 'Salvando...' : 'Adicionar'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="w-full mt-auto pt-2">
                <div className="font-bold text-xs mb-0.5 text-center">VOTOS PROJETADOS</div>
                <div className="text-base font-extrabold mb-1 text-center">{getVotosProjetados(partido.candidatos).toLocaleString('pt-BR')}</div>
                <div className="font-bold text-xs mb-0.5 text-center">PROJEÇÃO ELEITOS</div>
                <div className="text-base font-extrabold mb-1 text-center">{getProjecaoEleitos(getVotosProjetados(partido.candidatos))}</div>
                <div className="text-[10px] text-gray-500 mb-1 text-center">{getVotosProjetados(partido.candidatos).toLocaleString('pt-BR')} / {quociente.toLocaleString('pt-BR')} = {getProjecaoEleitos(getVotosProjetados(partido.candidatos))}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 