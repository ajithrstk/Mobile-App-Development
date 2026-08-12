import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

type JsonValue = boolean | number | string | null | JsonValue[] | { [key: string]: JsonValue };

const storageDirectory = `${FileSystem.documentDirectory ?? ''}chatterly-storage/`;

async function ensureStorageDirectory(): Promise<void> {
  if (!FileSystem.documentDirectory) {
    return;
  }

  const info = await FileSystem.getInfoAsync(storageDirectory);

  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(storageDirectory, { intermediates: true });
  }
}

function safeFileName(key: string): string {
  return encodeURIComponent(key).replace(/[!'()*]/g, (character) => `%${character.charCodeAt(0).toString(16)}`);
}

function getWebStorage(): Storage | null {
  if (Platform.OS !== 'web' || typeof globalThis.localStorage === 'undefined') {
    return null;
  }

  return globalThis.localStorage;
}

class JsonStorage {
  async getItem<T extends JsonValue>(key: string, fallback: T): Promise<T> {
    try {
      const webStorage = getWebStorage();

      if (webStorage) {
        const item = webStorage.getItem(key);
        return item ? (JSON.parse(item) as T) : fallback;
      }

      if (!FileSystem.documentDirectory) {
        return fallback;
      }

      const fileUri = `${storageDirectory}${safeFileName(key)}.json`;
      const info = await FileSystem.getInfoAsync(fileUri);

      if (!info.exists) {
        return fallback;
      }

      return JSON.parse(await FileSystem.readAsStringAsync(fileUri)) as T;
    } catch {
      return fallback;
    }
  }

  async setItem<T extends JsonValue>(key: string, value: T): Promise<void> {
    const serialized = JSON.stringify(value);
    const webStorage = getWebStorage();

    if (webStorage) {
      webStorage.setItem(key, serialized);
      return;
    }

    if (!FileSystem.documentDirectory) {
      return;
    }

    await ensureStorageDirectory();
    await FileSystem.writeAsStringAsync(`${storageDirectory}${safeFileName(key)}.json`, serialized);
  }

  async removeItem(key: string): Promise<void> {
    const webStorage = getWebStorage();

    if (webStorage) {
      webStorage.removeItem(key);
      return;
    }

    if (!FileSystem.documentDirectory) {
      return;
    }

    const fileUri = `${storageDirectory}${safeFileName(key)}.json`;
    const info = await FileSystem.getInfoAsync(fileUri);

    if (info.exists) {
      await FileSystem.deleteAsync(fileUri, { idempotent: true });
    }
  }
}

export const jsonStorage = new JsonStorage();
