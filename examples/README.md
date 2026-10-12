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

# Apache Flagon Deployment & Analytics Examples

Apache Flagon UserALE.js and Distill support multiple open-standard wire formats (`userale-json`, `otlp-json`, and `proto-json`), allowing you to choose the right backend architecture for your workload:

| Example | Stack & License | Best For |
| :--- | :--- | :--- |
| **[OpenTelemetry + Grafana/Loki/Tempo](../products/userale/example/otel-demo/README.md)** | `OtlpJsonExporter` $\rightarrow$ OTel Collector $\rightarrow$ Loki + Tempo + Grafana | **SRE & Observability Teams**: Correlating frontend user interactions, rage-clicks, and errors with distributed backend traces (`traceId` / `spanId`). |
| **[All-Apache Behavioral Lakehouse](./apache-lakehouse/README.md)** | `OtlpJsonExporter` $\rightarrow$ OTel Collector $\rightarrow$ **Apache Kafka** $\rightarrow$ **Apache Iceberg / Parquet** $\rightarrow$ **Apache DataFusion** + **Apache Flagon Distill** (`100% Apache-2.0`) | **Product Analytics & Data Science at Scale**: Columnar storage without inverted-index bloat, fast SQL window functions (`LEAD`/`LAG` funnels), and zero-copy Python analytics with Distill. |
| **[OpenSearch Stack](./opensearch/README.md)** | `OtlpJsonExporter` $\rightarrow$ OTel Collector $\rightarrow$ **OpenSearch** + **OpenSearch Dashboards** (`100% Apache-2.0`) | **Search & Log Indexing**: Drop-in `Apache-2.0` open-source replacement for the legacy ELK stack (Docker Compose + Kubernetes). |
| **[Legacy ELK Stack](./elk/docker/README.md)** | UserALE JSON $\rightarrow$ Logstash $\rightarrow$ Elasticsearch + Kibana | Legacy compatibility for existing Elasticsearch deployments. |
