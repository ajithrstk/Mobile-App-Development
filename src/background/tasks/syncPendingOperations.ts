import { networkManager } from '../../services/network/networkManager';
import { syncService } from '../../services/syncService';
import { downloadManager } from '../../services/media/downloadManager';
import { uploadManager } from '../../services/upload/uploadManager';

export async function syncPendingOperations(): Promise<void> {
  networkManager.setOnline(true);
  await Promise.all([
    uploadManager.resumePendingUploads(),
    syncService.syncAll('background-task'),
    downloadManager.cleanupExpiredMedia(),
  ]);
}
