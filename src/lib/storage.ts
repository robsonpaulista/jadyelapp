import { Patient, PersonAtendida, UserAuth, Campaign, CampaignType } from './types';
import { clearInstagramConfig } from './instagramApi';

// Storage keys
const PATIENTS_KEY = 'mutirao_catarata_patients';
const USERS_KEY = 'dbUsers';
const LS_CAMPAIGNS_KEY = 'dynamicsDb_campaigns';
const LS_CAMPAIGN_TYPES_KEY = 'dynamicsDb_campaignTypes';
const EMENDAS_KEY = 'dbEmendas';

// Local Storage keys
const USER_KEY = 'authUser';
const APPLICATIONS_KEY = 'dbApplications';
const PERMISSIONS_KEY = 'dbPermissions';

// Tipos
export type Role = 'admin' | 'manager' | 'user' | 'attendant';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  active?: boolean;
  createdAt: string;
}

export interface Application {
  id: string;
  name: string;
  description: string;
  icon: string;
  href: string;
  isActive: boolean;
}

export interface Permission {
  userId: string;
  applicationId: string;
  canAccess: boolean;
  canEdit: boolean;
}

// Helper para verificar se estamos no navegador
const isBrowser = () => typeof window !== 'undefined';

export interface Emenda {
  id: string;
  emenda: string;
  classificacao_emenda: string;
  tipo: string;
  cnpj_beneficiario: string;
  municipio: string;
  objeto: string;
  gnd: string;
  nroproposta: string;
  portaria_convenio: string;
  ordemprioridade: string;
  objeto_obra: string;
  elaboracao: string;
  valor_indicado: number;
  alteracao: string;
  empenho: string;
  valor_empenho: number;
  dataempenho: string;
  valoraempenhar: number;
  pagamento: string;
  valorpago: number;
  valoraserpago: number;
  status_situacao: string;
}

const STORAGE_KEYS = {
  // ... existing keys ...
  EMENDAS: 'emendas'
};

// Funções de inicialização do storage

// Initialize storage (to be called on app start)
export function initializeStorage() {
  if (!isBrowser()) return;
  
  initializeDemoUsers();

  // Initialize all patients data if not already initialized
  if (!localStorage.getItem(PATIENTS_KEY)) {
    localStorage.setItem(PATIENTS_KEY, JSON.stringify([]));
  }
  
  // Initialize campaigns if not already initialized
  getAllCampaigns();
  
  // Initialize campaign types if not already initialized
  getAllCampaignTypes();
  
  // Manter usuário admin logado durante desenvolvimento
  if (!localStorage.getItem('isLoggedIn')) {
    const users = getUsers();
    if (users.length > 0) {
      localStorage.setItem(USER_KEY, JSON.stringify(users[0]));
      localStorage.setItem('isLoggedIn', 'true');
      console.log("Usuário de desenvolvimento logado automaticamente:", users[0].email);
    }
  }
}

// Inicializar usuários de demonstração
export const initializeDemoUsers = (): void => {
  if (!isBrowser()) return;
  
  // Verifica se já existem usuários
  const users = getUsers();
  if (users.length === 0) {
    // Adiciona usuários padrão
    const defaultUsers: User[] = [
    {
      id: '1',
        name: 'Administrador',
      email: 'admin@exemplo.com',
      password: '123456',
      role: 'admin',
      active: true,
      createdAt: new Date().toISOString()
    },
    {
      id: '2',
        name: 'Atendente',
      email: 'atendente@exemplo.com',
      password: '123456',
      role: 'attendant',
      active: true,
      createdAt: new Date().toISOString()
      },
      {
        id: '3',
        name: 'Usuário',
        email: 'usuario@exemplo.com',
        password: '123456',
        role: 'user',
        active: true,
        createdAt: new Date().toISOString()
      }
    ];
    
    localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
    
    // Mantém o primeiro usuário (admin) logado para facilitar o desenvolvimento
    localStorage.setItem(USER_KEY, JSON.stringify(defaultUsers[0]));
    localStorage.setItem('isLoggedIn', 'true');
  }
  
  // Verifica se já existem aplicações
  const apps = getApplications();
  if (apps.length === 0) {
    // Adiciona aplicações padrão
    const defaultApps: Application[] = [
      {
        id: '1',
        name: 'Portal de Aplicações',
        description: 'Central de Gestão de Atendimentos',
        icon: 'layout-dashboard',
        href: '/painel-aplicacoes',
        isActive: true
      },
      {
        id: '2',
        name: 'Gerenciar Usuários',
        description: 'Cadastro e controle de usuários',
        icon: 'users',
        href: '/usuarios',
        isActive: true
      },
      {
        id: '3',
        name: 'Base de Lideranças',
        description: 'Organograma de Lideranças 2026',
        icon: 'Users',
        href: '/baseliderancas',
        isActive: true
      },
      {
        id: '4',
        name: 'Emendas 2025',
        description: 'Gerenciamento de Emendas',
        icon: 'file-text',
        href: '/emendas2025',
        isActive: true
      },
      {
        id: '5',
        name: 'Projeção 2026',
        description: 'Projeção de Votos 2026',
        icon: 'bar-chart',
        href: '/projecao2026',
        isActive: true
      },
      {
        id: '6',
        name: 'Instagram Analytics',
        description: 'Análise de Dados do Instagram',
        icon: 'instagram',
        href: '/instagram-analytics',
        isActive: true
      },
      {
        id: '7',
        name: 'Ações',
        description: 'Gerenciamento de Ações',
        icon: 'target',
        href: '/acoes',
        isActive: true
      },
      {
        id: '8',
        name: 'Pacientes',
        description: 'Gerenciamento de Pacientes',
        icon: 'users',
        href: '/pacientes',
        isActive: true
      },
      {
        id: '9',
        name: 'Emendas',
        description: 'Gestão de Emendas',
        icon: 'file-text',
        href: '/emendas',
        isActive: true
      }
    ];
    
    localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(defaultApps));
  }
  
  // Verifica se já existem permissões
  const permissions = getPermissions();
  if (permissions.length === 0) {
    // Adiciona permissões padrão
    
    // Admin tem acesso a tudo
    const adminPermissions: Permission[] = Array(13).fill(0).map((_, i) => ({
      userId: '1',
      applicationId: (i + 1).toString(),
      canAccess: true,
      canEdit: true
    }));
    
    // Atendente tem acesso limitado
    const attendantPermissions: Permission[] = [
      {
        userId: '2',
        applicationId: '1', // Portal de Aplicações
        canAccess: true,
        canEdit: false
      },
      {
        userId: '2',
        applicationId: '7', // Ações
        canAccess: true,
        canEdit: true
      },
      {
        userId: '2',
        applicationId: '8', // Tipos de Ação
        canAccess: true,
        canEdit: false
      },
      {
        userId: '2',
        applicationId: '9', // Pessoas
        canAccess: true,
        canEdit: true
      }
    ];
    
    // Usuário comum tem acesso muito limitado
    const userPermissions: Permission[] = [
      {
        userId: '3',
        applicationId: '1', // Portal de Aplicações
        canAccess: true,
        canEdit: false
      },
      {
        userId: '3',
        applicationId: '10', // Relatórios
        canAccess: true,
        canEdit: false
      }
    ];
    
    const allPermissions = [...adminPermissions, ...attendantPermissions, ...userPermissions];
    localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(allPermissions));
  }
};

// Funções para gerenciar campanhas e tipos de campanhas

// Campaign Type Functions
export function getAllCampaignTypes(): CampaignType[] {
  if (!isBrowser()) return [];
  
  const campaignTypesJson = localStorage.getItem(LS_CAMPAIGN_TYPES_KEY);
  
  if (!campaignTypesJson) {
    // Initialize with default campaign types if none exist
    const defaultCampaignTypes: CampaignType[] = [
      {
        id: '1',
        name: 'Portal de Aplicações',
        description: 'Ações do Portal de Aplicações',
        color: '#4F46E5', // Indigo
        active: true,
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        name: 'Campanha de Conscientização',
        description: 'Campanhas educativas e de conscientização',
        color: '#10B981', // Emerald
        active: true,
        createdAt: new Date().toISOString()
      },
      {
        id: '3',
        name: 'Atendimento Social',
        description: 'Ações de atendimento social e assistência',
        color: '#F59E0B', // Amber
        active: true,
        createdAt: new Date().toISOString()
      }
    ];
    
    localStorage.setItem(LS_CAMPAIGN_TYPES_KEY, JSON.stringify(defaultCampaignTypes));
    return defaultCampaignTypes;
  }
  
  return JSON.parse(campaignTypesJson);
}

export function getCampaignTypeById(id: string): CampaignType | undefined {
  const campaignTypes = getAllCampaignTypes();
  return campaignTypes.find(type => type.id === id);
}

export function saveCampaignType(campaignType: CampaignType): void {
  if (!isBrowser()) return;
  
  const campaignTypes = getAllCampaignTypes();
  const index = campaignTypes.findIndex(type => type.id === campaignType.id);
  
  if (index !== -1) {
    // Update existing type
    campaignTypes[index] = campaignType;
  } else {
    // Add new type
    campaignTypes.push(campaignType);
  }
  
  localStorage.setItem(LS_CAMPAIGN_TYPES_KEY, JSON.stringify(campaignTypes));
}

export function deleteCampaignType(id: string): void {
  if (!isBrowser()) return;
  
  // Check if this type is being used by any campaigns
  const campaigns = getAllCampaigns();
  const inUse = campaigns.some(campaign => campaign.type === id);
  
  if (inUse) {
    throw new Error('Não é possível excluir este tipo pois está sendo usado em campanhas ativas.');
  }
  
  const campaignTypes = getAllCampaignTypes();
  const filteredTypes = campaignTypes.filter(type => type.id !== id);
  
  localStorage.setItem(LS_CAMPAIGN_TYPES_KEY, JSON.stringify(filteredTypes));
}

// Campaign Functions
export function getAllCampaigns(): Campaign[] {
  if (!isBrowser()) return [];
  
  const campaignsJson = localStorage.getItem(LS_CAMPAIGNS_KEY);
  
  if (!campaignsJson) {
    // Initialize with a default campaign if none exist
    const defaultCampaigns: Campaign[] = [
      {
        id: '1',
        name: 'Portal de Aplicações 2023',
        description: 'Portal de Aplicações para atendimento da população',
        type: '1', // Referencing the default campaign type with id '1'
        startDate: '2023-03-01',
        endDate: '2023-12-31',
        active: true,
        createdAt: new Date().toISOString()
      }
    ];
    
    localStorage.setItem(LS_CAMPAIGNS_KEY, JSON.stringify(defaultCampaigns));
    return defaultCampaigns;
  }
  
  return JSON.parse(campaignsJson);
}

export function getCampaignById(id: string): Campaign | undefined {
  const campaigns = getAllCampaigns();
  return campaigns.find(campaign => campaign.id === id);
}

export function saveCampaign(campaign: Campaign): void {
  if (!isBrowser()) return;
  
  const campaigns = getAllCampaigns();
  const index = campaigns.findIndex(c => c.id === campaign.id);
  
  if (index !== -1) {
    // Update existing campaign
    campaigns[index] = campaign;
  } else {
    // Add new campaign
    campaigns.push(campaign);
  }
  
  localStorage.setItem(LS_CAMPAIGNS_KEY, JSON.stringify(campaigns));
}

export function deleteCampaign(id: string): void {
  if (!isBrowser()) return;
  
  // Check if this campaign is being used by any patients
  const patients = getAllPatients();
  const inUse = patients.some(patient => patient.campaignId === id);
  
  if (inUse) {
    throw new Error('Não é possível excluir esta ação pois está associada a pessoas atendidas.');
  }
  
  const campaigns = getAllCampaigns();
  const filteredCampaigns = campaigns.filter(campaign => campaign.id !== id);
  
  localStorage.setItem(LS_CAMPAIGNS_KEY, JSON.stringify(filteredCampaigns));
}

// User Management Functions

// Patient/PersonAtendida Methods
export const getAllPatients = (): PersonAtendida[] => {
  if (!isBrowser()) return [];
  
  const patients = localStorage.getItem(PATIENTS_KEY);
  return patients ? JSON.parse(patients) : [];
};

export const getPatientById = (id: string): PersonAtendida | null => {
  if (!isBrowser()) return null;
  
  const patients = getAllPatients();
  return patients.find(patient => patient.id === id) || null;
};

export const savePatient = (patient: PersonAtendida): void => {
  if (!isBrowser()) return;
  
  const patients = getAllPatients();
  
  // Check if patient exists to update or add new
  const index = patients.findIndex(p => p.id === patient.id);
  
  if (index >= 0) {
    patients[index] = { ...patient, updatedAt: new Date().toISOString() };
  } else {
    patients.push({
      ...patient,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }
  
  localStorage.setItem(PATIENTS_KEY, JSON.stringify(patients));
};

export const deletePatient = (id: string): void => {
  if (!isBrowser()) return;
  
  const patients = getAllPatients();
  const filtered = patients.filter(patient => patient.id !== id);
  localStorage.setItem(PATIENTS_KEY, JSON.stringify(filtered));
};

// User Methods
export const getAllUsers = (): UserAuth[] => {
  if (!isBrowser()) return [];
  
  const users = localStorage.getItem(USERS_KEY);
  return users ? JSON.parse(users) : [];
};

export const getUserById = (id: string): UserAuth | null => {
  if (!isBrowser()) return null;
  
  const users = getAllUsers();
  return users.find(user => user.id === id) || null;
};

// Função para buscar um usuário por email
export const getUserByEmail = (email: string): User | null => {
  const users = getUsers();
  return users.find(user => user.email.toLowerCase() === email.toLowerCase()) || null;
};

// Função para obter todos os usuários
export const getUsers = (): User[] => {
  if (!isBrowser()) return [];
  const usersJson = localStorage.getItem(USERS_KEY);
  return usersJson ? JSON.parse(usersJson) : [];
};

// Função para verificar login
export const checkLogin = (email: string, password: string): boolean => {
  if (!isBrowser()) return false;
  
  // Obter usuários
  const users = getUsers();
  
  // Encontrar usuário com email e senha correspondentes
  const user = users.find(u => 
    u.email.toLowerCase() === email.toLowerCase() && 
    u.password === password
  );
  
  if (user) {
    // Guardar usuário autenticado
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    localStorage.setItem('isLoggedIn', 'true');
    return true;
  }
  
  return false;
};

// Função para verificar se usuário está logado
export const isUserLoggedIn = (): boolean => {
  if (!isBrowser()) return false;
  
  return localStorage.getItem('isLoggedIn') === 'true';
};

// Obter o usuário atual
export const getCurrentUser = (): User | null => {
  if (!isBrowser()) return null;
  
  try {
    const userJson = localStorage.getItem(USER_KEY);
    if (!userJson) return null;
    
    const user = JSON.parse(userJson);
    return user;
  } catch (error) {
    console.error('Erro ao obter usuário:', error);
    return null;
  }
};

// Função de logout
export const logout = (): void => {
  if (!isBrowser()) return;
  
  // Limpar dados de autenticação
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem('userAuthenticated');
  
  // Limpar qualquer configuração do Instagram
  clearInstagramConfig();
  
  console.log('[Storage] Logout realizado com sucesso');
};

// Obtém todas as aplicações
export const getApplications = (): Application[] => {
  if (!isBrowser()) return [];
  
  const appsJson = localStorage.getItem(APPLICATIONS_KEY);
  if (!appsJson) return [];
  
  return JSON.parse(appsJson) as Application[];
};

// Adiciona ou atualiza uma aplicação
export const saveApplication = (app: Application): void => {
  if (!isBrowser()) return;
  
  const apps = getApplications();
  const index = apps.findIndex(a => a.id === app.id);
  
  if (index >= 0) {
    // Atualiza aplicação existente
    apps[index] = app;
  } else {
    // Adiciona nova aplicação
    apps.push(app);
  }
  
  localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(apps));
};

// Remove uma aplicação
export const deleteApplication = (appId: string): void => {
  if (!isBrowser()) return;
  
  const apps = getApplications();
  const newApps = apps.filter(a => a.id !== appId);
  
  localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(newApps));
  
  // Remove também as permissões associadas
  const permissions = getPermissions();
  const newPermissions = permissions.filter(p => p.applicationId !== appId);
  
  localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(newPermissions));
};

// Obtém todas as permissões
export const getPermissions = (): Permission[] => {
  if (!isBrowser()) return [];
  
  const permissionsJson = localStorage.getItem(PERMISSIONS_KEY);
  if (!permissionsJson) return [];
  
  return JSON.parse(permissionsJson) as Permission[];
};

// Adiciona ou atualiza uma permissão
export const savePermission = (permission: Permission): void => {
  if (!isBrowser()) return;
  
  const permissions = getPermissions();
  const index = permissions.findIndex(
    p => p.userId === permission.userId && p.applicationId === permission.applicationId
  );
  
  if (index >= 0) {
    // Atualiza permissão existente
    permissions[index] = permission;
  } else {
    // Adiciona nova permissão
    permissions.push(permission);
  }
  
  localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(permissions));
};

// Remove uma permissão
export const deletePermission = (userId: string, applicationId: string): void => {
  if (!isBrowser()) return;
  
  const permissions = getPermissions();
  const newPermissions = permissions.filter(
    p => !(p.userId === userId && p.applicationId === applicationId)
  );
  
  localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(newPermissions));
};

// Obtém as aplicações que um usuário tem permissão de acesso
export const getUserApplications = (userId: string): Application[] => {
  if (!isBrowser()) return [];
  
  const permissions = getPermissions();
  const userPermissions = permissions.filter(p => p.userId === userId && p.canAccess);
  
  const apps = getApplications();
  return apps.filter(app => 
    app.isActive && userPermissions.some(p => p.applicationId === app.id)
  );
};

// Verifica se usuário tem permissão para uma aplicação específica
export const hasApplicationPermission = (userId: string, applicationId: string, checkEdit = false): boolean => {
  if (!isBrowser()) return false;
  
  const permissions = getPermissions();
  const permission = permissions.find(
    p => p.userId === userId && p.applicationId === applicationId
  );
  
  if (!permission) return false;
  
  return checkEdit ? permission.canEdit : permission.canAccess;
};

// Alias para checkLogin para compatibilidade
export const getCampaigns = getAllCampaigns;

// Interface para os pacientes simplificados usados na estatística
interface SimplePatient {
  id: string;
  name: string;
  createdAt: string;
  surgeryDate?: string;
  surgeryPerformedDate?: string;
}

// Função auxiliar para calcular idade
function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}

export function getPatientStatistics(campaignId?: string) {
  const patients = getAllPatients();
  const filteredPatients = campaignId 
    ? patients.filter(p => p.campaignId === campaignId)
    : patients;

  // Contadores para gênero
  let male = 0;
  let female = 0;
  let other = 0;

  // Contadores para procedimentos
  let completedProcedures = 0;
  let scheduledProcedures = 0;

  // Contadores para grupos de idade
  const ageGroups = {
    '0-18': 0,
    '19-30': 0,
    '31-50': 0,
    '51-70': 0,
    '71+': 0
  };

  // Contadores para renda
  const incomeGroups = {
    'Até 1 salário mínimo': 0,
    '1-2 salários mínimos': 0,
    '2-3 salários mínimos': 0,
    '3-5 salários mínimos': 0,
    'Mais de 5 salários mínimos': 0
  };

  // Contadores para escolaridade
  const educationGroups = {
    'Analfabeto': 0,
    'Ensino Fundamental Completo': 0,
    'Ensino Médio Completo': 0,
    'Ensino Superior Completo': 0,
    'Pós-graduação': 0
  };

  // Contadores para cidade e bairro
  const cityCounts: { [key: string]: number } = {};
  const cityNeighborhoodMap: { 
    [city: string]: { 
      [neighborhood: string]: SimplePatient[] 
    } 
  } = {};

  // Processar cada paciente
  filteredPatients.forEach(patient => {
    // Contagem por gênero
    switch (patient.gender) {
      case 'M':
        male++;
        break;
      case 'F':
        female++;
        break;
      default:
        other++;
    }

    // Contagem de procedimentos
    if (patient.surgeryPerformedDate) {
      completedProcedures++;
    }
    if (patient.surgeryDate) {
      scheduledProcedures++;
    }

    // Contagem por idade
    if (patient.birthDate) {
      const age = calculateAge(patient.birthDate);
      if (age <= 18) ageGroups['0-18']++;
      else if (age <= 30) ageGroups['19-30']++;
      else if (age <= 50) ageGroups['31-50']++;
      else if (age <= 70) ageGroups['51-70']++;
      else ageGroups['71+']++;
    }

    // Contagem por renda
    if (patient.income && patient.income in incomeGroups) {
      incomeGroups[patient.income as keyof typeof incomeGroups]++;
    }

    // Contagem por escolaridade
    if (patient.education && patient.education in educationGroups) {
      educationGroups[patient.education as keyof typeof educationGroups]++;
    }

    // Contagem por cidade e bairro
    if (patient.address?.city) {
      const city = patient.address.city;
      const neighborhood = patient.address.neighborhood || 'Não informado';
      
      // Para o gráfico de cidades
      cityCounts[city] = (cityCounts[city] || 0) + 1;
      
      // Para o agrupamento cidade/bairro
      if (!cityNeighborhoodMap[city]) {
        cityNeighborhoodMap[city] = {};
      }
      
      if (!cityNeighborhoodMap[city][neighborhood]) {
        cityNeighborhoodMap[city][neighborhood] = [];
      }
      
      cityNeighborhoodMap[city][neighborhood].push({
        id: patient.id,
        name: patient.name,
        createdAt: patient.createdAt,
        surgeryDate: patient.surgeryDate,
        surgeryPerformedDate: patient.surgeryPerformedDate
      });
    }
  });

  // Converter contadores em arrays para os gráficos
  const ageData = Object.entries(ageGroups).map(([name, value]) => ({
    name,
    value
  }));

  const incomeData = Object.entries(incomeGroups).map(([name, value]) => ({
    name,
    value
  }));

  const educationData = Object.entries(educationGroups).map(([name, value]) => ({
    name,
    value
  }));

  // Converter dados de cidade para array
  const cityData = Object.entries(cityCounts).map(([name, value]) => ({
    name,
    value
  })).sort((a, b) => b.value - a.value);

  // Organizar dados de cidade/bairro
  const cityNeighborhoodsArray = Object.entries(cityNeighborhoodMap).map(([city, neighborhoods]) => ({
    city,
    neighborhoods: Object.entries(neighborhoods).map(([name, patients]) => ({
      name,
      patients
    })).sort((a, b) => b.patients.length - a.patients.length)
  })).sort((a, b) => {
    const totalA = a.neighborhoods.reduce((sum, n) => sum + n.patients.length, 0);
    const totalB = b.neighborhoods.reduce((sum, n) => sum + n.patients.length, 0);
    return totalB - totalA;
  });

  return {
    total: filteredPatients.length,
    male,
    female,
    other,
    completedProcedures,
    scheduledProcedures,
    ageGroups: ageData,
    incomeData,
    educationData,
    cities: cityData,
    cityNeighborhoods: cityNeighborhoodsArray
  };
}

// Export patient data to CSV
export function exportPatientsToCSV(): string {
  const patients = getAllPatients();
  const headers = [
    'ID',
    'Nome',
    'Data de Nascimento',
    'Gênero',
    'Endereço',
    'Número',
    'Complemento',
    'Bairro',
    'Cidade',
    'Estado',
    'CEP',
    'Telefone',
    'Email',
    'Ação',
    'Data de Cadastro',
    'Data de Atualização',
    'Renda',
    'Escolaridade',
    'Data do Atendimento',
    'Data de Realização'
  ];

  const rows = patients.map(patient => [
    patient.id,
    patient.name,
    patient.birthDate,
    patient.gender,
    patient.address.street,
    patient.address.number,
    '',
    patient.address.neighborhood,
    patient.address.city,
    patient.address.state,
    patient.address.zipCode,
    patient.contact.phone,
    patient.contact.email || '',
    patient.campaignId,
    patient.createdAt,
    patient.updatedAt || '',
    patient.income || '',
    patient.education || '',
    patient.surgeryDate || '',
    patient.surgeryPerformedDate || ''
  ]);

  return [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');
}

// Função para gerar o relatório de uma Ação específica em CSV
export function exportCampaignReportToCSV(campaignId: string): string {
  const patients = getAllPatients().filter(p => p.campaignId === campaignId);
  const campaign = getCampaignById(campaignId);
  
  if (!campaign) {
    throw new Error('Campanha não encontrada');
  }

  const headers = [
    'ID',
    'Nome',
    'Data de Nascimento',
    'Gênero',
    'Endereço',
    'Número',
    'Complemento',
    'Bairro',
    'Cidade',
    'Estado',
    'CEP',
    'Telefone',
    'Email',
    'Data de Cadastro',
    'Data de Atualização',
    'Renda',
    'Escolaridade',
    'Data do Atendimento',
    'Data de Realização'
  ];

  const rows = patients.map(patient => [
    patient.id,
    patient.name,
    patient.birthDate,
    patient.gender,
    patient.address.street,
    patient.address.number,
    '',
    patient.address.neighborhood,
    patient.address.city,
    patient.address.state,
    patient.address.zipCode,
    patient.contact.phone,
    patient.contact.email || '',
    patient.createdAt,
    patient.updatedAt || '',
    patient.income || '',
    patient.education || '',
    patient.surgeryDate || '',
    patient.surgeryPerformedDate || ''
  ]);

  return [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');
}

// Função para gerar listagem geral de atendimentos em CSV
export function exportGeneralListingToCSV(): string {
  const patients = getAllPatients();
  const headers = [
    'ID',
    'Nome',
    'Data de Nascimento',
    'Gênero',
    'Endereço',
    'Número',
    'Complemento',
    'Bairro',
    'Cidade',
    'Estado',
    'CEP',
    'Telefone',
    'Email',
    'Ação',
    'Data de Cadastro',
    'Data de Atualização',
    'Renda',
    'Escolaridade',
    'Data do Atendimento',
    'Data de Realização'
  ];

  const rows = patients.map(patient => [
    patient.id,
    patient.name,
    patient.birthDate,
    patient.gender,
    patient.address.street,
    patient.address.number,
    '',
    patient.address.neighborhood,
    patient.address.city,
    patient.address.state,
    patient.address.zipCode,
    patient.contact.phone,
    patient.contact.email || '',
    patient.campaignId,
    patient.createdAt,
    patient.updatedAt || '',
    patient.income || '',
    patient.education || '',
    patient.surgeryDate || '',
    patient.surgeryPerformedDate || ''
  ]);

  return [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');
}

// Função para obter todas as emendas
export function getEmendas(): Emenda[] {
  if (!isBrowser()) return [];
  
  const emendasJson = localStorage.getItem(EMENDAS_KEY);
  if (!emendasJson) {
    localStorage.setItem(EMENDAS_KEY, JSON.stringify([]));
    return [];
  }
  
  return JSON.parse(emendasJson);
}

// Função para obter uma emenda específica
export function getEmenda(id: string): Emenda | undefined {
  if (!isBrowser()) return undefined;
  
  const emendas = getEmendas();
  return emendas.find(emenda => emenda.id === id);
}

// Alias para getEmenda
export const getEmendaById = getEmenda;

// Função para criar uma nova emenda
export function createEmenda(emenda: Omit<Emenda, 'id'>): Emenda {
  if (!isBrowser()) {
    throw new Error('Esta função só pode ser executada no navegador');
  }

  const newEmenda = {
    ...emenda,
    id: crypto.randomUUID(),
    dataultimaatualizacao: new Date().toISOString()
  };

  const emendas = getEmendas();
  emendas.push(newEmenda);
  localStorage.setItem(EMENDAS_KEY, JSON.stringify(emendas));

  return newEmenda;
}

// Função para atualizar uma emenda existente
export function updateEmenda(id: string, data: Partial<Emenda>): Emenda | null {
  if (!isBrowser()) {
    throw new Error('Esta função só pode ser executada no navegador');
  }

  const emendas = getEmendas();
  const index = emendas.findIndex(e => e.id === id);
  
  if (index === -1) return null;
  
  const updatedEmenda = {
    ...emendas[index],
    ...data,
    dataultimaatualizacao: new Date().toISOString()
  };
  
  emendas[index] = updatedEmenda;
  localStorage.setItem(EMENDAS_KEY, JSON.stringify(emendas));
  
  return updatedEmenda;
}

// Função para deletar uma emenda
export function deleteEmenda(id: string): boolean {
  if (!isBrowser()) {
    throw new Error('Esta função só pode ser executada no navegador');
  }

  const emendas = getEmendas();
  const filteredEmendas = emendas.filter(e => e.id !== id);
  
  if (filteredEmendas.length === emendas.length) return false;
  
  localStorage.setItem(EMENDAS_KEY, JSON.stringify(filteredEmendas));
  return true;
}

// Salva um usuário
export const saveUser = (user: User): void => {
  if (!isBrowser()) return;
  
  console.log('Salvando usuário:', user); // Debug
  
  const users = getUsers();
  console.log('Usuários existentes:', users); // Debug
  
  const index = users.findIndex(u => u.id === user.id);
  
  // Prepara o usuário para salvar
  const userToSave = {
    ...user,
    active: true,
    createdAt: user.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  if (index >= 0) {
    // Atualiza usuário existente
    users[index] = userToSave;
    console.log('Atualizando usuário existente:', userToSave); // Debug
  } else {
    // Adiciona novo usuário
    users.push(userToSave);
    console.log('Adicionando novo usuário:', userToSave); // Debug
    
    // Cria permissões padrão baseadas no tipo de usuário
    if (user.role === 'admin') {
      // Admin tem acesso total a todas as aplicações
      const apps = getApplications();
      apps.forEach(app => {
        savePermission({
          userId: user.id,
          applicationId: app.id,
          canAccess: true,
          canEdit: true
        });
      });
    } else if (user.role === 'attendant') {
      // Atendente tem acesso específico
      const attendantApps = [
        { id: '1', canEdit: false }, // Portal de Aplicações
        { id: '7', canEdit: true },  // Ações
        { id: '8', canEdit: false }, // Tipos de Ação
        { id: '9', canEdit: true }   // Pessoas
      ];
      
      attendantApps.forEach(app => {
        savePermission({
          userId: user.id,
          applicationId: app.id,
          canAccess: true,
          canEdit: app.canEdit
        });
      });
    } else if (user.role === 'manager') {
      // Gerente tem acesso a tudo, exceto gerenciamento de usuários e configurações
      const apps = getApplications();
      apps.forEach(app => {
        const isRestricted = ['2', '13'].includes(app.id);
        savePermission({
          userId: user.id,
          applicationId: app.id,
          canAccess: true,
          canEdit: !isRestricted
        });
      });
    } else {
      // Usuário comum tem acesso básico
      const userApps = [
        { id: '1', canEdit: false }, // Portal de Aplicações
        { id: '10', canEdit: false } // Relatórios
      ];
      
      userApps.forEach(app => {
        savePermission({
          userId: user.id,
          applicationId: app.id,
          canAccess: true,
          canEdit: app.canEdit
        });
      });
    }
  }
  
  // Salva no localStorage
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  console.log('Usuários após salvar:', getUsers()); // Debug
};

// Remove um usuário
export const deleteUser = (userId: string): void => {
  if (!isBrowser()) return;
  
  const users = getUsers();
  const filteredUsers = users.filter(user => user.id !== userId);
  localStorage.setItem(USERS_KEY, JSON.stringify(filteredUsers));
};

// Verifica se usuário tem permissão para acessar uma página específica
export const hasPageAccess = (userId: string, path: string): boolean => {
  if (!isBrowser()) return false;
  
  // Busca o usuário
  const user = getUserById(userId);
  if (!user) return false;

  // Admin tem acesso a tudo
  if (user.role === 'admin') return true;
  
  // Remove query parameters e trailing slash
  const cleanPath = path.split('?')[0].replace(/\/$/, '');
  
  // Busca a aplicação correspondente ao path
  const apps = getApplications();
  const app = apps.find(a => a.href === cleanPath);
  if (!app) return false;

  // Se for atendente, verifica as permissões específicas
  if (user.role === 'attendant') {
    const allowedPaths = [
      '/painel-aplicacoes',  // Portal de Aplicações
      '/acoes',              // Ações
      '/tipos-acao',         // Tipos de Ação
      '/pessoas'             // Pessoas
    ];
    return allowedPaths.includes(cleanPath);
  }

  // Para outros tipos de usuário, verifica as permissões no banco
  const permissions = getPermissions();
  const permission = permissions.find(
    p => p.userId === userId && p.applicationId === app.id
  );
  
  return permission?.canAccess || false;
}; 