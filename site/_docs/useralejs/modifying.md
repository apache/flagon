---
title: Modifying UserALE.js Source Code
component: useralejs
permalink: /docs/useralejs/modifying/
priority: 3
---

[Apache Flagon UserALE.js](https://github.com/apache/flagon/tree/master/products/userale/packages/flagon-userale) makes it easy to capture and customize behavioral telemetry via the runtime [JavaScript API]({{ '/docs/useralejs/API' | prepend: site.baseurl }}) (`addCallbacks`, `options`, `registerExporter`). When you need deeper changes, the TypeScript source code under `products/userale/packages/flagon-userale/src/` is modular and straightforward to extend.

---

## Source Code Architecture (`products/userale/packages/flagon-userale/src/`)

- [`main.ts`](https://github.com/apache/flagon/blob/master/products/userale/packages/flagon-userale/src/main.ts): Public module entry point exporting lifecycle functions (`start`, `stop`, `options`, `log`), callback helpers, and exporters.
- [`getInitialSettings.ts`](https://github.com/apache/flagon/blob/master/products/userale/packages/flagon-userale/src/getInitialSettings.ts): Extracts initial settings from `<script data-*>` attributes and browser session storage (with SSR safety guards).
- [`configure.ts`](https://github.com/apache/flagon/blob/master/products/userale/packages/flagon-userale/src/configure.ts): Singleton `Configuration` class managing runtime options.
- [`attachHandlers.ts`](https://github.com/apache/flagon/blob/master/products/userale/packages/flagon-userale/src/attachHandlers.ts): Defines captured DOM/window events, interval buffering, and detail extraction (including automatic masking for `<input type="password">`).
- [`packageLogs.ts`](https://github.com/apache/flagon/blob/master/products/userale/packages/flagon-userale/src/packageLogs.ts): Packages DOM events and custom events into UserALE log objects, executing registered `addCallbacks` functions.
- [`sendLogs.ts`](https://github.com/apache/flagon/blob/master/products/userale/packages/flagon-userale/src/sendLogs.ts): Manages the batch interval timer and `pagehide` unload flushing, delegating wire serialization and transport to the active `LogExporter`.
- [`exporters/`](https://github.com/apache/flagon/tree/master/products/userale/packages/flagon-userale/src/exporters):
  - `types.ts`: `LogExporter`, `ExportOptions`, `ExportResult`, and `ExporterType` interfaces.
  - `headers.ts`: Unified `buildHeaders(config)` and `chunkLogsForKeepalive` (48 KiB chunking for `fetch(..., { keepalive: true })`).
  - `http-json.ts`: Default `HttpJsonExporter` (`'userale-json'`).
  - `otlp-json.ts`: Native OpenTelemetry `OtlpJsonExporter` (`'otlp-json'`).
  - `otel-sdk.ts`: OpenTelemetry JS Logs API bridge (`OtelSdkExporter`).
  - `proto-json.ts`: Canonical Protobuf v1 JSON exporter (`ProtoJsonExporter`, `'proto-json'`).
  - `websocket.ts`: Persistent `WebSocketExporter` (`'ws'`).

---

## Rebuilding & Verifying Modifications

After modifying any file in `products/userale/packages/flagon-userale/src/`, rebuild and run the unit test suite from `products/userale`:

```bash
pnpm build
pnpm --dir packages/flagon-userale test
```

---

## Contributing

Contributions are welcome! See our [Contributing Guide]({{ '/docs/contributing' | prepend: site.baseurl }}) or open an issue on [GitHub](https://github.com/apache/flagon/issues).