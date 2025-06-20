/**
 * Utilitário para implementar cache de dados no cliente.
 * Isso ajuda a reduzir requisições repetidas para APIs e melhorar a performance.
 */

// Cache em memória
const memoryCache = new Map<string, { data: any; expiry: number }>();

// Tempo padrão de expiração (5 minutos)
const DEFAULT_CACHE_TIME = 5 * 60 * 1000;

/**
 * Obtém um item do cache
 * @param key Chave única para identificar o item no cache
 * @returns O valor armazenado ou null se não existir ou expirou
 */
export function getCachedItem<T>(key: string): T | null {
  const now = Date.now();
  const cachedItem = memoryCache.get(key);
  
  if (!cachedItem) {
    return null;
  }
  
  // Verificar se o item expirou
  if (cachedItem.expiry < now) {
    memoryCache.delete(key);
    return null;
  }
  
  return cachedItem.data as T;
}

/**
 * Armazena um item no cache
 * @param key Chave única para identificar o item
 * @param data Dados a serem armazenados
 * @param ttl Tempo de vida do cache em milissegundos (padrão: 5 minutos)
 */
export function setCachedItem<T>(key: string, data: T, ttl = DEFAULT_CACHE_TIME): void {
  const expiry = Date.now() + ttl;
  memoryCache.set(key, { data, expiry });
}

/**
 * Remove um item específico do cache
 * @param key Chave do item a ser removido
 */
export function invalidateCacheItem(key: string): void {
  memoryCache.delete(key);
}

/**
 * Limpa todo o cache
 */
export function clearCache(): void {
  memoryCache.clear();
}

/**
 * Função utilitária para buscar dados com cache
 * @param key Chave única para o cache
 * @param fetchFn Função que busca os dados quando não estão em cache
 * @param ttl Tempo de vida do cache em milissegundos
 * @returns Os dados do cache ou da função fetchFn
 */
export async function fetchWithCache<T>(
  key: string, 
  fetchFn: () => Promise<T>, 
  ttl = DEFAULT_CACHE_TIME
): Promise<T> {
  // Verificar se os dados já estão em cache
  const cachedData = getCachedItem<T>(key);
  
  if (cachedData !== null) {
    return cachedData;
  }
  
  // Buscar dados frescos
  const data = await fetchFn();
  
  // Armazenar no cache
  setCachedItem(key, data, ttl);
  
  return data;
} 