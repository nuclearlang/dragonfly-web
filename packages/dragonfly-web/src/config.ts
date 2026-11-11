// Configuration: the project config (`appConfig`) and a component's (`config`): connections and global services.
import { register } from './inject.js';

/** Something the app opens at start; `connectionName` tells two of a kind apart (`''` is the default one). */
export abstract class Connection {
  readonly name: string;

  constructor(options: { connectionName?: string } = {}) {
    this.name = options.connectionName ?? '';
  }

  async open(): Promise<void> {}

  async close(): Promise<void> {}
}

export interface HttpOptions {
  connectionName?: string;
  /** Every path of a repository is appended to it (`https://api.example.com/`). */
  baseUrl: string;
  headers?: Record<string, string>;
  /** Milliseconds a request may take (default 10 000). */
  timeout?: number;
  interceptors?: HttpInterceptor[];
}

export interface HttpRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
}

export interface HttpResponse {
  status: number;
  headers: Headers;
  body: unknown;
}

/** Reads or changes every request and response of a connection (the session token, logs, events). */
export abstract class HttpInterceptor {
  async onRequest(request: HttpRequest): Promise<HttpRequest> {
    return request;
  }

  async onResponse(response: HttpResponse): Promise<HttpResponse> {
    return response;
  }
}

/** An http API (fetch): `Http(baseUrl = "https://api.example.com/")`. */
export class Http extends Connection {
  readonly baseUrl: string;
  readonly headers: Record<string, string>;
  readonly timeout: number;
  readonly interceptors: HttpInterceptor[];

  constructor(options: HttpOptions) {
    super(options);
    this.baseUrl = options.baseUrl.endsWith('/') ? options.baseUrl : `${options.baseUrl}/`;
    this.headers = options.headers ?? {};
    this.timeout = options.timeout ?? 10_000;
    this.interceptors = options.interceptors ?? [];
  }
}

/** A service that lives for the whole app (SessionManager, Events...): listed in `globals`, started by Dragonfly. */
export abstract class Global {
  /** Registers this object in the injector under its own class (`register(Self, () => this)`). */
  register(): void {
    register(this.constructor as new () => this, () => this);
  }

  async init(): Promise<void> {}

  async dispose(): Promise<void> {}
}

/** The project configuration (`appConfig` kind): connections and global services. */
export abstract class AppConfig {
  readonly connections: Connection[] = [];
  readonly globals: Global[] = [];
}

/** The configuration of one component (`config` kind): its own connections and services. */
export abstract class ComponentConfig extends AppConfig {}
