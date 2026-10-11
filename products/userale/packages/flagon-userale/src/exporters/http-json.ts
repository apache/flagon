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
import { buildHeaders } from "./headers";
import type { ExportOptions, ExportResult, LogExporter } from "./types";

const MAX_KEEPALIVE_BYTES = 48 * 1024;

/**
 * Splits a log array into sub-batches whose serialized JSON size stays under
 * MAX_KEEPALIVE_BYTES so browser pagehide/keepalive requests do not reject.
 */
export function chunkLogsForKeepalive<T>(
  logs: Array<T>,
  serialize: (batch: Array<T>) => string,
): Array<string> {
  const full = serialize(logs);
  if (full.length <= MAX_KEEPALIVE_BYTES || logs.length <= 1) {
    return [full];
  }
  const mid = Math.ceil(logs.length / 2);
  return [
    ...chunkLogsForKeepalive(logs.slice(0, mid), serialize),
    ...chunkLogsForKeepalive(logs.slice(mid), serialize),
  ];
}

export class HttpJsonExporter implements LogExporter {
  private config: Configuration;

  constructor(config: Configuration) {
    this.config = config;
  }

  protected serialize(logs: Array<Logging.Log>): string {
    return JSON.stringify(logs);
  }

  protected getEndpoint(): string {
    return this.config.url;
  }

  public async export(
    logs: Array<Logging.Log>,
    options?: ExportOptions,
  ): Promise<ExportResult> {
    const headers = buildHeaders(this.config);
    const endpoint = this.getEndpoint();
    const keepalive = Boolean(options?.keepalive);
    const retries = options?.retries ?? 0;

    if (keepalive) {
      const payloads = chunkLogsForKeepalive(logs, (batch) =>
        this.serialize(batch),
      );
      try {
        await Promise.all(
          payloads.map((body) =>
            fetch(endpoint, {
              keepalive: true,
              method: "POST",
              headers,
              body,
            }),
          ),
        );
        return { success: true };
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error(error);
        return { success: false, error };
      }
    }

    const body = this.serialize(logs);

    async function attemptSend(remainingRetries: number): Promise<void> {
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers,
          body,
        });

        if (!response.ok) {
          if (remainingRetries > 0) {
            return attemptSend(remainingRetries - 1);
          }
          throw new Error(`Failed to send logs: ${response.statusText}`);
        }
      } catch (error) {
        if (remainingRetries > 0) {
          return attemptSend(remainingRetries - 1);
        }
        throw error;
      }
    }

    await attemptSend(retries);
    return { success: true };
  }

  public async flush(): Promise<void> {
    return Promise.resolve();
  }

  public async shutdown(): Promise<void> {
    return Promise.resolve();
  }
}
