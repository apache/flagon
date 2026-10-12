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

# The UserALE Example Utility

This directory provides:

- Example usage for UserALE deployed as a **`<script>` tag** within a simple HTML webpage ([`index.html`](./index.html));
- A testing utility for developers to evaluate UserALE modifications to logged events ([`index.js`](./index.js));
- Additional focused examples for [Webpack](./webpackUserAleExample/README.md), [React](./react-app-example/README.md), [Custom Non-User Events](./custom-non-user-events-example/README.md), and [Custom Log Labels](./log-label-example/README.md).

For details about our browser extension, see the [UserALE Browser Extension README](../../flagon-userale-ext/README.md).

## Prerequisites

Ensure that you have [Node.js](https://nodejs.org/) (`>= 20.x`) and `pnpm` installed (or run `nix develop` at the repository root).

From `products/userale`, install dependencies and build the workspace:

```bash
pnpm install
pnpm build
```

## Using the Example Page

The Example Page (`index.html`) loads the compiled UserALE IIFE bundle via a `<script>` tag:

```html
<script
  src="../build/main.global.js"
  data-url="http://localhost:8000/"
  data-user="example-user"
  data-version="2.5.0"
  data-tool="Apache UserALE Example"
></script>
```

Open `index.html` in your browser (or visit [`http://localhost:8000`](http://localhost:8000) when running `pnpm example:run`). All user events will be captured and sent to the logging server.

## Testing with the Example Page

In order to experiment with various elements of the UserALE API, modify the documented API examples in `index.js`. Details about the API can be found in the [`flagon-userale` README](../README.md). A summary of exported API functions is shown below:

| Function                          | Description                                                                        | Notes                                                           |
| --------------------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `userale.options`                 | Modify or inspect UserALE's configuration options                                  | Returns current `Configuration` object                          |
| `userale.start`                   | Start the logging process if `autostart: false`                                    | Unnecessary if `autostart: true` (default)                      |
| `userale.stop`                    | Halt the logging process                                                           | Invoke `userale.start()` to resume                              |
| `userale.addCallbacks`            | Add one or more named callbacks executed during log packaging                      | Return `false` to drop a log or return a modified log           |
| `userale.removeCallbacks`         | Remove one or more callbacks by name                                               | Removes callbacks added via `userale.addCallbacks`              |
| `userale.log`                     | Append a custom log object directly to the log queue                               | Custom log object of key/value pairs                            |
| `userale.packageLog`              | Transform a DOM event into a log and append it to the queue                        | Designed for HTML/DOM events                                    |
| `userale.packageCustomLog`        | Package custom metadata with standard UserALE context fields                       | Designed for custom application events                          |
| `userale.details`                 | Return the default `details` extractor for an event type                           | Supports `packageLog` / `packageCustomLog`                      |
| `userale.getSelector`             | Build a CSS selector string from an HTML element                                   | Populates `target` in packaged logs                             |
| `userale.buildPath`               | Build an array of ancestor selectors from target to root                           | Populates `path` in packaged logs                               |
| `userale.getTargetRect`           | Extract element bounding-box geometry (`{ x, y, width, height, ... }`)             | Populates `targetRect` on discrete interactions                 |
| `userale.detectBrowser`           | Detect `{ browser, version }` using User-Agent Client Hints                        | Zero external dependencies                                      |
| `userale.registerAuthCallback`    | Register dynamic `Authorization` header provider callback                          | Reset via `userale.resetAuthCallback()`                         |
| `userale.registerHeadersCallback` | Register dynamic custom HTTP headers callback                                      | Reset via `userale.resetHeadersCallback()`                      |
| `userale.registerExporter`        | Register a custom `LogExporter` (`HttpJsonExporter`, `OtlpJsonExporter`, etc.)     | Supports `'http-json'`, `'otlp'`, `'proto-json'`, `'websocket'` |
| `userale.startSessionReplay`      | Start Layer 1 (`MutationObserver`, `RageClickDetector`) & Layer 2 (`rrweb`) replay | Returns a stop/cleanup function                                 |
| `userale.flushSessionReplay`      | Flush active session replay ring buffer as a `logType: 'replay'` envelope          | Returns `Promise<ReplayEnvelope \| null>`                       |
| `userale.stopSessionReplay`       | Stop active session replay observers and clear buffer                              | Safe to call multiple times                                     |

See the [Flagon website](https://flagon.apache.org/docs/useralejs/API/) for additional API documentation.

## Capturing Logs Using the Logging Server

The example logging server receives logs from any UserALE-instrumented page at `http://localhost:8000` (and `/v1/logs` for OTLP/JSON).

From `products/userale`, run:

```bash
pnpm example:run
# or with auto-reload via nodemon:
pnpm example:watch
```

Once started you will see:

```text
UserAle Local running on port 8000
```

Open `index.html` (or [`http://localhost:8000`](http://localhost:8000)) and interact with the page to see logs printed in the terminal:

```js
[
  {
    target: "button#test_button",
    path: ["button#test_button", "div.container", "body", "html"],
    clientTime: 1730000000000,
    location: { x: 42, y: 18 },
    targetRect: {
      x: 20,
      y: 10,
      width: 120,
      height: 36,
      top: 10,
      right: 140,
      bottom: 46,
      left: 20,
    },
    type: "click",
    logType: "raw",
    userAction: true,
    details: { clicks: 1, ctrl: false, alt: false, shift: false, meta: false },
    userId: "example-user",
    toolVersion: "2.5.0",
    toolName: "Apache UserALE Example",
    useraleVersion: "2.4.0",
  },
];
```

Stop the logging server with `^C`.

## Reviewing Logs Collected with the Example Server

In addition to printing to your terminal, logs collected by the UserALE Example Server are written locally to `products/userale/logs/`. A new log file is created each time you start the logging server.

## Contributing

Contributions are welcome! Simply [submit an issue](https://github.com/apache/flagon/issues) or open a pull request on [`apache/flagon`](https://github.com/apache/flagon).
