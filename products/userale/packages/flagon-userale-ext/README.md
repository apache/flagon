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

This package provides a Manifest V3 browser extension for [Apache Flagon UserALE](https://flagon.apache.org/userale/), enabling zero-code behavioral instrumentation of websites. It captures DOM and browser tab interactions and exports logs to your configured collector endpoint.

The extension is built with [Plasmo](https://docs.plasmo.com/) and supports Chrome, Edge, and Firefox.

---

## Features

- Passive DOM and browser tab interaction logging across allowlisted URLs
- Zero code changes required on instrumented web pages
- Configurable **Exporter Format**:
  - **UserALE JSON (Default)** (`userale-json`)
  - **OpenTelemetry (OTLP/JSON)** (`otlp-json` — automatically normalizes `/v1/logs` endpoints)
  - **Protobuf v1 JSON (`LogBatch`)** (`proto-json`)
- Built-in support for **HTTP Basic Auth**, **OAuth 2.0 PKCE**, and **Custom HTTP Headers (JSON)**

---

## Getting Started (Development)

From `products/userale`:

1. Install workspace dependencies and build `flagon-userale`:

```bash
pnpm install
pnpm --dir packages/flagon-userale build
```

2. Start the extension development build:

```bash
pnpm --dir packages/flagon-userale-ext dev
```

3. Load the extension in your browser:
   - **Chrome / Edge**: Visit `chrome://extensions/`, enable **Developer mode**, click **Load unpacked**, and select `packages/flagon-userale-ext/build/chrome-mv3-dev/`.
   - **Firefox**: Visit `about:debugging`, select **This Firefox**, click **Load Temporary Add-on**, and select `manifest.json` in `packages/flagon-userale-ext/build/firefox-mv3-dev/`.

---

## Building for Production

```bash
pnpm --dir packages/flagon-userale-ext build
```

---

## Extension Options

Click the UserALE icon in your browser toolbar (or open the extension **Options** page) to configure:

- **Logging Endpoint URL**: Target HTTP(S), WebSocket (`ws://` / `wss://`), or OpenTelemetry Collector (`http://localhost:4318/v1/logs`) URL.
- **Exporter Format**: Choose between `UserALE JSON (Default)`, `OpenTelemetry (OTLP/JSON)`, or `Protobuf v1 JSON (LogBatch)`.
- **URL Allowlist**: Regular expression controlling which pages are instrumented.
- **User ID & Tool Metadata**: Optional user identifier, tool name, and version.
- **HTTP Basic Auth**: Optional username and password encoded as a `Basic` `Authorization` header.
- **Custom HTTP Headers (JSON)**: Optional JSON object of custom headers (e.g. `{"x-api-key": "..."}`) attached to every export request.
- **OAuth 2.0 PKCE Credentials**: Optional OAuth provider configuration for token-authenticated endpoints.

---

## Resources

- 📚 [UserALE Documentation](https://flagon.apache.org/docs/useralejs/)
- 🔭 [OpenTelemetry Demo Stack](../../example/otel-demo/README.md)
