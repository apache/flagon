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
/examples # Integration examples
/products
├── userale
│ └── packages
│  ├── flagon-userale # JavaScript client instrumentation library
│  └── flagon-userale-ext # Browser extension for deploying UserALE
└── distill # Data processing toolkit (Python)
/site # Code for https://flagon.apache.org/
```

## Products

- [UserALE Core Library](./products/userale/packages/flagon-userale/README.md)
- [UserALE Browser Extension](./products/userale/packages/flagon-userale-ext/README.md)
- [Distill Toolkit](./products/distill/README.md)

## Documentation

- 📚 [Flagon Website](https://flagon.apache.org/)