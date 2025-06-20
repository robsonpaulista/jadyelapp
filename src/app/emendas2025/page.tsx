'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Loader2, RefreshCw, Search, DollarSign, Wallet, CreditCard, Receipt, ChevronDown, ArrowUpDown, ChevronLeft, User, ShieldCheck, ChevronUp, Home, FileText, AppWindow, Building2, ListTree, BarChart as BarChartIcon, Instagram, Settings, Users, LayoutDashboard, X, ChevronRight, Pencil, Save, X as XIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useRouter } from 'next/navigation';
import { isUserLoggedIn, getCurrentUser } from '@/lib/storage';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { disableConsoleLogging } from '@/lib/logger';

interface Emenda {
  id: string;
  emenda: string;
  municipio: string;
  funcional: string;
  gnd: string;
  valor_indicado: number;
  alteracao: string;
  nroproposta: string;
  valor_empenho: number;
  empenho: string;
  dataempenho: string;
  portaria_convenio: string;
  valoraempenhar: number;
  pagamento: string;
  valorpago: number;
  valoraserpago: number;
  lideranca: string;
  classificacao_emenda: string;
  natureza: string;
  status_situacao: string;
  objeto: string;
}

interface MatrizNatureza {
  natureza: string;
  total_valor_indicado: number;
  total_valor_empenho: number;
  total_valorpago: number;
  total_valoraserpago: number;
  emendas: Emenda[];
}

interface Filtros {
  municipio: string[];
  lideranca: string[];
  classificacao_emenda: string[];
  natureza: string[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

// Componente Toast simples
const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed bottom-4 right-4 px-4 py-2 rounded-md text-white ${type === 'success' ? 'bg-green-500' : 'bg-red-500'} shadow-lg z-50`}>
      {message}
    </div>
  );
};

export default function Emendas2025() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [emendas, setEmendas] = useState<Emenda[]>([]);
  const [matrizNaturezas, setMatrizNaturezas] = useState<MatrizNatureza[]>([]);
  const [naturezaExpandida, setNaturezaExpandida] = useState<string | null>(null);
  const [filtros, setFiltros] = useState<Filtros>({
    municipio: [],
    lideranca: [],
    classificacao_emenda: [],
    natureza: [],
  });
  const [opcoesUnicas, setOpcoesUnicas] = useState<Filtros>({
    municipio: [],
    lideranca: [],
    classificacao_emenda: [],
    natureza: [],
  });
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);

  // Estados para usuário logado
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Novo estado para controlar quais naturezas estão expandidas (todas expandidas por padrão)
  const [naturezasExpandidas, setNaturezasExpandidas] = useState<Set<string>>(new Set());

  // Adicionar novos estados para a edição inline
  const [editandoEmenda, setEditandoEmenda] = useState<string | null>(null);
  const [emendasEditadas, setEmendasEditadas] = useState<Record<string, any>>({});
  const [salvandoEmenda, setSalvandoEmenda] = useState<string | null>(null);

  // Saudação baseada no horário
  const greeting = (() => {
    const currentHour = new Date().getHours();
    
    if (currentHour >= 5 && currentHour < 12) {
      return 'Bom dia';
    } else if (currentHour >= 12 && currentHour < 18) {
      return 'Boa tarde';
    } else {
      return 'Boa noite';
    }
  })();
  
  // Carregar informações do usuário
  useEffect(() => {
    // Desabilitar logs globalmente para proteção de dados
    if (typeof window !== 'undefined') {
      disableConsoleLogging();
    }

    try {
      const user = getCurrentUser();
      if (user) {
        // Usuário carregado - dados protegidos
        setCurrentUser(user);
      } else {
        // Nenhum usuário encontrado - dados protegidos
        // Usuário padrão para testes
        setCurrentUser({
          name: "ROBSON MEDEIROS SANTOS",
          role: "admin"
        });
      }
    } catch (error) {
      // Erro silencioso - não exibir logs por segurança
      // Usuário padrão em caso de erro
      setCurrentUser({
        name: "ROBSON MEDEIROS SANTOS",
        role: "admin"
      });
    }
  }, []);

  const fetchEmendas = async (forceRefresh = false) => {
    setIsLoading(true);
    try {
      const url = forceRefresh ? '/api/emendas?forceRefresh=true' : '/api/emendas';
      const res = await fetch(url);
      const data = await res.json();
      // Dados recebidos - informação protegida
      setEmendas(data.dados);
      
      // Atualizar opções únicas para filtros
      const opcoesUnicas = data.dados.reduce((acc: Filtros, emenda: Emenda) => {
        if (!acc.municipio.includes(emenda.municipio)) acc.municipio.push(emenda.municipio);
        if (emenda.lideranca && !acc.lideranca.includes(emenda.lideranca)) acc.lideranca.push(emenda.lideranca);
        if (!acc.classificacao_emenda.includes(emenda.classificacao_emenda)) 
          acc.classificacao_emenda.push(emenda.classificacao_emenda);
        if (!acc.natureza.includes(emenda.natureza)) 
          acc.natureza.push(emenda.natureza);
        
        return acc;
      }, { municipio: [], lideranca: [], classificacao_emenda: [], natureza: [] });

      // Ordenar as opções alfabeticamente
      opcoesUnicas.municipio.sort();
      opcoesUnicas.lideranca.sort();
      opcoesUnicas.classificacao_emenda.sort();
      opcoesUnicas.natureza.sort();

      setOpcoesUnicas(opcoesUnicas);

      // Atualizar a matriz de dados
      atualizarMatriz();
      
      if (forceRefresh) {
        toast?.success('Dados atualizados com sucesso!');
      }
    } catch (error) {
      // Erro silencioso - não exibir logs por segurança
      toast.error('Erro ao buscar dados. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const atualizarMatriz = useCallback(() => {
    // Atualizando matriz de naturezas - dados protegidos
    if (!emendas.length) {
      setMatrizNaturezas([]);
      return;
    }

    try {
      // Aplicar filtros
      let emendasFiltradas = emendas;
      
      // Filtro por município
      if (filtros.municipio.length > 0) {
        emendasFiltradas = emendasFiltradas.filter(emenda => 
          filtros.municipio.includes(emenda.municipio)
        );
      }

      // Filtro por liderança
      if (filtros.lideranca.length > 0) {
        emendasFiltradas = emendasFiltradas.filter(emenda => 
          filtros.lideranca.includes(emenda.lideranca || '')
        );
      }

      // Filtro por classificação
      if (filtros.classificacao_emenda.length > 0) {
        emendasFiltradas = emendasFiltradas.filter(emenda => 
          filtros.classificacao_emenda.includes(emenda.classificacao_emenda)
        );
      }

      // Filtro por natureza
      if (filtros.natureza.length > 0) {
        emendasFiltradas = emendasFiltradas.filter(emenda => 
          filtros.natureza.includes(emenda.natureza)
        );
      }

      // Criar matriz agrupada por natureza com dados filtrados
      const matrizPorNatureza = emendasFiltradas.reduce((acc: MatrizNatureza[], emenda: Emenda) => {
        // Usar APENAS o campo natureza para agrupamento
        // Não mais usar o campo objeto como fallback
        let itemAgrupador = emenda.natureza || 'Não definida';
        
        // Combinar "Transferência Especial Custeio" e "Transferência Especial Investimento"
        if (itemAgrupador === "Transferência Especial Custeio" || itemAgrupador === "Transferência Especial Investimento") {
          itemAgrupador = "Transferência Especial";
        }
        
        const naturezaExistente = acc.find(n => n.natureza === itemAgrupador);
        
        if (naturezaExistente) {
          naturezaExistente.total_valor_indicado += emenda.valor_indicado;
          naturezaExistente.total_valor_empenho += emenda.valor_empenho;
          naturezaExistente.total_valorpago += emenda.valorpago;
          naturezaExistente.total_valoraserpago += emenda.valoraserpago;
          naturezaExistente.emendas.push(emenda);
        } else {
          acc.push({
            natureza: itemAgrupador,
            total_valor_indicado: emenda.valor_indicado,
            total_valor_empenho: emenda.valor_empenho,
            total_valorpago: emenda.valorpago,
            total_valoraserpago: emenda.valoraserpago,
            emendas: [emenda]
          });
        }
        return acc;
      }, []);

      // Ordenar naturezas pelo valor indicado (maior para menor)
      matrizPorNatureza.sort((a, b) => b.total_valor_indicado - a.total_valor_indicado);

      // Log para verificar as naturezas finais
      console.log('Naturezas após agrupamento:', matrizPorNatureza.map(n => n.natureza));

      setMatrizNaturezas(matrizPorNatureza);
    } catch (err) {
      console.error('Erro ao atualizar matriz:', err);
    }
  }, [emendas, filtros]);

  useEffect(() => {
    // Buscar emendas ao carregar o componente
    fetchEmendas();
  }, []);

  useEffect(() => {
    if (emendas.length > 0) {
      atualizarMatriz();
    }
  }, [filtros]);

  const formatarValor = (valor: number) => {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const toggleNatureza = (natureza: string) => {
    setNaturezaExpandida(naturezaExpandida === natureza ? null : natureza);
  };

  const toggleFiltro = (tipo: keyof Filtros, valor: string) => {
    setFiltros(prevFiltros => {
      const novosFiltros = { ...prevFiltros };
      if (novosFiltros[tipo].includes(valor)) {
        novosFiltros[tipo] = novosFiltros[tipo].filter(v => v !== valor);
      } else {
        novosFiltros[tipo] = [...novosFiltros[tipo], valor];
      }
      return novosFiltros;
    });
  };

  const handleEditEmenda = (emenda: Emenda) => {
    setEmendaEmEdicao({...emenda});
    setShowModal(true);
  };

  // Função para ordenar os dados
  const sortData = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }

    setSortConfig({ key, direction });

    const sortedData = [...matrizNaturezas].sort((a, b) => {
      if (key === 'natureza') {
        const aValue = String(a.natureza);
        const bValue = String(b.natureza);
        return direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      // Para valores numéricos
      const numericKeys = ['total_valor_indicado', 'total_valor_empenho', 'total_valorpago', 'total_valoraserpago'];
      if (numericKeys.includes(key)) {
        return direction === 'asc'
          ? (a[key as keyof MatrizNatureza] as number) - (b[key as keyof MatrizNatureza] as number)
          : (b[key as keyof MatrizNatureza] as number) - (a[key as keyof MatrizNatureza] as number);
      }

      // Para outros campos de texto
      const textKeys = ['municipio'];
      if (textKeys.includes(key)) {
        // Para esses campos, usaremos o valor do primeiro item na lista de emendas
        // pois cada grupo pode ter emendas com diferentes valores para esses campos
        const aValue = String(a.emendas[0]?.[key as keyof Emenda] || '');
        const bValue = String(b.emendas[0]?.[key as keyof Emenda] || '');
        return direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return 0;
    });

    setMatrizNaturezas(sortedData);
  };

  // Função para alternar a expansão de uma natureza específica
  const toggleExpansao = (natureza: string) => {
    const novoConjunto = new Set(naturezasExpandidas);
    if (natureza && novoConjunto.has(natureza)) {
      novoConjunto.delete(natureza);
    } else if (natureza) {
      novoConjunto.add(natureza);
    }
    setNaturezasExpandidas(novoConjunto);
  };
  
  // Função para expandir todas as naturezas
  const expandirTodasNaturezas = () => {
    const todasNaturezas = new Set(matrizNaturezas
      .map(item => item.natureza)
      .filter((natureza): natureza is string => natureza !== undefined));
    setNaturezasExpandidas(todasNaturezas);
  };
  
  // Função para recolher todas as naturezas
  const recolherTodasNaturezas = () => {
    setNaturezasExpandidas(new Set());
  };
  
  // Expandir todas as naturezas quando os dados forem carregados
  useEffect(() => {
    if (matrizNaturezas.length > 0) {
      const todasNaturezas = new Set(matrizNaturezas
        .map(item => item.natureza)
        .filter((natureza): natureza is string => natureza !== undefined));
      setNaturezasExpandidas(todasNaturezas);
    }
  }, [matrizNaturezas]);

  // Estado para o menu flutuante
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Componente para o menu flutuante
  const FloatingMenu = () => {
    // Lista de aplicações com seus ícones e rotas
    const appsList = [
      {
        id: "acoes",
        name: "Central de Leads",
        icon: <AppWindow size={20} className="text-white" />,
        href: "/acoes",
        color: "from-blue-600 to-blue-500"
      },
      {
        id: "obras_demandas",
        name: "Obras e Demandas",
        icon: <Building2 size={20} className="text-white" />,
        href: "/obras_demandas",
        color: "from-orange-600 to-orange-500"
      },
      {
        id: "emendas2025",
        name: "Emendas",
        icon: <FileText size={20} className="text-white" />,
        href: "/emendas2025",
        color: "from-green-600 to-green-500"
      },
      {
        id: "baseliderancas",
        name: "Base de Lideranças",
        icon: <ListTree size={20} className="text-white" />,
        href: "/baseliderancas",
        color: "from-purple-600 to-purple-500"
      },
      {
        id: "projecao2026",
        name: "Projeção 2026",
        icon: <BarChartIcon size={20} className="text-white" />,
        href: "/projecao2026",
        color: "from-yellow-600 to-yellow-500"
      },
      {
        id: "instagram-analytics",
        name: "Instagram",
        icon: <Instagram size={20} className="text-white" />,
        href: "/instagram-analytics",
        color: "from-pink-600 to-pink-500"
      },
      {
        id: "gerenciar-usuarios",
        name: "Usuários",
        icon: <Users size={20} className="text-white" />,
        href: "/gerenciar-usuarios",
        color: "from-indigo-600 to-indigo-500"
      },
      {
        id: "configuracoes",
        name: "Configurações",
        icon: <Settings size={20} className="text-white" />,
        href: "/configuracoes",
        color: "from-gray-600 to-gray-500"
      },
      {
        id: "painel-aplicacoes",
        name: "Painel Principal",
        icon: <LayoutDashboard size={20} className="text-white" />,
        href: "/painel-aplicacoes",
        color: "from-teal-600 to-teal-500"
      }
    ];

    // Filtrar aplicações baseado nas permissões do usuário
    // No contexto da página /emendas2025, mostramos todos os apps
    const filteredApps = appsList;

    return (
      <motion.div
        className="fixed bottom-6 left-6 z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <motion.div
          className="relative"
          initial="closed"
          animate={isMenuOpen ? "open" : "closed"}
          onHoverStart={() => setIsMenuOpen(true)}
          onHoverEnd={() => setIsMenuOpen(false)}
        >
          {/* Botão principal do menu */}
          <motion.button
            className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-800 shadow-lg hover:shadow-xl cursor-pointer relative z-20"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <AppWindow size={24} className="text-white" />
          </motion.button>

          {/* Menu expandido */}
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                className="absolute left-0 bottom-16 bg-white/10 backdrop-blur-md rounded-xl border border-gray-200 shadow-xl overflow-hidden"
                initial={{ opacity: 0, height: 0, width: 0 }}
                animate={{ opacity: 1, height: 'auto', width: 'auto' }}
                exit={{ opacity: 0, height: 0, width: 0, transition: { duration: 0.2 } }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <ul className="py-2 px-1">
                  {filteredApps.map((app, index) => (
                    <motion.li
                      key={app.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="mb-1 last:mb-0"
                    >
                      <Link href={app.href}>
                        <motion.div
                          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer group"
                          whileHover={{ x: 5 }}
                          transition={{ type: "spring", stiffness: 400, damping: 17 }}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-r ${app.color} group-hover:scale-110 transition-transform`}>
                            {app.icon}
                          </div>
                          <span className="text-sm font-medium whitespace-nowrap">{app.name}</span>
                        </motion.div>
                      </Link>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    );
  };

  // Adicionar funções para edição inline
  const iniciarEdicao = (emendaId: string, emenda: any) => {
    setEditandoEmenda(emendaId);
    setEmendasEditadas({
      ...emendasEditadas,
      [emendaId]: { ...emenda }
    });
  };

  const atualizarCampoEmenda = (emendaId: string, campo: string, valor: any) => {
    setEmendasEditadas({
      ...emendasEditadas,
      [emendaId]: {
        ...emendasEditadas[emendaId],
        [campo]: valor
      }
    });
  };

  const cancelarEdicao = () => {
    setEditandoEmenda(null);
  };

  const salvarEmenda = async (emendaId: string, rowIndex: number) => {
    setSalvandoEmenda(emendaId);
    
    try {
      const emendaAtualizada = emendasEditadas[emendaId];
      const response = await fetch('/api/emendas', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emenda: emendaAtualizada,
          rowIndex
        }),
      });
      
      const resultado = await response.json();
      
      if (resultado.success) {
        // Atualizar a lista local
        setEmendas(emendas.map(e => e.id === emendaId ? emendaAtualizada : e));
        
        showToast('Registro atualizado com sucesso!', 'success');
        setEditandoEmenda(null);
      } else {
        console.error('Erro ao atualizar registro:', resultado.error || resultado.message);
        showToast(resultado.error || 'Erro ao atualizar o registro', 'error');
      }
    } catch (error) {
      console.error('Exceção ao atualizar registro:', error);
      showToast('Ocorreu um erro ao tentar atualizar o registro', 'error');
    } finally {
      setSalvandoEmenda(null);
    }
  };

  // Add force refresh function
  const forcaRefresh = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    fetchEmendas(true);
  };

  const [emendaEmEdicao, setEmendaEmEdicao] = useState<Emenda | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const handleModalChange = (field: keyof Emenda, value: any) => {
    if (emendaEmEdicao) {
      setEmendaEmEdicao({
        ...emendaEmEdicao,
        [field]: value
      });
    }
  };

  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };
  
  const handleModalSave = async () => {
    if (!emendaEmEdicao) return;
    
    setCarregando(true);
    try {
      const response = await fetch('/api/emendas', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emenda: emendaEmEdicao }),
      });

      if (response.ok) {
        // Atualiza a lista local
        setEmendas(emendas.map(e => e.id === emendaEmEdicao.id ? emendaEmEdicao : e));
        atualizarMatriz();
        closeModal();
        showToast('Emenda atualizada com sucesso!', 'success');
      } else {
        showToast('Erro ao atualizar emenda', 'error');
      }
    } catch (error) {
      console.error('Erro ao salvar emenda:', error);
      showToast('Erro ao atualizar emenda', 'error');
    } finally {
      setCarregando(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEmendaEmEdicao(null);
  };

  // Modal para edição de emendas
  const EditEmendaModal = () => {
    if (!emendaEmEdicao) return null;

    const formatarNumeroInput = (value: number) => {
      return value ? value.toString() : '';
    };

    const handleNumberChange = (field: keyof Emenda, value: string) => {
      const numberValue = value === '' ? 0 : parseFloat(value.replace(/[^0-9,.]/g, '').replace(',', '.'));
      handleModalChange(field, numberValue);
    };

    return (
      <div className={`fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 ${showModal ? '' : 'hidden'}`}>
        <div className="bg-white rounded-lg shadow-lg p-4 w-11/12 max-w-5xl max-h-[85vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold">Editar Emenda</h2>
            <button 
              onClick={closeModal}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
            <div className="mb-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">ID</label>
              <input
                type="text"
                value={emendaEmEdicao.id}
                disabled
                className="bg-gray-100 w-full px-2 py-1 border border-gray-300 rounded-md text-xs"
              />
            </div>
            
            <div className="mb-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Município</label>
              <input
                type="text"
                value={emendaEmEdicao.municipio}
                onChange={(e) => handleModalChange('municipio', e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs"
              />
            </div>
            
            <div className="mb-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Emenda</label>
              <input
                type="text"
                value={emendaEmEdicao.emenda}
                onChange={(e) => handleModalChange('emenda', e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs"
              />
            </div>
            
            <div className="mb-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Liderança</label>
              <input
                type="text"
                value={emendaEmEdicao.lideranca}
                onChange={(e) => handleModalChange('lideranca', e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs"
              />
            </div>
            
            <div className="mb-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Classificação</label>
              <input
                type="text"
                value={emendaEmEdicao.classificacao_emenda}
                onChange={(e) => handleModalChange('classificacao_emenda', e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs"
              />
            </div>
            
            <div className="mb-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Natureza</label>
              <input
                type="text"
                value={emendaEmEdicao.natureza}
                onChange={(e) => handleModalChange('natureza', e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs"
              />
            </div>
            
            <div className="mb-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Status/Situação</label>
              <input
                type="text"
                value={emendaEmEdicao.status_situacao}
                onChange={(e) => handleModalChange('status_situacao', e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs"
              />
            </div>
            
            <div className="mb-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Objeto</label>
              <input
                type="text"
                value={emendaEmEdicao.objeto}
                onChange={(e) => handleModalChange('objeto', e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs"
              />
            </div>
            
            <div className="mb-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Valor Indicado</label>
              <input
                type="text"
                value={formatarNumeroInput(emendaEmEdicao.valor_indicado)}
                onChange={(e) => handleNumberChange('valor_indicado', e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs"
              />
            </div>
            
            <div className="mb-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Valor Empenho</label>
              <input
                type="text"
                value={formatarNumeroInput(emendaEmEdicao.valor_empenho)}
                onChange={(e) => handleNumberChange('valor_empenho', e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs"
              />
            </div>
            
            <div className="mb-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Valor a Empenhar</label>
              <input
                type="text"
                value={formatarNumeroInput(emendaEmEdicao.valoraempenhar)}
                onChange={(e) => handleNumberChange('valoraempenhar', e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs"
              />
            </div>
            
            <div className="mb-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Valor Pago</label>
              <input
                type="text"
                value={formatarNumeroInput(emendaEmEdicao.valorpago)}
                onChange={(e) => handleNumberChange('valorpago', e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs"
              />
            </div>
            
            <div className="mb-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Valor a Ser Pago</label>
              <input
                type="text"
                value={formatarNumeroInput(emendaEmEdicao.valoraserpago)}
                onChange={(e) => handleNumberChange('valoraserpago', e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs"
              />
            </div>
            
            <div className="mb-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Funcional</label>
              <input
                type="text"
                value={emendaEmEdicao.funcional}
                onChange={(e) => handleModalChange('funcional', e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs"
              />
            </div>
            
            <div className="mb-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">GND</label>
              <input
                type="text"
                value={emendaEmEdicao.gnd}
                onChange={(e) => handleModalChange('gnd', e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs"
              />
            </div>
            
            <div className="mb-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Alteração</label>
              <input
                type="text"
                value={emendaEmEdicao.alteracao}
                onChange={(e) => handleModalChange('alteracao', e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs"
              />
            </div>
            
            <div className="mb-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Nro Proposta</label>
              <input
                type="text"
                value={emendaEmEdicao.nroproposta}
                onChange={(e) => handleModalChange('nroproposta', e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs"
              />
            </div>
            
            <div className="mb-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Empenho</label>
              <input
                type="text"
                value={emendaEmEdicao.empenho}
                onChange={(e) => handleModalChange('empenho', e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs"
              />
            </div>
            
            <div className="mb-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Data Empenho</label>
              <input
                type="text"
                value={emendaEmEdicao.dataempenho}
                onChange={(e) => handleModalChange('dataempenho', e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs"
              />
            </div>
            
            <div className="mb-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Portaria/Convênio</label>
              <input
                type="text"
                value={emendaEmEdicao.portaria_convenio}
                onChange={(e) => handleModalChange('portaria_convenio', e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs"
              />
            </div>
            
            <div className="mb-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Pagamento</label>
              <input
                type="text"
                value={emendaEmEdicao.pagamento}
                onChange={(e) => handleModalChange('pagamento', e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-3">
            <button
              onClick={closeModal}
              className="px-3 py-1 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 text-xs"
            >
              Cancelar
            </button>
            <button
              onClick={handleModalSave}
              disabled={carregando}
              className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300 text-xs"
            >
              {carregando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="mt-4 text-gray-600">Carregando emendas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={fetchEmendas}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-gray-50 to-gray-100">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center py-3">
            <div className="flex flex-col">
              <div className="text-sm font-normal text-gray-800">86 Dynamics Integration</div>
              <div className="text-gray-500 text-xs font-light">Gerenciamento de Aplicações Deputado Federal Jadiel Alencar - Emendas</div>
            </div>
            <div className="flex items-center space-x-3">
              {/* Exibir informações do usuário logado */}
              {currentUser && (
                <div className="flex items-center space-x-2 px-3 py-1.5 rounded border border-gray-200">
                  <div className="relative">
                    <User className="h-3.5 w-3.5 text-gray-500" />
                    {/* Indicador de status online */}
                    <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-400 rounded-full border border-white"></div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-700 font-normal flex items-center">
                      {greeting}, {currentUser.name}
                    </div>
                    <div className="text-[10px] text-gray-500 flex items-center font-light">
                      {currentUser.role === 'admin' ? (
                        <>
                          <ShieldCheck className="h-2.5 w-2.5 mr-1" /> 
                          Administrador
                        </>
                      ) : (
                        <>
                          <User className="h-2.5 w-2.5 mr-1" />
                          Usuário
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
              <button
                onClick={() => router.push('/painel-aplicacoes')}
                className="flex items-center gap-1 px-3 py-1.5 rounded text-xs transition-colors border border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
              >
                <ChevronLeft className="h-3 w-3" />
                <span className="font-light">Voltar</span>
              </button>
              <button
                onClick={fetchEmendas}
                className="flex items-center gap-1 px-3 py-1.5 rounded text-xs transition-colors border border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3" />
                )}
                <span className="font-light">Atualizar</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 flex-1 max-w-7xl">
        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <motion.div
            className="overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow bg-white h-full">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Valor Indicado</p>
                    <h3 className="text-xl font-medium text-gray-800">
                      {formatarValor(matrizNaturezas.reduce((acc, natureza) => acc + natureza.total_valor_indicado, 0))}
                    </h3>
                  </div>
                  <div className="p-2 bg-gray-100 rounded-full">
                    <DollarSign className="h-5 w-5 text-gray-500" strokeWidth={1.5} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            className="overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow bg-white h-full">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Valor a Empenhar</p>
                    <h3 className="text-xl font-medium text-gray-800">
                      {formatarValor(matrizNaturezas.reduce((acc, natureza) => 
                        acc + natureza.emendas.reduce((sum, emenda) => sum + (emenda.valoraempenhar || 0), 0), 0))}
                    </h3>
                  </div>
                  <div className="p-2 bg-gray-100 rounded-full">
                    <Wallet className="h-5 w-5 text-gray-500" strokeWidth={1.5} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            className="overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow bg-white h-full">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Valor Empenhado</p>
                    <h3 className="text-xl font-medium text-gray-800">
                      {formatarValor(matrizNaturezas.reduce((acc, natureza) => 
                        acc + natureza.emendas.reduce((sum, emenda) => sum + (emenda.valor_empenho || 0), 0), 0))}
                    </h3>
                  </div>
                  <div className="p-2 bg-gray-100 rounded-full">
                    <CreditCard className="h-5 w-5 text-gray-500" strokeWidth={1.5} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            className="overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow bg-white h-full">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Valor Pago</p>
                    <h3 className="text-xl font-medium text-gray-800">
                      {formatarValor(matrizNaturezas.reduce((acc, natureza) => 
                        acc + natureza.emendas.reduce((sum, emenda) => sum + (emenda.valorpago || 0), 0), 0))}
                    </h3>
                  </div>
                  <div className="p-2 bg-gray-100 rounded-full">
                    <Receipt className="h-5 w-5 text-gray-500" strokeWidth={1.5} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            className="overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow bg-white h-full">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Valor a ser Pago</p>
                    <h3 className="text-xl font-medium text-gray-800">
                      {formatarValor(matrizNaturezas.reduce((acc, natureza) => 
                        acc + natureza.emendas.reduce((sum, emenda) => sum + (emenda.valoraserpago || 0), 0), 0))}
                    </h3>
                  </div>
                  <div className="p-2 bg-gray-100 rounded-full">
                    <RefreshCw className="h-5 w-5 text-gray-500" strokeWidth={1.5} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Card de Filtros */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.6 }}
        >
          <Card className="mb-6 border border-gray-100 shadow-sm overflow-hidden bg-white">
            <CardHeader className="pb-2 bg-white">
              <CardTitle className="text-lg font-medium text-gray-800 flex items-center gap-2">
                <Search className="h-4 w-4 text-gray-500" />
                Filtros
                <button
                  onClick={() => setMostrarFiltros(!mostrarFiltros)}
                  className="ml-auto p-1.5 hover:bg-gray-100 rounded-full transition-colors focus:outline-none"
                >
                  {mostrarFiltros ? (
                    <ChevronUp className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  )}
                </button>
              </CardTitle>
            </CardHeader>
            <CardContent className={`transition-all ${mostrarFiltros ? 'max-h-96 py-4' : 'max-h-0 py-0 overflow-hidden'}`}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Município</label>
                  <Select>
                    <SelectTrigger className="w-full bg-white border border-gray-200 hover:border-gray-300 transition-colors shadow-sm">
                      <SelectValue placeholder="Selecione os municípios" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px] overflow-y-auto bg-white shadow-lg border border-gray-200">
                      {opcoesUnicas.municipio.map(opcao => (
                        <div key={opcao} className="flex items-center space-x-2 p-2 hover:bg-gray-50">
                          <Checkbox
                            id={`municipio-${opcao}`}
                            checked={filtros.municipio.includes(opcao)}
                            onCheckedChange={(checked: boolean) => {
                              if (checked) {
                                setFiltros(prev => ({ ...prev, municipio: [...prev.municipio, opcao] }));
                              } else {
                                setFiltros(prev => ({ ...prev, municipio: prev.municipio.filter(m => m !== opcao) }));
                              }
                            }}
                          />
                          <label htmlFor={`municipio-${opcao}`} className="text-sm cursor-pointer truncate">{opcao}</label>
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                  {filtros.municipio.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {filtros.municipio.map(municipio => (
                        <div 
                          key={municipio} 
                          className="bg-blue-50 text-blue-700 text-xs py-0.5 px-2 rounded-full flex items-center"
                        >
                          {municipio.length > 15 ? `${municipio.substring(0, 15)}...` : municipio}
                          <button
                            onClick={() => setFiltros(prev => ({
                              ...prev,
                              municipio: prev.municipio.filter(m => m !== municipio)
                            }))}
                            className="ml-1 p-0.5 rounded-full hover:bg-blue-100"
                          >
                            <XIcon className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Liderança</label>
                  <Select>
                    <SelectTrigger className="w-full bg-white border border-gray-200 hover:border-gray-300 transition-colors shadow-sm">
                      <SelectValue placeholder="Selecione as lideranças" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px] overflow-y-auto bg-white shadow-lg border border-gray-200">
                      {opcoesUnicas.lideranca.map(opcao => (
                        <div key={opcao} className="flex items-center space-x-2 p-2 hover:bg-gray-50">
                          <Checkbox
                            id={`lideranca-${opcao}`}
                            checked={filtros.lideranca.includes(opcao)}
                            onCheckedChange={(checked: boolean) => {
                              if (checked) {
                                setFiltros(prev => ({ ...prev, lideranca: [...prev.lideranca, opcao] }));
                              } else {
                                setFiltros(prev => ({ ...prev, lideranca: prev.lideranca.filter(l => l !== opcao) }));
                              }
                            }}
                          />
                          <label htmlFor={`lideranca-${opcao}`} className="text-sm cursor-pointer truncate">{opcao}</label>
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                  {filtros.lideranca.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {filtros.lideranca.map(lideranca => (
                        <div 
                          key={lideranca} 
                          className="bg-orange-50 text-orange-700 text-xs py-0.5 px-2 rounded-full flex items-center"
                        >
                          {lideranca.length > 15 ? `${lideranca.substring(0, 15)}...` : lideranca}
                          <button
                            onClick={() => setFiltros(prev => ({
                              ...prev,
                              lideranca: prev.lideranca.filter(l => l !== lideranca)
                            }))}
                            className="ml-1 p-0.5 rounded-full hover:bg-orange-100"
                          >
                            <XIcon className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Classificação</label>
                  <Select>
                    <SelectTrigger className="w-full bg-white border border-gray-200 hover:border-gray-300 transition-colors shadow-sm">
                      <SelectValue placeholder="Selecione as classificações" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px] overflow-y-auto bg-white shadow-lg border border-gray-200">
                      {opcoesUnicas.classificacao_emenda.map(opcao => (
                        <div key={opcao} className="flex items-center space-x-2 p-2 hover:bg-gray-50">
                          <Checkbox
                            id={`classificacao-${opcao}`}
                            checked={filtros.classificacao_emenda.includes(opcao)}
                            onCheckedChange={(checked: boolean) => {
                              if (checked) {
                                setFiltros(prev => ({ ...prev, classificacao_emenda: [...prev.classificacao_emenda, opcao] }));
                              } else {
                                setFiltros(prev => ({ ...prev, classificacao_emenda: prev.classificacao_emenda.filter(c => c !== opcao) }));
                              }
                            }}
                          />
                          <label htmlFor={`classificacao-${opcao}`} className="text-sm cursor-pointer truncate">{opcao}</label>
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                  {filtros.classificacao_emenda.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {filtros.classificacao_emenda.map(classificacao => (
                        <div 
                          key={classificacao} 
                          className="bg-purple-50 text-purple-700 text-xs py-0.5 px-2 rounded-full flex items-center"
                        >
                          {classificacao.length > 15 ? `${classificacao.substring(0, 15)}...` : classificacao}
                          <button
                            onClick={() => setFiltros(prev => ({
                              ...prev,
                              classificacao_emenda: prev.classificacao_emenda.filter(c => c !== classificacao)
                            }))}
                            className="ml-1 p-0.5 rounded-full hover:bg-purple-100"
                          >
                            <XIcon className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Natureza</label>
                  <Select>
                    <SelectTrigger className="w-full bg-white border border-gray-200 hover:border-gray-300 transition-colors shadow-sm">
                      <SelectValue placeholder="Selecione as naturezas" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px] overflow-y-auto bg-white shadow-lg border border-gray-200">
                      {opcoesUnicas.natureza.map(opcao => (
                        <div key={opcao} className="flex items-center space-x-2 p-2 hover:bg-gray-50">
                          <Checkbox
                            id={`natureza-${opcao}`}
                            checked={filtros.natureza.includes(opcao)}
                            onCheckedChange={(checked: boolean) => {
                              if (checked) {
                                setFiltros(prev => ({ ...prev, natureza: [...prev.natureza, opcao] }));
                              } else {
                                setFiltros(prev => ({ ...prev, natureza: prev.natureza.filter(n => n !== opcao) }));
                              }
                            }}
                          />
                          <label htmlFor={`natureza-${opcao}`} className="text-sm cursor-pointer truncate">{opcao}</label>
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                  {filtros.natureza.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {filtros.natureza.map(natureza => (
                        <div 
                          key={natureza} 
                          className="bg-green-50 text-green-700 text-xs py-0.5 px-2 rounded-full flex items-center"
                        >
                          {natureza.length > 15 ? `${natureza.substring(0, 15)}...` : natureza}
                          <button
                            onClick={() => setFiltros(prev => ({
                              ...prev,
                              natureza: prev.natureza.filter(n => n !== natureza)
                            }))}
                            className="ml-1 p-0.5 rounded-full hover:bg-green-100"
                          >
                            <XIcon className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Matriz única para todas as naturezas */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.7 }}
        >
          <Card className="overflow-hidden border border-gray-100 shadow-sm bg-white">
            <CardHeader className="pb-2 bg-white">
              <CardTitle className="flex items-center justify-between text-gray-800">
                <span className="text-lg font-medium">Todas as Naturezas</span>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={expandirTodasNaturezas}
                    className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    Expandir Todas
                  </button>
                  <button 
                    onClick={recolherTodasNaturezas}
                    className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    Recolher Todas
                  </button>
                  <button 
                    onClick={forcaRefresh}
                    className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Forçar Refresh
                  </button>
                  <span className="text-sm text-gray-500">
                    {matrizNaturezas.reduce((acc, n) => acc + n.emendas.length, 0)} emendas no total
                  </span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 pt-0 pb-0">
              <div className="overflow-x-auto">
                {/* Tabela de emendas */}
                <table className="min-w-full bg-white rounded-lg overflow-hidden">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="cursor-pointer px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" onClick={() => sortData('natureza')}>
                        Natureza {sortConfig?.key === 'natureza' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="cursor-pointer px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" onClick={() => sortData('municipio')}>
                        Município {sortConfig?.key === 'municipio' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="cursor-pointer px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" onClick={() => sortData('lideranca')}>
                        LIDERANÇA {sortConfig?.key === 'lideranca' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="cursor-pointer px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" onClick={() => sortData('classificacao_emenda')}>
                        Classificação {sortConfig?.key === 'classificacao_emenda' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="cursor-pointer px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" onClick={() => sortData('emenda')}>
                        Emenda {sortConfig?.key === 'emenda' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="cursor-pointer px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" onClick={() => sortData('valor_indicado')}>
                        Valor Indicado {sortConfig?.key === 'valor_indicado' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="cursor-pointer px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" onClick={() => sortData('valor_empenho')}>
                        Valor Empenho {sortConfig?.key === 'valor_empenho' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="cursor-pointer px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" onClick={() => sortData('valorpago')}>
                        Valor Pago {sortConfig?.key === 'valorpago' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="cursor-pointer px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" onClick={() => sortData('valoraserpago')}>
                        Valor a Pagar {sortConfig?.key === 'valoraserpago' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="cursor-pointer px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" onClick={() => sortData('objeto')}>
                        Objeto {sortConfig?.key === 'objeto' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {matrizNaturezas.map((natureza, naturezaIndex) => (
                      <React.Fragment key={natureza.natureza}>
                        {/* Cabeçalho da natureza */}
                        <tr 
                          className="bg-gray-50 border-y border-gray-100"
                          onClick={() => toggleExpansao(natureza.natureza)}
                        >
                          <td 
                            colSpan={11} 
                            className="px-4 py-2 cursor-pointer hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 font-medium text-gray-800">
                                {naturezasExpandidas.has(natureza.natureza) ? (
                                  <ChevronDown className="h-4 w-4 text-gray-500" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-gray-500" />
                                )}
                                <span>Natureza: {natureza.natureza}</span>
                                <span className="text-xs text-gray-500 ml-2">
                                  {natureza.emendas.length} {natureza.emendas.length === 1 ? 'emenda' : 'emendas'}
                                </span>
                              </div>
                              <div className="flex gap-4 items-center text-sm">
                                <div>
                                  <span className="text-gray-500 text-xs">Indicado: </span>
                                  <span className="font-medium text-gray-800">{formatarValor(natureza.total_valor_indicado)}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500 text-xs">Empenhado: </span>
                                  <span className="font-medium text-gray-800">{formatarValor(natureza.total_valor_empenho)}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                        
                        {/* Exibe todas as emendas dentro da natureza quando expandido */}
                        {naturezasExpandidas.has(natureza.natureza) && (
                          natureza.emendas.map((emenda, emendaIndex) => (
                            <motion.tr 
                              key={`emenda-${naturezaIndex}-${emendaIndex}`}
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.2, delay: emendaIndex * 0.05 }}
                              className="bg-gray-50 hover:bg-gray-100"
                            >
                              <td className="px-4 py-2 text-xs text-gray-600">{emenda.natureza}</td>
                              <td className="px-4 py-2 text-xs text-gray-600">{emenda.municipio}</td>
                              <td className="px-4 py-2 text-xs text-gray-600">{emenda.lideranca}</td>
                              <td className="px-4 py-2 text-xs text-gray-600">{emenda.classificacao_emenda}</td>
                              <td className="px-4 py-2 text-xs text-gray-600">{emenda.emenda}</td>
                              <td className="px-4 py-2 text-xs text-gray-600">
                                {formatarValor(emenda.valor_indicado)}
                              </td>
                              <td className="px-4 py-2 text-xs text-gray-600">
                                {formatarValor(emenda.valor_empenho)}
                              </td>
                              <td className="px-4 py-2 text-xs text-gray-600">
                                {formatarValor(emenda.valorpago)}
                              </td>
                              <td className="px-4 py-2 text-xs text-gray-600">
                                {formatarValor(emenda.valoraserpago)}
                              </td>
                              <td className="px-4 py-2 text-xs text-gray-600">{emenda.objeto || '-'}</td>
                              <td className="px-4 py-2 text-xs">
                                <button 
                                  onClick={() => handleEditEmenda(emenda)}
                                  className="p-1 text-blue-600 hover:text-blue-800"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                              </td>
                            </motion.tr>
                          ))
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

      </div>
      
      {/* Adicionar menu flutuante */}
      <FloatingMenu />
      
      {/* Adicionar o modal no final do componente */}
      {showModal && <EditEmendaModal />}
      
      {/* Adicionar Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
} 