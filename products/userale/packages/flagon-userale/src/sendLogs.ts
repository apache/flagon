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

let sendIntervalId: string | number | NodeJS.Timeout | undefined;
let activeExporter: LogExporter | null = null;
let activeExporterKey: string | null = null;
let activeCustomExporter: LogExporter | null = null;

function resolveExporter(config: Configuration): LogExporter {
  const key = `${config.url}|${config.exporterType ?? "http-json"}`;
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
  if (sendIntervalId) {
    clearInterval(sendIntervalId);
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
  sendOnClose(logs, config);
}

/**
 * Checks the provided log array on an interval, flushing the logs
 * if the queue has reached the threshold specified by the provided config.
 * @param  {Array<Logging.Log>} logs   Array of logs to read from.
 * @param  {Configuration} config Configuration singleton to be read from.
 * @return {Number}        The newly created interval id.
 */
export function sendOnInterval(
  logs: Array<Logging.Log>,
  config: Configuration,
): NodeJS.Timeout {
  return setInterval(function () {
    if (!config.on) {
      return;
    }

    if (logs.length >= config.logCountThreshold) {
      sendLogs(logs.slice(0), config, 0); // Send a copy
      logs.splice(0); // Clear array reference (no reassignment)
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
  self.addEventListener("pagehide", function () {
    if (!config.on) {
      return;
    }

    if (logs.length > 0) {
      const batch = logs.slice(0);
      logs.splice(0); // clear log queue
      const exporter = resolveExporter(config);
      exporter.export(batch, { keepalive: true }).catch((error) => {
        console.error(error);
      });
    }
  });
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
  await exporter.export(logs, { retries });
}
