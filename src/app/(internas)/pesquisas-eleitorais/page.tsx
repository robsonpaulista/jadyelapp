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
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Eye, Pencil, Trash2 } from 'lucide-react';

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

  // Funções auxiliares
  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  // Preparar dados do gráfico
  const chartConfig = {
    data: {
      labels: datasComPesquisas.map(data => {
        const pesquisa = pesquisasFiltradas.find(p => p.data === data);
        return `${formatarData(data)} - ${pesquisa?.instituto || ''}`;
      }),
      datasets: candidatosFiltrados.map((candidato, index) => ({
        label: candidato,
        data: datasComPesquisas.map(data => {
          const pesquisa = pesquisasFiltradas.find(p => p.data === data && p.candidato === candidato);
          return pesquisa ? pesquisa.votos : null;
        }),
        borderColor: `hsl(${index * (360 / candidatosFiltrados.length)}, 70%, 50%)`,
        backgroundColor: `hsla(${index * (360 / candidatosFiltrados.length)}, 70%, 50%, 0.5)`,
        tension: 0.4,
        fill: false,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBorderWidth: 2,
        pointStyle: 'circle' as const
      }))
    },
    options: {
      responsive: true,
      maintainAspectRatio: !isFullscreen,
      aspectRatio: 2,
      plugins: {
        legend: {
          position: 'top' as const,
        },
        tooltip: {
          callbacks: {
            label: function(context: any) {
              const value = context.parsed.y;
              const label = context.dataset.label;
              const instituto = context.label.split(' - ')[1];
              return `${label}: ${value}% (${instituto})`;
            }
          }
        },
        datalabels: {
          backgroundColor: 'white',
          borderRadius: 4,
          color: 'black',
          font: {
            weight: 'bold' as const,
            size: 12
          },
          padding: 4,
          formatter: (value: any) => value ? `${value}%` : '',
          align: 'top' as const,
          anchor: 'end' as const
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: Math.ceil(valorMaximo / 10) * 10,
          ticks: {
            callback: (value: any) => `${value}%`
          },
          grid: {
            display: false
          }
        },
        x: {
          grid: {
            display: false
          },
          ticks: {
            maxRotation: 45
          }
        }
      }
    }
  };

  // Função para alternar modo tela cheia
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      const element = document.querySelector('.chart-container');
      if (element) {
        if (element.requestFullscreen) {
          element.requestFullscreen();
        }
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // Monitorar mudanças no modo tela cheia
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Função para atualizar dados
  const handleAtualizar = async () => {
    await fetchPesquisas();
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-4 py-4">
        {/* Header */}
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Pesquisas Eleitorais</h1>
          <p className="text-sm text-gray-500">Gerencie e acompanhe a evolução das pesquisas eleitorais por município e candidato</p>
        </div>

        {/* Botão Nova Pesquisa */}
        <div className="flex justify-end">
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

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow p-4">
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

        {/* Total */}
        <div className="text-sm text-gray-500">
          Total: {pesquisasFiltradas.length} pesquisa(s)
        </div>

        {/* Gráfico */}
        {filtrosEssenciaisPreenchidos && pesquisasFiltradas.length > 0 && (
          <div className="relative bg-white rounded-lg shadow p-4 mt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Evolução das Pesquisas</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAtualizar}
                  disabled={loading}
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  <span className="ml-2">Atualizar</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleFullscreen}
                >
                  <Maximize2 className="h-4 w-4" />
                  <span className="ml-2">Tela Cheia</span>
                </Button>
              </div>
            </div>
            <div className={`chart-container ${isFullscreen ? 'fixed inset-0 z-50 bg-white p-4' : ''}`}>
              <Line data={chartConfig.data} options={chartConfig.options} />
            </div>
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

      {/* Modal */}
      <PesquisaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        pesquisa={editingPesquisa}
        form={form}
        setForm={setForm}
        onSave={handleSubmit}
        loading={loading}
        error={error}
        MUNICIPIOS_PIAUI={MUNICIPIOS_PIAUI}
      />
    </div>
  );
} 