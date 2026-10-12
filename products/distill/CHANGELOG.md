<!--
  Licensed to the Apache Software Foundation (ASF) under one or more
  contributor license agreements.  See the NOTICE file distributed with
  this work for additional information regarding copyright ownership.
  The ASF licenses this file to You under the Apache License, Version 2.0
  (the "License"); you may not use this file except in compliance with
  the License.  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
-->

# Changelog

## Unreleased

### Features
- **Multi-Format UserALE Ingestion (`distill.schemas.userale`)**: Added `extract_logs` and `normalize_userale_dict` to seamlessly ingest UserALE flat JSON (`v2.3`–`v2.5`), Protobuf v1 `LogBatch` JSON (`ProtoJsonExporter`), and OpenTelemetry OTLP/JSON (`ExportLogsServiceRequest` from `OtlpJsonExporter`), upgraded to Pydantic v2.
- **Frustration & UX Friction Analytics (`distill.analytics.frustration`)**: Added `detect_rage_clicks`, `detect_dead_clicks`, `detect_dom_thrash`, and composite `[0.0, 100.0]` `frustration_score`.
- **Spatial & Viewport Analytics (`distill.analytics.spatial`)**: Added `click_heatmap_data`, `plot_click_heatmap`, and `scroll_depth_summary`.
- **OpenTelemetry & Session Replay Correlation (`distill.analytics.otel`)**: Added `correlate_by_trace` and `extract_replay_envelopes`.
- **Graph & Statistical Analytics (`distill.analytics.graph`, `distill.analytics.stat`)**: Added first-order Markov `transition_matrix` and `session_summary`, and fixed `funnel` and `sankey` graph construction.

### Build & Tooling
- Migrated package management, lockfile (`uv.lock`), and CI matrix (`Python 3.10`–`3.13`) from Poetry to `uv` (PEP 621 `pyproject.toml` + `hatchling`).

## v0.1.0 (2023-09-21)

### Refactor

- **Makefile**: run pre-commit hooks prior to commitizen

## 0.0.6 (2023-08-18)

- Migrate package and build management to poetry
- Remove deprecated setup code

## 0.0.5 (2017-06-30)

- Updated elasticsearch-dsl to 5.4.1
- Removed all support for UserALE 3.0
- General cleanup

## 0.0.4 (2016-09-19)

- Moved to Apache.
- Updated all documentation.
- Added License headers
- Docker compose file added to assist deployment of ELK stack with Distill

## 0.0.3 (2016-07-22)

- Moved CRUD operations from UserAle model to Brew model.
- Added API specs to segment UserAle data from Elasticsearch
- Added deployment instructions 

## 0.0.2 (2016-06-14)

- Completed index route for status endpoint which lists all applications registered and their document count segmented by type.
- Updated setup.py to reference deploy scripts
- Example configuration to deploy Distill with Gunicorn and Nginx for Linux/Mac users
- Added UserAle and Stout classes.
- Updated requirements.txt for deployment.

## 0.0.1 (2016-04-01)

- Initial alpha release.
