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
import { buildHeaders } from "./headers";
import { HttpJsonExporter, chunkLogsForKeepalive } from "./http-json";
import { OtelSdkExporter } from "./otel-sdk";
import type { OtelLogsApiLogger } from "./otel-sdk";
import {
  OtlpJsonExporter,
  buildOtlpResourceAttributes,
  resolveOtlpLogsEndpoint,
  toOtlpAnyValue,
  toOtlpExportLogsServiceRequest,
  toOtlpLogRecord,
  toUnixNanoString,
} from "./otlp-json";
import type {
  OtlpAnyValue,
  OtlpExportLogsServiceRequest,
  OtlpKeyValue,
  OtlpLogRecord,
} from "./otlp-json";
import {
  ProtoJsonExporter,
  toProtoLogBatch,
  toProtoUserALELog,
} from "./proto-json";
import type {
  ExportOptions,
  ExportResult,
  ExporterType,
  LogExporter,
} from "./types";
import { WebSocketExporter } from "./websocket";

export {
  buildHeaders,
  buildOtlpResourceAttributes,
  chunkLogsForKeepalive,
  HttpJsonExporter,
  OtelSdkExporter,
  OtlpJsonExporter,
  ProtoJsonExporter,
  resolveOtlpLogsEndpoint,
  toOtlpAnyValue,
  toOtlpExportLogsServiceRequest,
  toOtlpLogRecord,
  toProtoLogBatch,
  toProtoUserALELog,
  toUnixNanoString,
  WebSocketExporter,
};
export type {
  ExportOptions,
  ExportResult,
  ExporterType,
  LogExporter,
  OtelLogsApiLogger,
  OtlpAnyValue,
  OtlpExportLogsServiceRequest,
  OtlpKeyValue,
  OtlpLogRecord,
};

/**
 * Factory that creates the appropriate LogExporter for the given configuration.
 */
export function createExporter(config: Configuration): LogExporter {
  if (config.exporter) {
    return config.exporter;
  }

  if (config.exporterType === "otlp" || config.otlpEndpoint) {
    return new OtlpJsonExporter(config);
  }

  try {
    const url = new URL(config.url);
    if (
      url.protocol === "ws:" ||
      url.protocol === "wss:" ||
      config.exporterType === "websocket"
    ) {
      return new WebSocketExporter(config);
    }
  } catch {
    // Fallback to HTTP exporter if config.url is not a full URL (e.g. relative path in tests)
  }

  if (config.exporterType === "proto-json") {
    return new ProtoJsonExporter(config);
  }

  return new HttpJsonExporter(config);
}
