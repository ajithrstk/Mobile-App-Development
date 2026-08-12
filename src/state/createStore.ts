import { useSyncExternalStore } from 'react';

type Listener = () => void;

export type Store<State> = {
  getState: () => State;
  setState: (updater: Partial<State> | ((state: State) => State)) => void;
  subscribe: (listener: Listener) => () => void;
};

export function createStore<State>(initialState: State): Store<State> {
  let state = initialState;
  const listeners = new Set<Listener>();

  return {
    getState: () => state,
    setState: (updater) => {
      state = typeof updater === 'function' ? updater(state) : { ...state, ...updater };
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export function useStore<State, Selected>(store: Store<State>, selector: (state: State) => Selected): Selected {
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.getState()),
    () => selector(store.getState()),
  );
}
