import { Acl, AppConfig, Connection, Global, Http, SessionManager } from 'dragonfly-web';

/** Global configuration: connections and services of the whole app. */
export class ProjectConfig extends AppConfig {
  override readonly connections: Connection[] = [new Http({ baseUrl: 'https://rickandmortyapi.com/api/', timeout: 5000 })];
  override readonly globals: Global[] = [
    new SessionManager({ timeout: 1800000 }),
    new Acl({ inherits: { 'admin': ['fan'] } }),
  ];
}
