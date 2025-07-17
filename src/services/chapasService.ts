import { db } from '@/lib/firebase';
import { collection, getDocs, setDoc, doc, writeBatch, deleteDoc, getDoc, query, where, orderBy } from 'firebase/firestore';

export interface Chapa {
  id?: string;
  partido: string;
  nome: string;
  votos: number;
  municipio?: string;
  status?: string;
}

// Novos tipos para o sistema de cenários
export interface Cenario {
  id: string;
  nome: string;
  descricao?: string;
  tipo: 'base' | 'simulacao';
  criadoEm: string;
  atualizadoEm: string;
  ativo: boolean;
  quocienteEleitoral: number;
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
}

// Dados iniciais conforme o estado atual do app
export const dadosIniciais: Chapa[] = [
  { partido: 'PT', nome: 'ZÉ', votos: 120000 },
  { partido: 'PT', nome: 'F COSTA', votos: 120000 },
  { partido: 'PT', nome: 'F NOGUEIRA', votos: 100000 },
  { partido: 'PT', nome: 'FLORENTINO', votos: 80000 },
  { partido: 'PT', nome: 'WILSON', votos: 80000 },
  { partido: 'PT', nome: 'MERLONG', votos: 80000 },
  { partido: 'PT', nome: 'FRANZE', votos: 60000 },
  { partido: 'PT', nome: 'MARINA SANTOS', votos: 10000 },
  { partido: 'PT', nome: 'RAISSA PROTETORA', votos: 10000 },
  { partido: 'PT', nome: 'MULHER', votos: 6000 },
  { partido: 'PT', nome: 'MULHER', votos: 4000 },
  { partido: 'PT', nome: 'LEGENDA', votos: 10000 },

  { partido: 'PSD/MDB', nome: 'GEORGIANO', votos: 200000 },
  { partido: 'PSD/MDB', nome: 'CASTRO', votos: 180000 },
  { partido: 'PSD/MDB', nome: 'MARCOS AURELIO', votos: 80000 },
  { partido: 'PSD/MDB', nome: 'FABIO ABREU', votos: 35000 },
  { partido: 'PSD/MDB', nome: 'NOME5', votos: 10000 },
  { partido: 'PSD/MDB', nome: 'NOME6', votos: 10000 },
  { partido: 'PSD/MDB', nome: 'NOME7', votos: 5000 },
  { partido: 'PSD/MDB', nome: 'MULHER 1', votos: 5000 },
  { partido: 'PSD/MDB', nome: 'MULHER 2', votos: 5000 },
  { partido: 'PSD/MDB', nome: 'MULHER 3', votos: 3000 },
  { partido: 'PSD/MDB', nome: 'MULHER 4', votos: 2000 },

  { partido: 'PP', nome: 'ATILA', votos: 105000 },
  { partido: 'PP', nome: 'JULIO ARCOVERDE', votos: 105000 },
  { partido: 'PP', nome: 'ISMAEL', votos: 20000 },
  { partido: 'PP', nome: 'PETRUS', votos: 20000 },
  { partido: 'PP', nome: 'NOME6', votos: 10000 },
  { partido: 'PP', nome: 'NOME7', votos: 5000 },
  { partido: 'PP', nome: 'NOME8', votos: 5000 },
  { partido: 'PP', nome: 'SAMANTA CAVALCA', votos: 10000 },
  { partido: 'PP', nome: 'MULHER 2', votos: 5000 },
  { partido: 'PP', nome: 'MULHER 3', votos: 3000 },
  { partido: 'PP', nome: 'MULHER 4', votos: 2000 },

  { partido: 'REPUBLICANOS', nome: 'JADYEL', votos: 120000 },
  { partido: 'REPUBLICANOS', nome: 'ANA FIDELIS', votos: 40000 },
  { partido: 'REPUBLICANOS', nome: 'MAGNO', votos: 25000 },
  { partido: 'REPUBLICANOS', nome: 'CHARLES', votos: 40000 },
  { partido: 'REPUBLICANOS', nome: 'ZE LUIS ASSEMBLEIA DE DEUS', votos: 25000 },
  { partido: 'REPUBLICANOS', nome: 'GAIOSO', votos: 10000 },
  { partido: 'REPUBLICANOS', nome: 'GABRIELA', votos: 10000 },
  { partido: 'REPUBLICANOS', nome: 'PARNAIBA', votos: 10000 },
  { partido: 'REPUBLICANOS', nome: 'AGRO/SUL', votos: 10000 },
  { partido: 'REPUBLICANOS', nome: 'DIANA IGREJA OU K B', votos: 5000 },
  { partido: 'REPUBLICANOS', nome: 'CAUSA ANIMAL', votos: 10000 },
];

export async function carregarChapas() {
  const snapshot = await getDocs(collection(db, 'chapas2026'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown)) as Chapa[];
}

function safeId(partido: string, nome: string) {
  const safePartido = partido.replaceAll('/', '_');
  const safeNome = nome.replaceAll('/', '_');
  return `${safePartido}_${safeNome}`;
}

export async function atualizarChapa(partido: string, nome: string, votos: number) {
  const id = safeId(partido, nome);
  await setDoc(doc(db, 'chapas2026', id), { partido, nome, votos });
}

export async function popularChapasIniciais() {
  const batch = writeBatch(db);
  dadosIniciais.forEach((chapa) => {
    const id = safeId(chapa.partido, chapa.nome);
    batch.set(doc(db, 'chapas2026', id), chapa);
  });
  await batch.commit();
}

export async function excluirChapa(partido: string, nome: string) {
  const id = safeId(partido, nome);
  await deleteDoc(doc(db, 'chapas2026', id));
}

// Funções para gerenciar o quociente eleitoral
export async function salvarQuocienteEleitoral(quociente: number) {
  try {
    await setDoc(doc(db, 'configuracoes', 'quociente_eleitoral'), { 
      valor: quociente,
      atualizadoEm: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao salvar quociente eleitoral:', error);
    throw error;
  }
}

export async function carregarQuocienteEleitoral(): Promise<number> {
  try {
    const docRef = doc(db, 'configuracoes', 'quociente_eleitoral');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return data.valor || 190000; // valor padrão se não existir
    }
    
    // Se não existir, criar com valor padrão
    await salvarQuocienteEleitoral(190000);
    return 190000;
  } catch (error) {
    console.error('Erro ao carregar quociente eleitoral:', error);
    return 190000; // valor padrão em caso de erro
  }
}

// ===== SISTEMA DE CENÁRIOS =====

// Função para criar o cenário base (só deve ser chamada uma vez)
export async function criarCenarioBase(partidos: PartidoCenario[], quociente: number): Promise<string> {
  const cenarioBase: Cenario = {
    id: 'base',
    nome: 'Cenário Base',
    descricao: 'Estado original das chapas eleitorais',
    tipo: 'base',
    criadoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString(),
    ativo: true,
    quocienteEleitoral: quociente
  };

  // Salvar o cenário
  await setDoc(doc(db, 'cenarios', 'base'), cenarioBase);

  // Salvar os partidos do cenário base
  const batch = writeBatch(db);
  partidos.forEach(partido => {
    partido.candidatos.forEach(candidato => {
      const id = `base_${safeId(partido.nome, candidato.nome)}`;
      batch.set(doc(db, 'cenarios_partidos', id), {
        cenarioId: 'base',
        partido: partido.nome,
        nome: candidato.nome,
        votos: candidato.votos,
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
    const q = query(collection(db, 'cenarios'), orderBy('criadoEm', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Cenario));
  } catch (error) {
    console.error('Erro ao listar cenários:', error);
    return [];
  }
}

// Função para carregar um cenário completo
export async function carregarCenario(cenarioId: string): Promise<CenarioCompleto | null> {
  try {
    // Carregar dados do cenário
    const cenarioDoc = await getDoc(doc(db, 'cenarios', cenarioId));
    if (!cenarioDoc.exists()) return null;

    const cenario = { id: cenarioDoc.id, ...cenarioDoc.data() } as Cenario;

    // Carregar partidos do cenário
    const q = query(
      collection(db, 'cenarios_partidos'), 
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
        votos: data.votos
      });
    });

    const partidos = Object.values(partidosMap);

    return {
      ...cenario,
      partidos
    };
  } catch (error) {
    console.error('Erro ao carregar cenário:', error);
    return null;
  }
}

// Função para criar um novo cenário baseado em um existente
export async function criarNovoCenario(
  nome: string, 
  descricao: string, 
  cenarioOrigemId: string
): Promise<string> {
  try {
    const cenarioOrigem = await carregarCenario(cenarioOrigemId);
    if (!cenarioOrigem) throw new Error('Cenário origem não encontrado');

    // Gerar ID único para o novo cenário
    const novoCenarioId = `cenario_${Date.now()}`;

    const novoCenario: Cenario = {
      id: novoCenarioId,
      nome,
      descricao,
      tipo: 'simulacao',
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
      ativo: true,
      quocienteEleitoral: cenarioOrigem.quocienteEleitoral
    };

    // Salvar o novo cenário
    await setDoc(doc(db, 'cenarios', novoCenarioId), novoCenario);

    // Copiar partidos do cenário origem
    const batch = writeBatch(db);
    cenarioOrigem.partidos.forEach(partido => {
      partido.candidatos.forEach(candidato => {
        const id = `${novoCenarioId}_${safeId(partido.nome, candidato.nome)}`;
        batch.set(doc(db, 'cenarios_partidos', id), {
          cenarioId: novoCenarioId,
          partido: partido.nome,
          nome: candidato.nome,
          votos: candidato.votos,
          cor: partido.cor,
          corTexto: partido.corTexto,
          votosLegenda: partido.votosLegenda || 0
        });
      });
    });
    await batch.commit();

    return novoCenarioId;
  } catch (error) {
    console.error('Erro ao criar novo cenário:', error);
    throw error;
  }
}

// Função para atualizar um cenário
export async function atualizarCenario(
  cenarioId: string, 
  partidos: PartidoCenario[], 
  quociente: number
): Promise<void> {
  try {
    // Atualizar dados do cenário
    await setDoc(doc(db, 'cenarios', cenarioId), {
      atualizadoEm: new Date().toISOString(),
      quocienteEleitoral: quociente
    }, { merge: true });

    // Limpar partidos existentes
    const q = query(collection(db, 'cenarios_partidos'), where('cenarioId', '==', cenarioId));
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Adicionar novos partidos
    partidos.forEach(partido => {
      partido.candidatos.forEach(candidato => {
        const id = `${cenarioId}_${safeId(partido.nome, candidato.nome)}`;
        batch.set(doc(db, 'cenarios_partidos', id), {
          cenarioId,
          partido: partido.nome,
          nome: candidato.nome,
          votos: candidato.votos,
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

// Função para excluir um cenário
export async function excluirCenario(cenarioId: string): Promise<void> {
  try {
    // Não permitir excluir o cenário base
    if (cenarioId === 'base') {
      throw new Error('Não é possível excluir o cenário base');
    }

    // Excluir o cenário
    await deleteDoc(doc(db, 'cenarios', cenarioId));

    // Excluir todos os partidos do cenário
    const q = query(collection(db, 'cenarios_partidos'), where('cenarioId', '==', cenarioId));
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

// Função para ativar/desativar um cenário
export async function ativarCenario(cenarioId: string, ativo: boolean): Promise<void> {
  try {
    await setDoc(doc(db, 'cenarios', cenarioId), {
      ativo,
      atualizadoEm: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.error('Erro ao ativar/desativar cenário:', error);
    throw error;
  }
}

// Função para obter o cenário ativo
export async function obterCenarioAtivo(): Promise<CenarioCompleto | null> {
  try {
    const q = query(collection(db, 'cenarios'), where('ativo', '==', true));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      // Se não há cenário ativo, retornar o base
      return await carregarCenario('base');
    }

    const cenarioAtivo = snapshot.docs[0];
    return await carregarCenario(cenarioAtivo.id);
  } catch (error) {
    console.error('Erro ao obter cenário ativo:', error);
    return null;
  }
} 