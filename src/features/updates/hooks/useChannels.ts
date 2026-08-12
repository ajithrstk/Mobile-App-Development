import { useEffect } from 'react';
import { updatesActions, useUpdates } from '../state/updatesSlice';

export function useChannels() {
  const channels = useUpdates((state) => state.channels);
  const error = useUpdates((state) => state.error);
  const hasMore = useUpdates((state) => state.hasMoreChannels);
  const status = useUpdates((state) => state.status);

  useEffect(() => {
    void updatesActions.initialize();
    const cleanup = updatesActions.bindSocketEvents();

    return cleanup;
  }, []);

  return {
    channels,
    error,
    followChannel: updatesActions.followChannel.bind(updatesActions),
    hasMore,
    loadMore: updatesActions.loadMoreChannels.bind(updatesActions),
    muteChannel: updatesActions.muteChannel.bind(updatesActions),
    refresh: updatesActions.refresh.bind(updatesActions),
    status,
  };
}
