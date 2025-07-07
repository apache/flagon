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

import type { Settings, Logging } from "@/types";
export declare let started: boolean;
export { defineCustomDetails as details } from "@/attachHandlers";
export { registerAuthCallback as registerAuthCallback } from "@/utils";
export { addCallbacks as addCallbacks, removeCallbacks as removeCallbacks, packageLog as packageLog, packageCustomLog as packageCustomLog, getSelector as getSelector, buildPath as buildPath, } from "@/packageLogs";
export type { Logging } from "@/types";
export declare const version: string;
/**
 * Used to start the logging process if the
 * autostart configuration option is set to false.
 */
export declare function start(): void;
/**
 * Halts the logging process. Logs will no longer be sent.
 */
export declare function stop(): void;
/**
 * Updates the current configuration
 * object with the provided values.
 * @param  {Partial<Settings.Config>} newConfig The configuration options to use.
 * @return {Settings.Config}           Returns the updated configuration.
 */
export declare function options(newConfig: Partial<Settings.Config> | undefined): Settings.Config;
/**
 * Appends a log to the log queue.
 * @param  {Logging.CustomLog} customLog The log to append.
 * @return {boolean}          Whether the operation succeeded.
 */
export declare function log(customLog: Logging.CustomLog | undefined): boolean;
//# sourceMappingURL=main.d.ts.map