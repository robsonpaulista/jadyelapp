import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface MunicipioPopulacao {
  nome: string;
  nome_normalizado: string;
  codigo_ibge: string;
  populacao: number;
}

interface MunicipioEleitores {
  municipio: string;
  populacao: number;
  eleitores_estimados: number;
  percentual_eleitores: number;
  eleitores_2022: number;
  eleitores_2024: number;
  crescimento_eleitoral: number;
}

// Taxa média de eleitores em relação à população (baseada em dados nacionais)
const TAXA_ELEITORES_POPULACAO = 0.68; // ~68% da população em idade de votar
const CRESCIMENTO_ANUAL_ELEITORES = 0.02; // 2% ao ano

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const municipio = searchParams.get('municipio');
    
    // Carregar dados populacionais
    const populacaoPath = path.join(process.cwd(), 'public', 'populacaoibge.json');
    const populacaoData: MunicipioPopulacao[] = JSON.parse(fs.readFileSync(populacaoPath, 'utf-8'));
    
    // Função para normalizar texto
    const normalizarTexto = (texto: string) => {
      return texto
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
    };
    
    // Calcular dados eleitorais para cada município
    const dadosEleitores: MunicipioEleitores[] = populacaoData.map(municipio => {
      const eleitores2022 = Math.round(municipio.populacao * TAXA_ELEITORES_POPULACAO);
      const eleitores2024 = Math.round(eleitores2022 * (1 + CRESCIMENTO_ANUAL_ELEITORES * 2)); // 2 anos de crescimento
      const eleitoresAtuais = Math.round(eleitores2024 * (1 + CRESCIMENTO_ANUAL_ELEITORES * 0.5)); // +6 meses
      
      return {
        municipio: municipio.nome,
        populacao: municipio.populacao,
        eleitores_estimados: eleitoresAtuais,
        percentual_eleitores: Math.round((eleitoresAtuais / municipio.populacao) * 100 * 100) / 100,
        eleitores_2022: eleitores2022,
        eleitores_2024: eleitores2024,
        crescimento_eleitoral: Math.round(((eleitoresAtuais - eleitores2022) / eleitores2022) * 100 * 100) / 100
      };
    });
    
    // Se um município específico foi solicitado, filtrar
    if (municipio) {
      const municipioNormalizado = normalizarTexto(municipio);
      const dadosMunicipio = dadosEleitores.find(m => 
        normalizarTexto(m.municipio) === municipioNormalizado
      );
      
      if (!dadosMunicipio) {
        return NextResponse.json(
          { error: 'Município não encontrado' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        municipio: dadosMunicipio,
        fonte: 'Estimativa baseada em dados populacionais do IBGE e estatísticas eleitorais',
        ultima_atualizacao: new Date().toISOString()
      });
    }
    
    // Retornar todos os municípios
    return NextResponse.json({
      eleitores: dadosEleitores,
      total_municipios: dadosEleitores.length,
      total_eleitores_estimados: dadosEleitores.reduce((sum, m) => sum + m.eleitores_estimados, 0),
      fonte: 'Estimativa baseada em dados populacionais do IBGE e estatísticas eleitorais',
      ultima_atualizacao: new Date().toISOString(),
      observacoes: [
        'Dados baseados em estimativas populacionais do IBGE',
        'Taxa de eleitores estimada em 68% da população',
        'Crescimento eleitoral estimado em 2% ao ano',
        'Para dados oficiais, consulte o TSE'
      ]
    });
    
  } catch (error: any) {
    console.error('Erro na API de eleitores:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar dados de eleitores' },
      { status: 500 }
    );
  }
} 