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

import { Configuration } from "@/configure";
import { buildHeaders, createExporter, type LogExporter } from "@/exporters";
import { Logging } from "@/types";

export { buildHeaders };

function isWebSocketMode(config: Configuration): boolean {
  return Boolean(
    config.websocketsEnabled ||
    (typeof config.url === "string" && /^wss?:/i.test(config.url)),
  );
}

function buildExporterCacheKey(config: Configuration): string {
  return [
    config.url,
    config.otlpEndpoint ?? "",
    config.exporterFormat ?? "",
    config.exporterType ?? "http-json",
    String(Boolean(config.websocketsEnabled)),
    config.apiKey ?? "",
    typeof config.authHeader === "string" ? config.authHeader : "",
  ].join("|");
}

function warnPlaintextCredentials(config: Configuration): void {
  try {
    const url = new URL(config.url);
    if (
      (config.apiKey || config.authHeader) &&
      url.protocol === "http:" &&
      !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
    ) {
      console.warn(
        "[UserALE] Sending credentials over plaintext HTTP. Use HTTPS in production.",
      );
    }
  } catch {
    // Ignore invalid URL during initialization if a custom exporter is used
  }
}

export interface SenderController {
  registerExporter: (exporter: LogExporter | null) => boolean;
  resolveExporter: () => LogExporter;
  initSender: () => void;
  stopSender: () => Promise<void>;
  flushLogs: () => Promise<void>;
  sendLogs: (batch: Array<Logging.Log>, retries: number) => Promise<void>;
}

/**
 * Creates an encapsulated log sender owning its own interval timer,
 * pagehide/pageshow listeners, cached exporter, and in-flight tracking.
 */
export function createSender(
  config: Configuration,
  logs: Array<Logging.Log>,
): SenderController {
  let sendIntervalId: ReturnType<typeof setInterval> | undefined;
  let pagehideHandler: (() => void) | null = null;
  let pageshowHandler: ((event: Event) => void) | null = null;
  let activeExporter: LogExporter | null = null;
  let activeExporterKey: string | null = null;
  let activeCustomExporter: LogExporter | null = null;
  let activeOtelLogger: unknown = null;
  const inFlightExports = new Set<Promise<unknown>>();

  const trackExport = (promise: Promise<unknown>): Promise<unknown> => {
    const tracked = promise.then(
      () => undefined,
      (error) => {
        console.error(error);
      },
    );
    inFlightExports.add(tracked);
    tracked.finally(() => {
      inFlightExports.delete(tracked);
    });
    return tracked;
  };

  const resolveExporter = (): LogExporter => {
    const key = buildExporterCacheKey(config);
    if (
      activeExporter &&
      activeExporterKey === key &&
      activeCustomExporter === (config.exporter ?? null) &&
      activeOtelLogger === (config.otelLogger ?? null)
    ) {
      return activeExporter;
    }
    activeExporter = createExporter(config);
    activeExporterKey = key;
    activeCustomExporter = config.exporter ?? null;
    activeOtelLogger = config.otelLogger ?? null;
    return activeExporter;
  };

  const registerExporter = (exporter: LogExporter | null): boolean => {
    if (config.isPrivacyLocked()) {
      return false;
    }
    if (exporter !== null && typeof exporter?.export !== "function") {
      return false;
    }
    config.update({ exporter });
    activeExporter = null;
    activeExporterKey = null;
    activeCustomExporter = null;
    activeOtelLogger = null;
    return true;
  };

  const sendLogs = async (
    batch: Array<Logging.Log>,
    retries: number,
  ): Promise<void> => {
    const exporter = resolveExporter();
    const result = await exporter.export(batch, { retries });
    if (result && result.success === false && result.error) {
      console.error(result.error);
    }
  };

  const removeLifecycleListeners = (): void => {
    if (
      typeof self !== "undefined" &&
      typeof self.removeEventListener === "function"
    ) {
      if (pagehideHandler) {
        self.removeEventListener("pagehide", pagehideHandler);
        pagehideHandler = null;
      }
      if (pageshowHandler) {
        self.removeEventListener("pageshow", pageshowHandler);
        pageshowHandler = null;
      }
    }
  };

  const initSender = (): void => {
    if (sendIntervalId !== undefined) {
      clearInterval(sendIntervalId);
      sendIntervalId = undefined;
    }

    warnPlaintextCredentials(config);

    activeExporter = null;
    activeExporterKey = null;
    resolveExporter();

    sendIntervalId = setInterval(() => {
      if (!config.on) {
        return;
      }
      if (logs.length >= config.logCountThreshold) {
        const batch = logs.splice(0);
        trackExport(sendLogs(batch, 0));
      }
    }, config.transmitInterval);

    removeLifecycleListeners();

    if (
      typeof self !== "undefined" &&
      typeof self.addEventListener === "function"
    ) {
      const hideListener = () => {
        if (!config.on) {
          return;
        }
        if (logs.length > 0) {
          const batch = logs.splice(0);
          const exporter = resolveExporter();
          trackExport(
            exporter.export(batch, { keepalive: true }).catch((error) => {
              console.error(error);
            }),
          );
        }
        if (
          activeExporter &&
          isWebSocketMode(config) &&
          typeof activeExporter.shutdown === "function"
        ) {
          const wsExporter = activeExporter;
          activeExporter = null;
          activeExporterKey = null;
          void wsExporter.shutdown?.().catch((error) => {
            console.error(error);
          });
        }
      };
      const showListener = (event: Event) => {
        const persisted = Boolean((event as PageTransitionEvent).persisted);
        if (
          persisted &&
          config.on &&
          isWebSocketMode(config) &&
          !activeExporter
        ) {
          resolveExporter();
        }
      };
      pagehideHandler = hideListener;
      pageshowHandler = showListener;
      self.addEventListener("pagehide", hideListener);
      self.addEventListener("pageshow", showListener);
    }
  };

  const stopSender = async (): Promise<void> => {
    if (sendIntervalId !== undefined) {
      clearInterval(sendIntervalId);
      sendIntervalId = undefined;
    }
    removeLifecycleListeners();
    const exporter = activeExporter;
    activeExporter = null;
    activeExporterKey = null;
    activeCustomExporter = null;
    activeOtelLogger = null;
    if (exporter && typeof exporter.shutdown === "function") {
      try {
        await exporter.shutdown();
      } catch (error) {
        console.error(error);
      }
    }
  };

  const flushLogs = async (): Promise<void> => {
    if (logs.length > 0) {
      const batch = logs.splice(0);
      await trackExport(sendLogs(batch, 0));
    }
    if (inFlightExports.size > 0) {
      await Promise.allSettled(Array.from(inFlightExports));
    }
    if (activeExporter && typeof activeExporter.flush === "function") {
      await activeExporter.flush();
    }
  };

  return {
    registerExporter,
    resolveExporter,
    initSender,
    stopSender,
    flushLogs,
    sendLogs,
  };
}

let sendIntervalId: ReturnType<typeof setInterval> | undefined;
let pagehideHandler: (() => void) | null = null;
let pageshowHandler: ((event: Event) => void) | null = null;
let activeExporter: LogExporter | null = null;
let activeExporterKey: string | null = null;
let activeCustomExporter: LogExporter | null = null;
let activeOtelLogger: unknown = null;
const inFlightExports = new Set<Promise<unknown>>();

function trackExport(promise: Promise<unknown>): Promise<unknown> {
  const tracked = promise.then(
    () => undefined,
    (error) => {
      console.error(error);
    },
  );
  inFlightExports.add(tracked);
  tracked.finally(() => {
    inFlightExports.delete(tracked);
  });
  return tracked;
}

/**
 * Registers a custom LogExporter instance on the global Configuration singleton
 * (or explicit targetConfig).
 */
export function registerExporter(
  exporter: LogExporter | null,
  targetConfig?: Configuration,
): boolean {
  const target = targetConfig ?? Configuration.getInstance();
  if (target.isPrivacyLocked()) {
    return false;
  }
  if (exporter !== null && typeof exporter?.export !== "function") {
    return false;
  }
  target.update({ exporter });
  activeExporter = null;
  activeExporterKey = null;
  activeCustomExporter = null;
  activeOtelLogger = null;
  return true;
}

export function resolveActiveExporter(config: Configuration): LogExporter {
  const key = buildExporterCacheKey(config);
  if (
    activeExporter &&
    activeExporterKey === key &&
    activeCustomExporter === (config.exporter ?? null) &&
    activeOtelLogger === (config.otelLogger ?? null)
  ) {
    return activeExporter;
  }
  activeExporter = createExporter(config);
  activeExporterKey = key;
  activeCustomExporter = config.exporter ?? null;
  activeOtelLogger = config.otelLogger ?? null;
  return activeExporter;
}

/**
 * Initializes the log queue processors.
 */
export function initSender(logs: Array<Logging.Log>, config: Configuration) {
  if (sendIntervalId !== undefined) {
    clearInterval(sendIntervalId);
    sendIntervalId = undefined;
  }

  warnPlaintextCredentials(config);

  activeExporter = null;
  activeExporterKey = null;
  resolveActiveExporter(config);

  sendIntervalId = sendOnInterval(logs, config);
  if (typeof self !== "undefined") {
    if (pagehideHandler && typeof self.removeEventListener === "function") {
      self.removeEventListener("pagehide", pagehideHandler);
      pagehideHandler = null;
    }
    if (pageshowHandler && typeof self.removeEventListener === "function") {
      self.removeEventListener("pageshow", pageshowHandler);
      pageshowHandler = null;
    }
  }
  sendOnClose(logs, config);
}

/**
 * Stops interval timers, removes lifecycle listeners, and shuts down the active exporter.
 */
export async function stopSender(): Promise<void> {
  if (sendIntervalId !== undefined) {
    clearInterval(sendIntervalId);
    sendIntervalId = undefined;
  }
  if (
    typeof self !== "undefined" &&
    typeof self.removeEventListener === "function"
  ) {
    if (pagehideHandler) {
      self.removeEventListener("pagehide", pagehideHandler);
      pagehideHandler = null;
    }
    if (pageshowHandler) {
      self.removeEventListener("pageshow", pageshowHandler);
      pageshowHandler = null;
    }
  }
  const exporter = activeExporter;
  activeExporter = null;
  activeExporterKey = null;
  activeCustomExporter = null;
  activeOtelLogger = null;
  if (exporter && typeof exporter.shutdown === "function") {
    try {
      await exporter.shutdown();
    } catch (error) {
      console.error(error);
    }
  }
}

/**
 * Drains queued logs and awaits completion of all in-flight exports and exporter flush.
 */
export async function flushLogs(
  logs: Array<Logging.Log>,
  config: Configuration,
): Promise<void> {
  if (logs.length > 0) {
    const batch = logs.splice(0);
    await trackExport(sendLogs(batch, config, 0));
  }
  if (inFlightExports.size > 0) {
    await Promise.allSettled(Array.from(inFlightExports));
  }
  if (activeExporter && typeof activeExporter.flush === "function") {
    await activeExporter.flush();
  }
}

/**
 * Checks the provided log array on an interval, flushing the logs
 * if the queue has reached the threshold specified by the provided config.
 */
export function sendOnInterval(
  logs: Array<Logging.Log>,
  config: Configuration,
): ReturnType<typeof setInterval> {
  return setInterval(function () {
    if (!config.on) {
      return;
    }

    if (logs.length >= config.logCountThreshold) {
      const batch = logs.splice(0);
      trackExport(sendLogs(batch, config, 0));
    }
  }, config.transmitInterval);
}

/**
 * Attempts to flush the remaining logs when the window is closed.
 */
export function sendOnClose(
  logs: Array<Logging.Log>,
  config: Configuration,
): void {
  if (
    typeof self === "undefined" ||
    typeof self.addEventListener !== "function"
  ) {
    return;
  }
  const hideListener = function () {
    if (!config.on) {
      return;
    }

    if (logs.length > 0) {
      const batch = logs.splice(0);
      const exporter = resolveActiveExporter(config);
      trackExport(
        exporter.export(batch, { keepalive: true }).catch((error) => {
          console.error(error);
        }),
      );
    }

    // Close WebSocket connections on pagehide so pages remain eligible for bfcache.
    if (
      activeExporter &&
      isWebSocketMode(config) &&
      typeof activeExporter.shutdown === "function"
    ) {
      const wsExporter = activeExporter;
      activeExporter = null;
      activeExporterKey = null;
      void wsExporter.shutdown?.().catch((error) => {
        console.error(error);
      });
    }
  };
  const showListener = function (event: Event) {
    const persisted = Boolean((event as PageTransitionEvent).persisted);
    if (persisted && config.on && isWebSocketMode(config) && !activeExporter) {
      resolveActiveExporter(config);
    }
  };
  pagehideHandler = hideListener;
  pageshowHandler = showListener;
  self.addEventListener("pagehide", hideListener);
  self.addEventListener("pageshow", showListener);
}

/**
 * Sends the provided array of logs to the specified url via the active exporter.
 */
export async function sendLogs(
  logs: Array<Logging.Log>,
  config: Configuration,
  retries: number,
): Promise<void> {
  const exporter = resolveActiveExporter(config);
  const result = await exporter.export(logs, { retries });
  if (result && result.success === false && result.error) {
    console.error(result.error);
  }
}
