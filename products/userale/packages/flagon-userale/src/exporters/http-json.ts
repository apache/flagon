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

export function utf8ByteLength(str: string): number {
  if (typeof TextEncoder !== "undefined") {
    return new TextEncoder().encode(str).byteLength;
  }
  let bytes = 0;
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code < 0x80) {
      bytes += 1;
    } else if (code < 0x800) {
      bytes += 2;
    } else if (code >= 0xd800 && code <= 0xdbff) {
      i++;
      bytes += 4;
    } else {
      bytes += 3;
    }
  }
  return bytes;
}

/**
 * Splits a log array into sub-batches whose serialized UTF-8 byte size stays
 * under MAX_KEEPALIVE_BYTES so browser pagehide/keepalive requests do not reject.
 */
export function chunkLogsForKeepalive<T>(
  logs: Array<T>,
  serialize: (batch: Array<T>) => string,
): Array<string> {
  const full = serialize(logs);
  if (utf8ByteLength(full) <= MAX_KEEPALIVE_BYTES || logs.length <= 1) {
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
        for (const body of payloads) {
          await fetch(endpoint, {
            keepalive: utf8ByteLength(body) <= MAX_KEEPALIVE_BYTES,
            method: "POST",
            headers,
            body,
          });
        }
        return { success: true };
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error(error);
        return { success: false, error };
      }
    }

    const body = this.serialize(logs);
    const explicitKeepalive =
      options?.keepalive === false ? { keepalive: false } : {};

    async function attemptSend(remainingRetries: number): Promise<void> {
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers,
          body,
          ...explicitKeepalive,
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

    try {
      await attemptSend(retries);
      return { success: true };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error(error);
      return { success: false, error };
    }
  }

  public async flush(): Promise<void> {
    return Promise.resolve();
  }

  public async shutdown(): Promise<void> {
    return Promise.resolve();
  }
}
