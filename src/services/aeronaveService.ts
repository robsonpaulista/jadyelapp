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
} from 'firebase/firestore';

export type TipoDespesaAeronave =
  | 'combustivel'
  | 'manutencao'
  | 'alimentacao'
  | 'hospedagens'
  | 'transportes';

export type ReembolsoStatus = 'pendente' | 'enviado' | 'aprovado' | 'pago';

export interface NamedDoc {
  id: string;
  nome: string;
}

export interface DespesaAeronave {
  id: string;
  data: Timestamp;
  valor: number;
  tipo: TipoDespesaAeronave;
  descricao?: string;
  piloto?: string;
  aeronave?: string;
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

export interface DespesaAeronaveInput {
  data: Date;
  valor: number;
  tipo: TipoDespesaAeronave;
  descricao?: string;
  piloto?: string;
  aeronave?: string;
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
  tipo?: TipoDespesaAeronave;
  piloto?: string;
  aeronave?: string;
  trecho?: string;
  statusReembolso?: ReembolsoStatus;
}

const DESPESAS_COLLECTION = 'aeronave_despesas';
const PILOTOS_COLLECTION = 'aeronave_pilotos';
const AERONAVES_COLLECTION = 'aeronaves';
const TRECHOS_COLLECTION = 'aeronave_trechos';

export async function adicionarDespesaAeronave(
  input: DespesaAeronaveInput
): Promise<string> {
  const ref = collection(db, DESPESAS_COLLECTION);
  const base: any = {
    data: Timestamp.fromDate(input.data),
    valor: input.valor,
    tipo: input.tipo,
    descricao: input.descricao || '',
    piloto: input.piloto || '',
    aeronave: input.aeronave || '',
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

export async function listarDespesasAeronave(
  filtro: DespesasFiltro
): Promise<DespesaAeronave[]> {
  let qRef = query(collection(db, DESPESAS_COLLECTION), orderBy('data', 'desc'));

  const whereClauses: any[] = [];

  if (filtro.tipo) {
    whereClauses.push(where('tipo', '==', filtro.tipo));
  }
  if (filtro.piloto) {
    whereClauses.push(where('piloto', '==', filtro.piloto));
  }
  if (filtro.aeronave) {
    whereClauses.push(where('aeronave', '==', filtro.aeronave));
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
    // @ts-expect-error - construção incremental de query com múltiplos wheres é suportada em runtime
    qRef = query(qRef, ...whereClauses);
  }

  const snap = await getDocs(qRef);
  const items: DespesaAeronave[] = [];
  snap.forEach((docSnap) => {
    const data = docSnap.data() as DocumentData;
    items.push({ id: docSnap.id, ...(data as Omit<DespesaAeronave, 'id'>) });
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

export async function listarPilotos(): Promise<string[]> {
  const snap = await getDocs(collection(db, PILOTOS_COLLECTION));
  const nomes: string[] = [];
  snap.forEach((d) => {
    const data = d.data();
    if (data && typeof data.nome === 'string' && data.nome.trim()) {
      nomes.push(data.nome.trim());
    }
  });
  return nomes.sort((a, b) => a.localeCompare(b));
}

export async function adicionarPiloto(nome: string): Promise<string> {
  const normalized = nome.trim();
  if (!normalized) throw new Error('Nome de piloto inválido');
  const ref = await addDoc(collection(db, PILOTOS_COLLECTION), { nome: normalized });
  return ref.id;
}

export async function listarAeronaves(): Promise<string[]> {
  const snap = await getDocs(collection(db, AERONAVES_COLLECTION));
  const nomes: string[] = [];
  snap.forEach((d) => {
    const data = d.data();
    if (data && typeof data.nome === 'string' && data.nome.trim()) {
      nomes.push(data.nome.trim());
    }
  });
  return nomes.sort((a, b) => a.localeCompare(b));
}

export async function adicionarAeronave(nome: string): Promise<string> {
  const normalized = nome.trim();
  if (!normalized) throw new Error('Nome de aeronave inválido');
  const ref = await addDoc(collection(db, AERONAVES_COLLECTION), { nome: normalized });
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
export async function listarPilotosWithIds(): Promise<NamedDoc[]> {
  const snap = await getDocs(collection(db, PILOTOS_COLLECTION));
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as { nome: string }) }))
    .filter((x) => x && x.nome && x.nome.trim())
    .map((x) => ({ id: x.id, nome: x.nome.trim() }))
    .sort((a, b) => a.nome.localeCompare(b.nome));
}

export async function updatePiloto(id: string, nome: string): Promise<void> {
  await updateDoc(doc(db, PILOTOS_COLLECTION, id), { nome: nome.trim() });
}

export async function listarAeronavesWithIds(): Promise<NamedDoc[]> {
  const snap = await getDocs(collection(db, AERONAVES_COLLECTION));
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as { nome: string }) }))
    .filter((x) => x && x.nome && x.nome.trim())
    .map((x) => ({ id: x.id, nome: x.nome.trim() }))
    .sort((a, b) => a.nome.localeCompare(b.nome));
}

export async function updateAeronave(id: string, nome: string): Promise<void> {
  await updateDoc(doc(db, AERONAVES_COLLECTION, id), { nome: nome.trim() });
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

export async function atualizarDespesaAeronave(id: string, partial: Partial<DespesaAeronaveInput & { statusReembolso: ReembolsoStatus }>): Promise<void> {
  const payload: any = { updatedAt: Timestamp.now() };
  if (partial.data) payload.data = Timestamp.fromDate(partial.data);
  if (typeof partial.valor === 'number') payload.valor = partial.valor;
  if (partial.tipo) payload.tipo = partial.tipo;
  if (partial.descricao !== undefined) payload.descricao = partial.descricao;
  if (partial.piloto !== undefined) payload.piloto = partial.piloto;
  if (partial.aeronave !== undefined) payload.aeronave = partial.aeronave;
  if (partial.trecho !== undefined) payload.trecho = partial.trecho;
  if (partial.reciboTexto !== undefined) payload.reciboTexto = partial.reciboTexto;
  if (partial.statusReembolso) payload.statusReembolso = partial.statusReembolso;
  await updateDoc(doc(db, DESPESAS_COLLECTION, id), payload);
}


