---
title: Contributing
component: flagon
permalink: /docs/contributing/
priority: 2
---

First, thank you for contributing to **Apache Flagon**!

All Apache Flagon components (**UserALE.js**, **UserALE Browser Extension**, **Distill**, **Protobuf schemas**, and the **Project Website**) are maintained in the unified [`apache/flagon`](https://github.com/apache/flagon) monorepo.

---

### 1. Open or Claim an Issue on GitHub

All changes to Apache Flagon should correspond to a [GitHub Issue](https://github.com/apache/flagon/issues) so work can be discussed and tracked transparently.

---

### 2. Set Up Your Local Development Environment

Clone the repository and create a topic branch from `master`:

```shell
git clone https://github.com/apache/flagon.git
cd flagon
git checkout -b feat/your-feature-name
```

#### Option A: Nix Flake (Recommended)
If you use [Nix](https://nixos.org/) with flakes enabled, run:

```shell
nix develop
```

This provides Node.js, `pnpm`, TypeScript, Python 3, `uv`, `buf`, and `lefthook` git hooks automatically.

#### Option B: Manual Toolchain Setup
- **UserALE (`products/userale`)**: Node.js `>= 20.x` and `pnpm >= 10.x`
- **Distill (`products/distill`)**: Python `>= 3.10,< 4.0` and [`uv`](https://docs.astral.sh/uv/)
- **Protobuf (`proto/`)**: [`buf` CLI](https://buf.build/docs/installation)

---

### 3. Build & Test Your Changes

#### UserALE.js & Browser Extension (`products/userale`)
```shell
cd products/userale
pnpm install
pnpm build
pnpm --dir packages/flagon-userale test
pnpm format:check
pnpm lint:check
```

#### Distill (`products/distill`)
```shell
cd products/distill
uv sync --all-groups
uv run pytest
uv run --group lint ruff check .
```

#### Protobuf Schemas (`proto/`)
```shell
buf lint
buf generate
```

---

### 4. Submit a Pull Request on GitHub

1. Ensure every new source file includes the standard Apache-2.0 license header.
2. Commit your changes in logical units with pre-commit hooks enabled (do not pass `--no-verify`).
3. Open a Pull Request against [`apache/flagon`](https://github.com/apache/flagon/pulls) referencing the issue number (e.g. `Closes #123`).
