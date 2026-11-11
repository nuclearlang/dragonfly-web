# AGENTS.md — dragonfly-web

The web platform of Dragonfly: single-page apps written in Nuclear with the same words as the mobile platform. Its dialect `react` (React 19, React Router, Vite, Vitest) and its TypeScript runtime `dragonfly-web`.

This repository is a folder of the NuclearLang working tree (`nuclear/dragonfly-web`); the platform's rules are the
working tree's `../AGENTS.md` ([nuclear](https://github.com/nuclearlang/nuclear/blob/main/AGENTS.md)) and its state is `../STATUS.md`.

- Context of this repository: [docs/context/dragonfly-web/CONTEXT.md](docs/context/dragonfly-web/CONTEXT.md).
- What is inside: `dialects/web/` (the platform contract and `react`), `packages/dragonfly-web` (the runtime), `defs/typescript/` (React and its tools), `spec/{web,react}.md`, `examples/`, `tools/react-check`, `docs/`.
- Checks:

```sh
(cd .. && cargo test)                 # the example, the golden
sh tools/react-check/check.sh         # tsc --strict, the tests, vite build
```
