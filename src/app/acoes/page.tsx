'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Plus, 
  RefreshCw, 
  Trash2, 
  Edit, 
  FileText,
  Loader2,
  UserPlus,
  Users,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  InfoIcon,
  CheckCheck,
  CalendarPlus,
  CalendarCheck,
  Pencil,
  HomeIcon,
  X,
  User,
  ChevronLeft,
  ArrowLeft,
  UserIcon,
  ShieldCheck,
  AppWindow,
  Building2,
  ListTree,
  BarChart,
  Instagram,
  Settings,
  LayoutDashboard
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage
} from "@/components/ui/form";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCurrentUser } from '@/lib/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { disableConsoleLogging } from '@/lib/logger';

// Interface para paciente
interface Paciente {
  id: string;
  nome: string;
  cpf: string;
  dataNascimento: string;
  genero: string;
  endereco: string;
  numero: string;
  bairro: string;
  municipio: string;
  telefone?: string;
  email?: string;
  escolaridade?: string;
  rendaFamiliar?: string;
  observacoes?: string;
  dataAgendamento?: string;
  hora?: string;
  local?: string;
  dataDoAtendimento?: string;
  naturalidade?: string;
  estadoCivil?: string;
  cargoOcupacao?: string;
  orgao?: string;
}

// Esquema de validação para busca de paciente
const buscaPacienteSchema = z.object({
  termo: z.string().min(3, 'Digite pelo menos 3 caracteres para buscar')
});

// Esquema de validação para o formulário de cadastro de paciente
const pacienteSchema = z.object({
  nome: z.string().min(3, 'O nome deve ter no mínimo 3 caracteres'),
  cpf: z.string().min(11, 'CPF inválido'),
  dataNascimento: z.string().min(1, 'Data de nascimento é obrigatória'),
  genero: z.string().min(1, 'Gênero é obrigatório'),
  endereco: z.string().min(3, 'Endereço deve ter no mínimo 3 caracteres'),
  numero: z.string(),
  bairro: z.string().min(2, 'Bairro é obrigatório'),
  municipio: z.string().min(2, 'Município é obrigatório'),
  telefone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  escolaridade: z.string().optional(),
  rendaFamiliar: z.string().optional(),
  observacoes: z.string().optional(),
  naturalidade: z.string().optional(),
  estadoCivil: z.string().optional(),
  cargoOcupacao: z.string().optional(),
  orgao: z.string().optional()
});

// Esquema de validação para o formulário de atendimento
const atendimentoSchema = z.object({
  pacienteId: z.string().min(1, 'Paciente é obrigatório'),
  dataAgendamento: z.string().min(1, 'Data do agendamento é obrigatória'),
  hora: z.string().min(1, 'Hora é obrigatória'),
  local: z.string().min(1, 'Local é obrigatório'),
  observacoes: z.string().optional()
});

// Schema para validação de novo atendimento
const novoAtendimentoSchema = z.object({
  dataAgendamento: z.string().min(1, 'Data de agendamento é obrigatória'),
  hora: z.string().min(1, 'Hora é obrigatória'),
  local: z.string().min(1, 'Local é obrigatório'),
  observacoes: z.string().optional(),
  status: z.string().default('agendado')
});

const CentralLeadsPage = () => {
  const router = useRouter();
  
  // Estados para gerenciar a aplicação
  const [activeTab, setActiveTab] = useState('busca');
  const [isLoading, setIsLoading] = useState(false);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [pacientesBuscados, setPacientesBuscados] = useState<Paciente[]>([]);
  const [pacienteSelecionado, setPacienteSelecionado] = useState<Paciente | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Estado para o usuário logado
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [greeting, setGreeting] = useState<string>('');
  
  // Estados para diálogos
  const [cadastroDialogOpen, setCadastroDialogOpen] = useState(false);
  const [atendimentoDialogOpen, setAtendimentoDialogOpen] = useState(false);
  const [detalhesDialogOpen, setDetalhesDialogOpen] = useState(false);
  const [buscaDialogOpen, setBuscaDialogOpen] = useState(false);
  
  // Estado para controlar o modal de novo atendimento (para pacientes existentes)
  const [novoAtendimentoDialogOpen, setNovoAtendimentoDialogOpen] = useState(false);
  
  // Estado para armazenar os atendimentos do paciente selecionado
  const [atendimentosPaciente, setAtendimentosPaciente] = useState<any[]>([]);
  
  // Adicione este novo estado após os outros estados no início do componente
  const [pacienteStatus, setPacienteStatus] = useState<Record<string, { status: string, ultimaData: string | null }>>({});
  
  // Estado para controlar o modal de edição de atendimento
  const [editarAtendimentoDialogOpen, setEditarAtendimentoDialogOpen] = useState(false);
  const [atendimentoParaEditar, setAtendimentoParaEditar] = useState<any>(null);
  
  // Formulário de busca
  const buscaForm = useForm<z.infer<typeof buscaPacienteSchema>>({
    resolver: zodResolver(buscaPacienteSchema),
    defaultValues: {
      termo: ''
    }
  });

  // Formulário de cadastro
  const cadastroForm = useForm<z.infer<typeof pacienteSchema>>({
    resolver: zodResolver(pacienteSchema),
    defaultValues: {
      nome: '',
      cpf: '',
      dataNascimento: '',
      genero: '',
      endereco: '',
      numero: '',
      bairro: '',
      municipio: '',
      telefone: '',
      email: '',
      escolaridade: '',
      rendaFamiliar: '',
      observacoes: '',
      naturalidade: '',
      estadoCivil: '',
      cargoOcupacao: '',
      orgao: ''
    }
  });

  // Formulário de atendimento
  const atendimentoForm = useForm<z.infer<typeof atendimentoSchema>>({
    resolver: zodResolver(atendimentoSchema),
    defaultValues: {
      dataAgendamento: '',
      hora: '',
      local: '',
      observacoes: ''
    }
  });

  // Form para novo atendimento
  const novoAtendimentoForm = useForm<z.infer<typeof novoAtendimentoSchema>>({
    resolver: zodResolver(novoAtendimentoSchema),
    defaultValues: {
      dataAgendamento: '',
      hora: '',
      local: '',
      observacoes: '',
      status: 'agendado'
    }
  });
  
  // Form para edição de atendimento
  const editarAtendimentoForm = useForm<z.infer<typeof novoAtendimentoSchema>>({
    resolver: zodResolver(novoAtendimentoSchema),
    defaultValues: {
      dataAgendamento: '',
      hora: '',
      local: '',
      observacoes: '',
      status: 'agendado'
    }
  });

  const [cpfExistente, setCpfExistente] = useState<boolean>(false);

  // Hook para gerenciar registros expandidos
  const [expandedRows, setExpandedRows] = useState<{[key: string]: boolean}>({});

  // Função para alternar a expansão de um grupo
  const toggleExpand = (id: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Agrupar pacientes por CPF e nome
  const agruparPacientesPorCpfENome = (pacientes: Paciente[]) => {
    const grupos: {[key: string]: Paciente[]} = {};
    
    pacientes.forEach(paciente => {
      // Chave de agrupamento: CPF+nome para garantir distinção
      const chave = `${paciente.cpf}-${paciente.nome}`;
      
      if (!grupos[chave]) {
        grupos[chave] = [];
      }
      
      grupos[chave].push(paciente);
    });
    
    return grupos;
  };

  // Funções para gerenciamento de pacientes
  
  // Buscar todos os pacientes (usado para inicialização)
  const fetchPacientes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/pessoas', {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status} ao buscar cadastros`);
      }
      
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setPacientes(data);
      } else {
        setPacientes([]);
        setError('Formato de resposta inválido');
      }
    } catch (e) {
      console.error('Erro ao carregar cadastros:', e);
      setError(`Erro ao carregar cadastros: ${e instanceof Error ? e.message : 'Erro desconhecido'}`);
      setPacientes([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Adicione esta função após a busca de pacientes para determinar o status de cada um
  const buscarStatusPacientes = async (pacientes: Paciente[]) => {
    const statusObj: Record<string, { status: string, ultimaData: string | null }> = {};
    
    // Para cada paciente, determinar o status
    for (const paciente of pacientes) {
      statusObj[paciente.id] = await determinarStatusPaciente(paciente.id);
    }
    
    setPacienteStatus(statusObj);
  };

  // Modifique a função buscarPacientes para chamar buscarStatusPacientes após obter os resultados
  const buscarPacientes = async (termo: string) => {
    setIsLoading(true);
    setError(null);
    console.log(`Iniciando busca para o termo: "${termo}"`);
    
    try {
      const response = await fetch(`/api/pessoas?termo=${encodeURIComponent(termo)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erro ${response.status} ao buscar cadastros`);
      }
      
      const pacientes = await response.json();
      console.log(`Resultados da API: ${pacientes.length} pacientes encontrados`);
      
      // Atualizar os pacientes buscados, mesmo que o array esteja vazio
      setPacientesBuscados(pacientes);
      
      // Após buscar pacientes, determinar o status de cada um
      if (pacientes.length > 0) {
        await buscarStatusPacientes(pacientes);
        console.log('Status dos pacientes atualizado');
      }
      
      if (pacientes.length === 0) {
        console.log('Nenhum paciente encontrado para o termo informado');
        setError('Nenhum cadastro encontrado para o termo informado');
      }
    } catch (error) {
      console.error('Erro ao buscar pacientes:', error);
      setError(`Erro ao buscar cadastros: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      setPacientesBuscados([]);
    } finally {
      console.log('Busca finalizada, isLoading definido como false');
      setIsLoading(false);
    }
  };

  // Verificar se CPF já existe
  const verificarCpfExistente = async (cpf: string): Promise<boolean> => {
    try {
      // Normaliza o CPF para remover pontos, traços e espaços
      const cpfNormalizado = cpf.replace(/\D/g, '');
      console.log(`Verificando CPF normalizado: ${cpfNormalizado}`);
      
      const response = await fetch(`/api/pessoas?termo=${encodeURIComponent(cpfNormalizado)}`, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status} ao verificar CPF`);
      }
      
      const data = await response.json();
      
      if (Array.isArray(data)) {
        // Verificar se algum dos resultados tem o CPF exato (após normalização)
        const encontrado = data.some(pessoa => {
          // Normaliza o CPF da pessoa para comparação
          const pessoaCpfNormalizado = pessoa.cpf.replace(/\D/g, '');
          const resultado = pessoaCpfNormalizado === cpfNormalizado;
          
          // Log para depuração
          if (resultado) {
            console.log(`CPF encontrado: ${pessoa.cpf} (${pessoa.nome})`);
          }
          
          return resultado;
        });
        
        console.log(`CPF ${cpfNormalizado} existe: ${encontrado}`);
        return encontrado;
      }
      
      return false;
    } catch (e) {
      console.error('Erro ao verificar CPF:', e);
      // Em caso de erro na verificação, permitimos continuar para não bloquear o usuário
      return false;
    }
  };

  // Função para validar CPF quando o usuário digitar
  const validarCpf = async (cpf: string) => {
    if (cpf.length < 11) {
      setCpfExistente(false);
      return;
    }
    
    console.log(`Validando CPF: ${cpf}`);
    const cpfExiste = await verificarCpfExistente(cpf);
    console.log(`CPF existe: ${cpfExiste}`);
    
    if (cpfExiste) {
      console.log('CPF já cadastrado, atualizando estado e exibindo erro');
      setCpfExistente(true);
      cadastroForm.setError('cpf', { 
        type: 'manual', 
        message: 'CPF já cadastrado no sistema. Busque o cadastro existente.' 
      });
    } else {
      setCpfExistente(false);
      // Limpar erro se CPF não existir
      cadastroForm.clearErrors('cpf');
    }
  };

  // Função para cadastrar paciente
  const cadastrarPaciente = async (data: z.infer<typeof pacienteSchema>) => {
    try {
      // Verificar se o CPF já existe antes de cadastrar
      const cpfExiste = await verificarCpfExistente(data.cpf);
      
      if (cpfExiste) {
        setCpfExistente(true);
        cadastroForm.setError('cpf', { 
          type: 'manual', 
          message: 'CPF já cadastrado no sistema. Busque o cadastro existente.' 
        });
        toast.error("Este CPF já existe no sistema. Utilize a busca para encontrar o cadastro existente.", {
          duration: 6000
        });
        return; // Interrompe o cadastro
      }
      
      setIsLoading(true);
      
      const response = await fetch('/api/pessoas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erro ${response.status} ao cadastrar`);
      }
      
      const responseData = await response.json();
      
      toast.success('Cadastro realizado com sucesso!');
      cadastroForm.reset();
      setCadastroDialogOpen(false);
      
      // Atualiza a lista de pacientes
      await fetchPacientes();
      
      // Seleciona o paciente recém-cadastrado
      if (responseData.data) {
        setPacienteSelecionado(responseData.data);
        setActiveTab('atendimento');
      }
      
    } catch (e) {
      console.error('Erro ao realizar cadastro:', e);
      setError(`Erro ao realizar cadastro: ${e instanceof Error ? e.message : 'Erro desconhecido'}`);
      toast.error(`Erro ao realizar cadastro: ${e instanceof Error ? e.message : 'Erro desconhecido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Agendar atendimento para paciente
  const agendarAtendimento = async (data: z.infer<typeof atendimentoSchema>) => {
    setIsLoading(true);
    setError(null);
    
    if (!pacienteSelecionado) {
      setError('Nenhum cadastro selecionado');
      toast.error('Selecione um cadastro antes de agendar');
      setIsLoading(false);
      return;
    }
    
    try {
      // Construir objeto com os dados atualizados do paciente
      const pacienteAtualizado = {
        ...pacienteSelecionado,
        dataAgendamento: data.dataAgendamento,
        hora: data.hora,
        local: data.local,
        observacoes: data.observacoes || pacienteSelecionado.observacoes
      };
      
      // Em uma implementação real, teríamos um endpoint específico para atendimentos
      // Por ora, vamos atualizar o paciente (embora isso não seja o ideal numa aplicação real)
      const response = await fetch(`/api/pessoas/${pacienteSelecionado.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(pacienteAtualizado)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erro ${response.status} ao agendar atendimento`);
      }
      
      toast.success('Atendimento agendado com sucesso!');
      
      // Fechar o modal antes de qualquer outra operação
      atendimentoForm.reset();
      setAtendimentoDialogOpen(false);
      
      // Atualiza a lista de pacientes
      await fetchPacientes();
      
      // Se havia uma busca ativa, refazer a busca para atualizar os resultados
      if (buscaForm.getValues().termo && buscaForm.getValues().termo.length >= 3) {
        await buscarPacientes(buscaForm.getValues().termo);
      }
      
      // Atualiza o paciente selecionado com os novos dados
      const pacienteAtualizado2 = await fetch(`/api/pessoas/${pacienteSelecionado.id}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache'
        }
      }).then(res => res.json()).then(data => {
        if (Array.isArray(data) && data.length > 0) {
          return data[0];
        }
        return data;
      });
      
      if (pacienteAtualizado2) {
        setPacienteSelecionado(pacienteAtualizado2);
      }
      
    } catch (e) {
      console.error('Erro ao agendar atendimento:', e);
      setError(`Erro ao agendar atendimento: ${e instanceof Error ? e.message : 'Erro desconhecido'}`);
      toast.error(`Erro ao agendar atendimento: ${e instanceof Error ? e.message : 'Erro desconhecido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Registrar um atendimento realizado
  const registrarAtendimento = async (pacienteId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const paciente = pacientes.find(p => p.id === pacienteId);
      
      if (!paciente) {
        throw new Error('Cadastro não encontrado');
      }
      
      // Em vez de atualizar o paciente, vamos criar um novo atendimento com status="realizado"
      const novoAtendimento = {
        pessoaId: pacienteId,
        dataAgendamento: new Date().toISOString().split('T')[0], // Data atual
        hora: format(new Date(), 'HH:mm'),
        local: paciente.local || 'Gabinete',
        observacoes: 'Atendimento registrado automaticamente',
        dataDoAtendimento: new Date().toISOString().split('T')[0],
        status: 'realizado'
      };
      
      // Salvar o novo atendimento usando a API de atendimentos
      const response = await fetch('/api/atendimentos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(novoAtendimento)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erro ${response.status} ao registrar atendimento`);
      }
      
      toast.success('Atendimento registrado com sucesso!', {
        duration: 6000,
        icon: '✅',
      });
      
      // Atualiza a lista de pacientes
      await fetchPacientes();
      
      // Se havia uma busca ativa, refazer a busca para atualizar os resultados
      if (buscaForm.getValues().termo && buscaForm.getValues().termo.length >= 3) {
        await buscarPacientes(buscaForm.getValues().termo);
      }
      
      // Atualiza o paciente selecionado e seus atendimentos
      if (pacienteSelecionado && pacienteSelecionado.id === pacienteId) {
        await buscarAtendimentosPaciente(pacienteId);
        
        // Atualizar o status do paciente
        const novoStatus = await determinarStatusPaciente(pacienteId);
        setPacienteStatus(prev => ({
          ...prev,
          [pacienteId]: novoStatus
        }));
      }
      
    } catch (error) {
      console.error('Erro ao registrar atendimento:', error);
      setError(`Erro ao registrar atendimento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      toast.error(`Erro ao registrar atendimento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Buscar atendimentos de um paciente específico
  const buscarAtendimentosPaciente = async (pacienteId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/atendimentos?pessoaId=${pacienteId}`);
      
      if (!response.ok) {
        throw new Error('Erro ao buscar atendimentos');
      }
      
      const atendimentos = await response.json();
      console.log(`Encontrados ${atendimentos.length} atendimentos para o paciente ${pacienteId}`);
      
      // Ordenar atendimentos por data (mais recentes primeiro)
      atendimentos.sort((a: any, b: any) => {
        if (!a.dataAgendamento) return 1;
        if (!b.dataAgendamento) return -1;
        return new Date(b.dataAgendamento).getTime() - new Date(a.dataAgendamento).getTime();
      });
      
      setAtendimentosPaciente(atendimentos);
      
      // Atualizar o status do paciente com base nos atendimentos
      const novoStatus = await determinarStatusPaciente(pacienteId);
      setPacienteStatus(prev => ({
        ...prev,
        [pacienteId]: novoStatus
      }));
      
      return atendimentos;
    } catch (error) {
      console.error('Erro ao buscar atendimentos:', error);
      setError('Erro ao buscar atendimentos');
      setAtendimentosPaciente([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar pacientes ao iniciar a página
  useEffect(() => {
    fetchPacientes();
  }, []);

  // Handlers para os formulários
  const handleBusca = (data: z.infer<typeof buscaPacienteSchema>) => {
    console.log('Iniciando busca com termo:', data.termo);
    if (!data.termo || data.termo.trim() === '') {
      setError('Digite um nome ou CPF para buscar');
      return;
    }
    buscarPacientes(data.termo);
  };

  const handleCadastro = (data: z.infer<typeof pacienteSchema>) => {
    cadastrarPaciente(data);
  };

  const handleAtendimento = (data: z.infer<typeof atendimentoSchema>) => {
    agendarAtendimento(data);
  };

  const formatarData = (dataString: string) => {
    if (!dataString) return '';
    try {
      return format(parseISO(dataString), 'dd/MM/yyyy', { locale: ptBR });
    } catch (error) {
      return dataString;
    }
  };
  
  // As funções abaixo foram movidas para depois de todas as funções auxiliares
  // para evitar problemas de referência
  
  const handleNovoAtendimento = (data: z.infer<typeof novoAtendimentoSchema>) => {
    criarNovoAtendimento(data);
  };

  const handleSelecionarPaciente = (paciente: Paciente) => {
    setPacienteSelecionado(paciente);
    atendimentoForm.reset();
    setAtendimentoDialogOpen(true);
  };
  
  const handleVisualizarHistorico = async (paciente: Paciente) => {
    setPacienteSelecionado(paciente);
    setIsLoading(true);
    
    try {
      // Buscar atendimentos do paciente
      await buscarAtendimentosPaciente(paciente.id);
    } catch (error) {
      console.error('Erro ao buscar atendimentos:', error);
    } finally {
      setIsLoading(false);
      // Abrir o modal de histórico
      setDetalhesDialogOpen(true);
    }
  };
  
  const handleNovoAtendimentoClick = async (paciente: Paciente) => {
    setPacienteSelecionado(paciente);
    setIsLoading(true);
    
    try {
      // Buscar atendimentos atuais do paciente para referência
      await buscarAtendimentosPaciente(paciente.id);
      
      // Resetar formulário
      novoAtendimentoForm.reset();
    } catch (error) {
      console.error('Erro ao buscar atendimentos:', error);
    } finally {
      setIsLoading(false);
      // Abrir o modal de novo atendimento
      setNovoAtendimentoDialogOpen(true);
    }
  };

  // Criar um novo atendimento para um paciente existente
  const criarNovoAtendimento = async (data: z.infer<typeof novoAtendimentoSchema>) => {
    setIsLoading(true);
    setError(null);
    
    if (!pacienteSelecionado) {
      setError('Nenhum cadastro selecionado');
      toast.error('Selecione um cadastro antes de agendar');
      setIsLoading(false);
      return;
    }
    
    try {
      // Construir objeto do novo atendimento
      const novoAtendimento = {
        ...data,
        pessoaId: pacienteSelecionado.id
      };
      
      // Salvar o novo atendimento
      const response = await fetch('/api/atendimentos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(novoAtendimento)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao criar atendimento');
      }
      
      const atendimentoCriado = await response.json();
      console.log('Novo atendimento criado:', atendimentoCriado);
      
      // Atualizar lista de atendimentos do paciente
      await buscarAtendimentosPaciente(pacienteSelecionado.id);
      
      // Atualizar status do paciente
      const novoStatus = await determinarStatusPaciente(pacienteSelecionado.id);
      setPacienteStatus(prev => ({
        ...prev,
        [pacienteSelecionado.id]: novoStatus
      }));
      
      // Atualizar paciente na busca se houver termo de busca
      if (buscaForm.getValues().termo) {
        await buscarPacientes(buscaForm.getValues().termo);
      } else {
        await fetchPacientes();
      }
      
      toast.success(`Atendimento agendado para ${formatarData(data.dataAgendamento)}`);
      
      // Resetar formulário e fechar modal
      novoAtendimentoForm.reset();
      setNovoAtendimentoDialogOpen(false);
    } catch (error) {
      console.error('Erro ao criar atendimento:', error);
      setError('Erro ao criar atendimento');
      toast.error('Ocorreu um erro ao agendar o atendimento');
    } finally {
      setIsLoading(false);
    }
  };

  // Função para determinar o status do paciente com base nos atendimentos
  const determinarStatusPaciente = async (pacienteId: string) => {
    try {
      // Buscar atendimentos do paciente na aba "atendimentos"
      const response = await fetch(`/api/atendimentos?pessoaId=${pacienteId}`);
      
      if (!response.ok) {
        console.error('Erro ao buscar atendimentos para status do paciente');
        return { status: 'pendente', ultimaData: null };
      }
      
      const atendimentos = await response.json();
      
      if (atendimentos.length === 0) {
        return { status: 'pendente', ultimaData: null };
      }
      
      // Verificar se existem atendimentos realizados
      const atendimentosRealizados = atendimentos.filter(
        (atendimento: any) => atendimento.status === 'realizado'
      );
      
      if (atendimentosRealizados.length > 0) {
        // Ordenar por data mais recente
        atendimentosRealizados.sort((a: any, b: any) => {
          return new Date(b.dataDoAtendimento || b.dataAgendamento).getTime() - 
                 new Date(a.dataDoAtendimento || a.dataAgendamento).getTime();
        });
        
        // Pegar o atendimento realizado mais recente
        const ultimoAtendimento = atendimentosRealizados[0];
        return { 
          status: 'atendido', 
          ultimaData: ultimoAtendimento.dataDoAtendimento || ultimoAtendimento.dataAgendamento 
        };
      }
      
      // Verificar se existem atendimentos agendados
      const atendimentosAgendados = atendimentos.filter(
        (atendimento: any) => atendimento.status === 'agendado'
      );
      
      if (atendimentosAgendados.length > 0) {
        // Ordenar por data mais próxima
        atendimentosAgendados.sort((a: any, b: any) => {
          return new Date(a.dataAgendamento).getTime() - new Date(b.dataAgendamento).getTime();
        });
        
        // Pegar o próximo agendamento
        const proximoAgendamento = atendimentosAgendados[0];
        return { 
          status: 'agendado', 
          ultimaData: proximoAgendamento.dataAgendamento 
        };
      }
      
      return { status: 'pendente', ultimaData: null };
    } catch (error) {
      console.error('Erro ao determinar status do paciente:', error);
      return { status: 'pendente', ultimaData: null };
    }
  };

  // Iniciar a edição de um atendimento
  const handleEditarAtendimento = (atendimento: any) => {
    setAtendimentoParaEditar(atendimento);
    
    // Preencher o formulário com os dados do atendimento
    editarAtendimentoForm.reset({
      dataAgendamento: atendimento.dataAgendamento || '',
      hora: atendimento.hora || '',
      local: atendimento.local || '',
      observacoes: atendimento.observacoes || '',
      status: atendimento.status || 'agendado'
    });
    
    // Fechar o modal de detalhes e abrir o de edição
    setDetalhesDialogOpen(false);
    setEditarAtendimentoDialogOpen(true);
  };

  // Salvar a edição de um atendimento
  const salvarEdicaoAtendimento = async (data: z.infer<typeof novoAtendimentoSchema>) => {
    setIsLoading(true);
    setError(null);
    
    if (!atendimentoParaEditar || !atendimentoParaEditar.id || !pacienteSelecionado) {
      setError('Atendimento não encontrado');
      toast.error('Erro ao editar atendimento');
      setIsLoading(false);
      return;
    }
    
    try {
      const dadosAtualizados = {
        ...atendimentoParaEditar,
        ...data
      };
      
      // Atualizar o atendimento
      const response = await fetch(`/api/atendimentos/${atendimentoParaEditar.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dadosAtualizados)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao atualizar atendimento');
      }
      
      const atendimentoAtualizado = await response.json();
      console.log('Atendimento atualizado:', atendimentoAtualizado);
      
      // Atualizar lista de atendimentos do paciente
      await buscarAtendimentosPaciente(pacienteSelecionado.id);
      
      // Atualizar status do paciente
      const novoStatus = await determinarStatusPaciente(pacienteSelecionado.id);
      setPacienteStatus(prev => ({
        ...prev,
        [pacienteSelecionado.id]: novoStatus
      }));
      
      toast.success('Atendimento atualizado com sucesso');
      
      // Resetar formulário e fechar modal
      editarAtendimentoForm.reset();
      setEditarAtendimentoDialogOpen(false);
      setAtendimentoParaEditar(null);
      
      // Reabrir o modal de detalhes
      setDetalhesDialogOpen(true);
    } catch (error) {
      console.error('Erro ao atualizar atendimento:', error);
      setError('Erro ao atualizar atendimento');
      toast.error('Ocorreu um erro ao atualizar o atendimento');
    } finally {
      setIsLoading(false);
    }
  };

  // Função para atualizar a saudação com base na hora
  const updateGreeting = () => {
    const currentHour = new Date().getHours();
    
    if (currentHour >= 5 && currentHour < 12) {
      setGreeting('Bom dia');
    } else if (currentHour >= 12 && currentHour < 18) {
      setGreeting('Boa tarde');
    } else {
      setGreeting('Boa noite');
    }
  };

  // Função para buscar dados do usuário
  const fetchUser = async () => {
    // Desabilitar logs globalmente para proteção de dados
    if (typeof window !== 'undefined') {
      disableConsoleLogging();
    }

    try {
      const userData = await getCurrentUser();
      if (userData) {
        setCurrentUser(userData);
        updateGreeting();
      }
    } catch (error) {
      // Erro silencioso - não exibir logs por segurança
      // Em caso de erro, podemos usar um usuário padrão ou redirecionar
    }
  };

  // Carregar informações do usuário
  useEffect(() => {
    fetchUser();
  }, []);

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
        icon: <BarChart size={20} className="text-white" />,
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
    // No contexto da página /acoes, mostramos todos os apps, já que o usuário provavelmente tem acesso
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

  // Renderização da página
  return (
    <div className="min-h-screen bg-white text-gray-800 flex flex-col md:flex-row">
      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Navbar interna do conteúdo */}
        <nav className="w-full bg-white border-b border-gray-100 shadow-sm">
          <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
            <div className="flex flex-col items-start">
              <span className="text-base md:text-lg font-semibold text-gray-900">Central de Leads</span>
              <span className="text-xs text-gray-500 font-light">Gestão de cadastros, atendimentos e pacientes do mutirão.</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/painel-aplicacoes')}
                className="flex items-center gap-1 text-gray-600 hover:text-blue-700 transition-colors px-3 py-1.5 rounded border border-gray-200"
              >
                <ChevronLeft className="h-5 w-5" />
                <span className="text-xs font-medium">Voltar</span>
              </Button>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 sm:px-4 py-4 w-full">
          {/* Botão de Novo Cadastro */}
          <div className="flex justify-end">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Button 
                onClick={() => {
                  setCadastroDialogOpen(true);
                  cadastroForm.reset();
                }}
                className="bg-blue-600 hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Cadastro
              </Button>
            </motion.div>
          </div>
          {/* Conteúdo principal - página inicial */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Tabs, busca, tabelas, etc. */}
            {/* ...restante do conteúdo principal permanece igual... */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              {/* ...tabs e conteúdo das abas... */}
            </Tabs>
          </motion.div>
        </main>
        <footer className="mt-auto p-3 text-center text-[10px] text-gray-400 font-light">
          © 2025 86 Dynamics - Todos os direitos reservados
        </footer>
      </div>
    </div>
  );
};

export default CentralLeadsPage; 