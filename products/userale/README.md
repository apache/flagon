<!--
  Licensed to the Apache Software Foundation (ASF) under one
  or more contributor license agreements. See the NOTICE file
  distributed with this work for additional information
  regarding copyright ownership. The ASF licenses this file
  to you under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing,
  software distributed under the License is distributed on an
  "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
  either express or implied. See the License for the specific
  language governing permissions and limitations under the License.
-->

# Apache Flagon UserALE Workspace

UserALE is a client-side behavioral analytics instrumentation library and browser extension for web applications.

## Workspace Packages & Examples

- [`packages/flagon-userale`](./packages/flagon-userale/README.md): Core TypeScript/JavaScript library (`ESM` module + `IIFE` script-tag bundle) with pluggable exporters for UserALE flat JSON, OpenTelemetry OTLP/JSON (`OtlpJsonExporter`), OpenTelemetry JS SDK (`OtelSdkExporter`), Protobuf v1 canonical JSON (`ProtoJsonExporter`), and WebSockets (`WebSocketExporter`).
- [`packages/flagon-userale-ext`](./packages/flagon-userale-ext/README.md): Chrome and Firefox Manifest V3 browser extension built with [Plasmo](https://docs.plasmo.com/).
- [`example/server`](./example/server/server.js): Local Express + WebSocket test collector supporting `/` and `/v1/logs` across UserALE flat JSON, Protobuf v1 `LogBatch`, and OTLP/JSON payloads.
- [`example/otel-demo`](./example/otel-demo/README.md): Full-stack `docker-compose` stack with OpenTelemetry Collector, Grafana, Loki, and Tempo demonstrating browser-to-backend W3C `traceparent` correlation.

---

## Workspace Commands

From `products/userale`:

```bash
# Install dependencies across all workspace packages
pnpm install

# Build flagon-userale and flagon-userale-ext
pnpm build

# Run flagon-userale Jest unit & Protobuf/OTLP contract tests
pnpm --dir packages/flagon-userale test

# Run full Playwright E2E + Jest test suite
pnpm test

# Run local example collector server on http://localhost:8000
pnpm example:run

# Format and lint source files
pnpm format
pnpm lint
```

📚 [Apache Flagon Documentation](https://flagon.apache.org/docs/useralejs/)
