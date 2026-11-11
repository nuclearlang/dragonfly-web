// Global events (pub/sub): Events.publish(new ForceLogout({ reason })), Events.subscribe(ForceLogout, (e) => ...).
import { useEffect, useState } from 'react';

/** The base of the `event` kind: a name and a JSON form, so another window or worker can publish it. */
export abstract class AppEvent {
  abstract get eventName(): string;

  abstract toJson(): Record<string, unknown>;
}

type Listener<E> = (event: E) => void;
type EventCtor<E> = abstract new (...args: never[]) => E;

const listeners = new Map<EventCtor<unknown>, Set<Listener<never>>>();
const decoders = new Map<string, (json: Record<string, unknown>) => AppEvent>();

export const Events = {
  /** Calls every subscriber of the event's class. */
  publish<E extends AppEvent>(event: E): void {
    for (const [cls, set] of listeners) {
      if (event instanceof cls) {
        for (const l of set) (l as Listener<E>)(event);
      }
    }
  },

  /** `listener` runs with every event of class `cls`; the returned function unsubscribes. */
  subscribe<E extends AppEvent>(cls: EventCtor<E>, listener: Listener<E>): () => void {
    const set = listeners.get(cls) ?? new Set();
    listeners.set(cls, set);
    set.add(listener);
    return () => {
      set.delete(listener);
    };
  },

  /** How an event published as JSON (another engine) reads back its class; registerModels calls it. */
  decoder(name: string, fromJson: (json: Record<string, unknown>) => AppEvent): void {
    decoders.set(name, fromJson);
  },

  /** Publishes the JSON of an event: `{ event: 'ForceLogout', data: {...} }`. */
  publishJson(message: { event: string; data: Record<string, unknown> }): void {
    const decode = decoders.get(message.event);
    if (decode) Events.publish(decode(message.data));
  },

  reset(): void {
    listeners.clear();
  },
};

/** The last event of class `cls` the component saw (`null` before the first): re-renders on every event. */
export function useEvent<E extends AppEvent>(cls: EventCtor<E>): E | null {
  const [last, setLast] = useState<E | null>(null);
  useEffect(() => Events.subscribe(cls, setLast), [cls]);
  return last;
}
