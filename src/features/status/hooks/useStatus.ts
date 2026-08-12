import { useEffect } from 'react';
import { mockSocketService } from '../../../sockets/mockSocketService';
import { statusActions, useStatus } from '../state/statusSlice';

export function useStatusFeed() {
  const feed = useStatus((state) => state.feed);
  const status = useStatus((state) => state.status);
  const error = useStatus((state) => state.error);
  const privacy = useStatus((state) => state.privacy);

  useEffect(() => {
    void statusActions.initialize();

    const cleanups = [
      mockSocketService.on('status:created', ({ status: nextStatus }) => statusActions.applyCreated(nextStatus)),
      mockSocketService.on('status:viewed', ({ statusId, viewer }) => statusActions.applyViewed(statusId, viewer)),
      mockSocketService.on('status:deleted', ({ statusId }) => statusActions.applyDeleted(statusId)),
      mockSocketService.on('status:expired', ({ statusId }) => statusActions.applyExpired(statusId)),
      mockSocketService.on('status:reaction', ({ reaction, statusId }) => statusActions.applyReaction(statusId, reaction)),
      mockSocketService.on('status:reply', ({ reply, statusId }) => statusActions.applyReply(statusId, reply)),
    ];
    const expiryInterval = setInterval(() => {
      void statusActions.refresh();
    }, 1000 * 60);

    return () => {
      clearInterval(expiryInterval);
      cleanups.forEach((cleanup) => cleanup());
    };
  }, []);

  return {
    error,
    feed,
    privacy,
    refresh: statusActions.refresh.bind(statusActions),
    status,
    updatePrivacy: statusActions.updatePrivacy.bind(statusActions),
  };
}
