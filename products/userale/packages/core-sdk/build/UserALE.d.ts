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
import { Configuration } from "@/Configuration";
import type { Settings, Logging } from "@/types";
export declare class UserALE {
    readonly config: Configuration;
    private readonly packager;
    private readonly sender;
    private readonly logs;
    private started;
    constructor(config: Configuration);
    /**
     * Starts capturing events and sending logs.
     * In browser contexts waits for the DOM to be ready.
     * In worker/service-worker contexts starts immediately.
     * Safe to call again after options() — the sender restarts with the new config.
     */
    start(): void;
    /**
     * Captures events and routes them through callbacks, but does not start the
     * sender. Use this in content-script contexts where a separate background
     * instance owns transport — the rerouteLog callback intercepts every log
     * before it can be queued, so no fetch calls are ever made from the page.
     */
    capture(): void;
    /**
     * Stops sending logs and clears the sender interval.
     */
    stop(): void;
    private whenReady;
    private attach;
    options(newConfig?: Partial<Settings.Config>): Settings.Config;
    log(customLog: Logging.UserLog | undefined): boolean;
    flush(): Promise<void>;
    addCallbacks(...newCallbacks: Record<symbol | string, CallableFunction>[]): void;
    removeCallbacks(targetKeys: string[]): void;
    packageCustomLog(userLog: Logging.UserLog, detailFcn: Logging.DynamicDetailFunction | Logging.StaticDetailFunction, userAction: boolean): boolean;
}
//# sourceMappingURL=UserALE.d.ts.map