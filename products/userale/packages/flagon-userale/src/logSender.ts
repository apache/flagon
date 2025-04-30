/*
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

export class LogSender {
  private sendIntervalId: NodeJS.Timeout | undefined;
  private wsock: WebSocket | undefined;

  /**
   * Initializes the log queue processors.
   * @param logs Array of logs to append to.
   * @param config Configuration object to use when logging.
   */
  constructor(logs: Array<Logging.Log>, config: Configuration) {
    if (this.sendIntervalId) {
      clearInterval(this.sendIntervalId);
    }

    this.sendIntervalId = this.sendOnInterval(logs, config);

    if(config.isWebSocket()) {
      this.wsock = new WebSocket(config.url);
      this.wsock.onerror = () => {
        console.log("no websockets detected");
      };
      this.wsock.onopen = () => {
        console.log("connection established with websockets");
      };
      this.wsock.onclose = () => {
        this.sendOnClose(logs, config);
      };

    } else {
      this.sendOnClose(logs, config);
    }

  }

  /**
   * Checks the provided log array on an interval, flushing the logs
   * if the queue has reached the threshold specified by the provided config.
   * @param logs Array of logs to read from.
   * @param config Configuration singleton to be read from.
   * @return The newly created interval id.
   */
  private sendOnInterval(
    logs: Array<Logging.Log>,
    config: Configuration
  ): NodeJS.Timeout {
    this.sendIntervalId = setInterval(() => {
      if (!config.on) return;

      if (logs.length >= config.logCountThreshold) {
        this.sendLogs([...logs], config, 0); // Send a copy
        logs.splice(0); // Clear array reference (no reassignment)
      }
    }, config.transmitInterval);

    return this.sendIntervalId;
  }

  /**
   * Attempts to flush the remaining logs when the window is closed.
   * @param logs Array of logs to be flushed.
   * @param config Configuration singleton to be read from.
   */
  public sendOnClose(
    logs: Array<Logging.Log>,
    config: Configuration
  ): void {
    window.addEventListener("pagehide", () => {
      if (!config.on) return;

      if (logs.length > 0) {
        if (config.isWebSocket() && this.wsock?.readyState === WebSocket.OPEN) {
          const data = JSON.stringify(logs);
          this.wsock.send(data);
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
        logs.splice(0); // Clear log queue
      }
    });
  }

  /**
   * Sends the provided array of logs to the specified url,
   * retrying the request up to the specified number of retries.
   * @param logs Array of logs to send.
   * @param config Configuration singleton.
   * @param retries Maximum number of attempts to send the logs.
   */
  public sendLogs(
    logs: Array<Logging.Log>,
    config: Configuration,
    retries: number
  ): void {
    const data = JSON.stringify(logs);

    if (config.isWebSocket() && this.wsock?.readyState === WebSocket.OPEN) {
      this.wsock.send(data);
    } else {
      const req = new XMLHttpRequest();
      req.open("POST", config.url);

      updateAuthHeader(config);
      if (config.authHeader) {
        req.setRequestHeader(
          "Authorization",
          typeof config.authHeader === "function"
            ? config.authHeader()
            : config.authHeader
        );
      }
      req.setRequestHeader("Content-type", "application/json;charset=UTF-8");

      updateCustomHeaders(config);
      if (config.headers) {
        Object.entries(config.headers).forEach(([header, value]) => {
          req.setRequestHeader(header, value);
        });
      }

      req.onreadystatechange = () => {
        if (req.readyState === 4 && req.status !== 200 && retries > 0) {
          this.sendLogs(logs, config, retries - 1);
        }
      };

      req.send(data);
    }
  }
}
