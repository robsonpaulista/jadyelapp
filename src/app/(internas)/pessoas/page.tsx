'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaSearch, FaEdit, FaTrash, FaUserAlt, FaChevronLeft, FaPlus, FaDownload, FaFilter, FaFileCsv } from 'react-icons/fa';
import { Patient, Campaign } from '@/lib/types';
import { getAllPatients, deletePatient, exportPatientsToCSV, isUserLoggedIn, getCampaigns, getCampaignById } from '@/lib/storage';
import { disableConsoleLogging } from '@/lib/logger';

export default function PessoasPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isClient, setIsClient] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [filterByCampaign, setFilterByCampaign] = useState<string>('');
  const [filterByStatus, setFilterByStatus] = useState<string>('all');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    // Desabilitar logs globalmente para proteção de dados
    if (typeof window !== 'undefined') {
      disableConsoleLogging();
    }

    setIsClient(true);
    
    // Verificar se o usuário está logado
    if (!isUserLoggedIn()) {
      router.push('/login');
      return;
    }

    loadPatients();
    loadCampaigns();
    
    // Verificar se existe um filtro de campanha no localStorage ou na URL
    const searchParams = new URLSearchParams(window.location.search);
    const campaignIdParam = searchParams.get('campaignId');
    const savedFilterCampaign = localStorage.getItem('selectedFilterCampaign');
    
    if (campaignIdParam) {
      setFilterByCampaign(campaignIdParam);
    } else if (savedFilterCampaign) {
      setFilterByCampaign(savedFilterCampaign);
      // Limpar o localStorage após carregar a seleção
      localStorage.removeItem('selectedFilterCampaign');
    }
  }, [router]);

  const loadPatients = () => {
    const allPatients = getAllPatients();
    setPatients(allPatients);
  };

  const loadCampaigns = () => {
    const allCampaigns = getCampaigns();
    setCampaigns(allCampaigns);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleDelete = (id: string) => {
    setPatientToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (patientToDelete) {
      deletePatient(patientToDelete);
      loadPatients();
      setShowDeleteModal(false);
      setPatientToDelete(null);
    }
  };

  const showPatientDetails = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowDetailsModal(true);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR');
    } catch (e) {
      return dateString;
    }
  };

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return 'N/A';
    
    try {
      const dob = new Date(birthDate);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      
      return age.toString();
    } catch (e) {
      return 'N/A';
    }
  };

  const getPatientStatus = (patient: Patient) => {
    // Verifica se há data de cirurgia realizada (no nível do paciente ou no medicalInfo)
    if (patient.surgeryPerformedDate || (patient.medicalInfo as any)?.surgeryPerformedDate) {
      return 'Finalizado';
    } else if (patient.surgeryDate) {
      return 'Agendado';
    } else {
      return 'Em processamento';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Finalizado':
        return 'bg-green-100 text-green-800';
      case 'Agendado':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const handleExportCSV = () => {
    exportPatientsToCSV();
  };

  const getFilteredPatients = () => {
    return patients.filter(patient => {
      // Filtro por termo de busca
      const matchesSearch = 
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.cpf.includes(searchTerm) ||
        (patient.contact.phone && patient.contact.phone.includes(searchTerm));
      
      // Filtro por campanha
      const matchesCampaign = filterByCampaign ? patient.campaignId === filterByCampaign : true;
      
      // Filtro por status
      let matchesStatus = true;
      if (filterByStatus !== 'all') {
        const status = getPatientStatus(patient);
        matchesStatus = status.toLowerCase() === filterByStatus.toLowerCase();
      }
      
      return matchesSearch && matchesCampaign && matchesStatus;
    });
  };

  const getCampaignName = (campaignId: string): string => {
    const campaign = campaigns.find(c => c.id === campaignId);
    return campaign ? campaign.name : 'Sem ação';
  };

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      {/* Navbar interna do conteúdo */}
      <nav className="w-full bg-white border-b border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex flex-col items-start">
            <span className="text-base md:text-lg font-semibold text-gray-900">Pessoas Atendidas</span>
            <span className="text-xs text-gray-500 font-light">Gerenciamento de pessoas atendidas e beneficiadas</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-1 px-3 py-1.5 rounded text-xs transition-colors border bg-white hover:bg-gray-50 text-gray-700 cursor-pointer border-gray-200"
            >
              Voltar ao Dashboard
            </button>
          </div>
        </div>
      </nav>

      <div className="flex min-h-screen flex-col bg-gradient-to-b from-gray-50 to-gray-100">
        <header className="sticky top-0 z-10 bg-gradient-to-r from-blue-800 to-indigo-900 text-white shadow-md p-4">
          <div className="container mx-auto px-2">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">Pessoas Atendidas</h1>
              <button 
                onClick={() => router.push('/dashboard')}
                className="bg-blue-700 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
              >
                Voltar
              </button>
            </div>
          </div>
        </header>
        
        <div className="container mx-auto p-4 flex-1">
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex-1 flex flex-col sm:flex-row gap-4">
              <div className="relative w-full sm:max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar por nome, CPF ou telefone..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="pl-10 pr-4 py-2 w-full border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <select
                value={filterByCampaign}
                onChange={(e) => setFilterByCampaign(e.target.value)}
                className="px-3 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todas as campanhas</option>
                {campaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </option>
                ))}
              </select>
              
              <select
                value={filterByStatus}
                onChange={(e) => setFilterByStatus(e.target.value)}
                className="px-3 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Todos os status</option>
                <option value="finalizado">Finalizado</option>
                <option value="agendado">Agendado</option>
                <option value="em processamento">Em processamento</option>
              </select>
            </div>
            
            <div className="flex space-x-2 w-full sm:w-auto">
              <button 
                onClick={() => router.push('/cadastro')}
                className="flex-1 sm:flex-none bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-md shadow-sm transition-colors flex items-center justify-center"
              >
                <FaPlus className="mr-2" /> Nova Pessoa
              </button>
              <button 
                onClick={handleExportCSV}
                className="flex-1 sm:flex-none bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-4 py-2 rounded-md shadow-sm transition-colors flex items-center justify-center"
              >
                <FaFileCsv className="mr-2" /> Exportar CSV
              </button>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nome
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CPF
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Idade
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cidade/Bairro
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ação
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data cadastro
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getFilteredPatients().map(patient => (
                    <tr key={patient.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{patient.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{patient.cpf}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{calculateAge(patient.birthDate)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {patient.address.city}/{patient.address.neighborhood || "Não informado"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{getCampaignName(patient.campaignId)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{formatDate(patient.createdAt)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(getPatientStatus(patient))}`}>
                          {getPatientStatus(patient)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => showPatientDetails(patient)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Ver detalhes"
                          >
                            <FaUserAlt />
                          </button>
                          <button 
                            onClick={() => router.push(`/cadastro?edit=${patient.id}`)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Editar"
                          >
                            <FaEdit />
                          </button>
                          <button 
                            onClick={() => handleDelete(patient.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Excluir"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  
                  {getFilteredPatients().length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                        Nenhuma pessoa encontrada
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {showDeleteModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg max-w-md w-full">
                <h3 className="text-lg font-medium mb-4">Confirmar exclusão</h3>
                <p className="mb-6">Tem certeza que deseja excluir esta pessoa? Esta ação não pode ser desfeita.</p>
                <div className="flex justify-end space-x-3">
                  <button 
                    onClick={() => setShowDeleteModal(false)}
                    className="btn btn-outline"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={confirmDelete}
                    className="btn btn-danger"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {showDetailsModal && selectedPatient && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-medium">Detalhes da Pessoa</h3>
                  <button 
                    onClick={() => setShowDetailsModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ×
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-2 pb-1 border-b">Dados Pessoais</h4>
                    <div className="space-y-2">
                      <p><span className="font-medium">Nome:</span> {selectedPatient.name}</p>
                      <p><span className="font-medium">CPF:</span> {selectedPatient.cpf}</p>
                      <p><span className="font-medium">Data de Nascimento:</span> {formatDate(selectedPatient.birthDate)}</p>
                      <p><span className="font-medium">Idade:</span> {calculateAge(selectedPatient.birthDate)} anos</p>
                      <p><span className="font-medium">Gênero:</span> {selectedPatient.gender}</p>
                    </div>
                    
                    <h4 className="font-medium mb-2 mt-4 pb-1 border-b">Contatos</h4>
                    <div className="space-y-2">
                      <p><span className="font-medium">Telefone:</span> {selectedPatient.contact.phone}</p>
                      <p><span className="font-medium">WhatsApp:</span> {selectedPatient.contact.whatsapp || 'Não informado'}</p>
                      <p><span className="font-medium">Email:</span> {selectedPatient.contact.email || 'Não informado'}</p>
                      <p><span className="font-medium">Contato de Emergência:</span> {selectedPatient.contact.emergencyContact || 'Não informado'}</p>
                      <p><span className="font-medium">Telefone de Emergência:</span> {selectedPatient.contact.emergencyPhone || 'Não informado'}</p>
                    </div>
                    
                    <h4 className="font-medium mb-2 mt-4 pb-1 border-b">Endereço</h4>
                    <div className="space-y-2">
                      <p><span className="font-medium">Endereço:</span> {selectedPatient.address.street}, {selectedPatient.address.number}</p>
                      <p><span className="font-medium">Complemento:</span> {selectedPatient.address.complement || 'Não informado'}</p>
                      <p><span className="font-medium">Bairro:</span> {selectedPatient.address.neighborhood}</p>
                      <p><span className="font-medium">Cidade/UF:</span> {selectedPatient.address.city}/{selectedPatient.address.state}</p>
                      <p><span className="font-medium">CEP:</span> {selectedPatient.address.zipCode}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2 pb-1 border-b">Dados Socioeconômicos</h4>
                    <div className="space-y-2">
                      <p><span className="font-medium">Escolaridade:</span> {selectedPatient.education || 'Não informado'}</p>
                      <p><span className="font-medium">Renda:</span> {selectedPatient.income || 'Não informado'}</p>
                    </div>
                    
                    <h4 className="font-medium mb-2 mt-4 pb-1 border-b">Dados do Atendimento</h4>
                    <div className="space-y-2">
                      <p>
                        <span className="font-medium">Status:</span>{' '}
                        {selectedPatient.surgeryPerformedDate ? (
                          <span className="text-green-600">Finalizado</span>
                        ) : selectedPatient.surgeryDate ? (
                          <span className="text-yellow-600">Agendado</span>
                        ) : (
                          <span className="text-red-600">Não agendado</span>
                        )}
                      </p>
                      <p>
                        <span className="font-medium">Data Agendada:</span>{' '}
                        {selectedPatient.surgeryDate ? new Date(selectedPatient.surgeryDate).toLocaleDateString() : 'Não agendado'}
                      </p>
                      <p>
                        <span className="font-medium">Data de Realização:</span>{' '}
                        {selectedPatient.surgeryPerformedDate ? new Date(selectedPatient.surgeryPerformedDate).toLocaleDateString() : 'Não realizado'}
                      </p>
                      <p>
                        <span className="font-medium">Horário:</span>{' '}
                        {selectedPatient.medicalInfo?.surgeryTime || 'Não definido'}
                      </p>
                      <p>
                        <span className="font-medium">Local:</span>{' '}
                        {selectedPatient.medicalInfo?.surgeryLocation || 'Não definido'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end mt-6 space-x-3">
                  <button 
                    onClick={() => router.push(`/cadastro?edit=${selectedPatient.id}`)}
                    className="btn btn-primary"
                  >
                    Editar Dados
                  </button>
                  <button 
                    onClick={() => setShowDetailsModal(false)}
                    className="btn btn-outline"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 