import React, { useCallback } from 'react';
import MapaPiauiSVG from './MapaPiauiSVG';

interface ProjecaoMunicipio {
  municipio: string;
  liderancasAtuais: number;
  votacao2022: number;
  expectativa2026: number;
  crescimento: number;
  eleitores: number;
  alcance: number;
}

interface MapaPiauiProps {
  projecoes: ProjecaoMunicipio[];
}

// Função para determinar a cor do município conforme o crescimento
function getCorCrescimento(crescimento: number): string {
  if (crescimento > 20) return '#004d00'; // Verde muito escuro: crescimento muito expressivo
  if (crescimento > 10) return '#00b300'; // Verde forte: crescimento expressivo  
  if (crescimento > 5) return '#33cc33'; // Verde médio: crescimento moderado
  if (crescimento > 0) return '#66ff66'; // Verde claro: crescimento leve
  if (crescimento === 0) return '#ffcc00'; // Amarelo: estável
  if (crescimento > -5) return '#ff9900'; // Laranja: queda leve
  if (crescimento > -10) return '#ff6600'; // Laranja escuro: queda moderada
  return '#cc0000'; // Vermelho: queda expressiva
}

// Função para normalizar nomes de municípios para corresponder aos IDs do SVG
function normalizarMunicipio(municipio: string): string {
  return municipio
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '') // Remove todos os espaços
    .normalize('NFD') // Decompõe caracteres acentuados
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9]/g, ''); // Remove caracteres especiais (hífens, pontos, etc.)
    // Não remove artigos automaticamente - deixa o nome como está após limpeza básica
}

// Mapeamento dos IDs textuais do SVG para os nomes exatos da API
const municipiosSVG: { [key: string]: string } = {
  // Baseado nos IDs reais encontrados no MapaPiauiSVG
  'agricolandia': 'AGRICOLÂNDIA',
  'aguabranca': 'ÁGUA BRANCA',
  'altos': 'ALTOS',
  'teresina': 'TERESINA',
  'floriano': 'FLORIANO',
  'parnaiba': 'PARNAÍBA',
  'picos': 'PICOS',
  'barras': 'BARRAS',
  'piripiri': 'PIRIPIRI',
  'campo maior': 'CAMPO MAIOR',
  'esperantina': 'ESPERANTINA',
  'jose de freitas': 'JOSÉ DE FREITAS',
  'uniao': 'UNIÃO',
  'luzilandia': 'LUZILÂNDIA',
  'piracuruca': 'PIRACURUCA',
  'urucui': 'URUÇUÍ',
  'corrente': 'CORRENTE',
  'bomjesus': 'BOM JESUS',
  'gilbues': 'GILBUÉS',
  'caracol': 'CARACOL',
  'cristinocastro': 'CRISTINO CASTRO',
  'currais': 'CURRAIS',
  'santafilomena': 'SANTA FILOMENA',
  'riachofrio': 'RIACHO FRIO',
  'montealegredopiaui': 'MONTE ALEGRE DO PIAUÍ',
  'sebastiaobarros': 'SEBASTIÃO BARROS',
  'redencaodogurgueia': 'REDENÇÃO DO GURGUÉIA',
  'cristalandiadopiaui': 'CRISTALÂNDIA DO PIAUÍ',
  'baixagrandedoribeiro': 'BAIXA GRANDE DO RIBEIRO',
  'barreirasdopiaui': 'BARREIRAS DO PIAUÍ',
  'ribeirogoncalves': 'RIBEIRO GONÇALVES',
  'curimata': 'CURIMATÁ',
  'julioborges': 'JÚLIO BORGES',
  'parnagua': 'PARNAGUÁ',
  'santaluz': 'SANTA LUZ',
  'saogoncalodogurgueia': 'SÃO GONÇALO DO GURGUÉIA',
  'alvoradadogurgueia': 'ALVORADA DO GURGUÉIA',
  'manoelemidio': 'MANOEL EMÍDIO',
  'palmeiradopiaui': 'PALMEIRA DO PIAUÍ',
  'sebastiaoleal': 'SEBASTIÃO LEAL',
  'eliseumartins': 'ELISEU MARTINS',
  'coloniadogurgueia': 'COLÔNIA DO GURGUÉIA',
  'cantodoburiti': 'CANTO DO BURITI',
  'pavussu': 'PAVUSSU',
  'riograndedopiaui': 'RIO GRANDE DO PIAUÍ',
  'tamborildopiaui': 'TAMBORIL DO PIAUÍ',
  'anisiodeabreu': 'ANÍSIO DE ABREU',
  'avelinolopes': 'AVELINO LOPES',
  'guaribas': 'GUARIBAS',
  'jurema': 'JUREMA',
  'morrocabecanotempo': 'MORRO CABEÇA NO TEMPO',
  'varzeabranca': 'VÁRZEA BRANCA',
  'saoraimundononato': 'SÃO RAIMUNDO NONATO',
  'dirceuarcoverde': 'DIRCEU ARCOVERDE',
  'farturadopiaui': 'FARTURA DO PIAUÍ',
  'saobrazdopiaui': 'SÃO BRAZ DO PIAUÍ',
  'saolourencodopiaui': 'SÃO LOURENÇO DO PIAUÍ',
  'saojoaodopiaui': 'SÃO JOÃO DO PIAUÍ',
  'brejodopiaui': 'BREJO DO PIAUÍ',
  'belavistadopiaui': 'BELA VISTA DO PIAUÍ',
  'campoalegredofidalgo': 'CAMPO ALEGRE DO FIDALGO',
  'pajeudopiaui': 'PAJEÚ DO PIAUÍ',
  'pedrolaurentino': 'PEDRO LAURENTINO',
  'novasantarita': 'NOVA SANTA RITA',
  'ribeiradopiaui': 'RIBEIRA DO PIAUÍ',
  'simpliciomendes': 'SIMPLÍCIO MENDES',
  'socorrodopiaui': 'SOCORRO DO PIAUÍ',
  'wallferraz': 'WALL FERRAZ',
  'bonfimdopiaui': 'BONFIM DO PIAUÍ',
  'capitaogervasiooliveira': 'CAPITÃO GERVÁSIO OLIVEIRA',
  'coroneljosedias': 'CORONEL JOSÉ DIAS',
  'dominocencio': 'DOM INOCÊNCIO',
  'joaocosta': 'JOÃO COSTA',
  'nossasenhoradosremedios': 'NOSSA SENHORA DOS REMÉDIOS',
  'porto': 'PORTO',
  'campolargodopiaui': 'CAMPO LARGO DO PIAUÍ',
  'madeiro': 'MADEIRO',
  'matiasolimpio': 'MATIAS OLÍMPIO',
  'miguelalves': 'MIGUEL ALVES',
  'boahora': 'BOA HORA',
  'boqueiraodopiaui': 'BOQUEIRÃO DO PIAUÍ',
  'cabeceirasdopiaui': 'CABECEIRAS DO PIAUÍ',
  'campomaior': 'CAMPO MAIOR',
  'capitaodecampos': 'CAPITÃO DE CAMPOS',
  'cocaldetelha': 'COCAL DE TELHA',
  'saojoaodoarraial': 'SÃO JOÃO DO ARRAIAL',
  'jocamarques': 'JOCA MARQUES',
  'morrodochapeudopiaui': 'MORRO DO CHAPÉU DO PIAUÍ',
  'luiscorreia': 'LUÍS CORREIA',
  'bomprincipiodopiaui': 'BOM PRINCÍPIO DO PIAUÍ',
  'cajueirodapraia': 'CAJUEIRO DA PRAIA',
  'ilhagrande': 'ILHA GRANDE',
  'cocaldosalves': 'COCAL DOS ALVES',
  'batalha': 'BATALHA',
  'brasileira': 'BRASILEIRA',
  'buritidoslopes': 'BURITI DOS LOPES',
  'caraubasdopiaui': 'CARAÚBAS DO PIAUÍ',
  'caxingo': 'CAXINGÓ',
  'cocal': 'COCAL',
  'joaquimpires': 'JOAQUIM PIRES',
  'muricidosportelas': 'MURICI DOS PORTELAS',
  'saojosedodivino': 'SÃO JOSÉ DO DIVINO',
  'antonioalmeida': 'ANTÔNIO ALMEIDA',
  'portoalegredopiaui': 'PORTO ALEGRE DO PIAUÍ',
  'bertolinia': 'BERTOLÍNIA',
  'canavieira': 'CANAVIEIRA',
  'guadalupe': 'GUADALUPE',
  'jerumenha': 'JERUMENHA',
  'landrisales': 'LANDRI SALES',
  'marcosparente': 'MARCOS PARENTE',
  'floresdopiaui': 'FLORES DO PIAUÍ',
  'itaueira': 'ITAUEIRA',
  'nazaredopiaui': 'NAZARÉ DO PIAUÍ',
  'saojosedopeixe': 'SÃO JOSÉ DO PEIXE',
  'saogoncalodopiaui': 'SÃO GONÇALO DO PIAUÍ',
  'palmeirais': 'PALMEIRAIS',
  'barroduro': 'BARRO DURO',
  'lagoinhadopiaui': 'LAGOINHA DO PIAUÍ',
  'miguelleao': 'MIGUEL LEÃO',
  'olhodaguadopiaui': 'OLHO D\'ÁGUA DO PIAUÍ',
  'passagemfrancadopiaui': 'PASSAGEM FRANCA DO PIAUÍ',
  'santoantoniodosmilagres': 'SANTO ANTÔNIO DOS MILAGRES',
  'saopedrodopiaui': 'SÃO PEDRO DO PIAUÍ',
  'lagoaalegre': 'LAGOA ALEGRE',
  'josedefreitas': 'JOSÉ DE FREITAS',
  'monsenhorgil': 'MONSENHOR GIL',
  // Novos IDs encontrados no SVG
  'angicaldopiaui': 'ANGICAL DO PIAUÍ',
  'arraial': 'ARRAIAL',
  'cajazeirasdopiaui': 'CAJAZEIRAS DO PIAUÍ',
  'franciscoayres': 'FRANCISCO AYRES',
  'hugonapoleao': 'HUGO NAPOLEÃO',
  'regeneracao': 'REGENERAÇÃO',
  'pratadopiaui': 'PRATA DO PIAUÍ',
  'santacruzdosmilagres': 'SANTA CRUZ DOS MILAGRES',
  'saofelixdopiaui': 'SÃO FÉLIX DO PIAUÍ',
  'saomigueldabaixagrande': 'SÃO MIGUEL DA BAIXA GRANDE',
  'santarosadopiaui': 'SANTA ROSA DO PIAUÍ',
  'coloniadopiaui': 'COLÔNIA DO PIAUÍ',
  'domexpeditolopes': 'DOM EXPEDITO LOPES',
  'oeiras': 'OEIRAS',
  'paqueta': 'PAQUETÁ',
  'santacruzdopiaui': 'SANTA CRUZ DO PIAUÍ',
  'santanadopiaui': 'SANTANA DO PIAUÍ',
  'saofranciscodopiaui': 'SÃO FRANCISCO DO PIAUÍ',
  'saojoaodavarjota': 'SÃO JOÃO DA VARJOTA',
  'valencadopiaui': 'VALENÇA DO PIAUÍ',
  'barradalcantara': 'BARRA D\'ALCÂNTARA',
  'aroazes': 'AROAZES',
  // IDs adicionais que terminam com 'piaui'
  'paudarcodopiaui': 'PAU D\'ARCO DO PIAUÍ',
  'lagoadopiaui': 'LAGOA DO PIAUÍ',
  'ipirangadopiaui': 'IPIRANGA DO PIAUÍ',
  'novoorientedopiaui': 'NOVO ORIENTE DO PIAUÍ',
  'tanquedopiaui': 'TANQUE DO PIAUÍ',
  'campinasdopiaui': 'CAMPINAS DO PIAUÍ',
  'florestadopiaui': 'FLORESTA DO PIAUÍ',
  'santoinaciodopiaui': 'SANTO INÁCIO DO PIAUÍ',
  'castelodopiaui': 'CASTELO DO PIAUÍ',
  'juazeirodopiaui': 'JUAZEIRO DO PIAUÍ',
  'jatobadopiaui': 'JATOBÁ DO PIAUÍ',
  'saojosedopiaui': 'SÃO JOSÉ DO PIAUÍ',
  'saoluisdopiaui': 'SÃO LUÍS DO PIAUÍ',
  'alagoinhadopiaui': 'ALAGOINHA DO PIAUÍ',
  'alegretedopiaui': 'ALEGRETE DO PIAUÍ',
  'campograndedopiaui': 'CAMPO GRANDE DO PIAUÍ',
  'vilanovadopiaui': 'VILA NOVA DO PIAUÍ',
  'caridadedopiaui': 'CARIDADE DO PIAUÍ',
  'belemdopiaui': 'BELÉM DO PIAUÍ',
  'massapedopiaui': 'MASSAPÊ DO PIAUÍ',
  'patosdopiaui': 'PATOS DO PIAUÍ',
  'assuncaodopiaui': 'ASSUNÇÃO DO PIAUÍ',
  'caldeiraograndedopiaui': 'CALDEIRÃO GRANDE DO PIAUÍ',
  'lagoadobarrodopiaui': 'LAGOA DO BARRO DO PIAUÍ',
  'betaniadopiaui': 'BETÂNIA DO PIAUÍ',
  'curralnovodopiaui': 'CURRAL NOVO DO PIAUÍ',
  'jacobinadopiaui': 'JACOBINA DO PIAUÍ',
  'saofranciscodeassisdopiaui': 'SÃO FRANCISCO DE ASSIS DO PIAUÍ',
  // IDs adicionais importantes
  'curralinhos': 'CURRALINHOS',
  'beneditinos': 'BENEDITINOS',
  'demervallobao': 'DEMERVAL LOBÃO',
  'jardimdomulato': 'JARDIM DO MULATO',
  'francinopolis': 'FRANCINÓPOLIS',
  'amarante': 'AMARANTE'
};

// Função para obter nome do município pelo ID do SVG
function getNomeMunicipioPorId(idSVG: string): string | null {
  return municipiosSVG[idSVG] || null;
}

const MapaPiaui: React.FC<MapaPiauiProps> = ({ projecoes }) => {
  // Log para debug inicial
  console.log('🗺️ === NOVO DEBUG MAPA PIAUI ===');
  console.log('🔢 Total de projeções recebidas:', projecoes.length);
  console.log('📊 Primeira projeção:', projecoes[0]);
  console.log('🎯 IDs SVG disponíveis no mapeamento:', Object.keys(municipiosSVG).length);
  console.log('📍 Primeiros 5 IDs SVG:', Object.keys(municipiosSVG).slice(0, 5));
  console.log('🔍 Alguns dados originais da API:', projecoes.slice(0, 5).map(p => p.municipio));

  // Função para colorir cada município usando IDs do SVG
  const getFill = useCallback((idSVG: string) => {
    // Obtém o nome do município pelo ID do SVG
    const nomeMunicipio = getNomeMunicipioPorId(idSVG);
    
    if (!nomeMunicipio) {
      console.log(`❌ ID SVG ${idSVG} não mapeado`);
      return '#e0e0e0'; // Cinza para IDs não mapeados
    }

    // Busca a projeção correspondente na API
    const projecao = projecoes.find(p => 
      p.municipio.toUpperCase().trim() === nomeMunicipio.trim()
    );

    if (!projecao) {
      console.log(`❌ Projeção não encontrada para ${nomeMunicipio} (ID SVG: ${idSVG})`);
      return '#e0e0e0'; // Cinza para municípios sem dados da API
    }

    const cor = getCorCrescimento(projecao.crescimento);
    console.log(`✅ ${nomeMunicipio} (${idSVG}): crescimento ${projecao.crescimento}% -> cor ${cor}`);
    return cor;
  }, [projecoes]);

  // Função para obter dados do município para tooltips usando IDs do SVG
  const getData = useCallback((idSVG: string) => {
    // Obtém o nome do município pelo ID do SVG
    const nomeMunicipio = getNomeMunicipioPorId(idSVG);
    
    if (!nomeMunicipio) {
      return null;
    }

    // Busca a projeção correspondente na API
    const projecao = projecoes.find(p => 
      p.municipio.toUpperCase().trim() === nomeMunicipio.trim()
    );

    if (projecao) {
      return {
        municipio: projecao.municipio,
        crescimento: projecao.crescimento,
        liderancasAtuais: projecao.liderancasAtuais,
        votacao2022: projecao.votacao2022,
        expectativa2026: projecao.expectativa2026,
        eleitores: projecao.eleitores,
        alcance: projecao.alcance
      };
    }

    return null;
  }, [projecoes]);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-4">
        <h3 className="text-lg font-semibold mb-4 text-center">Mapa de Projeção Eleitoral 2026</h3>
        
        {/* Info sobre dados */}
        {projecoes.length === 0 ? (
          <div className="bg-red-50 border border-red-200 rounded p-3 mb-4 text-sm text-red-700">
            <strong>Aguardando dados:</strong> Carregando informações da API...
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded p-3 mb-4 text-sm text-green-700">
            <strong>Dados carregados:</strong> Exibindo projeções para {projecoes.length} municípios
          </div>
        )}
        
        {/* Legenda */}
        <div className="flex flex-wrap justify-center gap-4 mb-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#004d00] rounded"></div>
            <span>Muito Alto ({'>'}20%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#00b300] rounded"></div>
            <span>Alto (10-20%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#33cc33] rounded"></div>
            <span>Moderado (5-10%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#66ff66] rounded"></div>
            <span>Baixo (0-5%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#ffcc00] rounded"></div>
            <span>Estável (0%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#ff9900] rounded"></div>
            <span>Queda Leve (0 a -5%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#ff6600] rounded"></div>
            <span>Queda Moderada (-5 a -10%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#cc0000] rounded"></div>
            <span>Queda Alta ({'<'}-10%)</span>
          </div>
        </div>
        
        {/* SVG do mapa */}
        <div className="w-full overflow-auto">
          <MapaPiauiSVG getFill={getFill} getData={getData} />
        </div>
        
        {/* Estatísticas dos dados */}
        <div className="mt-4 text-sm text-gray-600 text-center">
          Dados carregados para {projecoes.length} municípios do Piauí
        </div>
      </div>
    </div>
  );
};

export default MapaPiaui;
