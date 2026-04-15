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
import { Callbacks, Logging } from "@/types";
import type { Configuration } from "@/Configuration";
export declare class Packager {
    logs: Array<Logging.Log>;
    config: Configuration;
    cbHandlers: Callbacks.CallbackMap;
    private intervalId;
    private intervalType;
    private intervalPath;
    private intervalTimer;
    private intervalCounter;
    constructor(logs: Array<Logging.Log>, config: Configuration);
    addCallbacks(...newCallbacks: Record<symbol | string, CallableFunction>[]): Callbacks.CallbackMap;
    removeCallbacks(targetKeys: string[]): void;
    private applyPipeline;
    packageLog(e: Event, detailFcn?: Logging.DynamicDetailFunction | null): boolean;
    packageCustomLog(userLog: Logging.UserLog, detailFcn: Logging.DynamicDetailFunction | Logging.StaticDetailFunction, userAction: boolean): boolean;
    packageIntervalLog(e: Event): boolean;
}
/**
 * Extracts the millisecond and microsecond portions of a timestamp.
 */
export declare function extractTimeFields(timeStamp: number): {
    milli: number;
    micro: number;
};
/**
 * Extracts coordinate information from the event.
 */
export declare function getLocation(e: Event): {
    x: number | null;
    y: number | null;
};
/**
 * Returns the viewport dimensions as a screen resolution estimate.
 */
export declare function getScreenRes(): {
    width: number;
    height: number;
};
/**
 * Builds a CSS selector string from an event target element.
 */
export declare function getSelector(ele: EventTarget): string;
/**
 * Builds a CSS selector path from the event's composed path.
 */
export declare function buildPath(e: Event): string[];
/**
 * Maps an array of event targets to CSS selector strings.
 */
export declare function selectorizePath(path: EventTarget[]): string[];
/**
 * Builds an object of element attributes, attempting JSON parsing on values.
 */
export declare function buildAttrs(e: Event): Logging.JSONObject;
/**
 * Builds an object of inline CSS properties from the event target.
 */
export declare function buildCSS(e: Event): Logging.JSONObject;
//# sourceMappingURL=Packager.d.ts.map