CHANGELOG
---------

### 1.1.0 (2026-04-11)
- Upgraded the interactive UserALE.js live demo (`_includes/useralejsDemo.html` & `js/userale-demo.min.js`) to UserALE 2.5 with a live Wire Format Switcher (`UserALE JSON`, `OTLP/JSON`, `Protobuf v1 JSON`), `RageClickDetector` trigger, `MutationCollector` DOM mutation trigger, and `data-userale-redact` PII scrubbing demo.
- Expanded Distill documentation with dedicated pages for Frustration & Spatial Analytics (`/docs/distill/behavioral/`), Clickstream Graphs & Funnels (`/docs/distill/graphs/`), and Segmentation & Multi-Format Ingestion (`/docs/distill/segmentation/`).
- Added a Reference Architectures & Deployments guide (`/docs/deployments/`) covering the OpenTelemetry + Grafana, OpenSearch, Apache Lakehouse, and ELK Docker Compose stacks.
- Modernized `site/Dockerfile` (`ruby:3.3-slim`), `site/build.sh`, and `site/README.md`.
- Updated UserALE.js and Distill documentation for 2.5 features (OpenTelemetry OTLP/JSON & SDK exporters, Protobuf v1 schemas, two-layer session replay, behavioral frustration & spatial analytics, `uv` workflow, and OpenSearch / Apache Lakehouse deployment examples).

### 1.0.2 (2025-04-03)
- Updated site build process.

### 1.0.1 (2023-6-10)
- Remove "Incubating" Status Refs
- Update Gembuild
- Update Modules

### 1.0.1 (2017-05-25)
- Updated contributing guide
- Fixed broken links
- Added Dockerfile to show how to build site
- Added README and CHANGELOG
- Updated UserALE.pyqt5 name to UserALE.py

### 1.0.0 (2017-01-12)
- Initial commit.
