export interface Deputado {
  id: number;
  nome: string;
  siglaPartido: string;
  siglaUf: string;
  urlFoto: string;
  email: string;
}

export interface Emenda {
  id: number;
  numero: string;
  valor: number;
  municipio: string;
  objeto: string;
  exercicio: number;
  tipo: string;
}

export interface DeputadoComEmendas {
  deputado: Deputado;
  emendas: Emenda[];
  totalEmendas: number;
  valorTotal: number;
}

class CamaraService {
  private baseUrl = 'https://dadosabertos.camara.leg.br/api/v2';

  async getDeputadosPiaui(): Promise<Deputado[]> {
    try {
      const response = await fetch(`${this.baseUrl}/deputados?siglaUf=PI`);
      const data = await response.json();
      return data.dados || [];
    } catch (error) {
      console.error('Erro ao buscar deputados do Piauí:', error);
      return [];
    }
  }

  async getEmendasDeputado(deputadoId: number): Promise<Emenda[]> {
    try {
      const response = await fetch(`${this.baseUrl}/deputados/${deputadoId}/emendas`);
      const data = await response.json();
      return data.dados || [];
    } catch (error) {
      console.error(`Erro ao buscar emendas do deputado ${deputadoId}:`, error);
      return [];
    }
  }

  async getDeputadosComEmendas(): Promise<DeputadoComEmendas[]> {
    try {
      const deputados = await this.getDeputadosPiaui();
      const deputadosComEmendas: DeputadoComEmendas[] = [];

      for (const deputado of deputados) {
        const emendas = await this.getEmendasDeputado(deputado.id);
        const valorTotal = emendas.reduce((total, emenda) => total + (emenda.valor || 0), 0);

        deputadosComEmendas.push({
          deputado,
          emendas,
          totalEmendas: emendas.length,
          valorTotal
        });
      }

      return deputadosComEmendas;
    } catch (error) {
      console.error('Erro ao buscar deputados com emendas:', error);
      return [];
    }
  }

  // Método para buscar dados específicos de 2025
  async getEmendas2025(): Promise<DeputadoComEmendas[]> {
    try {
      const deputadosComEmendas = await this.getDeputadosComEmendas();
      
      // Filtrar apenas emendas de 2025
      return deputadosComEmendas.map(item => ({
        ...item,
        emendas: item.emendas.filter(emenda => emenda.exercicio === 2025)
      })).filter(item => item.emendas.length > 0);
    } catch (error) {
      console.error('Erro ao buscar emendas de 2025:', error);
      return [];
    }
  }
}

export const camaraService = new CamaraService(); 