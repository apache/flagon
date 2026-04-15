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

# Apache Flagon

Flagon is a collection of open-source tools for user behavior analytics, including instrumentation libraries and analytics pipelines. This monorepo contains multiple Flagon products in a unified codebase.

## Repository Structure
```text
/products
├── userale
│ └── packages
│  ├── core-sdk    # flagon-userale — JS instrumentation library (ESM + types)
│  ├── iife        # flagon-userale-iife — script-tag drop-in build
│  └── extension   # flagon-userale-ext — browser extension (Chrome MV3 / Firefox)
└── distill        # Data processing toolkit (Python)
/site              # Code for https://flagon.apache.org/
docker-compose.yml # Shared OTLP collector (Jaeger)
```

## Products

- [UserALE](./products/userale/README.md) — behavioral telemetry for web applications
  - [Core SDK](./products/userale/packages/core-sdk/README.md) (`flagon-userale`)
  - [IIFE build](./products/userale/packages/iife/README.md) (`flagon-userale-iife`)
  - [Browser Extension](./products/userale/packages/extension/README.md) (`flagon-userale-ext`)
- [Distill Toolkit](./products/distill/README.md)

## Documentation

- 📚 [Flagon Website](https://flagon.apache.org/)