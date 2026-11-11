# The `web` platform of Dragonfly

> Inherits every rule of [nuclear-base.md](https://github.com/nuclearlang/nuclear/blob/main/spec/nuclear-base.md) and the standard library ([library.md](https://github.com/nuclearlang/nuclear/blob/main/spec/library.md)).
> This document defines the web platform (ADR-0093, ADR-0097): apps that run in the browser, written in Nuclear
> only. Today its only dialect is `react` ([react.md](react.md)); this document holds the platform's rules and
> kinds, `react.md` how React writes them. A project's Nuclear never changes between the dialects of the platform;
> only a use of a dialect's type definitions (a React hook, an npm package) ties code to that dialect.

The web platform is the **mobile platform in a browser** (ADR-0097): the same words for the same things
(`appConfig`, `repository` with `@get`, `usecase`, `appcomponent`, state models and `statemanager`, `@screen`,
events, guards, tests), so an app's domain and state read the same on a phone and on the web, and an agent that
knows one writes the other. What a browser has no use for (a native splash, workmanager, a secure keystore) is not
here; what it needs and a phone does not (HTML elements, a url bar) is.

## 1. Project

```
my_store/
├── config.nuc                         dragonfly(platform = "web", dialect = "react"), app(...)
├── main.nuc                           the App view: the router with every screen
├── config/project_config.nuc          appConfig: the connections and global services of the app
├── components/<name>/                 appcomponent, config/, data/, domain/, presentation/
├── shared/                            models, events, guards, components, screens shared by the app
├── public/                            static files, copied as they are
└── test/*_test.nuc                    tests
```

`config.nuc` is the only manifest ([projects.md](https://github.com/nuclearlang/nuclear/blob/main/spec/projects.md) §1): the platform and dialect, the app (name,
description, version) and the backends it talks to (`contracts(tasks_api = "../tasks_api")`: their models and
repositories are generated into `contracts/`, [projects.md](https://github.com/nuclearlang/nuclear/blob/main/spec/projects.md) §1.2). `build/app` is the dialect's app,
never edited.

```nuclear
dragonfly(platform = "web", dialect = "react")
app(name = "my_store", title = "My Store", description = "A Dragonfly web app.", version = "1.0.0")
```

`title` is the browser tab's title and `description` the page's description. `public/` is served as it is: a
`public/styles.css` is the app's stylesheet and a `public/favicon.svg` its icon (the page links them when they exist).

## 2. Kinds

| Area | Kinds and decorators | Rules |
|---|---|---|
| Views | `stateless`, `stateful` (params = props; `build() Element`; HTML functions `div`, `ul`, `button`...) | §3.1 |
| Configuration | `appConfig`, `config`; connection `Http(baseUrl, headers, timeout, interceptors)`; globals `SessionManager`, `Acl`, `NetworkManager` | §3.2 |
| Data | models (`@key`), `repository` with `@get`/`@post`/`@put`/`@patch`/`@delete` (`path`, `cache`, `ttl`, `retry`; `@path`, `@query`, `@body`) | §3.3 |
| Domain | `usecase` (`@requires`, `@acl`), `appcomponent`, `service`, `aggregate` | §3.4 |
| State | state models, `statemanager` (`@stateModel`, `@state`, `@before`, `@after`), `<Model>Builder` | §3.5 |
| Screens | `@screen(route, providers, loggedIn, acl, notFound)`, `goTo`, `goBack` | §3.6 |
| Events | `event`, `Events.publish`, `component` with `@on(Event)`, `useEvent` | §3.7 |
| Session and access | `SessionManager`, `Acl`, `guard` with `canActivate` | §3.8 |
| Tests | `tests` with `@test`, `@widget`, `@states`, `@mock` | §4 |

Not in this version (STATUS.md, "Next" step 5): forms and `formmanager`, converters, translations, the local
database (`@primary`, `saveLocal`), plugins and AI kinds. They come with the same words as the mobile platform.

## 3. Rules

1. **Golden rule:** performance, speed and readability of the syntax.
2. **Only the business logic in Nuclear.** Components, props, registration in the injector, JSON, http calls,
   state handling, routes and imports are written by the transpiler.
3. **Light clean architecture:** `data`, `domain` and `presentation` layers plus what is shared; the same
   `N0301`/`N0302` rules as the mobile platform (§5).
4. **Closed components:** another component is used only through its `appcomponent`.
5. **The platform's runtime and the official ecosystem of the dialect:** http with cache and retries, state
   managers, events, session, ACL, the router and the test helpers come from the dialect's runtime package; the UI
   library, the bundler and the test runner are the dialect's.

### 3.1 Views

A view's parameters are its props; `build()` returns an `Element`. Elements are HTML functions with the
attributes as named arguments and `children` (a text, an element or a list), and other views called like
functions. A `stateful` keeps its fields while it is shown; `setState(() => ...)` changes them.

```nuclear
stateless CharacterTile(character: Character)
  build() Element
    li(className = "tile", onClick = () => goTo(CharacterDetailScreen, id = character.id), children = [
      img(src = character.image, alt = character.name),
      span(children = character.name),
    ])

stateful Counter(start: int = 0)
  count: int = 0

  initState() void
    count = start

  build() Element
    button(onClick = () => setState(() => count = count + 1), children = "Clicked ${count}")
```

### 3.2 Configuration

`appConfig` (one per project) and `config` (per component) list `connections` and `globals`, as in the mobile
platform. `Http` is the http connection; `SessionManager(timeout)`, `Acl(inherits)` and `NetworkManager()` the
global services.

### 3.3 Data

A `repository` is a class of http calls: the same decorators, parameters and return rules as the mobile platform
([flutter.md](https://github.com/nuclearlang/dragonfly-mobile/blob/main/spec/flutter.md) §6.3): the path under the connection's `baseUrl`, `:name` from a parameter, the rest to
the query (GET, DELETE) or the JSON body; a `Result` method answers `Err(E(message = ...))`; `cache`/`ttl`/`retry`.
A model is its fields; it gets `fromJson`, `toJson` and `copyWith`; `@key` names a field in the JSON.

### 3.4 Domain

`usecase` (one `exec` that returns `Result`; `@requires(internet, session)`, `@acl(roles, permissions, guards)`),
`appcomponent` (aliases to the use cases), `service`, `aggregate`: identical to the mobile platform.

### 3.5 State

A state model lists the states of a screen; a `statemanager` emits them (`@stateModel`, `@state`, `@before`,
`@after`). The screen reads them with the model's builder: `CharactersStateBuilder(full = (list) => ..., error =
(e) => ..., loading = () => ..., orElse = () => ...)`, which re-renders on every state.

### 3.6 Screens and navigation

`@screen(route = "/characters/:id", providers = [Manager], loggedIn = { forward: "/login" }, acl = { roles,
permissions, forward: "/denied" }, notFound = true)` on a view: a route of the router; `:id` becomes the screen's
parameter of that type, the other parameters come from the query. Every address is a new instance of its screen:
going from `/docs/a` to `/docs/b` builds the screen and its managers again. `providers` creates the managers for the screen
and its views, where `Manager.method()` uses them. `goTo(Screen, id = 7)` and `goBack()` navigate by screen, never
by address. The `App` view of `main.nuc` is the router.

### 3.7 Events

`event Name` + fields; `Events.publish(Name(...))`; a global `component` method with `@on(Name)` runs with every
one; a view calls `useEvent(Name)` in `build` to re-render on it.

### 3.8 Session and access

`SessionManager` keeps the session (token, user, roles, permissions, values) in the browser's storage and ends it
after `timeout`; `Acl` gives role inheritance; a `guard` is a custom check for `@acl(guards = [...])`.

## 4. Tests

`tests` in `test/`: the app starts with its real config and every request answers what the test prepares
(`DragonflyTest.respondWith`, `respond`); `@mock([Class])` makes a class a mock (`when(Class.method).thenReturn`,
`verify`); `@test`, `@states` (the states a manager emits) and `@widget` (a screen rendered in a memory router,
read with Testing Library's `screen`) as in the mobile platform; `beforeEach()`/`afterEach()` methods are the hooks.

## 5. Architecture

| Rule | Code |
|---|---|
| A `usecase` is only used from an `appcomponent` | `N0301` |
| A `service` is only used from a `usecase` or an `aggregate` | `N0301` |
| An `aggregate` is only used from a `usecase` | `N0301` |
| A `repository` is only used from a `usecase` or an `aggregate` | `N0301` |
| From another component (or from `shared/`, `config/` and `main.nuc`) only the `appcomponent`, the models, the events, the global components, the guards and the screens (`@screen`) are visible | `N0302` |
| Tests may use any declaration | — |

## 6. What the dialect decides

Only how it is written: the language, the UI library, the bundler, the test runner, the generated app and how to
run it ([react.md](react.md)).
