/*
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

import { detect } from "detect-browser";
import { Callbacks, Logging } from "@/types";
import { Configuration } from "@/configure";
const browserInfo = detect();

export let logs: Array<Logging.Log>;
let config: Configuration;

// Interval Logging Globals
let intervalId: string | null;
let intervalType: string | null;
let intervalPath: string[] | null;
let intervalTimer: number | null;
let intervalCounter: number | null;
let intervalLog: Logging.Log | null;

export const filterHandler: CallableFunction | null = null;
export const mapHandler: CallableFunction | null = null;
export let cbHandlers: Callbacks.CallbackMap = {};

/**
 * Adds named callbacks to be executed when logging.
 * @param  {Object } newCallbacks An object containing named callback functions.
 */
export function addCallbacks(
  ...newCallbacks: Record<symbol | string, CallableFunction>[]
) {
  newCallbacks.forEach((source) => {
    let descriptors: { [key in string | symbol]: any } = {};

    descriptors = Object.keys(source).reduce((descriptors, key) => {
      descriptors[key] = Object.getOwnPropertyDescriptor(source, key);
      return descriptors;
    }, descriptors);

    Object.getOwnPropertySymbols(source).forEach((sym) => {
      const descriptor = Object.getOwnPropertyDescriptor(source, sym);
      if (descriptor?.enumerable) {
        descriptors[sym] = descriptor;
      }
    });
    Object.defineProperties(cbHandlers, descriptors);
  });
  return cbHandlers;
}

/**
 * Removes callbacks by name.
 * @param  {String[]} targetKeys A list of names of functions to remove.
 */
export function removeCallbacks(targetKeys: string[]) {
  targetKeys.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(cbHandlers, key)) {
      delete cbHandlers[key];
    }
  });
}

/**
 * Assigns the config and log container to be used by the logging functions.
 * @param  {Array<Logging.Log>} newLogs   Log container.
 * @param  {Object} newConfig Configuration to use while logging.
 */
export function initPackager(
  newLogs: Array<Logging.Log>,
  newConfig: Configuration,
) {
  logs = newLogs;
  config = newConfig;
  cbHandlers = {};
  intervalId = null;
  intervalType = null;
  intervalPath = null;
  intervalTimer = null;
  intervalCounter = 0;
  intervalLog = null;
}

/**
 * Transforms the provided HTML event into a log and appends it to the log queue.
 * @param  {Event} e         The event to be logged.
 * @param  {Function} detailFcn The function to extract additional log parameters from the event.
 * @return {boolean}           Whether the event was logged.
 */
export function packageLog(
  e: Event,
  detailFcn?: Logging.DynamicDetailFunction | null,
) {
  if (!config.on) {
    return false;
  }

  let details = null;
  if (detailFcn) {
    details = detailFcn(e);
  }

  const timeFields = extractTimeFields(
    e.timeStamp && e.timeStamp > 0 ? config.time(e.timeStamp) : Date.now(),
  );

  let log: Logging.Log = {
    target: e.target ? getSelector(e.target) : null,
    path: buildPath(e),
    pageUrl: window.location.href,
    pageTitle: document.title,
    pageReferrer: document.referrer,
    browser: detectBrowser(),
    clientTime: timeFields.milli,
    microTime: timeFields.micro,
    location: getLocation(e),
    scrnRes: getScreenRes(),
    type: e.type,
    logType: "raw",
    userAction: true,
    details: details,
    userId: config.userId,
    toolVersion: config.toolVersion,
    toolName: config.toolName,
    useraleVersion: config.useraleVersion,
    sessionId: config.sessionId,
    httpSessionId: config.httpSessionId,
    browserSessionId: config.browserSessionId,
    attributes: buildAttrs(e),
    style: buildCSS(e),
  };

  if (typeof filterHandler === "function" && !filterHandler(log)) {
    return false;
  }

  if (typeof mapHandler === "function") {
    log = mapHandler(log, e);
  }

  for (const func of Object.values(cbHandlers)) {
    if (typeof func === "function") {
      log = func(log, e);
      if (!log) {
        return false;
      }
    }
  }

  logs.push(log);
  return true;
}

/**
 * Packages the provided customLog to include standard meta data and appends it to the log queue.
 * @param  {Logging.CustomLog} customLog        The behavior to be logged.
 * @param  {Logging.DynamicDetailFunction} detailFcn     The function to extract additional log parameters from the event.
 * @param  {boolean} userAction     Indicates user behavior (true) or system behavior (false)
 * @return {boolean}           Whether the event was logged.
 */
export function packageCustomLog(
  customLog: Logging.CustomLog,
  detailFcn: Logging.DynamicDetailFunction | Logging.StaticDetailFunction,
  userAction: boolean,
): boolean {
  if (!config.on) {
    return false;
  }

  let details = null;
  if (detailFcn.length === 0) {
    // In the case of a union, the type checker will default to the more stringent
    // type, i.e. the DetailFunction that expects an argument for safety purposes.
    // To avoid this, we must explicitly check the type by asserting it receives
    // no arguments (detailFcn.length === 0) and then cast it to the
    // StaticDetailFunction type.
    const staticDetailFcn = detailFcn as Logging.StaticDetailFunction;
    details = staticDetailFcn();
  }

  const metaData = {
    pageUrl: window.location.href,
    pageTitle: document.title,
    pageReferrer: document.referrer,
    browser: detectBrowser(),
    clientTime: Date.now(),
    scrnRes: getScreenRes(),
    logType: "custom",
    userAction: userAction,
    details: details,
    userId: config.userId,
    toolVersion: config.toolVersion,
    toolName: config.toolName,
    useraleVersion: config.useraleVersion,
    sessionId: config.sessionId,
    httpSessionId: config.httpSessionId,
    browserSessionId: config.browserSessionId,
  };

  let log = Object.assign(metaData, customLog);

  if (typeof filterHandler === "function" && !filterHandler(log)) {
    return false;
  }

  if (typeof mapHandler === "function") {
    log = mapHandler(log);
  }

  for (const func of Object.values(cbHandlers)) {
    if (typeof func === "function") {
      log = func(log, null);
      if (!log) {
        return false;
      }
    }
  }

  logs.push(log);

  return true;
}

/**
 * Extract the millisecond and microsecond portions of a timestamp.
 * @param  {Number} timeStamp The timestamp to split into millisecond and microsecond fields.
 * @return {Object}           An object containing the millisecond
 *                            and microsecond portions of the timestamp.
 */
export function extractTimeFields(timeStamp: number) {
  return {
    milli: Math.floor(timeStamp),
    micro: Number((timeStamp % 1).toFixed(3)),
  };
}

/**
 * Track intervals and gather details about it.
 * @param {Object} e
 * @return boolean
 */
export function packageIntervalLog(e: Event) {
  try {
    const target = e.target ? getSelector(e.target) : null;
    const path = buildPath(e);
    const type = e.type;
    const timestamp = Math.floor(
      e.timeStamp && e.timeStamp > 0 ? config.time(e.timeStamp) : Date.now(),
    );

    // Init - this should only happen once on initialization
    if (intervalId == null) {
      intervalId = target;
      intervalType = type;
      intervalPath = path;
      intervalTimer = timestamp;
      intervalCounter = 0;
    }

    if ((intervalId !== target || intervalType !== type) && intervalTimer) {
      // When to create log? On transition end
      // @todo Possible for intervalLog to not be pushed in the event the interval never ends...

      intervalLog = {
        target: intervalId,
        path: intervalPath,
        pageUrl: window.location.href,
        pageTitle: document.title,
        pageReferrer: document.referrer,
        browser: detectBrowser(),
        count: intervalCounter,
        duration: timestamp - intervalTimer, // microseconds
        startTime: intervalTimer,
        endTime: timestamp,
        type: intervalType,
        logType: "interval",
        targetChange: intervalId !== target,
        typeChange: intervalType !== type,
        userAction: false,
        userId: config.userId,
        toolVersion: config.toolVersion,
        toolName: config.toolName,
        useraleVersion: config.useraleVersion,
        sessionId: config.sessionId,
        httpSessionId: config.httpSessionId,
        browserSessionId: config.browserSessionId,
      };

      if (typeof filterHandler === "function" && !filterHandler(intervalLog)) {
        return false;
      }

      if (typeof mapHandler === "function") {
        intervalLog = mapHandler(intervalLog, e);
      }

      for (const func of Object.values(cbHandlers)) {
        if (typeof func === "function") {
          intervalLog = func(intervalLog, null);
          if (!intervalLog) {
            return false;
          }
        }
      }

      if (intervalLog) logs.push(intervalLog);

      // Reset
      intervalId = target;
      intervalType = type;
      intervalPath = path;
      intervalTimer = timestamp;
      intervalCounter = 0;
    }

    // Interval is still occuring, just update counter
    if (intervalId == target && intervalType == type && intervalCounter) {
      intervalCounter = intervalCounter + 1;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Extracts coordinate information from the event
 * depending on a few browser quirks.
 * @param  {Event} e The event to extract coordinate information from.
 * @return {Object}   An object containing nullable x and y coordinates for the event.
 */
export function getLocation(e: Event) {
  if (e instanceof MouseEvent) {
    if (e.pageX != null) {
      return { x: e.pageX, y: e.pageY };
    } else if (e.clientX != null) {
      return {
        x: document.documentElement.scrollLeft + e.clientX,
        y: document.documentElement.scrollTop + e.clientY,
      };
    }
  } else {
    return { x: null, y: null };
  }
}

/**
 * Extracts innerWidth and innerHeight to provide estimates of screen resolution
 * @return {Object} An object containing the innerWidth and InnerHeight
 */
export function getScreenRes() {
  return { width: window.innerWidth, height: window.innerHeight };
}

/**
 * Builds a string CSS selector from the provided element
 * @param  {EventTarget} ele The element from which the selector is built.
 * @return {string}     The CSS selector for the element, or Unknown if it can't be determined.
 */
export function getSelector(ele: EventTarget) {
  if (ele instanceof HTMLElement || ele instanceof Element) {
    if (ele.localName) {
      return (
        ele.localName +
        (ele.id ? "#" + ele.id : "") +
        (ele.className ? "." + ele.className : "")
      );
    } else if (ele.nodeName) {
      return (
        ele.nodeName +
        (ele.id ? "#" + ele.id : "") +
        (ele.className ? "." + ele.className : "")
      );
    }
  } else if (ele instanceof Document) {
    return "#document";
  } else if (ele === globalThis) {
    return "Window";
  }
  return "Unknown";
}

/**
 * Builds an array of elements from the provided event target, to the root element.
 * @param  {Event} e Event from which the path should be built.
 * @return {HTMLElement[]}   Array of elements, starting at the event target, ending at the root element.
 */
export function buildPath(e: Event) {
  const path = e.composedPath();
  return selectorizePath(path);
}

/**
 * Builds a CSS selector path from the provided list of elements.
 * @param  {EventTarget[]} path Array of HTML Elements from which the path should be built.
 * @return {string[]}      Array of string CSS selectors.
 */
export function selectorizePath(path: EventTarget[]) {
  let i = 0;
  let pathEle;
  const pathSelectors: string[] = [];
  while ((pathEle = path[i])) {
    pathSelectors.push(getSelector(pathEle));
    ++i;
    pathEle = path[i];
  }
  return pathSelectors;
}

export function detectBrowser() {
  return {
    browser: browserInfo ? browserInfo.name : "",
    version: browserInfo ? browserInfo.version : "",
  };
}

/**
 * Builds an object containing attributes of an element.
 * Attempts to parse all attribute values as JSON text.
 * @param  {Event} e Event from which the target element's attributes should be extracted.
 * @return {Record<string, any>} Object with element attributes as key-value pairs.
 */
export function buildAttrs(e: Event): Record<string, any> {
  const attributes: Record<string, any> = {};
  const attributeBlackList = ["style"];

  if (e.target && e.target instanceof Element) {
    for (const attr of e.target.attributes) {
      if (attributeBlackList.includes(attr.name)) continue;
      let val: any = attr.value;
      try {
        val = JSON.parse(val);
      } catch{
        // Ignore parsing errors, fallback to raw string value
      }
      attributes[attr.name] = val;
    }
  }

  return attributes;
}

/**
 * Builds an object containing all CSS properties of an element.
 * @param  {Event} e Event from which the target element's properties should be extracted.
 * @return {Record<string, string>} Object with all CSS properties as key-value pairs.
 */
export function buildCSS(e: Event): Record<string, string> {
  const properties: Record<string, string> = {};
  if (e.target && e.target instanceof HTMLElement) {
    const styleObj = e.target.style;
    for (let i = 0; i < styleObj.length; i++) {
      const prop = styleObj[i];
      properties[prop] = styleObj.getPropertyValue(prop);
    }
  }
  return properties;
}
