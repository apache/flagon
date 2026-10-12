---
title: Reference Architectures & Deployments
component: flagon
permalink: /docs/deployments/
priority: 1
---

Apache Flagon ships four production-modeled **Docker Compose reference stacks** in the [`apache/flagon`](https://github.com/apache/flagon) repository so you can evaluate and deploy end-to-end behavioral observability pipelines in minutes.

---

## Choosing a Reference Stack

| Stack | Directory | Best For | Primary Storage & Query Engine | Visualization |
|---|---|---|---|---|
| **1. OpenTelemetry + Grafana** | [`products/userale/example/otel-demo/`](https://github.com/apache/flagon/tree/master/products/userale/example/otel-demo) | Cloud-native APM & full-stack trace correlation (`traceId` / `spanId` joining frontend clicks with backend spans) | Grafana Loki (Logs) + Grafana Tempo (Traces) via OTel Collector | Grafana (pre-provisioned dashboard) |
| **2. OpenSearch** | [`examples/opensearch/`](https://github.com/apache/flagon/tree/master/examples/opensearch) | Apache-2.0 search, real-time UX friction monitoring, and Distill enrichment | OpenSearch 2.x (`userale` & `flagon-distill-analytics` indices) | OpenSearch Dashboards (7 visualizations) |
| **3. Apache Lakehouse** | [`examples/apache-lakehouse/`](https://github.com/apache/flagon/tree/master/examples/apache-lakehouse) | Petabyte-scale event streaming, ACID table storage, and SQL/Spark behavioral data science | Apache Kafka + Apache Iceberg (`demo.flagon.userale_events` & `distill_sessions`) + Apache Spark | Apache Superset (SQL Lab + dashboard) |
| **4. Elastic Stack (ELK)** | [`examples/elk/`](https://github.com/apache/flagon/tree/master/examples/elk) | Classic Elasticsearch + Logstash ingestion pipelines | Elasticsearch 8.15 via Logstash HTTP input | Kibana 8.15 (saved visualizations) |

---

## 1. OpenTelemetry Collector + Grafana + Loki + Tempo

Located in [`products/userale/example/otel-demo/`](https://github.com/apache/flagon/tree/master/products/userale/example/otel-demo), this stack demonstrates zero-plugin ingestion of UserALE `OTLP/JSON` (`ExportLogsServiceRequest`) alongside W3C TraceContext (`traceparent`) propagation.

### Architecture
```text
Browser (UserALE 2.5 OtlpJsonExporter + W3C traceparent)
   ├── POST /v1/logs ────► OpenTelemetry Collector ──► Grafana Loki (flagon.* attributes + replay frames)
   └── GET /api/checkout ─► Demo Checkout API ───────► OpenTelemetry Collector ──► Grafana Tempo (distributed traces)
                                                                                          │
                                                                                          ▼
                                                                             Grafana Unified Dashboard
```

### Quick Start
```bash
cd products/userale/example/otel-demo
docker compose up --build
```
- **Interactive Demo Storefront**: `http://localhost:8000`
- **Grafana Dashboard**: `http://localhost:3000` (anonymous Viewer enabled; pre-provisioned under *Dashboards -> Apache Flagon - UserALE & OpenTelemetry Correlated Observability*)

---

## 2. OpenSearch & OpenSearch Dashboards + Distill

Located in [`examples/opensearch/`](https://github.com/apache/flagon/tree/master/examples/opensearch), this 100% Apache-2.0 stack ingests UserALE flat JSON, Protobuf v1 `LogBatch`, or OTLP/JSON logs into OpenSearch and runs a continuous **Distill Analytics Worker** to compute session summaries, composite UX frustration scores, rage/dead-click counts, and scroll depth metrics.

### Architecture
```text
Browser (UserALE 2.5) ──► Flagon Ingest Bridge (:8000) ──► OpenSearch (`userale` index)
                                                                │
                                                                ▼
OpenSearch Dashboards (:5601) ◄── (`flagon-distill-analytics`) ◄── Distill Analytics Worker
```

### Quick Start
```bash
cd examples/opensearch
docker compose up --build
```
- **Demo Storefront & Ingest Bridge**: `http://localhost:8000`
- **OpenSearch Dashboards**: `http://localhost:5601` (`Apache Flagon — UserALE & Distill Behavioral Observability`)

---

## 3. All-Apache Behavioral Lakehouse (Kafka + Iceberg + Spark + Superset)

Located in [`examples/apache-lakehouse/`](https://github.com/apache/flagon/tree/master/examples/apache-lakehouse), this stack streams UserALE telemetry through **Apache Kafka (KRaft)** into **Apache Iceberg** tables stored on MinIO S3, enriches sessions with **Apache Flagon Distill**, provides interactive **Apache Spark SQL / PySpark** notebooks, and visualizes metrics in **Apache Superset**.

### Architecture
```text
Browser (UserALE 2.5) ──► Kafka Ingest Gateway (:8000) ──► Apache Kafka (`flagon.userale.raw`)
                                                                  │
                                                                  ▼
                                                    Distill Lakehouse Consumer
                                                                  │
                                    ┌─────────────────────────────┴─────────────────────────────┐
                                    ▼                                                           ▼
               Iceberg: `demo.flagon.userale_events`                       Iceberg: `demo.flagon.distill_sessions`
                                    │                                                           │
                                    └─────────────────────────────┬─────────────────────────────┘
                                                                  ▼
                                          Apache Spark (:8888) & Apache Superset (:8088)
```

### Quick Start
```bash
cd examples/apache-lakehouse
docker compose up --build
```
- **Demo Storefront & Kafka Gateway**: `http://localhost:8000`
- **Apache Superset**: `http://localhost:8088` (`admin` / `admin`)
- **Apache Spark + Iceberg JupyterLab**: `http://localhost:8888`

---

## 4. Elastic Stack (Elasticsearch + Logstash + Kibana)

Located in [`examples/elk/`](https://github.com/apache/flagon/tree/master/examples/elk), this stack pairs Logstash HTTP ingestion (`:8100`) with Elasticsearch 8.15 and Kibana 8.15.

### Quick Start
```bash
cd examples/elk
docker compose up
```
- **Logstash UserALE Endpoint**: `http://localhost:8100`
- **Kibana**: `http://localhost:5601` (import `examples/elk/kibana/Apache Flagon Corso Dashboard.ndjson` under *Stack Management -> Saved Objects*)
