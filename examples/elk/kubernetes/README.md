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

# Example Kubernetes Deployment (ELK)

This script and accompanying YAML files provide an example ELK stack Kubernetes deployment. This is intended to be a starting point for deploying a UserALE logging endpoint.

> **Note:** For a 100% `Apache-2.0`-licensed Kubernetes deployment using OpenTelemetry Collector + OpenSearch + OpenSearch Dashboards, see [`../../opensearch/kubernetes/opensearch.yaml`](../../opensearch/kubernetes/opensearch.yaml).

Prerequisites: A bash environment and Kubernetes running with at least 4 GB memory and 4 CPU cores.

Use the `run.sh` script to deploy the stack.

`test.py` is included as a utility to verify that logs are correctly posted to Elasticsearch locally. To run `test.py`, first install its requirements via `uv pip install -r requirements.txt` (or `pip install -r requirements.txt`).
