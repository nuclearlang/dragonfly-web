# Dialect `react`: the `web` platform in TypeScript with React

> The React dialect of the [web platform](web.md) (ADR-0097), extending [typescript](https://github.com/nuclearlang/nuclear/blob/main/spec/typescript.md). The platform's
> rules, kinds and Nuclear are in `web.md`; this document holds only how this dialect writes them: **React 19**
> without JSX (`createElement` and the runtime's HTML functions), **React Router 7**, **Vite 7** to build and run,
> **Vitest 4** + jsdom + Testing Library to test. Files: `dialects/web/react/`; runtime: `packages/dragonfly-web`
> (npm `dragonfly-web`). Checked by `tools/react-check/check.sh` (tsc --strict, vitest, vite build).

## 1. Project

A folder with `config.nuc` (`dragonfly(platform = "web", dialect = "react")`) and `main.nuc`; `nuclear build .`
writes `build/app`: `src/` (the app; `src/dragonfly.g.ts` and `src/index.ts` generated), `test/`, `index.html`,
`package.json`, `tsconfig.json`, `vite.config.ts`. In `build/app`: `npm install`, `npm run dev` (Vite, port 5173),
`npm test` (Vitest), `npm run build` (tsc + Vite). The `[toolchain]` of the dialect gives the `dragonfly` CLI those
commands.

Generated once per project:

| File | Holds |
|---|---|
| `src/dragonfly.g.ts` | `startDragonfly()`, `dragonflyConfig()`, `registerModels()`, `registerDragonfly()` (configs, the injector, the `@on` subscriptions), `routes` (one `AppRoute` per `@screen`, props from the url parameters), `appRouter()` |
| `src/index.ts` | starts Dragonfly, mounts the `App` of `main.nuc` in `#root` |
| `index.html`, `vite.config.ts`, `tsconfig.json`, `package.json`, `.npmrc` | Vite's entry (title, description, the project's `public/styles.css` and `favicon.svg`), the test environment (jsdom, `test/**/*_test.ts`), TypeScript strict, the dependencies, `install-links=true` (npm copies the runtime instead of linking it, so TypeScript and Vite resolve React from the app) |

## 2. How each kind is written

| Kind | TypeScript |
|---|---|
| `stateless Name(params)` | `export function Name(props: NameProps): Element` → `createElement(NameView, props)`; `NameProps` interface (`key?` added); `NameView = statelessOf(class extends StatelessView<NameProps> { build() })`; params read as `this.props.x`; with `@screen(providers)` the function wraps the view in `Providers` |
| `stateful Name(params)` + fields | the same over `statefulOf(class extends StatefulView<NameProps>)`: fields are class fields (`x: T \| null = null` when optional), `setState`, `initState`, `dispose` |
| `appConfig`, `config` | `class extends AppConfig` / `ComponentConfig` with `override readonly connections`, `globals` |
| model | `class` with `readonly` fields, `constructor(init: {...})`, `static fromJson(json: Json)`, `toJson()`, `copyWith()`; a generic model's `fromJson(json, fromJsonT)` |
| `event` | the same, `extends AppEvent` with `eventName` |
| `@repository(path)` | `class extends Repository` with `super({ path })`; a `Result` method `return this.result(() => this.send(HttpMethod.get, ':id', { params: { id }, decode: Decode.one(Model.fromJson) }), (e) => new Error({ message: e.message }))`; another return type `return this.send(...)`; `cache` → `new Cache({ ttl })` + `purgeX()` |
| `usecase`, `service`, `aggregate`, `component` | `class` with `constructor(private readonly dep: Dep)`; `@requires` → `Guards.check({...})` + `return Err(...)`; `@acl` → `await Guards.verify({...})` |
| `appcomponent` | `class` whose methods `return await inject(UseCase).exec(...)` |
| `guard` | `class extends Guard` with `canActivate()` |
| state model `Name(a: A, flag: boolean)` | `enum NameStatus`, `class Name` (`status`, optional data fields, `static initial()`, `static a(a)`, `static flag()`), `interface NameBuilders`, `function NameBuilder(builders)` → a component that reads `useStateOf(Name)` and calls the builder of the current status |
| `@stateModel(S) statemanager` | `class extends StateManager<S>`; `@state(S.x)` methods become `async x(...): Promise<void>` that `emit` (`result.match(S.error, S.x)` for a `Result`) around a private `_x` with the body; `@before`/`@after` call the named method |
| `tests` | `describe(name, () => { beforeEach(DragonflyTest.start(...), DragonflyTest.mock(X)); ... })`; `@test` → `test(desc, async () => ...)`; `@states` → `statesOf(manager, ...)` + `expect(states).toEqual(...)`; `@widget` → `test` |

Calls: a view, a builder or a screen is **called like a function** (`CharacterTile({ character: c })`): the kinds
declare `construct = "{{callee}}({{args}})"` and the named arguments stay one object (TypeScript has no named
parameters; the emitter keeps them for a kind with `named_params`). `inject<X>()` is `inject(X)`;
`Manager.method()` inside a screen's views is `this.manager(Manager).method()`.

## 3. Equivalences

A model (`model` is written when the file is not in `domain/models/`):

```nuclear
model Origin
  name: string
  url?: string
```

```typescript
export class Origin {
  readonly name: string;
  readonly url?: string | null;

  constructor(init: { name: string; url?: string | null }) {
    this.name = init.name;
    this.url = init.url;
  }

  static fromJson(json: Json): Origin {
    return new Origin({
      name: json['name'] as string,
      url: json['url'] as string | null,
    });
  }

  toJson(): Json {
    return {
      name: this.name,
      url: this.url,
    };
  }

  /** The same value with some fields changed. */
  copyWith(changes: Partial<{ name: string; url: string | null }>): Origin {
    return new Origin({ ...this, ...changes });
  }
}
```

A view:

```nuclear
stateless Greeting(name: string)
  build() Element
    p(className = "greeting", children = "Hello ${name}")
```

```typescript
export function Greeting(props: GreetingProps): Element {
  return createElement(GreetingView, props);
}

export interface GreetingProps {
  key?: string | number;
  name: string;
}

const GreetingView = statelessOf(
  class extends StatelessView<GreetingProps> {
    override build(): Element {
      return p({ className: 'greeting', children: `Hello ${this.props.name}` });
    }
  },
);
```

An event:

```nuclear
event Pinged
  n: int
```

```typescript
import { AppEvent, Json } from 'dragonfly-web';

export class Pinged extends AppEvent {
  readonly n: number;

  constructor(init: { n: number }) {
    super();
    this.n = init.n;
  }

  static fromJson(json: Json): Pinged {
    return new Pinged({
      n: json['n'] as number,
    });
  }

  get eventName(): string {
    return 'Pinged';
  }

  toJson(): Json {
    return {
      n: this.n,
    };
  }
}
```

The complete example: `examples/examples-web/characters` (golden `examples/expected/characters`): a characters
component with its repository, use cases, facade, state, list and detail screens, a global component, an event, a
guard and four tests (`tools/react-check/check.sh`: tsc --strict 0 errors, 4 tests, vite build).

## 4. Runtime (`dragonfly-web`)

| Export | What it does |
|---|---|
| `Result`, `Ok`, `Err`, `AppError`, `HttpError`, `NotFound` | the platform's Result and errors (`Error(message)` in Nuclear is `new AppError(message)`) |
| `register`, `inject`, `replace`, `resetInjector` | the injector (`{ singleton: false }` for use cases and managers) |
| `AppConfig`, `ComponentConfig`, `Connection`, `Http`, `HttpInterceptor`, `Global` | configuration |
| `Dragonfly.start/addConfig/connection/reset` | the runtime's entry point |
| `Repository` (`send`, `result`, `attempt`, `target`, `purgeCache`), `Decode`, `Cache`, `HttpMethod` | http calls over fetch; GET/PUT/DELETE retry transient failures twice |
| `StateManager<S>` (`state`, `emit`, `subscribe`, `close`) | the state of a screen |
| `StatelessView`, `StatefulView`, `statelessOf`, `statefulOf`, `Providers`, `useManager`, `useStateOf`, `useManagerState`, `Element` | views as classes over React components; the provided managers |
| `div`, `span`, `ul`, `li`, `button`, `input`, `img`, `form`... (`el`, `fragment`) | HTML without JSX: `div({ className, children })` or `div(child, child)` |
| `AppEvent`, `Events` (`publish`, `subscribe`, `decoder`, `publishJson`), `useEvent` | events |
| `SessionManager`, `SessionStarted`, `SessionEnded`, `Acl`, `NetworkManager`, `Guard`, `Guards` (`check`, `verify`, `verifySync`) | session and access |
| `buildRouter`, `goTo`, `pushTo`, `goBack`, `pathTo`, `RouterProvider`, `AppRoute` | routes from `@screen`, navigation by screen |
| `Log` (`d`, `i`, `s`, `w`, `e`, `sink`) | logs with the call site the transpiler passes (`at`) |
| `dragonfly-web/testing`: `DragonflyTest` (`start`, `respondWith`, `respond`, `requests`, `replace`, `mock`, `of`), `when`, `verify`, `renderScreen`, `statesOf`, `okOf`, `errOf` | tests |
