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

export class WebSocketExporter implements LogExporter {
  private wsock: WebSocket;

  constructor(config: Configuration) {
    this.wsock = new WebSocket(config.url);
  }

  public async export(logs: Array<Logging.Log>): Promise<ExportResult> {
    const data = JSON.stringify(logs);
    this.wsock.send(data);
    return { success: true };
  }

  public async flush(): Promise<void> {
    return Promise.resolve();
  }

  public async shutdown(): Promise<void> {
    if (
      typeof WebSocket !== "undefined" &&
      this.wsock.readyState === WebSocket.OPEN
    ) {
      this.wsock.close();
    }
    return Promise.resolve();
  }
}
