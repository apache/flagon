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
UserALE' API provides significant customization options; you can use it extend UserALE' out-of-the-box capabilities and log non-user events.

### XMLHttpRequests
For user-workflow segmentation or more comprehensive instrumentation, it may be desirable to capture when the client sends requests to other services.


```JavaScript
    req.onreadystatechange = function () {
      if (req.readyState == XMLHttpRequest.DONE) {
        userale.log({
          clientTime: Date.now(),
          type: 'XMLHttpRequest',
          logType: 'custom',
          userAction: 'false',
          details: JSON.parse(req.response),
          userId: userale.options().userId,
          useraleVersion: userale.options().useraleVersion,
          sessionId: userale.options().sessionId,
        });
      }
    }
```
The example above uses the `userale.log` API, allowing users to script their own log. However, the same effect is achieve with the `userale.packageCustomLog` API, which adds custom user field to the canonical UserALE schema.

The method above will similarly work with other types of requests (e.g., fetch, websocket, etc..)

### Custom Integrations
In the example below, custom UserALE logs can be used for integration with other instrumentation packages such as [OpenTelemetry](https://github.com/open-telemetry/opentelemetry-js). We can grab traceId's created by OpenTelemetry for tracing client requests throughout distributed systems and associate them with UserALE Logs. See the `index.js` for complete example modified from the [OpenTelemetry UserInteraction Plugin](https://github.com/open-telemetry/opentelemetry-js-contrib/tree/main/plugins/web/opentelemetry-instrumentation-user-interaction).
```JavaScript
    req.onreadystatechange = function () {
      if (req.readyState == XMLHttpRequest.DONE) {
        userale.log({
          clientTime: Date.now(),
          type: 'XMLHttpRequest',
          logType: 'custom',
          userAction: 'false',
          details: JSON.parse(req.response),
          userId: userale.options().userId,
          useraleVersion: userale.options().useraleVersion,
          sessionId: userale.options().sessionId,
          traceId: trace.getSpan(context.active())._spanContext.traceId
        });
      }
    }
```