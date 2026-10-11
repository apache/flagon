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

import type { Configuration } from "@/configure";
import type { Logging } from "@/types";
import { HttpJsonExporter } from "./http-json";

export interface OtlpKeyValue {
  key: string;
  value: OtlpAnyValue;
}

export interface OtlpAnyValue {
  stringValue?: string;
  boolValue?: boolean;
  intValue?: string;
  doubleValue?: number;
  arrayValue?: { values: Array<OtlpAnyValue> };
  kvlistValue?: { values: Array<OtlpKeyValue> };
}

export interface OtlpLogRecord {
  timeUnixNano: string;
  observedTimeUnixNano: string;
  severityNumber: number;
  severityText: string;
  eventName?: string;
  body?: OtlpAnyValue;
  attributes: Array<OtlpKeyValue>;
  traceId?: string;
  spanId?: string;
}

export interface OtlpExportLogsServiceRequest {
  resourceLogs: Array<{
    resource: {
      attributes: Array<OtlpKeyValue>;
    };
    scopeLogs: Array<{
      scope: {
        name: string;
        version: string;
      };
      logRecords: Array<OtlpLogRecord>;
    }>;
  }>;
}

const HEX_32_RE = /^[0-9a-f]{32}$/i;
const HEX_16_RE = /^[0-9a-f]{16}$/i;
const ALL_ZEROS_RE = /^0+$/;

const KNOWN_LOG_KEYS = new Set([
  "target",
  "path",
  "pageUrl",
  "pageTitle",
  "pageReferrer",
  "browser",
  "userAgent",
  "clientTime",
  "scrnRes",
  "microTime",
  "location",
  "type",
  "logType",
  "userAction",
  "details",
  "userId",
  "toolVersion",
  "toolName",
  "useraleVersion",
  "sessionId",
  "httpSessionId",
  "browserSessionId",
  "attributes",
  "style",
  "count",
  "duration",
  "startTime",
  "endTime",
  "targetChange",
  "typeChange",
  "traceId",
  "spanId",
]);

/**
 * Normalizes an OTLP HTTP endpoint URL. If the URL has an empty or root ("/")
 * pathname, appends "/v1/logs" automatically. Custom paths are preserved.
 */
export function resolveOtlpLogsEndpoint(rawUrl: string): string {
  try {
    const parsed = new URL(
      rawUrl,
      typeof window !== "undefined" && window.location
        ? window.location.origin
        : "http://localhost:4318",
    );
    if (parsed.pathname === "" || parsed.pathname === "/") {
      parsed.pathname = "/v1/logs";
      return parsed.toString();
    }
    return rawUrl;
  } catch {
    const trimmed = rawUrl.replace(/\/+$/, "");
    return `${trimmed}/v1/logs`;
  }
}

/**
 * Converts an arbitrary JavaScript value into an OTLP/JSON AnyValue object.
 */
export function toOtlpAnyValue(val: unknown): OtlpAnyValue {
  if (val === null || val === undefined) {
    return { stringValue: "" };
  }
  if (typeof val === "string") {
    return { stringValue: val };
  }
  if (typeof val === "boolean") {
    return { boolValue: val };
  }
  if (typeof val === "bigint") {
    return { intValue: val.toString(10) };
  }
  if (typeof val === "number") {
    if (!Number.isFinite(val)) {
      return { stringValue: String(val) };
    }
    if (Number.isInteger(val)) {
      return { intValue: BigInt(val).toString(10) };
    }
    return { doubleValue: val };
  }
  if (Array.isArray(val)) {
    return {
      arrayValue: {
        values: val.map((item) => toOtlpAnyValue(item)),
      },
    };
  }
  if (typeof val === "object") {
    const entries = Object.entries(val as Record<string, unknown>).filter(
      ([, v]) => v !== undefined,
    );
    return {
      kvlistValue: {
        values: entries.map(([key, v]) => ({
          key,
          value: toOtlpAnyValue(v),
        })),
      },
    };
  }
  return { stringValue: String(val) };
}

function pushStringAttr(
  attrs: Array<OtlpKeyValue>,
  key: string,
  val: unknown,
): void {
  if (typeof val === "string" && val.length > 0) {
    attrs.push({ key, value: { stringValue: val } });
  }
}

function pushIntAttr(
  attrs: Array<OtlpKeyValue>,
  key: string,
  val: unknown,
): void {
  if (typeof val === "number" && Number.isFinite(val)) {
    attrs.push({
      key,
      value: { intValue: BigInt(Math.trunc(val)).toString(10) },
    });
  }
}

function pushDoubleAttr(
  attrs: Array<OtlpKeyValue>,
  key: string,
  val: unknown,
): void {
  if (typeof val === "number" && Number.isFinite(val)) {
    attrs.push({ key, value: { doubleValue: val } });
  }
}

function pushBoolAttr(
  attrs: Array<OtlpKeyValue>,
  key: string,
  val: unknown,
): void {
  if (typeof val === "boolean") {
    attrs.push({ key, value: { boolValue: val } });
  }
}

/**
 * Computes a base-10 nanosecond UNIX timestamp string using BigInt arithmetic
 * to avoid IEEE-754 double precision loss beyond Number.MAX_SAFE_INTEGER.
 */
export function toUnixNanoString(
  clientTimeMs: unknown,
  microTime?: unknown,
): string {
  const ms =
    typeof clientTimeMs === "number" && Number.isFinite(clientTimeMs)
      ? Math.trunc(clientTimeMs)
      : Date.now();
  let subMsNanos = 0;
  if (typeof microTime === "number" && Number.isFinite(microTime)) {
    const frac = microTime - Math.trunc(microTime);
    if (frac > 0 && frac < 1) {
      subMsNanos = Math.round(frac * 1_000_000);
    }
  }
  return (BigInt(ms) * BigInt(1_000_000) + BigInt(subMsNanos)).toString(10);
}

/**
 * Extracts active W3C TraceContext (traceId, spanId) from the log entry,
 * configured traceContext callback, or global OpenTelemetry API if present.
 */
function resolveTraceContext(
  log: Logging.Log,
  config?: Configuration,
): { traceId?: string; spanId?: string } {
  let rawTraceId = typeof log.traceId === "string" ? log.traceId : undefined;
  let rawSpanId = typeof log.spanId === "string" ? log.spanId : undefined;

  if (
    (!rawTraceId || !rawSpanId) &&
    typeof config?.traceContext === "function"
  ) {
    try {
      const ctx = config.traceContext();
      if (ctx) {
        rawTraceId = rawTraceId ?? ctx.traceId;
        rawSpanId = rawSpanId ?? ctx.spanId;
      }
    } catch {
      // Ignore user callback errors
    }
  }

  if (!rawTraceId || !rawSpanId) {
    const globalOtel = (
      globalThis as unknown as {
        opentelemetry?: {
          trace?: {
            getActiveSpan?: () =>
              | {
                  spanContext?: () => { traceId?: string; spanId?: string };
                }
              | undefined;
          };
        };
      }
    ).opentelemetry;
    const spanCtx = globalOtel?.trace?.getActiveSpan?.()?.spanContext?.();
    if (spanCtx) {
      rawTraceId = rawTraceId ?? spanCtx.traceId;
      rawSpanId = rawSpanId ?? spanCtx.spanId;
    }
  }

  const result: { traceId?: string; spanId?: string } = {};
  if (
    rawTraceId &&
    HEX_32_RE.test(rawTraceId) &&
    !ALL_ZEROS_RE.test(rawTraceId)
  ) {
    result.traceId = rawTraceId.toLowerCase();
  }
  if (rawSpanId && HEX_16_RE.test(rawSpanId) && !ALL_ZEROS_RE.test(rawSpanId)) {
    result.spanId = rawSpanId.toLowerCase();
  }
  return result;
}

/**
 * Builds the OTLP Resource attributes hoisted from the batch and configuration.
 */
export function buildOtlpResourceAttributes(
  logs: Array<Logging.Log>,
  config?: Configuration,
): Array<OtlpKeyValue> {
  const first = logs[0] ?? {};
  const attrs: Array<OtlpKeyValue> = [];

  const serviceName =
    (typeof first.toolName === "string" && first.toolName) ||
    config?.toolName ||
    "unknown_service:userale";
  attrs.push({ key: "service.name", value: { stringValue: serviceName } });

  const serviceVersion =
    (typeof first.toolVersion === "string" && first.toolVersion) ||
    config?.toolVersion;
  pushStringAttr(attrs, "service.version", serviceVersion);

  attrs.push({
    key: "telemetry.sdk.name",
    value: { stringValue: "apache-flagon-userale" },
  });
  attrs.push({
    key: "telemetry.sdk.language",
    value: { stringValue: "webjs" },
  });

  const sdkVersion =
    (typeof first.useraleVersion === "string" && first.useraleVersion) ||
    config?.useraleVersion ||
    "2.5.0";
  pushStringAttr(attrs, "telemetry.sdk.version", sdkVersion);

  pushStringAttr(attrs, "user_agent.original", first.userAgent);

  const browserObj = first.browser as
    { browser?: string; version?: string } | undefined;
  if (browserObj && typeof browserObj === "object") {
    pushStringAttr(attrs, "browser.name", browserObj.browser);
    pushStringAttr(attrs, "browser.version", browserObj.version);
  }

  const sessionId =
    (typeof first.sessionId === "string" && first.sessionId) ||
    config?.sessionId;
  pushStringAttr(attrs, "session.id", sessionId);

  const httpSessionId =
    (typeof first.httpSessionId === "string" && first.httpSessionId) ||
    config?.httpSessionId;
  pushStringAttr(attrs, "flagon.http_session_id", httpSessionId);

  const browserSessionId =
    (typeof first.browserSessionId === "string" && first.browserSessionId) ||
    config?.browserSessionId;
  pushStringAttr(attrs, "flagon.browser_session_id", browserSessionId);

  const scrnRes = first.scrnRes as
    { width?: number; height?: number } | undefined;
  if (scrnRes && typeof scrnRes === "object") {
    pushIntAttr(attrs, "screen.width", scrnRes.width);
    pushIntAttr(attrs, "screen.height", scrnRes.height);
  }

  return attrs;
}

/**
 * Converts a single UserALE log entry into an OTLP LogRecord.
 */
export function toOtlpLogRecord(
  log: Logging.Log,
  config?: Configuration,
): OtlpLogRecord {
  const logType = typeof log.logType === "string" ? log.logType : "raw";
  const eventType =
    typeof log.type === "string" && log.type.trim().length > 0
      ? log.type.trim()
      : logType;
  const eventName = `userale.${logType}.${eventType}`;

  const primaryTimeMs =
    typeof log.clientTime === "number"
      ? log.clientTime
      : typeof log.endTime === "number"
        ? log.endTime
        : typeof log.startTime === "number"
          ? log.startTime
          : Date.now();
  const timeUnixNano = toUnixNanoString(primaryTimeMs, log.microTime);

  const attrs: Array<OtlpKeyValue> = [
    { key: "event.name", value: { stringValue: eventName } },
    { key: "flagon.log_type", value: { stringValue: logType } },
    { key: "flagon.event_type", value: { stringValue: eventType } },
  ];

  pushStringAttr(attrs, "url.full", log.pageUrl);
  pushStringAttr(attrs, "page.title", log.pageTitle);
  pushStringAttr(attrs, "page.referrer", log.pageReferrer);
  pushStringAttr(attrs, "user.id", log.userId);
  pushStringAttr(attrs, "flagon.target", log.target);
  pushBoolAttr(attrs, "flagon.user_action", log.userAction);

  if (Array.isArray(log.path) && log.path.length > 0) {
    attrs.push({
      key: "flagon.path",
      value: {
        arrayValue: {
          values: log.path.map((p) => ({ stringValue: String(p) })),
        },
      },
    });
  }

  const loc = log.location as
    { x?: number | null; y?: number | null } | undefined;
  if (loc && typeof loc === "object") {
    pushDoubleAttr(attrs, "flagon.location.x", loc.x);
    pushDoubleAttr(attrs, "flagon.location.y", loc.y);
  }

  if (logType === "interval") {
    pushIntAttr(attrs, "flagon.interval.count", log.count);
    pushIntAttr(attrs, "flagon.interval.duration_ms", log.duration);
    pushIntAttr(attrs, "flagon.interval.start_time_ms", log.startTime);
    pushIntAttr(attrs, "flagon.interval.end_time_ms", log.endTime);
    pushBoolAttr(attrs, "flagon.interval.target_change", log.targetChange);
    pushBoolAttr(attrs, "flagon.interval.type_change", log.typeChange);
  }

  if (
    log.attributes &&
    typeof log.attributes === "object" &&
    !Array.isArray(log.attributes) &&
    Object.keys(log.attributes as Record<string, unknown>).length > 0
  ) {
    attrs.push({
      key: "flagon.element.attributes",
      value: toOtlpAnyValue(log.attributes),
    });
  }

  if (
    log.style &&
    typeof log.style === "object" &&
    !Array.isArray(log.style) &&
    Object.keys(log.style as Record<string, unknown>).length > 0
  ) {
    attrs.push({
      key: "flagon.element.style",
      value: toOtlpAnyValue(log.style),
    });
  }

  // Collect any top-level custom fields attached via packageCustomLog / userale.map
  const extraFields: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(log)) {
    if (!KNOWN_LOG_KEYS.has(key) && val !== undefined) {
      extraFields[key] = val;
    }
  }

  const bodyObj: Record<string, unknown> = {};
  if (
    log.details &&
    typeof log.details === "object" &&
    !Array.isArray(log.details)
  ) {
    Object.assign(bodyObj, log.details);
  } else if (log.details !== undefined && log.details !== null) {
    bodyObj.details = log.details;
  }
  Object.assign(bodyObj, extraFields);

  const body: OtlpAnyValue =
    Object.keys(bodyObj).length > 0
      ? toOtlpAnyValue(bodyObj)
      : {
          stringValue:
            typeof log.target === "string" && log.target
              ? `${eventType} on ${log.target}`
              : eventType,
        };

  const record: OtlpLogRecord = {
    timeUnixNano,
    observedTimeUnixNano: timeUnixNano,
    severityNumber: 9,
    severityText: "INFO",
    eventName,
    body,
    attributes: attrs,
  };

  const traceCtx = resolveTraceContext(log, config);
  if (traceCtx.traceId) {
    record.traceId = traceCtx.traceId;
  }
  if (traceCtx.spanId) {
    record.spanId = traceCtx.spanId;
  }

  return record;
}

/**
 * Converts a batch of UserALE logs into an OTLP/JSON ExportLogsServiceRequest payload.
 */
export function toOtlpExportLogsServiceRequest(
  logs: Array<Logging.Log>,
  config?: Configuration,
): OtlpExportLogsServiceRequest {
  const first = logs[0] ?? {};
  const scopeVersion =
    (typeof first.useraleVersion === "string" && first.useraleVersion) ||
    config?.useraleVersion ||
    "2.5.0";

  return {
    resourceLogs: [
      {
        resource: {
          attributes: buildOtlpResourceAttributes(logs, config),
        },
        scopeLogs: [
          {
            scope: {
              name: "org.apache.flagon.userale",
              version: scopeVersion,
            },
            logRecords: logs.map((log) => toOtlpLogRecord(log, config)),
          },
        ],
      },
    ],
  };
}

/**
 * Exports UserALE log batches in OpenTelemetry OTLP/JSON (ExportLogsServiceRequest)
 * format over HTTP/HTTPS.
 */
export class OtlpJsonExporter extends HttpJsonExporter {
  private otlpConfig: Configuration;

  constructor(config: Configuration) {
    super(config);
    this.otlpConfig = config;
  }

  protected override getEndpoint(): string {
    const raw = this.otlpConfig.otlpEndpoint || this.otlpConfig.url;
    return resolveOtlpLogsEndpoint(raw);
  }

  protected override serialize(logs: Array<Logging.Log>): string {
    return JSON.stringify(
      toOtlpExportLogsServiceRequest(logs, this.otlpConfig),
    );
  }
}
