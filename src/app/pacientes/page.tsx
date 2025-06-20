'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaSearch, FaEdit, FaTrash, FaUserAlt, FaChevronLeft, FaPlus, FaDownload, FaFilter, FaFileCsv } from 'react-icons/fa';
import { Patient } from '@/lib/types';
import { getAllPatients, deletePatient, exportPatientsToCSV } from '@/lib/storage';
import { logout } from '@/lib/auth';

export default function PacientesPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isClient, setIsClient] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (!isLoggedIn) {
      router.push('/login');
      return; // Não continuar a execução se não estiver logado
    }
    
    // Load patients
    loadPatients();
  }, [router]);

  const loadPatients = () => {
    const allPatients = getAllPatients();
    setPatients(allPatients);
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
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('pt-BR').format(date);
    } catch (e) {
      return dateString;
    }
  };

  const calculateAge = (birthDate: string) => {
    try {
      const birth = new Date(birthDate);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      
      return age;
    } catch (e) {
      return '?';
    }
  };

  // Filter patients based on search term
  const filteredPatients = patients.filter((patient) => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      patient.name.toLowerCase().includes(searchTermLower) ||
      patient.cpf.includes(searchTerm) ||
      patient.address?.city?.toLowerCase().includes(searchTermLower)
    );
  });

  const handleExportCSV = () => {
    try {
      const csvContent = exportPatientsToCSV();
      
      // Criar um objeto Blob com o conteúdo CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      
      // Criar um link para download
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      // Configurar o link
      const date = new Date().toISOString().split('T')[0];
      link.setAttribute('href', url);
      link.setAttribute('download', `pacientes-catarata-${date}.csv`);
      
      // Adicionar, clicar e remover o link
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Erro ao exportar pacientes:', error);
      alert('Erro ao exportar pacientes para CSV. Tente novamente.');
    }
  };

  const voltarDashboard = () => {
    router.push('/pessoas');
  };

  // If not client side yet, show loading
  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-xl font-semibold">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar moderna */}
      <nav className="navbar-modern sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="text-xl font-bold text-primary flex items-center">
                <span className="bg-primary text-primary-foreground rounded-lg p-1.5 mr-2">
                  DB
                </span>
                <span>Dynamics Database</span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={voltarDashboard}
                className="btn btn-secondary flex items-center gap-2 text-secondary-foreground"
              >
                <FaChevronLeft className="text-xs" /> Dashboard
              </button>
              <button 
                onClick={handleExportCSV}
                className="btn btn-secondary flex items-center gap-2"
                disabled={filteredPatients.length === 0}
              >
                <FaFileCsv size={14} />
                <span>Exportar CSV</span>
              </button>
              <button 
                onClick={() => router.push('/cadastro')}
                className="btn btn-primary flex items-center gap-2"
              >
                <FaPlus size={14} />
                <span>Adicionar Paciente</span>
              </button>
              <button 
                onClick={() => {
                  logout();
                }}
                className="p-2 rounded-full hover:bg-secondary/60 text-secondary-foreground transition-colors"
                aria-label="Sair"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Lista de Pacientes</h1>
            <p className="text-secondary-foreground mt-1">
              Total de {filteredPatients.length} paciente{filteredPatients.length !== 1 ? 's' : ''} {searchTerm && 'encontrado(s)'}
            </p>
          </div>
          <div className="flex gap-2 mt-4 sm:mt-0">
            <button className="btn btn-secondary flex items-center gap-2">
              <FaFilter size={14} />
              <span>Filtros</span>
            </button>
          </div>
        </div>
        
        {/* Search bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              className="input pl-10 w-full"
              placeholder="Buscar por nome, CPF ou cidade..."
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
        </div>
        
        {/* Patients table */}
        <div className="bg-card rounded-xl overflow-hidden shadow-sm border border-border/40">
          {filteredPatients.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th className="rounded-tl-lg">
                      Nome
                    </th>
                    <th>
                      CPF
                    </th>
                    <th>
                      Idade
                    </th>
                    <th>
                      Cidade
                    </th>
                    <th>
                      Data Agendada
                    </th>
                    <th>
                      Horário
                    </th>
                    <th>
                      Local da Cirurgia
                    </th>
                    <th>
                      Status
                    </th>
                    <th className="rounded-tr-lg text-right">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.map((patient) => (
                    <tr key={patient.id} className="hover:bg-secondary/20 transition-colors">
                      <td>
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-primary/10 rounded-full">
                            <FaUserAlt className="text-primary" />
                          </div>
                          <div className="ml-4">
                            <div className="font-medium text-foreground">{patient.name}</div>
                            <div className="text-sm text-secondary-foreground">
                              {patient.gender === 'M' ? 'Masculino' : patient.gender === 'F' ? 'Feminino' : 'Outro'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="text-secondary-foreground">
                        {patient.cpf}
                      </td>
                      <td className="text-secondary-foreground">
                        <span className="badge bg-primary/10 text-primary">
                          {calculateAge(patient.birthDate)} anos
                        </span>
                      </td>
                      <td className="text-secondary-foreground">
                        {patient.address?.city || '-'}
                        <div className="text-xs text-secondary-foreground/70">{patient.address?.state || '-'}</div>
                      </td>
                      <td className="text-secondary-foreground">
                        {patient.medicalInfo?.surgeryDate ? formatDate(patient.medicalInfo.surgeryDate) : '-'}
                      </td>
                      <td className="text-secondary-foreground">
                        {patient.medicalInfo?.surgeryTime || '-'}
                      </td>
                      <td className="text-secondary-foreground">
                        {patient.medicalInfo?.surgeryLocation || '-'}
                      </td>
                      <td className="text-secondary-foreground">
                        {patient.medicalInfo?.surgeryPerformedDate ? (
                          <div className="flex items-center">
                            <span className="badge bg-green-100 text-green-800 flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                              Realizada
                            </span>
                          </div>
                        ) : patient.medicalInfo?.surgeryDate ? (
                          <span className="badge bg-blue-100 text-blue-800">Agendada</span>
                        ) : (
                          <span className="badge bg-gray-100 text-gray-800">Não agendada</span>
                        )}
                      </td>
                      <td className="text-right">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => showPatientDetails(patient)}
                            className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors"
                            title="Ver detalhes"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(patient.id)}
                            className="p-2 text-destructive hover:bg-destructive/10 rounded-full transition-colors"
                            title="Excluir paciente"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-16 text-center">
              <div className="mx-auto h-24 w-24 text-secondary-foreground/30">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="mt-2 text-lg font-medium text-foreground">Nenhum paciente encontrado</h3>
              <p className="mt-1 text-sm text-secondary-foreground">
                {searchTerm ? 'Tente usar termos diferentes na sua busca.' : 'Comece adicionando um novo paciente ao sistema.'}
              </p>
              {!searchTerm && (
                <div className="mt-6">
                  <button
                    onClick={() => router.push('/cadastro')}
                    className="btn btn-primary inline-flex items-center gap-2"
                  >
                    <FaPlus className="text-xs" /> Cadastrar Paciente
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="modal-modern max-w-md w-full">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-destructive/10 text-destructive mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-center mb-2">Confirmar Exclusão</h2>
            <p className="text-secondary-foreground text-center mb-6">
              Esta ação não poderá ser desfeita. Todos os dados deste paciente serão excluídos permanentemente.
            </p>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="btn bg-secondary text-secondary-foreground hover:bg-secondary/80 focus:ring-secondary flex-1"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDelete}
                className="btn bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:ring-destructive flex-1"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Patient Details Modal */}
      {showDetailsModal && selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card rounded-xl shadow-lg border border-border/40 max-w-4xl w-full max-h-[90vh] overflow-y-auto p-0">
            {/* Modal Header */}
            <div className="border-b border-border/40 p-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="h-12 w-12 flex items-center justify-center bg-primary/10 rounded-full mr-4">
                    <FaUserAlt className="text-primary text-xl" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{selectedPatient.name}</h2>
                    <p className="text-secondary-foreground">
                      {selectedPatient.gender === 'M' ? 'Masculino' : selectedPatient.gender === 'F' ? 'Feminino' : 'Outro'} • {calculateAge(selectedPatient.birthDate)} anos • CPF: {selectedPatient.cpf}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 rounded-full hover:bg-secondary/60 text-secondary-foreground transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Modal Body */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information and Address combined */}
                <div className="bg-secondary/20 p-5 rounded-xl">
                  <h3 className="font-semibold text-lg mb-4 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Informações Pessoais e Endereço
                  </h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-secondary-foreground/70">Data de Nascimento</div>
                        <div>{formatDate(selectedPatient.birthDate)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-secondary-foreground/70">Cadastrado em</div>
                        <div>{formatDate(selectedPatient.createdAt)}</div>
                      </div>
                    </div>
                    
                    <div className="pt-3 border-t border-border/30">
                      <div className="text-xs text-secondary-foreground/70 mb-1">Endereço</div>
                      <div className="text-foreground">
                        {selectedPatient.address?.street || '-'}, {selectedPatient.address?.number || '-'}
                        {selectedPatient.address?.complement && `, ${selectedPatient.address.complement}`}
                      </div>
                      <div className="text-secondary-foreground mt-1">
                        {selectedPatient.address?.neighborhood || '-'}, {selectedPatient.address?.city || '-'} - {selectedPatient.address?.state || '-'}
                      </div>
                      <div className="text-secondary-foreground mt-1">
                        CEP: {selectedPatient.address?.zipCode || '-'}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Contact */}
                <div className="bg-secondary/20 p-5 rounded-xl">
                  <h3 className="font-semibold text-lg mb-4 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    Informações de Contato
                  </h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-secondary-foreground/70">Telefone</div>
                        <div>{selectedPatient.contact?.phone || '-'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-secondary-foreground/70">WhatsApp</div>
                        <div>{selectedPatient.contact?.whatsapp || '-'}</div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-xs text-secondary-foreground/70">Email</div>
                      <div>{selectedPatient.contact?.email || '-'}</div>
                    </div>
                    
                    <div className="pt-3 border-t border-border/30">
                      <div className="text-xs text-secondary-foreground/70 mb-1">Contato de Emergência</div>
                      <div>{selectedPatient.contact?.emergencyContact || '-'}</div>
                      <div className="text-secondary-foreground mt-1">
                        {selectedPatient.contact?.emergencyPhone || '-'}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Socioeconomic */}
                <div className="bg-secondary/20 p-5 rounded-xl">
                  <h3 className="font-semibold text-lg mb-4 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Informações Socioeconômicas
                  </h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-secondary-foreground/70">Escolaridade</div>
                        <div>{selectedPatient.socioeconomic?.education || '-'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-secondary-foreground/70">Ocupação</div>
                        <div>{selectedPatient.socioeconomic?.occupation || '-'}</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-secondary-foreground/70">Renda Familiar</div>
                        <div>{selectedPatient.socioeconomic?.income || '-'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-secondary-foreground/70">Pessoas na Família</div>
                        <div>{selectedPatient.socioeconomic?.familyMembers || '-'}</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 pt-3 border-t border-border/30">
                      <div>
                        <div className="text-xs text-secondary-foreground/70">Moradia</div>
                        <div>{selectedPatient.socioeconomic?.housingSituation || '-'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-secondary-foreground/70">Acesso a Transporte</div>
                        <div className={`badge ${selectedPatient.socioeconomic?.transportationAccess ? 'badge-success' : 'badge-error'}`}>
                          {selectedPatient.socioeconomic?.transportationAccess ? 'Sim' : 'Não'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-secondary-foreground/70">Auxílio Governamental</div>
                        <div className={`badge ${selectedPatient.socioeconomic?.governmentAssistance ? 'badge-success' : 'badge-error'}`}>
                          {selectedPatient.socioeconomic?.governmentAssistance ? 'Sim' : 'Não'}
                        </div>
                      </div>
                    </div>
                    
                    {selectedPatient.socioeconomic?.governmentAssistance && selectedPatient.socioeconomic?.governmentAssistanceType && (
                      <div className="text-sm mt-1">
                        <span className="text-xs text-secondary-foreground/70">Tipo de auxílio: </span>
                        {selectedPatient.socioeconomic.governmentAssistanceType}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Medical Info */}
                <div className="bg-secondary/20 p-5 rounded-xl">
                  <h3 className="font-semibold text-lg mb-4 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                    Informações Médicas
                  </h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-secondary-foreground/70">Plano de Saúde</div>
                        <div className="flex items-center">
                          <span className={`badge ${selectedPatient.medicalInfo?.hasHealthInsurance ? 'badge-success' : 'badge-error'} mr-2`}>
                            {selectedPatient.medicalInfo?.hasHealthInsurance ? 'Sim' : 'Não'}
                          </span>
                          {selectedPatient.medicalInfo?.hasHealthInsurance && selectedPatient.medicalInfo?.healthInsuranceName}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-secondary-foreground/70">Cirurgia Ocular Prévia</div>
                        <div className="flex items-center">
                          <span className={`badge ${selectedPatient.medicalInfo?.previousEyeSurgery ? 'badge-success' : 'badge-error'} mr-2`}>
                            {selectedPatient.medicalInfo?.previousEyeSurgery ? 'Sim' : 'Não'}
                          </span>
                        </div>
                        {selectedPatient.medicalInfo?.previousEyeSurgery && selectedPatient.medicalInfo?.previousEyeSurgeryDescription && (
                          <div className="text-sm mt-1 text-secondary-foreground">
                            {selectedPatient.medicalInfo.previousEyeSurgeryDescription}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-secondary-foreground/70">Tipo de Catarata</div>
                        <div>{selectedPatient.medicalInfo?.cataractType || '-'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-secondary-foreground/70">Olho Afetado</div>
                        <div>
                          <span className="badge bg-blue-100 text-blue-800">
                            {selectedPatient.medicalInfo?.cataractEye || '-'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-secondary-foreground/70">Acuidade Visual (OD)</div>
                        <div>{selectedPatient.medicalInfo?.visualAcuityRightEye || '-'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-secondary-foreground/70">Acuidade Visual (OE)</div>
                        <div>{selectedPatient.medicalInfo?.visualAcuityLeftEye || '-'}</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 pt-3 border-t border-border/30">
                      <div>
                        <div className="text-xs text-secondary-foreground/70 mb-1">Doenças Crônicas</div>
                        {selectedPatient.medicalInfo?.chronicDiseases && selectedPatient.medicalInfo.chronicDiseases.length > 0 ? (
                          <div className="space-y-1">
                            {selectedPatient.medicalInfo.chronicDiseases.map((disease, index) => (
                              <div key={index} className="badge bg-yellow-100 text-yellow-800 mr-1 mb-1">{disease}</div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm text-secondary-foreground">Nenhuma</div>
                        )}
                      </div>
                      
                      <div>
                        <div className="text-xs text-secondary-foreground/70 mb-1">Medicamentos</div>
                        {selectedPatient.medicalInfo?.medications && selectedPatient.medicalInfo.medications.length > 0 ? (
                          <div className="space-y-1">
                            {selectedPatient.medicalInfo.medications.map((medication, index) => (
                              <div key={index} className="badge bg-green-100 text-green-800 mr-1 mb-1">{medication}</div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm text-secondary-foreground">Nenhum</div>
                        )}
                      </div>
                      
                      <div>
                        <div className="text-xs text-secondary-foreground/70 mb-1">Alergias</div>
                        {selectedPatient.medicalInfo?.allergies && selectedPatient.medicalInfo.allergies.length > 0 ? (
                          <div className="space-y-1">
                            {selectedPatient.medicalInfo.allergies.map((allergy, index) => (
                              <div key={index} className="badge bg-red-100 text-red-800 mr-1 mb-1">{allergy}</div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm text-secondary-foreground">Nenhuma</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Informações da Cirurgia */}
            <div className="p-6 pt-2 border-t border-border/40 mt-4">
              <h3 className="font-semibold text-lg mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Detalhes da Cirurgia
              </h3>
              
              <div className="bg-secondary/20 p-5 rounded-xl">
                <div className="mb-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium text-base">Status da Cirurgia</h4>
                    {selectedPatient.medicalInfo?.surgeryPerformedDate ? (
                      <span className="badge bg-green-100 text-green-800 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Realizada em {formatDate(selectedPatient.medicalInfo.surgeryPerformedDate)}
                      </span>
                    ) : selectedPatient.medicalInfo?.surgeryDate ? (
                      <span className="badge bg-blue-100 text-blue-800">
                        Agendada para {formatDate(selectedPatient.medicalInfo.surgeryDate)}
                      </span>
                    ) : (
                      <span className="badge bg-yellow-100 text-yellow-800">
                        Não agendada
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-secondary-foreground/70">Data Agendada</div>
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {selectedPatient.medicalInfo?.surgeryDate ? formatDate(selectedPatient.medicalInfo.surgeryDate) : "Não agendada"}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-secondary-foreground/70">Horário Previsto</div>
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {selectedPatient.medicalInfo?.surgeryTime || "Não definido"}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-secondary-foreground/70">Local da Cirurgia</div>
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      {selectedPatient.medicalInfo?.surgeryLocation || "Não definido"}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-secondary-foreground/70">Data da Realização</div>
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {selectedPatient.medicalInfo?.surgeryPerformedDate ? formatDate(selectedPatient.medicalInfo.surgeryPerformedDate) : "Não realizada"}
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 pt-3 border-t border-border/30">
                  <div className="text-xs text-secondary-foreground/70 mb-1">Observações da Cirurgia</div>
                  <div className="text-secondary-foreground text-sm">
                    {selectedPatient.medicalInfo?.surgeryNotes || "Nenhuma observação registrada."}
                  </div>
                </div>
                
                <div className="mt-4 pt-3 border-t border-border/30">
                  <div className="text-xs text-secondary-foreground/70 mb-1">Acompanhamento Pós-Operatório</div>
                  <div className="text-secondary-foreground text-sm">
                    {selectedPatient.medicalInfo?.postOpFollowUp || "Informações de acompanhamento não registradas."}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Footer do modal */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-border/40">
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  if (selectedPatient) {
                    router.push(`/cadastro?edit=${selectedPatient.id}`);
                  }
                }}
                className="btn btn-secondary"
              >
                Editar Paciente
              </button>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="btn btn-primary"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 