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

# Apache Flagon UserALE + OpenSearch (`Apache-2.0`) Example

This directory provides a 100% `Apache-2.0`-licensed **OpenTelemetry Collector + OpenSearch + OpenSearch Dashboards** deployment (for both **Docker Compose** and **Kubernetes**) as an open-source replacement for the legacy ELK (`examples/elk/`) stack.

> **Looking for the All-Apache Lakehouse (`Apache Kafka` + `Apache Iceberg` + `Apache DataFusion` + `Apache Superset` + `Distill`)?** See [`../apache-lakehouse/README.md`](../apache-lakehouse/README.md).
> **Looking for OpenTelemetry + Grafana/Loki/Tempo?** See [`../../products/userale/example/otel-demo/README.md`](../../products/userale/example/otel-demo/README.md).

---

## Architecture

```
Browser (UserALE.js OtlpJsonExporter)
   │  POST http://localhost:4318/v1/logs (OTLP/JSON + W3C traceId/spanId)
   ▼
OpenTelemetry Collector (otelcol-contrib, Apache-2.0)
   ├──► OpenSearch (:9200, Apache-2.0)
   │       ├── flagon-userale-logs   (Raw, Interval, Custom, Mutation, Replay logs)
   │       └── flagon-userale-traces (Correlated W3C distributed traces)
   ▼
OpenSearch Dashboards (:5601, Apache-2.0)
```

---

## 1. Docker Compose Quickstart

### Step 1: Start OpenSearch, OpenSearch Dashboards, and the OpenTelemetry Collector

```bash
docker compose -f examples/opensearch/docker-compose.yml up -d
```

### Step 2: Apply the UserALE Index Template (Optional, Recommended for Flat JSON Ingest)

```bash
curl -X PUT "http://localhost:9200/_index_template/flagon-userale" \
  -H "Content-Type: application/json" \
  -d @examples/opensearch/userale-index-template.json
```

### Step 3: Send Telemetry from UserALE.js

Configure UserALE.js in your application (or open `products/userale/example/otel-demo/index.html`) to export OTLP/JSON to `http://localhost:4318/v1/logs`:

```javascript
import * as userale from "flagon-userale";

userale.options({
  url: "http://localhost:4318/v1/logs",
  exporterFormat: "otlp-json",
  toolName: "my-web-app",
  toolVersion: "1.0.0",
  observeMutations: true,
  detectRageClicks: true,
});
```

### Step 4: Explore in OpenSearch Dashboards

1. Open [http://localhost:5601](http://localhost:5601).
2. Go to **Stack Management -> Index Patterns** and create an index pattern matching `flagon-userale*` using `@timestamp` (or `clientTime` for direct JSON ingestion) as the time field.
3. Open **Discover** to query clicks, rage-clicks (`attributes.flagon.event_type: "rage_click"`), DOM mutations (`attributes.flagon.log_type: "mutation"`), and correlated `traceId` spans.

### Step 5: Tear Down

```bash
docker compose -f examples/opensearch/docker-compose.yml down -v
```

---

## 2. Kubernetes Deployment

To deploy the OpenTelemetry Collector + OpenSearch + OpenSearch Dashboards stack in a Kubernetes cluster (such as `kind`, `minikube`, or an enterprise cluster):

```bash
kubectl apply -f examples/opensearch/kubernetes/opensearch.yaml
kubectl -n flagon-opensearch port-forward svc/otel-collector 4318:4318 &
kubectl -n flagon-opensearch port-forward svc/opensearch-dashboards 5601:5601 &
```
