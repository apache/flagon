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

const FORBIDDEN_STRUCT_KEYS = new Set([
  "__proto__",
  "constructor",
  "prototype",
]);

const KNOWN_CUSTOM_LOG_KEYS = new Set([
  "pageUrl",
  "pageTitle",
  "pageReferrer",
  "browser",
  "userAgent",
  "clientTime",
  "scrnRes",
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
  "traceId",
  "spanId",
]);

function safeFiniteInt(val: unknown): number | null {
  return typeof val === "number" && Number.isFinite(val)
    ? Math.trunc(val)
    : null;
}

function safeInt64String(val: unknown, fallback = "0"): string {
  const n = safeFiniteInt(val);
  return n !== null ? String(n) : fallback;
}

function toStructValue(val: unknown): unknown {
  if (val === null || val === undefined) {
    return null;
  }
  if (typeof val === "string" || typeof val === "boolean") {
    return val;
  }
  if (typeof val === "number") {
    return Number.isFinite(val) ? val : null;
  }
  if (typeof val === "bigint") {
    return val.toString(10);
  }
  if (Array.isArray(val)) {
    return val.map((item) => toStructValue(item));
  }
  if (typeof val === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
      if (FORBIDDEN_STRUCT_KEYS.has(k) || v === undefined) {
        continue;
      }
      out[k] = toStructValue(v);
    }
    return out;
  }
  return String(val);
}

function toProtoStruct(obj: unknown): Logging.JSONObject | undefined {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    return undefined;
  }
  const out: Logging.JSONObject = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    if (FORBIDDEN_STRUCT_KEYS.has(k) || v === undefined) {
      continue;
    }
    out[k] = toStructValue(v) as Logging.JSONObject[string];
  }
  return out;
}

function buildProtoMetadata(
  log: Logging.Log,
  config?: Configuration,
): Logging.JSONObject {
  const scrnRes = log.scrnRes as
    { width?: number; height?: number } | undefined | null;
  const metadata: Logging.JSONObject = {
    pageUrl: typeof log.pageUrl === "string" ? log.pageUrl : "",
    pageTitle: typeof log.pageTitle === "string" ? log.pageTitle : "",
    pageReferrer: typeof log.pageReferrer === "string" ? log.pageReferrer : "",
    userAgent: typeof log.userAgent === "string" ? log.userAgent : "",
    clientTime: safeInt64String(
      typeof log.clientTime === "number" && Number.isFinite(log.clientTime)
        ? log.clientTime
        : log.startTime,
      "0",
    ),
  };

  if (scrnRes && typeof scrnRes === "object") {
    const width = safeFiniteInt(scrnRes.width);
    const height = safeFiniteInt(scrnRes.height);
    if (width !== null || height !== null) {
      metadata.screenResolution = {
        width: width ?? 0,
        height: height ?? 0,
      };
    }
  }

  if (typeof log.userId === "string") metadata.userId = log.userId;
  if (typeof log.sessionId === "string") metadata.sessionId = log.sessionId;
  if (typeof log.httpSessionId === "string")
    metadata.httpSessionId = log.httpSessionId;
  if (typeof log.browserSessionId === "string")
    metadata.browserSessionId = log.browserSessionId;
  if (typeof log.toolName === "string") metadata.toolName = log.toolName;
  if (typeof log.toolVersion === "string")
    metadata.toolVersion = log.toolVersion;
  if (typeof log.useraleVersion === "string")
    metadata.useraleVersion = log.useraleVersion;

  if (config?.getResolvedPrivacy?.()?.attachTraceContext !== false) {
    if (typeof log.traceId === "string" && log.traceId.length > 0) {
      metadata.traceId = log.traceId;
    }
    if (typeof log.spanId === "string" && log.spanId.length > 0) {
      metadata.spanId = log.spanId;
    }
  }

  return metadata;
}

/**
 * Converts a flat UserALE log entry into the proto3 canonical JSON structure
 * defined by apache.flagon.userale.v1.UserALELog in log.proto (#142, #143).
 */
export function toProtoUserALELog(
  log: Logging.Log,
  config?: Configuration,
): Logging.JSONObject {
  const metadata = buildProtoMetadata(log, config);
  const logType = log.logType;

  if (logType === "raw") {
    const raw: Logging.JSONObject = {
      metadata,
      target: typeof log.target === "string" ? log.target : "",
      path: Array.isArray(log.path) ? (log.path as string[]) : [],
      eventType: typeof log.type === "string" ? log.type : "",
      userAction: Boolean(log.userAction),
    };

    const loc = log.location as
      { x?: number | null; y?: number | null } | undefined | null;
    if (loc && typeof loc === "object") {
      const lx =
        typeof loc.x === "number" && Number.isFinite(loc.x) ? loc.x : null;
      const ly =
        typeof loc.y === "number" && Number.isFinite(loc.y) ? loc.y : null;
      if (lx !== null || ly !== null) {
        const location: Logging.JSONObject = {};
        if (lx !== null) location.x = lx;
        if (ly !== null) location.y = ly;
        raw.location = location;
      }
    }

    if (typeof log.microTime === "number" && Number.isFinite(log.microTime)) {
      raw.microTime = log.microTime;
    }
    const detailsStruct = toProtoStruct(log.details);
    if (detailsStruct) {
      raw.details = detailsStruct;
    }
    const attrsStruct = toProtoStruct(log.attributes);
    if (attrsStruct) {
      raw.attributes = attrsStruct;
    }
    const styleStruct = toProtoStruct(log.style);
    if (styleStruct) {
      raw.style = styleStruct;
    }

    const tr = log.targetRect as
      | { x?: number; y?: number; width?: number; height?: number }
      | undefined
      | null;
    if (tr && typeof tr === "object" && !Array.isArray(tr)) {
      const rx = safeFiniteInt(tr.x);
      const ry = safeFiniteInt(tr.y);
      const rw = safeFiniteInt(tr.width);
      const rh = safeFiniteInt(tr.height);
      if (rx !== null && ry !== null && rw !== null && rh !== null) {
        raw.targetRect = { x: rx, y: ry, width: rw, height: rh };
      }
    }

    return {
      logType: "LOG_TYPE_RAW",
      raw,
    };
  }

  if (logType === "interval") {
    const interval: Logging.JSONObject = {
      metadata,
      target: typeof log.target === "string" ? log.target : "",
      path: Array.isArray(log.path) ? (log.path as string[]) : [],
      eventType: typeof log.type === "string" ? log.type : "",
      count: safeFiniteInt(log.count) ?? 0,
      duration: safeInt64String(log.duration, "0"),
      startTime: safeInt64String(log.startTime, "0"),
      endTime: safeInt64String(log.endTime, "0"),
      targetChange: Boolean(log.targetChange),
      typeChange: Boolean(log.typeChange),
      userAction: Boolean(log.userAction),
    };

    return {
      logType: "LOG_TYPE_INTERVAL",
      interval,
    };
  }

  const rawCustomFields: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(log)) {
    if (
      !FORBIDDEN_STRUCT_KEYS.has(key) &&
      !KNOWN_CUSTOM_LOG_KEYS.has(key) &&
      value !== undefined
    ) {
      rawCustomFields[key] = value;
    }
  }
  if (typeof logType === "string" && logType !== "custom") {
    rawCustomFields.logType = logType;
  }

  const custom: Logging.JSONObject = {
    metadata,
    userAction: Boolean(log.userAction),
    customFields: toProtoStruct(rawCustomFields) ?? {},
  };

  const customDetails = toProtoStruct(log.details);
  if (customDetails) {
    custom.details = customDetails;
  }

  const protoLogType =
    logType === "mutation"
      ? "LOG_TYPE_MUTATION"
      : logType === "replay"
        ? "LOG_TYPE_REPLAY"
        : "LOG_TYPE_CUSTOM";

  return {
    logType: protoLogType,
    custom,
  };
}

/**
 * Converts an array of UserALE logs into an apache.flagon.userale.v1.LogBatch
 * proto3 JSON object.
 */
export function toProtoLogBatch(
  logs: Array<Logging.Log>,
  config?: Configuration,
): Logging.JSONObject {
  return {
    logs: logs.map((entry) => toProtoUserALELog(entry, config)),
  };
}

/**
 * Exporter that serializes UserALE logs using the apache.flagon.userale.v1
 * Protobuf JSON schema (#142, #143) with zero runtime protobuf dependencies.
 */
export class ProtoJsonExporter extends HttpJsonExporter {
  private protoConfig: Configuration;

  constructor(config: Configuration) {
    super(config);
    this.protoConfig = config;
  }

  protected override serialize(logs: Array<Logging.Log>): string {
    return JSON.stringify(toProtoLogBatch(logs, this.protoConfig));
  }
}
