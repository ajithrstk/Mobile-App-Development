import { SimpleEventEmitter, type Unsubscribe } from '../../utils/eventEmitter';
import { localDatabase } from '../../database/localDatabase';
import { ConnectionState, networkManager } from '../network/networkManager';
import { logger } from '../logging/logger';

export type MediaDownloadStatus = 'queued' | 'downloading' | 'streaming' | 'complete' | 'failed' | 'expired';

export type MediaDownload = {
  id: string;
  chatId: string;
  expiresAt?: string;
  progress: number;
  status: MediaDownloadStatus;
  thumbnailUri?: string;
  uri: string;
};

type DownloadEvents = {
  change: MediaDownload[];
  item: MediaDownload;
};

class DownloadManager {
  private downloads = new Map<string, MediaDownload>();
  private emitter = new SimpleEventEmitter<DownloadEvents>();
  private timers = new Map<string, ReturnType<typeof setInterval>>();
  private cleanupNetwork?: Unsubscribe;

  async initialize(): Promise<void> {
    const records = await localDatabase.list('mediaDownloads');
    records.forEach((record) => {
      if (typeof record.uri === 'string' && typeof record.chatId === 'string') {
        this.downloads.set(record.id, {
          chatId: record.chatId,
          expiresAt: typeof record.expiresAt === 'string' ? record.expiresAt : undefined,
          id: record.id,
          progress: typeof record.progress === 'number' ? record.progress : 0,
          status: record.status === 'complete' ? 'complete' : 'queued',
          thumbnailUri: typeof record.thumbnailUri === 'string' ? record.thumbnailUri : undefined,
          uri: record.uri,
        });
      }
    });

    this.cleanupNetwork?.();
    this.cleanupNetwork = networkManager.on('state', (state) => {
      if (state === ConnectionState.Connected) {
        this.resumeQueued();
      }
    });
  }

  on<Key extends keyof DownloadEvents>(eventName: Key, listener: (payload: DownloadEvents[Key]) => void): Unsubscribe {
    return this.emitter.on(eventName, listener);
  }

  getDownloads(): MediaDownload[] {
    return Array.from(this.downloads.values());
  }

  async queue(download: Omit<MediaDownload, 'progress' | 'status'>): Promise<MediaDownload> {
    const existing = this.downloads.get(download.id);

    if (existing) {
      return existing;
    }

    const nextDownload: MediaDownload = {
      ...download,
      progress: 0,
      status: 'queued',
    };
    this.downloads.set(download.id, nextDownload);
    await this.persist(nextDownload);
    this.emitter.emit('change', this.getDownloads());
    this.start(download.id);
    return nextDownload;
  }

  start(id: string): void {
    const download = this.downloads.get(id);

    if (!download || this.timers.has(id) || download.status === 'complete') {
      return;
    }

    if (download.expiresAt && Date.parse(download.expiresAt) < Date.now()) {
      void this.update(id, { status: 'expired' });
      return;
    }

    if (networkManager.getState() === ConnectionState.Offline) {
      void this.update(id, { status: 'queued' });
      return;
    }

    void this.update(id, { status: download.uri.includes('.mp4') ? 'streaming' : 'downloading' });
    const timer = setInterval(() => {
      const active = this.downloads.get(id);

      if (!active || networkManager.getState() === ConnectionState.Offline) {
        this.stop(id);
        if (active) {
          void this.update(id, { status: 'failed' });
        }
        return;
      }

      const nextProgress = Math.min(1, active.progress + 0.18);
      if (nextProgress >= 1) {
        this.stop(id);
        void this.update(id, { progress: 1, status: 'complete' });
        return;
      }

      void this.update(id, { progress: nextProgress });
    }, 360);
    this.timers.set(id, timer);
  }

  async cleanupExpiredMedia(): Promise<void> {
    const now = Date.now();
    const expired = this.getDownloads().filter((download) => download.expiresAt && Date.parse(download.expiresAt) < now);

    await Promise.all(expired.map((download) => this.update(download.id, { status: 'expired' })));
    logger.info('Expired media cleanup complete', { count: expired.length });
  }

  cleanup(): void {
    this.timers.forEach((timer) => clearInterval(timer));
    this.timers.clear();
    this.cleanupNetwork?.();
    this.cleanupNetwork = undefined;
  }

  private resumeQueued(): void {
    this.getDownloads()
      .filter((download) => download.status === 'queued' || download.status === 'failed')
      .forEach((download) => this.start(download.id));
  }

  private stop(id: string): void {
    const timer = this.timers.get(id);

    if (timer) {
      clearInterval(timer);
      this.timers.delete(id);
    }
  }

  private async update(id: string, patch: Partial<MediaDownload>): Promise<void> {
    const download = this.downloads.get(id);

    if (!download) {
      return;
    }

    const nextDownload = {
      ...download,
      ...patch,
    };
    this.downloads.set(id, nextDownload);
    await this.persist(nextDownload);
    this.emitter.emit('item', nextDownload);
    this.emitter.emit('change', this.getDownloads());
  }

  private async persist(download: MediaDownload): Promise<void> {
    await localDatabase.upsert('mediaDownloads', {
      chatId: download.chatId,
      expiresAt: download.expiresAt,
      id: download.id,
      progress: download.progress,
      status: download.status,
      thumbnailUri: download.thumbnailUri,
      uri: download.uri,
    });
  }
}

export const downloadManager = new DownloadManager();
