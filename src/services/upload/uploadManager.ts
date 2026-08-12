import { SimpleEventEmitter, type Unsubscribe } from '../../utils/eventEmitter';
import { logger } from '../logging/logger';
import { ConnectionState, networkManager } from '../network/networkManager';
import { jsonStorage } from '../storage/jsonStorage';

export enum UploadStatus {
  Queued = 'queued',
  Uploading = 'uploading',
  Paused = 'paused',
  Failed = 'failed',
  Completed = 'completed',
  Cancelled = 'cancelled',
}

export type UploadKind = 'image' | 'video' | 'audio' | 'document';

export type UploadTaskInput = {
  id: string;
  uri: string;
  fileName: string;
  mimeType?: string;
  size?: number;
  kind: UploadKind;
  destination: 'chat' | 'status' | 'profile';
  ownerId?: string;
};

export type UploadTask = UploadTaskInput & {
  attempts: number;
  createdAt: string;
  progress: number;
  status: UploadStatus;
  updatedAt: string;
};

type UploadEvents = {
  change: UploadTask[];
  task: UploadTask;
};

const storageKey = 'chatterly.upload.queue';
const maxConcurrentUploads = 3;

class UploadManager {
  private emitter = new SimpleEventEmitter<UploadEvents>();
  private activeTimers = new Map<string, ReturnType<typeof setInterval>>();
  private tasks = new Map<string, UploadTask>();
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    const persistedTasks = await jsonStorage.getItem<UploadTask[]>(storageKey, []);
    persistedTasks
      .filter((task) => task.status !== UploadStatus.Completed && task.status !== UploadStatus.Cancelled)
      .forEach((task) => {
        this.tasks.set(task.id, {
          ...task,
          status: task.status === UploadStatus.Uploading ? UploadStatus.Queued : task.status,
        });
      });

    this.initialized = true;
    networkManager.on('state', (state) => {
      if (state === ConnectionState.Connected) {
        void this.resumePendingUploads();
      }
    });
  }

  on<Key extends keyof UploadEvents>(eventName: Key, listener: (payload: UploadEvents[Key]) => void): Unsubscribe {
    return this.emitter.on(eventName, listener);
  }

  getTasks(): UploadTask[] {
    return Array.from(this.tasks.values()).sort((first, second) => first.createdAt.localeCompare(second.createdAt));
  }

  async enqueue(input: UploadTaskInput): Promise<UploadTask> {
    const existingTask = this.tasks.get(input.id);

    if (existingTask && existingTask.status !== UploadStatus.Cancelled) {
      return existingTask;
    }

    const timestamp = new Date().toISOString();
    const task: UploadTask = {
      ...input,
      attempts: 0,
      createdAt: timestamp,
      progress: 0,
      status: UploadStatus.Queued,
      updatedAt: timestamp,
    };

    this.tasks.set(task.id, task);
    await this.persistAndEmit(task);
    this.pumpQueue();
    return task;
  }

  pause(taskId: string): void {
    this.stopTimer(taskId);
    this.updateTask(taskId, { status: UploadStatus.Paused });
  }

  cancel(taskId: string): void {
    this.stopTimer(taskId);
    this.updateTask(taskId, { status: UploadStatus.Cancelled, progress: 0 });
  }

  retry(taskId: string): void {
    this.updateTask(taskId, { status: UploadStatus.Queued });
    this.pumpQueue();
  }

  remove(taskId: string): void {
    this.stopTimer(taskId);
    this.tasks.delete(taskId);
    void this.persist();
    this.emitter.emit('change', this.getTasks());
  }

  async resumePendingUploads(): Promise<void> {
    this.tasks.forEach((task) => {
      if (task.status === UploadStatus.Failed || task.status === UploadStatus.Queued) {
        this.updateTask(task.id, { status: UploadStatus.Queued });
      }
    });
    this.pumpQueue();
  }

  private pumpQueue(): void {
    if (networkManager.getState() === ConnectionState.Offline) {
      return;
    }

    const activeCount = this.getTasks().filter((task) => task.status === UploadStatus.Uploading).length;
    const slots = Math.max(0, maxConcurrentUploads - activeCount);

    this.getTasks()
      .filter((task) => task.status === UploadStatus.Queued)
      .slice(0, slots)
      .forEach((task) => this.startUpload(task.id));
  }

  private startUpload(taskId: string): void {
    const task = this.tasks.get(taskId);

    if (!task || this.activeTimers.has(taskId)) {
      return;
    }

    this.updateTask(taskId, {
      attempts: task.attempts + 1,
      status: UploadStatus.Uploading,
    });

    const timer = setInterval(() => {
      const activeTask = this.tasks.get(taskId);

      if (!activeTask || activeTask.status !== UploadStatus.Uploading) {
        this.stopTimer(taskId);
        return;
      }

      const nextProgress = Math.min(1, activeTask.progress + 0.12 + Math.random() * 0.16);

      if (networkManager.getState() === ConnectionState.Offline) {
        this.stopTimer(taskId);
        this.updateTask(taskId, { status: UploadStatus.Failed });
        logger.warning('Upload paused after network loss', { uploadId: taskId, kind: activeTask.kind });
        return;
      }

      if (nextProgress >= 1) {
        this.stopTimer(taskId);
        this.updateTask(taskId, { progress: 1, status: UploadStatus.Completed });
        this.pumpQueue();
        return;
      }

      this.updateTask(taskId, { progress: nextProgress });
    }, 420);

    this.activeTimers.set(taskId, timer);
  }

  private stopTimer(taskId: string): void {
    const timer = this.activeTimers.get(taskId);

    if (timer) {
      clearInterval(timer);
      this.activeTimers.delete(taskId);
    }
  }

  private updateTask(taskId: string, patch: Partial<UploadTask>): void {
    const task = this.tasks.get(taskId);

    if (!task) {
      return;
    }

    const updatedTask = {
      ...task,
      ...patch,
      updatedAt: new Date().toISOString(),
    };

    this.tasks.set(taskId, updatedTask);
    void this.persistAndEmit(updatedTask);
  }

  private async persistAndEmit(task: UploadTask): Promise<void> {
    await this.persist();
    this.emitter.emit('task', task);
    this.emitter.emit('change', this.getTasks());
  }

  private async persist(): Promise<void> {
    await jsonStorage.setItem(
      storageKey,
      this.getTasks().filter((task) => task.status !== UploadStatus.Completed && task.status !== UploadStatus.Cancelled),
    );
  }
}

export const uploadManager = new UploadManager();
