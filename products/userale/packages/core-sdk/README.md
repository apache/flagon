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
![npm](https://img.shields.io/npm/v/flagon-userale)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](http://www.apache.org/licenses/LICENSE-2.0)

Client-side behavioral telemetry for web applications. Captures DOM events and emits them as [OpenTelemetry](https://opentelemetry.io/) log records (OTLP/HTTP JSON) to any compatible collector.

Part of the [Apache Flagon Project](http://flagon.apache.org/).

## Install

```sh
npm install flagon-userale
# or
pnpm add flagon-userale
```

## Quickstart

### ES module (bundler / Node)

```js
import { UserALE, Configuration } from 'flagon-userale';

const userale = new UserALE(
  Configuration.getInstance({
    url: 'http://localhost:4318',
    userId: 'alice',
    toolName: 'my-app',
  })
);

userale.start();
```

### Script tag (no bundler)

Use the [`flagon-userale-iife`](../iife/) package instead. It loads via a `<script>` tag and reads configuration from `data-*` attributes:

```html
<script
  src="path/to/main.global.js"
  data-url="http://localhost:4318"
  data-user="alice"
  data-tool="my-app"
></script>
```

## API

### Lifecycle

| Method | Description |
|---|---|
| `userale.start()` | Begin capturing events and sending logs |
| `userale.stop()` | Stop sending; clears the transmit interval |
| `userale.capture()` | Attach event handlers without starting the sender (used in extension content scripts) |

### Callbacks

Callbacks let you filter, map, or reroute every log before it is sent.

```js
userale.addCallbacks({
  // Return false to drop the log entirely
  filter(log) {
    return ['mouseup', 'mouseover'].includes(log.type) ? false : log;
  },

  // Mutate or replace the log object
  map(log) {
    return { ...log, appVersion: '1.2.3' };
  },

  // Intercept logs for custom transport (return false to suppress local send)
  rerouteLog(log) {
    myAnalyticsPipeline.send(log);
    return false;
  },
});

userale.removeCallbacks(['filter']);
```

### Custom logs

```js
// Emit a fully custom log
userale.log({
  type: 'custom-event',
  logType: 'custom',
  userAction: false,
  clientTime: Date.now(),
  details: { myKey: 'myValue' },
});

// Package a log with standard metadata merged in
userale.packageCustomLog(
  { type: 'button-click', customLabel: 'Save' },
  () => ({ timestamp: Date.now() }),
  true // userAction
);
```

### Runtime options

```js
userale.options({ url: 'https://my-collector/v1/logs', userId: 'bob' });
```

### Flush

Force-send all queued logs immediately:

```js
await userale.flush();
```

## Wire format

UserALE emits [OTLP/HTTP JSON](https://opentelemetry.io/docs/specs/otlp/) to `POST /v1/logs` on the configured endpoint.

| Log type | OTLP signal | Sent when |
|---|---|---|
| `raw` — DOM events | LogRecord | On every captured DOM event |
| `custom` — developer-emitted | LogRecord | On `userale.log()` / `packageCustomLog()` |
| `interval` — dwell/interaction spans | LogRecord | On periodic transmit interval |

UserALE-specific fields are attached as `userale.*` attributes. Browser context maps to OTel semantic conventions (`browser.url`, `user_agent.original`, etc.).

## Local development

```sh
pnpm install
pnpm build   # → build/main.mjs (ESM)
pnpm test    # Jest unit tests
```

For a runnable demo and full API usage examples, see [`example-server/`](../../example-server/) in the workspace root. Start it with `pnpm example:run` from the workspace root, then visit `http://localhost:8000/esm`.

For local log collection, start the shared Jaeger collector from the flagon project root:

```sh
pnpm collector:up   # OTLP on :4318, Jaeger UI on :16686
```

## Contributing

[Submit an issue](https://github.com/apache/flagon/issues) or open a pull request. See the [contribution guide](http://flagon.apache.org/docs/contributing/) and [mailing list](dev-subscribe@flagon.apache.org).

## License

Apache License 2.0. See [LICENSE](https://github.com/apache/flagon/blob/master/LICENSE) and [NOTICE](https://github.com/apache/flagon/blob/master/NOTICE).
