import { db } from './firebase';
import { writeBatch, doc, getDocs, collection, query, where } from 'firebase/firestore';

// Configurações de retry
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 segundo
const BATCH_SIZE_LIMIT = 500; // Limite do Firebase

// Estado global para monitoramento de quota
let quotaStatus = {
  isExceeded: false,
  lastError: null as Error | null,
  retryCount: 0,
  lastRetryTime: null as Date | null
};

// Callback para notificar sobre status de quota
let quotaStatusCallback: ((status: typeof quotaStatus) => void) | null = null;

export function setQuotaStatusCallback(callback: (status: typeof quotaStatus) => void) {
  quotaStatusCallback = callback;
}

export function getQuotaStatus() {
  return { ...quotaStatus };
}

/**
 * Executa uma operação com retry automático em caso de erro de quota
 */
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  operationName: string = 'Operação Firebase'
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`🔄 ${operationName} - Tentativa ${attempt}/${MAX_RETRIES}`);
      const result = await operation();
      console.log(`✅ ${operationName} - Sucesso na tentativa ${attempt}`);
      
      // Reset quota status on success
      if (quotaStatus.isExceeded) {
        quotaStatus = {
          isExceeded: false,
          lastError: null,
          retryCount: 0,
          lastRetryTime: null
        };
        quotaStatusCallback?.(quotaStatus);
      }
      
      return result;
    } catch (error: any) {
      lastError = error;
      
      // Verificar se é erro de quota
      if (error.code === 'resource-exhausted' || error.message?.includes('Quota exceeded')) {
        console.warn(`🚨 QUOTA FIREBASE EXCEDIDA! 🚨`);
        console.warn(`📊 Detalhes do erro:`);
        console.warn(`   • Operação: ${operationName}`);
        console.warn(`   • Tentativa: ${attempt}/${MAX_RETRIES}`);
        console.warn(`   • Código do erro: ${error.code}`);
        console.warn(`   • Mensagem: ${error.message}`);
        console.warn(`   • Timestamp: ${new Date().toISOString()}`);
        console.warn(`💡 Soluções:`);
        console.warn(`   • Aguarde 1-2 horas para reset automático da quota`);
        console.warn(`   • Use o botão "Limpar Estados Travados" na interface`);
        console.warn(`   • Evite múltiplas operações simultâneas`);
        
        // Atualizar status de quota
        quotaStatus = {
          isExceeded: true,
          lastError: error,
          retryCount: attempt,
          lastRetryTime: new Date()
        };
        quotaStatusCallback?.(quotaStatus);
        
        if (attempt < MAX_RETRIES) {
          const delay = RETRY_DELAY * Math.pow(2, attempt - 1); // Backoff exponencial
          console.log(`⏳ Aguardando ${delay}ms antes da próxima tentativa...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
      
      // Se não é erro de quota ou esgotaram as tentativas, relançar o erro
      throw error;
    }
  }
  
  throw lastError!;
}

/**
 * Executa batch com controle de tamanho e retry
 */
export async function executeBatchWithRetry(
  batchOperations: Array<() => void>,
  operationName: string = 'Batch Firebase'
): Promise<void> {
  if (batchOperations.length === 0) return;
  
  // Dividir em chunks se necessário
  const chunks = [];
  for (let i = 0; i < batchOperations.length; i += BATCH_SIZE_LIMIT) {
    chunks.push(batchOperations.slice(i, i + BATCH_SIZE_LIMIT));
  }
  
  console.log(`📦 ${operationName} - Executando ${chunks.length} chunks de até ${BATCH_SIZE_LIMIT} operações`);
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    await executeWithRetry(async () => {
      const batch = writeBatch(db);
      
      // Aplicar todas as operações do chunk
      chunk.forEach(operation => operation());
      
      await batch.commit();
    }, `${operationName} - Chunk ${i + 1}/${chunks.length}`);
  }
}

/**
 * Limpa estados de loading travados
 */
export async function limparEstadosTravados(): Promise<void> {
  console.log('🧹 Limpando estados travados...');
  
  try {
    // Limpar cenários estaduais
    const cenariosEstaduais = await getDocs(collection(db, 'cenarios_estaduais'));
    const batchEstaduais = writeBatch(db);
    let hasEstaduaisUpdates = false;
    
    cenariosEstaduais.forEach(doc => {
      const data = doc.data();
      if (data.loading || data.salvando || data.status === 'pending') {
        batchEstaduais.update(doc.ref, {
          loading: false,
          salvando: false,
          status: 'ativo',
          atualizadoEm: new Date().toISOString()
        });
        hasEstaduaisUpdates = true;
      }
    });
    
    if (hasEstaduaisUpdates) {
      await executeWithRetry(() => batchEstaduais.commit(), 'Limpeza cenários estaduais');
    }
    
    // Limpar cenários federais
    const cenariosFederais = await getDocs(collection(db, 'cenarios'));
    const batchFederais = writeBatch(db);
    let hasFederaisUpdates = false;
    
    cenariosFederais.forEach(doc => {
      const data = doc.data();
      if (data.loading || data.salvando || data.status === 'pending') {
        batchFederais.update(doc.ref, {
          loading: false,
          salvando: false,
          status: 'ativo',
          atualizadoEm: new Date().toISOString()
        });
        hasFederaisUpdates = true;
      }
    });
    
    if (hasFederaisUpdates) {
      await executeWithRetry(() => batchFederais.commit(), 'Limpeza cenários federais');
    }
    
    console.log('✅ Estados travados limpos com sucesso');
  } catch (error) {
    console.error('❌ Erro ao limpar estados travados:', error);
    throw error;
  }
}

/**
 * Verifica se há operações pendentes
 */
export async function verificarOperacoesPendentes(): Promise<boolean> {
  try {
    // Timeout de 5 segundos para detectar operações pendentes
    const timeoutPromise = new Promise<boolean>((_, reject) => {
      setTimeout(() => reject(new Error('Timeout - operações pendentes detectadas')), 5000);
    });
    
    const operationPromise = getDocs(collection(db, 'cenarios_estaduais'));
    
    await Promise.race([operationPromise, timeoutPromise]);
    return false; // Nenhuma operação pendente
  } catch (error) {
    console.warn('⚠️ Operações pendentes detectadas:', error instanceof Error ? error.message : String(error));
    return true; // Há operações pendentes
  }
}
