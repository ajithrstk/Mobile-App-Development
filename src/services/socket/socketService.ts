import { SimpleEventEmitter, type Unsubscribe } from '../../utils/eventEmitter';
import { logger } from '../logging/logger';
import { ConnectionState, networkManager } from '../network/networkManager';

type SocketPayload = Record<string, boolean | number | string | null | undefined>;

type SocketEvents = {
  connect: undefined;
  disconnect: string;
  reconnecting: number;
  event: { name: string; payload: SocketPayload };
};

class SocketService {
  private emitter = new SimpleEventEmitter<SocketEvents>();
  private connected = false;
  private reconnectAttempts = 0;
  private networkCleanup?: Unsubscribe;

  connect(): void {
    if (this.connected) {
      return;
    }

    this.connected = true;
    this.reconnectAttempts = 0;
    this.emitter.emit('connect', undefined);
    logger.info('Socket connected');

    this.networkCleanup?.();
    this.networkCleanup = networkManager.on('state', (state) => {
      if (state === ConnectionState.Offline) {
        this.disconnect('network-offline');
      }

      if (state === ConnectionState.Connected && !this.connected) {
        this.reconnect();
      }
    });
  }

  disconnect(reason = 'manual'): void {
    if (!this.connected) {
      return;
    }

    this.connected = false;
    this.emitter.emit('disconnect', reason);
    logger.warning('Socket disconnected', { reason });
  }

  emit(name: string, payload: SocketPayload): void {
    logger.debug('Socket event emitted', { eventName: name, ...payload });
    this.emitter.emit('event', { name, payload });
  }

  on<Key extends keyof SocketEvents>(eventName: Key, listener: (payload: SocketEvents[Key]) => void): Unsubscribe {
    return this.emitter.on(eventName, listener);
  }

  cleanup(): void {
    this.networkCleanup?.();
    this.networkCleanup = undefined;
    this.connected = false;
    this.emitter.removeAllListeners();
  }

  private reconnect(): void {
    this.reconnectAttempts += 1;
    this.emitter.emit('reconnecting', this.reconnectAttempts);
    logger.info('Socket reconnecting', { attempts: this.reconnectAttempts });
    this.connect();
  }
}

export const socketService = new SocketService();
