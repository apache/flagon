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

## Logging Custom, Non-User Events Examples

UserALE's API provides rich customization options to extend out-of-the-box DOM instrumentation and log non-user events.

### XMLHttpRequests

For user-workflow segmentation or comprehensive instrumentation, it may be desirable to capture when the client sends requests to other services:

```js
req.onreadystatechange = function () {
  if (req.readyState === XMLHttpRequest.DONE) {
    userale.log({
      clientTime: Date.now(),
      type: "XMLHttpRequest",
      logType: "custom",
      userAction: false,
      details: JSON.parse(req.response),
      userId: userale.options().userId,
      useraleVersion: userale.options().useraleVersion,
      sessionId: userale.options().sessionId,
    });
  }
};
```

The example above uses `userale.log` to construct a custom log directly. The same effect can also be achieved with `userale.packageCustomLog`, which merges custom fields with the canonical UserALE schema.

### OpenTelemetry Trace Correlation

UserALE natively supports W3C TraceContext correlation (`traceId` and `spanId`) across all logs via the `traceContext` configuration callback and `OtlpJsonExporter` / `OtelSdkExporter`:

```js
import { context, trace } from "@opentelemetry/api";
import * as userale from "flagon-userale";

userale.options({
  exporterType: "otlp",
  otlpEndpoint: "http://localhost:4318",
  traceContext: () => {
    const spanContext = trace.getSpan(context.active())?.spanContext();
    return spanContext
      ? { traceId: spanContext.traceId, spanId: spanContext.spanId }
      : null;
  },
});
```

You can also attach `traceId` manually to custom `XMLHttpRequest` logs (`see index.js`):

```js
req.onreadystatechange = function () {
  if (req.readyState === XMLHttpRequest.DONE) {
    const activeSpan = trace.getSpan(context.active());
    userale.log({
      clientTime: Date.now(),
      type: "XMLHttpRequest",
      logType: "custom",
      userAction: false,
      details: JSON.parse(req.response),
      userId: userale.options().userId,
      useraleVersion: userale.options().useraleVersion,
      sessionId: userale.options().sessionId,
      traceId: activeSpan ? activeSpan.spanContext().traceId : undefined,
    });
  }
};
```
