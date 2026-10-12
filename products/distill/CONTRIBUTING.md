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

# Contributing to Apache Flagon Distill

Thank you for contributing to **Apache Flagon Distill** (`flagon-distill`)! Distill is developed in the unified [`apache/flagon`](https://github.com/apache/flagon) monorepo under `products/distill/`.

For repository-wide guidelines, see the root [`CONTRIBUTING.md`](../../CONTRIBUTING.md).

---

## 1. Open or Claim a GitHub Issue

All non-trivial changes should correspond to an issue in [GitHub Issues](https://github.com/apache/flagon/issues). For larger features or schema changes, feel free to start a thread on [`dev@flagon.apache.org`](mailto:dev@flagon.apache.org).

---

## 2. Local Development with `uv`

Distill targets **Python `>= 3.10,< 4.0`** (`3.10`–`3.13` tested in CI) and uses [`uv`](https://docs.astral.sh/uv/) for dependency management, linting, and testing.

If you use [Nix](https://nixos.org/), run `nix develop` at the repository root to get Python, `uv`, and `lefthook` automatically.

```bash
cd products/distill

# Sync virtual environment with all dependency groups (test, lint, docs, dev)
uv sync --all-groups

# Run unit tests with coverage
uv run pytest

# Run linter, formatter check, and type checker
uv run --group lint ruff check .
uv run --group lint ruff format --check .
uv run --group lint mypy distill tests
```

---

## 3. Submitting a Pull Request

1. Fork [`apache/flagon`](https://github.com/apache/flagon) and create a topic branch from `master`.
2. Ensure all new files include the ASF Apache-2.0 license header.
3. Add unit tests under `products/distill/tests/` for any new analytics or schema logic.
4. Commit your changes with [`lefthook`](../../lefthook.yml) hooks enabled (do not use `--no-verify`) and open a Pull Request referencing the GitHub issue.
