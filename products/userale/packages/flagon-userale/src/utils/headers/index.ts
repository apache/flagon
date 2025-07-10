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
import { Callbacks } from "@/types";

export let headersCallback: Callbacks.HeadersCallback | null = null;

/**
 * Fetches the most up-to-date custom headers object from the headers callback
 * and updates the config object with the new value.
 * @param {Configuration} config Configuration object to be updated.
 * @param {Callbacks.HeadersCallback} headersCallback Callback used to fetch the newest headers.
 * @returns {void}
 */
export function updateCustomHeaders(config: Configuration) {
  if (headersCallback) {
    try {
      config.headers = headersCallback();
    } catch (e) {
      // We should emit the error, but otherwise continue as this could be a temporary issue
      // due to network connectivity or some logic inside the headersCallback which is the user's
      // responsibility.
      console.error(`Error encountered while setting the headers: ${e}`);
    }
  }
}

/**
 * Registers the provided callback to be used when updating the auth header.
 * @param {Callbacks.HeadersCallback} callback Callback used to fetch the newest headers. Should return an object.
 * @returns {boolean} Whether the operation succeeded.
 */
export function registerHeadersCallback(callback: Callbacks.HeadersCallback) {
  try {
    verifyCallback(callback);
    headersCallback = callback;
    return true;
  } catch {
    return false;
  }
}

/**
 * Verify that the provided callback is a function which returns a string
 * @param {Callbacks.HeadersCallback} callback Callback used to fetch the newest header. Should return an object.
 * @throws {Error} If the callback is not a function or does not return a string.
 * @returns {void}
 */
export function verifyCallback(callback: Callbacks.HeadersCallback) {
  if (typeof callback !== "function") {
    throw new Error("Userale headers callback must be a function");
  }
  const result = callback();
  if (typeof result !== "object") {
    throw new Error("Userale headers callback must return an object");
  }
  for (const [key, value] of Object.entries(result)) {
    if (typeof key !== "string" || typeof value !== "string") {
      throw new Error(
        "Userale header callback must return an object with string keys and values",
      );
    }
  }
}

/**
 * Resets the authCallback to null. Used for primarily for testing, but could be used
 * to remove the callback in production.
 * @returns {void}
 */
export function resetHeadersCallback() {
  headersCallback = null;
}
