import { useEffect } from 'react';
import { updatesActions, useUpdates } from '../state/updatesSlice';

export function useBroadcasts() {
  const broadcasts = useUpdates((state) => state.broadcasts);

  useEffect(() => {
    void updatesActions.loadBroadcasts();
  }, []);

  return {
    broadcasts,
    createBroadcast: updatesActions.createBroadcast.bind(updatesActions),
    deleteBroadcast: updatesActions.deleteBroadcast.bind(updatesActions),
    refresh: updatesActions.loadBroadcasts.bind(updatesActions),
    sendBroadcastMessage: updatesActions.sendBroadcastMessage.bind(updatesActions),
    updateBroadcast: updatesActions.updateBroadcast.bind(updatesActions),
  };
}
