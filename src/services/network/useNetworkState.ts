import { useEffect, useState } from 'react';
import { ConnectionState, networkManager } from './networkManager';

export function useNetworkState() {
  const [state, setState] = useState(networkManager.getState());
  const [queueSize, setQueueSize] = useState(networkManager.getQueueSize());

  useEffect(() => {
    const cleanupState = networkManager.on('state', setState);
    const cleanupQueue = networkManager.on('queueSize', setQueueSize);

    return () => {
      cleanupState();
      cleanupQueue();
    };
  }, []);

  return {
    isOffline: state === ConnectionState.Offline,
    isRetrying: state === ConnectionState.Retrying,
    queueSize,
    state,
  };
}
