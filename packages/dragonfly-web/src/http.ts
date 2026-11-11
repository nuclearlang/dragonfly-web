// Repository: each method of the `repository` kind is an http call through `send` (fetch), with the same rules as
// the mobile platform: the path is appended to the connection's baseUrl, `:name` takes a parameter, the other
// parameters go to the query (GET, DELETE) or the JSON body; cache by key with a ttl; retries on transient failures.
import { Dragonfly } from './app.js';
import { Http, HttpRequest, HttpResponse } from './config.js';
import { AppError, HttpError } from './errors.js';
import { Err, Ok, Result } from './result.js';

export enum HttpMethod {
  get = 'GET',
  post = 'POST',
  put = 'PUT',
  patch = 'PATCH',
  delete = 'DELETE',
}

export type Json = Record<string, unknown>;

/** How a response body becomes the value a method returns. */
export const Decode = {
  one:
    <T>(fromJson: (json: Json) => T) =>
    (body: unknown): T =>
      fromJson(body as Json),
  list:
    <T>(fromJson: (json: Json) => T) =>
    (body: unknown): T[] =>
      (body as Json[]).map(fromJson),
  value:
    <T>() =>
    (body: unknown): T =>
      body as T,
  values:
    <T>() =>
    (body: unknown): T[] =>
      body as T[],
  none: (_body: unknown): void => undefined,
};

/** `@get(cache = true, ttl = Duration(minutes = 10))`: a response kept `ttl` milliseconds under `key`. */
export class Cache {
  constructor(readonly options: { key?: string; ttl?: number } = {}) {}
}

export class MemoryCache {
  private readonly entries = new Map<string, { until: number; value: unknown }>();

  get(key: string): unknown {
    const e = this.entries.get(key);
    if (!e) return undefined;
    if (e.until < Date.now()) {
      this.entries.delete(key);
      return undefined;
    }
    return e.value;
  }

  set(key: string, value: unknown, ttl: number): void {
    this.entries.set(key, { until: Date.now() + ttl, value });
  }

  /** Forgets `key` and every key that starts with `key|` (the key plus its arguments). */
  purge(key: string): void {
    for (const k of [...this.entries.keys()]) {
      if (k === key || k.startsWith(`${key}|`)) this.entries.delete(k);
    }
  }

  clear(): void {
    this.entries.clear();
  }
}

export interface SendOptions<T> {
  params?: Record<string, unknown>;
  pathParams?: Record<string, unknown>;
  query?: Record<string, unknown>;
  body?: unknown;
  headers?: Record<string, string>;
  cache?: Cache;
  cacheName?: string;
  /** Extra attempts after a transient failure (GET, PUT and DELETE retry twice by themselves). */
  retry?: number;
  decode: (body: unknown) => T;
}

const transient = (e: unknown): boolean => !(e instanceof HttpError) || e.statusCode === 0 || e.statusCode >= 500;

/** The base of the `repository` kind. */
export class Repository {
  readonly path: string;
  readonly connection: string;

  constructor(options: { path?: string; connection?: string } = {}) {
    this.path = options.path ?? '';
    this.connection = options.connection ?? '';
  }

  /** The url of `path` under the repository's and the connection's, with `:name` replaced, and the query. */
  target(
    path: string,
    options: { params?: Record<string, unknown>; pathParams?: Record<string, unknown>; query?: Record<string, unknown> },
    read: boolean,
  ): { url: string; query: Record<string, unknown>; rest: Record<string, unknown> } {
    const http = Dragonfly.connection(Http, this.connection);
    const rest = { ...options.params };
    let full = [this.path, path].filter((p) => p !== '').join('/');
    const inPath = { ...options.pathParams };
    full = full.replace(/:([A-Za-z_][A-Za-z0-9_]*)/g, (_m, name: string) => {
      if (name in inPath) return encodeURIComponent(String(inPath[name]));
      if (name in rest) {
        const v = rest[name];
        delete rest[name];
        return encodeURIComponent(String(v));
      }
      throw new AppError(`the path '${full}' needs a parameter named '${name}'`);
    });
    const query: Record<string, unknown> = { ...options.query, ...(read ? rest : {}) };
    return { url: http.baseUrl + full.replace(/^\//, ''), query, rest };
  }

  /** One request: the cache first (when asked), then fetch with retries; throws HttpError. */
  async send<T>(method: HttpMethod, path: string, options: SendOptions<T>): Promise<T> {
    const read = method === HttpMethod.get || method === HttpMethod.delete;
    const { url, query, rest } = this.target(path, options, read);
    // the parameters the path did not take: the body of a write (a read sent them as the query)
    const body = options.body !== undefined ? options.body : read || Object.keys(rest).length === 0 ? undefined : rest;
    const key = options.cache ? cacheKey(options.cache.options.key ?? options.cacheName ?? url, url, query) : null;
    if (key !== null) {
      const hit = Dragonfly.cache.get(key);
      if (hit !== undefined) return hit as T;
    }
    const attempts = 1 + (options.retry ?? (method === HttpMethod.post || method === HttpMethod.patch ? 0 : 2));
    let last: unknown;
    for (let i = 0; i < attempts; i++) {
      try {
        const value = await this.request(method, url, query, body, options.headers ?? {}, options.decode);
        if (key !== null) Dragonfly.cache.set(key, value, options.cache?.options.ttl ?? 5 * 60_000);
        return value;
      } catch (e) {
        last = e;
        if (!transient(e) || i === attempts - 1) throw e;
        await new Promise((r) => setTimeout(r, 300 * (i + 1)));
      }
    }
    throw last;
  }

  private async request<T>(
    method: HttpMethod,
    url: string,
    query: Record<string, unknown>,
    body: unknown,
    headers: Record<string, string>,
    decode: (body: unknown) => T,
  ): Promise<T> {
    const http = Dragonfly.connection(Http, this.connection);
    const qs = Object.entries(query)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&');
    let request: HttpRequest = {
      method,
      url: qs ? `${url}?${qs}` : url,
      headers: { ...http.headers, ...headers, ...(body !== undefined ? { 'content-type': 'application/json' } : {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    };
    for (const i of http.interceptors) request = await i.onRequest(request);
    let fetched: globalThis.Response;
    try {
      fetched = await fetch(request.url, {
        method: request.method,
        headers: request.headers,
        body: request.body,
        signal: AbortSignal.timeout(http.timeout),
      });
    } catch (e) {
      throw new HttpError(`${method} ${request.url}: ${(e as Error).message}`, 0);
    }
    const text = await fetched.text();
    let parsed: unknown = null;
    if (text !== '') {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = text;
      }
    }
    let response: HttpResponse = { status: fetched.status, headers: fetched.headers, body: parsed };
    for (const i of http.interceptors) response = await i.onResponse(response);
    if (response.status < 200 || response.status >= 300) {
      throw new HttpError(messageOf(response.body) ?? `${method} ${url} answered ${response.status}`, response.status, response.body);
    }
    return decode(response.body);
  }

  /** Turns a thrown AppError into a value: `attempt(() => send(...), Ok, (e) => Err(new X({ message: e.message })))`. */
  async attempt<T, R>(call: () => Promise<T>, ok: (value: T) => R, err: (error: AppError) => R): Promise<R> {
    try {
      return ok(await call());
    } catch (e) {
      if (e instanceof AppError) return err(e);
      throw e;
    }
  }

  /** A `Result` method: `Ok` of what `call` answers, or `Err(err(error))` when it throws an AppError. */
  async result<T, E>(call: () => Promise<T>, err: (error: AppError) => E): Promise<Result<E, T>> {
    try {
      return Ok(await call());
    } catch (e) {
      if (e instanceof AppError) return Err(err(e));
      throw e;
    }
  }

  /** Forgets the cached responses of `key` (`purge<Method>()` calls it). */
  purgeCache(key: string): void {
    Dragonfly.cache.purge(key);
  }
}

function cacheKey(name: string, url: string, query: Record<string, unknown>): string {
  const q = Object.entries(query)
    .sort()
    .map(([k, v]) => `${k}=${String(v)}`)
    .join('&');
  return `${name}|${url}${q ? `?${q}` : ''}`;
}

function messageOf(body: unknown): string | undefined {
  if (body && typeof body === 'object' && 'message' in body && typeof (body as Json).message === 'string') {
    return (body as Json).message as string;
  }
  if (body && typeof body === 'object' && 'error' in body && typeof (body as Json).error === 'string') {
    return (body as Json).error as string;
  }
  return undefined;
}
