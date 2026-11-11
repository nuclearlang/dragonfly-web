// The injector: every class the transpiler registers in registerDragonfly (repositories, use cases, managers...)
// and `inject(Cls)` to read it. Singletons are built once; factories (use cases, managers) on every inject.
type Ctor<T> = abstract new (...args: never[]) => T;

const factories = new Map<Ctor<unknown>, { make: () => unknown; singleton: boolean }>();
const singletons = new Map<Ctor<unknown>, unknown>();

/** Registers `cls`: `singleton` (default) builds it once; `{ singleton: false }` builds it on every `inject`. */
export function register<T>(cls: Ctor<T>, make: () => T, options: { singleton?: boolean } = {}): void {
  factories.set(cls, { make, singleton: options.singleton ?? true });
  singletons.delete(cls);
}

/** Puts `instance` in place of whatever `cls` would build (tests: a fake, a mock). */
export function replace<T>(cls: Ctor<T>, instance: T): void {
  factories.set(cls, { make: () => instance, singleton: true });
  singletons.set(cls, instance);
}

/** The object registered for `cls`. */
export function inject<T>(cls: Ctor<T>): T {
  const f = factories.get(cls);
  if (!f) throw new Error(`inject(${cls.name}): not registered (is it in registerDragonfly?)`);
  if (!f.singleton) return f.make() as T;
  if (!singletons.has(cls)) singletons.set(cls, f.make());
  return singletons.get(cls) as T;
}

export function isRegistered(cls: Ctor<unknown>): boolean {
  return factories.has(cls);
}

/** Forgets everything (tests). */
export function resetInjector(): void {
  factories.clear();
  singletons.clear();
}
