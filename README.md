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

# Apache Flagon

[Apache Flagon](https://flagon.apache.org/) is an open-source software suite for user behavioral analytics, combining lightweight frontend DOM/event instrumentation (**UserALE.js**) with OpenTelemetry observability exports, canonical Protobuf schemas, and a Python behavioral analytics & graph toolkit (**Distill**).

---

## Repository Structure

```text
├── proto/                                 # Canonical Protobuf schemas (apache.flagon.userale.v1)
├── products/
│   ├── userale/
│   │   ├── packages/
│   │   │   ├── flagon-userale/            # UserALE.js core TypeScript/JS client library
│   │   │   └── flagon-userale-ext/        # Chrome/Firefox MV3 browser extension (Plasmo)
│   │   └── example/
│   │       ├── server/                    # Local HTTP/WebSocket/OTLP collector example server
│   │       └── otel-demo/                 # Full-stack OTel Collector + Grafana + Loki + Tempo demo
│   └── distill/                           # Python behavioral analytics & graph toolkit
├── examples/
│   └── elk/                               # Docker Compose & Kubernetes ELK stack examples
└── site/                                  # Jekyll source for https://flagon.apache.org/
```

---

## Products & Capabilities

### 1. [Apache Flagon UserALE.js](./products/userale/packages/flagon-userale/README.md)
Zero-dependency client-side instrumentation library (`ESM` + `IIFE` script tag) that automatically captures DOM interactions, interval summaries, and custom application events.

- **Multiple Wire Exporters**:
  - **UserALE Flat JSON (`'userale-json'`)**: Default backward-compatible JSON array batch transport over `fetch` (with 48 KiB chunked `keepalive: true` delivery on `pagehide`).
  - **OpenTelemetry OTLP/JSON (`'otlp-json'`)**: Native `ExportLogsServiceRequest` exporter (`OtlpJsonExporter`) with `Resource` attribute hoisting, nanosecond `BigInt` timestamps, OTel Event naming (`eventName` / `event.name`), structured `kvlistValue` body, and W3C TraceContext (`traceId`, `spanId`) correlation.
  - **OpenTelemetry JS SDK Bridge (`OtelSdkExporter`)**: Routes UserALE logs directly into an existing `@opentelemetry/api-logs` `Logger`.
  - **Protobuf v1 Canonical JSON (`'proto-json'`)**: Serializes batches conforming to [`proto/apache/flagon/userale/v1/log.proto`](./proto/apache/flagon/userale/v1/log.proto) (`apache.flagon.userale.v1.LogBatch`).
  - **WebSocket (`'ws'`)**: Persistent streaming transport for `ws://` and `wss://` endpoints.

### 2. [UserALE Browser Extension](./products/userale/packages/flagon-userale-ext/README.md)
Manifest V3 browser extension for Chrome and Firefox that injects UserALE into pages matching a configurable URL allowlist, complete with options for **Exporter Format** (`UserALE JSON`, `OpenTelemetry (OTLP/JSON)`, `Protobuf v1 JSON`), HTTP Basic Auth, OAuth PKCE, and custom JSON headers.

### 3. [Apache Flagon Distill](./products/distill/README.md)
Python behavioral analytics package (`flagon-distill`) for session segmentation, funnel conversion analysis, and directed clickstream graph modeling. Seamlessly ingests UserALE flat JSON (`v2.3+`), Protobuf v1 `LogBatch` JSON, and OpenTelemetry OTLP/JSON (`ExportLogsServiceRequest`) payloads.

---

## Quick Start

### Development Environment (Nix)
This repository includes a reproducible [`flake.nix`](./flake.nix) providing Node.js, `pnpm`, TypeScript, Python, `buf`, and `lefthook`:

```bash
nix develop
```

### Build & Test UserALE.js
```bash
cd products/userale
pnpm install
pnpm build
pnpm --dir packages/flagon-userale test
```

### Run the 5-Minute OpenTelemetry + Grafana Demo
Spin up an OpenTelemetry Collector, Loki, Tempo, and pre-provisioned Grafana dashboard correlating browser clicks with distributed traces:

```bash
cd products/userale/example/otel-demo
docker compose up -d
# Open http://localhost:8080 (demo app) and http://localhost:3000 (Grafana)
```

### Build & Test Distill (Python)
```bash
cd products/distill
poetry install --all-groups
poetry run pytest
```

---

## Documentation & Community

- 📚 [Apache Flagon Website & Docs](https://flagon.apache.org/)
- 🤝 [Contributing Guide](./CONTRIBUTING.md)
- 🐛 [GitHub Issues](https://github.com/apache/flagon/issues)
- 💬 [Mailing Lists](https://flagon.apache.org/community/) (`dev@flagon.apache.org`)