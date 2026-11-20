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

import { buildPath, detectBrowser, getSelector } from "@/packageLogs";
import { version as userAleVersion } from "../package.json";
import { getTargetRect, RageClickDetector, ReplayRingBuffer } from "@/replay";
import {
  type LogExporter,
  toOtlpExportLogsServiceRequest,
  toOtlpLogRecord,
  toProtoLogBatch,
  toProtoUserALELog,
} from "@/exporters";
import { createRuntime, createUserAle, type UserAleInstance } from "@/runtime";

import type { Callbacks, Events, Logging, Settings } from "@/types";
import type { ReplayEnvelope, SessionReplayOptions } from "@/replay";

const runtime = createRuntime(true);

export let started = false;
runtime.notifyOnStartedChange((val) => {
  started = val;
});

if (runtime.config.autostart) {
  runtime.scheduleSetup();
}

export { createUserAle, type UserAleInstance };

export function details(
  opts: Settings.DefaultConfig,
  type: Events.AllowedEvents,
): Logging.DynamicDetailFunction | null | undefined {
  return runtime.details(opts, type);
}

export {
  registerAuthCallback,
  registerHeadersCallback,
  resetAuthCallback,
  resetHeadersCallback,
} from "@/utils";

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

// Export the Userale API
export const version = userAleVersion;

/**
 * Used to start the logging process if the
 * autostart configuration option is set to false.
 */
export function start(): void {
  runtime.start();
}

/**
 * Halts the logging process. Logs will no longer be sent.
 */
export function stop(): void {
  runtime.stop();
}

/**
 * Flushes all queued logs through the active exporter and resolves on completion.
 */
export function flush(): Promise<void> {
  return runtime.flush();
}

/**
 * Clears queued logs and resets tracked interval state.
 */
export function reset(): void {
  runtime.reset();
}

/**
 * Updates the current configuration
 * object with the provided values.
 * @param  {Partial<Settings.Config>} newConfig The configuration options to use.
 * @return {Settings.Config}           Returns the updated configuration.
 */
export function options(newConfig?: Partial<Settings.Config>): Settings.Config {
  return runtime.options(newConfig);
}

/**
 * Appends a log to the log queue.
 * @param  {Logging.CustomLog} customLog The log to append.
 * @return {boolean}          Whether the operation succeeded.
 */
export function log(customLog?: Logging.CustomLog | null): boolean {
  return runtime.log(customLog);
}

/**
 * Locks privacy settings on the active runtime to prevent post-init tampering.
 */
export function lockPrivacy(): void {
  runtime.lockPrivacy();
}

/**
 * Returns whether privacy settings are currently locked.
 */
export function isPrivacyLocked(): boolean {
  return runtime.isPrivacyLocked();
}

// Only attach to window in IIFE builds
if (
  typeof __USERALE_IIFE__ !== "undefined" &&
  __USERALE_IIFE__ &&
  typeof window !== "undefined"
) {
  (window as any).userale = {
    start,
    stop,
    flush,
    reset,
    options,
    log,
    version: userAleVersion,
    details,
    registerAuthCallback: runtime.registerAuthCallback,
    registerHeadersCallback: runtime.registerHeadersCallback,
    registerExporter,
    startSessionReplay,
    stopSessionReplay,
    flushSessionReplay,
    getTargetRect,
    toOtlpExportLogsServiceRequest,
    toOtlpLogRecord,
    toProtoLogBatch,
    toProtoUserALELog,
    addCallbacks,
    removeCallbacks,
    packageLog,
    packageCustomLog,
    getSelector,
    buildPath,
    detectBrowser,
    createUserAle,
    lockPrivacy,
    isPrivacyLocked,
  };
}
