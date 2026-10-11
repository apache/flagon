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

# Apache Flagon UserALE.js — OpenTelemetry + Grafana/Loki/Tempo Demo

This directory provides a zero-build, full-stack observability environment that ingests behavioral telemetry from **Apache Flagon UserALE.js** via OpenTelemetry (`OTLP/JSON`) into the **OpenTelemetry Collector**, stores logs in **Grafana Loki** and traces in **Grafana Tempo**, and visualizes both in **Grafana**.

## Architecture

```
Browser (UserALE.js OtlpJsonExporter)
   │  POST http://localhost:4318/v1/logs (OTLP/JSON + W3C traceId/spanId)
   ▼
OpenTelemetry Collector (otelcol-contrib:0.114.0)
   ├──► Grafana Loki (:3100/otlp)  ──┐
   └──► Grafana Tempo (:4317)      ──┼──► Grafana (:3000)
                                          "Apache Flagon UserALE — Behavioral Telemetry & Trace Correlation"
```

## 5-Minute Quickstart

1. **Build UserALE.js** (from `products/userale`):

   ```bash
   pnpm install
   pnpm run build
   ```

2. **Start the OpenTelemetry Collector, Loki, Tempo, and Grafana stack**:

   ```bash
   docker compose -f products/userale/example/otel-demo/docker-compose.yml up -d
   ```

3. **Open the Demo Page & Grafana**:
   - Open `products/userale/example/otel-demo/index.html` in your browser (or serve `products/userale` via any static server).
   - Click buttons, type in the search input, and click **"Simulate Traced Checkout API Call"** to emit a UserALE behavioral log correlated with a W3C `traceId` and `spanId`.
   - Open **Grafana** at [http://localhost:3000/d/flagon-userale-otel](http://localhost:3000/d/flagon-userale-otel) (no login required).
   - Expand any log row with a `traceId` in the **Live UserALE OTLP Behavioral Stream** panel and click the **Tempo** link next to `TraceID` to jump directly from the user's DOM interaction to the backend distributed trace!

4. **Tear Down**:
   ```bash
   docker compose -f products/userale/example/otel-demo/docker-compose.yml down
   ```

## CORS Configuration on the OpenTelemetry Collector

Because UserALE.js ships telemetry directly from the browser (`Content-Type: application/json`, plus optional `Authorization` or `x-api-key` headers), your OpenTelemetry Collector `otlp` HTTP receiver must enable `cors`:

```yaml
receivers:
  otlp:
    protocols:
      http:
        endpoint: 0.0.0.0:4318
        cors:
          allowed_origins:
            - "https://your-app.example.com"
          allowed_headers:
            - "Content-Type"
            - "Authorization"
            - "x-api-key"
            - "traceparent"
            - "tracestate"
```
