import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  DocumentData,
  doc,
  updateDoc,
  setDoc,
  QueryConstraint,
  deleteDoc,
} from 'firebase/firestore';

export type TipoDespesaViagem =
  | 'combustivel'
  | 'pedagio'
  | 'alimentacao'
  | 'hospedagens'
  | 'manutencao';

export type ReembolsoStatus = 'pendente' | 'enviado' | 'aprovado' | 'pago';

export interface NamedDoc {
  id: string;
  nome: string;
}

export interface DespesaViagem {
  id: string;
  data: Timestamp;
  valor: number;
  tipo: TipoDespesaViagem;
  descricao?: string;
  motorista?: string;
  veiculo?: string;
  trecho?: string;
  reciboTexto?: string;
  reciboImagemBase64?: string; // Base64 sem o prefixo data: (apenas os dados)
  reciboMimeType?: 'image/jpeg' | 'image/png' | 'application/pdf';
  reciboTamanhoBytes?: number;
  reciboChunked?: boolean;
  reciboChunkCount?: number;
  reciboTotalChars?: number;
  statusReembolso: ReembolsoStatus;
  updatedAt?: Timestamp;
  createdAt: Timestamp;
}

export interface DespesaViagemInput {
  data: Date;
  valor: number;
  tipo: TipoDespesaViagem;
  descricao?: string;
  motorista?: string;
  veiculo?: string;
  trecho?: string;
  reciboTexto?: string;
  reciboImagemBase64?: string;
  reciboMimeType?: 'image/jpeg' | 'image/png' | 'application/pdf';
  reciboTamanhoBytes?: number;
  statusReembolso?: ReembolsoStatus;
}

export interface DespesasFiltro {
  inicio?: Date;
  fim?: Date;
  tipo?: TipoDespesaViagem;
  motorista?: string;
  veiculo?: string;
  trecho?: string;
  statusReembolso?: ReembolsoStatus;
}

const DESPESAS_COLLECTION = 'viagem_despesas';
const MOTORISTAS_COLLECTION = 'viagem_motoristas';
const VEICULOS_COLLECTION = 'viagem_veiculos';
const TRECHOS_COLLECTION = 'viagem_trechos';

export async function adicionarDespesaViagem(
  input: DespesaViagemInput
): Promise<string> {
  const ref = collection(db, DESPESAS_COLLECTION);
  const base: any = {
    data: Timestamp.fromDate(input.data),
    valor: input.valor,
    tipo: input.tipo,
    descricao: input.descricao || '',
    motorista: input.motorista || '',
    veiculo: input.veiculo || '',
    trecho: input.trecho || '',
    reciboTexto: input.reciboTexto || '',
    reciboImagemBase64: input.reciboImagemBase64 || '',
    reciboTamanhoBytes: input.reciboTamanhoBytes || 0,
    reciboChunked: false,
    reciboChunkCount: 0,
    reciboTotalChars: 0,
    statusReembolso: input.statusReembolso || 'pendente',
    updatedAt: Timestamp.now(),
    createdAt: Timestamp.now(),
  };

  // Apenas define mimeType quando existir; Firestore não aceita undefined
  if (input.reciboMimeType) {
    base.reciboMimeType = input.reciboMimeType;
  }

  const docRef = await addDoc(ref, base as DocumentData);
  return docRef.id;
}

export async function listarDespesasViagem(
  filtro: DespesasFiltro
): Promise<DespesaViagem[]> {
  let qRef = query(collection(db, DESPESAS_COLLECTION), orderBy('data', 'desc'));

  const whereClauses: QueryConstraint[] = [];

  if (filtro.tipo) {
    whereClauses.push(where('tipo', '==', filtro.tipo));
  }
  if (filtro.motorista) {
    whereClauses.push(where('motorista', '==', filtro.motorista));
  }
  if (filtro.veiculo) {
    whereClauses.push(where('veiculo', '==', filtro.veiculo));
  }
  if (filtro.inicio) {
    whereClauses.push(where('data', '>=', Timestamp.fromDate(filtro.inicio)));
  }
  if (filtro.fim) {
    whereClauses.push(where('data', '<=', Timestamp.fromDate(filtro.fim)));
  }
  if (filtro.trecho) {
    whereClauses.push(where('trecho', '==', filtro.trecho));
  }
  if (filtro.statusReembolso) {
    whereClauses.push(where('statusReembolso', '==', filtro.statusReembolso));
  }

  if (whereClauses.length > 0) {
    qRef = query(qRef, ...whereClauses);
  }

  const snap = await getDocs(qRef);
  const items: DespesaViagem[] = [];
  snap.forEach((docSnap) => {
    const data = docSnap.data() as DocumentData;
    items.push({ id: docSnap.id, ...(data as Omit<DespesaViagem, 'id'>) });
  });
  return items;
}

export async function setDespesaReciboSmall(
  despesaId: string,
  mimeType: 'image/jpeg' | 'image/png' | 'application/pdf',
  base64DataNoPrefix: string,
  tamanhoBytes: number
): Promise<void> {
  const ref = doc(db, DESPESAS_COLLECTION, despesaId);
  await updateDoc(ref, {
    reciboImagemBase64: base64DataNoPrefix,
    reciboMimeType: mimeType,
    reciboTamanhoBytes: tamanhoBytes,
    reciboChunked: false,
    reciboChunkCount: 0,
    reciboTotalChars: base64DataNoPrefix.length,
  });
}

export async function salvarReciboChunked(
  despesaId: string,
  mimeType: 'image/jpeg' | 'image/png' | 'application/pdf',
  base64DataNoPrefix: string
): Promise<number> {
  const chunkSize = 250_000; // ~250 KB por documento para folga
  const chunks: string[] = [];
  for (let i = 0; i < base64DataNoPrefix.length; i += chunkSize) {
    chunks.push(base64DataNoPrefix.slice(i, i + chunkSize));
  }

  const subcol = collection(db, DESPESAS_COLLECTION, despesaId, 'recibo_chunks');
  // Salvar chunks com ids ordenáveis
  await Promise.all(
    chunks.map((data, idx) => {
      const id = String(idx).padStart(4, '0');
      return setDoc(doc(subcol, id), { index: idx, data });
    })
  );

  // Atualizar metadados na despesa
  await updateDoc(doc(db, DESPESAS_COLLECTION, despesaId), {
    reciboChunked: true,
    reciboMimeType: mimeType,
    reciboChunkCount: chunks.length,
    reciboTotalChars: base64DataNoPrefix.length,
    reciboImagemBase64: '',
  });

  return chunks.length;
}

export async function obterReciboChunked(
  despesaId: string
): Promise<string> {
  const subcol = collection(db, DESPESAS_COLLECTION, despesaId, 'recibo_chunks');
  const snap = await getDocs(subcol);
  const docs = snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as { index: number; data: string }) }))
    .sort((a, b) => a.id.localeCompare(b.id));
  const joined = docs.map((d) => d.data).join('');
  return joined;
}

export async function listarMotoristas(): Promise<string[]> {
  const snap = await getDocs(collection(db, MOTORISTAS_COLLECTION));
  const nomes: string[] = [];
  snap.forEach((d) => {
    const data = d.data();
    if (data && typeof data.nome === 'string' && data.nome.trim()) {
      nomes.push(data.nome.trim());
    }
  });
  return nomes.sort((a, b) => a.localeCompare(b));
}

export async function adicionarMotorista(nome: string): Promise<string> {
  const normalized = nome.trim();
  if (!normalized) throw new Error('Nome de motorista inválido');
  const ref = await addDoc(collection(db, MOTORISTAS_COLLECTION), { nome: normalized });
  return ref.id;
}

export async function listarVeiculos(): Promise<string[]> {
  const snap = await getDocs(collection(db, VEICULOS_COLLECTION));
  const nomes: string[] = [];
  snap.forEach((d) => {
    const data = d.data();
    if (data && typeof data.nome === 'string' && data.nome.trim()) {
      nomes.push(data.nome.trim());
    }
  });
  return nomes.sort((a, b) => a.localeCompare(b));
}

export async function adicionarVeiculo(nome: string): Promise<string> {
  const normalized = nome.trim();
  if (!normalized) throw new Error('Nome de veículo inválido');
  const ref = await addDoc(collection(db, VEICULOS_COLLECTION), { nome: normalized });
  return ref.id;
}

export async function listarTrechos(): Promise<string[]> {
  const snap = await getDocs(collection(db, TRECHOS_COLLECTION));
  const nomes: string[] = [];
  snap.forEach((d) => {
    const data = d.data();
    if (data && typeof data.nome === 'string' && data.nome.trim()) {
      nomes.push(data.nome.trim());
    }
  });
  return nomes.sort((a, b) => a.localeCompare(b));
}

export async function adicionarTrecho(nome: string): Promise<string> {
  const normalized = nome.trim();
  if (!normalized) throw new Error('Nome de trecho inválido');
  const ref = await addDoc(collection(db, TRECHOS_COLLECTION), { nome: normalized });
  return ref.id;
}

// Gerenciamento com IDs
export async function listarMotoristasWithIds(): Promise<NamedDoc[]> {
  const snap = await getDocs(collection(db, MOTORISTAS_COLLECTION));
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as { nome: string }) }))
    .filter((x) => x && x.nome && x.nome.trim())
    .map((x) => ({ id: x.id, nome: x.nome.trim() }))
    .sort((a, b) => a.nome.localeCompare(b.nome));
}

export async function updateMotorista(id: string, nome: string): Promise<void> {
  await updateDoc(doc(db, MOTORISTAS_COLLECTION, id), { nome: nome.trim() });
}

export async function listarVeiculosWithIds(): Promise<NamedDoc[]> {
  const snap = await getDocs(collection(db, VEICULOS_COLLECTION));
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as { nome: string }) }))
    .filter((x) => x && x.nome && x.nome.trim())
    .map((x) => ({ id: x.id, nome: x.nome.trim() }))
    .sort((a, b) => a.nome.localeCompare(b.nome));
}

export async function updateVeiculo(id: string, nome: string): Promise<void> {
  await updateDoc(doc(db, VEICULOS_COLLECTION, id), { nome: nome.trim() });
}

export async function listarTrechosWithIds(): Promise<NamedDoc[]> {
  const snap = await getDocs(collection(db, TRECHOS_COLLECTION));
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as { nome: string }) }))
    .filter((x) => x && x.nome && x.nome.trim())
    .map((x) => ({ id: x.id, nome: x.nome.trim() }))
    .sort((a, b) => a.nome.localeCompare(b.nome));
}

export async function updateTrecho(id: string, nome: string): Promise<void> {
  await updateDoc(doc(db, TRECHOS_COLLECTION, id), { nome: nome.trim() });
}

export async function atualizarDespesaViagem(id: string, partial: Partial<DespesaViagemInput & { statusReembolso: ReembolsoStatus }>): Promise<void> {
  const payload: any = { updatedAt: Timestamp.now() };
  if (partial.data) payload.data = Timestamp.fromDate(partial.data);
  if (typeof partial.valor === 'number') payload.valor = partial.valor;
  if (partial.tipo) payload.tipo = partial.tipo;
  if (partial.descricao !== undefined) payload.descricao = partial.descricao;
  if (partial.motorista !== undefined) payload.motorista = partial.motorista;
  if (partial.veiculo !== undefined) payload.veiculo = partial.veiculo;
  if (partial.trecho !== undefined) payload.trecho = partial.trecho;
  if (partial.reciboTexto !== undefined) payload.reciboTexto = partial.reciboTexto;
  if (partial.statusReembolso) payload.statusReembolso = partial.statusReembolso;
  await updateDoc(doc(db, DESPESAS_COLLECTION, id), payload);
}

export async function deletarDespesaViagem(id: string): Promise<void> {
  const docRef = doc(db, DESPESAS_COLLECTION, id);
  await deleteDoc(docRef);
}

