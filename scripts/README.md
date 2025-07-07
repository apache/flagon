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

Release Scripts and Helpers
===========================

This folder contains a number of items that will assist in the production of Apache Flagon releases.

Release scripts - make-release-artifacts.sh
-------------------------------------------
`make-release-artifacts.sh` will produce the release artifacts with appropriate signatures. It is recommended to use
this script rather than "rolling your own" or using a manual process, as this script codifies several Apache
requirements about the release artifacts.

These scripts are fully documented in **[Release Process](https://cwiki.apache.org/confluence/display/FLAGON/UserALE.js+Release+Management+Procedure)** page on Confluence.

Quickstart
----------
1. Configure environment/prepare for release. 
   ```bash
    ./clone-and-configure-repos.sh useralejs
   ```
   Ensure $APACHE_DIST_SVN_DIR is set in your environment.

1. Change working directory to incubator-flagon-useralejs.
   ```bash
   cd incubator-flagon-useralejs
   # git checkout "Branch_Name"
   ```
   
1. Release.
   ```bash
   ../make-release-artifacts.sh -r 1
   ```