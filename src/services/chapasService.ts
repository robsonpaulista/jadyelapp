import { db } from '@/lib/firebase';
import { collection, getDocs, setDoc, doc, writeBatch, deleteDoc } from 'firebase/firestore';

export interface Chapa {
  partido: string;
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
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Chapa[];
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