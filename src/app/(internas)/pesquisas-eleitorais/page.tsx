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
  updateDoc
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
import { User as UserIcon, ShieldCheck, RefreshCw, Maximize2, Plus } from 'lucide-react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { PesquisaModal } from './components/PesquisaModal';
import { PesquisasTable } from './components/PesquisasTable';
import { motion } from 'framer-motion';
import 'chartjs-adapter-date-fns';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ChartDataLabels, TimeScale);

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
  const [user, setUser] = useState<any>(null);
  const [greeting, setGreeting] = useState('');
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
      const q = query(collection(db, 'pesquisas_eleitorais'), orderBy('data'));
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
    // Saudação baseada no horário
    const updateGreeting = () => {
      const currentHour = new Date().getHours();
      if (currentHour >= 5 && currentHour < 12) setGreeting('Bom dia');
      else if (currentHour >= 12 && currentHour < 18) setGreeting('Boa tarde');
      else setGreeting('Boa noite');
    };
    updateGreeting();
    setUser({ name: 'Usuário', role: 'admin' }); // Simulação, troque pelo seu auth
    fetchPesquisas();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (editingPesquisa?.id) {
        // Atualizar pesquisa existente
        await updateDoc(doc(db, 'pesquisas_eleitorais', editingPesquisa.id), {
          ...form,
          votos: Number(form.votos),
          criadoEm: new Date().toISOString()
        });
      } else {
        // Adicionar nova pesquisa
        await addDoc(collection(db, 'pesquisas_eleitorais'), {
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
        await deleteDoc(doc(db, 'pesquisas_eleitorais', id));
        await fetchPesquisas();
      } catch (err) {
        setError('Erro ao excluir pesquisa.');
      }
    }
  };

  // Agrupa por candidato para o gráfico
  const candidatos = Array.from(new Set(pesquisas.map(p => p.candidato)));
  const cargos = Array.from(new Set(pesquisas.map(p => p.cargo)));
  const datas = Array.from(new Set(pesquisas.map(p => p.data))).sort();

  // Converter datas para objetos Date para o gráfico
  const datasDate = datas.map(dataStr => new Date(dataStr));

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

  const datasets = candidatosFiltrados.map((candidato, idx) => ({
    label: candidato,
    data: datas.map(data => {
      const pesquisa = pesquisasFiltradas.find(p => p.candidato === candidato && p.data === data);
      return pesquisa ? { x: new Date(data), y: pesquisa.votos, instituto: pesquisa.instituto } : null;
    }),
    fill: false,
    borderColor: `hsl(${(idx * 80) % 360}, 70%, 55%)`,
    backgroundColor: `hsl(${(idx * 80) % 360}, 70%, 55%)`,
    tension: 0.1,
    pointRadius: 6,
    pointHoverRadius: 8,
    pointBorderWidth: 2,
    pointStyle: 'circle',
  }));

  const chartData = {
    labels: datasDate,
    datasets
  };

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
      datalabels: {
        display: true,
        align: 'top' as const,
        anchor: 'end' as const,
        font: { weight: 'bold' as const, size: 14 },
        color: '#111',
        formatter: function(value: any, context: any) {
          if (!value) return '';
          // Mostra valor% (INSTITUTO)
          return `${value.y?.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}% (${value.instituto || ''})`;
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: 'Votos (%)' },
        grid: { display: false }
      },
      x: {
        type: 'time' as const,
        time: {
          unit: 'day' as const,
          tooltipFormat: 'dd/MM/yyyy',
          displayFormats: {
            day: 'dd/MM/yyyy',
            month: 'MM/yyyy',
            year: 'yyyy'
          }
        },
        title: { display: true, text: 'Data da Pesquisa' },
        grid: { display: false },
        ticks: {
          callback: function(value: any) {
            // value é timestamp, formatar para dd/MM/yyyy
            const d = new Date(value);
            if (isNaN(d.getTime())) return '';
            return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
          }
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cabeçalho */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Pesquisas Eleitorais</h1>
              <p className="mt-1 text-sm text-gray-500">
                {greeting}, {user?.name}
              </p>
            </div>
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
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-5 w-5 mr-2" />
              Nova Pesquisa
            </motion.button>
          </div>
        </div>

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
      </div>

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