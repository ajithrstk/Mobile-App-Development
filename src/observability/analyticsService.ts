import { localDatabase } from '../database/localDatabase';
import { logger, type LogContext } from '../services/logging/logger';

export type AnalyticsEvent = {
  id: string;
  name: string;
  properties?: LogContext;
  timestamp: string;
};

export type ApiMetric = {
  durationMs: number;
  method: string;
  path: string;
  status: number;
};

class AnalyticsService {
  private events: AnalyticsEvent[] = [];

  async initialize(): Promise<void> {
    logger.addReporter((entry) => {
      if (entry.level === 'error') {
        void this.track('crash_or_error', {
          message: entry.message,
        });
      }
    });
    logger.info('Observability initialized');
  }

  async track(name: string, properties?: LogContext): Promise<void> {
    const event: AnalyticsEvent = {
      id: `event-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      properties,
      timestamp: new Date().toISOString(),
    };
    this.events = [...this.events.slice(-99), event];
    await localDatabase.upsert('syncEvents', {
      id: event.id,
      name: event.name,
      type: 'analytics-event',
    });
  }

  startScreenLoad(screenName: string): () => void {
    const startedAt = Date.now();
    void this.track('screen_load_start', { screenName });

    return () => {
      void this.track('screen_load_finish', {
        durationMs: Date.now() - startedAt,
        screenName,
      });
    };
  }

  recordApiMetric(metric: ApiMetric): void {
    void this.track('api_metric', {
      durationMs: metric.durationMs,
      method: metric.method,
      path: metric.path,
      status: metric.status,
    });
  }

  recordNetworkRecovery(queueSize: number): void {
    void this.track('network_recovery', { queueSize });
  }

  getRecentEvents(): AnalyticsEvent[] {
    return this.events;
  }
}

export const analyticsService = new AnalyticsService();
