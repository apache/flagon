/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { Configuration } from "@/configure";
import { Callbacks } from "@/types";
export declare let headersCallback: Callbacks.HeadersCallback | null;
/**
 * Fetches the most up-to-date custom headers object from the headers callback
 * and updates the config object with the new value.
 * @param {Configuration} config Configuration object to be updated.
 * @param {Callbacks.HeadersCallback} headersCallback Callback used to fetch the newest headers.
 * @returns {void}
 */
export declare function updateCustomHeaders(config: Configuration): void;
/**
 * Registers the provided callback to be used when updating the auth header.
 * @param {Callbacks.HeadersCallback} callback Callback used to fetch the newest headers. Should return an object.
 * @returns {boolean} Whether the operation succeeded.
 */
export declare function registerHeadersCallback(callback: Callbacks.HeadersCallback): boolean;
/**
 * Verify that the provided callback is a function which returns a string
 * @param {Callbacks.HeadersCallback} callback Callback used to fetch the newest header. Should return an object.
 * @throws {Error} If the callback is not a function or does not return a string.
 * @returns {void}
 */
export declare function verifyCallback(callback: Callbacks.HeadersCallback): void;
/**
 * Resets the authCallback to null. Used for primarily for testing, but could be used
 * to remove the callback in production.
 * @returns {void}
 */
export declare function resetHeadersCallback(): void;
