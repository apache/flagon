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

![Node.js CI](https://github.com/apache/flagon/workflows/userale_ci%20CI/badge.svg)
[![Known Vulnerabilities](https://snyk.io/test/npm/flagon-userale/badge.svg)](https://snyk.io/test/npm/flagon-userale)
![Maintenance](https://img.shields.io/maintenance/yes/2026)
![npm](https://img.shields.io/npm/v/flagon-userale)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](http://www.apache.org/licenses/LICENSE-2.0)
![Node.js](https://img.shields.io/badge/Node.js%20Support-20.x%2C%2022.x%2C%2024.x-orange)

Apache UserALE is part of the [Apache Flagon Project](https://flagon.apache.org/). It is a client-side instrumentation library written in TypeScript/JavaScript designed for easy deployment and lightweight configuration in gathering logs from your web applications for user behavioral analytics.

Once included in your project, Apache UserALE provides a comprehensive behavioral logging capability, capturing every event on every element rendered in your DOM with zero runtime dependencies.

Additional documentation and demonstrations can be found at the [Apache Flagon website](https://flagon.apache.org/userale/).

### Quickstart Guide

1. Include UserALE in your project as either an [ESM/CJS module or `<script>` tag](#installation).
2. Set up a logging endpoint. Try our [local example collector server](https://github.com/apache/flagon/tree/master/products/userale/example#capturing-logs-using-the-logging-server), the [OpenTelemetry + Grafana/Loki/Tempo demo](https://github.com/apache/flagon/tree/master/products/userale/example/otel-demo), the [100% Apache-2.0 OpenSearch stack](https://github.com/apache/flagon/tree/master/examples/opensearch), the [All-Apache Behavioral Lakehouse](https://github.com/apache/flagon/tree/master/examples/apache-lakehouse), or the [ELK stack example](https://github.com/apache/flagon/tree/master/examples/elk).
3. Configure [UserALE settings](#configure) using our API or HTML `data-*` attributes, including where to POST logs (`http://localhost:8000` for the local example server or `http://localhost:4318/v1/logs` for an OpenTelemetry Collector).
4. Explore the [UserALE API](#usage) to customize your log feed with `addCallbacks`, custom logs, OpenTelemetry trace correlation, and two-layer session replay. Explore a few [examples](#examples) here and in our [example directory](https://github.com/apache/flagon/tree/master/products/userale/packages/flagon-userale/example).
5. Visualize and analyze your logs with [Apache Flagon Distill](https://github.com/apache/flagon/tree/master/products/distill) or pre-built dashboards in [`examples/`](https://github.com/apache/flagon/tree/master/examples).

## Table of Contents

- [What's New](#whats-new)
- [Installation](#installation)
- [Configure](#configure)
- [Usage](#usage)
- [Examples](#examples)
- [Indexing, Storing, and Visualizing Logs](#indexing-storing-and-visualizing-logs)
- [Modifying Source](#modifying-source)
- [Contributing](#contributing)
- [License](#license)

## What's New

- **Pluggable Wire Exporters (`LogExporter`)**: Built-in zero-dependency exporters for UserALE Flat JSON (`'http-json'`), OpenTelemetry OTLP/JSON (`'otlp'`), OpenTelemetry JS SDK (`OtelSdkExporter`), Protobuf v1 Canonical JSON (`'proto-json'`), and WebSockets (`'websocket'`).
- **Two-Layer Session Replay & Behavioral DOM Telemetry (`#104`)**:
  - **Layer 1**: Throttled `MutationObserver` structural DOM telemetry (`logType: 'mutation'`), spatial rage-click detection (`RageClickDetector`), and element bounding-box geometry (`targetRect`).
  - **Layer 2**: `rrweb`-compatible rolling ring buffer (`ReplayRingBuffer`) that preserves `Meta` and `FullSnapshot` anchor frames and flushes replays correlated with `sessionId` and OpenTelemetry `traceId` / `spanId` on rage clicks or runtime errors.
- **Security & Reliability Hardening**:
  - Automatic masking of `<input type="password">` values and sensitive `data-*` attributes (`data-api-key`, `data-auth`, `data-token`, `data-secret`, `data-password`).
  - 48 KiB chunked `fetch(..., { keepalive: true })` transport on `pagehide` so authentication and custom headers are preserved on tab close.
  - Zero-dependency browser detection (`detectBrowser`) via User-Agent Client Hints with regex fallback.

See our [CHANGELOG](https://github.com/apache/flagon/blob/master/products/userale/packages/flagon-userale/CHANGELOG.md) for a complete list of changes.

## Installation

Either through cloning our [source repo](https://github.com/apache/flagon) or by using `npm` / `pnpm`:

```bash
npm install flagon-userale
# or
pnpm add flagon-userale
```

To include UserALE in your application as an ES module or CommonJS module:

```js
import * as userale from "flagon-userale";
// or
const userale = require("flagon-userale");
```

Our [webpack example](https://github.com/apache/flagon/tree/master/products/userale/packages/flagon-userale/example/webpackUserAleExample) and [React example](https://github.com/apache/flagon/tree/master/products/userale/packages/flagon-userale/example/react-app-example) illustrate bundler integration.

You can also include UserALE via a `<script>` tag using the pre-built IIFE bundle (`build/main.global.js`):

```html
<script src="./node_modules/flagon-userale/build/main.global.js"></script>
```

Our [script tag example](https://github.com/apache/flagon/tree/master/products/userale/packages/flagon-userale/example) illustrates this use case.

Or via a CDN such as jsDelivr:

```html
<script src="https://cdn.jsdelivr.net/npm/flagon-userale/build/main.global.js"></script>
```

We also support a Manifest V3 [Browser Extension](https://github.com/apache/flagon/tree/master/products/userale/packages/flagon-userale-ext) for Chrome, Edge, and Firefox.

Once UserALE is loaded on your page, your application will start generating logs automatically (unless `autostart: false` is configured).

## Configure

Some configuration is necessary. At minimum you will need to provide UserALE an end-point to ship logs to; default behavior is to ship logs to `localhost:8000`.

**NOTE**: In order to facilitate testing configuration and usage of UserALE, we have included an [example logging server](https://github.com/apache/flagon/tree/master/products/userale/example#capturing-logs-using-the-logging-server) in our
[example directory](https://github.com/apache/flagon/tree/master/products/userale/example). This is a very helpful utility
that works with both included [module examples](https://github.com/apache/flagon/tree/master/products/userale/packages/flagon-userale/example/webpackUserAleExample)
and [script-tag examples](https://github.com/apache/flagon/tree/master/products/userale/packages/flagon-userale/example). We strongly recommend experimenting with it.

Configuration details follow:

If you have included UserALE in your project as a `module`, you will need to use our `userale.options()` function, which exposes library configuration options through our API.

For example, if you do _not_ want UserALE to start logging automatically, you can modify this behavior through the `userale.options()` API (`autostart` config).

Then, you can use the `userale.start()` API export to begin logging at the appropriate time during page load or triggered from an event:

```js
const changeMe = "me";
userale.options({
  userId: changeMe,
  autostart: false,
  url: "http://localhost:8000/",
  version: "next",
  logDetails: false,
  sessionId: "this one",
});
userale.start();
```

Additional examples of `userale.options()` can be found in our [example directory](https://github.com/apache/flagon/tree/master/products/userale/packages/flagon-userale/example).

The complete list of configurable parameters that can be configured via `userale.options()` is:

| Param             | Description                                                                             | Default               |
| ----------------- | --------------------------------------------------------------------------------------- | --------------------- |
| url               | Logging URL (`http://`, `https://`, `ws://`, or `wss://`)                               | http://localhost:8000 |
| autostart         | Should UserALE start on page load                                                       | true                  |
| transmitInterval  | Delay between transmit checks                                                           | 5000 (ms)             |
| logCountThreshold | Minimum number of logs to send                                                          | 5                     |
| userId            | User identifier                                                                         | null                  |
| sessionId         | Session identifier (persisted in `sessionStorage` when omitted)                         | auto-generated        |
| httpSessionId     | HTTP session identifier                                                                 | auto-generated        |
| browserSessionId  | Browser session identifier                                                              | auto-generated        |
| version           | Application version identifier (also configurable via `toolVersion`)                    | null                  |
| logDetails        | Toggle detailed logs (keys pressed and input/change values)                             | false                 |
| resolution        | Delay between instances of high frequency logs (mouseover, scroll, etc.)                | 500 (ms)              |
| userFromParams    | Query param in the page URL to fetch userId from                                        | null                  |
| toolName          | Name of tool being logged (`service.name` in OTLP)                                      | null                  |
| custIndex         | Optional custom Elasticsearch/OpenSearch index prefix                                   | null                  |
| authHeader        | `Authorization` header string or callback function                                      | null                  |
| apiKey            | API key sent via the `x-api-key` HTTP request header                                    | null                  |
| headers           | Custom HTTP headers object (`Record<string, string>`)                                   | null                  |
| exporterType      | Wire format / transport (`'http-json'`, `'otlp'`, `'proto-json'`, `'websocket'`)        | `'http-json'`         |
| exporterFormat    | Alias for `exporterType`                                                                | `'http-json'`         |
| otlpEndpoint      | OpenTelemetry Collector HTTP endpoint (auto-appends `/v1/logs` when path is empty/root) | null                  |
| exporter          | Custom `LogExporter` instance overriding built-in exporters                             | null                  |
| traceContext      | Callback returning active W3C `{ traceId, spanId }` for OTLP correlation                | null                  |
| observeMutations  | Enable throttled `MutationObserver` structural DOM telemetry (`#104`)                   | false                 |

If you have included UserALE as a `script-tag` in your project, you can use HTML data parameters to pass configuration options to the library through the script tag. For example:

```html
<script
  src="./node_modules/flagon-userale/build/main.global.js"
  data-url="http://localhost:8000/"
  data-user="example-user"
  data-version="2.5.0"
  data-tool="Apache UserALE Example"
></script>
```

You have access to the same parameters listed above, however, naming conventions vary slightly for use in HTML:

| Param                  | Description                                                              | Default               |
| ---------------------- | ------------------------------------------------------------------------ | --------------------- |
| data-url               | Logging URL                                                              | http://localhost:8000 |
| data-autostart         | Should UserALE start on page load                                        | true                  |
| data-interval          | Delay between transmit checks                                            | 5000 (ms)             |
| data-threshold         | Minimum number of logs to send                                           | 5                     |
| data-user              | User identifier                                                          | null                  |
| data-session           | Session identifier                                                       | auto-generated        |
| data-version           | Application version identifier                                           | null                  |
| data-log-details       | Toggle detailed logs (keys pressed and input/change values)              | false                 |
| data-resolution        | Delay between instances of high frequency logs (mouseover, scroll, etc.) | 500 (ms)              |
| data-user-from-params  | Query param in the page URL to fetch userId from                         | null                  |
| data-tool              | Name of tool being logged                                                | null                  |
| data-index             | Custom index identifier (`custIndex`)                                    | null                  |
| data-auth              | `Authorization` header value                                             | null                  |
| data-api-key           | `x-api-key` header value                                                 | null                  |
| data-headers           | JSON-encoded object of custom HTTP headers                               | null                  |
| data-exporter          | Exporter format (`http-json`, `otlp`, `proto-json`, `websocket`)         | `http-json`           |
| data-otlp-endpoint     | OpenTelemetry Collector HTTP endpoint                                    | null                  |
| data-observe-mutations | Enable throttled `MutationObserver` structural DOM telemetry (`#104`)    | `false`               |

If you are using our [WebExtension](https://github.com/apache/flagon/blob/master/products/userale/packages/flagon-userale-ext/),
you can modify these parameters (including OAuth/API Key authentication, Exporter Format, and Event/Log Type filters) via the extension's `Options` page.

### Authentication, Custom Headers, CORS & WebSocket Limitations

UserALE supports static and dynamic HTTP authentication headers across both interval transmissions and `pagehide` (`keepalive: true`) flushes:

```js
import * as userale from "flagon-userale";

// 1. Static API key (sent as x-api-key header) or Authorization header
userale.options({
  url: "https://logs.example.com/ingest",
  apiKey: "my-api-key",
  authHeader: "Bearer my-jwt-token",
});

// 2. Dynamic token rotation via callback
userale.registerAuthCallback(() => `Bearer ${getCurrentAccessToken()}`);
```

- **HTTPS Security**: Always use `https://` endpoints in production when `apiKey` or `authHeader` is configured. UserALE logs a console warning if credentials are configured over plaintext `http://` to a non-localhost host, and automatically strips sensitive `data-api-key`, `data-auth`, `data-token`, `data-secret`, and `data-password` attributes from captured DOM element logs.
- **CORS Preflight Requirements**: Sending `Content-Type: application/json`, `Authorization`, or `x-api-key` from a browser triggers a CORS `OPTIONS` preflight request. Your ingestion server or OpenTelemetry Collector must include `Content-Type`, `Authorization`, and `x-api-key` in `Access-Control-Allow-Headers`.
- **WebSocket (`ws://` / `wss://`) Limitation**: The standard browser `WebSocket` API does not allow setting custom HTTP headers (`Authorization` or `x-api-key`) during the WebSocket handshake. When streaming over WebSockets, authenticate via short-lived query parameters in `url` (`wss://logs.example.com/ws?token=...`) or same-site HTTP-only cookies.

### OpenTelemetry (OTLP/JSON & OTel JS SDK) and Pluggable Exporters

UserALE.js natively exports behavioral logs in **OpenTelemetry OTLP/JSON** (`ExportLogsServiceRequest`) or **Apache Flagon Protobuf v1 JSON** (`apache.flagon.userale.v1.LogBatch`) with zero external runtime dependencies:

```js
import * as userale from "flagon-userale";

// Export directly to an OpenTelemetry Collector (/v1/logs is appended automatically)
userale.options({
  exporterType: "otlp",
  otlpEndpoint: "http://localhost:4318",
  toolName: "checkout-web",
  toolVersion: "1.4.0",
  // Optional: correlate DOM events with active W3C TraceContext spans
  traceContext: () => ({
    traceId: "4bf92f3577b34da6a3ce929d0e0e4736",
    spanId: "00f067aa0ba902b7",
  }),
});
```

If your application already initializes the OpenTelemetry JS Logs SDK (`@opentelemetry/sdk-logs`), bridge UserALE into your existing `Logger` using `OtelSdkExporter`:

```js
import * as userale from "flagon-userale";
import { logs } from "@opentelemetry/api-logs";

const otelLogger = logs.getLogger("userale");
userale.options({
  exporter: new userale.OtelSdkExporter(otelLogger),
});
```

See [`example/otel-demo`](https://github.com/apache/flagon/tree/master/products/userale/example/otel-demo) for a complete Docker Compose stack with **OpenTelemetry Collector**, **Grafana Loki**, **Grafana Tempo**, and a pre-built **Grafana Dashboard** featuring click-to-trace correlation.

### Session Replay & Behavioral DOM Telemetry (`#104`)

UserALE provides a two-layer session replay architecture (`startSessionReplay`, `flushSessionReplay`, `stopSessionReplay`) that keeps the core bundle dependency-free while supporting both structural DOM telemetry and `rrweb`-compatible visual playback:

1. **Layer 1 (Built-in `MutationObserver`, Bounding-Box Geometry, & Rage-Click Detection)**:
   - Aggregates structural DOM mutations (`addedCount`, `removedCount`, `attributeCount`, `targets`) without capturing PII text content, while automatically ignoring subtrees marked with `data-userale-ignore`.
   - Detects **Rage Clicks** (3+ rapid clicks on the same target selector within `1000ms` and `30px` radius), emitting `logType: "custom", type: "rage_click"` with element bounding-box geometry (`targetRect`).
2. **Layer 2 (`rrweb` Ring-Buffer Visual Replay Bridge)**:
   - Pass `rrweb.record` as `recorder` to maintain a rolling in-memory ring buffer (`maxDurationMs: 30000`) that preserves `Meta` (`type: 4`) and `FullSnapshot` (`type: 2`) anchor frames.
   - Automatically flushes the visual replay tagged with `sessionId` and active OpenTelemetry `traceId` / `spanId` whenever a rage-click, runtime `error`, or manual `flushSessionReplay()` occurs.

```js
import * as userale from "flagon-userale";
import * as rrweb from "rrweb";

userale.startSessionReplay({
  recorder: rrweb.record,
  maxDurationMs: 30_000,
  observeMutations: true,
  detectRageClicks: true,
  flushOnError: true,
});
```

## Usage

Including UserALE in your project as a `module` attaches the UserALE script as an object to the page.

We have exposed a number of functions that assist you in modifying, filtering, and customizing logs.

A complete list of exported functions is as follows:

| Function                            | Description                                                                                           | Notes                                                               |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `userale.options`                   | Modify or inspect UserALE's configuration options                                                     | Returns current `Configuration` object                              |
| `userale.start`                     | Start the logging process if `autostart: false` or after `userale.stop()`                             | Unnecessary if `autostart: true` (default)                          |
| `userale.stop`                      | Halt the logging process (`userale.start()` restarts logging)                                         | Pauses event packaging and transmission                             |
| `userale.addCallbacks`              | Register one or more named callbacks `(log, event) => log \| false` executed during log packaging     | Return `false` to filter out a log, or return a modified log object |
| `userale.removeCallbacks`           | Remove one or more registered callbacks by name                                                       | Accepts an array of callback keys                                   |
| `userale.log`                       | Append a pre-constructed custom log object directly to the log queue                                  | Bypasses standard packaging unless combined with `packageCustomLog` |
| `userale.packageLog`                | Transform a DOM `Event` into a canonical UserALE log and append it to the queue                       | Designed for HTML/DOM events                                        |
| `userale.packageCustomLog`          | Merge custom metadata with standard UserALE context fields and append to the queue                    | Designed for custom application events                              |
| `userale.details`                   | Return the default `details` extractor function for a given event type                                | Supports `packageLog` / `packageCustomLog`                          |
| `userale.getSelector`               | Build a CSS selector string (`tag#id.class`) for an HTML `EventTarget`                                | Populates the `target` field in packaged logs                       |
| `userale.buildPath`                 | Build the ordered DOM ancestor path array from event target to root                                   | Populates the `path` field in packaged logs                         |
| `userale.getTargetRect`             | Extract rounded `{ x, y, width, height, top, right, bottom, left }` bounding box for a DOM element    | Populates `targetRect` on discrete interaction logs                 |
| `userale.detectBrowser`             | Detect `{ browser, version }` using User-Agent Client Hints with regex fallback                       | Zero external runtime dependencies                                  |
| `userale.registerAuthCallback`      | Register a callback `() => string` returning a dynamic `Authorization` header value                   | Reset with `userale.resetAuthCallback()`                            |
| `userale.registerHeadersCallback`   | Register a callback `() => Record<string, string>` returning dynamic custom HTTP headers              | Reset with `userale.resetHeadersCallback()`                         |
| `userale.registerExporter`          | Register a custom `LogExporter` implementation (`HttpJsonExporter`, `OtlpJsonExporter`, etc.)         | Also configurable via `userale.options({ exporter })`               |
| `userale.startSessionReplay`        | Start Layer 1 (`MutationObserver`, `RageClickDetector`) and optional Layer 2 (`rrweb`) session replay | Returns a stop/cleanup function                                     |
| `userale.flushSessionReplay`        | Immediately flush the active `rrweb` session replay ring buffer as a `logType: 'replay'` envelope     | Returns `Promise<ReplayEnvelope \| null>`                           |
| `userale.stopSessionReplay`         | Stop active session replay observers and clear the ring buffer                                        | Safe to call multiple times                                         |
| `userale.getActiveReplayRingBuffer` | Return the active `ReplayRingBuffer` instance when session replay is running                          | Returns `null` when inactive                                        |

Including UserALE as a `script-tag` provides you access to the same functions listed above as properties of `window.userale`:

```js
window.userale.options({ userId: "example-user" });
```

## Examples

We provide a number of examples to illustrate how the functions above can be used with sample webpages and logging servers. These are tailored for [module examples](https://github.com/apache/flagon/tree/master/products/userale/packages/flagon-userale/example/webpackUserAleExample) and [script-tag examples](https://github.com/apache/flagon/tree/master/products/userale/packages/flagon-userale/example).

Filter and modify logs using `userale.addCallbacks`:

```js
userale.addCallbacks({
  filterNoisyEvents(log) {
    const ignoredEvents = [
      "mouseup",
      "mouseover",
      "mousedown",
      "keydown",
      "dblclick",
      "blur",
      "focus",
      "input",
      "wheel",
    ];
    if (ignoredEvents.includes(log.type) || log.logType === "interval") {
      return false;
    }
    return log;
  },
  labelTestButton(log) {
    if (log.target === "button#test_button") {
      return Object.assign({}, log, { customLabel: "Click me!" });
    }
    return log;
  },
});
```

(Additional examples illustrate [precision custom labeling](https://github.com/apache/flagon/tree/master/products/userale/packages/flagon-userale/example/log-label-example) using `addCallbacks` and `packageCustomLog`.)

Generate custom logs with `userale.packageCustomLog` or `userale.log`:

```js
document.addEventListener("change", function (e) {
  if (e.target.value === "packageCustomLog") {
    userale.packageCustomLog(
      {
        customLabel: "packageCustomLog Example",
        customField1: "foo",
        customField2: "bar",
      },
      function () {
        return { changeValue: e.target.value };
      },
      true,
    );
  }
});
```

Use our own log packaging pipeline to streamline custom HTML event logging with `userale.packageLog`:

```js
document.addEventListener("change", function (e) {
  if (e.target.value === "packageLog") {
    userale.addCallbacks({
      customChangeLabel(log) {
        if (log.type === "change") {
          return Object.assign({}, log, {
            logType: "custom",
            customLabel: "packageLog Example",
          });
        }
        return log;
      },
    });
    userale.packageLog(e, userale.details(userale.options(), "change"));
  }
});
```

You can find additional examples on our [website](https://flagon.apache.org/docs/useralejs/API/).

## Indexing, Storing, and Visualizing Logs

Apache Flagon provides ready-to-run reference architectures for collecting, storing, and visualizing UserALE telemetry:

- **[OpenTelemetry + Grafana + Loki + Tempo](https://github.com/apache/flagon/tree/master/products/userale/example/otel-demo)**: 5-minute Docker Compose stack correlating browser clicks with distributed traces via W3C `traceparent`.
- **[OpenSearch + OpenTelemetry Collector](https://github.com/apache/flagon/tree/master/examples/opensearch)**: 100% Apache-2.0 search and analytics stack with Docker Compose and Kubernetes manifests.
- **[All-Apache Behavioral Lakehouse](https://github.com/apache/flagon/tree/master/examples/apache-lakehouse)**: Apache Kafka + Apache Iceberg + Apache DataFusion + Apache Flagon Distill + Apache Superset.
- **[ELK Stack (Elasticsearch + Logstash + Kibana)](https://github.com/apache/flagon/tree/master/examples/elk)**: Classic Elastic stack with Logstash pipeline, index templates, and Kibana dashboards.

## Modifying Source

After making modifications to [`products/userale/packages/flagon-userale/src`](https://github.com/apache/flagon/tree/master/products/userale/packages/flagon-userale/src), rebuild and run the test suite from `products/userale`:

```bash
# Install workspace dependencies
pnpm install

# Build ESM + IIFE bundles and TypeScript declarations
pnpm build

# Run Jest unit & Protobuf/OTLP contract tests (118 tests)
pnpm --dir packages/flagon-userale test

# Run full test suite including Playwright E2E browser & extension tests
pnpm test

# Check formatting and linting
pnpm format:check
pnpm lint:check
```

For more guidance on modifying Flagon UserALE source code, check out [the guide on our website](https://flagon.apache.org/docs/useralejs/modifying/).

## Contributing

Contributions are welcome! Simply [submit an issue](https://github.com/apache/flagon/issues) or open a pull request. See our [Contributing Guide](https://github.com/apache/flagon/blob/master/CONTRIBUTING.md) for development setup instructions.

Join the conversation: tell us your needs, wishes, and interests by joining our [mailing list](mailto:dev-subscribe@flagon.apache.org)!

## License

Apache Flagon UserALE is provided under Apache License version 2.0. See [LICENSE](https://github.com/apache/flagon/blob/master/LICENSE) and [NOTICE](https://github.com/apache/flagon/blob/master/NOTICE) files for more details.
