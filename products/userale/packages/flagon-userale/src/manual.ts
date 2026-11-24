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

/**
 * Strictly side-effect-free entry point for programmatic/manual lifecycle control.
 * Importing `flagon-userale/manual` accesses zero browser storage, attaches zero
 * DOM/window listeners, starts zero timers, and assigns nothing to `window`.
 */

import { version as userAleVersion } from "../package.json";
import type { LogExporter } from "@/exporters";
import { createRuntime } from "@/runtime";

import type { Logging, Settings } from "@/types";

const runtime = createRuntime(false);

export let started = false;
runtime.notifyOnStartedChange((val) => {
  started = val;
});

export { defineCustomDetails as details } from "@/attachHandlers";
export {
  registerAuthCallback,
  registerHeadersCallback,
  resetAuthCallback,
  resetHeadersCallback,
} from "@/utils";
export {
  addCallbacks as addCallbacks,
  removeCallbacks as removeCallbacks,
  packageLog as packageLog,
  packageCustomLog as packageCustomLog,
  getSelector as getSelector,
  buildPath as buildPath,
  detectBrowser as detectBrowser,
} from "@/packageLogs";
export function registerExporter(exporter: LogExporter | null): boolean {
  return runtime.registerExporter(exporter);
}
export {
  flushSessionReplay,
  getActiveReplayRingBuffer,
  getTargetRect,
  RageClickDetector,
  ReplayRingBuffer,
  startSessionReplay,
  stopSessionReplay,
} from "@/replay";
export type {
  ReplayEnvelope,
  ReplayFrame,
  ReplayRecorderFn,
  SessionReplayOptions,
  TargetRect,
} from "@/replay";
export {
  buildHeaders,
  buildOtlpResourceAttributes,
  createExporter,
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
} from "@/exporters";
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
} from "@/exporters";
export type { Logging, Settings } from "@/types";

export const version = userAleVersion;

export function start(): void {
  runtime.start();
}

export function stop(): void {
  runtime.stop();
}

export function flush(): Promise<void> {
  return runtime.flush();
}

export function reset(): void {
  runtime.reset();
}

export function options(newConfig?: Partial<Settings.Config>): Settings.Config {
  return runtime.options(newConfig);
}

export function log(customLog?: Logging.CustomLog | null): boolean {
  return runtime.log(customLog);
}
