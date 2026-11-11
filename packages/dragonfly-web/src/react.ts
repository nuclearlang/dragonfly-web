// How the react dialect writes a widget: a `stateless` is a class with `build()` built on every render; a
// `stateful` keeps its instance (its fields) between renders and re-renders on `setState`. Both are shown through
// createElement, so hooks (`useManager`, `useStateOf`, `useEvent`) work inside `build`.
import {
  createContext,
  createElement,
  ReactElement,
  ReactNode,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { inject } from './inject.js';
import { StateManager } from './state.js';

export type Element = ReactElement | null;

type ManagerCtor<M> = abstract new (...args: never[]) => M;

const ManagersContext = createContext<StateManager<unknown>[]>([]);

/** The managers a screen provides (`@screen(providers = [...])`), reachable from a view's build and callbacks. */
export abstract class View<P> {
  /** @internal */
  managers: StateManager<unknown>[] = [];

  abstract get props(): P;

  abstract build(): Element;

  /** The provided manager of class `cls` (`CharactersManager.load()` in a screen's view). */
  manager<M extends StateManager<unknown>>(cls: ManagerCtor<M>): M {
    const found = this.managers.find((m): m is M => m instanceof cls);
    if (!found) throw new Error(`${cls.name} is not provided: add it to @screen(providers = [...])`);
    return found;
  }
}

/** The base of a `stateless`: its props and `build()`. */
export abstract class StatelessView<P = Record<string, never>> extends View<P> {
  constructor(readonly props: P) {
    super();
  }
}

/** The base of a `stateful`: the instance survives renders; `setState` re-renders; `initState` / `dispose`. */
export abstract class StatefulView<P = Record<string, never>> extends View<P> {
  props!: P;
  mounted = false;
  private rerender: () => void = () => {};

  initState(): void {}

  dispose(): void {}

  /** Runs `change` on the fields and re-renders. */
  setState(change: () => void = () => {}): void {
    change();
    this.rerender();
  }

  /** @internal */
  attach(props: P, rerender: () => void): void {
    this.props = props;
    this.rerender = rerender;
  }
}

/** The component of a stateless view: `createElement(statelessOf(Cls), props)`. */
export function statelessOf<P>(cls: new (props: P) => StatelessView<P>): (props: P) => Element {
  const Render = (props: P): Element => {
    const managers = useContext(ManagersContext);
    const view = new cls(props);
    view.managers = managers;
    return view.build();
  };
  Object.defineProperty(Render, 'name', { value: cls.name });
  return Render;
}

/** The component of a stateful view. */
export function statefulOf<P>(cls: new () => StatefulView<P>): (props: P) => Element {
  const Render = (props: P): Element => {
    const [, bump] = useReducer((n: number) => n + 1, 0);
    const ref = useRef<StatefulView<P> | null>(null);
    if (ref.current === null) ref.current = new cls();
    const self = ref.current;
    self.attach(props, bump);
    self.managers = useContext(ManagersContext);
    useEffect(() => {
      self.mounted = true;
      self.initState();
      return () => {
        self.mounted = false;
        self.dispose();
      };
    }, [self]);
    return self.build();
  };
  Object.defineProperty(Render, 'name', { value: cls.name });
  return Render;
}

/** `@screen(providers = [CharactersManager])`: builds the managers once for the screen and provides them. */
export function Providers(props: { managers: ManagerCtor<StateManager<unknown>>[]; children: ReactNode }): Element {
  const parent = useContext(ManagersContext);
  const [own] = useState(() => props.managers.map((m) => inject(m)));
  useEffect(
    () => () => {
      for (const m of own) void m.close();
    },
    [own],
  );
  return createElement(ManagersContext.Provider, { value: [...own, ...parent] }, props.children);
}

/** The provided manager of class `cls` (the screen's, or an ancestor screen's). */
export function useManager<M extends StateManager<unknown>>(cls: ManagerCtor<M>): M {
  const found = useContext(ManagersContext).find((m): m is M => m instanceof cls);
  if (!found) throw new Error(`${cls.name} is not provided: add it to @screen(providers = [...])`);
  return found;
}

/** The current state of the provided manager whose state is of class `cls`; re-renders when it changes. */
export function useStateOf<S extends object>(cls: abstract new (...args: never[]) => S): S {
  const managers = useContext(ManagersContext);
  const manager = managers.find((m) => m.state instanceof cls);
  if (!manager) throw new Error(`no provided manager has a ${cls.name} state: add it to @screen(providers = [...])`);
  return useSyncExternalStore(
    (l) => manager.subscribe(l),
    () => manager.state as S,
    () => manager.state as S,
  );
}

/** The state of a manager held elsewhere (a stateful's field, a test). */
export function useManagerState<S>(manager: StateManager<S>): S {
  return useSyncExternalStore(
    (l) => manager.subscribe(l),
    () => manager.state,
    () => manager.state,
  );
}
