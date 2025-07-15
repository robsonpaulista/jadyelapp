"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Maximize2, Minimize2, X } from 'lucide-react';
import { createRoot } from 'react-dom/client';
import TerritoriosFilter from './TerritoriosFilter';
import TerritorioSummaryModal from './TerritorioSummaryModal';

interface Municipio {
  id: string;
  nome: string;
  latitude: number;
  longitude: number;
}

interface ProjecaoMunicipio {
  municipio: string;
  liderancasAtuais: number;
  votacao2022: number;
  expectativa2026: number;
  crescimento: number;
  eleitores: number;
  alcance: number;
}

interface ResultadoEleicao {
  municipio: string;
  nomeUrnaCandidato: string;
  quantidadeVotosNominais: string;
  partido: string;
}

interface Lideranca {
  municipio: string;
  lideranca: string;
  liderancaAtual: string;
  cargo2024: string;
  votacao2022: string;
  expectativa2026: string;
  urlImagem: string;
}

// Função para obter cor baseada no crescimento da votação
const obterCorCrescimento = (crescimento: number): string => {
  if (crescimento >= 100) {
    return '#059669'; // Verde escuro - Novo município
  }
  if (crescimento > 5) {
    return '#22c55e'; // Verde - Cresceu
  }
  if (crescimento < -5) {
    return '#ef4444'; // Vermelho - Caiu
  }
  return '#eab308'; // Amarelo - Estável
};

// Função para obter descrição do crescimento
const obterDescricaoCrescimento = (crescimento: number): string => {
  if (crescimento >= 100) {
    return `Novo (${crescimento.toFixed(0)}%)`;
  }
  if (crescimento > 5) {
    return `Cresceu ${crescimento.toFixed(0)}%`;
  }
  if (crescimento < -5) {
    return `Caiu ${Math.abs(crescimento).toFixed(0)}%`;
  }
  return `Estável (${crescimento.toFixed(0)}%)`;
};

// Função para obter os 5 candidatos mais votados em 2022
const obterTop5Candidatos2022 = (municipio: string, dadosEleicoes2022: ResultadoEleicao[]): ResultadoEleicao[] => {
  const dadosMunicipio2022 = dadosEleicoes2022.filter(d => 
    d.municipio.toUpperCase() === municipio.toUpperCase()
  );
  
  return dadosMunicipio2022
    .sort((a, b) => {
      const votosA = parseInt(a.quantidadeVotosNominais) || 0;
      const votosB = parseInt(b.quantidadeVotosNominais) || 0;
      return votosB - votosA;
    })
    .slice(0, 5);
};

const obterTop5Estaduais2022 = (municipio: string, dadosEleicoesEstaduais2022: ResultadoEleicao[]): ResultadoEleicao[] => {
  const dadosMunicipioEstaduais2022 = dadosEleicoesEstaduais2022.filter(d => 
    d.municipio.toUpperCase() === municipio.toUpperCase()
  );
  
  return dadosMunicipioEstaduais2022
    .sort((a, b) => {
      const votosA = parseInt(a.quantidadeVotosNominais) || 0;
      const votosB = parseInt(b.quantidadeVotosNominais) || 0;
      return votosB - votosA;
    })
    .slice(0, 5);
};

// Função para criar ícone SVG personalizado baseado na cor
const criarIconePersonalizado = (cor: string): L.Icon => {
  const svgString = `
    <svg width="8" height="14" viewBox="0 0 12 20" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 0C2.69 0 0 2.69 0 6c0 4.5 6 14 6 14s6-9.5 6-14c0-3.31-2.69-6-6-6z" fill="${cor}" stroke="#fff" stroke-width="1"/>
      <circle cx="6" cy="6" r="2" fill="#fff"/>
    </svg>
  `;
  
  // Verificar se estamos no cliente antes de usar APIs do browser
  if (typeof window === 'undefined') {
    return new L.Icon({
      iconUrl: 'data:image/svg+xml;base64,' + btoa(svgString),
      iconSize: [8, 14],
      iconAnchor: [4, 14],
      popupAnchor: [1, -14],
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      shadowSize: [14, 14],
      shadowAnchor: [6, 16],
    });
  }
  
  const blob = new Blob([svgString], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  
  return new L.Icon({
    iconUrl: url,
    iconSize: [8, 14],
    iconAnchor: [4, 14],
    popupAnchor: [1, -14],
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    shadowSize: [14, 14],
    shadowAnchor: [6, 16],
  });
};

// Funções de formatação
const formatNumber = (value: number | null | undefined): string => {
  if (!value || isNaN(value)) return '-';
  return new Intl.NumberFormat('pt-BR').format(value);
};

const formatPercentage = (value: number | null | undefined): string => {
  if (!value || isNaN(value)) return '-';
  return `${value.toFixed(1)}%`;
};

interface MapaPiauiProps {
  onFilterChange?: (territorio: string | null, municipiosNomes: string[]) => void;
}

export default function MapaPiaui({ onFilterChange }: MapaPiauiProps) {
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [projecoes, setProjecoes] = useState<ProjecaoMunicipio[]>([]);
  const [dadosEleicoes2022, setDadosEleicoes2022] = useState<ResultadoEleicao[]>([]);
  const [dadosEleicoesEstaduais2022, setDadosEleicoesEstaduais2022] = useState<ResultadoEleicao[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markerRefs = useRef<{[key: string]: L.Marker}>({});
  const [filteredMunicipios, setFilteredMunicipios] = useState<string[]>([]);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [selectedTerritorioSummary, setSelectedTerritorioSummary] = useState<{
    territorio: string;
    municipios: string[];
  } | null>(null);
  const [showLiderancasModal, setShowLiderancasModal] = useState(false);
  const [selectedMunicipioLiderancas, setSelectedMunicipioLiderancas] = useState<string>('');
  const [liderancasMunicipio, setLiderancasMunicipio] = useState<Lideranca[]>([]);
  const [loadingLiderancas, setLoadingLiderancas] = useState(false);

  // Função para registrar referência do marcador usando useCallback
  const registerMarker = useCallback((municipio: string, marker: L.Marker) => {
    markerRefs.current[municipio] = marker;
  }, []);

  useEffect(() => {
    const carregarDados = async () => {
      try {
        // Carregar coordenadas dos municípios
        const responseMunicipios = await fetch('/coordenadas_municipios.json');
        const dataMunicipios = await responseMunicipios.json();
        setMunicipios(dataMunicipios.municipios || []);

        // Carregar dados de projeção
        const responseProjecoes = await fetch('/api/projecao-municipios');
        const dataProjecoes = await responseProjecoes.json();
        setProjecoes(dataProjecoes);

        // Carregar dados de Deputado Federal 2022
        const responseEleicoes = await fetch('/api/resultado-eleicoes?tipo=deputado_federal_2022');
        const dataEleicoes = await responseEleicoes.json();
        setDadosEleicoes2022(dataEleicoes.resultados || []);

        // Carregar dados de Deputado Estadual 2022
        const responseEleicoesEstaduais = await fetch('/api/resultado-eleicoes?tipo=deputado_estadual_2022');
        const dataEleicoesEstaduais = await responseEleicoesEstaduais.json();
        setDadosEleicoesEstaduais2022(dataEleicoesEstaduais.resultados || []);

        // Após carregar os dados, abrir tooltips relevantes
        setTimeout(() => {
          if (mapRef.current) {
            // Encontrar municípios com crescimento relevante
            const municipiosRelevantes = dataProjecoes.filter((p: ProjecaoMunicipio) => p.crescimento > 15);
            
            // Abrir tooltips para cada município relevante
            Object.entries(markerRefs.current).forEach(([municipio, marker]) => {
              const projecao = municipiosRelevantes.find((p: ProjecaoMunicipio) => 
                p.municipio.toUpperCase() === municipio.toUpperCase()
              );
              if (projecao) {
                marker.openTooltip();
              }
            });
          }
        }, 1000);

      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, []);

  // Detectar mudanças no estado de tela cheia
  useEffect(() => {
    // Verificar se estamos no cliente
    if (typeof window === 'undefined') return;
    
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      // Redimensionar o mapa quando entrar/sair da tela cheia
      if (mapRef.current) {
        setTimeout(() => {
          mapRef.current?.invalidateSize();
        }, 100);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const handleFilterChange = useCallback((territorio: string | null, municipiosNomes: string[]) => {
    console.log('handleFilterChange chamado:', { territorio, municipiosNomes, projecoes: projecoes.length, eleicoes: dadosEleicoes2022.length });
    setFilteredMunicipios(territorio ? municipiosNomes : []);
    
    // Chamar callback externo se fornecido
    if (onFilterChange) {
      onFilterChange(territorio, municipiosNomes);
    }
    
    // Auto-zoom para a área filtrada
    if (mapRef.current && territorio && municipiosNomes.length > 0) {
      // Encontrar coordenadas dos municípios filtrados
      const municipiosFiltrados = municipiosNomes
        .map(nomeMunicipio => {
          const municipio = municipios.find(m => 
            normalizeString(m.nome) === normalizeString(nomeMunicipio)
          );
          return municipio;
        })
        .filter(m => m && m.latitude && m.longitude);

      if (municipiosFiltrados.length > 0) {
        // Calcular bounds (limites) da área
        const lats = municipiosFiltrados.map(m => m!.latitude);
        const lngs = municipiosFiltrados.map(m => m!.longitude);
        
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);

        // Adicionar margem de 10% para não ficar muito apertado
        const latMargin = (maxLat - minLat) * 0.1;
        const lngMargin = (maxLng - minLng) * 0.1;

        // Criar bounds do Leaflet
        const bounds = L.latLngBounds([
          [minLat - latMargin, minLng - lngMargin],
          [maxLat + latMargin, maxLng + lngMargin]
        ]);

        // Fazer zoom para a área com animação
        setTimeout(() => {
          mapRef.current?.fitBounds(bounds, {
            padding: [20, 20],
            maxZoom: 10,
            animate: true,
            duration: 1.5
          });
        }, 300);
      }
    } else if (mapRef.current && !territorio) {
      // Voltar ao zoom padrão quando limpar filtro
      setTimeout(() => {
        mapRef.current?.setView([-5.5, -42.5], 7, {
          animate: true,
          duration: 1.5
        });
      }, 300);
    }
  }, [projecoes, dadosEleicoes2022, municipios, onFilterChange]);

  const handleShowSummary = useCallback((territorio: string, municipios: string[]) => {
    console.log('handleShowSummary chamado:', { territorio, municipios, projecoes: projecoes.length, eleicoes: dadosEleicoes2022.length });
    setSelectedTerritorioSummary({ territorio, municipios });
    setShowSummaryModal(true);
  }, [projecoes, dadosEleicoes2022]);

  const handleCloseSummary = useCallback(() => {
    console.log('Fechando modal');
    setShowSummaryModal(false);
    setSelectedTerritorioSummary(null);
  }, []);

  const handleShowLiderancas = useCallback(async (municipio: string) => {
    setSelectedMunicipioLiderancas(municipio);
    setLoadingLiderancas(true);
    setShowLiderancasModal(true);
    
    try {
      const response = await fetch('/api/liderancas-votacao');
      const result = await response.json();
      
      if (result.data && Array.isArray(result.data)) {
        const liderancasFiltradas = result.data.filter((l: Lideranca) => 
          l.municipio?.toUpperCase() === municipio.toUpperCase()
        );
        setLiderancasMunicipio(liderancasFiltradas);
      } else {
        setLiderancasMunicipio([]);
      }
    } catch (error) {
      console.error('Erro ao buscar lideranças:', error);
      setLiderancasMunicipio([]);
    } finally {
      setLoadingLiderancas(false);
    }
  }, []);

  const handleCloseLiderancas = useCallback(() => {
    setShowLiderancasModal(false);
    setSelectedMunicipioLiderancas('');
    setLiderancasMunicipio([]);
  }, []);

  // Função para normalizar nomes de municípios para comparação
  const normalizeString = (str: string): string => {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .toUpperCase()
      .trim();
  };

  const shouldShowMarker = useCallback((municipioNome: string) => {
    if (filteredMunicipios.length === 0) return true;
    
    const nomeNormalizado = normalizeString(municipioNome);
    return filteredMunicipios.some(m => normalizeString(m) === nomeNormalizado);
  }, [filteredMunicipios]);

  if (loading) {
    return <div className="flex justify-center items-center h-96">Carregando mapa...</div>;
  }

  const toggleFullScreen = () => {
    if (!mapRef.current || typeof window === 'undefined') return;

    if (!isFullscreen) {
      // Entrar em tela cheia - colocar o container do mapa em tela cheia
      const mapContainer = mapRef.current.getContainer();
      if (mapContainer.requestFullscreen) {
        mapContainer.requestFullscreen();
      } else if ((mapContainer as any).mozRequestFullScreen) {
        (mapContainer as any).mozRequestFullScreen();
      } else if ((mapContainer as any).webkitRequestFullscreen) {
        (mapContainer as any).webkitRequestFullscreen();
      } else if ((mapContainer as any).msRequestFullscreen) {
        (mapContainer as any).msRequestFullscreen();
      }
    } else {
      // Sair da tela cheia
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        (document as any).mozCancelFullScreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <MapContainer
        center={[-5.5, -42.5]}
        zoom={7}
        style={{ 
          height: isFullscreen ? '100vh' : '500px', 
          width: '100%',
          position: isFullscreen ? 'fixed' : 'relative',
          top: isFullscreen ? '0' : 'auto',
          left: isFullscreen ? '0' : 'auto',
          right: isFullscreen ? '0' : 'auto',
          bottom: isFullscreen ? '0' : 'auto',
          zIndex: isFullscreen ? '9999' : '10',
          margin: isFullscreen ? '0' : 'auto'
        }}
        className={`${isFullscreen ? 'fullscreen-map' : 'rounded-lg'}`}
        ref={mapRef}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {projecoes.map((projecao) => {
          const municipio = municipios.find(
            m => m.nome.toUpperCase() === projecao.municipio.toUpperCase()
          );
          
          if (!municipio || !municipio.latitude || !municipio.longitude) return null;
          if (!shouldShowMarker(municipio.nome)) return null;

          const crescimento = projecao.crescimento || 0;
          const cor = obterCorCrescimento(crescimento);
          
          // Criar ícone personalizado baseado no crescimento
          const iconoCrescimento = criarIconePersonalizado(cor);

          return (
            <Marker
              key={municipio.id}
              position={[municipio.latitude, municipio.longitude]}
              icon={iconoCrescimento}
              ref={(ref) => {
                if (ref) {
                  registerMarker(municipio.nome, ref);
                }
              }}
            >
              {/* Tooltip que aparece ao passar o mouse */}
              {crescimento > 20 && (
                <Tooltip permanent direction="top" className="bg-[#4CAF50] text-white border-[#4CAF50] px-1">
                  +{crescimento.toFixed(0)}%
                </Tooltip>
              )}

              {/* Popup completo que aparece ao clicar */}
              <Popup>
                <div 
                  className="w-[580px] max-h-[380px] px-3 py-2 overflow-y-auto bg-white" 
                  style={{ 
                    minHeight: '300px',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                  }}
                >
                  {/* Cabeçalho */}
                  <h3 className="text-sm font-semibold text-center mb-2 pb-1 border-b text-gray-800">{municipio.nome.toUpperCase()}</h3>
                  
                  {/* Grid de informações */}
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 mb-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Crescimento:</span>
                      <span className="font-semibold text-green-600">+{crescimento.toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Lideranças:</span>
                      <button 
                        onClick={() => handleShowLiderancas(municipio.nome)}
                        className="font-semibold text-blue-600 hover:text-blue-800 underline cursor-pointer"
                      >
                        {formatNumber(projecao.liderancasAtuais)}
                      </button>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Votação 2022:</span>
                      <span className="font-semibold">{formatNumber(projecao.votacao2022)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Expectativa 2026:</span>
                      <span className="font-semibold">{formatNumber(projecao.expectativa2026)}</span>
                    </div>
                  </div>

                  {/* Top 5 - Grid com Federais e Estaduais lado a lado */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                    {/* Deputados Federais */}
                    <div>
                      <div className="text-gray-700 mb-1 text-xs font-bold border-b border-gray-200 pb-1">Top 5 Deputados Federais:</div>
                      <div className="space-y-0.5">
                        {obterTop5Candidatos2022(municipio.nome, dadosEleicoes2022).map((candidato, index) => (
                          <div key={index} className="flex justify-between items-center text-xs py-0.5 hover:bg-gray-50 rounded px-1">
                            <div className="flex-1 min-w-0 mr-1">
                              <div className="truncate font-medium text-gray-800">
                                {index + 1}º {candidato.nomeUrnaCandidato}
                              </div>
                            </div>
                            <div className="text-gray-500 text-xs whitespace-nowrap mr-1">
                              ({candidato.partido})
                            </div>
                            <div className="text-right font-bold text-xs text-gray-700 whitespace-nowrap">
                              {formatNumber(parseInt(candidato.quantidadeVotosNominais))}
                            </div>
                          </div>
                        ))}
                        {obterTop5Candidatos2022(municipio.nome, dadosEleicoes2022).length === 0 && (
                          <div className="text-xs text-gray-500 italic py-1 text-center">Nenhum candidato encontrado</div>
                        )}
                      </div>
                    </div>

                    {/* Deputados Estaduais */}
                    <div>
                      <div className="text-gray-700 mb-1 text-xs font-bold border-b border-gray-200 pb-1">Top 5 Deputados Estaduais:</div>
                      <div className="space-y-0.5">
                        {obterTop5Estaduais2022(municipio.nome, dadosEleicoesEstaduais2022).map((candidato, index) => (
                          <div key={index} className="flex justify-between items-center text-xs py-0.5 hover:bg-gray-50 rounded px-1">
                            <div className="flex-1 min-w-0 mr-1">
                              <div className="truncate font-medium text-gray-800">
                                {index + 1}º {candidato.nomeUrnaCandidato}
                              </div>
                            </div>
                            <div className="text-gray-500 text-xs whitespace-nowrap mr-1">
                              ({candidato.partido})
                            </div>
                            <div className="text-right font-bold text-xs text-gray-700 whitespace-nowrap">
                              {formatNumber(parseInt(candidato.quantidadeVotosNominais))}
                            </div>
                          </div>
                        ))}
                        {obterTop5Estaduais2022(municipio.nome, dadosEleicoesEstaduais2022).length === 0 && (
                          <div className="text-xs text-gray-500 italic py-1 text-center">Nenhum candidato encontrado</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Filtro de Territórios - agora dentro do MapContainer */}
        <div className="leaflet-top leaflet-left" style={{ zIndex: 1000 }}>
          <div className="leaflet-control">
            <TerritoriosFilter 
              onFilterChange={handleFilterChange} 
              onShowSummary={handleShowSummary}
            />
          </div>
        </div>

        {/* Modal de Resumo do Território - também dentro do MapContainer */}
        {showSummaryModal && selectedTerritorioSummary && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10000, pointerEvents: 'none' }}>
            <div style={{ pointerEvents: 'auto' }}>
              <TerritorioSummaryModal
                territorio={selectedTerritorioSummary.territorio}
                municipios={selectedTerritorioSummary.municipios}
                dadosProjecao={projecoes}
                dadosEleicoes2022={dadosEleicoes2022}
                dadosEleicoesEstaduais2022={dadosEleicoesEstaduais2022}
                onClose={handleCloseSummary}
              />
            </div>
          </div>
        )}

        {/* Modal de Lideranças - também dentro do MapContainer */}
        {showLiderancasModal && selectedMunicipioLiderancas && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10000, pointerEvents: 'none' }}>
            <div style={{ pointerEvents: 'auto' }}>
              <div className="w-[400px] max-h-[300px] bg-white rounded-lg shadow-xl p-3 overflow-y-auto" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-semibold text-gray-800">Lideranças de {selectedMunicipioLiderancas}</h3>
                  <button onClick={handleCloseLiderancas} className="text-gray-600 hover:text-gray-800">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                
                {loadingLiderancas ? (
                  <div className="flex justify-center items-center py-4">
                    <div className="text-gray-600 text-sm">Carregando...</div>
                  </div>
                ) : liderancasMunicipio.length > 0 ? (
                  <div className="space-y-1">
                    {liderancasMunicipio.map((lideranca, index) => (
                      <div key={index} className="flex justify-between items-center py-1 px-2 hover:bg-gray-50 rounded text-xs">
                        <div className="flex-1 font-medium text-gray-900 truncate mr-2">
                          {lideranca.lideranca}
                        </div>
                        <div className="text-gray-600 mr-2 min-w-0">
                          {lideranca.cargo2024}
                        </div>
                        <div className="font-bold text-gray-900 whitespace-nowrap">
                          {formatNumber(parseInt(lideranca.expectativa2026))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-600 text-sm">
                    Nenhuma liderança encontrada.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </MapContainer>

      {/* Botão de tela cheia */}
      <button
        onClick={toggleFullScreen}
        className="absolute top-4 right-4 bg-white p-3 rounded-full shadow-lg border hover:bg-gray-50 transition-colors"
        title={isFullscreen ? "Sair da tela cheia" : "Expandir mapa"}
        style={{
          position: isFullscreen ? 'fixed' : 'absolute',
          top: isFullscreen ? '20px' : '16px',
          right: isFullscreen ? '20px' : '16px',
          zIndex: isFullscreen ? '99999' : '40'
        }}
      >
        {isFullscreen ? (
          <Minimize2 className="h-6 w-6 text-gray-600" />
        ) : (
          <Maximize2 className="h-6 w-6 text-gray-600" />
        )}
      </button>
    </div>
  );
}
