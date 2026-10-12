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

# The UserALE Webpack Example Utility

This example provides:

- Example usage for UserALE imported as an **ESM/CJS module** into a simple HTML webpage and bundled with Webpack;
- A testing utility for developers to evaluate UserALE modifications to logged events;
- A means of viewing log event structure with the local UserALE logging server;
- A means of testing UserALE API functions within a simple HTML webpage.

If you are interested in examples for a **`<script>` tag** deployment methodology, see the README in the [script tag example directory](../README.md). For details about our browser extension, see our [UserALE Browser Extension documentation](../../../flagon-userale-ext/README.md).

## Prerequisites

Ensure that you have [Node.js](https://nodejs.org/) (`>= 20.x`) installed.

From `./example/webpackUserAleExample`, run `npm install` to install dependencies for this standalone Webpack example project.

Please follow the [UserALE Installation directions](../../README.md#installation) if you run into issues.

## Using the Example Page

The Example Page (`index.html`) is a simple HTML webpage with UserALE included via module import (`index.js` bundled to `dist/main.js`).

Open `index.html` in your browser. You will see an interactive test webpage where all user events are captured and sent to the logging server.

## Capturing Logs Using the Logging Server

The UserALE Example page sends logs to `http://localhost:8000` by default.

From `products/userale`, start the local example server:

```bash
pnpm example:run
# or with auto-reload:
pnpm example:watch
```

Once the server starts you will see:

```text
UserAle Local running on port 8000
```

The server prints incoming batches to the terminal and writes them to `products/userale/logs/`.

This means you can test logs from your own instrumented application, the [UserALE Browser Extension](../../../flagon-userale-ext/README.md), or the UserALE Example Page, so long as `url` is set to `http://localhost:8000`.

Interact with the example page and you will see logs propagating in the terminal:

```js
[
  {
    target: "body",
    path: ["body", "html"],
    clientTime: 1730000000000,
    location: { x: 0, y: 0 },
    type: "keydown",
    logType: "raw",
    userAction: true,
    details: null,
    userId: "me",
    toolVersion: "next",
    toolName: "Webpack Example",
    useraleVersion: "2.4.0",
  },
];
```

Stop the logging server with `^C`.

## Modifying the Example Page (Dev Instructions)

Below are a few notes that are useful as you begin to modify the UserALE **module** import example:

- The `userale` object imports directly into `index.js` with:

```js
import * as userale from "flagon-userale";
// or
const userale = require("flagon-userale");
```

- `index.js` is bundled with **Webpack**, resulting in `dist/main.js`, which `index.html` loads via:

```html
<script src="dist/main.js"></script>
```

- Any modifications to `index.js` require rebuilding `dist/main.js` inside `example/webpackUserAleExample`:

```bash
npm run build-example
```

## Experimenting with UserALE Exports (API)

UserALE exports functions to configure, filter, enrich, and customize your logs:

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

See the [Flagon website](https://flagon.apache.org/docs/useralejs/API/) for additional documentation on the API.

## Contributing

Contributions are welcome! Simply [submit an issue](https://github.com/apache/flagon/issues) or open a pull request on [`apache/flagon`](https://github.com/apache/flagon).
