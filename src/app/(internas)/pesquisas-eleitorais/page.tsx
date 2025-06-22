'use client';
import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  doc,
  deleteDoc,
  updateDoc,
  Firestore
} from 'firebase/firestore';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
} from 'chart.js';
import { RefreshCw, Maximize2, Plus } from 'lucide-react';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { PesquisaModal } from './components/PesquisaModal';
import { PesquisasTable } from './components/PesquisasTable';
import { motion } from 'framer-motion';
import 'chartjs-adapter-date-fns';

// Registrar todos os componentes necessários do Chart.js
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend, 
  ChartDataLabels, 
  TimeScale
);

interface PesquisaEleitoral {
  id?: string;
  apoio: string;
  candidato: string;
  cargo: string;
  criadoEm: string;
  data: string;
  instituto: string;
  municipio: string;
  municipioMonitorado: boolean;
  tipo: string;
  votos: number;
}

const MUNICIPIOS_PIAUI = [
  'Acauã', 'Agricolândia', 'Água Branca', 'Alagoinha do Piauí', 'Alegrete do Piauí', 'Alto Longá',
  'Altos', 'Alvorada do Gurguéia', 'Amarante', 'Angical do Piauí', 'Anísio de Abreu', 'Antônio Almeida',
  'Aroazes', 'Aroeiras do Itaim', 'Arraial', 'Assunção do Piauí', 'Avelino Lopes', 'Baixa Grande do Ribeiro',
  'Barra D\'Alcântara', 'Barras', 'Barreiras do Piauí', 'Barro Duro', 'Batalha', 'Bela Vista do Piauí',
  'Belém do Piauí', 'Beneditinos', 'Bertolínia', 'Betânia do Piauí', 'Boa Hora', 'Bocaina',
  'Bom Jesus', 'Bom Princípio do Piauí', 'Bonfim do Piauí', 'Boqueirão do Piauí', 'Brasileira',
  'Brejo do Piauí', 'Buriti dos Lopes', 'Buriti dos Montes', 'Cabeceiras do Piauí', 'Cajazeiras do Piauí',
  'Cajueiro da Praia', 'Caldeirão Grande do Piauí', 'Campinas do Piauí', 'Campo Alegre do Fidalgo',
  'Campo Grande do Piauí', 'Campo Largo do Piauí', 'Campo Maior', 'Canavieira', 'Canto do Buriti',
  'Capitão de Campos', 'Capitão Gervásio Oliveira', 'Caracol', 'Caraúbas do Piauí', 'Caridade do Piauí',
  'Castelo do Piauí', 'Caxingó', 'Cocal', 'Cocal de Telha', 'Cocal dos Alves', 'Coivaras',
  'Colônia do Gurguéia', 'Colônia do Piauí', 'Conceição do Canindé', 'Coronel José Dias',
  'Corrente', 'Cristalândia do Piauí', 'Cristino Castro', 'Curimatá', 'Currais', 'Curral Novo do Piauí',
  'Curralinhos', 'Demerval Lobão', 'Dirceu Arcoverde', 'Dom Expedito Lopes', 'Dom Inocêncio',
  'Domingos Mourão', 'Elesbão Veloso', 'Eliseu Martins', 'Esperantina', 'Fartura do Piauí',
  'Flores do Piauí', 'Floresta do Piauí', 'Francisco Ayres', 'Francisco Macedo', 'Francisco Santos',
  'Fronteiras', 'Geminiano', 'Gilbués', 'Guadalupe', 'Guaribas', 'Hugo Napoleão', 'Ilha Grande',
  'Inhuma', 'Ipiranga do Piauí', 'Isaías Coelho', 'Itainópolis', 'Itaueira', 'Jacobina do Piauí',
  'Jaicós', 'Jardim do Mulato', 'Jatobá do Piauí', 'Jerumenha', 'João Costa', 'Joaquim Pires',
  'Joca Marques', 'José de Freitas', 'Juazeiro do Piauí', 'Júlio Borges', 'Jurema', 'Lagoa Alegre',
  'Lagoa de São Francisco', 'Lagoa do Barro do Piauí', 'Lagoa do Piauí', 'Lagoa do Sítio',
  'Lagoinha do Piauí', 'Landri Sales', 'Luís Correia', 'Luzilândia', 'Madeiro', 'Manoel Emídio',
  'Marcolândia', 'Marcos Parente', 'Massapê do Piauí', 'Matias Olímpio', 'Miguel Alves',
  'Miguel Leão', 'Milton Brandão', 'Monsenhor Gil', 'Monsenhor Hipólito', 'Monte Alegre do Piauí',
  'Morro Cabeça no Tempo', 'Morro do Chapéu do Piauí', 'Murici dos Portelas', 'Nazaré do Piauí',
  'Nazária', 'Nossa Senhora de Nazaré', 'Nossa Senhora dos Remédios', 'Nova Santa Rita',
  'Novo Oriente do Piauí', 'Novo Santo Antônio', 'Oeiras', 'Olho D\'Água do Piauí', 'Padre Marcos',
  'Paes Landim', 'Pajeú do Piauí', 'Palmeira do Piauí', 'Palmeirais', 'Paquetá', 'Parnaguá',
  'Parnaíba', 'Passagem Franca do Piauí', 'Patos do Piauí', 'Pau D\'Arco do Piauí', 'Paulistana',
  'Pavussu', 'Pedro II', 'Pedro Laurentino', 'Picos', 'Pimenteiras', 'Pio IX', 'Piracuruca',
  'Piripiri', 'Porto', 'Porto Alegre do Piauí', 'Prata do Piauí', 'Queimada Nova',
  'Redenção do Gurguéia', 'Regeneração', 'Riacho Frio', 'Ribeira do Piauí', 'Ribeiro Gonçalves',
  'Rio Grande do Piauí', 'Santa Cruz do Piauí', 'Santa Cruz dos Milagres', 'Santa Filomena',
  'Santa Luz', 'Santa Rosa do Piauí', 'Santana do Piauí', 'Santo Antônio de Lisboa',
  'Santo Antônio dos Milagres', 'Santo Inácio do Piauí', 'São Braz do Piauí', 'São Félix do Piauí',
  'São Francisco de Assis do Piauí', 'São Francisco do Piauí', 'São Gonçalo do Gurguéia',
  'São Gonçalo do Piauí', 'São João da Canabrava', 'São João da Fronteira', 'São João da Serra',
  'São João da Varjota', 'São João do Arraial', 'São João do Piauí', 'São José do Divino',
  'São José do Peixe', 'São José do Piauí', 'São Julião', 'São Lourenço do Piauí', 'São Luis do Piauí',
  'São Miguel da Baixa Grande', 'São Miguel do Fidalgo', 'São Miguel do Tapuio', 'São Pedro do Piauí',
  'São Raimundo Nonato', 'Sebastião Barros', 'Sebastião Leal', 'Sigefredo Pacheco', 'Simões',
  'Simplício Mendes', 'Socorro do Piauí', 'Sussuapara', 'Tamboril do Piauí', 'Tanque do Piauí',
  'Teresina', 'União', 'Uruçuí', 'Valença do Piauí', 'Várzea Branca', 'Várzea Grande',
  'Vera Mendes', 'Vila Nova do Piauí', 'Wall Ferraz'
].sort();

export default function PesquisasEleitoraisPage() {
  const [form, setForm] = useState<PesquisaEleitoral>({
    apoio: '',
    candidato: '',
    cargo: '',
    criadoEm: new Date().toISOString(),
    data: '',
    instituto: '',
    municipio: '',
    municipioMonitorado: false,
    tipo: '',
    votos: 0
  });
  const [pesquisas, setPesquisas] = useState<PesquisaEleitoral[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPesquisa, setEditingPesquisa] = useState<PesquisaEleitoral | null>(null);
  
  // Estados para os filtros
  const [filtroMunicipio, setFiltroMunicipio] = useState<string>('todos');
  const [filtroCargo, setFiltroCargo] = useState<string>('todos');
  const [filtroCandidato, setFiltroCandidato] = useState<string>('todos');
  const [filtroDataInicial, setFiltroDataInicial] = useState<string>('');
  const [filtroDataFinal, setFiltroDataFinal] = useState<string>('');
  const [filtroInstituto, setFiltroInstituto] = useState<string>('todos');

  // Carrega pesquisas e usuário
  const fetchPesquisas = async () => {
    setLoading(true);
    try {
      const q = query(collection(db as Firestore, 'pesquisas_eleitorais'), orderBy('data'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as PesquisaEleitoral));
      setPesquisas(data);
    } catch (err) {
      setError('Erro ao buscar pesquisas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPesquisas();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (editingPesquisa?.id) {
        // Atualizar pesquisa existente
        await updateDoc(doc(db as Firestore, 'pesquisas_eleitorais', editingPesquisa.id), {
          ...form,
          votos: Number(form.votos),
          criadoEm: new Date().toISOString()
        });
      } else {
        // Adicionar nova pesquisa
        await addDoc(collection(db as Firestore, 'pesquisas_eleitorais'), {
          ...form,
          votos: Number(form.votos),
          criadoEm: new Date().toISOString()
        });
      }
      setForm({
        apoio: '',
        candidato: '',
        cargo: '',
        criadoEm: new Date().toISOString(),
        data: '',
        instituto: '',
        municipio: '',
        municipioMonitorado: false,
        tipo: '',
        votos: 0
      });
      setEditingPesquisa(null);
      setIsModalOpen(false);
      await fetchPesquisas();
    } catch (err) {
      setError('Erro ao salvar pesquisa.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (pesquisa: PesquisaEleitoral) => {
    setEditingPesquisa(pesquisa);
    setForm(pesquisa);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta pesquisa?')) {
      try {
        await deleteDoc(doc(db as Firestore, 'pesquisas_eleitorais', id));
        await fetchPesquisas();
      } catch (err) {
        setError('Erro ao excluir pesquisa.');
      }
    }
  };

  // Agrupa por candidato para o gráfico
  const candidatos = Array.from(new Set(pesquisas.map(p => p.candidato)));
  const cargos = Array.from(new Set(pesquisas.map(p => p.cargo)));

  // Filtra as pesquisas com base nos filtros selecionados
  const pesquisasFiltradas = pesquisas.filter(pesquisa => {
    const matchMunicipio = filtroMunicipio === 'todos' || pesquisa.municipio === filtroMunicipio;
    const matchCargo = filtroCargo === 'todos' || pesquisa.cargo === filtroCargo;
    const matchCandidato = filtroCandidato === 'todos' || pesquisa.candidato === filtroCandidato;
    const matchInstituto = filtroInstituto === 'todos' || pesquisa.instituto === filtroInstituto;
    
    const dataPesquisa = new Date(pesquisa.data);
    const matchDataInicial = !filtroDataInicial || dataPesquisa >= new Date(filtroDataInicial);
    const matchDataFinal = !filtroDataFinal || dataPesquisa <= new Date(filtroDataFinal);
    
    return matchMunicipio && matchCargo && matchCandidato && matchInstituto && matchDataInicial && matchDataFinal;
  });

  // Verifica se os filtros essenciais estão preenchidos
  const filtrosEssenciaisPreenchidos = filtroMunicipio !== 'todos' && filtroCargo !== 'todos';

  // Atualiza a lista de candidatos com base nos filtros
  const candidatosFiltrados = Array.from(new Set(pesquisasFiltradas.map(p => p.candidato)));

  // Obter apenas as datas que têm pesquisas filtradas (resolve problema 1)
  const datasComPesquisas = Array.from(new Set(pesquisasFiltradas.map(p => p.data))).sort();

  // Calcular o valor máximo para ajustar a escala do eixo Y (resolve problema 2)
  const valorMaximo = Math.max(...pesquisasFiltradas.map(p => p.votos));
  const limiteY = Math.ceil(valorMaximo * 1.2); // 20% de margem superior

  const datasets = candidatosFiltrados.map((candidato, idx) => {
    // Criar array de dados para cada candidato, mantendo a ordem das datas
    const dadosCandidato = datasComPesquisas.map(data => {
      const pesquisa = pesquisasFiltradas.find(p => p.candidato === candidato && p.data === data);
      return pesquisa ? pesquisa.votos : null;
    });

    return {
      label: candidato,
      data: dadosCandidato,
      fill: false,
      borderColor: `hsl(${(idx * 80) % 360}, 70%, 55%)`,
      backgroundColor: `hsl(${(idx * 80) % 360}, 70%, 55%)`,
      tension: 0.1,
      pointRadius: 6,
      pointHoverRadius: 8,
      pointBorderWidth: 2,
      pointStyle: 'circle',
      spanGaps: false, // Não conecta pontos quando há valores nulos
      // Armazenar informações do instituto para tooltip
      institutos: datasComPesquisas.map(data => {
        const pesquisa = pesquisasFiltradas.find(p => p.candidato === candidato && p.data === data);
        return pesquisa ? pesquisa.instituto : null;
      })
    };
  });

  const chartData = {
    labels: datasComPesquisas.map(data => new Date(data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })),
    datasets
  };

  // Verificar se há dados para mostrar
  const hasData = datasets.some(dataset => dataset.data.some(value => value !== null && value !== undefined));

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: true, position: 'top' as const },
      title: { 
        display: true, 
        text: 'Evolução das Pesquisas', 
        font: { 
          size: 22, 
          weight: 'bold' as const 
        } 
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const dataset = context.dataset;
            const dataIndex = context.dataIndex;
            const instituto = dataset.institutos?.[dataIndex] || '';
            const value = context.parsed.y;
            
            if (value === null || value === undefined) return '';
            
            return `${context.dataset.label}: ${value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}% (${instituto})`;
          }
        }
      },
      datalabels: {
        display: true,
        align: 'top' as const,
        anchor: 'end' as const,
        font: { weight: 'bold' as const, size: 14 },
        color: '#111',
        formatter: function(value: any, context: any) {
          if (value === null || value === undefined) return '';
          
          // Buscar instituto correspondente
          const dataset = context.dataset;
          const dataIndex = context.dataIndex;
          const instituto = dataset.institutos?.[dataIndex] || '';
          
          // Mostra valor% (INSTITUTO)
          return `${value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}% (${instituto})`;
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: pesquisasFiltradas.length > 0 ? limiteY : 100, // Usa limite calculado ou 100 como padrão
        title: { display: true, text: 'Votos (%)' },
        grid: { display: false },
        ticks: {
          stepSize: Math.max(1, Math.ceil(limiteY / 10)) // Divide o eixo Y em ~10 marcações
        }
      },
      x: {
        type: 'category' as const, // Mudança para category para mostrar apenas datas com dados
        title: { display: true, text: 'Data da Pesquisa' },
        grid: { display: false },
        ticks: {
          maxRotation: 45 // Rotaciona labels se necessário para melhor legibilidade
        }
      }
    }
  };

  const toggleFullscreen = () => {
    const chartContainer = document.getElementById('chart-container');
    if (!chartContainer) return;

    if (!isFullscreen) {
      if (chartContainer.requestFullscreen) {
        chartContainer.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      {/* Navbar interna do conteúdo */}
      <nav className="w-full bg-white border-b border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex flex-col items-start">
            <span className="text-base md:text-lg font-semibold text-gray-900">Pesquisas Eleitorais</span>
            <span className="text-xs text-gray-500 font-light">Gerencie e acompanhe a evolução das pesquisas eleitorais por município e candidato</span>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setEditingPesquisa(null);
                setForm({
                  apoio: '',
                  candidato: '',
                  cargo: '',
                  criadoEm: new Date().toISOString(),
                  data: '',
                  instituto: '',
                  municipio: '',
                  municipioMonitorado: false,
                  tipo: '',
                  votos: 0
                });
                setIsModalOpen(true);
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded text-xs transition-colors border bg-white hover:bg-blue-50 text-blue-700 cursor-pointer border-gray-200"
            >
              <Plus className="h-4 w-4" />
              Nova Pesquisa
            </motion.button>
          </div>
        </div>
      </nav>

      {/* Conteúdo principal */}
      <main className="p-0 w-full flex-1">
        <div className="px-4 py-8">

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow p-4 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Município</label>
              <select
                value={filtroMunicipio}
                onChange={e => setFiltroMunicipio(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="todos">Todos os municípios</option>
                {MUNICIPIOS_PIAUI.map(municipio => (
                  <option key={municipio} value={municipio}>{municipio}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
              <select
                value={filtroCargo}
                onChange={e => setFiltroCargo(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="todos">Todos os cargos</option>
                <option value="Deputado Federal">Deputado Federal</option>
                <option value="Deputado Estadual">Deputado Estadual</option>
                <option value="Governador">Governador</option>
                <option value="Prefeito">Prefeito</option>
                <option value="Presidente">Presidente</option>
                <option value="Senador">Senador</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Candidato</label>
              <select
                value={filtroCandidato}
                onChange={(e) => setFiltroCandidato(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="todos">Todos os candidatos</option>
                {candidatos.map((candidato) => (
                  <option key={candidato} value={candidato}>
                    {candidato}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Instituto</label>
              <select
                value={filtroInstituto}
                onChange={(e) => setFiltroInstituto(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="todos">Todos os institutos</option>
                {Array.from(new Set(pesquisas.map(p => p.instituto))).map((instituto) => (
                  <option key={instituto} value={instituto}>
                    {instituto}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Inicial</label>
              <input
                type="date"
                value={filtroDataInicial}
                onChange={(e) => setFiltroDataInicial(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Final</label>
              <input
                type="date"
                value={filtroDataFinal}
                onChange={(e) => setFiltroDataFinal(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Gráfico */}
        {filtrosEssenciaisPreenchidos ? (
          <div className="bg-white rounded-lg shadow p-4 mb-8">
            <div id="chart-container" className="relative">
              {isFullscreen && filtroMunicipio !== 'todos' && (
                <div style={{
                  position: 'absolute',
                  top: 16,
                  left: 16,
                  zIndex: 10,
                  background: 'rgba(255,255,255,0.9)',
                  padding: '8px 20px',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  fontSize: '1.2rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                }}>
                  Município: {filtroMunicipio}
                </div>
              )}
              <Line
                key={JSON.stringify(chartData.labels) + JSON.stringify(chartData.datasets.map(ds => ds.label))}
                data={chartData}
                options={chartOptions}
              />
              <button
                onClick={toggleFullscreen}
                className="absolute top-2 right-2 p-2 text-gray-500 hover:text-gray-700"
              >
                <Maximize2 size={20} />
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-8 mb-8 text-center">
            <p className="text-gray-500">
              Selecione um município e um cargo para visualizar o gráfico de evolução das pesquisas.
            </p>
          </div>
        )}

        {/* Tabela de Pesquisas */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <PesquisasTable
            pesquisas={pesquisasFiltradas}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-gray-500">
            © 2025 86 Dynamics - Todos os direitos reservados
          </div>
        </div>
      </main>

      {/* Modal */}
      <PesquisaModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPesquisa(null);
          setForm({
            apoio: '',
            candidato: '',
            cargo: '',
            criadoEm: new Date().toISOString(),
            data: '',
            instituto: '',
            municipio: '',
            municipioMonitorado: false,
            tipo: '',
            votos: 0
          });
        }}
        onSubmit={handleSubmit}
        form={form}
        setForm={setForm}
        loading={loading}
        error={error}
        MUNICIPIOS_PIAUI={MUNICIPIOS_PIAUI}
      />
    </div>
  );
} 