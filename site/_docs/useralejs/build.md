---
title: UserALE.js Build and Test
component: useralejs
permalink: /docs/useralejs/build/
priority: 1
---

To build and test [Apache Flagon UserALE.js](https://github.com/apache/flagon/tree/master/products/userale), clone the `apache/flagon` monorepo and ensure you have **Node.js (`>= 20.x`)** and **`pnpm` (`>= 10.x`)** installed (or run `nix develop` at the repository root).

```bash
git clone https://github.com/apache/flagon.git
cd flagon/products/userale

# Install workspace dependencies
pnpm install
```

---

## Build

UserALE.js is written in TypeScript and bundled with [`tsup`](https://tsup.egoist.dev/) (producing both ES module `build/main.mjs` and script-tag IIFE `build/main.global.js` bundles alongside TypeScript declarations `build/main.d.ts`), while the browser extension (`flagon-userale-ext`) is built with [Plasmo](https://docs.plasmo.com/).

```bash
# Build all workspace packages (flagon-userale and flagon-userale-ext)
pnpm build

# Or build only flagon-userale
pnpm --dir packages/flagon-userale build
```

If you modify [`proto/apache/flagon/userale/v1/log.proto`](https://github.com/apache/flagon/blob/master/proto/apache/flagon/userale/v1/log.proto), regenerate the TypeScript Protobuf contract definitions from the repository root:

```bash
buf lint
buf generate
```

---

## Test

UserALE.js uses **Jest** (with `jsdom` and `@bufbuild/protobuf` contract tests) for unit testing and **Playwright** for end-to-end browser and extension testing.

### Run Unit & Schema Contract Tests (`Jest`)

```bash
pnpm --dir packages/flagon-userale test
```

Example output:

```text
PASS test/spec/auth.spec.ts
PASS test/spec/headers.spec.ts
PASS test/spec/getInitialSettings.spec.ts
PASS test/spec/configure.spec.ts
PASS test/spec/attachHandlers.spec.ts
PASS test/spec/sendLogs.spec.ts
PASS test/spec/exporters.spec.ts
PASS test/spec/packageLogs.spec.ts
PASS test/spec/main.spec.ts

Test Suites: 9 passed, 9 total
Tests:       1 skipped, 103 passed, 104 total
```

### Run End-to-End Tests (`Playwright`)

From `products/userale`:

```bash
pnpm test
```

---

## Code Formatting & Linting

```bash
pnpm format
pnpm lint
```

---

## Contributing

Contributions are welcome! See the [Contributing Guide]({{ '/docs/contributing' | prepend: site.baseurl }}) for more information.