type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};

// Only log in development or if explicitly enabled
const isLoggingEnabled = process.env.NODE_ENV !== 'production' || process.env.ENABLE_LOGGING === 'true';
const currentLogLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';

function shouldLog(level: LogLevel): boolean {
    if (!isLoggingEnabled) return false;
    return LOG_LEVELS[level] >= LOG_LEVELS[currentLogLevel];
}

export const logger = {
    debug: (...args: any[]) => {
        if (shouldLog('debug')) {
            console.log('[DEBUG]', ...args);
        }
    },

    info: (...args: any[]) => {
        if (shouldLog('info')) {
            console.log('[INFO]', ...args);
        }
    },

    warn: (...args: any[]) => {
        if (shouldLog('warn')) {
            console.warn('[WARN]', ...args);
        }
    },

    error: (...args: any[]) => {
        if (shouldLog('error')) {
            console.error('[ERROR]', ...args);
        }
    },
};

// Alias for convenience
export default logger;
