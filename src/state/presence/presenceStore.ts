import { createStore, useStore } from '../createStore';

type PresenceState = {
  onlineUserIds: Record<string, boolean>;
  typingByChatId: Record<string, string | undefined>;
  socketConnected: boolean;
  reconnectAttempts: number;
};

export const presenceStore = createStore<PresenceState>({
  onlineUserIds: {},
  reconnectAttempts: 0,
  socketConnected: false,
  typingByChatId: {},
});

export const presenceActions = {
  setSocketConnected(socketConnected: boolean): void {
    presenceStore.setState({ socketConnected });
  },

  setReconnectAttempts(reconnectAttempts: number): void {
    presenceStore.setState({ reconnectAttempts });
  },

  setUserOnline(userId: string, online: boolean): void {
    presenceStore.setState((state) => ({
      ...state,
      onlineUserIds: { ...state.onlineUserIds, [userId]: online },
    }));
  },

  setTyping(chatId: string, userName?: string): void {
    presenceStore.setState((state) => ({
      ...state,
      typingByChatId: { ...state.typingByChatId, [chatId]: userName },
    }));
  },
};

export function usePresence<Selected>(selector: (state: PresenceState) => Selected): Selected {
  return useStore(presenceStore, selector);
}
