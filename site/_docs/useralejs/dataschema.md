---
title: UserALE.js' Data Schema
component: useralejs
permalink: /docs/useralejs/dataschema/
priority: 4
---

This guide describes the structure of [Apache Flagon UserALE.js](https://github.com/apache/flagon/tree/master/products/userale/packages/flagon-userale) logs, including:
- The in-memory and default flat JSON schema (`'userale-json'`)
- The OpenTelemetry OTLP/JSON export schema (`'otlp-json'`)
- The Protobuf v1 canonical JSON export schema (`'proto-json'`, [`proto/apache/flagon/userale/v1/log.proto`](https://github.com/apache/flagon/blob/master/proto/apache/flagon/userale/v1/log.proto))

All three formats are natively supported by **Apache Flagon Distill** (`distill.schemas.userale.extract_logs` and `UserAleSchema`).

---

## 1. Standard UserALE Flat JSON Schema (`exporterFormat: 'userale-json'`)

By default, UserALE.js packages each interaction as a flat JSON object so `userale.addCallbacks(...)` filters and mappers can inspect or transform fields with zero nesting overhead.

### Raw Interaction Log (`logType: 'raw'`)

```json
{
  "target": "button#test_button",
  "path": [
    "button#test_button",
    "div.container",
    "body",
    "html",
    "#document",
    "Window"
  ],
  "pageUrl": "http://localhost:8000/",
  "pageTitle": "UserALE - Example Page",
  "pageReferrer": "",
  "browser": { "browser": "firefox", "version": "131.0.0" },
  "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:131.0) Gecko/20100101 Firefox/131.0",
  "clientTime": 1729658103797,
  "microTime": 0.42,
  "location": { "x": 66, "y": 220 },
  "scrnRes": { "width": 1920, "height": 915 },
  "type": "click",
  "logType": "raw",
  "userAction": true,
  "details": { "clicks": 1, "ctrl": false, "alt": false, "shift": false, "meta": false },
  "userId": "me",
  "toolVersion": "2.4.0",
  "toolName": "Apache UserALE Example",
  "useraleVersion": "2.4.0",
  "sessionId": "session_1729657762020",
  "httpSessionId": "057109eed2c0b107476731f201b6d63d",
  "browserSessionId": null,
  "attributes": { "id": "test_button" },
  "style": {}
}
```

### Interval Summary Log (`logType: 'interval'`)

High-frequency events (`mouseover`, `scroll`, etc.) are aggregated over `resolution` ms windows into `interval` logs with `startTime`, `endTime`, `duration`, and `count`:

```json
{
  "target": "div.feed",
  "path": ["div.feed", "body", "html"],
  "pageUrl": "https://apache.org/",
  "pageTitle": "Welcome to The Apache Software Foundation!",
  "pageReferrer": "",
  "browser": { "browser": "chrome", "version": "125.0.0" },
  "count": 14,
  "duration": 480,
  "startTime": 1729720562000,
  "endTime": 1729720562480,
  "type": "mouseover",
  "logType": "interval",
  "targetChange": true,
  "typeChange": false,
  "userAction": false,
  "userId": "me",
  "toolVersion": "2.4.0",
  "toolName": "Apache UserALE Example",
  "useraleVersion": "2.4.0",
  "sessionId": "session_1727742067433",
  "httpSessionId": "298926d0ffe8085dc0f7c421dbad9c3a",
  "browserSessionId": "d43400275c1f4f04f1ce74da7d0cd3c8"
}
```

---

## 2. OpenTelemetry OTLP/JSON Schema (`exporterFormat: 'otlp-json'`)

When `exporterFormat: 'otlp-json'` (or `data-exporter="otlp"`) is enabled, `OtlpJsonExporter` serializes each batch into an OpenTelemetry `ExportLogsServiceRequest` JSON payload:

- **Resource Attributes (`resourceLogs[].resource.attributes`)**: Constant session/device metadata is hoisted once per batch:
  - `service.name` $\leftarrow$ `toolName` (defaults to `"unknown_service:userale"`)
  - `service.version` $\leftarrow$ `toolVersion`
  - `telemetry.sdk.name` $\leftarrow$ `"apache-flagon-userale"`
  - `telemetry.sdk.language` $\leftarrow$ `"webjs"`
  - `telemetry.sdk.version` $\leftarrow$ `useraleVersion`
  - `user_agent.original` $\leftarrow$ `userAgent`
  - `browser.name`, `browser.version` $\leftarrow$ `browser`
  - `session.id` $\leftarrow$ `sessionId`
  - `flagon.http_session_id`, `flagon.browser_session_id`
  - `screen.width`, `screen.height` $\leftarrow$ `scrnRes`
- **LogRecord Fields (`scopeLogs[].logRecords[]`)**:
  - `timeUnixNano` / `observedTimeUnixNano`: 64-bit nanosecond string computed with `BigInt` (`clientTime * 1_000_000 + subMsNanos`)
  - `eventName`: `"userale.<logType>.<type>"` (e.g. `"userale.raw.click"`, `"userale.interval.mouseover"`)
  - `traceId` / `spanId`: Populated from `log.traceId`/`log.spanId` or `config.traceContext()`
  - `body`: Structured `kvlistValue` representation of `log.details`
  - `attributes`: `event.name`, `url.full`, `user.id`, `flagon.log_type`, `flagon.event_type`, `flagon.target`, `flagon.path` (`arrayValue`), `flagon.page_title`, `flagon.page_referrer`, `flagon.user_action`, `flagon.location.x`, `flagon.location.y`, `flagon.attributes`, `flagon.style`, and interval metrics (`flagon.count`, `flagon.duration_ms`, `flagon.start_time_ms`, `flagon.end_time_ms`)

---

## 3. Protobuf v1 Canonical JSON Schema (`exporterFormat: 'proto-json'`)

When `exporterFormat: 'proto-json'` is configured, `ProtoJsonExporter` serializes each batch into canonical Proto3 JSON conforming to [`proto/apache/flagon/userale/v1/log.proto`](https://github.com/apache/flagon/blob/master/proto/apache/flagon/userale/v1/log.proto) (`apache.flagon.userale.v1.LogBatch`), grouping common context into `metadata` (`CommonMetadata`) and using the `raw`, `interval`, or `custom` `oneof` variant on each `UserALELog`.

---

## Contributing

Contributions are welcome! See our [Contributing Guide]({{ '/docs/contributing' | prepend: site.baseurl }}) or open an issue on [GitHub](https://github.com/apache/flagon/issues).