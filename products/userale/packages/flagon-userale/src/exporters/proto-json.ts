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

import type { Logging } from "@/types";
import { HttpJsonExporter } from "./http-json";

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
]);

function buildProtoMetadata(log: Logging.Log): Logging.JSONObject {
  const scrnRes = log.scrnRes as
    { width?: number; height?: number } | undefined;
  const metadata: Logging.JSONObject = {
    pageUrl: typeof log.pageUrl === "string" ? log.pageUrl : "",
    pageTitle: typeof log.pageTitle === "string" ? log.pageTitle : "",
    pageReferrer: typeof log.pageReferrer === "string" ? log.pageReferrer : "",
    userAgent: typeof log.userAgent === "string" ? log.userAgent : "",
    clientTime: String(
      typeof log.clientTime === "number"
        ? Math.trunc(log.clientTime)
        : typeof log.startTime === "number"
          ? Math.trunc(log.startTime)
          : 0,
    ),
  };

  if (scrnRes && typeof scrnRes === "object") {
    metadata.screenResolution = {
      width: typeof scrnRes.width === "number" ? Math.trunc(scrnRes.width) : 0,
      height:
        typeof scrnRes.height === "number" ? Math.trunc(scrnRes.height) : 0,
    };
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

  return metadata;
}

function toStringAttributes(
  attrs: unknown,
): Record<string, string> | undefined {
  if (!attrs || typeof attrs !== "object" || Array.isArray(attrs)) {
    return undefined;
  }
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(attrs)) {
    out[k] = typeof v === "string" ? v : JSON.stringify(v);
  }
  return out;
}

/**
 * Converts a flat UserALE log entry into the proto3 canonical JSON structure
 * defined by apache.flagon.userale.v1.UserALELog in log.proto (#142, #143).
 */
export function toProtoUserALELog(log: Logging.Log): Logging.JSONObject {
  const metadata = buildProtoMetadata(log);
  const logType = log.logType;

  if (logType === "raw") {
    const loc = log.location as
      { x?: number | null; y?: number | null } | undefined;
    const location: Logging.JSONObject = {};
    if (loc && typeof loc === "object") {
      if (typeof loc.x === "number") location.x = loc.x;
      if (typeof loc.y === "number") location.y = loc.y;
    }

    const raw: Logging.JSONObject = {
      metadata,
      target: typeof log.target === "string" ? log.target : "",
      path: Array.isArray(log.path) ? (log.path as string[]) : [],
      eventType: typeof log.type === "string" ? log.type : "",
      location,
      userAction: Boolean(log.userAction),
    };

    if (typeof log.microTime === "number") {
      raw.microTime = log.microTime;
    }
    if (
      log.details &&
      typeof log.details === "object" &&
      !Array.isArray(log.details)
    ) {
      raw.details = log.details as Logging.JSONObject;
    }
    const strAttrs = toStringAttributes(log.attributes);
    if (strAttrs) {
      raw.attributes = strAttrs;
    }
    if (
      log.style &&
      typeof log.style === "object" &&
      !Array.isArray(log.style)
    ) {
      raw.style = log.style as Logging.JSONObject;
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
      count: typeof log.count === "number" ? Math.trunc(log.count) : 0,
      duration: String(
        typeof log.duration === "number" ? Math.trunc(log.duration) : 0,
      ),
      startTime: String(
        typeof log.startTime === "number" ? Math.trunc(log.startTime) : 0,
      ),
      endTime: String(
        typeof log.endTime === "number" ? Math.trunc(log.endTime) : 0,
      ),
      targetChange: Boolean(log.targetChange),
      typeChange: Boolean(log.typeChange),
      userAction: Boolean(log.userAction),
    };

    return {
      logType: "LOG_TYPE_INTERVAL",
      interval,
    };
  }

  const customFields: Logging.JSONObject = {};
  for (const [key, value] of Object.entries(log)) {
    if (!KNOWN_CUSTOM_LOG_KEYS.has(key) && value !== undefined) {
      customFields[key] = value;
    }
  }

  const custom: Logging.JSONObject = {
    metadata,
    userAction: Boolean(log.userAction),
    customFields,
  };

  if (
    log.details &&
    typeof log.details === "object" &&
    !Array.isArray(log.details)
  ) {
    custom.details = log.details as Logging.JSONObject;
  }

  return {
    logType: "LOG_TYPE_CUSTOM",
    custom,
  };
}

/**
 * Converts an array of UserALE logs into an apache.flagon.userale.v1.LogBatch
 * proto3 JSON object.
 */
export function toProtoLogBatch(logs: Array<Logging.Log>): Logging.JSONObject {
  return {
    logs: logs.map(toProtoUserALELog),
  };
}

/**
 * Exporter that serializes UserALE logs using the apache.flagon.userale.v1
 * Protobuf JSON schema (#142, #143) with zero runtime protobuf dependencies.
 */
export class ProtoJsonExporter extends HttpJsonExporter {
  protected override serialize(logs: Array<Logging.Log>): string {
    return JSON.stringify(toProtoLogBatch(logs));
  }
}
