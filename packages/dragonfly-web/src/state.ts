// The state of a screen: a StateManager holds one state model and emits a new one; React reads it with
// useSyncExternalStore (react.ts). The same shape as the mobile platform's StateManager (a Cubit).
export abstract class StateManager<S> {
  private current: S;
  private readonly listeners = new Set<() => void>();

  constructor(initial: S) {
    this.current = initial;
  }

  get state(): S {
    return this.current;
  }

  /** Replaces the state and tells every subscriber (a screen re-renders). */
  emit(state: S): void {
    this.current = state;
    for (const l of this.listeners) l();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Called when the screen that provided the manager leaves. */
  async close(): Promise<void> {
    this.listeners.clear();
  }
}
