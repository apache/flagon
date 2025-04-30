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

import { Callbacks, Logging } from "@/types";
import { Configuration } from "@/configure";

export class LogPackager {
  private logs: Array<Logging.Log> = [];
  private config!: Configuration;
  private cbHandlers: Callbacks.CallbackMap = {};
  private intervalId: string | null = null;
  private intervalType: string | null = null;
  private intervalPath: string[] | null = null;
  private intervalTimer: number | null = null;
  private intervalCounter: number = 0;
  private intervalLog: Logging.Log | null = null;

  public addCallbacks(...newCallbacks: Record<string | symbol, CallableFunction>[]): Callbacks.CallbackMap {
    newCallbacks.forEach((source) => {
      let descriptors: { [key in string | symbol]: any } = {};
      Object.keys(source).forEach((key) => {
        descriptors[key] = Object.getOwnPropertyDescriptor(source, key);
      });
      Object.getOwnPropertySymbols(source).forEach((sym) => {
        const descriptor = Object.getOwnPropertyDescriptor(source, sym);
        if (descriptor?.enumerable) descriptors[sym] = descriptor;
      });
      Object.defineProperties(this.cbHandlers, descriptors);
    });
    return this.cbHandlers;
  }

  public removeCallbacks(targetKeys: string[]): void {
    targetKeys.forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(this.cbHandlers, key)) {
        delete this.cbHandlers[key];
      }
    });
  }

  constructor(newLogs: Array<Logging.Log>, newConfig: Configuration) {
    this.logs = newLogs;
    this.config = newConfig;
    this.cbHandlers = {};
    this.intervalId = null;
    this.intervalType = null;
    this.intervalPath = null;
    this.intervalTimer = null;
    this.intervalCounter = 0;
    this.intervalLog = null;
  }

  public packageLog(e: Event, detailFcn?: Logging.DynamicDetailFunction | null): boolean {
    if (!this.config.on) return false;

    const details = detailFcn ? detailFcn(e) : null;
    const timeFields = this.extractTimeFields(e.timeStamp && e.timeStamp > 0 ? this.config.time(e.timeStamp) : Date.now());

    let log: Logging.Log = {
      target: e.target ? this.getSelector(e.target) : null,
      path: this.buildPath(e),
      pageUrl: window.location.href,
      pageTitle: document.title,
      pageReferrer: document.referrer,
      userAgent: window.navigator.userAgent,
      clientTime: timeFields.milli,
      microTime: timeFields.micro,
      location: this.getLocation(e),
      scrnRes: this.getScreenRes(),
      type: e.type,
      logType: "raw",
      userAction: true,
      details,
      userId: this.config.userId,
      toolVersion: this.config.toolVersion,
      toolName: this.config.toolName,
      useraleVersion: this.config.useraleVersion,
      sessionId: this.config.sessionId,
      httpSessionId: this.config.httpSessionId,
      browserSessionId: this.config.browserSessionId,
      attributes: this.buildAttrs(e),
      style: this.buildCSS(e),
    };

    for (const func of Object.values(this.cbHandlers)) {
      if (typeof func === "function") {
        log = func(log, e);
        if (!log) return false;
      }
    }

    this.logs.push(log);
    return true;
  }

  public packageCustomLog(customLog: Logging.CustomLog, detailFcn: Logging.DynamicDetailFunction | Logging.StaticDetailFunction, userAction: boolean): boolean {
    if (!this.config.on) return false;

    const details = detailFcn.length === 0 ? (detailFcn as Logging.StaticDetailFunction)() : null;
    let log: Logging.Log = Object.assign({
      pageUrl: window.location.href,
      pageTitle: document.title,
      pageReferrer: document.referrer,
      userAgent: window.navigator.userAgent,
      clientTime: Date.now(),
      scrnRes: this.getScreenRes(),
      logType: "custom",
      userAction,
      details,
      userId: this.config.userId,
      toolVersion: this.config.toolVersion,
      toolName: this.config.toolName,
      useraleVersion: this.config.useraleVersion,
      sessionId: this.config.sessionId,
      httpSessionId: this.config.httpSessionId,
      browserSessionId: this.config.browserSessionId,
    }, customLog);

    for (const func of Object.values(this.cbHandlers)) {
      if (typeof func === "function") {
        log = func(log, null);
        if (!log) return false;
      }
    }

    this.logs.push(log);
    return true;
  }

  private extractTimeFields(timeStamp: number) {
    return {
      milli: Math.floor(timeStamp),
      micro: Number((timeStamp % 1).toFixed(3)),
    };
  }

  public packageIntervalLog(e: Event): boolean {
    try {
      const target = e.target ? this.getSelector(e.target) : null;
      const path = this.buildPath(e);
      const type = e.type;
      const timestamp = Math.floor(e.timeStamp && e.timeStamp > 0 ? this.config.time(e.timeStamp) : Date.now());

      if (this.intervalId == null) {
        this.intervalId = target;
        this.intervalType = type;
        this.intervalPath = path;
        this.intervalTimer = timestamp;
        this.intervalCounter = 0;
      }

      if ((this.intervalId !== target || this.intervalType !== type) && this.intervalTimer) {
        this.intervalLog = {
          target: this.intervalId,
          path: this.intervalPath,
          pageUrl: window.location.href,
          pageTitle: document.title,
          pageReferrer: document.referrer,
          userAgent: window.navigator.userAgent,
          count: this.intervalCounter,
          duration: timestamp - this.intervalTimer,
          startTime: this.intervalTimer,
          endTime: timestamp,
          type: this.intervalType,
          logType: "interval",
          targetChange: this.intervalId !== target,
          typeChange: this.intervalType !== type,
          userAction: false,
          userId: this.config.userId,
          toolVersion: this.config.toolVersion,
          toolName: this.config.toolName,
          useraleVersion: this.config.useraleVersion,
          sessionId: this.config.sessionId,
          httpSessionId: this.config.httpSessionId,
          browserSessionId: this.config.browserSessionId,
        };

        for (const func of Object.values(this.cbHandlers)) {
          if (typeof func === "function") {
            this.intervalLog = func(this.intervalLog, null);
            if (!this.intervalLog) return false;
          }
        }

        if (this.intervalLog) this.logs.push(this.intervalLog);

        this.intervalId = target;
        this.intervalType = type;
        this.intervalPath = path;
        this.intervalTimer = timestamp;
        this.intervalCounter = 0;
      }

      if (this.intervalId === target && this.intervalType === type) {
        this.intervalCounter++;
      }

      return true;
    } catch {
      return false;
    }
  }

  private getLocation(e: Event): { x: number | null; y: number | null } {
    if (e instanceof MouseEvent) {
      return e.pageX != null
        ? { x: e.pageX, y: e.pageY }
        : { x: document.documentElement.scrollLeft + e.clientX, y: document.documentElement.scrollTop + e.clientY };
    }
    return { x: null, y: null };
  }

  private getScreenRes() {
    return { width: window.innerWidth, height: window.innerHeight };
  }

  private getSelector(ele: EventTarget): string {
    if (ele instanceof HTMLElement || ele instanceof Element) {
      return ele.localName
        ? ele.localName + (ele.id ? "#" + ele.id : "") + (ele.className ? "." + ele.className : "")
        : ele.nodeName + (ele.id ? "#" + ele.id : "") + (ele.className ? "." + ele.className : "");
    } else if (ele instanceof Document) return "#document";
    else if (ele === globalThis) return "Window";
    return "Unknown";
  }

  private buildPath(e: Event): string[] {
    return this.selectorizePath(e.composedPath());
  }

  private selectorizePath(path: EventTarget[]): string[] {
    return path.map((ele) => this.getSelector(ele));
  }

  private buildAttrs(e: Event): Record<string, any> {
    const attributes: Record<string, any> = {};
    const blacklist = ["style"];
    if (e.target instanceof Element) {
      for (const attr of e.target.attributes) {
        if (blacklist.includes(attr.name)) continue;
        try {
          attributes[attr.name] = JSON.parse(attr.value);
        } catch {
          attributes[attr.name] = attr.value;
        }
      }
    }
    return attributes;
  }

  private buildCSS(e: Event): Record<string, string> {
    const properties: Record<string, string> = {};
    if (e.target instanceof HTMLElement) {
      const style = e.target.style;
      for (let i = 0; i < style.length; i++) {
        const prop = style[i];
        properties[prop] = style.getPropertyValue(prop);
      }
    }
    return properties;
  }
}