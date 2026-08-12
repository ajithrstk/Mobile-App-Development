import { Platform } from 'react-native';
import { SimpleEventEmitter, type Unsubscribe } from '../../utils/eventEmitter';
import { jsonStorage } from '../../services/storage/jsonStorage';
import { logger } from '../../services/logging/logger';
import type { NotificationPayload, NotificationPermissionStatus } from '../types/notification';

type NotificationEvents = {
  tap: NotificationPayload;
  badge: number;
  receive: NotificationPayload;
};

const badgeStorageKey = 'chatterly.notification.badge';
const deliveredStorageKey = 'chatterly.notification.delivered';

class NotificationService {
  private emitter = new SimpleEventEmitter<NotificationEvents>();
  private deliveredIds = new Set<string>();
  private badgeCount = 0;
  private permissionStatus: NotificationPermissionStatus = 'unavailable';
  private scheduledTimers = new Map<string, ReturnType<typeof setTimeout>>();

  async initialize(): Promise<void> {
    const [storedBadge, deliveredIds] = await Promise.all([
      jsonStorage.getItem<number>(badgeStorageKey, 0),
      jsonStorage.getItem<string[]>(deliveredStorageKey, []),
    ]);

    this.badgeCount = storedBadge;
    this.deliveredIds = new Set(deliveredIds);
    logger.info('Notification service initialized', { platform: Platform.OS });
  }

  on<Key extends keyof NotificationEvents>(
    eventName: Key,
    listener: (payload: NotificationEvents[Key]) => void,
  ): Unsubscribe {
    return this.emitter.on(eventName, listener);
  }

  async requestPermission(): Promise<NotificationPermissionStatus> {
    this.permissionStatus = Platform.OS === 'web' ? 'unavailable' : 'granted';
    return this.permissionStatus;
  }

  async createAndroidChannels(): Promise<void> {
    if (Platform.OS === 'android') {
      logger.info('Android notification channels ready', {
        calls: 'calls',
        directReply: 'direct-reply',
        media: 'media',
        messages: 'messages',
        muted: 'silent-muted',
      });
    }
  }

  async showNotification(payload: NotificationPayload): Promise<void> {
    if (payload.scheduledFor && Date.parse(payload.scheduledFor) > Date.now()) {
      this.scheduleNotification(payload);
      return;
    }

    if (payload.muted || payload.silent) {
      logger.info('Silent notification recorded', { groupKey: payload.groupKey, notificationId: payload.id });
    }

    if (this.deliveredIds.has(payload.id)) {
      logger.debug('Duplicate notification suppressed', { notificationId: payload.id, kind: payload.kind });
      return;
    }

    this.deliveredIds.add(payload.id);
    await jsonStorage.setItem(deliveredStorageKey, Array.from(this.deliveredIds).slice(-80));
    await this.setBadgeCount(this.badgeCount + 1);
    this.emitter.emit('receive', payload);
    logger.info('Notification delivered', { notificationId: payload.id, kind: payload.kind });
  }

  async showGroupedMessageNotification(payload: NotificationPayload): Promise<void> {
    await this.showNotification({
      ...payload,
      groupKey: payload.groupKey ?? `chat-${payload.chatId ?? 'general'}`,
    });
  }

  async setBadgeCount(count: number): Promise<void> {
    this.badgeCount = Math.max(0, count);
    await jsonStorage.setItem(badgeStorageKey, this.badgeCount);
    this.emitter.emit('badge', this.badgeCount);
  }

  async clearBadgeCount(): Promise<void> {
    await this.setBadgeCount(0);
  }

  getBadgeCount(): number {
    return this.badgeCount;
  }

  simulateTap(payload: NotificationPayload): void {
    this.emitter.emit('tap', payload);
  }

  cleanup(): void {
    this.scheduledTimers.forEach((timer) => clearTimeout(timer));
    this.scheduledTimers.clear();
  }

  private scheduleNotification(payload: NotificationPayload): void {
    if (!payload.scheduledFor || this.scheduledTimers.has(payload.id)) {
      return;
    }

    const delayMs = Math.max(0, Date.parse(payload.scheduledFor) - Date.now());
    const timer = setTimeout(() => {
      this.scheduledTimers.delete(payload.id);
      void this.showNotification({ ...payload, scheduledFor: undefined });
    }, delayMs);
    this.scheduledTimers.set(payload.id, timer);
    logger.info('Notification scheduled', { notificationId: payload.id });
  }
}

export const notificationService = new NotificationService();
