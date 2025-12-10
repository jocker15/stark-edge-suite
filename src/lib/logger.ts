interface LogEntry {
  level: 'error' | 'warn' | 'info';
  message: string;
  context?: Record<string, unknown>;
  timestamp: string;
  userAgent: string;
  url: string;
}

export const logger = {
  async error(message: string, context?: Record<string, unknown>) {
    const logEntry: LogEntry = {
      level: 'error',
      message,
      context,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
      url: typeof window !== 'undefined' ? window.location.href : 'server',
    };

    console.error(`[ERROR] ${message}`, context);

    try {
      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logEntry),
      }).catch(() => {
        // Ignore errors - don't want to break user experience
      });
    } catch {
      // Ignore - non-blocking
    }
  },

  async warn(message: string, context?: Record<string, unknown>) {
    const logEntry: LogEntry = {
      level: 'warn',
      message,
      context,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
      url: typeof window !== 'undefined' ? window.location.href : 'server',
    };

    console.warn(`[WARN] ${message}`, context);
  },

  async info(message: string, context?: Record<string, unknown>) {
    const logEntry: LogEntry = {
      level: 'info',
      message,
      context,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
      url: typeof window !== 'undefined' ? window.location.href : 'server',
    };

    console.info(`[INFO] ${message}`, context);
  },
};
