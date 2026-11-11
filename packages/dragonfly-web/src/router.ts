// The router: one route per `@screen(route = "/path/:id")`, built by the transpiler in dragonfly.g.ts, and
// navigation by screen (`goTo(CharacterDetailScreen, { id })`) from anywhere in a view.
import { createElement, ReactElement } from 'react';
import { createBrowserRouter, createMemoryRouter, RouteObject, RouterProvider, useLocation, useNavigate, useParams } from 'react-router';
import { inject } from './inject.js';
import { Guard, Guards, SessionManager } from './session.js';

type Screen<P> = (props: P) => ReactElement | null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyRoute = AppRoute<any>;

export interface AppRoute<P> {
  path: string;
  screen: Screen<P>;
  /** Builds the screen's props from the url parameters (`state.arg('id')`). */
  build?: (args: Record<string, string | undefined>) => P;
  /** The screen asks for a session; without it, go to `loggedIn`. */
  loggedIn?: string;
  /** The screen asks for roles, permissions or guards; without them, go to `denied`. */
  acl?: { roles?: string[]; permissions?: string[]; guards?: (abstract new (...args: never[]) => Guard)[] };
  denied?: string;
  notFound?: boolean;
}

const paths = new Map<Screen<any>, string>(); // eslint-disable-line @typescript-eslint/no-explicit-any
let navigateTo: ((to: string | number) => void) | null = null;

/** A router with every screen of the app; `initial` is the first path (tests: a memory router). */
export function buildRouter(routes: AnyRoute[], options: { initial?: string; memory?: boolean } = {}) {
  paths.clear();
  const objects: RouteObject[] = routes.map((r) => {
    paths.set(r.screen, r.path);
    return { path: r.notFound ? '*' : r.path, element: createElement(RouteElement, { route: r }) };
  });
  return options.memory
    ? createMemoryRouter(objects, { initialEntries: [options.initial ?? '/'] })
    : createBrowserRouter(objects);
}

function RouteElement(props: { route: AnyRoute }): ReactElement | null {
  const params = useParams();
  const navigate = useNavigate();
  // every address is a new instance of its screen (its state and its providers' managers), as a page pushed on a
  // phone: going from /docs/a to /docs/b never shows a's state in b
  const location = useLocation();
  const key = location.pathname + location.search;
  navigateTo = (to) => (typeof to === 'number' ? navigate(to) : navigate(to));
  const r = props.route;
  if (r.loggedIn !== undefined && Guards.check({ session: true }) !== null) {
    return createElement(Redirect, { to: r.loggedIn });
  }
  const screenProps = r.build ? r.build(params) : {};
  if (r.acl) {
    return createElement(AclGate, { key, rule: r.acl, denied: r.denied ?? '/', screen: r.screen, props: screenProps });
  }
  return createElement(r.screen, { ...screenProps, key });
}

function Redirect(props: { to: string }): null {
  const navigate = useNavigate();
  queueMicrotask(() => navigate(props.to, { replace: true }));
  return null;
}

function AclGate(props: { rule: NonNullable<AnyRoute['acl']>; denied: string; screen: Screen<any>; props: any }) { // eslint-disable-line @typescript-eslint/no-explicit-any
  const navigate = useNavigate();
  const reason = syncVerify(props.rule);
  if (reason !== null) {
    queueMicrotask(() => navigate(props.denied, { replace: true }));
    return null;
  }
  return createElement(props.screen, props.props);
}

// roles and permissions are checked at once; guards (may be async) are the use case's job (`@acl` of exec)
function syncVerify(rule: NonNullable<AnyRoute['acl']>): string | null {
  let session: SessionManager | null = null;
  try {
    session = inject(SessionManager);
  } catch {
    session = null;
  }
  const s = session?.session;
  if (rule.roles?.length && !rule.roles.some((r) => (s?.roles ?? []).includes(r))) return 'role';
  if (rule.permissions?.length && !rule.permissions.every((p) => (s?.permissions ?? []).includes(p))) return 'permission';
  return null;
}

/** The path of a screen with its parameters: pathTo(CharacterDetailScreen, { id: 3 }) → '/characters/3'. */
export function pathTo<P>(screen: Screen<P>, params: Partial<Record<keyof P & string, unknown>> = {}): string {
  const path = paths.get(screen);
  if (path === undefined) throw new Error(`${screen.name} has no @screen(route)`);
  const rest = { ...params } as Record<string, unknown>;
  const url = path.replace(/:([A-Za-z_][A-Za-z0-9_]*)/g, (_m, name: string) => {
    const v = rest[name];
    delete rest[name];
    return encodeURIComponent(String(v));
  });
  const qs = Object.entries(rest)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join('&');
  return qs ? `${url}?${qs}` : url;
}

/** Goes to a screen: goTo(CharacterDetailScreen, { id: character.id }). */
export function goTo<P>(screen: Screen<P>, params: Partial<Record<keyof P & string, unknown>> = {}): void {
  navigateTo?.(pathTo(screen, params));
}

/** The same as goTo (the web has one history stack); kept so mobile code reads the same. */
export const pushTo = goTo;

/** Back one page. */
export function goBack(): void {
  navigateTo?.(-1);
}

export { RouterProvider };
