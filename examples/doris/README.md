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

# Apache Flagon UserALE.js + Apache Doris (`100% Apache-2.0`)

This directory provides a **100% Apache Software Foundation (`Apache-2.0`)** real-time behavioral analytics and log search deployment combining **Apache Flagon UserALE.js**, **OpenTelemetry Collector (`dorisexporter`)**, **Apache Doris**, and **Apache Flagon Distill**.

---

## Why Apache Doris for UserALE Behavioral Telemetry?

[**Apache Doris**](https://doris.apache.org/) is a real-time MPP analytical database that replaces legacy ELK / OpenSearch log clusters while offering full SQL OLAP:

1. **Native `VARIANT` Semi-Structured JSON + Inverted Indexes**: Doris stores nested UserALE/OTLP attributes (`flagon.target_rect`, `flagon.mutation`, `flagon.replay`) with automatic sub-column columnarization and full-text inverted indexes at a fraction of Elasticsearch's storage and memory footprint.
2. **Official OpenTelemetry Collector `dorisexporter`**: `otelcol-contrib` ships with a native `dorisexporter` that automatically creates the `flagon_otel.otel_logs` and `flagon_otel.otel_traces` tables via MySQL port `9030` and streams batches via Doris HTTP Stream Load (`8030`).
3. **Standard MySQL Wire Protocol for Distill & Superset**: Connect **Apache Flagon Distill** (Python/Pandas) or **Apache Superset** directly to Doris on port `9030` to run SQL funnel window queries and Python graph/frustration analytics.

---

## Architecture

```
Browser (Apache Flagon UserALE.js — OtlpJsonExporter)
   │  POST http://localhost:4318/v1/logs (OTLP/JSON + W3C traceId/spanId)
   ▼
OpenTelemetry Collector (otelcol-contrib, dorisexporter, Apache-2.0)
   ├── DDL (MySQL :9030)       ──► Auto-creates flagon_otel.otel_logs & otel_traces
   └── Stream Load (HTTP :8030)──► Real-time columnar + inverted-index ingestion
   ▼
Apache Doris FE/BE (:8030 / :9030, Apache-2.0)
   ├──► SQL Clickstream Funnels, Rage-Click Aggregations & Trace Correlation
   ├──► Apache Flagon Distill (Python UX Frustration, Spatial Heatmaps, DiGraphs)
   └──► Apache Superset Dashboards
```

---

## Quickstart

### Step 1: Start Apache Doris and the OpenTelemetry Collector

```bash
docker compose -f examples/doris/docker-compose.yml up -d
```

- **OTLP HTTP Collector Endpoint**: `http://localhost:4318/v1/logs`
- **Apache Doris Web UI & HTTP Port**: [http://localhost:8030](http://localhost:8030)
- **Apache Doris MySQL Protocol Port**: `localhost:9030` (user: `root`, password: empty)

### Step 2: Send Telemetry from UserALE.js

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

### Step 3: Query Behavioral Events & Traces in Apache Doris via SQL

Connect with any MySQL client (`mysql -h 127.0.0.1 -P 9030 -u root flagon_otel`):

```sql
-- 1. Inspect recent UserALE interactions and correlated W3C trace IDs
SELECT
  timestamp,
  service_name,
  trace_id,
  span_id,
  body,
  log_attributes['flagon.event_type'] AS event_type,
  log_attributes['flagon.target']     AS target
FROM flagon_otel.otel_logs
ORDER BY timestamp DESC
LIMIT 20;

-- 2. Aggregate rage-clicks and DOM mutations by page URL
SELECT
  log_attributes['page.url']          AS page_url,
  log_attributes['flagon.event_type'] AS event_type,
  COUNT(*)                            AS event_count
FROM flagon_otel.otel_logs
WHERE log_attributes['flagon.event_type'] IN ('rage_click', 'dead_click', 'mutation')
GROUP BY page_url, event_type
ORDER BY event_count DESC;
```

### Step 4: Tear Down

```bash
docker compose -f examples/doris/docker-compose.yml down -v
```
