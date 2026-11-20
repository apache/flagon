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
import { buildPath, detectBrowser, getSelector } from "@/packageLogs";
import {
  getTargetRect,
  RageClickDetector,
  ReplayRingBuffer,
  type ReplayEnvelope,
  type SessionReplayOptions,
} from "@/replay";
import { createRuntime, createUserAle, type UserAleInstance } from "@/runtime";

import type { Callbacks, Events, Logging, Settings } from "@/types";

const runtime = createRuntime(false);

export let started = false;
runtime.notifyOnStartedChange((val) => {
  started = val;
});

export { createUserAle, type UserAleInstance };

export function details(
  opts: Settings.DefaultConfig,
  type: Events.AllowedEvents,
): Logging.DynamicDetailFunction | null | undefined {
  return runtime.details(opts, type);
}

export function registerAuthCallback(
  callback: Callbacks.AuthCallback,
): boolean {
  return runtime.registerAuthCallback(callback);
}

export function resetAuthCallback(): void {
  runtime.resetAuthCallback();
}

export function registerHeadersCallback(
  callback: Callbacks.HeadersCallback,
): boolean {
  return runtime.registerHeadersCallback(callback);
}

export function resetHeadersCallback(): void {
  runtime.resetHeadersCallback();
}

export function addCallbacks(
  ...newCallbacks: Record<symbol | string, CallableFunction>[]
): Callbacks.CallbackMap {
  return runtime.addCallbacks(...newCallbacks);
}

export function removeCallbacks(targetKeys: string[]): void {
  runtime.removeCallbacks(targetKeys);
}

export function packageLog(
  e: Event,
  detailFcn?: Logging.DynamicDetailFunction | null,
): boolean {
  return runtime.packageLog(e, detailFcn);
}

export function packageCustomLog(
  customLog: Logging.CustomLog,
  detailFcn: Logging.DynamicDetailFunction | Logging.StaticDetailFunction,
  userAction: boolean,
): boolean {
  return runtime.packageCustomLog(customLog, detailFcn, userAction);
}

export { buildPath, detectBrowser, getSelector };

export function registerExporter(exporter: LogExporter | null): boolean {
  return runtime.registerExporter(exporter);
}

export function startSessionReplay(options?: SessionReplayOptions): () => void {
  return runtime.startSessionReplay(options);
}

export function stopSessionReplay(): void {
  runtime.stopSessionReplay();
}

export function flushSessionReplay(
  trigger?: string,
): Promise<ReplayEnvelope | null> {
  return runtime.flushSessionReplay(trigger);
}

export function getActiveReplayRingBuffer(): ReplayRingBuffer | null {
  return runtime.getActiveReplayRingBuffer();
}

export { getTargetRect, RageClickDetector, ReplayRingBuffer };

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

export function lockPrivacy(): void {
  runtime.lockPrivacy();
}

export function isPrivacyLocked(): boolean {
  return runtime.isPrivacyLocked();
}
