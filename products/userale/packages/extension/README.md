<!--
  Licensed to the Apache Software Foundation (ASF) under one
  or more contributor license agreements. See the NOTICE file
  distributed with this work for additional information
  regarding copyright ownership. The ASF licenses this file
  to you under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing,
  software distributed under the License is distributed on an
  "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
  either express or implied. See the License for the specific
  language governing permissions and limitations under the License.
-->

# Flagon UserALE Browser Extension

A browser extension that instruments any website with [UserALE](../core-sdk/) behavioral telemetry — no code changes to the target page required. Captured events are forwarded as OTLP/HTTP JSON to a configurable collector endpoint.

Built with [Plasmo](https://docs.plasmo.com/). Supports Chrome (MV3).

## How it works

1. The content script injects UserALE into every page matching the URL allowlist
2. Logs are intercepted via a `rerouteLog` callback and forwarded to the background service worker over a Plasmo port — no fetch calls are made from the page context
3. The background service worker applies the allowlist filter and forwards matching logs to the configured OTLP endpoint via `userale.log()`
4. Browser tab events (activate, create, update, close, etc.) are packaged as custom logs alongside DOM events

## Development

```sh
pnpm install
pnpm dev
```

Load the unpacked extension:
- **Chrome** — `chrome://extensions/` → Developer Mode → Load unpacked → `build/chrome-mv3-dev/`

## Production build

```sh
pnpm build
```

Outputs a production bundle under `build/chrome-mv3-prod/`. Run `pnpm package` to produce a zipped bundle ready for browser store submission.

## Configuration

Click the extension icon to open the options page:

| Option | Description | Default |
|---|---|---|
| Logging endpoint | OTLP/HTTP collector URL | `http://localhost:4318` |
| URL allowlist | Regex of page URLs to instrument | `https://flagon.apache.org/` |
| OAuth credentials | Bearer token for authenticated endpoints | — |

Changes take effect immediately without reloading the extension.

## OTLP collector

Start the shared Jaeger collector from the flagon project root:

```sh
pnpm collector:up   # OTLP on :4318, Jaeger UI on :16686
pnpm collector:down
```

Logs appear at `http://localhost:16686`. The default logging endpoint in the extension options is already set to `http://localhost:4318`.

## Resources

- [UserALE core SDK](../core-sdk/)
- [Apache Flagon documentation](https://flagon.apache.org/userale/)
