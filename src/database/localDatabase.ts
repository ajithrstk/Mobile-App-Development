import { storageService } from '../storage/storageService';

export type LocalTableName =
  | 'backgroundCheckpoints'
  | 'conflicts'
  | 'mediaDownloads'
  | 'operationQueue'
  | 'securityEvents'
  | 'syncEvents';

export type LocalRecord = {
  id: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: boolean | number | string | null | undefined;
};

type LocalRecordInput = {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: boolean | number | string | null | undefined;
};

type Table = Record<string, LocalRecord>;
type DatabaseSnapshot = Record<LocalTableName, Table>;

const storageKey = 'chatterly.local-database.v1';

const emptySnapshot: DatabaseSnapshot = {
  backgroundCheckpoints: {},
  conflicts: {},
  mediaDownloads: {},
  operationQueue: {},
  securityEvents: {},
  syncEvents: {},
};

class LocalDatabase {
  private snapshot: DatabaseSnapshot = emptySnapshot;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    const storedSnapshot = await storageService.get<DatabaseSnapshot>(storageKey, emptySnapshot);
    this.snapshot = {
      ...emptySnapshot,
      ...storedSnapshot,
    };
    this.initialized = true;
  }

  async upsert(tableName: LocalTableName, record: LocalRecordInput): Promise<LocalRecord> {
    await this.initialize();
    const existing = this.snapshot[tableName][record.id];
    const timestamp = new Date().toISOString();
    const nextRecord: LocalRecord = {
      ...existing,
      ...record,
      createdAt: existing?.createdAt ?? record.createdAt ?? timestamp,
      updatedAt: timestamp,
    };
    this.snapshot = {
      ...this.snapshot,
      [tableName]: {
        ...this.snapshot[tableName],
        [record.id]: nextRecord,
      },
    };
    await this.persist();
    return nextRecord;
  }

  async list(tableName: LocalTableName): Promise<LocalRecord[]> {
    await this.initialize();
    return Object.values(this.snapshot[tableName]).sort((first, second) => first.createdAt.localeCompare(second.createdAt));
  }

  async remove(tableName: LocalTableName, id: string): Promise<void> {
    await this.initialize();
    const nextTable = { ...this.snapshot[tableName] };
    delete nextTable[id];
    this.snapshot = {
      ...this.snapshot,
      [tableName]: nextTable,
    };
    await this.persist();
  }

  async clear(tableName: LocalTableName): Promise<void> {
    await this.initialize();
    this.snapshot = {
      ...this.snapshot,
      [tableName]: {},
    };
    await this.persist();
  }

  private async persist(): Promise<void> {
    await storageService.set(storageKey, this.snapshot);
  }
}

export const localDatabase = new LocalDatabase();
