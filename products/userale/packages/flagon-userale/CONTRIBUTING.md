<!--
    Licensed to the Apache Software Foundation (ASF) under one
    or more contributor license agreements.  See the NOTICE file
    distributed with this work for additional information
    regarding copyright ownership.  The ASF licenses this file
    to you under the Apache License, Version 2.0 (the
    "License"); you may not use this file except in compliance
    with the License.  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing,
    software distributed under the License is distributed on an
    "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, either express or implied.  See the License for the
    specific language governing permissions and limitations
    under the License.
-->

# Contributing to Apache Flagon UserALE

Thank you for your interest in contributing to **Apache Flagon UserALE**! Both the core `flagon-userale` library and the `flagon-userale-ext` browser extension live inside the unified [`apache/flagon`](https://github.com/apache/flagon) monorepo under `products/userale/`.

For repository-wide contribution guidelines (including Protobuf schemas and Apache Flagon Distill), see the root [`CONTRIBUTING.md`](../../../CONTRIBUTING.md).

---

## Before Opening a Pull Request

1. Search [existing GitHub Issues and Pull Requests](https://github.com/apache/flagon/issues) or open a new issue describing the bug or feature.
2. For large architectural changes, start a discussion on the [`dev@flagon.apache.org`](mailto:dev@flagon.apache.org) mailing list ([community info](https://flagon.apache.org/community)).

---

## Prerequisites

- **Option A (Recommended — Nix Flake)**: Run `nix develop` from the repository root to enter a reproducible shell with Node.js 24, `pnpm`, TypeScript, `buf`, and `lefthook`.
- **Option B (Manual Setup)**:
  - **Node.js `>= 20.x`** (`20.x`, `22.x`, and `24.x` are tested in CI)
  - **`pnpm >= 10.x`**
  - **[`buf` CLI](https://buf.build/docs/installation)** (when modifying `proto/apache/flagon/userale/v1/log.proto`)

---

## Development Setup

1. Fork and clone the [`apache/flagon`](https://github.com/apache/flagon) repository:

```bash
git clone https://github.com/<your-username>/flagon.git
cd flagon/products/userale
```

2. Install workspace dependencies:

```bash
pnpm install
```

3. Understand the `products/userale` workspace layout:
   - `packages/flagon-userale/src/`: Core TypeScript source (`main.ts`, `configure.ts`, `attachHandlers.ts`, `packageLogs.ts`, `sendLogs.ts`, `exporters/`, `replay/`, `gen/`).
   - `packages/flagon-userale/test/`: Jest unit tests and `@bufbuild/protobuf` / OTLP contract tests (`*.spec.ts`).
   - `packages/flagon-userale/build/`: Compiled ESM (`main.mjs`), IIFE (`main.global.js`), and TypeScript declaration (`*.d.ts`) outputs produced by `tsup` and `tsc`.
   - `packages/flagon-userale-ext/`: Manifest V3 browser extension built with [Plasmo](https://docs.plasmo.com/).
   - `test/`: Playwright end-to-end browser and extension journey tests (`*.spec.ts`).
   - `example/`: Local collector server (`example/server/server.js`) and full-stack OpenTelemetry + Grafana + Loki + Tempo demo (`example/otel-demo/`).

4. Build, test, format, and lint:

```bash
# Build flagon-userale and flagon-userale-ext
pnpm build

# Run Jest unit & contract tests (fast feedback)
pnpm --dir packages/flagon-userale test

# Run full test suite (Playwright E2E + Jest)
pnpm test

# Format and lint (or run non-mutating checks via format:check / lint:check)
pnpm format
pnpm lint
pnpm format:check
pnpm lint:check
```

---

## Creating a Pull Request

1. Create a topic branch from `master` (e.g. `feat/otel-exporter`, `fix/session-replay`).
2. Ensure every new source file includes the standard ASF Apache-2.0 license header (verified in CI by Apache SkyWalking Eyes).
3. Add or update unit tests in `packages/flagon-userale/test/` (and Playwright E2E tests in `test/` when applicable).
4. Commit your changes with [`lefthook`](../../../lefthook.yml) pre-commit hooks enabled (do not pass `--no-verify`).
5. Open a Pull Request against `apache/flagon` `master` and link the corresponding GitHub Issue.

Questions? Reach out on [`dev@flagon.apache.org`](mailto:dev@flagon.apache.org)!
