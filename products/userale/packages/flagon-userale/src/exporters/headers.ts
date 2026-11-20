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
import {
  authCallback,
  headersCallback,
  resolveAuthHeader,
  resolveCustomHeaders,
} from "@/utils";

/**
 * Builds the HTTP headers for outgoing log requests, unifying
 * Authorization (callback or static), x-api-key, and custom headers
 * without mutating dynamic callback credentials back onto config.
 * @param  {Configuration} config Configuration object.
 * @return {Headers}              Constructed Fetch Headers instance.
 */
export function buildHeaders(config: Configuration): Headers {
  const headers = new Headers({
    "Content-Type": "application/json;charset=UTF-8",
  });

  if (authCallback) {
    const dynamicAuth = resolveAuthHeader();
    if (dynamicAuth) {
      headers.set("Authorization", dynamicAuth);
    }
  } else if (config.authHeader) {
    const authHeaderValue =
      typeof config.authHeader === "function"
        ? config.authHeader()
        : String(config.authHeader);
    if (authHeaderValue) {
      headers.set("Authorization", authHeaderValue);
    }
  }

  if (config.apiKey) {
    headers.set("x-api-key", config.apiKey);
  }

  // Resolve custom headers last to allow them to override defaults cleanly.
  const customHeaders = headersCallback
    ? resolveCustomHeaders()
    : config.headers;
  if (customHeaders) {
    for (const [header, value] of Object.entries(customHeaders)) {
      headers.set(header, value);
    }
  }

  return headers;
}
