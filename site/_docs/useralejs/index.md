---
title: Getting Started
component: useralejs
permalink: /docs/useralejs/
priority: 0
---

[Apache Flagon UserALE.js](https://github.com/apache/flagon/tree/master/products/userale/packages/flagon-userale) is the client-side instrumentation library for DOM and JavaScript applications. It automatically attaches event handlers, is configurable through HTML5 `data-*` attributes or a JavaScript/TypeScript API, and logs user interactions across web pages and single-page applications (SPAs) with zero runtime dependencies.

---

## Include UserALE.js in Your Project

Install `flagon-userale` from [npm](https://www.npmjs.com/package/flagon-userale):

```bash
npm install flagon-userale
# or
pnpm add flagon-userale
```

### 1. ES Module / Bundler Import (`ESM`)

```typescript
import * as userale from 'flagon-userale';

userale.options({
  url: 'http://localhost:8000',
  toolName: 'my-web-app',
  toolVersion: '1.0.0',
  logDetails: true,
});
```

### 2. Script Tag (`IIFE`)

```html
<script
  src="./node_modules/flagon-userale/build/main.global.js"
  data-url="http://localhost:8000/"
  data-tool="my-web-app"
  data-version="1.0.0"
></script>
```

### 3. OpenTelemetry Collector (`OTLP/JSON`)

UserALE.js natively exports OpenTelemetry Logs (`ExportLogsServiceRequest` over HTTP/JSON) without requiring `@opentelemetry/*` packages:

```html
<script
  src="./node_modules/flagon-userale/build/main.global.js"
  data-exporter="otlp"
  data-otlp-endpoint="http://localhost:4318/v1/logs"
  data-tool="checkout-web"
></script>
```

Try the full-stack [OpenTelemetry + Grafana + Loki + Tempo Demo](https://github.com/apache/flagon/tree/master/products/userale/example/otel-demo) with `docker compose up -d`!

---

## Configuration Options

All options can be configured via HTML `data-*` attributes on the `<script>` tag or programmatically via `userale.options({...})`:

| JS Option | Script `data-*` Attribute | Description | Default |
|---|---|---|---|
| `url` | `data-url` | Logging endpoint URL (`http://`, `https://`, `ws://`, `wss://`) | `'http://localhost:8000'` |
| `autostart` | `data-autostart` | Start capturing and sending logs automatically on load | `true` |
| `transmitInterval` | `data-interval` | Interval between batch transmit checks (ms) | `5000` |
| `logCountThreshold` | `data-threshold` | Minimum queued logs required before interval send | `5` |
| `userId` | `data-user` | User identifier | `null` |
| `sessionId` | `data-session` | Session identifier | Auto-generated |
| `toolName` | `data-tool` | Application / tool name (`service.name` in OTLP) | `null` |
| `toolVersion` / `version` | `data-version` | Application semantic version (`service.version` in OTLP) | `null` |
| `logDetails` | `data-log-details` | Include detailed event payloads (e.g. key codes, input values; password inputs are automatically masked) | `false` |
| `resolution` | `data-resolution` | Aggregation interval for high-frequency events (`mouseover`, `scroll`, etc.) in ms | `500` |
| `userFromParams` | `data-user-from-params` | URL query parameter to extract `userId` from | `null` |
| `authHeader` | `data-auth` | `Authorization` header string or callback | `null` |
| `apiKey` | `data-api-key` | Value sent in the `x-api-key` HTTP header | `null` |
| `exporterFormat` / `exporterType` | `data-exporter` | Wire format: `'userale-json'` (default), `'otlp-json'` (`'otlp'`), `'proto-json'`, or `'ws'` | `'userale-json'` |
| `otlpEndpoint` | `data-otlp-endpoint` | OpenTelemetry Collector HTTP logs endpoint (automatically appends `/v1/logs` if given a base origin) | `null` |
| `headers` | — | Custom HTTP headers `Record<string, string>` merged into every request | `null` |
| `exporter` | — | Custom `LogExporter` instance implementing `export(logs, options)` | `null` |
| `traceContext` | — | Optional `() => ({ traceId, spanId })` callback for W3C TraceContext correlation | `null` |

See the [UserALE.js API Reference]({{ '/docs/useralejs/API' | prepend: site.baseurl }}) for full method and exporter documentation.

---

## Deploying the UserALE.js Browser Extension

The [UserALE Browser Extension](https://github.com/apache/flagon/tree/master/products/userale/packages/flagon-userale-ext) is a Manifest V3 extension built with Plasmo that injects UserALE.js into pages matching a configurable URL allowlist.

1. Build the workspace from `products/userale`:
   ```bash
   pnpm install
   pnpm build
   ```
2. Load the extension in your browser:
   - **Chrome / Edge**: Open `chrome://extensions/`, enable **Developer mode**, click **Load unpacked**, and select `products/userale/packages/flagon-userale-ext/build/chrome-mv3-prod/` (or `chrome-mv3-dev/` when running `pnpm dev`).
   - **Firefox**: Open `about:debugging`, select **This Firefox**, click **Load Temporary Add-on**, and select `manifest.json` in `products/userale/packages/flagon-userale-ext/build/firefox-mv3-prod/`.
3. Open the extension **Options** page to configure the **Logging Endpoint**, **Exporter Format** (`UserALE JSON`, `OpenTelemetry (OTLP/JSON)`, or `Protobuf v1 JSON`), **URL Allowlist**, **HTTP Basic Auth**, **Custom HTTP Headers (JSON)**, or **OAuth PKCE** credentials.

---

## Contributing

Contributions are welcome! See our [Contributing Guide]({{ '/docs/contributing' | prepend: site.baseurl }}) or open an issue on [GitHub](https://github.com/apache/flagon/issues).