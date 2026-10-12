---
title: The UserALE.js API
component: useralejs
permalink: /docs/useralejs/API/
priority: 2
---

[Apache Flagon UserALE.js](https://github.com/apache/flagon/tree/master/products/userale/packages/flagon-userale) provides a comprehensive JavaScript and TypeScript API for runtime configuration, custom log enrichment/filtering, header injection, and pluggable wire exporters.

---

## Core Lifecycle & Configuration API

### `options(newConfig?: Partial<Settings.Config>): Settings.Config`

Reads or shallow-merges runtime configuration options. Calling `options()` with no arguments returns the current configuration object.

```typescript
import * as userale from 'flagon-userale';

userale.options({
  url: 'https://collector.example.com/v1/logs',
  userId: 'user-42',
  toolName: 'checkout-ui',
  toolVersion: '2.5.0',
  exporterFormat: 'otlp-json',
});
```

### `start(): void` & `stop(): void`

Starts or halts event capturing and log transmission. Particularly useful when `autostart: false` (`data-autostart="false"`) is configured until user consent or authentication completes.

```typescript
userale.options({ autostart: false });
// Later, after user consent:
userale.start();
```

### `version: string`

Exports the current `flagon-userale` package version string.

---

## Custom Logging & Filtering Callbacks

### `addCallbacks(callbacks: Record<string, CallableFunction>): boolean`

Registers one or more named callback functions executed sequentially on every packaged log (`(log, event) => log | false`). Returning `false` (or any falsy value) drops the log from the queue; returning a modified log object replaces it.

```typescript
userale.addCallbacks({
  dropIntervalLogs(log) {
    if (log.logType === 'interval') {
      return false;
    }
    return log;
  },
  attachExperimentTag(log, event) {
    return {
      ...log,
      experimentVariant: 'checkout-v2',
    };
  },
});
```

### `removeCallbacks(targetKeys: string[]): void`

Removes registered callbacks by name:

```typescript
userale.removeCallbacks(['dropIntervalLogs']);
```

### `log(customLog: Logging.CustomLog): boolean`

Appends a custom log object directly onto the UserALE queue:

```typescript
userale.log({
  target: 'checkout-funnel',
  type: 'step_complete',
  logType: 'custom',
  userAction: false,
  details: { step: 2, cartTotal: 149.0 },
});
```

### `packageLog(e: Event, detailFcn?: Logging.DynamicDetailFunction): boolean` & `packageCustomLog(customLogs: Logging.CustomLog, detailFcn: Logging.DynamicDetailFunction, userAction: boolean): boolean`

Packages a standard DOM `Event` or custom metadata object with full UserALE page/session/browser context and enqueues it.

### `details(config: Configuration, type: Events.AllowedEvents): ((e: Event) => Record<string, unknown>) | null`

Returns the default detail-extractor function for a given DOM event type (`click`, `keydown`, `input`, `change`, `wheel`, etc.). Note that `<input type="password">` values are automatically masked (`"********"`).

### `getSelector(ele: EventTarget): string` & `buildPath(e: Event): string[]`

Utility helpers that compute a CSS-like element selector (`tag#id.class`) and full DOM ancestry path array from a DOM `Event`.

### `getTargetRect(el: EventTarget | null): TargetRect | null` & `detectBrowser(): { browser: string; version: string }`

- `getTargetRect` extracts a rounded bounding box (`{ x, y, width, height, top, right, bottom, left }`) for a DOM element (attached automatically as `targetRect` on `click`, `dblclick`, `change`, and `submit` events).
- `detectBrowser` detects the browser name and version using `navigator.userAgentData` (User-Agent Client Hints) with a regex fallback and zero external dependencies.

---

## Authentication & Custom HTTP Headers

All HTTP-based exporters (`HttpJsonExporter`, `ProtoJsonExporter`, `OtlpJsonExporter`) construct headers through `buildHeaders(config)`, applying them to both interval `fetch()` requests and `pagehide` (`fetch(..., { keepalive: true })`) flushes.

### `registerAuthCallback(callback: () => string): boolean` & `resetAuthCallback(): void`

Registers (or resets) a dynamic provider returning the `Authorization` header value on each batch export:

```typescript
userale.registerAuthCallback(() => `Bearer ${getCurrentJwtToken()}`);
```

### `registerHeadersCallback(callback: () => Record<string, string>): boolean` & `resetHeadersCallback(): void`

Registers (or resets) a dynamic provider returning arbitrary HTTP headers on each batch export:

```typescript
userale.registerHeadersCallback(() => ({
  'x-tenant-id': 'acme-corp',
  'x-request-source': 'userale-web',
}));
```

Static headers can also be configured via `userale.options({ authHeader: 'Bearer ...', apiKey: '...', headers: { ... } })`.

---

## Pluggable Wire Exporters (`LogExporter`)

UserALE decouples in-memory event packaging from wire serialization and transport via the `LogExporter` interface:

```typescript
export interface LogExporter {
  export(logs: Array<Logging.Log>, options?: ExportOptions): Promise<ExportResult>;
  flush?(): Promise<void>;
  shutdown?(): Promise<void>;
}
```

### Built-In Exporters & Helpers

| Exported Symbol | Description |
|---|---|
| `registerExporter(exporter: LogExporter)` | Registers a custom `LogExporter` instance and switches the active sender to use it immediately. |
| `createExporter(config)` | Factory returning the active `LogExporter` for a `Configuration` instance. |
| `HttpJsonExporter` | Default exporter sending flat UserALE JSON arrays over `fetch` (with 48 KiB chunked `keepalive: true` on `pagehide`). |
| `WebSocketExporter` | Streams log batches over a persistent `WebSocket` (`ws://` / `wss://`). |
| `ProtoJsonExporter` / `toProtoLogBatch(logs)` / `toProtoUserALELog(log)` | Serializes logs into canonical Protobuf v1 JSON (`apache.flagon.userale.v1.LogBatch`) matching `proto/apache/flagon/userale/v1/log.proto`. |
| `OtlpJsonExporter` / `toOtlpExportLogsServiceRequest(logs, config)` | Serializes logs into OpenTelemetry `ExportLogsServiceRequest` JSON with `Resource` hoisting, `BigInt` nanosecond timestamps, `eventName`, structured `kvlistValue` body, and W3C `traceId`/`spanId` correlation. |
| `OtelSdkExporter` | Bridges UserALE logs directly into an existing OpenTelemetry JS `@opentelemetry/api-logs` `Logger` via `logger.emit(...)`. |
| `resolveOtlpLogsEndpoint(endpoint)` | Normalizes an OTLP base URL by appending `/v1/logs` when the URL path is empty or `/`. |
| `toUnixNanoString(clientTimeMs, microTime)` | Converts millisecond + sub-millisecond timestamps to a 64-bit nanosecond string using `BigInt`. |

### Example: Correlating UserALE Events with W3C Distributed Traces

```typescript
import * as userale from 'flagon-userale';

userale.options({
  exporterType: 'otlp',
  otlpEndpoint: 'http://localhost:4318/v1/logs',
  toolName: 'storefront-web',
  traceContext: () => ({
    traceId: currentActiveSpan.traceId, // 32-hex W3C trace-id
    spanId: currentActiveSpan.spanId,   // 16-hex W3C span-id
  }),
});
```

---

## Two-Layer Session Replay & Behavioral DOM Telemetry (`#104`)

UserALE provides a two-layer session replay architecture that keeps the core bundle dependency-free while supporting both structural DOM telemetry and `rrweb`-compatible visual playback:

| Exported Symbol | Description |
|---|---|
| `startSessionReplay(options?: SessionReplayOptions, config?: Configuration): () => void` | Starts Layer 1 (`MutationObserver` + `RageClickDetector`) and optional Layer 2 (`rrweb` ring-buffer recorder). Returns a stop/cleanup function. |
| `flushSessionReplay(trigger?: string): Promise<ReplayEnvelope \| null>` | Immediately flushes the rolling `rrweb` ring buffer as a `logType: 'replay', type: 'session_replay'` envelope tagged with `sessionId` and active OpenTelemetry `traceId` / `spanId`. |
| `stopSessionReplay(): void` | Stops active `MutationObserver` and `rrweb` recording and clears the ring buffer. |
| `getActiveReplayRingBuffer(): ReplayRingBuffer \| null` | Returns the active `ReplayRingBuffer` instance when session replay is running. |
| `ReplayRingBuffer` | Rolling in-memory ring buffer (`maxDurationMs`, `maxFrames`) that preserves `rrweb` `Meta` (`type: 4`) and latest `FullSnapshot` (`type: 2`) anchor frames. |
| `RageClickDetector` | Sliding-window detector that triggers when `threshold` (default `3`) clicks occur on the same target selector within `windowMs` (`1000ms`) and `maxRadiusPx` (`30px`). |

```typescript
import * as userale from 'flagon-userale';
import * as rrweb from 'rrweb';

userale.startSessionReplay({
  recorder: rrweb.record,
  maxDurationMs: 30_000,
  observeMutations: true,
  detectRageClicks: true,
  flushOnError: true,
});
```

---

## Contributing

Contributions are welcome! See our [Contributing Guide]({{ '/docs/contributing' | prepend: site.baseurl }}) or open an issue on [GitHub](https://github.com/apache/flagon/issues).