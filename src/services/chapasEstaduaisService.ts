import { db } from '@/lib/firebase';
import { collection, getDocs, setDoc, doc, writeBatch, deleteDoc, getDoc, query, where, orderBy } from 'firebase/firestore';

// Novos tipos para o sistema de cenários (padronizados com federais)
export interface Cenario {
  id: string;
  nome: string;
  descricao?: string;
  tipo: 'base' | 'simulacao';
  criadoEm: string;
  atualizadoEm: string;
  ativo: boolean;
  quocienteEleitoral: number;
  numeroVagas?: number; // Novo campo para número de vagas
  votosIgreja?: number;
}

export interface CenarioCompleto extends Cenario {
  partidos: PartidoCenario[];
}

export interface PartidoCenario {
  nome: string;
  cor: string;
  corTexto: string;
  candidatos: CandidatoCenario[];
  votosLegenda?: number;
}

export interface CandidatoCenario {
  nome: string;
  votos: number;
  genero?: string;
}

// Dados iniciais para chapas estaduais (vazios)
export const dadosIniciais: Array<{partido: string; nome: string; votos: number}> = [
  // Dados vazios para chapas estaduais
];

// Função auxiliar para gerar IDs seguros
function safeId(partido: string, nome: string) {
  const safePartido = partido
    .replaceAll('/', '_')
    .replaceAll('\\', '_')
    .replaceAll(' ', '_')
    .replaceAll('.', '_')
    .replaceAll(',', '_')
    .replaceAll('(', '_')
    .replaceAll(')', '_')
    .replaceAll('[', '_')
    .replaceAll(']', '_')
    .replaceAll('{', '_')
    .replaceAll('}', '_')
    .replaceAll('&', '_')
    .replaceAll('|', '_')
    .replaceAll('^', '_')
    .replaceAll('$', '_')
    .replaceAll('*', '_')
    .replaceAll('+', '_')
    .replaceAll('?', '_')
    .replaceAll('!', '_')
    .replaceAll('@', '_')
    .replaceAll('#', '_')
    .replaceAll('%', '_')
    .replaceAll('~', '_')
    .replaceAll('`', '_')
    .replaceAll('-', '_')
    .replaceAll('=', '_')
    .replaceAll(';', '_')
    .replaceAll(':', '_')
    .replaceAll('"', '_')
    .replaceAll("'", '_')
    .replaceAll('<', '_')
    .replaceAll('>', '_')
    .replaceAll('/', '_')
    .replaceAll('\\', '_')
    .toLowerCase();

  const safeNome = nome
    .replaceAll('/', '_')
    .replaceAll('\\', '_')
    .replaceAll(' ', '_')
    .replaceAll('.', '_')
    .replaceAll(',', '_')
    .replaceAll('(', '_')
    .replaceAll(')', '_')
    .replaceAll('[', '_')
    .replaceAll(']', '_')
    .replaceAll('{', '_')
    .replaceAll('}', '_')
    .replaceAll('&', '_')
    .replaceAll('|', '_')
    .replaceAll('^', '_')
    .replaceAll('$', '_')
    .replaceAll('*', '_')
    .replaceAll('+', '_')
    .replaceAll('?', '_')
    .replaceAll('!', '_')
    .replaceAll('@', '_')
    .replaceAll('#', '_')
    .replaceAll('%', '_')
    .replaceAll('~', '_')
    .replaceAll('`', '_')
    .replaceAll('-', '_')
    .replaceAll('=', '_')
    .replaceAll(';', '_')
    .replaceAll(':', '_')
    .replaceAll('"', '_')
    .replaceAll("'", '_')
    .replaceAll('<', '_')
    .replaceAll('>', '_')
    .replaceAll('/', '_')
    .replaceAll('\\', '_')
    .toLowerCase();

  return `${safePartido}_${safeNome}`;
}

// Função para salvar quociente eleitoral
export async function salvarQuocienteEleitoral(quociente: number) {
  try {
    await setDoc(doc(db, 'quociente_eleitoral_estadual', 'atual'), {
      valor: quociente,
      atualizadoEm: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao salvar quociente eleitoral:', error);
    throw error;
  }
}

// Função para carregar quociente eleitoral
export async function carregarQuocienteEleitoral(): Promise<number> {
  try {
    const docRef = await getDoc(doc(db, 'quociente_eleitoral_estadual', 'atual'));
    if (docRef.exists()) {
      return docRef.data().valor || 190000;
    }
    return 190000; // Valor padrão
  } catch (error) {
    console.error('Erro ao carregar quociente eleitoral:', error);
    return 190000; // Valor padrão em caso de erro
  }
}

// Função para criar cenário base
export async function criarCenarioBase(partidos: PartidoCenario[], quociente: number, numeroVagas: number = 8): Promise<string> {
  const cenarioBase: Cenario = {
    id: 'base',
    nome: 'Cenário Base',
    descricao: 'Estado original das chapas eleitorais estaduais',
    tipo: 'base',
    criadoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString(),
    ativo: true,
    quocienteEleitoral: quociente,
    numeroVagas: numeroVagas
  };

  // Salvar o cenário
  await setDoc(doc(db, 'cenarios_estaduais', 'base'), cenarioBase);

  // Salvar os partidos do cenário base
  const batch = writeBatch(db);
  
  partidos.forEach(partido => {
    partido.candidatos.forEach(candidato => {
      const id = `base_${safeId(partido.nome, candidato.nome)}`;
      batch.set(doc(db, 'cenarios_partidos_estaduais', id), {
        cenarioId: 'base',
        partido: partido.nome,
        nome: candidato.nome,
        votos: candidato.votos,
        genero: (candidato as any).genero, // Incluir o campo genero
        cor: partido.cor,
        corTexto: partido.corTexto,
        votosLegenda: partido.votosLegenda || 0
      });
    });
  });
  
  await batch.commit();

  return 'base';
}

// Função para listar todos os cenários
export async function listarCenarios(): Promise<Cenario[]> {
  try {
    const q = query(collection(db, 'cenarios_estaduais'), orderBy('criadoEm', 'desc'));
    const snapshot = await getDocs(q);
    
    const cenarios = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Cenario));
    
    // Garantir que o cenário base sempre apareça primeiro
    const cenariosOrdenados = cenarios.sort((a, b) => {
      if (a.id === 'base') return -1; // Cenário base sempre primeiro
      if (b.id === 'base') return 1;  // Cenário base sempre primeiro
      return 0; // Manter ordem original para os outros
    });
    
    return cenariosOrdenados;
  } catch (error) {
    console.error('Erro ao listar cenários:', error);
    return [];
  }
}

// Função para carregar um cenário completo
export async function carregarCenario(cenarioId: string): Promise<CenarioCompleto | null> {
  try {
    // Carregar dados do cenário
    const cenarioDoc = await getDoc(doc(db, 'cenarios_estaduais', cenarioId));
    
    if (!cenarioDoc.exists()) {
      return null;
    }

    const cenario = { id: cenarioDoc.id, ...cenarioDoc.data() } as Cenario;

    // Carregar partidos do cenário
    const q = query(
      collection(db, 'cenarios_partidos_estaduais'), 
      where('cenarioId', '==', cenarioId)
    );
    const partidosSnapshot = await getDocs(q);
    
    // Agrupar por partido
    const partidosMap: { [partido: string]: PartidoCenario } = {};
    partidosSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (!partidosMap[data.partido]) {
        partidosMap[data.partido] = {
          nome: data.partido,
          cor: data.cor,
          corTexto: data.corTexto,
          candidatos: [],
          votosLegenda: data.votosLegenda || 0
        };
      }
      partidosMap[data.partido].candidatos.push({
        nome: data.nome,
        votos: data.votos,
        genero: data.genero // Carregar o campo genero
      });
    });

    const partidos = Object.values(partidosMap);

    const resultado = {
      ...cenario,
      partidos
    };

    return resultado;
  } catch (error) {
    console.error('Erro ao carregar cenário:', error);
    return null;
  }
}

// Função para criar novo cenário
export async function criarNovoCenario(
  nome: string, 
  descricao: string, 
  cenarioOrigemId: string
): Promise<string> {
  try {
    // Gerar ID único para o novo cenário
    const novoId = `cenario_${Date.now()}`;
    
    // Carregar cenário de origem
    const cenarioOrigem = await carregarCenario(cenarioOrigemId);
    
    if (!cenarioOrigem) {
      throw new Error('Cenário de origem não encontrado');
    }

    // Criar novo cenário
    const novoCenario: Cenario = {
      id: novoId,
      nome,
      descricao,
      tipo: 'simulacao',
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
      ativo: false,
      quocienteEleitoral: cenarioOrigem.quocienteEleitoral,
      numeroVagas: cenarioOrigem.numeroVagas || 8
    };

    // Salvar o novo cenário
    await setDoc(doc(db, 'cenarios_estaduais', novoId), novoCenario);

    // Copiar partidos do cenário de origem
    const batch = writeBatch(db);
    cenarioOrigem.partidos.forEach(partido => {
      partido.candidatos.forEach(candidato => {
        const id = `${novoId}_${safeId(partido.nome, candidato.nome)}`;
        batch.set(doc(db, 'cenarios_partidos_estaduais', id), {
          cenarioId: novoId,
          partido: partido.nome,
          nome: candidato.nome,
          votos: candidato.votos,
          genero: candidato.genero,
          cor: partido.cor,
          corTexto: partido.corTexto,
          votosLegenda: partido.votosLegenda || 0
        });
      });
    });
    await batch.commit();

    return novoId;
  } catch (error) {
    console.error('Erro ao criar novo cenário:', error);
    throw error;
  }
}

// Função para atualizar cenário
export async function atualizarCenario(
  cenarioId: string, 
  partidos: PartidoCenario[], 
  quociente: number,
  numeroVagas?: number
): Promise<void> {
  try {
    // Atualizar dados do cenário
    const updateData: any = {
      atualizadoEm: new Date().toISOString(),
      quocienteEleitoral: quociente
    };
    
    // Incluir numeroVagas apenas se foi fornecido
    if (numeroVagas !== undefined) {
      updateData.numeroVagas = numeroVagas;
    }
    
    await setDoc(doc(db, 'cenarios_estaduais', cenarioId), updateData, { merge: true });

    // Limpar partidos existentes
    const q = query(
      collection(db, 'cenarios_partidos_estaduais'), 
      where('cenarioId', '==', cenarioId)
    );
    const snapshot = await getDocs(q);
    
    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Salvar novos partidos
    partidos.forEach(partido => {
      partido.candidatos.forEach(candidato => {
        const id = `${cenarioId}_${safeId(partido.nome, candidato.nome)}`;
        batch.set(doc(db, 'cenarios_partidos_estaduais', id), {
          cenarioId,
          partido: partido.nome,
          nome: candidato.nome,
          votos: candidato.votos,
          genero: candidato.genero,
          cor: partido.cor,
          corTexto: partido.corTexto,
          votosLegenda: partido.votosLegenda || 0
        });
      });
    });

    await batch.commit();
  } catch (error) {
    console.error('Erro ao atualizar cenário:', error);
    throw error;
  }
}

// Função para excluir cenário
export async function excluirCenario(cenarioId: string): Promise<void> {
  try {
    // Excluir cenário
    await deleteDoc(doc(db, 'cenarios_estaduais', cenarioId));

    // Excluir partidos do cenário
    const q = query(
      collection(db, 'cenarios_partidos_estaduais'), 
      where('cenarioId', '==', cenarioId)
    );
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  } catch (error) {
    console.error('Erro ao excluir cenário:', error);
    throw error;
  }
}

// Função para ativar/desativar cenário
export async function ativarCenario(cenarioId: string, ativo: boolean): Promise<void> {
  try {
    if (ativo) {
      // Desativar todos os outros cenários
      const q = query(collection(db, 'cenarios_estaduais'));
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { ativo: false });
      });
      await batch.commit();
    }

    // Ativar/desativar o cenário específico
    await setDoc(doc(db, 'cenarios_estaduais', cenarioId), {
      ativo,
      atualizadoEm: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.error('Erro ao ativar cenário:', error);
    throw error;
  }
}

// Função para obter cenário ativo
export async function obterCenarioAtivo(): Promise<CenarioCompleto | null> {
  try {
    const q = query(
      collection(db, 'cenarios_estaduais'), 
      where('ativo', '==', true)
    );
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }

    const cenarioAtivo = snapshot.docs[0];
    return await carregarCenario(cenarioAtivo.id);
  } catch (error) {
    console.error('Erro ao obter cenário ativo:', error);
    return null;
  }
} 