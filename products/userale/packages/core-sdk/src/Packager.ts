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

// ---------------------------------------------------------------------------
// Packager — owns log queue, config reference, callback map, and interval state
// ---------------------------------------------------------------------------

export class Packager {
  logs: Array<Logging.Log>;
  config: Configuration;
  cbHandlers: Callbacks.CallbackMap;

  // Interval logging state
  private intervalId: string | null = null;
  private intervalType: string | null = null;
  private intervalPath: string[] | null = null;
  private intervalTimer: number | null = null;
  private intervalCounter: number = 0;

  constructor(logs: Array<Logging.Log>, config: Configuration) {
    this.logs = logs;
    this.config = config;
    this.cbHandlers = {};
  }

  addCallbacks(
    ...newCallbacks: Record<symbol | string, CallableFunction>[]
  ): Callbacks.CallbackMap {
    for (const source of newCallbacks) {
      const descriptors: PropertyDescriptorMap = {};

      for (const key of Object.keys(source)) {
        const d = Object.getOwnPropertyDescriptor(source, key);
        if (d) descriptors[key] = d;
      }

      for (const sym of Object.getOwnPropertySymbols(source)) {
        const d = Object.getOwnPropertyDescriptor(source, sym);
        if (d?.enumerable) descriptors[sym as unknown as string] = d;
      }

      Object.defineProperties(this.cbHandlers, descriptors);
    }
    return this.cbHandlers;
  }

  removeCallbacks(targetKeys: string[]): void {
    for (const key of targetKeys) {
      if (Object.prototype.hasOwnProperty.call(this.cbHandlers, key)) {
        delete this.cbHandlers[key];
      }
    }
  }

  private applyPipeline(log: Logging.Log, e: Event | null): Logging.Log | null {
    for (const func of Object.values(this.cbHandlers)) {
      if (typeof func === "function") {
        log = func(log, e);
        if (!log) return null;
      }
    }
    return log;
  }

  packageLog(
    e: Event,
    detailFcn?: Logging.DynamicDetailFunction | null,
  ): boolean {
    if (!this.config.on) return false;

    const timeFields = extractTimeFields(
      e.timeStamp && e.timeStamp > 0
        ? this.config.time(e.timeStamp)
        : Date.now(),
    );

    const raw: Logging.RawLog = {
      target: e.target ? getSelector(e.target) : null,
      path: buildPath(e),
      pageUrl: self.location.href,
      pageTitle: document.title,
      pageReferrer: document.referrer,
      userAgent: self.navigator.userAgent,
      clientTime: timeFields.milli,
      microTime: timeFields.micro,
      location: getLocation(e),
      scrnRes: getScreenRes(),
      type: e.type,
      logType: "raw",
      userAction: true,
      details: detailFcn ? detailFcn(e) : null,
      userId: this.config.userId,
      toolVersion: this.config.toolVersion,
      toolName: this.config.toolName,
      useraleVersion: this.config.useraleVersion,
      sessionId: this.config.sessionId,
      httpSessionId: this.config.httpSessionId,
      browserSessionId: this.config.browserSessionId,
      attributes: buildAttrs(e),
      style: buildCSS(e),
    };

    const result = this.applyPipeline(raw, e);
    if (!result) return false;
    this.logs.push(result);
    return true;
  }

  packageCustomLog(
    userLog: Logging.UserLog,
    detailFcn: Logging.DynamicDetailFunction | Logging.StaticDetailFunction,
    userAction: boolean,
  ): boolean {
    if (!this.config.on) return false;

    const details =
      detailFcn.length === 0
        ? (detailFcn as Logging.StaticDetailFunction)()
        : null;

    const log = Object.assign(
      {
        pageUrl: self.location.href,
        pageTitle: document.title,
        pageReferrer: document.referrer,
        userAgent: self.navigator.userAgent,
        clientTime: Date.now(),
        scrnRes: getScreenRes(),
        logType: "custom" as const,
        userAction,
        details,
        userId: this.config.userId,
        toolVersion: this.config.toolVersion,
        toolName: this.config.toolName,
        useraleVersion: this.config.useraleVersion,
        sessionId: this.config.sessionId,
        httpSessionId: this.config.httpSessionId,
        browserSessionId: this.config.browserSessionId,
      },
      userLog,
    ) as Logging.Log;

    const result = this.applyPipeline(log, null);
    if (!result) return false;
    this.logs.push(result);
    return true;
  }

  packageIntervalLog(e: Event): boolean {
    const target = e.target ? getSelector(e.target) : null;
    const path = buildPath(e);
    const type = e.type;
    const timestamp = Math.floor(
      e.timeStamp && e.timeStamp > 0
        ? this.config.time(e.timeStamp)
        : Date.now(),
    );

    if (this.intervalId == null) {
      this.intervalId = target;
      this.intervalType = type;
      this.intervalPath = path;
      this.intervalTimer = timestamp;
      this.intervalCounter = 0;
      return true;
    }

    if (
      (this.intervalId !== target || this.intervalType !== type) &&
      this.intervalTimer !== null
    ) {
      const interval: Logging.IntervalLog = {
        target: this.intervalId,
        path: this.intervalPath,
        pageUrl: self.location.href,
        pageTitle: document.title,
        pageReferrer: document.referrer,
        userAgent: self.navigator.userAgent,
        clientTime: this.intervalTimer,
        scrnRes: getScreenRes(),
        count: this.intervalCounter,
        duration: timestamp - this.intervalTimer,
        startTime: this.intervalTimer,
        endTime: timestamp,
        type: this.intervalType,
        logType: "interval",
        targetChange: this.intervalId !== target,
        typeChange: this.intervalType !== type,
        userAction: false,
        details: null,
        userId: this.config.userId,
        toolVersion: this.config.toolVersion,
        toolName: this.config.toolName,
        useraleVersion: this.config.useraleVersion,
        sessionId: this.config.sessionId,
        httpSessionId: this.config.httpSessionId,
        browserSessionId: this.config.browserSessionId,
      };

      const result = this.applyPipeline(interval, e);
      if (result) this.logs.push(result);

      this.intervalId = target;
      this.intervalType = type;
      this.intervalPath = path;
      this.intervalTimer = timestamp;
      this.intervalCounter = 0;
    } else if (this.intervalId === target && this.intervalType === type) {
      this.intervalCounter += 1;
    }

    return true;
  }
}

// ---------------------------------------------------------------------------
// Pure utility functions — no state, safe to call from anywhere
// ---------------------------------------------------------------------------

/**
 * Extracts the millisecond and microsecond portions of a timestamp.
 */
export function extractTimeFields(timeStamp: number): {
  milli: number;
  micro: number;
} {
  return {
    milli: Math.floor(timeStamp),
    micro: Number((timeStamp % 1).toFixed(3)),
  };
}

/**
 * Extracts coordinate information from the event.
 */
export function getLocation(e: Event): { x: number | null; y: number | null } {
  if (e instanceof MouseEvent) {
    if (e.pageX != null) {
      return { x: e.pageX, y: e.pageY };
    }
    return {
      x: document.documentElement.scrollLeft + e.clientX,
      y: document.documentElement.scrollTop + e.clientY,
    };
  }
  return { x: null, y: null };
}

/**
 * Returns the viewport dimensions as a screen resolution estimate.
 */
export function getScreenRes(): { width: number; height: number } {
  return { width: self.innerWidth, height: self.innerHeight };
}

/**
 * Builds a CSS selector string from an event target element.
 */
export function getSelector(ele: EventTarget): string {
  if (ele instanceof HTMLElement || ele instanceof Element) {
    const base = ele.localName || ele.nodeName;
    if (base) {
      return (
        base +
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
 * Builds a CSS selector path from the event's composed path.
 */
export function buildPath(e: Event): string[] {
  return selectorizePath(e.composedPath());
}

/**
 * Maps an array of event targets to CSS selector strings.
 */
export function selectorizePath(path: EventTarget[]): string[] {
  return path.map(getSelector);
}

/**
 * Builds an object of element attributes, attempting JSON parsing on values.
 */
export function buildAttrs(e: Event): Logging.JSONObject {
  const attributes: Logging.JSONObject = {};
  const attributeBlockList = ["style"];

  if (e.target instanceof Element) {
    for (const attr of e.target.attributes) {
      if (attributeBlockList.includes(attr.name)) continue;
      try {
        attributes[attr.name] = JSON.parse(attr.value);
      } catch {
        attributes[attr.name] = attr.value;
      }
    }
  }

  return attributes;
}

/**
 * Builds an object of inline CSS properties from the event target.
 */
export function buildCSS(e: Event): Logging.JSONObject {
  const properties: Logging.JSONObject = {};
  if (e.target instanceof HTMLElement) {
    const styleObj = e.target.style;
    for (let i = 0; i < styleObj.length; i++) {
      const prop = styleObj[i];
      properties[prop] = styleObj.getPropertyValue(prop);
    }
  }
  return properties;
}
