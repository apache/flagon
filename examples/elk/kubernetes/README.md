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

# Example Kubernetes deployment

This script and accompanying yaml files provide an example ELK stack kubernetes deployment. This is intended to be a starting point for deploying a userale logging end point. 

Prerequisites: A bash enviroment and Kubernetes running with at least 4 GB memory and 4 CPU cores.

Use the `run.sh` script to deploy the stack.

`test.py` is included as a utility to verify that logs are correctly posted to elastic locally. To run `test.py`, you must first install it's requirements via `pip install -r requirements.txt`.
