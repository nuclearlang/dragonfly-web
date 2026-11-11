---
layer: L2
component: dragonfly-web
read-when: you touch the web platform (spec/web.md), dialects/web/react, packages/dragonfly-web, defs/typescript/{react,react_router,vitest,testing_library_react,dragonfly-web}, or the characters web example
---

# Dragonfly for web — the platform and its dialect `react`

Future repository `dragonfly-web` (ADR-0093). Decisions: ADR-0097 (the web platform is the mobile platform in a
browser; first dialect `react`; the analysis of zustand / TanStack Query / react-hook-form for later steps).

**The platform** (`spec/web.md`, Nuclear only): the mobile kinds that make sense in a browser, with the same words:
views (`stateless`, `stateful` with `build() Element`), `appConfig`/`config`, `repository` (http), `usecase`,
`appcomponent`, `service`, `aggregate`, state models + `statemanager`, `@screen`, `event` + `component` with `@on`,
`guard`, `tests`. Contract: `dialects/web/platform.toml`. Not yet: forms, converters, translations, local database,
plugins, AI.

## Dialect `react`

`dialects/web/react/` (extends `typescript`): React 19 without JSX, React Router 7, Vite 7, Vitest 4 + jsdom +
Testing Library. Views are classes (`StatelessView` / `StatefulView`) shown through `createElement`
(`statelessOf` / `statefulOf`), so hooks work in `build` and a stateful keeps its fields; a state model generates
`<Model>Builder`; `@screen(providers)` wraps the screen in `Providers` and `this.manager(X)` reads a provided manager
(`[decorators.provide]`). Two generic emitter rules came with it: `[kinds.<k>.syntax] construct` (a call to a
declaration of that kind, here a function call instead of `new`) and named arguments to a `named_params` kind kept
as one object in a dialect with `named_args = "object"`.

| Path | What it does |
|---|---|
| `dialects/web/react/dialect.toml` | kinds, decorators, `[architecture]`, `[project]` (`output = "build/app"`, `assets = ["public"]`), `[toolchain]`, `[call_site.Log]`, defs list, auto_imports of the runtime |
| `dialects/web/react/templates/` | kind templates; `dragonfly_g.tpl` → `src/dragonfly.g.ts` (startDragonfly, dragonflyConfig, registerModels, registerDragonfly, routes, appRouter); `index_ts.tpl`, `index_html.tpl`, `package_json.tpl`, `tsconfig.tpl`, `vite_config.tpl` |
| `dialects/web/react/docs.toml` | editor docs of every kind and decorator (required by a test) |
| `packages/dragonfly-web/src/` | runtime: `result`, `errors`, `inject`, `config`, `app`, `http` (Repository, Decode, Cache), `state`, `react` (views, Providers, hooks), `html`, `events`, `session` (SessionManager, Acl, Guards, NetworkManager), `router`, `log`, `testing` (entry `dragonfly-web/testing`) |
| `packages/dragonfly-web/test/runtime.test.ts` | 7 vitest tests (repository, cache, mocks, states, views, events) |
| `examples/examples-web/characters/` | the complete example (golden `examples/expected/characters`): list and detail screens, state, tests |
| `tools/react-check/check.sh` | runtime tsc, example built, tsc --strict, vitest (4 tests), vite build, runtime tests |
| `spec/web.md`, `spec/react.md` | the platform; the dialect (3 equivalences checked by `tools/spec-check/check.py spec/react.md react typescript`) |
| `docs/dragonfly/react.md` | the user guide (website) |

Type definitions `defs/typescript/{react@19.3.1, react_router@7.18.5, vitest@4.1.12, testing_library_react@16.3.3,
dragonfly-web@0.1.0}`: generated with `tools/defs/typescript/gen.js` from `tools/node/node_modules` (react and the
test libraries are installed there; the runtime with `npm install --no-save --install-links
../../packages/dragonfly-web` after `npm run build` in its folder). Regenerate `dragonfly-web`'s after changing its
public API (the command is in `tools/defs/typescript/generate.sh`'s style; the five lines are in the Log of
2026-11-06 in STATUS.md).

## The CLI

`dragonfly new <name> -p web -d react` writes the skeleton (`dragonfly/dragonfly/src/scaffold.rs`, `web_project`); `build`,
`install`, `run` and `test` go through the dialect's `[toolchain]` and `check` runs `nuclear check .`, as for backend
projects (`non_mobile_manifest` in `dragonfly/dragonfly/src/main.rs`; [cli CONTEXT](https://github.com/nuclearlang/dragonfly/blob/main/docs/context/cli/CONTEXT.md)).

## Checks

```sh
(cd packages/dragonfly-web && npm install && npx tsc -p tsconfig.json && npx vitest run)
(cd tools/node && npm install && npm install --no-save --install-links ../../packages/dragonfly-web)
tools/react-check/check.sh
tools/spec-check/check.py spec/react.md react typescript
```

State and pending: [STATUS.md](https://github.com/nuclearlang/nuclear/blob/main/STATUS.md).
