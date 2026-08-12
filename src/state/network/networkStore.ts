import { ConnectionState, networkManager } from '../../services/network/networkManager';
import { createStore, useStore } from '../createStore';

type NetworkState = {
  state: ConnectionState;
  queueSize: number;
};

export const networkStore = createStore<NetworkState>({
  queueSize: networkManager.getQueueSize(),
  state: networkManager.getState(),
});

export function bindNetworkStore(): () => void {
  const cleanupState = networkManager.on('state', (state) => networkStore.setState({ state }));
  const cleanupQueue = networkManager.on('queueSize', (queueSize) => networkStore.setState({ queueSize }));

  return () => {
    cleanupState();
    cleanupQueue();
  };
}

export function useNetworkStore<Selected>(selector: (state: NetworkState) => Selected): Selected {
  return useStore(networkStore, selector);
}
