// Utilitário de logger que respeita configurações de segurança
const isProduction = process.env.NODE_ENV === 'production';
// Por padrão, desabilitar logs para proteção de dados (pode ser alterado via env)
const disableLogs = process.env.DISABLE_CONSOLE_LOGS !== 'false';

export const logger = {
  log: (...args: any[]) => {
    if (!disableLogs) {
      console.log(...args);
    }
  },
  
  error: (...args: any[]) => {
    // Manter apenas errors críticos
    if (!disableLogs) {
      console.error(...args);
    }
  },
  
  warn: (...args: any[]) => {
    if (!disableLogs) {
      console.warn(...args);
    }
  },
  
  info: (...args: any[]) => {
    if (!disableLogs) {
      console.info(...args);
    }
  },
  
  // Para logs de segurança - nunca exibir
  security: () => {
    // Silencioso sempre
  }
};

// Função para desabilitar todos os console.log globalmente
export const disableConsoleLogging = () => {
  if (disableLogs) {
    const noop = () => {};
    console.log = noop;
    console.info = noop;
    console.warn = noop;
    console.debug = noop;
    console.trace = noop;
  }
};

// Auto-executar na importação se necessário
if (typeof window !== 'undefined' && disableLogs) {
  disableConsoleLogging();
} 