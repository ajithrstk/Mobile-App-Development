export type Unsubscribe = () => void;

export class SimpleEventEmitter<EventMap extends Record<string, unknown>> {
  private listeners = new Map<keyof EventMap, Set<(payload: EventMap[keyof EventMap]) => void>>();

  on<Key extends keyof EventMap>(eventName: Key, listener: (payload: EventMap[Key]) => void): Unsubscribe {
    const listeners = this.listeners.get(eventName) ?? new Set();

    listeners.add(listener as (payload: EventMap[keyof EventMap]) => void);
    this.listeners.set(eventName, listeners);

    return () => {
      const activeListeners = this.listeners.get(eventName);
      activeListeners?.delete(listener as (payload: EventMap[keyof EventMap]) => void);

      if (activeListeners?.size === 0) {
        this.listeners.delete(eventName);
      }
    };
  }

  emit<Key extends keyof EventMap>(eventName: Key, payload: EventMap[Key]): void {
    this.listeners.get(eventName)?.forEach((listener) => listener(payload));
  }

  removeAllListeners(): void {
    this.listeners.clear();
  }
}
