import { mockAdapter } from '../api/mockAdapter';
import { mockSocketService } from '../sockets/mockSocketService';
import { ConnectionState, networkManager } from './network/networkManager';

export type DevNetworkMode = 'connected' | 'offline' | 'slow' | 'timeout' | 'api-error' | 'socket-drop';

export const networkService = {
  setMode(mode: DevNetworkMode): void {
    if (mode === 'offline') {
      networkManager.setOnline(false);
      return;
    }

    networkManager.setOnline(true);

    if (mode === 'slow') {
      mockAdapter.setMode('slow');
      return;
    }

    if (mode === 'timeout') {
      mockAdapter.setMode('timeout');
      return;
    }

    if (mode === 'api-error') {
      mockAdapter.setMode('error');
      return;
    }

    mockAdapter.setMode('success');

    if (mode === 'socket-drop') {
      mockSocketService.simulateSocketDrop();
    }
  },

  getState(): ConnectionState {
    return networkManager.getState();
  },
};
