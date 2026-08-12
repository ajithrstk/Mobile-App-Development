import contacts from '../data/contacts';
import { ConnectionState, networkManager } from '../services/network/networkManager';
import type { ChatMessage } from '../types/message';
import { SimpleEventEmitter, type Unsubscribe } from '../utils/eventEmitter';
import type { MockSocketEvents, SocketConnectionState } from './socket.types';

class MockSocketService {
  private emitter = new SimpleEventEmitter<MockSocketEvents>();
  private timers = new Set<ReturnType<typeof setTimeout>>();
  private intervals = new Set<ReturnType<typeof setInterval>>();
  private state: SocketConnectionState = 'disconnected';
  private userId: string | null = null;
  private reconnectAttempts = 0;
  private lastHeartbeatAt: string | null = null;
  private networkCleanup?: Unsubscribe;

  connect(userId: string): void {
    if (this.state === 'connected' && this.userId === userId) {
      return;
    }

    this.cleanupTimers();
    this.userId = userId;
    this.state = 'connecting';
    this.schedule(() => {
      this.state = 'connected';
      this.reconnectAttempts = 0;
      this.emitter.emit('connect', undefined);
      this.startHeartbeat();
      this.startPresenceSimulation();
      this.startIncomingMessageSimulation();
    }, 350);

    this.networkCleanup?.();
    this.networkCleanup = networkManager.on('state', (state) => {
      if (state === ConnectionState.Offline) {
        this.disconnect('network-offline');
      }

      if (state === ConnectionState.Connected && this.state === 'disconnected' && this.userId) {
        this.reconnect();
      }
    });
  }

  disconnect(reason = 'manual'): void {
    if (this.state === 'disconnected') {
      return;
    }

    this.cleanupTimers();
    this.state = 'disconnected';
    this.emitter.emit('disconnect', reason);
  }

  on<Key extends keyof MockSocketEvents>(eventName: Key, listener: (payload: MockSocketEvents[Key]) => void): Unsubscribe {
    return this.emitter.on(eventName, listener);
  }

  emit<Key extends keyof MockSocketEvents>(eventName: Key, payload: MockSocketEvents[Key]): void {
    this.emitter.emit(eventName, payload);
  }

  sendMessage(chatId: string, message: ChatMessage): void {
    if (this.state !== 'connected') {
      return;
    }

    this.schedule(() => this.emitter.emit('message:sent', { chatId, messageId: message.id, status: 'sent' }), 450);
    this.schedule(() => this.emitter.emit('message:delivered', { chatId, messageId: message.id, status: 'delivered' }), 1200);
  }

  markSeen(chatId: string, messageIds: string[]): void {
    messageIds.forEach((messageId, index) => {
      this.schedule(() => this.emitter.emit('message:seen', { chatId, messageId, status: 'seen' }), 220 + index * 40);
    });
  }

  simulateSocketDrop(): void {
    this.disconnect('simulated-disconnect');
    this.reconnect();
  }

  getHealth(): { lastHeartbeatAt: string | null; reconnectAttempts: number; state: SocketConnectionState } {
    return {
      lastHeartbeatAt: this.lastHeartbeatAt,
      reconnectAttempts: this.reconnectAttempts,
      state: this.state,
    };
  }

  cleanup(): void {
    this.disconnect('cleanup');
    this.networkCleanup?.();
    this.networkCleanup = undefined;
    this.emitter.removeAllListeners();
    this.userId = null;
  }

  private reconnect(): void {
    if (!this.userId) {
      return;
    }

    this.state = 'reconnecting';
    this.reconnectAttempts += 1;
    this.emitter.emit('reconnect_attempt', this.reconnectAttempts);
    this.schedule(() => {
      if (this.userId) {
        this.connect(this.userId);
      }
    }, 1000 + this.reconnectAttempts * 350);
  }

  private startPresenceSimulation(): void {
    const interval = setInterval(() => {
      const contact = contacts[Math.floor(Math.random() * Math.min(contacts.length, 50))];
      if (!contact) {
        return;
      }

      this.emitter.emit(Math.random() > 0.45 ? 'user:online' : 'user:offline', { userId: contact.id });
      const chatId = contact.name.match(/Ajith|Yashwanth|Mallika|Naveen|Sabari/) ? `new-${contact.id}` : String((Number(contact.id.replace('contact-', '')) % 20) + 1);

      if (Math.random() > 0.55) {
        this.emitter.emit('typing:start', { chatId, userId: contact.id, userName: contact.name });
        this.schedule(() => this.emitter.emit('typing:stop', { chatId, userId: contact.id }), 1800);
      }
    }, 5200);
    this.intervals.add(interval);
  }

  private startIncomingMessageSimulation(): void {
    const samples = [
      'Can you check this when you are free?',
      'I just came online.',
      'Thanks, that helped.',
      'Sharing the update here.',
      'Let us sync in a bit.',
    ];

    const interval = setInterval(() => {
      const chatId = String(1 + Math.floor(Math.random() * 20));
      const message: ChatMessage = {
        chatId,
        clientId: `incoming-${Date.now()}`,
        id: `incoming-${Date.now()}`,
        kind: 'text',
        sender: 'them',
        senderId: `contact-${chatId}`,
        status: 'delivered',
        text: samples[Math.floor(Math.random() * samples.length)],
        timestamp: new Date().toISOString(),
      };
      this.emitter.emit('message:new', { chatId, message });
    }, 16000);
    this.intervals.add(interval);
  }

  private startHeartbeat(): void {
    const interval = setInterval(() => {
      if (this.state !== 'connected') {
        return;
      }

      this.lastHeartbeatAt = new Date().toISOString();

      if (networkManager.getState() === ConnectionState.Offline) {
        this.disconnect('heartbeat-offline');
      }
    }, 10000);
    this.intervals.add(interval);
  }

  private schedule(callback: () => void, delayMs: number): void {
    const timer = setTimeout(() => {
      this.timers.delete(timer);
      callback();
    }, delayMs);
    this.timers.add(timer);
  }

  private cleanupTimers(): void {
    this.timers.forEach((timer) => clearTimeout(timer));
    this.intervals.forEach((interval) => clearInterval(interval));
    this.timers.clear();
    this.intervals.clear();
  }
}

export const mockSocketService = new MockSocketService();
