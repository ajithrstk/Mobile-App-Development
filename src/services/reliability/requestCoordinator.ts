type InFlightRequest<T> = {
  promise: Promise<T>;
  startedAt: number;
};

class RequestCoordinator {
  private requests = new Map<string, InFlightRequest<unknown>>();

  run<T>(key: string, run: () => Promise<T>): Promise<T> {
    const existing = this.requests.get(key) as InFlightRequest<T> | undefined;

    if (existing && Date.now() - existing.startedAt < 15000) {
      return existing.promise;
    }

    const promise = run().finally(() => {
      this.requests.delete(key);
    });

    this.requests.set(key, {
      promise,
      startedAt: Date.now(),
    });
    return promise;
  }

  clear(): void {
    this.requests.clear();
  }
}

export const requestCoordinator = new RequestCoordinator();
