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
  const [votosIgreja, setVotosIgreja] = useState(50000);
  const [votosLegenda, setVotosLegenda] = useState<{ [partido: string]: number }>({});

  // Estados para adicionar novo candidato
  const [dialogAberto, setDialogAberto] = useState<number | null>(null);
  const [novoCandidato, setNovoCandidato] = useState({ nome: '', votos: 0 });
  const [salvandoCandidato, setSalvandoCandidato] = useState(false);

  // Adicionar estado para edição temporária dos votos de legenda
  const [votosLegendaTemp, setVotosLegendaTemp] = useState<{ [partido: string]: string }>({});

  const handleSalvarVotosLegenda = async (partidoIdx: number, votos: number) => {
    const partido = partidos[partidoIdx];
    try {
      // Salvar no Firestore como um candidato especial
      await atualizarChapa(partido.nome, "VOTOS LEGENDA", votos);
      
      // Atualizar estado local
      setVotosLegenda(prev => ({
        ...prev,
        [partido.nome]: votos
      }));
    } catch (error) {
      console.error('Erro ao salvar votos de legenda:', error);
      alert('Erro ao salvar votos de legenda. Tente novamente.');
    }
  };

  const handleAtualizar = async () => {
    setLoading(true);
    try {
      const novasChapas = await carregarChapas();
      setChapas(novasChapas);
      filtrarChapas(novasChapas);

      // Carregar votos de legenda
      const votosLegendaTemp: { [partido: string]: number } = {};
      for (const partido of partidos) {
        const votosLegendaChapa = novasChapas.find(c => c.partido === partido.nome && c.nome === "VOTOS LEGENDA");
        if (votosLegendaChapa) {
          votosLegendaTemp[partido.nome] = votosLegendaChapa.votos;
        }
      }
      setVotosLegenda(votosLegendaTemp);
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
    const candidato = partidos[partidoIdx].candidatos.find(c => c.nome === candidatoNome);
    if (candidato) {
      setEditingName({ partidoIdx, candidatoNome, tempValue: candidato.nome });
      // Manter o hover ativo durante a edição
      setHoveredRow({ partidoIdx, candidatoNome });
    }
  };

  // Função para salvar nome no Firestore
  const saveNameChange = async (partidoIdx: number, oldNome: string) => {
    if (!editingName || editingName.partidoIdx !== partidoIdx || editingName.candidatoNome !== oldNome) {
      setEditingName(null);
      setHoveredRow(null);
      return;
    }

    const newNome = editingName.tempValue.trim();
    
    if (newNome && newNome !== oldNome) {
      try {
        // Atualizar estado local imediatamente
        setPartidos(prev => prev.map((p, i) => {
          if (i !== partidoIdx) return p;
          return {
            ...p,
            candidatos: p.candidatos.map(c => 
              c.nome === oldNome ? { ...c, nome: newNome } : c
            )
          };
        }));

        // Aqui você pode adicionar uma chamada para salvar no backend se necessário
        console.log(`Nome alterado de "${oldNome}" para "${newNome}" no partido ${partidoIdx}`);
    } catch (error) {
        console.error('Erro ao salvar nome:', error);
        // Reverter mudança em caso de erro
        setPartidos(prev => prev.map((p, i) => {
          if (i !== partidoIdx) return p;
          return {
            ...p,
            candidatos: p.candidatos.map(c => 
              c.nome === newNome ? { ...c, nome: oldNome } : c
            )
          };
        }));
      }
    }
    
      setEditingName(null);
    setHoveredRow(null);
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
  const getVotosProjetados = (candidatos: { votos: number; nome: string }[], partidoNome: string) => {
    const votosLegendaPartido = votosLegenda[partidoNome] || 0;
    return candidatos
      .filter(c => c.nome !== "VOTOS LEGENDA") // Filtra o candidato especial de votos de legenda
      .reduce((acc, c) => acc + c.votos, 0) + votosLegendaPartido;
  };
  const getProjecaoEleitos = (votosTotal: number) => (votosTotal / quociente).toFixed(2);
  const getDivisaoPorDois = (votosTotal: number) => (votosTotal / 2).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const getDivisaoPorTres = (votosTotal: number) => (votosTotal / 3).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const getDivisaoPorQuatro = (votosTotal: number) => (votosTotal / 4).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const getDivisaoPorCinco = (votosTotal: number) => (votosTotal / 5).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const getVotosFusaoPSDJadyel = () => {
    const psdmdb = partidos.find(p => p.nome === "PSD/MDB");
    const republicanos = partidos.find(p => p.nome === "REPUBLICANOS");
    const jadyel = republicanos?.candidatos.find(c => c.nome === "JADYEL");
    
    if (!psdmdb || !jadyel) return null;

    const votosPSDMDB = getVotosProjetados(psdmdb.candidatos, "PSD/MDB");
    const votosTotal = votosPSDMDB + jadyel.votos;

    return {
      total: votosTotal,
      projecao: (votosTotal / quociente).toFixed(2),
      divisaoPorTres: (votosTotal / 3).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      divisaoPorQuatro: (votosTotal / 4).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    };
  };

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
                      .filter(c => c.nome !== "VOTOS LEGENDA") // Filtrar o candidato especial de votos de legenda
                      .sort((a, b) => b.votos - a.votos) // Ordenar por votos (maior para menor)
                      .map((c, idx) => (
                      <tr 
                        key={`${c.nome}-${idx}`}
                        className="group relative hover:bg-gray-50 transition-colors"
                        onMouseEnter={() => setHoveredRow({ partidoIdx: pIdx, candidatoNome: c.nome })}
                        onMouseLeave={() => {
                          // Só remove o hover se não estiver editando
                          if (!(editingName?.partidoIdx === pIdx && editingName?.candidatoNome === c.nome)) {
                            setHoveredRow(null);
                          }
                        }}
                      >
                        <td className="pr-2 text-left whitespace-nowrap font-normal align-top w-2/3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">{idx + 1}.</span>
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
                          </div>
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
                          {(hoveredRow?.partidoIdx === pIdx && hoveredRow?.candidatoNome === c.nome) || 
                           (editingName?.partidoIdx === pIdx && editingName?.candidatoNome === c.nome) ? (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                  style={{
                                    opacity: (hoveredRow?.partidoIdx === pIdx && hoveredRow?.candidatoNome === c.nome) || 
                                             (editingName?.partidoIdx === pIdx && editingName?.candidatoNome === c.nome) ? 1 : 0
                                  }}
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
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Input de Votos Legenda */}
                <div className="w-full mb-3 px-2">
                  <div className="flex items-center justify-between bg-gray-50 p-2 rounded-md border border-gray-200">
                    <span className="text-xs font-semibold text-gray-600">VOTOS LEGENDA:</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={
                        votosLegendaTemp[partido.nome] !== undefined
                          ? votosLegendaTemp[partido.nome]
                          : (votosLegenda[partido.nome]?.toLocaleString('pt-BR') || '')
                      }
                      onChange={e => {
                        // Permitir digitação livre
                        setVotosLegendaTemp(prev => ({ ...prev, [partido.nome]: e.target.value }));
                      }}
                      onBlur={e => {
                        const value = e.target.value.replace(/\D/g, '');
                        const numValue = parseInt(value, 10) || 0;
                        handleSalvarVotosLegenda(pIdx, numValue);
                        setVotosLegendaTemp(prev => {
                          const temp = { ...prev };
                          delete temp[partido.nome];
                          return temp;
                        });
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          const value = (e.target as HTMLInputElement).value.replace(/\D/g, '');
                          const numValue = parseInt(value, 10) || 0;
                          handleSalvarVotosLegenda(pIdx, numValue);
                          setVotosLegendaTemp(prev => {
                            const temp = { ...prev };
                            delete temp[partido.nome];
                            return temp;
                          });
                          (e.target as HTMLInputElement).blur();
                        }
                      }}
                      className="bg-white border border-gray-300 rounded px-2 py-1 text-xs w-24 text-right"
                    />
                  </div>
                </div>

                {/* Botão para adicionar novo candidato */}
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
                <div className="text-base font-extrabold mb-1 text-center">{getVotosProjetados(partido.candidatos, partido.nome).toLocaleString('pt-BR')}</div>
                <div className="font-bold text-xs mb-0.5 text-center">PROJEÇÃO ELEITOS</div>
                <div className="text-base font-extrabold mb-1 text-center">{getProjecaoEleitos(getVotosProjetados(partido.candidatos, partido.nome))}</div>
                <div className="text-[10px] text-gray-500 mb-1 text-center">{getVotosProjetados(partido.candidatos, partido.nome).toLocaleString('pt-BR')} / {quociente.toLocaleString('pt-BR')} = {getProjecaoEleitos(getVotosProjetados(partido.candidatos, partido.nome))}</div>
              </div>

              <div className="flex flex-col gap-1 mt-2">
                <div className="grid grid-cols-3 gap-2 text-xs items-center justify-start min-h-[24px]">
                  {partido.nome === "PT" ? (
                    <>
                      <div className="whitespace-nowrap flex items-center">
                        ÷4: {getDivisaoPorQuatro(getVotosProjetados(partido.candidatos, partido.nome))}
                      </div>
                      <div className="whitespace-nowrap flex items-center">
                        ÷5: {getDivisaoPorCinco(getVotosProjetados(partido.candidatos, partido.nome))}
                      </div>
                    </>
                  ) : partido.nome === "PP" || partido.nome === "REPUBLICANOS" ? (
                    <>
                      <div className="whitespace-nowrap flex items-center">
                        ÷3: {getDivisaoPorTres(getVotosProjetados(partido.candidatos, partido.nome))}
                      </div>
                      <div className="whitespace-nowrap flex items-center">
                        ÷2: {getDivisaoPorDois(getVotosProjetados(partido.candidatos, partido.nome))}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="whitespace-nowrap flex items-center">
                        ÷3: {getDivisaoPorTres(getVotosProjetados(partido.candidatos, partido.nome))}
                      </div>
                      <div className="whitespace-nowrap flex items-center">
                        ÷4: {getDivisaoPorQuatro(getVotosProjetados(partido.candidatos, partido.nome))}
                      </div>
                    </>
                  )}
                  <div className="whitespace-nowrap flex items-center">
                    <span className="text-xs font-semibold">
                      {getProjecaoEleitos(getVotosProjetados(partido.candidatos, partido.nome))}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Container para as simulações */}
        <div className="mt-8 grid grid-cols-2 gap-4">
          {/* Seção independente para soma PSD/MDB + JADYEL */}
          <div className="p-4 bg-gray-100 rounded-lg">
            <div className="text-base font-semibold mb-2">
              Simulação de Fusão - PSD/MDB + JADYEL
            </div>
            {(() => {
              const psdmdb = partidos.find(p => p.nome === "PSD/MDB");
              const republicanos = partidos.find(p => p.nome === "REPUBLICANOS");
              const jadyel = republicanos?.candidatos.find(c => c.nome === "JADYEL");
              
              if (!psdmdb || !jadyel) return null;

              const votosPSDMDB = getVotosProjetados(psdmdb.candidatos, "PSD/MDB");
              const votosTotal = votosPSDMDB + jadyel.votos;

              return (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-sm">
                    <span>PSD/MDB ({votosPSDMDB.toLocaleString('pt-BR')})</span>
                    <span>+</span>
                    <span>JADYEL ({jadyel.votos.toLocaleString('pt-BR')})</span>
                    <span>=</span>
                    <span className="font-bold">{votosTotal.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="flex flex-col gap-2 text-sm text-gray-600">
                    <div>Eleitos pelo Quociente ({quociente.toLocaleString('pt-BR')}): {(votosTotal / quociente).toFixed(2)}</div>
                    <div>÷3: {getDivisaoPorTres(votosTotal)}</div>
                    <div>÷4: {getDivisaoPorQuatro(votosTotal)}</div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Seção independente para soma PP + IGREJA */}
          <div className="p-4 bg-gray-100 rounded-lg">
            <div className="text-base font-semibold mb-2">
              Simulação de Fusão - PP + IGREJA
            </div>
            {(() => {
              const pp = partidos.find(p => p.nome === "PP");
              if (!pp) return null;

              const votosPP = getVotosProjetados(pp.candidatos, "PP");
              const votosTotal = votosPP + votosIgreja;

              return (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-sm">
                    <span>PP ({votosPP.toLocaleString('pt-BR')})</span>
                    <span>+</span>
                    <div className="flex items-center gap-1">
                      <span>IGREJA</span>
                      <input
                        type="number"
                        value={votosIgreja}
                        onChange={(e) => setVotosIgreja(Number(e.target.value))}
                        className="w-24 px-1 py-0.5 text-xs border rounded"
                      />
                    </div>
                    <span>=</span>
                    <span className="font-bold">{votosTotal.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="flex flex-col gap-2 text-sm text-gray-600">
                    <div>Eleitos pelo Quociente ({quociente.toLocaleString('pt-BR')}): {getProjecaoEleitos(votosTotal)}</div>
                    <div>÷3: {getDivisaoPorTres(votosTotal)}</div>
                    <div>÷2: {getDivisaoPorDois(votosTotal)}</div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Fusão PSD/MDB + PP */}
          <div className="text-[10px] text-gray-500 mb-1 text-center">
            {(() => {
              const psdmdb = partidos.find(p => p.nome === "PSD/MDB");
              const pp = partidos.find(p => p.nome === "PP");
              
              if (!psdmdb || !pp) return null;

              const votosPSDMDB = getVotosProjetados(psdmdb.candidatos, "PSD/MDB");
              const votosPP = getVotosProjetados(pp.candidatos, "PP");
              const votosTotal = votosPSDMDB + votosPP;

              return (
                <>
                  <div className="font-bold">FUSÃO PSD/MDB + PP</div>
                  <div>Total: {votosTotal.toLocaleString('pt-BR')}</div>
                  <div>Projeção: {(votosTotal / quociente).toFixed(2)}</div>
                  <div>÷3: {(votosTotal / 3).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  <div>÷4: {(votosTotal / 4).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
} 