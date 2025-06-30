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
Changelog
=========


Apache Flagon UserALE.js 2.4.0 (2024-03-21)
-------------------------------
* Release Notes - Flagon - Version UserALE.js 2.4.0
* [Closed Tickets](https://github.com/apache/incubator-flagon-useralejs/projects/9)
    * Refactors Map and Filter APIs as generalized callbacks for functionality
    * Updates packages and dependencies
    * Adds additional examples (callback functions)
    * Updates to update deprecated downstream dev dependencies
    * Changes to documentation, updated examples
    * New browser extension setting, password, for basic auth.
    * New log fields httpSessionId and browserSessionId
    * Callbacks for auth headers and custom headers.
    * Example json schema added.

Apache Flagon UserALE.js (Incubating) 2.3.0 (2022-04-05)
-------------------------------
* Release Notes - Flagon - Version UserALE.js 2.3.0
* [Closed Tickets](https://github.com/apache/incubator-flagon-useralejs/projects/9)
    * Fixes issue in autostart configurations and start(), stop() export usage
    * Adds additional unit tests for autostart configurations
    * Adds React App.js example/test utility
    * Adds additional examples (non-user log examples)
    * Minor updates to update deprecated downstream dev dependencies
    * Minor changes to documentation, updated examples

Apache Flagon UserALE.js (Incubating) 2.2.0 (2021-05-20)
-------------------------------
* Release Notes - Flagon - Version UserALE.js 2.2.0
* [Closed Tickets](https://github.com/apache/incubator-flagon-useralejs/projects/7)
    * Fixes issue in SendOnClose that caused end-of-page-lifecyle events not to be logged
    * Modernizes build pipeline (now uses rollup instead of gulp)
    * Adds Cypress Journey testing framework
    * Modernizes Unit Testing Framework
    * Adds 'PageLoad' logs, with load time metrics
    * Minor updates to update deprecated downstream dev dependencies
    * Minor changes to documentation, updated examples

Apache Flagon UserALE.js (Incubating) 2.1.1 (2021-02-20)
-------------------------------
* Release Notes - Flagon - Version UserALE.js 2.1.1
* [Closed Tickets](https://github.com/apache/incubator-flagon-useralejs/projects/3)
    * Fixes bug in sessionId creation at initial PageLoad
    * Updates Node.js/NPM Engine support (tested 12.x, 13.x, 14.x, 15.x)
    * Minor updates to resolve extant vulnerabilities in dependency tree
    * Minor updates to update deprecated downstream dev dependencies
    * Minor updates to build pipelines to accommodate dependency updates
    * Minor changes to documentation
    * Minor QOL upgrades to UserALE.js repository (CI, Dependabot)

Apache Flagon UserALE.js (Incubating) 2.1.0 (2020-02-07)
-------------------------------
* Release Notes - Flagon - Version UserALE.js 2.1.0
* [Release Report](https://issues.apache.org/jira/secure/ReleaseNote.jspa?version=12345442&styleName=Text&projectId=12320621&Create=Create&atl_token=A5KQ-2QAV-T4JA-FDED_8301b4e9c1c91354ea85ab02c89ec979db077d9a_lin)

* Sub-task
    * [FLAGON-440] - create sendOnRefresh function in sendlog
    * [FLAGON-441] - utilize sessionStorage for sessionId so that sessionId isn't cleared until the tab is closed.
    * [FLAGON-442] - Update documentation for how to pass local storage, cookie data to sessionId
    * [FLAGON-451] - Update unit tests to accommodate session storage features

* Bug
    * [FLAGON-341] - Web Extension Produces Duplicate Logs
    * [FLAGON-431] - Killing nodemon example server throws lifecycle error on node.js v12.7.0
    * [FLAGON-483] - userale.log & userale.packageCustomLog logs are not being indexed by ES
    * [FLAGON-486] - toolName does not populate in logs

* New Feature
    * [FLAGON-435] - track usage across multi-tab applications via script tag was: TabID to attach handlers
    * [FLAGON-436] - Print Screen Resolution

* Improvement
    * [FLAGON-434] - capture what is submitted via forms
    * [FLAGON-443] - Add Options API Example to UserALE.js Example
    * [FLAGON-478] - Update index.html to provide instructions for generating certain kinds of logs
    * [FLAGON-479] - update readme for package manager/compiler deployment example

* Test
    * [FLAGON-472] - test userale.js on node v > 13
    * [FLAGON-480] - Test Browser Plugin Behavior with UMD userale format
    * [FLAGON-481] - update top level readme for new Package loader deployment instructions
    * [FLAGON-484] - confirm that 'require' method works as well as 'import' for webpack example
    * [FLAGON-485] - Add prototype .asf.yaml file
    * [FLAGON-487] - test data-version in script and options params

* Task
    * [FLAGON-454] - Update eslint-utils to remove critical vulnerability in gulp-eslint v5.0
    * [FLAGON-455] - Integrate forms example into index.html
    * [FLAGON-456] - Develop npm example for including UserALE.js
    * [FLAGON-457] - Remove 'useraction' field from logstream
    * [FLAGON-467] - Add (custom) Log API examples
    * [FLAGON-468] - expose PackageLog and supporting functions to aide in custom logging
    * [FLAGON-469] - Need "meta" package function to add meta data to non HTML events
    * [FLAGON-470] - Expose event object in Package Log to allow users to add, extract properties to events
    * [FLAGON-471] - SetRequestHeader should include an Authorization option
    * [FLAGON-473] - update packagefile for new version and engines
    * [FLAGON-475] - Print Browser Types, Version

Apache Flagon UserALE.js (Incubating) 2.0.2 (2019-08-06)
-------------------------------
* Release Notes - Flagon - Version UserALE.js 2.0.2
* [Release Report](https://issues.apache.org/jira/secure/ReleaseNote.jspa?projectId=12320621&version=12345954)

* Sub-task
    * [FLAGON-423] - Update Package File to Fix Down Stream Dependencies

* Bug
    * [FLAGON-422] - Update NPM modules to fix prototype pollution issues in npm packages
    * [FLAGON-433] - FIx Package.json and Package-Log.json to resolve npm packaging issue

* Improvement
    * [FLAGON-432] - Improve UserALEjs Example Server Instructions

* Task
    * [FLAGON-424] - Update Gulp to 4.0.2 as matter of protocol post Prototype Pollution.
    * [FLAGON-425] - Update gulp-eslint
    * [FLAGON-426] - update rollup
    * [FLAGON-427] - update nodemon
    * [FLAGON-428] - update sinon
    * [FLAGON-429] - test userale.js builds and artifacts on npm 6.10
    * [FLAGON-430] - update rollup-plugin-license

Apache Flagon UserALE.js (Incubating) 2.0.0 (2019-06-20)
-------------------------------
* Release Notes - Flagon - Version UserALE.js 2.0.0
* [Release Report](https://issues.apache.org/jira/secure/ReleaseNote.jspa?projectId=12320621&version=12343068)

* Sub-task
    * [FLAGON-220] - Add interval log timeout
    * [FLAGON-231] - Add Micro Second Field in UserALE.js to cover Elastic indexing and time encoding issues.
    * [FLAGON-240] - Update Elasticsearch mapping to accurately parse clientTime variable from userale.js
    * [FLAGON-333] - Add pageURL to UserALE.js logs
    * [FLAGON-334] - Add pageTitle to UserALE.js
    * [FLAGON-337] - Add pageReferrer to UserALE.js

* Bug
    * [FLAGON-79] - clientTime is not properly formmated
    * [FLAGON-167] - Browser plugin CORS permissions
    * [FLAGON-169] - Browser Blocking Mixed Content
    * [FLAGON-221] - Elasticsearch 5.x does not support microsecond precision
    * [FLAGON-321] - Gulp Mocha Dependency Deprecation: Critical Command Injection Vulnerability
    * [FLAGON-322] - minimatch deprecation: ReDOS vulnerability
    * [FLAGON-323] - Update to Gulp 4.0.0
    * [FLAGON-324] - Example Page Does Not Generate Logs
    * [FLAGON-338] - Mocha unit tests treat 'document' and 'window' as 'Undefinied' vars
    * [FLAGON-340] - UserALE.js fails to build on Branch-336

* New Feature
    * [FLAGON-29] - Determine how best to track sessions and users
    * [FLAGON-166] - Build Firefox Plugin that Deploys UserALE.min Script Tag (.js Use Case)
    * [FLAGON-173] - Provide Options page for Web Extension plugin
    * [FLAGON-192] - Record Interval Events
    * [FLAGON-232] - Explore options for capturing unique UserIDs (distinguishing browsers) at runtime.
    * [FLAGON-328] - Page Sessions in UserALE.js
    * [FLAGON-336] - Document Meta-Data on UserALE.js Logs

* Improvement
    * [FLAGON-99] - Add custom log API method
    * [FLAGON-175] - Integrate web extension with existing User ALE build process
    * [FLAGON-196] - UserALE.js time sync
    * [FLAGON-217] - Track what type of change occurred in UserALE.js
    * [FLAGON-238] - Integrate Plugin Build Processes into NPM Build process
    * [FLAGON-271] - Investigate workflow for adding Chrome plugin to Chrome Store
    * [FLAGON-376] - Add pre-build UserALE.js in src

* Test
    * [FLAGON-174] - Test web extension with Chrome
    * [FLAGON-183] - [RELEASE PROC] Verify UserALE.js Unit Tests for -192 Branch

* Task
    * [FLAGON-93] - Readme Documentation of JS API
    * [FLAGON-223] - Make UserALE.js plugin persistent
    * [FLAGON-224] - Update UserALE.js Browser Plugin to Save Operating Params
    * [FLAGON-239] - Submit Firefox Extension to Firefox Verification
    * [FLAGON-285] - Address WARN deprecated during npm install
    * [FLAGON-289] - Remove Logstash Dependency for Header Requests
    * [FLAGON-294] - Branch Management
    * [FLAGON-345] - Update README.md files to Apache Flagon
    * [FLAGON-383] - Update README.md and Notices to Reflect Flagon namechange
    * [FLAGON-385] - Add Package-lock.json file to repos
    * [FLAGON-392] - Clean up for Merge with master
    * [FLAGON-396] - Add License to testUtils
    * [FLAGON-397] - Add Apache License headers to pre-built Artifacts
    * [FLAGON-399] - Update DOAP to reflect new version
    * [FLAGON-400] - Update Gulpfile to Add License to Build Artifacts
    * [FLAGON-401] - Add License to WebExtension Files
    * [FLAGON-402] - Update index.html version number
    * [FLAGON-403] - Add updated KEYs
    * [FLAGON-404] - Update Readme.md to reflect version 2.0.0
    * [FLAGON-405] - Add new filter examples to Readme.md
    * [FLAGON-407] - Jenkins Builds Failing at Master
    * [FLAGON-408] - Update webextension files for Userale version number
    * [FLAGON-409] - Update package.json file to indicate that we can now support Node 12.2.0 (engines)
    * [FLAGON-410] - Add setLogMapper API examples to README.md and Website
    * [FLAGON-411] - Update Release Scripts to Package WebExtension
    * [FLAGON-412] - Update Example page to include mapping and filtering examples
    * [FLAGON-413] - Update Changelog for Release Candidate


































