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

# Apache Flagon UserALE

# 🚨 This repository has been archived and it's contents have moved to https://github.com/apache/flagon

![Node.js CI](https://github.com/apache/flagon-useralejs/workflows/Node.js%20CI/badge.svg)
[![Known Vulnerabilities](https://snyk.io/test/npm/flagon-userale/badge.svg)](https://snyk.io/test/npm/flagon-userale)
![Maintenance](https://img.shields.io/maintenance/yes/2024)
![npm](https://img.shields.io/npm/v/flagon-userale)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](http://www.apache.org/licenses/LICENSE-2.0)
![Node.js](https://img.shields.io/badge/Node.js%20Support-16.x%2C%2018.x-orange)

Apache UserALE is part of the [Apache Flagon Project](http://flagon.incubator.apache.org/). It is a client side instrumentation library written in JavaScript designed for easy deployment and lightweight configuration in gathering logs from your web applications for user behavioral analytics.

Once included in your project, Apache UserALE provides a comprehensive behavioral logging capability, capturing every event on every element rendered in your DOM.

Additional documentation and a demonstration can be found at the [Apache Flagon website](http://flagon.incubator.apache.org/userale/).

### Quickstart Guide

1. Include UserALE in your project as either a [module or script tag](https://github.com/apache/flagon-useralejs#installation)
1. Set up a logging end-point. Try our [example server utility](https://github.com/apache/flagon-useralejs/tree/master/example#capturing-logs-using-the-logging-server) or try out our [Elasticsearch (ELK) stack example](https://github.com/apache/flagon/tree/master/docker).
1. Configure [UserALE settings](https://github.com/apache/flagon-useralejs#configure) using our API, including where to POST logs to (port:8000 for UserALE example or port:8100 of ELK/Logstash)
1. Further explore the [UserALE API](https://github.com/apache/flagon-useralejs#usage) to customize your log feed, add filters, custom logs, and modify logs themselves. Explore a few [examples](https://github.com/apache/flagon-useralejs#examples) here and a wider set in our [example utility](https://github.com/apache/flagon-useralejs/blob/master/example/webpackUserAleExample/index.js).
1. Visualize and analyze your logs. See our sample [kibana dahsboards](https://github.com/apache/flagon/tree/master/docker#single-node-example-container) for behavioral analytics.

## Table of Contents
[What's New](https://github.com/apache/flagon-useralejs#whats-new-in-version-210)
[Installation](https://github.com/apache/flagon-useralejs#installation)
[Configure](https://github.com/apache/flagon-useralejs#configure)
[Usage](https://github.com/apache/flagon-useralejs#usage)
[Examples](https://github.com/apache/flagon-useralejs#examples)
[Indexing, Storing, and Visualizing Logs](https://github.com/apache/flagon-useralejs#indexing-storing-and-visualizing-logs)
[Modifying Source](https://github.com/apache/flagon-useralejs#modifying-source)
[Contributing](https://github.com/apache/flagon-useralejs#contributing)
[License](https://github.com/apache/flagon-useralejs#license)

## What's New in Version 2.4.0?

- Refactors Map and Filter APIs as generalized callbacks for functionality
- Adds additional UserALE API examples utilizing generalized callbacks
- Minor updates to update deprecated downstream dev dependencies
- Minor changes to documentation, updated examples

See our [CHANGELOG](https://github.com/apache/flagon-useralejs/blob/master/CHANGELOG.md) for a complete list of changes.

## Installation

Either through cloning our [source repo](https://github.com/apache/flagon-useralejs) or by using npm:

```html
npm install flagon-userale

or

npm install flagon-userale --engine-strict (enforces supported Node.js versions)

```

To include UserALE as an object in your project, include as a `module`:

```html
import * as userale from 'flagon-userale';

or

const userale = require('flagon-userale');
```
Our [webpack example](https://github.com/apache/flagon-useralejs/tree/master/example/webpackUserAleExample) illustrates this use-case.

You can also include UserALE as a `script-tag`. A pre-built version of the userale script is included in our package and
repositories:

```html
<script src="./node_modules/flagon-userale/build/userale-2.4.0.min.js"></script>
```
Our [script tag example](https://github.com/apache/flagon-useralejs/tree/master/example) illustrates this use-case

If you include UserALE as a `script-tag`, consider installing via npm as a development dependency:

```html
npm install --save-dev flagon-userale
```

Or if you want to use a CDN, then you can use something like

```html
<script src="https://cdn.jsdelivr.net/npm/flagon-userale@2.1.1/build/userale-2.4.0.min.js"></script>
```

We also support a [WebExtension](https://github.com/apache/flagon-useralejs/tree/master/src/UserALEWebExtension) that can be added to your browser in developer mode. Follow the link for instructions.

Once UserALE is installed in your project, your application will start generating logs automatically.

## Configure

Some configuration is necessary. At minimum you will need to provide UserALE an end-point to ship logs to; default behavior is to ship logs to `localhost:8000`.

**NOTE**: In order to facilitate testing configuration and usage of UserALE, we have included an [example logging server](https://github.com/apache/flagon-useralejs/tree/master/example#capturing-logs-using-the-logging-server) in our
[example directory](https://github.com/apache/flagon-useralejs/tree/master/example). This is a very helpful utility
that works with both included [module examples](https://github.com/apache/flagon-useralejs/tree/master/example/webpackUserAleExample)
and [script-tag examples](https://github.com/apache/flagon-useralejs/tree/master/example). We strongly recommend experimenting with it.

Configuration details follow:

If you have included UserALE in your project as a `module`, you will need to use our `userale.options()` function, which exposes library configuration options through our API.

For example, if you do *not* want UserALE to start logging automatically, you can modify this behavior through the `userale.options()` API (`autostart` config).

Then, you can use the `userale.start()` API export to begin logging at the appropriate time during page load or triggered from an event:

```html
const changeMe = "me";
userale.options({
    "userId": changeMe,
    "autostart": false,
    "url": "http://localhost:8000/",
    "version": "next",
    "logDetails": false,
    "sessionId": "this one"
});

userale.start();

```

Additional examples of `userale.options()` can be found in our [example directory](https://github.com/apache/flagon-useralejs/tree/master/example).

The complete list of configurable parameters that can be configured via `userale.options()` is:

| Param | Description | Default |
|---|---|---|
| url | Logging URL | http://localhost:8000 |
| autostart | Should UserALE start on page load | true |
| transmitInterval | Delay between transmit checks | 5000 (ms) |
| logCountThreshold | Minimum number of logs to send | 5 |
| userId | User identifier | null |
| sessionId | Session identifier | null |
| version | Application version identifier | null |
| logDetails | Toggle detailed logs (keys pressed and input/change values) | false |
| resolution | Delay between instances of high frequency logs (mouseover, scroll, etc.) | 500 (ms) |
| userFromParams | Query param in the page URL to fetch userId from | null |
| toolName | Name of tool being logged | null |
| authHeader | Authorization header to be passed to logging endpoint | null |

If you have included UserALE as a `script-tag` in your project, you can use HTML data parameters to pass configuration options to the library through the script tag. For example:

```html
  <script
          src="./node_modules/flagon-userale/build/userale-2.4.0.min.js"
          data-url="http://localhost:8000/"
          data-user="example-user"
          data-version="2.4.0"
          data-tool="Apache UserALE Example"
  ></script>
```

You have access to the same parameters listed above, however, naming conventions vary slightly for use in HTML:

| Param | Description | Default |
|---|---|---|
| data-url | Logging URL | http://localhost:8000 |
| data-autostart | Should UserALE start on page load | true |
| data-interval | Delay between transmit checks | 5000 (ms) |
| data-threshold | Minimum number of logs to send | 5 |
| data-user | User identifier | null |
| data-version | Application version identifier | null |
| data-log-details | Toggle detailed logs (keys pressed and input/change values) | false |
| data-resolution | Delay between instances of high frequency logs (mouseover, scroll, etc.) | 500 (ms) |
| data-user-from-params | Query param in the page URL to fetch userId from | null |
| data-tool | Name of tool being logged | null |
| data-auth | Authorization header to be passed to logging endpoint | null |

If you are using our [WebExtension](https://github.com/apache/flagon-useralejs/tree/master/src/UserALEWebExtension),
you can modify some of these parameters via the extensions' `options` page.

## Usage

Including UserALE in your project as a `module` attaches the UserALE script as an object to the page.

We have exposed a number of functions that assist you in modifying, filtering, and customizing logs

A complete list of available functions are as follows:

| Function | Description | Notes |
|---|---|---|
| userale.options | modify userale's configuration option | see top level README for complete list of options |
| [DEPRECATED] userale.filter | filters out logs from logging queue by keys or values | filters are callbacks with global scope |
| [DEPRECATED] userale.map | modify/add log keys or values | mappings are callbacks with global scope |
| userale.addCallbacks | add one or more callbacks to be executed during log packaging | callbacks have global scope |
| userale.removeCallbacks | remove one or more callbacks by name | Removes callbacks added from userale.addCallbacks |
| userale.log | appends a custom log to the log queue | the custom log object is an object key:value pairs |
| userale.packageLog | transforms the provided event into a log and appends it to the log queue | designed for HTML events |
| userale.packageCustomLog | packages the provided customLog to include standard meta data and appends it to the log queue | designed for non HTML events|
| userale.details | defines the way information is extracted from various events | supports packageLog/packageCustomLog 'details' |
| userale.getSelector | builds a string CSS selector from the provided HTML element id | populates 'target' field in packaged logs |
| userale.buildPath| builds an array of elements from the provided event target, to the root element (DOM path) | populates the 'path' field in packaged logs |
| userale.start | used to start the logging process if | unecessary if 'autostart' is set to true in initial setting (default) |
| userale.stop | halts the logging process. Logs will no longer be sent | will need to invoke userale.start to restart logging |

Including UserALE as a `script-tag` provides you access to the same functions listed above. However, UserALE essentially
becomes a property of the DOM. As such, you'll need to call functions as a window property:

```html
userale.options = window.userale.options
```

## Examples

We provide a number of examples to illustrate how the [functions above](https://github.com/apache/flagon-useralejs#usage)
can be used with sample webpages and logging servers. These are tailored for [module examples](https://github.com/apache/flagon-useralejs/tree/master/example/webpackUserAleExample)
and [script-tag examples](https://github.com/apache/flagon-useralejs/tree/master/example).
Select examples are below:

Filter your logs with `userale.filter`:

```html
userale.filter(function (log) {
    var type_array = ['mouseup', 'mouseover', 'mousedown', 'keydown', 'dblclick', 'blur', 'focus', 'input', 'wheel'];
    var logType_array = ['interval'];
    return !type_array.includes(log.type) && !logType_array.includes(log.logType);
});
```

Modify (add/remove) log fields with surgical precision using `userale.map`:

```html
userale.map(function (log) {
        var targetsForLabels = ["button#test_button"];
        if (targetsForLabels.includes(log.target)) {
            return Object.assign({}, log, { CustomLabel: "Click me!" });
        } else {
            return log;
        }
      });
```

(Additional examples illustrate [precision custom labeling](https://github.com/apache/flagon-useralejs/tree/master/example/log-label-example), using a variety of functions.)

Generate custom logs with `userale.log`:

```html
document.addEventListener('change', function(e) {
    if (e.target.value === 'log') {
        userale.log({
            target: userale.getSelector(e.target),
            path: userale.buildPath(e),
            type: e.type,
            logType: 'custom',
            userAction: false,
            details: 'I can make this log look like anything I want',
            customField1: 'foo',
            customField2: 'bar',
            userId: userale.options().userId,
            toolVersion: userale.options().version,
            toolName: userale.options().toolName,
            useraleVersion: userale.options().useraleVersion,
            sessionId: userale.options().sessionId,
            customLabel: "(custom) Log Example"
        });
    }
});
```

User our own log packaging pipeline to streamline custom HTML event logging with `userale.packageLog`:

```html
document.addEventListener('change', function(e){
    if (e.target.value === 'packageLog') {
        /**You can then use the 'Mapping' API function to modify custom logs created with the packageLog function*/
        userale.map(function (log) {
            var targetsForLabels = ['change'];
            if (targetsForLabels.includes(log.type)) {
                return Object.assign({}, log, { logType: 'custom', customLabel: 'packageLog Example' });
            } else {
                return log;
            }
        });
        /**You can also use the details function to package additional log meta data, or add custom details*/
        userale.packageLog(e, userale.details(userale.options(),'change'));
    } else {
        return false
    }
});
```

Again, see [Usage](https://github.com/apache/flagon-useralejs#usage) for differences in invoking these functions with `module` and `script-tag` includes.

You can find additional examples on our [website](http://flagon.incubator.apache.org/docs/useralejs/API/).

## Indexing, Storing and Visualizing Logs

We recommend Elastic products, specifically an [ELK cluster](https://www.elastic.co/what-is/elk-stack), for indexing and storing logs in productions.

You can find a 'sand-box' ELK build, configuration files, and visualization/dashboards tailored for UserALE in the [Apache Flagon parent repository](https://github.com/apache/flagon/tree/master/docker).

We also provide some documentation about stack-considerations on our [project website](http://flagon.incubator.apache.org/docs/stack/).

## Modifying Source

You may wish to modify UserALE to suite your needs. After making modification to [UserALE src](https://github.com/apache/flagon-useralejs/tree/master/src),
you will need to rebuild the UserALE script (and run tests).

To (re)build UserALE:

```
npm run build
```

To run UserALE unit tests:
```
npm run test
```

We use gulp-mocha for unit tests. The results will print to your terminal:
```
...
    attachHandlers
    ✓ attaches all the event handlers without duplicates
    ✓ debounces bufferedEvents (505ms)
    defineDetails
      - configures high detail events correctly
...

  45 passing (954ms)
  1 pending
```
Any failing tests will also be logged in the terminal. If there are failing tests, please consider [submitting an issue report](https://github.com/apache/flagon-useralejs/issues).

For more guidance on modifying Flagon UserALE src code, check out [the guide on our website](http://flagon.incubator.apache.org/docs/useralejs/modifying/).

## Contributing

Contributions are welcome!  Simply [submit an issue](https://github.com/apache/flagon-useralejs/issues). Pull requests are welcome.  The core team will review it and work with you to incorporate it into UserALE. If you want to become a contributor to the project, see our [contribution guide](http://flagon.incubator.apache.org/docs/contributing/).

Join the conversation: tell us your needs, wishes, and interests by joining our [mailing list](dev-subscribe@flagon.incubator.apache.org)!

## License

Apache Flagon UserALE is provided under Apache License version 2.0. See [LICENSE](https://github.com/apache/flagon-useralejs/blob/master/LICENSE) and [NOTICE](https://github.com/apache/flagon-useralejs/blob/master/NOTICE) files at MASTER for more details.
