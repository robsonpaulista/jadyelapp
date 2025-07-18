"use client";

import React, { useEffect, useState } from "react";
import { Trash2, Plus, Pencil, RefreshCw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { carregarQuocienteEleitoral, salvarQuocienteEleitoral, CenarioCompleto, PartidoCenario, obterCenarioAtivo, atualizarCenario, carregarCenario, criarCenarioBase, dadosIniciais } from "@/services/chapasService";
import CenariosManager from "@/components/CenariosManager";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { DialogFooter } from "@/components/ui/dialog";

// Configuração de cores dos partidos
const coresPartidos = {
  "PT": { cor: "bg-red-600", corTexto: "text-white" },
  "PSD/MDB": { cor: "bg-yellow-400", corTexto: "text-gray-900" },
  "PP": { cor: "bg-sky-400", corTexto: "text-white" },
  "REPUBLICANOS": { cor: "bg-blue-900", corTexto: "text-white" }
};

// Interface para partido local
interface PartidoLocal {
  nome: string;
  cor: string;
  corTexto: string;
  candidatos: Array<{
    nome: string;
    votos: number;
    genero?: string;
  }>;
}

// Função para criar estrutura inicial de partidos
const criarPartidosIniciais = (): PartidoLocal[] => {
  return Object.keys(coresPartidos).map(nome => ({
    nome,
    ...coresPartidos[nome as keyof typeof coresPartidos],
    candidatos: []
  }));
};

const initialQuociente = 190000;

// Função centralizada para obter a lista de mulheres de cada partido
const getMulheresPartido = (nomePartido: string): string[] => {
  switch (nomePartido) {
    case "PT":
      return ['MARINA SANTOS', 'RAISSA PROTETORA', 'MULHER'];
    case "PSD/MDB":
      return ['MULHER 1', 'MULHER 2', 'MULHER 3', 'MULHER 4'];
    case "PP":
      return ['SAMANTA CAVALCA', 'MULHER 2', 'MULHER 3', 'MULHER 4'];
    case "REPUBLICANOS":
      return ['ANA FIDELIS', 'GABRIELA'];
    default:
      return [];
  }
};

export default function ChapasPage() {
  const [loading, setLoading] = useState(false);

  const [partidos, setPartidos] = useState<PartidoLocal[]>(criarPartidosIniciais());
  const [quociente, setQuociente] = useState(initialQuociente);
  const [quocienteCarregado, setQuocienteCarregado] = useState(false);
  const [cenarioAtivo, setCenarioAtivo] = useState<CenarioCompleto | null>(null);
  const [modoCenarios, setModoCenarios] = useState(false);
  const [editVoto, setEditVoto] = useState<{ partidoIdx: number; candidatoNome: string } | null>(null);
  const [hoveredRow, setHoveredRow] = useState<{ partidoIdx: number; candidatoNome: string } | null>(null);
  const [editingName, setEditingName] = useState<{ partidoIdx: number; candidatoNome: string; tempValue: string } | null>(null);
  const [votosIgreja, setVotosIgreja] = useState(50000);
  const [candidato1, setCandidato1] = useState('');
  const [candidato2, setCandidato2] = useState('');
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
      // Atualizar estado local primeiro
      setVotosLegenda(prev => ({
        ...prev,
        [partido.nome]: votos
      }));

      // Salvar no cenário base (fonte única de verdade)
      if (!cenarioAtivo) {
        throw new Error('Cenário base não encontrado');
      }
      
      const partidosConvertidos = converterPartidosParaCenario();
      await atualizarCenario(cenarioAtivo.id, partidosConvertidos, quociente);

      mostrarNotificacaoAutoSave(`Votos de legenda do ${partido.nome} salvos`);
    } catch (error) {
      console.error('Erro ao salvar votos de legenda:', error);
      alert('Erro ao salvar votos de legenda. Tente novamente.');
    }
  };



  // Função para carregar dados do cenário base (fonte única de verdade)
  const carregarDadosFirestore = async () => {
    console.log('Carregando dados do cenário base...');
    
    try {
      // SEMPRE carregar do cenário base
      const cenarioBase = await carregarCenario('base');
      
      if (cenarioBase) {
        console.log('Cenário base encontrado:', cenarioBase.nome);
        setCenarioAtivo(cenarioBase);
        const partidosOrdenados = ordenarPartidos(cenarioBase.partidos);
        setPartidos(partidosOrdenados);
        setQuociente(cenarioBase.quocienteEleitoral);
        
        // Carregar votos de legenda do cenário
        const votosLegendaTemp: { [partido: string]: number } = {};
        cenarioBase.partidos.forEach(partido => {
          if (partido.votosLegenda) {
            votosLegendaTemp[partido.nome] = partido.votosLegenda;
          }
        });
        setVotosLegenda(votosLegendaTemp);
        
        console.log('Dados carregados do cenário base com sucesso');
      } else {
        console.log('Cenário base não encontrado, criando...');
        // Se não existe cenário base, criar com dados iniciais
        const partidosParaCenario = criarPartidosIniciais().map(partido => {
          // Usar dados iniciais do arquivo de serviço
          const candidatosIniciais = dadosIniciais
            .filter(chapa => chapa.partido === partido.nome && chapa.nome !== "VOTOS LEGENDA")
            .map(chapa => ({
              nome: chapa.nome,
              votos: chapa.votos,
              genero: 'homem' // valor padrão
            }));
          
          return {
            ...partido,
            candidatos: candidatosIniciais
          };
        });
        
        // Criar cenário base
        await criarCenarioBase(partidosParaCenario, quociente);
        
        // Carregar o cenário recém-criado
        const cenarioBaseCriado = await carregarCenario('base');
        if (cenarioBaseCriado) {
          setCenarioAtivo(cenarioBaseCriado);
          const partidosOrdenados = ordenarPartidos(cenarioBaseCriado.partidos);
          setPartidos(partidosOrdenados);
          console.log('Cenário base criado e carregado com sucesso');
        }
      }
      
      mostrarNotificacaoAutoSave('Dados carregados com sucesso');
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      alert('Erro ao carregar dados. Tente novamente.');
    }
  };







  // Carregar dados do Firestore ao abrir a página
  useEffect(() => {
    async function carregarDadosIniciais() {
      try {
        console.log('Carregando dados iniciais...');
        
        // Carregar quociente eleitoral primeiro
        const quocienteSalvo = await carregarQuocienteEleitoral();
        setQuociente(quocienteSalvo);
        setQuocienteCarregado(true);

        // SEMPRE carregar dados do Firestore primeiro
        console.log('Carregando dados do Firestore...');
        await carregarDadosFirestore();
        
        // Depois tentar carregar cenário ativo (se existir)
        try {
          const cenarioAtivo = await obterCenarioAtivo();
          if (cenarioAtivo) {
            console.log('Cenário ativo encontrado:', cenarioAtivo.nome);
            setCenarioAtivo(cenarioAtivo);
            // Não sobrescrever os dados já carregados, apenas atualizar o cenário
          }
        } catch (cenarioError) {
          console.log('Nenhum cenário ativo encontrado ou erro ao carregar cenário');
        }
        
        console.log('Carregamento inicial concluído');
      } catch (error) {
        console.error('Erro ao carregar dados iniciais:', error);
        alert('Erro ao carregar dados iniciais. Recarregue a página.');
      }
    }
    
    carregarDadosIniciais();
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

        // Permitir mudança de nome livremente - o gênero não é determinado pelo nome
        // mas sim pela posição na lista ou por outros critérios do sistema

        // Atualizar estado local primeiro
        setPartidos(prev => prev.map((p, i) => {
          if (i !== partidoIdx) return p;
          return {
            ...p,
            candidatos: p.candidatos.map(c => 
              c.nome === oldNome ? { ...c, nome: newNome } : c
            )
          };
        }));

        // Salvar no cenário base (fonte única de verdade)
        if (!cenarioAtivo) {
          throw new Error('Cenário base não encontrado');
        }
        
        const partidosConvertidos = converterPartidosParaCenario();
        await atualizarCenario(cenarioAtivo.id, partidosConvertidos, quociente);

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

  // Função para salvar votos no cenário base
  const saveVotosChange = async (partidoIdx: number, candidatoNome: string, votos: number) => {
    const partido = partidos[partidoIdx];
    const candidato = partido.candidatos.find(c => c.nome === candidatoNome);
    if (!candidato) return;
    
    try {
      // Atualizar estado local primeiro
      setPartidos(prev => prev.map((p, i) => {
        if (i !== partidoIdx) return p;
        return {
          ...p,
          candidatos: p.candidatos.map(c => 
            c.nome === candidatoNome ? { ...c, votos } : c
          )
        };
      }));
      
      // Salvar no cenário base (fonte única de verdade)
      if (!cenarioAtivo) {
        throw new Error('Cenário base não encontrado');
      }
      
      const partidosConvertidos = converterPartidosParaCenario();
      await atualizarCenario(cenarioAtivo.id, partidosConvertidos, quociente);
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

  // Funções para calcular as maiores sobras entre todos os partidos
  const calcularMaiorSobra1 = () => {
    const sobras1 = partidos.map(partido => {
      const votosTotal = getVotosProjetados(partido.candidatos, partido.nome);
      return getSobra1Partido(partido.nome, votosTotal);
    });
    return Math.max(...sobras1);
  };

  const calcularMaiorSobra2 = () => {
    // Calcular todas as Sobras 2
    const sobras2 = partidos.map(partido => {
      const votosTotal = getVotosProjetados(partido.candidatos, partido.nome);
      return getSobra2Calculada(partido.nome, votosTotal);
    });
    
    // Retornar a maior Sobra 2
    return Math.max(...sobras2);
  };

  const getSobra1Partido = (partidoNome: string, votosTotal: number) => {
    const projecaoEleitos = votosTotal / quociente;
    
    // Regra geral para todos os partidos:
    // Se projeção < N eleitos: Sobra 1 = votos totais ÷ N
    if (projecaoEleitos < 1) {
      return votosTotal; // ÷1 = votos totais
    } else if (projecaoEleitos < 2) {
      return votosTotal / 2;
    } else if (projecaoEleitos < 3) {
      return votosTotal / 3;
    } else if (projecaoEleitos < 4) {
      return votosTotal / 4;
    } else if (projecaoEleitos < 5) {
      return votosTotal / 5;
    } else {
      // Para projeções muito altas, continuar a sequência
      return votosTotal / Math.ceil(projecaoEleitos);
    }
  };

  const getSobra2Partido = (partidoNome: string, votosTotal: number) => {
    if (partidoNome === "PT" || partidoNome === "PSD/MDB") {
      return votosTotal / 4;
    } else {
      return votosTotal; // Mesmo valor da Sobra 1 para PP e REPUBLICANOS
    }
  };

  const getSobra2Calculada = (partidoNome: string, votosTotal: number) => {
    // Encontrar o partido com a maior Sobra 1
    const sobras1 = partidos.map(partido => {
      const votosTotalPartido = getVotosProjetados(partido.candidatos, partido.nome);
      return {
        partido: partido.nome,
        sobra1: getSobra1Partido(partido.nome, votosTotalPartido),
        votosTotal: votosTotalPartido
      };
    });
    
    const maiorSobra1 = Math.max(...sobras1.map(s => s.sobra1));
    const vencedor = sobras1.find(s => s.sobra1 === maiorSobra1);
    
    if (!vencedor) return getSobra2Partido(partidoNome, votosTotal);
    
    // Se este partido é o ganhador da Sobra 1, "andar uma casa" no cálculo
    if (partidoNome === vencedor.partido) {
      const projecaoEleitos = votosTotal / quociente;
      
      // "Andar uma casa": se Sobra 1 era ÷N, Sobra 2 será ÷(N+1)
      if (projecaoEleitos < 1) {
        return votosTotal / 2; // Era votos totais, agora ÷2
      } else if (projecaoEleitos < 2) {
        return votosTotal / 3; // Era ÷2, agora ÷3
      } else if (projecaoEleitos < 3) {
        return votosTotal / 4; // Era ÷3, agora ÷4
      } else if (projecaoEleitos < 4) {
        return votosTotal / 5; // Era ÷4, agora ÷5
      } else if (projecaoEleitos < 5) {
        return votosTotal / 6; // Era ÷5, agora ÷6
      } else {
        return votosTotal / (Math.ceil(projecaoEleitos) + 1);
      }
    }
    
    // Se este partido é um perdedor da Sobra 1, repetir sua própria Sobra 1
    return getSobra1Partido(partidoNome, votosTotal);
  };

  // Função genérica para separar candidatos por gênero
  const separarCandidatosPorGenero = (candidatos: { nome: string; votos: number; genero?: string }[]) => {
    const candidatosFiltrados = candidatos.filter(c => c.nome !== "VOTOS LEGENDA");
    
    const homens = candidatosFiltrados
      .filter(c => c.genero !== 'mulher')
      .sort((a, b) => b.votos - a.votos);
    
    const mulheres = candidatosFiltrados
      .filter(c => c.genero === 'mulher')
      .sort((a, b) => b.votos - a.votos);
    
    return { homens, mulheres };
  };

  // Funções específicas mantidas para compatibilidade (agora usam apenas o campo genero)
  const separarCandidatosPT = (candidatos: { nome: string; votos: number; genero?: string }[]) => {
    return separarCandidatosPorGenero(candidatos);
  };

  const separarCandidatosPSDMDB = (candidatos: { nome: string; votos: number; genero?: string }[]) => {
    return separarCandidatosPorGenero(candidatos);
  };

  const separarCandidatosPP = (candidatos: { nome: string; votos: number; genero?: string }[]) => {
    return separarCandidatosPorGenero(candidatos);
  };

  const separarCandidatosRepublicanos = (candidatos: { nome: string; votos: number; genero?: string }[]) => {
    return separarCandidatosPorGenero(candidatos);
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
    if (!candidato) {
      console.error('Candidato não encontrado no estado local:', candidatoNome);
      alert('Candidato não encontrado. Tente recarregar a página.');
      return;
    }
    
    console.log(`Iniciando exclusão: partido=${partido.nome}, candidato=${candidatoNome}`);
    
    try {
      // Excluir apenas do cenário base (fonte única de verdade)
      if (!cenarioAtivo) {
        throw new Error('Cenário base não encontrado');
      }
      
      // Atualizar estado local primeiro
      setPartidos(prev => prev.map((p, i) => {
        if (i !== partidoIdx) return p;
        return {
          ...p,
          candidatos: p.candidatos.filter(c => c.nome !== candidatoNome)
        };
      }));

      // Salvar no cenário base
      const partidosConvertidos = converterPartidosParaCenario();
      await atualizarCenario(cenarioAtivo.id, partidosConvertidos, quociente);
      console.log('Candidato excluído do cenário base com sucesso');
      mostrarNotificacaoAutoSave(`Candidato excluído com sucesso`);
      
      console.log('Exclusão concluída com sucesso');
    } catch (error) {
      console.error('Erro ao excluir candidato:', error);
      
      // Simplificar tratamento de erro
      console.error('Erro ao excluir candidato:', error);
      
      // Sempre recarregar dados do Firestore em caso de erro
      console.log('Erro na exclusão, recarregando dados do Firestore...');
      await carregarDadosFirestore();
      alert('Candidato não encontrado. Dados foram recarregados automaticamente.');
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
      // Verificar se o candidato já existe
      const candidatoExistente = partido.candidatos.find(c => c.nome === novoCandidato.nome);
      if (candidatoExistente) {
        alert('Este candidato já existe no partido!');
        return;
      }

      // Salvar apenas no cenário base (fonte única de verdade)
      if (!cenarioAtivo) {
        throw new Error('Cenário base não encontrado');
      }
      
      // Atualizar estado local UMA VEZ apenas
      setPartidos(prev => prev.map((p, i) => {
        if (i !== partidoIdx) return p;
        
        // O gênero é determinado pela seleção do usuário no modal
        // Inserir o candidato no local correto baseado no gênero selecionado
        const candidatosAtuais = [...p.candidatos];
        
        // Adicionar o candidato com informação de gênero
        const candidatoComGenero = { 
          nome: novoCandidato.nome, 
          votos: novoCandidato.votos,
          genero: novoCandidato.genero 
        };
        
        if (novoCandidato.genero === 'mulher') {
          // Para mulheres, inserir após a última mulher existente
          const ultimaMulherIndex = candidatosAtuais.findLastIndex(c => c.genero === 'mulher');
          
          if (ultimaMulherIndex === -1) {
            // Não há mulheres na lista, inserir no final
            candidatosAtuais.push(candidatoComGenero);
          } else {
            // Inserir após a última mulher
            candidatosAtuais.splice(ultimaMulherIndex + 1, 0, candidatoComGenero);
          }
        } else {
          // Para homens, inserir antes da primeira mulher
          const primeiraMulherIndex = candidatosAtuais.findIndex(c => c.genero === 'mulher');
          
          if (primeiraMulherIndex === -1) {
            // Não há mulheres na lista, inserir no final
            candidatosAtuais.push(candidatoComGenero);
          } else {
            // Inserir antes da primeira mulher
            candidatosAtuais.splice(primeiraMulherIndex, 0, candidatoComGenero);
          }
        }
        
        return {
          ...p,
          candidatos: candidatosAtuais
        };
      }));

      // Salvar no cenário base
      const partidosConvertidos = converterPartidosParaCenario();
      await atualizarCenario(cenarioAtivo.id, partidosConvertidos, quociente);

      // Limpar formulário e fechar dialog
      setNovoCandidato({ nome: '', votos: 0, genero: 'homem' });
      setDialogAberto(null);
      
      mostrarNotificacaoAutoSave('Candidato adicionado com sucesso');
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
    const partidosOrdenados = ordenarPartidos(cenario.partidos);
    setPartidos(partidosOrdenados);
    setQuociente(cenario.quocienteEleitoral);
  };

  const handleCenarioBaseCreated = () => {
    // Recarregar cenário ativo após criar o base
    obterCenarioAtivo().then(cenario => {
      if (cenario) {
        setCenarioAtivo(cenario);
        const partidosOrdenados = ordenarPartidos(cenario.partidos);
        setPartidos(partidosOrdenados);
        setQuociente(cenario.quocienteEleitoral);
      }
    });
  };

  const handleCenarioDeleted = () => {
    // Recarregar cenário ativo após exclusão
    console.log('Cenário excluído, recarregando cenário ativo...');
    
    // Forçar recarregamento do cenário base do Firestore
    carregarCenario('base').then((cenario: CenarioCompleto | null) => {
      if (cenario) {
        console.log('Cenário base recarregado:', cenario.nome);
        setCenarioAtivo(cenario);
        const partidosOrdenados = ordenarPartidos(cenario.partidos);
        setPartidos(partidosOrdenados);
        setQuociente(cenario.quocienteEleitoral);
      } else {
        console.error('Erro: não foi possível carregar o cenário base');
      }
    });
  };

  // Função para limpar e recriar o cenário base (resolver problemas de dados corrompidos)
  const limparERecriarCenarioBase = async () => {
    if (!confirm('Isso irá limpar completamente o cenário base e recriar com dados limpos. Tem certeza?')) {
      return;
    }

    try {
      console.log('Limpando e recriando cenário base...');
      
      // Limpar estado local
      const partidosLimpos = criarPartidosIniciais();
      setPartidos(partidosLimpos);
      setVotosLegenda({});
      
      // Recriar cenário base
      await criarCenarioBase(partidosLimpos, quociente);
      
      // Recarregar o cenário recém-criado
      const cenarioBaseRecriado = await carregarCenario('base');
      if (cenarioBaseRecriado) {
        setCenarioAtivo(cenarioBaseRecriado);
        const partidosOrdenados = ordenarPartidos(cenarioBaseRecriado.partidos);
        setPartidos(partidosOrdenados);
        console.log('Cenário base recriado com sucesso');
        mostrarNotificacaoAutoSave('Cenário base limpo e recriado com sucesso');
      }
    } catch (error) {
      console.error('Erro ao limpar cenário base:', error);
      alert('Erro ao limpar cenário base. Tente novamente.');
    }
  };

  // Função para ordenar partidos na ordem fixa
  const ordenarPartidos = <T extends { nome: string }>(partidosParaOrdenar: T[]): T[] => {
    const ordemPartidos = ["PT", "PSD/MDB", "PP", "REPUBLICANOS"];
    return ordemPartidos
      .map(nomePartido => partidosParaOrdenar.find(p => p.nome === nomePartido))
      .filter(Boolean) as T[];
  };

  // Função para converter partidos para o formato do cenário
  const converterPartidosParaCenario = (): PartidoCenario[] => {
    const partidosOrdenados = ordenarPartidos(partidos);
    return partidosOrdenados.map(partido => ({
      nome: partido.nome,
      cor: partido.cor,
      corTexto: partido.corTexto,
      candidatos: partido.candidatos.map(c => ({
        nome: c.nome,
        votos: c.votos,
        genero: (c as any).genero // Incluir o campo genero para persistência
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
            {cenarioAtivo && cenarioAtivo.tipo === 'base' && (
              <Button
                variant="outline"
                size="sm"
                onClick={limparERecriarCenarioBase}
                className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
              >
                Limpar Base
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
          {ordenarPartidos(partidos).map((partido, pIdx) => {
            // Encontrar o índice real do partido no array original
            const partidoIdx = partidos.findIndex(p => p.nome === partido.nome);
            return (
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
                                     {(() => {
                     const votosTotal = getVotosProjetados(partido.candidatos, partido.nome);
                     const sobra1 = getSobra1Partido(partido.nome, votosTotal);
                     const sobra2 = getSobra2Calculada(partido.nome, votosTotal);
                     const maiorSobra1 = calcularMaiorSobra1();
                     const maiorSobra2 = calcularMaiorSobra2();
                    
                    return (
                      <>
                        {/* Divisões específicas por partido */}
                        {partido.nome === "PT" || partido.nome === "PSD/MDB" ? (
                          <div className="grid grid-cols-3 gap-2 text-xs items-center justify-start">
                            <div className="whitespace-nowrap flex items-center">
                              ÷3: {getDivisaoPorTres(votosTotal)}
                            </div>
                            <div className="whitespace-nowrap flex items-center">
                              ÷4: {getDivisaoPorQuatro(votosTotal)}
                            </div>
                            <div className="whitespace-nowrap flex items-center">
                              ÷5: {getDivisaoPorCinco(votosTotal)}
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-2 text-xs items-center justify-start">
                            <div className="whitespace-nowrap flex items-center">
                              ÷2: {getDivisaoPorDois(votosTotal)}
                            </div>
                            <div className="whitespace-nowrap flex items-center">
                              ÷3: {getDivisaoPorTres(votosTotal)}
                            </div>
                          </div>
                        )}
                        
                        {/* Sobras - todos os partidos têm Sobra 1 e Sobra 2 */}
                        <div className="flex flex-col gap-1">
                          <div className="text-center">
                            <div className={`whitespace-nowrap flex items-center justify-center font-semibold text-xs ${
                              sobra1 === maiorSobra1 ? 'text-green-600' : 'text-gray-600'
                            }`}>
                              Sobra 1: {sobra1.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              {sobra1 === maiorSobra1 && <Check className="h-3 w-3 ml-1 text-green-600" />}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className={`whitespace-nowrap flex items-center justify-center font-semibold text-xs ${
                              sobra2 === maiorSobra2 ? 'text-green-600' : 'text-gray-600'
                            }`}>
                              Sobra 2: {sobra2.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              {sobra2 === maiorSobra2 && <Check className="h-3 w-3 ml-1 text-green-600" />}
                            </div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          );
          })}
        </div>

        {/* Container para as simulações */}
        <div className="mt-8">
          {/* Seção independente para soma PP + IGREJA */}
          <div className="p-4 bg-gray-100 rounded-lg max-w-md">
            <div className="text-base font-semibold mb-2">
              Simulação de Fusão - PP + IGREJA
            </div>
            {(() => {
              const pp = partidos.find(p => p.nome === "PP");
              if (!pp) return null;

              const votosPP = getVotosProjetados(pp.candidatos, "PP");
              const votosTotal = votosPP + votosIgreja;

              return (
                <div className="flex flex-col gap-2">
                  {/* Equação com todos os inputs na mesma linha */}
                  <div className="flex items-center gap-2 text-sm">
                    <span>PP ({votosPP.toLocaleString('pt-BR')})</span>
                    <span>+</span>
                    <div className="flex items-center gap-1">
                      <span>IGREJA</span>
                      <input
                        type="number"
                        value={votosIgreja}
                        onChange={(e) => setVotosIgreja(Number(e.target.value))}
                        className="w-20 px-1 py-0.5 text-xs border rounded"
                      />
                    </div>
                    <span>-</span>
                    <div className="flex items-center gap-1">
                      <span className="text-red-600 text-xs">CANDIDATO1</span>
                      <input
                        type="text"
                        value={candidato1}
                        onChange={(e) => setCandidato1(e.target.value)}
                        placeholder="Nome"
                        className="w-24 px-1 py-0.5 text-xs border rounded"
                      />
                    </div>
                    <span>-</span>
                    <div className="flex items-center gap-1">
                      <span className="text-red-600 text-xs">CANDIDATO2</span>
                      <input
                        type="text"
                        value={candidato2}
                        onChange={(e) => setCandidato2(e.target.value)}
                        placeholder="Nome"
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