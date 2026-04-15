# Flagon UserALE

pnpm workspace containing the UserALE core library, script-tag IIFE build, and browser extension.

## Packages

| Package | npm name | Description |
|---|---|---|
| [`core-sdk/`](./packages/core-sdk/) | `flagon-userale` | Core JS instrumentation library (ESM + TypeScript types) |
| [`iife/`](./packages/iife/) | `flagon-userale-iife` | Script-tag drop-in build — no bundler required |
| [`extension/`](./packages/extension/) | `flagon-userale-ext` | Browser extension built on the core SDK |

## Development

```sh
pnpm install
pnpm build        # builds all packages; extension picks up core changes automatically
pnpm test         # runs unit tests (Jest) then integration tests (Playwright)
```

## Test environment

Playwright integration tests require packages to be built first (`pnpm build`). The test server at [`example-server/server.js`](./example-server/server.js) is started automatically by Playwright and serves three pages:

| Route | Description |
|---|---|
| `/iife` | IIFE script-tag example |
| `/esm` | ESM core SDK example with callbacks |
| `/no-logging` | Blank page for extension tests (extension instruments the page) |

To run the server manually (useful when iterating on tests or the example pages):

```sh
pnpm example:run    # static server on :8000
pnpm example:watch  # same, with nodemon reload on example-server/ changes
```

The extension integration tests also require a production build of the extension:

```sh
pnpm --filter flagon-userale-ext build
```

## OTLP collector

All packages emit to an OTLP/HTTP endpoint. For local development, start the shared Jaeger collector from the flagon project root:

```sh
pnpm collector:up    # Jaeger on :4318 (OTLP) and :16686 (UI)
pnpm collector:down
```

## Documentation

[flagon.apache.org/userale](https://flagon.apache.org/userale/)
