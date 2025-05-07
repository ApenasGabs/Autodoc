enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface Logger {
  debug(message: string): void;
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
}

// Nível de log atual (definido pela variável de ambiente LOG_LEVEL)
const currentLogLevel = process.env.LOG_LEVEL
  ? LogLevel[process.env.LOG_LEVEL as keyof typeof LogLevel] || LogLevel.INFO
  : LogLevel.INFO;

export function createLogger(context: string): Logger {
  const timestamp = () => new Date().toISOString();

  return {
    debug(message: string) {
      if (currentLogLevel <= LogLevel.DEBUG) {
        console.debug(`[${timestamp()}] [${context}] [DEBUG] ${message}`);
      }
    },

    info(message: string) {
      if (currentLogLevel <= LogLevel.INFO) {
        console.info(`[${timestamp()}] [${context}] [INFO] ${message}`);
      }
    },

    warn(message: string) {
      if (currentLogLevel <= LogLevel.WARN) {
        console.warn(`[${timestamp()}] [${context}] [WARN] ${message}`);
      }
    },

    error(message: string) {
      if (currentLogLevel <= LogLevel.ERROR) {
        console.error(`[${timestamp()}] [${context}] [ERROR] ${message}`);
      }
    },
  };
}
