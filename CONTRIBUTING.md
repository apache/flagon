<!--
  ~ Licensed to the Apache Software Foundation (ASF) under one
  ~ or more contributor license agreements.  See the NOTICE file
  ~ distributed with this work for additional information
  ~ regarding copyright ownership.  The ASF licenses this file
  ~ to you under the Apache License, Version 2.0 (the
  ~ "License"); you may not use this file except in compliance
  ~ with the License.  You may obtain a copy of the License at
  ~
  ~   http://www.apache.org/licenses/LICENSE-2.0
  ~
  ~ Unless required by applicable law or agreed to in writing,
  ~ software distributed under the License is distributed on an
  ~ "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
  ~ KIND, either express or implied.  See the License for the
  ~ specific language governing permissions and limitations
  ~ under the License.
-->

# Contributing to Apache Flagon

Thank you for your interest in contributing to **Apache Flagon**! All Flagon products (**UserALE.js**, **UserALE Browser Extension**, **Distill**, **Protobuf schemas**, and the **Project Website**) live in this unified monorepo (`https://github.com/apache/flagon`).

---

## 1. Open or Claim a GitHub Issue

All non-trivial changes should reference a [GitHub Issue](https://github.com/apache/flagon/issues). If an issue does not yet exist for your bug report or feature proposal, open one first so the community can discuss the design.

---

## 2. Set Up Your Development Environment

### Option A: Nix Flake (Recommended)
If you have [Nix](https://nixos.org/) with flakes enabled, run:

```bash
nix develop
```

This drops you into a reproducible shell containing Node.js, `pnpm`, TypeScript, Python 3, `uv`, `buf`, `nixpkgs-fmt`, and `lefthook` git hooks.

### Option B: Manual Toolchain Setup
- **UserALE (`products/userale`)**: Node.js `>= 20.x` and `pnpm >= 10.x`
- **Distill (`products/distill`)**: Python `>= 3.10,< 4.0` and [`uv`](https://docs.astral.sh/uv/)
- **Protobuf (`proto/`)**: [`buf` CLI](https://buf.build/docs/installation) `>= 1.50`
- **Website (`site/`)**: Ruby + Bundler + Jekyll

---

## 3. Working on Components

### UserALE.js & Browser Extension (`products/userale`)
```bash
cd products/userale
pnpm install

# Build both flagon-userale and flagon-userale-ext
pnpm build

# Run Jest unit & contract tests
pnpm --dir packages/flagon-userale test

# Run Playwright end-to-end tests
pnpm test

# Format and lint (or use format:check / lint:check as run in CI)
pnpm format
pnpm lint
```

### Protobuf Schemas (`proto/`)
The canonical UserALE v1 Protobuf schema is defined in [`proto/apache/flagon/userale/v1/log.proto`](./proto/apache/flagon/userale/v1/log.proto). If you modify `.proto` files:

```bash
buf lint
buf generate
```

Ensure `buf generate --exit-code` passes cleanly (and run `pnpm format` in `products/userale` if generated TypeScript files change).

### Distill (`products/distill`)
```bash
cd products/distill
uv sync --all-groups
uv run pytest
uv run --group lint ruff check .
```

---

## 4. Pre-Commit Hooks & Code Style

This repository uses [`lefthook`](./lefthook.yml) to run formatting, linting, and test checks before commits and pushes:
- **`pre-commit`**: Runs Prettier & ESLint on staged files under `products/userale/`, `ruff check` (`uv run --group lint ruff check`) on staged Python files under `products/distill/`, and `nixpkgs-fmt` on `.nix` files.
- **`pre-push`**: Runs the full UserALE (`pnpm test`) and Distill (`uv run --group test pytest`) test suites.
- **Apache License Headers**: Every new source file must include the standard ASF Apache-2.0 license header (enforced in CI via SkyWalking Eyes).
- Always run pre-commit hooks when committing (do not use `--no-verify`).

---

## 5. Submitting a Pull Request

1. Create a descriptive topic branch from `master` (e.g. `feat/otel-exporter`, `fix/autostart-init`, `docs/update-readme`).
2. Make focused commits following Conventional Commits style (e.g. `feat(userale): ...`, `fix(distill): ...`, `docs: ...`).
3. Open a Pull Request against `apache/flagon` `master` referencing the relevant GitHub issue(s) (e.g. `Closes #123`).
4. Ensure all CI checks (`License check`, `proto-check`, `Userale CI test suite`, and `Distill` tests) pass.
