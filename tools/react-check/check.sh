#!/bin/sh
# Builds the react example (examples/examples-web/characters) and checks the generated TypeScript: tsc --strict,
# its tests in Nuclear (vitest + jsdom) and a production bundle (vite build), then the runtime's own tests (vitest in
# packages/dragonfly-web). Runs from the working tree (plan 006): this repository (dragonfly-web) inside the `nuclear`
# one, or `NUCLEAR_ROOT` pointing to it. Needs the nuclear repository's tools/node (npm install there).
set -e
here=$(cd "$(dirname "$0")/../.." && pwd)
root=${NUCLEAR_ROOT:-$(cd "$here/.." && pwd)}
nm="$root/tools/node/node_modules"
# build the runtime, then copy it fresh (npm keeps an old copy of the same version; a `--no-save` install also
# prunes the other runtime linked the same way)
(cd "$here/packages/dragonfly-web" && node "$nm/typescript/bin/tsc" -p tsconfig.json)
rm -rf "$nm/dragonfly-web"
(cd "$root/tools/node" && npm install --no-save --no-audit --no-fund --install-links "$here/packages/dragonfly-web" >/dev/null 2>&1)
p="$here/examples/examples-web/characters"
rm -rf "$p/build"
(cd "$root" && cargo run -q -p nuclear-cli -- build "$p")
ln -sfn "$nm" "$p/build/app/node_modules"
cd "$p/build/app"
node "$nm/typescript/bin/tsc" -p tsconfig.json && echo "tsc --strict: 0 errors"
out=$(node "$nm/vitest/vitest.mjs" run 2>&1) || { echo "$out"; exit 1; }
echo "$out" | grep -E 'Tests|Test Files'
node "$nm/vite/bin/vite.js" build --logLevel error && echo "vite build: ok"
cd "$here/packages/dragonfly-web"
out=$(node "$nm/vitest/vitest.mjs" run 2>&1) || { echo "$out"; exit 1; }
echo "$out" | grep -E 'Tests'
