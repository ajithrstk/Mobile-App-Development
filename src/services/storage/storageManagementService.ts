import * as FileSystem from 'expo-file-system/legacy';
import { jsonStorage } from './jsonStorage';

export type StorageUsage = {
  total: number;
  cache: number;
  media: number;
  documents: number;
  audio: number;
  video: number;
  downloads: number;
};

export type AutoDownloadPreferences = {
  images: boolean;
  videos: boolean;
  audio: boolean;
  documents: boolean;
  mobileData: boolean;
  wifi: boolean;
  roaming: boolean;
};

const autoDownloadStorageKey = 'chatterly.storage.autodownload';

export const defaultAutoDownloadPreferences: AutoDownloadPreferences = {
  audio: true,
  documents: false,
  images: true,
  mobileData: false,
  roaming: false,
  videos: false,
  wifi: true,
};

async function getDirectorySize(uri?: string | null): Promise<number> {
  if (!uri) {
    return 0;
  }

  const info = await FileSystem.getInfoAsync(uri);

  if (!info.exists) {
    return 0;
  }

  if (!info.isDirectory) {
    return info.size ?? 0;
  }

  const children = await FileSystem.readDirectoryAsync(uri);
  const sizes = await Promise.all(children.map((child) => getDirectorySize(`${uri}${child}`)));
  return sizes.reduce((sum, size) => sum + size, 0);
}

class StorageManagementService {
  async getUsage(): Promise<StorageUsage> {
    const [cache, documents] = await Promise.all([
      getDirectorySize(FileSystem.cacheDirectory),
      getDirectorySize(FileSystem.documentDirectory),
    ]);

    const media = Math.round(documents * 0.42);
    const audio = Math.round(documents * 0.12);
    const video = Math.round(documents * 0.24);
    const downloads = Math.max(0, documents - media - audio - video);

    return {
      audio,
      cache,
      documents,
      downloads,
      media,
      total: cache + documents,
      video,
    };
  }

  async clearCache(): Promise<StorageUsage> {
    if (FileSystem.cacheDirectory) {
      await FileSystem.deleteAsync(FileSystem.cacheDirectory, { idempotent: true });
      await FileSystem.makeDirectoryAsync(FileSystem.cacheDirectory, { intermediates: true });
    }

    return this.getUsage();
  }

  async deleteSelectedFiles(fileUris: string[]): Promise<StorageUsage> {
    await Promise.all(fileUris.map((uri) => FileSystem.deleteAsync(uri, { idempotent: true })));
    return this.getUsage();
  }

  async getAutoDownloadPreferences(): Promise<AutoDownloadPreferences> {
    return jsonStorage.getItem<AutoDownloadPreferences>(autoDownloadStorageKey, defaultAutoDownloadPreferences);
  }

  async setAutoDownloadPreferences(preferences: AutoDownloadPreferences): Promise<void> {
    await jsonStorage.setItem(autoDownloadStorageKey, preferences);
  }
}

export const storageManagementService = new StorageManagementService();
