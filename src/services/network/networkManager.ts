import { AppState, type AppStateStatus } from 'react-native';
import { localDatabase } from '../../database/localDatabase';
import { analyticsService } from '../../observability/analyticsService';
import { SimpleEventEmitter, type Unsubscribe } from '../../utils/eventEmitter';
import { logger } from '../logging/logger';

export enum ConnectionState {
  Connected = 'connected',
  Offline = 'offline',
  Reconnecting = 'reconnecting',
  Retrying = 'retrying',
  Failed = 'failed',
}

export type QueuedOperation = {
  id: string;
  kind: 'api' | 'message' | 'socket' | 'upload';
  createdAt: string;
  attempts: number;
  run: () => Promise<void>;
};

type NetworkEvents = {
  state: ConnectionState;
  appState: AppStateStatus;
  queueSize: number;
};

class NetworkManager {
  private appStateSubscription?: { remove: () => void };
  private emitter = new SimpleEventEmitter<NetworkEvents>();
  private operationQueue = new Map<string, QueuedOperation>();
  private retryTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private connectionState = ConnectionState.Connected;
  private appState: AppStateStatus = AppState.currentState;
  private processingQueue = false;

  initialize(): () => void {
    if (!this.appStateSubscription) {
      this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);
    }

    return () => {
      this.appStateSubscription?.remove();
      this.appStateSubscription = undefined;
      this.retryTimers.forEach((timer) => clearTimeout(timer));
      this.retryTimers.clear();
      this.emitter.removeAllListeners();
    };
  }

  on<Key extends keyof NetworkEvents>(eventName: Key, listener: (payload: NetworkEvents[Key]) => void): Unsubscribe {
    return this.emitter.on(eventName, listener);
  }

  getState(): ConnectionState {
    return this.connectionState;
  }

  getQueueSize(): number {
    return this.operationQueue.size;
  }

  setOnline(isOnline: boolean): void {
    this.updateConnectionState(isOnline ? ConnectionState.Connected : ConnectionState.Offline);

    if (isOnline) {
      void this.flushQueue();
    }
  }

  enqueue(operation: QueuedOperation): void {
    if (this.operationQueue.has(operation.id)) {
      logger.debug('Skipped duplicate queued operation', { operationId: operation.id, kind: operation.kind });
      return;
    }

    this.operationQueue.set(operation.id, operation);
    void localDatabase.upsert('operationQueue', {
      attempts: operation.attempts,
      id: operation.id,
      kind: operation.kind,
      queuedAt: operation.createdAt,
    });
    this.emitter.emit('queueSize', this.operationQueue.size);

    if (this.connectionState === ConnectionState.Connected) {
      void this.flushQueue();
    }
  }

  async runWithRetry(
    operationId: string,
    kind: QueuedOperation['kind'],
    run: () => Promise<void>,
  ): Promise<void> {
    if (this.connectionState === ConnectionState.Offline || this.connectionState === ConnectionState.Reconnecting) {
      this.enqueue({
        id: operationId,
        kind,
        createdAt: new Date().toISOString(),
        attempts: 0,
        run,
      });
      return;
    }

    try {
      await run();
    } catch (error) {
      logger.error('Operation failed, queued for retry', error instanceof Error ? error : undefined, {
        operationId,
        kind,
      });
      this.enqueue({
        id: operationId,
        kind,
        createdAt: new Date().toISOString(),
        attempts: 1,
        run,
      });
      this.updateConnectionState(ConnectionState.Retrying);
    }
  }

  private handleAppStateChange = (nextAppState: AppStateStatus): void => {
    this.appState = nextAppState;
    this.emitter.emit('appState', nextAppState);

    if (nextAppState === 'active' && this.connectionState !== ConnectionState.Offline) {
      void this.flushQueue();
    }
  };

  private updateConnectionState(nextState: ConnectionState): void {
    if (this.connectionState === nextState) {
      return;
    }

    this.connectionState = nextState;
    this.emitter.emit('state', nextState);
    logger.info('Network state changed', { state: nextState });

    if (nextState === ConnectionState.Connected) {
      analyticsService.recordNetworkRecovery(this.operationQueue.size);
    }
  }

  private async flushQueue(): Promise<void> {
    if (this.processingQueue || this.operationQueue.size === 0) {
      return;
    }

    this.processingQueue = true;
    this.updateConnectionState(ConnectionState.Retrying);

    for (const [operationId, operation] of this.operationQueue.entries()) {
      try {
        await operation.run();
        this.operationQueue.delete(operationId);
        await localDatabase.remove('operationQueue', operationId);
        this.emitter.emit('queueSize', this.operationQueue.size);
      } catch (error) {
        const nextAttempts = operation.attempts + 1;
        this.operationQueue.set(operationId, { ...operation, attempts: nextAttempts });
        await localDatabase.upsert('operationQueue', {
          attempts: nextAttempts,
          id: operationId,
          kind: operation.kind,
          queuedAt: operation.createdAt,
        });
        logger.error('Queued operation retry failed', error instanceof Error ? error : undefined, {
          operationId,
          kind: operation.kind,
          attempts: nextAttempts,
        });
        break;
      }
    }

    this.processingQueue = false;
    if (this.operationQueue.size === 0) {
      this.updateConnectionState(ConnectionState.Connected);
      return;
    }

    this.updateConnectionState(ConnectionState.Failed);
    this.scheduleRetry();
  }

  private scheduleRetry(): void {
    if (this.connectionState === ConnectionState.Offline || this.retryTimers.has('queue-flush')) {
      return;
    }

    const maxAttempts = Math.max(1, ...Array.from(this.operationQueue.values()).map((operation) => operation.attempts));
    const delayMs = Math.min(30000, 1000 * 2 ** Math.min(maxAttempts, 5));
    const timer = setTimeout(() => {
      this.retryTimers.delete('queue-flush');
      void this.flushQueue();
    }, delayMs);
    this.retryTimers.set('queue-flush', timer);
  }
}

export const networkManager = new NetworkManager();
