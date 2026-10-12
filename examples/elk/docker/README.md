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

# Apache Flagon UserALE + ELK Stack Docker Example

This directory contains a pre-configured **Elasticsearch + Logstash + Kibana (ELK)** Docker Compose deployment adapted from [`deviantony/docker-elk`](https://github.com/deviantony/docker-elk) alongside a containerized example web page instrumented with **Apache Flagon UserALE.js**.

> **Looking for 100% Apache-2.0 or OpenTelemetry stacks?**
> - **OpenSearch + OpenTelemetry Collector (`Apache-2.0`)**: [`../../opensearch/README.md`](../../opensearch/README.md)
> - **All-Apache Behavioral Lakehouse (Kafka + Iceberg + DataFusion + Distill)**: [`../../apache-lakehouse/README.md`](../../apache-lakehouse/README.md)
> - **OpenTelemetry + Grafana/Loki/Tempo**: [`../../../products/userale/example/otel-demo/README.md`](../../../products/userale/example/otel-demo/README.md)

---

## How This Differs from Stock `docker-elk`

1. **Logstash HTTP Input & UserALE Pipeline ([`logstash/pipeline/logstash.conf`](./logstash/pipeline/logstash.conf))**:
   - Exposes an HTTP input listener on port `50000` with CORS headers enabled so browser pages instrumented with UserALE.js can `POST` JSON log batches directly.
   - Parses JSON batches and strips internal Logstash transport metadata before indexing into Elasticsearch.
2. **Elasticsearch Index Template ([`logstash/templates/userale.json`](./logstash/templates/userale.json))**:
   - Maps UserALE fields (`target`, `path`, `pageUrl`, `pageTitle`, `clientTime`, `microTime`, `location`, `scrnRes`, `type`, `logType`, `userAction`, `details`, `userId`, `sessionId`, `toolName`, `toolVersion`, `useraleVersion`) with appropriate keyword, numeric, and date types in the `userale` index.
3. **Instrumented Example Site ([`site/Dockerfile`](./site/Dockerfile))**:
   - Builds and serves the UserALE example web application on `http://localhost:8080`, pre-configured to send behavioral telemetry to Logstash at `http://localhost:50000`.

---

## Prerequisites

- Docker Engine & Docker Compose (`docker compose` or `docker-compose`)
- At least 4 GB of RAM allocated to Docker for Elasticsearch

---

## Running the Example

1. **Initialize Elasticsearch users and roles**:

```bash
docker compose up setup
```

2. **Start the full stack (Elasticsearch, Logstash, Kibana, and the instrumented example site)**:

```bash
docker compose up -d
```

3. **Generate Behavioral Telemetry**:
   - Open [`http://localhost:8080`](http://localhost:8080) in your browser.
   - Click buttons, type into form inputs, hover, and scroll to emit `raw`, `interval`, and `custom` UserALE logs to Logstash (`http://localhost:50000`).

4. **Explore & Query Logs in Kibana**:
   - Open [`http://localhost:5601`](http://localhost:5601) and log in with the default credentials defined in [`.env`](./.env) (`elastic` / `changeme`).
   - Navigate to **Stack Management -> Index Patterns** (or **Data Views**) and create a pattern matching `userale*` using `clientTime` as the timestamp field.
   - Open **Discover** to inspect and filter live UserALE interaction events.

5. **Stop the Stack**:

```bash
docker compose down -v
```
