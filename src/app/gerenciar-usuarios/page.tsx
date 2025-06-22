'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Input,
  Select,
  Checkbox,
  Stack,
  Heading,
  useDisclosure,
  Table,
  Tbody,
  Thead,
  Tr,
  Th,
  Td,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useToast,
  Text,
  Flex,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Badge,
  HStack,
  IconButton,
  Tooltip,
} from '@chakra-ui/react';
import { ArrowLeft, LogOut, User as UserIcon, Plus, RefreshCw, Activity, Clock, Filter, ChevronLeft, ChevronRight, ShieldCheck, Home } from 'lucide-react';
import { disableConsoleLogging } from '@/lib/logger';
import { AdminRouteGuard } from '@/components/auth/RouteGuard';

interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  role: string;
  permissions: string[];
  active?: boolean;
}

interface UserActivity {
  id: number;
  user_id: number;
  action_type: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT';
  target_type: 'USER' | 'PATIENT' | 'SYSTEM';
  target_id?: number;
  details: string;
  ip_address?: string;
  timestamp: string;
  user_name?: string;
}

const availablePages = [
  { id: 'painel-aplicacoes', name: 'Portal de Aplicações', description: 'Página inicial do sistema' },
  { id: 'gerenciar-usuarios', name: 'Gerenciar Usuários', description: 'Gerenciamento de usuários e permissões' },
  { id: 'baseliderancas', name: 'Base de Lideranças', description: 'Gestão de lideranças e coordenação' },
  { id: 'emendas2025', name: 'Emendas 2025', description: 'Gestão de emendas parlamentares' },
  { id: 'projecao2026', name: 'Projeção 2026', description: 'Projeções e análises para 2026' },
  { id: 'instagram-analytics', name: 'Instagram Analytics', description: 'Análise de dados do Instagram' },
  { id: 'acoes', name: 'Campanhas de Positivação', description: 'Sistema de gerenciamento de campanhas' },
  { id: 'obras_demandas', name: 'Obras e Demandas', description: 'Controle de obras e demandas parlamentares' },
  { id: 'cadastro', name: 'Cadastro de Pacientes', description: 'Cadastro de pacientes para mutirão' },
  { id: 'pacientes', name: 'Lista de Pacientes', description: 'Gerenciamento de pacientes cadastrados' },
  { id: 'configuracoes', name: 'Configurações', description: 'Configurações do sistema' }
];

// Formatar data para exibição amigável
const formatDate = (dateString: string) => {
  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  };
  return new Date(dateString).toLocaleString('pt-BR', options);
};

// Mapear tipos de ação para cores e rótulos amigáveis
const getActionLabel = (actionType: UserActivity['action_type']) => {
  switch (actionType) {
    case 'CREATE':
      return { label: 'Criação', color: 'green' };
    case 'UPDATE':
      return { label: 'Edição', color: 'blue' };
    case 'DELETE':
      return { label: 'Exclusão', color: 'red' };
    case 'LOGIN':
      return { label: 'Login', color: 'purple' };
    case 'LOGOUT':
      return { label: 'Logout', color: 'orange' };
    default:
      return { label: actionType, color: 'gray' };
  }
};

// Mapear tipos de alvo para rótulos amigáveis
const getTargetLabel = (targetType: UserActivity['target_type']) => {
  switch (targetType) {
    case 'USER':
      return { label: 'Usuário', icon: '👤' };
    case 'PATIENT':
      return { label: 'Paciente', icon: '🏥' };
    case 'SYSTEM':
      return { label: 'Sistema', icon: '⚙️' };
    default:
      return { label: targetType, icon: '📄' };
  }
};

function GerenciarUsuarios() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
    permissions: [] as string[],
    active: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  // Estado para logs de atividade
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [activitiesPage, setActivitiesPage] = useState(1);
  const [activitiesPerPage] = useState(20);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  useEffect(() => {
    // Desabilitar logs globalmente para proteção de dados
    if (typeof window !== 'undefined') {
      disableConsoleLogging();
    }

    loadUsers();
    checkCurrentUser();
  }, [router, toast]);

  const checkCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth', {
        method: 'GET',
      });
      
      const data = await response.json();
      
      if (response.ok && data.isLoggedIn) {
        setCurrentUser(data.user);
      } else {
        // Se não estiver logado, redirecionar para a página de login
        toast({
          title: 'Sessão expirada',
          description: 'Por favor, faça login novamente',
          status: 'warning',
          duration: 5000
        });
        router.push('/');
      }
    } catch (error) {
      // Erro silencioso - não exibir logs por segurança
      // Em caso de erro, não redirecionar, mas exibir um aviso
      toast({
        title: 'Erro ao verificar sessão',
        description: 'Não foi possível verificar sua sessão atual',
        status: 'error',
        duration: 5000
      });
    }
  };

  const loadUsers = async () => {
    setIsLoading(true);
    setLoadError(null);
    
    try {
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Falha ao carregar usuários');
      
      const data = await response.json();
      // Usuários carregados - dados protegidos
      
      // Garantir que data seja um array
      if (Array.isArray(data)) {
        setUsers(data);
      } else {
        console.error('Dados de usuários recebidos não são um array:', data);
        setUsers([]);
        setLoadError('Os dados de usuários não estão no formato esperado');
        toast({
          title: 'Erro no formato dos dados',
          description: 'Os dados de usuários não estão no formato esperado.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      setUsers([]); // Garantir que users seja um array vazio em caso de erro
      setLoadError('Não foi possível carregar a lista de usuários');
      toast({
        title: 'Erro ao carregar usuários',
        description: 'Não foi possível carregar a lista de usuários.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Função para carregar logs de atividade
  const loadActivities = async () => {
    setLoadingActivities(true);
    try {
      const offset = (activitiesPage - 1) * activitiesPerPage;
      const response = await fetch(`/api/users?activities=true&limit=${activitiesPerPage}&offset=${offset}`);
      
      if (!response.ok) throw new Error('Falha ao carregar logs de atividade');
      
      const data = await response.json();
      if (Array.isArray(data)) {
        setActivities(data);
      } else {
        throw new Error('Dados de atividades não estão no formato esperado');
      }
    } catch (error) {
      console.error('Erro ao carregar logs de atividade:', error);
      toast({
        title: 'Erro ao carregar logs',
        description: 'Não foi possível carregar o histórico de atividades.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoadingActivities(false);
    }
  };

  // Carregar atividades quando a página mudar
  useEffect(() => {
    loadActivities();
  }, [activitiesPage]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    console.log(`Input alterado: ${name}, valor: ${value}, tipo: ${type}`);
    
    // Adicionar log especial para o checkbox 'active'
    if (name === 'active') {
      const checked = (e.target as HTMLInputElement).checked;
      console.log(`Checkbox 'active' marcado: ${checked}`);
    }

    // Tratar campos específicos
    if (name === 'active') {
      const isChecked = (e.target as HTMLInputElement).checked;
      console.log(`Definindo active para: ${isChecked} (tipo: ${typeof isChecked})`);
      
      setFormData(prevState => {
        const newState = {
          ...prevState,
          active: isChecked
        };
        console.log('Estado atualizado após active:', newState);
        return newState;
      });
    } else if (name === 'permissions') {
      // ... existing code for permissions ...
    } else if (type === 'checkbox') {
      // Para outros checkboxes genéricos, se houver
      const isChecked = (e.target as HTMLInputElement).checked;
      setFormData(prevState => ({
        ...prevState,
        [name]: isChecked
      }));
    } else {
      // Outros campos
      setFormData(prevState => ({
        ...prevState,
        [name]: value
      }));
    }
  };

  const handlePermissionChange = (pageId: string) => {
    setFormData((prev) => {
      const permissions = prev.permissions.includes(pageId)
        ? prev.permissions.filter((p) => p !== pageId)
        : [...prev.permissions, pageId];
      return { ...prev, permissions };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Garantir que as permissões sejam um array válido
      const validPermissions = Array.isArray(formData.permissions) 
        ? formData.permissions 
        : [];

      // Garantir que active seja um booleano
      const isActive = Boolean(formData.active);
      console.log('Status do usuário (active):', isActive);

      // Construir dados do usuário, garantindo que o ID seja um número
      const userData = selectedUser 
        ? {
            id: Number(selectedUser.id), // Garantir que o ID seja um número
            ...formData,
            active: isActive,
            permissions: validPermissions,
            ...(formData.password ? { password: formData.password } : {})
          }
        : {
            ...formData,
            active: isActive,
            permissions: validPermissions
          };

      console.log('Enviando dados de usuário:', userData);

      const response = await fetch('/api/users', {
        method: selectedUser ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const responseData = await response.json();
      console.log('Resposta do servidor:', responseData);

      if (!response.ok) {
        const errorMessage = responseData.error || 'Falha ao salvar usuário';
        const errorDetails = responseData.details || '';
        throw new Error(`${errorMessage}${errorDetails ? ': ' + errorDetails : ''}`);
      }

      // Atualizar sessão se o usuário atual foi modificado
      if (selectedUser && currentUser && selectedUser.id === currentUser.id) {
        await fetch('/api/auth', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          },
        });
      }

      await loadUsers();
      loadActivities(); // Recarregar logs após alterações
      handleCloseModal();
      toast({
        title: 'Sucesso',
        description: selectedUser ? 'Usuário atualizado com sucesso!' : 'Usuário criado com sucesso!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Não foi possível salvar o usuário.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Função auxiliar para converter valores de active para boolean
  const convertToBoolean = (value: any): boolean => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    if (typeof value === 'string') return value === '1' || value.toLowerCase() === 'true';
    return false;
  };

  const handleEdit = (user: User) => {
    console.log('Editando usuário:', user);
    console.log('Valor de active:', user.active, 'Tipo:', typeof user.active);
    
    setSelectedUser(user);
    const activeValue = convertToBoolean(user.active);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      permissions: Array.isArray(user.permissions) ? user.permissions : [],
      active: activeValue,
    });
    
    console.log('FormData após edição:', {
      ...user,
      active: activeValue
    });
    
    onOpen();
  };

  const handleDelete = async (userId: number) => {
    if (window.confirm('Tem certeza que deseja excluir este usuário?')) {
      try {
        const response = await fetch(`/api/users?id=${userId}`, {
          method: 'DELETE',
        });

        if (!response.ok) throw new Error('Falha ao excluir usuário');

        toast({
          title: 'Usuário excluído',
          status: 'success',
          duration: 3000,
        });
        await loadUsers();
        loadActivities(); // Recarregar logs após exclusão
      } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        toast({
          title: 'Erro ao excluir',
          description: 'Não foi possível excluir o usuário.',
          status: 'error',
          duration: 5000,
        });
      }
    }
  };

  const handleCloseModal = () => {
    setSelectedUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'user',
      permissions: [],
      active: false,
    });
    onClose();
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth', {
        method: 'DELETE',
      });
      
      if (response.ok) {
        router.push('/');
      }
    } catch (err) {
      console.error('Erro ao fazer logout:', err);
      toast({
        title: 'Erro',
        description: 'Erro ao fazer logout. Por favor, tente novamente.',
        status: 'error',
        duration: 5000,
      });
    }
  };

  const navigateBack = () => {
    router.push('/painel-aplicacoes');
  };

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

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col min-h-screen"
    >
      {/* Novo header com o design padronizado */}
      <header className="sticky top-0 z-10 bg-gradient-to-b from-black to-gray-500 text-white shadow-md p-4">
        <div className="container mx-auto px-2">
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <button
                  onClick={navigateBack}
                  className="p-1.5 hover:bg-black/30 rounded-full transition-colors"
                  title="Voltar"
                >
                  <ChevronLeft className="h-4 w-4 text-white" />
                </button>
                <button
                  onClick={() => router.push('/painel-aplicacoes')}
                  className="p-1.5 hover:bg-black/30 rounded-full transition-colors"
                  title="Página Inicial"
                >
                  <Home className="h-4 w-4 text-white" />
                </button>
                <div className="text-lg font-light text-white">Gerenciamento de Usuários</div>
              </div>
              <div className="text-gray-200 text-xs font-extralight ml-7">Deputado Federal Jadyel Alencar</div>
            </div>
            <div className="flex items-center gap-4">
              {/* Exibir informações do usuário logado */}
              {currentUser && (
                <div className="flex items-center space-x-2 bg-black/20 px-3 py-1 rounded-full border border-white/10 hover:bg-black/30 transition-colors">
                  <div className="bg-indigo-500/50 rounded-full p-1 relative">
                    <UserIcon className="h-3.5 w-3.5 text-white" />
                    <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-400 rounded-full border border-gray-800"></div>
                  </div>
                  <div>
                    <div className="text-xs text-white font-light flex items-center">
                      {greeting}, {currentUser.name}
                    </div>
                    <div className="text-[10px] text-gray-200 flex items-center font-extralight">
                      {currentUser.role === 'admin' ? (
                        <>
                          <ShieldCheck className="h-2.5 w-2.5 mr-1" /> 
                          Administrador
                        </>
                      ) : (
                        <>
                          <UserIcon className="h-2.5 w-2.5 mr-1" />
                          Usuário
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
              <button
                onClick={loadUsers}
                className="flex items-center gap-2 bg-black/20 hover:bg-black/30 text-white px-4 py-2 rounded-md transition-colors"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                <span className="text-xs font-extralight">Atualizar</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-black/20 hover:bg-black/30 text-white px-4 py-2 rounded-md transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span className="text-xs font-extralight">Sair</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <Container maxW="container.xl" py={6} flex="1">
        {loadError ? (
          <Box bg="red.50" p={4} borderRadius="md" mb={4}>
            <Text color="red.600">{loadError}</Text>
          </Box>
        ) : (
          <>
            <Flex justify="space-between" align="center" mb={6}>
              <Box>
                <Heading as="h2" size="lg" mb={1} fontWeight="semibold" color="gray.700">
                  Gestão de Acesso ao Sistema
                </Heading>
                <Text color="gray.500" fontSize="sm">
                  Gerencie usuários, permissões e visualize atividades no sistema
                </Text>
              </Box>
              <Button 
                leftIcon={<Plus size={16} />} 
                colorScheme="gray" 
                onClick={() => {
                  setSelectedUser(null);
                  setFormData({
                    name: '',
                    email: '',
                    password: '',
                    role: 'user',
                    permissions: [],
                    active: true,
                  });
                  onOpen();
                }}
                size="sm"
              >
                Novo Usuário
              </Button>
            </Flex>

            {/* Cards de estatísticas em formato compacto */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <Box className="bg-gradient-to-br from-gray-50 to-gray-100 shadow-sm rounded-xl transition-all border-0 p-4">
                <Flex align="center">
                  <div className="mr-4 bg-gradient-to-r from-gray-700/10 to-gray-600/10 p-2 rounded-lg">
                    <UserIcon className="h-5 w-5 text-gray-700 stroke-[1.5]" />
                  </div>
                  <div>
                    <Text className="text-xs text-gray-500 mb-0.5 font-medium">Total de Usuários</Text>
                    <Text className="text-2xl font-semibold text-gray-900">{users.length}</Text>
                  </div>
                </Flex>
              </Box>
              
              <Box className="bg-gradient-to-br from-gray-100 to-gray-200 shadow-sm rounded-xl transition-all border-0 p-4">
                <Flex align="center">
                  <div className="mr-4 bg-gradient-to-r from-gray-700/10 to-gray-600/10 p-2 rounded-lg">
                    <ShieldCheck className="h-5 w-5 text-gray-700 stroke-[1.5]" />
                  </div>
                  <div>
                    <Text className="text-xs text-gray-500 mb-0.5 font-medium">Administradores</Text>
                    <Text className="text-2xl font-semibold text-gray-900">
                      {users.filter(user => user.role === 'admin').length}
                    </Text>
                  </div>
                </Flex>
              </Box>
              
              <Box className="bg-gradient-to-br from-gray-50 to-gray-100 shadow-sm rounded-xl transition-all border-0 p-4">
                <Flex align="center">
                  <div className="mr-4 bg-gradient-to-r from-gray-700/10 to-gray-600/10 p-2 rounded-lg">
                    <Activity className="h-5 w-5 text-gray-700 stroke-[1.5]" />
                  </div>
                  <div>
                    <Text className="text-xs text-gray-500 mb-0.5 font-medium">Usuários Ativos</Text>
                    <Text className="text-2xl font-semibold text-gray-900">
                      {users.filter(user => user.active).length}
                    </Text>
                  </div>
                </Flex>
              </Box>
              
              <Box className="bg-gradient-to-br from-gray-100 to-gray-200 shadow-sm rounded-xl transition-all border-0 p-4">
                <Flex align="center">
                  <div className="mr-4 bg-gradient-to-r from-gray-700/10 to-gray-600/10 p-2 rounded-lg">
                    <Clock className="h-5 w-5 text-gray-700 stroke-[1.5]" />
                  </div>
                  <div>
                    <Text className="text-xs text-gray-500 mb-0.5 font-medium">Registros de Atividade</Text>
                    <Text className="text-2xl font-semibold text-gray-900">{activities.length}</Text>
                  </div>
                </Flex>
              </Box>
            </div>

            {/* Resto do conteúdo existente */}
            <Tabs variant="enclosed" colorScheme="gray">
              <TabList bg="gray.100" borderBottomColor="gray.300">
                <Tab 
                  _selected={{ bg: "gray.700", borderColor: "gray.600", borderBottomColor: "gray.700" }} 
                  color="gray.700"
                  _hover={{ bg: "gray.200" }}
                  borderColor="transparent"
                >
                  Usuários
                </Tab>
                <Tab 
                  _selected={{ bg: "gray.700", borderColor: "gray.600", borderBottomColor: "gray.700" }} 
                  color="gray.700"
                  _hover={{ bg: "gray.200" }}
                  borderColor="transparent"
                  onClick={() => loadActivities()}
                >
                  Logs de Atividade
                </Tab>
              </TabList>

              <TabPanels>
                {/* Painel de Usuários */}
                <TabPanel p={0} pt={4}>
                  {isLoading ? (
                    <div className="p-12 flex justify-center">
                      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-gray-600"></div>
                    </div>
                  ) : loadError ? (
                    <div className="p-12 text-center rounded-md bg-gray-100">
                      <Text color="red.500" mb={4}>{loadError}</Text>
                      <Button 
                        colorScheme="gray" 
                        onClick={loadUsers}
                        leftIcon={<RefreshCw size={18} />}
                      >
                        Tentar Novamente
                      </Button>
                    </div>
                  ) : users.length === 0 ? (
                    <div className="p-12 text-center rounded-md bg-gray-100">
                      <Text color="gray.600">Nenhum usuário cadastrado.</Text>
                    </div>
                  ) : (
                    <div className="bg-gray-100 rounded-xl overflow-hidden shadow-sm">
                      <Table variant="simple" size="md">
                        <Thead className="bg-gray-200">
                          <Tr>
                            <Th>Nome</Th>
                            <Th>Email</Th>
                            <Th>Função</Th>
                            <Th>Permissões</Th>
                            <Th>Status</Th>
                            <Th>Ações</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {users.map((user) => (
                            <Tr key={user.id} _hover={{ bg: 'gray.50' }}>
                              <Td>{user.name}</Td>
                              <Td>{user.email}</Td>
                              <Td>{user.role === 'admin' ? 'Administrador' : 'Usuário'}</Td>
                              <Td>
                                {Array.isArray(user.permissions) 
                                  ? user.permissions.length 
                                  : 0} páginas
                              </Td>
                              <Td>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  user.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {user.active ? 'Ativo' : 'Inativo'}
                                </span>
                                {!user.active && (
                                  <Text fontSize="xs" color="red.500" mt={1}>
                                    Usuário não pode fazer login
                                  </Text>
                                )}
                              </Td>
                              <Td>
                                <Button 
                                  size="sm" 
                                  colorScheme="blue" 
                                  mr={2} 
                                  onClick={() => handleEdit(user)}
                                >
                                  Editar
                                </Button>
                                <Button 
                                  size="sm" 
                                  colorScheme="red" 
                                  onClick={() => handleDelete(user.id)}
                                >
                                  Excluir
                                </Button>
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </div>
                  )}
                </TabPanel>

                {/* Painel de Logs de Atividade */}
                <TabPanel p={0} pt={4}>
                  <Box mb={4} bg="gray.100" p={3} borderRadius="md">
                    <Flex justifyContent="space-between" alignItems="center">
                      <Text color="gray.700" fontWeight="medium">
                        <Activity size={18} style={{ display: 'inline', marginRight: '6px' }} />
                        Registro de Atividades do Sistema
                      </Text>
                      <Button 
                        size="sm" 
                        leftIcon={<RefreshCw size={16} />} 
                        colorScheme="gray" 
                        onClick={loadActivities}
                        isLoading={loadingActivities}
                      >
                        Atualizar
                      </Button>
                    </Flex>
                  </Box>

                  {loadingActivities ? (
                    <div className="p-12 flex justify-center">
                      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-gray-600"></div>
                    </div>
                  ) : activities.length === 0 ? (
                    <div className="p-12 text-center rounded-md bg-gray-100">
                      <Text color="gray.600">Nenhuma atividade registrada.</Text>
                    </div>
                  ) : (
                    <>
                      <div className="bg-gray-100 rounded-xl overflow-hidden shadow-sm">
                        <Table variant="simple" size="md">
                          <Thead className="bg-gray-200">
                            <Tr>
                              <Th>Data/Hora</Th>
                              <Th>Usuário</Th>
                              <Th>Ação</Th>
                              <Th>Alvo</Th>
                              <Th>Detalhes</Th>
                              <Th>IP</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {activities.map((activity) => (
                              <Tr key={activity.id} _hover={{ bg: 'gray.50' }}>
                                <Td whiteSpace="nowrap">
                                  <HStack>
                                    <Clock size={14} />
                                    <Text>{formatDate(activity.timestamp)}</Text>
                                  </HStack>
                                </Td>
                                <Td>
                                  {activity.user_name || (activity.user_id ? `ID ${activity.user_id}` : 'Sistema')}
                                </Td>
                                <Td>
                                  <Badge 
                                    colorScheme={getActionLabel(activity.action_type).color}
                                    py={1} px={2} borderRadius="md"
                                  >
                                    {getActionLabel(activity.action_type).label}
                                  </Badge>
                                </Td>
                                <Td>
                                  <Flex alignItems="center" gap={2}>
                                    <Text>{getTargetLabel(activity.target_type).icon}</Text>
                                    <Text>{getTargetLabel(activity.target_type).label}</Text>
                                    {activity.target_id && (
                                      <Text fontSize="xs" color="gray.500">ID {activity.target_id}</Text>
                                    )}
                                  </Flex>
                                </Td>
                                <Td>
                                  <Text noOfLines={2}>{activity.details}</Text>
                                </Td>
                                <Td color="gray.500" fontSize="sm">
                                  {activity.ip_address || '-'}
                                </Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </div>

                      {/* Paginação */}
                      <Flex justifyContent="center" mt={4}>
                        <HStack>
                          <IconButton
                            aria-label="Página anterior"
                            icon={<ChevronLeft size={18} />}
                            colorScheme="gray"
                            variant="outline"
                            isDisabled={activitiesPage === 1}
                            onClick={() => setActivitiesPage(prev => Math.max(1, prev - 1))}
                          />
                          <Text>Página {activitiesPage}</Text>
                          <IconButton
                            aria-label="Próxima página"
                            icon={<ChevronRight size={18} />}
                            colorScheme="gray"
                            variant="outline"
                            onClick={() => setActivitiesPage(prev => prev + 1)}
                            isDisabled={activities.length < activitiesPerPage}
                          />
                        </HStack>
                      </Flex>
                    </>
                  )}
                </TabPanel>
              </TabPanels>
            </Tabs>

            {/* Modal para criar/editar usuário */}
            <Modal isOpen={isOpen} onClose={handleCloseModal} size="xl">
              <ModalOverlay backdropFilter="blur(10px)" />
              <ModalContent bg="white" borderColor="gray.200" borderWidth="1px">
                <ModalHeader bg="gray.100" borderTopRadius="md">
                  {selectedUser ? 'Editar Usuário' : 'Novo Usuário'}
                </ModalHeader>
                <ModalCloseButton />
                <form onSubmit={handleSubmit}>
                  <ModalBody>
                    <Stack spacing={4}>
                      <FormControl isRequired>
                        <FormLabel>Nome</FormLabel>
                        <Input
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="Digite o nome do usuário"
                          borderColor="gray.300"
                          _hover={{ borderColor: "gray.400" }}
                          _focus={{ borderColor: "gray.500", boxShadow: "0 0 0 1px #718096" }}
                        />
                      </FormControl>

                      <FormControl isRequired>
                        <FormLabel>Email</FormLabel>
                        <Input
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="Digite o email do usuário"
                          borderColor="gray.300"
                          _hover={{ borderColor: "gray.400" }}
                          _focus={{ borderColor: "gray.500", boxShadow: "0 0 0 1px #718096" }}
                        />
                      </FormControl>

                      <FormControl isRequired={!selectedUser}>
                        <FormLabel>{selectedUser ? 'Nova Senha (opcional)' : 'Senha'}</FormLabel>
                        <Input
                          name="password"
                          type="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          placeholder={selectedUser ? 'Digite para alterar a senha' : 'Digite a senha'}
                          borderColor="gray.300"
                          _hover={{ borderColor: "gray.400" }}
                          _focus={{ borderColor: "gray.500", boxShadow: "0 0 0 1px #718096" }}
                        />
                      </FormControl>

                      <FormControl isRequired>
                        <FormLabel>Função</FormLabel>
                        <Select
                          name="role"
                          value={formData.role}
                          onChange={handleInputChange}
                          borderColor="gray.300"
                          _hover={{ borderColor: "gray.400" }}
                          _focus={{ borderColor: "gray.500", boxShadow: "0 0 0 1px #718096" }}
                        >
                          <option value="user">Usuário</option>
                          <option value="admin">Administrador</option>
                        </Select>
                      </FormControl>

                      <div className="flex flex-col mt-4">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="active"
                            name="active"
                            className="h-5 w-5 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
                            checked={Boolean(formData.active)}
                            onChange={handleInputChange}
                          />
                          <label htmlFor="active" className="ml-2 block text-sm text-gray-900">
                            Usuário ativo
                          </label>
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                          {formData.active 
                            ? "Usuário terá acesso ao sistema."
                            : "Usuário NÃO terá acesso ao sistema."}
                        </p>
                      </div>

                      <FormControl>
                        <FormLabel>Permissões de Acesso</FormLabel>
                        <Box maxH="200px" overflowY="auto" p={4} bg="gray.50" borderColor="gray.300" borderWidth="1px" borderRadius="md">
                          <Stack spacing={2}>
                            {availablePages.map((page) => (
                              <Checkbox
                                key={page.id}
                                isChecked={formData.permissions.includes(page.id)}
                                onChange={() => handlePermissionChange(page.id)}
                                colorScheme="gray"
                              >
                                <Box>
                                  <Text fontWeight="medium">{page.name}</Text>
                                  <Text fontSize="sm" color="gray.500">{page.description}</Text>
                                </Box>
                              </Checkbox>
                            ))}
                          </Stack>
                        </Box>
                      </FormControl>
                    </Stack>
                  </ModalBody>

                  <ModalFooter bg="gray.50">
                    <Button variant="outline" borderColor="gray.300" mr={3} onClick={handleCloseModal}>
                      Cancelar
                    </Button>
                    <Button type="submit" colorScheme="gray">
                      {selectedUser ? 'Salvar Alterações' : 'Criar Usuário'}
                    </Button>
                  </ModalFooter>
                </form>
              </ModalContent>
            </Modal>
          </>
        )}
      </Container>
    </motion.div>
  );
}

export default function GerenciarUsuariosPage() {
  return (
    <AdminRouteGuard>
      <GerenciarUsuarios />
    </AdminRouteGuard>
  );
} 