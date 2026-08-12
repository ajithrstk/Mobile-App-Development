import type { StatusFeed, StatusThread, StatusUpdate } from '../types/status.types';

export const STATUS_EXPIRY_MS = 1000 * 60 * 60 * 24;

export function isStatusExpired(status: StatusUpdate, now = Date.now()): boolean {
  return Date.parse(status.expiresAt) <= now;
}

export function formatStatusTime(timestamp: string): string {
  const diffMs = Math.max(0, Date.now() - Date.parse(timestamp));
  const minutes = Math.floor(diffMs / (1000 * 60));

  if (minutes < 1) {
    return 'Just now';
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export function groupStatusFeed(statuses: StatusUpdate[], myUserId: string): StatusFeed {
  const activeStatuses = statuses.filter((status) => !isStatusExpired(status));
  const myStatuses = activeStatuses
    .filter((status) => status.owner.id === myUserId || status.owner.isMe)
    .sort(sortByCreatedDesc);
  const threadsByOwner = new Map<string, StatusThread>();

  activeStatuses
    .filter((status) => status.owner.id !== myUserId && !status.owner.isMe)
    .forEach((status) => {
      const current = threadsByOwner.get(status.owner.id);
      const statusesForOwner = [...(current?.statuses ?? []), status].sort(sortByCreatedAsc);
      const unseenCount = statusesForOwner.filter((item) => !item.viewedByMe).length;

      threadsByOwner.set(status.owner.id, {
        latestAt: statusesForOwner[statusesForOwner.length - 1]?.createdAt ?? status.createdAt,
        muted: statusesForOwner.some((item) => item.muted),
        owner: status.owner,
        statuses: statusesForOwner,
        unseenCount,
      });
    });

  const threads = Array.from(threadsByOwner.values()).sort((first, second) => Date.parse(second.latestAt) - Date.parse(first.latestAt));
  const muted = threads.filter((thread) => thread.muted);
  const unmuted = threads.filter((thread) => !thread.muted);

  return {
    muted,
    myStatuses,
    recent: unmuted.filter((thread) => thread.unseenCount > 0),
    viewed: unmuted.filter((thread) => thread.unseenCount === 0),
  };
}

function sortByCreatedAsc(first: StatusUpdate, second: StatusUpdate): number {
  return Date.parse(first.createdAt) - Date.parse(second.createdAt);
}

function sortByCreatedDesc(first: StatusUpdate, second: StatusUpdate): number {
  return Date.parse(second.createdAt) - Date.parse(first.createdAt);
}
