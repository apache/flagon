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
import type { Logging } from "@/types";
import type { ExportResult, LogExporter } from "./types";

const MAX_PENDING_MESSAGES = 100;
const WS_CONNECTING = 0;
const WS_OPEN = 1;

export class WebSocketExporter implements LogExporter {
  private wsock: WebSocket;
  private pendingPayloads: string[] = [];

  constructor(config: Configuration) {
    this.wsock = new WebSocket(config.url);
    if (typeof this.wsock.addEventListener === "function") {
      this.wsock.addEventListener("open", () => {
        this.drainPending();
      });
    }
  }

  private drainPending(): void {
    const openState =
      typeof WebSocket !== "undefined" ? WebSocket.OPEN : WS_OPEN;
    if (this.wsock.readyState !== openState) {
      return;
    }
    while (this.pendingPayloads.length > 0) {
      if (this.wsock.readyState !== openState) {
        break;
      }
      const next = this.pendingPayloads.shift()!;
      this.wsock.send(next);
    }
  }

  public async export(logs: Array<Logging.Log>): Promise<ExportResult> {
    const data = JSON.stringify(logs);
    const openState =
      typeof WebSocket !== "undefined" ? WebSocket.OPEN : WS_OPEN;
    const connectingState =
      typeof WebSocket !== "undefined" ? WebSocket.CONNECTING : WS_CONNECTING;

    if (this.wsock.readyState === openState) {
      this.wsock.send(data);
      return { success: true };
    }

    if (this.wsock.readyState === connectingState) {
      if (this.pendingPayloads.length >= MAX_PENDING_MESSAGES) {
        this.pendingPayloads.shift();
      }
      this.pendingPayloads.push(data);
      return { success: true };
    }

    return {
      success: false,
      error: new Error("WebSocket is not open"),
    };
  }

  public async flush(): Promise<void> {
    this.drainPending();
    return Promise.resolve();
  }

  public async shutdown(): Promise<void> {
    this.pendingPayloads = [];
    const openState =
      typeof WebSocket !== "undefined" ? WebSocket.OPEN : WS_OPEN;
    const connectingState =
      typeof WebSocket !== "undefined" ? WebSocket.CONNECTING : WS_CONNECTING;
    if (
      this.wsock.readyState === openState ||
      this.wsock.readyState === connectingState
    ) {
      this.wsock.close();
    }
    return Promise.resolve();
  }
}
