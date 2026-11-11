// Tests (vitest + jsdom): the app started with its real config, fetch replaced by canned answers, mocks of any
// registered class, and screens rendered with @testing-library/react.
import { createElement, ReactElement } from 'react';
import { render, RenderResult } from '@testing-library/react';
import { vi } from 'vitest';
import { Dragonfly } from './app.js';
import { AppConfig } from './config.js';
import { inject, replace } from './inject.js';
import { Result } from './result.js';
import { buildRouter, RouterProvider, AnyRoute } from './router.js';

type Ctor<T> = abstract new (...args: never[]) => T;

export interface FakeRequest {
  method: string;
  url: string;
  path: string;
  body: unknown;
}

type Responder = (request: FakeRequest) => [number, unknown] | Promise<[number, unknown]>;

let responder: Responder = () => [404, { message: 'no response was prepared (DragonflyTest.respondWith)' }];
const requests: FakeRequest[] = [];

function fakeFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = String(input);
  const request: FakeRequest = {
    method: init?.method ?? 'GET',
    url,
    path: new URL(url).pathname,
    body: init?.body ? JSON.parse(String(init.body)) : null,
  };
  requests.push(request);
  return Promise.resolve(responder(request)).then(
    ([status, body]) =>
      new Response(body === null || body === undefined ? '' : JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json' },
      }),
  );
}

export const DragonflyTest = {
  /** The requests the app made since `start`. */
  requests,

  /** Starts the app as `startDragonfly` does, with every answer canned. */
  async start(config: AppConfig, register?: () => Promise<void> | void): Promise<void> {
    await Dragonfly.reset();
    requests.length = 0;
    responder = () => [404, { message: 'no response was prepared (DragonflyTest.respondWith)' }];
    vi.stubGlobal('fetch', fakeFetch);
    await Dragonfly.start(config);
    await register?.();
  },

  /** Every request answers `body` with `status`. */
  respondWith(body: unknown, status = 200): void {
    responder = () => [status, body];
  },

  /** Each request is answered by `fn`. */
  respond(fn: Responder): void {
    responder = fn;
  },

  /** Puts `instance` where the app would inject `cls`. */
  replace<T>(cls: Ctor<T>, instance: T): void {
    replace(cls, instance);
  },

  /** A mock of `cls`: every method is a vitest function; `when(mock.method).thenReturn(...)` prepares it. */
  mock<T extends object>(cls: Ctor<T>): T {
    const fns = new Map<string | symbol, ReturnType<typeof vi.fn>>();
    const mock = new Proxy({} as T, {
      get(_t, name) {
        if (name === 'then') return undefined;
        if (!fns.has(name)) fns.set(name, vi.fn());
        return fns.get(name);
      },
    });
    replace(cls, mock);
    return mock;
  },

  /** The provided instance of `cls` (`inject`). */
  of<T>(cls: Ctor<T>): T {
    return inject(cls);
  },
};

/** Prepares a mocked method: when(repo.getPage).thenReturn(Ok(page)) — async methods resolve with it. */
export function when<F extends (...args: never[]) => unknown>(method: F) {
  const fn = method as unknown as ReturnType<typeof vi.fn>;
  return {
    thenReturn(value: Awaited<ReturnType<F>>): void {
      fn.mockImplementation(() => Promise.resolve(value));
    },
    thenReturnSync(value: ReturnType<F>): void {
      fn.mockReturnValue(value);
    },
    thenAnswer(answer: (...args: Parameters<F>) => Awaited<ReturnType<F>>): void {
      fn.mockImplementation((...args: unknown[]) => Promise.resolve(answer(...(args as Parameters<F>))));
    },
    thenThrow(error: unknown): void {
      fn.mockImplementation(() => Promise.reject(error));
    },
  };
}

/** How many times a mocked method ran: verify(repo.getPage).called(1). */
export function verify<F extends (...args: never[]) => unknown>(method: F) {
  const fn = method as unknown as ReturnType<typeof vi.fn>;
  return {
    called(times?: number): void {
      if (times === undefined) {
        if (fn.mock.calls.length === 0) throw new Error('expected a call');
      } else if (fn.mock.calls.length !== times) {
        throw new Error(`expected ${times} call(s), got ${fn.mock.calls.length}`);
      }
    },
    never(): void {
      if (fn.mock.calls.length !== 0) throw new Error(`expected no call, got ${fn.mock.calls.length}`);
    },
  };
}

/** Renders a screen inside a memory router (its route and the others of `routes`). */
export function renderScreen(screen: ReactElement | null, routes: AnyRoute[] = []): RenderResult {
  const all: AnyRoute[] = routes.length ? routes : [{ path: '/', screen: () => screen }];
  const router = buildRouter(all, { memory: true, initial: '/' });
  return render(createElement(RouterProvider, { router }));
}

/** Every state a manager emits while `act` runs (the `@states` tests). */
export async function statesOf<S>(manager: { subscribe(l: () => void): () => void; state: S }, act: () => Promise<void> | void): Promise<S[]> {
  // what the manager's constructor started (a first load) settles first: only `act` is recorded
  await new Promise((r) => setTimeout(r, 0));
  const states: S[] = [];
  const stop = manager.subscribe(() => states.push(manager.state));
  try {
    await act();
    await new Promise((r) => setTimeout(r, 0));
  } finally {
    stop();
  }
  return states;
}

/** `expect(result).toEqual(isOkWith(x))` helpers: the value of an Ok, or the error of an Err. */
export function okOf<E, T>(result: Result<E, T>): T {
  if (!result.isOk) throw new Error(`expected Ok, got Err(${JSON.stringify(result.error)})`);
  return result.value;
}

export function errOf<E, T>(result: Result<E, T>): E {
  if (result.isOk) throw new Error(`expected Err, got Ok(${JSON.stringify(result.value)})`);
  return result.error;
}
