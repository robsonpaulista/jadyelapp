"use client";

import React, { useEffect, useState } from "react";
import { Trash2, Plus, Pencil, RefreshCw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { carregarChapas, atualizarChapa, excluirChapa, carregarQuocienteEleitoral, salvarQuocienteEleitoral, Chapa, CenarioCompleto, PartidoCenario, obterCenarioAtivo, atualizarCenario } from "@/services/chapasService";
import CenariosManager from "@/components/CenariosManager";
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
  const [quocienteCarregado, setQuocienteCarregado] = useState(false);
  const [cenarioAtivo, setCenarioAtivo] = useState<CenarioCompleto | null>(null);
  const [modoCenarios, setModoCenarios] = useState(false);
  const [editVoto, setEditVoto] = useState<{ partidoIdx: number; candidatoNome: string } | null>(null);
  const [hoveredRow, setHoveredRow] = useState<{ partidoIdx: number; candidatoNome: string } | null>(null);
  const [editingName, setEditingName] = useState<{ partidoIdx: number; candidatoNome: string; tempValue: string } | null>(null);
  const [votosIgreja, setVotosIgreja] = useState(50000);
  const [votosLegenda, setVotosLegenda] = useState<{ [partido: string]: number }>({});

  // Estados para adicionar novo candidato
  const [dialogAberto, setDialogAberto] = useState<number | null>(null);
  const [novoCandidato, setNovoCandidato] = useState({ nome: '', votos: 0, genero: 'homem' as 'homem' | 'mulher' });
  const [salvandoCandidato, setSalvandoCandidato] = useState(false);

  // Adicionar estado para edição temporária dos votos de legenda
  const [votosLegendaTemp, setVotosLegendaTemp] = useState<{ [partido: string]: string }>({});
  const [salvandoMudancas, setSalvandoMudancas] = useState(false);
  const [notificacaoAutoSave, setNotificacaoAutoSave] = useState<string | null>(null);

  const mostrarNotificacaoAutoSave = (mensagem: string) => {
    setNotificacaoAutoSave(mensagem);
    setTimeout(() => setNotificacaoAutoSave(null), 3000);
  };

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

      // Se há um cenário ativo, salvar também nele
      if (cenarioAtivo) {
        const partidosConvertidos = converterPartidosParaCenario();
        await atualizarCenario(cenarioAtivo.id, partidosConvertidos, quociente);
      }
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
      try {
        // Carregar quociente eleitoral primeiro
        const quocienteSalvo = await carregarQuocienteEleitoral();
        setQuociente(quocienteSalvo);
        setQuocienteCarregado(true);

        // Tentar carregar cenário ativo primeiro
        const cenarioAtivo = await obterCenarioAtivo();
        if (cenarioAtivo) {
          setCenarioAtivo(cenarioAtivo);
          setPartidos(cenarioAtivo.partidos);
          setQuociente(cenarioAtivo.quocienteEleitoral);
        } else {
          // Fallback para o sistema antigo
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
      } catch (error) {
        console.error('Erro ao carregar dados iniciais:', error);
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
        const partido = partidos[partidoIdx];
        const candidato = partido.candidatos.find(c => c.nome === oldNome);
        
        if (!candidato) {
          console.error('Candidato não encontrado');
          return;
        }

        // Para partidos com separação, verificar se a mudança de nome respeita a regra
        if (partido.nome === "PT" || partido.nome === "PSD/MDB" || partido.nome === "PP" || partido.nome === "REPUBLICANOS") {
          const mulheresPartido = partido.nome === "PT" 
            ? ['CARMELITA CASTRO', 'MARINA SANTOS', 'RAISSA PROTETORA']
            : partido.nome === "PSD/MDB"
            ? ['MULHER 1', 'MULHER 2', 'MULHER 3']
            : partido.nome === "PP"
            ? ['SAMANTA CAVALCA', 'MULHER 1', 'MULHER 2']
            : ['ANA FIDELIS', 'GABRIELA', 'KARLA'];
          
          const eraMulher = mulheresPartido.includes(oldNome);
          const seraMulher = mulheresPartido.includes(newNome);
          
          // Se estava mudando de homem para mulher ou vice-versa, alertar
          if (eraMulher !== seraMulher) {
            alert(`Não é possível alterar o gênero do candidato. O nome "${newNome}" não está na lista de mulheres do partido ${partido.nome}.`);
            return;
          }
        }

        // Primeiro, excluir o registro antigo do Firestore
        await excluirChapa(partido.nome, oldNome);
        
        // Depois, criar o novo registro com o novo nome
        await atualizarChapa(partido.nome, newNome, candidato.votos);

        // Atualizar estado local
        setPartidos(prev => prev.map((p, i) => {
          if (i !== partidoIdx) return p;
          return {
            ...p,
            candidatos: p.candidatos.map(c => 
              c.nome === oldNome ? { ...c, nome: newNome } : c
            )
          };
        }));

        // Se há um cenário ativo, salvar também nele
        if (cenarioAtivo) {
          const partidosConvertidos = converterPartidosParaCenario();
          await atualizarCenario(cenarioAtivo.id, partidosConvertidos, quociente);
        }

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
        alert('Erro ao salvar alteração. Tente novamente.');
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
      
      // Se há um cenário ativo, salvar também nele
      if (cenarioAtivo) {
        const partidosConvertidos = converterPartidosParaCenario();
        await atualizarCenario(cenarioAtivo.id, partidosConvertidos, quociente);
      }
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

  // Função para separar candidatos homens e mulheres do PT
  const separarCandidatosPT = (candidatos: { nome: string; votos: number }[]) => {
    const candidatosFiltrados = candidatos.filter(c => c.nome !== "VOTOS LEGENDA");
    
    // Lista de mulheres do PT (registros 7, 8 e 9)
    const mulheresPT = ['CARMELITA CASTRO', 'MARINA SANTOS', 'RAISSA PROTETORA'];
    
    const homens = candidatosFiltrados
      .filter(c => !mulheresPT.includes(c.nome))
      .sort((a, b) => b.votos - a.votos);
    
    const mulheres = candidatosFiltrados
      .filter(c => mulheresPT.includes(c.nome))
      .sort((a, b) => b.votos - a.votos);
    
    return { homens, mulheres };
  };

  // Função para separar candidatos homens e mulheres do PSD/MDB
  const separarCandidatosPSDMDB = (candidatos: { nome: string; votos: number }[]) => {
    const candidatosFiltrados = candidatos.filter(c => c.nome !== "VOTOS LEGENDA");
    
    // Lista de mulheres do PSD/MDB
    const mulheresPSDMDB = ['MULHER 1', 'MULHER 2', 'MULHER 3'];
    
    const homens = candidatosFiltrados
      .filter(c => !mulheresPSDMDB.includes(c.nome))
      .sort((a, b) => b.votos - a.votos);
    
    const mulheres = candidatosFiltrados
      .filter(c => mulheresPSDMDB.includes(c.nome))
      .sort((a, b) => b.votos - a.votos);
    
    return { homens, mulheres };
  };

  // Função para separar candidatos homens e mulheres do PP
  const separarCandidatosPP = (candidatos: { nome: string; votos: number }[]) => {
    const candidatosFiltrados = candidatos.filter(c => c.nome !== "VOTOS LEGENDA");
    
    // Lista de mulheres do PP
    const mulheresPP = ['SAMANTA CAVALCA', 'MULHER 1', 'MULHER 2'];
    
    const homens = candidatosFiltrados
      .filter(c => !mulheresPP.includes(c.nome))
      .sort((a, b) => b.votos - a.votos);
    
    const mulheres = candidatosFiltrados
      .filter(c => mulheresPP.includes(c.nome))
      .sort((a, b) => b.votos - a.votos);
    
    return { homens, mulheres };
  };

  // Função para separar candidatos homens e mulheres do REPUBLICANOS
  const separarCandidatosRepublicanos = (candidatos: { nome: string; votos: number }[]) => {
    const candidatosFiltrados = candidatos.filter(c => c.nome !== "VOTOS LEGENDA");
    
    // Lista de mulheres do REPUBLICANOS
    const mulheresRepublicanos = ['ANA FIDELIS', 'GABRIELA', 'KARLA'];
    
    const homens = candidatosFiltrados
      .filter(c => !mulheresRepublicanos.includes(c.nome))
      .sort((a, b) => b.votos - a.votos);
    
    const mulheres = candidatosFiltrados
      .filter(c => mulheresRepublicanos.includes(c.nome))
      .sort((a, b) => b.votos - a.votos);
    
    return { homens, mulheres };
  };

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

      // Salvar automaticamente no cenário ativo
      if (cenarioAtivo) {
        const partidosConvertidos = converterPartidosParaCenario();
        await atualizarCenario(cenarioAtivo.id, partidosConvertidos, quociente);
        console.log('Candidato excluído e cenário atualizado:', cenarioAtivo.nome);
        mostrarNotificacaoAutoSave(`Candidato excluído e cenário "${cenarioAtivo.nome}" atualizado automaticamente`);
      }
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
      
      // Atualizar estado local respeitando a separação homens/mulheres
      setPartidos(prev => prev.map((p, i) => {
        if (i !== partidoIdx) return p;
        
        // Para partidos com separação, precisamos verificar se o candidato deve ser adicionado
        // ao bloco correto baseado no gênero selecionado
        if (p.nome === "PT" || p.nome === "PSD/MDB" || p.nome === "PP" || p.nome === "REPUBLICANOS") {
          // Verificar se o nome já existe na lista de mulheres do partido
          const mulheresPartido = p.nome === "PT" 
            ? ['CARMELITA CASTRO', 'MARINA SANTOS', 'RAISSA PROTETORA']
            : p.nome === "PSD/MDB"
            ? ['MULHER 1', 'MULHER 2', 'MULHER 3']
            : p.nome === "PP"
            ? ['SAMANTA CAVALCA', 'MULHER 1', 'MULHER 2']
            : ['ANA FIDELIS', 'GABRIELA', 'KARLA'];
          
          // Se o usuário selecionou "mulher" mas o nome não está na lista de mulheres,
          // ou se selecionou "homem" mas o nome está na lista de mulheres, mostrar alerta
          if (novoCandidato.genero === 'mulher' && !mulheresPartido.includes(novoCandidato.nome)) {
            alert(`Para adicionar uma mulher no partido ${p.nome}, o nome deve estar na lista de mulheres do partido.`);
            return p;
          }
        }
        
        return {
          ...p,
          candidatos: [...p.candidatos, { nome: novoCandidato.nome, votos: novoCandidato.votos }]
        };
      }));

      // Atualizar cenário ativo se existir
      if (cenarioAtivo) {
        const partidosConvertidos = converterPartidosParaCenario();
        await atualizarCenario(cenarioAtivo.id, partidosConvertidos, quociente);
      }

      // Limpar formulário e fechar dialog
      setNovoCandidato({ nome: '', votos: 0, genero: 'homem' });
      setDialogAberto(null);
    } catch (error) {
      console.error('Erro ao adicionar candidato:', error);
      alert('Erro ao adicionar candidato. Tente novamente.');
    } finally {
      setSalvandoCandidato(false);
    }
  };

  // Funções para gerenciar cenários
  const handleCenarioChange = (cenario: CenarioCompleto) => {
    console.log('Mudando para cenário:', cenario.nome, cenario.tipo);
    setCenarioAtivo(cenario);
    setPartidos(cenario.partidos);
    setQuociente(cenario.quocienteEleitoral);
  };

  const handleCenarioBaseCreated = () => {
    // Recarregar cenário ativo após criar o base
    obterCenarioAtivo().then(cenario => {
      if (cenario) {
        setCenarioAtivo(cenario);
        setPartidos(cenario.partidos);
        setQuociente(cenario.quocienteEleitoral);
      }
    });
  };

  const handleCenarioDeleted = () => {
    // Recarregar cenário ativo após exclusão
    console.log('Cenário excluído, recarregando cenário ativo...');
    obterCenarioAtivo().then(cenario => {
      if (cenario) {
        console.log('Novo cenário ativo carregado:', cenario.nome);
        setCenarioAtivo(cenario);
        setPartidos(cenario.partidos);
        setQuociente(cenario.quocienteEleitoral);
      }
    });
  };

  // Função para converter partidos para o formato do cenário
  const converterPartidosParaCenario = (): PartidoCenario[] => {
    return partidos.map(partido => ({
      nome: partido.nome,
      cor: partido.cor,
      corTexto: partido.corTexto,
      candidatos: partido.candidatos.map(c => ({
        nome: c.nome,
        votos: c.votos
      })),
      votosLegenda: votosLegenda[partido.nome] || 0
    }));
  };

  // Função para salvar mudanças no cenário ativo
  const salvarMudancasCenario = async () => {
    if (cenarioAtivo) {
      setSalvandoMudancas(true);
      try {
        const partidosConvertidos = converterPartidosParaCenario();
        await atualizarCenario(cenarioAtivo.id, partidosConvertidos, quociente);
        console.log('Mudanças salvas no cenário:', cenarioAtivo.nome);
        
        // Feedback visual temporário
        setTimeout(() => setSalvandoMudancas(false), 2000);
      } catch (error) {
        console.error('Erro ao salvar mudanças no cenário:', error);
        setSalvandoMudancas(false);
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-gray-50">
      {/* Notificação de auto-save */}
      {notificacaoAutoSave && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <Check className="h-4 w-4" />
          <span className="text-sm">{notificacaoAutoSave}</span>
        </div>
      )}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-4 py-4">
        {/* Header com controles de cenários e quociente */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setModoCenarios(!modoCenarios)}
              className={modoCenarios ? 'bg-blue-50 border-blue-200' : ''}
            >
              {modoCenarios ? 'Fechar Cenários' : 'Gerenciar Cenários'}
            </Button>
            {cenarioAtivo && (
              <Button
                variant="outline"
                size="sm"
                onClick={salvarMudancasCenario}
                disabled={salvandoMudancas}
                className={cenarioAtivo.tipo === 'base' ? 'bg-green-50 border-green-200 text-green-700' : ''}
              >
                {salvandoMudancas ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  cenarioAtivo.tipo === 'base' ? 'Salvar Base' : 'Salvar Mudanças'
                )}
              </Button>
            )}
            {cenarioAtivo && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Cenário:</span>
                <Badge variant={cenarioAtivo.tipo === 'base' ? 'default' : 'secondary'}>
                  {cenarioAtivo.nome}
                </Badge>
              </div>
            )}
          </div>

          {/* Quociente eleitoral */}
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
              onBlur={async () => {
                try {
                  console.log('Salvando quociente eleitoral:', quociente);
                  await salvarQuocienteEleitoral(quociente);
                  console.log('Quociente salvo com sucesso');
                  
                  // Se há um cenário ativo, salvar também nele
                  if (cenarioAtivo) {
                    console.log('Atualizando cenário ativo:', cenarioAtivo.nome);
                    const partidosConvertidos = converterPartidosParaCenario();
                    await atualizarCenario(cenarioAtivo.id, partidosConvertidos, quociente);
                    console.log('Cenário atualizado com sucesso');
                  }
                } catch (error) {
                  console.error('Erro ao salvar quociente eleitoral:', error);
                  alert(`Erro ao salvar quociente eleitoral: ${error instanceof Error ? error.message : 'Erro desconhecido'}. Tente novamente.`);
                }
              }}
              onKeyDown={async (e) => {
                if (e.key === 'Enter') {
                  try {
                    console.log('Salvando quociente eleitoral (Enter):', quociente);
                    await salvarQuocienteEleitoral(quociente);
                    console.log('Quociente salvo com sucesso (Enter)');
                    
                    // Se há um cenário ativo, salvar também nele
                    if (cenarioAtivo) {
                      console.log('Atualizando cenário ativo (Enter):', cenarioAtivo.nome);
                      const partidosConvertidos = converterPartidosParaCenario();
                      await atualizarCenario(cenarioAtivo.id, partidosConvertidos, quociente);
                      console.log('Cenário atualizado com sucesso (Enter)');
                    }
                    e.currentTarget.blur();
                  } catch (error) {
                    console.error('Erro ao salvar quociente eleitoral (Enter):', error);
                    alert(`Erro ao salvar quociente eleitoral: ${error instanceof Error ? error.message : 'Erro desconhecido'}. Tente novamente.`);
                  }
                }
              }}
              className="text-xl font-extrabold text-gray-900 bg-transparent border-b border-gray-200 focus:border-blue-400 outline-none w-28 text-center px-1"
              style={{ maxWidth: 120 }}
            />
          </div>
        </div>

        {/* Gerenciador de Cenários */}
        {modoCenarios && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <CenariosManager
              partidosAtuais={partidos}
              quocienteAtual={quociente}
              onCenarioChange={handleCenarioChange}
              onCenarioBaseCreated={handleCenarioBaseCreated}
              onCenarioDeleted={handleCenarioDeleted}
            />
          </div>
        )}



        {/* Grid de partidos */}
        <div className="w-full grid grid-cols-1 md:grid-cols-4 gap-6">
          {partidos.map((partido, pIdx) => (
            <div key={partido.nome} className="flex flex-col items-center bg-white rounded-lg shadow-sm border border-gray-100 p-3 h-full min-h-[420px]">
              <div className="w-full text-center py-1 font-bold text-base mb-2 rounded bg-gray-200 text-gray-800">{partido.nome}</div>
              
              <div className="w-full flex flex-col flex-1">
                {(partido.nome === "PT" || partido.nome === "PSD/MDB" || partido.nome === "PP" || partido.nome === "REPUBLICANOS") ? (
                  // Renderização especial para PT, PSD/MDB, PP e REPUBLICANOS com separação homens/mulheres
                  <div className="space-y-2">
                    {/* Bloco dos Homens */}
                    <table className="w-full text-xs">
                      <tbody>
                        {(() => {
                          const { homens } = partido.nome === "PT" 
                            ? separarCandidatosPT(partido.candidatos)
                            : partido.nome === "PSD/MDB"
                            ? separarCandidatosPSDMDB(partido.candidatos)
                            : partido.nome === "PP"
                            ? separarCandidatosPP(partido.candidatos)
                            : separarCandidatosRepublicanos(partido.candidatos);
                          return homens.map((c, idx) => (
                            <tr 
                              key={`homem-${c.nome}-${idx}`}
                              className="group relative hover:bg-gray-50 transition-colors"
                              onMouseEnter={() => setHoveredRow({ partidoIdx: pIdx, candidatoNome: c.nome })}
                              onMouseLeave={() => {
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
                          ));
                        })()}
                      </tbody>
                    </table>

                    {/* Divisão visual */}
                    <div className="border-t-2 border-gray-300 my-2"></div>

                                         {/* Bloco das Mulheres */}
                     <table className="w-full text-xs">
                       <tbody>
                         {(() => {
                           const { mulheres } = partido.nome === "PT" 
                             ? separarCandidatosPT(partido.candidatos)
                             : partido.nome === "PSD/MDB"
                             ? separarCandidatosPSDMDB(partido.candidatos)
                             : partido.nome === "PP"
                             ? separarCandidatosPP(partido.candidatos)
                             : separarCandidatosRepublicanos(partido.candidatos);
                           return mulheres.map((c, idx) => (
                            <tr 
                              key={`mulher-${c.nome}-${idx}`}
                              className="group relative hover:bg-gray-50 transition-colors"
                              onMouseEnter={() => setHoveredRow({ partidoIdx: pIdx, candidatoNome: c.nome })}
                              onMouseLeave={() => {
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
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  // Renderização normal para outros partidos
                  <table className="w-full text-xs mb-2">
                    <tbody>
                      {partido.candidatos
                        .filter(c => c.nome !== "VOTOS LEGENDA")
                        .sort((a, b) => b.votos - a.votos)
                        .map((c, idx) => (
                        <tr 
                          key={`${c.nome}-${idx}`}
                          className="group relative hover:bg-gray-50 transition-colors"
                          onMouseEnter={() => setHoveredRow({ partidoIdx: pIdx, candidatoNome: c.nome })}
                          onMouseLeave={() => {
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
                )}

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
                    setNovoCandidato({ nome: '', votos: 0, genero: 'homem' });
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-8 text-xs border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                      onClick={() => {
                        setDialogAberto(pIdx);
                        setNovoCandidato({ nome: '', votos: 0, genero: 'homem' });
                      }}
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
                      {(partido.nome === "PT" || partido.nome === "PSD/MDB" || partido.nome === "PP" || partido.nome === "REPUBLICANOS") && (
                        <div>
                          <label className="text-sm font-medium mb-2 block">Gênero</label>
                          <div className="flex gap-4">
                            <label className="flex items-center gap-2">
                              <input
                                type="radio"
                                name="genero"
                                value="homem"
                                checked={novoCandidato.genero === 'homem'}
                                onChange={(e) => setNovoCandidato(prev => ({ ...prev, genero: e.target.value as 'homem' | 'mulher' }))}
                                disabled={salvandoCandidato}
                                className="w-4 h-4 text-blue-600"
                              />
                              <span className="text-sm">Homem</span>
                            </label>
                            <label className="flex items-center gap-2">
                              <input
                                type="radio"
                                name="genero"
                                value="mulher"
                                checked={novoCandidato.genero === 'mulher'}
                                onChange={(e) => setNovoCandidato(prev => ({ ...prev, genero: e.target.value as 'homem' | 'mulher' }))}
                                disabled={salvandoCandidato}
                                className="w-4 h-4 text-blue-600"
                              />
                              <span className="text-sm">Mulher</span>
                            </label>
                          </div>
                        </div>
                      )}
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setDialogAberto(null);
                            setNovoCandidato({ nome: '', votos: 0, genero: 'homem' });
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
                <div className="flex flex-col gap-1">
                  {partido.nome === "PT" || partido.nome === "PSD/MDB" ? (
                    <>
                      <div className="grid grid-cols-3 gap-2 text-xs items-center justify-start">
                        <div className="whitespace-nowrap flex items-center">
                          ÷3: {getDivisaoPorTres(getVotosProjetados(partido.candidatos, partido.nome))}
                        </div>
                        <div className="whitespace-nowrap flex items-center">
                          ÷4: {getDivisaoPorQuatro(getVotosProjetados(partido.candidatos, partido.nome))}
                        </div>
                        <div className="whitespace-nowrap flex items-center">
                          ÷5: {getDivisaoPorCinco(getVotosProjetados(partido.candidatos, partido.nome))}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="text-center">
                          <div className="whitespace-nowrap flex items-center justify-center font-semibold text-green-600 text-xs">
                            Sobra 1: {getDivisaoPorTres(getVotosProjetados(partido.candidatos, partido.nome))}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="whitespace-nowrap flex items-center justify-center font-semibold text-orange-500 text-xs">
                            Sobra 2: {getDivisaoPorQuatro(getVotosProjetados(partido.candidatos, partido.nome))}
                          </div>
                        </div>
                      </div>
                    </>
                  ) : partido.nome === "PP" || partido.nome === "REPUBLICANOS" ? (
                    <>
                      <div className="grid grid-cols-2 gap-2 text-xs items-center justify-start">
                        <div className="whitespace-nowrap flex items-center">
                          ÷2: {getDivisaoPorDois(getVotosProjetados(partido.candidatos, partido.nome))}
                        </div>
                        <div className="whitespace-nowrap flex items-center">
                          ÷3: {getDivisaoPorTres(getVotosProjetados(partido.candidatos, partido.nome))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-2 text-xs items-center justify-start">
                        <div className="whitespace-nowrap flex items-center">
                          ÷3: {getDivisaoPorTres(getVotosProjetados(partido.candidatos, partido.nome))}
                        </div>
                        <div className="whitespace-nowrap flex items-center">
                          ÷4: {getDivisaoPorQuatro(getVotosProjetados(partido.candidatos, partido.nome))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
                {(partido.nome === "PP" || partido.nome === "REPUBLICANOS") && (
                  <div className="text-center">
                    <div className="whitespace-nowrap flex items-center justify-center font-semibold text-green-600 text-xs">
                      Sobra 1: {getVotosProjetados(partido.candidatos, partido.nome).toLocaleString('pt-BR')}
                    </div>
                  </div>
                )}
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


        </div>
      </div>
    </div>
  );
} 