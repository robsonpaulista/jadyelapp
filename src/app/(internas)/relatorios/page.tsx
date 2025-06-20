'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaDownload, FaFilePdf, FaFileCsv, FaChevronLeft } from 'react-icons/fa';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  getAllCampaigns, 
  getCampaignById, 
  exportCampaignReportToCSV, 
  exportGeneralListingToCSV,
  isUserLoggedIn,
  getPatientStatistics,
  getPatientById,
  getAllPatients
} from '@/lib/storage';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function RelatoriosPage() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string>('');
  const [selectedCampaignData, setSelectedCampaignData] = useState<any>(null);
  const [reportType, setReportType] = useState<'campaign' | 'general'>('campaign');
  const [loading, setLoading] = useState(false);
  const [statsData, setStatsData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
    
    // Verificar se o usuário está logado
    if (!isUserLoggedIn()) {
      router.push('/login');
      return;
    }

    // Carregar campanhas e dados
    loadData();
  }, [router]);

  useEffect(() => {
    if (selectedCampaign && reportType === 'campaign') {
      loadCampaignData();
      loadCampaignStats();
    }
  }, [selectedCampaign]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Buscar ações
      const acoesResponse = await fetch('/api/acoes');
      if (!acoesResponse.ok) {
        throw new Error('Erro ao buscar ações');
      }
      const acoesData = await acoesResponse.json();
      setCampaigns(acoesData);

      // Se estiver no modo geral, carregar estatísticas gerais
      if (reportType === 'general') {
        const pessoasResponse = await fetch('/api/pessoas');
        if (!pessoasResponse.ok) {
          throw new Error('Erro ao buscar pessoas');
        }
        const pessoasData = await pessoasResponse.json();
        const stats = processStatistics(pessoasData);
        setStatsData(stats);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setError(error instanceof Error ? error.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const loadCampaignData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/acoes/${selectedCampaign}`);
      if (!response.ok) {
        throw new Error('Erro ao buscar dados da ação');
      }
      const data = await response.json();
      setSelectedCampaignData(data);
    } catch (error) {
      console.error('Erro ao carregar dados da ação:', error);
      setError(error instanceof Error ? error.message : 'Erro ao carregar dados da ação');
    } finally {
      setLoading(false);
    }
  };

  const loadCampaignStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/pessoas?acaoId=${selectedCampaign}`);
      if (!response.ok) {
        throw new Error('Erro ao buscar estatísticas');
      }
      const data = await response.json();
      const stats = processStatistics(data);
      setStatsData(stats);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      setError(error instanceof Error ? error.message : 'Erro ao carregar estatísticas');
    } finally {
      setLoading(false);
    }
  };

  const processStatistics = (data: any[]) => {
    const stats = {
      total: data.length,
      scheduledProcedures: data.filter(p => p.dataAgendamento).length,
      completedProcedures: data.filter(p => p.dataDoAtendimento).length,
      cities: [] as any[],
      gender: [] as any[],
      education: [] as any[],
      ageGroups: [] as any[],
      income: [] as any[]
    };

    // Processar distribuição por cidade
    const cityMap = new Map<string, { value: number; bairros: Map<string, number> }>();
    data.forEach(p => {
      const municipio = p.municipio || 'Não informado';
      const bairro = p.bairro || 'Não informado';
      
      if (!cityMap.has(municipio)) {
        cityMap.set(municipio, { value: 0, bairros: new Map() });
      }
      
      const cityData = cityMap.get(municipio)!;
      cityData.value++;
      
      if (!cityData.bairros.has(bairro)) {
        cityData.bairros.set(bairro, 0);
      }
      cityData.bairros.set(bairro, cityData.bairros.get(bairro)! + 1);
    });

    stats.cities = Array.from(cityMap.entries()).map(([municipio, data]) => ({
      name: municipio,
      value: data.value,
      bairros: Array.from(data.bairros.entries()).map(([bairro, value]) => ({
        name: bairro,
        value
      }))
    }));

    // Processar distribuição por gênero
    const genderMap = new Map<string, number>();
    data.forEach(p => {
      const gender = p.genero || 'Não informado';
      genderMap.set(gender, (genderMap.get(gender) || 0) + 1);
    });
    stats.gender = Array.from(genderMap.entries()).map(([name, value]) => ({
      name,
      value
    }));

    // Processar distribuição por escolaridade
    const educationMap = new Map<string, number>();
    data.forEach(p => {
      const education = p.escolaridade || 'Não informado';
      educationMap.set(education, (educationMap.get(education) || 0) + 1);
    });
    stats.education = Array.from(educationMap.entries()).map(([name, value]) => ({
      name,
      value
    }));

    // Processar distribuição por faixa etária
    const ageGroupsMap = new Map<string, number>();
    data.forEach(p => {
      if (p.dataNascimento) {
        const age = calculateAge(new Date(p.dataNascimento));
        const group = getAgeGroup(age);
        ageGroupsMap.set(group, (ageGroupsMap.get(group) || 0) + 1);
      }
    });
    stats.ageGroups = Array.from(ageGroupsMap.entries()).map(([name, value]) => ({
      name,
      value
    }));

    // Processar distribuição por renda familiar
    const incomeMap = new Map<string, number>();
    data.forEach(p => {
      const income = p.rendaFamiliar || 'Não informado';
      incomeMap.set(income, (incomeMap.get(income) || 0) + 1);
    });
    stats.income = Array.from(incomeMap.entries()).map(([name, value]) => ({
      name,
      value
    }));

    return stats;
  };

  const calculateAge = (birthDate: Date): number => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getAgeGroup = (age: number): string => {
    if (age < 18) return '0-17';
    if (age < 30) return '18-29';
    if (age < 45) return '30-44';
    if (age < 60) return '45-59';
    return '60+';
  };

  const handleCampaignChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCampaign(e.target.value);
  };

  const handleReportTypeChange = (type: 'campaign' | 'general') => {
    setReportType(type);
    if (type === 'general') {
      loadData();
    }
  };

  const downloadCSV = async () => {
    try {
      setLoading(true);
      setError(null);

      let csvContent: string;
      let filename: string;
      
      if (reportType === 'campaign') {
        if (!selectedCampaign) {
          throw new Error('Por favor, selecione uma ação primeiro.');
        }
        const response = await fetch(`/api/pessoas?acaoId=${selectedCampaign}`);
        if (!response.ok) {
          throw new Error('Erro ao buscar dados para exportação');
        }
        const data = await response.json();
        csvContent = convertToCSV(data);
        const campaign = campaigns.find(c => c.id === selectedCampaign);
        filename = `relatorio_${campaign?.titulo.replace(/\s+/g, '_').toLowerCase() || 'acao'}.csv`;
      } else {
        const response = await fetch('/api/pessoas');
        if (!response.ok) {
          throw new Error('Erro ao buscar dados para exportação');
        }
        const data = await response.json();
        csvContent = convertToCSV(data);
        filename = 'listagem_geral_atendimentos.csv';
      }
      
      // Criar um objeto Blob para o conteúdo CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      // Criar um elemento de link para download
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      
      // Iniciar download e remover o link
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Erro ao gerar CSV:', error);
      setError(error instanceof Error ? error.message : 'Erro ao gerar CSV');
    } finally {
      setLoading(false);
    }
  };

  const convertToCSV = (data: any[]): string => {
    const headers = [
      'Nome',
      'CPF',
      'Data de Nascimento',
      'Gênero',
      'Endereço',
      'Número',
      'Bairro',
      'Município',
      'Telefone',
      'Email',
      'Escolaridade',
      'Renda Familiar',
      'Observações',
      'Ação',
      'Data de Agendamento',
      'Hora',
      'Local',
      'Data do Atendimento'
    ];

    const rows = data.map(p => [
      p.nome || '',
      p.cpf || '',
      p.dataNascimento || '',
      p.genero || '',
      p.endereco || '',
      p.numero || '',
      p.bairro || '',
      p.municipio || '',
      p.telefone || '',
      p.email || '',
      p.escolaridade || '',
      p.rendaFamiliar || '',
      p.observacoes || '',
      p.acaoTitulo || '',
      p.dataAgendamento || '',
      p.hora || '',
      p.local || '',
      p.dataDoAtendimento || ''
    ]);

    return [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
  };

  const downloadPDF = async () => {
    try {
      setLoading(true);
      setError(null);

      if (reportType === 'campaign' && !selectedCampaign) {
        throw new Error('Por favor, selecione uma ação primeiro.');
      }
      
      const doc = new jsPDF();
      
      if (reportType === 'campaign') {
        // Gerar relatório para uma campanha específica
        const campaign = campaigns.find(c => c.id === selectedCampaign);
        const stats = statsData || await loadCampaignStats();
        
        // Título
        doc.setFontSize(16);
        doc.text(`Relatório da Ação: ${campaign?.titulo}`, 14, 20);
        
        // Informações da campanha
        doc.setFontSize(12);
        let yPos = 40; // Posição inicial Y para as informações
        const lineHeight = 7; // Altura de cada linha

        // Adicionar informações básicas
        doc.text(`Data de Início: ${campaign?.dataInicio ? new Date(campaign.dataInicio).toLocaleDateString() : 'Não informada'}`, 14, yPos);
        yPos += lineHeight;
        doc.text(`Data de Término: ${campaign?.dataFim ? new Date(campaign.dataFim).toLocaleDateString() : 'Não informada'}`, 14, yPos);
        yPos += lineHeight;
        doc.text(`Status: ${campaign?.status}`, 14, yPos);
        yPos += lineHeight;
        doc.text(`Total de Pessoas Atendidas: ${stats.total}`, 14, yPos);
        yPos += lineHeight;
        doc.text(`Agendamentos Realizados: ${stats.scheduledProcedures}`, 14, yPos);
        yPos += lineHeight;
        doc.text(`Atendimentos Finalizados: ${stats.completedProcedures}`, 14, yPos);
        yPos += lineHeight * 2; // Espaço extra antes da tabela
        
        // Buscar dados dos pacientes
        const response = await fetch(`/api/pessoas?acaoId=${selectedCampaign}`);
        if (!response.ok) {
          throw new Error('Erro ao buscar dados dos pacientes');
        }
        const data = await response.json();
        
        const patientData = data.map((p: any) => [
          p.nome || '',
          p.endereco || '',
          p.bairro || '',
          p.municipio || '',
          p.telefone || '',
          p.dataDoAtendimento ? 'Finalizado' : (p.dataAgendamento ? 'Agendado' : 'Pendente')
        ]);
        
        // Adicionar a tabela com a posição Y calculada
        autoTable(doc, {
          startY: yPos,
          head: [['Nome', 'Endereço', 'Bairro', 'Cidade', 'Telefone', 'Status']],
          body: patientData,
          margin: { left: 14 },
          theme: 'striped',
          headStyles: { fillColor: [37, 99, 235] }, // Cor azul para o cabeçalho
          styles: { fontSize: 10 }, // Tamanho da fonte menor para caber mais conteúdo
          columnStyles: {
            0: { cellWidth: 40 }, // Nome
            1: { cellWidth: 40 }, // Endereço
            2: { cellWidth: 30 }, // Bairro
            3: { cellWidth: 30 }, // Cidade
            4: { cellWidth: 25 }, // Telefone
            5: { cellWidth: 20 }  // Status
          }
        });
        
        doc.save(`relatorio_${campaign?.titulo.replace(/\s+/g, '_').toLowerCase() || 'acao'}.pdf`);
      } else {
        // Gerar relatório geral
        doc.setFontSize(16);
        doc.text('Listagem Geral de Atendimentos', 14, 20);
        
        const stats = statsData || await loadData();
        doc.setFontSize(12);
        let yPos = 40;
        doc.text(`Total de Pessoas Atendidas: ${stats.total}`, 14, yPos);
        yPos += 20;
        
        // Buscar dados dos pacientes
        const response = await fetch('/api/pessoas');
        if (!response.ok) {
          throw new Error('Erro ao buscar dados dos pacientes');
        }
        const data = await response.json();
        
        const patientRows = data.map((p: any) => [
          p.nome || '',
          `${p.endereco || ''}, ${p.numero || ''} ${p.complemento || ''}`,
          p.bairro || '',
          p.municipio || '',
          p.telefone || '',
          p.acaoTitulo || 'Não informado'
        ]);
        
        // Adicionar a tabela com a posição Y calculada
        autoTable(doc, {
          startY: yPos,
          head: [['Nome', 'Endereço', 'Bairro', 'Cidade', 'Telefone', 'Ação']],
          body: patientRows,
          margin: { left: 14 },
          theme: 'striped',
          headStyles: { fillColor: [37, 99, 235] }, // Cor azul para o cabeçalho
          styles: { fontSize: 10 }, // Tamanho da fonte menor para caber mais conteúdo
          columnStyles: {
            0: { cellWidth: 40 }, // Nome
            1: { cellWidth: 40 }, // Endereço
            2: { cellWidth: 25 }, // Bairro
            3: { cellWidth: 25 }, // Cidade
            4: { cellWidth: 25 }, // Telefone
            5: { cellWidth: 30 }  // Ação
          }
        });
        
        doc.save('listagem_geral_atendimentos.pdf');
      }
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      setError(error instanceof Error ? error.message : 'Erro ao gerar PDF');
    } finally {
      setLoading(false);
    }
  };

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-gray-50 to-gray-100">
      <header className="sticky top-0 z-10 bg-gradient-to-r from-blue-800 to-indigo-900 text-white shadow-md p-4">
        <div className="container mx-auto px-2">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Relatórios</h1>
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
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">Erro!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-gray-200">Configurações do Relatório</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-medium mb-2">Tipo de Relatório</h3>
                  <div className="flex flex-col space-y-2">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        className="form-radio text-blue-600"
                        name="reportType"
                        value="campaign"
                        checked={reportType === 'campaign'}
                        onChange={() => handleReportTypeChange('campaign')}
                      />
                      <span className="ml-2">Relatório por Ação</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        className="form-radio text-blue-600"
                        name="reportType"
                        value="general"
                        checked={reportType === 'general'}
                        onChange={() => handleReportTypeChange('general')}
                      />
                      <span className="ml-2">Listagem Geral</span>
                    </label>
                  </div>
                </div>
                
                {reportType === 'campaign' && (
                  <div>
                    <h3 className="text-base font-medium mb-2">Selecione a Ação</h3>
                    <select
                      value={selectedCampaign}
                      onChange={handleCampaignChange}
                      className="w-full px-3 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Selecione uma ação</option>
                      {campaigns.map((campaign) => (
                        <option key={campaign.id} value={campaign.id}>
                          {campaign.titulo}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                <div>
                  <h3 className="text-base font-medium mb-2">Formato de Download</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={downloadCSV}
                      className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white hover:bg-gray-50 text-gray-700 transition-colors"
                      disabled={loading || (reportType === 'campaign' && !selectedCampaign)}
                    >
                      <FaFileCsv className="mr-2" /> CSV
                    </button>
                    <button
                      onClick={downloadPDF}
                      className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-md shadow-sm transition-colors"
                      disabled={loading || (reportType === 'campaign' && !selectedCampaign)}
                    >
                      <FaFilePdf className="mr-2" /> PDF
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-2">
            {loading ? (
              <div className="bg-white rounded-lg shadow-sm p-6 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
              </div>
            ) : reportType === 'campaign' && selectedCampaign && statsData ? (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-gray-200">
                  Relatório: {selectedCampaignData?.titulo}
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Card className="shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-white to-blue-50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-center">Total de Atendimentos</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <p className="text-2xl font-bold text-center text-blue-700">{statsData.total}</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-white to-green-50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-center">Agendados</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <p className="text-2xl font-bold text-center text-green-700">{statsData.scheduledProcedures}</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-white to-purple-50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-center">Finalizados</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <p className="text-2xl font-bold text-center text-purple-700">{statsData.completedProcedures}</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Distribuição por Cidade/Bairro */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Distribuição por Cidade/Bairro</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={statsData.cities} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis type="category" dataKey="name" width={150} />
                            <Tooltip />
                            <Bar dataKey="value" fill="#8884d8" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Distribuição por Gênero */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Distribuição por Gênero</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={statsData.gender} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis type="category" dataKey="name" width={100} />
                            <Tooltip />
                            <Bar dataKey="value" fill="#8884d8" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Distribuição por Escolaridade */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Distribuição por Escolaridade</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={statsData.education}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill="#8884d8" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Distribuição por Faixa Etária */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Distribuição por Faixa Etária</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={statsData.ageGroups} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis type="category" dataKey="name" />
                            <Tooltip />
                            <Bar dataKey="value" fill="#8884d8" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Distribuição por Renda Familiar */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Distribuição por Renda Familiar</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={statsData.income} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis type="category" dataKey="name" width={150} />
                            <Tooltip />
                            <Bar dataKey="value" fill="#8884d8" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : reportType === 'general' ? (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-gray-200">
                  Listagem Geral
                </h2>
                <p className="text-gray-700 mb-4">
                  Este relatório contém a listagem completa de todas as pessoas atendidas em todas as ações.
                </p>
                <p className="text-gray-700">
                  Clique em um dos botões abaixo para baixar o relatório no formato desejado.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-6 flex items-center justify-center h-full">
                <div className="text-center text-gray-500">
                  <p className="mb-4 text-lg font-medium">Selecione uma ação para visualizar o relatório</p>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-16 w-16 mx-auto text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 