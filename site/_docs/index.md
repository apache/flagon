---
title: About the Docs
component: flagon
permalink: /docs/
priority: 0
---

The **Apache Flagon** documentation is organized by component and covers client-side telemetry collection, behavioral analytics, and full-stack observability deployments:

- **[Reference Architectures & Deployments]({{ '/docs/deployments' | prepend: site.baseurl }})**: Turnkey Docker Compose stacks for OpenTelemetry + Grafana (`Loki` + `Tempo`), OpenSearch + Dashboards, Apache Lakehouse (`Kafka` + `Iceberg` + `Spark` + `Superset`), and Elastic Stack (`ELK`).
- **[Apache Flagon UserALE.js]({{ '/docs/useralejs' | prepend: site.baseurl }})**: Frontend behavioral telemetry, OpenTelemetry `OTLP/JSON` & `Protobuf v1` exporters, W3C TraceContext correlation, DOM mutation & rage-click detection, and two-layer session replay (`rrweb`).
- **[Apache Flagon Distill]({{ '/docs/distill' | prepend: site.baseurl }})**: Python behavioral analytics framework for multi-format UserALE schema validation, UX frustration & spatial analytics, clickstream graphs, Markov transition matrices, and session segmentation.
- **[Contributing Guide]({{ '/docs/contributing' | prepend: site.baseurl }})**: Monorepo setup with Nix, `pnpm`, `uv`, and `buf`.
