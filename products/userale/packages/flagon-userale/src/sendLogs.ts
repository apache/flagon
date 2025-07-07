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
import { Logging } from "@/types";
import { updateAuthHeader, updateCustomHeaders } from "@/utils";

let sendIntervalId: string | number | NodeJS.Timeout | undefined;
let wsock: WebSocket;

/**
 * Initializes the log queue processors.
 * @param  {Array<Logging.Log>} logs   Array of logs to append to.
 * @param  {Configuration} config Configuration object to use when logging.
 */
export function initSender(logs: Array<Logging.Log>, config: Configuration) {
  if (sendIntervalId) {
    clearInterval(sendIntervalId);
  }

  const url = new URL(config.url);
  if (url.protocol === "ws:" || url.protocol === "wss:") {
    wsock = new WebSocket(config.url);
  }

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

// /**
//  * Attempts to flush the remaining logs when the window is closed.
//  * @param  {Array<Logging.Log>} logs   Array of logs to be flushed.
//  * @param  {Configuration} config Configuration singleton to be read from.
//  */
export function sendOnClose(
  logs: Array<Logging.Log>,
  config: Configuration,
): void {
  self.addEventListener("pagehide", function () {
    if (!config.on) {
      return;
    }

    if (logs.length > 0) {
      const url = new URL(config.url);

      if (url.protocol === "ws:" || url.protocol === "wss:") {
        const data = JSON.stringify(logs);
        wsock.send(data);
      } else {
        const headers: HeadersInit = new Headers();
        headers.set("Content-Type", "application/json;charset=UTF-8");

        if (config.authHeader) {
          headers.set("Authorization", config.authHeader.toString());
        }

        fetch(config.url, {
          keepalive: true,
          method: "POST",
          headers: headers,
          body: JSON.stringify(logs),
        }).catch((error) => {
          console.error(error);
        });
      }
      logs.splice(0); // clear log queue
    }
  });
}

/**
 * Sends the provided array of logs to the specified url,
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
  const data = JSON.stringify(logs);
  const url = new URL(config.url);

  if (url.protocol === "ws:" || url.protocol === "wss:") {
    wsock.send(data);
    return;
  }

  // Build headers
  const headers = new Headers({
    "Content-Type": "application/json;charset=UTF-8",
  });

  updateAuthHeader(config);
  if (config.authHeader) {
    const authHeaderValue =
      typeof config.authHeader === "function"
        ? config.authHeader()
        : config.authHeader;
    headers.set("Authorization", authHeaderValue);
  }

  // Update custom headers last to allow them to over-write the defaults. This assumes
  // the user knows what they are doing and may want to over-write the defaults.
  updateCustomHeaders(config);
  if (config.headers) {
    for (const [header, value] of Object.entries(config.headers)) {
      headers.set(header, value);
    }
  }

  async function attemptSend(remainingRetries: number): Promise<void> {
    try {
      const response = await fetch(config.url, {
        method: "POST",
        headers,
        body: data,
      });

      if (!response.ok) {
        if (remainingRetries > 0) {
          return attemptSend(remainingRetries - 1);
        } else {
          throw new Error(`Failed to send logs: ${response.statusText}`);
        }
      }
    } catch (error) {
      if (remainingRetries > 0) {
        return attemptSend(remainingRetries - 1);
      }
      throw error;
    }
  }

  return attemptSend(retries);
}
