// Entry point of the runtime: the connections, the global services and the injector.
import { AppConfig, ComponentConfig, Connection, Global } from './config.js';
import { Events } from './events.js';
import { MemoryCache } from './http.js';
import { resetInjector, register } from './inject.js';

const connections = new Map<string, Connection>();
const globals: Global[] = [];

export const Dragonfly = {
  /** [start] ran. */
  started: false,

  /** The response cache of every repository. */
  cache: new MemoryCache(),

  /** Registers the project config, its connections and its global services, and starts them. */
  async start(config: AppConfig): Promise<void> {
    this.started = true;
    register(AppConfig, () => config);
    await add(config);
  },

  /** Adds the connections and services of a component's config. */
  async addConfig(config: ComponentConfig, _component?: string): Promise<void> {
    await add(config);
  },

  /** The connection named `name` of that class (`''` = the connection without `connectionName`). */
  connection<C extends Connection>(kind: abstract new (...args: never[]) => C, name = ''): C {
    const c = connections.get(name);
    if (c instanceof kind) return c;
    const known = [...connections.keys()].map((k) => k || '(default)').join(', ');
    throw new Error(`no ${kind.name} connection named "${name}" in the project config (known: ${known})`);
  },

  get connections(): Connection[] {
    return [...connections.values()];
  },

  /** Stops the global services and empties the injector, the connections and the cache (tests). */
  async reset(): Promise<void> {
    for (const g of [...globals].reverse()) await g.dispose();
    globals.length = 0;
    for (const c of connections.values()) await c.close();
    connections.clear();
    Events.reset();
    this.cache.clear();
    this.started = false;
    resetInjector();
  },
};

async function add(config: AppConfig): Promise<void> {
  for (const c of config.connections) {
    if (connections.has(c.name)) {
      throw new Error(`two connections are named "${c.name}"; each connectionName is used once`);
    }
    await c.open();
    connections.set(c.name, c);
  }
  for (const g of config.globals) {
    g.register();
    globals.push(g);
    await g.init();
  }
}
