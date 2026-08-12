import { logger, type LogContext } from './logger';

class MonitoringService {
  logApiRequest(method: string, path: string, context?: LogContext): void {
    logger.info('API request', { method, path, ...context });
  }

  logApiResponse(method: string, path: string, status: number, durationMs: number): void {
    logger.info('API response', { durationMs, method, path, status });
  }

  logApiFailure(method: string, path: string, error: Error): void {
    logger.error('API failure', error, { method, path });
  }

  startPerformanceTrace(name: string): () => void {
    const startedAt = Date.now();
    logger.debug('Performance trace started', { name });

    return () => {
      logger.info('Performance trace finished', { durationMs: Date.now() - startedAt, name });
    };
  }
}

export const monitoringService = new MonitoringService();
