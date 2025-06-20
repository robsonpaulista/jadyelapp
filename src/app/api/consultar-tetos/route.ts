import { NextRequest, NextResponse } from 'next/server';

interface Proposta {
  nuProposta: string;
  acao: string;
  nmPrograma: string;
  nmTipoObjeto: string;
  snPrincipal: string;
  municipio: string;
  vlProposta: number;
  vlGlobal: number;
  coSituacaoProposta: string;
  dsSituacaoProposta: string;
  dtCadastramento: string;
  coTipoProposta: string;
  dsTipoRecurso: string;
  vlPagar: number;
}

const HEADERS = {
  "Accept": "application/json, text/plain, */*",
  "User-Agent": "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N)",
  "Referer": "https://consultafns.saude.gov.br/",
};

async function getMunicipiosPI(): Promise<any[]> {
  const url_municipios = "https://consultafns.saude.gov.br/recursos/municipios/uf/PI";
  
  try {
    const response = await fetch(url_municipios, { headers: HEADERS });
    
    if (!response.ok) {
      console.error(`Erro ao buscar municípios: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    return data.resultado || [];
  } catch (error) {
    console.error('Erro ao buscar municípios:', error);
    return [];
  }
}

async function getPropostasByMunicipio(codigoIbge: string, nomeMunicipio: string): Promise<Proposta[]> {
  const propostas: Proposta[] = [];
  let page = 1;
  
  try {
    while (true) {
      const url = "https://consultafns.saude.gov.br/recursos/proposta/consultar";
      const params = new URLSearchParams({
        "ano": "2025",
        "sgUf": "PI",
        "coMunicipioIbge": codigoIbge,
        "count": "100",
        "page": page.toString(),
        "coEsfera": ""
      });
      
      const response = await fetch(`${url}?${params.toString()}`, { headers: HEADERS });
      
      if (!response.ok) {
        console.error(`Erro na consulta do município ${nomeMunicipio}: ${response.status}`);
        break;
      }
      
      const data = await response.json();
      const propostasPage = data.resultado?.itensPagina || [];
      
      if (propostasPage.length === 0) {
        break; // Não tem mais propostas nessa página
      }
      
      // Adicionar o nome do município a cada proposta
      const propostasComMunicipio = propostasPage.map((p: any) => ({
        ...p,
        municipio: nomeMunicipio
      }));
      
      propostas.push(...propostasComMunicipio);
      console.log(`Página ${page}: ${propostasPage.length} propostas encontradas para ${nomeMunicipio}`);
      
      page++;
      
      // Pequena pausa para não sobrecarregar a API
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  } catch (error) {
    console.error(`Erro ao buscar propostas para ${nomeMunicipio}:`, error);
  }
  
  return propostas;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const municipioParam = searchParams.get('municipio');

    console.log('Buscando municípios do Piauí...');
    const municipios = await getMunicipiosPI();
    console.log(`Encontrados ${municipios.length} municípios no PI.`);
    
    if (municipios.length === 0) {
      return NextResponse.json({ error: 'Não foi possível obter a lista de municípios' }, { status: 500 });
    }

    let allPropostas: Proposta[] = [];

    if (municipioParam) {
      const municipioTarget = municipios.find(m => m.noMunicipio.toUpperCase() === municipioParam.toUpperCase());
      if (municipioTarget) {
        console.log(`Buscando propostas para o município: ${municipioTarget.noMunicipio}`);
        allPropostas = await getPropostasByMunicipio(municipioTarget.coMunicipioIbge, municipioTarget.noMunicipio);
      } else {
        console.log(`Município "${municipioParam}" não encontrado na lista.`);
      }
    } else {
      // Comportamento original: buscar todos os municípios em lotes
      const batchSize = 5;
      
      for (let i = 0; i < municipios.length; i += batchSize) {
        const batch = municipios.slice(i, i + batchSize);
        const propostasBatch = await Promise.all(batch.map(municipio => 
          getPropostasByMunicipio(municipio.coMunicipioIbge, municipio.noMunicipio)
        ));
        
        propostasBatch.forEach(propostas => allPropostas.push(...propostas));
        
        if (i + batchSize < municipios.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    console.log(`Total de propostas coletadas: ${allPropostas.length}`);
    
    // Ordenar propostas por data de cadastro (mais recentes primeiro)
    allPropostas.sort((a, b) => {
      const dateA = new Date(a.dtCadastramento).getTime();
      const dateB = new Date(b.dtCadastramento).getTime();
      return dateB - dateA;
    });
    
    return NextResponse.json(allPropostas);
  } catch (error: any) {
    console.error('Erro geral na API de consultar-tetos:', error);
    return NextResponse.json(
      { error: error.message || 'Falha ao buscar dados do FNS' },
      { status: 500 }
    );
  }
} 