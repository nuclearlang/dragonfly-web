# Dragonfly web

The web platform of Dragonfly: single-page apps written in Nuclear with the same words as the mobile platform. Its dialect `react` (React 19, React Router, Vite, Vitest) and its TypeScript runtime `dragonfly-web`.

Start with the guide [docs/dragonfly/react.md](docs/dragonfly/react.md) and [spec/web.md](spec/web.md).

## What is inside

`dialects/web/` (the platform contract and `react`), `packages/dragonfly-web` (the runtime), `defs/typescript/` (React and its tools), `spec/{web,react}.md`, `examples/`, `tools/react-check`, `docs/`.

## Working on it

It is built by the `nuclear` compiler and the `dragonfly` CLI, so it lives inside a clone of the
[nuclear](https://github.com/nuclearlang/nuclear) repository:

```sh
git clone https://github.com/nuclearlang/nuclear && cd nuclear
git clone https://github.com/nuclearlang/dragonfly-web
./install.sh
```

The checks before a change: [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[Apache-2.0](LICENSE).
