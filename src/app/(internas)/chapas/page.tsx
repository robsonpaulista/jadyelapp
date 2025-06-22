"use client";

import React, { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { carregarChapas, atualizarChapa, excluirChapa, Chapa } from "@/services/chapasService";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

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

  const [partidos, setPartidos] = useState(initialPartidos);
  const [quociente, setQuociente] = useState(initialQuociente);
  const [editVoto, setEditVoto] = useState<{ partidoIdx: number; candIdx: number } | null>(null);
  const [hoveredRow, setHoveredRow] = useState<{ partidoIdx: number; candIdx: number } | null>(null);
  const [editingName, setEditingName] = useState<{ partidoIdx: number; candIdx: number; originalName: string } | null>(null);



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
              cor: "bg-gray-200",
              corTexto: "text-gray-800",
              candidatos: []
            };
          }
          partidosMap[chapa.partido].candidatos.push({ nome: chapa.nome, votos: chapa.votos });
        });
        setPartidos(Object.values(partidosMap));
      }
    }
    fetchChapasFirestore();
  }, []);

  // Função para atualizar apenas o estado local (sem salvar no Firestore)
  const updateLocalState = (partidoIdx: number, candIdx: number, field: 'nome' | 'votos', value: string) => {
    setPartidos(prev => prev.map((p, i) => {
      if (i !== partidoIdx) return p;
      const candidatos = p.candidatos.map((c, j) => {
        if (j !== candIdx) return c;
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
  const startEditingName = (partidoIdx: number, candIdx: number) => {
    const originalName = partidos[partidoIdx].candidatos[candIdx].nome;
    setEditingName({ partidoIdx, candIdx, originalName });
  };

  // Função para salvar nome no Firestore
  const saveNameChange = async (partidoIdx: number, candIdx: number) => {
    if (!editingName) return;
    
    const partido = partidos[partidoIdx];
    const candidato = partido.candidatos[candIdx];
    const originalName = editingName.originalName;
    const newName = candidato.nome;

    try {
      // Se o nome mudou, precisamos excluir o registro antigo e criar um novo
      if (originalName !== newName) {
        // Excluir o registro antigo
        await excluirChapa(partido.nome, originalName);
        // Criar o novo registro
        await atualizarChapa(partido.nome, newName, candidato.votos);
      }
      // Se o nome não mudou, não faz nada
    } catch (error) {
      console.error('Erro ao salvar nome:', error);
      // Reverter para o nome original em caso de erro
      updateLocalState(partidoIdx, candIdx, 'nome', originalName);
    } finally {
      setEditingName(null);
    }
  };

  // Função para salvar votos no Firestore
  const saveVotosChange = async (partidoIdx: number, candIdx: number, votos: number) => {
    const partido = partidos[partidoIdx];
    const candidato = partido.candidatos[candIdx];
    
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
  const handleExcluirCandidato = async (partidoIdx: number, candIdx: number) => {
    const partido = partidos[partidoIdx];
    const candidato = partido.candidatos[candIdx];
    
    try {
      await excluirChapa(partido.nome, candidato.nome);
      setPartidos(prev => prev.map((p, i) => {
        if (i !== partidoIdx) return p;
        return {
          ...p,
          candidatos: p.candidatos.filter((_, j) => j !== candIdx)
        };
      }));
    } catch (error) {
      console.error('Erro ao excluir candidato:', error);
      alert('Erro ao excluir candidato. Tente novamente.');
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-800 flex flex-col md:flex-row">
      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Navbar interna do conteúdo */}
        <nav className="w-full bg-white border-b border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex flex-col items-start">
              <span className="text-base md:text-lg font-semibold text-gray-900">Eleições 2026</span>
              <span className="text-xs text-gray-500 font-light">Projeção de votos por chapa de partidos</span>
            </div>
            <div className="flex items-center gap-2">
              {/* Espaço reservado para futuras ações */}
            </div>
          </div>
        </nav>
        <main className="flex-1 flex flex-col px-0">
          <div className="w-full max-w-7xl px-4">
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
            <div className="w-full flex-1 grid grid-cols-1 md:grid-cols-4 gap-6">
              {partidos.map((partido, pIdx) => (
                <div key={partido.nome} className="flex flex-col items-center bg-white rounded-lg shadow-sm border border-gray-100 p-3 h-full min-h-[420px]">
                  <div className="w-full text-center py-1 font-bold text-base mb-2 rounded bg-gray-200 text-gray-800">{partido.nome}</div>
                  <div className="w-full flex flex-col flex-1">
                    <table className="w-full text-xs mb-2">
                      <tbody>
                        {partido.candidatos.map((c, idx) => (
                          <tr 
                            key={idx}
                            onMouseEnter={() => setHoveredRow({ partidoIdx: pIdx, candIdx: idx })}
                            onMouseLeave={() => setHoveredRow(null)}
                            className="group relative hover:bg-gray-50 transition-colors"
                          >
                            <td className="pr-2 text-left whitespace-nowrap font-normal align-top w-2/3">
                              <input
                                type="text"
                                value={c.nome}
                                onFocus={() => startEditingName(pIdx, idx)}
                                onChange={e => {
                                  const value = e.target.value;
                                  updateLocalState(pIdx, idx, 'nome', value);
                                }}
                                onBlur={() => saveNameChange(pIdx, idx)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') {
                                    e.currentTarget.blur(); // Isso vai disparar o onBlur
                                  }
                                }}
                                className="bg-transparent border-b border-gray-200 focus:border-blue-400 outline-none w-full text-xs py-0.5 px-1"
                              />
                            </td>
                            <td className="text-right whitespace-nowrap font-normal align-top">
                              {editVoto && editVoto.partidoIdx === pIdx && editVoto.candIdx === idx ? (
                                <input
                                  type="number"
                                  min={0}
                                  value={c.votos}
                                  autoFocus
                                  onChange={e => {
                                    const value = e.target.value;
                                    updateLocalState(pIdx, idx, 'votos', value);
                                  }}
                                  onBlur={() => {
                                    saveVotosChange(pIdx, idx, c.votos);
                                    setEditVoto(null);
                                  }}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                      saveVotosChange(pIdx, idx, c.votos);
                                      setEditVoto(null);
                                    }
                                  }}
                                  className="bg-transparent border-b border-gray-200 focus:border-blue-400 outline-none w-full text-xs py-0.5 px-1 text-right"
                                  style={{ textAlign: 'right' }}
                                />
                              ) : (
                                <span
                                  className="cursor-pointer select-text"
                                  onClick={() => setEditVoto({ partidoIdx: pIdx, candIdx: idx })}
                                >
                                  {Number(c.votos).toLocaleString('pt-BR')}
                                </span>
                              )}
                            </td>
                            <td className="pl-2 text-right whitespace-nowrap font-normal align-top w-8">
                              {hoveredRow?.partidoIdx === pIdx && hoveredRow?.candIdx === idx && (
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
                                        onClick={() => handleExcluirCandidato(pIdx, idx)}
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
        </main>
        {/* Footer */}
        <footer className="mt-auto text-center py-3 text-xs text-gray-500 border-t border-gray-100">
          © 2025 86 Dynamics - Todos os direitos reservados
        </footer>
      </div>
    </div>
  );
} 