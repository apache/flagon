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

let sendIntervalId: ReturnType<typeof setInterval> | undefined;
let pagehideHandler: (() => void) | null = null;
let pageshowHandler: ((event: Event) => void) | null = null;
let activeExporter: LogExporter | null = null;
let activeExporterKey: string | null = null;
let activeCustomExporter: LogExporter | null = null;
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

function isWebSocketMode(config: Configuration): boolean {
  return Boolean(
    config.websocketsEnabled ||
    (typeof config.url === "string" && /^wss?:/i.test(config.url)),
  );
}

/**
 * Registers a custom LogExporter instance on the global Configuration singleton.
 * @param  {LogExporter | null} exporter Custom exporter instance or null to reset.
 * @return {boolean}                     Whether registration succeeded.
 */
export function registerExporter(
  exporter: LogExporter | null,
  targetConfig?: Configuration,
): boolean {
  if (exporter !== null && typeof exporter?.export !== "function") {
    return false;
  }
  (targetConfig ?? Configuration.getInstance()).update({ exporter });
  activeExporter = null;
  activeExporterKey = null;
  activeCustomExporter = null;
  return true;
}

function resolveExporter(config: Configuration): LogExporter {
  const key = [
    config.url,
    config.otlpEndpoint ?? "",
    config.exporterFormat ?? "",
    config.exporterType ?? "http-json",
    String(Boolean(config.websocketsEnabled)),
  ].join("|");
  if (
    activeExporter &&
    activeExporterKey === key &&
    activeCustomExporter === (config.exporter ?? null)
  ) {
    return activeExporter;
  }
  activeExporter = createExporter(config);
  activeExporterKey = key;
  activeCustomExporter = config.exporter ?? null;
  return activeExporter;
}

/**
 * Initializes the log queue processors.
 * @param  {Array<Logging.Log>} logs   Array of logs to append to.
 * @param  {Configuration} config Configuration object to use when logging.
 */
export function initSender(logs: Array<Logging.Log>, config: Configuration) {
  if (sendIntervalId !== undefined) {
    clearInterval(sendIntervalId);
    sendIntervalId = undefined;
  }

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

  activeExporter = null;
  resolveExporter(config);

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
 * @param  {Array<Logging.Log>} logs   Array of logs to read from.
 * @param  {Configuration} config Configuration singleton to be read from.
 * @return {NodeJS.Timeout}        The newly created interval id.
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
 * @param  {Array<Logging.Log>} logs   Array of logs to be flushed.
 * @param  {Configuration} config Configuration singleton to be read from.
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
      const exporter = resolveExporter(config);
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
      resolveExporter(config);
    }
  };
  pagehideHandler = hideListener;
  pageshowHandler = showListener;
  self.addEventListener("pagehide", hideListener);
  self.addEventListener("pageshow", showListener);
}

/**
 * Sends the provided array of logs to the specified url via the active exporter,
 * retrying the request up to the specified number of retries.
 * @param  {Array<Logging.Log>} logs    Array of logs to send.
 * @param  {Configuration} config     configuration singleton.
 * @param  {Number} retries Maximum number of attempts to send the logs.
 */
export async function sendLogs(
  logs: Array<Logging.Log>,
  config: Configuration,
  retries: number,
): Promise<void> {
  const exporter = resolveExporter(config);
  const result = await exporter.export(logs, { retries });
  if (result && result.success === false && result.error) {
    console.error(result.error);
  }
}
