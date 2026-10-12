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

# The "All-Apache" Behavioral Lakehouse Example

**Apache Flagon UserALE.js + Apache Kafka + Apache Iceberg + Apache DataFusion + Apache Flagon Distill + Apache Superset**

This directory demonstrates a modern, **100% Apache Software Foundation (`Apache-2.0`)** streaming lakehouse and behavioral OLAP architecture for high-volume frontend telemetry.

---

## Why a Behavioral Lakehouse Instead of Legacy ELK?

1. **Zero Inverted-Index Amplification**: High-frequency UserALE interaction streams (`mousemove`/`scroll` intervals, `click` coordinates, `mutation` summaries, and `rrweb` session replay envelopes) are stored in columnar **Apache Parquet / Apache Iceberg** tables rather than expensive JVM heap and Lucene inverted indexes.
2. **Native SQL Window Functions for Funnels & Sequences**: Vectorized engines like **Apache DataFusion** (and **Apache Pinot** / **DuckDB**) execute ordered session window queries (`LEAD()`, `LAG()`, `OVER (PARTITION BY session_id ORDER BY client_time)`) in milliseconds.
3. **Zero-Copy Python Analytics with Apache Flagon Distill**: **Distill** reads Arrow/Parquet/Iceberg partitions directly into Python to compute UX frustration scores (`distill.frustration_score`), Markov transition matrices (`distill.transition_matrix`), spatial click heatmaps (`distill.click_heatmap_data`), and OpenTelemetry trace correlations (`distill.correlate_by_trace`).
4. **100% ASF Category-A Open Source**: Every component in this stack is governed by the Apache Software Foundation (or CNCF) under the permissive **Apache-2.0** license—no BSL 1.1 or AGPLv3 dependencies.

---

## Architecture

```
Browser (Apache Flagon UserALE.js — OtlpJsonExporter / ProtoJsonExporter)
   │  POST http://localhost:4318/v1/logs (OTLP/JSON + W3C traceId/spanId)
   ▼
OpenTelemetry Collector (otelcol-contrib, Apache-2.0)
   ├──► Apache Kafka (apache/kafka-native KRaft, Apache-2.0)
   │       Topic: flagon-userale-events
   ▼
Apache Iceberg REST Catalog + Apache Parquet Warehouse (Apache-2.0)
   ├──► Apache DataFusion / DuckDB SQL (Vectorized Funnels, Session Windows, Rage-Click OLAP)
   ├──► Apache Flagon Distill (Python Frustration, Spatial, Markov & OTel Trace Analytics)
   └──► Apache Superset (Interactive BI Dashboards)
```

---

## Quickstart

### 1. Run the Self-Contained Distill + Arrow/DataFusion Lakehouse Demo Script

You can run the end-to-end Python lakehouse & behavioral analytics pipeline immediately using `uv` inside the repository's Nix development shell:

```bash
nix develop -c uv run --no-project \
  --with networkx --with pandas --with plotly --with pydantic \
  --with dateparser --with pksuid --with pyarrow --with datafusion \
  python examples/apache-lakehouse/distill_lakehouse_demo.py
```

This script:
1. Normalizes a realistic **UserALE 2.5 OTLP/JSON** batch (containing `click`, `rage_click`, `mutation`, `scroll`, and `session_replay` events correlated with W3C `traceId`/`spanId` and `targetRect` geometry) via `distill.schemas.userale.extract_logs`.
2. Writes the normalized batch to an **Apache Arrow / Apache Parquet** lakehouse table (and demonstrates registering an **Apache Iceberg** table via `pyiceberg`).
3. Queries the table using **Apache DataFusion SQL** (`OVER (PARTITION BY session_id ORDER BY client_time)` window functions) to compute next-target transitions and per-page friction metrics.
4. Runs **Apache Flagon Distill 2.5** analytics (`session_summary`, `frustration_score`, `detect_rage_clicks`, `detect_dead_clicks`, `detect_dom_thrash`, `transition_matrix`, and `correlate_by_trace`).

---

### 2. Start the Streaming Docker Compose Stack (OTel Collector + Apache Kafka + Apache Iceberg REST Catalog)

```bash
docker compose -f examples/apache-lakehouse/docker-compose.yml up -d
```

- **OTLP HTTP Endpoint**: `http://localhost:4318/v1/logs` (CORS enabled for browser `fetch` / `keepalive`)
- **Apache Kafka Broker (KRaft)**: `localhost:9092` (topic: `flagon-userale-events`)
- **Apache Iceberg REST Catalog**: `http://localhost:8181`

To stop and clean up:

```bash
docker compose -f examples/apache-lakehouse/docker-compose.yml down -v
```
