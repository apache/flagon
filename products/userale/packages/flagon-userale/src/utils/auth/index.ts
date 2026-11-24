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

export let authCallback: Callbacks.AuthCallback | null = null;

/**
 * Resolves the latest auth header string from authCallback without mutating config.
 * Returns null if no callback is registered or if invoking it throws or returns a non-string.
 */
export function resolveAuthHeader(): string | null {
  if (!authCallback) {
    return null;
  }
  try {
    const result = authCallback();
    return typeof result === "string" ? result : null;
  } catch (e) {
    console.error(`Error encountered while setting the auth header: ${e}`);
    return null;
  }
}

/**
 * Fetches the most up-to-date auth header string from the auth callback
 * and updates the config object with the new value.
 * @param {Configuration} config Configuration object to be updated.
 * @returns {void}
 */
export function updateAuthHeader(config: Configuration) {
  if (authCallback) {
    try {
      const value = authCallback();
      config.authHeader = typeof value === "string" ? value : null;
    } catch (e) {
      // Clear any previously cached credential when the callback fails.
      config.authHeader = null;
      console.error(`Error encountered while setting the auth header: ${e}`);
    }
  }
}

/**
 * Registers the provided callback to be used when updating the auth header.
 * @param {Callbacks.AuthCallback} callback Callback used to fetch the newest header. Should return a string.
 * @returns {boolean} Whether the operation succeeded.
 */
export function registerAuthCallback(callback: Callbacks.AuthCallback) {
  try {
    verifyCallback(callback);
    authCallback = callback;
    return true;
  } catch {
    return false;
  }
}

/**
 * Verify that the provided callback is a function which returns a string
 * @param {Function} callback Callback used to fetch the newest header. Should return a string.
 * @throws {Error} If the callback is not a function or does not return a string.
 * @returns {void}
 */
export function verifyCallback(callback: Callbacks.AuthCallback) {
  if (typeof callback !== "function") {
    throw new Error("Userale auth callback must be a function");
  }
  const result = callback();
  if (typeof result !== "string") {
    throw new Error("Userale auth callback must return a string");
  }
}

/**
 * Resets the authCallback to null. Used for primarily for testing, but could be used
 * to remove the callback in production.
 * @returns {void}
 */
export function resetAuthCallback() {
  authCallback = null;
}
