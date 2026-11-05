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

# Apache Flagon UserALE.js + Apache SkyWalking & BanyanDB (`100% Apache-2.0`)

This directory provides a **100% Apache Software Foundation (`Apache-2.0`)** full-stack observability deployment combining **Apache Flagon UserALE.js**, **OpenTelemetry Collector**, **Apache SkyWalking OAP + UI**, and **Apache SkyWalking BanyanDB**.

> **What is BanyanDB?**
> [**Apache SkyWalking BanyanDB**](https://skywalking.apache.org/docs/skywalking-banyandb/next/readme/) (`apache/skywalking-banyandb`) is a purpose-built, `Apache-2.0`-licensed observability database developed by the Apache SkyWalking PMC to ingest, index, and query traces, logs, and metrics at a fraction of the CPU and memory footprint of traditional JVM search clusters. Paired with SkyWalking's native UI, this stack replaces `Grafana + Loki + Tempo` with a 100% Apache-governed observability stack.

---

## Architecture

```
Browser (Apache Flagon UserALE.js — OtlpJsonExporter)
   │  POST http://localhost:4318/v1/logs (OTLP/JSON + W3C traceId/spanId)
   ▼
OpenTelemetry Collector (otelcol-contrib, Apache-2.0)
   │  OTLP gRPC (oap:11800)
   ▼
Apache SkyWalking OAP Server (:11800 / :12800, Apache-2.0)
   │  SW_OTEL_RECEIVER_ENABLED_HANDLERS="otlp-metrics,otlp-traces,otlp-logs"
   ├──► Apache SkyWalking BanyanDB (:17912 / :17913, Apache-2.0)
   └──► Apache SkyWalking UI (:8080, Apache-2.0)
```

---

## Quickstart

### Step 1: Start SkyWalking, BanyanDB, and the OpenTelemetry Collector

```bash
docker compose -f examples/skywalking/docker-compose.yml up -d
```

- **OTLP HTTP Collector Endpoint**: `http://localhost:4318/v1/logs` (CORS enabled for browser `fetch`)
- **Apache SkyWalking UI**: [http://localhost:8080](http://localhost:8080)
- **Apache SkyWalking BanyanDB UI**: [http://localhost:17913](http://localhost:17913)

### Step 2: Configure UserALE.js to Export OTLP/JSON

```javascript
import * as userale from "flagon-userale";

userale.options({
  otlpEndpoint: "http://localhost:4318",
  exporterType: "otlp",
  toolName: "my-web-app",
  toolVersion: "2.5.0",
  observeMutations: true,
});

userale.startSessionReplay({
  observeMutations: true,
  detectRageClicks: true,
});
```

### Step 3: Explore Behavioral Logs & Traces in Apache SkyWalking UI

1. Open [http://localhost:8080](http://localhost:8080).
2. Navigate to **General Service -> Services -> `my-web-app` -> Logs** to inspect structured UserALE interaction logs (`click`, `rage_click`, `mutation`, `session_replay`).
3. Click any log entry carrying a W3C `traceId` to jump directly to the correlated distributed trace in SkyWalking.

### Step 4: Tear Down

```bash
docker compose -f examples/skywalking/docker-compose.yml down -v
```
