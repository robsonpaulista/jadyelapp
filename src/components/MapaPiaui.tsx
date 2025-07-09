import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Maximize2, Minimize2 } from 'lucide-react';

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

// Função para obter cor baseada no crescimento da votação
const obterCorCrescimento = (crescimento: number): string => {
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

// Função para criar ícone SVG personalizado baseado na cor
const criarIconePersonalizado = (cor: string): L.Icon => {
  const svgString = `
    <svg width="12" height="20" viewBox="0 0 12 20" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 0C2.69 0 0 2.69 0 6c0 4.5 6 14 6 14s6-9.5 6-14c0-3.31-2.69-6-6-6z" fill="${cor}" stroke="#fff" stroke-width="1"/>
      <circle cx="6" cy="6" r="2" fill="#fff"/>
    </svg>
  `;
  
  const blob = new Blob([svgString], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  
  return new L.Icon({
    iconUrl: url,
    iconSize: [12, 20],
    iconAnchor: [6, 20],
    popupAnchor: [1, -20],
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    shadowSize: [20, 20],
    shadowAnchor: [8, 22],
  });
};

export default function MapaPiaui() {
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [projecoes, setProjecoes] = useState<ProjecaoMunicipio[]>([]);
  const [dadosEleicoes2022, setDadosEleicoes2022] = useState<ResultadoEleicao[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  if (loading) {
    return <div className="flex justify-center items-center h-96">Carregando mapa...</div>;
  }

  const toggleFullScreen = () => {
    if (!mapRef.current) return;

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
          zIndex: isFullscreen ? '9999' : '10'
        }}
        className={isFullscreen ? '' : 'rounded-lg'}
        ref={mapRef}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {municipios.map(municipio => {
          const projecao = projecoes.find(p => 
            p.municipio.toUpperCase() === municipio.nome.toUpperCase()
          );
          
          const crescimento = projecao?.crescimento || 0;
          const cor = obterCorCrescimento(crescimento);
          
          // Criar ícone personalizado baseado no crescimento
          const iconoCrescimento = criarIconePersonalizado(cor);

          return (
            <Marker
              key={municipio.id}
              position={[municipio.latitude, municipio.longitude]}
              icon={iconoCrescimento}
            >
              <Popup>
                <div style={{ textAlign: 'center', minWidth: '200px' }}>
                  <strong style={{ fontSize: '14px', color: '#333' }}>
                    {municipio.nome}
                  </strong>
                  <br />
                  {projecao ? (
                    <>
                      <div style={{
                        fontSize: '12px',
                        color: cor,
                        fontWeight: 'bold',
                        marginTop: '4px'
                      }}>
                        {obterDescricaoCrescimento(crescimento)}
                      </div>
                      <div style={{
                        fontSize: '11px',
                        color: '#666',
                        marginTop: '4px'
                      }}>
                        Votação 2022: {projecao.votacao2022.toLocaleString('pt-BR')}
                        <br />
                        Expectativa 2026: {projecao.expectativa2026.toLocaleString('pt-BR')}
                        <br />
                        {(() => {
                          const top5Candidatos2022 = obterTop5Candidatos2022(municipio.nome, dadosEleicoes2022);
                          const votosMelhor2022 = parseInt(top5Candidatos2022[0]?.quantidadeVotosNominais) || 0;
                          const percentualComparacao = votosMelhor2022 > 0 ? (projecao.expectativa2026 / votosMelhor2022) * 100 : 0;
                          
                          return (
                            <>
                              <strong>Top 5 Deputado Federal 2022:</strong>
                              <ul style={{ padding: 0, margin: '6px 0 0 0', listStyle: 'none' }}>
                                {top5Candidatos2022.map((candidato, index) => {
                                  const votos = parseInt(candidato.quantidadeVotosNominais) || 0;
                                  const isMaior = projecao.expectativa2026 > votos;
                                  return (
                                    <li key={index} style={{ display: 'flex', alignItems: 'center', fontSize: '12px', marginBottom: 2 }}>
                                      <span style={{ minWidth: 18, color: '#888', fontWeight: 500 }}>{index + 1}.</span>
                                      <span style={{ flex: 1 }}>
                                        {candidato.nomeUrnaCandidato} <span style={{ color: '#888' }}>({candidato.partido})</span>
                                      </span>
                                      <span style={{ minWidth: 70, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{votos.toLocaleString('pt-BR')} votos</span>
                                      <span style={{ marginLeft: 8, fontSize: '16px', color: isMaior ? '#22c55e' : '#ef4444', fontWeight: 700 }}>
                                        {isMaior ? '↑' : '↓'}
                                      </span>
                                    </li>
                                  );
                                })}
                              </ul>
                              <br />
                              <strong>Comparação geral:</strong> {percentualComparacao.toFixed(0)}% do melhor de 2022
                            </>
                          );
                        })()}
                      </div>
                    </>
                  ) : (
                    <div style={{
                      fontSize: '12px',
                      color: '#999',
                      fontStyle: 'italic',
                      marginTop: '4px'
                    }}>
                      Dados não disponíveis
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
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
