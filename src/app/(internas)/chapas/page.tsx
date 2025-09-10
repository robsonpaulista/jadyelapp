"use client";

import React, { useEffect, useState, useRef } from "react";
import { Trash2, Plus, Pencil, RefreshCw, Check, Printer, Info, Eye, EyeOff } from "lucide-react";
import generatePDF from 'react-to-pdf';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { carregarQuocienteEleitoral, salvarQuocienteEleitoral, CenarioCompleto, PartidoCenario, obterCenarioAtivo, atualizarCenario, carregarCenario, criarCenarioBase, dadosIniciais } from "@/services/chapasService";
import { limparEstadosTravados, verificarOperacoesPendentes, setQuotaStatusCallback, getQuotaStatus } from "@/lib/firebase-utils";
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
  "PSD/MDB": { cor: "bg-yellow-400", corTexto: "text-gray-900" },
  "PP": { cor: "bg-sky-400", corTexto: "text-white" },
  "REPUBLICANOS": { cor: "bg-blue-900", corTexto: "text-white" },
  "PODEMOS": { cor: "bg-green-600", corTexto: "text-white" }
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
    case "PODEMOS":
      return ['MULHER 1', 'MULHER 2'];
    default:
      return [];
  }
};

export default function ChapasPage() {
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
  const [dadosCarregados, setDadosCarregados] = useState(false); // Estado para controlar carregamento inicial
  const [numVagas, setNumVagas] = useState(8); // Novo estado para número de vagas
  const [openAnaliseRepublicanos, setOpenAnaliseRepublicanos] = useState(false);
  const [mostrarDetalhesSobras, setMostrarDetalhesSobras] = useState(false);
  const [limpandoEstados, setLimpandoEstados] = useState(false);
  const [quotaStatus, setQuotaStatus] = useState(getQuotaStatus());
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null);
  const [tipoErro, setTipoErro] = useState<'quota' | 'conexao' | 'dados' | 'timeout' | null>(null);
  
  // Estado para gerenciar partidos ocultos
  const [partidosOcultos, setPartidosOcultos] = useState<{ [partidoNome: string]: boolean }>({});

  const mostrarNotificacaoAutoSave = (mensagem: string) => {
    setNotificacaoAutoSave(mensagem);
    setTimeout(() => setNotificacaoAutoSave(null), 3000);
  };

  // Função para limpar estados travados (botão de emergência)
  const handleLimparEstadosTravados = async () => {
    setLimpandoEstados(true);
    try {
      await limparEstadosTravados();
      mostrarNotificacaoAutoSave('Estados travados limpos com sucesso!');
      
      // Recarregar dados após limpeza
      await carregarDadosFirestore();
    } catch (error) {
      console.error('Erro ao limpar estados travados:', error);
      alert('Erro ao limpar estados travados. Tente novamente.');
    } finally {
      setLimpandoEstados(false);
    }
  };

  // Função para alternar visibilidade de partido
  const togglePartidoVisibilidade = (partidoNome: string) => {
    setPartidosOcultos(prev => ({
      ...prev,
      [partidoNome]: !prev[partidoNome]
    }));
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
      await atualizarCenario(cenarioAtivo.id, partidosConvertidos, cenarioAtivo.quocienteEleitoral);

      mostrarNotificacaoAutoSave(`Votos de legenda do ${partido.nome} salvos`);
    } catch (error) {
      console.error('Erro ao salvar votos de legenda:', error);
      alert('Erro ao salvar votos de legenda. Tente novamente.');
    }
  };



  // Função para carregar dados do cenário base (fonte única de verdade)
  const carregarDadosFirestore = async () => {
    try {
      setErroCarregamento(null);
      setTipoErro(null);
      
      // Tentar carregar do cenário base
      const cenarioBase = await carregarCenario('base');
      if (cenarioBase) {
        setCenarioAtivo(cenarioBase);
        const partidosOrdenados = ordenarPartidos(cenarioBase.partidos);
        setPartidos(partidosOrdenados);
        if (!quocienteCarregado) {
          setQuociente(cenarioBase.quocienteEleitoral);
          setQuocienteCarregado(true);
        }
        const votosLegendaTemp: { [partido: string]: number } = {};
        cenarioBase.partidos.forEach(partido => {
          if (partido.votosLegenda) {
            votosLegendaTemp[partido.nome] = partido.votosLegenda;
          }
        });
        setVotosLegenda(votosLegendaTemp);
        mostrarNotificacaoAutoSave('Dados carregados com sucesso');
      } else {
        setTipoErro('dados');
        setErroCarregamento('Cenário base não encontrado no banco de dados');
        console.warn('Cenário base não encontrado no Firestore. Nenhuma ação será tomada.');
      }
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      
      // Detectar tipo de erro
      if (error.code === 'resource-exhausted' || error.message?.includes('Quota exceeded')) {
        setTipoErro('quota');
        setErroCarregamento('Quota do Firebase excedida - aguarde 1-2 horas para reset automático');
      } else if (error.code === 'unavailable' || error.message?.includes('network')) {
        setTipoErro('conexao');
        setErroCarregamento('Problema de conexão com o Firebase - verifique sua internet');
      } else if (error.message?.includes('timeout') || error.message?.includes('deadline')) {
        setTipoErro('timeout');
        setErroCarregamento('Timeout na conexão - o servidor está demorando para responder');
      } else {
        setTipoErro('dados');
        setErroCarregamento('Erro ao carregar dados do banco - tente novamente');
      }
      
      alert('Erro ao carregar dados. Tente novamente.');
    }
  };







  // Monitorar status da quota do Firebase
  useEffect(() => {
    setQuotaStatusCallback((status) => {
      setQuotaStatus(status);
      if (status.isExceeded) {
        setTipoErro('quota');
        setErroCarregamento(`Quota do Firebase excedida! Tentativa ${status.retryCount}/3`);
        mostrarNotificacaoAutoSave(`⚠️ Quota do Firebase excedida! Tentativa ${status.retryCount}/3`);
      } else {
        // Reset erro quando quota volta ao normal
        if (tipoErro === 'quota') {
          setTipoErro(null);
          setErroCarregamento(null);
        }
      }
    });
  }, [tipoErro]);

  // Carregar dados do Firestore ao abrir a página
  useEffect(() => {
    if (dadosCarregados) return; // Evitar carregamento múltiplo
    
    async function carregarDadosIniciais() {
      try {
        setDadosCarregados(true); // Marcar como carregando para evitar loops
        
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
            
            // Carregar votos de legenda do cenário ativo
            const votosLegendaTemp: { [partido: string]: number } = {};
            cenarioAtivo.partidos.forEach(partido => {
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
        setDadosCarregados(false); // Permitir nova tentativa em caso de erro
      }
    }
    
    carregarDadosIniciais();
  }, [dadosCarregados]);

  // Funções auxiliares para definir cores dos partidos
  function getPartidoCor(partido: string): string {
    const cores: { [key: string]: string } = {
      "PT": "bg-red-600",
      "PSD/MDB": "bg-yellow-400",
      "PP": "bg-sky-400",
      "REPUBLICANOS": "bg-blue-900",
      "PODEMOS": "bg-purple-600"
    };
    return cores[partido] || "bg-gray-200";
  }

  function getPartidoCorTexto(partido: string): string {
    const cores: { [key: string]: string } = {
      "PT": "text-white",
      "PSD/MDB": "text-gray-900",
      "PP": "text-white",
      "REPUBLICANOS": "text-white",
      "PODEMOS": "text-white"
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
        await atualizarCenario(cenarioAtivo.id, partidosConvertidos, cenarioAtivo.quocienteEleitoral);


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
      await atualizarCenario(cenarioAtivo.id, partidosConvertidos, cenarioAtivo.quocienteEleitoral);
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
    return partidos.filter(partido => 
      partidoAtingiuMinimo(partido.nome) && !partidosOcultos[partido.nome]
    );
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
    // Filtrar apenas partidos que atingiram o mínimo de 80% do quociente e estão visíveis
    const partidosElegiveis = getPartidosElegiveisSobras();
    
    const resultados = partidos
      .filter(partido => !partidosOcultos[partido.nome])
      .map(partido => {
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

  const separarCandidatosPSDMDB = (candidatos: { nome: string; votos: number; genero?: string }[]) => {
    return separarCandidatosPorGenero(candidatos);
  };

  const separarCandidatosPP = (candidatos: { nome: string; votos: number; genero?: string }[]) => {
    return separarCandidatosPorGenero(candidatos);
  };

  const separarCandidatosRepublicanos = (candidatos: { nome: string; votos: number; genero?: string }[]) => {
    return separarCandidatosPorGenero(candidatos);
  };

  const separarCandidatosPodemos = (candidatos: { nome: string; votos: number; genero?: string }[]) => {
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
      projecao: (votosTotal / quociente).toFixed(2)
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
      await atualizarCenario(cenarioAtivo.id, partidosConvertidos, cenarioAtivo.quocienteEleitoral);
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
      await atualizarCenario(cenarioAtivo.id, partidosConvertidos, cenarioAtivo.quocienteEleitoral);

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

  };

  // Carregar cenário ao clicar no card
  const handleCenarioClick = async (cenarioId: string) => {
    if (carregandoCenario) return; // Evitar múltiplos cliques
    
    setCarregandoCenario(true);
    try {
      // Carregar o novo cenário diretamente (sem salvar automaticamente)
      const novoCenario = await carregarCenario(cenarioId);
      if (novoCenario) {
        handleCenarioChange(novoCenario);
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
      } else {
        console.error('Erro: não foi possível carregar o cenário base');
      }
    });
  };

  // Função removida - não há criação automática de cenários
  // O sistema apenas carrega dados do Firestore

  // Função para ordenar partidos na ordem fixa
  const ordenarPartidos = <T extends { nome: string }>(partidosParaOrdenar: T[]): T[] => {
    const ordemPartidos = ["PT", "PSD/MDB", "PP", "REPUBLICANOS", "PODEMOS"];
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
        mostrarNotificacaoAutoSave(`Mudanças salvas no cenário "${cenarioAtivo.nome}" com QE: ${quociente.toLocaleString('pt-BR')}`);
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

  // Análise específica do REPUBLICANOS
  type AnaliseRepublicanos = {
    votos: number;
    quociente: number;
    minimo80: number;
    atingiuMinimo: boolean;
    vagasDiretas: number;
    vagasTotaisPrevistas: number;
    ganhaPorSobras: boolean;
    rodadaSobra?: number;
    rankSobra?: number;
    vagasSobra: number;
    faltamPara80: number;
    faltamPara1QE: number;
    faltamParaPrimeiraSobra?: number;
    conclusao: string;
  };

  const gerarAnaliseRepublicanos = (): AnaliseRepublicanos => {
    const partidoNome = "REPUBLICANOS";
    const partido = partidos.find(p => p.nome === partidoNome);
    const votos = partido ? getVotosProjetados(partido.candidatos, partido.nome) : 0;
    const minimo80 = getQuocienteMinimo();
    const atingiuMinimo = votos >= minimo80;
    const vagasDiretas = calcularVagasDiretas(votos);

    // Simulação completa
    const simulacao = simularDistribuicaoCompleta();
    const infoPartidoSim = simulacao.partidosComVagas.find(p => p.partido === partidoNome);
    const vagasTotaisPrevistas = infoPartidoSim?.vagasObtidas || 0;
    const vagasSobra = simulacao.vagasRestantes;
    const ganhaPorSobrasIndex = simulacao.historicoSobras.findIndex(s => s.partido === partidoNome);
    const ganhaPorSobras = ganhaPorSobrasIndex !== -1;

    // Ranking para a primeira sobra (quociente partidário)
    const { ordenadosPorSobras } = calcularSobras();
    const rankSobra = ordenadosPorSobras.findIndex(r => r.partido === partidoNome) + 1 || undefined;

    // Votos que faltam para atingir 80% e para alcançar 1 QE
    const faltamPara80 = Math.max(0, Math.ceil(minimo80 - votos));
    const faltamPara1QE = Math.max(0, Math.ceil(quociente - votos));

    // Votos para ganhar a primeira sobra (superar o maior quociente partidário da primeira rodada)
    let faltamParaPrimeiraSobra: number | undefined = undefined;
    if (atingiuMinimo && vagasSobra > 0) {
      const qRodada1: Array<{ partido: string; q: number }> = simulacao.partidosComVagas.map(p => ({
        partido: p.partido,
        q: p.votosTotal / (p.vagasDiretas + 1)
      }));
      const maiorQ = Math.max(...qRodada1.map(item => item.q));
      const qRepublicanos = votos / (vagasDiretas + 1);
      if (qRepublicanos <= maiorQ) {
        const necessario = Math.floor(maiorQ * (vagasDiretas + 1) - votos) + 1;
        faltamParaPrimeiraSobra = Math.max(0, necessario);
      } else {
        faltamParaPrimeiraSobra = 0;
      }
    }

    const conclusao = vagasTotaisPrevistas > 0
      ? `Com os números atuais, o ${partidoNome} elege ${vagasTotaisPrevistas} candidato(s).`
      : `Com os números atuais, o ${partidoNome} não elege ninguém.`;

    return {
      votos,
      quociente,
      minimo80,
      atingiuMinimo,
      vagasDiretas,
      vagasTotaisPrevistas,
      ganhaPorSobras,
      rodadaSobra: ganhaPorSobras ? (ganhaPorSobrasIndex + 1) : undefined,
      rankSobra,
      vagasSobra,
      faltamPara80,
      faltamPara1QE,
      faltamParaPrimeiraSobra,
      conclusao
    };
  };

  // Sensibilidade: em quais cenários perdemos vaga de sobra e por quanto
  type RiscoSobra = {
    rodada: number;
    vaga: number;
    adversario: string;
    deltaAdversario: number; // votos a mais para nos ultrapassar na rodada
    podemosPerder: number;   // votos que podemos perder e manter a vaga
    qRepublicanos: number;
    qAdversario: number;
  };

  const analisarRiscosRepublicanos = (): { porRodada: RiscoSobra[]; resumoAdversarios: { adversario: string; menorDelta: number }[]; minimoParaPerderUma: number | null; minimoParaPerderTodas: number | null } => {
    const simulacao = simularDistribuicaoCompleta();
    const partidoNome = 'REPUBLICANOS';
    const republicanosInfo = simulacao.partidosComVagas.find(p => p.partido === partidoNome);
    const votosRepublicanos = republicanosInfo?.votosTotal || 0;
    const vagasDiretasRepublicanos = republicanosInfo?.vagasDiretas || 0;

    const porRodada: RiscoSobra[] = [];

    simulacao.historicoSobras.forEach((sobra, index) => {
      if (sobra.partido !== partidoNome) return;

      // Vagas antes da rodada para cada partido
      const vagasAntesPorPartido: Record<string, number> = {};
      simulacao.partidosComVagas.forEach(p => {
        let ganhosAteAgora = 0;
        for (let j = 0; j < index; j++) {
          if (simulacao.historicoSobras[j].partido === p.partido) ganhosAteAgora++;
        }
        vagasAntesPorPartido[p.partido] = p.vagasDiretas + ganhosAteAgora;
      });

      // Quociente do REPUBLICANOS nesta rodada
      const vagasAntesRep = vagasAntesPorPartido[partidoNome] || vagasDiretasRepublicanos;
      const qRep = votosRepublicanos / (vagasAntesRep + 1);

      // Encontrar adversário mais próximo (maior quociente entre os outros)
      let melhorAdversario: { partido: string; q: number; vagasAntes: number } | null = null;
      simulacao.partidosComVagas.forEach(p => {
        if (p.partido === partidoNome) return;
        const q = p.votosTotal / ((vagasAntesPorPartido[p.partido] || p.vagasDiretas) + 1);
        if (!melhorAdversario || q > melhorAdversario.q) {
          melhorAdversario = { partido: p.partido, q, vagasAntes: (vagasAntesPorPartido[p.partido] || p.vagasDiretas) };
        }
      });

      if (melhorAdversario !== null) {
        const adv: { partido: string; q: number; vagasAntes: number } = melhorAdversario;
        const deltaAdversario = Math.max(0, Math.floor((qRep - adv.q) * (adv.vagasAntes + 1)) + 1);
        const podemosPerder = Math.max(0, Math.floor((qRep - adv.q) * (vagasAntesRep + 1)));
        porRodada.push({
          rodada: index + 1,
          vaga: sobra.vaga,
          adversario: adv.partido,
          deltaAdversario,
          podemosPerder,
          qRepublicanos: qRep,
          qAdversario: adv.q,
        });
      }
    });

    // Resumo: menor delta por adversário
    const mapa: Record<string, number> = {};
    porRodada.forEach(r => {
      if (!(r.adversario in mapa)) mapa[r.adversario] = r.deltaAdversario;
      else mapa[r.adversario] = Math.min(mapa[r.adversario], r.deltaAdversario);
    });
    const resumoAdversarios = Object.entries(mapa)
      .map(([adversario, menorDelta]) => ({ adversario, menorDelta }))
      .sort((a, b) => a.menorDelta - b.menorDelta);

    // Risco agregado: perder pelo menos 1 vaga (sobra)
    const deltasOrdenados = [...porRodada.map(r => r.deltaAdversario)].sort((a, b) => a - b);
    const minimoParaPerderUma = deltasOrdenados.length > 0 ? deltasOrdenados[0] : null;
    // Para perder todas as vagas de sobra, precisamos superar cada rodada; aproximação: soma dos menores deltas
    const minimoParaPerderTodas = deltasOrdenados.length > 0 ? deltasOrdenados.reduce((acc, v) => acc + v, 0) : null;

    return { porRodada, resumoAdversarios, minimoParaPerderUma, minimoParaPerderTodas };
  };

  // Detalhamento por rodada: deltas por adversário para cada rodada em que ganhamos sobra
  type RoundDetail = {
    rodada: number;
    vaga: number;
    qRep: number;
    porAdversario: Array<{ partido: string; delta: number; qAtual: number }>; // ordenado por delta
  };

  const detalharSobrasRepublicanos = (): { rodadas: RoundDetail[]; resumoAdversarioCompleto: Array<{ adversario: string; deltaMinimoUma: number; deltaMinimoTodas: number; primeiraRodada?: number }> } => {
    const simulacao = simularDistribuicaoCompleta();
    const partidoNome = 'REPUBLICANOS';
    const republicanosInfo = simulacao.partidosComVagas.find(p => p.partido === partidoNome);
    const votosRepublicanos = republicanosInfo?.votosTotal || 0;

    const rodadas: RoundDetail[] = [];

    simulacao.historicoSobras.forEach((sobra, index) => {
      if (sobra.partido !== partidoNome) return;

      // Vagas antes da rodada para cada partido
      const vagasAntesPorPartido: Record<string, number> = {};
      simulacao.partidosComVagas.forEach(p => {
        let ganhosAteAgora = 0;
        for (let j = 0; j < index; j++) {
          if (simulacao.historicoSobras[j].partido === p.partido) ganhosAteAgora++;
        }
        vagasAntesPorPartido[p.partido] = p.vagasDiretas + ganhosAteAgora;
      });

      const vagasAntesRep = vagasAntesPorPartido[partidoNome] || (republicanosInfo?.vagasDiretas || 0);
      const qRep = votosRepublicanos / (vagasAntesRep + 1);

      // Calcular delta por adversário
      const porAdversario: Array<{ partido: string; delta: number; qAtual: number }> = [];
      simulacao.partidosComVagas.forEach(p => {
        if (p.partido === partidoNome) return;
        const vagasAntes = vagasAntesPorPartido[p.partido] || p.vagasDiretas;
        const qAtual = p.votosTotal / (vagasAntes + 1);
        const delta = Math.max(0, Math.floor(qRep * (vagasAntes + 1) - p.votosTotal) + 1);
        porAdversario.push({ partido: p.partido, delta, qAtual });
      });

      porAdversario.sort((a, b) => a.delta - b.delta);
      rodadas.push({ rodada: index + 1, vaga: sobra.vaga, qRep, porAdversario });
    });

    // Resumo completo por adversário: mínimo para 1 vaga e estimativa incremental para tirar todas as nossas sobras
    const adversarios = new Set<string>();
    rodadas.forEach(r => r.porAdversario.forEach(x => adversarios.add(x.partido)));

    const resumoAdversarioCompleto: Array<{ adversario: string; deltaMinimoUma: number; deltaMinimoTodas: number; primeiraRodada?: number }> = [];

    adversarios.forEach(adversario => {
      // Mínimo para 1 vaga e a primeira rodada correspondente
      let deltaMinimoUma = Infinity;
      let primeiraRodada: number | undefined = undefined;
      rodadas.forEach(r => {
        const item = r.porAdversario.find(x => x.partido === adversario);
        if (item && item.delta < deltaMinimoUma) {
          deltaMinimoUma = item.delta;
          primeiraRodada = r.rodada;
        }
      });
      if (deltaMinimoUma === Infinity) deltaMinimoUma = 0;

      // Estimativa incremental para tirar todas as sobras do REPUBLICANOS
      let votosAdv = (simulacao.partidosComVagas.find(p => p.partido === adversario)?.votosTotal) || 0;
      let vagasDiretasAdv = (simulacao.partidosComVagas.find(p => p.partido === adversario)?.vagasDiretas) || 0;
      let totalDelta = 0;

      rodadas.forEach(r => {
        // denominador do adversário após eventuais vitórias anteriores nesta simulação incremental
        const qNecessario = r.qRep;
        const deltaRodada = Math.max(0, Math.floor(qNecessario * (vagasDiretasAdv + 1) - votosAdv) + 1);
        totalDelta += deltaRodada;
        // Atualiza votos e denom como se ele ganhasse esta rodada
        votosAdv += deltaRodada;
        vagasDiretasAdv += 1;
      });

      resumoAdversarioCompleto.push({ adversario, deltaMinimoUma, deltaMinimoTodas: totalDelta, primeiraRodada });
    });

    resumoAdversarioCompleto.sort((a, b) => a.deltaMinimoUma - b.deltaMinimoUma);

    return { rodadas, resumoAdversarioCompleto };
  };

  // Cenário greedy: ajustar votos de adversários ao longo das rodadas para tirar TODAS as sobras do REPUBLICANOS com o menor acréscimo somado possível
  const cenarioGreedyTirarTodasSobras = (): { etapas: Array<{ rodada: number; adversario?: string; delta?: number; vencedor: string }>; totalDelta: number; vagasDiretasRep: number; vagasFinaisRep: number } => {
    const partidoNome = 'REPUBLICANOS';
    const QE = quociente;
    const minimo80 = QE * 0.8;

    // Estado inicial para TODOS os partidos (elegibilidade dinâmica)
    const estado = partidos.map(p => {
      const votos = getVotosProjetados(p.candidatos, p.nome);
      const vagasDiretas = Math.floor(votos / QE);
      return {
        partido: p.nome,
        votos,
        obtidas: vagasDiretas,
        diretas: vagasDiretas,
        elegivel: votos >= minimo80,
      };
    });

    const idxRep = estado.findIndex(e => e.partido === partidoNome);
    const vagasTotais = numVagas;
    const vagasDistribuidas = estado.reduce((sum, e) => sum + e.diretas, 0);
    const vagasRestantes = Math.max(0, vagasTotais - vagasDistribuidas);

    const etapas: Array<{ rodada: number; adversario?: string; delta?: number; vencedor: string }>= [];
    let totalDelta = 0;

    for (let rodada = 1; rodada <= vagasRestantes; rodada++) {
      // Descobrir quem ganharia agora, com o estado ajustado até aqui
      const quocientes = estado
        .filter(e => e.elegivel)
        .map(e => ({ partido: e.partido, q: e.votos / (e.obtidas + 1) }))
        .sort((a,b) => b.q - a.q);

      const vencedorAtual = quocientes[0]?.partido;

      if (!vencedorAtual) {
        etapas.push({ rodada, vencedor: '—' });
        continue;
      }

      if (vencedorAtual !== partidoNome) {
        // Não precisamos mexer: já não seria nossa
        const e = estado.find(x => x.partido === vencedorAtual)!;
        e.obtidas += 1;
        etapas.push({ rodada, vencedor: vencedorAtual });
        continue;
      }

      // REP ganharia — precisamos encontrar o adversário com menor delta para superá-lo
      const eRep = estado[idxRep];
      const qRep = eRep.votos / (eRep.obtidas + 1);

      let melhor: { adversario: string; delta: number } | null = null;
      estado.forEach(e => {
        if (e.partido === partidoNome) return;
        const denom = e.obtidas + 1;
        const precisaEleg = Math.max(0, Math.ceil(minimo80 - e.votos));
        const precisaQ = Math.max(0, Math.floor(qRep * denom - e.votos) + 1);
        const delta = Math.max(precisaEleg, precisaQ);
        if (!melhor || delta < melhor.delta) melhor = { adversario: e.partido, delta };
      });

      if (melhor) {
        const m: { adversario: string; delta: number } = melhor;
        const alvo = estado.find(x => x.partido === m.adversario)!;
        alvo.votos += m.delta;
        alvo.elegivel = alvo.votos >= minimo80;
        alvo.obtidas += 1;
        totalDelta += m.delta;
        etapas.push({ rodada, adversario: alvo.partido, delta: m.delta, vencedor: alvo.partido });
      } else {
        // fallback de segurança
        etapas.push({ rodada, vencedor: vencedorAtual });
      }
    }

    const vagasDiretasRep = estado[idxRep]?.diretas || 0;
    const vagasFinaisRep = estado[idxRep]?.obtidas || 0;
    return { etapas, totalDelta, vagasDiretasRep, vagasFinaisRep };
  };

  // Queda dos nossos votos: identificar pontos de inflexão onde perdemos cada vaga (direta e por sobra)
  type PontoInflexao = {
    tipo: 'direta' | 'sobra';
    indice: number; // para direta: número da vaga direta (1..k); para sobra: rodada
    perderVotos: number; // votos que precisamos perder para perder essa vaga
    votosAposPerda: number; // nosso total após a perda
    label: string; // exibição amigável
  };

  const analisarQuedaRepublicanos = (): { pontos: PontoInflexao[]; proximoPonto?: PontoInflexao } => {
    const partidoNome = 'REPUBLICANOS';
    const partido = partidos.find(p => p.nome === partidoNome);
    const votosAtuais = partido ? getVotosProjetados(partido.candidatos, partido.nome) : 0;
    const vagasDiretasAtuais = calcularVagasDiretas(votosAtuais);

    const pontos: PontoInflexao[] = [];

    // Diretas: limites k*QE
    for (let k = vagasDiretasAtuais; k >= 1; k--) {
      const limite = k * quociente; // cair abaixo disso perde a k-ésima vaga direta
      const perderVotos = Math.max(0, Math.floor(votosAtuais - limite) + 1);
      pontos.push({
        tipo: 'direta',
        indice: k,
        perderVotos,
        votosAposPerda: Math.max(0, votosAtuais - perderVotos),
        label: `Direta #${k}`,
      });
    }

    // Sobras: usar podemosPerder + 1 por rodada que ganhamos
    const riscos = analisarRiscosRepublicanos();
    riscos.porRodada.forEach(r => {
      const perderVotos = (r.podemosPerder || 0) + 1;
      pontos.push({
        tipo: 'sobra',
        indice: r.rodada,
        perderVotos,
        votosAposPerda: Math.max(0, votosAtuais - perderVotos),
        label: `Sobra (rodada ${r.rodada})`,
      });
    });

    // Ordenar pelos menores perdas necessárias (próximo ponto primeiro)
    pontos.sort((a, b) => a.perderVotos - b.perderVotos);
    return { pontos, proximoPonto: pontos[0] };
  };

  // Análise simples e direta do REPUBLICANOS
  const analisarRepublicanos = () => {
    const partidoNome = "REPUBLICANOS";
    const partido = partidos.find(p => p.nome === partidoNome);
    const votos = partido ? getVotosProjetados(partido.candidatos, partido.nome) : 0;
    const minimo80 = getQuocienteMinimo();
    const atingiuMinimo = votos >= minimo80;
    const vagasDiretas = calcularVagasDiretas(votos);

    // Simulação atual
    const simulacao = simularDistribuicaoCompleta();
    const infoPartidoSim = simulacao.partidosComVagas.find(p => p.partido === partidoNome);
    const vagasTotaisPrevistas = infoPartidoSim?.vagasObtidas || 0;
    const vagasSobra = vagasTotaisPrevistas - vagasDiretas;

    // Cenário atual
    const cenarios = {
      atual: {
        votos,
        vagasDiretas,
        vagasSobra,
        vagasTotais: vagasTotaisPrevistas,
        elegivel: atingiuMinimo
      }
    };

    // Análise de risco: quanto cada adversário precisa crescer para nos tirar vagas
    const riscos: Array<{
      partido: string;
      votosAtuais: number;
      deltaParaDireta: number;
      deltaParaSobra: number;
      deltaMinimo: number;
      elegivel: boolean;
    }> = [];
    const adversarios = partidos.filter(p => p.nome !== partidoNome);

    adversarios.forEach(adversario => {
      const votosAdv = getVotosProjetados(adversario.candidatos, adversario.nome);
      const vagasDiretasAdv = calcularVagasDiretas(votosAdv);
      const minimo80Adv = getQuocienteMinimo();
      const atingiuMinimoAdv = votosAdv >= minimo80Adv;

      // Para nos tirar uma vaga direta: precisa superar nosso quociente
      const deltaParaDireta = Math.max(0, Math.ceil(quociente - votosAdv));

      // Para nos tirar uma sobra: precisa ter quociente partidário maior
      let deltaParaSobra = Infinity;
      if (atingiuMinimoAdv && vagasSobra > 0) {
        // Simular: quanto o adversário precisa crescer para ter quociente partidário maior que o nosso
        const qRepublicanos = votos / (vagasDiretas + 1);
        const qAdversario = votosAdv / (vagasDiretasAdv + 1);
        if (qAdversario < qRepublicanos) {
          deltaParaSobra = Math.max(0, Math.ceil(qRepublicanos * (vagasDiretasAdv + 1) - votosAdv));
        } else {
          deltaParaSobra = 0; // já tem quociente maior
        }
      }

      riscos.push({
        partido: adversario.nome,
        votosAtuais: votosAdv,
        deltaParaDireta,
        deltaParaSobra,
        deltaMinimo: Math.min(deltaParaDireta, deltaParaSobra),
        elegivel: atingiuMinimoAdv
      });
    });

    // Ordenar por menor delta
    riscos.sort((a, b) => a.deltaMinimo - b.deltaMinimo);

    return {
      cenarios,
      riscos,
      conclusao: vagasTotaisPrevistas > 0 
        ? `REPUBLICANOS elege ${vagasTotaisPrevistas} candidato(s) (${vagasDiretas} diretas + ${vagasSobra} sobras)`
        : `REPUBLICANOS não elege ninguém`
    };
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
      
      {/* Alerta de quota excedida */}
      {quotaStatus.isExceeded && (
        <div className="fixed top-16 right-4 z-50 bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg max-w-sm">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse mt-2"></div>
            <div className="flex-1">
              <div className="font-semibold text-sm">🚨 Quota Firebase Excedida</div>
              <div className="text-xs mt-1 opacity-90">
                O Firebase está temporariamente indisponível devido ao limite de operações.
              </div>
              <div className="text-xs mt-2 opacity-75">
                • Tentativa: {quotaStatus.retryCount}/3<br/>
                • Último erro: {quotaStatus.lastRetryTime?.toLocaleTimeString()}<br/>
                • Aguarde 1-2 horas para reset automático
              </div>
              <div className="mt-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs bg-white/20 border-white/30 text-white hover:bg-white/30"
                  onClick={handleLimparEstadosTravados}
                  disabled={limpandoEstados}
                >
                  {limpandoEstados ? 'Limpando...' : 'Tentar Limpar Estados'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Aviso visual de erro de carregamento */}
      {erroCarregamento && (
        <div className="fixed top-32 right-4 z-50 bg-orange-500 text-white px-4 py-3 rounded-lg shadow-lg max-w-sm">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse mt-2"></div>
            <div className="flex-1">
              <div className="font-semibold text-sm">
                {tipoErro === 'quota' && '🚨 Quota Firebase Excedida'}
                {tipoErro === 'conexao' && '🌐 Problema de Conexão'}
                {tipoErro === 'timeout' && '⏱️ Timeout de Conexão'}
                {tipoErro === 'dados' && '📊 Erro de Dados'}
                {!tipoErro && '⚠️ Erro de Carregamento'}
              </div>
              <div className="text-xs mt-1 opacity-90">
                {erroCarregamento}
              </div>
              <div className="text-xs mt-2 opacity-75">
                {tipoErro === 'quota' && (
                  <>
                    • O Firebase atingiu o limite de operações<br/>
                    • Aguarde 1-2 horas para reset automático<br/>
                    • Use o botão "Limpar Estados Travados"
                  </>
                )}
                {tipoErro === 'conexao' && (
                  <>
                    • Verifique sua conexão com a internet<br/>
                    • Tente recarregar a página<br/>
                    • Verifique se o Firebase está online
                  </>
                )}
                {tipoErro === 'timeout' && (
                  <>
                    • O servidor está demorando para responder<br/>
                    • Tente novamente em alguns minutos<br/>
                    • Verifique se há muitos usuários online
                  </>
                )}
                {tipoErro === 'dados' && (
                  <>
                    • Problema ao acessar dados do banco<br/>
                    • Tente recarregar a página<br/>
                    • Verifique se o cenário base existe
                  </>
                )}
              </div>
              <div className="mt-2 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs bg-white/20 border-white/30 text-white hover:bg-white/30"
                  onClick={() => {
                    setErroCarregamento(null);
                    setTipoErro(null);
                    carregarDadosFirestore();
                  }}
                >
                  🔄 Tentar Novamente
                </Button>
                {tipoErro === 'quota' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs bg-white/20 border-white/30 text-white hover:bg-white/30"
                    onClick={handleLimparEstadosTravados}
                    disabled={limpandoEstados}
                  >
                    {limpandoEstados ? 'Limpando...' : '🧹 Limpar Estados'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div ref={contentRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-4 py-4">
        {/* Banner de aviso de problemas */}
        {(erroCarregamento || quotaStatus.isExceeded) && (
          <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white p-4 rounded-lg shadow-lg">
            <div className="flex items-center gap-3">
              <div className="text-2xl">
                {tipoErro === 'quota' && '🚨'}
                {tipoErro === 'conexao' && '🌐'}
                {tipoErro === 'timeout' && '⏱️'}
                {tipoErro === 'dados' && '📊'}
                {!tipoErro && '⚠️'}
              </div>
              <div className="flex-1">
                <div className="font-bold text-lg">
                  {tipoErro === 'quota' && 'QUOTA DO FIREBASE EXCEDIDA'}
                  {tipoErro === 'conexao' && 'PROBLEMA DE CONEXÃO'}
                  {tipoErro === 'timeout' && 'TIMEOUT DE CONEXÃO'}
                  {tipoErro === 'dados' && 'ERRO DE DADOS'}
                  {!tipoErro && 'ERRO DE CARREGAMENTO'}
                </div>
                <div className="text-sm opacity-90 mt-1">
                  {erroCarregamento || 'Os cenários não estão carregando devido a um problema técnico.'}
                </div>
                <div className="text-xs opacity-75 mt-2">
                  {tipoErro === 'quota' && '• Aguarde 1-2 horas para reset automático • Use o botão "Limpar Estados Travados" • Evite múltiplas operações simultâneas'}
                  {tipoErro === 'conexao' && '• Verifique sua conexão com a internet • Tente recarregar a página • Verifique se o Firebase está online'}
                  {tipoErro === 'timeout' && '• O servidor está demorando para responder • Tente novamente em alguns minutos • Verifique se há muitos usuários online'}
                  {tipoErro === 'dados' && '• Problema ao acessar dados do banco • Tente recarregar a página • Verifique se o cenário base existe'}
                  {!tipoErro && '• Tente recarregar a página • Verifique sua conexão • Entre em contato com o suporte se o problema persistir'}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                  onClick={() => {
                    setErroCarregamento(null);
                    setTipoErro(null);
                    carregarDadosFirestore();
                  }}
                >
                  🔄 Tentar Novamente
                </Button>
                {tipoErro === 'quota' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                    onClick={handleLimparEstadosTravados}
                    disabled={limpandoEstados}
                  >
                    {limpandoEstados ? 'Limpando...' : '🧹 Limpar Estados'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

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
            
            {/* Indicador de status da quota do Firebase */}
            {quotaStatus.isExceeded && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-1 rounded-lg border border-red-200">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="font-medium">Quota Firebase Excedida</span>
                <span className="text-xs text-red-500">
                  (Tentativa {quotaStatus.retryCount}/3)
                </span>
              </div>
            )}

            {/* Indicador de erro de carregamento */}
            {erroCarregamento && (
              <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 px-3 py-1 rounded-lg border border-orange-200">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                <span className="font-medium">
                  {tipoErro === 'quota' && '🚨 Quota Excedida'}
                  {tipoErro === 'conexao' && '🌐 Sem Conexão'}
                  {tipoErro === 'timeout' && '⏱️ Timeout'}
                  {tipoErro === 'dados' && '📊 Erro de Dados'}
                  {!tipoErro && '⚠️ Erro de Carregamento'}
                </span>
                <span className="text-xs text-orange-500">
                  Cenários não carregam
                </span>
              </div>
            )}
          </div>
          
          {/* Botão de emergência para limpar estados travados */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleLimparEstadosTravados}
            disabled={limpandoEstados}
            className="text-orange-600 border-orange-200 hover:bg-orange-50"
          >
            {limpandoEstados ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                Limpando...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Limpar Estados Travados
              </>
            )}
          </Button>
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
                onChange={(e) => setNumVagas(Math.max(1, parseInt(e.target.value) || 8))}
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
                {getPartidosElegiveisSobras().length}/{partidos.filter(p => !partidosOcultos[p.nome]).length}
              </span>
            </div>
          </div>
        </div>

        {/* Grid de partidos */}
        <div className="w-full grid grid-cols-1 md:grid-cols-5 gap-6">
          {ordenarPartidos(partidos)
            .filter(partido => !partidosOcultos[partido.nome])
            .map((partido, pIdx) => {
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
              <div className={`w-full py-1 font-bold text-base mb-2 rounded ${
                atingiuMinimo 
                  ? 'bg-gray-200 text-gray-800' 
                  : 'bg-red-200 text-red-800'
              }`}>
                <div className="flex items-center justify-center relative">
                  <span className="px-6">{partido.nome}</span>
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {/* Botão de ocultar/mostrar */}
                    <button
                      type="button"
                      aria-label={partidosOcultos[partido.nome] ? "Mostrar partido" : "Ocultar partido"}
                      className="text-gray-500 hover:text-gray-700 transition-colors"
                      onClick={() => togglePartidoVisibilidade(partido.nome)}
                      title={partidosOcultos[partido.nome] ? "Mostrar partido" : "Ocultar partido"}
                    >
                      {partidosOcultos[partido.nome] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                    {/* Botão de análise para REPUBLICANOS */}
                    {partido.nome === 'REPUBLICANOS' && (
                      <button
                        type="button"
                        aria-label="Análise do REPUBLICANOS"
                        className="text-gray-700 hover:text-blue-700 transition-colors"
                        onClick={() => setOpenAnaliseRepublicanos(true)}
                      >
                        <Info className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
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
                {(partido.nome === "PT" || partido.nome === "PSD/MDB" || partido.nome === "PP" || partido.nome === "REPUBLICANOS" || partido.nome === "PODEMOS") ? (
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
                            : partido.nome === "REPUBLICANOS"
                            ? separarCandidatosRepublicanos(partido.candidatos)
                            : separarCandidatosPodemos(partido.candidatos);
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
                             : partido.nome === "PSD/MDB"
                             ? separarCandidatosPSDMDB(partido.candidatos)
                             : partido.nome === "PP"
                             ? separarCandidatosPP(partido.candidatos)
                             : partido.nome === "REPUBLICANOS"
                             ? separarCandidatosRepublicanos(partido.candidatos)
                             : separarCandidatosPodemos(partido.candidatos);
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
                    {modoImpressao ? (
                      <span className="text-xs font-medium text-right w-24">
                        {(votosLegenda[partido.nome] || 0).toLocaleString('pt-BR')}
                      </span>
                    ) : (
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
                    )}
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
                      {(partido.nome === "PT" || partido.nome === "PSD/MDB" || partido.nome === "PP" || partido.nome === "REPUBLICANOS" || partido.nome === "PODEMOS") && (
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
            
            <div className="grid grid-cols-5 gap-4">
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

                    {/* Seção de partidos ocultos */}
                    {Object.keys(partidosOcultos).some(partido => partidosOcultos[partido]) && (
                      <div className="bg-yellow-50 p-4 rounded border border-yellow-200 mb-4" style={{ display: modoImpressao ? 'none' : 'block' }}>
                        <div className="text-sm font-semibold text-yellow-800 mb-3 flex items-center gap-2">
                          <EyeOff className="h-4 w-4" />
                          Partidos Ocultos
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {Object.keys(partidosOcultos)
                            .filter(partido => partidosOcultos[partido])
                            .map(partido => (
                              <button
                                key={partido}
                                onClick={() => togglePartidoVisibilidade(partido)}
                                className="flex items-center gap-2 px-3 py-2 bg-yellow-100 hover:bg-yellow-200 border border-yellow-300 rounded-md text-sm font-medium text-yellow-800 transition-colors"
                                title="Clique para mostrar o partido"
                              >
                                <Eye className="h-3 w-3" />
                                {partido}
                              </button>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Seção dos candidatos eleitos */}
                    <div className="bg-white p-4 rounded border">
                      <div className="text-sm font-semibold text-gray-900 mb-3">🏆 Candidatos Eleitos</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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

                            // Usar a função global ordenarPartidos que já inclui o PODEMOS
                            const partidosOrdenados = ordenarPartidos(
                              Object.keys(candidatosPorPartido).map(nomePartido => ({ 
                                nome: nomePartido, 
                                candidatos: candidatosPorPartido[nomePartido] || [] 
                              }))
                            ).filter(item => item.candidatos.length > 0);

                            return partidosOrdenados.map(({ nome: partido, candidatos }) => (
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

      {/* Diálogo de Análise - REPUBLICANOS */}
      <Dialog open={openAnaliseRepublicanos} onOpenChange={setOpenAnaliseRepublicanos}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>REPUBLICANOS — Análise</DialogTitle>
          </DialogHeader>
          {(() => {
            const a = analisarRepublicanos();
            return (
              <div className="space-y-3 text-sm">
                {/* KPIs principais */}
                <div className="grid grid-cols-5 gap-2">
                  <div className="p-2 bg-gray-50 rounded border text-center">
                    <div className="text-[11px] text-gray-600">Votos</div>
                    <div className="text-sm font-bold">{a.cenarios.atual.votos.toLocaleString('pt-BR')}</div>
                  </div>
                  <div className="p-2 bg-gray-50 rounded border text-center">
                    <div className="text-[11px] text-gray-600">QE</div>
                    <div className="text-sm font-bold">{quociente.toLocaleString('pt-BR')}</div>
                  </div>
                  <div className="p-2 bg-gray-50 rounded border text-center">
                    <div className="text-[11px] text-gray-600">80% QE</div>
                    <div className="text-sm font-bold">{getQuocienteMinimo().toLocaleString('pt-BR')}</div>
                  </div>
                  <div className="p-2 bg-gray-50 rounded border text-center">
                    <div className="text-[11px] text-gray-600">Vagas</div>
                    <div className="text-sm font-bold">{a.cenarios.atual.vagasTotais}</div>
                  </div>
                </div>

                {/* Status atual */}
                <div className="flex items-center gap-2">
                  <Badge className={a.cenarios.atual.elegivel ? 'bg-green-600' : 'bg-red-600'}>
                    {a.cenarios.atual.elegivel ? '≥ 80% do QE' : '< 80% do QE'}
                  </Badge>
                  <Badge variant="outline">
                    {a.cenarios.atual.vagasDiretas} diretas + {a.cenarios.atual.vagasSobra} sobras
                  </Badge>
                </div>

                {/* Análise de risco */}
                <div className="p-2 bg-gray-50 rounded border text-xs">
                  <div className="font-medium mb-2">Análise de Risco — Quanto cada adversário precisa crescer para nos tirar vagas:</div>
                  
                  {a.riscos.map((risco, index) => (
                    <div key={risco.partido} className="mb-2 p-2 bg-white rounded border">
                      <div className="font-medium text-gray-800">{risco.partido}</div>
                      <div className="grid grid-cols-2 gap-2 mt-1 text-[11px]">
                        <div>
                          <span className="text-gray-600">Para vaga direta:</span>
                          <span className="font-semibold ml-1">+{risco.deltaParaDireta.toLocaleString('pt-BR')} votos</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Para sobra:</span>
                          <span className="font-semibold ml-1">
                            {risco.deltaParaSobra === Infinity ? '—' : `+${risco.deltaParaSobra.toLocaleString('pt-BR')}`}
                          </span>
                        </div>
                      </div>
                      <div className="mt-1 text-[10px] text-gray-600">
                        Menor delta: <strong>+{risco.deltaMinimo.toLocaleString('pt-BR')} votos</strong>
                        {index === 0 && ' (MAIS PERIGOSO)'}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Conclusão */}
                <div className="text-xs text-gray-700 font-medium">{a.conclusao}</div>
              </div>
            );
          })()}
          <DialogFooter>
            <Button onClick={() => setOpenAnaliseRepublicanos(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}