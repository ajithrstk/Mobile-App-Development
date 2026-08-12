import type { CurrentUser } from '../../api/types';
import { createStore, useStore } from '../createStore';

type UserState = {
  currentUser: CurrentUser | null;
};

export const userStore = createStore<UserState>({ currentUser: null });

export const userActions = {
  setCurrentUser(currentUser: CurrentUser | null): void {
    userStore.setState({ currentUser });
  },
};

export function useUser<Selected>(selector: (state: UserState) => Selected): Selected {
  return useStore(userStore, selector);
}
