/*!
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Configuration } from "@/Configuration";
import { Logging, OTLP } from "@/types";
import { updateAuthHeader } from "@/utils/auth";
import { updateCustomHeaders } from "@/utils/headers";
import { generateSpanId, generateTraceId } from "@/utils/ids";

// ---------------------------------------------------------------------------
// OTLP serialization (pure functions — no state)
// ---------------------------------------------------------------------------

function encodeValue(v: unknown): OTLP.AnyValue {
  if (v === null || v === undefined) return { stringValue: "" };
  if (typeof v === "boolean") return { boolValue: v };
  if (typeof v === "number") {
    return Number.isInteger(v) ? { intValue: String(v) } : { doubleValue: v };
  }
  if (typeof v === "string") return { stringValue: v };
  if (Array.isArray(v)) {
    return { arrayValue: { values: v.map(encodeValue) } };
  }
  if (typeof v === "object") {
    return {
      kvlistValue: {
        values: Object.entries(v as Record<string, unknown>).map(
          ([k, val]) => ({ key: k, value: encodeValue(val) }),
        ),
      },
    };
  }
  return { stringValue: String(v) };
}

function attr(key: string, v: unknown): OTLP.KeyValue {
  return { key, value: encodeValue(v) };
}

/**
 * Converts a clientTime (ms) and optional microTime (fractional ms) to a
 * nanosecond decimal string as required by OTLP 1.10.0.
 */
function toNanoString(clientTimeMs: number, microTime: number = 0): string {
  return String(
    BigInt(Math.floor(clientTimeMs)) * 1_000_000n +
      BigInt(Math.round(microTime * 1_000_000)),
  );
}

function buildResource(config: Configuration): OTLP.Resource {
  const attributes: OTLP.KeyValue[] = [
    attr("service.name", config.toolName ?? "userale"),
    attr("service.version", config.toolVersion ?? ""),
    attr("userale.version", config.useraleVersion ?? ""),
    attr("userale.sessionId", config.sessionId ?? ""),
  ];
  if (config.userId) attributes.push(attr("userale.userId", config.userId));
  return { attributes };
}

const SCOPE: OTLP.InstrumentationScope = {
  name: "flagon-userale",
  version: "",
};

const KNOWN_LOG_KEYS = new Set([
  "logType",
  "type",
  "userAction",
  "pageUrl",
  "pageTitle",
  "pageReferrer",
  "userAgent",
  "sessionId",
  "browserSessionId",
  "httpSessionId",
  "clientTime",
  "microTime",
  "target",
  "path",
  "location",
  "scrnRes",
  "details",
  "attributes",
  "style",
  "userId",
  "toolVersion",
  "toolName",
  "useraleVersion",
]);

function buildLogRecord(
  log: Logging.RawLog | Logging.CustomLog,
  spanId: string,
  traceId: string,
): OTLP.LogRecord {
  const clientTime = log.clientTime ?? Date.now();
  const microTime = log.logType === "raw" ? (log.microTime ?? 0) : 0;

  const attributes: OTLP.KeyValue[] = [
    attr("userale.logType", log.logType),
    attr("userale.type", log.type),
    attr("userale.userAction", log.userAction),
    attr("browser.url", log.pageUrl),
    attr("browser.title", log.pageTitle),
    attr("browser.referrer", log.pageReferrer),
    attr("user_agent.original", log.userAgent),
    attr("userale.sessionId", log.sessionId),
    attr("userale.browserSessionId", log.browserSessionId),
    attr("userale.httpSessionId", log.httpSessionId),
    attr("userale.scrnRes", log.scrnRes),
  ];

  if (log.details !== null && log.details !== undefined) {
    attributes.push(attr("userale.details", log.details));
  }

  if (log.logType === "raw") {
    if (log.target !== undefined)
      attributes.push(attr("userale.target", log.target));
    if (log.path !== undefined) attributes.push(attr("userale.path", log.path));
    if (log.location !== undefined)
      attributes.push(attr("userale.location", log.location));
    if (Object.keys(log.attributes).length > 0)
      attributes.push(attr("userale.attributes", log.attributes));
    if (Object.keys(log.style).length > 0)
      attributes.push(attr("userale.style", log.style));
  }

  // Catch-all: extra fields added by callbacks are encoded as-is
  for (const key of Object.keys(log)) {
    if (!KNOWN_LOG_KEYS.has(key)) {
      const val = (log as Logging.JSONObject)[key];
      if (val !== undefined) attributes.push(attr(key, val));
    }
  }

  return {
    timeUnixNano: toNanoString(clientTime, microTime),
    observedTimeUnixNano: toNanoString(Date.now()),
    severityNumber: log.userAction ? 9 : 5,
    severityText: log.userAction ? "INFO" : "DEBUG",
    eventName: log.type ?? "",
    body: { stringValue: log.type ?? "" },
    attributes,
    traceId,
    spanId,
  };
}

function buildSpan(log: Logging.IntervalLog): OTLP.Span {
  const attributes: OTLP.KeyValue[] = [
    attr("userale.logType", "interval"),
    attr("userale.type", log.type),
    attr("userale.count", log.count),
    attr("userale.targetChange", log.targetChange),
    attr("userale.typeChange", log.typeChange),
    attr("userale.sessionId", log.sessionId),
    attr("userale.browserSessionId", log.browserSessionId),
    attr("userale.httpSessionId", log.httpSessionId),
    attr("browser.url", log.pageUrl),
    attr("browser.title", log.pageTitle),
    attr("user_agent.original", log.userAgent),
  ];
  if (log.target !== undefined)
    attributes.push(attr("userale.target", log.target));
  if (log.path !== undefined) attributes.push(attr("userale.path", log.path));

  return {
    traceId: generateTraceId(),
    spanId: generateSpanId(),
    name: `userale.${log.type ?? "interval"}`,
    kind: 1, // SPAN_KIND_INTERNAL
    startTimeUnixNano: toNanoString(log.startTime ?? 0),
    endTimeUnixNano: toNanoString(log.endTime ?? 0),
    attributes,
    status: { code: 0 }, // STATUS_CODE_UNSET
  };
}

function buildPayloads(
  logs: Logging.Log[],
  traceId: string,
  spanId: string,
  config: Configuration,
): OTLP.Payloads {
  const logRecords: OTLP.LogRecord[] = [];
  const spans: OTLP.Span[] = [];

  for (const log of logs) {
    if (log.logType === "interval") {
      spans.push(buildSpan(log));
    } else {
      logRecords.push(buildLogRecord(log, spanId, traceId));
    }
  }

  const resource = buildResource(config);
  const scope: OTLP.InstrumentationScope = {
    ...SCOPE,
    version: config.useraleVersion ?? "",
  };

  const logsPayload: OTLP.ExportLogsServiceRequest | undefined =
    logRecords.length > 0
      ? {
          resourceLogs: [
            {
              resource,
              scopeLogs: [{ scope, logRecords, schemaUrl: "" }],
              schemaUrl: "",
            },
          ],
        }
      : undefined;

  const tracesPayload: OTLP.ExportTraceServiceRequest | undefined =
    spans.length > 0
      ? {
          resourceSpans: [
            {
              resource,
              scopeSpans: [{ scope, spans, schemaUrl: "" }],
              schemaUrl: "",
            },
          ],
        }
      : undefined;

  return { logs: logsPayload, traces: tracesPayload };
}

// ---------------------------------------------------------------------------
// HTTP transport (pure — no state)
// ---------------------------------------------------------------------------

function buildHeaders(config: Configuration): Headers {
  updateAuthHeader(config);
  updateCustomHeaders(config);

  const headers = new Headers({ "Content-Type": "application/json" });

  if (config.authHeader) {
    const value =
      typeof config.authHeader === "function"
        ? config.authHeader()
        : config.authHeader;
    headers.set("Authorization", value as string);
  }

  if (config.headers) {
    for (const [key, value] of Object.entries(config.headers)) {
      headers.set(key, value);
    }
  }

  return headers;
}

async function exportBatch(
  logs: Logging.Log[],
  traceId: string,
  spanId: string,
  config: Configuration,
): Promise<void> {
  const { logs: logsPayload, traces: tracesPayload } = buildPayloads(
    logs,
    traceId,
    spanId,
    config,
  );

  const baseUrl = config.url.replace(/\/$/, "");
  const headers = buildHeaders(config);
  const sends: Promise<Response>[] = [];

  if (logsPayload) {
    sends.push(
      fetch(`${baseUrl}/v1/logs`, {
        method: "POST",
        headers,
        body: JSON.stringify(logsPayload),
      }),
    );
  }

  if (tracesPayload) {
    sends.push(
      fetch(`${baseUrl}/v1/traces`, {
        method: "POST",
        headers,
        body: JSON.stringify(tracesPayload),
      }),
    );
  }

  await Promise.all(sends);
}

// ---------------------------------------------------------------------------
// Sender — owns interval ID and active trace/span context
// ---------------------------------------------------------------------------

export class Sender {
  private sendIntervalId: ReturnType<typeof setInterval> | undefined;
  private activeTraceId: string = "";
  private activeSpanId: string = "";

  start(logs: Array<Logging.Log>, config: Configuration): void {
    if (this.sendIntervalId) {
      clearInterval(this.sendIntervalId);
    }
    this.activeTraceId = generateTraceId();
    this.activeSpanId = generateSpanId();
    this.sendIntervalId = this.onInterval(logs, config);
    this.onClose(logs, config);
  }

  stop(): void {
    if (this.sendIntervalId) {
      clearInterval(this.sendIntervalId);
      this.sendIntervalId = undefined;
    }
  }

  onInterval(
    logs: Array<Logging.Log>,
    config: Configuration,
  ): ReturnType<typeof setInterval> {
    return setInterval(() => {
      if (!config.on) return;
      if (logs.length >= config.logCountThreshold) {
        exportBatch(
          logs.slice(0),
          this.activeTraceId,
          this.activeSpanId,
          config,
        );
        logs.splice(0);
      }
    }, config.transmitInterval);
  }

  onClose(logs: Array<Logging.Log>, config: Configuration): void {
    self.addEventListener("pagehide", () => {
      if (!config.on || logs.length === 0) return;

      const { logs: logsPayload, traces: tracesPayload } = buildPayloads(
        logs,
        this.activeTraceId,
        this.activeSpanId,
        config,
      );

      const baseUrl = config.url.replace(/\/$/, "");
      const headers = buildHeaders(config);

      if (logsPayload) {
        fetch(`${baseUrl}/v1/logs`, {
          keepalive: true,
          method: "POST",
          headers,
          body: JSON.stringify(logsPayload),
        }).catch((error) => {
          console.error(error);
        });
      }

      if (tracesPayload) {
        fetch(`${baseUrl}/v1/traces`, {
          keepalive: true,
          method: "POST",
          headers,
          body: JSON.stringify(tracesPayload),
        }).catch((error) => {
          console.error(error);
        });
      }

      logs.splice(0);
    });
  }

  flush(logs: Array<Logging.Log>, config: Configuration): Promise<void> {
    return exportBatch(logs, this.activeTraceId, this.activeSpanId, config);
  }
}
