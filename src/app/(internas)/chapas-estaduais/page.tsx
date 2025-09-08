"use client";

import React, { useEffect, useState, useRef } from "react";
import { Trash2, Plus, Pencil, RefreshCw, Check, Printer } from "lucide-react";
import generatePDF from 'react-to-pdf';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { carregarQuocienteEleitoral, salvarQuocienteEleitoral, CenarioCompleto, PartidoCenario, obterCenarioAtivo, atualizarCenario, carregarCenario, criarCenarioBase, dadosIniciais, listarCenarios, criarNovoCenario, excluirCenario, ativarCenario } from "@/services/chapasEstaduaisService";
import CenariosTabs from "@/components/CenariosTabs";
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
  "MDB": { cor: "bg-yellow-400", corTexto: "text-gray-900" },
  "PP": { cor: "bg-sky-400", corTexto: "text-white" },
  "REPUBLICANOS": { cor: "bg-blue-600", corTexto: "text-white" }
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
  return Object.keys(coresPartidos).map(nome => {
    const partido = {
      nome,
      ...coresPartidos[nome as keyof typeof coresPartidos],
      candidatos: [] as Array<{ nome: string; votos: number; genero?: string }>
    };

    // Não adicionar candidatos automaticamente - eles devem vir do Firebase
    // Os candidatos republicanos serão carregados do cenário base no Firebase

    return partido;
  });
};

const initialQuociente = 190000;

// Função centralizada para obter a lista de mulheres de cada partido
const getMulheresPartido = (nomePartido: string): string[] => {
  switch (nomePartido) {
    case "PT":
      return ['MULHER 1', 'MULHER 2', 'MULHER 3'];
    case "MDB":
      return ['MULHER 1', 'MULHER 2', 'MULHER 3', 'MULHER 4'];
    case "PP":
      return ['MULHER 1', 'MULHER 2', 'MULHER 3'];
    case "REPUBLICANOS":
      return ['MULHER 1', 'MULHER 2', 'MULHER 3', 'MULHER 4', 'MULHER 5', 'MULHER 6', 'MULHER 7', 'MULHER 8'];
    default:
      return [];
  }
};

export default function ChapasEstaduaisPage() {
  const [loading, setLoading] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [modoImpressao, setModoImpressao] = useState(false);

  const [partidos, setPartidos] = useState<PartidoLocal[]>(criarPartidosIniciais());
  const [quociente, setQuociente] = useState(initialQuociente);
  const [quocienteCarregado, setQuocienteCarregado] = useState(false);
  const [cenarioAtivo, setCenarioAtivo] = useState<CenarioCompleto | null>(null);

  const [editVoto, setEditVoto] = useState<{ partidoIdx: number; candidatoNome: string } | null>(null);
  const [hoveredRow, setHoveredRow] = useState<{ partidoIdx: number; candidatoNome: string } | null>(null);
  const [editingName, setEditingName] = useState<{ partidoIdx: number; candidatoNome: string; tempValue: string } | null>(null);
  const [votosLegenda, setVotosLegenda] = useState<{ [partido: string]: number }>({});

  // Estados para adicionar novo candidato
  const [dialogAberto, setDialogAberto] = useState<number | null>(null);
  const [novoCandidato, setNovoCandidato] = useState({ nome: '', votos: 0, genero: 'homem' as 'homem' | 'mulher' });
  const [salvandoCandidato, setSalvandoCandidato] = useState(false);

  // Adicionar estado para edição temporária dos votos de legenda
  const [votosLegendaTemp, setVotosLegendaTemp] = useState<{ [partido: string]: string }>({});
  const [salvandoMudancas, setSalvandoMudancas] = useState(false);
  const [notificacaoAutoSave, setNotificacaoAutoSave] = useState<string | null>(null);
  const [carregandoCenario, setCarregandoCenario] = useState(false);
  const [numVagas, setNumVagas] = useState(8); // Novo estado para número de vagas

  const mostrarNotificacaoAutoSave = (mensagem: string) => {
    setNotificacaoAutoSave(mensagem);
    setTimeout(() => setNotificacaoAutoSave(null), 3000);
  };

  const handleImprimirPDF = async () => {
    if (!contentRef.current) return;
    
    try {
      // Ativar modo de impressão
      setModoImpressao(true);
      
      // Aguardar um pouco para o DOM ser atualizado
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await generatePDF(contentRef, {
        filename: `chapas-eleitorais-${new Date().toISOString().split('T')[0]}.pdf`
      });
      
      // Desativar modo de impressão
      setModoImpressao(false);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF. Tente novamente.');
      setModoImpressao(false);
    }
  };

  const handleSalvarVotosLegenda = async (partidoIdx: number, votos: number) => {
    const partido = partidos[partidoIdx];
    try {
      // Atualizar estado local primeiro
      setVotosLegenda(prev => ({
        ...prev,
        [partido.nome]: votos
      }));

      // Salvar apenas os partidos, sem alterar o QE
      if (!cenarioAtivo) {
        throw new Error('Cenário base não encontrado');
      }
      
      const partidosConvertidos = converterPartidosParaCenario();
      await atualizarCenario(cenarioAtivo.id, partidosConvertidos, cenarioAtivo.quocienteEleitoral, numVagas);

      mostrarNotificacaoAutoSave(`Votos de legenda do ${partido.nome} salvos`);
    } catch (error) {
      console.error('Erro ao salvar votos de legenda:', error);
      alert('Erro ao salvar votos de legenda. Tente novamente.');
    }
  };



  // Função para carregar dados do cenário base (fonte única de verdade)
  const carregarDadosFirestore = async () => {
    try {
      // Tentar carregar do cenário base
      const cenarioBase = await carregarCenario('base');
      if (cenarioBase) {
        // Verificar se o cenário base tem o nome correto do partido
        const temPSDMDB = cenarioBase.partidos.some((partido: any) => partido.nome === 'PSD/MDB');
        if (temPSDMDB) {
          console.log('Cenário base tem nome antigo. Recriando com nome correto...');
          // Recriar cenário base com nome correto
          const partidosIniciais = [
            {
              nome: 'PT',
              cor: 'bg-red-600',
              corTexto: 'text-white',
              candidatos: []
            },
            {
              nome: 'MDB',
              cor: 'bg-yellow-400',
              corTexto: 'text-gray-900',
              candidatos: []
            },
            {
              nome: 'PP',
              cor: 'bg-sky-400',
              corTexto: 'text-white',
              candidatos: []
            }
          ];
          await criarCenarioBase(partidosIniciais, 190000, numVagas);
          // Recarregar o cenário base recriado
          const novoCenarioBase = await carregarCenario('base');
          if (novoCenarioBase) {
            setCenarioAtivo(novoCenarioBase);
            const partidosOrdenados = ordenarPartidos(novoCenarioBase.partidos);
            setPartidos(partidosOrdenados);
            if (!quocienteCarregado) {
              setQuociente(novoCenarioBase.quocienteEleitoral);
            }
            
            // Carregar número de vagas do cenário base
            if (novoCenarioBase.numeroVagas) {
              setNumVagas(novoCenarioBase.numeroVagas);
            }
            
            const votosLegendaTemp: { [partido: string]: number } = {};
            novoCenarioBase.partidos.forEach((partido: any) => {
              if (partido.votosLegenda) {
                votosLegendaTemp[partido.nome] = partido.votosLegenda;
              }
            });
            setVotosLegenda(votosLegendaTemp);
            return;
          }
        }
        
        setCenarioAtivo(cenarioBase);
        const partidosOrdenados = ordenarPartidos(cenarioBase.partidos);
        setPartidos(partidosOrdenados);
        if (!quocienteCarregado) {
          setQuociente(cenarioBase.quocienteEleitoral);
        }
        
        // Carregar número de vagas do cenário base
        if (cenarioBase.numeroVagas) {
          setNumVagas(cenarioBase.numeroVagas);
        }
        
        const votosLegendaTemp: { [partido: string]: number } = {};
        cenarioBase.partidos.forEach((partido: any) => {
          if (partido.votosLegenda) {
            votosLegendaTemp[partido.nome] = partido.votosLegenda;
          }
        });
        setVotosLegenda(votosLegendaTemp);
      } else {
        console.log('Cenário base não encontrado. Criando cenário base...');
        // Criar cenário base se não existir
        const partidosIniciais = [
          {
            nome: 'PT',
            cor: 'bg-red-600',
            corTexto: 'text-white',
            candidatos: []
          },
          {
            nome: 'MDB',
            cor: 'bg-yellow-400',
            corTexto: 'text-gray-900',
            candidatos: []
          },
          {
            nome: 'PP',
            cor: 'bg-sky-400',
            corTexto: 'text-white',
            candidatos: []
          }
        ];
        await criarCenarioBase(partidosIniciais, 190000, numVagas);
        
        // Recarregar o cenário base criado
        const novoCenarioBase = await carregarCenario('base');
        if (novoCenarioBase) {
          setCenarioAtivo(novoCenarioBase);
          const partidosOrdenados = novoCenarioBase.partidos.map((partido: any) => ({
            nome: partido.nome,
            cor: partido.cor,
            corTexto: partido.corTexto,
            candidatos: partido.candidatos
          }));
          setPartidos(partidosOrdenados);
          if (!quocienteCarregado) {
            setQuociente(novoCenarioBase.quocienteEleitoral);
          }
          const votosLegendaTemp: { [partido: string]: number } = {};
          novoCenarioBase.partidos.forEach((partido: any) => {
            if (partido.votosLegenda) {
              votosLegendaTemp[partido.nome] = partido.votosLegenda;
            }
          });
          setVotosLegenda(votosLegendaTemp);
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
        // Primeiro tentar carregar cenário ativo (se existir)
        try {
          const cenarioAtivo = await obterCenarioAtivo();
          if (cenarioAtivo) {
            setCenarioAtivo(cenarioAtivo);
            const partidosOrdenados = ordenarPartidos(cenarioAtivo.partidos);
            setPartidos(partidosOrdenados);
            // Carregar o QE do cenário ativo
            setQuociente(cenarioAtivo.quocienteEleitoral);
            setQuocienteCarregado(true);
            
            // Carregar número de vagas do cenário ativo
            if (cenarioAtivo.numeroVagas) {
              setNumVagas(cenarioAtivo.numeroVagas);
            }
            
            // Carregar votos de legenda do cenário ativo
            const votosLegendaTemp: { [partido: string]: number } = {};
            cenarioAtivo.partidos.forEach((partido: any) => {
              if (partido.votosLegenda) {
                votosLegendaTemp[partido.nome] = partido.votosLegenda;
              }
            });
            setVotosLegenda(votosLegendaTemp);
            
            return; // Sair da função se encontrou cenário ativo
          }
        } catch (cenarioError) {
          // Nenhum cenário ativo encontrado, carregando cenário base
        }
        
        // Se não há cenário ativo, carregar o cenário base
        await carregarDadosFirestore();
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
      "MDB": "bg-yellow-400",
      "PP": "bg-sky-400",
      "REPUBLICANOS": "bg-blue-600"
    };
    return cores[partido] || "bg-gray-200";
  }

  function getPartidoCorTexto(partido: string): string {
    const cores: { [key: string]: string } = {
      "PT": "text-white",
      "MDB": "text-gray-900",
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

        // Salvar apenas os partidos, sem alterar o QE
        if (!cenarioAtivo) {
          throw new Error('Cenário base não encontrado');
        }
        
        const partidosConvertidos = converterPartidosParaCenario();
        await atualizarCenario(cenarioAtivo.id, partidosConvertidos, cenarioAtivo.quocienteEleitoral, numVagas);


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
      
      // Salvar apenas os partidos, sem alterar o QE
      if (!cenarioAtivo) {
        throw new Error('Cenário base não encontrado');
      }
      
      const partidosConvertidos = converterPartidosParaCenario();
      await atualizarCenario(cenarioAtivo.id, partidosConvertidos, cenarioAtivo.quocienteEleitoral, numVagas);
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

  // Calcular 80% do Quociente Eleitoral
  const getQuocienteMinimo = () => {
    return quociente * 0.8;
  };

  // Verificar se partido atingiu o mínimo de 80% do quociente
  const partidoAtingiuMinimo = (partidoNome: string) => {
    const votosProjetados = getVotosProjetados(
      partidos.find(p => p.nome === partidoNome)?.candidatos || [], 
      partidoNome
    );
    const quocienteMinimo = getQuocienteMinimo();
    return votosProjetados >= quocienteMinimo;
  };

  // Obter partidos que podem participar da disputa das sobras
  const getPartidosElegiveisSobras = () => {
    return partidos.filter(partido => partidoAtingiuMinimo(partido.nome));
  };
  const getProjecaoEleitos = (votosTotal: number) => (votosTotal / quociente).toFixed(2);
  const getDivisaoPorDois = (votosTotal: number) => (votosTotal / 2).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Funções para calcular sobras seguindo a regra proporcional brasileira
  // Votos diretos = parte inteira da divisão (votos/quociente)
  // Sobra = parte decimal × quociente
  
  // Calcular vagas diretas (eleitos diretos)
  const calcularVagasDiretas = (votosTotal: number) => {
    return Math.floor(votosTotal / quociente);
  };

  // Calcular sobra (parte decimal × quociente) - MÉTODO SIMPLIFICADO (INCORRETO)
  const calcularSobra = (votosTotal: number) => {
    const divisao = votosTotal / quociente;
    const parteDecimal = divisao - Math.floor(divisao);
    return parteDecimal * quociente;
  };

  // MÉTODO D'HONDT CORRETO - Legislação Brasileira
  const calcularDistribuicaoDHondt = () => {
    // Usar o estado numVagas em vez da constante
    const VAGAS_TOTAIS = numVagas;
    
    // Filtrar apenas partidos que atingiram o mínimo de 80% do quociente
    const partidosElegiveis = partidos.filter(partido => partidoAtingiuMinimo(partido.nome));
    
    // Inicializar partidos com vagas diretas
    const partidosComVagas = partidosElegiveis.map(partido => {
      const votosTotal = getVotosProjetados(partido.candidatos, partido.nome);
      const vagasDiretas = calcularVagasDiretas(votosTotal);
      
      return {
        partido: partido.nome,
        votosTotal,
        vagasObtidas: vagasDiretas, // Inicialmente igual às vagas diretas
        vagasDiretas: vagasDiretas
      };
    });
    
    // Calcular vagas já distribuídas
    const vagasDistribuidas = partidosComVagas.reduce((total, p) => total + p.vagasObtidas, 0);
    const vagasRestantes = VAGAS_TOTAIS - vagasDistribuidas;
    
    // Distribuir vagas restantes pelo Método D'Hondt
    const historicoSobras = [];
    
    for (let i = 0; i < vagasRestantes; i++) {
      // Calcular quocientes partidários para cada partido
      const quocientesPartidarios = partidosComVagas.map(p => ({
        partido: p.partido,
        quocientePartidario: p.votosTotal / (p.vagasObtidas + 1)
      }));
      
      // Ordenar por quociente partidário (maior para menor)
      quocientesPartidarios.sort((a, b) => b.quocientePartidario - a.quocientePartidario);
      
      // O partido com maior quociente partidário ganha a vaga
      const ganhador = quocientesPartidarios[0];
      
      // Verificar se há um ganhador válido
      if (ganhador && ganhador.partido) {
        // Adicionar ao histórico
        historicoSobras.push({
          rodada: i + 1,
          partido: ganhador.partido,
          quocientePartidario: ganhador.quocientePartidario,
          vaga: vagasDistribuidas + i + 1
        });
        
        // Atualizar o partido ganhador
        const partidoGanhador = partidosComVagas.find(p => p.partido === ganhador.partido);
        if (partidoGanhador) {
          partidoGanhador.vagasObtidas++;
        }
      } else {
        console.warn('Nenhum partido elegível encontrado para a vaga', i + 1);
        break; // Sair do loop se não há partidos elegíveis
      }
    }
    
    return {
      partidosComVagas,
      vagasDistribuidas,
      vagasRestantes,
      historicoSobras,
      totalVagas: VAGAS_TOTAIS
    };
  };

  // Calcular sobras seguindo o sistema proporcional brasileiro (MÉTODO D'HONDT)
  const calcularSobras = () => {
    // Filtrar apenas partidos que atingiram o mínimo de 80% do quociente
    const partidosElegiveis = getPartidosElegiveisSobras();
    
    const resultados = partidos.map(partido => {
      const votosTotal = getVotosProjetados(partido.candidatos, partido.nome);
      const vagasDiretas = calcularVagasDiretas(votosTotal);
      const divisao = votosTotal / quociente;
      const atingiuMinimo = partidoAtingiuMinimo(partido.nome);
      
      // Para o Método D'Hondt, a "sobra" é o quociente partidário
      const quocientePartidario = atingiuMinimo ? votosTotal / (vagasDiretas + 1) : 0;
      
      return {
        partido: partido.nome,
        votosTotal,
        vagasDiretas,
        sobra: quocientePartidario, // Quociente partidário para D'Hondt
        divisao,
        projecaoEleitos: divisao.toFixed(2),
        atingiuMinimo,
        quocientePartidario
      };
    });

    // Ordenar por quociente partidário (maior para menor) - apenas partidos elegíveis
    const ordenadosPorSobras = resultados
      .filter(r => r.atingiuMinimo && r.quocientePartidario !== undefined)
      .sort((a, b) => (b.quocientePartidario || 0) - (a.quocientePartidario || 0));
    
    return {
      resultados,
      ordenadosPorSobras,
      maiorSobra: ordenadosPorSobras[0]?.quocientePartidario || 0
    };
  };

  // Simular distribuição completa das vagas (8 vagas totais) - MÉTODO D'HONDT
  const simularDistribuicaoCompleta = () => {
    return calcularDistribuicaoDHondt();
  };

  // Funções mantidas para compatibilidade com o código existente
  const calcularMaiorSobra1 = () => {
    const { maiorSobra } = calcularSobras();
    return maiorSobra;
  };

  const calcularMaiorSobra2 = () => {
    const { ordenadosPorSobras } = calcularSobras();
    // Para a segunda sobra, considerar o segundo maior
    return ordenadosPorSobras[1]?.sobra || 0;
  };

  const getSobra1Partido = (partidoNome: string, votosTotal: number) => {
    return calcularSobra(votosTotal);
  };

  const getSobra2Partido = (partidoNome: string, votosTotal: number) => {
    return calcularSobra(votosTotal);
  };

  const getSobra2Calculada = (partidoNome: string, votosTotal: number) => {
    const { ordenadosPorSobras } = calcularSobras();
    const partidoIndex = ordenadosPorSobras.findIndex(p => p.partido === partidoNome);
    
    // Se o partido ganhou a primeira sobra, calcular para a segunda vaga
    if (partidoIndex === 0) {
      // Para segunda sobra, considerar que já ganhou uma vaga
      const votosAjustados = votosTotal - quociente;
      return calcularSobra(votosAjustados);
    }
    
    // Caso contrário, manter a sobra original
    return calcularSobra(votosTotal);
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

  const separarCandidatosMDB = (candidatos: { nome: string; votos: number; genero?: string }[]) => {
    return separarCandidatosPorGenero(candidatos);
  };

  const separarCandidatosPP = (candidatos: { nome: string; votos: number; genero?: string }[]) => {
    return separarCandidatosPorGenero(candidatos);
  };

  const separarCandidatosREPUBLICANOS = (candidatos: { nome: string; votos: number; genero?: string }[]) => {
    return separarCandidatosPorGenero(candidatos);
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

      // Salvar apenas os partidos, sem alterar o QE
      const partidosConvertidos = converterPartidosParaCenario();
      await atualizarCenario(cenarioAtivo.id, partidosConvertidos, cenarioAtivo.quocienteEleitoral, numVagas);
      mostrarNotificacaoAutoSave(`Candidato excluído com sucesso`);
    } catch (error) {
      console.error('Erro ao excluir candidato:', error);
      
      // Simplificar tratamento de erro
      console.error('Erro ao excluir candidato:', error);
      
      // Sempre recarregar dados do Firestore em caso de erro
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

      // Salvar apenas os partidos, sem alterar o QE
      const partidosConvertidos = converterPartidosParaCenario();
      await atualizarCenario(cenarioAtivo.id, partidosConvertidos, cenarioAtivo.quocienteEleitoral, numVagas);

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
    setCenarioAtivo(cenario);
    const partidosOrdenados = ordenarPartidos(cenario.partidos);
    setPartidos(partidosOrdenados);
    setQuociente(cenario.quocienteEleitoral);
    setQuocienteCarregado(true);
    
    // Carregar número de vagas do cenário
    if (cenario.numeroVagas) {
      setNumVagas(cenario.numeroVagas);
    }
    
    // Carregar votos de legenda do cenário
    const votosLegendaTemp: { [partido: string]: number } = {};
    cenario.partidos.forEach((partido: any) => {
      if (partido.votosLegenda) {
        votosLegendaTemp[partido.nome] = partido.votosLegenda;
      }
    });
    setVotosLegenda(votosLegendaTemp);
  };

  // Carregar cenário ao clicar no card
  const handleCenarioClick = async (cenarioId: string) => {
    if (carregandoCenario) return; // Evitar múltiplos cliques
    
    setCarregandoCenario(true);
    try {
      // Carregar o novo cenário diretamente (sem salvar automaticamente)
      const novoCenario = await carregarCenario(cenarioId);
      if (novoCenario) {
        handleCenarioChange(novoCenario as any);
        mostrarNotificacaoAutoSave(`Cenário "${novoCenario.nome}" carregado com sucesso`);
      }
    } catch (error) {
      console.error('Erro ao carregar cenário:', error);
      alert('Erro ao carregar cenário. Tente novamente.');
    } finally {
      setCarregandoCenario(false);
    }
  };

  const handleCenarioBaseCreated = () => {
    // Recarregar cenário ativo após criar o base
    obterCenarioAtivo().then(cenario => {
      if (cenario) {
        setCenarioAtivo(cenario);
        const partidosOrdenados = ordenarPartidos(cenario.partidos);
        setPartidos(partidosOrdenados);
        setQuociente(cenario.quocienteEleitoral);
        
        // Carregar número de vagas do cenário base
        if (cenario.numeroVagas) {
          setNumVagas(cenario.numeroVagas);
        }
      }
    });
  };

  const handleCenarioDeleted = () => {
    // Recarregar cenário ativo após exclusão
    
    
    // Forçar recarregamento do cenário base do Firestore
    carregarCenario('base').then((cenario: CenarioCompleto | null) => {
      if (cenario) {

        setCenarioAtivo(cenario);
        const partidosOrdenados = ordenarPartidos(cenario.partidos);
        setPartidos(partidosOrdenados);
        setQuociente(cenario.quocienteEleitoral);
        
        // Carregar número de vagas do cenário base
        if (cenario.numeroVagas) {
          setNumVagas(cenario.numeroVagas);
        }
      } else {
        console.error('Erro: não foi possível carregar o cenário base');
      }
    });
  };

  // Função removida - não há criação automática de cenários
  // O sistema apenas carrega dados do Firestore

  // Função para ordenar partidos na ordem fixa
  const ordenarPartidos = <T extends { nome: string }>(partidosParaOrdenar: T[]): T[] => {
    const ordemPartidos = ["PT", "MDB", "PP", "REPUBLICANOS"];
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
        await atualizarCenario(cenarioAtivo.id, partidosConvertidos, quociente, numVagas);
        
        // O cenário será automaticamente ativado pelo serviço
        
        // Verificar se o QE foi realmente salvo
        const cenarioVerificado = await carregarCenario(cenarioAtivo.id);
        if (cenarioVerificado) {
          if (cenarioVerificado.quocienteEleitoral !== quociente) {
            console.error('ERRO: QE não foi salvo corretamente!');
            console.error('QE esperado:', quociente);
            console.error('QE salvo:', cenarioVerificado.quocienteEleitoral);
          }
        }
        
        // Feedback visual temporário
        setTimeout(() => setSalvandoMudancas(false), 2000);
        mostrarNotificacaoAutoSave(`Mudanças salvas no cenário "${cenarioAtivo.nome}" com QE: ${quociente.toLocaleString('pt-BR')} e ${numVagas} vagas`);
      } catch (error) {
        console.error('Erro ao salvar mudanças no cenário:', error);
        setSalvandoMudancas(false);
        alert('Erro ao salvar mudanças. Tente novamente.');
      }
    } else {
      console.error('Nenhum cenário ativo encontrado para salvar');
      alert('Nenhum cenário ativo encontrado. Tente selecionar um cenário primeiro.');
    }
  };

  // Função para verificar se o candidato atingiu 20% do quociente
  const candidatoAtingiuMinimo = (votos: number) => {
    return votos >= (quociente * 0.2);
  };

  // Função para calcular os candidatos eleitos baseado nos votos
  const calcularCandidatosEleitos = () => {
    try {
      const simulacao = simularDistribuicaoCompleta();
      const candidatosEleitos: Array<{
        partido: string;
        nome: string;
        votos: number;
        posicao: number;
        tipoEleicao: 'direta' | 'sobra';
        atingiuMinimo: boolean;
      }> = [];

      // Verificar se simulacao e partidosComVagas existem
      if (!simulacao || !simulacao.partidosComVagas) {
        console.warn('Simulação não encontrada ou inválida');
        return [];
      }

      simulacao.partidosComVagas.forEach(partidoInfo => {
        // Verificar se partidoInfo tem as propriedades necessárias
        if (!partidoInfo || !partidoInfo.partido || typeof partidoInfo.vagasObtidas !== 'number') {
          console.warn('Dados do partido inválidos:', partidoInfo);
          return;
        }

        const partido = partidos.find(p => p.nome === partidoInfo.partido);
        if (!partido || partidoInfo.vagasObtidas === 0) return;

        // Filtrar candidatos (excluir votos de legenda)
        const candidatosValidos = partido.candidatos.filter(c => c.nome !== "VOTOS LEGENDA");
        
        // Primeiro, tentar preencher com candidatos que atingiram 20% do quociente
        const candidatosComMinimo = candidatosValidos.filter(c => candidatoAtingiuMinimo(c.votos));
        const candidatosSemMinimo = candidatosValidos.filter(c => !candidatoAtingiuMinimo(c.votos));
        
        // Ordenar candidatos por votos (maior para menor)
        const candidatosComMinimoOrdenados = [...candidatosComMinimo].sort((a, b) => b.votos - a.votos);
        const candidatosSemMinimoOrdenados = [...candidatosSemMinimo].sort((a, b) => b.votos - a.votos);
        
        // Primeiro, preencher com candidatos que atingiram o mínimo
        let candidatosSelecionados: Array<{candidato: any, atingiuMinimo: boolean}> = [];
        
        for (let i = 0; i < partidoInfo.vagasObtidas && i < candidatosComMinimoOrdenados.length; i++) {
          candidatosSelecionados.push({
            candidato: candidatosComMinimoOrdenados[i],
            atingiuMinimo: true
          });
        }
        
        // Se ainda há vagas disponíveis, preencher com candidatos que não atingiram o mínimo
        const vagasRestantes = partidoInfo.vagasObtidas - candidatosSelecionados.length;
        if (vagasRestantes > 0) {
          for (let i = 0; i < vagasRestantes && i < candidatosSemMinimoOrdenados.length; i++) {
            candidatosSelecionados.push({
              candidato: candidatosSemMinimoOrdenados[i],
              atingiuMinimo: false
            });
          }
        }
        
        // Adicionar candidatos eleitos à lista
        candidatosSelecionados.forEach((selecao, index) => {
          const candidato = selecao.candidato;
          if (candidato && candidato.nome) {
            candidatosEleitos.push({
              partido: partido.nome,
              nome: candidato.nome,
              votos: candidato.votos || 0,
              posicao: index + 1,
              tipoEleicao: index < calcularVagasDiretas(partidoInfo.votosTotal || 0) ? 'direta' : 'sobra',
              atingiuMinimo: selecao.atingiuMinimo
            });
          }
        });
      });

      // Ordenar por partido e depois por votos (dentro do partido)
      return candidatosEleitos.sort((a, b) => {
        if (a.partido !== b.partido) return a.partido.localeCompare(b.partido);
        return b.votos - a.votos;
      });
    } catch (error) {
      console.error('Erro ao calcular candidatos eleitos:', error);
      return [];
    }
  };

  // Função para calcular o total de votos válidos
  const getTotalVotosValidos = () => {
    return partidos.reduce((total, partido) => {
      return total + getVotosProjetados(partido.candidatos, partido.nome);
    }, 0);
  };

  return (
    <div className="container mx-auto p-4">
      {/* Notificação de auto-save */}
      {notificacaoAutoSave && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <Check className="h-4 w-4" />
          <span className="text-sm">{notificacaoAutoSave}</span>
        </div>
      )}
      
      <div ref={contentRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-4 py-4">
        {/* Header com controles de cenários e quociente */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Indicador de carregamento de cenário */}
            {carregandoCenario && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Carregando cenário...</span>
              </div>
            )}
          </div>
        </div>

        {/* Gerenciador de Cenários com Abas */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <CenariosTabs
            partidosAtuais={converterPartidosParaCenario()}
            quocienteAtual={quociente}
            onCenarioChange={handleCenarioChange}
            onCenarioBaseCreated={handleCenarioBaseCreated}
            onCenarioDeleted={handleCenarioDeleted}
            onCenarioClick={handleCenarioClick}
            onSalvarMudancas={salvarMudancasCenario}
            onLimparCenario={undefined}
            onImprimirPDF={handleImprimirPDF}
            salvandoMudancas={salvandoMudancas}
            service={{
              listarCenarios,
              carregarCenario,
              criarNovoCenario,
              excluirCenario,
              ativarCenario,
              criarCenarioBase
            }}
          />
        </div>

        {/* Resumo do Quociente Mínimo */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-3">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-700">Número de Vagas:</span>
              <input
                type="number"
                value={numVagas}
                onChange={(e) => {
                  const novoValor = Math.max(1, parseInt(e.target.value) || 8);
                  setNumVagas(novoValor);
                  
                  // Salvar automaticamente se há um cenário ativo
                  if (cenarioAtivo) {
                    const partidosConvertidos = converterPartidosParaCenario();
                    atualizarCenario(cenarioAtivo.id, partidosConvertidos, quociente, novoValor)
                      .then(() => {
                        mostrarNotificacaoAutoSave(`Número de vagas atualizado para ${novoValor}`);
                      })
                      .catch((error) => {
                        console.error('Erro ao salvar número de vagas:', error);
                      });
                  }
                }}
                className="text-sm font-bold text-gray-700 bg-transparent border-b border-gray-200 focus:border-blue-400 outline-none w-20 text-center px-1"
                min="1"
                max="20"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-700">QE 2026:</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9.]*"
                value={quociente.toLocaleString('pt-BR')}
                onChange={e => {
                  const raw = e.target.value.replace(/\./g, '');
                  const num = Number(raw);
                  if (!isNaN(num) && num >= 0) {
                    setQuociente(num);
                  }
                }}
                className="text-sm font-bold text-gray-700 bg-transparent border-b border-gray-200 focus:border-blue-400 outline-none w-20 text-center px-1"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-700">Mínimo:</span>
              <span className="text-sm font-bold text-gray-700">{getQuocienteMinimo().toLocaleString('pt-BR')}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-700">Elegíveis:</span>
              <span className="text-sm font-bold text-gray-700">
                {getPartidosElegiveisSobras().length}/{partidos.length}
              </span>
            </div>
          </div>
        </div>

        {/* Grid de partidos */}
        <div className="w-full grid grid-cols-1 md:grid-cols-4 gap-6">
          {ordenarPartidos(partidos).map((partido, pIdx) => {
            // Encontrar o índice real do partido no array original
            const partidoIdx = partidos.findIndex(p => p.nome === partido.nome);
            
            // Verificar se o partido atingiu o mínimo de 80% do quociente
            const atingiuMinimo = partidoAtingiuMinimo(partido.nome);
            const quocienteMinimo = getQuocienteMinimo();
            const votosProjetados = getVotosProjetados(partido.candidatos, partido.nome);
            
            return (
            <div key={partido.nome} className={`flex flex-col items-center bg-white rounded-lg shadow-sm border p-3 h-full min-h-[420px] ${
              atingiuMinimo 
                ? 'border-gray-100' 
                : 'border-red-300 bg-red-50'
            }`}>
              <div className={`w-full text-center py-1 font-bold text-base mb-2 rounded ${
                atingiuMinimo 
                  ? 'bg-gray-200 text-gray-800' 
                  : 'bg-red-200 text-red-800'
              }`}>
                {partido.nome}
              </div>
              
              {/* Informativo para partidos que não atingiram o mínimo */}
              {!atingiuMinimo && (
                <div className="w-full mb-2 p-2 bg-red-100 border border-red-200 rounded text-xs text-red-700 text-center">
                  <div className="font-semibold">⚠️ Partido não atingiu o mínimo</div>
                  <div>Votos: {votosProjetados.toLocaleString('pt-BR')}</div>
                  <div>Mínimo: {quocienteMinimo.toLocaleString('pt-BR')} (80% do QE)</div>
                  <div className="text-red-600 font-medium">Não participa da disputa das sobras</div>
                </div>
              )}
              
              <div className="w-full flex flex-col flex-1">
                {(partido.nome === "PT" || partido.nome === "MDB" || partido.nome === "PP" || partido.nome === "REPUBLICANOS") ? (
                  // Renderização especial para PT, MDB, PP e REPUBLICANOS com separação homens/mulheres
                  <div className="space-y-2">
                    {/* Bloco dos Homens */}
                    <table className="w-full text-xs">
                      <tbody>
                        {(() => {
                          const { homens } = partido.nome === "PT" 
                            ? separarCandidatosPT(partido.candidatos)
                            : partido.nome === "MDB"
                            ? separarCandidatosMDB(partido.candidatos)
                            : partido.nome === "PP"
                            ? separarCandidatosPP(partido.candidatos)
                            : partido.nome === "REPUBLICANOS"
                            ? separarCandidatosREPUBLICANOS(partido.candidatos)
                            : separarCandidatosPorGenero(partido.candidatos);
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
                                  {modoImpressao ? (
                                    <span className="text-xs font-medium">{c.nome}</span>
                                  ) : (
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
                                  )}
                                </div>
                              </td>
                              <td className="text-right whitespace-nowrap font-normal align-top">
                                {modoImpressao ? (
                                  <span className="text-xs font-medium">
                                    {Number(c.votos).toLocaleString('pt-BR')}
                                  </span>
                                ) : (
                                  editVoto && editVoto.partidoIdx === pIdx && editVoto.candidatoNome === c.nome ? (
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
                                  )
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
                            : partido.nome === "MDB"
                            ? separarCandidatosMDB(partido.candidatos)
                            : partido.nome === "PP"
                            ? separarCandidatosPP(partido.candidatos)
                            : partido.nome === "REPUBLICANOS"
                            ? separarCandidatosREPUBLICANOS(partido.candidatos)
                            : separarCandidatosPorGenero(partido.candidatos);
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
                                  {modoImpressao ? (
                                    <span className="text-xs font-medium">{c.nome}</span>
                                  ) : (
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
                                  )}
                                </div>
                              </td>
                              <td className="text-right whitespace-nowrap font-normal align-top">
                                {modoImpressao ? (
                                  <span className="text-xs font-medium">
                                    {Number(c.votos).toLocaleString('pt-BR')}
                                  </span>
                                ) : (
                                  editVoto && editVoto.partidoIdx === pIdx && editVoto.candidatoNome === c.nome ? (
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
                                  )
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
                              {modoImpressao ? (
                                <span className="text-xs font-medium">{c.nome}</span>
                              ) : (
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
                              )}
                            </div>
                          </td>
                          <td className="text-right whitespace-nowrap font-normal align-top">
                            {modoImpressao ? (
                              <span className="text-xs font-medium">
                                {Number(c.votos).toLocaleString('pt-BR')}
                              </span>
                            ) : (
                              editVoto && editVoto.partidoIdx === pIdx && editVoto.candidatoNome === c.nome ? (
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
                              )
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
                      {(partido.nome === "PT" || partido.nome === "MDB" || partido.nome === "PP" || partido.nome === "REPUBLICANOS") && (
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


            </div>
          );
          })}
        </div>

        {/* Container para as simulações */}
        <div className="mt-8">
          {/* Seção de detalhes das sobras - Método D'Hondt */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg max-w-4xl">
            <div className="text-base font-semibold mb-3 text-gray-900">
              📊 Cálculo de Sobras - Método D'Hondt (Legislação Brasileira)
            </div>
            <div className="text-sm text-gray-700 mb-3">
              <strong>Fórmula:</strong> Quociente Partidário = Votos ÷ (Vagas Obtidas + 1)
            </div>
            
            <div className="grid grid-cols-4 gap-4">
              {(() => {
                const { resultados, ordenadosPorSobras } = calcularSobras();
                
                return ordenadosPorSobras.map((resultado, index) => (
                  <div key={resultado.partido} className="bg-white p-3 rounded border border-gray-200">
                    <div className="font-semibold text-sm mb-2 text-gray-900">
                      {resultado.partido}
                    </div>
                    
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span>Votos Totais:</span>
                        <span className="font-medium">{resultado.votosTotal.toLocaleString('pt-BR')}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span>Vagas Diretas:</span>
                        <span className="font-medium">{resultado.vagasDiretas}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span>Projeção:</span>
                        <span className="font-medium">{resultado.projecaoEleitos}</span>
                      </div>
                      
                      <div className="border-t pt-1 mt-2">
                        <div className="flex justify-between">
                          <span>Quociente Partidário:</span>
                          <span className="font-bold text-gray-700">
                            {resultado.quocientePartidario.toLocaleString('pt-BR', { 
                              minimumFractionDigits: 2, 
                              maximumFractionDigits: 2 
                            })}
                          </span>
                        </div>
                        
                        <div className="text-xs text-gray-500 mt-1 whitespace-nowrap">
                          {resultado.votosTotal.toLocaleString('pt-BR')} ÷ ({resultado.vagasDiretas} + 1) = {resultado.quocientePartidario.toLocaleString('pt-BR', { 
                            minimumFractionDigits: 2, 
                            maximumFractionDigits: 2 
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ));
              })()}
            </div>
            
            {/* Seção de distribuição completa das 8 vagas */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-base font-semibold mb-3 text-gray-900">
                🎯 Distribuição Completa das 8 Vagas - Método D'Hondt
              </div>
              
              {/* Explicação do Método D'Hondt */}
              <div className="mb-4 p-3 bg-gray-100 rounded border border-gray-300">
                <div className="text-sm font-semibold text-gray-900 mb-2">📚 Como funciona o Método D'Hondt:</div>
                <div className="text-xs text-gray-700 space-y-1">
                  <div>1️⃣ <strong>Vagas Diretas:</strong> Cada partido ganha vagas baseado na parte inteira da divisão (Votos ÷ QE)</div>
                  <div>2️⃣ <strong>Vagas por Sobras:</strong> Para cada vaga restante, calcula-se o Quociente Partidário = Votos ÷ (Vagas Obtidas + 1)</div>
                  <div>3️⃣ <strong>Ganhador:</strong> O partido com maior Quociente Partidário ganha a vaga</div>
                  <div>4️⃣ <strong>Recálculo:</strong> Após cada vaga ganha, todos os quocientes partidários são recalculados</div>
                  <div>5️⃣ <strong>Repetição:</strong> O processo se repete até distribuir todas as vagas</div>
                </div>
              </div>
              
              {(() => {
                const simulacao = simularDistribuicaoCompleta();
                
                return (
                  <div className="space-y-4">
                    {/* Resumo das vagas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white p-3 rounded border">
                        <div className="text-sm font-semibold text-gray-900 mb-2">📊 Resumo das Vagas</div>
                        <div className="text-xs space-y-1">
                          <div className="flex justify-between">
                            <span>Vagas Diretas:</span>
                            <span className="font-medium">{simulacao.vagasDistribuidas}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Vagas por Sobras:</span>
                            <span className="font-medium">{simulacao.vagasRestantes}</span>
                          </div>
                          <div className="flex justify-between font-bold">
                            <span>Total de Vagas:</span>
                            <span>{simulacao.totalVagas}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white p-3 rounded border">
                        <div className="text-sm font-semibold text-gray-900 mb-2">🏆 Vagas por Partido</div>
                        <div className="text-xs space-y-1">
                          {simulacao.partidosComVagas.map(partido => (
                            <div key={partido.partido} className="flex justify-between">
                              <span>{partido.partido}:</span>
                              <span className="font-medium">{partido.vagasObtidas} vaga{partido.vagasObtidas !== 1 ? 's' : ''}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Histórico das sobras */}
                    <div className="bg-white p-3 rounded border">
                      <div className="text-sm font-semibold text-gray-900 mb-2">📋 Histórico das Sobras - Método D'Hondt</div>
                      <div className="text-xs space-y-3">
                        {simulacao.historicoSobras.map((sobra, index) => {
                          // Calcular os quocientes partidários para esta rodada
                          const quocientesRodada = simulacao.partidosComVagas
                            .filter(p => p.vagasObtidas > 0 || index === 0) // Mostrar apenas partidos com vagas ou na primeira rodada
                            .map(p => {
                              // Calcular quantas vagas o partido tinha ANTES desta rodada
                              let vagasAntes: number;
                              if (index === 0) {
                                // Primeira rodada: usar vagas diretas
                                vagasAntes = p.vagasDiretas;
                              } else {
                                // Rodadas subsequentes: calcular vagas antes desta rodada
                                // Precisamos rastrear as vagas que cada partido ganhou até esta rodada
                                let vagasGanhasAteAgora = 0;
                                for (let j = 0; j < index; j++) {
                                  if (simulacao.historicoSobras[j].partido === p.partido) {
                                    vagasGanhasAteAgora++;
                                  }
                                }
                                vagasAntes = p.vagasDiretas + vagasGanhasAteAgora;
                              }
                              
                              return {
                                partido: p.partido,
                                votos: p.votosTotal,
                                vagasAntes: vagasAntes,
                                quocientePartidario: p.votosTotal / (vagasAntes + 1)
                              };
                            })
                            .sort((a, b) => b.quocientePartidario - a.quocientePartidario);

                          return (
                            <div key={index} className="border rounded-lg p-3 bg-gray-50">
                              {/* Cabeçalho da rodada */}
                              <div className="flex items-center gap-3 mb-2 p-2 bg-white rounded">
                                <span className="font-bold text-gray-700">🎯 Rodada {sobra.rodada}</span>
                                <span className="text-gray-600">→</span>
                                <span className="font-medium bg-gray-100 px-2 py-1 rounded">{sobra.partido}</span>
                                <span className="text-gray-600">ganha a</span>
                                <span className="font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded">Vaga #{sobra.vaga}</span>
                              </div>

                              {/* Explicação do cálculo */}
                              <div className="mb-2 p-2 bg-white rounded">
                                <div className="font-semibold text-gray-800 mb-1">📊 Cálculo dos Quocientes Partidários:</div>
                                <div className="space-y-1">
                                  {quocientesRodada.map((q, qIndex) => (
                                    <div key={q.partido} className={`flex justify-between items-center p-1 rounded ${
                                      q.partido === sobra.partido ? 'bg-gray-100' : 'bg-gray-50'
                                    }`}>
                                      <span className="font-medium">{q.partido}:</span>
                                      <span className="text-xs text-gray-600">
                                        {q.votos.toLocaleString('pt-BR')} ÷ ({q.vagasAntes} + 1) = 
                                      </span>
                                      <span className={`font-bold ${
                                        q.partido === sobra.partido ? 'text-gray-700' : 'text-gray-700'
                                      }`}>
                                        {q.quocientePartidario.toLocaleString('pt-BR', { 
                                          minimumFractionDigits: 2, 
                                          maximumFractionDigits: 2 
                                        })}
                                      </span>
                                      {q.partido === sobra.partido && (
                                        <span className="text-gray-600 font-bold ml-2">🏆 MAIOR</span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Resultado da rodada */}
                              <div className="p-2 bg-gray-100 rounded">
                                <div className="font-semibold text-gray-800">
                                  ✅ Resultado: {sobra.partido} ganha a Vaga #{sobra.vaga} com quociente partidário de{' '}
                                  {sobra.quocientePartidario.toLocaleString('pt-BR', { 
                                    minimumFractionDigits: 2, 
                                    maximumFractionDigits: 2 
                                  })}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Seção dos candidatos eleitos */}
                    <div className="bg-white p-4 rounded border">
                      <div className="text-sm font-semibold text-gray-900 mb-3">🏆 Candidatos Eleitos</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {(() => {
                          try {
                            const candidatosEleitos = calcularCandidatosEleitos();
                            
                            if (!candidatosEleitos || candidatosEleitos.length === 0) {
                              return (
                                <div className="col-span-full text-center text-gray-500 py-4">
                                  Nenhum candidato eleito encontrado
                                </div>
                              );
                            }
                            
                            const candidatosPorPartido = candidatosEleitos.reduce((acc, candidato) => {
                              if (candidato && candidato.partido) {
                                if (!acc[candidato.partido]) {
                                  acc[candidato.partido] = [];
                                }
                                acc[candidato.partido].push(candidato);
                              }
                              return acc;
                            }, {} as { [partido: string]: typeof candidatosEleitos });

                            return Object.entries(candidatosPorPartido).map(([partido, candidatos]) => (
                              <div key={partido} className="border rounded-lg p-3">
                                <div className={`font-semibold text-sm mb-2 text-center ${coresPartidos[partido as keyof typeof coresPartidos]?.cor || 'bg-gray-200'} ${coresPartidos[partido as keyof typeof coresPartidos]?.corTexto || 'text-gray-800'}`}>{partido}</div>
                                <div className="space-y-2">
                                  {candidatos.map((candidato, index) => (
                                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                                      <div className="flex items-center gap-2">
                                        <span className="font-bold text-blue-600">#{candidato.posicao}</span>
                                        <span className="font-medium">{candidato.nome}</span>
                                      </div>
                                      <div className="text-right">
                                        <div className="font-semibold">
                                          {candidato.votos.toLocaleString('pt-BR')}
                                        </div>
                                        <div className={`text-xs ${candidato.tipoEleicao === 'direta' ? 'text-green-600' : 'text-orange-600'}`}>{candidato.tipoEleicao === 'direta' ? 'Direta' : 'Sobra'}</div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ));
                          } catch (error) {
                            console.error('Erro ao exibir candidatos eleitos:', error);
                            return (
                              <div className="col-span-full text-center text-red-500 py-4">
                                Erro ao carregar candidatos eleitos
                              </div>
                            );
                          }
                        })()}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}