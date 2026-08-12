import { chatsById } from '../../data/chats';
import { jsonStorage } from '../../services/storage/jsonStorage';
import { CallDirection, CallMode, CallState, type CallLog } from '../types/call';

const storageKey = 'chatterly.call.history';

const seedLogs: CallLog[] = [
  {
    id: 'seed-call-1',
    contactId: '1',
    direction: CallDirection.Outgoing,
    durationSeconds: 312,
    endedAt: new Date(Date.now() - 1000 * 60 * 34).toISOString(),
    mode: CallMode.Video,
    startedAt: new Date(Date.now() - 1000 * 60 * 39).toISOString(),
    state: CallState.Ended,
  },
  {
    id: 'seed-call-2',
    contactId: '18',
    direction: CallDirection.Incoming,
    durationSeconds: 0,
    endedAt: new Date(Date.now() - 1000 * 60 * 140).toISOString(),
    mode: CallMode.Voice,
    startedAt: new Date(Date.now() - 1000 * 60 * 140).toISOString(),
    state: CallState.Missed,
  },
  {
    id: 'seed-call-3',
    contactId: '6',
    direction: CallDirection.Incoming,
    durationSeconds: 83,
    endedAt: new Date(Date.now() - 1000 * 60 * 60 * 25).toISOString(),
    mode: CallMode.Voice,
    startedAt: new Date(Date.now() - 1000 * 60 * 60 * 25 - 83000).toISOString(),
    state: CallState.Ended,
  },
];

class CallHistoryService {
  async list(): Promise<CallLog[]> {
    const logs = await jsonStorage.getItem<CallLog[]>(storageKey, seedLogs);
    return logs.filter((log) => Boolean(chatsById[log.contactId]));
  }

  async add(log: CallLog): Promise<void> {
    const logs = await this.list();
    await jsonStorage.setItem(storageKey, [log, ...logs.filter((item) => item.id !== log.id)].slice(0, 200));
  }

  async remove(logId: string): Promise<void> {
    const logs = await this.list();
    await jsonStorage.setItem(storageKey, logs.filter((log) => log.id !== logId));
  }

  async clear(): Promise<void> {
    await jsonStorage.setItem(storageKey, []);
  }
}

export const callHistoryService = new CallHistoryService();
