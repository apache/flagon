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
import { Configuration } from "@/configure";
export declare let logs: Array<Logging.Log>;
export declare const filterHandler: CallableFunction | null;
export declare const mapHandler: CallableFunction | null;
export declare let cbHandlers: Callbacks.CallbackMap;
/**
 * Adds named callbacks to be executed when logging.
 * @param  {Object } newCallbacks An object containing named callback functions.
 */
export declare function addCallbacks(...newCallbacks: Record<symbol | string, CallableFunction>[]): Callbacks.CallbackMap;
/**
 * Removes callbacks by name.
 * @param  {String[]} targetKeys A list of names of functions to remove.
 */
export declare function removeCallbacks(targetKeys: string[]): void;
/**
 * Assigns the config and log container to be used by the logging functions.
 * @param  {Array<Logging.Log>} newLogs   Log container.
 * @param  {Object} newConfig Configuration to use while logging.
 */
export declare function initPackager(newLogs: Array<Logging.Log>, newConfig: Configuration): void;
/**
 * Transforms the provided HTML event into a log and appends it to the log queue.
 * @param  {Event} e         The event to be logged.
 * @param  {Function} detailFcn The function to extract additional log parameters from the event.
 * @return {boolean}           Whether the event was logged.
 */
export declare function packageLog(e: Event, detailFcn?: Logging.DynamicDetailFunction | null): boolean;
/**
 * Packages the provided customLog to include standard meta data and appends it to the log queue.
 * @param  {Logging.CustomLog} customLog        The behavior to be logged.
 * @param  {Logging.DynamicDetailFunction} detailFcn     The function to extract additional log parameters from the event.
 * @param  {boolean} userAction     Indicates user behavior (true) or system behavior (false)
 * @return {boolean}           Whether the event was logged.
 */
export declare function packageCustomLog(customLog: Logging.CustomLog, detailFcn: Logging.DynamicDetailFunction | Logging.StaticDetailFunction, userAction: boolean): boolean;
/**
 * Extract the millisecond and microsecond portions of a timestamp.
 * @param  {Number} timeStamp The timestamp to split into millisecond and microsecond fields.
 * @return {Object}           An object containing the millisecond
 *                            and microsecond portions of the timestamp.
 */
export declare function extractTimeFields(timeStamp: number): {
    milli: number;
    micro: number;
};
/**
 * Track intervals and gather details about it.
 * @param {Object} e
 * @return boolean
 */
export declare function packageIntervalLog(e: Event): boolean;
/**
 * Extracts coordinate information from the event
 * depending on a few browser quirks.
 * @param  {Event} e The event to extract coordinate information from.
 * @return {Object}   An object containing nullable x and y coordinates for the event.
 */
export declare function getLocation(e: Event): {
    x: number;
    y: number;
} | {
    x: null;
    y: null;
} | undefined;
/**
 * Extracts innerWidth and innerHeight to provide estimates of screen resolution
 * @return {Object} An object containing the innerWidth and InnerHeight
 */
export declare function getScreenRes(): {
    width: number;
    height: number;
};
/**
 * Builds a string CSS selector from the provided element
 * @param  {EventTarget} ele The element from which the selector is built.
 * @return {string}     The CSS selector for the element, or Unknown if it can't be determined.
 */
export declare function getSelector(ele: EventTarget): string;
/**
 * Builds an array of elements from the provided event target, to the root element.
 * @param  {Event} e Event from which the path should be built.
 * @return {HTMLElement[]}   Array of elements, starting at the event target, ending at the root element.
 */
export declare function buildPath(e: Event): string[];
/**
 * Builds a CSS selector path from the provided list of elements.
 * @param  {EventTarget[]} path Array of HTML Elements from which the path should be built.
 * @return {string[]}      Array of string CSS selectors.
 */
export declare function selectorizePath(path: EventTarget[]): string[];
/**
 * Builds an object containing attributes of an element.
 * Attempts to parse all attribute values as JSON text.
 * @param  {Event} e Event from which the target element's attributes should be extracted.
 * @return {Record<string, any>} Object with element attributes as key-value pairs.
 */
export declare function buildAttrs(e: Event): Record<string, any>;
/**
 * Builds an object containing all CSS properties of an element.
 * @param  {Event} e Event from which the target element's properties should be extracted.
 * @return {Record<string, string>} Object with all CSS properties as key-value pairs.
 */
export declare function buildCSS(e: Event): Record<string, string>;
//# sourceMappingURL=packageLogs.d.ts.map