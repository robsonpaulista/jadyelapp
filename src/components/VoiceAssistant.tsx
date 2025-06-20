import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Mic } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { FaMicrophone, FaMicrophoneSlash } from 'react-icons/fa';
import { createPortal } from 'react-dom';

// Definições de tipos para a API de reconhecimento de voz
interface SpeechGrammarList {
  addFromString(string: string, weight?: number): void;
  addFromURI(src: string, weight?: number): void;
  item(index: number): SpeechGrammar;
  readonly length: number;
}

interface SpeechGrammar {
  src: string;
  weight: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  grammars: SpeechGrammarList;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onnomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
  prototype: SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}

interface SpeechRecognitionEvent {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface VoiceAssistantProps {
  onSearch: (query: string) => void;
  onGetStats: () => {
    totalVotos: number;
    totalLiderancasAtuais: number;
    totalMunicipios: number;
    mediaVotosPorMunicipio: number;
  };
  isDataReady: boolean;
  planilhaData?: Array<{
    municipio: string;
    votacao2022: string;
    votosProjetados: string;
  }>;
  onCommand: (command: string) => void;
}

export default function VoiceAssistant({ onSearch, onGetStats, isDataReady, planilhaData, onCommand }: VoiceAssistantProps) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [isFirstClick, setIsFirstClick] = useState(true);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [searchResult, setSearchResult] = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      setGreeting('Bom dia');
    } else if (hour >= 12 && hour < 18) {
      setGreeting('Boa tarde');
    } else {
      setGreeting('Boa noite');
    }

    // Esconder o balão de boas-vindas após 5 segundos
    const timer = setTimeout(() => {
      setShowWelcome(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.lang = 'pt-BR';
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;

        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          handleCommand(transcript);
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('Erro no reconhecimento de voz:', event.error);
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }
  }, []);

  // Função para falar o texto
  const speak = (text: string) => {
    if (typeof window === 'undefined') return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.2; // Aumentar a velocidade da fala
    utterance.pitch = 1.1; // Aumentar levemente o tom da voz
    utterance.volume = 1.0;

    // Tentar usar uma voz mais moderna
    const voices = window.speechSynthesis.getVoices();
    const modernVoice = voices.find(voice => 
      voice.lang.includes('pt-BR') && 
      (voice.name.includes('Google') || voice.name.includes('Microsoft') || voice.name.includes('Premium'))
    );

    if (modernVoice) {
      utterance.voice = modernVoice;
    }

    window.speechSynthesis.speak(utterance);
  };

  // Função para gerar mensagem de boas-vindas baseada no horário
  const getMensagemBoasVindas = () => {
    const hora = new Date().getHours();
    
    if (hora >= 5 && hora < 12) {
      return "Bom dia Deputado Jadyel! Como posso ajudar você hoje?";
    } else if (hora >= 12 && hora < 18) {
      return "Boa tarde Deputado Jadyel! Como posso ajudar você hoje?";
    } else {
      return "Boa noite Deputado Jadyel! Como posso ajudar você hoje?";
    }
  };

  // Função para converter número ordinal para algarismo romano
  const ordinalToRoman = (ordinal: string): string => {
    const ordinalMap: { [key: string]: string } = {
      'primeiro': 'I',
      'segunda': 'II',
      'segundo': 'II',
      'terceira': 'III',
      'terceiro': 'III',
      'quarta': 'IV',
      'quarto': 'IV',
      'quinta': 'V',
      'quinto': 'V',
      'sexta': 'VI',
      'sexto': 'VI',
      'sétima': 'VII',
      'sétimo': 'VII',
      'setima': 'VII',
      'setimo': 'VII',
      'oitava': 'VIII',
      'oitavo': 'VIII',
      'nona': 'IX',
      'nono': 'IX',
      'décima': 'X',
      'décimo': 'X',
      'decima': 'X',
      'decimo': 'X'
    };

    return ordinalMap[ordinal.toLowerCase()] || ordinal;
  };

  // Função para padronizar títulos de doutor
  const standardizeTitle = (word: string): string => {
    const doctorVariations = [
      'doutor', 'doutora',
      'dr', 'dr.',
      'dra', 'dra.',
      'drª', 'drª.',
      'drᵃ', 'drᵃ.',
      'doutorᵃ',
      'doutorª'
    ];
    if (doctorVariations.includes(word.toLowerCase())) {
      return 'Dr.';
    }
    return word;
  };

  // Função para processar o termo de busca e converter ordinais para romanos
  const processSearchTerm = (term: string): string => {
    const words = term.split(' ');
    return words.map((word, index) => {
      // Padronizar títulos de doutor
      const standardizedWord = standardizeTitle(word);
      if (standardizedWord !== word) {
        return standardizedWord;
      }

      // Se a palavra anterior for um nome próprio (começa com maiúscula)
      // e a palavra atual é um ordinal, converte para romano
      if (index > 0 && /^[A-Z]/.test(words[index - 1])) {
        return ordinalToRoman(word);
      }
      return word;
    }).join(' ');
  };

  // Função para buscar votação
  const buscarVotacao = (municipio: string, tipo: '2022' | 'projetados' = '2022') => {
    if (!planilhaData) {
      console.log('Dados da planilha não disponíveis');
      return null;
    }

    // Normalizar o nome do município para busca
    const municipioNormalizado = normalizarTexto(municipio);
    console.log('Buscando votação para:', municipioNormalizado);

    // Log dos dados disponíveis
    console.log('Dados disponíveis:', planilhaData.map(d => ({
      municipio: d.municipio,
      municipioNormalizado: normalizarTexto(d.municipio),
      votacao2022: d.votacao2022,
      votosProjetados: d.votosProjetados
    })));

    // Buscar todos os registros do município
    const registrosMunicipio = planilhaData.filter(d => {
      const municipioDados = normalizarTexto(d.municipio);
      const match = municipioDados === municipioNormalizado || 
                   municipioDados.includes(municipioNormalizado) || 
                   municipioNormalizado.includes(municipioDados);
      console.log('Comparando:', { 
        municipioDados, 
        municipioNormalizado,
        match 
      });
      return match;
    });

    console.log('Registros encontrados:', registrosMunicipio);

    if (registrosMunicipio.length > 0) {
      // Somar todos os votos do município
      const totalVotos = registrosMunicipio.reduce((acc, registro) => {
        const votos = tipo === '2022' 
          ? parseVotacao(registro.votacao2022)
          : parseVotacao(registro.votosProjetados);
        console.log('Processando votos:', { 
          municipio: registro.municipio, 
          votacao2022: registro.votacao2022, 
          votosProcessados: votos 
        });
        return acc + votos;
      }, 0);

      // Formatar o número com separador de milhares
      const totalVotosFormatado = totalVotos.toLocaleString('pt-BR');
      
      const resultado = `Votação em ${registrosMunicipio[0].municipio} em ${tipo === '2022' ? '2022' : '2026'}: ${totalVotosFormatado} votos`;
      console.log('Resultado final:', resultado);
      return resultado;
    }

    console.log('Município não encontrado');
    return null;
  };

  // Função para normalizar texto (remover acentos e converter para minúsculo)
  const normalizarTexto = (texto: string): string => {
    return texto
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, '');
  };

  // Função para converter string de votação em número
  const parseVotacao = (votacao: string): number => {
    if (!votacao) return 0;
    // Remove espaços e caracteres não numéricos, exceto vírgula
    const cleanValue = votacao.replace(/[^\d,]/g, '');
    // Verifica se é um número com formato de milhar (ex: 2,000)
    if (/^\d{1,3}(,\d{3})+$/.test(cleanValue)) {
      return parseInt(cleanValue.replace(/,/g, ''), 10);
    }
    return parseInt(cleanValue, 10) || 0;
  };

  const handleCommand = async (command: string) => {
    setIsProcessing(true);
    setSearchResult(null);
    
    try {
      console.log('Comando recebido:', command);
      console.log('Estado dos dados:', { isDataReady, planilhaDataLength: planilhaData?.length });

      // Verificar se é um comando de busca de votação
      if (command.toLowerCase().includes('buscar votação') || command.toLowerCase().includes('buscar votos')) {
        const match = command.match(/buscar (?:votação|votos)(?:\s+(?:de\s+)?(\d{4}))?\s+([^,]+)/i);
        
        if (match) {
          const ano = match[1];
          const termo = match[2].trim();

          console.log('Processando busca de votação:', {
            termoOriginal: command,
            ano,
            termo
          });

          // Primeiro, filtrar a tabela
          onSearch(termo);

          // Buscar o município nos dados
          if (planilhaData && planilhaData.length > 0) {
            console.log('Buscando município nos dados:', planilhaData.slice(0, 5));
            
            const municipioEncontrado = planilhaData.find(d => 
              normalizarTexto(d.municipio).includes(normalizarTexto(termo))
            );

            console.log('Município encontrado:', municipioEncontrado);

            if (municipioEncontrado) {
              // Processar os votos
              const votos2022 = parseVotacao(municipioEncontrado.votacao2022);
              const votosProjetados = parseVotacao(municipioEncontrado.votosProjetados);
              const diferenca = votosProjetados - votos2022;
              const percentualCrescimento = votos2022 > 0 ? ((diferenca / votos2022) * 100) : 0;

              // Formatar a mensagem
              const mensagem = `📊 Análise de Votos - ${municipioEncontrado.municipio}:\n` +
                `🗳️ Votos Projetados 2026: ${votosProjetados.toLocaleString('pt-BR')}\n` +
                `📈 Votação 2022: ${votos2022.toLocaleString('pt-BR')}\n` +
                `${diferenca >= 0 ? '⬆️' : '⬇️'} Diferença: ${Math.abs(diferenca).toLocaleString('pt-BR')} votos\n` +
                `📊 Crescimento: ${percentualCrescimento.toFixed(1)}%`;

              console.log('Estado antes de atualizar:', { showTooltip, searchResult });
              
              // Mostrar o resultado e o popup
              setSearchResult(mensagem);
              setShowTooltip(true);
              
              console.log('Estado após atualizar:', { showTooltip, searchResult: mensagem });
              
              // Falar o resultado
              speak(`Encontrei os dados de ${municipioEncontrado.municipio}`);
            } else {
              console.log('Município não encontrado:', termo);
              speak(`Não encontrei dados para o município ${termo}`);
            }
          } else {
            console.log('Dados não disponíveis:', { planilhaData });
            speak('Aguarde um momento, os dados ainda estão sendo carregados');
          }
        } else {
          console.log('Padrão de comando não encontrado');
          speak('Desculpe, não entendi o formato do comando. Tente dizer "buscar votação" seguido do nome do município.');
        }
      }
      // Comandos de busca normais
      else if (command.includes('buscar') || command.includes('procurar')) {
        const searchTerm = command.split(/(buscar|procurar)/)[2].trim();
        const processedTerm = processSearchTerm(searchTerm);
        onSearch(processedTerm);
        speak(`Buscando informações sobre ${processedTerm}`);
      }
      // Comandos de estatísticas
      else if (command.includes('estatísticas') || command.includes('estatisticas')) {
        const stats = onGetStats();
        console.log('Dados recebidos no assistente:', stats); // Log para debug
        
        if (!stats || stats.totalVotos === 0) {
          speak('Desculpe, não foi possível obter as estatísticas no momento. Tente novamente em alguns instantes.');
          return;
        }
        
        // Formatar os números com separadores de milhares
        const totalVotosFormatado = stats.totalVotos.toLocaleString('pt-BR');
        const mediaVotosFormatada = stats.mediaVotosPorMunicipio.toLocaleString('pt-BR');
        
        speak(`Aqui estão as estatísticas atuais:
               Total de votos: ${totalVotosFormatado}.
               Total de lideranças atuais: ${stats.totalLiderancasAtuais.toLocaleString('pt-BR')}.
               Total de municípios: ${stats.totalMunicipios.toLocaleString('pt-BR')}.
               Média de votos por município: ${mediaVotosFormatada}`);
      }
      // Comandos de ajuda
      else if (command.includes('ajuda') || command.includes('o que você pode fazer')) {
        speak(`Posso ajudar você a:
               1. Buscar informações sobre municípios ou lideranças
               2. Mostrar estatísticas gerais
               3. Responder perguntas sobre a projeção de votos
               Para começar, diga "buscar" seguido do que você quer encontrar.`);
      }
      // Comando não reconhecido
      else {
        speak('Desculpe, não entendi seu comando. Diga "ajuda" para saber o que posso fazer.');
      }
    } catch (error) {
      console.error('Erro ao processar comando:', error);
      speak('Desculpe, ocorreu um erro ao processar seu comando. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Seu navegador não suporta reconhecimento de voz.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
    setIsListening(!isListening);
  };

  return (
    <>
      <div className="fixed bottom-8 right-8 z-50">
        <AnimatePresence>
          {showWelcome && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-20 right-0 bg-white rounded-lg shadow-lg p-4 max-w-xs"
            >
              <p className="text-gray-800 font-medium">
                {greeting}! Se precisar de auxílio com as consultas é só clicar.
              </p>
              <div className="absolute bottom-0 right-0 w-0 h-0 border-t-8 border-t-white border-l-8 border-l-transparent"></div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleListening}
          className={`p-4 rounded-full shadow-lg ${
            isListening ? 'bg-red-500' : 'bg-blue-500'
          } text-white transition-colors duration-200`}
        >
          {isListening ? <FaMicrophoneSlash size={24} /> : <FaMicrophone size={24} />}
        </motion.button>
      </div>

      {typeof document !== 'undefined' && showTooltip && searchResult && createPortal(
        <div className="fixed bottom-24 right-8 bg-white rounded-lg shadow-lg p-4 w-64 z-[100]">
          <p className="text-sm text-gray-800 whitespace-pre-line">{searchResult}</p>
          <button 
            onClick={() => {
              console.log('Fechando popup');
              setShowTooltip(false);
            }}
            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>,
        document.body
      )}
    </>
  );
} 