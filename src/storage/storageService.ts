import { jsonStorage } from '../services/storage/jsonStorage';

type StoredValue = boolean | number | string | null | StoredValue[] | { [key: string]: StoredValue };

class StorageService {
  async get<T>(key: string, fallback: T): Promise<T> {
    return jsonStorage.getItem(key, fallback as StoredValue) as Promise<T>;
  }

  async set<T>(key: string, value: T): Promise<void> {
    await jsonStorage.setItem(key, value as StoredValue);
  }

  async remove(key: string): Promise<void> {
    await jsonStorage.removeItem(key);
  }

  async multiRemove(keys: string[]): Promise<void> {
    await Promise.all(keys.map((key) => this.remove(key)));
  }
}

export const storageService = new StorageService();
