// The session (who is signed in), the ACL (roles, permissions, guards) and the checks a use case asks for
// (`@requires(session = true)`, `@acl(roles = [...])`).
import { AppEvent, Events } from './events.js';
import { Global } from './config.js';
import { inject } from './inject.js';

export interface SessionData {
  token: string;
  userId?: string;
  roles?: string[];
  permissions?: string[];
  values?: Record<string, unknown>;
}

export class SessionStarted extends AppEvent {
  constructor(readonly session: SessionData) {
    super();
  }

  get eventName(): string {
    return 'SessionStarted';
  }

  toJson(): Record<string, unknown> {
    return { session: this.session };
  }
}

export class SessionEnded extends AppEvent {
  get eventName(): string {
    return 'SessionEnded';
  }

  toJson(): Record<string, unknown> {
    return {};
  }
}

/** Keeps the session in localStorage; ends it after `timeout` milliseconds without activity. */
export class SessionManager extends Global {
  private current: SessionData | null = null;
  private lastActivity = Date.now();
  readonly timeout: number;
  readonly key: string;

  constructor(options: { timeout?: number; key?: string } = {}) {
    super();
    this.timeout = options.timeout ?? 30 * 60_000;
    this.key = options.key ?? 'dragonfly.session';
  }

  override async init(): Promise<void> {
    const saved = storage()?.getItem(this.key);
    if (saved) this.current = JSON.parse(saved) as SessionData;
  }

  get active(): boolean {
    if (this.current && Date.now() - this.lastActivity > this.timeout) this.current = null;
    return this.current !== null;
  }

  get session(): SessionData | null {
    return this.active ? this.current : null;
  }

  get token(): string | null {
    return this.session?.token ?? null;
  }

  /** A value saved with the session (`session.value('premium')`). */
  value<T>(name: string): T | null {
    return (this.session?.values?.[name] as T | undefined) ?? null;
  }

  async start(session: SessionData): Promise<void> {
    this.current = session;
    this.lastActivity = Date.now();
    storage()?.setItem(this.key, JSON.stringify(session));
    Events.publish(new SessionStarted(session));
  }

  touch(): void {
    this.lastActivity = Date.now();
  }

  async destroy(): Promise<void> {
    this.current = null;
    storage()?.removeItem(this.key);
    Events.publish(new SessionEnded());
  }
}

function storage(): Storage | null {
  return typeof localStorage === 'undefined' ? null : localStorage;
}

/** A custom access check (`guard` kind): `canActivate()` says whether the caller may go on. */
export abstract class Guard {
  abstract canActivate(): boolean | Promise<boolean>;
}

export interface AclRule {
  roles?: string[];
  permissions?: string[];
  guards?: (abstract new (...args: never[]) => Guard)[];
}

/** Role inheritance: `Acl(inherits = { admin: ['fan'] })`. */
export class Acl extends Global {
  constructor(readonly options: { inherits?: Record<string, string[]> } = {}) {
    super();
  }

  rolesOf(roles: string[]): Set<string> {
    const all = new Set(roles);
    const pending = [...roles];
    while (pending.length) {
      for (const r of this.options.inherits?.[pending.pop() as string] ?? []) {
        if (!all.has(r)) {
          all.add(r);
          pending.push(r);
        }
      }
    }
    return all;
  }
}

/** `NetworkManager()` in globals: whether the browser is online. */
export class NetworkManager extends Global {
  get online(): boolean {
    return typeof navigator === 'undefined' ? true : navigator.onLine;
  }
}

export const Guards = {
  /** `@requires(internet = true, session = true)`: the reason it is denied, or null. */
  check(options: { internet?: boolean; session?: boolean }): string | null {
    if (options.internet && typeof navigator !== 'undefined' && !navigator.onLine) return 'no internet connection';
    if (options.session) {
      const s = sessionManager();
      if (!s || !s.active) return 'no active session';
    }
    return null;
  },

  /** `@acl(roles, permissions, guards)`: the reason it is forbidden, or null. */
  async verify(rule: AclRule): Promise<string | null> {
    const reason = Guards.verifySync(rule);
    if (reason !== null) return reason;
    for (const g of rule.guards ?? []) {
      if (!(await inject(g).canActivate())) return `${g.name} denied it`;
    }
    return null;
  },

  /** Roles and permissions only (a use case without `~` cannot wait for a guard). */
  verifySync(rule: AclRule): string | null {
    const s = sessionManager()?.session;
    if (rule.roles?.length) {
      const have = acl()?.rolesOf(s?.roles ?? []) ?? new Set(s?.roles ?? []);
      if (!rule.roles.some((r) => have.has(r))) return `needs one of the roles: ${rule.roles.join(', ')}`;
    }
    if (rule.permissions?.length) {
      const have = new Set(s?.permissions ?? []);
      if (!rule.permissions.every((p) => have.has(p))) return `needs the permissions: ${rule.permissions.join(', ')}`;
    }
    return null;
  },
};

function sessionManager(): SessionManager | null {
  try {
    return inject(SessionManager);
  } catch {
    return null;
  }
}

function acl(): Acl | null {
  try {
    return inject(Acl);
  } catch {
    return null;
  }
}
