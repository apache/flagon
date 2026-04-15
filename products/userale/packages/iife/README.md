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

# flagon-userale-iife

Script-tag drop-in build of [Apache Flagon UserALE](../core-sdk/). Instruments a web page with zero JavaScript — configure entirely through `data-*` attributes on the `<script>` tag.

## When to use this

| Situation | Use |
|---|---|
| No build step; just a `<script>` tag | `flagon-userale-iife` (this package) |
| Bundler (Webpack, Vite, etc.) or Node | [`flagon-userale`](../core-sdk/) |
| Instrument any site without touching its code | [Browser extension](../extension/) |

The IIFE build is intentionally a drop-in: it reads configuration from `data-*` attributes, starts capturing automatically, and exposes no JavaScript API. If you need to call `addCallbacks`, `stop`, `options`, or similar at runtime, use the core SDK directly.

## Install

```sh
npm install flagon-userale-iife
# or
pnpm add flagon-userale-iife
```

Then copy `node_modules/flagon-userale-iife/build/main.global.js` to your static assets, or reference it directly.

## Usage

Add a single `<script>` tag to your HTML `<head>`. All configuration is via `data-*` attributes:

```html
<script
  src="/path/to/main.global.js"
  data-url="http://localhost:4318"
  data-user="alice"
  data-tool="my-app"
></script>
```

UserALE starts capturing DOM events immediately and sends logs as OTLP/HTTP JSON to `data-url`.

## Configuration attributes

| Attribute | Type | Default | Description |
|---|---|---|---|
| `data-url` | string | `http://localhost:4318` | OTLP/HTTP collector endpoint |
| `data-user` | string | `null` | User identifier attached to every log |
| `data-tool` | string | `null` | Application/tool name |
| `data-version` | string | `null` | Application version |
| `data-threshold` | number | `5` | Send after this many logs are queued |
| `data-interval` | number | `5000` | Also send every N milliseconds |
| `data-log-details` | boolean | `false` | Include extended DOM details in logs |
| `data-resolution` | number | `500` | Minimum ms between high-frequency events (mouseover, etc.) |
| `data-user-from-params` | string | `null` | URL query-param name to extract the user ID from |
| `data-autostart` | boolean | `true` | Start capturing immediately on load |

## OTLP collector

Logs are sent as OTLP/HTTP JSON to the configured endpoint. For local development, start the shared Jaeger collector from the flagon project root:

```sh
pnpm collector:up   # OTLP on :4318, Jaeger UI on :16686
pnpm collector:down
```

## Development

```sh
pnpm install
pnpm build   # → build/main.global.js
```

## License

Apache License 2.0. See [LICENSE](https://github.com/apache/flagon/blob/master/LICENSE) and [NOTICE](https://github.com/apache/flagon/blob/master/NOTICE).
