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

/// <reference types="node" />
import { Configuration } from "@/configure";
import { Logging } from "@/types";
/**
 * Initializes the log queue processors.
 * @param  {Array<Logging.Log>} logs   Array of logs to append to.
 * @param  {Configuration} config Configuration object to use when logging.
 */
export declare function initSender(logs: Array<Logging.Log>, config: Configuration): void;
/**
 * Checks the provided log array on an interval, flushing the logs
 * if the queue has reached the threshold specified by the provided config.
 * @param  {Array<Logging.Log>} logs   Array of logs to read from.
 * @param  {Configuration} config Configuration singleton to be read from.
 * @return {Number}        The newly created interval id.
 */
export declare function sendOnInterval(logs: Array<Logging.Log>, config: Configuration): NodeJS.Timeout;
/**
 * Attempts to flush the remaining logs when the window is closed.
 * @param  {Array<Logging.Log>} logs   Array of logs to be flushed.
 * @param  {Configuration} config Configuration singleton to be read from.
 */
export declare function sendOnClose(logs: Array<Logging.Log>, config: Configuration): void;
/**
 * Sends the provided array of logs to the specified url,
 * retrying the request up to the specified number of retries.
 * @param  {Array<Logging.Log>} logs    Array of logs to send.
 * @param  {Configuration} config     configuration singleton.
 * @param  {Number} retries Maximum number of attempts to send the logs.
 */
export declare function sendLogs(logs: Array<Logging.Log>, config: Configuration, retries: number): void;
